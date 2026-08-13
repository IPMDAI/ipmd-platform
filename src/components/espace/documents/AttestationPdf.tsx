import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { OFFICIAL_LEGAL_LINES, NB_SHORT, levelPhrases } from "@/lib/doc-format";

export type AttestationPdfData = {
  kind: "scolarite" | "certificat" | "reussite";
  variant?: "definitive" | "sous-reserve";
  civilite?: { label: string; fem: boolean } | null;
  isBootcamp: boolean;
  title: string;
  name: string;
  matricule: string;
  reference?: string;
  year: string;
  programLine: string;
  birthLine: string | null;
  average: number | null;
  mention: string;
  longDate: string;
  signatory: { title: string; name: string; mention: string | null };
  logoSrc: string;
  qrSrc: string;
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
  // Zone principale extensible : pousse le pied légal + la bande tout en bas.
  body: { paddingHorizontal: 40, paddingTop: 16, flexGrow: 1 },
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
  num: { fontSize: 9, fontWeight: 700, color: BLACK },
  yearTxt: { fontSize: 8.5, color: MUTED },
  title: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 17,
    fontWeight: 700,
    textTransform: "uppercase",
    color: BLACK,
    letterSpacing: 1,
  },
  titleRule: { alignSelf: "center", marginTop: 6, width: 46, height: 3, backgroundColor: RED, borderRadius: 2 },
  intro: { marginTop: 12 },
  nameBox: { marginTop: 8, backgroundColor: LIGHT, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 6 },
  name: { fontSize: 14, fontWeight: 700, color: BLACK },
  matricule: { fontSize: 9.5, color: MUTED, marginTop: 2 },
  birth: { fontSize: 9.5, color: MUTED, marginTop: 3 },
  para: { marginTop: 8 },
  bold: { fontWeight: 700, color: BLACK },
  sigRow: { marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  qrWrap: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 320 },
  qr: { width: 72, height: 72 },
  qrTextCol: { flexShrink: 1 },
  qrText: { fontSize: 8, color: "#9ca3af", maxWidth: 230 },
  qrTitle: { fontSize: 8.5, fontWeight: 700, color: BLACK },
  sigRight: { alignItems: "center", maxWidth: 200 },
  faitTxt: { fontSize: 9.5, color: MUTED },
  dateTxt: { fontSize: 9.5, fontWeight: 700, color: BLACK },
  mention: { fontSize: 8, fontStyle: "italic", color: MUTED, marginTop: 2 },
  // Signature + cachet côte à côte, tailles fixes (rendu fiable, les deux visibles).
  sigStampRow: { marginTop: 6, height: 66, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  sigImg: { width: 120, height: 54, objectFit: "contain" },
  cachetImg: { width: 80, height: 80, objectFit: "contain", opacity: 0.92 },
  sigAuth: { fontSize: 9, fontStyle: "italic", color: MUTED },
  sigTitle: { marginTop: 6, fontSize: 10, fontWeight: 700, color: BLACK, textAlign: "center" },
  sigName: { fontSize: 8.5, color: "#4b5563", textAlign: "center" },
  footer: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, paddingHorizontal: 40, textAlign: "center" },
  nb: { fontSize: 7.5, fontStyle: "italic", color: "#9ca3af", marginBottom: 6 },
  legal: { fontSize: 7, color: "#9ca3af", marginBottom: 1.5 },
  band: { backgroundColor: BLACK, paddingVertical: 7, textAlign: "center", marginTop: 8, marginBottom: 8 },
  bandTxt: { fontSize: 8, color: "#ffffffb3", letterSpacing: 1.4, textTransform: "uppercase" },
});

