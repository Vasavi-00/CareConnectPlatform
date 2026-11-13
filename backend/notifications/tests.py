from django.test import TestCase

# Create your tests here.
import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from accounts.models import ElderProfile, FamilyElderRelationship, FamilyProfile, User
from .models import Notification, SOSEvent, SOSEventHistory


class SOSFlowTests(APITestCase):
    def setUp(self):
        self.elder_user = User.objects.create_user(
            email="sos-elder@example.com", password="test-password-123", role=User.Role.ELDER,
            first_name="Sam",
        )
        self.elder = ElderProfile.objects.create(user=self.elder_user)
        self.family_user = User.objects.create_user(
            email="sos-family@example.com", password="test-password-123", role=User.Role.FAMILY,
        )
        self.family = FamilyProfile.objects.create(user=self.family_user)
        FamilyElderRelationship.objects.create(family=self.family, elder=self.elder, can_receive_sos=True)
        self.activate_url = reverse("sos-activate")
        self.events_url = reverse("sos-events")

    def test_sos_saves_location_and_notifies_authorized_family(self):
        self.client.force_authenticate(user=self.elder_user)
        response = self.client.post(self.activate_url, {
            "latitude": 17.385, "longitude": 78.4867, "accuracy": 14.5,
            "captured_at": "2026-10-24T10:00:00Z", "request_id": str(uuid.uuid4()),
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = SOSEvent.objects.get(pk=response.data["id"])
        self.assertEqual(event.latitude, 17.385)
        self.assertEqual(response.data["notification_status"], "SENT")
        self.assertEqual(response.data["notification_recipient_count"], 1)
        alert = Notification.objects.get(recipient=self.family_user, related_object_id=event.id)
        self.assertIn("maps?q=17.385,78.4867", alert.data["maps_url"])

    def test_location_can_be_unavailable_and_duplicate_request_is_idempotent(self):
        self.client.force_authenticate(user=self.elder_user)
        request_id = str(uuid.uuid4())
        payload = {"request_id": request_id}
        first = self.client.post(self.activate_url, payload, format="json")
        duplicate = self.client.post(self.activate_url, payload, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["id"], duplicate.data["id"])
        self.assertFalse(first.data["location_available"])
        self.assertEqual(SOSEvent.objects.count(), 1)
        self.assertEqual(Notification.objects.filter(notification_type=Notification.NotificationType.SOS).count(), 1)

    def test_invalid_coordinates_and_non_elder_are_rejected(self):
        self.client.force_authenticate(user=self.elder_user)
        invalid = self.client.post(self.activate_url, {"latitude": 91, "longitude": 0}, format="json")
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(user=self.family_user)
        forbidden = self.client.post(self.activate_url, {}, format="json")
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(SOSEvent.objects.exists())

    def test_family_can_only_see_authorized_elders_sos(self):
        event = SOSEvent.objects.create(elder=self.elder)
        other_user = User.objects.create_user(email="other-elder@example.com", password="test-password-123", role=User.Role.ELDER)
        other_elder = ElderProfile.objects.create(user=other_user)
        SOSEvent.objects.create(elder=other_elder)
        self.client.force_authenticate(user=self.family_user)
        response = self.client.get(self.events_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([row["id"] for row in response.data], [event.id])
        self.assertEqual(self.client.patch(reverse("sos-event-detail", args=[event.id]), {"action": "resolve"}, format="json").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.patch(reverse("sos-event-detail", args=[2]), {"action": "resolve"}, format="json").status_code, status.HTTP_404_NOT_FOUND)

    @patch("notifications.views.create_sos_notification", return_value={"notifications": [], "attempted": 1, "failed": 1})
    def test_notification_failure_does_not_delete_sos_record(self, _notify):
        self.client.force_authenticate(user=self.elder_user)
        response = self.client.post(self.activate_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["notification_status"], "FAILED")
        self.assertTrue(SOSEvent.objects.filter(pk=response.data["id"]).exists())

    def test_location_can_be_added_after_event_creation(self):
        self.client.force_authenticate(user=self.elder_user)
        created = self.client.post(self.activate_url, {"request_id": str(uuid.uuid4())}, format="json")
        url = reverse("sos-location-update", args=[created.data["id"]])
        updated = self.client.patch(url, {
            "latitude": 17.385, "longitude": 78.4867, "accuracy": 10,
            "captured_at": "2026-10-24T10:00:00Z",
        }, format="json")
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["latitude"], 17.385)
        self.assertTrue(SOSEventHistory.objects.filter(event_id=created.data["id"], detail="Location added to emergency request").exists())

    def test_location_update_rejects_invalid_coords_and_other_roles(self):
        event = SOSEvent.objects.create(elder=self.elder)
        url = reverse("sos-location-update", args=[event.id])
        self.client.force_authenticate(user=self.elder_user)
        invalid = self.client.patch(url, {"latitude": 100, "longitude": 0}, format="json")
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(user=self.family_user)
        forbidden = self.client.patch(url, {"latitude": 0, "longitude": 0}, format="json")
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_contacts_still_creates_emergency_and_has_no_invented_number(self):
        self.elder.family_relationships.update(can_receive_sos=False)
        self.client.force_authenticate(user=self.elder_user)
        response = self.client.post(self.activate_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data["contact"])
        self.assertEqual(response.data["emergency_services_phone"], "")
        self.assertTrue(SOSEvent.objects.filter(pk=response.data["id"]).exists())

    def test_elder_can_cancel_accidental_event_with_history(self):
        self.client.force_authenticate(user=self.elder_user)
        created = self.client.post(self.activate_url, {}, format="json")
        response = self.client.post(reverse("sos-cancel", args=[created.data["id"]]), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], SOSEvent.Status.CANCELLED)
        self.assertTrue(SOSEventHistory.objects.filter(event_id=created.data["id"], status=SOSEvent.Status.CANCELLED).exists())

    @patch("notifications.views.settings.EMERGENCY_SERVICES_PHONE", "911")
    def test_unvalidated_short_emergency_number_is_not_returned(self):
        self.client.force_authenticate(user=self.elder_user)
        response = self.client.post(self.activate_url, {}, format="json")
        self.assertEqual(response.data["emergency_services_phone"], "")
