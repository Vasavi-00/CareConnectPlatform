import React, { useState } from "react";
import {
  FaUser,
  FaPen,
  FaPhone,
  FaEnvelope,
  FaLocationDot,
  FaDroplet,
  FaTriangleExclamation,
  FaUserDoctor,
  FaHospital,
  FaLanguage,
  FaWheelchair,
  FaUtensils,
  FaBell,
  FaPlus,
  FaTrash,
  FaFileMedical,
  FaPrescriptionBottleMedical,
  FaShieldHeart,
  FaUpload,
  FaEye,
  FaXmark,
  FaFloppyDisk,
} from "react-icons/fa6";

import "../../styles/family/ParentProfilePage.css";

export default function ParentProfilePage() {
  const [profile, setProfile] = useState({
    name: "Priya Sharma",
    age: "68",
    gender: "Female",
    dob: "12 May 1958",
    phone: "+91 98765 43210",
    email: "priya.sharma@example.com",
    address: "Tirupati, Andhra Pradesh",
    bloodGroup: "O+",
    allergies: "No known allergies",
    conditions: "Diabetes, Hypertension",
    doctor: "Dr. Mehta",
    hospital: "Care Multispeciality Hospital",
  });

  const [preferences, setPreferences] = useState({
    language: "Telugu",
    mobility: "Assisted",
    diet: "Vegetarian",
    reminders: "Enabled",
  });

  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: "Anitha Sharma",
      relation: "Daughter",
      phone: "+91 91234 56789",
      email: "anitha@example.com",
      primary: true,
    },
    {
      id: 2,
      name: "Ravi Sharma",
      relation: "Son",
      phone: "+91 99887 66554",
      email: "ravi@example.com",
      primary: false,
    },
  ]);

  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: "Medical Reports",
      type: "medical",
      file: "Blood_Test_Report.pdf",
    },
    {
      id: 2,
      name: "Prescription",
      type: "prescription",
      file: "Current_Prescription.pdf",
    },
    {
      id: 3,
      name: "Insurance Document",
      type: "insurance",
      file: "Health_Insurance.pdf",
    },
  ]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCareModal, setShowCareModal] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const [editingContact, setEditingContact] = useState(null);

  const [contactForm, setContactForm] = useState({
    name: "",
    relation: "",
    phone: "",
    email: "",
    primary: false,
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;

    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddContact = () => {
    setEditingContact(null);

    setContactForm({
      name: "",
      relation: "",
      phone: "",
      email: "",
      primary: false,
    });

    setShowContactModal(true);
  };

  const openEditContact = (contact) => {
    setEditingContact(contact.id);

    setContactForm({
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone,
      email: contact.email,
      primary: contact.primary,
    });

    setShowContactModal(true);
  };

  const handleContactChange = (e) => {
    const { name, value, type, checked } = e.target;

    setContactForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveContact = (e) => {
    e.preventDefault();

    if (editingContact) {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === editingContact
            ? {
                ...contact,
                ...contactForm,
              }
            : contact
        )
      );
    } else {
      setContacts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...contactForm,
        },
      ]);
    }

    setShowContactModal(false);
  };

  const deleteContact = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this emergency contact?"
    );

    if (confirmed) {
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
    }
  };

  const setPrimaryContact = (id) => {
    setContacts((prev) =>
      prev.map((contact) => ({
        ...contact,
        primary: contact.id === id,
      }))
    );
  };

  const addDocument = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setDocuments((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: file.name,
        type: "uploaded",
        file: file.name,
      },
    ]);
  };

  const getDocumentIcon = (type) => {
    if (type === "medical") return <FaFileMedical />;
    if (type === "prescription") return <FaPrescriptionBottleMedical />;
    if (type === "insurance") return <FaShieldHeart />;

    return <FaFileMedical />;
  };

  return (
    <div className="parent-profile-page">

      {/* PAGE HEADING */}
      <section className="profile-hero">
        <div className="profile-hero-left">
          <div className="profile-hero-icon">
            <FaUser />
          </div>

          <div>
            <h1>Parent Profile</h1>
            <p>
              Manage your parent's personal, medical and care information.
            </p>
          </div>
        </div>

        <div className="profile-hero-right">
          <span>“Everything about their care</span>
          <span>in one safe and simple place.”</span>
        </div>
      </section>

      {/* PROFILE OVERVIEW */}
      <section className="profile-overview-card">

        <div className="profile-card-header">
          <div>
            <h2>
              <FaUser /> Profile Overview
            </h2>
            <p>Basic information about your parent.</p>
          </div>

          <button
            className="profile-edit-button"
            onClick={() => setShowProfileModal(true)}
          >
            <FaPen />
            Edit Profile
          </button>
        </div>

        <div className="profile-overview-content">

          <div className="profile-avatar-large">
            <FaUser />
          </div>

          <div className="profile-main-info">
            <h3>{profile.name}</h3>

            <span className="profile-age">
              {profile.age} years old
            </span>

            <div className="profile-info-grid">

              <div className="profile-info-item">
                <span>Date of Birth</span>
                <strong>{profile.dob}</strong>
              </div>

              <div className="profile-info-item">
                <span>Gender</span>
                <strong>{profile.gender}</strong>
              </div>

              <div className="profile-info-item">
                <span>
                  <FaPhone /> Phone
                </span>
                <strong>{profile.phone}</strong>
              </div>

              <div className="profile-info-item">
                <span>
                  <FaEnvelope /> Email
                </span>
                <strong>{profile.email}</strong>
              </div>

              <div className="profile-info-item profile-address">
                <span>
                  <FaLocationDot /> Address
                </span>
                <strong>{profile.address}</strong>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* PERSONAL + PREFERENCES */}
      <section className="profile-two-column">

        {/* PERSONAL CARE */}
        <div className="care-information-card">

          <div className="profile-card-header">
            <div>
              <h2>
                <FaShieldHeart /> Personal & Care Information
              </h2>
              <p>Important health information.</p>
            </div>

            <button
              className="small-edit-button"
              onClick={() => setShowCareModal(true)}
            >
              <FaPen />
              Update
            </button>
          </div>

          <div className="care-info-list">

            <div className="care-info-row">
              <div className="care-info-icon">
                <FaDroplet />
              </div>

              <div>
                <span>Blood Group</span>
                <strong>{profile.bloodGroup}</strong>
              </div>
            </div>

            <div className="care-info-row">
              <div className="care-info-icon warning">
                <FaTriangleExclamation />
              </div>

              <div>
                <span>Allergies</span>
                <strong>{profile.allergies}</strong>
              </div>
            </div>

            <div className="care-info-row">
              <div className="care-info-icon">
                <FaShieldHeart />
              </div>

              <div>
                <span>Medical Conditions</span>
                <strong>{profile.conditions}</strong>
              </div>
            </div>

            <div className="care-info-row">
              <div className="care-info-icon">
                <FaUserDoctor />
              </div>

              <div>
                <span>Primary Doctor</span>
                <strong>{profile.doctor}</strong>
              </div>
            </div>

            <div className="care-info-row">
              <div className="care-info-icon">
                <FaHospital />
              </div>

              <div>
                <span>Preferred Hospital</span>
                <strong>{profile.hospital}</strong>
              </div>
            </div>

          </div>
        </div>

        {/* CARE PREFERENCES */}
        <div className="care-preferences-card">

          <div className="profile-card-header">
            <div>
              <h2>
                <FaHeartIcon /> Care Preferences
              </h2>
              <p>Preferences that help provide better care.</p>
            </div>

            <button
              className="small-edit-button"
              onClick={() => setShowPreferenceModal(true)}
            >
              <FaPen />
              Update
            </button>
          </div>

          <div className="preferences-list">

            <div className="preference-item">
              <div className="preference-icon">
                <FaLanguage />
              </div>

              <div>
                <span>Preferred Language</span>
                <strong>{preferences.language}</strong>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-icon">
                <FaWheelchair />
              </div>

              <div>
                <span>Mobility Assistance</span>
                <strong>{preferences.mobility}</strong>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-icon">
                <FaUtensils />
              </div>

              <div>
                <span>Dietary Preference</span>
                <strong>{preferences.diet}</strong>
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-icon">
                <FaBell />
              </div>

              <div>
                <span>Reminder Preferences</span>
                <strong>{preferences.reminders}</strong>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* EMERGENCY CONTACTS */}
      <section className="emergency-contacts-card">

        <div className="profile-card-header">

          <div>
            <h2>
              <FaTriangleExclamation /> Emergency Contacts
            </h2>

            <p>
              People who should be contacted during an emergency.
            </p>
          </div>

          <button
            className="add-contact-button"
            onClick={openAddContact}
          >
            <FaPlus />
            Add Emergency Contact
          </button>

        </div>

        <div className="contacts-grid">

          {contacts.map((contact) => (
            <div
              className={`contact-card ${
                contact.primary ? "primary-contact" : ""
              }`}
              key={contact.id}
            >

              {contact.primary && (
                <span className="primary-badge">
                  Primary Contact
                </span>
              )}

              <div className="contact-top">

                <div className="contact-avatar">
                  <FaUser />
                </div>

                <div>
                  <h3>{contact.name}</h3>
                  <span>{contact.relation}</span>
                </div>

              </div>

              <div className="contact-details">

                <div>
                  <FaPhone />
                  <span>{contact.phone}</span>
                </div>

                <div>
                  <FaEnvelope />
                  <span>{contact.email}</span>
                </div>

              </div>

              <div className="contact-actions">

                <button
                  className="contact-edit"
                  onClick={() => openEditContact(contact)}
                >
                  <FaPen />
                  Edit
                </button>

                <button
                  className="contact-delete"
                  onClick={() => deleteContact(contact.id)}
                >
                  <FaTrash />
                  Delete
                </button>

                {!contact.primary && (
                  <button
                    className="primary-contact-button"
                    onClick={() => setPrimaryContact(contact.id)}
                  >
                    Make Primary
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>
      </section>

      {/* DOCUMENTS */}
      <section className="documents-card">

        <div className="profile-card-header">

          <div>
            <h2>
              <FaFileMedical /> Important Documents
            </h2>

            <p>
              Keep important medical and insurance documents accessible.
            </p>
          </div>

          <label className="upload-document-button">
            <FaUpload />
            Upload Document

            <input
              type="file"
              hidden
              onChange={addDocument}
            />
          </label>

        </div>

        <div className="documents-list">

          {documents.map((document) => (
            <div
              className="document-item"
              key={document.id}
            >

              <div className="document-icon">
                {getDocumentIcon(document.type)}
              </div>

              <div className="document-info">
                <strong>{document.name}</strong>
                <span>{document.file}</span>
              </div>

              <div className="document-actions">
                <button title="View document">
                  <FaEye />
                </button>

                <label title="Replace document">
                  <FaUpload />

                  <input
                    type="file"
                    hidden
                  />
                </label>
              </div>

            </div>
          ))}

        </div>
      </section>

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="profile-modal-overlay">

          <div className="profile-modal">

            <div className="modal-header">
              <div>
                <h2>Edit Profile</h2>
                <p>Update your parent's basic information.</p>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
              >
                <FaXmark />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowProfileModal(false);
              }}
            >

              <div className="modal-form-grid">

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    name="age"
                    value={profile.age}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    name="dob"
                    value={profile.dob}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={profile.gender}
                    onChange={handleProfileChange}
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleProfileChange}
                  />
                </div>

              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  <FaFloppyDisk />
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CARE INFORMATION MODAL */}
      {showCareModal && (
        <div className="profile-modal-overlay">

          <div className="profile-modal">

            <div className="modal-header">
              <div>
                <h2>Update Care Information</h2>
                <p>Keep medical information up to date.</p>
              </div>

              <button onClick={() => setShowCareModal(false)}>
                <FaXmark />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowCareModal(false);
              }}
            >

              <div className="modal-form-grid">

                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={profile.bloodGroup}
                    onChange={handleProfileChange}
                  >
                    <option>O+</option>
                    <option>O-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Allergies</label>
                  <input
                    name="allergies"
                    value={profile.allergies}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Medical Conditions</label>
                  <textarea
                    name="conditions"
                    value={profile.conditions}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label>Primary Doctor</label>
                  <input
                    name="doctor"
                    value={profile.doctor}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group">
                  <label>Preferred Hospital</label>
                  <input
                    name="hospital"
                    value={profile.hospital}
                    onChange={handleProfileChange}
                  />
                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowCareModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  <FaFloppyDisk />
                  Save Changes
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* PREFERENCES MODAL */}
      {showPreferenceModal && (
        <div className="profile-modal-overlay">

          <div className="profile-modal">

            <div className="modal-header">

              <div>
                <h2>Care Preferences</h2>
                <p>Update your parent's care preferences.</p>
              </div>

              <button
                onClick={() => setShowPreferenceModal(false)}
              >
                <FaXmark />
              </button>

            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowPreferenceModal(false);
              }}
            >

              <div className="modal-form-grid">

                <div className="form-group">
                  <label>Preferred Language</label>

                  <select
                    name="language"
                    value={preferences.language}
                    onChange={handlePreferenceChange}
                  >
                    <option>Telugu</option>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Kannada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Mobility Assistance</label>

                  <select
                    name="mobility"
                    value={preferences.mobility}
                    onChange={handlePreferenceChange}
                  >
                    <option>Independent</option>
                    <option>Assisted</option>
                    <option>Wheelchair</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dietary Preference</label>

                  <select
                    name="diet"
                    value={preferences.diet}
                    onChange={handlePreferenceChange}
                  >
                    <option>Vegetarian</option>
                    <option>Non-Vegetarian</option>
                    <option>Vegan</option>
                    <option>Diabetic Friendly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reminder Preferences</label>

                  <select
                    name="reminders"
                    value={preferences.reminders}
                    onChange={handlePreferenceChange}
                  >
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowPreferenceModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  <FaFloppyDisk />
                  Save Changes
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* EMERGENCY CONTACT MODAL */}
      {showContactModal && (
        <div className="profile-modal-overlay">

          <div className="profile-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editingContact
                    ? "Edit Emergency Contact"
                    : "Add Emergency Contact"}
                </h2>

                <p>
                  Add someone who can be contacted during an emergency.
                </p>
              </div>

              <button
                onClick={() => setShowContactModal(false)}
              >
                <FaXmark />
              </button>

            </div>

            <form onSubmit={saveContact}>

              <div className="modal-form-grid">

                <div className="form-group">
                  <label>Full Name</label>

                  <input
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    placeholder="Enter name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Relationship</label>

                  <input
                    name="relation"
                    value={contactForm.relation}
                    onChange={handleContactChange}
                    placeholder="e.g. Daughter"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>

                  <input
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactChange}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="example@email.com"
                  />
                </div>

                <label className="primary-checkbox">
                  <input
                    type="checkbox"
                    name="primary"
                    checked={contactForm.primary}
                    onChange={handleContactChange}
                  />

                  <span>
                    Make this the primary emergency contact
                  </span>
                </label>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowContactModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  <FaFloppyDisk />

                  {editingContact
                    ? "Save Contact"
                    : "Add Contact"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

/* Small helper so the heading remains readable */
function FaHeartIcon() {
  return <span className="heart-heading-icon">♥</span>;
}