import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Download, FileText, MapPin, MessageSquare, Play, Send, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFees } from "@/lib/settings";
import { suggestCrew } from "@/lib/matching";
import { CONTRACT_TEMPLATES, categoryName } from "@/lib/constants";
import { formatDate, formatEur, formatRelative, parseJson } from "@/lib/format";
import { advanceProjectStatus } from "@/app/actions/projects";
import { StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { StockImage } from "@/components/stock-image";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AcceptancePanel, type ReviewTarget } from "@/components/projects/acceptance-panel";
import { ActionButton } from "@/components/projects/action-button";
import { BudgetMeter } from "@/components/projects/budget-meter";
import { ChatForm } from "@/components/projects/chat-form";
import { CrewBoard, type BoardCandidate, type BoardRole } from "@/components/projects/crew-board";
import { FileUpload } from "@/components/projects/file-upload";
import { Milestones } from "@/components/projects/milestones";
import { PaymentFlow } from "@/components/projects/payment-flow";
import { TypeBadge } from "@/components/projects/project-card";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectTypeToggle } from "@/components/projects/project-type-toggle";
import { StatusStepper } from "@/components/projects/status-stepper";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await db.project.findUnique({ where: { id }, select: { title: true } });
  return { title: p?.title ?? "Projekt" };
}

const DISPUTE_LABEL: Record<string, string> = { offen: "Offen", in_pruefung: "In Prüfung", geloest: "Gelöst" };

