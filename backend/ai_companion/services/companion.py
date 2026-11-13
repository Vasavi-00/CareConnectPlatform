"""Private, tool-enabled AI Companion service.

Provider credentials are read only from backend environment variables. Tools are
allow-listed, read-only and always scoped to the authenticated elder.
"""
import json
import logging
import os
import time
from django.db.models import Q
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import urlparse

from django.utils import timezone

logger = logging.getLogger(__name__)


class CompanionError(Exception):
    status_code = 502


class CompanionNotConfigured(CompanionError):
    status_code = 503


class CompanionTimeout(CompanionError):
    status_code = 504


class CompanionBusy(CompanionError):
    status_code = 503


class CompanionProviderError(CompanionError):
    status_code = 502


SYSTEM_PROMPT = """You are CareConnect's Voice AI Companion for an older adult. The elder communicates
with you primarily through spoken voice and audio conversation.
Speak in a warm, patient, respectful, calm, and natural conversational tone (2 to 4 clear sentences).
Never use markdown asterisks, bullet lists, or tables, because your responses are spoken aloud to the elder.
Acknowledge feelings gently without diagnosing.
Always ask an attentive, caring follow-up question to the elder based on what they shared (for example, asking how their health feels today, whether they took their meal or medicine, or how their family is doing) so they can answer back with their voice.
For distress, listen first and offer human support or connecting with family.
For immediate danger, encourage emergency help and offer the app's SOS confirmation; never claim help was contacted.
Never diagnose, prescribe, change medication, or claim a medicine was taken.
Use tools for appointment and medicine facts. Family contact and SOS tools only prepare suggestions for the elder to confirm in the app.
Keep answers concise, clear, and easy to understand when spoken."""


def _system_message(language, elder):
    guidance = os.getenv("AI_COMPANION_STYLE_GUIDANCE", "").strip()[:1000]
    style = f"Optional style preference: {guidance}\n" if guidance else ""
    content = f"{style}{SYSTEM_PROMPT}\nReply in {language}. Profile first name: {(elder.user.first_name or '').strip() or 'not provided'}."
    return {"role": "system", "content": content}

