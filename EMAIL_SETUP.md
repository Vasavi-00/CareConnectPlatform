# Email and deployment setup

CareConnect keeps its existing email OTP password reset flow. The backend generates a six digit, time limited code, emails it, verifies it, and accepts a new password only after verification.

## Local development

Copy `backend/.env.example` to `backend/.env` and set `SECRET_KEY` and the database settings for your machine. Django uses the console email backend by default when `DEBUG=True`. The message and OTP are printed in the backend terminal for local testing. To send real local email, set `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` as shown below. Automated tests use Django's in-memory email backend.

To send real local email, configure these values in `backend/.env`:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=your-sending-account@example.com
EMAIL_HOST_PASSWORD=your-provider-app-password
DEFAULT_FROM_EMAIL=your-sending-account@example.com
FRONTEND_URL=http://localhost:5173
```

Use the provider's SMTP credentials or app password. Do not use an account's ordinary sign-in password. Do not commit `backend/.env`.

## Production

Configure the same email variables in the backend host's environment settings. For the current Render service, set `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, and `DEFAULT_FROM_EMAIL` in the `careconnect-api` service. `EMAIL_HOST`, port, and TLS defaults are declared in `render.yaml`; they can be overridden for another provider. Keep `DEBUG=False` and use a verified sender address accepted by the provider.

The public API defaults to `https://careconnect-api.onrender.com/api` in production. If the API is hosted elsewhere, set `VITE_API_BASE_URL` in the Vercel project's environment settings to the API base including `/api`, then redeploy the frontend. Local development uses `http://127.0.0.1:8000/api` by default.

## Run locally

From the repository root, open two terminals:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```powershell
cd frontend
npm install
npm run dev
```

If the virtual environment already exists, activate it and skip the creation step. The Vite app is normally at `http://localhost:5173` and Django at `http://127.0.0.1:8000`.

## Deploy

1. Set the SMTP environment variables in Render. Keep the SMTP sender and `DEFAULT_FROM_EMAIL` aligned.
2. Confirm the production database URL is configured and accessible during Render's build. The Render build now applies migrations before collecting static files.
3. Set `VITE_API_BASE_URL` in Vercel only if the API host differs from the production default; use the base URL ending in `/api`.
4. Deploy the backend, then deploy the frontend. Test the reset flow with a dedicated test account and verify that the six digit code arrives and can be used once within five minutes.
5. Check Render logs if delivery fails. The public response intentionally stays generic to prevent account discovery; server logs record a delivery exception without returning provider details to the user.

Render's configured SQLite database is not durable across all hosting lifecycle events. For persistent production user data, use the project's supported PostgreSQL configuration and provide a managed PostgreSQL `DATABASE_URL` before relying on the deployment for real accounts.
