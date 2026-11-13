/**
 * Safe, elder-friendly audio recorder using MediaRecorder API.
 * Handles microphone permissions, multi-format detection, track release,
 * and live audio volume analysis for visual feedback.
 */

export function isMediaRecorderSupported() {
  return (
    typeof window !== "undefined" &&
    Boolean(navigator?.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder === "function"
  );
}

export function getBestAudioMimeType() {
  if (typeof window === "undefined" || typeof window.MediaRecorder !== "function") {
    return "";
  }
  const candidateTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/m4a",
    "audio/wav",
  ];
  for (const type of candidateTypes) {
    if (window.MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.animFrameId = null;
    this.timerId = null;
    this.chunks = [];
    this.recording = false;
    this.startTime = 0;
    this.mimeType = "";
  }

  isRecording() {
    return this.recording;
  }

  async start({ onVolume, onTime, maxDurationSec = 60, onMaxDuration } = {}) {
    if (this.recording) {
      throw new Error("A voice recording session is already in progress.");
    }

    if (!isMediaRecorderSupported()) {
      throw new Error(
        "Audio recording is not supported in this browser. Please use text input or speech recognition."
      );
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error(
          "Microphone access was denied. Please allow microphone access in your browser settings so your AI Companion can hear you."
        );
      }
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new Error(
          "No microphone was found on your device. Please plug in a microphone or type your message."
        );
      }
      if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        throw new Error(
          "Your microphone is currently in use by another application. Please close other audio apps and try again."
        );
      }
      throw new Error(
        err.message || "Could not access your microphone. Please check permissions."
      );
    }

    this.mediaStream = stream;
    this.chunks = [];
    this.mimeType = getBestAudioMimeType();

    const options = this.mimeType ? { mimeType: this.mimeType } : {};
    try {
      this.mediaRecorder = new window.MediaRecorder(stream, options);
    } catch {
      // Fallback without mimeType option if constructor fails with specific type
      this.mediaRecorder = new window.MediaRecorder(stream);
      this.mimeType = this.mediaRecorder.mimeType || "";
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Optional audio volume analysis for live soundwave visual feedback
    if (typeof onVolume === "function" && (window.AudioContext || window.webkitAudioContext)) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const pollVolume = () => {
          if (!this.recording) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalized = Math.min(1, average / 128);
          onVolume(normalized);
          this.animFrameId = requestAnimationFrame(pollVolume);
        };
        this.animFrameId = requestAnimationFrame(pollVolume);
      } catch {
        // Volume visualization is optional; audio recording continues regardless
      }
    }

    this.recording = true;
    this.startTime = Date.now();
    this.mediaRecorder.start(250); // Slice chunks every 250ms

    // Time counter & max duration auto-stop
    this.timerId = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
      if (typeof onTime === "function") {
        onTime(elapsedSec);
      }
      if (elapsedSec >= maxDurationSec) {
        if (typeof onMaxDuration === "function") {
          onMaxDuration();
        }
      }
    }, 1000);

    return true;
  }

  stop() {
    if (!this.recording || !this.mediaRecorder) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      this.recording = false;
      this._cleanupResources();

      this.mediaRecorder.onstop = () => {
        const finalType = this.mimeType || this.mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type: finalType });
        const durationSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
        this._releaseTracks();
        resolve({
          blob,
          mimeType: finalType,
          durationSec,
          sizeBytes: blob.size,
        });
      };

      try {
        if (this.mediaRecorder.state !== "inactive") {
          this.mediaRecorder.stop();
        } else {
          this._releaseTracks();
          resolve(null);
        }
      } catch {
        this._releaseTracks();
        resolve(null);
      }
    });
  }

  cancel() {
    this.recording = false;
    this._cleanupResources();
    this._releaseTracks();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore stop error on cancellation
      }
    }
    this.chunks = [];
  }

  _cleanupResources() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {
        // ignore close error
      }
      this.audioContext = null;
    }
  }

  _releaseTracks() {
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore track stop error
      }
      this.mediaStream = null;
    }
  }
}
