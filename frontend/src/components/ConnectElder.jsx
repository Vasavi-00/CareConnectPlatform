import { useState } from "react";
import {
    FaArrowRight,
    FaCheck,
    FaCircleCheck,
    FaHeart,
    FaLink,
    FaSpinner,
    FaUser,
    FaXmark,
} from "react-icons/fa6";

function ConnectElder() {
    const [careconnectId, setCareconnectId] = useState("");
    const [relationshipType, setRelationshipType] = useState("");

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const submitConnectionRequest = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const cleanedId = careconnectId.trim().toUpperCase();

        if (!cleanedId) {
            setError("Please enter the elder's CareConnect ID.");
            return;
        }

        if (!/^CC-[A-Z0-9]{6}$/.test(cleanedId)) {
            setError(
                "Please enter a valid CareConnect ID, for example CC-7K4P92."
            );
            return;
        }

        setLoading(true);

        try {
            const accessToken = localStorage.getItem(
                "careconnect_access"
            );

            if (!accessToken) {
                setError(
                    "Your session has expired. Please sign in again."
                );
                return;
            }

            const response = await fetch(
                "/api/connections/request/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },

                    body: JSON.stringify({
                        careconnect_id: cleanedId,
                        relationship_type: relationshipType,
                    }),
                }
            );

            const responseText = await response.text();

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        `Server returned an invalid response (${response.status}).`
                    );
                }
            }

            if (!response.ok) {
                let message =
                    "Unable to send the connection request.";

                if (
                    data &&
                    typeof data === "object"
                ) {
                    const messages = Object.entries(data)
                        .flatMap(
                            ([field, errors]) => {
                                const errorList =
                                    Array.isArray(errors)
                                        ? errors
                                        : [errors];

                                return errorList
                                    .filter(Boolean)
                                    .map(
                                        (errorMessage) => {
                                            if (
                                                typeof errorMessage ===
                                                "object"
                                            ) {
                                                return Object.values(
                                                    errorMessage
                                                ).join(" ");
                                            }

                                            return String(
                                                errorMessage
                                            );
                                        }
                                    );
                            }
                        );

                    if (messages.length > 0) {
                        message = messages.join(" ");
                    }
                }

                throw new Error(message);
            }

            setSuccess(
                "Connection request sent successfully. The elder needs to accept your request."
            );

            setCareconnectId("");
            setRelationshipType("");
        } catch (requestError) {
            console.error(
                "Connection request error:",
                requestError
            );

            if (
                requestError.message ===
                "Failed to fetch"
            ) {
                setError(
                    "Cannot connect to the CareConnect server. Please make sure Django is running."
                );
            } else {
                setError(
                    requestError.message ||
                        "Something went wrong. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="connect-elder-card">
            {/* HEADER */}

            <div className="connect-elder-header">
                <div className="connect-elder-icon">
                    <FaLink />
                </div>

                <div>
                    <p className="connect-elder-kicker">
                        Family care
                    </p>

                    <h2>
                        Connect with an Elder
                    </h2>

                    <p>
                        Enter the elder's CareConnect ID
                        to send them a connection request.
                    </p>
                </div>
            </div>

            {/* SUCCESS */}

            {success && (
                <div
                    className="connection-message connection-success"
                    role="status"
                >
                    <FaCircleCheck />

                    <span>
                        {success}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                        aria-label="Close success message"
                    >
                        <FaXmark />
                    </button>
                </div>
            )}

            {/* ERROR */}

            {error && (
                <div
                    className="connection-message connection-error"
                    role="alert"
                >
                    <FaXmark />

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        aria-label="Close error message"
                    >
                        <FaXmark />
                    </button>
                </div>
            )}

            {/* FORM */}

            <form
                className="connect-elder-form"
                onSubmit={
                    submitConnectionRequest
                }
            >
                {/* CARECONNECT ID */}

                <label>
                    CareConnect ID
                    <span className="required">
                        *
                    </span>

                    <span className="connect-input-wrap">
                        <FaHeart />

                        <input
                            type="text"
                            name="careconnect_id"
                            value={
                                careconnectId
                            }
                            onChange={(event) => {
                                setCareconnectId(
                                    event.target.value.toUpperCase()
                                );

                                setError("");
                                setSuccess("");
                            }}
                            placeholder="Example: CC-7K4P92"
                            maxLength={9}
                            autoComplete="off"
                            spellCheck="false"
                            required
                        />
                    </span>

                    <small>
                        Ask the elder for their
                        CareConnect ID.
                    </small>
                </label>

                {/* RELATIONSHIP */}

                <label>
                    Relationship
                    <span className="optional">
                        optional
                    </span>

                    <span className="connect-input-wrap">
                        <FaUser />

                        <select
                            name="relationship_type"
                            value={
                                relationshipType
                            }
                            onChange={(event) => {
                                setRelationshipType(
                                    event.target.value
                                );

                                setError("");
                            }}
                        >
                            <option value="">
                                Select relationship
                            </option>

                            <option value="Son">
                                Son
                            </option>

                            <option value="Daughter">
                                Daughter
                            </option>

                            <option value="Spouse">
                                Spouse
                            </option>

                            <option value="Grandson">
                                Grandson
                            </option>

                            <option value="Granddaughter">
                                Granddaughter
                            </option>

                            <option value="Sibling">
                                Sibling
                            </option>

                            <option value="Relative">
                                Relative
                            </option>

                            <option value="Caregiver">
                                Caregiver
                            </option>

                            <option value="Other">
                                Other
                            </option>
                        </select>
                    </span>
                </label>

                {/* SUBMIT */}

                <button
                    type="submit"
                    className="connect-elder-submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <FaSpinner className="spin" />

                            Sending request...
                        </>
                    ) : (
                        <>
                            <FaArrowRight />

                            Send Connection Request
                        </>
                    )}
                </button>
            </form>

            {/* INFORMATION */}

            <div className="connect-elder-info">
                <FaCheck />

                <div>
                    <strong>
                        How does this work?
                    </strong>

                    <p>
                        Your request will be sent to
                        the elder. You will be connected
                        only after they accept your
                        request.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default ConnectElder;