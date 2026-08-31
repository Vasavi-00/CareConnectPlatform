from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import (
    User,
    ElderProfile,
    FamilyProfile,
    FamilyElderRelationship,
    ConnectionRequest,
)


# ============================================================
# USER / SIGNUP
# ============================================================

class SignupSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "password",
            "confirm_password",
            "role",
        ]

        read_only_fields = [
            "id",
        ]

    # --------------------------------------------------------
    # EMAIL VALIDATION
    # --------------------------------------------------------

    def validate_email(self, value):
        value = value.lower().strip()

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    # --------------------------------------------------------
    # ROLE VALIDATION
    # --------------------------------------------------------

    def validate_role(self, value):

        if value not in [
            User.Role.ELDER,
            User.Role.FAMILY,
        ]:
            raise serializers.ValidationError(
                "Role must be ELDER or FAMILY."
            )

        return value

    # --------------------------------------------------------
    # PASSWORD + CONFIRM PASSWORD VALIDATION
    # --------------------------------------------------------

    def validate(self, attrs):

        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        # Check password confirmation
        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        # Prepare temporary user object so Django's password
        # validators can check things such as:
        # - similarity to username/email
        # - common passwords
        # - minimum length
        # - numeric-only passwords
        temp_user = User(
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )

        try:
            validate_password(password, user=temp_user)
        except serializers.ValidationError:
            raise

        except Exception as exc:
            raise serializers.ValidationError({
                "password": list(exc.messages)
            })

        return attrs

    # --------------------------------------------------------
    # CREATE USER
    # --------------------------------------------------------

    @transaction.atomic
    def create(self, validated_data):

        # confirm_password is only for validation.
        # NEVER store it in the database.
        validated_data.pop("confirm_password")

        password = validated_data.pop("password")

        # Create the user directly rather than using
        # create_user(), avoiding the username issue you
        # encountered earlier.
        user = User(
            **validated_data
        )

        # Django hashes the password securely.
        user.set_password(password)

        user.save()

        # ----------------------------------------------------
        # CREATE ROLE-SPECIFIC PROFILE
        # ----------------------------------------------------

        if user.role == User.Role.ELDER:

            ElderProfile.objects.create(
                user=user
            )

        elif user.role == User.Role.FAMILY:

            FamilyProfile.objects.create(
                user=user
            )

        return user


# ============================================================
# USER RESPONSE
# ============================================================

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
        ]


# ============================================================
# LOGIN
# ============================================================

class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):

        email = attrs["email"].lower().strip()
        password = attrs["password"]

        user = authenticate(
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        attrs["user"] = user

        return attrs


# ============================================================
# ELDER PROFILE
# ============================================================

class ElderProfileSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    careconnect_id = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = ElderProfile

        fields = [
            "id",
            "careconnect_id",
            "email",
            "first_name",
            "last_name",
            "date_of_birth",
            "gender",
            "profile_photo",
            "preferred_language",
            "address",
            "city",
            "state",
            "pincode",
            "emergency_notes",
            "medical_notes",
            "voice_enabled",
            "font_size",
            "voice_speed",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "careconnect_id",
            "created_at",
            "updated_at",
        ]


# ============================================================
# FAMILY PROFILE
# ============================================================

class FamilyProfileSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    class Meta:
        model = FamilyProfile

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "profile_photo",
            "alternate_phone",
            "address",
            "city",
            "state",
            "pincode",
            "notification_enabled",
            "email_notifications",
            "sms_notifications",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_at",
            "updated_at",
        ]


# ============================================================
# FAMILY-ELDER RELATIONSHIP
# ============================================================

class FamilyElderRelationshipSerializer(
    serializers.ModelSerializer
):

    family_name = serializers.SerializerMethodField()

    family_email = serializers.SerializerMethodField()

    elder_name = serializers.SerializerMethodField()

    elder_email = serializers.SerializerMethodField()

    careconnect_id = serializers.CharField(
        source="elder.careconnect_id",
        read_only=True,
    )

    class Meta:
        model = FamilyElderRelationship

        fields = [
            "id",

            "family",
            "family_name",
            "family_email",

            "elder",
            "elder_name",
            "elder_email",
            "careconnect_id",

            "relationship_type",
            "is_primary_caregiver",

            "can_manage_medicines",
            "can_manage_appointments",
            "can_manage_emergency_contacts",
            "can_receive_sos",

            "is_active",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "family",
            "elder",
            "created_at",
            "updated_at",
        ]

    def get_family_name(self, obj):

        return (
            f"{obj.family.user.first_name} "
            f"{obj.family.user.last_name}"
        ).strip()

    def get_family_email(self, obj):

        return obj.family.user.email

    def get_elder_name(self, obj):

        return (
            f"{obj.elder.user.first_name} "
            f"{obj.elder.user.last_name}"
        ).strip()

    def get_elder_email(self, obj):

        return obj.elder.user.email


# ============================================================
# CONNECTION REQUEST - CREATE
# ============================================================

