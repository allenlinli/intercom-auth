# Intercom OAuth Demo App - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js demo app that implements Intercom's OAuth authorization code flow with a polished UI.

**Architecture:** Next.js App Router with API routes handling the OAuth flow server-side. Token stored in HTTP-only cookie. Tailwind CSS for styling. No database.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, pnpm

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `.env.local`, `.env.example`, `.gitignore`

**Step 1: Initialize Next.js with pnpm**

Run:
```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --turbopack
```

Expected: Project scaffolded with App Router, TypeScript, Tailwind.

**Step 2: Create .env.example**

```bash
# .env.example
INTERCOM_CLIENT_ID=
INTERCOM_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Create .env.local with actual credentials**

```bash
# .env.local
INTERCOM_CLIENT_ID=e3b68971-16f1-4f32-a532-bd64dc2d4112
INTERCOM_CLIENT_SECRET=25c8ec79-66dc-42e0-a779-517aba2f16e7
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 4: Verify .gitignore includes .env.local**

Check `.gitignore` contains `.env*.local`. Next.js scaffold includes this by default.

**Step 5: Verify dev server starts**

Run: `pnpm dev`
Expected: Server running at localhost:3000, default Next.js page renders.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Intercom API Helper Library

**Files:**
- Create: `src/lib/intercom.ts`
- Test: `src/lib/__tests__/intercom.test.ts`

**Step 1: Install test dependencies**

Run:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 2: Write failing tests for intercom helpers**

```typescript
// src/lib/__tests__/intercom.test.ts
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
```

**Step 3: Run tests to verify they fail**

Run: `pnpm test`
Expected: All tests FAIL (module not found).

**Step 4: Implement intercom helpers**

```typescript
// src/lib/intercom.ts

const INTERCOM_CLIENT_ID = process.env.INTERCOM_CLIENT_ID!;
const INTERCOM_CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET!;

export function getAuthorizationUrl(state: string): string {
  return `https://app.intercom.com/oauth?client_id=${INTERCOM_CLIENT_ID}&state=${state}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch("https://api.intercom.io/auth/eagle/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      client_id: INTERCOM_CLIENT_ID,
      client_secret: INTERCOM_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getMe(accessToken: string): Promise<Record<string, unknown>> {
  const response = await fetch("https://api.intercom.io/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Intercom API error: ${response.status}`);
  }

  return response.json();
}
```

**Step 5: Set test env vars and run tests**

Add to `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    environment: "node",
    env: {
      INTERCOM_CLIENT_ID: "test-client-id",
      INTERCOM_CLIENT_SECRET: "test-client-secret",
    },
  },
  // ...
});
```

Run: `pnpm test`
Expected: All 4 tests PASS.

**Step 6: Commit**

```bash
git add src/lib/intercom.ts src/lib/__tests__/intercom.test.ts vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat: add Intercom API helper library with tests"
```

---

### Task 3: OAuth Initiation Route

**Files:**
- Create: `src/app/api/auth/intercom/route.ts`

**Step 1: Write the OAuth initiation route**

```typescript
// src/app/api/auth/intercom/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthorizationUrl } from "@/lib/intercom";

