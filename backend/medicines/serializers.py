from rest_framework import serializers

from .models import Medicine
from accounts.models import ElderProfile


class MedicineSerializer(serializers.ModelSerializer):
    elder_id = serializers.PrimaryKeyRelatedField(
        source="elder",
        queryset=ElderProfile.objects.all(),
        write_only=True,
        required=False,
    )

    elder = serializers.SerializerMethodField(
        read_only=True
    )

    taken = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
    )

    class Meta:
        model = Medicine

        fields = [
            "id",
            "elder",
            "elder_id",
            "name",
            "dosage",
            "frequency",
            "timing",
            "prescribed_by",
            "purchase_date",
            "start_date",
            "end_date",
            "refill_threshold",
            "low_stock_threshold",
            "is_active",
            "created_at",
            "updated_at",
            "doses_per_day",
            "food_timing",
            "notes",
            "quantity",
            "times",
            "taken",
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

    def create(self, validated_data):
        taken = validated_data.pop("taken", False)
        medicine = super().create(validated_data)

        if taken:
            medicine.quantity = max(0, medicine.quantity - 1)
            medicine.save(update_fields=["quantity"])

        return medicine

    def update(self, instance, validated_data):
        taken = validated_data.pop("taken", False)

        if taken:
            validated_data["quantity"] = max(0, instance.quantity - 1)

        return super().update(instance, validated_data)

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None)
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None)
        )

        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })

        doses_per_day = attrs.get(
            "doses_per_day",
            getattr(self.instance, "doses_per_day", None)
        )

        if doses_per_day is not None and doses_per_day < 1:
            raise serializers.ValidationError({
                "doses_per_day": "Must be at least 1."
            })

        if "low_stock_threshold" in attrs and "refill_threshold" not in attrs:
            attrs["refill_threshold"] = attrs["low_stock_threshold"]
        elif "refill_threshold" in attrs and "low_stock_threshold" not in attrs:
            attrs["low_stock_threshold"] = attrs["refill_threshold"]

        return attrs