from django.urls import reverse
from django.test import SimpleTestCase
from django.test import override_settings
from django.core import mail
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ElderProfile, FamilyElderRelationship, FamilyProfile, PasswordResetOTP, User
from .utils import send_password_reset_otp


class TokenRefreshEndpointTests(SimpleTestCase):
	@patch("rest_framework_simplejwt.serializers.get_user_model")
	def test_refresh_token_returns_new_access_token(self, get_user_model):
		user = User(pk=123)
		refresh_token = str(RefreshToken.for_user(user))
		get_user_model.return_value.objects.get.return_value = user

		response = self.client.post(
			reverse("token-refresh"),
			{"refresh": refresh_token},
			content_type="application/json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("access", response.json())


class AccountDeletionTests(APITestCase):
	def create_user(self, role, email):
		return User.objects.create_user(
			email=email,
			password="test-password-123",
			role=role,
		)

	def test_family_can_delete_own_account(self):
		user = self.create_user(User.Role.FAMILY, "family@example.com")
		FamilyProfile.objects.create(user=user)
		self.client.force_authenticate(user=user)

		response = self.client.delete(reverse("delete-account"))

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(User.objects.filter(pk=user.pk).exists())

	def test_elder_can_delete_own_account(self):
		user = self.create_user(User.Role.ELDER, "elder@example.com")
		ElderProfile.objects.create(user=user)
		self.client.force_authenticate(user=user)

		response = self.client.delete(reverse("delete-account"))

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(User.objects.filter(pk=user.pk).exists())

	def test_family_can_disconnect_elder_without_deleting_account(self):
		family_user = self.create_user(User.Role.FAMILY, "family@example.com")
		family = FamilyProfile.objects.create(user=family_user)
		elder_user = self.create_user(User.Role.ELDER, "elder@example.com")
		elder = ElderProfile.objects.create(user=elder_user)
		relationship = FamilyElderRelationship.objects.create(
			family=family,
			elder=elder,
		)
		self.client.force_authenticate(user=family_user)

		response = self.client.delete(
			reverse("disconnect-elder", args=[elder.pk])
		)

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		relationship.refresh_from_db()
		self.assertFalse(relationship.is_active)
		self.assertTrue(User.objects.filter(pk=elder_user.pk).exists())


class PasswordResetOTPTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			email="reset@example.com", password="Old-password-123", role=User.Role.FAMILY,
			first_name="Test",
		)

	def request_reset(self, email="reset@example.com"):
		return self.client.post(reverse("forgot-password"), {"email": email}, format="json")

	@override_settings(
		EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
		FRONTEND_URL="http://localhost:5173",
	)
	def test_registered_email_receives_reset_code_and_link(self):
		response = self.request_reset()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("may arrive", response.data["message"])
		self.assertEqual(len(mail.outbox), 1)
		sent_email = mail.outbox[0]
		self.assertEqual(sent_email.to, [self.user.email])
		self.assertEqual(sent_email.subject, "CareConnect Password Reset")
		otp_record = PasswordResetOTP.objects.get(user=self.user)
		self.assertIn(otp_record.otp, sent_email.body)
		self.assertIn(f"http://localhost:5173/forgot-password?email=reset%40example.com&otp={otp_record.otp}", sent_email.body)

	@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
	def test_unknown_email_has_same_generic_response_and_sends_no_mail(self):
		known = self.request_reset()
		mail.outbox.clear()
		unknown = self.request_reset("unknown@example.com")
		self.assertEqual(known.status_code, unknown.status_code)
		self.assertEqual(known.data["message"], unknown.data["message"])
		self.assertEqual(len(mail.outbox), 0)

	def test_invalid_email_is_rejected(self):
		response = self.request_reset("not-an-email")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	@override_settings(
		EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
		EMAIL_HOST="smtp.gmail.com",
		EMAIL_PORT=587,
		EMAIL_HOST_USER="",
		EMAIL_HOST_PASSWORD="",
		DEFAULT_FROM_EMAIL="",
	)
	def test_unconfigured_email_service_returns_503_and_prevents_enumeration(self):
		with self.assertLogs("accounts.views", level="ERROR") as captured:
			known_resp = self.request_reset("reset@example.com")
			unknown_resp = self.request_reset("unknown@example.com")

		self.assertEqual(known_resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
		self.assertEqual(unknown_resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
		self.assertIn("Password reset service is temporarily unavailable", known_resp.data["detail"])
		self.assertIn("Password reset email service is not configured", captured.output[0])
		self.assertFalse(PasswordResetOTP.objects.filter(user=self.user).exists())

	@patch("accounts.views.send_password_reset_otp", side_effect=OSError("provider unavailable"))
	def test_email_provider_failure_returns_safe_500_and_removes_otp(self, _send):
		with self.assertLogs("accounts.views", level="ERROR") as captured:
			response = self.request_reset()
		self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
		self.assertIn("Failed to deliver password reset email", captured.output[0])
		self.assertNotIn("provider unavailable", str(response.data))
		self.assertIn("Failed to send password reset email", response.data["detail"])
		self.assertFalse(PasswordResetOTP.objects.filter(user=self.user).exists())

	@patch("accounts.utils.send_mail", return_value=0)
	def test_zero_message_count_is_not_treated_as_success(self, _send_mail):
		with self.assertRaises(RuntimeError):
			send_password_reset_otp(self.user, "123456")

	@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
	def test_verify_otp_endpoint_marks_otp_verified(self):
		otp = PasswordResetOTP.objects.create(
			user=self.user, otp="123456", is_verified=False,
			expires_at=timezone.now() + timedelta(minutes=5),
		)
		response = self.client.post(reverse("verify-password-reset-otp"), {
			"email": self.user.email,
			"otp": "123456",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		otp.refresh_from_db()
		self.assertTrue(otp.is_verified)

	@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
	def test_verify_otp_fails_after_too_many_attempts(self):
		otp = PasswordResetOTP.objects.create(
			user=self.user, otp="123456", is_verified=False,
			attempts=4,
			expires_at=timezone.now() + timedelta(minutes=5),
		)
		response = self.client.post(reverse("verify-password-reset-otp"), {
			"email": self.user.email,
			"otp": "999999",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertFalse(PasswordResetOTP.objects.filter(pk=otp.pk).exists())

	@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
	def test_verified_code_resets_password_and_cannot_be_reused(self):
		otp = PasswordResetOTP.objects.create(
			user=self.user, otp="123456", is_verified=True,
			expires_at=timezone.now() + timedelta(minutes=5),
		)
		payload = {
			"email": self.user.email, "otp": otp.otp,
			"password": "New-password-456", "confirm_password": "New-password-456",
		}
		response = self.client.post(reverse("reset-password"), payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password("New-password-456"))
		self.assertFalse(PasswordResetOTP.objects.filter(pk=otp.pk).exists())

		# Re-using the same OTP must fail
		reused = self.client.post(reverse("reset-password"), payload, format="json")
		self.assertEqual(reused.status_code, status.HTTP_400_BAD_REQUEST)

	def test_expired_or_unverified_code_cannot_reset_password(self):
		otp = PasswordResetOTP.objects.create(
			user=self.user, otp="123456", is_verified=True,
			expires_at=timezone.now() - timedelta(seconds=1),
		)
		response = self.client.post(reverse("reset-password"), {
			"email": self.user.email, "otp": otp.otp,
			"password": "New-password-456", "confirm_password": "New-password-456",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password("Old-password-123"))

	def test_invalid_code_cannot_reset_password(self):
		PasswordResetOTP.objects.create(
			user=self.user, otp="123456", is_verified=True,
			expires_at=timezone.now() + timedelta(minutes=5),
		)
		response = self.client.post(reverse("reset-password"), {
			"email": self.user.email, "otp": "654321",
			"password": "New-password-456", "confirm_password": "New-password-456",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password("Old-password-123"))

	def test_mismatched_confirmation_is_rejected(self):
		response = self.client.post(reverse("reset-password"), {
			"email": self.user.email, "otp": "123456",
			"password": "New-password-456", "confirm_password": "Different-Password-1",
		}, format="json")
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
