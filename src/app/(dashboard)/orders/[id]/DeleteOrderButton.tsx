"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/use-supabase";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { supabase, refreshSession } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      // Refresh session before delete to ensure valid auth
      const sessionOk = await refreshSession();
      if (!sessionOk) return;

      // Delete order_items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error deleting order items:", itemsError);
        alert("Failed to delete order items: " + itemsError.message);
        setLoading(false);
        return;
      }

      // Delete the order
      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderError) {
        console.error("Error deleting order:", orderError);
        alert("Failed to delete order: " + orderError.message);
        setLoading(false);
        return;
      }

      // Redirect to orders list
      router.push("/orders");
      router.refresh();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete order");
      setLoading(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600 font-medium">Delete this order?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg border border-red-300 transition"
    >
      Delete order
    </button>
  );
}
