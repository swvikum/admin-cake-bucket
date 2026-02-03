import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";

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
    <div className="h-screen flex overflow-hidden">
      <CollapsibleSidebar
        role={(profile?.role as "admin" | "manager" | "employee") ?? "employee"}
        userEmail={user.email ?? ""}
        userName={profile?.full_name ?? null}
      />
      <main className="flex-1 overflow-hidden bg-[#FFF8F0] relative">
        {children}
      </main>
    </div>
  );
}
