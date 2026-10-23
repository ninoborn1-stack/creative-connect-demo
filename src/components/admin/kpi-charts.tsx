"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type MonthPoint = {
  label: string;
  activeMembers: number;
  volume: number;
  serviceFees: number;
  proRevenue: number;
  managedMargin: number;
};

const nf = new Intl.NumberFormat("de-DE");
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurCompact = (v: number) => (Math.abs(v) >= 1000 ? `${nf.format(Math.round(v / 100) / 10)} T€` : `${nf.format(v)} €`);

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };
const grid = <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />;

type TipItem = { dataKey?: unknown; name?: unknown; value?: unknown; color?: string };
type TipProps = { active?: boolean; payload?: readonly TipItem[]; label?: unknown };

function ChartTooltip({ active, payload, label, money }: TipProps & { money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {label != null && <p className="mb-1 font-medium">{String(label)}</p>}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: p.color }} aria-hidden />
            <span className="text-muted-foreground">{String(p.name)}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums">{money ? eur.format(Number(p.value)) : nf.format(Number(p.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendText(value: string) {
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

const H = "h-64 w-full sm:h-72";

export function MembersChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className={H} role="img" aria-label="Aktive Mitglieder der letzten 12 Monate">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="membersFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {grid}
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => nf.format(v)} />
          <Tooltip content={(p: TipProps) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} />} cursor={{ stroke: "var(--border)" }} />
          <Area type="monotone" dataKey="activeMembers" name="Aktive Mitglieder" stroke="var(--chart-1)" strokeWidth={2} fill="url(#membersFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VolumeChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className={H} role="img" aria-label="Vermitteltes Volumen und Servicegebühren der letzten 12 Monate">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barGap={2}>
          {grid}
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={56} tickFormatter={eurCompact} />
          <Tooltip content={(p: TipProps) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} money />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Legend formatter={LegendText} iconType="square" iconSize={10} />
          <Bar dataKey="volume" name="Volumen" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="serviceFees" name="Servicegebühren" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueMixChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className={H} role="img" aria-label="Erlösmix der letzten 12 Monate">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
          {grid}
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={56} tickFormatter={eurCompact} />
          <Tooltip content={(p: TipProps) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} money />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Legend formatter={LegendText} iconType="square" iconSize={10} />
          <Bar dataKey="serviceFees" stackId="mix" name="Servicegebühren" fill="var(--chart-2)" />
          <Bar dataKey="proRevenue" stackId="mix" name="Pro-Abos" fill="var(--chart-3)" />
          <Bar dataKey="managedMargin" stackId="mix" name="Managed-Marge" fill="var(--chart-4)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProjectStatusChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div style={{ height: Math.max(180, data.length * 40) }} className="w-full" role="img" aria-label="Projekte nach Status">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={axisTick} tickLine={false} axisLine={false} width={110} />
          <Tooltip content={(p: TipProps) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar
            dataKey="count"
            name="Projekte"
            fill="var(--chart-1)"
            radius={[0, 3, 3, 0]}
            barSize={18}
            label={{ position: "right", fill: "var(--foreground)", fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
