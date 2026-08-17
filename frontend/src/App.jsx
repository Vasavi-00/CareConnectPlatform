import React from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// Public pages
import LandingPage from "./pages/LandingPage/LandingPage";
import AuthPage from "./pages/AuthPage/AuthPage";

// New Family Dashboard
import FamilyDashboard from "./pages/family/FamilyDashboard";

// Existing Elder pages
import ElderDashboard from "./pages/elder/ElderDashboard";
import ElderSectionPage from "./pages/elder/ElderSectionPage";

/* =========================================================
   LOCAL STORAGE USER
========================================================= */

function getStoredUser() {
  try {
    const user = localStorage.getItem(
      "careconnect_user"
    );

    return user ? JSON.parse(user) : null;
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

function ProtectedFamilyRoute({ children }) {
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

function ProtectedElderRoute({ children }) {
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
    return (
      <Navigate
        to="/dashboard/family"
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
      {/* ===================================================
          PUBLIC
      =================================================== */}

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

      {/* ===================================================
          FAMILY DASHBOARD
      =================================================== */}

      <Route
        path="/dashboard/family"
        element={
          <ProtectedFamilyRoute>
            <FamilyDashboard />
          </ProtectedFamilyRoute>
        }
      />

      {/* ===================================================
          ELDER DASHBOARD
      =================================================== */}

      <Route
        path="/dashboard/elder"
        element={
          <ProtectedElderRoute>
            <Navigate
              to="/elder/dashboard"
              replace
            />
          </ProtectedElderRoute>
        }
      />

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

      <Route
        path="/elder/medicines"
        element={
          <ProtectedElderRoute>
            <ElderSectionPage
              section="medicines"
            />
          </ProtectedElderRoute>
        }
      />

      <Route
        path="/elder/appointments"
        element={
          <ProtectedElderRoute>
            <ElderSectionPage
              section="appointments"
            />
          </ProtectedElderRoute>
        }
      />

      <Route
        path="/elder/ai-companion"
        element={
          <ProtectedElderRoute>
            <ElderSectionPage
              section="ai-companion"
            />
          </ProtectedElderRoute>
        }
      />

      <Route
        path="/elder/profile"
        element={
          <ProtectedElderRoute>
            <ElderSectionPage
              section="profile"
            />
          </ProtectedElderRoute>
        }
      />

      {/* ===================================================
          FALLBACK
      =================================================== */}

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