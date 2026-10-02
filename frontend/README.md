# 💙 CareConnect – Frontend

This is the **frontend application of CareConnect**, an AI-powered elderly care platform designed to connect elderly users with their families and provide easy access to medicines, appointments, emergency support, and an AI Companion.

The frontend provides separate interfaces for **Elder Users** and **Family Members**, with a simple, accessible, and responsive design.

---

## 🌟 Features

### 👴 Elder Dashboard

The Elder Dashboard provides elderly users with easy access to their essential services.

* 🏠 Dashboard overview
* 💊 Medicine management
* 📅 Appointment management
* 🤖 AI Companion
* 🚨 Emergency / SOS
* 👤 Profile
* 🔔 Notifications
* 📱 Responsive and accessible interface

---

### 👨‍👩‍👧 Family Dashboard

The Family Dashboard allows family members to monitor and support elderly users.

* 📊 Dashboard overview
* 💊 Medicine stock monitoring
* 📅 Upcoming appointments
* 🤖 AI Companion conversation summaries
* 🔔 Notifications
* 👴 Elder profile management
* 🚨 Emergency information

---

## 🤖 AI Companion

The frontend integrates the AI Companion into the Elder Dashboard.

Users can:

* 💬 Send messages to the AI Companion
* 🧠 Continue context-aware conversations
* ❤️ Receive supportive responses
* 😊 Discuss their feelings and daily activities
* 📋 Access conversation-related information

The frontend communicates with the Django backend through REST APIs.

### AI Companion Flow

```text
Elder
  │
  ▼
AI Companion UI
  │
  ▼
React Frontend
  │
  ▼
Django REST API
  │
  ▼
Gemini AI
  │
  ▼
AI Response
  │
  ▼
AI Companion UI
```

---

# 🛠️ Technology Stack

### Frontend

* **React.js**
* **Vite**
* **JavaScript**
* **HTML5**
* **CSS3**

### API Communication

* REST APIs
* Fetch API / Axios *(depending on the implementation)*

### Backend

* Django
* Django REST Framework

### AI

* Google Gemini API through the backend

### Development Tools

* npm
* Git
* GitHub
* VS Code

---

# 📁 Project Structure

```text
frontend/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │   └── logo.png
│   │
│   ├── components/
│   │   ├── ...
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── ...
│   │   └── ...
│   │
│   ├── styles/
│   │   ├── ...
│   │   └── ...
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
│
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

> The exact structure may change as new features and components are added.

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/Vasavi-00/CareConnectPlatform.git
```

Navigate to the frontend:

```bash
cd CareConnectPlatform/frontend
```

---

## 2. Install Dependencies

Make sure **Node.js and npm** are installed.

Check the versions:

```bash
node --version
npm --version
```

Install the project dependencies:

```bash
npm install
```

---

# ▶️ Run the Frontend

Start the Vite development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173/
```

Open the URL in your browser.

---

# 🔗 Backend Connection

The frontend communicates with the CareConnect Django backend through REST APIs.

The backend should be running before using features that require server-side data.

Start the backend separately:

```bash
cd backend
python manage.py runserver
```

Backend:

```text
http://127.0.0.1:8000/
```

Frontend:

```text
http://localhost:5173/
```

---

# 🔐 Environment Configuration

If the frontend uses environment variables, create a `.env` file in the frontend directory.

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The API base URL can then be used in the React application.

For example:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

### ⚠️ Important

Do not store private API keys such as the **Gemini API key** in the frontend.

AI API keys should remain on the backend.

---

# 🔄 Frontend–Backend Architecture

```text
┌─────────────────────────────┐
│       CareConnect UI        │
│                             │
│  Elder Dashboard            │
│  Family Dashboard           │
│  AI Companion               │
│  Medicines                  │
│  Appointments               │
│  Emergency / SOS            │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│       Django Backend        │
│                             │
│ Django REST Framework       │
│ Authentication             │
│ Business Logic              │
│ AI Companion               │
└──────────────┬──────────────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
   Database        Gemini AI
```

---

# 🧩 Main Frontend Modules

## 🏠 Dashboard

Provides an overview of important information.

### Elder

* Today's information
* Medicines
* Appointments
* AI Companion
* Emergency access

### Family

* Elder overview
* Medicine stock
* Upcoming appointments
* AI Companion summary
* Notifications

---

## 💊 Medicines

The medicine section allows users to view medicine-related information.

Possible information includes:

```text
Medicine Name
Dosage
Schedule
Available Stock
Status
```

---

## 📅 Appointments

The appointment interface displays upcoming medical appointments.

Example:

```text
Doctor: Dr. Example
Date: 10 October 2026
Time: 10:30 AM
Location: City Hospital
```

---

## 🤖 AI Companion

The AI Companion interface contains:

```text
┌─────────────────────────────────┐
│        AI Companion             │
├─────────────────────────────────┤
│                                 │
│ AI: Hello! How are you today?   │
│                                 │
│ You: I am feeling lonely.       │
│                                 │
│ AI: I'm here with you. ❤️       │
│                                 │
├─────────────────────────────────┤
│ Type your message...       [➤] │
└─────────────────────────────────┘
```

Messages are sent to the backend AI Companion API and the response is displayed in the chat interface.

---

# 🚨 Emergency / SOS

The emergency section provides quick access to emergency-related functionality.

It can include:

* SOS button
* Emergency contacts
* Important contact information
* Emergency instructions

The interface is designed to make emergency actions easy to access.

---

# 🎨 UI Design

CareConnect focuses on creating an interface that is:

* Simple
* Accessible
* Easy to navigate
* Elder-friendly
* Responsive
* Visually clear

The application includes separate layouts for Elder and Family dashboards.

---

# 📱 Responsive Design

The frontend is designed to support different screen sizes.

```text
Desktop
   │
   ├── Family Dashboard
   └── Elder Dashboard

Tablet
   │
   └── Responsive Dashboard

Mobile
   │
   └── Mobile-friendly interface
```

CSS media queries and responsive layouts are used to adapt the interface.

---

# 🧪 Development

Run the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# 🔍 Useful Commands

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

# 🌿 Git Workflow

Before making changes:

```bash
git pull origin main
```

Create a feature branch:

```bash
git checkout -b feature/frontend-update
```

Check your changes:

```bash
git status
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Update frontend"
```

Push:

```bash
git push origin feature/frontend-update
```

---

# 🔗 Backend Repository

CareConnect uses a Django backend for:

* Authentication
* Database operations
* Medicines
* Appointments
* Emergency contacts
* AI Companion
* Conversation management

The frontend communicates with these services through REST APIs.

---

# 🚀 Future Frontend Enhancements

Planned or possible improvements include:

* 🎙️ Voice-enabled AI Companion
* 🗣️ Multilingual UI
* 🔊 Text-to-Speech
* 🎤 Speech-to-Text
* 📱 Dedicated mobile application
* 🔔 Real-time notifications
* 📊 Health analytics
* 🌙 Dark mode
* ♿ Improved accessibility
* 🎨 Improved elder-friendly UI
* 🔐 Enhanced authentication screens

---

# 👥 Project

**CareConnect – AI-Powered Elderly Care Platform**

The frontend is developed using **React and Vite** and integrates with the CareConnect Django REST backend.

---

## ❤️ CareConnect

> **Connecting generations. Supporting independence. Caring with intelligence.**
