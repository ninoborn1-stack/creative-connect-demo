import type { Metadata } from "next";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDateTime, formatRelative } from "@/lib/format";
import { markAllNotificationsRead, openNotification } from "@/app/actions/notifications";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Benachrichtigungen" };

export default async function BenachrichtigungenPage() {
  const user = await requireUser();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Benachrichtigungen"
        description={unread ? `${unread} ungelesen` : "Alles gelesen."}
        actions={
          unread > 0 && (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="outline"><CheckCheck aria-hidden /> Alle als gelesen markieren</Button>
            </form>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="Keine Benachrichtigungen" description="Hier erscheinen Anfragen, Zusagen, Zahlungen und Erinnerungen." />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((n) => (
            <li key={n.id}>
              <form action={openNotification.bind(null, n.id)}>
                <button
                  type="submit"
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", !n.read ? "font-semibold" : "font-medium text-muted-foreground")}>
                      {n.title}
                      {!n.read && <span className="sr-only"> (ungelesen)</span>}
                    </span>
                    <span className="block text-sm text-muted-foreground">{n.body}</span>
                    <time dateTime={n.createdAt.toISOString()} title={formatDateTime(n.createdAt)} className="mt-1 block text-xs text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </time>
                  </span>
                  {n.href && <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
