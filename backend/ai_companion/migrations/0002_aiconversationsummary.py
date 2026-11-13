from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_repair_password_reset_otp_schema"),
        ("ai_companion", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIConversationSummary",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("summary", models.TextField()),
                ("status", models.CharField(choices=[("DRAFT", "Draft"), ("SHARED", "Shared"), ("REVOKED", "Revoked")], default="DRAFT", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("shared_at", models.DateTimeField(blank=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="summaries", to="ai_companion.aiconversation")),
                ("elder", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ai_summaries", to="accounts.elderprofile")),
                ("recipients", models.ManyToManyField(blank=True, related_name="received_ai_summaries", to="accounts.familyprofile")),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.AddConstraint(
            model_name="aiconversationsummary",
            constraint=models.UniqueConstraint(condition=models.Q(status="DRAFT"), fields=("conversation",), name="unique_ai_conversation_draft_summary"),
        ),
    ]
