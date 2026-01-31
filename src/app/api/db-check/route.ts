/**
 * Database diagnostic endpoint. Helps identify if slowness or empty data
 * is due to DB/RLS/network. Call with: Authorization: Bearer CALENDAR_SYNC_CRON_SECRET
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const CRON_SECRET = process.env.CALENDAR_SYNC_CRON_SECRET;

function authOk(request: Request): boolean {
  if (!CRON_SECRET) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7) === CRON_SECRET;
  return request.headers.get("x-cron-secret") === CRON_SECRET;
}

export async function GET(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  // 1. Auth check
  const authStart = Date.now();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  results.auth = {
    ms: Date.now() - authStart,
    hasUser: !!user,
    userId: user?.id ?? null,
    error: authErr?.message ?? null,
  };

  // 2. Orders count (what the app would see under RLS)
  const ordersStart = Date.now();
  const { data: orders, count, error: ordersErr } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .limit(1);
  results.orders = {
    ms: Date.now() - ordersStart,
    count: count ?? 0,
    error: ordersErr?.message ?? null,
  };

  // 3. Inventory count
  const invStart = Date.now();
  const { count: invCount, error: invErr } = await supabase
    .from("inventory_items")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  results.inventory_items = {
    ms: Date.now() - invStart,
    count: invCount ?? 0,
    error: invErr?.message ?? null,
  };

  // 4. Profiles check (RLS often depends on this)
  const profStart = Date.now();
  const { data: profile, error: profErr } = user
    ? await supabase.from("profiles").select("id, role").eq("id", user.id).single()
    : { data: null, error: { message: "no user" } };
  results.profile = {
    ms: Date.now() - profStart,
    hasProfile: !!profile,
    role: profile?.role ?? null,
    error: profErr?.message ?? null,
  };

  const totalMs = (results.auth as { ms: number }).ms + (results.orders as { ms: number }).ms +
    (results.inventory_items as { ms: number }).ms + (results.profile as { ms: number }).ms;

  return NextResponse.json({
    ok: true,
    totalMs,
    results,
    suggestion:
      !user
        ? "No session – login may be failing or session expired"
        : !profile
          ? "User has no profile – RLS may block orders/inventory. Add row to profiles."
          : (results.orders as { error: string | null }).error
            ? "Orders query error – check RLS policies on orders table"
            : (results.orders as { count: number }).count === 0 && (results.inventory_items as { count: number }).count === 0
              ? "Both orders and inventory empty – could be RLS or no data"
              : totalMs > 3000
                ? "Queries are slow (>3s total) – check Supabase region, indexes, or connection"
                : "DB looks OK",
  });
}
