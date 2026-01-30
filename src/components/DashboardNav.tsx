"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types/database";

const nav: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "manager", "employee"] },
  { href: "/orders", label: "Orders", roles: ["admin", "manager", "employee"] },
  { href: "/inventory", label: "Inventory", roles: ["admin", "manager", "employee"] },
  { href: "/expenses", label: "Expenses", roles: ["admin"] },
  { href: "/reports", label: "Reports", roles: ["admin", "manager"] },
];

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = nav.filter((n) => n.roles.includes(role));

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="p-4 space-y-1">
      {links.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              active
                ? "bg-[#D7A1B4] text-[#723F3B]"
                : "text-gray-600 hover:bg-[#E5CBC9] hover:text-[#723F3B]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-700 transition mt-4"
      >
        Sign out
      </button>
    </nav>
  );
}
