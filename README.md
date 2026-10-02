# 🩺 CareConnect – AI-Powered Elderly Care Platform

CareConnect is an **AI-powered elderly care and family support platform** designed to help elderly people manage their daily healthcare needs while keeping their family members informed and connected.

The platform provides dedicated dashboards for **elderly users and family members**, along with an **AI Companion** that can communicate with elders, understand their conversations and mood, provide supportive responses, and generate useful summaries for their family.

---

## 🌟 Features

### 👴 Elder Dashboard

The Elder Dashboard provides elderly users with a simple and accessible interface to manage their daily activities.

* 💊 **Medicine Management**

  * View prescribed medicines
  * Track medicine availability
  * Monitor medication schedules

* 📅 **Appointments**

  * View upcoming medical appointments
  * Track appointment details

* 🤖 **AI Companion**

  * Chat with an AI companion
  * Have supportive conversations
  * Reduce feelings of loneliness
  * Get assistance using simple language
  * Maintain conversation context

* 🚨 **Emergency / SOS**

  * Quickly access emergency assistance
  * Contact predefined emergency contacts

* 👤 **Profile**

  * View and manage personal information

---

### 👨‍👩‍👧 Family Dashboard

The Family Dashboard allows family members to monitor and support elderly users remotely.

* 📊 **Overview Dashboard**

  * Elder status
  * Medicine information
  * Upcoming appointments
  * AI Companion summaries
  * Important notifications

* 💊 **Medicine Stock**

  * Monitor available medicines
  * Identify medicines that need attention

* 📅 **Appointment Tracking**

  * View upcoming appointments
  * Monitor important medical schedules

* 🤖 **AI Companion Summary**

  * Receive summaries of conversations between the elder and AI Companion
  * Identify important information from conversations

* 🔔 **Notifications**

  * Receive important updates
  * Add/manage elder profiles

* 🚨 **Emergency Support**

  * Access emergency-related information and contacts

---

## 🤖 AI Companion

The AI Companion is one of the core features of CareConnect.

It is designed specifically for elderly users and focuses on:

* Friendly and supportive conversations
* Simple and understandable language
* Conversation memory
* Context-aware responses
* Mood and situation awareness
* Personalized interactions
* Conversation summarization
* Sharing relevant summaries with family members

### Example

> **Elder:** I feel a little lonely today.

> **AI Companion:** I'm here with you. Would you like to tell me about your day?

The companion can use previous conversation context to make interactions more natural.

For example, if an elder previously mentioned that their daughter calls every Sunday, the AI Companion can use that information appropriately in later conversations.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      CareConnect      │
                         │       Platform        │
                         └──────────┬───────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
        ┌───────▼────────┐                     ┌────────▼────────┐
        │  Elder Dashboard│                     │ Family Dashboard │
        └───────┬────────┘                     └────────┬────────┘
                │                                       │
                └──────────────────┬────────────────────┘
                                   │
                         ┌─────────▼─────────┐
                         │   Django REST API │
                         │      Backend      │
                         └─────────┬─────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
      ┌──────▼──────┐       ┌──────▼──────┐      ┌──────▼──────┐
      │   Database  │       │ AI Companion│      │   Services  │
      │ SQLite/Postgres│    │   Gemini AI │      │ Appointments│
      └─────────────┘       └─────────────┘      │ Medicines   │
                                                  │ Emergency   │
                                                  └─────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* **React.js**
* **Vite**
* HTML5
* CSS3
* JavaScript
* Responsive UI

## Backend

* **Python**
* **Django**
* **Django REST Framework**
* **django-cors-headers**

## Database

* SQLite for local development
* PostgreSQL for shared/production environments

## Artificial Intelligence

* **Google Gemini API**
* `google.genai`
* AI-powered conversational system
* Conversation context and memory

## Development Tools

* Git
* GitHub
* VS Code
* npm
* Python Virtual Environment

---

# 📁 Project Structure

```text
CareConnectPlatform/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── manage.py
│   │
│   ├── ai_companion/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── ...
│   │
│   ├── appointments/
│   ├── medicines/
│   ├── emergency_contacts/
│   ├── users/
│   ├── companion/
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

> The exact folder structure may vary depending on the current branch and implementation.

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/Vasavi-00/CareConnectPlatform.git
cd CareConnectPlatform
```

---

# 🔵 Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

## 2. Create a Virtual Environment

Linux/macOS:

```bash
python3 -m venv venv
```

Windows:

```bash
python -m venv venv
```

---

## 3. Activate Virtual Environment

### Linux/macOS

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

---

## 4. Install Dependencies

```bash
pip install -r requirements.txt
```

If a requirements file is not available, install the main dependencies:

