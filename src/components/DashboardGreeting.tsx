"use client";

import { useState, useEffect } from "react";

export function DashboardGreeting() {
  const [greeting, setGreeting] = useState("G'day mate");

  useEffect(() => {
    function updateGreeting() {
      const sydneyTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" })
      );
      const hour = sydneyTime.getHours();
      if (hour < 12) {
        setGreeting("G'day mate");
      } else if (hour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    }
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return <span className="text-xl font-semibold text-[#D7A1B4]">{greeting}!</span>;
}
