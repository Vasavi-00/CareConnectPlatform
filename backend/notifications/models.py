from django.conf import settings
from django.db import models

from accounts.models import ElderProfile


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        MEDICINE = "MEDICINE", "Medicine"
        APPOINTMENT = "APPOINTMENT", "Appointment"
        AI_SUMMARY = "AI_SUMMARY", "AI Summary"
        SOS = "SOS", "SOS"
        SYSTEM = "SYSTEM", "System"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        NORMAL = "NORMAL", "Normal"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    related_object_type = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )

    related_object_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
    )

    data = models.JSONField(
        default=dict,
        blank=True,
    )

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["recipient", "is_read"]
            ),
            models.Index(
                fields=[
                    "recipient",
                    "created_at",
                ]
            ),
            models.Index(
                fields=[
                    "elder",
                    "created_at",
                ]
            ),
        ]

    def __str__(self):
        return (
            f"{self.notification_type} - "
            f"{self.title} - "
            f"{self.recipient.email}"
        )


class SOSEvent(models.Model):
    class Status(models.TextChoices):
        ACTIVATED = "ACTIVATED", "Activated"
        CONTACTING = "CONTACTING", "Contacting"
        RESOLVED = "RESOLVED", "Resolved"
        CANCELLED = "CANCELLED", "Cancelled"

    elder = models.ForeignKey(ElderProfile, on_delete=models.CASCADE, related_name="sos_events")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVATED)
    contact_name = models.CharField(max_length=100, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_priority = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
