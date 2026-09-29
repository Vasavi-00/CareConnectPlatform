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

import "../../styles/family/HelpPage.css";

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [supportError, setSupportError] = useState("");
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "";
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supportEmail) {
      setSupportError("Support email is not configured. Please contact your CareConnect administrator.");
      return;
    }
    const subject = encodeURIComponent("CareConnect support request");
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
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
                <strong>{supportPhone || "Phone support is not configured"}</strong>
              </div>

            </div>


            <div className="support-contact-item">

              <div className="support-contact-icon green">
                <FaEnvelope />
              </div>

              <div>
                <span>Email Support</span>
                <strong>{supportEmail || "Support email is not configured"}</strong>
              </div>

            </div>


            <div className="support-contact-item">

              <div className="support-contact-icon purple">
                <FaClock />
              </div>

              <div>
                <span>Support Hours</span>
                <strong>Use the configured support contact</strong>
              </div>

            </div>

          </div>


          <a className="contact-support-button" href={supportPhone ? `tel:${supportPhone}` : supportEmail ? `mailto:${supportEmail}` : undefined}>
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
                Tell us how we can help you.
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
                required
              />

            </div>


            {supportError && <div className="message-error" role="alert">{supportError}</div>}
            <p className="support-delivery-note">This opens your configured email app with your message ready to send.</p>


            <button
              type="submit"
              className="send-message-button"
            >
              <FaPaperPlane />
              Send Message
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