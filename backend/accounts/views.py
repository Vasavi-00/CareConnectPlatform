from django.db import transaction
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
)

from .utils import (
    create_password_reset_otp,
    send_password_reset_otp,
)


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

        email = serializer.validated_data["email"]

        # ----------------------------------------------------
        # SECURITY
        #
        # Never reveal whether the email exists.
        # ----------------------------------------------------

        try:

            user = User.objects.get(
                email=email
            )

        except User.DoesNotExist:

            return Response(
                {
                    "message": (
                        "If an account exists with this "
                        "email, a verification code "
                        "has been sent."
                    )
                },
                status=status.HTTP_200_OK
            )

        # ----------------------------------------------------
        # CREATE OTP
        # ----------------------------------------------------

        password_reset_otp = (
            create_password_reset_otp(user)
        )

        # ----------------------------------------------------
        # SEND OTP
        # ----------------------------------------------------

        send_password_reset_otp(
            user,
            password_reset_otp.otp
        )

        return Response(
            {
                "message": (
                    "If an account exists with this "
                    "email, a verification code "
                    "has been sent."
                )
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