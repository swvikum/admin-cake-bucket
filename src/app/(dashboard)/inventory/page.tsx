import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, unit, stock_on_hand, reorder_point, cost_per_unit, is_active")
    .order("name");

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#723F3B]">Inventory</h1>
        <Link
          href="/inventory/new"
          className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg transition"
        >
          New item
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-[#E5CBC9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FFF8F0] text-left">
                <th className="px-4 py-3 font-medium text-[#723F3B]">Name</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Unit</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Stock</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Reorder at</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Cost/unit</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Status</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((i) => {
                const low = Number(i.stock_on_hand) <= Number(i.reorder_point);
                return (
                  <tr
                    key={i.id}
                    className={`border-t border-[#E5CBC9] hover:bg-[#FFF8F0]/50 ${
                      low ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3">{i.unit}</td>
                    <td className="px-4 py-3">{Number(i.stock_on_hand)}</td>
                    <td className="px-4 py-3">{Number(i.reorder_point)}</td>
                    <td className="px-4 py-3">${Number(i.cost_per_unit).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {i.is_active ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-500">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Link
                        href={`/inventory/${i.id}`}
                        className="text-[#C2727C] hover:text-[#723F3B] font-medium"
                      >
                        View
                      </Link>
                      <Link
                        href={`/inventory/${i.id}/edit`}
                        className="text-gray-500 hover:text-[#723F3B]"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!items || items.length === 0) && (
          <p className="px-4 py-8 text-gray-500 text-center">No inventory items yet.</p>
        )}
      </div>
    </div>
  );
}
