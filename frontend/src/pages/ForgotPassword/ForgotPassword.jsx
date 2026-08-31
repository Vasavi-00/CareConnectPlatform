import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    requestPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
} from "../../services/api/authApi";

import {
    FaArrowLeft,
    FaCheckCircle,
    FaEnvelope,
    FaLock,
    FaShieldAlt,
    FaExclamationCircle,
} from "react-icons/fa";

import "../../styles/ForgotPassword/forgotPassword.css";

export default function ForgotPassword() {
    const navigate = useNavigate();

    /* =====================================================
       STEP
       1 = Email
       2 = OTP
       3 = New Password
    ===================================================== */

    const [step, setStep] = useState(1);

    /* =====================================================
       FORM DATA
    ===================================================== */

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    /* =====================================================
       UI STATES
    ===================================================== */

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /* =====================================================
       OTP TIMER
    ===================================================== */

    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (timer <= 0) {
            return;
        }

        const interval = setInterval(() => {
            setTimer((previous) => previous - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    /* =====================================================
       CLEAR MESSAGES
    ===================================================== */

    function clearMessages() {
        setError("");
        setSuccess("");
    }

    /* =====================================================
       STEP 1
       REQUEST OTP
    ===================================================== */

    async function handleRequestOTP(event) {
        event.preventDefault();

        clearMessages();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Please enter your email address.");
            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                trimmedEmail
            )
        ) {
            setError(
                "Please enter a valid email address."
            );
            return;
        }

        try {
            setLoading(true);

            const response =
                await requestPasswordResetOTP(
                    trimmedEmail
                );

            setSuccess(
                response?.message ||
                    "If an account exists with this email, a verification code has been sent."
            );

            setStep(2);

            setTimer(60);
        } catch (err) {
            console.error(
                "Request OTP error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to send verification code."
            );
        } finally {
            setLoading(false);
        }
    }

    /* =====================================================
       STEP 2
       VERIFY OTP
    ===================================================== */

    async function handleVerifyOTP(event) {
        event.preventDefault();

        clearMessages();

        const trimmedOTP = otp.trim();

        if (!trimmedOTP) {
            setError(
                "Please enter the verification code."
            );
            return;
        }

        if (!/^\d{6}$/.test(trimmedOTP)) {
            setError(
                "Please enter the 6-digit verification code."
            );
            return;
        }

        try {
            setLoading(true);

            const response =
                await verifyPasswordResetOTP(
                    email,
                    trimmedOTP
                );

            setSuccess(
                response?.message ||
                    "OTP verified successfully."
            );

            setStep(3);
        } catch (err) {
            console.error(
                "Verify OTP error:",
                err
            );

            setError(
                err?.message ||
                    "Invalid or expired OTP."
            );
        } finally {
            setLoading(false);
        }
    }

    /* =====================================================
       STEP 3
       RESET PASSWORD
    ===================================================== */

    async function handleResetPassword(event) {
        event.preventDefault();

        clearMessages();

        if (!password) {
            setError(
                "Please enter a new password."
            );
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        try {
            setLoading(true);

            const response =
                await resetPassword(
                    email,
                    otp,
                    password,
                    confirmPassword
                );

            setSuccess(
                response?.message ||
                    "Password reset successfully."
            );

            /*
             * Give the user a moment to see
             * the success message.
             */

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            console.error(
                "Reset password error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to reset password."
            );
        } finally {
            setLoading(false);
        }
    }

    /* =====================================================
       RESEND OTP
    ===================================================== */

    async function handleResendOTP() {
        if (timer > 0 || loading) {
            return;
        }

        clearMessages();

        try {
            setLoading(true);

            const response =
                await requestPasswordResetOTP(
                    email
                );

            setSuccess(
                response?.message ||
                    "A new verification code has been sent."
            );

            setTimer(60);

            setOtp("");
        } catch (err) {
            console.error(
                "Resend OTP error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to resend verification code."
            );
        } finally {
            setLoading(false);
        }
    }

    /* =====================================================
       CHANGE EMAIL
    ===================================================== */

    function handleChangeEmail() {
        clearMessages();

        setOtp("");
        setPassword("");
        setConfirmPassword("");

        setStep(1);
    }

    /* =====================================================
       PASSWORD REQUIREMENTS
    ===================================================== */

    const passwordHasLength =
        password.length >= 8;

    const passwordHasNumber =
        /\d/.test(password);

    const passwordHasLetter =
        /[A-Za-z]/.test(password);

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="forgot-page">

            <div className="forgot-card">

                {/* =================================================
                   BRAND
                ================================================= */}

                <Link
                    to="/"
                    className="forgot-brand"
                >
                    <FaShieldAlt />

                    <span>CareConnect</span>
                </Link>

                {/* =================================================
                   STEP INDICATOR
                ================================================= */}

                <div className="forgot-steps">

                    <div
                        className={`forgot-step ${
                            step >= 1
                                ? "active"
                                : ""
                        }`}
                    >
                        <span>1</span>
                        <small>Email</small>
                    </div>

                    <div className="forgot-step-line" />

                    <div
                        className={`forgot-step ${
                            step >= 2
                                ? "active"
                                : ""
                        }`}
                    >
                        <span>2</span>
                        <small>OTP</small>
                    </div>

                    <div className="forgot-step-line" />

                    <div
                        className={`forgot-step ${
                            step >= 3
                                ? "active"
                                : ""
                        }`}
                    >
                        <span>3</span>
                        <small>Password</small>
                    </div>

                </div>

                {/* =================================================
                   ICON
                ================================================= */}

                <div className="forgot-icon">

                    {step === 1 && (
                        <FaEnvelope />
                    )}

                    {step === 2 && (
                        <FaShieldAlt />
                    )}

                    {step === 3 && (
                        <FaLock />
                    )}

                </div>

                {/* =================================================
                   STEP 1
                ================================================= */}

                {step === 1 && (
                    <>
                        <p className="forgot-kicker">
                            Account Recovery
                        </p>

                        <h1>
                            Forgot your password?
                        </h1>

                        <p className="forgot-description">
                            Enter the email address
                            associated with your
                            CareConnect account.
                            We'll send you a
                            verification code.
                        </p>

                        {error && (
                            <div className="forgot-error">
                                <FaExclamationCircle />

                                <span>
                                    {error}
                                </span>
                            </div>
                        )}

                        {success && (
                            <div className="forgot-success">
                                <FaCheckCircle />

                                <span>
                                    {success}
                                </span>
                            </div>
                        )}

                        <form
                            className="forgot-form"
                            onSubmit={
                                handleRequestOTP
                            }
                        >

                            <label>
                                Email address

                                <div className="forgot-input-wrap">

                                    <FaEnvelope />

                                    <input
                                        type="email"
                                        className="forgot-input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target
                                                    .value
                                            )
                                        }
                                        autoComplete="email"
                                        disabled={
                                            loading
                                        }
                                    />

                                </div>
                            </label>

                            <button
                                type="submit"
                                className="forgot-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Sending..."
                                    : "Send Verification Code"}
                            </button>

                        </form>
                    </>
                )}

                {/* =================================================
                   STEP 2
                ================================================= */}

                {step === 2 && (
                    <>
                        <p className="forgot-kicker">
                            Verify your identity
                        </p>

                        <h1>
                            Enter verification code
                        </h1>

                        <p className="forgot-description">
                            We sent a 6-digit
                            verification code to:
                        </p>

                        <div className="forgot-email-display">
                            <FaEnvelope />

                            <strong>
                                {email}
                            </strong>
                        </div>

                        {error && (
                            <div className="forgot-error">
                                <FaExclamationCircle />

                                <span>
                                    {error}
                                </span>
                            </div>
                        )}

                        {success && (
                            <div className="forgot-success">
                                <FaCheckCircle />

                                <span>
                                    {success}
                                </span>
                            </div>
                        )}

                        <form
                            className="forgot-form"
                            onSubmit={
                                handleVerifyOTP
                            }
                        >

                            <label>
                                Verification code

                                <div className="forgot-input-wrap">

                                    <input
                                        type="text"
                                        className="forgot-input otp-input"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value
                                                    .replace(
                                                        /\D/g,
                                                        ""
                                                    )
                                                    .slice(
                                                        0,
                                                        6
                                                    );

                                            setOtp(value);
                                        }}
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                        disabled={
                                            loading
                                        }
                                    />

                                </div>
                            </label>

                            {timer > 0 && (
                                <p className="otp-timer">
                                    You can resend the
                                    code in{" "}
                                    <strong>
                                        {timer}s
                                    </strong>
                                </p>
                            )}

                            <button
                                type="submit"
                                className="forgot-submit"
                                disabled={
                                    loading ||
                                    otp.length !== 6
                                }
                            >
                                {loading
                                    ? "Verifying..."
                                    : "Verify Code"}
                            </button>

                        </form>

                        <div className="resend-otp">

                            <button
                                type="button"
                                onClick={
                                    handleResendOTP
                                }
                                disabled={
                                    timer > 0 ||
                                    loading
                                }
                            >
                                Resend verification code
                            </button>

                        </div>

                        <button
                            type="button"
                            className="forgot-secondary"
                            onClick={
                                handleChangeEmail
                            }
                            disabled={loading}
                        >
                            <FaArrowLeft />
                            Change email
                        </button>
                    </>
                )}

                {/* =================================================
                   STEP 3
                ================================================= */}

                {step === 3 && (
                    <>
                        <p className="forgot-kicker">
                            Create new password
                        </p>

                        <h1>
                            Reset your password
                        </h1>

                        <p className="forgot-description">
                            Create a new password
                            for your CareConnect
                            account.
                        </p>

                        {error && (
                            <div className="forgot-error">
                                <FaExclamationCircle />

                                <span>
                                    {error}
                                </span>
                            </div>
                        )}

                        {success && (
                            <div className="forgot-success">
                                <FaCheckCircle />

                                <span>
                                    {success}
                                </span>
                            </div>
                        )}

                        <form
                            className="forgot-form"
                            onSubmit={
                                handleResetPassword
                            }
                        >

                            {/* PASSWORD */}

                            <label>
                                New password

                                <div className="forgot-input-wrap">

                                    <FaLock />

                                    <input
                                        type="password"
                                        className="forgot-input"
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target
                                                    .value
                                            )
                                        }
                                        autoComplete="new-password"
                                        disabled={
                                            loading
                                        }
                                    />

                                </div>
                            </label>

                            {/* CONFIRM PASSWORD */}

                            <label>
                                Confirm password

                                <div className="forgot-input-wrap">

                                    <FaLock />

                                    <input
                                        type="password"
                                        className="forgot-input"
                                        placeholder="Confirm new password"
                                        value={
                                            confirmPassword
                                        }
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target
                                                    .value
                                            )
                                        }
                                        autoComplete="new-password"
                                        disabled={
                                            loading
                                        }
                                    />

                                </div>
                            </label>

                            {/* REQUIREMENTS */}

                            <div className="password-requirements">

                                <div className="password-requirements-title">
                                    Password should contain:
                                </div>

                                <div
                                    className={`password-requirement ${
                                        passwordHasLength
                                            ? "valid"
                                            : ""
                                    }`}
                                >
                                    <FaCheckCircle />

                                    At least 8 characters
                                </div>

                                <div
                                    className={`password-requirement ${
                                        passwordHasLetter
                                            ? "valid"
                                            : ""
                                    }`}
                                >
                                    <FaCheckCircle />

                                    At least one letter
                                </div>

                                <div
                                    className={`password-requirement ${
                                        passwordHasNumber
                                            ? "valid"
                                            : ""
                                    }`}
                                >
                                    <FaCheckCircle />

                                    At least one number
                                </div>

                            </div>

                            <button
                                type="submit"
                                className="forgot-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Resetting..."
                                    : "Reset Password"}
                            </button>

                        </form>
                    </>
                )}

                {/* =================================================
                   BACK TO LOGIN
                ================================================= */}

                <div className="forgot-login">

                    Remember your password?{" "}

                    <Link to="/login">
                        Sign in
                    </Link>

                </div>

            </div>
        </div>
    );
}