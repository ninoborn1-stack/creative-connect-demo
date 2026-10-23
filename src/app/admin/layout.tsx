import { requireAdmin } from "@/lib/session";
import { AppShell } from "@/components/app/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AppShell user={user}>{children}</AppShell>;
}
