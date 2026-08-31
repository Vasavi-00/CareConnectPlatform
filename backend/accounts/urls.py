from django.urls import path

from .views import (
    SignupView,
    LoginView,
    MeView,

    ElderProfileView,
    FamilyProfileView,

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
        "auth/me/",
        MeView.as_view(),
        name="me"
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

    # ========================================================
    # CONNECTION REQUESTS
    # ========================================================

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
        "connections/elder/requests/",
        ElderConnectionRequestsView.as_view(),
        name="elder-connection-requests"
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
        "connections/elder/family/",
        ElderConnectedFamilyView.as_view(),
        name="elder-connected-family"
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