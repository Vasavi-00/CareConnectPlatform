"""Speech-to-text transcription service for CareConnect AI Companion.

Accepts elder voice recordings, validates size and MIME types, and transcribes
audio using a configurable OpenAI-compatible audio transcription endpoint (e.g., Whisper).
Credentials are read only from backend environment variables.
"""
import io
import json
import logging
import os
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

# Allowed MIME types for uploaded elder audio recordings
ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/ogg",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
}

# Maximum audio upload size: 10 megabytes (realistic 60s speech is < 1 MB)
MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024
MIN_AUDIO_SIZE_BYTES = 100

# Supported language codes for Whisper transcription
LANGUAGE_CODE_MAP = {
    "English": "en",
    "Telugu": "te",
    "en": "en",
    "te": "te",
}


class TranscriptionError(Exception):
    status_code = 502


class TranscriptionNotConfigured(TranscriptionError):
    status_code = 503


class TranscriptionTimeout(TranscriptionError):
    status_code = 504


class TranscriptionBusy(TranscriptionError):
    status_code = 503


class TranscriptionValidationError(TranscriptionError):
    status_code = 400


def validate_audio_file(uploaded_file):
    """Validate uploaded audio file size and content type.

    Returns (filename, content_type, file_bytes).
    """
    if uploaded_file is None:
        raise TranscriptionValidationError("No audio file was uploaded.")

    # Check file size
    size = getattr(uploaded_file, "size", 0)
    if size < MIN_AUDIO_SIZE_BYTES:
        raise TranscriptionValidationError("Uploaded audio is too short or empty. Please speak into the microphone.")
    if size > MAX_AUDIO_SIZE_BYTES:
        raise TranscriptionValidationError("Audio recording exceeds the 10 MB limit. Please record a shorter message.")

    # Normalize content type
    raw_content_type = getattr(uploaded_file, "content_type", "") or ""
    content_type = raw_content_type.split(";")[0].strip().lower()
    name = getattr(uploaded_file, "name", "") or "recording.webm"
    ext = os.path.splitext(name)[1].lower()

    valid_exts = {".webm", ".ogg", ".mp4", ".m4a", ".wav", ".mp3", ".mpeg"}
    if content_type not in ALLOWED_AUDIO_TYPES and ext not in valid_exts:
        # Check if MIME type starts with audio/
        if not content_type.startswith("audio/"):
            raise TranscriptionValidationError(f"Unsupported audio format '{raw_content_type}'. Please use a standard recording format.")

    # Read bytes safely
    try:
        uploaded_file.seek(0)
        file_bytes = uploaded_file.read()
    except Exception as exc:
        raise TranscriptionValidationError("Could not read uploaded audio file.") from exc

    if len(file_bytes) < MIN_AUDIO_SIZE_BYTES:
        raise TranscriptionValidationError("Uploaded audio file is empty. Please speak into the microphone.")

    # Ensure a proper filename with extension for the multipart upload
    if not ext:
        if "wav" in content_type:
            name += ".wav"
        elif "mp4" in content_type or "m4a" in content_type:
            name += ".m4a"
        elif "ogg" in content_type:
            name += ".ogg"
        elif "mp3" in content_type or "mpeg" in content_type:
            name += ".mp3"
        else:
            name += ".webm"

    return name, raw_content_type or "audio/webm", file_bytes


def _build_multipart_payload(fields, files, boundary):
    """Construct multipart/form-data payload body."""
    body = io.BytesIO()

    for field_name, value in fields.items():
        if value is None:
            continue
        body.write(f"--{boundary}\r\n".encode("utf-8"))
        body.write(f'Content-Disposition: form-data; name="{field_name}"\r\n\r\n'.encode("utf-8"))
        body.write(str(value).encode("utf-8"))
        body.write(b"\r\n")

    for file_field, (filename, content_type, file_data) in files.items():
        body.write(f"--{boundary}\r\n".encode("utf-8"))
        body.write(
            f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'.encode("utf-8")
        )
        body.write(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.write(file_data)
        body.write(b"\r\n")

    body.write(f"--{boundary}--\r\n".encode("utf-8"))
    return body.getvalue()


def _transcribe_with_gemini(file_bytes, content_type="audio/webm", language="English", gemini_key=""):
    import base64
    b64 = base64.b64encode(file_bytes).decode("utf-8")
    model = os.getenv("AI_COMPANION_MODEL", "gemini-flash-lite-latest")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"

    clean_mime = (content_type or "audio/webm").split(";")[0].strip().lower()
    valid_mimes = {"audio/wav", "audio/mp3", "audio/ogg", "audio/webm", "audio/m4a", "audio/mp4", "audio/aac", "audio/flac"}
    if clean_mime not in valid_mimes:
        clean_mime = "audio/webm"

    prompt = (
        f"Transcribe this audio recording of an elder speaking in {language}. "
        "Return ONLY the verbatim spoken words. "
        "Do not include quotes, markdown, explanations, or timestamps. "
        "If there is only silence, background noise, or no recognizable speech, reply with EMPTY."
    )
    body = {
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": clean_mime, "data": b64}},
                {"text": prompt}
            ]
        }],
        "generationConfig": {"temperature": 0.1}
    }
    req = Request(url, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    timeout = float(os.getenv("AI_TRANSCRIPTION_TIMEOUT", "30"))

    started_at = time.monotonic()
    try:
        with urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        logger.info("gemini_transcription_request outcome=success duration_ms=%d", int((time.monotonic() - started_at) * 1000))
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])
        transcript = parts[0].get("text", "").strip() if parts else ""
        if transcript.upper() == "EMPTY" or transcript.lower() in {"empty.", "empty"}:
            return ""
        return transcript
    except HTTPError as exc:
        duration_ms = int((time.monotonic() - started_at) * 1000)
        logger.warning("gemini_transcription_request outcome=http_error status=%s duration_ms=%d", exc.code, duration_ms)
        if exc.code == 429:
            raise TranscriptionBusy("The speech recognition service is busy. Please wait a moment and try again.") from exc
        raise TranscriptionError("The speech recognition service could not transcribe that audio. Please try again.") from exc
    except (TimeoutError, URLError) as exc:
        raise TranscriptionError("The speech recognition service could not be reached. Please check your connection and try again.") from exc


