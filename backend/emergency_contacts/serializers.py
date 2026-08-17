from rest_framework import serializers

from accounts.models import ElderProfile

from .models import EmergencyContact


class EmergencyContactSerializer(
    serializers.ModelSerializer
):
    elder_id = serializers.PrimaryKeyRelatedField(
        source="elder",
        queryset=ElderProfile.objects.all(),
        write_only=True,
        required=True,
    )

    elder = serializers.SerializerMethodField(
        read_only=True
    )

    class Meta:
        model = EmergencyContact

        fields = [
            "id",
            "elder",
            "elder_id",
            "name",
            "phone",
            "relationship",
            "priority",
            "can_receive_sos",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "elder",
            "created_at",
            "updated_at",
        ]

    def get_elder(self, obj):
        return {
            "id": obj.elder.id,
            "email": obj.elder.user.email,
            "careconnect_id": obj.elder.careconnect_id,
        }

    def validate(self, attrs):
        priority = attrs.get(
            "priority",
            getattr(self.instance, "priority", 1)
        )

        if priority < 1:
            raise serializers.ValidationError({
                "priority": "Priority must be at least 1."
            })

        return attrs