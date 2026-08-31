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
        ]

        read_only_fields = fields

    def get_elder(self, obj):
        if not obj.elder:
            return None

        return {
            "id": obj.elder.id,
            "email": obj.elder.user.email,
            "careconnect_id": obj.elder.careconnect_id,
        }