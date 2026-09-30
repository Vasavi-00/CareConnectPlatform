import React, { useEffect, useState } from "react";
import {
  FaUser, FaPhone, FaEnvelope, FaLocationDot, FaTriangleExclamation,
  FaLanguage, FaPlus, FaTrash, FaPen, FaXmark, FaFloppyDisk, FaShieldHeart,
} from "react-icons/fa6";
import {
  createEmergencyContact, deleteEmergencyContact, getEmergencyContacts,
  updateEmergencyContact,
} from "../../services/api/familyApi";
import "../../styles/family/ParentProfilePage.css";

const emptyContact = { name: "", relationship: "", phone: "", priority: 1, can_receive_sos: true };

export default function ParentProfilePage({ selectedElder }) {
  const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;
  const elderName = selectedElder?.elder_name || selectedElder?.elder?.name || "Connected elder";
  const canManageContacts = selectedElder?.can_manage_emergency_contacts !== false;
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState(emptyContact);

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
          <div className="profile-card-header"><div><h2><FaUser /> Profile Overview</h2><p>Read-only information from the connected elder profile.</p></div></div>
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
      </>}

      {showContactModal && <div className="profile-modal-overlay" onClick={() => setShowContactModal(false)}><div className="profile-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><h2>{editingContact ? "Edit Emergency Contact" : "Add Emergency Contact"}</h2><p>Manage an emergency contact for {elderName}.</p></div><button type="button" onClick={() => setShowContactModal(false)}><FaXmark /></button></div>
        <form onSubmit={saveContact}><div className="modal-form-grid"><div className="form-group"><label>Full Name</label><input required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} /></div><div className="form-group"><label>Relationship</label><input required value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} /></div><div className="form-group"><label>Phone Number</label><input required value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div><label className="primary-checkbox"><input type="checkbox" checked={contactForm.can_receive_sos} onChange={(e) => setContactForm({ ...contactForm, can_receive_sos: e.target.checked })} /><span>Can receive SOS alerts</span></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowContactModal(false)}>Cancel</button><button type="submit" className="save-button" disabled={saving}><FaFloppyDisk />{saving ? "Saving…" : editingContact ? "Save Contact" : "Add Contact"}</button></div></form>
      </div></div>}
    </div>
  );
}
