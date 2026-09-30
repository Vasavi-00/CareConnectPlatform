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

    # Respect the family account's in-app notification preference.
    # Elder notifications remain unaffected by the family setting.
    if getattr(recipient, "role", None) == "FAMILY":
        family_profile = getattr(recipient, "family_profile", None)
        if (
            family_profile
            and not family_profile.notification_enabled
            and priority != Notification.Priority.URGENT
        ):
            return None

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
    Send a medicine reminder notification to the elder.
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


def create_new_medicine_notification(
    *,
    elder,
    medicine,
):
    """
    Send a notification to the elder when a family member adds a new medicine.
    """

    return create_notification(
        recipient=elder.user,
        elder=elder,
        notification_type=Notification.NotificationType.MEDICINE,
        title="New Medicine Added",
        message=(
            f"{medicine.name} {medicine.dosage} has been added "
            f"to your medicine schedule."
        ),
        priority=Notification.Priority.NORMAL,
        related_object_type="medicine",
        related_object_id=medicine.id,
    )


def check_and_create_stock_notifications(
    *,
    elder,
    medicine,
    previous_quantity=None,
):
    """
    Check if medicine stock is low or out of stock, and notify
    connected family members with duplicate alert protection.
    """

    threshold = medicine.low_stock_threshold or medicine.refill_threshold or 5
    current_qty = medicine.quantity or 0

    # Determine alert state
    is_out_of_stock = current_qty <= 0
    is_low_stock = 0 < current_qty <= threshold

    if not is_out_of_stock and not is_low_stock:
        return []

    # Get active connected family members
    relationships = (
        FamilyElderRelationship.objects
        .select_related("family", "family__user")
        .filter(
            elder=elder,
            is_active=True,
        )
    )

    elder_name = (
        elder.user.first_name.strip()
        or elder.user.email.split("@")[0].capitalize()
    )

    notifications = []

    for relationship in relationships:
        family_user = relationship.family.user

        if is_out_of_stock:
            title = "Medicine Out of Stock"
            message = (
                f"{medicine.name} for {elder_name} is out of stock. "
                f"Please arrange a refill."
            )
            priority = Notification.Priority.URGENT

            # Duplicate protection: don't recreate if an unread out-of-stock notification exists
            exists = Notification.objects.filter(
                recipient=family_user,
                related_object_type="medicine",
                related_object_id=medicine.id,
                title=title,
                is_read=False,
            ).exists()

            if not exists:
                notifications.append(
                    create_notification(
                        recipient=family_user,
                        elder=elder,
                        notification_type=Notification.NotificationType.MEDICINE,
                        title=title,
                        message=message,
                        priority=priority,
                        related_object_type="medicine",
                        related_object_id=medicine.id,
                    )
                )

        elif is_low_stock:
            title = "Medicine Running Low"
            message = (
                f"{medicine.name} for {elder_name} is running low. "
                f"Only {current_qty} tablets remain."
            )
            priority = Notification.Priority.HIGH

            # Duplicate protection: don't recreate if an unread low-stock notification exists
            exists = Notification.objects.filter(
                recipient=family_user,
                related_object_type="medicine",
                related_object_id=medicine.id,
                title=title,
                is_read=False,
            ).exists()

            if not exists:
                notifications.append(
                    create_notification(
                        recipient=family_user,
                        elder=elder,
                        notification_type=Notification.NotificationType.MEDICINE,
                        title=title,
                        message=message,
                        priority=priority,
                        related_object_type="medicine",
                        related_object_id=medicine.id,
                    )
                )

    return notifications


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


def create_appointment_updated_notification(
    *,
    elder,
    appointment,
):
    """
    Send an update notification to the elder when their appointment changes.
    """

    appointment_time = (
        appointment.appointment_at.strftime(
            "%d %b %Y at %I:%M %p"
        )
    )

    return create_notification(
        recipient=elder.user,
        elder=elder,
        notification_type=Notification.NotificationType.APPOINTMENT,
        title=f"Appointment Updated: {appointment.doctor_name}",
        message=(
            f"Your appointment with {appointment.doctor_name} at "
            f"{appointment.clinic_name} has been updated to {appointment_time}."
        ),
        priority=Notification.Priority.HIGH,
        related_object_type="appointment",
        related_object_id=appointment.id,
    )


def create_appointment_cancelled_notification(
    *,
    elder,
    appointment,
):
    """
    Send a cancellation notification to the elder when an appointment is cancelled.
    """

    return create_notification(
        recipient=elder.user,
        elder=elder,
        notification_type=Notification.NotificationType.APPOINTMENT,
        title=f"Appointment Cancelled: {appointment.doctor_name}",
        message=(
            f"Your appointment with {appointment.doctor_name} at "
            f"{appointment.clinic_name} has been cancelled."
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