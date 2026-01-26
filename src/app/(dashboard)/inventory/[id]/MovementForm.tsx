"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MovementType } from "@/types/database";

export function MovementForm({
  itemId,
  itemUnit,
  currentStock,
  createdBy,
}: {
  itemId: string;
  itemUnit: string;
  currentStock: number;
  createdBy: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [movement_type, setMovement_type] = useState<MovementType>("purchase");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");

  // quantity: positive = add, negative = subtract. "purchase" typically adds, "usage" subtracts, "adjustment" can be ±
  const effectiveQty =
    movement_type === "usage" ? -Math.abs(quantity) : movement_type === "purchase" ? Math.abs(quantity) : quantity;
  const newStock = currentStock + effectiveQty;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (effectiveQty === 0) return;
    setLoading(true);
    try {
      const { error: movErr } = await supabase.from("inventory_movements").insert({
        item_id: itemId,
        movement_type,
        quantity: effectiveQty,
        reason: reason || null,
        ref_order_id: null,
        created_by: createdBy,
      });
      if (movErr) throw movErr;
      const { error: upErr } = await supabase
        .from("inventory_items")
        .update({ stock_on_hand: newStock, updated_at: new Date().toISOString() })
        .eq("id", itemId);
      if (upErr) throw upErr;
      setQuantity(0);
      setReason("");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Type</label>
        <select
          value={movement_type}
          onChange={(e) => setMovement_type(e.target.value as MovementType)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="purchase">Purchase (in)</option>
          <option value="usage">Usage (out)</option>
          <option value="adjustment">Adjustment (±)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Quantity ({movement_type === "adjustment" ? "+ or -" : movement_type === "usage" ? "out" : "in"})
        </label>
        <input
          type="number"
          step="any"
          value={quantity || ""}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <span className="ml-1 text-sm text-gray-500">{itemUnit}</span>
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs text-gray-600 mb-1">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div className="text-sm text-gray-500">
        New stock: <strong>{newStock} {itemUnit}</strong>
      </div>
      <button
        type="submit"
        disabled={loading || effectiveQty === 0 || (movement_type === "usage" && Math.abs(quantity) > currentStock)}
        className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white text-sm font-medium rounded-lg disabled:opacity-50"
      >
        {loading ? "Saving…" : "Record"}
      </button>
    </form>
  );
}
