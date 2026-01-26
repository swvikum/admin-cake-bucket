import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data;
}

/**
 * Returns a valid Google Calendar API access token.
 * Loads refresh_token from DB, refreshes if needed, and optionally persists new access_token.
 */
export async function getCalendarAccessToken(): Promise<string> {
  const supabase = createAdminClient();
  const { data: row, error } = await supabase
    .from("google_calendar_tokens")
    .select("id, refresh_token, access_token, expires_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Tokens load failed: ${error.message}`);
  if (!row?.refresh_token) {
    throw new Error("No Google Calendar tokens. Visit /api/auth/google once to connect.");
  }

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 min
  if (row.access_token && expiresAt > now + buffer) {
    return row.access_token;
  }

  const { access_token, expires_in } = await refreshAccessToken(row.refresh_token);
  const newExpires = new Date(now + expires_in * 1000).toISOString();

  if (row.id) {
    await supabase
      .from("google_calendar_tokens")
      .update({
        access_token,
        expires_at: newExpires,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }

  return access_token;
}