TOOL_DEFINITIONS = [
    {"type": "function", "function": {"name": "get_upcoming_appointments", "description": "Read this elder's upcoming saved appointments.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 5}}, "additionalProperties": False}}},
    {"type": "function", "function": {"name": "get_medicine_schedule", "description": "Read current medicines and schedule exactly as saved. Do not advise dose changes.", "parameters": {"type": "object", "properties": {}, "additionalProperties": False}}},
    {"type": "function", "function": {"name": "get_today_reminders", "description": "Read today's saved medicine times and appointments.", "parameters": {"type": "object", "properties": {}, "additionalProperties": False}}},
    {"type": "function", "function": {"name": "get_elder_profile", "description": "Read minimal profile details relevant to this conversation.", "parameters": {"type": "object", "properties": {}, "additionalProperties": False}}},
    {"type": "function", "function": {"name": "offer_family_contact", "description": "Offer a family call request for the elder to explicitly confirm in the UI. This does not send anything.", "parameters": {"type": "object", "properties": {"reason": {"type": "string", "maxLength": 160}}, "required": ["reason"], "additionalProperties": False}}},
    {"type": "function", "function": {"name": "offer_sos_confirmation", "description": "Offer opening the app's SOS confirmation UI. This does not trigger SOS.", "parameters": {"type": "object", "properties": {}, "additionalProperties": False}}},
]


def _resolve_provider_config():
    """
    Resolves the LLM provider, endpoint, API key, and model.
    Supported:
    1. Google Gemini (via OpenAI-compatible endpoint with GEMINI_API_KEY)
    2. Local Ollama (via OpenAI-compatible endpoint at localhost:11434)
    3. OpenAI / Custom (with AI_COMPANION_API_KEY or OPENAI_API_KEY)
    """
    provider = os.getenv("AI_COMPANION_PROVIDER", "").strip().lower()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    companion_key = os.getenv("AI_COMPANION_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    custom_url = os.getenv("AI_COMPANION_API_URL", "").strip()
    ollama_url = os.getenv("OLLAMA_BASE_URL", "").strip()

    # 1. Ollama provider or local endpoint
    if provider == "ollama" or (custom_url and ("localhost:11434" in custom_url or "127.0.0.1:11434" in custom_url)) or ollama_url:
        endpoint = custom_url or (f"{ollama_url.rstrip('/')}/v1/chat/completions" if ollama_url else "http://localhost:11434/v1/chat/completions")
        model = os.getenv("AI_COMPANION_MODEL", "llama3.2")
        return {"provider": "ollama", "endpoint": endpoint, "api_key": companion_key or "ollama", "model": model}

    # 2. Google Gemini provider
    if provider == "gemini" or gemini_key or (companion_key and companion_key.startswith("AIza")):
        key = gemini_key or companion_key
        if key and not key.startswith("your_"):
            endpoint = custom_url or "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            model = os.getenv("AI_COMPANION_MODEL", "gemini-flash-lite-latest")
            return {"provider": "gemini", "endpoint": endpoint, "api_key": key, "model": model}

    # 3. OpenAI or explicitly keyed provider
    active_key = companion_key or (openai_key if (openai_key and not openai_key.startswith("your_api_key")) else "")
    if active_key:
        if active_key.startswith("AIza"):
            endpoint = custom_url or "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            model = os.getenv("AI_COMPANION_MODEL", "gemini-flash-lite-latest")
            return {"provider": "gemini", "endpoint": endpoint, "api_key": active_key, "model": model}
        endpoint = custom_url or "https://api.openai.com/v1/chat/completions"
        model = os.getenv("AI_COMPANION_MODEL", "gpt-4o-mini")
        return {"provider": "openai", "endpoint": endpoint, "api_key": active_key, "model": model}

    # 4. Custom endpoint configured without an explicit key (only for local development)
    if custom_url and ("localhost" in custom_url or "127.0.0.1" in custom_url):
        return {"provider": "custom", "endpoint": custom_url, "api_key": companion_key or "none", "model": os.getenv("AI_COMPANION_MODEL", "default")}

    return None


def _provider_request(messages, tools=None):
    config = _resolve_provider_config()
    if not config:
        raise CompanionNotConfigured(
            "AI Companion is not configured. Set GEMINI_API_KEY or start Ollama, then restart Django."
        )

    endpoint = config["endpoint"]
    parsed_endpoint = urlparse(endpoint)
    if parsed_endpoint.scheme != "https" and parsed_endpoint.hostname not in {"localhost", "127.0.0.1"}:
        raise CompanionNotConfigured("AI_COMPANION_API_URL must use HTTPS outside local development.")

    api_key = config.get("api_key") or "ollama"
    payload = {
        "model": config["model"],
        "messages": messages,
        "temperature": 0.4,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    request = Request(
        endpoint,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    started_at = time.monotonic()
    try:
        with urlopen(request, timeout=float(os.getenv("AI_COMPANION_TIMEOUT", "30"))) as response:
            result = json.loads(response.read().decode())
        logger.info(
            "ai_provider_request outcome=success provider=%s model=%s duration_ms=%d",
            config["provider"],
            config["model"],
            int((time.monotonic() - started_at) * 1000),
        )
        return result
    except HTTPError as exc:
        logger.warning(
            "ai_provider_request outcome=http_error status=%s provider=%s duration_ms=%d",
            exc.code,
            config.get("provider"),
            int((time.monotonic() - started_at) * 1000),
        )
        # If tool schemas caused 400 or 422, retry once without tools
        if tools and exc.code in {400, 422}:
            logger.info("ai_provider_request retrying without tools after status %s", exc.code)
            return _provider_request(messages, tools=None)
        if exc.code == 429:
            raise CompanionBusy("The AI service is busy. Please wait a moment and try again.") from exc
        raise CompanionProviderError("The AI service could not complete that reply. Please try again.") from exc
    except (TimeoutError, URLError) as exc:
        if isinstance(exc, URLError) and isinstance(exc.reason, TimeoutError):
            raise CompanionTimeout("The AI service took too long. Please try again.") from exc
        raise CompanionProviderError("The AI service could not be reached. Please try again.") from exc
    except (ValueError, KeyError, TypeError) as exc:
        raise CompanionProviderError("The AI service returned an unreadable response. Please try again.") from exc


def _assistant_message(data):
    """Validate the small part of a provider response that the agent consumes."""
    try:
        choices = data["choices"]
        message = choices[0]["message"]
    except (KeyError, IndexError, TypeError) as exc:
        raise CompanionProviderError(
            "The AI service returned an unreadable response. Please try again."
        ) from exc
    if not isinstance(message, dict):
        raise CompanionProviderError(
            "The AI service returned an unreadable response. Please try again."
        )
    return message


def _tool_data(name, args, elder):
    """Run only known read tools. IDs are never accepted from model arguments."""
    from appointments.models import Appointment
    from medicines.models import Medicine

    allowed = {"get_upcoming_appointments", "get_medicine_schedule", "get_today_reminders", "get_elder_profile", "offer_family_contact", "offer_sos_confirmation"}
    if name not in allowed:
        raise ValueError("Unsupported tool")
    permitted_args = {"get_upcoming_appointments": {"limit"}, "offer_family_contact": {"reason"}}
    if set(args) - permitted_args.get(name, set()):
        raise ValueError("Unexpected tool arguments")
    today = timezone.localdate()
    if name == "get_upcoming_appointments":
        limit = args.get("limit", 3)
        if type(limit) is not int or not 1 <= limit <= 5:
            raise ValueError("Invalid appointment limit")
        rows = Appointment.objects.filter(elder=elder, appointment_at__gte=timezone.now()).exclude(status__in=["CANCELLED", "COMPLETED"]).order_by("appointment_at")[:limit]
        return [{"doctor": x.doctor_name, "clinic": x.clinic_name, "location": x.location, "when": x.appointment_at.isoformat(), "status": x.status} for x in rows]
    if name in {"get_medicine_schedule", "get_today_reminders"}:
        rows = Medicine.objects.filter(elder=elder, is_active=True).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=today),
            Q(end_date__isnull=True) | Q(end_date__gte=today),
        )
        data = [{"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "timing": m.timing or m.times, "food_timing": m.food_timing} for m in rows.order_by("name")]
        if name == "get_medicine_schedule":
            return data
        appts = Appointment.objects.filter(elder=elder, appointment_at__date=today).exclude(status__in=["CANCELLED", "COMPLETED"]).order_by("appointment_at")
        return {"medicines": data, "appointments": [{"doctor": a.doctor_name, "clinic": a.clinic_name, "when": a.appointment_at.isoformat()} for a in appts]}
    if name == "get_elder_profile":
        profile = elder
        return {"preferred_name": (elder.user.first_name or "").strip(), "preferred_language": profile.preferred_language, "voice_enabled": profile.voice_enabled, "font_size": profile.font_size}
    if name == "offer_family_contact":
        reason = args.get("reason")
        if not isinstance(reason, str) or not reason.strip() or len(reason) > 160:
            raise ValueError("Invalid contact request")
        return {"offer_family_call": True, "reason": reason.strip()}
    if name == "offer_sos_confirmation":
        return {"offer_sos": True}
    raise ValueError("Unsupported tool")


def _generate_smart_fallback_reply(elder, message_text, language="English", history=None):
    """
    Intelligent, empathetic dialogue fallback that understands symptoms, persistent illness,
    real database medication schedules, appointments, loneliness, and emergency situations
    when an external LLM is offline or not configured.
    """
    from appointments.models import Appointment
    from medicines.models import Medicine
    from accounts.models import FamilyElderRelationship

    history = history or []
    lower = message_text.lower().strip()
    first_name = (elder.user.first_name or "").strip() or "Friend"
    is_te = (language == "Telugu")

    meta = {"offer_sos": False, "offer_family_call": False, "family_call_reason": None}

    # Check if elder previously reported feeling unwell
    unwell_keywords_en = [
        "not feeling well", "not feel well", "unwell", "sick", "headache", "stomach",
        "dizzy", "dizziness", "fever", "pain", "hurt", "hurts", "vomit", "nausea",
        "weak", "tired", "uneasy", "ill"
    ]
    unwell_keywords_te = [
        "బాగోలేదు", "బాధ", "నొప్పి", "జ్వరం", "దగ్గు", "కడుపు", "తల", "నీరసం", "అలసట"
    ]

    repeated_complaint = False
    for prev in history[-4:]:
        prev_content = (prev.get("content") or "").lower()
        if any(w in prev_content for w in unwell_keywords_en + unwell_keywords_te):
            repeated_complaint = True
            break

    # 1. EMERGENCY / DANGER / FALL / CHEST PAIN
    emergency_keywords_en = ["emergency", "fall", "fell", "chest pain", "cannot breathe", "can't breathe", "short of breath", "bleeding", "fainted", "sos", "ambulance", "save me"]
    emergency_keywords_te = ["పడిపోయా", "పడ్డాను", "ఛాతీ నొప్పి", "ఊపిరి", "రక్తం", "స్పృహ", "అత్యవసరం", "ఆంబులెన్స్"]

    if any(k in lower for k in emergency_keywords_en + emergency_keywords_te):
        meta["offer_sos"] = True
        meta["offer_family_call"] = True
        meta["family_call_reason"] = "Urgent help or potential fall/emergency reported"
        if is_te:
            reply = f"ఇది అత్యవసర పరిస్థితి కావచ్చు, {first_name} గారు! దయచేసి ఎటూ కదలకుండా విశ్రాంతిగా ఉండండి. నేను మీకు ఎమర్జెన్సీ హెల్ప్ బటన్‌ను సిద్ధం చేసాను. వీలైతే వెంటనే ఎమర్జెన్సీ నంబర్‌కు లేదా మీ కుటుంబానికి కాల్ చేయండి."
        else:
            reply = f"This sounds like an urgent situation, {first_name}! Please remain still and seated safely. I have prepared the Emergency Help button for you right now so help can reach you immediately. If you are able, please contact emergency services right away."
        return reply, meta

    # 2. FEELING UNWELL / SICK / PAIN / DISCOMFORT
    is_unwell_now = any(k in lower for k in unwell_keywords_en + unwell_keywords_te)
    if is_unwell_now:
        meta["offer_family_call"] = True
        if repeated_complaint:
            meta["family_call_reason"] = "Elder reported persistent or repeated illness"
            if is_te:
                reply = f"నేను మీ మాట వింటున్నాను, {first_name} గారు. మీకు ఇంకా ఆరోగ్యం బాగోలేదని తెలిసి నేను చాలా ఆందోళన చెందుతున్నాను. మీ ఆరోగ్యం చాలా ముఖ్యం. దయచేసి ప్రశాంతంగా కూర్చుని విశ్రాంతి తీసుకోండి. నేను మీ కుటుంబ సభ్యులకు వెంటనే కాల్ రిక్వెస్ట్ పంపనా లేదా డాక్టర్‌ను సంప్రదిద్దామా?"
            else:
                reply = f"I hear you clearly, {first_name}, and I am very concerned that you are still not feeling well. Your health and comfort are the top priority. Please sit down comfortably, drink some water, and rest. Would you like me to request a phone call from your family right now so they can check in on you?"
        else:
            meta["family_call_reason"] = "Elder reported not feeling well"
            if is_te:
                reply = f"మీకు ఆరోగ్యం బాగోలేదని విని చాలా బాధగా ఉంది, {first_name} గారు. దయచేసి కాస్త విశ్రాంతి తీసుకోండి, మంచి నీళ్లు తాగండి. మీకు ఎక్కడ అసౌకర్యంగా ఉంది (తలనోప్పి, జ్వరం లేదా కడుపునొప్పా)? మీ కుటుంబ సభ్యులను సంప్రదించడానికి నేను సహాయం చేయాలా?"
            else:
                reply = f"I am so sorry to hear that you are not feeling well, {first_name}. Please take it easy and rest comfortably. What kind of discomfort are you experiencing right now (like a headache, fever, or pain)? Would you like me to alert your family so they can call and support you?"
        return reply, meta

    # 3. MEDICINES / SCHEDULE / PILLS
    medicine_keywords_en = ["medicine", "medicines", "pill", "pills", "tablet", "tablets", "dosage", "prescription", "take today"]
    medicine_keywords_te = ["మందు", "మందులు", "టాబ్లెట్", "మాత్రలు"]

    if any(k in lower for k in medicine_keywords_en + medicine_keywords_te):
        today = timezone.localdate()
        rows = list(Medicine.objects.filter(elder=elder, is_active=True).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=today),
            Q(end_date__isnull=True) | Q(end_date__gte=today),
        ).order_by("name"))

        if rows:
            med_lines = []
            for m in rows[:4]:
                timing = m.timing or (", ".join([t.get("time", "") if isinstance(t, dict) else str(t) for t in m.times]) if m.times else "Scheduled")
                food = f" ({m.food_timing})" if m.food_timing else ""
                med_lines.append(f"• {m.name} ({m.dosage}) - {timing}{food}")
            items_str = "\n".join(med_lines)
            if is_te:
                reply = f"ఈ రోజు మీ మందుల షెడ్యూల్ ఇక్కడ ఉంది, {first_name} గారు:\n{items_str}\nదయచేసి డాక్టర్ సూచించిన విధంగా సమయానికి నీళ్లతో వేసుకోండి."
            else:
                reply = f"Here is your medication schedule for today, {first_name}:\n{items_str}\nPlease take your medicines on time as prescribed by your doctor."
        else:
            if is_te:
                reply = f"ప్రస్తుతం మీకు ఎలాంటి షెడ్యూల్డ్ మందులు పెండింగ్‌లో లేవు, {first_name} గారు. అన్నీ సక్రమంగా ఉన్నాయి."
            else:
                reply = f"You do not have any pending scheduled medicines right now, {first_name}. Everything is up to date!"
        return reply, meta

    # 4. APPOINTMENTS / DOCTOR / CLINIC
    appt_keywords_en = ["appointment", "appointments", "doctor", "clinic", "hospital", "visit", "checkup"]
    appt_keywords_te = ["అపాయింట్‌మెంట్", "డాక్టర్", "హాస్పిటల్", "వైద్యుడు", "క్లినిక్"]

    if any(k in lower for k in appt_keywords_en + appt_keywords_te):
        rows = list(Appointment.objects.filter(elder=elder, appointment_at__gte=timezone.now()).exclude(status__in=["CANCELLED", "COMPLETED"]).order_by("appointment_at")[:3])
        if rows:
            appt_lines = []
            for a in rows:
                dt_str = timezone.localtime(a.appointment_at).strftime("%a, %b %d at %I:%M %p")
                clinic = f" ({a.clinic_name})" if a.clinic_name else ""
                appt_lines.append(f"• Dr. {a.doctor_name}{clinic} - {dt_str}")
            items_str = "\n".join(appt_lines)
            if is_te:
                reply = f"మీ రాబోయే అపాయింట్‌మెంట్‌లు ఇక్కడ ఉన్నాయి, {first_name} గారు:\n{items_str}\nమీరు సిద్ధంగా ఉండటానికి మేము ముందుగానే గుర్తుచేస్తాము."
            else:
                reply = f"Here are your upcoming appointments, {first_name}:\n{items_str}\nCareConnect will remind you before your visit so you're well-prepared."
        else:
            if is_te:
                reply = f"ప్రస్తుతం మీకు ఎలాంటి రాబోయే డాక్టర్ అపాయింట్‌మెంట్‌లు లేవు, {first_name} గారు. విశ్రాంతి తీసుకోండి."
            else:
                reply = f"You do not have any upcoming doctor appointments scheduled on CareConnect right now, {first_name}."
        return reply, meta

    # 5. LONELINESS / SAD / MISS FAMILY / EMOTIONAL SUPPORT
    lonely_keywords_en = ["lonely", "alone", "sad", "miss", "bored", "nobody", "crying", "depressed", "worried", "unhappy"]
    lonely_keywords_te = ["ఒంటరి", "ఒంటరిగా", "బాధగా", "ఏడుపు", "భయం", "దిగులు"]

    if any(k in lower for k in lonely_keywords_en + lonely_keywords_te):
        meta["offer_family_call"] = True
        meta["family_call_reason"] = "Elder expressed feeling lonely or needing companionship"
        if is_te:
            reply = f"నేను మీతోనే ఉన్నాను, {first_name} గారు. మీరు ఎప్పుడూ ఒంటరిగా భావించవద్దు. మీ కుటుంబ సభ్యులతో మాట్లాడితే మీకు ఎంతో సాంత్వన కలుగుతుంది. నేను వారికి కాల్ రిక్వెస్ట్ పంపమంటారా?"
        else:
            reply = f"I am right here with you, {first_name}. It is completely natural to feel this way sometimes, but please remember you are deeply loved and not alone. Would you like me to request a phone call with your family so you can have a warm chat?"
        return reply, meta

    # 6. FAMILY / CALL FAMILY
    family_keywords_en = ["family", "call family", "call my family", "son", "daughter", "children", "kids", "phone call"]
    family_keywords_te = ["కుటుంబం", "కుమారుడు", "కూతురు", "పిల్లలు", "కాల్"]

    if any(k in lower for k in family_keywords_en + family_keywords_te):
        rels = list(FamilyElderRelationship.objects.filter(elder=elder, is_active=True).select_related("family__user"))
        if rels:
            fam_names = ", ".join([r.family.user.first_name or r.family.user.username for r in rels])
            meta["offer_family_call"] = True
            meta["family_call_reason"] = "Elder requested to contact family"
            if is_te:
                reply = f"మీ కుటుంబ సభ్యులు ({fam_names}) కేర్ కనెక్ట్‌లో అందుబాటులో ఉన్నారు, {first_name} గారు. నేను వారికి కాల్ రిక్వెస్ట్ పంపించనా?"
            else:
                reply = f"Your connected family ({fam_names}) is listed on CareConnect, {first_name}. Would you like me to send them a call request right now?"
        else:
            if is_te:
                reply = f"ప్రస్తుతం మీ ఖాతాతో కుటుంబ సభ్యులెవరూ లింక్ కాలేదు, {first_name} గారు. మీ కేర్ కనెక్ట్ ఐడీతో వారిని ఆహ్వానించవచ్చు."
            else:
                reply = f"You don't have family members linked to your profile yet, {first_name}. They can link using your CareConnect ID."
        return reply, meta

    # 7. GREETINGS & COURTESIES
    greetings_en = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"]
    greetings_te = ["హలో", "నమస్కారం", "శుభోదయం", "ఎలా ఉన్నారు"]
    thanks_en = ["thank you", "thanks", "appreciate", "helpful"]
    thanks_te = ["ధన్యవాదాలు", "థాంక్స్"]

    if any(k in lower for k in thanks_en + thanks_te):
        if is_te:
            reply = f"సంతోషం, {first_name} గారు! మీకు సహాయం చేయడం నా బాధ్యత. మీకు ఎప్పుడు ఏ సహాయం కావాలన్నా నన్ను అడగండి."
        else:
            reply = f"You are very welcome, {first_name}! It is always my absolute pleasure to assist you. Let me know whenever you need anything."
        return reply, meta

    if any(k in lower for k in greetings_en + greetings_te):
        if is_te:
            reply = f"నమస్కారం {first_name} గారు! మిమ్మల్ని కలవడం చాలా సంతోషంగా ఉంది. ఈ రోజు మీ ఆరోగ్యం ఎలా ఉంది? మీ మందులు లేదా అపాయింట్‌మెంట్‌ల గురించి ఏమైనా తెలుసుకోవాలా?"
        else:
            reply = f"Hello {first_name}! It is wonderful to hear from you. How are you feeling today? I am here to help you check your medicines, appointments, or just talk about your day."
        return reply, meta

    # 8. VARIED CONVERSATIONAL CATCH-ALL
    responses_en = [
        f"Thank you for sharing that with me, {first_name}. I am always right here by your side. Is there anything specific about your medications, doctor visits, or family you'd like to check?",
        f"I understand, {first_name}. I'm keeping a caring watch over your schedule today. How else can I help make your day comfortable?",
        f"I hear you, {first_name}. Remember to take things at your own pace today and drink plenty of water. Let me know if you'd like me to check your medicines or call your family.",
    ]
    responses_te = [
        f"చెప్పినందుకు ధన్యవాదాలు, {first_name} గారు. నేను ఎల్లప్పుడూ మీ సంరక్షణలో ఉంటాను. మీ మందులు, అపాయింట్‌మెంట్‌లు లేదా కుటుంబం గురించి ఏమైనా తెలుసుకోవాలా?",
        f"నేను మీ మాట వింటున్నాను, {first_name} గారు. ఈ రోజు మీకు ఏ విధంగా తోడుగా ఉండగలను?",
        f"అలాగే {first_name} గారు. దయచేసి విశ్రాంతిగా ఉండండి. మీకు ఏ అవసరం వచ్చినా నన్ను అడగండి.",
    ]
    idx = (len(history) + len(message_text)) % 3
    reply = responses_te[idx] if is_te else responses_en[idx]
    return reply, meta


def process_elder_message(elder, message_text, language="English", conversation_id=None):
    from ..models import AIConversation, AIMessage

    if not isinstance(message_text, str) or not message_text.strip() or len(message_text) > 4000:
        raise ValueError("Message must contain 1 to 4000 characters.")
    if language not in {"English", "Telugu"}:
        language = elder.preferred_language if elder.preferred_language in {"English", "Telugu"} else "English"
    if conversation_id:
        conv = AIConversation.objects.filter(pk=conversation_id, elder=elder).first()
        if conv is None:
            raise ValueError("Conversation not found.")
    else:
        conv = AIConversation.objects.create(elder=elder, title=message_text.strip()[:60])

    try:
        context_limit = max(2, min(30, int(os.getenv("AI_COMPANION_CONTEXT_MESSAGES", "12"))))
    except (TypeError, ValueError):
        context_limit = 12
    history = list(conv.messages.order_by("-created_at").values("sender", "content")[:context_limit])
    history.reverse()

    reply = None
    meta = {"offer_sos": False, "offer_family_call": False, "family_call_reason": "Requested a call via AI Companion"}

    # Attempt external LLM provider if configured
    provider_config = _resolve_provider_config()
    if not provider_config:
        raise CompanionNotConfigured(
            "AI Companion is not configured. Set AI_COMPANION_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY on the backend."
        )
    if provider_config:
        try:
            messages = [_system_message(language, elder)]
            messages.extend({
                "role": "assistant" if row["sender"] == "ai" else "user",
                "content": row["content"][-2000:],
            } for row in history)
            messages.append({"role": "user", "content": message_text.strip()})

            data = _provider_request(messages, TOOL_DEFINITIONS)
            choice = _assistant_message(data)

            # Handle tools if the model triggered any
            calls = choice.get("tool_calls") or []
            if calls:
                messages.append(choice)
                for index, call in enumerate(calls):
                    if not isinstance(call, dict):
                        continue
                    fn = call.get("function", {})
                    if not isinstance(fn, dict):
                        continue
                    try:
                        if index >= 4:
                            break
                        args = json.loads(fn.get("arguments", "{}"))
                        result = _tool_data(fn.get("name"), args, elder)
                        if isinstance(result, dict):
                            meta["offer_family_call"] = meta["offer_family_call"] or result.pop("offer_family_call", False)
                            meta["offer_sos"] = meta["offer_sos"] or result.pop("offer_sos", False)
                            if meta["offer_family_call"] and result.get("reason"):
                                meta["family_call_reason"] = result.pop("reason")
                    except (ValueError, TypeError, json.JSONDecodeError):
                        result = {"error": "That request could not be validated."}
                    messages.append({"role": "tool", "tool_call_id": call.get("id", ""), "content": json.dumps(result, default=str)})

                data = _provider_request(messages)
                choice = _assistant_message(data)

            llm_reply = choice.get("content")
            if isinstance(llm_reply, str) and llm_reply.strip():
                reply = llm_reply.strip()
                lower_reply = reply.lower()
                if any(k in lower_reply for k in ["sos", "emergency help", "emergency confirmation", "ఎమర్జెన్సీ"]):
                    meta["offer_sos"] = True
                if any(k in lower_reply for k in ["connect you with family", "call your family", "connect with family", "alert your family", "check on you", "కుటుంబ"]):
                    meta["offer_family_call"] = True
        except CompanionError:
            raise
        except Exception as exc:
            logger.warning("ai_companion_provider_failed error=%s; falling back to smart dialogue engine", exc)

    # If provider is not configured or failed, use smart empathetic fallback
    if not reply:
        reply, fallback_meta = _generate_smart_fallback_reply(elder, message_text, language, history)
        meta["offer_sos"] = meta["offer_sos"] or fallback_meta.get("offer_sos", False)
        meta["offer_family_call"] = meta["offer_family_call"] or fallback_meta.get("offer_family_call", False)
        if fallback_meta.get("family_call_reason"):
            meta["family_call_reason"] = fallback_meta["family_call_reason"]

    # Persist the exchange
    AIMessage.objects.create(conversation=conv, sender="elder", content=message_text.strip(), is_private=True)
    ai_message = AIMessage.objects.create(conversation=conv, sender="ai", content=reply, is_private=True)
    conv.save()

    return {
        "reply": reply,
        "offer_sos": meta["offer_sos"],
        "offer_family_call": meta["offer_family_call"],
        "family_call_reason": meta.get("family_call_reason") or "Requested a call via AI Companion",
        "conversation_id": conv.id,
        "ai_message_id": ai_message.id,
    }


def generate_reviewable_summary(conversation):
    """Draft a practical summary for the elder to review; never shares it."""
    messages = list(conversation.messages.filter(sender="elder").order_by("-created_at").values("content")[:20])
    messages.reverse()
    if not messages:
        raise ValueError("This conversation has no messages to summarize.")
    transcript = [f"Elder: {item['content'][:1400]}" for item in messages]
    prompt = (
        "Create a short, practical draft update for an older adult to review before sharing with selected family. "
        "Use only facts and requests explicitly stated by the elder below; assistant messages and assumptions are not evidence. "
        "Include explicit practical requests. Do not claim app actions were completed; no action completion is verified here. "
        "Do not include emotional disclosures, diagnoses, medication details, private information about others, or speculation. "
        "If there is no appropriate practical update, say so. "
        "Use plain language, at most 90 words, and return only the draft. The elder can edit or discard it."
    )
    provider_config = _resolve_provider_config()
    if provider_config:
        try:
            data = _provider_request([
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Draft an update from this conversation:\n\n" + "\n".join(transcript)},
            ])
            reply = data.get("choices", [{}])[0].get("message", {}).get("content")
            if isinstance(reply, str) and reply.strip():
                return reply.strip()[:1200]
        except Exception as exc:
            logger.warning("generate_reviewable_summary provider failed: %s; using local summary draft", exc)

    # Local fallback draft
    sample = messages[-3:]
    topics = []
    for m in sample:
        c = m["content"].strip()
        if len(c) > 60:
            c = c[:57] + "..."
        topics.append(c)
    return f"Recent check-in topics: {'; '.join(topics)}. Elder requested keeping family updated on daily routine and wellness."


def request_family_call(elder, reason="Requested a call via AI Companion"):
    from ..models import FamilyCallRequest
    from accounts.models import FamilyElderRelationship
    from notifications.models import Notification
    from notifications.services import create_notification

    req = FamilyCallRequest.objects.create(elder=elder, reason=reason[:255], status="PENDING")
    relationships = FamilyElderRelationship.objects.select_related("family__user").filter(elder=elder, is_active=True)
    count = 0
    elder_name = elder.user.first_name.strip() or "Your family member"
    for rel in relationships:
        notification = create_notification(recipient=rel.family.user, elder=elder, notification_type=Notification.NotificationType.AI_SUMMARY, title="Call Request from Elder", message=f"{elder_name} requested a phone call. Please reach out when possible.", priority=Notification.Priority.HIGH, related_object_type="family_call_request", related_object_id=req.id)
        if notification is not None:
            count += 1
    return req, count
