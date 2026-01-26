import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrderForm } from "../OrderForm";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <Link
        href="/orders"
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to orders
      </Link>
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">New order</h1>
      <OrderForm profiles={profiles ?? []} createdBy={user.id} />
    </div>
  );
}
