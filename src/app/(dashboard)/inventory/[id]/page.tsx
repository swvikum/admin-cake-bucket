import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MovementForm } from "./MovementForm";

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: item } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();
  if (!item) notFound();

  const { data: movements } = await supabase
    .from("inventory_movements")
    .select("*")
    .eq("item_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const low = Number(item.stock_on_hand) <= Number(item.reorder_point);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <Link
        href="/inventory"
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to inventory
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#723F3B]">{item.name}</h1>
        <Link
          href={`/inventory/${id}/edit`}
          className="px-4 py-2 border border-[#C2727C] text-[#723F3B] rounded-lg hover:bg-[#FFF8F0]"
        >
          Edit
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className={`rounded-xl border p-4 ${low ? "bg-red-50 border-red-200" : "bg-white border-[#E5CBC9]"}`}>
          <p className="text-sm text-gray-600">Stock on hand</p>
          <p className="text-2xl font-bold text-[#723F3B]">{Number(item.stock_on_hand)} {item.unit}</p>
          {low && <p className="text-sm text-red-600 mt-1">Below reorder point ({item.reorder_point})</p>}
        </div>
        <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
          <p className="text-sm text-gray-600">Reorder point</p>
          <p className="text-xl font-semibold">{Number(item.reorder_point)} {item.unit}</p>
          <p className="text-sm text-gray-500 mt-2">Cost/unit: ${Number(item.cost_per_unit).toFixed(4)}</p>
          {item.supplier_name && <p className="text-sm text-gray-500">Supplier: {item.supplier_name}</p>}
        </div>
      </div>
      {item.note && (
        <div className="bg-white rounded-xl border border-[#E5CBC9] p-4 mb-6">
          <p className="text-sm text-gray-600">Note</p>
          <p className="text-gray-700">{item.note}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4 mb-6">
        <h2 className="font-semibold text-[#723F3B] mb-3">Record movement</h2>
        <MovementForm itemId={id} itemUnit={item.unit} currentStock={Number(item.stock_on_hand)} createdBy={user?.id ?? null} />
      </div>

      <div className="bg-white rounded-xl border border-[#E5CBC9] overflow-hidden">
        <h2 className="font-semibold text-[#723F3B] px-4 py-3 border-b border-[#E5CBC9]">
          Movement history
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FFF8F0] text-left">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Quantity</th>
                <th className="px-4 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {(movements ?? []).map((m) => (
                <tr key={m.id} className="border-t border-[#E5CBC9]">
                  <td className="px-4 py-2">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 capitalize">{m.movement_type}</td>
                  <td className="px-4 py-2">
                    <span className={Number(m.quantity) >= 0 ? "text-green-600" : "text-red-600"}>
                      {Number(m.quantity) >= 0 ? "+" : ""}{m.quantity} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{m.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!movements || movements.length === 0) && (
          <p className="px-4 py-6 text-gray-500 text-center">No movements yet.</p>
        )}
      </div>
    </div>
  );
}
