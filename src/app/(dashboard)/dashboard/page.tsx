import { createClient } from "@/lib/supabase/server";
import { DashboardMetrics } from "@/components/DashboardMetrics";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekStart = startOfWeek.toISOString();
  const monthStart = startOfMonth.toISOString();

  const [
    { data: orders },
    { data: salesWeek },
    { data: salesMonth },
    { count: confirmedCount },
    { count: upcomingCount },
    { data: invItems },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, customer_name, status, total, due_at")
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"])
      .order("due_at", { ascending: true })
      .limit(10),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", weekStart)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", monthStart)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("due_at", now.toISOString())
      .in("status", ["confirmed", "in_progress", "pending_confirm"]),
    supabase.from("inventory_items").select("id, stock_on_hand, reorder_point").eq("is_active", true),
  ]);
  const lowStockCount =
    (invItems ?? []).filter((i) => Number(i.stock_on_hand) <= Number(i.reorder_point)).length;

  const weekSales = (salesWeek ?? []).reduce((s, r) => s + Number(r.total), 0);
  const monthSales = (salesMonth ?? []).reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">Dashboard</h1>
      <DashboardMetrics
        weekSales={weekSales}
        monthSales={monthSales}
        confirmedCount={confirmedCount ?? 0}
        upcomingCount={upcomingCount ?? 0}
        lowStockCount={lowStockCount}
        orders={orders ?? []}
      />
    </div>
  );
}
