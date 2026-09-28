import datetime
from django.utils import timezone
from accounts.models import ElderProfile, FamilyElderRelationship
from medicines.models import Medicine
from appointments.models import Appointment
from notifications.services import create_ai_summary_notification, create_notification
from notifications.models import Notification
from ..models import AIConversation, AIMessage, FamilyCallRequest


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
    emergency_keywords_en = ["fall", "fell", "chest pain", "can't breathe", "cannot breathe", "severe pain", "bleeding", "unconscious", "emergency"]
    emergency_keywords_te = ["నొప్పి", "పడిపోయా", "పడిపోయాను", "ఊపిరి", "గుండె నొప్పి", "ప్రమాదం", "రక్తం", "స్పృహ"]

    if any(k in lower for k in emergency_keywords_en) or any(k in text for k in emergency_keywords_te):
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
    elif any(k in lower for k in ["lonely", "alone", "sad", "miss my", "missing my", "depressed", "nobody to talk"]) or any(k in text for k in ["ఒంటరి", "బాధ", "బాధగా", "జ్ఞాపకం", "ఎవరూ లేరు", "కుటుంబం"]):
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
    elif any(k in lower for k in ["medicine", "medicines", "tablet", "tablets", "pill", "pills", "dose", "dosage", "prescription"]) or any(k in text for k in ["మందు", "మందులు", "టాబ్లెట్", "టాబ్లెట్లు"]):
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
    elif any(k in lower for k in ["appointment", "doctor", "clinic", "hospital", "visit", "checkup"]) or any(k in text for k in ["డాక్టర్", "అపాయింట్‌మెంట్", "ఆసుపత్రి", "హాస్పిటల్"]):
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

    # General greetings and conversations
    else:
        if any(k in lower for k in ["hello", "hi", "hey", "namaste", "good morning", "good evening", "good afternoon"]) or any(k in text for k in ["నమస్కారం", "బాగున్నారా"]):
            if is_telugu:
                reply = f"నమస్కారం {elder_name} గారు! ఈ రోజు మీ ఆరోగ్యం ఎలా ఉంది? మీకు సహాయం చేయడానికి నేను ఎల్లప్పుడూ సిద్ధంగా ఉన్నాను."
            else:
                reply = f"Hello {elder_name}! It is wonderful to hear from you today. How are you feeling? I can help you check your medicines, appointments, or just chat."
        elif any(k in lower for k in ["thank", "thanks", "dhanyavadamulu"]) or "ధన్యవాదాలు" in text:
            if is_telugu:
                reply = "మీకు స్వాగతం! ఆరోగ్యాన్ని జాగ్రత్తగా చూసుకోండి."
            else:
                reply = f"You are most welcome, {elder_name}! Take good care of yourself today."
        else:
            if is_telugu:
                reply = f"నేను విన్నాను, {elder_name} గారు. మీకు మీ మందులు లేదా డాక్టర్ అపాయింట్‌మెంట్‌ల గురించి ఏమైనా సమాచారం కావాలా? నేను సహాయం చేయగలను."
            else:
                reply = f"Thank you for sharing that with me, {elder_name}. If you need to check your medicines, upcoming appointments, or contact your family, just let me know!"

    # 2. Save AI reply
    AIMessage.objects.create(
        conversation=conv,
        sender="ai",
        content=reply,
        is_private=False,
    )

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
