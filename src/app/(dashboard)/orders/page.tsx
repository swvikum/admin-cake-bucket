import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OrdersFilter } from "./OrdersFilter";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_name, customer_phone, due_at, status, total, created_at")
    .order("due_at", { ascending: false });

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
      <OrdersFilter orders={orders ?? []} />
    </div>
  );
}
