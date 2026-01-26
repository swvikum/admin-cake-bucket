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
      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
        <p className="text-sm text-gray-600">Sales ({monthLabel})</p>
        <p className="text-2xl font-bold text-[#723F3B]">${salesThisMonth.toFixed(2)}</p>
        <ChangeBadge pct={salesChangePercent} />
      </div>
      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
        <p className="text-sm text-gray-600">Expenses ({monthLabel})</p>
        <p className="text-2xl font-bold text-[#723F3B]">${expensesThisMonth.toFixed(2)}</p>
        <ChangeBadge pct={expensesChangePercent} />
      </div>
      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
        <p className="text-sm text-gray-600">Profit ({monthLabel})</p>
        <p className={`text-2xl font-bold ${profitThisMonth >= 0 ? "text-[#723F3B]" : "text-red-600"}`}>
          ${profitThisMonth.toFixed(2)}
        </p>
        <ChangeBadge pct={profitChangePercent} />
      </div>
      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
        <p className="text-sm text-gray-600">Orders ({monthLabel})</p>
        <p className="text-2xl font-bold text-[#723F3B]">{orderCountThisMonth}</p>
      </div>
    </div>
  );
}
