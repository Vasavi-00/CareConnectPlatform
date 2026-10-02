from unittest.mock import patch

from django.urls import reverse
from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ElderProfile, FamilyElderRelationship, FamilyProfile, User


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
