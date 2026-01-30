"use client";

import { useState, useEffect } from "react";

export function SydneyClock() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    function updateTime() {
      const sydneyTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" })
      );
      setTime(
        sydneyTime.toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDate(
        sydneyTime.toLocaleDateString("en-AU", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-gray-600">
      <span className="font-semibold text-[#723F3B]">{time}</span>
      <span className="ml-2">{date}</span>
    </div>
  );
}
