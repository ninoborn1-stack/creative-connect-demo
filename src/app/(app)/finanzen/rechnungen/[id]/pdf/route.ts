import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parseJson } from "@/lib/format";
import { renderInvoicePdf } from "@/components/finance/invoice-pdf";

// @react-pdf/renderer steht in Nexts Standardliste der serverExternalPackages – keine Config nötig.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Nicht angemeldet", { status: 401 });

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { project: { select: { title: true, ownerId: true, roles: { select: { assigneeId: true } } } } },
  });
  if (!invoice) return new Response("Rechnung nicht gefunden", { status: 404 });

  const allowed =
    user.isAdmin || !invoice.project || invoice.project.ownerId === user.id || invoice.project.roles.some((r) => r.assigneeId === user.id);
  if (!allowed) return new Response("Kein Zugriff auf diese Rechnung", { status: 403 });

  const buffer = await renderInvoicePdf({
    number: invoice.number,
    issuedAt: invoice.issuedAt,
    issuer: invoice.issuer,
    recipient: invoice.recipient,
    projectTitle: invoice.project?.title,
    items: parseJson<{ label: string; amount: number }[]>(invoice.items, []),
    net: invoice.net,
    vatRate: invoice.vatRate,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Rechnung-${invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
