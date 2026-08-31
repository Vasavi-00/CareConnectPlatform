import random

from datetime import timedelta

from django.core.mail import send_mail
from django.utils import timezone

from .models import PasswordResetOTP


# ============================================================
# GENERATE OTP
# ============================================================

def generate_otp():

    return str(
        random.randint(100000, 999999)
    )


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

    subject = "CareConnect Password Reset OTP"

    message = f"""
Hello {user.first_name},

Your CareConnect password reset OTP is:

{otp}

This OTP is valid for 5 minutes.

If you did not request a password reset,
please ignore this email.

Regards,
CareConnect Team
"""

    send_mail(
        subject,
        message,
        None,
        [user.email],
        fail_silently=False,
    )