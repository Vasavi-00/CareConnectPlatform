
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    requestPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
} from "../../services/api/authApi";

import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaHeart,
  FaLock,
  FaShieldAlt,
  FaTimesCircle,
} from "react-icons/fa";

import "../../styles/ForgotPassword/forgotPassword.css";


/* =========================================================
   FORGOT PASSWORD
========================================================= */

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

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);


    /* =====================================================
       OTP TIMER
    ===================================================== */

    const [timer, setTimer] = useState(0);


    useEffect(() => {

        if (timer <= 0) {
            return;
        }

        const interval = setInterval(() => {

            setTimer(
                (previous) =>
                    previous - 1
            );

        }, 1000);

        return () =>
            clearInterval(interval);

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

        const trimmedEmail =
            email.trim();


        if (!trimmedEmail) {

            setError(
                "Please enter your email address."
            );

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

        const trimmedOTP =
            otp.trim();


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


        if (
            password !== confirmPassword
        ) {

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

        if (
            timer > 0 ||
            loading
        ) {
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

        setTimer(0);

        setStep(1);
    }


    /* =====================================================
       BACK TO LANDING PAGE
    ===================================================== */

    function handleBackToHome() {

        navigate("/");
    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <main className="forgot-page">

            <div className="forgot-shell">


                {/* =================================================
                   LEFT SIDE
                ================================================= */}

                <aside className="forgot-showcase">


                    {/* BRAND */}

                    <Link
                        to="/"
                        className="forgot-brand light-brand"
                    >

                        <FaHeart />

                        Care<span>Connect</span>

                    </Link>


                    {/* SHOWCASE CONTENT */}

                    <div className="forgot-showcase-content">

                        <p className="forgot-kicker">
                            Account recovery
                        </p>


                        <h1>
                            We'll help you get
                            back in.
                        </h1>


                        <p>
                            Securely recover your
                            CareConnect account and
                            get back to staying
                            connected with the people
                            who matter most.
                        </p>

                    </div>


                    {/* SHOWCASE FEATURES */}

                    <div className="forgot-showcase-features">

                        <div>

                            <span className="forgot-feature-icon">

                                <FaShieldAlt />

                            </span>


                            <div>

                                <strong>
                                    Private & secure
                                </strong>

                                <small>
                                    Your account
                                    information stays
                                    protected.
                                </small>

                            </div>

                        </div>


                        <div>

                            <span className="forgot-feature-icon">

                                <FaCheckCircle />

                            </span>


                            <div>

                                <strong>
                                    Simple recovery
                                </strong>

                                <small>
                                    Verify your email
                                    and create a new
                                    password.
                                </small>

                            </div>

                        </div>

                    </div>

                </aside>


                {/* =================================================
                   RIGHT SIDE
                ================================================= */}

                <section className="forgot-card">


                    {/* BACK BUTTON */}

                    <button
                        type="button"
                        className="forgot-back-button"
                        onClick={handleBackToHome}
                        aria-label="Back to CareConnect"
                        title="Back to CareConnect"
                    >

                        <FaArrowLeft />

                    </button>


                    {/* MOBILE BRAND */}

                    <Link
                        to="/"
                        className="forgot-mobile-brand"
                    >

                        <FaHeart />

                        Care<span>Connect</span>

                    </Link>


                    {/* =================================================
                       STEP 1
                    ================================================= */}

                    {step === 1 && (

                        <>

                            <div className="forgot-heading">

                                <p className="forgot-kicker">
                                    Account recovery
                                </p>


                                <h2>
                                    Forgot your password?
                                </h2>


                                <p>
                                    Enter the email address
                                    associated with your
                                    CareConnect account and
                                    we'll send you a
                                    verification code.
                                </p>

                            </div>


                            {/* ERROR */}

                            {error && (

                                <div
                                    className="forgot-message error"
                                    role="alert"
                                >

                                    <FaTimesCircle />

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            )}


                            {/* SUCCESS */}

                            {success && (

                                <div
                                    className="forgot-message success"
                                    role="status"
                                >

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

                                    <span className="forgot-input-wrap">

                                        <FaEnvelope />

                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            autoComplete="email"
                                            disabled={loading}
                                        />

                                    </span>

                                </label>


                                <button
                                    type="submit"
                                    className="forgot-submit"
                                    disabled={loading}
                                >

                                    {loading
                                        ? "Sending..."
                                        : "Send verification code"}


                                    {!loading && (
                                        <FaArrowRight />
                                    )}

                                </button>

                            </form>

                        </>

                    )}


                    {/* =================================================
                       STEP 2
                    ================================================= */}

                    {step === 2 && (

                        <>

                            <div className="forgot-heading">

                                <p className="forgot-kicker">
                                    Verify your email
                                </p>


                                <h2>
                                    Enter verification code
                                </h2>


                                <p>
                                    Enter the 6-digit code
                                    we sent to your email
                                    address.
                                </p>

                            </div>


                            <div className="forgot-email">

                                <FaEnvelope />

                                <span>
                                    {email}
                                </span>

                            </div>


                            {/* ERROR */}

                            {error && (

                                <div
                                    className="forgot-message error"
                                    role="alert"
                                >

                                    <FaTimesCircle />

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            )}


                            {/* SUCCESS */}

                            {success && (

                                <div
                                    className="forgot-message success"
                                    role="status"
                                >

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

                                    <span className="forgot-input-wrap">

                                        <FaLock />

                                        <input
                                            type="text"
                                            className="otp-input"
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
                                            disabled={loading}
                                        />

                                    </span>

                                </label>


                                {timer > 0 && (

                                    <p className="otp-timer">

                                        You can resend the code in{" "}

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
                                        : "Verify code"}


                                    {!loading && (
                                        <FaArrowRight />
                                    )}

                                </button>

                            </form>


                            <button
                                type="button"
                                className="resend-button"
                                onClick={
                                    handleResendOTP
                                }
                                disabled={
                                    timer > 0 ||
                                    loading
                                }
                            >

                                {timer > 0
                                    ? `Resend code in ${timer}s`
                                    : "Resend verification code"}

                            </button>


                            <button
                                type="button"
                                className="change-email-button"
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

                            <div className="forgot-heading">

                                <p className="forgot-kicker">
                                    Create a new password
                                </p>


                                <h2>
                                    Reset your password
                                </h2>


                                <p>
                                    Choose a new password
                                    for your CareConnect
                                    account.
                                </p>

                            </div>


                            {/* ERROR */}

                            {error && (

                                <div
                                    className="forgot-message error"
                                    role="alert"
                                >

                                    <FaTimesCircle />

                                    <span>
                                        {error}
                                    </span>

                                </div>

                            )}


                            {/* SUCCESS */}

                            {success && (

                                <div
                                    className="forgot-message success"
                                    role="status"
                                >

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

                                {/* NEW PASSWORD */}

                                <label>

                                    New password

                                    <span className="forgot-input-wrap password-input-wrap">

                                        <FaLock />

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter new password"
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.target.value
                                                )
                                            }
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />


                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) =>
                                                        !previous
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >

                                            {showPassword ? (
                                                <FaEyeSlash />
                                            ) : (
                                                <FaEye />
                                            )}

                                        </button>

                                    </span>

                                </label>


                                {/* CONFIRM PASSWORD */}

                                <label>

                                    Confirm password

                                    <span className="forgot-input-wrap password-input-wrap">

                                        <FaLock />

                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Re-enter your password"
                                            value={
                                                confirmPassword
                                            }
                                            onChange={(event) =>
                                                setConfirmPassword(
                                                    event.target.value
                                                )
                                            }
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />


                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (previous) =>
                                                        !previous
                                                )
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirm password"
                                                    : "Show confirm password"
                                            }
                                        >

                                            {showConfirmPassword ? (
                                                <FaEyeSlash />
                                            ) : (
                                                <FaEye />
                                            )}

                                        </button>

                                    </span>

                                </label>


                                <button
                                    type="submit"
                                    className="forgot-submit"
                                    disabled={loading}
                                >

                                    {loading
                                        ? "Resetting..."
                                        : "Reset password"}


                                    {!loading && (
                                        <FaArrowRight />
                                    )}

                                </button>

                            </form>

                        </>

                    )}


                    {/* =================================================
                       BACK TO LOGIN
                    ================================================= */}

                    <p className="forgot-login">

                        Remember your password?{" "}

                        <Link to="/login">
                            Sign in
                        </Link>

                    </p>


                    {/* =================================================
                       SECURITY
                    ================================================= */}

                    <div className="forgot-security">

                        <FaShieldAlt />

                        <span>
                            Your information is handled
                            securely by CareConnect.
                        </span>

                    </div>

                </section>

            </div>

        </main>
    );
}