from django.contrib import admin

from .models import EmergencyContact


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "phone",
        "relationship",
        "priority",
        "elder",
        "can_receive_sos",
        "is_active",
    )

    list_filter = (
        "can_receive_sos",
        "is_active",
        "priority",
    )

    search_fields = (
        "name",
        "phone",
        "relationship",
        "elder__user__email",
        "elder__careconnect_id",
    )

    ordering = (
        "priority",
        "name",
    )