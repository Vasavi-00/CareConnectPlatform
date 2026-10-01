import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGear, FaUser, FaLock, FaBell,
  FaShieldHeart, FaRightFromBracket, FaFloppyDisk, FaChevronRight,
  FaTriangleExclamation, FaTrash,
} from "react-icons/fa6";
import { deleteMyAccount, updateFamilyProfile } from "../../services/api/familyApi";
import "../../styles/family/SettingsPage.css";

export default function SettingsPage({ user, familyProfile, onProfileUpdated }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState({
    first_name: familyProfile?.first_name || user?.first_name || "",
    last_name: familyProfile?.last_name || user?.last_name || "",
    phone: familyProfile?.phone || user?.phone || "",
    alternate_phone: familyProfile?.alternate_phone || "",
    address: familyProfile?.address || "",
    city: familyProfile?.city || "",
    state: familyProfile?.state || "",
    pincode: familyProfile?.pincode || "",
  });
  const [settings, setSettings] = useState({
    notification_enabled: familyProfile?.notification_enabled ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setAccount({
      first_name: familyProfile?.first_name || user?.first_name || "",
      last_name: familyProfile?.last_name || user?.last_name || "",
      phone: familyProfile?.phone || user?.phone || "",
      alternate_phone: familyProfile?.alternate_phone || "",
      address: familyProfile?.address || "",
      city: familyProfile?.city || "",
      state: familyProfile?.state || "",
      pincode: familyProfile?.pincode || "",
    });
    setSettings({
      notification_enabled: familyProfile?.notification_enabled ?? true,
    });
  }, [familyProfile, user]);

  const toggle = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  };

  const updateAccountField = (key, value) => {
    setAccount((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const updated = await updateFamilyProfile({ ...account, ...settings });
      onProfileUpdated?.(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("careconnect_access");
    localStorage.removeItem("careconnect_refresh");
    localStorage.removeItem("careconnect_user");
    navigate("/login", { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Permanently delete your family account and its associated data? This cannot be undone.")) return;

    try {
      setDeleting(true);
      setDeleteError("");
      await deleteMyAccount();
      signOut();
    } catch (err) {
      setDeleteError(err.message || "Unable to delete your account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-page">
      <section className="settings-hero"><div className="settings-hero-left"><div className="settings-hero-icon"><FaGear /></div><div><h1>Settings</h1><p>Manage your CareConnect account and notification preferences.</p></div></div></section>

      <section className="settings-account-card">
        <div className="settings-section-header"><div><h2><FaUser /> Account Settings</h2><p>Signed in as {user?.email || familyProfile?.email || "Family Member"}.</p></div></div>
        <div className="account-settings-list">
          <div className="settings-account-fields">
            <label className="form-group">First name<input value={account.first_name} onChange={(e) => updateAccountField("first_name", e.target.value)} /></label>
            <label className="form-group">Last name<input value={account.last_name} onChange={(e) => updateAccountField("last_name", e.target.value)} /></label>
            <label className="form-group">Phone<input value={account.phone} onChange={(e) => updateAccountField("phone", e.target.value)} /></label>
            <label className="form-group">Alternate phone<input value={account.alternate_phone} onChange={(e) => updateAccountField("alternate_phone", e.target.value)} /></label>
            <label className="form-group">Address<input value={account.address} onChange={(e) => updateAccountField("address", e.target.value)} /></label>
            <label className="form-group">City<input value={account.city} onChange={(e) => updateAccountField("city", e.target.value)} /></label>
            <label className="form-group">State<input value={account.state} onChange={(e) => updateAccountField("state", e.target.value)} /></label>
            <label className="form-group">PIN code<input value={account.pincode} onChange={(e) => updateAccountField("pincode", e.target.value)} /></label>
          </div>
          <div className="account-setting-item"><div className="account-setting-icon purple"><FaLock /></div><div className="account-setting-content"><strong>Password & Security</strong><span>Use account recovery to change your password.</span></div><button type="button" className="settings-action-button" onClick={() => navigate("/forgot-password")}>Reset Password <FaChevronRight /></button></div>
        </div>
      </section>

      <section className="settings-two-column">
        <div className="notification-settings-card">
          <div className="settings-section-header"><div><h2><FaBell /> Notifications</h2><p>This preference is saved to your family account and applied to new in-app alerts.</p></div></div>
          <div className="settings-toggle-list">
            <ToggleSetting icon={<FaBell />} iconClass="orange" title="In-app notifications" description="Enable or disable regular CareConnect alerts. Critical SOS alerts remain enabled." enabled={settings.notification_enabled} onClick={() => toggle("notification_enabled")} />
          </div>
        </div>
        <div className="dashboard-preferences-card">
          <div className="settings-section-header"><div><h2><FaShieldHeart /> Connected care</h2><p>Manage elders connected to your family account.</p></div></div>
          <div className="privacy-list"><PrivacyItem icon={<FaUser />} title="Connected elders" description="View your family dashboard and linked elder profiles." button="View dashboard" onClick={() => navigate("/dashboard/family")} /></div>
        </div>
      </section>

      {error && <p role="alert" className="settings-error">{error}</p>}
      <div className="settings-save-area">{saved && <span className="settings-saved-message">✓ Changes saved successfully</span>}<button type="button" className="settings-save-button" onClick={handleSave} disabled={saving}><FaFloppyDisk />{saving ? "Saving…" : "Save Changes"}</button></div>
      <section className="logout-card"><div className="logout-icon"><FaRightFromBracket /></div><div className="logout-content"><h3>Sign Out</h3><p>Sign out of your CareConnect family account on this device.</p></div><button type="button" className="logout-button" onClick={signOut}>Sign Out</button></section>
      <section className="delete-account-card"><div className="delete-account-icon"><FaTriangleExclamation /></div><div className="delete-account-content"><h3>Delete Family Account</h3><p>Permanently delete your account and associated family data.</p>{deleteError && <span role="alert">{deleteError}</span>}</div><button type="button" className="delete-account-button" onClick={handleDeleteAccount} disabled={deleting}><FaTrash />{deleting ? "Deleting…" : "Delete Account"}</button></section>
    </div>
  );
}

function ToggleSetting({ icon, iconClass, title, description, enabled, onClick }) {
  return <div className="toggle-setting"><div className={`toggle-setting-icon ${iconClass}`}>{icon}</div><div className="toggle-setting-content"><strong>{title}</strong><span>{description}</span></div><button type="button" className={`toggle-switch ${enabled ? "active" : ""}`} onClick={onClick} aria-label={`Toggle ${title}`} aria-pressed={enabled}><span /></button></div>;
}

function PrivacyItem({ icon, title, description, button, onClick }) {
  return <div className="privacy-item"><div className="privacy-icon">{icon}</div><div className="privacy-content"><strong>{title}</strong><span>{description}</span></div><button type="button" className="privacy-action" onClick={onClick}>{button}<FaChevronRight /></button></div>;
}
