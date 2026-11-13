import React from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import LandingPage from "./pages/LandingPage/LandingPage";
import AuthPage from "./pages/AuthPage/AuthPage";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";

import FamilyDashboard from "./pages/family/FamilyDashboard";
import ElderDashboard from "./pages/elder/ElderDashboard";
import TermsPage from "./pages/TermsPage/TermsPage";

/* =========================================================
   STORED USER
========================================================= */

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("careconnect_user");

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      "Unable to read stored user:",
      error
    );

    return null;
  }
}

/* =========================================================
   FAMILY PROTECTED ROUTE
========================================================= */

function ProtectedFamilyRoute({
  children,
}) {
  const user = getStoredUser();
  const accessToken = localStorage.getItem("careconnect_access");
  const location = useLocation();

  if (!user || !accessToken) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (user.role !== "FAMILY") {
    if (user.role === "ELDER") {
      return (
        <Navigate
          to="/elder/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   ELDER PROTECTED ROUTE
========================================================= */

function ProtectedElderRoute({
  children,
}) {
  const user = getStoredUser();
  const accessToken = localStorage.getItem("careconnect_access");
  const location = useLocation();

  if (!user || !accessToken) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (user.role !== "ELDER") {
    if (user.role === "FAMILY") {
      return (
        <Navigate
          to="/dashboard/family"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}

function NotFoundPage() {
  const user = getStoredUser();
  const home = user?.role === "ELDER"
    ? "/elder/dashboard"
    : user?.role === "FAMILY"
      ? "/dashboard/family"
      : "/";

  return (
    <main className="app-not-found">
      <p>CareConnect</p>
      <h1>Page not found</h1>
      <p>That page may have moved, or the address may be incorrect.</p>
      <Link to={home}>{user ? "Return to your dashboard" : "Return to home"}</Link>
    </main>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <Routes>
      {/* PUBLIC */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={
          <AuthPage mode="login" />
        }
      />

      <Route
        path="/signup"
        element={
          <AuthPage mode="signup" />
        }
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/terms"
        element={<TermsPage />}
      />

      <Route
        path="/terms-and-conditions"
        element={<TermsPage />}
      />
      {/* FAMILY */}

      <Route
        path="/dashboard/family/*"
        element={
          <ProtectedFamilyRoute>
            <FamilyDashboard />
          </ProtectedFamilyRoute>
        }
      />

      {/* ELDER */}

      <Route
        path="/elder/*"
        element={
          <ProtectedElderRoute>
            <ElderDashboard
              user={getStoredUser()}
            />
          </ProtectedElderRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
