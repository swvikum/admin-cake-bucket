import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const prevStart = searchParams.get("prevStart");
  const prevEnd = searchParams.get("prevEnd");

  if (!start || !end || !prevStart || !prevEnd) {
    return NextResponse.json({ error: "Missing date params" }, { status: 400 });
  }

  try {
    const [
      { data: salesThis },
      { data: salesPrev },
      { data: expensesThis },
      { data: expensesPrev },
      { count: ordersThis },
      { count: ordersPrev },
    ] = await Promise.all([
      // Sales this period: orders due in date range
      supabase
        .from("orders")
        .select("total")
        .gte("due_at", start)
        .lte("due_at", end)
        .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
      // Sales previous period
      supabase
        .from("orders")
        .select("total")
        .gte("due_at", prevStart)
        .lte("due_at", prevEnd)
        .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
      // Expenses this period
      supabase
        .from("expenses")
        .select("amount, tax")
        .gte("expense_date", start.slice(0, 10))
        .lte("expense_date", end.slice(0, 10)),
      // Expenses previous period
      supabase
        .from("expenses")
        .select("amount, tax")
        .gte("expense_date", prevStart.slice(0, 10))
        .lte("expense_date", prevEnd.slice(0, 10)),
      // Orders count this period
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("due_at", start)
        .lte("due_at", end)
        .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
      // Orders count previous period
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("due_at", prevStart)
        .lte("due_at", prevEnd)
        .in("status", ["confirmed", "in_progress", "ready", "delivered", "completed"]),
    ]);

    const sales = (salesThis ?? []).reduce((s, r) => s + Number(r.total), 0);
    const salesPrevVal = (salesPrev ?? []).reduce((s, r) => s + Number(r.total), 0);
    const expenses = (expensesThis ?? []).reduce((s, r) => s + Number(r.amount) + Number(r.tax), 0);
    const expensesPrevVal = (expensesPrev ?? []).reduce(
      (s, r) => s + Number(r.amount) + Number(r.tax),
      0
    );
    const profit = sales - expenses;
    const profitPrev = salesPrevVal - expensesPrevVal;

    return NextResponse.json({
      sales,
      salesPrev: salesPrevVal,
      expenses,
      expensesPrev: expensesPrevVal,
      profit,
      profitPrev,
      orders: ordersThis ?? 0,
      ordersPrev: ordersPrev ?? 0,
      monthLabel: new Date(start).toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
