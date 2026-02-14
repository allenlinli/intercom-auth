import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthorizationUrl, exchangeCodeForToken, getMe } from "@/lib/intercom";

describe("getAuthorizationUrl", () => {
  it("returns Intercom OAuth URL with client_id and state", () => {
    const url = getAuthorizationUrl("test-state");
    expect(url).toBe(
      "https://app.intercom.com/oauth?client_id=test-client-id&state=test-state"
    );
  });
});

describe("exchangeCodeForToken", () => {
  it("posts code to Intercom token endpoint and returns access token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          token_type: "Bearer",
          token: "test-token-123",
          access_token: "test-token-123",
        }),
    });

    const result = await exchangeCodeForToken("auth-code-123");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.intercom.io/auth/eagle/token",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "auth-code-123",
          client_id: "test-client-id",
          client_secret: "test-client-secret",
        }),
      })
    );
    expect(result).toBe("test-token-123");
  });

  it("throws on failed token exchange", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve("Bad Request"),
    });

    await expect(exchangeCodeForToken("bad-code")).rejects.toThrow(
      "Token exchange failed"
    );
  });
});

describe("getMe", () => {
  it("calls Intercom /me endpoint with bearer token", async () => {
    const adminData = {
      type: "admin",
      id: "123",
      name: "Test Admin",
      email: "admin@test.com",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(adminData),
    });

    const result = await getMe("my-token");

    expect(global.fetch).toHaveBeenCalledWith("https://api.intercom.io/me", {
      headers: {
        Authorization: "Bearer my-token",
        Accept: "application/json",
      },
    });
    expect(result).toEqual(adminData);
  });

  it("throws on unauthorized request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    await expect(getMe("bad-token")).rejects.toThrow("Intercom API error");
  });
});
