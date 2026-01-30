import { createClient } from "@/lib/supabase/server";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { SydneyClock } from "@/components/SydneyClock";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  // Week: Monday to Sunday (ISO week)
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1, so offset = 1 - dayOfWeek
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const weekStart = startOfWeek.toISOString();
  const weekEnd = endOfWeek.toISOString();
  const monthStart = startOfMonth.toISOString();
  const monthEnd = endOfMonth.toISOString();

  const [
    { data: orders },
    { data: salesWeek },
    { data: salesMonth },
    { count: confirmedCount },
    { count: completedCount },
    { count: upcomingCount },
    { data: invItems },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, customer_name, status, total, due_at")
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"])
      .order("due_at", { ascending: true })
      .limit(10),
    // This week: orders due this week (Monday to Sunday)
    supabase
      .from("orders")
      .select("total")
      .gte("due_at", weekStart)
      .lt("due_at", weekEnd)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
    // This month: orders due this month
    supabase
      .from("orders")
      .select("total")
      .gte("due_at", monthStart)
      .lt("due_at", monthEnd)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#723F3B]">Dashboard</h1>
          <DashboardGreeting />
        </div>
        <SydneyClock />
      </div>
      <DashboardMetrics
        weekSales={weekSales}
        monthSales={monthSales}
        confirmedCount={confirmedCount ?? 0}
        completedCount={completedCount ?? 0}
        upcomingCount={upcomingCount ?? 0}
        lowStockCount={lowStockCount}
        orders={orders ?? []}
      />
    </div>
  );
}
