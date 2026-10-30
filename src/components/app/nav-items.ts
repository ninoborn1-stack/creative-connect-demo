import {
  BookOpen, Briefcase, Building, Building2, CalendarDays, CalendarHeart, ClipboardCheck, Download, FileMusic, Flame, FolderKanban, Gauge, Gem,
  HandCoins, LayoutDashboard, Mail, MessagesSquare, Network, Package, Shield, Sparkles, UserPlus, Users, Wrench, type LucideIcon,
} from "lucide-react";
import { isOn, type Feature } from "@/lib/features";

type NavItem = { href: string; label: string; short?: string; icon: LucideIcon; feature?: Feature };

// Ausbaustufe 1: Pakete, Artists anfragen, eigene Projekte – weitere Bereiche schaltet src/lib/features.ts frei.
export const MAIN_NAV = ([
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entdecken", label: "Entdecken", icon: Flame, feature: "entdecken" },
  { href: "/paket-anfrage", label: "Pakete", icon: Package },
  { href: "/mitglieder", label: "Artists", icon: Users },
  { href: "/projekte", label: "Meine Projekte", short: "Projekte", icon: FolderKanban },
  { href: "/ausschreibungen", label: "Ausschreibungen", short: "Jobs", icon: Briefcase, feature: "ausschreibungen" },
  { href: "/lizenzen", label: "Musik & Stock", short: "Musik", icon: FileMusic, feature: "musik" },
  { href: "/unternehmen", label: "Unternehmen", icon: Building, feature: "unternehmen" },
  { href: "/netzwerk", label: "Mein Netzwerk", short: "Netzwerk", icon: Network, feature: "netzwerk" },
  { href: "/briefing", label: "Briefing-Assistent", short: "Briefing", icon: Sparkles, feature: "briefing" },
  { href: "/studios", label: "Studios & Locations", short: "Studios", icon: Building2, feature: "studios" },
  { href: "/finanzen", label: "Verträge & Zahlungen", short: "Finanzen", icon: HandCoins, feature: "finanzen" },
] satisfies NavItem[] as NavItem[]).filter((i) => isOn(i.feature));

export const COMMUNITY_NAV = ([
  { href: "/punkte", label: "Punkte & Vorteile", icon: Gem },
  { href: "/sessions", label: "Sessions mit Nesto", icon: CalendarHeart, feature: "sessions" },
  { href: "/community", label: "Feed", icon: MessagesSquare, feature: "feed" },
  { href: "/events", label: "Events", icon: CalendarDays, feature: "events" },
  { href: "/wissen", label: "Wissen", icon: BookOpen, feature: "wissen" },
  { href: "/equipment", label: "Equipment-Börse", icon: Wrench, feature: "equipment" },
  { href: "/einladen", label: "Einladen", icon: UserPlus, feature: "einladen" },
] satisfies NavItem[] as NavItem[]).filter((i) => isOn(i.feature));

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

// Mobil: Start, Entdecken und die Start-Funktionen; Rest (Punkte, Musik, Studios …) über das Menü
export const MOBILE_NAV = MAIN_NAV.slice(0, 5);
