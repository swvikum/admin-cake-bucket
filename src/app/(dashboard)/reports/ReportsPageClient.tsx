"use client";

import { useState, useEffect } from "react";
import { ReportSummary } from "./ReportSummary";

type ReportData = {
  sales: number;
  expenses: number;
  profit: number;
  orders: number;
  salesPrev: number;
  expensesPrev: number;
  profitPrev: number;
  ordersPrev: number;
  monthLabel: string;
};

export function ReportsPageClient() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState(
    startOfMonth.toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const prevStart = new Date(start);
        prevStart.setMonth(prevStart.getMonth() - 1);
        const prevEnd = new Date(end);
        prevEnd.setMonth(prevEnd.getMonth() - 1);

        const params = new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString(),
          prevStart: prevStart.toISOString(),
          prevEnd: prevEnd.toISOString(),
        });

        const res = await fetch(`/api/reports/data?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [startDate, endDate]);

  const monthLabel =
    startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("default", {
          month: "long",
          year: "numeric",
        })}`
      : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#723F3B]">Reports</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
            />
          </div>
          <button
            onClick={() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              setStartDate(firstDay.toISOString().slice(0, 10));
              setEndDate(lastDay.toISOString().slice(0, 10));
            }}
            className="px-4 py-2 mt-6 bg-[#C2727C] hover:bg-[#723F3B] text-white font-medium rounded-lg transition"
          >
            This month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : data ? (
        <ReportSummary
          salesThisMonth={data.sales}
          salesPrevMonth={data.salesPrev}
          expensesThisMonth={data.expenses}
          expensesPrevMonth={data.expensesPrev}
          profitThisMonth={data.profit}
          profitPrevMonth={data.profitPrev}
          orderCountThisMonth={data.orders}
          orderCountPrevMonth={data.ordersPrev}
          salesChangePercent={
            data.salesPrev ? ((data.sales - data.salesPrev) / data.salesPrev) * 100 : 0
          }
          expensesChangePercent={
            data.expensesPrev ? ((data.expenses - data.expensesPrev) / data.expensesPrev) * 100 : 0
          }
          profitChangePercent={
            data.profitPrev !== 0
              ? ((data.profit - data.profitPrev) / Math.abs(data.profitPrev)) * 100
              : 0
          }
          monthLabel={monthLabel}
        />
      ) : (
        <div className="text-center py-12 text-red-500">Failed to load data</div>
      )}
    </div>
  );
}
