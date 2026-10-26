import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parseJson, formatDate } from "@/lib/format";
import { LICENSE_MEDIA, LICENSE_TIERS, TERRITORIES } from "@/lib/constants";
import { licenseState, workTypeLabel } from "@/lib/licensing";
import { renderCertificatePdf } from "@/components/licensing/certificate-pdf";

// @react-pdf/renderer steht in Nexts Standardliste der serverExternalPackages – keine Config nötig.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ number: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Nicht angemeldet", { status: 401 });

  const { number } = await params;
  const license = await db.license.findUnique({
    where: { number },
    include: { buyer: { select: { name: true } }, company: { select: { name: true } }, work: { include: { owner: { select: { name: true } } } } },
  });
  if (!license) return new Response("Lizenz nicht gefunden", { status: 404 });

  const allowed =
    user.isAdmin || license.buyerId === user.id || license.work.ownerId === user.id || (Boolean(license.companyId) && license.companyId === user.companyId);
  if (!allowed) return new Response("Kein Zugriff auf dieses Zertifikat", { status: 403 });

  const tier = LICENSE_TIERS[license.tier as keyof typeof LICENSE_TIERS];
  const state = licenseState(license);
  const buffer = await renderCertificatePdf({
    number: license.number,
    issuedAt: license.createdAt,
    licensee: license.buyer.name,
    company: license.company?.name,
    workTitle: license.work.title,
    workType: workTypeLabel(license.work.type),
    creator: license.work.owner.name,
    tier: tier?.label ?? license.tier,
    media: parseJson<string[]>(license.media, []).map((m) => LICENSE_MEDIA[m] ?? m),
    territory: TERRITORIES[license.territory] ?? license.territory,
    validUntil: state.endsAt ? formatDate(state.endsAt) : "unbefristet",
    projectName: license.projectName,
    price: license.price,
    serviceFee: license.serviceFee,
    aiMarked: license.work.aiMarked,
    status: state.status,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Lizenzzertifikat-${license.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
