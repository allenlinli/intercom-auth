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
    cookieStore.delete("intercom_token");
    return NextResponse.json({ error: "Token invalid or revoked" }, { status: 401 });
  }
}
