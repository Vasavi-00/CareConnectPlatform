import { Link } from "react-router-dom";
import React, { useState } from "react";
import {
  FaCircleQuestion,
  FaMagnifyingGlass,
  FaPills,
  FaCalendarCheck,
  FaRobot,
  FaUserGroup,
  FaChevronDown,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaPaperPlane,
  FaCircleInfo,
} from "react-icons/fa6";

import { sendSupportMessage } from "../../services/api/familyApi";
import "../../styles/family/HelpPage.css";

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [supportError, setSupportError] = useState("");
  const [supportSuccess, setSupportSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "careconnect.project.monolith@gmail.com";
  const supportPhone = import.meta.env.VITE_SUPPORT_PHONE || "";

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const faqs = [
    {
      question: "How do I add another parent?",
      answer:
        "Use the Add Elder option from the dashboard header to add another parent profile and manage their care information separately.",
    },
    {
      question: "How can I update medicine information?",
      answer:
        "Open the Medicine page from the sidebar. You can add medicines, update medicine details, manage stock and configure reminders.",
    },
    {
      question: "How do I book an appointment?",
      answer:
        "Open Appointments from the sidebar and use the Book Appointment section. Select the parent, doctor, appointment type, date and time.",
    },
    {
      question: "How does the AI Companion work?",
      answer:
        "The AI Companion provides friendly conversations for your parent. Family members can review conversation summaries, mood information and important insights from the Family Dashboard.",
    },
    {
      question: "How do I add an emergency contact?",
      answer:
        "Open Parent Profile and go to Emergency Contacts. Select Add Emergency Contact and enter the person's name, relationship, phone number and email.",
    },
    {
      question: "Can I update my parent's profile?",
      answer:
        "Yes. Open Parent Profile and use Edit Profile or Update in the relevant section to change personal, medical and care information.",
    },
    {
      question: "Where can I review CareConnect's Terms & Conditions and Medical Disclaimer?",
      answer:
        "You can review our full Terms and Conditions, Medical & Emergency Disclaimers, and Privacy Safeguards anytime on our dedicated Terms & Conditions page.",
      link: "/terms",
      linkText: "Read Terms & Conditions",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const search = searchTerm.toLowerCase();

    return (
      faq.question.toLowerCase().includes(search) ||
      faq.answer.toLowerCase().includes(search)
    );
  });

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSupportError("");
    setSupportSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSupportError("");
    setSupportSuccess("");

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedMessage = form.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setSupportError("Please fill out all fields before sending.");
      return;
    }

    try {
      setLoading(true);
      const res = await sendSupportMessage({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });

      setSupportSuccess(
        res?.message ||
          "Your message has been sent successfully! Our support team will get back to you shortly."
      );
      setForm({
        name: "",
        email: "",
        message: "",
      });
    } catch (err) {
      console.error("Support message error:", err);
      setSupportError(
        err?.message ||
          `Unable to send message directly. You can also email us directly at ${supportEmail}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="help-page">

      {/* =====================================================
          PAGE HEADING
      ===================================================== */}

      <section className="help-hero">

        <div className="help-hero-left">

          <div className="help-hero-icon">
            <FaCircleQuestion />
          </div>

          <div>
            <h1>Help & Support</h1>

            <p>
              Get help with CareConnect and find answers to your questions.
            </p>
          </div>

        </div>

        <div className="help-hero-right">
          <span>“We're here to help you</span>
          <span>care with confidence.”</span>
        </div>

      </section>


      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="help-search-card">

        <div className="help-search-heading">
          <h2>How can we help?</h2>

          <p>
            Search our frequently asked questions.
          </p>
        </div>

        <div className="help-search-box">

          <FaMagnifyingGlass />

          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </div>

      </section>


      {/* =====================================================
          HELP CATEGORIES
      ===================================================== */}

      <section className="help-category-grid">

        <div className="help-category medicine-help">

          <div className="help-category-icon">
            <FaPills />
          </div>

          <div>
            <h3>Medicine Management</h3>

            <p>
              Learn how to manage medicines, stock and reminders.
            </p>
          </div>

        </div>


        <div className="help-category appointment-help">

          <div className="help-category-icon">
            <FaCalendarCheck />
          </div>

          <div>
            <h3>Appointments</h3>

            <p>
              Learn how to schedule and manage appointments.
            </p>
          </div>

        </div>


        <div className="help-category ai-help">

          <div className="help-category-icon">
            <FaRobot />
          </div>

          <div>
            <h3>AI Companion</h3>

            <p>
              Learn about conversations, summaries and insights.
            </p>
          </div>

        </div>


        <div className="help-category profile-help">

          <div className="help-category-icon">
            <FaUserGroup />
          </div>

          <div>
            <h3>Parent Profile</h3>

            <p>
              Learn how to manage parent and emergency information.
            </p>
          </div>

        </div>

      </section>


      {/* =====================================================
          FAQ
      ===================================================== */}

      <section className="faq-card">

        <div className="help-section-header">

          <div>
            <h2>
              <FaCircleInfo />
              Frequently Asked Questions
            </h2>

            <p>
              Find quick answers to common CareConnect questions.
            </p>
          </div>

        </div>


        <div className="faq-list">

          {filteredFaqs.length > 0 ? (

            filteredFaqs.map((faq, index) => (

              <div
                className={`faq-item ${
                  openFaq === index ? "faq-open" : ""
                }`}
                key={faq.question}
              >

                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >

                  <span>{faq.question}</span>

                  <FaChevronDown />

                </button>


                {openFaq === index && (

                  <div className="faq-answer">

                    <p>{faq.answer}</p>
                    {faq.link && (
                      <p style={{ marginTop: "8px" }}>
                        <Link to={faq.link} style={{ color: "#0b5ed7", fontWeight: "600", textDecoration: "underline" }}>
                          {faq.linkText || "Learn more"} →
                        </Link>
                      </p>
                    )}

                  </div>

                )}

              </div>

            ))

          ) : (

            <div className="no-faq-results">
              No help topics found for "{searchTerm}".
            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          SUPPORT SECTION
      ===================================================== */}

      <section className="support-grid">

        {/* CONTACT SUPPORT */}

        <div className="contact-support-card">

          <div className="help-section-header">

            <div>
              <h2>
                <FaPhone />
                Contact Support
              </h2>

              <p>
                Need additional help? We're here for you.
              </p>
            </div>

          </div>


          <div className="support-contact-list">

            <div className="support-contact-item">

              <div className="support-contact-icon blue">
                <FaPhone />
              </div>

              <div>
                <span>Phone Support</span>
                <strong>{supportPhone || "+91 (800) 227-3266"}</strong>
              </div>

            </div>


            <div className="support-contact-item">

              <div className="support-contact-icon green">
                <FaEnvelope />
              </div>

              <div>
                <span>Email Support</span>
                <strong>{supportEmail}</strong>
              </div>

            </div>


            <div className="support-contact-item">

              <div className="support-contact-icon purple">
                <FaClock />
              </div>

              <div>
                <span>Support Hours</span>
                <strong>Mon – Sat: 9:00 AM – 7:00 PM IST</strong>
                <small className="support-hours-note">Sunday: 10:00 AM – 2:00 PM IST (Emergency On-Call)</small>
              </div>

            </div>

          </div>


          <a className="contact-support-button" href={supportPhone ? `tel:${supportPhone}` : `mailto:${supportEmail}`}>
            <FaPhone />
            Contact Support
          </a>

        </div>


        {/* SEND MESSAGE */}

        <div className="send-message-card">

          <div className="help-section-header">

            <div>
              <h2>
                <FaEnvelope />
                Send a Message
              </h2>

              <p>
                Have a question or need assistance? Send us a message directly.
              </p>
            </div>

          </div>


          <form
            className="support-message-form"
            onSubmit={handleSubmit}
          >

            <div className="support-form-row">

              <div className="support-form-group">

                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Enter your name"
                  disabled={loading}
                  required
                />

              </div>


              <div className="support-form-group">

                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            <div className="support-form-group">

              <label>Your Question</label>

              <textarea
                name="message"
                value={form.message}
                onChange={handleFormChange}
                placeholder="Describe your question or issue..."
                rows="4"
                disabled={loading}
                required
              />

            </div>


            {supportSuccess && (
              <div className="message-success" role="status">
                <FaCircleInfo />
                <span>{supportSuccess}</span>
              </div>
            )}

            {supportError && (
              <div className="message-error" role="alert">
                <FaCircleInfo />
                <span>{supportError}</span>
              </div>
            )}

            <p className="support-delivery-note">
              Messages are sent directly to {supportEmail}. Our team typically responds within 24 hours.
            </p>


            <button
              type="submit"
              className="send-message-button"
              disabled={loading}
            >
              <FaPaperPlane />
              {loading ? "Sending Message..." : "Send Message"}
            </button>

          </form>

        </div>

      </section>


      {/* =====================================================
          BOTTOM HELP BANNER
      ===================================================== */}

      <section className="help-bottom-banner">

        <div className="help-bottom-icon">
          <FaCircleQuestion />
        </div>

        <div>

          <span>STILL NEED HELP?</span>

          <h2>
            We're always here for you.
          </h2>

          <p>
            If you can't find what you're looking for,
            contact our support team and we'll help you.
          </p>

        </div>

      </section>

    </div>
  );
}