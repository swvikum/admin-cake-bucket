import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "../ExpenseForm";

const CATEGORIES = [
  "ingredients",
  "packaging",
  "equipment",
  "ads",
  "utilities",
  "other",
];

export default async function NewExpensePage() {
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
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <Link
        href="/expenses"
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to expenses
      </Link>
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">New expense</h1>
      <ExpenseForm categories={CATEGORIES} createdBy={user.id} />
    </div>
  );
}