class ConnectionRequestCreateSerializer(
    serializers.ModelSerializer
):

    careconnect_id = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = ConnectionRequest

        fields = [
            "id",
            "careconnect_id",
            "relationship_type",
        ]

    def validate_careconnect_id(self, value):

        value = value.strip().upper()

        try:

            elder = ElderProfile.objects.get(
                careconnect_id=value
            )

        except ElderProfile.DoesNotExist:

            raise serializers.ValidationError(
                "No elder found with this CareConnect ID."
            )

        self.context["elder"] = elder

        return value

    def validate(self, attrs):

        request = self.context["request"]

        family = request.user.family_profile

        elder = self.context["elder"]

        # ----------------------------------------------------
        # CHECK EXISTING ACTIVE CONNECTION
        # ----------------------------------------------------

        if FamilyElderRelationship.objects.filter(
            family=family,
            elder=elder,
            is_active=True,
        ).exists():

            raise serializers.ValidationError(
                "You are already connected to this elder."
            )

        # ----------------------------------------------------
        # CHECK PENDING REQUEST
        # ----------------------------------------------------

        if ConnectionRequest.objects.filter(
            family=family,
            elder=elder,
            status=ConnectionRequest.Status.PENDING,
        ).exists():

            raise serializers.ValidationError(
                "A connection request is already pending."
            )

        return attrs
    def validate_phone(self, value):
        value = value.strip()

        if not value:
            return value

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) != 10:
            raise serializers.ValidationError(
                "Phone number must contain exactly 10 digits."
            )

        return value

    def create(self, validated_data):

        elder = self.context["elder"]

        family = (
            self.context["request"]
            .user
            .family_profile
        )

        validated_data.pop("careconnect_id")

        return ConnectionRequest.objects.create(
            family=family,
            elder=elder,
            **validated_data,
        )


# ============================================================
# CONNECTION REQUEST - RESPONSE
# ============================================================

class ConnectionRequestSerializer(
    serializers.ModelSerializer
):

    family_name = serializers.SerializerMethodField()

    family_email = serializers.SerializerMethodField()

    elder_name = serializers.SerializerMethodField()

    elder_email = serializers.SerializerMethodField()

    careconnect_id = serializers.CharField(
        source="elder.careconnect_id",
        read_only=True,
    )

    class Meta:
        model = ConnectionRequest

        fields = [
            "id",

            "family",
            "family_name",
            "family_email",

            "elder",
            "elder_name",
            "elder_email",
            "careconnect_id",

            "status",
            "relationship_type",

            "created_at",
            "responded_at",
        ]

        read_only_fields = [
            "family",
            "elder",
            "status",
            "created_at",
            "responded_at",
        ]

    def get_family_name(self, obj):

        return (
            f"{obj.family.user.first_name} "
            f"{obj.family.user.last_name}"
        ).strip()

    def get_family_email(self, obj):

        return obj.family.user.email

    def get_elder_name(self, obj):

        return (
            f"{obj.elder.user.first_name} "
            f"{obj.elder.user.last_name}"
        ).strip()

    def get_elder_email(self, obj):

        return obj.elder.user.email


# ============================================================
# CONNECTION REQUEST ACTION
# ============================================================

class ConnectionRequestActionSerializer(
    serializers.Serializer
):

    action = serializers.ChoiceField(
        choices=[
            "ACCEPT",
            "REJECT",
        ]
    )

# ============================================================
# FORGOT PASSWORD
# ============================================================

class ForgotPasswordSerializer(serializers.Serializer):

    email = serializers.EmailField()

    def validate_email(self, value):

        return value.lower().strip()


# ============================================================
# VERIFY PASSWORD RESET OTP
# ============================================================

class VerifyPasswordResetOTPSerializer(serializers.Serializer):

    email = serializers.EmailField()

    otp = serializers.CharField(
        min_length=6,
        max_length=6,
    )

    def validate_email(self, value):

        return value.lower().strip()

    def validate_otp(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "OTP must contain only numbers."
            )

        return value


# ============================================================
# RESET PASSWORD
# ============================================================

class ResetPasswordSerializer(serializers.Serializer):

    email = serializers.EmailField()

    otp = serializers.CharField(
        min_length=6,
        max_length=6,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate_email(self, value):

        return value.lower().strip()

    def validate_otp(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "OTP must contain only numbers."
            )

        return value

    def validate(self, attrs):

        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        # ----------------------------------------------------
        # PASSWORD MATCH
        # ----------------------------------------------------

        if password != confirm_password:

            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })

        # ----------------------------------------------------
        # FIND USER
        # ----------------------------------------------------

        email = attrs.get("email")

        try:

            user = User.objects.get(
                email=email
            )

        except User.DoesNotExist:

            raise serializers.ValidationError({
                "email":
                    "Unable to process this request."
            })

        # ----------------------------------------------------
        # DJANGO PASSWORD VALIDATION
        # ----------------------------------------------------

        try:

            validate_password(
                password,
                user=user,
            )

        except serializers.ValidationError:

            raise

        attrs["user"] = user

        return attrs