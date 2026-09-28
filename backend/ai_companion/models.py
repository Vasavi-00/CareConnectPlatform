from django.conf import settings
from django.db import models

from accounts.models import ElderProfile


class AIConversation(models.Model):
    title = models.CharField(
        max_length=255,
        default="Daily Companion Chat",
    )
    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
        db_column="elder_id",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "ai_companion_aiconversation"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.title} - {self.elder.user.email}"


class AIMessage(models.Model):
    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="conversation_id",
    )
    sender = models.CharField(
        max_length=20,
    )
    content = models.TextField()
    is_private = models.BooleanField(
        default=False,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "ai_companion_aimessage"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.content[:30]}"


class FamilyCallRequest(models.Model):
    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        related_name="family_call_requests",
        db_column="elder_id",
    )
    requested_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_call_requests",
        db_column="requested_to_id",
    )
    reason = models.CharField(
        max_length=255,
    )
    status = models.CharField(
        max_length=50,
        default="PENDING",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "ai_companion_familycallrequest"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Call request by {self.elder.user.email}: {self.reason}"
