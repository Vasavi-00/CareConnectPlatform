
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaArrowRight,
    FaCheck,
    FaEnvelope,
    FaEye,
    FaEyeSlash,
    FaHeart,
    FaLock,
    FaPhone,
    FaShieldAlt,
    FaUser,
    FaUsers,
} from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";
import { FaXmark } from "react-icons/fa6";
import useSafeBack from "../../hooks/useSafeBack";
import "../../styles/AuthPage/auth.css";
import { API_BASE_URL } from "../../services/api/baseUrl";


/* =========================================================
   BLANK SIGNUP FORM
========================================================= */

const blankSignup = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "FAMILY",
};


/* =========================================================
   AUTH PAGE
========================================================= */

function AuthPage({ mode }) {

    const isLogin = mode === "login";

    const navigate = useNavigate();
    const location = useLocation();
    const goBack = useSafeBack("/");


    /* =====================================================
       FORM STATE
    ===================================================== */

    const [form, setForm] = useState(
        isLogin
            ? {
                  email: "",
                  password: "",
              }
            : blankSignup
    );


    /* =====================================================
       OTHER STATES
    ===================================================== */

    const [error, setError] = useState("");

    const [saving, setSaving] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [accountCreated, setAccountCreated] =
        useState(false);


    /* =====================================================
       UPDATE FORM
    ===================================================== */

    const update = (event) => {

        const { name, value } = event.target;

        let nextValue = value;
        if (name === "phone") {
            // Strip any character that is not a digit (disallow characters/symbols)
            nextValue = value.replace(/\D/g, "").slice(0, 10);
        }

        setForm((previous) => ({
            ...previous,
            [name]: nextValue,
        }));

        if (error) {
            setError("");
        }
    };


    /* =====================================================
       PASSWORD MATCH
    ===================================================== */

    const passwordsMatch =
        !isLogin &&
        form.password.length > 0 &&
        form.confirm_password.length > 0 &&
        form.password === form.confirm_password;


    /* =====================================================
       SUBMIT
    ===================================================== */

    async function submit(event) {

        event.preventDefault();

        setError("");


        /* =================================================
           SIGNUP FRONTEND VALIDATION
        ================================================= */

        if (!isLogin) {

            /* Confirm password validation */

            if (form.password !== form.confirm_password) {

                setError("Passwords do not match.");

                return;
            }


            /* Phone validation */

            const phone = form.phone.trim();

            if (phone && !/^\d{10}$/.test(phone)) {

                setError(
                    "Phone number must contain exactly 10 digits."
                );

                return;
            }
        }


        setSaving(true);


        try {

            /* =================================================
               REQUEST BODY
            ================================================= */

            const requestBody = isLogin
                ? {
                      email: form.email.trim(),

                      password: form.password,
                  }
                : {
                      first_name:
                          form.first_name.trim(),

                      last_name:
                          form.last_name.trim(),

                      email:
                          form.email.trim(),

                      phone:
                          form.phone.trim(),

                      password:
                          form.password,

                      confirm_password:
                          form.confirm_password,

                      role:
                          form.role,
                  };


            /* =================================================
               API REQUEST
            ================================================= */

            const response = await fetch(
                `${API_BASE_URL}/auth/${isLogin ? "login" : "signup"}/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify(requestBody),
                }
            );


            /* =================================================
               READ RESPONSE SAFELY
            ================================================= */

            const responseText =
                await response.text();

            let data = {};


            if (responseText) {

                try {

                    data =
                        JSON.parse(responseText);

                } catch {

                    throw new Error(
                        `Server returned an invalid response (${response.status}).`
                    );
                }
            }


            /* =================================================
               HANDLE API ERROR
            ================================================= */

            if (!response.ok) {

                let message =
                    "Please check your details and try again.";


                if (
                    data &&
                    typeof data === "object"
                ) {

                    const messages =
                        Object.entries(data)
                            .flatMap(
                                ([
                                    field,
                                    errors,
                                ]) => {

                                    const errorList =
                                        Array.isArray(
                                            errors
                                        )
                                            ? errors
                                            : [errors];


                                    return errorList
                                        .filter(Boolean)
                                        .map(
                                            (
                                                errorMessage
                                            ) => {

                                                const fieldName =
                                                    field
                                                        .replace(
                                                            /_/g,
                                                            " "
                                                        )
                                                        .replace(
                                                            /\b\w/g,
                                                            (
                                                                letter
                                                            ) =>
                                                                letter.toUpperCase()
                                                        );


                                                return `${fieldName}: ${errorMessage}`;
                                            }
                                        );
                                }
                            );


                    if (messages.length > 0) {

                        message =
                            messages.join(" ");
                    }
                }


                throw new Error(message);
            }


            /* =================================================
               SIGNUP SUCCESS
            ================================================= */

            if (!isLogin) {

                setAccountCreated(true);

                return;
            }


            /* =================================================
               LOGIN SUCCESS
            ================================================= */

            if (data.user) {

                localStorage.setItem(
                    "careconnect_user",
                    JSON.stringify(data.user)
                );
            }


            if (data.access) {

                localStorage.setItem(
                    "careconnect_access",
                    data.access
                );
            }


            if (data.refresh) {

                localStorage.setItem(
                    "careconnect_refresh",
                    data.refresh
                );
            }


            /* =================================================
               REDIRECT BASED ON ROLE
            ================================================= */

            if (
                data.user?.role === "ELDER"
            ) {

                const requested = location.state?.from;
                const safeRequested = requested?.pathname?.startsWith("/elder/") ? requested : null;
                navigate(safeRequested || "/elder/dashboard", { replace: true });

            } else {

                const requested = location.state?.from;
                const safeRequested = requested?.pathname === "/dashboard/family" || requested?.pathname?.startsWith("/dashboard/family/") ? requested : null;
                navigate(safeRequested || "/dashboard/family", { replace: true });
            }


        } catch (requestError) {

            if (
                requestError.message ===
                "Failed to fetch"
            ) {

                setError(
                    "Cannot connect to the CareConnect server. Please make sure Django is running on port 8000."
                );

            } else {

                setError(
                    requestError.message ||
                        "Something went wrong. Please try again."
                );
            }

        } finally {

            setSaving(false);
        }
    }


    /* =========================================================
       CONTINUE TO LOGIN
    ========================================================= */

    const continueToLogin = () => {

        setAccountCreated(false);

        setForm({
            email: "",
            password: "",
        });

        setError("");

        navigate("/login", {
            replace: true,
            state: location.state,
        });
    };


    /* =========================================================
       SUCCESS SCREEN AFTER SIGNUP
    ========================================================= */

    if (accountCreated) {

        return (

            <main className="auth-page">

                <div className="auth-shell auth-success-shell">


                    {/* =================================================
                       LEFT SIDE
                    ================================================= */}

                    <aside className="auth-showcase">

                        <Link
                            className="auth-brand light-brand"
                            to="/"
                        >

                            <FaHeart />

                            Care<span>Connect</span>

                        </Link>


                        <div className="showcase-content">

                            <p className="auth-kicker">
                                Welcome to CareConnect
                            </p>


                            <h1>
                                Your journey toward
                                connected care starts here.
                            </h1>


                            <p>
                                Your account has been
                                created successfully.
                                Sign in whenever
                                you're ready.
                            </p>

                        </div>


                        <div className="showcase-note">

                            <FaShieldAlt />

                            <span>

                                <strong>
                                    Private & secure
                                </strong>

                                Your care information
                                stays protected.

                            </span>

                        </div>

                    </aside>


                    {/* =================================================
                       SUCCESS CARD
                    ================================================= */}

                    <section className="auth-card success-card">

                        <div className="auth-card-top-nav">
                            <button
                                type="button"
                                className="auth-back-button"
                                onClick={goBack}
                                aria-label="Back to CareConnect"
                                title="Back to CareConnect"
                            >
                                <FaArrowLeft className="back-arrow-icon" />
                                <span className="back-button-label">Back</span>
                            </button>

                            <Link
                                className="auth-brand mobile-brand"
                                to="/"
                                aria-label="CareConnect Home"
                            >
                                <FaHeart />
                                Care<span>Connect</span>
                            </Link>
                        </div>

                        <div className="success-icon">

                            <FaCircleCheck />

                        </div>


                        <p className="auth-kicker">
                            Account created
                        </p>


                        <h2>
                            You're all set!
                        </h2>


                        <p className="auth-description">

                            Your CareConnect account
                            has been created
                            successfully.

                        </p>


                        {/* =================================================
                           SUCCESS SUMMARY
                        ================================================= */}

                        <div className="success-summary">

                            <div>

                                <FaCheck />

                                <span>
                                    Your account is ready
                                </span>

                            </div>


                            <div>

                                <FaCheck />

                                <span>
                                    Your information was
                                    saved securely
                                </span>

                            </div>


                            <div>

                                <FaCheck />

                                <span>
                                    You can now sign in
                                </span>

                            </div>

                        </div>


                        {/* =================================================
                           CONTINUE TO SIGN IN
                        ================================================= */}

                        <button
                            type="button"
                            className="auth-submit"
                            onClick={continueToLogin}
                        >

                            Continue to Sign in

                            <FaArrowRight />

                        </button>


                        <p className="auth-switch">

                            Want to return home{" "}

                            <Link to="/">
                                Go to CareConnect
                            </Link>

                        </p>

                    </section>

                </div>

            </main>
        );
    }


    /* =========================================================
       LOGIN / SIGNUP PAGE
    ========================================================= */

    return (

        <main className="auth-page">

            <div className="auth-shell">


                {/* =================================================
                   LEFT SIDE
                ================================================= */}

                <aside className="auth-showcase">


                    <Link
                        className="auth-brand light-brand"
                        to="/"
                    >

                        <FaHeart />

                        Care<span>Connect</span>

                    </Link>


                    <div className="showcase-content">

                        <p className="auth-kicker">

                            {isLogin
                                ? "Welcome back"
                                : "Care, made closer"}

                        </p>


                        <h1>

                            {isLogin
                                ? "Good to see you again."
                                : "Everyday care feels better when you feel connected."}

                        </h1>


                        <p>

                            One thoughtful place
                            for families and elders
                            to stay connected,
                            informed, and supported.

                        </p>

                    </div>


                    <div className="showcase-features">


                        <div>

                            <span className="feature-icon">

                                <FaHeart />

                            </span>


                            <div>

                                <strong>
                                    Connected care
                                </strong>

                                <small>
                                    Keep families and
                                    elders connected.
                                </small>

                            </div>

                        </div>


                        <div>

                            <span className="feature-icon">

                                <FaShieldAlt />

                            </span>


                            <div>

                                <strong>
                                    Private & secure
                                </strong>

                                <small>
                                    Your care information
                                    stays protected.
                                </small>

                            </div>

                        </div>


                    </div>

                </aside>


                {/* =================================================
                   RIGHT SIDE
                ================================================= */}

                <section className="auth-card">
                    
                    {/* TOP NAVIGATION / PROPERLY PLACED BACK BUTTON */}
                    <div className="auth-card-top-nav">
                        <button
                            type="button"
                            className="auth-back-button"
                            onClick={goBack}
                            aria-label="Back to CareConnect"
                            title="Back to CareConnect"
                        >
                            <FaArrowLeft className="back-arrow-icon" />
                            <span className="back-button-label">Back</span>
                        </button>

                        {/* MOBILE BRAND */}
                        <Link
                            className="auth-brand mobile-brand"
                            to="/"
                            aria-label="CareConnect Home"
                        >
                            <FaHeart />
                            Care<span>Connect</span>
                        </Link>
                    </div>


                    {/* =================================================
                       HEADING
                    ================================================= */}

                    <div className="auth-heading">

                        <p className="auth-kicker">

                            {isLogin
                                ? "Welcome back"
                                : "Create your account"}

                        </p>


                        <h2>

                            {isLogin
                                ? "Sign in to CareConnect"
                                : "Create your CareConnect account"}

                        </h2>


                        <p className="auth-description">

                            {isLogin
                                ? "Access your personal care dashboard securely."
                                : "Create your account and start building a connected care experience."}

                        </p>

                    </div>


                    {/* =================================================
                       ERROR
                    ================================================= */}

                    {error && (

                        <div
                            className="auth-error"
                            role="alert"
                        >

                            <FaXmark />

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    {/* =================================================
                       FORM
                    ================================================= */}

                    <form
                        onSubmit={submit}
                        className="auth-form"
                    >


                        {/* =================================================
                           SIGNUP ONLY
                        ================================================= */}

                        {!isLogin && (

                            <>


                                {/* FIRST + LAST NAME */}

                                <div className="auth-row">


                                    <label>

                                        First name

                                        <span className="input-wrap">

                                            <FaUser />

                                            <input
                                                type="text"
                                                name="first_name"
                                                placeholder="Jane"
                                                value={
                                                    form.first_name
                                                }
                                                onChange={
                                                    update
                                                }
                                                autoComplete="given-name"
                                                required
                                            />

                                        </span>

                                    </label>


                                    <label>

                                        Last name

                                        <span className="input-wrap">

                                            <FaUser />

                                            <input
                                                type="text"
                                                name="last_name"
                                                placeholder="Doe"
                                                value={
                                                    form.last_name
                                                }
                                                onChange={
                                                    update
                                                }
                                                autoComplete="family-name"
                                                required
                                            />

                                        </span>

                                    </label>

                                </div>


                                {/* =================================================
                                   ROLE
                                ================================================= */}

                                <fieldset className="role-picker">

                                    <legend>
                                        How will you use CareConnect?
                                    </legend>


                                    <div className="role-grid">


                                        {/* FAMILY */}

                                        <label
                                            className={
                                                form.role ===
                                                "FAMILY"
                                                    ? "role-option selected"
                                                    : "role-option"
                                            }
                                        >

                                            <input
                                                type="radio"
                                                name="role"
                                                value="FAMILY"
                                                checked={
                                                    form.role ===
                                                    "FAMILY"
                                                }
                                                onChange={
                                                    update
                                                }
                                            />


                                            <FaUsers />


                                            <span>

                                                <strong>
                                                    Family member
                                                </strong>

                                                <small>
                                                    Care for a loved one
                                                </small>

                                            </span>

                                        </label>


                                        {/* ELDER */}

                                        <label
                                            className={
                                                form.role ===
                                                "ELDER"
                                                    ? "role-option selected"
                                                    : "role-option"
                                            }
                                        >

                                            <input
                                                type="radio"
                                                name="role"
                                                value="ELDER"
                                                checked={
                                                    form.role ===
                                                    "ELDER"
                                                }
                                                onChange={
                                                    update
                                                }
                                            />


                                            <FaHeart />


                                            <span>

                                                <strong>
                                                    Elder
                                                </strong>

                                                <small>
                                                    Manage my own care
                                                </small>

                                            </span>

                                        </label>


                                    </div>

                                </fieldset>

                            </>
                        )}


                        {/* =================================================
                           EMAIL
                        ================================================= */}

                        <label>

                            Email address

                            <span className="input-wrap">

                                <FaEnvelope />

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={update}
                                    autoComplete="email"
                                    required
                                />

                            </span>

                        </label>


                        {/* =================================================
                           PHONE
                        ================================================= */}

                        {!isLogin && (

                            <label>

                                Phone number{" "}

                                <em className="optional">
                                    (optional)
                                </em>


                                <span className="input-wrap">

                                    <FaPhone />

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="10-digit mobile number"
                                        value={form.phone}
                                        onChange={update}
                                        onKeyDown={(e) => {
                                            // Reject all non-digit keys, allowing only editing keys and shortcuts
                                            if (
                                                !/^\d$/.test(e.key) &&
                                                !["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Enter"].includes(e.key) &&
                                                !e.ctrlKey &&
                                                !e.metaKey
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = e.clipboardData?.getData("text") || "";
                                            const digits = pasted.replace(/\D/g, "").slice(0, 10);
                                            setForm((prev) => ({
                                                ...prev,
                                                phone: digits,
                                            }));
                                        }}
                                        autoComplete="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={10}
                                    />

                                </span>

                            </label>

                        )}


                        {/* =================================================
                           PASSWORD
                        ================================================= */}

                        <label>

                            Password

                            <span className="input-wrap password-wrap">

                                <FaLock />


                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    placeholder={
                                        isLogin
                                            ? "Enter your password"
                                            : "Create your password"
                                    }
                                    value={
                                        form.password
                                    }
                                    onChange={update}
                                    autoComplete={
                                        isLogin
                                            ? "current-password"
                                            : "new-password"
                                    }
                                    required
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


                        {/* =================================================
                           CONFIRM PASSWORD
                        ================================================= */}

                        {!isLogin && (

                            <label>

                                Confirm password


                                <span
                                    className={`input-wrap password-wrap ${
                                        form.confirm_password &&
                                        (
                                            passwordsMatch
                                                ? "input-success"
                                                : "input-invalid"
                                        )
                                    }`}
                                >

                                    <FaLock />


                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirm_password"
                                        placeholder="Re-enter your password"
                                        value={
                                            form.confirm_password
                                        }
                                        onChange={update}
                                        autoComplete="new-password"
                                        required
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


                                {form.confirm_password && (

                                    <small
                                        className={
                                            passwordsMatch
                                                ? "match-message success"
                                                : "match-message error"
                                        }
                                    >

                                        {passwordsMatch
                                            ? "Passwords match"
                                            : "Passwords do not match"}

                                    </small>

                                )}

                            </label>

                        )}


                        {/* =================================================
                           FORGOT PASSWORD
                        ================================================= */}

                        {isLogin && (

                            <div className="forgot-row">

                                <Link
                                    to="/forgot-password"
                                    state={location.state}
                                    className="forgot-link"
                                >
                                    Forgot password?
                                </Link>

                            </div>

                        )}


                        {/* =================================================
                           SUBMIT
                        ================================================= */}

                        {!isLogin && (
                            <p className="auth-terms-note">
                                By signing up, you agree to CareConnect's{" "}
                                <Link to="/terms" target="_blank" rel="noopener noreferrer">
                                    Terms &amp; Conditions
                                </Link>.
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={saving}
                        >

                            {saving
                                ? "Please wait..."
                                : isLogin
                                  ? "Sign in securely"
                                  : "Create my account"}


                            {!saving && (
                                <FaArrowRight />
                            )}

                        </button>


                    </form>


                    {/* =================================================
                       SWITCH LOGIN / SIGNUP
                    ================================================= */}

                    <p className="auth-switch">

                        {isLogin
                            ? "New to CareConnect?"
                            : "Already have an account?"}{" "}


                        <Link
                            to={
                                isLogin
                                    ? "/signup"
                                    : "/login"
                            }
                            state={location.state}
                        >

                            {isLogin
                                ? "Create an account"
                                : "Sign in"}

                        </Link>

                    </p>


                    {/* =================================================
                       SECURITY
                    ================================================= */}

                    <div className="auth-security">

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


export default AuthPage;
