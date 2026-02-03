"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";

type ItemRow = { item_name: string; quantity: number; unit_price: number; notes: string };
type Profile = { id: string; full_name: string | null };

export function OrderForm({
  orderId,
  initial,
  profiles,
  createdBy,
}: {
  orderId?: string;
  initial?: {
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    due_at: string;
    status: string;
    assigned_user_id: string;
    subtotal: number;
    discount: number;
    delivery_fee: number;
    total: number;
    deposit_paid: number;
    balance_due: number;
    notes: string;
    items: { item_name: string; quantity: number; unit_price: number; notes: string }[];
  };
  profiles: Profile[];
  createdBy: string;
}) {
  const isEdit = !!orderId;
  const router = useRouter();
  const { supabase, refreshSession } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customer_name, setCustomer_name] = useState(initial?.customer_name ?? "");
  const [customer_phone, setCustomer_phone] = useState(initial?.customer_phone ?? "");
  const [customer_email, setCustomer_email] = useState(initial?.customer_email ?? "");
  const [due_at, setDue_at] = useState(
    initial?.due_at ? initial.due_at.slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [assigned_user_id, setAssigned_user_id] = useState(initial?.assigned_user_id ?? "");
  const [discount, setDiscount] = useState(initial?.discount ?? 0);
  const [delivery_fee, setDelivery_fee] = useState(initial?.delivery_fee ?? 0);
  const [deposit_paid, setDeposit_paid] = useState(initial?.deposit_paid ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<ItemRow[]>(
    initial?.items?.length
      ? initial.items
      : [{ item_name: "", quantity: 1, unit_price: 0, notes: "" }]
  );

  function addItem() {
    setItems((prev) => [...prev, { item_name: "", quantity: 1, unit_price: 0, notes: "" }]);
  }
  function removeItem(i: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, f: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...f } : row)));
  }

  const subtotal = items.reduce((s, r) => s + r.quantity * r.unit_price, 0);
  const total = Math.max(0, subtotal - discount + delivery_fee);
  const balance_due = Math.max(0, total - deposit_paid);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Refresh session before save to ensure valid auth
      const sessionOk = await refreshSession();
      if (!sessionOk) return;

      if (isEdit && orderId) {
        const { error: upErr } = await supabase
          .from("orders")
          .update({
            customer_name,
            customer_phone: customer_phone || null,
            customer_email: customer_email || null,
            due_at: new Date(due_at).toISOString(),
            status,
            assigned_user_id: assigned_user_id || null,
            subtotal,
            discount,
            delivery_fee,
            total,
            deposit_paid,
            balance_due,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);
        if (upErr) throw upErr;
        await supabase.from("order_items").delete().eq("order_id", orderId);
        const validItems = items.filter((r) => r.item_name.trim());
        if (validItems.length) {
          const rows = validItems.map((r) => ({
            order_id: orderId,
            item_name: r.item_name,
            quantity: r.quantity,
            unit_price: r.unit_price,
            line_total: r.quantity * r.unit_price,
            notes: r.notes || null,
          }));
          const { error: insErr } = await supabase.from("order_items").insert(rows);
          if (insErr) throw insErr;
        }
        router.push(`/orders/${orderId}`);
      } else {
        const { data: newOrder, error: insOrderErr } = await supabase
          .from("orders")
          .insert({
            customer_name,
            customer_phone: customer_phone || null,
            customer_email: customer_email || null,
            due_at: new Date(due_at).toISOString(),
            status,
            assigned_user_id: assigned_user_id || null,
            subtotal,
            discount,
            delivery_fee,
            total,
            deposit_paid,
            balance_due,
            notes: notes || null,
            created_by: createdBy,
          })
          .select("id")
          .single();
        if (insOrderErr || !newOrder) throw insOrderErr ?? new Error("Create failed");
        const validItems = items.filter((r) => r.item_name.trim());
        if (validItems.length) {
          const rows = validItems.map((r) => ({
            order_id: newOrder.id,
            item_name: r.item_name,
            quantity: r.quantity,
            unit_price: r.unit_price,
            line_total: r.quantity * r.unit_price,
            notes: r.notes || null,
          }));
          const { error: insErr } = await supabase.from("order_items").insert(rows);
          if (insErr) throw insErr;
        }
        router.push(`/orders/${newOrder.id}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4 space-y-4">
        <h2 className="font-semibold text-[#723F3B]">Customer</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={customer_name}
              onChange={(e) => setCustomer_name(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={customer_phone}
              onChange={(e) => setCustomer_phone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={customer_email}
              onChange={(e) => setCustomer_email(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date & time *</label>
            <input
              type="datetime-local"
              value={due_at}
              onChange={(e) => setDue_at(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            >
              <option value="draft">Draft</option>
              <option value="pending_confirm">Pending confirm</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In progress</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to</label>
            <select
              value={assigned_user_id}
              onChange={(e) => setAssigned_user_id(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            >
              <option value="">—</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
        <h2 className="font-semibold text-[#723F3B] mb-3">Items</h2>
        {items.map((row, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-end mb-3 p-2 rounded bg-[#FFF8F0]/50">
            <input
              placeholder="Item name"
              value={row.item_name}
              onChange={(e) => updateItem(i, { item_name: e.target.value })}
              className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              min={1}
              placeholder="Qty"
              value={row.quantity || ""}
              onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
              className="w-18 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="Unit price"
              value={row.unit_price || ""}
              onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) || 0 })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              placeholder="Notes"
              value={row.notes}
              onChange={(e) => updateItem(i, { notes: e.target.value })}
              className="flex-1 min-w-[100px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="text-sm text-[#C2727C] hover:text-[#723F3B] font-medium"
        >
          + Add item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4 space-y-3">
        <h2 className="font-semibold text-[#723F3B]">Totals</h2>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Discount</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Delivery fee</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={delivery_fee}
              onChange={(e) => setDelivery_fee(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Deposit paid</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={deposit_paid}
              onChange={(e) => setDeposit_paid(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="flex justify-between font-semibold pt-2">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Balance due</span>
          <span>${balance_due.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg disabled:opacity-60"
        >
          {loading ? "Saving…" : isEdit ? "Update order" : "Create order"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-[#E5CBC9] text-[#723F3B] rounded-lg hover:bg-[#FFF8F0]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
