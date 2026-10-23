// Gemeinsame Typen zwischen Briefing-Server-Actions und Client-Flow (nur serialisierbare Daten).

export type CrewSuggestion = {
  userId: string;
  name: string;
  slug: string;
  headline: string;
  city: string;
  avatarSeed: string;
  dayRateMin: number;
  dayRateMax: number;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  reasons: string[];
};

export type AnalyzedRole = {
  title: string;
  category: string;
  sharePct: number;
  budget: number;
  reason: string;
  suggestions: CrewSuggestion[];
};

export type AnalyzedBriefing = {
  source: "mock" | "claude";
  title: string;
  goal: string;
  format: string;
  dates: string;
  location: string;
  style: string;
  budget: number;
  startDate: string; // JJJJ-MM-TT
  endDate: string; // JJJJ-MM-TT
  roles: AnalyzedRole[];
};

export type CreateProjectInput = {
  rawText: string;
  source: "mock" | "claude";
  title: string;
  goal: string;
  format: string;
  dates: string;
  location: string;
  style: string;
  budget: number;
  startDate: string;
  endDate: string;
  mode: "self" | "managed";
  roles: { title: string; category: string; budget: number; selectedUserIds: string[] }[];
};
