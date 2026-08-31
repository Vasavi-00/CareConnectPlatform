import secrets
import string

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


# ============================================================
# CUSTOM USER MANAGER
# ============================================================

class UserManager(BaseUserManager):
    """
    Custom manager for CareConnect users.

    Email is used as the login identifier instead of username.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(
            email=email,
            password=password,
            **extra_fields
        )


# ============================================================
# CARECONNECT ID GENERATOR
# ============================================================

def generate_careconnect_id():
    """
    Generate a unique CareConnect ID.

    Example:
        CC-7K4P92
    """

    characters = string.ascii_uppercase + string.digits

    while True:
        code = "CC-" + "".join(
            secrets.choice(characters)
            for _ in range(6)
        )

        if not ElderProfile.objects.filter(
            careconnect_id=code
        ).exists():
            return code


# ============================================================
# USER
# ============================================================

class User(AbstractUser):

    class Role(models.TextChoices):
        ELDER = "ELDER", "Elder"
        FAMILY = "FAMILY", "Family"

    # Remove username completely
    username = None

    # Email becomes login identifier
    email = models.EmailField(
        unique=True
    )

    role = models.CharField(
        max_length=10,
        choices=Role.choices
    )

    phone = models.CharField(
        max_length=15,
        blank=True
    )

    # Important
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    # Important
    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


# ============================================================
# ELDER PROFILE
# ============================================================

class ElderProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="elder_profile"
    )

    careconnect_id = models.CharField(
        max_length=9,
        unique=True,
        default=generate_careconnect_id,
        editable=False,
        db_index=True,
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    gender = models.CharField(
        max_length=20,
        blank=True
    )

    profile_photo = models.ImageField(
        upload_to="elder_profiles/",
        null=True,
        blank=True
    )

    preferred_language = models.CharField(
        max_length=50,
        default="English"
    )

    address = models.TextField(
        blank=True
    )

    city = models.CharField(
        max_length=100,
        blank=True
    )

    state = models.CharField(
        max_length=100,
        blank=True
    )

    pincode = models.CharField(
        max_length=10,
        blank=True
    )

    emergency_notes = models.TextField(
        blank=True
    )

    medical_notes = models.TextField(
        blank=True
    )

    voice_enabled = models.BooleanField(
        default=True
    )

    font_size = models.CharField(
        max_length=20,
        default="large"
    )

    voice_speed = models.FloatField(
        default=1.0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"Elder Profile - "
            f"{self.user.email} - "
            f"{self.careconnect_id}"
        )


# ============================================================
# FAMILY PROFILE
# ============================================================

class FamilyProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="family_profile"
    )

    profile_photo = models.ImageField(
        upload_to="family_profiles/",
        null=True,
        blank=True
    )

    alternate_phone = models.CharField(
        max_length=15,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    city = models.CharField(
        max_length=100,
        blank=True
    )

    state = models.CharField(
        max_length=100,
        blank=True
    )

    pincode = models.CharField(
        max_length=10,
        blank=True
    )

    notification_enabled = models.BooleanField(
        default=True
    )

    email_notifications = models.BooleanField(
        default=True
    )

    sms_notifications = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Family Profile - {self.user.email}"


# ============================================================
# FAMILY ↔ ELDER RELATIONSHIP
# ============================================================

class FamilyElderRelationship(models.Model):

    family = models.ForeignKey(
        FamilyProfile,
        on_delete=models.CASCADE,
        related_name="elder_relationships"
    )

    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        related_name="family_relationships"
    )

    relationship_type = models.CharField(
        max_length=50,
        blank=True
    )

    is_primary_caregiver = models.BooleanField(
        default=False
    )

    can_manage_medicines = models.BooleanField(
        default=True
    )

    can_manage_appointments = models.BooleanField(
        default=True
    )

    can_manage_emergency_contacts = models.BooleanField(
        default=True
    )

    can_receive_sos = models.BooleanField(
        default=True
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

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["family", "elder"],
                name="unique_family_elder_relationship"
            )
        ]

    def __str__(self):
        return (
            f"{self.family.user.email} → "
            f"{self.elder.user.email}"
        )


# ============================================================
# CONNECTION REQUEST
# ============================================================

class ConnectionRequest(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    family = models.ForeignKey(
        FamilyProfile,
        on_delete=models.CASCADE,
        related_name="connection_requests_sent"
    )

    elder = models.ForeignKey(
        ElderProfile,
        on_delete=models.CASCADE,
        related_name="connection_requests_received"
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    relationship_type = models.CharField(
        max_length=50,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    responded_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.family.user.email} → "
            f"{self.elder.user.email} "
            f"({self.status})"
        )
# ============================================================
# PASSWORD RESET OTP
# ============================================================

class PasswordResetOTP(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_otps",
    )

    otp = models.CharField(
        max_length=6
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    expires_at = models.DateTimeField()

    is_verified = models.BooleanField(
        default=False
    )

    attempts = models.PositiveIntegerField(
        default=0
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Password reset OTP for {self.user.email}"