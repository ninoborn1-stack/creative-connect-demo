import {
  BookOpen, Download, Building2, CalendarDays, CalendarHeart, Gem, FolderKanban, Gauge, HandCoins, LayoutDashboard, Mail, MessagesSquare, Shield,
  Sparkles, UserPlus, Users, Wrench,
} from "lucide-react";

export const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions mit Nesto", short: "Sessions", icon: CalendarHeart },
  { href: "/punkte", label: "Punkte", icon: Gem },
  { href: "/mitglieder", label: "Mitglieder", icon: Users },
  { href: "/briefing", label: "Briefing-Assistent", short: "Briefing", icon: Sparkles },
  { href: "/projekte", label: "Projekte", icon: FolderKanban },
  { href: "/studios", label: "Studios & Locations", short: "Studios", icon: Building2 },
  { href: "/finanzen", label: "Verträge & Zahlungen", short: "Finanzen", icon: HandCoins },
];

export const COMMUNITY_NAV = [
  { href: "/community", label: "Feed", icon: MessagesSquare },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/wissen", label: "Wissen", icon: BookOpen },
  { href: "/equipment", label: "Equipment-Börse", icon: Wrench },
  { href: "/einladen", label: "Einladen", icon: UserPlus },
];

export const SYSTEM_NAV = [{ href: "/outbox", label: "Outbox (Demo-Mails)", icon: Mail }];

export const ADMIN_NAV = [
  { href: "/admin", label: "KPIs", icon: Gauge },
  { href: "/admin/mitglieder", label: "Mitglieder", icon: Users },
  { href: "/admin/einladungen", label: "Einladungen", icon: UserPlus },
  { href: "/admin/managed", label: "Managed Crews", icon: FolderKanban },
  { href: "/admin/streitfaelle", label: "Streitfälle", icon: Shield },
  { href: "/admin/einstellungen", label: "Einstellungen", icon: Wrench },
  { href: "/admin/exporte", label: "Exporte", icon: Download },
];

// Mobil: Dashboard, Sessions, Mitglieder, Projekte (+ Community in app-shell); Rest über das Menü
export const MOBILE_NAV = ["/dashboard", "/sessions", "/mitglieder", "/projekte"].map((href) => MAIN_NAV.find((i) => i.href === href)!);
