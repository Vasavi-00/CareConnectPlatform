from django.db import models

from accounts.models import ElderProfile


class Medicine(models.Model):
    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        related_name="medicines",
        db_column="elder_id",
    )

    name = models.CharField(
        max_length=100
    )

    dosage = models.CharField(
        max_length=50
    )

    frequency = models.CharField(
        max_length=20
    )

    purchase_date = models.DateField(
        null=True,
        blank=True
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True
    )

    low_stock_threshold = models.PositiveIntegerField(
        default=5
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    doses_per_day = models.PositiveIntegerField(
        default=1
    )

    food_timing = models.CharField(
        max_length=10
    )

    notes = models.CharField(
        max_length=200,
        blank=True,
        default=""
    )

    quantity = models.PositiveIntegerField(
        default=0
    )

    times = models.JSONField(
        default=list
    )

    class Meta:
        db_table = "medicines_medicine"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} - {self.elder.user.email}"