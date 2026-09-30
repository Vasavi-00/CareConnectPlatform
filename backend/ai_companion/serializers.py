from rest_framework import serializers

from .models import AIConversation, AIMessage, FamilyCallRequest


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = [
            "id",
            "sender",
            "content",
            "is_private",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = [
            "id",
            "title",
            "elder",
            "created_at",
            "updated_at",
            "messages",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class FamilyCallRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyCallRequest
        fields = [
            "id",
            "elder",
            "requested_to",
            "reason",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "elder",
            "requested_to",
            "status",
            "created_at",
            "updated_at",
        ]