import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportsPageClient } from "./ReportsPageClient";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "manager") redirect("/dashboard");

  return (
    <div className="p-6 md:p-8">
      <ReportsPageClient />
    </div>
  );
}
