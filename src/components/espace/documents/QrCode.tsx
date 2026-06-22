import QRCode from "qrcode";

/**
 * QR code rendu en SVG (net à l'impression). `value` est l'URL de
 * vérification signée.
 */
export async function QrCode({
  value,
  size = 96,
  dark = "#0b0b0d",
}: {
  value: string;
  size?: number;
  dark?: string;
}) {
  let svg = "";
  try {
    svg = await QRCode.toString(value, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark, light: "#00000000" },
    });
  } catch {
    return null;
  }
  // Force la taille demandée sur le SVG généré.
  svg = svg.replace(
    /<svg /,
    `<svg width="${size}" height="${size}" `
  );

  return (
    <span
      style={{ width: size, height: size, display: "inline-block" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
