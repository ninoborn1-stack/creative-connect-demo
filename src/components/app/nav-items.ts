import {
  BookOpen, Building2, CalendarDays, FolderKanban, Gauge, HandCoins, LayoutDashboard, Mail, MessagesSquare, Shield,
  Sparkles, UserPlus, Users, Wrench,
} from "lucide-react";

export const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
];

export const MOBILE_NAV = [MAIN_NAV[0], MAIN_NAV[1], MAIN_NAV[2], MAIN_NAV[3]];
