"use client";

const cards = [
  {
    label: "This week sales",
    value: (v: number) => `$${v.toFixed(2)}`,
    key: "weekSales" as const,
    className: "bg-gradient-to-br from-white to-[#FFF8F0] border-2 border-[#E5CBC9] shadow-md",
  },
  {
    label: "This month sales",
    value: (v: number) => `$${v.toFixed(2)}`,
    key: "monthSales" as const,
    className: "bg-gradient-to-br from-white to-[#FFF8F0] border-2 border-[#E5CBC9] shadow-md",
  },
  {
    label: "Confirmed orders",
    value: (v: number) => String(v),
    key: "confirmedCount" as const,
    className: "bg-gradient-to-br from-[#D7A1B4]/30 to-[#D7A1B4]/20 border-2 border-[#D7A1B4] shadow-lg",
  },
  {
    label: "Completed orders",
    value: (v: number) => String(v),
    key: "completedCount" as const,
    className: "bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-300 shadow-lg",
  },
  {
    label: "Upcoming (due soon)",
    value: (v: number) => String(v),
    key: "upcomingCount" as const,
    className: "bg-gradient-to-br from-white to-[#FFF8F0] border-2 border-[#E5CBC9] shadow-md",
  },
  {
    label: "Low stock items",
    value: (v: number) => String(v),
    key: "lowStockCount" as const,
    className: (v: number) => (v > 0 ? "bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-300 shadow-lg" : "bg-gradient-to-br from-white to-[#FFF8F0] border-2 border-[#E5CBC9] shadow-md"),
  },
];

type Props = {
  weekSales: number;
  monthSales: number;
  confirmedCount: number;
  completedCount: number;
  upcomingCount: number;
  lowStockCount: number;
  orders: { id: string; customer_name: string; status: string; total: string | number; due_at: string }[];
};

export function DashboardMetrics({
  weekSales,
  monthSales,
  confirmedCount,
  completedCount,
  upcomingCount,
  lowStockCount,
  orders,
}: Props) {
  const values = {
    weekSales,
    monthSales,
    confirmedCount,
    completedCount,
    upcomingCount,
    lowStockCount,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => {
          const v = values[c.key];
          const cn =
            typeof c.className === "function"
              ? c.className(v)
              : c.className;
          return (
            <div
              key={c.key}
              className={`rounded-xl p-5 border transition-all hover:scale-105 hover:shadow-xl ${cn}`}
            >
              <p className="text-sm font-medium text-gray-700 mb-2">{c.label}</p>
              <p className="text-3xl font-bold text-[#723F3B] leading-tight">
                {c.value(v)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border-2 border-[#E5CBC9] shadow-lg overflow-hidden">
        <h2 className="px-6 py-4 text-xl font-bold text-[#723F3B] border-b-2 border-[#E5CBC9] bg-gradient-to-r from-[#FFF8F0] to-white">
          Recent orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#FFF8F0] to-[#fef9f5] text-left">
                <th className="px-6 py-4 text-base font-semibold text-[#723F3B]">Customer / Due</th>
                <th className="px-6 py-4 text-base font-semibold text-[#723F3B]">Status</th>
                <th className="px-6 py-4 text-base font-semibold text-[#723F3B]">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((o, idx) => (
                <tr
                  key={o.id}
                  className={`border-t border-[#E5CBC9] transition-colors hover:bg-[#FFF8F0]/50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#FFF8F0]/30"
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="text-base font-semibold text-gray-800">
                      {o.customer_name}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {new Date(o.due_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
                        o.status === "completed"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : o.status === "confirmed"
                            ? "bg-[#D7A1B4]/30 text-[#723F3B] border border-[#D7A1B4]"
                            : "bg-[#E5CBC9] text-[#723F3B] border border-[#D7A1B4]"
                      }`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-base font-bold text-[#723F3B]">
                      ${Number(o.total).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="px-6 py-8 text-gray-500 text-center text-base">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
