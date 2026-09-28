from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ElderProfile, FamilyProfile, FamilyElderRelationship
from .models import AIConversation, FamilyCallRequest
from .serializers import AIConversationSerializer, FamilyCallRequestSerializer
from .services.companion import process_elder_message, request_family_call


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

        if not message_text.strip():
            return Response(
                {"detail": "Message text cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = process_elder_message(
            elder=elder,
            message_text=message_text,
            language=language,
        )

        return Response(result, status=status.HTTP_200_OK)


class ConversationListView(APIView):
    """
    GET /api/ai/conversations/?elder_id=<id>
    List AI conversations and messages.
    - Family users can view conversations of their connected elders.
    - Elders can view their own conversations.
    """
    permission_classes = [IsAuthenticated]

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
                elder = rel.elder
            else:
                # Default to first connected elder
                rel = FamilyElderRelationship.objects.filter(
                    family=user.family_profile,
                    is_active=True,
                ).first()
                if rel:
                    elder = rel.elder
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
        call_req = request_family_call(elder=elder, reason=reason)
        serializer = FamilyCallRequestSerializer(call_req)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