function Section({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-6", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const project = await db.project.findUnique({
    where: { id },
    include: {
      owner: { include: { profile: true } },
      briefing: true,
      roles: {
        orderBy: { sort: "asc" },
        include: {
          assignee: { include: { profile: true } },
          requests: { include: { creative: { include: { profile: true } } }, orderBy: { createdAt: "asc" } },
        },
      },
      milestones: { orderBy: { dueDate: "asc" } },
      messages: { include: { author: { include: { profile: true } } }, orderBy: { createdAt: "asc" } },
      files: { include: { uploader: true }, orderBy: { createdAt: "desc" } },
      contracts: { orderBy: { createdAt: "asc" } },
      payments: { include: { payee: true }, orderBy: { createdAt: "asc" } },
      disputes: { orderBy: { createdAt: "desc" } },
      reviews: { where: { authorId: user.id } },
    },
  });
  if (!project) notFound();

  const isOwner = project.ownerId === user.id;
  const isCrew = project.roles.some((r) => r.assigneeId === user.id);
  const isRequested = project.roles.some((r) => r.requests.some((q) => q.creativeId === user.id));
  if (!isOwner && !isCrew && !isRequested && !user.isAdmin) notFound();
  const isMember = isOwner || isCrew || user.isAdmin;

  const fees = await getFees();
  const editable = ["entwurf", "anfragen"].includes(project.status);
  const completed = project.status === "abgeschlossen";

  // ---------- Crew-Board-Daten ----------
  const person = (u: { id: string; name: string; profile: { avatarSeed: string; slug: string } | null }) => ({
    id: u.id, name: u.name, avatarSeed: u.profile?.avatarSeed ?? null, slug: u.profile?.slug ?? null,
  });
  const acceptedPrice = (r: (typeof project.roles)[number]) => r.requests.find((q) => q.status === "angenommen" && q.creativeId === r.assigneeId)?.price ?? null;
  const boardRoles: BoardRole[] = project.roles.map((r) => ({
    id: r.id, title: r.title, category: r.category, budget: r.budget,
    assignee: r.assignee ? person(r.assignee) : null,
    acceptedPrice: acceptedPrice(r),
    requests: r.requests.map((q) => ({ id: q.id, status: q.status, price: q.price, counterPrice: q.counterPrice, creative: person(q.creative) })),
  }));

  const suggestions: Record<string, BoardCandidate[]> = {};
  let pool: BoardCandidate[] = [];
  if (isOwner && editable) {
    await Promise.all(
      project.roles.filter((r) => !r.assigneeId).map(async (r) => {
        const exclude = [project.ownerId, ...r.requests.filter((q) => ["offen", "gegenangebot"].includes(q.status)).map((q) => q.creativeId)];
        const list = await suggestCrew(r.category, r.budget, project.city, exclude);
        suggestions[r.id] = list.map((s) => ({
          id: s.user.id, name: s.user.name, avatarSeed: s.profile.avatarSeed, slug: s.profile.slug, city: s.profile.city,
          dayRateMin: s.profile.dayRateMin, categories: parseJson<string[]>(s.profile.categories, []), reasons: s.reasons,
        }));
      }),
    );
    const profiles = await db.profile.findMany({
      where: { user: { isCreative: true, status: { not: "gesperrt" }, id: { not: project.ownerId } } },
      select: { slug: true, city: true, dayRateMin: true, categories: true, avatarSeed: true, user: { select: { id: true, name: true } } },
      orderBy: { ratingAvg: "desc" },
    });
    pool = profiles.map((p) => ({
      id: p.user.id, name: p.user.name, avatarSeed: p.avatarSeed, slug: p.slug, city: p.city, dayRateMin: p.dayRateMin,
      categories: parseJson<string[]>(p.categories, []), reasons: [],
    }));
  }

  // ---------- Kennzahlen ----------
  const planned = project.roles.reduce((a, r) => a + (r.assigneeId ? (acceptedPrice(r) ?? r.budget) : r.budget), 0);
  const nextMilestones = project.milestones.filter((m) => !m.done).slice(0, 3);
  const structured = parseJson<{ goal?: string; format?: string; dates?: string; style?: string; source?: string }>(project.briefing?.structured, {});
  const ownerName = project.owner.company ?? project.owner.name;

  const crewPeople = [...new Map(project.roles.filter((r) => r.assignee).map((r) => [r.assignee!.id, r.assignee!])).values()];
  const roleOf = (uid: string) => project.roles.filter((r) => r.assigneeId === uid).map((r) => r.title).join(", ");
  const reviewed = new Set(project.reviews.map((r) => r.targetId));
  const reviewTargets: ReviewTarget[] = isOwner
    ? crewPeople.filter((p) => p.id !== user.id && !reviewed.has(p.id)).map((p) => ({ id: p.id, name: p.name, avatarSeed: p.profile?.avatarSeed ?? null, role: roleOf(p.id) }))
    : isCrew && !reviewed.has(project.ownerId)
      ? [{ id: project.owner.id, name: ownerName, avatarSeed: project.owner.profile?.avatarSeed ?? null, role: "Auftraggeber:in" }]
      : [];

  const paySum = project.payments.reduce((a, p) => a + p.amount, 0);
  const feeSum = project.payments.reduce((a, p) => a + p.serviceFee + p.margin, 0);

  // ---------- Tabs ----------
  const overview = (
    <div className="grid gap-4 lg:grid-cols-3">
      <Section title="Status" className="lg:col-span-3">
        <StatusStepper status={project.status} />
        {isOwner && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
            {project.status === "bestaetigt" && (
              <ActionButton action={advanceProjectStatus.bind(null, project.id)} data-testid="start-production">
                <Play aria-hidden /> Produktion starten
              </ActionButton>
            )}
            {project.status === "produktion" && (
              <ActionButton action={advanceProjectStatus.bind(null, project.id)} data-testid="to-acceptance">
                <ArrowRight aria-hidden /> Zur Abnahme
              </ActionButton>
            )}
            {["produktion", "abnahme"].includes(project.status) && (
              <Button asChild variant={project.status === "abnahme" ? "default" : "outline"}>
                <Link href={`/projekte/${project.id}?tab=abnahme`}>Zur Abnahme-Seite</Link>
              </Button>
            )}
            {editable && (
              <Button asChild variant="outline">
                <Link href={`/projekte/${project.id}?tab=crew`}>Crew zusammenstellen</Link>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {editable && "Sobald alle Rollen besetzt sind, wird der Vertrag erstellt und die Zahlung reserviert."}
              {project.status === "bestaetigt" && "Die Crew steht. Starte die Produktion, wenn es losgeht."}
              {project.status === "produktion" && "Wenn alles geliefert ist: zur Abnahme."}
              {completed && "Projekt abgeschlossen – danke!"}
            </p>
          </div>
        )}
      </Section>

      <Section title="Briefing" className="lg:col-span-2">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Ziel</dt><dd className="mt-0.5">{structured.goal || project.description}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Format</dt><dd className="mt-0.5">{structured.format || "–"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Stil</dt><dd className="mt-0.5">{project.briefing?.style || structured.style || "–"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Ort</dt><dd className="mt-0.5">{project.city}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Zeitraum</dt><dd className="mt-0.5">{formatDate(project.startDate)} – {formatDate(project.endDate)}{structured.dates && structured.dates !== "Siehe Zeitplan" ? ` (${structured.dates})` : ""}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Auftraggeber:in</dt><dd className="mt-0.5">{ownerName}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Rollen</dt><dd className="mt-0.5">{project.roles.length} ({project.roles.filter((r) => r.assigneeId).length} besetzt)</dd></div>
        </dl>
        {project.briefing?.rawText && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Ursprüngliches Briefing anzeigen</summary>
            <p className="mt-2 rounded-lg bg-muted/50 p-3 whitespace-pre-line">{project.briefing.rawText}</p>
          </details>
        )}
      </Section>

      <div className="flex flex-col gap-4">
        <Section title="Budget">
          <BudgetMeter planned={planned} budget={project.budget} />
          <ul className="mt-4 space-y-1.5 text-sm">
            {project.roles.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span className="truncate text-muted-foreground">{r.title}</span>
                <span className="tabular-nums">{formatEur(r.assigneeId ? (acceptedPrice(r) ?? r.budget) : r.budget)}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Nächste Meilensteine">
          {nextMilestones.length ? (
            <ul className="space-y-2 text-sm">
              {nextMilestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{m.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(m.dueDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Alle Meilensteine erledigt.</p>
          )}
        </Section>
      </div>
    </div>
  );

  const crewTab = (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-medium">Budget-Ampel</p>
          <BudgetMeter planned={planned} budget={project.budget} />
        </div>
        {isOwner ? (
          <ProjectTypeToggle projectId={project.id} type={project.type} disabled={!editable} marginPct={fees.managedMarginPct} />
        ) : (
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p className="font-medium">{project.type === "managed" ? "Managed Crew" : "Self-Service"}</p>
            <p className="text-muted-foreground">{project.type === "managed" ? "Nesto (Admin) stellt das Team zusammen." : "Die Auftraggeber:in stellt die Crew selbst zusammen."}</p>
          </div>
        )}
      </div>
      {project.roles.length ? (
        <CrewBoard projectId={project.id} roles={boardRoles} suggestions={suggestions} pool={pool} isOwner={isOwner} editable={editable} />
      ) : (
        <EmptyState title="Noch keine Rollen" description="Lege Rollen über den Briefing-Assistenten an." />
      )}
    </div>
  );

  const timeline = (
    <Section title="Zeitplan & Meilensteine">
      <Milestones
        projectId={project.id}
        canEdit={isMember && project.status !== "storniert"}
        items={project.milestones.map((m) => ({ id: m.id, title: m.title, dueDate: m.dueDate.toISOString(), done: m.done }))}
      />
    </Section>
  );

  const chat = (
    <Section title="Projekt-Chat">
      {project.messages.length ? (
        <ol className="mb-4 flex max-h-[60dvh] flex-col gap-3 overflow-y-auto pr-1" aria-label="Nachrichten">
          {project.messages.map((m) => {
            const mine = m.authorId === user.id;
            return (
              <li key={m.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                <UserAvatar name={m.author.name} seed={m.author.profile?.avatarSeed} className="size-8" />
                <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted")}>
                  <p className={cn("text-[11px] font-medium", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {mine ? "Du" : m.author.name} · <time dateTime={m.createdAt.toISOString()}>{formatRelative(m.createdAt)}</time>
                  </p>
                  <p className="whitespace-pre-line">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mb-4"><EmptyState icon={MessageSquare} title="Noch keine Nachrichten" description="Schreib der Crew ein erstes Hallo." /></div>
      )}
      {isMember ? <ChatForm projectId={project.id} /> : <p className="text-sm text-muted-foreground">Der Chat ist für die bestätigte Crew offen.</p>}
    </Section>
  );

  const files = (
    <Section title="Dateien">
      {project.files.length ? (
        <ul className="mb-4 divide-y rounded-lg border">
          {project.files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 p-3 text-sm">
              <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.uploader.name} · {f.sizeKb >= 1024 ? `${(f.sizeKb / 1024).toFixed(1).replace(".", ",")} MB` : `${f.sizeKb} KB`} · {formatDate(f.createdAt)}</p>
              </div>
              {f.url !== "#" ? (
                <Button asChild variant="ghost" size="icon" aria-label={`${f.name} herunterladen`}>
                  <a href={f.url} download><Download aria-hidden /></a>
                </Button>
              ) : (
                <span className="text-[11px] text-muted-foreground">Demo-Datei</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mb-4"><EmptyState icon={FileText} title="Noch keine Dateien" description="Moodboards, Zeitpläne, Referenzen – alles an einem Ort." /></div>
      )}
      {isMember && <FileUpload projectId={project.id} />}
    </Section>
  );

  const people = [
    { id: project.owner.id, name: ownerName, sub: project.owner.company ? `${project.owner.name} · Auftraggeber:in` : "Auftraggeber:in", avatarSeed: project.owner.profile?.avatarSeed, slug: project.owner.profile?.slug },
    ...crewPeople.map((p) => ({ id: p.id, name: p.name, sub: roleOf(p.id), avatarSeed: p.profile?.avatarSeed, slug: p.profile?.slug })),
  ];
  const contacts = (
    <Section title="Crew & Kontakt">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
            <UserAvatar name={p.name} seed={p.avatarSeed} className="size-11" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}{p.id === user.id && <span className="text-muted-foreground"> (du)</span>}</p>
              <p className="truncate text-xs text-muted-foreground">{p.sub}</p>
              <div className="mt-1 flex gap-3 text-xs">
                {p.slug && <Link href={`/mitglieder/${p.slug}`} className="text-primary underline-offset-4 hover:underline">Profil</Link>}
                {isMember && p.id !== user.id && (
                  <Link href={`/projekte/${project.id}?tab=chat`} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                    <Send className="size-3" aria-hidden /> Nachricht
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {crewPeople.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Noch niemand hat zugesagt – die Crew erscheint hier, sobald Rollen besetzt sind.</p>}
    </Section>
  );

  const contract = (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Vertrag">
        {project.contracts.length ? (
          <ul className="space-y-3">
            {project.contracts.map((c) => (
              <li key={c.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{CONTRACT_TEMPLATES[c.template]?.title ?? c.template} · Vergütung {formatEur(c.compensation)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={c.signedA ? "default" : "outline"}>{c.signedA ? "✓ " : ""}Auftraggeber:in {c.signedA ? "unterschrieben" : "offen"}</Badge>
                  <Badge variant={c.signedB ? "default" : "outline"}>{c.signedB ? "✓ " : ""}Crew {c.signedB ? "unterschrieben" : "offen"}</Badge>
                </div>
                <Button asChild variant="link" className="mt-1 h-auto px-0">
                  <Link href={`/finanzen/vertraege/${c.id}`}>{c.signedA && c.signedB ? "Vertrag ansehen" : "Vertrag ansehen & unterschreiben"} <ArrowRight aria-hidden /></Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={FileText} title="Noch kein Vertrag" description="Der Vertrag wird automatisch erstellt, sobald alle Rollen besetzt sind." />
        )}
      </Section>
      <Section
        title="Zahlung"
        action={<Button asChild variant="outline" size="sm"><Link href="/finanzen"><Wallet aria-hidden /> Alle Finanzen</Link></Button>}
      >
        {project.payments.length ? (
          <>
            <ul className="space-y-3">
              {project.payments.map((p) => (
                <li key={p.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.payee?.name ?? "Crew"} · {formatEur(p.amount)}</p>
                    </div>
                    <StatusBadge status={p.status} kind="payment" />
                  </div>
                  <div className="mt-2 overflow-x-auto"><PaymentFlow status={p.status} /></div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt>Honorare</dt><dd className="tabular-nums">{formatEur(paySum)}</dd></div>
              <div className="flex justify-between"><dt>{project.type === "managed" ? "Managed-Crew-Marge" : "Servicegebühr"} (separat)</dt><dd className="tabular-nums">{formatEur(feeSum)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Gesamt</dt><dd className="tabular-nums">{formatEur(paySum + feeSum)}</dd></div>
            </dl>
          </>
        ) : (
          <EmptyState icon={Wallet} title="Noch keine Zahlung" description="Sobald die Crew steht, wird die Zahlung beim Zahlungsdienstleister reserviert (Mock)." />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Geld liegt beim lizenzierten Zahlungsdienstleister, nicht bei Creative Connect. Ablauf: reserviert → freigegeben nach Abnahme → ausgezahlt. Für Honorare an Künstler:innen kann Künstlersozialabgabe ({String(fees.kskRatePct).replace(".", ",")} %) anfallen – kein Rechtsrat.
        </p>
      </Section>
    </div>
  );

  const acceptance = (
    <div className="flex flex-col gap-4">
      <AcceptancePanel
        projectId={project.id}
        isOwner={isOwner}
        canAccept={isOwner && ["produktion", "abnahme"].includes(project.status)}
        completed={completed}
        reviewTargets={isMember ? reviewTargets : []}
        canReport={(isOwner || isCrew) && !["entwurf", "storniert"].includes(project.status)}
      />
      {project.disputes.length > 0 && (
        <Section title="Gemeldete Probleme">
          <ul className="space-y-3">
            {project.disputes.map((d) => (
              <li key={d.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{d.openedBy}</p>
                  <Badge variant={d.status === "geloest" ? "secondary" : "destructive"}>{DISPUTE_LABEL[d.status] ?? d.status}</Badge>
                </div>
                <p className="mt-1">{d.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(d.createdAt)}{d.resolution ? ` · Entscheidung: ${d.resolution}` : ""}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );

  const tabs = [
    { value: "uebersicht", label: "Übersicht", content: overview },
    { value: "crew", label: "Crew", content: crewTab },
    { value: "zeitplan", label: "Zeitplan", content: timeline },
    { value: "chat", label: `Chat (${project.messages.length})`, content: chat },
    { value: "dateien", label: "Dateien", content: files },
    { value: "kontakt", label: "Crew & Kontakt", content: contacts },
    { value: "vertrag", label: "Vertrag & Zahlung", content: contract },
    { value: "abnahme", label: "Abnahme", content: acceptance },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="relative h-32 bg-muted sm:h-44">
          <StockImage seed={project.coverSeed} w={1400} h={400} priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
        </div>
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          <nav aria-label="Brotkrumen" className="text-xs text-muted-foreground">
            <Link href="/projekte" className="hover:text-foreground">Projekte</Link> / <span>{project.title}</span>
          </nav>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-2xl font-bold sm:text-3xl">{project.title}</h1>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={project.status} />
              <TypeBadge type={project.type} />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{project.city}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" aria-hidden />{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
            <span className="inline-flex items-center gap-1"><Wallet className="size-4" aria-hidden />{formatEur(project.budget)}</span>
            <span>{isOwner ? "Du bist Auftraggeber:in" : isCrew ? `Du bist dabei als ${roleOf(user.id)}` : `Auftraggeber:in: ${ownerName}`}</span>
          </div>
          {!isOwner && !isCrew && isRequested && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
              Du bist für dieses Projekt angefragt ({project.roles.filter((r) => r.requests.some((q) => q.creativeId === user.id)).map((r) => `${r.title}, ${categoryName(r.category)}`).join("; ")}). Antworten kannst du in deinem <Link href="/dashboard" className="text-primary underline">Dashboard</Link>.
            </p>
          )}
        </div>
      </div>
      <ProjectTabs tabs={tabs} />
    </div>
  );
}
