from rest_framework import status
from django.db import transaction
from django.db import IntegrityError
from django.utils import timezone
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ElderProfile, FamilyElderRelationship
from .models import AIConversation, AIMessage, FamilyCallRequest
from .serializers import AIConversationSerializer, FamilyCallRequestSerializer
from .services.companion import (
    CompanionError, process_elder_message, request_family_call,
    generate_reviewable_summary,
)
from .services.transcription import (
    TranscriptionError,
    TranscriptionValidationError,
    TranscriptionNotConfigured,
    TranscriptionBusy,
    TranscriptionTimeout,
    transcribe_elder_audio,
)
from notifications.models import Notification
from notifications.services import create_notification


class TranscribeView(APIView):
    """
    POST /api/ai/transcribe/
    Upload recorded audio file and receive transcribed text.
    Accepts: multipart/form-data with 'audio' file and optional 'language'.
    Returns: { "text": "...", "language": "...", "is_clear": bool, "clarification_needed": bool, "fallback_prompt": "..." }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        try:
            elder = user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response(
                {"detail": "Only elderly users can interact directly with the AI Companion."},
                status=status.HTTP_403_FORBIDDEN,
            )

        audio_file = request.FILES.get("audio") or request.FILES.get("file")
        if not audio_file:
            return Response(
                {"detail": "No audio file was uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        language = request.data.get("language") or elder.preferred_language or "English"
        try:
            result = transcribe_elder_audio(audio_file, language=language)
            return Response(result, status=status.HTTP_200_OK)
        except TranscriptionValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TranscriptionError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code)
        except Exception:
            return Response(
                {"detail": "An unexpected error occurred while transcribing audio."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VoiceChatView(APIView):
    """
    POST /api/ai/voice-chat/
    End-to-end voice turn: transcribes audio and generates contextual AI companion response.
    Accepts: multipart/form-data with 'audio' file, optional 'language', and optional 'conversation_id'.
    Returns: { "transcription": "...", "reply": "...", "offer_sos": bool, "offer_family_call": bool, "conversation_id": int }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        try:
            elder = user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response(
                {"detail": "Only elderly users can interact directly with the AI Companion."},
                status=status.HTTP_403_FORBIDDEN,
            )

        audio_file = request.FILES.get("audio") or request.FILES.get("file")
        if not audio_file:
            return Response(
                {"detail": "No audio file was uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        language = request.data.get("language") or elder.preferred_language or "English"
        conversation_id = request.data.get("conversation_id")
        if conversation_id:
            try:
                conversation_id = int(conversation_id)
            except (TypeError, ValueError):
                conversation_id = None

        try:
            transcription_result = transcribe_elder_audio(audio_file, language=language)
        except TranscriptionValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TranscriptionError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code)

        if transcription_result.get("clarification_needed"):
            return Response({
                "transcription": "",
                "reply": transcription_result.get("fallback_prompt"),
                "clarification_needed": True,
                "offer_sos": False,
                "offer_family_call": False,
                "conversation_id": conversation_id,
            }, status=status.HTTP_200_OK)

        transcribed_text = transcription_result["text"]
        try:
            ai_result = process_elder_message(
                elder=elder,
                message_text=transcribed_text,
                language=language,
                conversation_id=conversation_id,
            )
            return Response({
                "transcription": transcribed_text,
                "reply": ai_result["reply"],
                "offer_sos": ai_result.get("offer_sos", False),
                "offer_family_call": ai_result.get("offer_family_call", False),
                "family_call_reason": ai_result.get("family_call_reason"),
                "conversation_id": ai_result.get("conversation_id"),
                "ai_message_id": ai_result.get("ai_message_id"),
            }, status=status.HTTP_200_OK)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except CompanionError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code)