def transcribe_audio_bytes(file_bytes, filename="recording.webm", content_type="audio/webm", language="English"):
    """Send recorded audio to configured Gemini or Whisper transcription service."""
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key and not gemini_key.startswith("your_") and not gemini_key.startswith("replace-"):
        try:
            return _transcribe_with_gemini(file_bytes, content_type=content_type, language=language, gemini_key=gemini_key)
        except (TranscriptionBusy, TranscriptionTimeout):
            raise
        except Exception as exc:
            logger.warning("Gemini audio transcription failed, falling back to Whisper if configured: %s", exc)

    api_key = (
        os.getenv("AI_TRANSCRIPTION_API_KEY", "").strip()
        or os.getenv("AI_COMPANION_API_KEY", "").strip()
        or os.getenv("OPENAI_API_KEY", "").strip()
    )
    if not api_key or api_key.startswith("your_") or api_key.startswith("replace-"):
        raise TranscriptionNotConfigured(
            "Speech-to-text service is not configured. Set GEMINI_API_KEY, AI_TRANSCRIPTION_API_KEY, or OPENAI_API_KEY on the backend."
        )

    endpoint = os.getenv("AI_TRANSCRIPTION_API_URL", "https://api.openai.com/v1/audio/transcriptions")
    parsed_endpoint = urlparse(endpoint)
    if parsed_endpoint.scheme != "https" and parsed_endpoint.hostname not in {"localhost", "127.0.0.1"}:
        raise TranscriptionNotConfigured("AI_TRANSCRIPTION_API_URL must use HTTPS outside local development.")

    model = os.getenv("AI_TRANSCRIPTION_MODEL", "whisper-1")
    lang_code = LANGUAGE_CODE_MAP.get(language, LANGUAGE_CODE_MAP.get(language.lower(), "en"))

    fields = {
        "model": model,
        "temperature": "0.2",
    }
    if lang_code:
        fields["language"] = lang_code

    boundary = f"----CareConnectBoundary{int(time.time() * 1000)}"
    files = {
        "file": (filename, content_type, file_bytes),
    }

    payload = _build_multipart_payload(fields, files, boundary)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(payload)),
    }

    req = Request(endpoint, data=payload, headers=headers, method="POST")
    timeout = float(os.getenv("AI_TRANSCRIPTION_TIMEOUT", "30"))

    started_at = time.monotonic()
    try:
        with urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        logger.info("ai_transcription_request outcome=success duration_ms=%d", int((time.monotonic() - started_at) * 1000))
    except HTTPError as exc:
        duration_ms = int((time.monotonic() - started_at) * 1000)
        logger.warning("ai_transcription_request outcome=http_error status=%s duration_ms=%d", exc.code, duration_ms)
        if exc.code == 429:
            raise TranscriptionBusy("The speech recognition service is busy. Please wait a moment and try again.") from exc
        raise TranscriptionError("The speech recognition service could not transcribe that audio. Please try again.") from exc
    except (TimeoutError, URLError) as exc:
        if isinstance(exc, URLError) and isinstance(exc.reason, TimeoutError):
            raise TranscriptionTimeout("Speech recognition took too long. Please try again.") from exc
        raise TranscriptionError("The speech recognition service could not be reached. Please check your connection and try again.") from exc
    except (ValueError, KeyError, TypeError) as exc:
        raise TranscriptionError("The speech recognition service returned an unreadable response.") from exc

    transcript = data.get("text", "").strip()
    return transcript


def transcribe_elder_audio(uploaded_file, language="English"):
    """Validates an uploaded file from a Django request and returns the transcription."""
    filename, content_type, file_bytes = validate_audio_file(uploaded_file)
    text = transcribe_audio_bytes(
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
        language=language,
    )

    # Detect empty or unintelligible speech
    # Whispers sometimes return "." or "Thank you." on dead air
    cleaned = text.strip().strip(".").strip()
    is_empty_or_silence = not cleaned or cleaned.lower() in {"thank you", "you", "thanks for watching", "subtitles by", "bye"}

    return {
        "text": "" if is_empty_or_silence else text,
        "language": language,
        "is_clear": not is_empty_or_silence,
        "clarification_needed": is_empty_or_silence,
        "fallback_prompt": (
            "మీరు మాట్లాడినది స్పష్టంగా వినిపించలేదు. దయచేసి మైక్రోఫోన్ నొక్కి మళ్లీ చెప్పండి."
            if language == "Telugu"
            else "I couldn't quite hear that. Please tap the microphone and speak again."
        ) if is_empty_or_silence else "",
    }
