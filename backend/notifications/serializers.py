from rest_framework import serializers

from .models import Notification


class NotificationSerializer(
    serializers.ModelSerializer
):
    elder = serializers.SerializerMethodField()

    class Meta:
        model = Notification

        fields = [
            "id",
            "elder",
            "notification_type",
            "title",
            "message",
            "priority",
            "is_read",
            "created_at",
            "expires_at",
            "related_object_type",
            "related_object_id",
            "data",
        ]

        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Older AI-summary notifications could contain draft text or an entire
        # transcript. Deliver the summary only through the access-checked API.
        if instance.related_object_type == "ai_summary":
            data["message"] = "A private CareConnect update was shared. Open AI Companion Updates to review it."
            summary_id = (instance.data or {}).get("summary_id")
            data["data"] = {"summary_id": summary_id} if isinstance(summary_id, int) else {}
        return data

    def get_elder(self, obj):
        if not obj.elder:
            return None

        return {
            "id": obj.elder.id,
            "email": obj.elder.user.email,
            "careconnect_id": obj.elder.careconnect_id,
        }
