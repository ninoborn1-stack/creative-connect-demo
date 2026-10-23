import "server-only";
import { db } from "@/lib/db";
import { DEFAULT_FEES, type MarketplaceMode } from "@/lib/constants";

export async function getMarketplaceMode(): Promise<MarketplaceMode> {
  const row = await db.setting.findUnique({ where: { key: "marketplaceMode" } });
  const value = row?.value;
  return value === "clients" || value === "open" ? value : "closed";
}

export async function getFees(): Promise<typeof DEFAULT_FEES> {
  const row = await db.setting.findUnique({ where: { key: "fees" } });
  if (!row) return DEFAULT_FEES;
  try {
    return { ...DEFAULT_FEES, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_FEES;
  }
}
