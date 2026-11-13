from django.db import transaction
import logging
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User,
    ElderProfile,
    FamilyProfile,
    FamilyElderRelationship,
    ConnectionRequest,
    PasswordResetOTP,
)

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail

from .serializers import (
    SignupSerializer,
    LoginSerializer,
    UserSerializer,
    ElderProfileSerializer,
    FamilyProfileSerializer,
    FamilyElderRelationshipSerializer,
    ConnectionRequestCreateSerializer,
    ConnectionRequestSerializer,
    ConnectionRequestActionSerializer,
    ForgotPasswordSerializer,
    VerifyPasswordResetOTPSerializer,
    ResetPasswordSerializer,
    SupportMessageSerializer,
)

from .utils import (
    create_password_reset_otp,
    send_password_reset_otp,
    validate_email_configuration,
)

logger = logging.getLogger(__name__)


# ============================================================
# HELPER
# ============================================================

def get_tokens_for_user(user):
    """
    Generate JWT access and refresh tokens for a user.
    """

    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ============================================================
# SIGNUP
# ============================================================

class SignupView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = SignupSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()

        tokens = get_tokens_for_user(user)

        return Response(
            {
                "message": "Account created successfully.",

                "user": UserSerializer(user).data,

                "access": tokens["access"],

                "refresh": tokens["refresh"],
            },

            status=status.HTTP_201_CREATED
        )


# ============================================================
# LOGIN
# ============================================================

class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data["user"]

        tokens = get_tokens_for_user(user)

        return Response(
            {
                "message": "Login successful.",

                "user": UserSerializer(user).data,

                "access": tokens["access"],

                "refresh": tokens["refresh"],
            },

            status=status.HTTP_200_OK
        )


# ============================================================
# CURRENT USER
# ============================================================

class MeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response(
            {
                "user": UserSerializer(
                    request.user
                ).data
            }
        )