```bash
pip install django djangorestframework django-cors-headers google-genai
```

---

# 🔐 Environment Variables

Create a `.env` file inside the backend directory.

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Important

Do **not** commit your API key to GitHub.

Add `.env` to `.gitignore`:

```gitignore
.env
venv/
__pycache__/
*.pyc
db.sqlite3
```

---

# 🗄️ Database Setup

Run migrations:

```bash
python manage.py makemigrations
```

```bash
python manage.py migrate
```

---

# 👤 Create Admin User

To create a Django administrator:

```bash
python manage.py createsuperuser
```

Follow the prompts to enter:

```text
Username
Email
Password
```

---

# ▶️ Run Backend

Start the Django development server:

```bash
python manage.py runserver
```

The backend will normally be available at:

```text
http://127.0.0.1:8000/
```

---

# 🟢 Frontend Setup

Open another terminal.

Navigate to the frontend:

```bash
cd CareConnectPlatform/frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173/
```

---

# 🔗 API

The backend exposes REST APIs for different CareConnect services.

Example AI Companion endpoint:

```text
POST /api/companion/chat/
```

Example request:

```json
{
  "message": "I am feeling lonely today."
}
```

Example response:

```json
{
  "response": "I'm here with you. Would you like to tell me about your day?"
}
```

Other API modules include:

```text
/api/companion/
/api/appointments/
/api/medicines/
/api/emergency-contacts/
```

The exact endpoints may vary depending on the current implementation.

---

# 🧠 AI Companion Workflow

```text
Elder
  │
  ▼
Enter / Speak Message
  │
  ▼
React Frontend
  │
  ▼
Django REST API
  │
  ▼
Conversation History
  │
  ▼
Gemini AI
  │
  ▼
Context + Mood + Memory
  │
  ▼
AI Response
  │
  ▼
Elder Dashboard
```

The system can also process conversations to generate useful information for family members.

```text
Elder ↔ AI Companion
          │
          ▼
   Conversation History
          │
          ▼
     AI Summarization
          │
          ▼
     Family Dashboard
```

---

# 🔒 Security Considerations

CareConnect handles sensitive user and healthcare-related information, so security is an important part of the platform.

Recommended practices include:

* Never expose API keys in frontend code
* Store secrets in environment variables
* Use authentication and authorization
* Protect REST API endpoints
* Validate user input
* Use HTTPS in production
* Restrict CORS configuration
* Do not commit database credentials
* Do not commit `.env` files
* Apply appropriate access control between elder and family accounts

---

# 🧪 Testing

Backend tests can be executed using:

```bash
python manage.py test
```

Frontend testing can be added using the testing framework configured in the project.

API endpoints can also be tested using tools such as:

* Postman
* cURL
* Browser developer tools

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/companion/chat/ \
-H "Content-Type: application/json" \
-d '{"message":"Hello"}'
```

---

# 🌐 User Roles

CareConnect primarily supports two types of users:

| User            | Main Responsibilities                                               |
| --------------- | ------------------------------------------------------------------- |
| 👴 Elder        | Medicines, appointments, AI Companion, emergency support            |
| 👨‍👩‍👧 Family | Monitor elder, medicines, appointments, notifications, AI summaries |

---

# 🎯 Objectives

The main objectives of CareConnect are to:

1. Improve elderly independence.
2. Help families remotely support elderly members.
3. Reduce loneliness through AI-assisted conversation.
4. Provide easy access to medicine and appointment information.
5. Provide quick access to emergency support.
6. Keep family members informed about important situations.
7. Use AI to provide personalized and context-aware interactions.

---

# 🚀 Future Enhancements

Potential future improvements include:

* 🎙️ Voice-based AI Companion
* 🗣️ Multilingual conversations
* 🔊 Text-to-Speech
* 🎤 Speech-to-Text
* 🧠 Improved long-term memory
* 😊 Advanced mood detection
* 📱 Mobile application
* 🔔 Real-time family notifications
* 📍 Location-based emergency support
* ❤️ Wearable/health-device integration
* 📊 Health and activity analytics
* 🔐 Advanced authentication
* ☁️ Cloud deployment
* 🏥 Healthcare provider integration

---

# 👥 Team

**CareConnectPlatform** is developed as a collaborative software project focused on improving elderly care through technology and artificial intelligence.

---

# 📜 License

This project is currently intended for **educational, academic, and project-development purposes**.

A production deployment should include an appropriate open-source or proprietary license and clearly defined privacy and data-handling policies.

---

# ❤️ CareConnect

> **Connecting generations. Supporting independence. Caring with intelligence.**

CareConnect combines **AI, healthcare management, emergency support, and family connectivity** to create a technology-assisted environment for elderly care.
