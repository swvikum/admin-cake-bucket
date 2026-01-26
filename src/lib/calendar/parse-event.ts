/**
 * Parses a Google Calendar event into order + order_items shape.
 * Expects event summary like "Customer Name - Cake Type - YYYY-MM-DD" and
 * description with line-based "Label: value" or "Label : value" fields.
 */

export type ParsedOrder = {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  due_at: string;
  status: "draft" | "pending_confirm" | "confirmed";
  notes: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  deposit_paid: number;
  balance_due: number;
};

export type ParsedOrderItem = {
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
};

const LABEL_MAP: Record<string, (v: string, o: ParsedOrder, items: ParsedOrderItem[]) => void> = {
  "customer name": (v, o) => { o.customer_name = v.trim() || o.customer_name; },
  "phone number": (v, o) => { o.customer_phone = v.trim() || null; },
  "phone": (v, o) => { o.customer_phone = v.trim() || (o.customer_phone ?? null); },
  "email": (v, o) => { o.customer_email = v.trim() || null; },
  "customer email": (v, o) => { o.customer_email = v.trim() || null; },
  "event date": (v, o) => {
    const d = parseDate(v.trim());
    if (d) o.due_at = d;
  },
  "request summary": (v, o, items) => {
    const s = v.trim();
    if (s && items.length === 0) {
      items.push({ item_name: s.slice(0, 200), quantity: 1, unit_price: 0, line_total: 0, notes: s.length > 200 ? s : null });
    } else if (s && items.length > 0) {
      items[0].item_name = s.slice(0, 200);
      items[0].notes = s;
    }
  },
  "cake type": (v, o, items) => {
    const s = v.trim();
    if (s) {
      if (items.length === 0) items.push({ item_name: s, quantity: 1, unit_price: 0, line_total: 0, notes: null });
      else items[0].item_name = s;
    }
  },
  "delivery required": (v, o) => { appendNote(o, `Delivery: ${v.trim()}`); },
  "delivery address": (v, o) => { appendNote(o, `Address: ${v.trim()}`); },
  "special notes": (v, o) => { appendNote(o, `Notes: ${v.trim()}`); },
  "notes": (v, o) => { appendNote(o, v.trim()); },
};

function appendNote(o: ParsedOrder, line: string): void {
  if (!line) return;
  o.notes = o.notes ? `${o.notes}\n${line}` : line;
}

function parseDate(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Parse "Label: value" or "Label : value" lines from description */
function parseDescription(desc: string, order: ParsedOrder, items: ParsedOrderItem[]): void {
  if (!desc || typeof desc !== "string") return;
  const lines = desc.split(/\r?\n/);
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const label = line.slice(0, colon).toLowerCase().trim();
    const value = line.slice(colon + 1).trim();
    const fn = LABEL_MAP[label];
    if (fn) fn(value, order, items);
  }
}

/** Parse title e.g. "Rylee Johnson - Birthday Cake - 2026-01-31" */
function parseSummary(summary: string, order: ParsedOrder, items: ParsedOrderItem[]): void {
  if (!summary || typeof summary !== "string") return;
  const parts = summary.split(/-/).map((p) => p.trim());
  if (parts.length >= 1 && !order.customer_name) order.customer_name = parts[0];
  if (parts.length >= 2 && items.length === 0) {
    items.push({ item_name: parts[1], quantity: 1, unit_price: 0, line_total: 0, notes: null });
  } else if (parts.length >= 2 && items[0]) {
    items[0].item_name = parts[1];
  }
  if (parts.length >= 3) {
    const d = parseDate(parts[2]);
    if (d && !order.due_at) order.due_at = d;
  }
}

export type GoogleCalendarEvent = {
  id: string;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string; date?: string } | null;
  end?: { dateTime?: string; date?: string } | null;
};

export type ParseResult = {
  order: ParsedOrder;
  items: ParsedOrderItem[];
  skip: boolean;
};

const DEFAULT_ORDER: ParsedOrder = {
  customer_name: "",
  customer_phone: null,
  customer_email: null,
  due_at: new Date().toISOString(),
  status: "confirmed",
  notes: null,
  subtotal: 0,
  discount: 0,
  delivery_fee: 0,
  total: 0,
  deposit_paid: 0,
  balance_due: 0,
};

/**
 * Turn one Google Calendar event into one order + order_items.
 * Returns skip: true if we don't have at least customer_name and due_at.
 */
export function parseCalendarEvent(event: GoogleCalendarEvent): ParseResult {
  const order: ParsedOrder = { ...DEFAULT_ORDER };
  const items: ParsedOrderItem[] = [];

  const raw = event.start?.dateTime ?? event.start?.date;
  if (raw) order.due_at = new Date(raw).toISOString();

  parseSummary(event.summary ?? "", order, items);
  parseDescription(event.description ?? "", order, items);

  const skip = !order.customer_name || !order.due_at;
  if (items.length === 0 && !skip) {
    items.push({
      item_name: event.summary?.split(/-/).map((p) => p.trim())[1] ?? "Cake order",
      quantity: 1,
      unit_price: 0,
      line_total: 0,
      notes: order.notes,
    });
  }

  return { order, items, skip };
}
