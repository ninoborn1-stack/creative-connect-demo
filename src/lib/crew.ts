import "server-only";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { getFees } from "@/lib/settings";
import { payments } from "@/lib/services/payments";
import { notify, sendMail } from "@/lib/services/mail";
import { CONTRACT_TEMPLATES } from "@/lib/constants";
import { formatEur } from "@/lib/format";

const ownerLabel = (owner: { company: string | null; name: string }) => owner.company ?? owner.name;

// Sobald alle Rollen besetzt sind: Projekt bestätigen, Vertrag anlegen, Zahlungen reservieren, Rechnung erzeugen.
// Wird vom Crew-Builder (Auftraggeber:in) und vom Dashboard (Zusage der Kreativen) aufgerufen.
export async function completeCrewIfReady(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { owner: true, roles: { include: { assignee: true, requests: true }, orderBy: { sort: "asc" } }, payments: true, contracts: true },
  });
  if (!project || !project.roles.length) return false;
  if (project.roles.some((r) => !r.assigneeId)) return false;
  if (!["entwurf", "anfragen"].includes(project.status)) return false;

  const fees = await getFees();
  const managed = project.type === "managed";
  const priceOf = (r: (typeof project.roles)[number]) => r.requests.find((q) => q.status === "angenommen" && q.creativeId === r.assigneeId)?.price ?? r.budget;
  const total = project.roles.reduce((a, r) => a + priceOf(r), 0);
  const from = ownerLabel(project.owner);

  await db.project.update({ where: { id: projectId }, data: { status: "bestaetigt", ...(managed ? { managedStage: "crew" } : {}) } });
  await db.milestone.updateMany({ where: { projectId, title: "Crew bestätigt" }, data: { done: true } });

  if (!project.contracts.length) {
    const cats = project.roles.map((r) => r.category);
    const template = cats[0] === "tonstudio" ? "studiomiete" : cats.some((c) => c === "fotografie" || c === "videografie") ? "nutzungsrechte" : cats.every((c) => c === "booking" || c === "schauspiel") ? "booking" : "werkvertrag";
    await db.contract.create({
      data: {
        projectId, template, title: `${CONTRACT_TEMPLATES[template].title} – ${project.title}`, partyA: from,
        partyB: [...new Set(project.roles.map((r) => r.assignee?.name).filter(Boolean))].join(", "), service: project.description,
        usageRights: template === "nutzungsrechte" ? "Einfaches Nutzungsrecht, Online & Social Media, Deutschland, 24 Monate" : "Nach Abnahme vollständig auf Auftraggeber:in übertragen",
        compensation: total,
      },
    });
  }

  let feeSum = 0;
  for (const role of project.roles) {
    if (project.payments.some((p) => p.label === role.title && p.payeeId === role.assigneeId)) continue;
    const amount = priceOf(role);
    const serviceFee = managed ? 0 : Math.round((amount * fees.serviceFeePct) / 100);
    const margin = managed ? Math.round((amount * fees.managedMarginPct) / 100) : 0;
    feeSum += serviceFee + margin;
    await payments.reserve({ projectId, payeeId: role.assigneeId ?? undefined, label: role.title, amount, serviceFee, margin });
  }

  await db.invoice.create({
    data: {
      number: `CC-${format(new Date(), "yyyy")}-${Date.now().toString().slice(-6)}`,
      projectId,
      issuer: "Creative Connect (Demo) im Namen der Crew",
      recipient: from,
      items: JSON.stringify([
        ...project.roles.map((r) => ({ label: r.title, amount: priceOf(r) })),
        { label: managed ? `Managed-Crew-Marge ${fees.managedMarginPct} %` : `Servicegebühr ${fees.serviceFeePct} %`, amount: feeSum },
      ]),
      net: total + feeSum,
    },
  });

  await notify(project.ownerId, "Crew vollständig", `Alle Rollen für „${project.title}“ sind besetzt. Zahlungen sind reserviert, der Vertrag liegt zur Unterschrift bereit.`, `/projekte/${projectId}`);
  await sendMail(project.owner.email, "Deine Crew ist vollständig", `Hallo ${project.owner.name.split(" ")[0]},\n\nalle Rollen für „${project.title}“ sind besetzt. ${formatEur(total + feeSum)} sind beim Zahlungsdienstleister reserviert und werden erst nach deiner Abnahme ausgezahlt.\n\nViele Grüße\nDein Creative-Connect-Team`);
  for (const r of project.roles) {
    if (r.assigneeId) await notify(r.assigneeId, "Crew vollständig", `Die Crew für „${project.title}“ steht. Vertrag und Projektraum sind bereit.`, `/projekte/${projectId}`);
  }
  return true;
}

