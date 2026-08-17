from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):

    list_display = (
        "doctor_name",
        "clinic_name",
        "elder",
        "appointment_at",
        "status",
        "created_by",
    )

    list_filter = (
        "status",
        "appointment_at",
    )

    search_fields = (
        "doctor_name",
        "clinic_name",
        "elder__user__email",
        "elder__careconnect_id",
        "created_by__user__email",
    )

    ordering = (
        "appointment_at",
    )