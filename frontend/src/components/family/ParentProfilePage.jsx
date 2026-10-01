import React, { useEffect, useState } from "react";
import {
  FaUser, FaPhone, FaEnvelope, FaLocationDot, FaTriangleExclamation,
  FaLanguage, FaPlus, FaTrash, FaPen, FaXmark, FaFloppyDisk, FaShieldHeart,
} from "react-icons/fa6";
import {
  createEmergencyContact, deleteEmergencyContact, disconnectConnectedElder, getEmergencyContacts,
  updateEmergencyContact, updateConnectedElderProfile,
} from "../../services/api/familyApi";
import "../../styles/family/ParentProfilePage.css";

const emptyContact = { name: "", relationship: "", phone: "", priority: 1, can_receive_sos: true };

export default function ParentProfilePage({ selectedElder, onElderProfileUpdated, onElderDisconnected }) {
  const elderId = selectedElder?.elder_id || selectedElder?.elder?.id || selectedElder?.id;
  const elderName = selectedElder?.elder_name || selectedElder?.elder?.name || selectedElder?.name || "Connected elder";
  const canManageContacts = selectedElder?.can_manage_emergency_contacts !== false;
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [editingElderProfile, setEditingElderProfile] = useState(false);
  const [elderProfileSaving, setElderProfileSaving] = useState(false);
  const [elderProfileError, setElderProfileError] = useState("");
  const [elderForm, setElderForm] = useState({});
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState("");

  const disconnectElder = async () => {
    if (!elderId || disconnecting) return;
    if (!window.confirm(`Disconnect ${elderName} from your family account? Their account and care data will remain intact.`)) return;

    try {
      setDisconnecting(true);
      setDisconnectError("");
      await disconnectConnectedElder(elderId);
      await onElderDisconnected?.();
    } catch (err) {
      setDisconnectError(err.message || "Unable to disconnect this elder.");
    } finally {
      setDisconnecting(false);
    }
  };

  const openElderProfileEditor = () => {
    setElderForm({
      first_name: selectedElder?.first_name || "",
      last_name: selectedElder?.last_name || "",
      phone: selectedElder?.elder_phone || selectedElder?.phone || "",
      date_of_birth: selectedElder?.elder_date_of_birth || selectedElder?.date_of_birth || "",
      gender: selectedElder?.elder_gender || selectedElder?.gender || "",
      address: selectedElder?.elder_address || selectedElder?.address || "",
      city: selectedElder?.elder_city || selectedElder?.city || "",
      state: selectedElder?.elder_state || selectedElder?.state || "",
      pincode: selectedElder?.elder_pincode || selectedElder?.pincode || "",
      preferred_language: selectedElder?.elder_preferred_language || selectedElder?.preferred_language || "English",
      medical_notes: selectedElder?.elder_medical_notes || selectedElder?.medical_notes || "",
      emergency_notes: selectedElder?.elder_emergency_notes || selectedElder?.emergency_notes || "",
    });
    setElderProfileError("");
    setEditingElderProfile(true);
  };

  const saveElderProfile = async (event) => {
    event.preventDefault();
    if (!elderId) return;
    try {
      setElderProfileSaving(true);
      setElderProfileError("");
      const updated = await updateConnectedElderProfile(elderId, elderForm);
      onElderProfileUpdated?.(updated);
      setEditingElderProfile(false);
    } catch (err) {
      setElderProfileError(err.message || "Unable to update the elder profile.");
    } finally {
      setElderProfileSaving(false);
    }
  };

  const loadContacts = async () => {
    if (!elderId) { setContacts([]); setLoading(false); return; }
    try {
      setLoading(true);
      setError("");
      setContacts(await getEmergencyContacts(elderId));
    } catch (err) { setError(err.message || "Unable to load emergency contacts."); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadContacts(); }, [elderId]);

  const openAddContact = () => { setEditingContact(null); setContactForm({ ...emptyContact, priority: contacts.length ? contacts.length + 1 : 1 }); setShowContactModal(true); };
  const openEditContact = (contact) => {
    setEditingContact(contact.id);
    setContactForm({ name: contact.name, relationship: contact.relationship, phone: contact.phone, priority: contact.priority, can_receive_sos: contact.can_receive_sos });
    setShowContactModal(true);
  };

  const saveContact = async (event) => {
    event.preventDefault();
    if (!elderId) return;
    try {
      setSaving(true); setError("");
      const payload = { ...contactForm, elder_id: elderId, priority: Number(contactForm.priority) || 1 };
      if (editingContact) await updateEmergencyContact(editingContact, payload);
      else await createEmergencyContact(payload);
      setShowContactModal(false);
      await loadContacts();
    } catch (err) { setError(err.message || "Unable to save emergency contact."); }
    finally { setSaving(false); }
  };

  const removeContact = async (id) => {
    if (!window.confirm("Delete this emergency contact?")) return;
    try { setError(""); await deleteEmergencyContact(id); setContacts((items) => items.filter((item) => item.id !== id)); }
    catch (err) { setError(err.message || "Unable to delete emergency contact."); }
  };

  const makePrimary = async (contact) => {
    try {
      setError("");
      const updates = contacts.map((item, index) => updateEmergencyContact(item.id, { priority: item.id === contact.id ? 1 : index + 2 }));
      await Promise.all(updates);
      await loadContacts();
    } catch (err) { setError(err.message || "Unable to update contact priority."); }
  };

  const dob = selectedElder?.elder_date_of_birth || selectedElder?.date_of_birth;
  const address = [selectedElder?.elder_address || selectedElder?.address, selectedElder?.elder_city || selectedElder?.city, selectedElder?.elder_state || selectedElder?.state, selectedElder?.elder_pincode || selectedElder?.pincode].filter(Boolean).join(", ");
  const medicalNotes = selectedElder?.elder_medical_notes || selectedElder?.medical_notes || "No medical notes have been provided.";
  const emergencyNotes = selectedElder?.elder_emergency_notes || selectedElder?.emergency_notes || "No emergency notes have been provided.";

  return (
    <div className="parent-profile-page">
      <section className="profile-hero"><div className="profile-hero-left"><div className="profile-hero-icon"><FaUser /></div><div><h1>Parent Profile</h1><p>Profile information shared by {elderName}.</p></div></div></section>

      {!selectedElder ? <section className="profile-overview-card"><h2>No elder connected</h2><p>Connect an elder to view their shared profile information.</p></section> : <>
        <section className="profile-overview-card">
          <div className="profile-card-header"><div><h2><FaUser /> Profile Overview</h2><p>Profile information shared by {elderName}.</p></div><button type="button" className="add-contact-button" onClick={openElderProfileEditor}><FaPen /> Edit Elder Profile</button></div>
          <div className="profile-overview-content"><div className="profile-avatar-large"><FaUser /></div><div className="profile-main-info"><h3>{elderName}</h3><div className="profile-info-grid">
            <div className="profile-info-item"><span>Date of Birth</span><strong>{dob || "Not provided"}</strong></div>
            <div className="profile-info-item"><span>Gender</span><strong>{selectedElder?.elder_gender || selectedElder?.gender || "Not provided"}</strong></div>
            <div className="profile-info-item"><span><FaPhone /> Phone</span><strong>{selectedElder?.elder_phone || selectedElder?.phone || "Not provided"}</strong></div>
            <div className="profile-info-item"><span><FaEnvelope /> Email</span><strong>{selectedElder?.elder_email || "Not provided"}</strong></div>
            <div className="profile-info-item profile-address"><span><FaLocationDot /> Address</span><strong>{address || "Not provided"}</strong></div>
          </div></div></div>
        </section>

        <section className="profile-two-column">
          <div className="care-information-card"><div className="profile-card-header"><div><h2><FaShieldHeart /> Medical Information</h2><p>Notes shared in the elder profile.</p></div></div><div className="care-info-list"><div className="care-info-row"><div className="care-info-icon warning"><FaTriangleExclamation /></div><div><span>Medical notes</span><strong>{medicalNotes}</strong></div></div><div className="care-info-row"><div className="care-info-icon warning"><FaTriangleExclamation /></div><div><span>Emergency notes</span><strong>{emergencyNotes}</strong></div></div></div></div>
          <div className="care-preferences-card"><div className="profile-card-header"><div><h2><FaLanguage /> Care Preferences</h2><p>Preferences shared by the elder.</p></div></div><div className="preferences-list"><div className="preference-item"><div className="preference-icon"><FaLanguage /></div><div><span>Preferred Language</span><strong>{selectedElder?.elder_preferred_language || selectedElder?.preferred_language || "Not provided"}</strong></div></div></div></div>
        </section>

        <section className="emergency-contacts-card"><div className="profile-card-header"><div><h2><FaTriangleExclamation /> Emergency Contacts</h2><p>Contacts used for emergency notifications and SOS.</p></div>{canManageContacts && <button type="button" className="add-contact-button" onClick={openAddContact}><FaPlus /> Add Emergency Contact</button>}</div>
          {error && <p role="alert" className="profile-error">{error}</p>}
          {loading ? <p>Loading emergency contacts…</p> : contacts.length ? <div className="contacts-grid">{contacts.map((contact) => <div className={`contact-card ${contact.priority === 1 ? "primary-contact" : ""}`} key={contact.id}>
            {contact.priority === 1 && <span className="primary-badge">Primary Contact</span>}
            <div className="contact-top"><div className="contact-avatar"><FaUser /></div><div><h3>{contact.name}</h3><span>{contact.relationship}</span></div></div>
            <div className="contact-details"><div><FaPhone /><a href={`tel:${contact.phone}`}>{contact.phone}</a></div><div><FaShieldHeart /><span>{contact.can_receive_sos ? "Receives SOS alerts" : "SOS alerts disabled"}</span></div></div>
            {canManageContacts && <div className="contact-actions"><button type="button" className="contact-edit" onClick={() => openEditContact(contact)}><FaPen /> Edit</button><button type="button" className="contact-delete" onClick={() => removeContact(contact.id)}><FaTrash /> Delete</button>{contact.priority !== 1 && <button type="button" className="primary-contact-button" onClick={() => makePrimary(contact)}>Make Primary</button>}</div>}
          </div>)}</div> : <p>No emergency contacts have been added.</p>}
        </section>
        <section className="disconnect-elder-card"><div><h2>Remove Connected Elder</h2><p>This removes {elderName} from your family dashboard. Their account and care information will not be deleted.</p>{disconnectError && <p role="alert" className="profile-error">{disconnectError}</p>}</div><button type="button" className="disconnect-elder-button" onClick={disconnectElder} disabled={disconnecting}><FaTrash />{disconnecting ? "Disconnecting…" : "Disconnect Elder"}</button></section>
      </>}

      {showContactModal && <div className="profile-modal-overlay" onClick={() => setShowContactModal(false)}><div className="profile-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{editingContact ? "Edit Emergency Contact" : "Add Emergency Contact"}</h2><p>Manage an emergency contact for {elderName}.</p></div><button type="button" onClick={() => setShowContactModal(false)}><FaXmark /></button></div>
        <form onSubmit={saveContact}><div className="modal-form-grid"><div className="form-group"><label>Full Name</label><input required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} /></div><div className="form-group"><label>Relationship</label><input required value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} /></div><div className="form-group"><label>Phone Number</label><input required value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div><label className="primary-checkbox"><input type="checkbox" checked={contactForm.can_receive_sos} onChange={(e) => setContactForm({ ...contactForm, can_receive_sos: e.target.checked })} /><span>Can receive SOS alerts</span></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowContactModal(false)}>Cancel</button><button type="submit" className="save-button" disabled={saving}><FaFloppyDisk />{saving ? "Saving…" : editingContact ? "Save Contact" : "Add Contact"}</button></div></form>
      </div></div>}

      {editingElderProfile && <div className="profile-modal-overlay" onClick={() => setEditingElderProfile(false)}><form className="profile-modal" onClick={(event) => event.stopPropagation()} onSubmit={saveElderProfile}>
        <div className="modal-header"><div><h2>Edit {elderName}&apos;s Profile</h2><p>Update the elder&apos;s profile details and care information.</p></div><button type="button" onClick={() => setEditingElderProfile(false)} aria-label="Close"><FaXmark /></button></div>
        <div className="modal-form-grid">{[["First name", "first_name"], ["Last name", "last_name"], ["Phone", "phone"], ["Date of birth", "date_of_birth"], ["Gender", "gender"], ["Address", "address"], ["City", "city"], ["State", "state"], ["PIN code", "pincode"], ["Preferred language", "preferred_language"]].map(([label, key]) => <label className="form-group" key={key}>{label}<input type={key === "date_of_birth" ? "date" : "text"} value={elderForm[key] || ""} onChange={(event) => setElderForm((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
          <label className="form-group">Medical notes<textarea value={elderForm.medical_notes || ""} onChange={(event) => setElderForm((current) => ({ ...current, medical_notes: event.target.value }))} /></label><label className="form-group">Emergency notes<textarea value={elderForm.emergency_notes || ""} onChange={(event) => setElderForm((current) => ({ ...current, emergency_notes: event.target.value }))} /></label>
        </div>
        {elderProfileError && <p role="alert" className="profile-error">{elderProfileError}</p>}
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setEditingElderProfile(false)}>Cancel</button><button type="submit" className="save-button" disabled={elderProfileSaving}><FaFloppyDisk />{elderProfileSaving ? "Saving…" : "Save Elder Profile"}</button></div>
      </form></div>}
    </div>
  );
}
