"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { DashboardNav } from "./DashboardNav";
import { SydneyClock } from "./SydneyClock";
import type { Role } from "@/types/database";

type Props = {
  role: Role;
  userEmail: string;
  userName: string | null;
};

export function CollapsibleSidebar({ role, userEmail, userName }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  function toggle() {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  }

  return (
    <>
      <aside
        className={`${
          isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-0" : "translate-x-0"
        } fixed lg:static top-0 left-0 z-40 h-screen w-60 bg-white border-r border-[#E5CBC9] flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between border-b border-[#E5CBC9] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/logo/logo.png" alt="Cake Bucket" fill className="object-contain" />
            </div>
            <span className="font-bold text-[#723F3B] whitespace-nowrap">Cake Bucket</span>
          </Link>
          {!isCollapsed && (
            <button
              onClick={toggle}
              className="p-1.5 hover:bg-[#FFF8F0] rounded transition-colors"
              aria-label="Hide sidebar"
            >
              <svg className="w-5 h-5 text-[#723F3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <DashboardNav role={role} />
        <div className="mt-auto p-4 border-t border-[#E5CBC9] text-sm text-gray-500 shrink-0">
          <div className="truncate">{userName || userEmail}</div>
        </div>
      </aside>
      {isCollapsed && (
        <button
          onClick={toggle}
          className="fixed top-4 left-4 z-50 p-2 bg-white border border-[#E5CBC9] rounded-lg shadow-md hover:bg-[#FFF8F0] transition-all"
          aria-label="Show sidebar"
        >
          <svg className="w-5 h-5 text-[#723F3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
}
