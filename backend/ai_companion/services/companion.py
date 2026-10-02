import datetime
import re
from django.utils import timezone
from accounts.models import ElderProfile, FamilyElderRelationship
from medicines.models import Medicine
from appointments.models import Appointment
from notifications.services import create_ai_summary_notification, create_notification
from notifications.models import Notification
from ..models import AIConversation, AIMessage, FamilyCallRequest


def _classify_message(message, previous_user_message=""):
    lower = (message or "").strip().lower()

    emergency_terms = (
        "chest pain", "chest pressure", "chest tightness", "chest feels tight",
        "chest tight", "can't breathe",
        "cannot breathe", "trouble breathing", "shortness of breath",
        "severe pain", "bleeding", "unconscious", "stroke", "fell",
        "fall", "emergency",
    )
    emergency_terms_te = ("నొప్పి", "పడిపోయా", "పడిపోయాను", "ఊపిరి", "గుండె నొప్పి", "ప్రమాదం", "రక్తం", "స్పృహ")
    if any(term in lower for term in emergency_terms) or any(term in message for term in emergency_terms_te):
        return "emergency"

    medicine_terms = (
        "medicine", "medicines", "medication", "medications", "tablet",
        "tablets", "pill", "pills", "dose", "dosage", "prescription",
        "మందు", "మందులు", "టాబ్లెట్", "టాబ్లెట్లు",
    )
    appointment_terms = (
        "appointment", "doctor", "clinic", "hospital", "visit", "checkup",
        "డాక్టర్", "అపాయింట్‌మెంట్", "ఆసుపత్రి", "హాస్పిటల్",
    )

    if any(term in lower for term in medicine_terms):
        return "medicine"
    if any(term in lower for term in appointment_terms):
        return "appointment"

    follow_up = any(
        phrase in lower
        for phrase in ("what time", "when is it", "and when", "what date", "which one", "tell me more", "what about")
    )
    if follow_up and len(lower.split()) <= 8:
        previous = (previous_user_message or "").lower()
        if any(term in previous for term in medicine_terms):
            return "medicine"
        if any(term in previous for term in appointment_terms):
            return "appointment"

    if any(term in lower for term in ("call my family", "call my son", "call my daughter", "talk to my family", "family call")):
        return "family_call"
    if any(term in lower for term in ("lonely", "alone", "sad", "missing my", "miss my", "depressed", "nobody to talk", "ఒంటరి", "బాధ", "జ్ఞాపకం", "ఎవరూ లేరు")):
        return "lonely"
    if any(term in lower for term in ("anxious", "anxiety", "worried", "scared", "afraid", "nervous", "overwhelmed", "stressed", "భయం", "ఆందోళన")):
        return "emotional_support"
    if any(term in lower for term in ("hello", "hi", "hey", "namaste", "good morning", "good evening", "good afternoon", "నమస్కారం", "బాగున్నారా")):
        return "greeting"
    if any(term in lower for term in ("thank", "thanks", "ధన్యవాదాలు")):
        return "gratitude"
    if any(term in lower for term in ("who are you", "what can you do", "how can you help")):
        return "capabilities"
    return "general"


def get_or_create_active_conversation(elder):
    """
    Get the latest conversation for this elder from today,
    or create a new one.
    """
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    conv = (
        AIConversation.objects.filter(elder=elder, updated_at__gte=today_start)
        .order_by("-updated_at")
        .first()
    )
    if not conv:
        title = f"Conversation {timezone.now().strftime('%d %b %Y')}"
        conv = AIConversation.objects.create(elder=elder, title=title)
    return conv


