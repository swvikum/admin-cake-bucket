import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryItemForm } from "../../InventoryItemForm";

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();
  if (!item) notFound();

  const initial = {
    name: item.name,
    unit: item.unit,
    stock_on_hand: Number(item.stock_on_hand),
    reorder_point: Number(item.reorder_point),
    cost_per_unit: Number(item.cost_per_unit),
    supplier_name: item.supplier_name ?? "",
    note: item.note ?? "",
    is_active: item.is_active,
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <Link
        href={`/inventory/${id}`}
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to item
      </Link>
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">Edit {item.name}</h1>
      <InventoryItemForm itemId={id} initial={initial} />
    </div>
  );
}
