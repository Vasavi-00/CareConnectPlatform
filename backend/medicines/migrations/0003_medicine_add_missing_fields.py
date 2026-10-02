from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medicines", "0002_alter_medicine_options_remove_medicine_instructions_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="medicine",
            name="timing",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="medicine",
            name="prescribed_by",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AddField(
            model_name="medicine",
            name="refill_threshold",
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AlterField(
            model_name="medicine",
            name="frequency",
            field=models.CharField(default="Once daily", max_length=100),
        ),
    ]
