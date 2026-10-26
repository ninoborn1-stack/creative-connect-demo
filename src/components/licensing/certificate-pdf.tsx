// Lizenzzertifikat-PDF (server-seitig mit @react-pdf/renderer, nur im Route Handler verwenden)
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export interface CertificatePdfData {
  number: string;
  issuedAt: Date;
  licensee: string;
  company?: string | null;
  workTitle: string;
  workType: string;
  creator: string;
  tier: string;
  media: string[];
  territory: string;
  validUntil: string; // "TT.MM.JJJJ" oder "unbefristet"
  projectName: string;
  price: number;
  serviceFee: number;
  aiMarked: boolean;
  status: string;
}

const eur = (v: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(v);
const date = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

// PDF kennt keine CSS-Tokens – Bordeaux als feste Druckfarbe
const BORDEAUX = "#7b1e2e";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.4 },
  demo: { backgroundColor: "#fbeff1", color: BORDEAUX, padding: 6, fontSize: 9, textAlign: "center", marginBottom: 24, borderRadius: 4 },
  frame: { borderWidth: 1.5, borderColor: BORDEAUX, borderRadius: 6, padding: 24 },
  brand: { fontSize: 12, fontWeight: "bold", color: BORDEAUX, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: "bold", lineHeight: 1.2, marginTop: 10 },
  subtitle: { fontSize: 10, color: MUTED, marginTop: 2, marginBottom: 18 },
  work: { fontSize: 15, fontWeight: "bold", marginBottom: 2 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 6 },
  label: { width: 150, color: MUTED },
  value: { flex: 1 },
  priceBox: { marginTop: 16, flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f9fafb", padding: 10, borderRadius: 4 },
  note: { marginTop: 18, fontSize: 8.5, color: "#374151" },
  sig: { marginTop: 28, flexDirection: "row", justifyContent: "space-between" },
  sigBox: { width: 200, borderTopWidth: 1, borderTopColor: "#111827", paddingTop: 4, fontSize: 8, color: MUTED },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: MUTED },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row} wrap={false}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

export function CertificateDocument({ data }: { data: CertificatePdfData }) {
  return (
    <Document title={`Lizenzzertifikat ${data.number}`} author="Creative Connect (Demo)" language="de">
      <Page size="A4" style={s.page}>
        <Text style={s.demo}>Demo – fiktives Lizenzzertifikat. Keine echte Rechteeinräumung.</Text>
        <View style={s.frame}>
          <Text style={s.brand}>CREATIVE CONNECT · LIZENZ-KATALOG</Text>
          <Text style={s.title}>Lizenzzertifikat</Text>
          <Text style={s.subtitle}>
            Nr. {data.number} · ausgestellt am {date(data.issuedAt)}
            {data.status !== "aktiv" ? ` · Status: ${data.status}` : ""}
          </Text>

          <Text style={s.work}>„{data.workTitle}“</Text>
          <Text style={{ color: MUTED, marginBottom: 12 }}>
            {data.workType} von {data.creator}
          </Text>

          <Row label="Lizenznehmer:in" value={data.licensee} />
          <Row label="Firma" value={data.company || "– (persönliche Lizenz)"} />
          <Row label="Urheber:in / Lizenzgeber:in" value={data.creator} />
          <Row label="Lizenzstufe" value={data.tier} />
          <Row label="Medien" value={data.media.join(", ")} />
          <Row label="Gebiet" value={data.territory} />
          <Row label="Laufzeit" value={data.validUntil === "unbefristet" ? "unbefristet" : `${date(data.issuedAt)} bis ${data.validUntil}`} />
          <Row label="Projekt" value={data.projectName} />
          <Row label="Exklusivität" value={data.tier.startsWith("Exklusiv") ? "Exklusiv – keine weiteren Lizenzen ab Ausstellungsdatum" : "Nicht exklusiv (einfaches Nutzungsrecht)"} />
          <Row label="KI-Kennzeichnung" value={data.aiMarked ? "Mit KI-Unterstützung erstellt (Art. 50 EU AI Act)" : "Ohne generative KI erstellt (Angabe Urheber:in)"} />

          <View style={s.priceBox}>
            <View>
              <Text style={{ color: MUTED }}>Lizenzgebühr (netto, 100 % an Urheber:in)</Text>
              <Text style={{ color: MUTED, marginTop: 2 }}>Servicegebühr Plattform (separat)</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "bold" }}>{eur(data.price)}</Text>
              <Text style={{ marginTop: 2 }}>{eur(data.serviceFee)}</Text>
            </View>
          </View>

          <Text style={s.note}>
            Die:der Urheber:in räumt der:dem Lizenznehmer:in das oben beschriebene Nutzungsrecht am Werk für das genannte Projekt ein. Eine
            Weitergabe an Dritte, Bearbeitung über übliche Anpassungen (Schnitt, Längen, Mix) hinaus oder Nutzung außerhalb von Medien, Gebiet und
            Laufzeit bedarf einer gesonderten Lizenz. Die Lizenznummer dient als Nachweis gegenüber Plattformen, Sendern und Verwertungsgesellschaften.
          </Text>
          <Text style={[s.note, { fontWeight: "bold", marginTop: 6 }]}>Demo – fiktiv. Alle Angaben sind erfunden.</Text>

          <View style={s.sig}>
            <Text style={s.sigBox}>Creative Connect (Demo) – digital ausgestellt</Text>
            <Text style={s.sigBox}>Prüfbar unter Lizenznummer {data.number}</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>Creative Connect GmbH (Demo) · Musterstraße 12 · 04109 Leipzig</Text>
          <Text>Demo – fiktives Zertifikat</Text>
        </View>
      </Page>
    </Document>
  );
}

export function renderCertificatePdf(data: CertificatePdfData) {
  return renderToBuffer(CertificateDocument({ data }));
}
