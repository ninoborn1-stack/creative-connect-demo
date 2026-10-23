import { cn } from "@/lib/utils";
import { PLACEHOLDER_LABEL, contractSections, splitPlaceholders, type ContractValues } from "@/components/finance/contract-templates";

function Filled({ text, values, highlight }: { text: string; values: ContractValues; highlight?: boolean }) {
  return (
    <>
      {splitPlaceholders(text).map((part, i) => {
        if (!part.key) return <span key={i}>{part.text}</span>;
        const value = values[part.key] ?? part.text;
        if (!highlight) return <span key={i} className="font-medium">{value}</span>;
        return (
          <mark
            key={i}
            title={`Platzhalter: {{${part.key}}} – ${PLACEHOLDER_LABEL[part.key] ?? part.key}`}
            className="rounded bg-primary/15 px-1 py-0.5 font-medium text-primary ring-1 ring-primary/30 [box-decoration-break:clone]"
          >
            {value}
          </mark>
        );
      })}
    </>
  );
}

export function ContractDocument({
  template,
  values,
  highlight,
  children,
  className,
}: {
  template: string;
  values: ContractValues;
  highlight?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const sections = contractSections(template);
  return (
    <article
      className={cn(
        "mx-auto w-full max-w-3xl rounded-xl border bg-card px-5 py-8 text-card-foreground shadow-sm sm:px-12 sm:py-12",
        className,
      )}
      aria-label="Vertragsdokument"
    >
      <header className="border-b pb-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vertrag</p>
        <h2 className="mt-2 text-xl font-bold text-balance sm:text-2xl">
          <Filled text="{{title}}" values={values} highlight={highlight} />
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Stand: <Filled text="{{date}}" values={values} highlight={highlight} />
        </p>
      </header>

      <dl className="grid gap-4 border-b py-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Partei A – Auftraggeber:in</dt>
          <dd className="mt-1">
            <Filled text="{{partyA}}" values={values} highlight={highlight} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Partei B – Auftragnehmer:in</dt>
          <dd className="mt-1">
            <Filled text="{{partyB}}" values={values} highlight={highlight} />
          </dd>
        </div>
      </dl>

      <div className="space-y-6 py-6 font-serif text-[15px] leading-relaxed">
        {sections.map((section) => (
          <section key={section.heading}>
            <h3 className="mb-2 font-sans text-base font-semibold">{section.heading}</h3>
            <ol className="space-y-2">
              {section.paragraphs.map((p, i) => (
                <li key={i} className="flex gap-2">
                  {section.paragraphs.length > 1 && <span className="shrink-0 text-muted-foreground">({i + 1})</span>}
                  <p className="min-w-0 break-words">
                    <Filled text={p} values={values} highlight={highlight} />
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {children}
    </article>
  );
}
