import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  return <AppShell user={user}>{children}</AppShell>;
}
