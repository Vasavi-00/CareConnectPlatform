import secrets
from datetime import timedelta
from urllib.parse import quote_plus

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import PasswordResetOTP


# ============================================================
# VALIDATE EMAIL CONFIGURATION
# ============================================================

def validate_email_configuration():
    """
    Validates whether the email backend is properly configured to send messages.
    Returns (is_configured: bool, reason: str).
    """
    backend = getattr(settings, "EMAIL_BACKEND", "")
    if not backend:
        return False, "EMAIL_BACKEND is not configured."

    # Non-SMTP backends (locmem for tests, console for terminal debugging) are considered configured
    if any(k in backend for k in ("locmem", "console", "dummy", "filebased")):
        return True, ""

    if "smtp" in backend:
        host = getattr(settings, "EMAIL_HOST", "").strip()
        port = getattr(settings, "EMAIL_PORT", None)
        user = getattr(settings, "EMAIL_HOST_USER", "").strip()
        password = getattr(settings, "EMAIL_HOST_PASSWORD", "").strip()
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "").strip()

        missing = []
        if not host:
            missing.append("EMAIL_HOST")
        if not port:
            missing.append("EMAIL_PORT")
        if not user:
            missing.append("EMAIL_HOST_USER")
        if not password:
            missing.append("EMAIL_HOST_PASSWORD")
        if not from_email:
            missing.append("DEFAULT_FROM_EMAIL")

        if missing:
            return False, f"Missing required email settings: {', '.join(missing)}"

    return True, ""


# ============================================================
# GENERATE OTP
# ============================================================

def generate_otp():
    return f"{secrets.randbelow(900000) + 100000:06d}"


# ============================================================
# CREATE PASSWORD RESET OTP
# ============================================================

def create_password_reset_otp(user):

    # Delete previous unused OTPs
    PasswordResetOTP.objects.filter(
        user=user,
        is_verified=False,
    ).delete()

    otp = generate_otp()

    password_reset_otp = PasswordResetOTP.objects.create(
        user=user,
        otp=otp,
        expires_at=timezone.now() + timedelta(minutes=5),
    )

    return password_reset_otp


# ============================================================
# SEND PASSWORD RESET OTP
# ============================================================

def send_password_reset_otp(user, otp):

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    encoded_email = quote_plus(user.email)
    reset_url = f"{frontend_url}/forgot-password?email={encoded_email}&otp={otp}"

    first_name = user.first_name.strip() if getattr(user, "first_name", None) else "there"
    subject = "CareConnect Password Reset"

    message = f"""Hello {first_name},

We received a request to reset your CareConnect password.

Your 6-digit verification code is:
{otp}

This code will expire in 5 minutes.

You can enter this code on the password reset page, or use the direct reset link below to open CareConnect and choose a new password:
{reset_url}

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Regards,
CareConnect Team
"""

    html_message = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 700; color: #0284c7;">CareConnect</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Password Reset Request</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">Hello {first_name},</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">We received a request to reset your CareConnect account password. Use the verification code below to proceed:</p>
        <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 14px 28px; background-color: #f0f9ff; border: 2px dashed #0284c7; border-radius: 8px; color: #0369a1; font-family: monospace;">{otp}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 24px;">This code will expire in <strong>5 minutes</strong>.</p>
        <div style="text-align: center; margin: 28px 0;">
            <a href="{reset_url}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password Directly</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
        <p style="font-size: 13px; line-height: 1.5; color: #94a3b8; margin: 0;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
    """

    sent_count = send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL or None,
        recipient_list=[user.email],
        fail_silently=False,
        html_message=html_message,
    )
    if sent_count != 1:
        raise RuntimeError("Email backend did not accept the password reset message.")

