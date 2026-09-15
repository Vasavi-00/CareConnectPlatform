import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AOS from "aos";
import "aos/dist/aos.css";

import App from "./App";

import "./App.css";

/* =========================================================
   EXISTING LANDING PAGE STYLES
========================================================= */

import "./styles/LandingPage/global.css";
import "./styles/LandingPage/navbar.css";
import "./styles/LandingPage/hero.css";
import "./styles/LandingPage/sections.css";
import "./styles/LandingPage/responsive.css";

/* =========================================================
   EXISTING AUTH / ELDER STYLES
========================================================= */

import "./styles/AuthPage/auth.css";
import "./styles/elder/elder-dashboard.css";
import "./styles/ForgotPassword/forgotPassword.css";
/* =========================================================
   AOS
========================================================= */

AOS.init({
  duration: 800,
  once: true,
  offset: 80,
});

/* =========================================================
   RENDER
========================================================= */

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);