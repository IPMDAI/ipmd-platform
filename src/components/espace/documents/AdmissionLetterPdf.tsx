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
import { formatFCFA } from "@/lib/finance";
import { SCHEDULE_DISCLAIMER } from "@/lib/admission-letter";

export type AdmissionLetterPdfData = {
  name: string;
  program: string | null;
  level: string | null;
  academicYear: string | null;
  registrationFee: number;
  tuitionDue: number | null;
  longDate: string;
  logoSrc: string;
  signatoryTitle: string;
  signatoryName: string;
  testMode: boolean;
  qrSrc?: string;
  signatureSrc?: string;
  cachetSrc?: string;
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
  intro: { marginTop: 9 },
  nameBox: { marginTop: 7, backgroundColor: LIGHT, paddingVertical: 7, paddingHorizontal: 16, borderRadius: 6 },
  idLine: { fontSize: 12, color: BLACK },
  bold: { fontWeight: 700, color: BLACK },
  para: { marginTop: 7 },
  tableTitle: { marginTop: 9, fontSize: 9, fontWeight: 700, color: BLACK, textTransform: "uppercase", letterSpacing: 0.5 },
  table: { marginTop: 4, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eef0f2" },
  trLast: { flexDirection: "row" },
  tdKey: { width: "55%", padding: 4, color: MUTED },
  tdVal: { width: "45%", padding: 4, color: BLACK, fontWeight: 700, textAlign: "right" },
  disclaimer: {
    marginTop: 8,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 4,
    padding: 6,
    fontSize: 8.5,
    color: "#9a3412",
  },
  docs: { marginTop: 7, fontSize: 8, color: MUTED, lineHeight: 1.35 },
  docsNote: { marginTop: 3, fontSize: 7.5, fontStyle: "italic", color: MUTED, lineHeight: 1.35 },
  sigRow: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  qrWrap: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 300 },
  qr: { width: 72, height: 72 },
  qrTextCol: { flexShrink: 1 },
  qrTitle: { fontSize: 8.5, fontWeight: 700, color: BLACK },
  qrText: { fontSize: 8, color: "#9ca3af", maxWidth: 200 },
  sigRight: { alignItems: "center", maxWidth: 210 },
  faitTxt: { fontSize: 9.5, color: MUTED },
  sigStampRow: { marginTop: 4, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  sigImg: { width: 104, height: 42, objectFit: "contain" },
  cachetImg: { width: 56, height: 56, objectFit: "contain", opacity: 0.92 },
  sigTitle: { marginTop: 4, fontSize: 10, fontWeight: 700, color: BLACK, textAlign: "center" },
  sigName: { fontSize: 9, color: "#4b5563", textAlign: "center" },
  footer: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 6, paddingHorizontal: 40, textAlign: "center" },
  legal: { fontSize: 7, color: "#9ca3af", marginBottom: 1.2 },
  band: { backgroundColor: BLACK, paddingVertical: 6, textAlign: "center", marginTop: 6, marginBottom: 6 },
  bandTxt: { fontSize: 8, color: "#ffffffb3", letterSpacing: 1.4, textTransform: "uppercase" },
});

function AdmissionDocument({ d }: { d: AdmissionLetterPdfData }) {
  const total = d.registrationFee + (d.tuitionDue ?? 0);
  const rows: Array<[string, string]> = [
    ["Formation", d.program ?? "—"],
    ["Niveau", d.level ?? "—"],
    ["Année académique", d.academicYear ?? "—"],
    ["Frais d'inscription", formatFCFA(d.registrationFee)],
    ["Frais de scolarité (prévisionnel)", d.tuitionDue != null ? formatFCFA(d.tuitionDue) : "à préciser"],
    ["Total prévisionnel", formatFCFA(total)],
  ];

  return (
    <Document title={`Lettre d'admission — ${d.name}`} author="IPMD">
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
              <Text style={s.yearTxt}>Année {d.academicYear ?? "—"}</Text>
            </View>
          </View>

          <Text style={s.title}>Lettre d&apos;admission</Text>
          <View style={s.titleRule} />

          <Text style={s.intro}>
            L&apos;Institut Polytechnique des Métiers du Digital (IPMD) a le plaisir de confirmer l&apos;admission de :
          </Text>

          <View style={s.nameBox}>
            <Text style={s.idLine}>
              Nom et Prénoms : <Text style={s.bold}>{d.name}</Text>
            </Text>
          </View>

          <Text style={s.para}>
            Votre candidature a été <Text style={s.bold}>acceptée</Text>. Félicitations et bienvenue à l&apos;IPMD.
          </Text>

          <Text style={s.tableTitle}>Récapitulatif prévisionnel</Text>
          <View style={s.table}>
            {rows.map(([k, v], i) => (
              <View key={k} style={i === rows.length - 1 ? s.trLast : s.tr}>
                <Text style={s.tdKey}>{k}</Text>
                <Text style={s.tdVal}>{v}</Text>
              </View>
            ))}
          </View>
          <Text style={s.disclaimer}>⚠ {SCHEDULE_DISCLAIMER}</Text>

          <Text style={s.para}>
            <Text style={s.bold}>Prochaine étape :</Text> vous recevrez ensuite votre pack d&apos;admission complet, avec les documents à consulter/valider et les modalités de paiement.
          </Text>

          <Text style={s.docs}>
            Documents d&apos;admission : lettre d&apos;admission, proforma/frais et
            échéancier, règlement intérieur, convention de formation, conditions
            financières, politique de remboursement et confidentialité ; documents
            complémentaires selon le parcours ou la situation du candidat.
          </Text>
          <Text style={s.docsNote}>
            Ces documents font partie de votre dossier d&apos;admission et doivent
            être consultés avant l&apos;inscription définitive. Si l&apos;un d&apos;eux
            est indisponible dans votre espace, contactez l&apos;IPMD avant de
            finaliser votre inscription.
          </Text>

          <View style={s.sigRow}>
            <View style={s.qrWrap}>
              {d.qrSrc ? <Image src={d.qrSrc} style={s.qr} /> : null}
              <View style={s.qrTextCol}>
                <Text style={s.qrTitle}>Vérifier l&apos;authenticité</Text>
                <Text style={s.qrText}>Scannez ce QR code — signé numériquement par l&apos;IPMD · ipmd.pro/verifier</Text>
              </View>
            </View>
            <View style={s.sigRight}>
              <Text style={s.faitTxt}>Fait à Abidjan, le {d.longDate}</Text>
              <View style={s.sigStampRow}>
                {d.signatureSrc ? <Image src={d.signatureSrc} style={s.sigImg} /> : null}
                {d.cachetSrc ? <Image src={d.cachetSrc} style={s.cachetImg} /> : null}
              </View>
              <Text style={s.sigTitle}>{d.signatoryTitle}</Text>
              <Text style={s.sigName}>{d.signatoryName}</Text>
            </View>
          </View>
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

/** Génère la lettre d'admission (Buffer PDF). */
export function renderAdmissionLetterPdf(d: AdmissionLetterPdfData): Promise<Buffer> {
  return renderToBuffer(<AdmissionDocument d={d} />);
}
