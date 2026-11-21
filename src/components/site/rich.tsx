import { Fragment } from "react";
import { LEGAL } from "@/lib/brand";

// Kleiner Textbaustein für Rechtstexte: füllt {owner}, {company}, {email} usw. aus LEGAL und
// rendert [Text](https://…) als Link, **Text** fett und die E-Mail-Adresse als mailto-Link.
const VARS: Record<string, string> = {
  owner: LEGAL.owner, company: LEGAL.company, legalForm: LEGAL.legalForm, email: LEGAL.email,
  authorityName: LEGAL.supervisoryAuthority.name, authorityUrl: LEGAL.supervisoryAuthority.url,
};
export const fillLegal = (text: string) => text.replace(/\{(\w+)\}/g, (m, k: string) => VARS[k] ?? m);

const link = "underline underline-offset-4 hover:text-foreground";
const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

export function Rich({ text }: { text: string }) {
  const s = fillLegal(text);
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1]) out.push(<a key={m.index} href={m[2]} className={link} rel="noopener">{m[1]}</a>);
    else if (m[3]) out.push(<strong key={m.index} className="font-semibold text-foreground">{m[3]}</strong>);
    else out.push(<a key={m.index} href={`mailto:${m[4]}`} className={`${link} [overflow-wrap:anywhere]`}>{m[4]}</a>);
    last = m.index + m[0].length;
  }
  out.push(s.slice(last));
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}
