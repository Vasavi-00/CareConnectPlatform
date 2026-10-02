from datetime import timedelta

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

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
		})

		self.assertEqual(validated["appointment_at"], appointment_at)
