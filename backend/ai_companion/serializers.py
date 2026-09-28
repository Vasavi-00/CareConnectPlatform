from rest_framework import serializers

from .models import AIConversation, AIMessage, FamilyCallRequest


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = [
            "id",
            "conversation",
            "sender",
            "content",
            "is_private",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)
    elder_name = serializers.SerializerMethodField()

    class Meta:
        model = AIConversation
        fields = [
            "id",
            "title",
            "elder",
            "elder_name",
            "created_at",
            "updated_at",
            "messages",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_elder_name(self, obj):
        return (
            f"{obj.elder.user.first_name} {obj.elder.user.last_name}".strip()
            or obj.elder.user.email
        )


class FamilyCallRequestSerializer(serializers.ModelSerializer):
    elder_name = serializers.SerializerMethodField()

    class Meta:
        model = FamilyCallRequest
        fields = [
            "id",
            "elder",
            "elder_name",
            "requested_to",
            "reason",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_elder_name(self, obj):
        return (
            f"{obj.elder.user.first_name} {obj.elder.user.last_name}".strip()
            or obj.elder.user.email
        )