class DeleteAccountView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        if request.user.is_staff or request.user.is_superuser:
            return Response(
                {"detail": "Staff accounts cannot be deleted through this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.user.role not in (User.Role.FAMILY, User.Role.ELDER):
            return Response(
                {"detail": "This account cannot be deleted through this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# ELDER PROFILE
# ============================================================

class ElderProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != User.Role.ELDER:

            return Response(
                {
                    "error": "Only elders can access this."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        profile = request.user.elder_profile

        return Response(
            ElderProfileSerializer(profile).data
        )

    def patch(self, request):

        if request.user.role != User.Role.ELDER:

            return Response(
                {
                    "error": "Only elders can update this."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        profile = request.user.elder_profile

        serializer = ElderProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        return Response(
            serializer.data
        )


class FamilyElderProfileUpdateView(APIView):
    """Allow a family member to update an elder they are actively connected to."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, elder_id):
        if request.user.role != User.Role.FAMILY:
            return Response(
                {"error": "Only family members can update a connected elder profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            family = request.user.family_profile
        except FamilyProfile.DoesNotExist:
            return Response(
                {"error": "Family profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        relationship = FamilyElderRelationship.objects.filter(
            family=family,
            elder_id=elder_id,
            is_active=True,
        ).select_related("elder__user").first()
        if relationship is None:
            return Response(
                {"error": "You are not actively connected to this elder."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ElderProfileSerializer(
            relationship.elder,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class DisconnectElderView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, elder_id):
        if request.user.role != User.Role.FAMILY:
            return Response(
                {"detail": "Only family members can disconnect an elder."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            family = request.user.family_profile
        except FamilyProfile.DoesNotExist:
            return Response(
                {"detail": "Family profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        relationship = FamilyElderRelationship.objects.filter(
            family=family,
            elder_id=elder_id,
            is_active=True,
        ).first()
        if relationship is None:
            return Response(
                {"detail": "This elder is not connected to your family account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        relationship.is_active = False
        relationship.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# FAMILY PROFILE
# ============================================================

class FamilyProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "error": "Only family members can access this."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        profile = request.user.family_profile

        return Response(
            FamilyProfileSerializer(profile).data
        )

    def patch(self, request):

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "error": "Only family members can update this."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        profile = request.user.family_profile

        serializer = FamilyProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        return Response(
            serializer.data
        )

class ConnectElderView(APIView):
    """
    Directly connect a family member to an elder
    using the elder's CareConnect ID.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):

        # -------------------------------------------------
        # 1. Only FAMILY users can connect to elders
        # -------------------------------------------------

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "detail": (
                        "Only family members can "
                        "connect to elders."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )


        # -------------------------------------------------
        # 2. Get CareConnect ID
        # -------------------------------------------------

        careconnect_id = (
            request.data.get("careconnect_id")
        )


        if not careconnect_id:

            return Response(
                {
                    "detail": (
                        "CareConnect ID is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        careconnect_id = (
            str(careconnect_id)
            .strip()
            .upper()
        )


        # -------------------------------------------------
        # 3. Find the elder
        # -------------------------------------------------

        try:

            elder = (
                ElderProfile.objects
                .select_related("user")
                .get(
                    careconnect_id=careconnect_id
                )
            )

        except ElderProfile.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "No elder found with "
                        f"CareConnect ID {careconnect_id}."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        # -------------------------------------------------
        # 4. Get family profile
        # -------------------------------------------------

        try:

            family = request.user.family_profile

        except FamilyProfile.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "Family profile not found."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        # -------------------------------------------------
        # 5. Prevent duplicate connection
        # -------------------------------------------------

        relationship = (
            FamilyElderRelationship.objects.filter(
                family=family,
                elder=elder,
            ).first()
        )


        if relationship:

            if relationship.is_active:

                return Response(
                    {
                        "detail": (
                            "You are already connected "
                            "to this elder."
                        ),
                        "connected": True,
                        "elder": {
                            "id": elder.id,
                            "careconnect_id": (
                                elder.careconnect_id
                            ),
                            "name": (
                                f"{elder.user.first_name} "
                                f"{elder.user.last_name}"
                            ).strip()
                            or elder.user.email,
                        },
                    },
                    status=status.HTTP_200_OK,
                )


            # Reactivate an old inactive connection

            relationship.is_active = True
            relationship.save(
                update_fields=[
                    "is_active",
                    "updated_at",
                ]
            )

        else:

            # -------------------------------------------------
            # 6. Create new relationship
            # -------------------------------------------------

            relationship = (
                FamilyElderRelationship.objects.create(
                    family=family,
                    elder=elder,
                    is_active=True,
                )
            )


        # -------------------------------------------------
        # 7. Return connected elder
        # -------------------------------------------------

        full_name = (
            f"{elder.user.first_name} "
            f"{elder.user.last_name}"
        ).strip()


        return Response(
            {
                "detail": (
                    "Elder connected successfully."
                ),

                "connected": True,

                "elder": {
                    "id": elder.id,

                    "careconnect_id":
                        elder.careconnect_id,

                    "name":
                        full_name
                        or elder.user.email,

                    "first_name": elder.user.first_name,

                    "last_name": elder.user.last_name,

                    "city":
                        elder.city,

                    "state":
                        elder.state,

                    "preferred_language":
                        elder.preferred_language,

                    "profile_photo": (
                        request.build_absolute_uri(
                            elder.profile_photo.url
                        )
                        if elder.profile_photo
                        else None
                    ),
                },
            },
            status=status.HTTP_201_CREATED,
        )



# ============================================================
# SEND CONNECTION REQUEST
# ============================================================

class ConnectionRequestCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "error": (
                        "Only family members can "
                        "send connection requests."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ConnectionRequestCreateSerializer(
            data=request.data,
            context={
                "request": request
            }
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        connection_request = serializer.save()

        return Response(
            ConnectionRequestSerializer(
                connection_request
            ).data,

            status=status.HTTP_201_CREATED
        )

# ============================================================
# FIND ELDER BY CARECONNECT ID
# ============================================================

class FindElderView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, careconnect_id):

        # ----------------------------------------------------
        # ONLY FAMILY MEMBERS CAN SEARCH FOR ELDERS
        # ----------------------------------------------------

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "error": (
                        "Only family members can "
                        "search for elders."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ----------------------------------------------------
        # CLEAN CARECONNECT ID
        # ----------------------------------------------------

        careconnect_id = careconnect_id.strip().upper()

        # ----------------------------------------------------
        # FIND ELDER
        # ----------------------------------------------------

        try:

            elder = (
                ElderProfile.objects
                .select_related("user")
                .get(
                    careconnect_id=careconnect_id
                )
            )

        except ElderProfile.DoesNotExist:

            return Response(
                {
                    "error": (
                        "No elder found with this "
                        "CareConnect ID."
                    )
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------------------------
        # CHECK IF ALREADY CONNECTED
        # ----------------------------------------------------

        family = request.user.family_profile

        already_connected = (
            FamilyElderRelationship.objects.filter(
                family=family,
                elder=elder,
                is_active=True
            ).exists()
        )

        if already_connected:

            return Response(
                {
                    "error": (
                        "You are already connected "
                        "to this elder."
                    ),
                    "connected": True
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CHECK PENDING REQUEST
        # ----------------------------------------------------

        request_pending = (
            ConnectionRequest.objects.filter(
                family=family,
                elder=elder,
                status=ConnectionRequest.Status.PENDING
            ).exists()
        )

        # ----------------------------------------------------
        # RETURN SAFE ELDER PREVIEW
        # ----------------------------------------------------

        return Response(
            {
                "careconnect_id": elder.careconnect_id,
                "name": (
                    f"{elder.user.first_name} "
                    f"{elder.user.last_name}"
                ).strip(),
                "city": elder.city,
                "state": elder.state,
                "preferred_language": (
                    elder.preferred_language
                ),
                "profile_photo": (
                    request.build_absolute_uri(
                        elder.profile_photo.url
                    )
                    if elder.profile_photo
                    else None
                ),
                "request_pending": request_pending,
                "connected": False
            },
            status=status.HTTP_200_OK
        )
# ============================================================
# FAMILY SENT CONNECTION REQUESTS
# ============================================================

class FamilyConnectionRequestsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "error": (
                        "Only family members can "
                        "access this."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        family = request.user.family_profile

        requests = (
            ConnectionRequest.objects
            .filter(
                family=family
            )
            .select_related(
                "family__user",
                "elder__user"
            )
            .order_by("-created_at")
        )

        serializer = ConnectionRequestSerializer(
            requests,
            many=True
        )

        return Response(
            serializer.data
        )

class FamilyConnectedEldersView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "error": (
                        "Only family members can "
                        "access this."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:

            family = request.user.family_profile

        except FamilyProfile.DoesNotExist:

            return Response(
                {
                    "error": "Family profile not found."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        relationships = (
            FamilyElderRelationship.objects
            .filter(
                family=family,
                is_active=True
            )
            .select_related(
                "elder__user"
            )
            .order_by("-created_at")
        )

        result = []

        for relationship in relationships:

            elder = relationship.elder

            full_name = (
                f"{elder.user.first_name} "
                f"{elder.user.last_name}"
            ).strip()

            result.append(
                {
                    # IMPORTANT:
                    # This is ElderProfile.id,
                    # NOT FamilyElderRelationship.id
                    "id": elder.id,

                    "careconnect_id":
                        elder.careconnect_id,

                    "name":
                        full_name
                        or elder.user.email,

                    "first_name": elder.user.first_name,

                    "last_name": elder.user.last_name,

                    "email":
                        elder.user.email,

                    "city":
                        elder.city,

                    "state":
                        elder.state,

                    "preferred_language":
                        elder.preferred_language,

                    "profile_photo": (
                        request.build_absolute_uri(
                            elder.profile_photo.url
                        )
                        if elder.profile_photo
                        else None
                    ),

                    # Relationship information
                    "relationship_type":
                        relationship.relationship_type,

                    "is_primary_caregiver":
                        relationship.is_primary_caregiver,

                    "can_manage_medicines":
                        relationship.can_manage_medicines,

                    "can_manage_appointments":
                        relationship.can_manage_appointments,

                    "can_manage_emergency_contacts":
                        relationship.can_manage_emergency_contacts,

                    "can_receive_sos":
                        relationship.can_receive_sos,

                    "is_active":
                        relationship.is_active,

                    # Keep relationship ID available separately
                    "relationship_id":
                        relationship.id,
                }
            )

        return Response(
            result,
            status=status.HTTP_200_OK
        )
# ============================================================
# ELDER RECEIVED CONNECTION REQUESTS
# ============================================================

class ElderConnectionRequestsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != User.Role.ELDER:

            return Response(
                {
                    "error": (
                        "Only elders can "
                        "access this."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        elder = request.user.elder_profile

        requests = (
            ConnectionRequest.objects
            .filter(
                elder=elder
            )
            .select_related(
                "family__user",
                "elder__user"
            )
            .order_by("-created_at")
        )

        serializer = ConnectionRequestSerializer(
            requests,
            many=True
        )

        return Response(
            serializer.data
        )


# ============================================================
# ACCEPT / REJECT CONNECTION REQUEST
# ============================================================

class ConnectionRequestActionView(APIView):

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, request_id):

        # ----------------------------------------------------
        # ONLY ELDER CAN ACCEPT / REJECT
        # ----------------------------------------------------

        if request.user.role != User.Role.ELDER:

            return Response(
                {
                    "error": (
                        "Only elders can respond "
                        "to connection requests."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ----------------------------------------------------
        # FIND REQUEST
        # ----------------------------------------------------

        try:

            connection_request = (
                ConnectionRequest.objects
                .select_related(
                    "family__user",
                    "elder__user"
                )
                .get(
                    id=request_id,
                    elder=request.user.elder_profile
                )
            )

        except ConnectionRequest.DoesNotExist:

            return Response(
                {
                    "error": (
                        "Connection request not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------------------------
        # CHECK REQUEST STATUS
        # ----------------------------------------------------

        if connection_request.status != (
            ConnectionRequest.Status.PENDING
        ):

            return Response(
                {
                    "error": (
                        "This request has already "
                        "been processed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # VALIDATE ACTION
        # ----------------------------------------------------

        serializer = ConnectionRequestActionSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        action = serializer.validated_data["action"]

        # ====================================================
        # REJECT
        # ====================================================

        if action == "REJECT":

            connection_request.status = (
                ConnectionRequest.Status.REJECTED
            )

            connection_request.responded_at = (
                timezone.now()
            )

            connection_request.save(
                update_fields=[
                    "status",
                    "responded_at"
                ]
            )

            return Response(
                {
                    "message": (
                        "Connection request rejected."
                    )
                },
                status=status.HTTP_200_OK
            )

        # ====================================================
        # ACCEPT
        # ====================================================

        connection_request.status = (
            ConnectionRequest.Status.ACCEPTED
        )

        connection_request.responded_at = (
            timezone.now()
        )

        connection_request.save(
            update_fields=[
                "status",
                "responded_at"
            ]
        )

        # ----------------------------------------------------
        # CREATE FAMILY-ELDER RELATIONSHIP
        # ----------------------------------------------------

        relationship, created = (
            FamilyElderRelationship.objects
            .get_or_create(
                family=connection_request.family,
                elder=connection_request.elder,

                defaults={
                    "relationship_type":
                        connection_request.relationship_type,

                    "is_active": True,
                }
            )
        )

        # ----------------------------------------------------
        # IF RELATIONSHIP ALREADY EXISTS
        # ----------------------------------------------------

        if not created:

            relationship.is_active = True

            if connection_request.relationship_type:

                relationship.relationship_type = (
                    connection_request.relationship_type
                )

            relationship.save()

        return Response(
            {
                "message": (
                    "Connection request accepted."
                ),

                "relationship":
                    FamilyElderRelationshipSerializer(
                        relationship
                    ).data
            },

            status=status.HTTP_200_OK
        )


# ============================================================
# FAMILY CONNECTED ELDERS
# ============================================================

class FamilyConnectedEldersView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != User.Role.FAMILY:

            return Response(
                {
                    "error": (
                        "Only family members can "
                        "access this."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        family = request.user.family_profile

        relationships = (
            FamilyElderRelationship.objects
            .filter(
                family=family,
                is_active=True
            )
            .select_related(
                "family__user",
                "elder__user"
            )
            .order_by("-created_at")
        )

        serializer = (
            FamilyElderRelationshipSerializer(
                relationships,
                many=True
            )
        )

        return Response(
            serializer.data
        )


# ============================================================
# ELDER CONNECTED FAMILY MEMBERS
# ============================================================

class ElderConnectedFamilyView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != User.Role.ELDER:

            return Response(
                {
                    "error": (
                        "Only elders can "
                        "access this."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        elder = request.user.elder_profile

        relationships = (
            FamilyElderRelationship.objects
            .filter(
                elder=elder,
                is_active=True
            )
            .select_related(
                "family__user",
                "elder__user"
            )
            .order_by("-created_at")
        )

        serializer = (
            FamilyElderRelationshipSerializer(
                relationships,
                many=True
            )
        )

        return Response(
            serializer.data
        )


# ============================================================
# FORGOT PASSWORD
# ============================================================

class ForgotPasswordView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = ForgotPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        email = serializer.validated_data["email"].strip().lower()

        # ----------------------------------------------------
        # SERVICE CONFIGURATION CHECK
        #
        # Validate that the email service is ready before proceeding.
        # Both registered and unregistered emails receive 503 if unconfigured.
        # ----------------------------------------------------
        is_configured, reason = validate_email_configuration()
        if not is_configured:
            logger.error("Password reset email service is not configured: %s", reason)
            return Response(
                {
                    "detail": "Password reset service is temporarily unavailable. Please try again later."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # ----------------------------------------------------
        # SECURITY
        #
        # Never reveal whether the email exists.
        # ----------------------------------------------------

        try:

            user = User.objects.get(
                email__iexact=email
            )

        except User.DoesNotExist:

            logger.info("Password reset requested for unregistered email.")
            return Response(
                {
                    "message": "We cannot confirm email delivery. If this address belongs to an account, a verification code may arrive shortly. Please check your inbox and spam folder."
                },
                status=status.HTTP_200_OK
            )

        # ----------------------------------------------------
        # CREATE OTP & SEND EMAIL
        # ----------------------------------------------------

        password_reset_otp = None
        try:
            password_reset_otp = create_password_reset_otp(user)
            send_password_reset_otp(user, password_reset_otp.otp)
        except Exception as exc:
            # Do not leave an OTP active if the user could not receive it.
            if password_reset_otp is not None:
                try:
                    password_reset_otp.delete()
                except Exception:
                    logger.exception("Could not remove an undelivered password reset code")
            logger.error("Failed to deliver password reset email for user id %s: %s", user.pk, exc, exc_info=True)
            return Response(
                {
                    "detail": "Failed to send password reset email. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "We cannot confirm email delivery. If this address belongs to an account, a verification code may arrive shortly. Please check your inbox and spam folder."
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# VERIFY PASSWORD RESET OTP
# ============================================================

class VerifyPasswordResetOTPView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = (
            VerifyPasswordResetOTPSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        email = serializer.validated_data["email"]

        otp = serializer.validated_data["otp"]

        # ----------------------------------------------------
        # FIND USER
        # ----------------------------------------------------

        try:

            user = User.objects.get(
                email=email
            )

        except User.DoesNotExist:

            return Response(
                {
                    "detail": (
                        "Invalid or expired OTP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # FIND LATEST UNVERIFIED OTP
        # ----------------------------------------------------

        otp_record = (
            PasswordResetOTP.objects
            .filter(
                user=user,
                is_verified=False
            )
            .order_by("-created_at")
            .first()
        )

        if not otp_record:

            return Response(
                {
                    "detail": (
                        "Invalid or expired OTP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CHECK EXPIRATION
        # ----------------------------------------------------

        if timezone.now() > otp_record.expires_at:

            otp_record.delete()

            return Response(
                {
                    "detail": (
                        "OTP has expired. "
                        "Please request a new OTP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CHECK ATTEMPTS
        # ----------------------------------------------------

        if otp_record.attempts >= 5:

            otp_record.delete()

            return Response(
                {
                    "detail": (
                        "Too many incorrect attempts. "
                        "Please request a new OTP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CHECK OTP
        # ----------------------------------------------------

        if otp_record.otp != otp:

            otp_record.attempts += 1

            if otp_record.attempts >= 5:
                otp_record.delete()
                return Response(
                    {
                        "detail": (
                            "Too many incorrect attempts. "
                            "Please request a new OTP."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            otp_record.save(
                update_fields=[
                    "attempts"
                ]
            )

            return Response(
                {
                    "detail": "Invalid OTP."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # OTP VERIFIED
        # ----------------------------------------------------

        otp_record.is_verified = True

        otp_record.save(
            update_fields=[
                "is_verified"
            ]
        )

        return Response(
            {
                "message": (
                    "OTP verified successfully."
                )
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# RESET PASSWORD
# ============================================================

class ResetPasswordView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = ResetPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        email = serializer.validated_data["email"]

        otp = serializer.validated_data["otp"]

        password = serializer.validated_data["password"]

        user = serializer.validated_data["user"]

        # ----------------------------------------------------
        # FIND VERIFIED OTP
        # ----------------------------------------------------

        otp_record = (
            PasswordResetOTP.objects
            .filter(
                user=user,
                otp=otp,
                is_verified=True
            )
            .order_by("-created_at")
            .first()
        )

        if not otp_record:

            return Response(
                {
                    "detail": (
                        "OTP verification required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CHECK EXPIRATION AGAIN
        # ----------------------------------------------------

        if timezone.now() > otp_record.expires_at:

            otp_record.delete()

            return Response(
                {
                    "detail": (
                        "OTP has expired. "
                        "Please request a new OTP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------
        # CHANGE PASSWORD
        # ----------------------------------------------------

        user.set_password(password)

        user.save(
            update_fields=[
                "password"
            ]
        )

        # ----------------------------------------------------
        # DELETE USED OTP
        # ----------------------------------------------------

        otp_record.delete()

        return Response(
            {
                "message": (
                    "Password reset successfully. "
                    "You can now sign in."
                )
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# SUPPORT MESSAGE
# ============================================================

class SupportMessageView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = SupportMessageSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        name = serializer.validated_data["name"]
        user_email = serializer.validated_data["email"].strip().lower()
        message = serializer.validated_data["message"]

        support_destination = (
            getattr(settings, "DEFAULT_FROM_EMAIL", "").strip()
            or getattr(settings, "EMAIL_HOST_USER", "").strip()
            or "careconnect.project.monolith@gmail.com"
        )

        subject = f"CareConnect Support Request from {name}"
        text_body = f"""Hello Support Team,

You received a new inquiry from CareConnect:

Name: {name}
Email: {user_email}

Message:
{message}
"""

        html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="margin-bottom: 20px;">
                <span style="font-size: 22px; font-weight: 700; color: #0284c7;">CareConnect Support</span>
            </div>
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">New Support Request</h2>
            <p style="font-size: 14px; color: #334155; margin-bottom: 6px;"><strong>From:</strong> {name}</p>
            <p style="font-size: 14px; color: #334155; margin-bottom: 16px;"><strong>Email:</strong> <a href="mailto:{user_email}">{user_email}</a></p>
            <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #1e293b;">
{message}
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Reply directly to this email to respond to {name} ({user_email}).</p>
        </div>
        """

        try:
            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL or support_destination,
                to=[support_destination],
                reply_to=[user_email],
            )
            email_msg.attach_alternative(html_body, "text/html")
            email_msg.send(fail_silently=False)
        except Exception as exc:
            logger.exception("Failed to dispatch support message email: %s", exc)
            return Response(
                {
                    "detail": "Failed to send your support message. Please try again or email us directly."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Send auto-acknowledgement to the sender
        try:
            ack_subject = "We received your CareConnect support request"
            ack_text = f"""Hello {name},

Thank you for contacting CareConnect Support! We have received your inquiry:

\"{message}\"

Our support team reviews messages Monday through Saturday (9:00 AM – 7:00 PM IST) and will respond to you shortly.

Warm regards,
CareConnect Support Team
"""
            send_mail(
                subject=ack_subject,
                message=ack_text,
                from_email=settings.DEFAULT_FROM_EMAIL or support_destination,
                recipient_list=[user_email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(
            {
                "message": "Your message has been sent successfully! Our support team will get back to you shortly."
            },
            status=status.HTTP_200_OK,
        )

