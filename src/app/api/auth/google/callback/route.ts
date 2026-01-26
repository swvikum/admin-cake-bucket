import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const errorParam = request.nextUrl.searchParams.get("error");
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/dashboard?calendar_auth=denied&error=${encodeURIComponent(errorParam)}`, request.url)
    );
  }
  if (!code || !redirectUri || !clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard?calendar_auth=missing_config", request.url)
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.redirect(
      new URL(`/dashboard?calendar_auth=token_failed&message=${encodeURIComponent(err.slice(0, 100))}`, request.url)
    );
  }

  const data = (await tokenRes.json()) as {
    refresh_token?: string;
    access_token?: string;
    expires_in?: number;
  };

  const refreshToken = data.refresh_token;
  if (!refreshToken) {
    return NextResponse.redirect(
      new URL("/dashboard?calendar_auth=no_refresh_token", request.url)
    );
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("google_calendar_tokens")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("google_calendar_tokens")
      .update({
        refresh_token: refreshToken,
        access_token: data.access_token ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("google_calendar_tokens").insert({
      refresh_token: refreshToken,
      access_token: data.access_token ?? null,
      expires_at: expiresAt,
    });
  }

  const base = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/dashboard?calendar_auth=ok", base));
}
