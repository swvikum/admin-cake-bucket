import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrderForm } from "../../OrderForm";

export default async function EditOrderPage({
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

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("item_name, quantity, unit_price, notes")
    .eq("order_id", id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true);

  const initial = {
    customer_name: order.customer_name,
    customer_phone: order.customer_phone ?? "",
    customer_email: order.customer_email ?? "",
    due_at: order.due_at,
    status: order.status,
    assigned_user_id: order.assigned_user_id ?? "",
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    delivery_fee: Number(order.delivery_fee),
    total: Number(order.total),
    deposit_paid: Number(order.deposit_paid),
    balance_due: Number(order.balance_due),
    notes: order.notes ?? "",
    items: (orderItems ?? []).map((i) => ({
      item_name: i.item_name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      notes: i.notes ?? "",
    })),
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <Link
        href={`/orders/${id}`}
        className="text-sm text-[#C2727C] hover:text-[#723F3B] mb-4 inline-block"
      >
        ← Back to order
      </Link>
      <h1 className="text-2xl font-bold text-[#723F3B] mb-6">Edit order</h1>
      <OrderForm
        orderId={id}
        initial={initial}
        profiles={profiles ?? []}
        createdBy={user.id}
      />
    </div>
  );
}
