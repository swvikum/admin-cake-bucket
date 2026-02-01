"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/types/database";

const STATUSES: OrderStatus[] = [
  "draft",
  "pending_confirm",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "completed",
  "cancelled",
];

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as OrderStatus;
    setStatus(v);
    setLoading(true);
    await supabase.from("orders").update({ status: v, updated_at: new Date().toISOString() }).eq("id", orderId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="status" className="text-sm font-medium text-gray-600">
        Status
      </label>
      <select
        id="status"
        value={status}
        onChange={handleChange}
        disabled={loading}
        className="rounded-lg border border-[#E5CBC9] bg-white px-3 py-1.5 text-sm text-[#723F3B] focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
