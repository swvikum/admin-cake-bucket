"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  expenseId?: string;
  initial?: {
    expense_date: string;
    supplier_name: string;
    category: string;
    description: string;
    amount: number;
    tax: number;
  };
  categories: string[];
  createdBy: string;
};

export function ExpenseForm({
  expenseId,
  initial,
  categories,
  createdBy,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expense_date, setExpense_date] = useState(
    initial?.expense_date ?? new Date().toISOString().slice(0, 10)
  );
  const [supplier_name, setSupplier_name] = useState(initial?.supplier_name ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [tax, setTax] = useState(initial?.tax ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (expenseId) {
        const { error: err } = await supabase
          .from("expenses")
          .update({
            expense_date,
            supplier_name: supplier_name || null,
            category,
            description: description || null,
            amount,
            tax,
          })
          .eq("id", expenseId);
        if (err) throw err;
        router.push("/expenses");
      } else {
        const { error: err } = await supabase.from("expenses").insert({
          expense_date,
          supplier_name: supplier_name || null,
          category,
          description: description || null,
          amount,
          tax,
          created_by: createdBy,
        });
        if (err) throw err;
        router.push("/expenses");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={expense_date}
              onChange={(e) => setExpense_date(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={tax || ""}
              onChange={(e) => setTax(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg disabled:opacity-60"
        >
          {loading ? "Saving…" : expenseId ? "Update" : "Create"}
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
