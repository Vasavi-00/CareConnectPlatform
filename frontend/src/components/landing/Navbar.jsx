import { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import logo from "../../assets/images/logo.png";

import {
  FaHeart,
  FaBars,
  FaTimes,
} from "react-icons/fa";

function Navbar() {

  const [menuOpen, setMenuOpen] = useState(false);

  const [activeSection, setActiveSection] =
    useState("home");

  useEffect(() => {

    const sections =
      document.querySelectorAll("section");

    const handleScroll = () => {

      let current = "home";

      sections.forEach((section) => {

        const top =
          section.offsetTop - 120;

        const height =
          section.offsetHeight;

        if (
          window.scrollY >= top &&
          window.scrollY < top + height
        ) {
          current =
            section.getAttribute("id");
        }

      });

      setActiveSection(current);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    handleScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };

  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">

      <div className="container navbar">

        {/* Logo */}

        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
        >

          <img
            src={logo}
            alt="CareConnect Logo"
          />

          <div className="logo-text">

            <h2>CareConnect</h2>

            <span>
              Care. Connect. Always.
            </span>

          </div>

        </Link>

        {/* Navigation */}

        <ul
          className={`nav-menu ${
            menuOpen ? "active" : ""
          }`}
        >

          <li>
            <a
              href="#home"
              onClick={closeMenu}
            >
              Home
            </a>
          </li>

          <li>
            <a
              href="#features"
              onClick={closeMenu}
            >
              Features
            </a>
          </li>

          <li>
            <a
              href="#works"
              onClick={closeMenu}
            >
              How It Works
            </a>
          </li>

          <li>
            <a
              href="#about"
              onClick={closeMenu}
            >
              About
            </a>
          </li>

          <li>
            <a
              href="#contact"
              onClick={closeMenu}
            >
              Contact
            </a>
          </li>

          {/* Mobile Buttons */}

          <div className="mobile-buttons">

            <Link
              to="/login"
              className="login-btn"
              onClick={closeMenu}
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="signup-btn"
              onClick={closeMenu}
            >
              <FaHeart />

              Get Started
            </Link>

          </div>

        </ul>

        {/* Desktop Buttons */}

        <div className="nav-buttons">

          <Link
            to="/login"
            className="login-btn"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="signup-btn"
          >
            <FaHeart />

            Get Started
          </Link>

        </div>

        {/* Mobile Menu */}

        <button
          className="menu-icon"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle navigation"
        >

          {menuOpen
            ? <FaTimes />
            : <FaBars />
          }

        </button>

      </div>

    </header>
  );
}

export default Navbar;