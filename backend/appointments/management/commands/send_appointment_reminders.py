from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from appointments.models import Appointment
from notifications.services import send_appointment_reminder_notifications


class Command(BaseCommand):
    help = "Send appointment reminder notifications to the elder and connected family members when an appointment is within 30 minutes."

    def handle(self, *args, **options):
        now = timezone.now()
        upcoming_window = now + timedelta(minutes=30)

        appointments = Appointment.objects.filter(
            appointment_at__gte=now,
            appointment_at__lte=upcoming_window,
        ).exclude(status__in=["CANCELLED", "CANCELED", "COMPLETED"]).select_related("elder", "elder__user")

        count = 0
        for appointment in appointments:
            sent = send_appointment_reminder_notifications(appointment)
            if sent:
                count += len(sent)

        self.stdout.write(
            self.style.SUCCESS(
                f"Sent {count} appointment reminder notification(s) for upcoming appointments."
            )
        )
