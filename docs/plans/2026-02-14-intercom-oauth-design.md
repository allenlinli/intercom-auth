# Intercom OAuth Demo App - Design

## Purpose

Learning/reference demo app that implements Intercom's OAuth flow with a polished UI. Demonstrates the full authorization code flow: redirect, callback, token exchange, and authenticated API calls.

## Architecture

**Stack:** Next.js App Router + Tailwind CSS

**Single project** handles both frontend and API routes. No separate backend.

```
src/
├── app/
│   ├── page.tsx                      # Home: "Connect with Intercom" button
│   ├── layout.tsx                    # Root layout
│   ├── dashboard/
│   │   └── page.tsx                  # Post-auth: admin info, workspace data
│   └── api/
│       ├── auth/
│       │   ├── intercom/route.ts     # Initiates OAuth redirect
│       │   ├── callback/route.ts     # Exchanges code for token
│       │   └── logout/route.ts       # Clears token cookie
│       └── me/route.ts              # Proxies Intercom /me endpoint
└── lib/
    └── intercom.ts                  # Token exchange, API call helpers
```

## OAuth Flow

1. User clicks "Connect with Intercom" -> `GET /api/auth/intercom`
2. Server generates random `state`, stores in cookie, redirects to `https://app.intercom.com/oauth?client_id=___&state=___`
3. User authorizes in Intercom -> Intercom redirects to `GET /api/auth/callback?code=___&state=___`
4. Server validates `state`, exchanges `code` for token via `POST https://api.intercom.io/auth/eagle/token`
5. Server stores token in HTTP-only cookie, redirects to `/dashboard`
6. Dashboard calls `GET /api/me` -> server reads cookie, calls Intercom `/me` API -> returns admin info

## Token Storage

HTTP-only, Secure, SameSite=Lax cookie. Token never exposed to client-side JavaScript. No database needed. Intercom tokens don't expire (no refresh tokens).

## UI

### Home (`/`)
- Centered layout with "Intercom OAuth Demo" title
- Brief description of the demo
- "Connect with Intercom" button (official OAuth button image)
- Redirect to dashboard if already authenticated

### Dashboard (`/dashboard`)
- Header with app name + "Disconnect" button
- Card with admin info: name, email, avatar, workspace name
- Collapsible raw JSON response viewer (educational)
- Redirect to home if not authenticated

### Styling
Tailwind CSS (ships with Next.js).

## Security

- **CSRF protection:** Random `state` parameter validated on callback
- **Token isolation:** HTTP-only cookie, never in client JS
- **API proxy:** `/api/me` proxies calls so token stays server-side
- **Error handling:** Invalid state/code -> redirect to home with error message
- **Revoked tokens:** API failures clear cookie, redirect to home

## Local Development

```
Terminal 1: pnpm dev          -> localhost:3000
Terminal 2: ngrok http 3000   -> https://abc123.ngrok.io
```

Update Intercom Developer Hub redirect URL to `https://<ngrok-url>/api/auth/callback`.

### Environment Variables (.env.local)
```
INTERCOM_CLIENT_ID=
INTERCOM_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://<ngrok-url>
```

## Intercom Developer Hub Setup

1. Create app at developer.intercom.com -> Development workspace
2. Go to Authentication -> Edit -> Enable OAuth
3. Add redirect URL: `https://<ngrok-url>/api/auth/callback`
4. Copy client_id and client_secret from Basic Information -> `.env.local`
