from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import FamilyElderRelationship

from .models import Notification


User = get_user_model()


def create_notification(
    *,
    recipient,
    title,
    message,
    notification_type,
    elder=None,
    priority=Notification.Priority.NORMAL,
    related_object_type="",
    related_object_id=None,
    expires_at=None,
):
    """
    Create one notification for one recipient.
    """

    return Notification.objects.create(
        recipient=recipient,
        elder=elder,
        notification_type=notification_type,
        title=title,
        message=message,
        priority=priority,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
        expires_at=expires_at,
    )


def create_medicine_notification(
    *,
    elder,
    medicine,
):
    """
    Send a medicine notification to the elder.
    """

    return create_notification(
        recipient=elder.user,
        elder=elder,
        notification_type=Notification.NotificationType.MEDICINE,
        title=f"Medicine Reminder: {medicine.name}",
        message=(
            f"It is time to take "
            f"{medicine.name} ({medicine.dosage})."
        ),
        priority=Notification.Priority.NORMAL,
        related_object_type="medicine",
        related_object_id=medicine.id,
    )


def create_appointment_notification(
    *,
    elder,
    appointment,
):
    """
    Send an appointment notification to the elder.
    """

    appointment_time = (
        appointment.appointment_at.strftime(
            "%d %b %Y at %I:%M %p"
        )
    )

    return create_notification(
        recipient=elder.user,
        elder=elder,
        notification_type=(
            Notification.NotificationType.APPOINTMENT
        ),
        title=(
            f"Appointment with "
            f"{appointment.doctor_name}"
        ),
        message=(
            f"You have an appointment with "
            f"{appointment.doctor_name} at "
            f"{appointment.clinic_name} "
            f"on {appointment_time}."
        ),
        priority=Notification.Priority.HIGH,
        related_object_type="appointment",
        related_object_id=appointment.id,
    )


def create_ai_summary_notification(
    *,
    elder,
    summary,
):
    """
    Send an AI conversation summary
    to connected family members.
    """

    relationships = (
        FamilyElderRelationship.objects
        .select_related("family", "family__user")
        .filter(
            elder=elder,
            is_active=True,
        )
    )

    notifications = []

    for relationship in relationships:
        notifications.append(
            create_notification(
                recipient=relationship.family.user,
                elder=elder,
                notification_type=(
                    Notification.NotificationType.AI_SUMMARY
                ),
                title="AI Companion Summary",
                message=summary,
                priority=Notification.Priority.NORMAL,
                related_object_type="ai_summary",
                related_object_id=None,
            )
        )

    return notifications


def create_sos_notification(
    *,
    elder,
    title,
    message,
):
    """
    Notify connected family members
    about an SOS event.
    """

    relationships = (
        FamilyElderRelationship.objects
        .select_related("family", "family__user")
        .filter(
            elder=elder,
            is_active=True,
            can_receive_sos=True,
        )
    )

    notifications = []

    for relationship in relationships:
        notifications.append(
            create_notification(
                recipient=relationship.family.user,
                elder=elder,
                notification_type=(
                    Notification.NotificationType.SOS
                ),
                title=title,
                message=message,
                priority=Notification.Priority.URGENT,
            )
        )

    return notifications


def delete_expired_notifications():
    """
    Optional cleanup utility.

    Removes notifications whose expires_at
    has passed.
    """

    return Notification.objects.filter(
        expires_at__isnull=False,
        expires_at__lt=timezone.now(),
    ).delete()