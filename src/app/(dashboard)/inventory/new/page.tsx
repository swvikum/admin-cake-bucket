import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryItemForm } from "../InventoryItemForm";

export default async function NewInventoryItemPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <Link
        href="/inventory"
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to inventory
      </Link>
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">New inventory item</h1>
      <InventoryItemForm />
    </div>
  );
}
