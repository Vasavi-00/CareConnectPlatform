
import React, { useState } from "react";

import {
  FaIdCard,
  FaSearch,
  FaUserCircle,
  FaShieldAlt,
  FaLink,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaHeart,
} from "react-icons/fa";

import {
  connectElder,
} from "../services/api/familyApi";

import "./ConnectElder.css";

function ConnectElder({
  connectedElders = [],
  onBack,
  onSuccess,
}) {
  const [elderId, setElderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Check whether elder is already connected
  const alreadyConnected = connectedElders.some(
    (elder) =>
      (elder.careconnect_id || elder.careconnectId || "")
        .toLowerCase() === elderId.trim().toLowerCase()
  );

  const handleConnect = async (e) => {
    e.preventDefault();

    const trimmedId = elderId.trim();

    if (!trimmedId) {
      setStatus({
        type: "error",
        message:
          "Please enter the elder's CareConnect ID.",
      });
      return;
    }

    if (alreadyConnected) {
      setStatus({
        type: "error",
        message:
          "This elder is already connected to your family.",
      });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      await connectElder(trimmedId);

      setStatus({
        type: "success",
        message:
          "Elder connected successfully!",
      });

      setElderId("");
      if (typeof onSuccess === "function") {
        await onSuccess();
      }
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.detail ||
          error?.message ||
          "Unable to connect elder. Please check the ID and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connect-elder-page">

      {/* =====================================
          BACK TO FAMILY DASHBOARD
      ====================================== */}
      {typeof onBack === "function" && connectedElders?.length > 0 && (
        <button
          type="button"
          className="back-to-family-dashboard"
          onClick={() => {
            onBack();
          }}
        >
          <span className="back-arrow">←</span>
          <span>Back to Family Dashboard</span>
        </button>
      )}

      {/* =====================================
          MAIN CONNECT ELDER CARD
      ====================================== */}
      <section className="connect-elder-card">

        <div className="connect-elder-main">

          {/* =====================================
              LEFT CONTENT
          ====================================== */}
          <div className="connect-elder-info">

            <div className="connect-icon-wrapper">
              <FaLink />
            </div>

            <div>
              <span className="connect-eyebrow">
                FAMILY CONNECTION
              </span>

              <h2>
                Connect with an Elder
              </h2>

              <p>
                Add your loved one to CareConnect
                using their unique CareConnect ID
                and manage their care from one place.
              </p>
            </div>

            <div className="connection-benefits">

              {/* Private & Secure */}
              <div className="connection-benefit">

                <div className="benefit-icon">
                  <FaShieldAlt />
                </div>

                <div>
                  <strong>
                    Private & Secure
                  </strong>

                  <span>
                    Your connection stays protected.
                  </span>
                </div>

              </div>

              {/* Stay Connected */}
              <div className="connection-benefit">

                <div className="benefit-icon">
                  <FaHeart />
                </div>

                <div>
                  <strong>
                    Stay Connected
                  </strong>

                  <span>
                    Support and care from anywhere.
                  </span>
                </div>

              </div>

            </div>
          </div>

          {/* =====================================
              RIGHT FORM
          ====================================== */}
          <div className="connect-elder-form-area">

            <form
              onSubmit={handleConnect}
              className="connect-elder-form"
            >

              {/* CareConnect ID Label */}
              <label htmlFor="elder-careconnect-id">

                <FaIdCard />

                <span>
                  CareConnect ID
                </span>

              </label>

              {/* ID Input */}
              <div
                className={`elder-id-input-wrapper ${
                  elderId ? "has-value" : ""
                }`}
              >

                <FaSearch
                  className="elder-input-icon"
                />

                <input
                  id="elder-careconnect-id"
                  type="text"
                  value={elderId}
                  onChange={(e) => {
                    setElderId(e.target.value);
                    setStatus(null);
                  }}
                  placeholder="Example: CC-ELD-1024"
                  autoComplete="off"
                />

                {/* Clear ID */}
                {elderId && (
                  <button
                    type="button"
                    className="clear-id-button"
                    onClick={() => {
                      setElderId("");
                      setStatus(null);
                    }}
                    aria-label="Clear CareConnect ID"
                  >
                    ×
                  </button>
                )}

              </div>

              {/* Help Text */}
              <p className="input-help">
                Ask your loved one for their
                CareConnect ID.
              </p>

              {/* =====================================
                  ID PREVIEW
              ====================================== */}
              {elderId.trim() && (
                <div className="elder-id-preview">

                  <div className="preview-avatar">
                    <FaUserCircle />
                  </div>

                  <div className="preview-details">

                    <span>
                      Connecting with
                    </span>

                    <strong>
                      {elderId.trim()}
                    </strong>

                  </div>

                  <FaCheckCircle
                    className="preview-check"
                  />

                </div>
              )}

              {/* =====================================
                  STATUS MESSAGE
              ====================================== */}
              {status && (
                <div
                  className={`connection-status ${
                    status.type === "success"
                      ? "status-success"
                      : "status-error"
                  }`}
                >

                  {status.type === "success" ? (
                    <FaCheckCircle />
                  ) : (
                    <FaTimesCircle />
                  )}

                  <span>
                    {status.message}
                  </span>

                </div>
              )}

              {/* =====================================
                  CONNECT BUTTON
              ====================================== */}
              <button
                type="submit"
                className="connect-elder-submit"
                disabled={
                  loading ||
                  !elderId.trim()
                }
              >

                {loading ? (
                  <>
                    <span className="connect-spinner"></span>

                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Elder

                    <FaArrowRight />
                  </>
                )}

              </button>

            </form>

            {/* =====================================
                SECURITY NOTE
            ====================================== */}
            <div className="connection-security-note">

              <FaShieldAlt />

              <span>
                Only people with the correct
                CareConnect ID can be connected.
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default ConnectElder;
