"use client";

const cards = [
  {
    label: "This week sales",
    value: (v: number) => `$${v.toFixed(2)}`,
    key: "weekSales" as const,
    className: "bg-white border border-[#E5CBC9]",
  },
  {
    label: "This month sales",
    value: (v: number) => `$${v.toFixed(2)}`,
    key: "monthSales" as const,
    className: "bg-white border border-[#E5CBC9]",
  },
  {
    label: "Confirmed orders",
    value: (v: number) => String(v),
    key: "confirmedCount" as const,
    className: "bg-[#D7A1B4]/20 border border-[#D7A1B4]",
  },
  {
    label: "Upcoming (due soon)",
    value: (v: number) => String(v),
    key: "upcomingCount" as const,
    className: "bg-white border border-[#E5CBC9]",
  },
  {
    label: "Low stock items",
    value: (v: number) => String(v),
    key: "lowStockCount" as const,
    className: (v: number) => (v > 0 ? "bg-red-50 border border-red-200" : "bg-white border border-[#E5CBC9]"),
  },
];

type Props = {
  weekSales: number;
  monthSales: number;
  confirmedCount: number;
  upcomingCount: number;
  lowStockCount: number;
  orders: { id: string; customer_name: string; status: string; total: string | number; due_at: string }[];
};

export function DashboardMetrics({
  weekSales,
  monthSales,
  confirmedCount,
  upcomingCount,
  lowStockCount,
  orders,
}: Props) {
  const values = {
    weekSales,
    monthSales,
    confirmedCount,
    upcomingCount,
    lowStockCount,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => {
          const v = values[c.key];
          const cn =
            typeof c.className === "function"
              ? c.className(v)
              : c.className;
          return (
            <div
              key={c.key}
              className={`rounded-xl p-4 border ${cn}`}
            >
              <p className="text-sm text-gray-600">{c.label}</p>
              <p className="text-xl font-bold text-[#723F3B] mt-1">
                {c.value(v)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border border-[#E5CBC9] overflow-hidden">
        <h2 className="px-4 py-3 font-semibold text-[#723F3B] border-b border-[#E5CBC9]">
          Recent orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FFF8F0] text-left">
                <th className="px-4 py-2 font-medium">Customer / Due</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id} className="border-t border-[#E5CBC9]">
                  <td className="px-4 py-2">
                    {o.customer_name} · {new Date(o.due_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center rounded-full bg-[#E5CBC9] px-2 py-0.5 text-[#723F3B]">
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2">${Number(o.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="px-4 py-6 text-gray-500 text-center">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
