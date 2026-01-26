import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-white border-r border-[#E5CBC9] flex flex-col">
        <Link href="/dashboard" className="p-4 flex items-center gap-3 border-b border-[#E5CBC9]">
          <div className="relative w-10 h-10">
            <Image src="/logo/logo.png" alt="Cake Bucket" fill className="object-contain" />
          </div>
          <span className="font-bold text-[#723F3B]">Cake Bucket</span>
        </Link>
        <DashboardNav role={(profile?.role as "admin" | "manager" | "employee") ?? "employee"} />
        <div className="mt-auto p-4 border-t border-[#E5CBC9] text-sm text-gray-500">
          {profile?.full_name || user.email}
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-[#FFF8F0]">
        {children}
      </main>
    </div>
  );
}
