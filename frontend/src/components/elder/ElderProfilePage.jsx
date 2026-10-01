import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaGear,
  FaCheck,
  FaLanguage,
  FaVolumeHigh,
  FaGaugeHigh,
  FaTextHeight,
  FaCircleHalfStroke,
  FaLocationDot,
  FaPhone,
  FaIdCard,
  FaPen,
  FaXmark,
  FaFloppyDisk,
  FaTrash,
  FaTriangleExclamation,
} from "react-icons/fa6";

import { deleteMyAccount, updateElderProfile } from "../../services/api/elderApi";

export default function ElderProfilePage({
  user,
  profile,
  onProfileUpdated,
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    preferred_language: profile?.preferred_language || "English",
    voice_enabled: profile?.voice_enabled !== false,
    voice_speed: profile?.voice_speed || 1,
    font_size: profile?.font_size || "large",
    high_contrast: profile?.high_contrast ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        preferred_language: profile.preferred_language || "English",
        voice_enabled: profile.voice_enabled !== false,
        voice_speed: profile.voice_speed || 1,
        font_size: profile.font_size || "large",
        high_contrast: profile.high_contrast ?? false,
      });
    }
  }, [profile]);

  const firstName =
    profile?.first_name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Elder";

  const fullName =
    `${profile?.first_name || user?.first_name || ""} ${
      profile?.last_name || user?.last_name || ""
    }`.trim() || firstName;

  const openProfileEditor = () => {
    setProfileForm({
      first_name: profile?.first_name || user?.first_name || "",
      last_name: profile?.last_name || user?.last_name || "",
      phone: user?.phone || profile?.phone || "",
      date_of_birth: profile?.date_of_birth || "",
      gender: profile?.gender || "",
      address: profile?.address || "",
      city: profile?.city || "",
      state: profile?.state || "",
      pincode: profile?.pincode || "",
      medical_notes: profile?.medical_notes || "",
      emergency_notes: profile?.emergency_notes || "",
    });
    setProfileError("");
    setEditingProfile(true);
  };

  const savePersonalProfile = async (event) => {
    event.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError("");
      const updated = await updateElderProfile(profileForm);
      onProfileUpdated?.(updated);
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err?.message || "Unable to update your profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Permanently delete your elder account and associated care data? This cannot be undone.")) return;

    try {
      setDeletingAccount(true);
      setDeleteAccountError("");
      await deleteMyAccount();
      localStorage.removeItem("careconnect_access");
      localStorage.removeItem("careconnect_refresh");
      localStorage.removeItem("careconnect_user");
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteAccountError(err?.message || "Unable to delete your account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveError("");
      setSaveSuccess(false);

      const payload = {
        preferred_language: form.preferred_language,
        voice_enabled: Boolean(form.voice_enabled),
        voice_speed: Number(form.voice_speed),
        font_size: form.font_size,
        high_contrast: Boolean(form.high_contrast),
      };

      const updated = await updateElderProfile(payload);

      // Save preference keys in localStorage for immediate session persistence
      localStorage.setItem("careconnect_language", form.preferred_language);
      localStorage.setItem("careconnect_high_contrast", String(form.high_contrast));

      // Apply body classes
      document.body.classList.remove(
        "elder-font-normal",
        "elder-font-large",
        "elder-font-xlarge"
      );
      document.body.classList.add(`elder-font-${form.font_size}`);

      if (form.high_contrast) {
        document.body.classList.add("elder-high-contrast");
      } else {
        document.body.classList.remove("elder-high-contrast");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err) {
      console.error("Save profile settings error:", err);
      setSaveError(err?.message || "Unable to save your settings right now.");
    } finally {
      setSaving(false);
    }
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
          <h1>My Profile & Preferences</h1>
          <p>Personal profile details and accessibility settings</p>
        </div>
      </div>

      <div className="elder-profile-grid">
        {/* Left: Personal Profile Card */}
        <div className="elder-card elder-profile-info-card">
          <div className="elder-card-header">
            <div><span className="card-eyebrow">PERSONAL DETAILS</span><h2>My Profile</h2></div>
            <button type="button" className="btn-save-settings" onClick={openProfileEditor}><FaPen /> Edit Profile</button>
          </div>
          <div className="profile-hero-center">
            <div className="profile-large-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <h2>{fullName}</h2>
            <span className="profile-elder-badge">CareConnect Elder</span>

            <div className="profile-cc-id-box">
              <FaIdCard />
              <div>
                <small>Your CareConnect ID</small>
                <strong>{profile?.careconnect_id || "Generating..."}</strong>
              </div>
            </div>
            <p className="cc-id-share-note">
              Share this ID with your family so they can connect with your care.
            </p>
          </div>

          <div className="profile-details-table">
            <div className="profile-row">
              <span>Date of Birth</span>
              <strong>{profile?.date_of_birth || "Not specified"}</strong>
            </div>
            <div className="profile-row">
              <span>Gender</span>
              <strong>{profile?.gender || "Not specified"}</strong>
            </div>
            <div className="profile-row">
              <span>Phone</span>
              <strong>{user?.phone || profile?.phone || "Not specified"}</strong>
            </div>
            <div className="profile-row">
              <span>Email</span>
              <strong>{user?.email || "—"}</strong>
            </div>
            <div className="profile-row">
              <span>Location</span>
              <strong>
                {[profile?.city, profile?.state].filter(Boolean).join(", ") ||
                  "India"}
              </strong>
            </div>
            {profile?.address && (
              <div className="profile-row address-row">
                <span>Address</span>
                <strong>{profile.address}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right: Accessibility & Language Settings Card */}
        <div className="elder-card elder-settings-card">
          <div className="elder-card-header">
            <div>
              <span className="card-eyebrow">PREFERENCES</span>
              <h2>Accessibility & Voice Settings</h2>
            </div>
            <FaGear className="header-card-icon" />
          </div>

          {saveSuccess && (
            <div className="elder-toast-banner">
              <FaCheck /> Your settings have been saved successfully!
            </div>
          )}

          {saveError && (
            <div className="elder-error-banner">
              {saveError}
            </div>
          )}

          <form onSubmit={handleSave} className="elder-settings-form">
            {/* Preferred Language */}
            <div className="setting-field">
              <label>
                <FaLanguage />
                <div>
                  <strong>Preferred Language</strong>
                  <small>For AI Companion voice and screen text</small>
                </div>
              </label>
              <select
                value={form.preferred_language}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    preferred_language: e.target.value,
                  }))
                }
              >
                <option value="English">English</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
              </select>
            </div>

            {/* Voice Enabled */}
            <div className="setting-field">
              <label>
                <FaVolumeHigh />
                <div>
                  <strong>Voice Reading</strong>
                  <small>Read reminders and AI replies out loud</small>
                </div>
              </label>
              <select
                value={String(form.voice_enabled)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    voice_enabled: e.target.value === "true",
                  }))
                }
              >
                <option value="true">Voice On (Recommended)</option>
                <option value="false">Voice Off</option>
              </select>
            </div>

            {/* Voice Speed */}
            <div className="setting-field">
              <label>
                <FaGaugeHigh />
                <div>
                  <strong>Voice Speed</strong>
                  <small>How fast voice messages are read aloud</small>
                </div>
              </label>
              <select
                value={String(form.voice_speed)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    voice_speed: Number(e.target.value),
                  }))
                }
              >
                <option value="0.8">Slower (Gentle pace)</option>
                <option value="1">Normal speed</option>
                <option value="1.2">Faster pace</option>
              </select>
            </div>

            {/* Text Size */}
            <div className="setting-field">
              <label>
                <FaTextHeight />
                <div>
                  <strong>Text Size</strong>
                  <small>Adjust font size for comfortable reading</small>
                </div>
              </label>
              <select
                value={form.font_size}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    font_size: e.target.value,
                  }))
                }
              >
                <option value="normal">Normal</option>
                <option value="large">Large (Recommended)</option>
                <option value="xlarge">Extra Large</option>
              </select>
            </div>

            {/* High Contrast */}
            <div className="setting-field">
              <label>
                <FaCircleHalfStroke />
                <div>
                  <strong>High Contrast Mode</strong>
                  <small>Increase visual clarity and darker outlines</small>
                </div>
              </label>
              <select
                value={String(form.high_contrast)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    high_contrast: e.target.value === "true",
                  }))
                }
              >
                <option value="false">Standard Mode</option>
                <option value="true">High Contrast Mode</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-save-settings"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>

      <section className="elder-delete-account-card">
        <div className="elder-delete-account-icon"><FaTriangleExclamation /></div>
        <div className="elder-delete-account-content">
          <h2>Delete Elder Account</h2>
          <p>Permanently delete your account and associated care data.</p>
          {deleteAccountError && <span role="alert">{deleteAccountError}</span>}
        </div>
        <button type="button" onClick={handleDeleteAccount} disabled={deletingAccount}><FaTrash />{deletingAccount ? "Deleting…" : "Delete Account"}</button>
      </section>

      {editingProfile && (
        <div className="elder-profile-edit-overlay" onClick={() => setEditingProfile(false)}>
          <form className="elder-profile-edit-modal" onClick={(event) => event.stopPropagation()} onSubmit={savePersonalProfile}>
            <div className="elder-profile-edit-header"><div><h2>Edit Personal Profile</h2><p>Update the details shared with your care circle.</p></div><button type="button" onClick={() => setEditingProfile(false)} aria-label="Close"><FaXmark /></button></div>
            <div className="elder-profile-edit-fields">
              {[["First name", "first_name"], ["Last name", "last_name"], ["Phone", "phone"], ["Date of birth", "date_of_birth"], ["Gender", "gender"], ["Address", "address"], ["City", "city"], ["State", "state"], ["PIN code", "pincode"]].map(([label, key]) => <label className="form-group" key={key}>{label}<input type={key === "date_of_birth" ? "date" : "text"} value={profileForm[key] || ""} onChange={(event) => setProfileForm((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
              <label className="form-group">Medical notes<textarea value={profileForm.medical_notes || ""} onChange={(event) => setProfileForm((current) => ({ ...current, medical_notes: event.target.value }))} /></label>
              <label className="form-group">Emergency notes<textarea value={profileForm.emergency_notes || ""} onChange={(event) => setProfileForm((current) => ({ ...current, emergency_notes: event.target.value }))} /></label>
            </div>
            {profileError && <p role="alert" className="profile-error">{profileError}</p>}
            <div className="elder-profile-edit-actions"><button type="button" onClick={() => setEditingProfile(false)}>Cancel</button><button type="submit" disabled={profileSaving}><FaFloppyDisk />{profileSaving ? "Saving…" : "Save Profile"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
