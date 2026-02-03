"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { OrderStatus } from "@/types/database";

const STATUSES: OrderStatus[] = [
  "draft",
  "pending_confirm",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "completed",
  "cancelled",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-600 border border-gray-300",
  pending_confirm: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  confirmed: "bg-[#D7A1B4]/30 text-[#723F3B] border border-[#D7A1B4]",
  in_progress: "bg-blue-100 text-blue-700 border border-blue-300",
  ready: "bg-purple-100 text-purple-700 border border-purple-300",
  delivered: "bg-indigo-100 text-indigo-700 border border-indigo-300",
  completed: "bg-green-100 text-green-700 border border-green-300",
  cancelled: "bg-red-100 text-red-600 border border-red-300",
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  due_at: string;
  status: string;
  total: number;
  created_at: string;
};

type Props = {
  orders: Order[];
};

export function OrdersFilter({ orders }: Props) {
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Filter by customer name (case-insensitive)
    if (customerFilter.trim()) {
      const search = customerFilter.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(search) ||
          (o.customer_phone && o.customer_phone.includes(search))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Filter by date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.due_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.due_at) <= to);
    }

    // Sort by due_at descending (newest first)
    result.sort((a, b) => new Date(b.due_at).getTime() - new Date(a.due_at).getTime());

    return result;
  }, [orders, customerFilter, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setCustomerFilter("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = customerFilter || statusFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5CBC9] p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Customer search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Customer
            </label>
            <input
              type="text"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Name or phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
            />
          </div>

          {/* Status filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due from
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
            />
          </div>

          {/* Date to */}
          <div className="min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due to
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D7A1B4] focus:border-[#D7A1B4] outline-none"
            />
          </div>

          {/* Clear filters button */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-[#723F3B] hover:bg-[#FFF8F0] rounded-lg transition"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
          {hasFilters && " (filtered)"}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-[#E5CBC9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FFF8F0] text-left">
                <th className="px-4 py-3 font-medium text-[#723F3B]">Customer</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Due</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Status</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Total</th>
                <th className="px-4 py-3 font-medium text-[#723F3B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-[#E5CBC9] hover:bg-[#FFF8F0]/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer_name}</div>
                    {o.customer_phone && (
                      <div className="text-gray-500 text-xs">{o.customer_phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(o.due_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_COLORS[o.status as OrderStatus] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${Number(o.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="text-[#C2727C] hover:text-[#723F3B] font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <p className="px-4 py-8 text-gray-500 text-center">
            {hasFilters ? "No orders match your filters." : "No orders yet."}
          </p>
        )}
      </div>
    </div>
  );
}
