import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  VoiceRecorder,
  getBestAudioMimeType,
  isMediaRecorderSupported,
} from "./audioRecorder.js";

class MockMediaStreamTrack {
  constructor(kind = "audio") {
    this.kind = kind;
    this.stopped = false;
  }
  stop() {
    this.stopped = true;
  }
}

class MockMediaStream {
  constructor() {
    this.tracks = [new MockMediaStreamTrack("audio")];
  }
  getTracks() {
    return this.tracks;
  }
}

class MockMediaRecorder {
  static supportedTypes = new Set([
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ]);

  static isTypeSupported(type) {
    return MockMediaRecorder.supportedTypes.has(type);
  }

  constructor(stream, options = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType || "audio/webm";
    this.state = "inactive";
    this.ondataavailable = null;
    this.onstop = null;
  }

  start(_timeslice) {
    this.state = "recording";
    // Simulate emitting an audio chunk
    setTimeout(() => {
      if (this.state === "recording" && this.ondataavailable) {
        this.ondataavailable({
          data: { size: 1024, type: this.mimeType },
        });
      }
    }, 10);
  }

  stop() {
    this.state = "inactive";
    setTimeout(() => {
      this.onstop?.();
    }, 10);
  }
}

let origNavigator;

beforeEach(() => {
  globalThis.window = {
    MediaRecorder: MockMediaRecorder,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };
  origNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: {
      mediaDevices: {
        getUserMedia: async () => new MockMediaStream(),
      },
    },
    configurable: true,
    writable: true,
  });
  globalThis.Blob = class MockBlob {
    constructor(chunks, options = {}) {
      this.chunks = chunks;
      this.type = options.type || "audio/webm";
      this.size = chunks.reduce((acc, c) => acc + (c.size || 0), 0);
    }
  };
});

afterEach(() => {
  delete globalThis.window;
  if (origNavigator) {
    Object.defineProperty(globalThis, "navigator", origNavigator);
  } else {
    delete globalThis.navigator;
  }
  delete globalThis.Blob;
});

test("isMediaRecorderSupported returns true when APIs are available", () => {
  assert.equal(isMediaRecorderSupported(), true);
});

test("getBestAudioMimeType selects top supported format", () => {
  const type = getBestAudioMimeType();
  assert.equal(type, "audio/webm;codecs=opus");
});

test("VoiceRecorder starts recording, tracks duration, and stops cleanly returning audio blob", async () => {
  const recorder = new VoiceRecorder();
  assert.equal(recorder.isRecording(), false);

  let volumeReported = null;
  let timeReported = 0;

  const started = await recorder.start({
    onVolume: (v) => { volumeReported = v; },
    onTime: (t) => { timeReported = t; },
  });
  assert.equal(started, true);
  assert.equal(recorder.isRecording(), true);

  // Wait a moment for simulated chunk
  await new Promise((r) => setTimeout(r, 30));

  const result = await recorder.stop();
  assert.equal(recorder.isRecording(), false);
  assert.ok(result);
  assert.equal(result.mimeType, "audio/webm;codecs=opus");
  assert.ok(result.sizeBytes > 0);
  assert.equal(volumeReported, null); // In Node test, AudioContext is not mocked so onVolume is safely skipped
  assert.ok(timeReported >= 0);
});

test("VoiceRecorder prevents simultaneous recording sessions", async () => {
  const recorder = new VoiceRecorder();
  await recorder.start();

  await assert.rejects(
    async () => {
      await recorder.start();
    },
    /already in progress/
  );

  await recorder.stop();
});

test("VoiceRecorder cancel halts recording and releases audio tracks without saving", async () => {
  const recorder = new VoiceRecorder();
  await recorder.start();
  assert.equal(recorder.isRecording(), true);

  recorder.cancel();
  assert.equal(recorder.isRecording(), false);

  const stopped = await recorder.stop();
  assert.equal(stopped, null);
});

test("VoiceRecorder provides empathetic error message when microphone permission is denied", async () => {
  globalThis.navigator.mediaDevices.getUserMedia = async () => {
    const error = new Error("Permission denied");
    error.name = "NotAllowedError";
    throw error;
  };

  const recorder = new VoiceRecorder();
  await assert.rejects(
    async () => {
      await recorder.start();
    },
    /Microphone access was denied/
  );
});

test("VoiceRecorder provides helpful error message when microphone device is not found", async () => {
  globalThis.navigator.mediaDevices.getUserMedia = async () => {
    const error = new Error("No device");
    error.name = "NotFoundError";
    throw error;
  };

  const recorder = new VoiceRecorder();
  await assert.rejects(
    async () => {
      await recorder.start();
    },
    /No microphone was found/
  );
});
