/**
 * Parses a Google Calendar event into order + order_items shape.
 * 
 * Simplified mapping:
 * - summary (title): "Customer Name - Cake Type" → customer_name + item_name
 * - start.dateTime: Event start time → due_at
 * - description: Saved directly to order.notes (no parsing)
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

  // Use start.dateTime directly for due_at
  const startTime = event.start?.dateTime ?? event.start?.date;
  if (startTime) {
    order.due_at = new Date(startTime).toISOString();
  }

  // Parse summary: "Customer Name - Cake Type" or just "Customer Name"
  const summary = event.summary?.trim() ?? "";
  if (summary) {
    const dashIndex = summary.indexOf("-");
    
    if (dashIndex === -1) {
      // No dash: entire title is customer name
      order.customer_name = summary;
      items.push({
        item_name: "Cake order",
        quantity: 1,
        unit_price: 0,
        line_total: 0,
        notes: null,
      });
    } else {
      // Has dash: split into customer name and item name
      order.customer_name = summary.slice(0, dashIndex).trim();
      const itemName = summary.slice(dashIndex + 1).trim() || "Cake order";
      items.push({
        item_name: itemName,
        quantity: 1,
        unit_price: 0,
        line_total: 0,
        notes: null,
      });
    }
  }

  // Save entire description directly to notes (no parsing)
  const description = event.description?.trim();
  if (description) {
    order.notes = description;
  }

  // Skip if missing customer_name or due_at
  const skip = !order.customer_name || !order.due_at;

  return { order, items, skip };
}