export async function GET() {
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("intercom_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const authUrl = getAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
```

**Step 2: Verify manually**

Visit `http://localhost:3000/api/auth/intercom` in browser.
Expected: Redirects to `app.intercom.com/oauth?client_id=...&state=...`

**Step 3: Commit**

```bash
git add src/app/api/auth/intercom/route.ts
git commit -m "feat: add OAuth initiation route with CSRF state"
```

---

### Task 4: OAuth Callback Route

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

**Step 1: Write the callback route**

```typescript
// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken } from "@/lib/intercom";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const cookieStore = await cookies();
  const storedState = cookieStore.get("intercom_oauth_state")?.value;

  // Clean up state cookie
  cookieStore.delete("intercom_oauth_state");

  // Validate state parameter (CSRF protection)
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${appUrl}?error=${encodeURIComponent("Invalid state parameter")}`
    );
  }

  // Validate code parameter
  if (!code) {
    return NextResponse.redirect(
      `${appUrl}?error=${encodeURIComponent("No authorization code received")}`
    );
  }

  try {
    const accessToken = await exchangeCodeForToken(code);

    cookieStore.set("intercom_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch {
    return NextResponse.redirect(
      `${appUrl}?error=${encodeURIComponent("Failed to exchange authorization code")}`
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/callback/route.ts
git commit -m "feat: add OAuth callback with state validation and token storage"
```

---

### Task 5: Logout Route and Me Proxy

**Files:**
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/me/route.ts`

**Step 1: Write the logout route**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("intercom_token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(appUrl);
}
```

**Step 2: Write the /me proxy route**

```typescript
// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMe } from "@/lib/intercom";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("intercom_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await getMe(token);
    return NextResponse.json(data);
  } catch {
    // Token may be revoked — clear it
    cookieStore.delete("intercom_token");
    return NextResponse.json({ error: "Token invalid or revoked" }, { status: 401 });
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/auth/logout/route.ts src/app/api/me/route.ts
git commit -m "feat: add logout route and /me API proxy"
```

---

### Task 6: Home Page UI

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Intercom OAuth Demo",
  description: "Demo app showing Intercom OAuth authorization code flow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Build the home page**

```tsx
// src/app/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Intercom OAuth Demo
          </h1>
          <p className="text-gray-600">
            Connect your Intercom account to see the OAuth authorization code
            flow in action.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <a
          href="/api/auth/intercom"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect with Intercom
        </a>

        <div className="text-xs text-gray-400 space-y-1">
          <p>This will redirect you to Intercom to authorize access.</p>
          <p>Your token is stored in an HTTP-only cookie and never exposed to JavaScript.</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
```

**Step 3: Verify visually**

Run: `pnpm dev`
Visit: `http://localhost:3000`
Expected: Centered page with title, description, blue "Connect with Intercom" button, and footer text.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: build home page with Connect with Intercom button"
```

---

### Task 7: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

**Step 1: Build the dashboard page**

```tsx
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminData {
  type: string;
  id: string;
  name: string;
  email: string;
  avatar?: {
    image_url: string;
  };
  app?: {
    name: string;
    timezone: string;
    region: string;
  };
  [key: string]: unknown;
}

export default function Dashboard() {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(setAdmin)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!admin) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          Intercom OAuth Demo
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Disconnect
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            {admin.avatar?.image_url && (
              <img
                src={admin.avatar.image_url}
                alt={admin.name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {admin.name}
              </h2>
              <p className="text-gray-600">{admin.email}</p>
            </div>
          </div>

          {admin.app && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Workspace</span>
                <p className="font-medium text-gray-900">{admin.app.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Region</span>
                <p className="font-medium text-gray-900">{admin.app.region}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full px-6 py-4 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between"
          >
            Raw API Response
            <span className="text-gray-400">{showRaw ? "Hide" : "Show"}</span>
          </button>
          {showRaw && (
            <pre className="px-6 pb-4 text-xs text-gray-600 overflow-auto max-h-96">
              {JSON.stringify(admin, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
```

**Step 2: Verify visually**

Visit: `http://localhost:3000/dashboard` (will redirect to home if not authed).

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: build dashboard page with admin info and raw JSON viewer"
```

---

### Task 8: End-to-End Test with ngrok

**Step 1: Start ngrok tunnel**

Run: `ngrok http 3000`
Note the HTTPS URL (e.g., `https://abc123.ngrok-free.app`).

**Step 2: Update environment**

Set `NEXT_PUBLIC_APP_URL` in `.env.local` to the ngrok URL.

**Step 3: Update Intercom redirect URL**

Go to Intercom Developer Hub → Authentication → Edit → set redirect URL to `https://<ngrok-url>/api/auth/callback`.

**Step 4: Test the full flow**

1. Visit `https://<ngrok-url>`
2. Click "Connect with Intercom"
3. Authorize in Intercom
4. Verify redirect to dashboard with admin info displayed
5. Click "Disconnect" and verify redirect back to home

**Step 5: Run unit tests**

Run: `pnpm test`
Expected: All tests pass.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: finalize env config for ngrok testing"
```