class ChatView(APIView):
    """
    POST /api/ai/chat/
    Endpoint for elder to chat with the AI companion.
    Accepts: { "message": "...", "language": "English" }
    Returns: { "reply": "...", "offer_sos": bool, "offer_family_call": bool, "conversation_id": int }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            elder = user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response(
                {"detail": "Only elderly users can interact directly with the AI Companion chat."},
                status=status.HTTP_403_FORBIDDEN,
            )

        message_text = request.data.get("message", "")
        language = request.data.get("language", elder.preferred_language or "English")

        if not isinstance(message_text, str) or not message_text.strip():
            return Response(
                {"detail": "Message text cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = process_elder_message(
                elder=elder, message_text=message_text, language=language,
                conversation_id=request.data.get("conversation_id"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except CompanionError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code)

        return Response(result, status=status.HTTP_200_OK)


class ConversationListView(APIView):
    """
    GET /api/ai/conversations/?elder_id=<id>
    List AI conversations and messages.
    - Family users can view conversations of their connected elders.
    - Elders can view their own conversations.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            elder = request.user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response({"detail": "Only elderly users can create a conversation."}, status=status.HTTP_403_FORBIDDEN)
        title = request.data.get("title", "New conversation")
        if not isinstance(title, str) or len(title) > 255:
            return Response({"detail": "Invalid conversation title."}, status=status.HTTP_400_BAD_REQUEST)
        conversation = AIConversation.objects.create(elder=elder, title=title.strip() or "New conversation")
        return Response(AIConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        user = request.user
        elder = None

        if hasattr(user, "elder_profile"):
            elder = user.elder_profile
        elif hasattr(user, "family_profile"):
            elder_id = request.query_params.get("elder_id")
            if elder_id:
                # Validate family has permission to view this elder
                rel = FamilyElderRelationship.objects.filter(
                    family=user.family_profile,
                    elder_id=elder_id,
                    is_active=True,
                ).first()
                if not rel:
                    return Response(
                        {"detail": "You do not have permission to view conversations for this elder."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                return Response([], status=status.HTTP_200_OK)
            else:
                # Default to first connected elder
                rel = FamilyElderRelationship.objects.filter(
                    family=user.family_profile,
                    is_active=True,
                ).first()
                if rel:
                    return Response([], status=status.HTTP_200_OK)
                else:
                    return Response([], status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "Invalid user profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not elder:
            return Response([], status=status.HTTP_200_OK)

        conversations = (
            AIConversation.objects.filter(elder=elder)
            .prefetch_related("messages")
            .order_by("-updated_at")
        )
        serializer = AIConversationSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RequestCallView(APIView):
    """
    POST /api/ai/request-call/
    Allows an elder to request a call from their connected family.
    Accepts: { "reason": "Feeling lonely" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            elder = user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response(
                {"detail": "Only elderly users can request a family call."},
                status=status.HTTP_403_FORBIDDEN,
            )

        reason = request.data.get("reason", "Requested a call via AI Companion")
        if not isinstance(reason, str) or len(reason) > 255:
            return Response({"detail": "Invalid call request reason."}, status=status.HTTP_400_BAD_REQUEST)
        call_req, recipient_count = request_family_call(elder=elder, reason=reason)
        serializer = FamilyCallRequestSerializer(call_req)
        return Response({**serializer.data, "notified_count": recipient_count, "sent": recipient_count > 0}, status=status.HTTP_201_CREATED)


def _summary_data(summary, include_recipients=False):
    result = {
        "id": summary.id,
        "conversation_id": summary.conversation_id,
        "summary": summary.summary,
        "status": summary.status,
        "created_at": summary.created_at,
        "shared_at": summary.shared_at,
        "revoked_at": summary.revoked_at,
    }
    if include_recipients:
        result["recipients"] = [{
            "id": family.id,
            "name": f"{family.user.first_name} {family.user.last_name}".strip() or "Family member",
        } for family in summary.recipients.select_related("user").all()]
    return result


class ConversationSummaryDraftView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            elder = request.user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response({"detail": "Only elders can prepare a family summary."}, status=status.HTTP_403_FORBIDDEN)
        conversation = AIConversation.objects.filter(pk=conversation_id, elder=elder).first()
        if conversation is None:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        from .models import AIConversationSummary
        existing_draft = AIConversationSummary.objects.filter(
            conversation=conversation, elder=elder, status=AIConversationSummary.Status.DRAFT,
        ).first()
        if existing_draft:
            return Response(_summary_data(existing_draft, include_recipients=True), status=status.HTTP_200_OK)
        try:
            draft_text = generate_reviewable_summary(conversation)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except CompanionError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code)
        try:
            summary = AIConversationSummary.objects.create(conversation=conversation, elder=elder, summary=draft_text)
        except IntegrityError:
            summary = AIConversationSummary.objects.filter(
                conversation=conversation, elder=elder, status=AIConversationSummary.Status.DRAFT,
            ).first()
            if summary is None:
                raise
        return Response(_summary_data(summary, include_recipients=True), status=status.HTTP_200_OK)


class ConversationSummaryShareView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            elder = request.user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response({"detail": "Only elders can share a conversation summary."}, status=status.HTTP_403_FORBIDDEN)
        text = request.data.get("summary")
        recipient_ids = request.data.get("recipient_ids")
        if request.data.get("consent") is not True:
            return Response({"detail": "Explicit sharing confirmation is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(text, str) or not text.strip() or len(text.strip()) > 1200:
            return Response({"detail": "Review a summary of 1 to 1200 characters."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(recipient_ids, list) or not recipient_ids or any(type(value) is not int or value < 1 for value in recipient_ids):
            return Response({"detail": "Select at least one authorized family member."}, status=status.HTTP_400_BAD_REQUEST)
        recipient_ids = list(dict.fromkeys(recipient_ids))

        from .models import AIConversationSummary
        with transaction.atomic():
            summary = AIConversationSummary.objects.select_for_update().filter(pk=pk, elder=elder).first()
            if summary is None:
                return Response({"detail": "Summary draft not found."}, status=status.HTTP_404_NOT_FOUND)
            if summary.status != AIConversationSummary.Status.DRAFT:
                return Response({"detail": "This summary has already been shared or closed."}, status=status.HTTP_409_CONFLICT)
            recipients = list(FamilyElderRelationship.objects.filter(
                elder=elder, is_active=True, family_id__in=recipient_ids,
            ).select_related("family__user").values_list("family_id", flat=True).distinct())
            if set(recipients) != set(recipient_ids):
                return Response({"detail": "One or more selected family members are not currently authorized."}, status=status.HTTP_403_FORBIDDEN)

            summary.summary = text.strip()
            summary.status = AIConversationSummary.Status.SHARED
            summary.shared_at = timezone.now()
            summary.save(update_fields=["summary", "status", "shared_at", "updated_at"])
            summary.recipients.set(recipients)
            notice_count = 0
            for relationship in FamilyElderRelationship.objects.filter(
                elder=elder, is_active=True, family_id__in=recipients,
            ).select_related("family__user"):
                notification = create_notification(
                    recipient=relationship.family.user,
                    elder=elder,
                    notification_type=Notification.NotificationType.AI_SUMMARY,
                    title="A CareConnect update was shared",
                    message="Your family member shared a private update. Open AI Companion Updates in CareConnect to review it.",
                    priority=Notification.Priority.NORMAL,
                    related_object_type="ai_summary",
                    related_object_id=summary.id,
                )
                if notification is not None:
                    notification.data = {"summary_id": summary.id}
                    notification.save(update_fields=["data"])
                    notice_count += 1
        return Response({**_summary_data(summary, include_recipients=True), "notification_count": notice_count}, status=status.HTTP_200_OK)


class ConversationSummaryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import AIConversationSummary
        user = request.user
        if user.role == "ELDER":
            try:
                elder = user.elder_profile
            except ElderProfile.DoesNotExist:
                return Response({"detail": "Elder profile not found."}, status=status.HTTP_403_FORBIDDEN)
            rows = AIConversationSummary.objects.filter(elder=elder).prefetch_related("recipients__user")
            return Response([_summary_data(row, include_recipients=True) for row in rows])
        if user.role != "FAMILY":
            return Response({"detail": "Elder or family account required."}, status=status.HTTP_403_FORBIDDEN)
        elder_id = request.query_params.get("elder_id")
        if not elder_id:
            return Response({"detail": "elder_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        relationship = FamilyElderRelationship.objects.filter(
            family=user.family_profile, elder_id=elder_id, is_active=True,
        ).first()
        if relationship is None:
            return Response({"detail": "You are not authorized to view this elder's shared summaries."}, status=status.HTTP_403_FORBIDDEN)
        rows = AIConversationSummary.objects.filter(
            elder=relationship.elder,
            status=AIConversationSummary.Status.SHARED,
            recipients=user.family_profile,
            elder__family_relationships__family=user.family_profile,
            elder__family_relationships__is_active=True,
        ).distinct().order_by("-shared_at")
        return Response([_summary_data(row) for row in rows])


class ConversationSummaryRevokeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            elder = request.user.elder_profile
        except (AttributeError, ElderProfile.DoesNotExist):
            return Response({"detail": "Only elders can revoke a shared summary."}, status=status.HTTP_403_FORBIDDEN)
        from .models import AIConversationSummary
        summary = AIConversationSummary.objects.filter(pk=pk, elder=elder).first()
        if summary is None:
            return Response({"detail": "Summary not found."}, status=status.HTTP_404_NOT_FOUND)
        if summary.status != AIConversationSummary.Status.SHARED:
            return Response({"detail": "Only a shared summary can be revoked."}, status=status.HTTP_409_CONFLICT)
        summary.status = AIConversationSummary.Status.REVOKED
        summary.revoked_at = timezone.now()
        summary.save(update_fields=["status", "revoked_at", "updated_at"])
        return Response(_summary_data(summary, include_recipients=True))
