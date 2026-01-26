import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "../../ExpenseForm";

const CATEGORIES = [
  "ingredients",
  "packaging",
  "equipment",
  "ads",
  "utilities",
  "other",
];

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: expense } = await supabase.from("expenses").select("*").eq("id", id).single();
  if (!expense) notFound();

  const initial = {
    expense_date: expense.expense_date,
    supplier_name: expense.supplier_name ?? "",
    category: expense.category,
    description: expense.description ?? "",
    amount: Number(expense.amount),
    tax: Number(expense.tax),
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <Link
        href="/expenses"
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to expenses
      </Link>
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">Edit expense</h1>
      <ExpenseForm
        expenseId={id}
        initial={initial}
        categories={CATEGORIES}
        createdBy={user.id}
      />
    </div>
  );
}
