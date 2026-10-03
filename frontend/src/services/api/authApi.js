const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api";

const API_BASE = `${API_BASE_URL}/auth`;

/* =========================================================
   COMMON API REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            ...options,
        }
    );

    const text = await response.text();

    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Server returned an invalid response (${response.status}).`
            );
        }
    }

    if (!response.ok) {
        let message = "Something went wrong.";

        if (data && typeof data === "object") {
            const messages = Object.entries(data)
                .flatMap(([field, errors]) => {
                    const errorList = Array.isArray(errors)
                        ? errors
                        : [errors];

                    return errorList
                        .filter(Boolean)
                        .map((errorMessage) => {
                            if (field === "detail") {
                                return String(errorMessage);
                            }

                            const fieldName = field
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (letter) =>
                                    letter.toUpperCase()
                                );

                            return `${fieldName}: ${errorMessage}`;
                        });
                });

            if (messages.length > 0) {
                message = messages.join(" ");
            }
        }

        throw new Error(message);
    }

    return data;
}


/* =========================================================
   SIGNUP
========================================================= */

export async function signup(userData) {
    return apiRequest(
        "/signup/",
        {
            method: "POST",
            body: JSON.stringify(userData),
        }
    );
}


/* =========================================================
   LOGIN
========================================================= */

export async function login(credentials) {
    return apiRequest(
        "/login/",
        {
            method: "POST",
            body: JSON.stringify(credentials),
        }
    );
}


/* =========================================================
   CURRENT USER
========================================================= */

export async function getMe() {
    const token = localStorage.getItem(
        "careconnect_access"
    );

    return apiRequest(
        "/me/",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
}


/* =========================================================
   STEP 1 — REQUEST PASSWORD RESET OTP
========================================================= */

export async function requestPasswordResetOTP(email) {
    return apiRequest(
        "/forgot-password/",
        {
            method: "POST",
            body: JSON.stringify({
                email: email.trim(),
            }),
        }
    );
}


/* =========================================================
   STEP 2 — VERIFY PASSWORD RESET OTP
========================================================= */

export async function verifyPasswordResetOTP(
    email,
    otp
) {
    return apiRequest(
        "/forgot-password/verify-otp/",
        {
            method: "POST",
            body: JSON.stringify({
                email: email.trim(),
                otp: otp.trim(),
            }),
        }
    );
}


/* =========================================================
   STEP 3 — RESET PASSWORD
========================================================= */

export async function resetPassword(
    email,
    otp,
    password,
    confirmPassword
) {
    return apiRequest(
        "/forgot-password/reset/",
        {
            method: "POST",
            body: JSON.stringify({
                email: email.trim(),
                otp: otp.trim(),
                password: password,
                confirm_password: confirmPassword,
            }),
        }
    );
}
