from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    SignupView,
    LoginView,
    MeView,
    DeleteAccountView,

    ElderProfileView,
    FamilyElderProfileUpdateView,
    DisconnectElderView,
    FamilyProfileView,
    FindElderView,
    ConnectElderView,

    ConnectionRequestCreateView,
    FamilyConnectionRequestsView,
    ElderConnectionRequestsView,
    ConnectionRequestActionView,

    FamilyConnectedEldersView,
    ElderConnectedFamilyView,

    ForgotPasswordView,
    VerifyPasswordResetOTPView,
    ResetPasswordView,
)


urlpatterns = [

    # ========================================================
    # AUTH
    # ========================================================

    path(
        "auth/signup/",
        SignupView.as_view(),
        name="signup"
    ),

    path(
        "auth/login/",
        LoginView.as_view(),
        name="login"
    ),
    path(
        "auth/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh",
    ),

    path(
        "auth/me/",
        MeView.as_view(),
        name="me"
    ),
    path(
        "auth/account/",
        DeleteAccountView.as_view(),
        name="delete-account",
    ),

    # ========================================================
    # PROFILES
    # ========================================================

    path(
        "elder/profile/",
        ElderProfileView.as_view(),
        name="elder-profile"
    ),

    path(
        "family/profile/",
        FamilyProfileView.as_view(),
        name="family-profile"
    ),
    path(
        "family/elders/<int:elder_id>/profile/",
        FamilyElderProfileUpdateView.as_view(),
        name="family-elder-profile-update",
    ),
    path(
        "connections/family/elders/<int:elder_id>/disconnect/",
        DisconnectElderView.as_view(),
        name="disconnect-elder",
    ),

    # ========================================================
    # CONNECTION REQUESTS
    # ========================================================
    path(
        "connections/connect/",
        ConnectElderView.as_view(),
        name="connect-elder",
    ),
    path(
        "connections/elder/family/",
        ElderConnectedFamilyView.as_view(),
        name="elder-connected-family"
    ),
    path(
        "connections/elder/requests/",
        ElderConnectionRequestsView.as_view(),
        name="elder-connection-requests"
    ),
    path(
        "connections/elder/<str:careconnect_id>/",
        FindElderView.as_view(),
        name="find-elder"
    ),

    path(
        "connections/request/",
        ConnectionRequestCreateView.as_view(),
        name="connection-request-create"
    ),

    path(
        "connections/family/requests/",
        FamilyConnectionRequestsView.as_view(),
        name="family-connection-requests"
    ),

    path(
        "connections/request/<int:request_id>/action/",
        ConnectionRequestActionView.as_view(),
        name="connection-request-action"
    ),

    # ========================================================
    # APPROVED CONNECTIONS
    # ========================================================

    path(
        "connections/family/elders/",
        FamilyConnectedEldersView.as_view(),
        name="family-connected-elders"
    ),


    path(
        "auth/forgot-password/",
        ForgotPasswordView.as_view(),
        name="forgot-password",
    ),

    path(
        "auth/forgot-password/verify-otp/",
        VerifyPasswordResetOTPView.as_view(),
        name="verify-password-reset-otp",
    ),

    path(
        "auth/forgot-password/reset/",
        ResetPasswordView.as_view(),
        name="reset-password",
    ),
]
