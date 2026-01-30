"use client";

import { SydneyClock } from "./SydneyClock";

export function DashboardHeader() {
  return (
    <div className="sticky top-0 z-30 bg-[#FFF8F0] border-b border-[#E5CBC9] px-6 py-3 flex justify-end">
      <SydneyClock />
    </div>
  );
}
