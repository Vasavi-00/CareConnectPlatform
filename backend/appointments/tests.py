from datetime import timedelta

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse

from accounts.models import ElderProfile, FamilyElderRelationship, FamilyProfile, User
from .models import Appointment

from .serializers import AppointmentSerializer


class AppointmentDateValidationTests(SimpleTestCase):
	def test_rejects_past_appointment_datetime(self):
		with self.assertRaises(ValidationError):
			AppointmentSerializer().validate({
				"appointment_at": timezone.now() - timedelta(minutes=1),
			})

	def test_accepts_future_appointment_datetime(self):
		appointment_at = timezone.now() + timedelta(days=1)

		validated = AppointmentSerializer().validate({
			"appointment_at": appointment_at,
			"location": "12 Lake Road",
		})

		self.assertEqual(validated["appointment_at"], appointment_at)


class AppointmentBookingAPITests(APITestCase):
	def setUp(self):
		self.family_user = User.objects.create_user(
			email="appointments-family@example.com", password="test-password-123", role=User.Role.FAMILY,
		)
		self.family = FamilyProfile.objects.create(user=self.family_user)
		self.elder_user = User.objects.create_user(
			email="appointments-elder@example.com", password="test-password-123", role=User.Role.ELDER,
		)
		self.elder = ElderProfile.objects.create(user=self.elder_user)
		self.relationship = FamilyElderRelationship.objects.create(
			family=self.family, elder=self.elder, can_manage_appointments=True,
		)
		self.url = reverse("appointment-list-create")
		self.payload = {
			"elder_id": self.elder.id,
			"doctor_name": "Dr. Asha Rao",
			"clinic_name": "Sunrise Medical Centre",
			"appointment_at": (timezone.now() + timedelta(days=1)).isoformat(),
			"location": "12 Lake Road, Hyderabad",
			"reason": "Routine check-up",
			"notes": "Bring the latest reports",
		}

	def test_family_can_book_free_text_appointment_and_elder_can_view_it(self):
		self.client.force_authenticate(user=self.family_user)
		created = self.client.post(self.url, self.payload, format="json")
		self.assertEqual(created.status_code, status.HTTP_201_CREATED)
		self.assertEqual(created.data["doctor_name"], "Dr. Asha Rao")
		self.assertEqual(created.data["clinic_name"], "Sunrise Medical Centre")
		self.assertEqual(created.data["location"], self.payload["location"])
		self.assertEqual(created.data["elder"]["id"], self.elder.id)
		self.assertEqual(created.data["created_by"]["id"], self.family.id)

		self.client.force_authenticate(user=self.elder_user)
		listed = self.client.get(self.url, {"elder_id": self.elder.id})
		self.assertEqual(listed.status_code, status.HTTP_200_OK)
		self.assertEqual(listed.data[0]["id"], created.data["id"])

	def test_required_address_and_future_time_are_validated(self):
		self.client.force_authenticate(user=self.family_user)
		missing_address = {**self.payload, "location": ""}
		response = self.client.post(self.url, missing_address, format="json")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("location", response.data)

		past = {**self.payload, "appointment_at": (timezone.now() - timedelta(days=1)).isoformat()}
		response = self.client.post(self.url, past, format="json")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertFalse(Appointment.objects.exists())

	def test_family_cannot_book_for_unmanaged_elder(self):
		self.relationship.can_manage_appointments = False
		self.relationship.save(update_fields=["can_manage_appointments"])
		self.client.force_authenticate(user=self.family_user)
		response = self.client.post(self.url, self.payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertFalse(Appointment.objects.exists())

	def test_unrelated_family_cannot_read_or_change_appointments(self):
		appointment = Appointment.objects.create(
			elder=self.elder, created_by=self.family, doctor_name="Dr. Asha Rao",
			clinic_name="Sunrise", location="12 Lake Road",
			appointment_at=timezone.now() + timedelta(days=1),
		)
		other_user = User.objects.create_user(
			email="other-family@example.com", password="test-password-123", role=User.Role.FAMILY,
		)
		FamilyProfile.objects.create(user=other_user)
		self.client.force_authenticate(user=other_user)
		self.assertEqual(self.client.get(reverse("appointment-detail", args=[appointment.id])).status_code, status.HTTP_403_FORBIDDEN)
		self.assertEqual(self.client.patch(reverse("appointment-detail", args=[appointment.id]), {"status": "CANCELLED"}, format="json").status_code, status.HTTP_403_FORBIDDEN)
		appointment.refresh_from_db()
		self.assertEqual(appointment.status, "SCHEDULED")

	def test_delete_cancels_and_preserves_appointment_record(self):
		appointment = Appointment.objects.create(
			elder=self.elder, created_by=self.family, doctor_name="Dr. Asha Rao",
			clinic_name="Sunrise", location="12 Lake Road",
			appointment_at=timezone.now() + timedelta(days=1),
		)
		self.client.force_authenticate(user=self.family_user)
		response = self.client.delete(reverse("appointment-detail", args=[appointment.id]))
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		appointment.refresh_from_db()
		self.assertEqual(appointment.status, "CANCELLED")
