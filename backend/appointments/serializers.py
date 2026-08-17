from rest_framework import serializers

from accounts.models import ElderProfile, FamilyProfile
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    elder_id = serializers.PrimaryKeyRelatedField(
        source="elder",
        queryset=ElderProfile.objects.all(),
        write_only=True
    )

    elder = serializers.SerializerMethodField(
        read_only=True
    )

    created_by = serializers.SerializerMethodField(
        read_only=True
    )

    class Meta:
        model = Appointment

        fields = [
            "id",
            "elder",
            "elder_id",
            "doctor_name",
            "clinic_name",
            "appointment_at",
            "reason",
            "notes",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "elder",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_elder(self, obj):
        return {
            "id": obj.elder.id,
            "email": obj.elder.user.email,
            "careconnect_id": obj.elder.careconnect_id,
        }

    def get_created_by(self, obj):
        if not obj.created_by:
            return None

        return {
            "id": obj.created_by.id,
            "email": obj.created_by.user.email,
        }

    def validate(self, attrs):
        appointment_at = attrs.get(
            "appointment_at",
            getattr(
                self.instance,
                "appointment_at",
                None
            )
        )

        if not appointment_at:
            raise serializers.ValidationError({
                "appointment_at":
                    "Appointment date and time are required."
            })

        return attrs