def process_elder_message(elder, message_text, language="English"):
    """
    Process an incoming message from the elder, generate an appropriate companion response,
    log messages, and return the response payload along with safety/action flags.
    """
    text = (message_text or "").strip()
    if not text:
        return {
            "reply": "I'm listening. How can I help you today?",
            "offer_sos": False,
            "offer_family_call": False,
            "conversation_id": None,
        }

    conv = get_or_create_active_conversation(elder)
    previous_user_message = (
        conv.messages.filter(sender="elder")
        .order_by("-created_at")
        .values_list("content", flat=True)
        .first()
        or ""
    )

    # 1. Save elder's incoming message
    AIMessage.objects.create(
        conversation=conv,
        sender="elder",
        content=text,
        is_private=False,
    )

    lower = text.lower()
    is_telugu = (language or "").lower() == "telugu" or any(
        "\u0c00" <= ch <= "\u0c7f" for ch in text
    )

    elder_name = (
        elder.user.first_name.strip()
        or elder.user.email.split("@")[0].capitalize()
    )
    intent = _classify_message(text, previous_user_message)

    # Fetch elder's care data
    active_medicines = list(Medicine.objects.filter(elder=elder, is_active=True))
    now = timezone.now()
    upcoming_appointments = list(
        Appointment.objects.filter(
            elder=elder,
            appointment_at__gte=now,
            status__in=["SCHEDULED", "CONFIRMED", "scheduled", "confirmed"],
        ).order_by("appointment_at")
    )

    reply = ""
    offer_sos = False
    offer_family_call = False

    # Check emergency keywords
    if intent == "emergency":
        offer_sos = True
        if is_telugu:
            reply = (
                f"ఇది అత్యవసర పరిస్థితి కావచ్చు. దయచేసి విశ్రాంతిగా కూర్చోండి. "
                f"నేను మీ కోసం వెంటనే SOS ఎమర్జెన్సీ అలర్ట్ పంపించాలా? మీ కుటుంబ సభ్యులను సంప్రదించాలా?"
            )
        else:
            reply = (
                f"This sounds like it could be an emergency, {elder_name}. Please stay calm and sit down safely. "
                f"Would you like me to activate an SOS alert or call your emergency contact immediately?"
            )

    # Check emotional / loneliness keywords
    elif intent == "lonely":
        offer_family_call = True
        if is_telugu:
            reply = (
                f"నేను మీతోనే ఉన్నాను, {elder_name} గారు. మీరు ఎప్పుడూ ఒంటరిగా అనుకోవద్దు. "
                f"మీ కుటుంబ సభ్యులతో మాట్లాడటానికి నేను వారికి ఒక సందేశం పంపించాలా?"
            )
        else:
            reply = (
                f"I am right here with you, {elder_name}. You are never alone. "
                f"Would you like me to send a request to your family so they can give you a call?"
            )
        # Notify connected family members about elder's emotional state
        try:
            summary = (
                f"{elder_name} expressed feeling lonely or sad during their AI Companion chat today. "
                f"A friendly call or message would brighten their day."
            )
            create_ai_summary_notification(elder=elder, summary=summary)
        except Exception:
            pass

    # Check medicine queries
    elif intent == "medicine":
        if not active_medicines:
            if is_telugu:
                reply = "ప్రస్తుతం మీకు ఎలాంటి క్రియాశీల మందుల షెడ్యూల్ నమోదు కాలేదు."
            else:
                reply = f"You currently do not have any active medicines listed on your care schedule, {elder_name}."
        else:
            med_summaries = []
            for m in active_medicines[:4]:
                timing_str = m.timing or (", ".join(m.times) if isinstance(m.times, list) and m.times else "as prescribed")
                food_str = f" ({m.food_timing})" if m.food_timing and m.food_timing != "ANY" else ""
                med_summaries.append(f"{m.name} ({m.dosage}, {timing_str}{food_str})")

            joined_meds = "; ".join(med_summaries)
            if is_telugu:
                reply = f"మీ ప్రస్తుత మందులు: {joined_meds}. దయచేసి సమయానికి వేసుకోండి."
            else:
                reply = f"Here are your scheduled medicines, {elder_name}: {joined_meds}. Remember to take them on time with a glass of water."

    # Check appointment queries
    elif intent == "appointment":
        if not upcoming_appointments:
            if is_telugu:
                reply = "రాబోయే రోజుల్లో మీకు ఎలాంటి డాక్టర్ అపాయింట్‌మెంట్‌లు షెడ్యూల్ చేయబడలేదు."
            else:
                reply = f"You have no upcoming doctor appointments scheduled right now, {elder_name}."
        else:
            next_app = upcoming_appointments[0]
            appt_time_str = next_app.appointment_at.strftime("%d %B %Y at %I:%M %p")
            if is_telugu:
                reply = f"మీ తదుపరి అపాయింట్‌మెంట్: {next_app.doctor_name} ({next_app.clinic_name}), {appt_time_str} కి ఉంది."
            else:
                reply = f"Your next appointment is with Dr. {next_app.doctor_name} at {next_app.clinic_name} on {appt_time_str}."

    elif intent == "family_call":
        offer_family_call = True
        reply = (
            f"మీ కుటుంబ సభ్యులకు కాల్ చేయమని అభ్యర్థించడంలో నేను సహాయం చేయగలను, {elder_name} గారు."
            if is_telugu
            else f"I can help ask your family to call you, {elder_name}. Would you like me to send them a call request?"
        )

    elif intent == "emotional_support":
        reply = (
            f"మీరు ఆందోళనగా ఉన్నారని వింటున్నాను, {elder_name} గారు. ఏమి మిమ్మల్ని ఎక్కువగా కలవరపెడుతోంది? మనం ఒక్కొక్కటిగా మాట్లాడుకుందాం."
            if is_telugu
            else f"I hear that you are feeling worried, {elder_name}. What is troubling you most right now? We can take it one step at a time."
        )

    # General greetings and conversations
    else:
        if intent == "greeting":
            if is_telugu:
                reply = f"నమస్కారం {elder_name} గారు! ఈ రోజు మీ ఆరోగ్యం ఎలా ఉంది? మీకు సహాయం చేయడానికి నేను ఎల్లప్పుడూ సిద్ధంగా ఉన్నాను."
            else:
                reply = f"Hello {elder_name}! It is wonderful to hear from you today. How are you feeling? I can help you check your medicines, appointments, or just chat."
        elif intent == "gratitude":
            if is_telugu:
                reply = "మీకు స్వాగతం! ఆరోగ్యాన్ని జాగ్రత్తగా చూసుకోండి."
            else:
                reply = f"You are most welcome, {elder_name}! Take good care of yourself today."
        elif intent == "capabilities":
            reply = (
                f"నేను మీ మందుల షెడ్యూల్, రాబోయే డాక్టర్ అపాయింట్‌మెంట్‌లు, కుటుంబంతో మాట్లాడటం, లేదా మీకు ఎలా అనిపిస్తుందో గురించి సహాయం చేయగలను, {elder_name} గారు."
                if is_telugu
                else f"I can check the medicine schedule and upcoming appointments saved in CareConnect, help you contact your family, or listen if something is on your mind, {elder_name}. What would you like to do?"
            )
        else:
            if is_telugu:
                reply = f"మీరు చెప్పింది విన్నాను, {elder_name} గారు. దాని గురించి కొంచెం వివరంగా చెబుతారా? మీ మందుల షెడ్యూల్, డాక్టర్ అపాయింట్‌మెంట్‌లు, లేదా కుటుంబంతో మాట్లాడటంలో నేను సహాయం చేయగలను."
            else:
                reply = f"Thanks for telling me, {elder_name}. Could you say a little more about what you need? I can check your saved medicine schedule or upcoming appointments, help you contact family, or talk through a general question. I cannot diagnose symptoms or change a prescription."

    # 2. Save AI reply
    AIMessage.objects.create(
        conversation=conv,
        sender="ai",
        content=reply,
        is_private=False,
    )

    # After recording reply, create a short summary of the conversation and
    # send it along with recent chat history to connected family members.
    def generate_mood_summary(message, elder_name, language="English", offer_sos=False, offer_family_call=False):
        """
        Create a concise summary focused on mood and feelings from the elder's message.
        Uses simple keyword heuristics to classify mood and intensity.
        """

        m = (message or "").strip()
        lower = m.lower()

        # Map keywords to moods
        mood_map = {
            "sad": ["sad", "sadness", "depressed", "unhappy", "bitter", "cry"],
            "lonely": ["lonely", "alone", "isolated", "no one"],
            "anxious": ["anxious", "anxiety", "worried", "worried about", "worried that"],
            "angry": ["angry", "mad", "furious", "upset"],
            "tired": ["tired", "sleepy", "exhausted", "fatigued"],
            "happy": ["happy", "good", "great", "joy", "pleased"],
            "grateful": ["thank", "thanks", "grateful", "blessed"],
        }

        detected = []
        for mood, keys in mood_map.items():
            for k in keys:
                if k in lower:
                    detected.append(mood)
                    break

        # Detect intensity
        intensity_words = ["very", "extremely", "really", "so", "terribly", "deeply"]
        intensity = ""
        if any(w in lower for w in intensity_words):
            intensity = "very "

        primary_mood = detected[0] if detected else "unspecified"

        # Short excerpt for context
        excerpt = re.split(r"[\.!?]\s+", m)[0]
        if len(excerpt) > 200:
            excerpt = excerpt[:197] + "..."

        action = []
        if offer_sos:
            action.append("SOS suggested")
        if offer_family_call:
            action.append("family call recommended")

        action_str = ", ".join(action) if action else ""

        summary_parts = [f"{elder_name} appears {intensity}{primary_mood}."]
        if excerpt:
            summary_parts.append(f"Said: \"{excerpt}\".")
        if action_str:
            summary_parts.append(f"Action: {action_str}.")

        return " ".join(summary_parts)

    try:
        summary_text = generate_mood_summary(text, elder_name, language, offer_sos, offer_family_call)

        # Build a compact chat history: last 10 messages from this conversation
        messages = conv.messages.order_by("created_at").all()[-10:]
        history_lines = []
        for m in messages:
            who = "Elder" if m.sender == "elder" else "AI"
            # Keep each message short to avoid very long notifications
            content = (m.content or "").replace("\n", " ")
            if len(content) > 300:
                content = content[:297] + "..."
            history_lines.append(f"{who}: {content}")

        chat_history = "\n".join(history_lines)

        create_ai_summary_notification(elder=elder, summary=summary_text, chat_history=chat_history)
    except Exception:
        # Don't let notification failures affect the chat flow
        pass

    conv.save()  # update updated_at

    return {
        "reply": reply,
        "offer_sos": offer_sos,
        "offer_family_call": offer_family_call,
        "conversation_id": conv.id,
    }


def request_family_call(elder, reason="Requested a call via AI Companion"):
    """
    Creates a FamilyCallRequest and notifies all connected family members.
    """
    req = FamilyCallRequest.objects.create(
        elder=elder,
        reason=reason,
        status="PENDING",
    )

    elder_name = (
        elder.user.first_name.strip()
        or elder.user.email.split("@")[0].capitalize()
    )

    relationships = FamilyElderRelationship.objects.select_related("family__user").filter(
        elder=elder,
        is_active=True,
    )

    for rel in relationships:
        create_notification(
            recipient=rel.family.user,
            elder=elder,
            notification_type=Notification.NotificationType.AI_SUMMARY,
            title="Call Request from Elder",
            message=f"{elder_name} requested a phone call: \"{reason}\". Please reach out to them when possible.",
            priority=Notification.Priority.HIGH,
            related_object_type="family_call_request",
            related_object_id=req.id,
        )

    return req
