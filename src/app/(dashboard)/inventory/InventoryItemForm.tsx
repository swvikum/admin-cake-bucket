"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  if (typeof err === "string") return err;
  return "Something went wrong";
}

type Props = {
  itemId?: string;
  initial?: {
    name: string;
    unit: string;
    stock_on_hand: number;
    reorder_point: number;
    cost_per_unit: number;
    supplier_name: string;
    note: string;
    is_active: boolean;
  };
};

export function InventoryItemForm({ itemId, initial }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "pcs");
  const [stock_on_hand, setStock_on_hand] = useState(initial?.stock_on_hand ?? 0);
  const [reorder_point, setReorder_point] = useState(initial?.reorder_point ?? 0);
  const [cost_per_unit, setCost_per_unit] = useState(initial?.cost_per_unit ?? 0);
  const [supplier_name, setSupplier_name] = useState(initial?.supplier_name ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [is_active, setIs_active] = useState(initial?.is_active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (itemId) {
        const { error: err } = await supabase
          .from("inventory_items")
          .update({
            name,
            unit,
            stock_on_hand,
            reorder_point,
            cost_per_unit,
            supplier_name: supplier_name || null,
            note: note || null,
            is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);
        if (err) throw err;
        router.refresh();
        router.push(`/inventory/${itemId}`);
      } else {
        const { data, error: err } = await supabase
          .from("inventory_items")
          .insert({
            name,
            unit,
            stock_on_hand,
            reorder_point,
            cost_per_unit,
            supplier_name: supplier_name || null,
            note: note || null,
            is_active,
          })
          .select("id")
          .single();
        if (err) throw err;
        if (!data?.id) throw new Error("Server did not return the new item id.");
        router.refresh();
        router.push(`/inventory/${data.id}`);
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            >
              <option value="pcs">pcs</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock on hand *</label>
            <input
              type="number"
              min={0}
              step="any"
              value={stock_on_hand}
              onChange={(e) => setStock_on_hand(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder point *</label>
            <input
              type="number"
              min={0}
              step="any"
              value={reorder_point}
              onChange={(e) => setReorder_point(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost per unit</label>
            <input
              type="number"
              min={0}
              step="0.0001"
              value={cost_per_unit}
              onChange={(e) => setCost_per_unit(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <input
            type="text"
            value={supplier_name}
            onChange={(e) => setSupplier_name(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        {itemId && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={is_active}
              onChange={(e) => setIs_active(e.target.checked)}
              className="rounded border-gray-300 text-[#C2727C] focus:ring-[#D7A1B4]"
            />
            <span className="text-sm">Active</span>
          </label>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg disabled:opacity-60"
        >
          {loading ? "Saving…" : itemId ? "Update" : "Create"}
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
