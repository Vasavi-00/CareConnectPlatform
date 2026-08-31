import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaPills,
  FaCalendarAlt,
  FaBell,
  FaRobot,
  FaUserCircle,
} from "react-icons/fa";

import ElderHeader from "../../components/elder/ElderHeader";
import ElderActionButton from "../../components/elder/ElderActionButton";
import MedicineCard from "../../components/elder/MedicineCard";
import AppointmentCard from "../../components/elder/AppointmentCard";
import NotificationCard from "../../components/elder/NotificationCard";
import SOSButton from "../../components/elder/SOSButton";

import {
  getMe,
  getElderProfile,
  getMedicines,
  getAppointments,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/api/elderApi";

import {
  t,
  speechLanguage,
} from "../../i18n";

import {
  speakText,
  stopSpeaking,
} from "../../services/voice/speechSynthesis";

import "../../styles/elder/elder-dashboard.css";

export default function ElderDashboard() {
  const [user, setUser] =
    useState(null);

  const [elderProfile, setElderProfile] =
    useState(null);

  const [medicines, setMedicines] =
    useState([]);

  const [appointments, setAppointments] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        "careconnect_language"
      ) || "en"
    );

  const [view, setView] =
    useState("home");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboard();

    return () => {
      stopSpeaking();
    };
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        me,
        profile,
      ] = await Promise.all([
        getMe(),
        getElderProfile(),
      ]);

      setUser(me);

      const normalizedProfile =
        profile?.profile ||
        profile;

      setElderProfile(
        normalizedProfile
      );

      const elderId =
        normalizedProfile?.id;

      if (!elderId) {
        throw new Error(
          "Elder profile ID was not returned by /api/elder/profile/."
        );
      }

      const [
        medicineData,
        appointmentData,
        notificationData,
        unreadData,
      ] = await Promise.all([
        getMedicines(elderId),
        getAppointments(elderId),
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setMedicines(
        Array.isArray(
          medicineData
        )
          ? medicineData
          : []
      );

      setAppointments(
        Array.isArray(
          appointmentData
        )
          ? appointmentData
          : []
      );

      setNotifications(
        Array.isArray(
          notificationData
        )
          ? notificationData
          : []
      );

      setUnreadCount(
        Number(
          unreadData?.unread_count || 0
        )
      );
    } catch (err) {
      console.error(
        "ELDER DASHBOARD:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshNotifications() {
    const [
      notificationData,
      unreadData,
    ] = await Promise.all([
      getNotifications(),
      getUnreadNotificationCount(),
    ]);

    setNotifications(
      Array.isArray(
        notificationData
      )
        ? notificationData
        : []
    );

    setUnreadCount(
      Number(
        unreadData?.unread_count || 0
      )
    );
  }

  async function handleRead(
    notificationId
  ) {
    try {
      await markNotificationRead(
        notificationId
      );

      await refreshNotifications();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to update notification."
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();

      await refreshNotifications();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to update notifications."
      );
    }
  }

  function speak(message) {
    speakText(
      message,
      speechLanguage(
        language
      )
    );
  }

  const activeMedicines =
    useMemo(
      () =>
        medicines.filter(
          (medicine) =>
            medicine.is_active !==
            false
        ),
      [medicines]
    );

  const activeAppointments =
    useMemo(
      () =>
        appointments.filter(
          (appointment) =>
            appointment.status !==
              "CANCELLED" &&
            appointment.status !==
              "COMPLETED"
        ),
      [appointments]
    );

  const nextMedicine =
    activeMedicines[0];

  const nextAppointment =
    activeAppointments[0];

  const firstName =
    user?.first_name ||
    elderProfile?.first_name ||
    user?.email?.split("@")[0] ||
    "Rambabu";

  const greeting =
    t(
      language,
      getGreetingKey()
    );

  if (loading) {
    return (
      <div className="elder-loading">
        <div className="elder-spinner" />

        <h2>
          CareConnect
        </h2>

        <p>
          Loading your care information...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="elder-error-page">
        <div className="elder-error-card">
          <FaBell />

          <h2>
            Something went wrong
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="elder-platform">
      <ElderHeader
        user={user}
        language={language}
        onLanguageChange={(
          nextLanguage
        ) => {
          setLanguage(
            nextLanguage
          );

          localStorage.setItem(
            "careconnect_language",
            nextLanguage
          );
        }}
        onHome={() =>
          setView("home")
        }
      />

      <main className="elder-main">
        {view === "home" && (
          <HomeView
            greeting={greeting}
            firstName={firstName}
            language={language}
            unreadCount={
              unreadCount
            }
            nextMedicine={
              nextMedicine
            }
            nextAppointment={
              nextAppointment
            }
            onSpeak={speak}
            onView={setView}
          />
        )}

        {view === "medicines" && (
          <MedicinesView
            medicines={
              activeMedicines
            }
            language={language}
            onSpeak={speak}
            onBack={() =>
              setView("home")
            }
          />
        )}

        {view === "appointments" && (
          <AppointmentsView
            appointments={
              activeAppointments
            }
            language={language}
            onSpeak={speak}
            onBack={() =>
              setView("home")
            }
          />
        )}

        {view === "notifications" && (
          <NotificationsView
            notifications={
              notifications
            }
            unreadCount={
              unreadCount
            }
            language={language}
            onSpeak={speak}
            onRead={
              handleRead
            }
            onMarkAllRead={
              handleMarkAllRead
            }
            onBack={() =>
              setView("home")
            }
          />
        )}

        {view === "ai" && (
          <AIView
            language={language}
            onBack={() =>
              setView("home")
            }
          />
        )}

        {view === "profile" && (
          <ProfileView
            user={user}
            elderProfile={
              elderProfile
            }
            language={language}
            onBack={() =>
              setView("home")
            }
          />
        )}
      </main>

      <nav className="elder-bottom-nav">
        <BottomButton
          icon="⌂"
          label={t(
            language,
            "home"
          )}
          active={view === "home"}
          onClick={() =>
            setView("home")
          }
        />

        <BottomButton
          icon="💊"
          label={t(
            language,
            "medicines"
          )}
          active={
            view === "medicines"
          }
          onClick={() =>
            setView("medicines")
          }
        />

        <BottomButton
          icon="🔔"
          label={t(
            language,
            "notifications"
          )}
          badge={unreadCount}
          active={
            view ===
            "notifications"
          }
          onClick={() =>
            setView(
              "notifications"
            )
          }
        />

        <BottomButton
          icon="👤"
          label={t(
            language,
            "profile"
          )}
          active={
            view === "profile"
          }
          onClick={() =>
            setView("profile")
          }
        />
      </nav>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function HomeView({
  greeting,
  firstName,
  language,
  unreadCount,
  nextMedicine,
  nextAppointment,
  onSpeak,
  onView,
}) {
  return (
    <>
      <section className="elder-welcome">
        <div>
          <span>CARECONNECT</span>

          <h1>
            {greeting}, {firstName} 👋
          </h1>

          <p>
            {t(
              language,
              "howCanWeHelp"
            )}
          </p>
        </div>

        <button
          type="button"
          className="elder-welcome-speak"
          onClick={() =>
            onSpeak(
              language === "te"
                ? `${greeting}, ${firstName}. కేర్‌కనెక్ట్‌కు స్వాగతం.`
                : `${greeting}, ${firstName}. Welcome to CareConnect.`
            )
          }
        >
          🔊
        </button>
      </section>

      <section className="elder-action-grid">
        <ElderActionButton
          icon={<FaPills />}
          title={t(
            language,
            "medicines"
          )}
          subtitle={
            nextMedicine?.name ||
            t(
              language,
              "noMedicines"
            )
          }
          color="blue"
          onClick={() =>
            onView("medicines")
          }
        />

        <ElderActionButton
          icon={<FaCalendarAlt />}
          title={t(
            language,
            "appointments"
          )}
          subtitle={
            nextAppointment?.doctor_name ||
            t(
              language,
              "noAppointments"
            )
          }
          color="purple"
          onClick={() =>
            onView("appointments")
          }
        />

        <ElderActionButton
          icon={<FaBell />}
          title={t(
            language,
            "notifications"
          )}
          subtitle={`${unreadCount} ${
            unreadCount === 1
              ? "new"
              : "new"
          }`}
          color="orange"
          onClick={() =>
            onView(
              "notifications"
            )
          }
        />

        <ElderActionButton
          icon={<FaRobot />}
          title={t(
            language,
            "aiCompanion"
          )}
          subtitle={t(
            language,
            "talkWithMe"
          )}
          color="green"
          onClick={() =>
            onView("ai")
          }
        />
      </section>

      <section className="elder-reminder-section">
        <div className="elder-section-heading">
          <div>
            <span>
              {t(
                language,
                "nextMedicine"
              ).toUpperCase()}
            </span>

            <h2>
              {nextMedicine?.name ||
                t(
                  language,
                  "noMedicines"
                )}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onView("medicines")
            }
          >
            {language === "te"
              ? "అన్నీ చూడండి"
              : "View all"}
          </button>
        </div>

        {nextMedicine ? (
          <MedicineCard
            medicine={
              nextMedicine
            }
            language={language}
            onSpeak={onSpeak}
          />
        ) : (
          <EmptyState
            text={t(
              language,
              "noMedicines"
            )}
          />
        )}
      </section>

      <section className="elder-reminder-section">
        <div className="elder-section-heading">
          <div>
            <span>
              {t(
                language,
                "upcomingAppointment"
              ).toUpperCase()}
            </span>

            <h2>
              {nextAppointment?.doctor_name ||
                t(
                  language,
                  "noAppointments"
                )}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              onView("appointments")
            }
          >
            {language === "te"
              ? "అన్నీ చూడండి"
              : "View all"}
          </button>
        </div>

        {nextAppointment ? (
          <AppointmentCard
            appointment={
              nextAppointment
            }
            language={language}
            onSpeak={onSpeak}
          />
        ) : (
          <EmptyState
            text={t(
              language,
              "noAppointments"
            )}
          />
        )}
      </section>

      <section className="elder-sos-section">
        <SOSButton
          language={language}
        />
      </section>
    </>
  );
}

/* =========================================================
   MEDICINES
========================================================= */

function MedicinesView({
  medicines,
  language,
  onSpeak,
  onBack,
}) {
  return (
    <SubPage
      title={t(
        language,
        "medicines"
      )}
      onBack={onBack}
    >
      {medicines.length === 0 ? (
        <EmptyState
          text={t(
            language,
            "noMedicines"
          )}
        />
      ) : (
        medicines.map(
          (medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={
                medicine
              }
              language={language}
              onSpeak={onSpeak}
            />
          )
        )
      )}
    </SubPage>
  );
}

/* =========================================================
   APPOINTMENTS
========================================================= */

function AppointmentsView({
  appointments,
  language,
  onSpeak,
  onBack,
}) {
  return (
    <SubPage
      title={t(
        language,
        "appointments"
      )}
      onBack={onBack}
    >
      {appointments.length ===
      0 ? (
        <EmptyState
          text={t(
            language,
            "noAppointments"
          )}
        />
      ) : (
        appointments.map(
          (appointment) => (
            <AppointmentCard
              key={
                appointment.id
              }
              appointment={
                appointment
              }
              language={language}
              onSpeak={onSpeak}
            />
          )
        )
      )}
    </SubPage>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function NotificationsView({
  notifications,
  unreadCount,
  language,
  onSpeak,
  onRead,
  onMarkAllRead,
  onBack,
}) {
  return (
    <SubPage
      title={`${t(
        language,
        "notifications"
      )} ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
      onBack={onBack}
    >
      {unreadCount > 0 && (
        <button
          type="button"
          className="mark-all-read"
          onClick={
            onMarkAllRead
          }
        >
          {t(
            language,
            "markAllRead"
          )}
        </button>
      )}

      {notifications.length ===
      0 ? (
        <EmptyState
          text={t(
            language,
            "noNotifications"
          )}
        />
      ) : (
        notifications.map(
          (notification) => (
            <NotificationCard
              key={
                notification.id
              }
              notification={
                notification
              }
              language={language}
              onRead={onRead}
              onSpeak={onSpeak}
            />
          )
        )
      )}
    </SubPage>
  );
}

/* =========================================================
   AI
========================================================= */

function AIView({
  language,
  onBack,
}) {
  return (
    <SubPage
      title={t(
        language,
        "aiCompanion"
      )}
      onBack={onBack}
    >
      <div className="elder-feature-card ai-feature">
        <div className="feature-icon">
          🤖
        </div>

        <h2>
          {t(
            language,
            "aiComingSoon"
          )}
        </h2>

        <p>
          {language === "te"
            ? "ఇక్కడ మీరు మాట్లాడవచ్చు, AI వినుతుంది మరియు తరువాత మీ కుటుంబ సభ్యులకు సారాంశం పంపుతుంది."
            : "Here you will be able to speak with your AI companion. Conversations will later be summarized and shared with your family."}
        </p>

        <div className="feature-pills">
          <span>🎙 Voice</span>
          <span>💬 Chat</span>
          <span>📝 Summary</span>
        </div>
      </div>
    </SubPage>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function ProfileView({
  user,
  elderProfile,
  language,
  onBack,
}) {
  const name =
    user?.first_name ||
    elderProfile?.first_name ||
    user?.email?.split("@")[0] ||
    "Elder";

  return (
    <SubPage
      title={t(
        language,
        "profile"
      )}
      onBack={onBack}
    >
      <div className="elder-profile">
        <div className="profile-avatar">
          {name
            .charAt(0)
            .toUpperCase()}
        </div>

        <h2>{name}</h2>

        <p>
          {user?.email || "—"}
        </p>

        <span>
          CareConnect Elder
        </span>
      </div>
    </SubPage>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function SubPage({
  title,
  children,
  onBack,
}) {
  return (
    <section className="elder-subpage">
      <button
        type="button"
        className="elder-back"
        onClick={onBack}
      >
        ← Back
      </button>

      <h1>{title}</h1>

      <div className="elder-subpage-list">
        {children}
      </div>
    </section>
  );
}

function EmptyState({
  text,
}) {
  return (
    <div className="elder-empty">
      <div>💙</div>
      <p>{text}</p>
    </div>
  );
}

function BottomButton({
  icon,
  label,
  active,
  badge,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`elder-bottom-button ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span className="bottom-icon">
        {icon}

        {badge > 0 && (
          <small>{badge}</small>
        )}
      </span>

      <span>{label}</span>
    </button>
  );
}

function getGreetingKey() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "goodMorning";
  }

  if (hour < 17) {
    return "goodAfternoon";
  }

  return "goodEvening";
}