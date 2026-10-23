// Gemeinsame Konstanten des Admin-Bereichs (Client + Server).

// Sperrgründe orientieren sich an den Sperrkriterien der AGB (P2B-Verordnung: transparente Sperrgründe).
export const BLOCK_REASONS = [
  { key: "fake", label: "Fake-Profil" },
  { key: "umgehung", label: "Umgehung der Plattform" },
  { key: "belaestigung", label: "Belästigung" },
  { key: "zahlungsbetrug", label: "Zahlungsbetrug" },
  { key: "sonstiges", label: "Sonstiges" },
] as const;

export const MEMBER_STATUS = [
  { key: "eingeladen", label: "Eingeladen" },
  { key: "aktiv", label: "Aktiv" },
  { key: "verifiziert", label: "Verifiziert" },
  { key: "gesperrt", label: "Gesperrt" },
] as const;

export const MEMBER_STATUS_TONE: Record<string, string> = {
  eingeladen: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  aktiv: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  verifiziert: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  gesperrt: "bg-destructive/15 text-destructive",
};

export const DISPUTE_STATUS = [
  { key: "offen", label: "Offen" },
  { key: "in_pruefung", label: "In Prüfung" },
  { key: "geloest", label: "Gelöst" },
] as const;

export const DISPUTE_STATUS_TONE: Record<string, string> = {
  offen: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  in_pruefung: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  geloest: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

export const DISPUTE_RESOLUTION_LABEL: Record<string, string> = {
  freigegeben: "Zahlung freigegeben",
  erstattet: "Zahlung erstattet",
  teilerstattet: "Teilerstattung 50 %",
};

export const INVITE_STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  eingeloest: "Eingelöst",
  abgelaufen: "Abgelaufen",
  freigabe: "Wartet auf Freigabe",
};

export const INVITE_STATUS_TONE: Record<string, string> = {
  offen: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  eingeloest: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  abgelaufen: "bg-muted text-muted-foreground",
  freigabe: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
};

export const WAITLIST_STATUS_LABEL: Record<string, string> = {
  wartend: "Wartend",
  eingeladen: "Eingeladen",
  abgelehnt: "Abgelehnt",
};

export const DEFAULT_INVITE_QUOTA = 5;

// Businessplan 2026 – Ziele Jahr 1 (Plan-Annahmen)
export const PLAN_YEAR1 = { activeMembers: 400, selfServiceVolume: 150_000, managedCrews: 6 };

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };
