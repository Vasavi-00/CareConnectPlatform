import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPrint,
  FaShieldHeart,
  FaTriangleExclamation,
  FaStethoscope,
  FaPills,
  FaRobot,
  FaLocationDot,
  FaLock,
  FaFileContract,
  FaScaleBalanced,
  FaPhone,
  FaEnvelope,
  FaCircleCheck,
} from "react-icons/fa6";

import logo from "../../assets/images/logo1.png";
import "../../styles/TermsPage/TermsPage.css";

export default function TermsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="terms-page">
      {/* Top Header */}
      <header className="terms-header">
        <div className="terms-header-container">
          <div className="terms-brand-area">
            <Link to="/" className="terms-brand-link" aria-label="CareConnect Home">
              <img src={logo} alt="CareConnect Logo" className="terms-logo" />
              <div className="terms-brand-text">
                <span className="terms-brand-title">CareConnect</span>
                <span className="terms-brand-badge">Legal & Terms</span>
              </div>
            </Link>
          </div>

          <div className="terms-header-actions">
            <button
              type="button"
              className="terms-btn terms-btn-outline"
              onClick={handlePrint}
              aria-label="Print Terms and Conditions"
            >
              <FaPrint aria-hidden="true" />
              <span>Print Terms</span>
            </button>
            <button
              type="button"
              className="terms-btn terms-btn-primary"
              onClick={handleGoBack}
              aria-label="Go back to previous screen"
            >
              <FaArrowLeft aria-hidden="true" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="terms-hero">
        <div className="terms-hero-content">
          <div className="terms-version-pill">
            <FaFileContract aria-hidden="true" />
            <span>Effective Date: November 2026 · Version 2.4</span>
          </div>
          <h1>Terms & Conditions</h1>
          <p>
            Please read these Terms and Conditions carefully before using the CareConnect
            Platform. By creating an account, linking a family member, or using any of our
            elderly care features, you agree to be bound by these terms.
          </p>
        </div>
      </section>

      {/* Main Body with Quick Navigation + Content */}
      <main className="terms-main container">
        {/* Quick Nav Sidebar */}
        <aside className="terms-sidebar" aria-label="Table of contents">
          <div className="terms-sidebar-card">
            <h3>Table of Contents</h3>
            <nav className="terms-nav-list">
              <a href="#acceptance">1. Acceptance of Terms</a>
              <a href="#scope">2. Services & User Roles</a>
              <a href="#medical-disclaimer" className="nav-highlight">
                3. Medical & Emergency Disclaimer
              </a>
              <a href="#account-security">4. Account Registration & Security</a>
              <a href="#sos-services">5. Emergency SOS & Location</a>
              <a href="#ai-companion">6. AI Voice Companion</a>
              <a href="#medications">7. Medications & Appointments</a>
              <a href="#privacy-data">8. Privacy & Health Data</a>
              <a href="#acceptable-use">9. Acceptable Use Policy</a>
              <a href="#liability">10. Limitation of Liability</a>
              <a href="#termination">11. Account Deletion & Termination</a>
              <a href="#governing-law">12. Governing Law & Dispute Resolution</a>
              <a href="#contact">13. Contact & Support</a>
            </nav>
          </div>
        </aside>

        {/* Legal Sections */}
        <div className="terms-content">
          {/* Section 1 */}
          <section id="acceptance" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle blue">
                <FaFileContract />
              </div>
              <h2>1. Acceptance of Terms</h2>
            </div>
            <p>
              These Terms and Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) constitute a legally
              binding contract between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and CareConnect
              Health Platform (&quot;CareConnect&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </p>
            <p>
              By signing up for an account, checking an agreement box, logging into our portals
              (including the Family Dashboard and Elder Dashboard), or accessing our voice
              services, you confirm that you have read, understood, and agreed to be bound by
              these Terms, along with our Privacy Policy. If you do not agree to all terms, you
              must immediately cease access and discontinue use of CareConnect.
            </p>
          </section>

          {/* Section 2 */}
          <section id="scope" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle purple">
                <FaShieldHeart />
              </div>
              <h2>2. Services & User Roles</h2>
            </div>
            <p>
              CareConnect is a comprehensive digital eldercare platform engineered to foster
              safe, connected, and dignified care for seniors and their families. The platform
              supports two distinct primary roles:
            </p>
            <ul className="terms-list">
              <li>
                <strong>Family Members & Caregivers:</strong> Individuals registered to oversee
                medication schedules, book and review doctor consultations, configure notifications,
                receive real-time emergency SOS alerts, and view summarized AI companion health
                check-ins.
              </li>
              <li>
                <strong>Elderly Loved Ones:</strong> Seniors equipped with accessible, high-contrast,
                voice-assisted interfaces (in English and Telugu), personalized daily medicine dose
                alerts, one-touch SOS triggers, and interactive AI voice companion support.
              </li>
            </ul>
            <p>
              To link an elder account to a family account, both parties must utilize the unique
              CareConnect Elder ID system. By linking accounts, family members affirm that they
              possess lawful authority or familial consent to assist with the care of the senior.
            </p>
          </section>

          {/* Section 3: CRITICAL MEDICAL DISCLAIMER */}
          <section id="medical-disclaimer" className="terms-card terms-card-critical">
            <div className="terms-card-header">
              <div className="terms-icon-circle red">
                <FaTriangleExclamation />
              </div>
              <div>
                <span className="critical-eyebrow">MANDATORY NOTICE</span>
                <h2>3. Medical & Emergency Services Disclaimer</h2>
              </div>
            </div>

            <div className="terms-callout-warning">
              <FaStethoscope className="callout-icon" />
              <div>
                <strong>CareConnect is NOT a Medical Diagnostic Tool, Hospital, or Emergency Dispatch Agency.</strong>
                <p>
                  CareConnect provides supportive scheduling, reminder aids, and wellness companionship.
                  It is not designed, licensed, or certified to diagnose illness, prescribe medication,
                  or replace licensed medical professionals, registered nurses, or emergency dispatchers (such as 911, 112, or 108).
                </p>
              </div>
            </div>

            <p>
              <strong>Do Not Rely on CareConnect for Acute Emergencies:</strong> In the event of a
              life-threatening emergency, severe chest pain, shortness of breath, loss of
              consciousness, acute fall with trauma, or any acute medical crisis, you must
              immediately contact your local emergency response authority (such as 112 / 911 / 108)
              or proceed to the nearest emergency room.
            </p>
            <p>
              Any wellness summaries, medication schedules, or AI companion outputs provided on this
              platform are for informational and organizational convenience only. Always consult a
              qualified healthcare physician before altering medication dosages, frequency, or
              treatment protocols.
            </p>
          </section>

          {/* Section 4 */}
          <section id="account-security" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle green">
                <FaLock />
              </div>
              <h2>4. Account Registration & Security</h2>
            </div>
            <p>
              To access CareConnect features, users must register an account with valid, accurate,
              and complete information (including full legal name, active email address, and valid
              phone number).
            </p>
            <ul className="terms-list">
              <li>
                You are solely responsible for maintaining the confidentiality of your login
                credentials, passwords, and password reset One-Time Passwords (OTPs).
              </li>
              <li>
                You agree not to share your account access with unauthorized third parties or
                impersonate another individual.
              </li>
              <li>
                You must notify CareConnect immediately at <code>support@careconnect.health</code> if
                you detect or suspect any unauthorized access, breach of security, or compromised credentials.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="sos-services" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle red">
                <FaLocationDot />
              </div>
              <h2>5. Emergency SOS & Location Services</h2>
            </div>
            <p>
              CareConnect incorporates an emergency SOS feature designed to dispatch in-app
              notifications, SMS alerts, and optional geographic coordinates to designated family
              contacts and listed emergency proxies:
            </p>
            <ul className="terms-list">
              <li>
                <strong>Hardware & Network Dependency:</strong> SOS alerts and location coordinates
                rely on the elder&apos;s device hardware (GPS chips, browser location APIs), operating
                system permissions, cellular/Wi-Fi signal strength, and power status. CareConnect
                cannot guarantee alert delivery if the user&apos;s device is powered off, lacks signal,
                has airplane mode enabled, or has revoked location permissions.
              </li>
              <li>
                <strong>Emergency Contacts:</strong> Family members must ensure all registered
                emergency phone numbers and contact emails are verified, accurate, and kept up to date.
              </li>
              <li>
                <strong>Direct Dial Fallback:</strong> If automated alerts fail to confirm recipient
                acknowledgment, elders are provided with direct one-touch telephone links to call
                emergency contacts or local public safety numbers.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="ai-companion" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle blue">
                <FaRobot />
              </div>
              <h2>6. AI Voice Companion & Speech Data</h2>
            </div>
            <p>
              The CareConnect AI Companion offers friendly, empathetic, bilingual voice and text
              interaction in English and Telugu to alleviate senior isolation and provide daily
              companionship:
            </p>
            <ul className="terms-list">
              <li>
                <strong>Supportive Nature:</strong> The AI Companion is a synthetic artificial
                intelligence assistant. It does not possess medical judgment or consciousness. Its
                responses are conversational and must not be treated as therapeutic or psychiatric counsel.
              </li>
              <li>
                <strong>Voice Recording & Transcription:</strong> When the elder utilizes voice
                input, audio streams are recorded and processed via speech recognition (Web Speech API
                or cloud transcription models) strictly to convert speech to text and respond. Audio
                recordings are not sold or used for commercial advertising.
              </li>
              <li>
                <strong>Family Summaries:</strong> To keep caregivers informed, the AI Companion
                extracts non-confidential conversation highlights, emotional sentiment, and flagged
                care needs (such as reported pain or dizziness) into caregiver summary cards.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="medications" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle green">
                <FaPills />
              </div>
              <h2>7. Medications & Appointments Tracking</h2>
            </div>
            <p>
              Users are responsible for ensuring all medication names, dosages, timings (before/after
              food), inventory counts, and doctor appointment dates entered into CareConnect match the
              official instructions given by the elder&apos;s licensed healthcare providers.
            </p>
            <p>
              CareConnect is not liable for missed doses, double doses, inaccurate data input by
              users, prescription errors made by external clinics, or technical delays in browser
              reminders.
            </p>
          </section>

          {/* Section 8 */}
          <section id="privacy-data" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle purple">
                <FaShieldHeart />
              </div>
              <h2>8. Privacy & Health Data Handling</h2>
            </div>
            <p>
              Your trust and privacy are paramount. We handle sensitive health and eldercare
              information with industry-grade safeguards:
            </p>
            <ul className="terms-list">
              <li>
                All transmissions of data between your browser and CareConnect servers are encrypted
                using Transport Layer Security (TLS 1.3 / HTTPS).
              </li>
              <li>
                Health details, appointment records, and SOS histories are restricted strictly to
                authorized family members who have connected via verified Elder IDs.
              </li>
              <li>
                We do not sell, rent, or monetize your or your loved one&apos;s personal health data to
                third-party advertisers, data brokers, or pharmaceutical marketers.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="acceptable-use" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle blue">
                <FaCircleCheck />
              </div>
              <h2>9. Acceptable Use Policy</h2>
            </div>
            <p>You agree to use CareConnect strictly for lawful eldercare and family welfare purposes. You agree NOT to:</p>
            <ul className="terms-list">
              <li>Trigger fraudulent, prank, or malicious SOS emergency alerts.</li>
              <li>Attempt to reverse-engineer, decompile, scrape, or probe vulnerabilities in our APIs or servers.</li>
              <li>Upload malicious code, viruses, or inappropriate audio/text content to the AI Companion or messaging queues.</li>
              <li>Harass, stalk, or track individuals without lawful guardianship or informed consent.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section id="liability" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle orange">
                <FaScaleBalanced />
              </div>
              <h2>10. Limitation of Liability</h2>
            </div>
            <p>
              To the fullest extent permitted by applicable law, CareConnect, its officers,
              directors, developers, employees, and affiliates shall not be liable for any indirect,
              incidental, consequential, special, or punitive damages, including but not limited to
              loss of life, medical injury, missed medical appointments, failure of hardware device
              telephony, cellular carrier downtime, or loss of data arising out of or in connection
              with your use of or inability to use the platform.
            </p>
            <p>
              CareConnect is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of
              any kind, whether express, statutory, or implied, including warranties of
              merchantability, fitness for a particular health purpose, or uninterrupted uptime.
            </p>
          </section>

          {/* Section 11 */}
          <section id="termination" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle red">
                <FaTriangleExclamation />
              </div>
              <h2>11. Account Deletion & Termination</h2>
            </div>
            <p>
              Users may terminate their account at any time via the Family Settings or Elder Profile
              page. Upon deletion, your active session credentials, profile relationships, and
              linked records will be scheduled for permanent removal in compliance with our data
              retention guidelines.
            </p>
            <p>
              CareConnect reserves the right to suspend or terminate accounts that breach these Terms,
              abuse the emergency alert infrastructure, or engage in suspicious or fraudulent activities.
            </p>
          </section>

          {/* Section 12 */}
          <section id="governing-law" className="terms-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle purple">
                <FaScaleBalanced />
              </div>
              <h2>12. Governing Law & Dispute Resolution</h2>
            </div>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction in which CareConnect operates, without regard to its conflict of law
              provisions. Any disputes arising from this Agreement shall be resolved through good-faith
              informal negotiation, and if necessary, binding arbitration or competent courts within said jurisdiction.
            </p>
          </section>

          {/* Section 13 */}
          <section id="contact" className="terms-card terms-contact-card">
            <div className="terms-card-header">
              <div className="terms-icon-circle blue">
                <FaEnvelope />
              </div>
              <h2>13. Contact Information & Support</h2>
            </div>
            <p>
              If you have any questions, clarifications, or feedback regarding these Terms and
              Conditions or privacy practices, please contact our dedicated care support team:
            </p>
            <div className="terms-contact-grid">
              <div className="contact-box">
                <FaEnvelope className="contact-icon" />
                <div>
                  <strong>Email Legal & Support</strong>
                  <a href="mailto:support@careconnect.health">support@careconnect.health</a>
                </div>
              </div>
              <div className="contact-box">
                <FaPhone className="contact-icon" />
                <div>
                  <strong>Support Line</strong>
                  <span>+1 (800) 555-CARE (2273)</span>
                </div>
              </div>
            </div>
            <div className="terms-bottom-actions">
              <Link to="/signup" className="terms-btn terms-btn-primary">
                Return to Sign Up
              </Link>
              <Link to="/" className="terms-btn terms-btn-outline">
                Return to CareConnect Home
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="terms-footer">
        <div className="container terms-footer-inner">
          <p>© {new Date().getFullYear()} CareConnect Platform. All rights reserved.</p>
          <div className="terms-footer-links">
            <Link to="/">Home</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Register</Link>
            <a href="#medical-disclaimer">Medical Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

