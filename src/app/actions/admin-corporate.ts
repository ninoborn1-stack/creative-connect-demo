"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { notify } from "@/lib/services/mail";
import type { ActionResult } from "@/components/admin/admin-constants";

export async function setCompanyVerified(companyId: string, verified: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  const company = await db.company.findUnique({ where: { id: companyId }, include: { members: { select: { id: true } } } });
  if (!company) return { ok: false, error: "Unternehmen nicht gefunden." };
  if (company.verified === verified) return { ok: false, error: verified ? "Bereits verifiziert." : "Ist nicht verifiziert." };
  await db.company.update({ where: { id: companyId }, data: { verified } });
  await db.auditLog.create({ data: { actor: admin.name, action: verified ? "Unternehmen verifiziert" : "Verifizierung entzogen", target: company.name } });
  for (const m of company.members) {
    await notify(
      m.id,
      verified ? "Euer Unternehmen ist verifiziert" : "Verifizierung entzogen",
      verified
        ? `${company.name} trägt jetzt das Badge „Verifiziert“ – Ausschreibungen und Lizenzanfragen wirken vertrauenswürdiger.`
        : `Die Verifizierung von ${company.name} wurde aufgehoben. Bei Fragen antworte einfach auf diese Nachricht.`,
      `/unternehmen/${company.slug}`,
    );
  }
  revalidatePath("/admin/unternehmen");
  revalidatePath("/admin");
  revalidatePath(`/unternehmen/${company.slug}`);
  return { ok: true, message: verified ? `${company.name} ist verifiziert.` : `Verifizierung von ${company.name} entzogen.` };
}
