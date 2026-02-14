# Intercom OAuth Demo

A Next.js demo app implementing Intercom's OAuth authorization code flow. Built as a learning reference for integrating Intercom OAuth into web applications.

## How It Works

```
User clicks "Connect with Intercom"
        |
        v
[Next.js Server] ──redirect──> [Intercom OAuth Page]
                                       |
                                User authorizes
                                       |
                                       v
[Next.js Server] <──callback── [Intercom redirects with ?code=...]
        |
        v
[Next.js Server] ──POST──> [Intercom Token API]
        |                    returns access_token
        v
  Store token in HTTP-only cookie
        |
        v
  Dashboard shows admin info via /api/me proxy
```

## Prerequisites

1. An Intercom account with a **paid workspace**
2. A development app created at [developer.intercom.com](https://developers.intercom.com)
3. [Node.js](https://nodejs.org/) 18+
4. [ngrok](https://ngrok.com/) for local HTTPS tunneling (required for OAuth)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/allenlinli/intercom-auth.git
cd intercom-auth
pnpm install
```

### 2. Configure Intercom Developer Hub

1. Go to [developer.intercom.com](https://developers.intercom.com) and select your app
2. Navigate to **Configure > Authentication**
3. Click **Edit** and enable **Use OAuth**
4. Add a redirect URL (you'll update this with your ngrok URL later):
   ```
   https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/api/auth/callback
   ```
5. Go to **Configure > Basic Information** and note your **Client ID** and **Client Secret**

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
INTERCOM_CLIENT_ID=your-client-id
INTERCOM_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start ngrok

Intercom **requires HTTPS** for redirect URLs. The OAuth flow will not work on plain `http://localhost:3000`. You need an HTTPS tunnel:

```bash
ngrok http 3000
```

ngrok will display a forwarding URL like:

```
Forwarding  https://abcd-1234.ngrok-free.app -> http://localhost:3000
```

### 5. Update URLs with ngrok address

Every time ngrok restarts (free tier), you get a **new URL**. You must update **two places**:

**a) `.env.local`** — update `NEXT_PUBLIC_APP_URL`:

```
NEXT_PUBLIC_APP_URL=https://abcd-1234.ngrok-free.app
```

**b) Intercom Developer Hub** — update the redirect URL:

```
https://abcd-1234.ngrok-free.app/api/auth/callback
```

> **Tired of updating URLs every restart?** Two options for a stable URL:
>
> **ngrok paid plan ($8/mo)** — Get a fixed domain:
> ```bash
> ngrok http 3000 --url=your-name.ngrok-free.app
> ```
>
> **Cloudflare Tunnel (free)** — Requires a domain you manage on Cloudflare:
> ```bash
> brew install cloudflared
> cloudflared tunnel login
> cloudflared tunnel create intercom-auth
> cloudflared tunnel route dns intercom-auth intercom-auth.your-domain.com
> cloudflared tunnel run --url http://localhost:3000 intercom-auth
> ```

### 6. Start the dev server

```bash
pnpm dev
```

Open your **ngrok URL** (not localhost) in the browser to test the full OAuth flow.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home page with "Connect" button
│   ├── layout.tsx                  # Root layout
│   ├── dashboard/
│   │   └── page.tsx                # Dashboard with admin info
│   └── api/
│       ├── auth/
│       │   ├── intercom/route.ts   # OAuth initiation (generates state, redirects)
│       │   ├── callback/route.ts   # OAuth callback (validates state, exchanges code)
│       │   └── logout/route.ts     # Clears token cookie
│       └── me/route.ts             # Proxies /me API call (token never exposed to client)
├── lib/
│   ├── intercom.ts                 # Intercom API helpers
│   └── __tests__/
│       └── intercom.test.ts        # Unit tests
```

## Security

- **CSRF protection**: Random `state` parameter validated on every callback
- **HTTP-only cookies**: Access token stored server-side only, never exposed to JavaScript
- **API proxy**: All Intercom API calls go through `/api/me`, token never sent to the browser
- **Client secret**: Kept server-side only in environment variables

## Testing

```bash
pnpm test
```

## Common Issues

### ngrok URL changed / "endpoint is offline"

The free ngrok tier assigns a random URL each session. When it changes:
1. Stop the dev server
2. Update `NEXT_PUBLIC_APP_URL` in `.env.local` with the new ngrok URL
3. Update the redirect URL in **Intercom Developer Hub > Configure > Authentication**
4. Restart the dev server

### "OAuth is not configured" in Developer Hub

Click the **Edit** button on the Authentication page to enable OAuth and add redirect URLs.

> **Known Intercom bug:** After clicking Edit, the page may not respond or appear broken. Refresh the page in your browser — the Edit form should then load correctly.

### Hydration mismatch warning

If you see a hydration error mentioning `data-new-gr-c-s-check-loaded`, it's caused by the Grammarly browser extension — not a code bug. Safe to ignore.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Vitest](https://vitest.dev/) for testing
- [TypeScript](https://www.typescriptlang.org/)

## Learn More

- [Intercom OAuth Documentation](https://developers.intercom.com/docs/build-an-integration/learn-more/authentication/setting-up-oauth)
- [docs/intercom-oauth-guide.md](docs/intercom-oauth-guide.md) — Detailed OAuth implementation guide
