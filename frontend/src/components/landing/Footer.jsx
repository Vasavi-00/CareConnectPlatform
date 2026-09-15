import logo from "../../assets/images/logo1.png";

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

            <a href="/">
              <FaFacebookF />
            </a>

            <a href="/">
              <FaInstagram />
            </a>

            <a href="/">
              <FaLinkedinIn />
            </a>

            <a href="/">
              <FaXTwitter />
            </a>

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

          <a href="/">
            Privacy Policy
          </a>

          <a href="/">
            Terms & Conditions
          </a>

          <a href="/">
            Support
          </a>

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

        © 2026 CareConnect.
        All Rights Reserved.

      </div>

    </footer>
  );
}

export default Footer;
