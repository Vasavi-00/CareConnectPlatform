import { Link } from "react-router-dom";

import heroImage from "../../assets/images/hero.png";

import {
  FaHeart,
  FaArrowRight,
  FaShieldAlt,
  FaMobileAlt,
  FaHeadset,
} from "react-icons/fa";

import { FaRegPlayCircle } from "react-icons/fa";

function Hero() {

  return (
    <section
      className="hero"
      id="home"
    >

      <div className="container hero-container">

        {/* Left */}

        <div
          className="hero-content"
          data-aos="fade-left"
        >

          <span className="hero-badge">

            <FaHeart />

            Smart Healthcare Platform

          </span>

          <h1>

            Stay Connected,

            <span>
              {" "}Stay Caring.
            </span>

          </h1>

          <p>
            CareConnect empowers families
            to care for elderly loved ones
            with smart medicine reminders,
            appointment management,
            AI companionship, emergency
            assistance and family connectivity.
          </p>

          <div className="hero-buttons">

            <Link
              to="/signup"
              className="primary-btn"
            >
              Get Started

              <FaArrowRight />

            </Link>

            <a
              href="#works"
              className="secondary-btn"
            >
              <FaRegPlayCircle />

              How It Works
            </a>

          </div>

          <div className="hero-bottom">

            <div>
              <FaShieldAlt />

              Secure
            </div>

            <div>
              <FaMobileAlt />

              Easy To Use
            </div>

            <div>
              <FaHeadset />

              Family Connected
            </div>

          </div>

        </div>

        {/* Right */}

        <div
          className="hero-image"
          data-aos="fade-right"
        >

          <img
            src={heroImage}
            alt="CareConnect elderly care"
          />

          <div className="floating-card card1">

            ❤️

            <h4>
              Care
            </h4>

            <span>
              Always Connected
            </span>

          </div>

          <div className="floating-card card2">

            💊

            <h4>
              Medicine
            </h4>

            <span>
              Reminder
            </span>

          </div>

          <div className="floating-card card3">

            📅

            <h4>
              Appointment
            </h4>

            <span>
              Scheduled
            </span>

          </div>

          <div className="floating-card card4">

            🚨

            <h4>
              SOS Alert
            </h4>

            <span>
              Connected
            </span>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;