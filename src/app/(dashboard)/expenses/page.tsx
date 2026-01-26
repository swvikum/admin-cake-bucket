import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ExpensesPage() {
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

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, expense_date, supplier_name, category, description, amount, tax")
    .order("expense_date", { ascending: false });

  const total = (expenses ?? []).reduce((s, e) => s + Number(e.amount) + Number(e.tax), 0);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#723F3B]">Expenses</h1>
        <Link
          href="/expenses/new"
          className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg transition"
        >
          New expense
        </Link>
      </div>
      <div className="mb-4 p-4 bg-white rounded-xl border border-[#E5CBC9] inline-block">
        <span className="text-sm text-gray-600">Total (all time): </span>
        <span className="font-bold text-[#723F3B]">${total.toFixed(2)}</span>
      </div>
      <div className="bg-white rounded-xl border border-[#E5CBC9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FFF8F0] text-left">
                <th className="px-4 py-3 font-medium text-[#723F3B]">Date</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Category</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Supplier</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Description</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Amount</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(expenses ?? []).map((e) => (
                <tr key={e.id} className="border-t border-[#E5CBC9] hover:bg-[#FFF8F0]/50">
                  <td className="px-4 py-3">{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">{e.supplier_name ?? "—"}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{e.description ?? "—"}</td>
                  <td className="px-4 py-3">${(Number(e.amount) + Number(e.tax)).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/expenses/${e.id}/edit`}
                      className="text-[#C2727C] hover:text-[#723F3B] font-medium"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!expenses || expenses.length === 0) && (
          <p className="px-4 py-8 text-gray-500 text-center">No expenses yet.</p>
        )}
      </div>
    </div>
  );
}
