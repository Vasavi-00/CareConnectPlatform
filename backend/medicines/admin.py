from django.contrib import admin

from .models import Medicine


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "elder",
        "dosage",
        "quantity",
        "frequency",
        "doses_per_day",
        "purchase_date",
        "start_date",
        "end_date",
        "low_stock_threshold",
        "is_active",
    )

    list_filter = (
        "frequency",
        "food_timing",
        "is_active",
        "purchase_date",
        "start_date",
        "end_date",
    )

    search_fields = (
        "name",
        "elder__user__email",
        "elder__careconnect_id",
        "notes",
    )

    ordering = (
        "name",
        "start_date",
    )