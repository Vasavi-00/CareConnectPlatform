from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("notifications", "0004_sosevent_unique_elder_sos_request_id")]

    operations = [
        migrations.CreateModel(
            name="SOSEventHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(max_length=20)),
                ("detail", models.CharField(blank=True, max_length=240)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="history", to="notifications.sosevent")),
            ],
            options={"ordering": ["created_at", "id"]},
        ),
    ]
