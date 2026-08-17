from django.db import models

from accounts.models import ElderProfile


class EmergencyContact(models.Model):
    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        related_name="emergency_contacts",
        db_column="elder_id",
    )

    name = models.CharField(
        max_length=100
    )

    phone = models.CharField(
        max_length=20
    )

    relationship = models.CharField(
        max_length=50
    )

    priority = models.PositiveIntegerField(
        default=1
    )

    can_receive_sos = models.BooleanField(
        default=True
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "emergency_contacts_emergencycontact"
        ordering = ["priority", "name"]

    def __str__(self):
        return f"{self.name} - {self.elder.user.email}"