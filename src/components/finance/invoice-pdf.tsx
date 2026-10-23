// Rechnungs-PDF (server-seitig mit @react-pdf/renderer, nur im Route Handler verwenden)
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export interface InvoicePdfData {
  number: string;
  issuedAt: Date;
  issuer: string;
  recipient: string;
  projectTitle?: string | null;
  items: { label: string; amount: number }[];
  net: number;
  vatRate: number;
}

const SENDER = {
  name: "Creative Connect GmbH (Demo)",
  street: "Musterstraße 12",
  city: "04109 Leipzig",
  mail: "rechnungen@creative-connect.demo",
  taxId: "USt-IdNr. DE000000000 (fiktiv)",
};

const eur = (v: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(v);
const date = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

const VIOLET = "#7c3aed";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.4 },
  demo: { backgroundColor: "#f5f3ff", color: VIOLET, padding: 6, fontSize: 9, textAlign: "center", marginBottom: 24, borderRadius: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brand: { fontSize: 18, fontWeight: "bold", color: VIOLET, lineHeight: 1.2, marginBottom: 4 },
  small: { fontSize: 8, color: MUTED },
  senderLine: { fontSize: 7, color: MUTED, marginBottom: 6, textDecoration: "underline" },
  recipient: { fontSize: 11 },
  metaBox: { width: 190 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  title: { fontSize: 16, fontWeight: "bold", lineHeight: 1.2, marginTop: 28, marginBottom: 4 },
  tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#111827", paddingBottom: 4, marginTop: 16, fontWeight: "bold" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 6 },
  colPos: { width: 30 },
  colLabel: { flex: 1 },
  colAmount: { width: 100, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 230 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTopWidth: 1.5, borderTopColor: "#111827", fontWeight: "bold", fontSize: 12 },
  note: { marginTop: 32, padding: 10, borderWidth: 1, borderColor: LINE, borderRadius: 4, fontSize: 9, color: "#374151" },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: MUTED },
});

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const vat = Math.round(data.net * data.vatRate) / 100;
  const gross = data.net + vat;
  return (
    <Document title={`Rechnung ${data.number}`} author={SENDER.name} language="de">
      <Page size="A4" style={s.page}>
        <Text style={s.demo}>Demo – fiktive Rechnung. Keine echte Zahlungsaufforderung.</Text>

        <View style={s.header}>
          <View>
            <Text style={s.brand}>Creative Connect</Text>
            <Text style={s.small}>{data.issuer}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.small}>{SENDER.name}</Text>
            <Text style={s.small}>{SENDER.street}</Text>
            <Text style={s.small}>{SENDER.city}</Text>
            <Text style={s.small}>{SENDER.mail}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={s.senderLine}>
              {SENDER.name} · {SENDER.street} · {SENDER.city}
            </Text>
            <Text style={s.recipient}>{data.recipient}</Text>
          </View>
          <View style={s.metaBox}>
            <View style={s.metaRow}>
              <Text style={{ color: MUTED }}>Rechnungsnummer</Text>
              <Text>{data.number}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={{ color: MUTED }}>Rechnungsdatum</Text>
              <Text>{date(data.issuedAt)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={{ color: MUTED }}>Leistungsdatum</Text>
              <Text>{date(data.issuedAt)}</Text>
            </View>
          </View>
        </View>

        <Text style={s.title}>Rechnung {data.number}</Text>
        {data.projectTitle && <Text style={{ color: MUTED }}>Projekt: {data.projectTitle}</Text>}

        <View style={s.tableHead}>
          <Text style={s.colPos}>Pos.</Text>
          <Text style={s.colLabel}>Leistung</Text>
          <Text style={s.colAmount}>Betrag netto</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={s.row} wrap={false}>
            <Text style={s.colPos}>{i + 1}</Text>
            <Text style={s.colLabel}>{item.label}</Text>
            <Text style={s.colAmount}>{eur(item.amount)}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>Summe netto</Text>
            <Text>{eur(data.net)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>zzgl. USt {data.vatRate} %</Text>
            <Text>{eur(vat)}</Text>
          </View>
          <View style={s.grand}>
            <Text>Gesamtbetrag brutto</Text>
            <Text>{eur(gross)}</Text>
          </View>
        </View>

        <View style={s.note}>
          <Text>
            Die Zahlung wird über unseren lizenzierten Zahlungsdienstleister abgewickelt und ist bereits reserviert. Das Geld liegt
            beim Zahlungsdienstleister, nicht bei Creative Connect, und wird nach Abnahme an die Crew ausgezahlt. Kreative erhalten
            ihr volles Honorar (0 % Provision); die Servicegebühr ist separat ausgewiesen.
          </Text>
          <Text style={{ marginTop: 6, fontWeight: "bold" }}>Demo – fiktive Rechnung. Alle Angaben sind erfunden.</Text>
        </View>

        <View style={s.footer} fixed>
          <Text>
            {SENDER.name} · {SENDER.taxId}
          </Text>
          <Text>Demo – fiktive Rechnung</Text>
        </View>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(data: InvoicePdfData) {
  return renderToBuffer(InvoiceDocument({ data }));
}
