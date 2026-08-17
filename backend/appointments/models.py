from django.db import models

# Create your models here.
from django.db import models

from accounts.models import FamilyProfile, ElderProfile


class Appointment(models.Model):
    doctor_name = models.CharField(
        max_length=150
    )

    clinic_name = models.CharField(
        max_length=200
    )

    appointment_at = models.DateTimeField()

    reason = models.CharField(
        max_length=255,
        blank=True,
        default=""
    )

    notes = models.TextField(
        blank=True,
        default=""
    )

    status = models.CharField(
        max_length=30,
        default="SCHEDULED"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    created_by = models.ForeignKey(
        FamilyProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_appointments",
        db_column="created_by_id"
    )

    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        related_name="appointments",
        db_column="elder_id"
    )

    class Meta:
        db_table = "appointments_appointment"
        ordering = ["appointment_at"]

    def __str__(self):
        return (
            f"{self.doctor_name} - "
            f"{self.elder.user.email}"
        )