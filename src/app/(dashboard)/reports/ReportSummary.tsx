"use client";

function ChangeBadge({ pct }: { pct: number }) {
  const up = pct > 0;
  const same = Math.abs(pct) < 0.01;
  if (same) return <span className="text-gray-500 text-sm">—</span>;
  return (
    <span className={up ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
      {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}% vs last month
    </span>
  );
}

type Props = {
  salesThisMonth: number;
  salesPrevMonth: number;
  expensesThisMonth: number;
  expensesPrevMonth: number;
  profitThisMonth: number;
  profitPrevMonth: number;
  orderCountThisMonth: number;
  orderCountPrevMonth: number;
  salesChangePercent: number;
  expensesChangePercent: number;
  profitChangePercent: number;
  monthLabel: string;
};

export function ReportSummary({
  salesThisMonth,
  expensesThisMonth,
  profitThisMonth,
  orderCountThisMonth,
  salesChangePercent,
  expensesChangePercent,
  profitChangePercent,
  monthLabel,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-gradient-to-br from-white to-[#FFF8F0] rounded-xl border-2 border-[#E5CBC9] shadow-lg p-5 transition-all hover:scale-105 hover:shadow-xl">
        <p className="text-sm font-medium text-gray-700 mb-2">Sales ({monthLabel})</p>
        <p className="text-3xl font-bold text-[#723F3B] leading-tight mb-2">
          ${salesThisMonth.toFixed(2)}
        </p>
        <ChangeBadge pct={salesChangePercent} />
      </div>
      <div className="bg-gradient-to-br from-white to-[#FFF8F0] rounded-xl border-2 border-[#E5CBC9] shadow-lg p-5 transition-all hover:scale-105 hover:shadow-xl">
        <p className="text-sm font-medium text-gray-700 mb-2">Expenses ({monthLabel})</p>
        <p className="text-3xl font-bold text-[#723F3B] leading-tight mb-2">
          ${expensesThisMonth.toFixed(2)}
        </p>
        <ChangeBadge pct={expensesChangePercent} />
      </div>
      <div className="bg-gradient-to-br from-white to-[#FFF8F0] rounded-xl border-2 border-[#E5CBC9] shadow-lg p-5 transition-all hover:scale-105 hover:shadow-xl">
        <p className="text-sm font-medium text-gray-700 mb-2">Profit ({monthLabel})</p>
        <p
          className={`text-3xl font-bold leading-tight mb-2 ${
            profitThisMonth >= 0 ? "text-[#723F3B]" : "text-red-600"
          }`}
        >
          ${profitThisMonth.toFixed(2)}
        </p>
        <ChangeBadge pct={profitChangePercent} />
      </div>
      <div className="bg-gradient-to-br from-white to-[#FFF8F0] rounded-xl border-2 border-[#E5CBC9] shadow-lg p-5 transition-all hover:scale-105 hover:shadow-xl">
        <p className="text-sm font-medium text-gray-700 mb-2">Orders ({monthLabel})</p>
        <p className="text-3xl font-bold text-[#723F3B] leading-tight">{orderCountThisMonth}</p>
      </div>
    </div>
  );
}
