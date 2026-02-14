# Intercom OAuth Guide

How to implement Intercom's OAuth authorization code flow to access other people's Intercom data through a public integration.

## When You Need OAuth

- Building a **public** integration that accesses other people's Intercom data
- You currently ask users for their API keys (against Intercom's TOS)
- You want customers to securely share their Intercom data with your app

If you only need access to **your own** Intercom workspace, use an Access Token instead (no OAuth needed).

## Prerequisites

1. An Intercom account with a paid workspace
2. A development app created at [developer.intercom.com](https://developers.intercom.com)
3. An HTTPS endpoint for the redirect URL (use ngrok for local development)

## Step 1: Configure Your App in Intercom Developer Hub

1. Go to [developer.intercom.com](https://developers.intercom.com) and select your app
2. Navigate to **Configure > Authentication**
3. Click **Edit** and enable **Use OAuth**
4. Add your **Redirect URL** (must be HTTPS):
   ```
   https://your-domain.com/api/auth/callback
   ```
5. Go to **Configure > Basic Information** and note your:
   - **Client ID** (public identifier for your app)
   - **Client Secret** (keep this secret, server-side only)

## Step 2: The OAuth Flow

The flow has three steps: redirect, callback, and token use.

```
User clicks "Connect"
        |
        v
[Your Server] ──redirect──> [Intercom OAuth Page]
                                     |
                              User authorizes
                                     |
                                     v
[Your Server] <──callback── [Intercom redirects with ?code=...]
        |
        v
[Your Server] ──POST──> [Intercom Token API]
        |                    returns access_token
        v
  Store token, use for API calls
```

### 2a. Redirect the User to Intercom

Send the user to Intercom's OAuth page with your `client_id` and a random `state` parameter for CSRF protection:

```
https://app.intercom.com/oauth?client_id=YOUR_CLIENT_ID&state=RANDOM_STATE
```

Store the `state` value server-side (e.g., in an HTTP-only cookie) so you can validate it when the callback arrives.

```typescript
// Generate state, store in cookie, redirect
const state = crypto.randomUUID();

cookies().set("intercom_oauth_state", state, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 600, // 10 minutes
});

redirect(`https://app.intercom.com/oauth?client_id=${CLIENT_ID}&state=${state}`);
```

### 2b. Handle the Callback

After the user authorizes, Intercom redirects to your redirect URL with two query parameters:

```
GET /api/auth/callback?code=AUTHORIZATION_CODE&state=STATE
```

Validate the `state` parameter matches what you stored, then exchange the `code` for an access token:

```typescript
// Validate state (CSRF protection)
const storedState = cookies().get("intercom_oauth_state")?.value;
if (state !== storedState) {
  throw new Error("Invalid state parameter");
}

// Exchange code for token
const response = await fetch("https://api.intercom.io/auth/eagle/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    code: authorizationCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
});

const data = await response.json();
// data.access_token contains the token
```

The response looks like:

```json
{
  "token_type": "Bearer",
  "token": "dG9rOjBiM...",
  "access_token": "dG9rOjBiM..."
}
```

### 2c. Use the Token

Include the access token as a Bearer token in API requests:

```typescript
const response = await fetch("https://api.intercom.io/me", {
  headers: {
    Authorization: "Bearer ACCESS_TOKEN",
    Accept: "application/json",
  },
});
```

## Token Behavior

- Tokens **do not expire** (no refresh tokens)
- Tokens remain valid until the user **revokes access** manually
- Or until your app **deauthorizes itself**
- Store tokens securely (encrypted database or HTTP-only cookies)

## Security Checklist

- [ ] **HTTPS only** for redirect URLs (Intercom requires TLS/SSL)
- [ ] **State parameter** validated on every callback (prevents CSRF)
- [ ] **Client secret** kept server-side only (never exposed to browser)
- [ ] **Access token** stored in HTTP-only cookie or encrypted database (never in localStorage/sessionStorage)
- [ ] **API calls proxied** through your server (token never sent to the client)
- [ ] **Error handling** for denied authorization, invalid codes, and revoked tokens

## Local Development with ngrok

Since Intercom requires HTTPS redirect URLs, use ngrok for local development:

```bash
# Terminal 1: Start your app
pnpm dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000
```

Then update your Intercom app's redirect URL to the ngrok HTTPS URL.

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://app.intercom.com/oauth?client_id=...&state=...` | User authorization page |
| `POST https://api.intercom.io/auth/eagle/token` | Exchange code for token |
| `GET https://api.intercom.io/me` | Get authenticated admin info |

## Common Errors

**"OAuth is not configured"** in Developer Hub: Click the "Edit" button on the Authentication page to enable OAuth and add redirect URLs.

**Invalid state parameter**: The state cookie expired (10 minute TTL) or the user opened the OAuth flow in a different browser/session.

**Token exchange failed (400)**: The authorization code was already used, expired, or the client_id/client_secret are wrong.

**401 Unauthorized on API calls**: The token was revoked by the user. Clear the stored token and prompt re-authorization.

## Reference

- [Intercom OAuth Documentation](https://developers.intercom.com/docs/build-an-integration/learn-more/authentication/setting-up-oauth)
- [Intercom Authentication Overview](https://developers.intercom.com/docs/build-an-integration/learn-more/authentication)
- [Intercom API Reference](https://developers.intercom.com/docs/references/rest-api/api.intercom.io/Admins/admin/)
