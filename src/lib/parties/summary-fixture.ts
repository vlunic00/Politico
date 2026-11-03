import { summaryTopicKeys, type SummaryContent } from "./summary-contract";

// Synthetic, nonparty test document; never imported into the application database.
export const fixtureQuote = "Program predlaze izgradnju javnih stanova za mlade uz uvjet osiguranog financiranja.";
export function fixtureSummary(): SummaryContent {
  return { language: "hr-HR", sections: summaryTopicKeys.map((topic) => ({ topic, coverage: topic === "housing" ? "addressed" : "uncertain", proposals: topic === "housing" ? [{ text: fixtureQuote, kind: "commitment", evidence: [{ page: 1, quote: fixtureQuote }] }] : [] })) };
}
export function fixturePdf() {
  const stream = `BT /F1 12 Tf 40 740 Td (${fixtureQuote}) Tj 0 -20 Td (Synthetic test document. Not a political party program.) Tj ET`;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1200 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