function buildBody(d: AttestationPdfData): string[] {
  const isBC = d.isBootcamp;
  const avg =
    d.average !== null
      ? `, avec une moyenne générale de ${d.average}/20, mention ${d.mention}`
      : "";
  const fem = d.civilite?.fem;
  const inscrit = fem === true ? "inscrite" : fem === false ? "inscrit" : "inscrit(e)";
  const interesse = fem === true ? "l'intéressée" : fem === false ? "l'intéressé" : "l'intéressé(e)";
  if (d.kind === "reussite") {
    // Variante « sous réserve de soutenance » (documents diplômants).
    if (!isBC && d.variant === "sous-reserve") {
      const dashIdx = d.programLine.indexOf(" — ");
      const filiere = dashIdx >= 0 ? d.programLine.slice(dashIdx + 3) : null;
      const levelStr = dashIdx >= 0 ? d.programLine.slice(0, dashIdx) : d.programLine;
      const p = levelPhrases(levelStr);
      const annee = p?.annee ?? levelStr;
      const court = p?.court ?? levelStr;
      const sujet = d.civilite ? `${d.civilite.label} ${d.name}` : "l'intéressé(e)";
      return [
        `a régulièrement suivi les enseignements de la ${annee}${filiere ? ` en ${filiere}` : ""} au sein de l'IPMD et a satisfait aux exigences académiques relatives aux enseignements et évaluations de son parcours de formation.`,
        `${sujet} a satisfait aux exigences académiques de la ${court}, sous réserve de la validation de sa soutenance de fin de cycle.`,
        `La validation définitive de la Licence et la délivrance du diplôme correspondant interviendront après la réussite de la soutenance et l'accomplissement des formalités académiques requises.`,
        `La présente attestation est délivrée pour servir et valoir ce que de droit.`,
      ];
    }
    return [
      isBC
        ? `a suivi et complété avec succès le bootcamp ${d.programLine} à l'IPMD${avg}.`
        : `a satisfait aux exigences pédagogiques de l'IPMD et validé son parcours en ${d.programLine}, au titre de l'année académique ${d.year}${avg}.`,
      `${isBC ? "Le présent certificat est délivré" : "La présente attestation est délivrée"} pour servir et valoir ce que de droit.`,
    ];
  }
  return [
    isBC
      ? `est régulièrement ${inscrit} au bootcamp ${d.programLine} à l'IPMD, et y suit assidûment la formation.`
      : `est régulièrement ${inscrit} à l'IPMD au titre de l'année académique ${d.year}, en ${d.programLine}, et y suit assidûment les enseignements.`,
    `${d.kind === "certificat" ? "Le présent certificat est délivré" : "La présente attestation est délivrée"} à ${interesse} pour servir et valoir ce que de droit.`,
  ];
}

function AttestationDocument({ d }: { d: AttestationPdfData }) {
  const paras = buildBody(d);
  const verb = d.kind === "certificat" ? "certifie" : "atteste";

  return (
    <Document title={`${d.title} — ${d.name}`} author="IPMD">
      <Page size="A4" style={s.page}>
        <View style={s.bar} />
        <View style={s.body}>
          {/* En-tête */}
          <View style={s.headerRow}>
            <View style={s.headerLeft}>
              <Image src={d.logoSrc} style={s.logo} />
              <View>
                <Text style={s.brand}>IPMD</Text>
                <Text style={s.brandSub}>Institut Polytechnique des Métiers du Digital</Text>
                <Text style={s.brandLoc}>Abidjan — Côte d&apos;Ivoire · ipmd.pro</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <Text style={s.num}>N° {d.reference ?? d.matricule}</Text>
              <Text style={s.yearTxt}>Année {d.year}</Text>
            </View>
          </View>

          {/* Titre */}
          <Text style={s.title}>{d.title}</Text>
          <View style={s.titleRule} />

          {/* Corps */}
          <Text style={s.intro}>
            L&apos;Institut Polytechnique des Métiers du Digital (IPMD) {verb} que :
          </Text>

          <View style={s.nameBox}>
            <Text style={s.name}>{d.name}</Text>
            <Text style={s.matricule}>Matricule {d.matricule}</Text>
            {d.birthLine ? <Text style={s.birth}>{d.birthLine}</Text> : null}
          </View>

          {paras.map((t, i) => (
            <Text key={i} style={s.para}>{t}</Text>
          ))}

          {/* Signature */}
          <View style={s.sigRow}>
            <View style={s.qrWrap}>
              <Image src={d.qrSrc} style={s.qr} />
              <View style={s.qrTextCol}>
                <Text style={s.qrTitle}>Vérifier l&apos;authenticité</Text>
                <Text style={s.qrText}>Scannez ce QR code pour confirmer ce document.</Text>
                <Text style={s.qrText}>Signé numériquement par l&apos;IPMD · ipmd.pro/verifier</Text>
              </View>
            </View>
            <View style={s.sigRight}>
              <Text style={s.faitTxt}>Fait à Abidjan,</Text>
              <Text style={s.dateTxt}>le {d.longDate}</Text>
              {d.signatory.mention ? <Text style={s.mention}>{d.signatory.mention}</Text> : null}
              <View style={s.sigStampRow}>
                {d.signatureSrc ? (
                  <Image src={d.signatureSrc} style={s.sigImg} />
                ) : null}
                {d.cachetSrc ? <Image src={d.cachetSrc} style={s.cachetImg} /> : null}
              </View>
              <Text style={s.sigTitle}>{d.signatory.title}</Text>
              {d.signatory.name ? <Text style={s.sigName}>{d.signatory.name}</Text> : null}
            </View>
          </View>
        </View>

        {/* Pied légal + bande de marque : poussés en bas de page (vrai footer). */}
        <View style={s.footer}>
          <Text style={s.nb}>{NB_SHORT}</Text>
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

/** Génère le PDF officiel (Buffer) prêt à être renvoyé en réponse HTTP. */
export function renderAttestationPdf(d: AttestationPdfData): Promise<Buffer> {
  return renderToBuffer(<AttestationDocument d={d} />);
}
