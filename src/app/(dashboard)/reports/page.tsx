import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportSummary } from "./ReportSummary";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "manager") redirect("/dashboard");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStart = startOfMonth.toISOString();
  const prevMonthStart = startOfPrevMonth.toISOString();

  const [
    { data: salesThisMonth },
    { data: salesPrevMonth },
    { data: expensesThisMonth },
    { data: expensesPrevMonth },
    orderCountThisMonth,
    orderCountPrevMonth,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", monthStart)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", prevMonthStart)
      .lt("created_at", monthStart)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
    supabase.from("expenses").select("amount, tax").gte("expense_date", startOfMonth.toISOString().slice(0, 10)),
    supabase
      .from("expenses")
      .select("amount, tax")
      .gte("expense_date", startOfPrevMonth.toISOString().slice(0, 10))
      .lt("expense_date", startOfMonth.toISOString().slice(0, 10)),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]).then((r) => r.count ?? 0),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", prevMonthStart)
      .lt("created_at", monthStart)
      .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]).then((r) => r.count ?? 0),
  ]);

  const salesThis = (salesThisMonth ?? []).reduce((s, r) => s + Number(r.total), 0);
  const salesPrev = (salesPrevMonth ?? []).reduce((s, r) => s + Number(r.total), 0);
  const expThis = (expensesThisMonth ?? []).reduce((s, r) => s + Number(r.amount) + Number(r.tax), 0);
  const expPrev = (expensesPrevMonth ?? []).reduce((s, r) => s + Number(r.amount) + Number(r.tax), 0);
  const profitThis = salesThis - expThis;
  const profitPrev = salesPrev - expPrev;
  const salesChange = salesPrev ? ((salesThis - salesPrev) / salesPrev) * 100 : 0;
  const expChange = expPrev ? ((expThis - expPrev) / expPrev) * 100 : 0;
  const profitChange = profitPrev !== 0 ? ((profitThis - profitPrev) / Math.abs(profitPrev)) * 100 : 0;

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">Reports</h1>
      <ReportSummary
        salesThisMonth={salesThis}
        salesPrevMonth={salesPrev}
        expensesThisMonth={expThis}
        expensesPrevMonth={expPrev}
        profitThisMonth={profitThis}
        profitPrevMonth={profitPrev}
        orderCountThisMonth={orderCountThisMonth}
        orderCountPrevMonth={orderCountPrevMonth}
        salesChangePercent={salesChange}
        expensesChangePercent={expChange}
        profitChangePercent={profitChange}
        monthLabel={startOfMonth.toLocaleString("default", { month: "long", year: "numeric" })}
      />
    </div>
  );
}
