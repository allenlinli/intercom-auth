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

  cookieStore.delete("intercom_oauth_state");

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${appUrl}?error=${encodeURIComponent("Invalid state parameter")}`
    );
  }

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
