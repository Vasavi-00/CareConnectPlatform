from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import ElderProfile, User
from medicines.models import Medicine


class MedicineTakenStockTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="elder@example.com",
            password="StrongPass123!",
            role="ELDER",
        )
        self.elder = ElderProfile.objects.create(user=self.user)
        self.medicine = Medicine.objects.create(
            elder=self.elder,
            name="Vitamin D",
            dosage="1 tablet",
            quantity=5,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_marking_medicine_taken_reduces_stock(self):
        response = self.client.patch(
            f"/api/medicines/{self.medicine.id}/",
            {"taken": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.medicine.refresh_from_db()
        self.assertEqual(self.medicine.quantity, 4)

    def test_taken_action_does_not_drop_below_zero(self):
        self.medicine.quantity = 0
        self.medicine.save(update_fields=["quantity"])

        response = self.client.patch(
            f"/api/medicines/{self.medicine.id}/",
            {"taken": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.medicine.refresh_from_db()
        self.assertEqual(self.medicine.quantity, 0)

    def test_creating_medicine_with_taken_flag_does_not_crash(self):
        response = self.client.post(
            "/api/medicines/",
            {
                "elder_id": self.elder.id,
                "name": "Paracetamol",
                "dosage": "2 tablets",
                "quantity": 10,
                "taken": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Medicine.objects.get(name="Paracetamol").quantity, 9)
