import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPills,
  FaCheck,
  FaVolumeHigh,
  FaClock,
  FaUtensils,
  FaBoxArchive,
} from "react-icons/fa6";

import { takeMedicine } from "../../services/api/elderApi";
import { speakText } from "../../services/voice/speechSynthesis";

const getMedicineTimes = (medicine) => {
  const values = Array.isArray(medicine?.times) ? medicine.times : [];
  const times = values
    .map((value) => {
      if (typeof value === "string") {
        return value.match(/\b\d{1,2}:\d{2}\b/)?.[0] || "";
      }
      return value?.time || "";
    })
    .filter(Boolean);

  if (times.length) return times.join(", ");

  return String(medicine?.timing || "").match(/\b\d{1,2}:\d{2}\b/g)?.join(", ") || "";
};

export default function ElderMedicinesPage({
  medicines = [],
  profile,
  onRefreshData,
}) {
  const navigate = useNavigate();

  const [takenPills, setTakenPills] = useState(() => {
    try {
      const stored = localStorage.getItem("careconnect_elder_taken_pills");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [takingId, setTakingId] = useState(null);
  const [successToast, setSuccessToast] = useState("");

  const isTelugu = profile?.preferred_language === "Telugu";

  const handleTake = async (medicine) => {
    if (!medicine?.id || takingId) return;

    try {
      setTakingId(medicine.id);
      await takeMedicine(medicine.id, medicine.quantity);

      const updated = {
        ...takenPills,
        [medicine.id]: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setTakenPills(updated);
      localStorage.setItem(
        "careconnect_elder_taken_pills",
        JSON.stringify(updated)
      );

      setSuccessToast(`Marked ${medicine.name} as taken!`);
      setTimeout(() => setSuccessToast(""), 3500);

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      console.error("Failed to take medicine:", err);
      setSuccessToast("Unable to record medicine at this time.");
      setTimeout(() => setSuccessToast(""), 3500);
    } finally {
      setTakingId(null);
    }
  };

  const handleHearReminder = (medicine) => {
    const speechMsg = isTelugu
      ? `మందు పేరు: ${medicine.name}. మోతాదు: ${medicine.dosage}. సమయం: ${
          getMedicineTimes(medicine)
            ? getMedicineTimes(medicine)
            : "నిర్ణయించబడిన సమయం"
        }. ${medicine.food_timing || ""}.`
      : `Medicine: ${medicine.name}. Dosage: ${medicine.dosage}. Scheduled for ${
          getMedicineTimes(medicine)
            ? getMedicineTimes(medicine)
            : "scheduled time"
        }. ${medicine.food_timing || "Please take with water"}.`;

    speakText(speechMsg, isTelugu ? "te-IN" : "en-IN", profile?.voice_speed || 1);
  };

  return (
    <div className="elder-subpage">
      <div className="elder-subpage-header">
        <button
          type="button"
          className="elder-back-btn"
          onClick={() => navigate("/elder/dashboard")}
        >
          <FaArrowLeft /> Back to Home
        </button>
        <div>
          <h1>My Medicines</h1>
          <p>Here are all your active prescribed medications and schedules</p>
        </div>
      </div>

      {successToast && (
        <div className="elder-toast-banner">
          <FaCheck /> {successToast}
        </div>
      )}

      {medicines.length === 0 ? (
        <div className="elder-card elder-empty-full">
          <FaPills className="empty-icon-lg" />
          <h2>No Medicines Listed</h2>
          <p>You currently do not have any prescribed medicines recorded.</p>
        </div>
      ) : (
        <div className="elder-medicines-grid">
          {medicines.map((med) => {
            const isTaken = Boolean(takenPills[med.id]);
            const isLowStock =
              med.quantity <= (med.low_stock_threshold || 5) &&
              med.quantity > 0;
            const isOutOfStock = med.quantity <= 0;

            return (
              <div key={med.id} className="elder-card elder-med-card">
                <div className="elder-med-card-top">
                  <div className="med-card-icon-title">
                    <div className="med-circle-icon">
                      <FaPills />
                    </div>
                    <div>
                      <h2>{med.name}</h2>
                      <span className="med-dosage-text">{med.dosage}</span>
                    </div>
                  </div>

                  <span
                    className={`stock-badge ${
                      isOutOfStock ? "out" : isLowStock ? "low" : "available"
                    }`}
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : isLowStock
                        ? "Low Stock"
                        : "Available"}
                  </span>
                </div>

                <div className="elder-med-card-body">
                  <div className="med-info-chip">
                    <FaClock />
                    <div>
                      <small>Schedule Times</small>
                      <strong>
                        {getMedicineTimes(med)
                          ? getMedicineTimes(med)
                          : "Scheduled Time"}
                      </strong>
                    </div>
                  </div>

                  <div className="med-info-chip">
                    <FaUtensils />
                    <div>
                      <small>Food Instructions</small>
                      <strong>{med.food_timing || "Any time"}</strong>
                    </div>
                  </div>

                  <div className="med-info-chip">
                    <FaBoxArchive />
                    <div>
                      <small>Remaining Quantity</small>
                      <strong>{med.quantity ?? "—"} pills left</strong>
                    </div>
                  </div>
                </div>

                <div className="elder-med-card-actions">
                  {isTaken ? (
                    <div className="taken-status-alert">
                      <FaCheck /> Taken today at {takenPills[med.id]}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-take-pill-large"
                      onClick={() => handleTake(med)}
                      disabled={takingId === med.id}
                    >
                      {takingId === med.id
                        ? "Recording..."
                        : "✓ I Took This Medicine"}
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-hear-reminder"
                    onClick={() => handleHearReminder(med)}
                  >
                    <FaVolumeHigh /> Hear Reminder
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
