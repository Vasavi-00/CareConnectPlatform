import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
} from "./authApi.js";

const originalFetch = globalThis.fetch;
let lastRequest = null;

beforeEach(() => {
  lastRequest = null;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("requestPasswordResetOTP sends POST to correct endpoint and handles 200", async () => {
  globalThis.fetch = async (url, options) => {
    lastRequest = { url, options };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: "Instructions sent" }),
    };
  };

  const res = await requestPasswordResetOTP("test@example.com");
  assert.equal(res.message, "Instructions sent");
  assert.match(lastRequest.url, /\/auth\/forgot-password\/$/);
  assert.equal(lastRequest.options.method, "POST");
  assert.deepEqual(JSON.parse(lastRequest.options.body), { email: "test@example.com" });
});

test("requestPasswordResetOTP surfaces 503 service unavailable detail safely", async () => {
  globalThis.fetch = async (url, options) => {
    lastRequest = { url, options };
    return {
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ detail: "Password reset service is temporarily unavailable. Please try again later." }),
    };
  };

  await assert.rejects(
    async () => {
      await requestPasswordResetOTP("test@example.com");
    },
    {
      message: "Password reset service is temporarily unavailable. Please try again later.",
    }
  );
});

test("requestPasswordResetOTP surfaces 500 delivery failure detail safely", async () => {
  globalThis.fetch = async (url, options) => {
    lastRequest = { url, options };
    return {
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ detail: "Failed to send password reset email. Please try again later." }),
    };
  };

  await assert.rejects(
    async () => {
      await requestPasswordResetOTP("test@example.com");
    },
    {
      message: "Failed to send password reset email. Please try again later.",
    }
  );
});

test("verifyPasswordResetOTP sends POST with trimmed email and otp", async () => {
  globalThis.fetch = async (url, options) => {
    lastRequest = { url, options };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: "OTP verified successfully." }),
    };
  };

  const res = await verifyPasswordResetOTP(" test@example.com ", " 123456 ");
  assert.equal(res.message, "OTP verified successfully.");
  assert.match(lastRequest.url, /\/auth\/forgot-password\/verify-otp\/$/);
  assert.equal(lastRequest.options.method, "POST");
  assert.deepEqual(JSON.parse(lastRequest.options.body), { email: "test@example.com", otp: "123456" });
});

test("resetPassword sends POST with new credentials to /auth/forgot-password/reset/", async () => {
  globalThis.fetch = async (url, options) => {
    lastRequest = { url, options };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: "Password reset successfully." }),
    };
  };

  const res = await resetPassword("test@example.com", "123456", "NewPass123!", "NewPass123!");
  assert.equal(res.message, "Password reset successfully.");
  assert.match(lastRequest.url, /\/auth\/forgot-password\/reset\/$/);
  assert.equal(lastRequest.options.method, "POST");
  const body = JSON.parse(lastRequest.options.body);
  assert.equal(body.email, "test@example.com");
  assert.equal(body.otp, "123456");
  assert.equal(body.password, "NewPass123!");
  assert.equal(body.confirm_password, "NewPass123!");
});
