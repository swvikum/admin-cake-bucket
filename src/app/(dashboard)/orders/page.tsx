import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_phone, due_at, status, total, created_at")
    .order("due_at", { ascending: true });

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[#723F3B] mb-4">Orders</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Database error loading orders</p>
          <p className="text-sm mt-1">{error.message}</p>
          <p className="text-xs mt-2 text-red-600">Check RLS policies on orders table or run /api/db-check for diagnostics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#723F3B]">Orders</h1>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg transition"
        >
          New order
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-[#E5CBC9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FFF8F0] text-left">
                <th className="px-4 py-3 font-medium text-[#723F3B]">Customer</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Due</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Status</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Total</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o.id} className="border-t border-[#E5CBC9] hover:bg-[#FFF8F0]/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer_name}</div>
                    {o.customer_phone && (
                      <div className="text-gray-500 text-xs">{o.customer_phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{new Date(o.due_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUSES.indexOf(o.status as OrderStatus) >= STATUSES.indexOf("confirmed")
                          ? "bg-[#D7A1B4]/30 text-[#723F3B]"
                          : o.status === "cancelled"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-[#E5CBC9] text-[#723F3B]"
                      }`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">${Number(o.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="text-[#C2727C] hover:text-[#723F3B] font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!orders || orders.length === 0) && (
          <p className="px-4 py-8 text-gray-500 text-center">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
