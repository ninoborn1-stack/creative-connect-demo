import {
  BookOpen, Briefcase, Building, Building2, CalendarDays, CalendarHeart, ClipboardCheck, Download, FileMusic, FolderKanban, Gauge, Gem,
  HandCoins, LayoutDashboard, Mail, MessagesSquare, Network, Shield, Sparkles, UserPlus, Users, Wrench,
} from "lucide-react";

// Corporate-Ausrichtung: Unternehmen ↔ Kreative (Ausschreibungen, Licensing, Netzwerk) zuerst,
// die Community (Sessions mit Nesto, Punkte, Feed …) als eigener Bereich für Mitglieder.
export const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ausschreibungen", label: "Ausschreibungen", short: "Jobs", icon: Briefcase },
  { href: "/lizenzen", label: "Lizenz-Katalog", short: "Lizenzen", icon: FileMusic },
  { href: "/unternehmen", label: "Unternehmen", icon: Building },
  { href: "/mitglieder", label: "Talente", icon: Users },
  { href: "/netzwerk", label: "Mein Netzwerk", short: "Netzwerk", icon: Network },
  { href: "/briefing", label: "Briefing-Assistent", short: "Briefing", icon: Sparkles },
  { href: "/projekte", label: "Projekte", icon: FolderKanban },
  { href: "/studios", label: "Studios & Locations", short: "Studios", icon: Building2 },
  { href: "/finanzen", label: "Verträge & Zahlungen", short: "Finanzen", icon: HandCoins },
];

export const COMMUNITY_NAV = [
  { href: "/sessions", label: "Sessions mit Nesto", icon: CalendarHeart },
  { href: "/punkte", label: "Punkte & Belohnungen", icon: Gem },
  { href: "/community", label: "Feed", icon: MessagesSquare },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/wissen", label: "Wissen", icon: BookOpen },
  { href: "/equipment", label: "Equipment-Börse", icon: Wrench },
  { href: "/einladen", label: "Einladen", icon: UserPlus },
];

export const SYSTEM_NAV = [{ href: "/outbox", label: "Outbox (Demo-Mails)", icon: Mail }];

export const ADMIN_NAV = [
  { href: "/admin", label: "KPIs", icon: Gauge },
  { href: "/admin/bewerbungen", label: "Bewerbungen", icon: ClipboardCheck },
  { href: "/admin/unternehmen", label: "Unternehmen", icon: Building },
  { href: "/admin/mitglieder", label: "Mitglieder", icon: Users },
  { href: "/admin/einladungen", label: "Einladungen", icon: UserPlus },
  { href: "/admin/managed", label: "Managed Crews", icon: FolderKanban },
  { href: "/admin/streitfaelle", label: "Streitfälle", icon: Shield },
  { href: "/admin/einstellungen", label: "Einstellungen", icon: Wrench },
  { href: "/admin/exporte", label: "Exporte", icon: Download },
];

// Mobil: Dashboard, Ausschreibungen, Lizenzen, Projekte (+ Community in app-shell); Rest über das Menü
export const MOBILE_NAV = ["/dashboard", "/ausschreibungen", "/lizenzen", "/projekte"].map((href) => MAIN_NAV.find((i) => i.href === href)!);
