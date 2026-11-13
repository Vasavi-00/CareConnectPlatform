import logo from "../../assets/images/logo1.png";
import { Link } from "react-router-dom";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaPaperPlane,
} from "react-icons/fa6";

function Footer() {

  return (
    <footer
      className="footer"
      id="contact"
    >

      <div
        className="container footer-grid"
        data-aos="fade-up"
      >

        {/* About */}

        <div>

          <img src={logo} alt="CareConnect" className="footer-logo" />

          <p>
            CareConnect helps families stay connected with elderly loved ones
            through AI-powered healthcare monitoring.
          </p>

          <div className="social">

            <span aria-hidden="true">
              <FaFacebookF />
            </span>

            <span aria-hidden="true">
              <FaInstagram />
            </span>

            <span aria-hidden="true">
              <FaLinkedinIn />
            </span>

            <span aria-hidden="true">
              <FaXTwitter />
            </span>

          </div>

        </div>

        {/* Quick Links */}

        <div>

          <h3>
            Quick Links
          </h3>

          <a href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#works">
            How It Works
          </a>

          <a href="#about">
            About
          </a>

        </div>

        {/* Resources */}

        <div>

          <h3>
            Resources
          </h3>

          <Link to="/terms">Terms & Conditions</Link>

          <Link to="/dashboard/family/settings">Family privacy settings</Link>

          <Link to="/login">Sign in</Link>

          <Link to="/dashboard/family/help">Family help</Link>

          <a href="#contact">
            Contact
          </a>

        </div>

        {/* Newsletter */}

        <div>

          <h3>
            Newsletter
          </h3>

          <p>
            Subscribe for updates.
          </p>

          <form
            className="newsletter"
            onSubmit={(e) =>
              e.preventDefault()
            }
          >

            <input
              type="email"
              placeholder="Email Address"
              required
            />

            <button type="submit">
              <FaPaperPlane />
            </button>

          </form>

        </div>

      </div>

      <div className="copyright">

        © 2026 CareConnect. All Rights Reserved. · <Link to="/terms" style={{ color: "inherit", textDecoration: "underline" }}>Terms & Conditions</Link>

      </div>

    </footer>
  );
}

export default Footer;
