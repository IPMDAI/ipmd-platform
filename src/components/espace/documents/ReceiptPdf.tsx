import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { OFFICIAL_LEGAL_LINES } from "@/lib/doc-format";
import { receiptDetailRows, type ReceiptModel } from "@/lib/receipt";

function fcfaPdf(n: number): string {
  return `${String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
}

const RED = "#e01228";
const BLACK = "#0b0b0d";
const MUTED = "#6b7280";

const s = StyleSheet.create({
  page: { fontSize: 10.5, color: "#1f2937", lineHeight: 1.5 },
  bar: { height: 6, backgroundColor: RED },
  body: { paddingHorizontal: 44, paddingTop: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
  },
  brand: { fontSize: 15, fontWeight: 700, color: BLACK },
  brandSub: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 },
  right: { textAlign: "right" },
  rcpNo: { fontSize: 9, color: MUTED },
  title: { marginTop: 16, textAlign: "center", fontSize: 16, fontWeight: 700, color: BLACK },
  subtitle: { textAlign: "center", fontSize: 9, color: MUTED, marginTop: 2 },
  table: { marginTop: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eef0f3" },
  rowLast: { flexDirection: "row" },
  cellL: { width: "38%", padding: 7, color: MUTED, backgroundColor: "#f6f7f9" },
  cellR: { width: "62%", padding: 7, color: BLACK, fontWeight: 700 },
  amountBox: {
    marginTop: 16,
    backgroundColor: "#0b0b0d",
    borderRadius: 6,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLbl: { fontSize: 8, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.6 },
  amountVal: { fontSize: 18, fontWeight: 700, color: "#ffffff" },
  legal: { marginTop: 22, fontSize: 7, color: "#9ca3af", textAlign: "center", lineHeight: 1.4 },
  foot: { marginTop: 8, fontSize: 7.5, color: MUTED, textAlign: "center" },
});

function ReceiptDocument({ m }: { m: ReceiptModel }) {
  const rows = receiptDetailRows(m);
  return (
    <Document title={`Reçu ${m.receiptNumber}`}>
      <Page size="A4" style={s.page}>
        <View style={s.bar} />
        <View style={s.body}>
          <View style={s.header}>
            <View>
              <Text style={s.brand}>IPMD</Text>
              <Text style={s.brandSub}>Institut Polytechnique des Métiers du Digital</Text>
            </View>
            <View style={s.right}>
              <Text style={s.rcpNo}>Reçu N° {m.receiptNumber}</Text>
            </View>
          </View>

          <Text style={s.title}>Reçu de paiement</Text>
          <Text style={s.subtitle}>Document officiel — à conserver</Text>

          <View style={s.table}>
            {rows.map((r, i) => (
              <View key={i} style={i === rows.length - 1 ? s.rowLast : s.row}>
                <Text style={s.cellL}>{r.label}</Text>
                <Text style={s.cellR}>{r.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.amountBox}>
            <Text style={s.amountLbl}>Montant payé</Text>
            <Text style={s.amountVal}>{fcfaPdf(m.amount)}</Text>
          </View>

          <Text style={s.legal}>{OFFICIAL_LEGAL_LINES.join("  •  ")}</Text>
          <Text style={s.foot}>
            IPMD — scolarite@ipmd.pro · Reçu généré automatiquement, un seul numéro par paiement.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** Génère le reçu (Buffer PDF) depuis le modèle partagé. */
export function renderReceiptPdf(m: ReceiptModel): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument m={m} />);
}
