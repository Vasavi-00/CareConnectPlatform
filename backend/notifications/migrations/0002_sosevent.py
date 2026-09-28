from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("notifications", "0001_initial"), ("accounts", "0008_cleanup_old_elderprofile_columns")]

    operations = [
        migrations.CreateModel(
            name="SOSEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("ACTIVATED", "Activated"), ("CONTACTING", "Contacting"), ("RESOLVED", "Resolved"), ("CANCELLED", "Cancelled")], default="ACTIVATED", max_length=20)),
                ("contact_name", models.CharField(blank=True, max_length=100)),
                ("contact_phone", models.CharField(blank=True, max_length=20)),
                ("contact_priority", models.PositiveIntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("elder", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sos_events", to="accounts.elderprofile")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
