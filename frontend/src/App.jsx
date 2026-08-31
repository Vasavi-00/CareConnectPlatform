import React from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage/LandingPage";
import AuthPage from "./pages/AuthPage/AuthPage";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";

import FamilyDashboard from "./pages/family/FamilyDashboard";
import ElderDashboard from "./pages/elder/ElderDashboard";

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

  if (!user) {
    return (
      <Navigate
        to="/login"
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

  if (!user) {
    return (
      <Navigate
        to="/login"
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
      {/* FAMILY */}

      <Route
        path="/dashboard/family"
        element={
          <ProtectedFamilyRoute>
            <FamilyDashboard />
          </ProtectedFamilyRoute>
        }
      />

      {/* ELDER */}

      <Route
        path="/elder/dashboard"
        element={
          <ProtectedElderRoute>
            <ElderDashboard
              user={getStoredUser()}
            />
          </ProtectedElderRoute>
        }
      />

      {/* FALLBACK */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;