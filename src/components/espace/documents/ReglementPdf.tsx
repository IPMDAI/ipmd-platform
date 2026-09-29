import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Article } from "@/data/reglement";

export type ReglementPdfData = {
  title: string;
  subtitle: string;
  year: string;
  articles: Article[];
  logoSrc: string;
  longDate: string;
};

const RED = "#e01228";
const BLACK = "#0b0b0d";
const MUTED = "#6b7280";

const s = StyleSheet.create({
  page: { fontSize: 9.5, color: "#1f2937", lineHeight: 1.5, flexDirection: "column" },
  bar: { height: 6, backgroundColor: RED },
  body: { paddingHorizontal: 42, paddingTop: 16, paddingBottom: 46 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, objectFit: "contain" },
  brand: { fontSize: 13, fontWeight: 700, color: BLACK },
  brandSub: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 },
  brandLoc: { fontSize: 7, color: "#9ca3af" },
  yearTxt: { fontSize: 8, color: MUTED, textAlign: "right" },
  title: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 15,
    fontWeight: 700,
    textTransform: "uppercase",
    color: BLACK,
    letterSpacing: 0.8,
  },
  subtitle: { marginTop: 3, textAlign: "center", fontSize: 9, color: MUTED },
  titleRule: { alignSelf: "center", marginTop: 5, width: 44, height: 3, backgroundColor: RED, borderRadius: 2 },
  article: { marginTop: 11 },
  artTitle: { fontSize: 9, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 0.4 },
  para: { marginTop: 3, textAlign: "justify" },
  signBlock: { marginTop: 22, flexDirection: "row", gap: 32 },
  signCol: { flex: 1 },
  signLabel: { fontSize: 8, color: MUTED },
  signLine: { marginTop: 26, borderBottomWidth: 1, borderBottomColor: "#9ca3af" },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footTxt: { fontSize: 7, color: "#9ca3af" },
});

function ReglementDocument({ d }: { d: ReglementPdfData }) {
  return (
    <Document title={`${d.title} — ${d.year}`} author="IPMD">
      <Page size="A4" style={s.page}>
        <View style={s.bar} fixed />
        <View style={s.body}>
          <View style={s.headerRow} fixed>
            <View style={s.headerLeft}>
              {d.logoSrc ? <Image src={d.logoSrc} style={s.logo} /> : null}
              <View>
                <Text style={s.brand}>IPMD</Text>
                <Text style={s.brandSub}>Institut Polytechnique des Métiers du Digital &amp; IA</Text>
                <Text style={s.brandLoc}>Abidjan — Côte d&apos;Ivoire · ipmd.pro</Text>
              </View>
            </View>
            <Text style={s.yearTxt}>Année {d.year}</Text>
          </View>

          <Text style={s.title}>Règlement intérieur</Text>
          <Text style={s.subtitle}>
            {d.subtitle} — {d.year}
          </Text>
          <View style={s.titleRule} />

          {d.articles.map((a) => (
            <View key={a.n} style={s.article} wrap={false}>
              <Text style={s.artTitle}>
                Article {a.n} — {a.title}
              </Text>
              {a.body.map((p, i) => (
                <Text key={i} style={s.para}>
                  {p}
                </Text>
              ))}
            </View>
          ))}

          <View style={s.signBlock} wrap={false}>
            <View style={s.signCol}>
              <Text style={s.signLabel}>L&apos;apprenant(e) — Date et signature</Text>
              <View style={s.signLine} />
            </View>
            <View style={s.signCol}>
              <Text style={s.signLabel}>Pour l&apos;IPMD — Date, cachet et signature</Text>
              <View style={s.signLine} />
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footTxt}>
            INSTITUT POLYTECHNIQUE DES MÉTIERS DU DIGITAL — {d.title} · {d.year}
          </Text>
          <Text
            style={s.footTxt}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/** Génère le règlement intérieur (Buffer PDF) — variante diplôme ou bootcamp. */
export function renderReglementPdf(d: ReglementPdfData): Promise<Buffer> {
  return renderToBuffer(<ReglementDocument d={d} />);
}
