# AI Companion setup

## Provider configuration

The chat endpoint uses a server-side, OpenAI-compatible Chat Completions API. It
does not include a scripted response fallback. Add these values to the backend
environment (see `.env.example`), then restart Django:

```dotenv
AI_COMPANION_API_KEY=your-provider-key
AI_COMPANION_MODEL=gpt-4.1-mini
AI_COMPANION_TIMEOUT=30
AI_COMPANION_CONTEXT_MESSAGES=12
# Optional tone preference; fixed safety rules remain in the backend prompt.
AI_COMPANION_STYLE_GUIDANCE=Use calm, respectful wording and one question at a time.
# Optional for a compatible provider:
# AI_COMPANION_API_URL=https://provider.example/v1/chat/completions

# Speech-to-Text Transcription for voice conversations:
# AI_TRANSCRIPTION_API_KEY (optional, falls back to AI_COMPANION_API_KEY or OPENAI_API_KEY)
AI_TRANSCRIPTION_MODEL=whisper-1
# AI_TRANSCRIPTION_API_URL=https://api.openai.com/v1/audio/transcriptions
AI_TRANSCRIPTION_TIMEOUT=30
```

Keep the key in backend secrets or `backend/.env`; never expose it through a
React environment variable or commit a real key. Without a key, chat and audio transcription return an
explicit configuration error (HTTP 503). English and Telugu are the language
choices offered by the UI. The Whisper model natively supports English and Telugu transcription (language code `te`),
and the chat model is instructed to answer in the chosen language.

## Data and action boundaries

The backend sends the current message and a configurable, bounded number of
recent messages (2 to 30; default 12) from that elder's selected conversation. Conversations remain private to the elder. The
model can call allow-listed tools to read the signed-in elder's upcoming
appointments, current medicine schedule, today's reminders, and minimal profile
preferences. It cannot choose an elder ID or execute arbitrary code. Family
contact and SOS tool calls only create an in-app confirmation offer; the existing
family request button and SOS confirmation modal perform those actions after the
elder's explicit click. Appointment creation and reminder changes are not
available from elder chat.

Emotional conversation text is not copied to a separate preference store. The
existing private chat history is retained in the application database using its
existing retention behavior. Voice input/output use browser speech APIs, whose
availability and Telugu support depend on the device/browser; text chat remains
available when speech is unsupported.

## Consent-based family summaries

Conversations and their titles are private by default; family accounts do not
receive conversation lists or transcripts. An elder can request a draft update,
edit it, select currently connected family members, and explicitly confirm the
exact text before sharing. The draft is not visible to family. A selected family
member receives only a generic in-app alert; the reviewed text is fetched from an
authenticated endpoint that checks both the elder-family relationship and the
elder's recipient selection. The elder can revoke access later. Revocation hides
the summary in CareConnect; it cannot retract what someone may already have read.
There is no automatic or scheduled sharing, and summaries are never generated
from emotional cues alone.

## Local development and verification

From the repository root, start the existing backend and frontend using the
project's usual commands:

```powershell
cd backend
python manage.py runserver
```

```powershell
cd frontend
npm run dev
```

Run backend tests from `backend` with the project's configured dependencies and
database:

```powershell
python manage.py test ai_companion
```

Apply the `ai_companion` migration before serving the updated application. When deploying,
set the provider variables in the backend's secret manager, deploy the backend
and frontend code, restart/redeploy the backend, and verify a chat request. Do
not paste provider keys into logs or the browser bundle.
