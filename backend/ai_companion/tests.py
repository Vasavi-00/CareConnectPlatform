import json
from urllib.error import HTTPError
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import ElderProfile, FamilyElderRelationship, FamilyProfile, User
from appointments.models import Appointment
from notifications.models import Notification, SOSEvent
from notifications.serializers import NotificationSerializer
from .models import AIConversation, AIConversationSummary, AIMessage


def completion(content="I hear you. Would you like to tell me more?", tool_calls=None):
    return {"choices": [{"message": {"role": "assistant", "content": content, **({"tool_calls": tool_calls} if tool_calls else {})}}]}


class CompanionTests(TestCase):
    def setUp(self):
        self.elder_user = User.objects.create_user(email="elder@example.com", password="test-password-123", role=User.Role.ELDER, first_name="Asha")
        self.elder = ElderProfile.objects.create(user=self.elder_user, preferred_language="English")
        self.other_user = User.objects.create_user(email="other@example.com", password="test-password-123", role=User.Role.ELDER)
        self.other = ElderProfile.objects.create(user=self.other_user)
        self.family_user = User.objects.create_user(email="family@example.com", password="test-password-123", role=User.Role.FAMILY, first_name="Ravi")
        self.family = FamilyProfile.objects.create(user=self.family_user)
        FamilyElderRelationship.objects.create(family=self.family, elder=self.elder)
        self.client = APIClient()
        self.client.force_authenticate(self.elder_user)

    @patch("ai_companion.services.companion._provider_request", return_value=completion("I'm sorry this feels lonely. Would you like to tell me what happened today?"))
    def test_normal_chat_persists_private_turns_and_uses_ai_reply(self, provider):
        response = self.client.post(reverse("ai-chat"), {"message": "I feel lonely today", "language": "English"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("lonely", response.data["reply"])
        self.assertEqual(AIMessage.objects.filter(is_private=True).count(), 2)
        self.assertFalse(Notification.objects.filter(recipient=self.family_user).exists())
        provider.assert_called_once()

    @patch("ai_companion.services.companion._provider_request", return_value=completion("Your next appointment is on Tuesday."))
    def test_follow_up_uses_recent_history_and_conversation_is_owner_scoped(self, provider):
        conv = AIConversation.objects.create(elder=self.elder)
        AIMessage.objects.create(conversation=conv, sender="elder", content="When is my appointment?", is_private=True)
        ok = self.client.post(reverse("ai-chat"), {"message": "And where?", "conversation_id": conv.pk}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertTrue(any(m.get("content") == "When is my appointment?" for m in provider.call_args.args[0]))
        other_conv = AIConversation.objects.create(elder=self.other)
        denied = self.client.post(reverse("ai-chat"), {"message": "What is there?", "conversation_id": other_conv.pk}, format="json")
        self.assertEqual(denied.status_code, 400)

    @patch("ai_companion.services.companion._provider_request", side_effect=[completion(content=None, tool_calls=[{"id": "call1", "type": "function", "function": {"name": "get_upcoming_appointments", "arguments": json.dumps({"limit": 2})}}]), completion("Your appointment is with Dr. Rao.")])
    def test_tool_reads_only_authenticated_elders_appointments(self, provider):
        Appointment.objects.create(elder=self.elder, doctor_name="Rao", clinic_name="Clinic A", appointment_at="2030-01-02T10:00:00Z")
        Appointment.objects.create(elder=self.other, doctor_name="Secret", clinic_name="Clinic B", appointment_at="2030-01-02T10:00:00Z")
        response = self.client.post(reverse("ai-chat"), {"message": "When is my appointment?"}, format="json")
        self.assertEqual(response.status_code, 200)
        tool_payload = provider.call_args_list[1].args[0][-1]["content"]
        self.assertIn("Rao", tool_payload)
        self.assertNotIn("Secret", tool_payload)

    @patch.dict("os.environ", {}, clear=True)
    def test_missing_provider_key_returns_clear_503_without_persisting_message(self):
        response = self.client.post(reverse("ai-chat"), {"message": "Hello"}, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertIn("AI_COMPANION_API_KEY", response.data["detail"])
        self.assertEqual(AIMessage.objects.count(), 0)

    @patch("ai_companion.services.companion._provider_request", side_effect=__import__("ai_companion.services.companion", fromlist=["CompanionTimeout"]).CompanionTimeout("The AI service took too long. Please try again."))
    def test_provider_timeout_is_reported_without_fake_reply(self, provider):
        response = self.client.post(reverse("ai-chat"), {"message": "Hello"}, format="json")
        self.assertEqual(response.status_code, 504)
        self.assertEqual(AIMessage.objects.count(), 0)

    @patch("ai_companion.services.companion._provider_request", return_value={"choices": []})
    def test_malformed_provider_response_returns_clear_error_without_saving_turn(self, provider):
        response = self.client.post(reverse("ai-chat"), {"message": "Hello"}, format="json")
        self.assertEqual(response.status_code, 502)
        self.assertIn("unreadable", response.data["detail"].lower())
        self.assertEqual(AIMessage.objects.count(), 0)

    @patch("ai_companion.services.companion._provider_request", return_value=completion("Would you like me to ask your family to call?", [{"id": "c", "type": "function", "function": {"name": "offer_family_contact", "arguments": json.dumps({"reason": "Please call me"})}}]))
    def test_family_tool_only_offers_confirmation_and_does_not_notify(self, provider):
        response = self.client.post(reverse("ai-chat"), {"message": "Please call my family"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["offer_family_call"])
        self.assertFalse(Notification.objects.filter(recipient=self.family_user).exists())

    @patch("ai_companion.services.companion._provider_request", side_effect=[completion(content=None, tool_calls=[{"id": "sos", "type": "function", "function": {"name": "offer_sos_confirmation", "arguments": "{}"}}]), completion("Would you like to open the emergency confirmation? You can also call local emergency services.")])
    def test_sos_tool_only_offers_confirmation_and_does_not_create_sos_event(self, provider):
        response = self.client.post(reverse("ai-chat"), {"message": "I need emergency help"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["offer_sos"])
        self.assertEqual(SOSEvent.objects.count(), 0)

    @patch.dict("os.environ", {"AI_COMPANION_API_KEY": "test-key"}, clear=True)
    @patch("ai_companion.services.companion.urlopen", side_effect=HTTPError("https://example.test", 429, "busy", {}, None))
    def test_provider_rate_limit_returns_retryable_service_busy(self, urlopen):
        response = self.client.post(reverse("ai-chat"), {"message": "Hello"}, format="json")
        self.assertEqual(response.status_code, 503)
        self.assertIn("busy", response.data["detail"])
        self.assertEqual(AIMessage.objects.count(), 0)

    def test_family_cannot_read_private_conversation_messages(self):
        conv = AIConversation.objects.create(elder=self.elder)
        AIMessage.objects.create(conversation=conv, sender="elder", content="Private note", is_private=True)
        self.client.force_authenticate(self.family_user)
        response = self.client.get(reverse("ai-conversations"), {"elder_id": self.elder.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    @patch("ai_companion.views.generate_reviewable_summary", return_value="Please help me arrange a doctor appointment.")
    def test_summary_stays_private_until_elder_reviews_and_shares(self, generate):
        conversation = AIConversation.objects.create(elder=self.elder, title="Private first message")
        AIMessage.objects.create(conversation=conversation, sender="elder", content="I felt lonely. Please help with my appointment.", is_private=True)
        draft = self.client.post(reverse("ai-summary-draft", args=[conversation.id]), format="json")
        self.assertEqual(draft.status_code, 200)
        self.assertEqual(draft.data["status"], AIConversationSummary.Status.DRAFT)
        self.assertEqual(AIConversationSummary.objects.filter(status="SHARED").count(), 0)

        share_url = reverse("ai-summary-share", args=[draft.data["id"]])
        missing_consent = self.client.post(share_url, {
            "summary": "Please help me arrange a doctor appointment.",
            "recipient_ids": [self.family.id],
        }, format="json")
        self.assertEqual(missing_consent.status_code, 400)

        shared = self.client.post(share_url, {
            "summary": "Please help arrange a doctor appointment.",
            "recipient_ids": [self.family.id], "consent": True,
        }, format="json")
        self.assertEqual(shared.status_code, 200)
        duplicate_share = self.client.post(share_url, {
            "summary": "Please help arrange a doctor appointment.",
            "recipient_ids": [self.family.id], "consent": True,
        }, format="json")
        self.assertEqual(duplicate_share.status_code, 409)
        self.assertEqual(Notification.objects.filter(recipient=self.family_user, related_object_type="ai_summary").count(), 1)
        alert = Notification.objects.get(recipient=self.family_user, related_object_type="ai_summary")
        self.assertNotIn("appointment", alert.message.lower())
        self.assertEqual(alert.data["summary_id"], draft.data["id"])

        self.client.force_authenticate(self.family_user)
        summary_url = reverse("ai-summary-list")
        visible = self.client.get(summary_url, {"elder_id": self.elder.id})
        self.assertEqual(visible.status_code, 200)
        self.assertEqual(visible.data[0]["summary"], "Please help arrange a doctor appointment.")
        self.assertNotIn("lonely", visible.data[0]["summary"].lower())

        self.client.force_authenticate(self.elder_user)
        revoked = self.client.post(reverse("ai-summary-revoke", args=[draft.data["id"]]), format="json")
        self.assertEqual(revoked.status_code, 200)
        self.client.force_authenticate(self.family_user)
        self.assertEqual(self.client.get(summary_url, {"elder_id": self.elder.id}).data, [])

    def test_family_summary_access_is_recipient_scoped(self):
        conversation = AIConversation.objects.create(elder=self.elder)
        summary = AIConversationSummary.objects.create(elder=self.elder, conversation=conversation, summary="Approved update", status=AIConversationSummary.Status.SHARED)
        unrelated_family = FamilyProfile.objects.create(user=User.objects.create_user(email="another-family@example.com", password="test-password-123", role=User.Role.FAMILY))
        other_elder_user = User.objects.create_user(email="third-elder@example.com", password="test-password-123", role=User.Role.ELDER)
        other_elder = ElderProfile.objects.create(user=other_elder_user)
        FamilyElderRelationship.objects.create(family=unrelated_family, elder=other_elder)
        summary.recipients.add(self.family)
        self.client.force_authenticate(unrelated_family.user)
        denied = self.client.get(reverse("ai-summary-list"), {"elder_id": self.elder.id})
        self.assertEqual(denied.status_code, 403)

    def test_summary_notifications_never_expose_summary_or_legacy_transcript_text(self):
        old_alert = Notification.objects.create(
            recipient=self.family_user,
            elder=self.elder,
            notification_type=Notification.NotificationType.AI_SUMMARY,
            title="Old summary",
            message="Sensitive private transcript text",
            related_object_type="ai_summary",
        )
        serialized = NotificationSerializer(old_alert).data
        self.assertNotIn("Sensitive private transcript text", serialized["message"])
        self.assertNotIn("Sensitive private transcript text", str(serialized.get("data", {})))

    def test_family_cannot_access_unrelated_elder_conversations(self):
        self.client.force_authenticate(self.family_user)
        response = self.client.get(reverse("ai-conversations"), {"elder_id": self.other.pk})
        self.assertEqual(response.status_code, 403)

    @patch("ai_companion.services.transcription.transcribe_audio_bytes", return_value="What medicines do I have today?")
    def test_transcribe_audio_success(self, mock_transcribe):
        audio_file = SimpleUploadedFile("voice.webm", b"RIFF" + b"\x00" * 200, content_type="audio/webm")
        response = self.client.post(reverse("ai-transcribe"), {"audio": audio_file, "language": "English"}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["text"], "What medicines do I have today?")
        self.assertTrue(response.data["is_clear"])
        self.assertFalse(response.data["clarification_needed"])
        mock_transcribe.assert_called_once()

    @patch("ai_companion.services.transcription.transcribe_audio_bytes", return_value="నాకు ఈ రోజు ఏ మందులు ఉన్నాయి?")
    def test_transcribe_audio_telugu(self, mock_transcribe):
        audio_file = SimpleUploadedFile("voice.webm", b"RIFF" + b"\x00" * 200, content_type="audio/webm")
        response = self.client.post(reverse("ai-transcribe"), {"audio": audio_file, "language": "Telugu"}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["text"], "నాకు ఈ రోజు ఏ మందులు ఉన్నాయి?")
        self.assertEqual(response.data["language"], "Telugu")
        self.assertEqual(mock_transcribe.call_args.kwargs.get("language"), "Telugu")

    def test_transcribe_rejects_empty_or_tiny_audio(self):
        tiny_audio = SimpleUploadedFile("empty.webm", b"short", content_type="audio/webm")
        response = self.client.post(reverse("ai-transcribe"), {"audio": tiny_audio}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("too short or empty", response.data["detail"])

    def test_transcribe_rejects_non_elder(self):
        self.client.force_authenticate(self.family_user)
        audio_file = SimpleUploadedFile("voice.webm", b"RIFF" + b"\x00" * 200, content_type="audio/webm")
        response = self.client.post(reverse("ai-transcribe"), {"audio": audio_file}, format="multipart")
        self.assertEqual(response.status_code, 403)

    @patch.dict("os.environ", {}, clear=True)
    def test_transcribe_missing_api_key_returns_503(self):
        audio_file = SimpleUploadedFile("voice.webm", b"RIFF" + b"\x00" * 200, content_type="audio/webm")
        response = self.client.post(reverse("ai-transcribe"), {"audio": audio_file}, format="multipart")
        self.assertEqual(response.status_code, 503)
        self.assertIn("AI_TRANSCRIPTION_API_KEY", response.data["detail"])

    @patch("ai_companion.services.transcription.transcribe_audio_bytes", return_value="Thank you.")
    def test_voice_chat_unclear_speech_returns_clarification(self, mock_transcribe):
        audio_file = SimpleUploadedFile("voice.webm", b"RIFF" + b"\x00" * 200, content_type="audio/webm")
        response = self.client.post(reverse("ai-voice-chat"), {"audio": audio_file, "language": "English"}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["clarification_needed"])
        self.assertIn("couldn't quite hear that", response.data["reply"])
        self.assertEqual(AIMessage.objects.count(), 0)

    @patch("ai_companion.services.transcription.transcribe_audio_bytes", return_value="I am feeling lonely today")
    @patch("ai_companion.services.companion._provider_request", return_value=completion("I'm here with you. Would you like to tell me more?"))
    def test_voice_chat_full_flow_transcribes_and_generates_ai_response(self, mock_provider, mock_transcribe):
        audio_file = SimpleUploadedFile("voice.webm", b"RIFF" + b"\x00" * 200, content_type="audio/webm")
        response = self.client.post(reverse("ai-voice-chat"), {"audio": audio_file, "language": "English"}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["transcription"], "I am feeling lonely today")
        self.assertIn("here with you", response.data["reply"])
        self.assertEqual(AIMessage.objects.filter(is_private=True).count(), 2)

    def test_transcribe_rejects_missing_file(self):
        response = self.client.post(reverse("ai-transcribe"), {}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("No audio file", response.data["detail"])

