import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusForm } from "./OrderStatusForm";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <Link
        href="/orders"
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#723F3B]">
          Order · {order.customer_name}
        </h1>
        <OrderStatusForm orderId={id} currentStatus={order.status} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
          <h2 className="font-semibold text-[#723F3B] mb-2">Customer</h2>
          <p>{order.customer_name}</p>
          {order.customer_phone && <p className="text-gray-600">{order.customer_phone}</p>}
          {order.customer_email && <p className="text-gray-600">{order.customer_email}</p>}
          <p className="mt-2 text-sm text-gray-500">
            Due: {new Date(order.due_at).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
          <h2 className="font-semibold text-[#723F3B] mb-2">Totals</h2>
          <div className="space-y-1 text-sm">
            <p>Subtotal: ${Number(order.subtotal).toFixed(2)}</p>
            {Number(order.discount) > 0 && (
              <p>Discount: -${Number(order.discount).toFixed(2)}</p>
            )}
            {Number(order.delivery_fee) > 0 && (
              <p>Delivery: ${Number(order.delivery_fee).toFixed(2)}</p>
            )}
            <p className="font-semibold pt-2">Total: ${Number(order.total).toFixed(2)}</p>
            <p>Deposit: ${Number(order.deposit_paid).toFixed(2)}</p>
            <p>Balance: ${Number(order.balance_due).toFixed(2)}</p>
          </div>
        </div>
      </div>
      {order.notes && (
        <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
          <h2 className="font-semibold text-[#723F3B] mb-2">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
      <div className="bg-white rounded-xl border border-[#E5CBC9] overflow-hidden mt-6">
        <h2 className="font-semibold text-[#723F3B] px-4 py-3 border-b border-[#E5CBC9]">
          Items
        </h2>
        <ul className="divide-y divide-[#E5CBC9]">
          {(items ?? []).map((i) => (
            <li key={i.id} className="px-4 py-3 flex justify-between items-start">
              <div>
                <p className="font-medium">{i.item_name}</p>
                {i.notes && <p className="text-sm text-gray-500">{i.notes}</p>}
              </div>
              <div className="text-right text-sm">
                <p>{i.quantity} × ${Number(i.unit_price).toFixed(2)}</p>
                <p className="font-medium">${Number(i.line_total).toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
        {(!items || items.length === 0) && (
          <p className="px-4 py-6 text-gray-500 text-center text-sm">No items.</p>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <Link
          href={`/orders/${id}/edit`}
          className="px-4 py-2 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg transition"
        >
          Edit order
        </Link>
      </div>
    </div>
  );
}
