import math
import uuid
import re

from django.conf import settings
from django.db import IntegrityError
from django.db.models import Q
from django.utils import timezone

from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import FamilyElderRelationship

from .models import Notification, SOSEvent, SOSEventHistory
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
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")
        accuracy = request.data.get("accuracy")
        captured_at = request.data.get("captured_at")
        request_key = request.data.get("request_id")

        if (latitude is None) != (longitude is None):
            return Response({"detail": "Latitude and longitude must be provided together."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            latitude = float(latitude) if latitude is not None else None
            longitude = float(longitude) if longitude is not None else None
            accuracy = float(accuracy) if accuracy is not None else None
        except (TypeError, ValueError):
            return Response({"detail": "Location values must be numbers."}, status=status.HTTP_400_BAD_REQUEST)
        if latitude is not None and (not math.isfinite(latitude) or not -90 <= latitude <= 90):
            return Response({"detail": "Latitude must be between -90 and 90."}, status=status.HTTP_400_BAD_REQUEST)
        if longitude is not None and (not math.isfinite(longitude) or not -180 <= longitude <= 180):
            return Response({"detail": "Longitude must be between -180 and 180."}, status=status.HTTP_400_BAD_REQUEST)
        if accuracy is not None and (not math.isfinite(accuracy) or accuracy < 0):
            return Response({"detail": "Accuracy must be a non-negative number."}, status=status.HTTP_400_BAD_REQUEST)
        if captured_at:
            try:
                captured_at = serializers.DateTimeField().to_internal_value(captured_at)
            except Exception:
                return Response({"detail": "captured_at must be a valid timestamp."}, status=status.HTTP_400_BAD_REQUEST)
        if request_key:
            try:
                request_key = uuid.UUID(str(request_key))
            except (TypeError, ValueError, AttributeError):
                return Response({"detail": "request_id must be a UUID."}, status=status.HTTP_400_BAD_REQUEST)
            existing = SOSEvent.objects.filter(elder=elder, request_id=request_key).first()
            if existing:
                return Response(self._event_response(existing), status=status.HTTP_200_OK)

        contact = (EmergencyContact.objects.filter(elder=elder, is_active=True, can_receive_sos=True).order_by("priority", "id").first())
        try:
            event = SOSEvent.objects.create(
                elder=elder,
                request_id=request_key,
                latitude=latitude,
                longitude=longitude,
                location_accuracy=accuracy,
                location_captured_at=captured_at,
                status=SOSEvent.Status.ACTIVATED,
                contact_name=contact.name if contact else "",
                contact_phone=contact.phone if contact else "",
                contact_priority=contact.priority if contact else None,
            )
        except IntegrityError:
            # Another retry with this request id won the insert race.
            if request_key is None:
                raise
            existing = SOSEvent.objects.filter(elder=elder, request_id=request_key).first()
            if existing is None:
                raise
            return Response(self._event_response(existing), status=status.HTTP_200_OK)
        SOSEventHistory.objects.create(event=event, status=event.status, detail="Emergency request created")
        name = f"{elder.user.first_name} {elder.user.last_name}".strip() or elder.user.email
        maps_url = f"https://www.google.com/maps?q={latitude},{longitude}" if latitude is not None else None
        message = f"{name} activated an emergency SOS at {timezone.localtime(event.created_at).strftime('%Y-%m-%d %H:%M %Z')}. "
        message += f"Location: {latitude}, {longitude} (accuracy ±{accuracy:g} m)." if latitude is not None else "Location could not be obtained."
        try:
            delivery = create_sos_notification(elder=elder, title="Emergency SOS", message=message)
            notifications = delivery["notifications"]
            event.notification_recipient_count = len(notifications)
            event.notification_status = (
                "PARTIAL" if delivery["failed"] and notifications
                else "FAILED" if delivery["failed"]
                else "SENT" if notifications
                else "NO_RECIPIENTS"
            )
            for notification in notifications:
                notification.related_object_type = "sos_event"
                notification.related_object_id = event.id
                notification.data = {
                    "sos_event_id": event.id,
                    "latitude": latitude,
                    "longitude": longitude,
                    "accuracy": accuracy,
                    "location_available": latitude is not None,
                    "maps_url": maps_url,
                    "notification_status": "SENT",
                }
                notification.save(update_fields=["related_object_type", "related_object_id", "data"])
            if delivery["failed"]:
                event.notification_error = f"In-app alert creation failed for {delivery['failed']} of {delivery['attempted']} authorized family member(s)."
        except Exception:
            event.notification_status = "FAILED"
            event.notification_error = "The emergency was saved, but in-app notification creation failed."
        event.save(update_fields=["notification_status", "notification_recipient_count", "notification_error"])
        return Response(self._event_response(event), status=status.HTTP_201_CREATED)

    @staticmethod
    def _event_response(event):
        contact = None if not event.contact_phone else {
            "name": event.contact_name, "phone": event.contact_phone,
            "priority": event.contact_priority,
        }
        return {
            "id": event.id,
            "status": event.status,
            "notification_status": event.notification_status,
            "notification_recipient_count": event.notification_recipient_count,
            "notification_error": event.notification_error,
            "location_available": event.latitude is not None,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "accuracy": event.location_accuracy,
            "maps_url": f"https://www.google.com/maps?q={event.latitude},{event.longitude}" if event.latitude is not None else None,
            "created_at": event.created_at,
            "contact": contact,
            "emergency_services_phone": settings.EMERGENCY_SERVICES_PHONE if re.fullmatch(r"\+[1-9]\d{6,14}", settings.EMERGENCY_SERVICES_PHONE) else "",
            "history": [{"status": row.status, "detail": row.detail, "created_at": row.created_at} for row in event.history.all()],
        }


class SOSLocationUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != "ELDER":
            return Response({"detail": "Only elders can update their SOS location."}, status=status.HTTP_403_FORBIDDEN)
        try:
            elder = request.user.elder_profile
            event = SOSEvent.objects.get(pk=pk, elder=elder)
        except (SOSEvent.DoesNotExist, AttributeError):
            return Response({"detail": "SOS event not found."}, status=status.HTTP_404_NOT_FOUND)
        latitude, longitude = request.data.get("latitude"), request.data.get("longitude")
        accuracy, captured_at = request.data.get("accuracy"), request.data.get("captured_at")
        if latitude is None or longitude is None:
            return Response({"detail": "Latitude and longitude are required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            latitude, longitude = float(latitude), float(longitude)
            accuracy = float(accuracy) if accuracy is not None else None
        except (TypeError, ValueError):
            return Response({"detail": "Location values must be numbers."}, status=status.HTTP_400_BAD_REQUEST)
        if not math.isfinite(latitude) or not -90 <= latitude <= 90 or not math.isfinite(longitude) or not -180 <= longitude <= 180:
            return Response({"detail": "Coordinates are outside valid ranges."}, status=status.HTTP_400_BAD_REQUEST)
        if accuracy is not None and (not math.isfinite(accuracy) or accuracy < 0):
            return Response({"detail": "Accuracy must be a non-negative number."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            parsed_time = serializers.DateTimeField().to_internal_value(captured_at) if captured_at else timezone.now()
        except Exception:
            return Response({"detail": "captured_at must be a valid timestamp."}, status=status.HTTP_400_BAD_REQUEST)
        event.latitude, event.longitude = latitude, longitude
        event.location_accuracy, event.location_captured_at = accuracy, parsed_time
        event.save(update_fields=["latitude", "longitude", "location_accuracy", "location_captured_at", "updated_at"])
        SOSEventHistory.objects.create(event=event, status=event.status, detail="Location added to emergency request")
        maps_url = f"https://www.google.com/maps?q={latitude},{longitude}"
        for notification in Notification.objects.filter(related_object_type="sos_event", related_object_id=event.id):
            data = notification.data or {}
            data.update({"latitude": latitude, "longitude": longitude, "accuracy": accuracy,
                         "location_available": True, "maps_url": maps_url})
            notification.data = data
            notification.save(update_fields=["data"])
        return Response({
            "id": event.id, "location_available": True, "latitude": latitude, "longitude": longitude,
            "accuracy": accuracy, "maps_url": maps_url,
        })


class SOSCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "ELDER":
            return Response({"detail": "Only elders can cancel their SOS event."}, status=status.HTTP_403_FORBIDDEN)
        try:
            event = SOSEvent.objects.get(pk=pk, elder=request.user.elder_profile)
        except (SOSEvent.DoesNotExist, AttributeError):
            return Response({"detail": "SOS event not found."}, status=status.HTTP_404_NOT_FOUND)
        if event.status in {SOSEvent.Status.RESOLVED, SOSEvent.Status.CANCELLED}:
            return Response({"detail": "This SOS event is already closed."}, status=status.HTTP_409_CONFLICT)
        event.status = SOSEvent.Status.CANCELLED
        event.save(update_fields=["status", "updated_at"])
        SOSEventHistory.objects.create(event=event, status=event.status, detail="Cancelled by the elder")
        return Response({"id": event.id, "status": event.status})


class FamilySOSEventListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "FAMILY":
            return Response({"detail": "Family account required."}, status=status.HTTP_403_FORBIDDEN)
        relationships = FamilyElderRelationship.objects.filter(
            family=request.user.family_profile, is_active=True, can_receive_sos=True,
        ).values_list("elder_id", flat=True)
        events = SOSEvent.objects.filter(elder_id__in=relationships).select_related("elder__user").order_by("-created_at")[:100]
        return Response([self.serialize_event(event) for event in events])

    @staticmethod
    def serialize_event(event):
        name = f"{event.elder.user.first_name} {event.elder.user.last_name}".strip() or event.elder.user.email
        return {
            "id": event.id, "elder_name": name, "elder_id": event.elder_id,
            "status": event.status, "created_at": event.created_at,
            "latitude": event.latitude, "longitude": event.longitude,
            "accuracy": event.location_accuracy,
            "location_available": event.latitude is not None,
            "maps_url": f"https://www.google.com/maps?q={event.latitude},{event.longitude}" if event.latitude is not None else None,
            "notification_status": event.notification_status,
            "notification_recipient_count": event.notification_recipient_count,
            "acknowledged_at": event.acknowledged_at,
            "history": [{"status": row.status, "detail": row.detail, "created_at": row.created_at} for row in event.history.all()],
        }

    def patch(self, request, pk):
        if request.user.role != "FAMILY":
            return Response({"detail": "Family account required."}, status=status.HTTP_403_FORBIDDEN)
        try:
            event = SOSEvent.objects.select_related("elder", "elder__user").get(
                pk=pk,
                elder__family_relationships__family=request.user.family_profile,
                elder__family_relationships__is_active=True,
                elder__family_relationships__can_receive_sos=True,
            )
        except SOSEvent.DoesNotExist:
            return Response({"detail": "SOS event not found."}, status=status.HTTP_404_NOT_FOUND)
        action = request.data.get("action")
        if action == "acknowledge":
            event.acknowledged_at = timezone.now()
            SOSEventHistory.objects.create(event=event, status=event.status, detail="Acknowledged by an authorized family member")
        elif action == "resolve":
            event.status = SOSEvent.Status.RESOLVED
            SOSEventHistory.objects.create(event=event, status=event.status, detail="Marked resolved by an authorized family member")
        else:
            return Response({"detail": "action must be acknowledge or resolve."}, status=status.HTTP_400_BAD_REQUEST)
        event.save(update_fields=["acknowledged_at", "status", "updated_at"])
        return Response(self.serialize_event(event))
