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

export async function getMe(
  accessToken: string
): Promise<Record<string, unknown>> {
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
