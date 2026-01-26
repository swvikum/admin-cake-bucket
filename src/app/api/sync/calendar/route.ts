import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCalendarAccessToken } from "@/lib/calendar/get-oauth-client";
import { parseCalendarEvent, type GoogleCalendarEvent } from "@/lib/calendar/parse-event";

const CRON_SECRET = process.env.CALENDAR_SYNC_CRON_SECRET;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

function authOk(request: Request): boolean {
  if (!CRON_SECRET) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === CRON_SECRET;
  const header = request.headers.get("x-cron-secret");
  return header === CRON_SECRET;
}

async function fetchCalendarEventsWithOAuth(
  calendarId: string,
  accessToken: string,
  daysBack: number,
  daysAhead: number
): Promise<GoogleCalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - daysBack);
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + daysAhead);

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };
  return (data.items ?? []) as GoogleCalendarEvent[];
}

export async function POST(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const daysBack = Number(body.daysBack) || 30;
  const daysAhead = Number(body.daysAhead) || 365;

  try {
    const accessToken = await getCalendarAccessToken();
    const events = await fetchCalendarEventsWithOAuth(
      GOOGLE_CALENDAR_ID,
      accessToken,
      daysBack,
      daysAhead
    );

    const supabase = createAdminClient();
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const event of events) {
      const existing = await supabase
        .from("orders")
        .select("id")
        .eq("source_calendar_event_id", event.id)
        .maybeSingle();

      if (existing.data?.id) {
        skipped++;
        continue;
      }

      const { order: parsed, items, skip } = parseCalendarEvent(event);
      if (skip) {
        skipped++;
        continue;
      }

      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_name: parsed.customer_name,
          customer_phone: parsed.customer_phone,
          customer_email: parsed.customer_email,
          due_at: parsed.due_at,
          status: parsed.status,
          assigned_user_id: null,
          subtotal: parsed.subtotal,
          discount: parsed.discount,
          delivery_fee: parsed.delivery_fee,
          total: parsed.total,
          deposit_paid: parsed.deposit_paid,
          balance_due: parsed.balance_due,
          notes: parsed.notes,
          created_by: null,
          source_calendar_event_id: event.id,
        })
        .select("id")
        .single();

      if (orderErr) {
        errors.push(`Event ${event.id}: ${orderErr.message}`);
        continue;
      }
      if (!newOrder?.id) {
        errors.push(`Event ${event.id}: no id returned`);
        continue;
      }

      if (items.length) {
        const rows = items.map((i) => ({
          order_id: newOrder.id,
          item_name: i.item_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          line_total: i.line_total,
          notes: i.notes,
        }));
        const { error: itemsErr } = await supabase.from("order_items").insert(rows);
        if (itemsErr) errors.push(`Event ${event.id} items: ${itemsErr.message}`);
      }
      created++;
    }

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      totalEvents: events.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    const status = message.includes("No Google Calendar tokens") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
