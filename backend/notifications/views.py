from django.db.models import Q
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, SOSEvent
from .serializers import NotificationSerializer
from .services import create_sos_notification
from emergency_contacts.models import EmergencyContact


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related(
                "elder",
                "elder__user",
            )
        )

        unread_only = self.request.query_params.get(
            "unread"
        )

        notification_type = (
            self.request.query_params.get("type")
        )

        if unread_only == "true":
            queryset = queryset.filter(
                is_read=False
            )

        if notification_type:
            queryset = queryset.filter(
                notification_type=notification_type
            )

        now = timezone.now()

        queryset = queryset.filter(
            Q(expires_at__isnull=True)
            | Q(expires_at__gte=now)
        )

        return queryset


class NotificationDetailView(
    generics.RetrieveAPIView
):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related(
                "elder",
                "elder__user",
            )
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = (
                Notification.objects
                .get(
                    id=pk,
                    recipient=request.user,
                )
            )
        except Notification.DoesNotExist:
            return Response(
                {
                    "detail":
                        "Notification not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(
            update_fields=["is_read"]
        )

        return Response(
            NotificationSerializer(
                notification
            ).data
        )


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = (
            Notification.objects
            .filter(
                recipient=request.user,
                is_read=False,
            )
            .update(
                is_read=True
            )
        )

        return Response(
            {
                "message":
                    "All notifications marked as read.",
                "updated_count":
                    updated,
            }
        )


class NotificationUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = (
            Notification.objects
            .filter(
                recipient=request.user,
                is_read=False,
            )
            .count()
        )

        return Response(
            {
                "unread_count": count
            }
        )


class SOSActivateView(APIView):
    """Persist an elder SOS and notify eligible family members."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "ELDER":
            return Response({"detail": "Only elders can activate SOS."}, status=status.HTTP_403_FORBIDDEN)
        elder = request.user.elder_profile
        contact = (EmergencyContact.objects.filter(elder=elder, is_active=True, can_receive_sos=True).order_by("priority", "id").first())
        event = SOSEvent.objects.create(
            elder=elder,
            status=SOSEvent.Status.CONTACTING if contact else SOSEvent.Status.ACTIVATED,
            contact_name=contact.name if contact else "",
            contact_phone=contact.phone if contact else "",
            contact_priority=contact.priority if contact else None,
        )
        name = f"{elder.user.first_name} {elder.user.last_name}".strip() or elder.user.email
        create_sos_notification(elder=elder, title="Emergency SOS", message=f"{name} has activated an emergency SOS. Please contact them immediately.")
        return Response({"id": event.id, "status": event.status, "contact": None if not contact else {"name": contact.name, "phone": contact.phone, "priority": contact.priority}}, status=status.HTTP_201_CREATED)
