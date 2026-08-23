import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { OFFICIAL_LEGAL_LINES } from "@/lib/doc-format";
import { SCHEDULE_DISCLAIMER } from "@/lib/admission-letter";
import type { ScheduleSnapshot } from "@/lib/admission-schedule";

/** Format monétaire FCFA avec espaces (groupage ASCII, sûr pour @react-pdf). */
function fcfaPdf(n: number): string {
  return `${String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
}

/** Date ISO (YYYY-MM-DD) → JJ/MM/AAAA. */
function frDate(d: string): string {
  const [y, m, j] = d.split("-");
  return j && m && y ? `${j}/${m}/${y}` : d;
}

export type EcheancierPdfData = {
  name: string;
  program: string | null;
  schedule: ScheduleSnapshot;
  longDate: string;
  logoSrc: string;
  testMode: boolean;
};

const RED = "#e01228";
const BLACK = "#0b0b0d";
const LIGHT = "#f6f7f9";
const MUTED = "#6b7280";

const s = StyleSheet.create({
  page: { fontSize: 10.5, color: "#1f2937", lineHeight: 1.5, flexDirection: "column" },
  bar: { height: 6, backgroundColor: RED },
  body: { paddingHorizontal: 40, paddingTop: 14, flexGrow: 1 },
  testBanner: {
    marginBottom: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 4,
    padding: 6,
    textAlign: "center",
  },
  testTxt: { fontSize: 8, color: "#b91c1c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 42, height: 42, objectFit: "contain" },
  brand: { fontSize: 14, fontWeight: 700, color: BLACK },
  brandSub: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 },
  brandLoc: { fontSize: 7.5, color: "#9ca3af" },
  headerRight: { textAlign: "right" },
  yearTxt: { fontSize: 8.5, color: MUTED },
  title: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
    textTransform: "uppercase",
    color: BLACK,
    letterSpacing: 1,
  },
  titleRule: { alignSelf: "center", marginTop: 5, width: 46, height: 3, backgroundColor: RED, borderRadius: 2 },
  nameBox: { marginTop: 9, backgroundColor: LIGHT, paddingVertical: 7, paddingHorizontal: 16, borderRadius: 6 },
  idLine: { fontSize: 11, color: BLACK },
  bold: { fontWeight: 700, color: BLACK },
  metaRow: { marginTop: 4, flexDirection: "row", flexWrap: "wrap", gap: 4 },
  metaTxt: { fontSize: 9, color: MUTED },
  sectionTitle: { marginTop: 12, fontSize: 9, fontWeight: 700, color: BLACK, textTransform: "uppercase", letterSpacing: 0.5 },
  recap: { marginTop: 4, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  recapRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eef0f2" },
  recapRowLast: { flexDirection: "row" },
  recapKey: { width: "60%", padding: 4, color: MUTED },
  recapVal: { width: "40%", padding: 4, color: BLACK, fontWeight: 700, textAlign: "right" },
  recapDiscount: { color: "#047857" },
  // Tableau échéancier
  table: { marginTop: 4, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  thead: { flexDirection: "row", backgroundColor: RED },
  th: { padding: 5, color: "#ffffff", fontWeight: 700, fontSize: 9 },
  trow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eef0f2" },
  trowAlt: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eef0f2", backgroundColor: LIGHT },
  ttotal: { flexDirection: "row", backgroundColor: "#111114" },
  td: { padding: 5, color: BLACK },
  tdMuted: { padding: 5, color: MUTED },
  tdTotal: { padding: 5, color: "#ffffff", fontWeight: 700 },
  cNum: { width: "22%" },
  cPct: { width: "16%", textAlign: "center" },
  cDate: { width: "32%" },
  cAmt: { width: "30%", textAlign: "right" },
  note: {
    marginTop: 8,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 4,
    padding: 6,
    fontSize: 8.5,
    color: "#9a3412",
  },
  disclaimer: { marginTop: 6, fontSize: 8, fontStyle: "italic", color: MUTED },
  footer: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 6, paddingHorizontal: 40, textAlign: "center" },
  legal: { fontSize: 7, color: "#9ca3af", marginBottom: 1.2 },
  band: { backgroundColor: BLACK, paddingVertical: 6, textAlign: "center", marginTop: 6, marginBottom: 6 },
  bandTxt: { fontSize: 8, color: "#ffffffb3", letterSpacing: 1.4, textTransform: "uppercase" },
});

function EcheancierDocument({ d }: { d: EcheancierPdfData }) {
  const sc = d.schedule;
  const comptant = sc.payment_option === "comptant";
  const remise = sc.tuition_official - sc.comptant_amount; // montant de la remise comptant
  // Somme EXACTE des tranches (depuis le snapshot, aucun recalcul).
  const sumInstallments = sc.installments.reduce((a, it) => a + Number(it.amount), 0);

  return (
    <Document title={`Échéancier — ${d.name}`} author="IPMD">
      <Page size="A4" style={s.page}>
        <View style={s.bar} />
        <View style={s.body}>
          {d.testMode ? (
            <View style={s.testBanner}>
              <Text style={s.testTxt}>Document de test — modèle en cours de validation</Text>
            </View>
          ) : null}

          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              {d.logoSrc ? <Image src={d.logoSrc} style={s.logo} /> : null}
              <View>
                <Text style={s.brand}>IPMD</Text>
                <Text style={s.brandSub}>Institut Polytechnique des Métiers du Digital</Text>
                <Text style={s.brandLoc}>Abidjan — Côte d&apos;Ivoire · ipmd.pro</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <Text style={s.yearTxt}>Année {sc.academic_year || "—"}</Text>
            </View>
          </View>

          <Text style={s.title}>Échéancier de paiement</Text>
          <View style={s.titleRule} />

          <View style={s.nameBox}>
            <Text style={s.idLine}>
              Nom et Prénoms : <Text style={s.bold}>{d.name}</Text>
            </Text>
            <View style={s.metaRow}>
              <Text style={s.metaTxt}>Formation : {d.program ?? "—"}</Text>
              <Text style={s.metaTxt}>· Niveau : {sc.level || "—"}</Text>
              <Text style={s.metaTxt}>· Année : {sc.academic_year || "—"}</Text>
              <Text style={s.metaTxt}>
                · Mode : {comptant ? "Paiement comptant" : "Paiement échelonné"}
              </Text>
            </View>
          </View>

          {/* Récapitulatif financier */}
          <Text style={s.sectionTitle}>Récapitulatif</Text>
          <View style={s.recap}>
            <View style={s.recapRow}>
              <Text style={s.recapKey}>Scolarité officielle</Text>
              <Text style={s.recapVal}>{fcfaPdf(sc.tuition_official)}</Text>
            </View>
            {comptant ? (
              <View style={s.recapRow}>
                <Text style={s.recapKey}>
                  Remise paiement comptant ({Math.round(sc.lump_sum_discount * 100)} %)
                </Text>
                <Text style={[s.recapVal, s.recapDiscount]}>− {fcfaPdf(remise)}</Text>
              </View>
            ) : null}
            <View style={s.recapRowLast}>
              <Text style={s.recapKey}>Scolarité à financer</Text>
              <Text style={s.recapVal}>{fcfaPdf(sc.tuition_net)}</Text>
            </View>
          </View>

          {/* Détail des versements */}
          <Text style={s.sectionTitle}>{comptant ? "Règlement" : "Échéancier (10 versements)"}</Text>
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, s.cNum]}>{comptant ? "Règlement" : "Tranche"}</Text>
              <Text style={[s.th, s.cPct]}>%</Text>
              <Text style={[s.th, s.cDate]}>Échéance</Text>
              <Text style={[s.th, s.cAmt]}>Montant</Text>
            </View>
            {sc.installments.map((it, i) => (
              <View key={it.seq} style={i % 2 === 1 ? s.trowAlt : s.trow}>
                <Text style={[s.td, s.cNum]}>
                  {comptant ? "Scolarité (comptant)" : `Tranche ${it.seq}/${sc.installments.length}`}
                </Text>
                <Text style={[s.tdMuted, s.cPct]}>{it.pct} %</Text>
                <Text style={[s.td, s.cDate]}>{frDate(it.due_date)}</Text>
                <Text style={[s.td, s.cAmt]}>{fcfaPdf(it.amount)}</Text>
              </View>
            ))}
            <View style={s.ttotal}>
              <Text style={[s.tdTotal, s.cNum]}>Total scolarité</Text>
              <Text style={[s.tdTotal, s.cPct]}>—</Text>
              <Text style={[s.tdTotal, s.cDate]}>
                {comptant ? `avant le ${frDate(sc.comptant_deadline)}` : ""}
              </Text>
              <Text style={[s.tdTotal, s.cAmt]}>{fcfaPdf(sumInstallments)}</Text>
            </View>
          </View>

          {/* Frais d'inscription séparés */}
          <Text style={s.note}>
            Frais d&apos;inscription : {fcfaPdf(sc.registration_fee)} — séparés de la scolarité, non
            inclus dans l&apos;échéancier ci-dessus{comptant ? " et non concernés par la remise" : ""},
            à régler pour confirmer votre place.
          </Text>

          <Text style={s.disclaimer}>⚠ {SCHEDULE_DISCLAIMER}</Text>
        </View>

        <View style={s.footer}>
          {OFFICIAL_LEGAL_LINES.map((l) => (
            <Text key={l} style={s.legal}>{l}</Text>
          ))}
        </View>
        <View style={s.band}>
          <Text style={s.bandTxt}>Ose. Agis. Impacte. — 80% de pratique</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Génère l'échéancier de paiement (Buffer PDF) depuis un snapshot figé. */
export function renderEcheancierPdf(d: EcheancierPdfData): Promise<Buffer> {
  return renderToBuffer(<EcheancierDocument d={d} />);
}
