from django.contrib import admin

from .models import Notification, SOSEvent, SOSEventHistory


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "recipient",
        "elder",
        "notification_type",
        "priority",
        "is_read",
        "created_at",
    )

    list_filter = (
        "notification_type",
        "priority",
        "is_read",
        "created_at",
    )

    search_fields = (
        "recipient__email",
        "elder__user__email",
        "elder__careconnect_id",
        "title",
        "message",
    )

    ordering = (
        "-created_at",
    )


@admin.register(SOSEvent)
class SOSEventAdmin(admin.ModelAdmin):
    list_display = ("id", "elder", "status", "notification_status", "created_at")
    list_filter = ("status", "notification_status", "created_at")
    search_fields = ("elder__user__email", "elder__careconnect_id")


@admin.register(SOSEventHistory)
class SOSEventHistoryAdmin(admin.ModelAdmin):
    list_display = ("event", "status", "detail", "created_at")
