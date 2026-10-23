// „Markdown-light“-Renderer: Blöcke durch Leerzeile getrennt, Zeilen mit „## “ sind Zwischenüberschriften.
// Bewusst ohne dangerouslySetInnerHTML – Text wird nur als React-Text gerendert.
type Block = { kind: "h2"; text: string } | { kind: "p"; text: string } | { kind: "ul"; items: string[] };

export function parseArticle(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
      if (list.length) blocks.push({ kind: "ul", items: list });
      para = [];
      list = [];
    };
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith("## ")) {
        flush();
        blocks.push({ kind: "h2", text: t.slice(3).trim() });
      } else if (/^[-•*]\s+/.test(t)) {
        if (para.length) { blocks.push({ kind: "p", text: para.join(" ") }); para = []; }
        list.push(t.replace(/^[-•*]\s+/, ""));
      } else {
        if (list.length) { blocks.push({ kind: "ul", items: list }); list = []; }
        para.push(t);
      }
    }
    flush();
  }
  return blocks;
}

export function ArticleBody({ body }: { body: string }) {
  return (
    <div className="space-y-4 text-base leading-relaxed">
      {parseArticle(body).map((b, i) =>
        b.kind === "h2" ? (
          <h2 key={i} className="pt-4 text-xl font-semibold">{b.text}</h2>
        ) : b.kind === "ul" ? (
          <ul key={i} className="list-disc space-y-1 pl-5">{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
        ) : (
          <p key={i} className="text-foreground/90">{b.text}</p>
        ),
      )}
    </div>
  );
}
