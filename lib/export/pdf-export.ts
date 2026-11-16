import type { ExpenseCalculationResult } from "@/types/settlement";
import type { Destination } from "@/types/trip";
import { formatMoney } from "@/lib/utils/format-currency";
import { joinNames } from "@/lib/utils/funny-messages";
import { getDictionary, type Language } from "@/lib/i18n";

/** Standard PDF fonts can't draw ₹ or emoji, so the PDF uses ISO codes ("INR 4,000") and plain text. */
function money(minor: number, result: ExpenseCalculationResult): string {
  return formatMoney(minor, result.currency.code, { display: "code" });
}

function stripEmoji(text: string): string {
  return text.replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, "").trim();
}

type RGB = [number, number, number];

/**
 * Generates a clean, printable PDF of the results (in the chosen language) and
 * triggers a download. jsPDF is loaded lazily so it never weighs down the page.
 * The PDF is always light-themed so it prints well.
 */
export async function downloadResultsPdf(
  result: ExpenseCalculationResult,
  destination: Destination | null,
  language: Language = "en",
): Promise<void> {
  const t = getDictionary(language).pdf;
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const ink: RGB = [27, 19, 64];
  const violet: RGB = [109, 40, 217];
  const tripName = destination ? stripEmoji(destination.name) : t.defaultTrip;

  // Header band
  doc.setFillColor(...violet);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("BillDrama", margin, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(t.reportTitle(tripName), margin, 70);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), pageWidth - margin, 70, {
    align: "right",
  });

  const heading = (text: string, y: number) => {
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, margin, y);
  };

  // Summary
  heading(t.summary, 132);
  const fairShare = result.hasUnevenSplit
    ? `${money(result.fairShareBase, result)} - ${money(result.fairShareBase + 1, result)}`
    : money(result.fairShareBase, result);

  autoTable(doc, {
    startY: 140,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 5, textColor: ink },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 160 } },
    body: [
      [t.destination, tripName],
      [t.total, money(result.totalExpenditure, result)],
      [t.people, String(result.participantCount)],
      [t.fairShare, fairShare],
      [t.currency, `${result.currency.code} - ${result.currency.label}`],
    ],
  });

  // Breakdown
  let y = lastY() + 28;
  heading(t.breakdown, y);
  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: violet, textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 6, textColor: ink },
    alternateRowStyles: { fillColor: [246, 244, 255] },
    head: [[t.name, t.paid, t.share, t.status]],
    body: result.participants.map((p) => [
      p.name,
      money(p.paid, result),
      money(p.fairShare, result),
      p.status === "receives" ? t.receives(money(p.balance, result)) : p.status === "pays" ? t.pays(money(-p.balance, result)) : t.settled,
    ]),
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 3) return;
      const participant = result.participants[data.row.index];
      if (participant?.status === "receives") data.cell.styles.textColor = [5, 150, 105];
      if (participant?.status === "pays") data.cell.styles.textColor = [234, 88, 12];
    },
  });

  // Settlement
  y = lastY() + 28;
  heading(t.whoPaysWhom, y);

  if (result.transactions.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(result.isAllZero ? t.nothing : t.allSettled, margin, y + 22);
    y += 22;
  } else {
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 11, cellPadding: 7, textColor: ink },
      head: [["#", t.from, "", t.to, t.amount]],
      columnStyles: { 0: { cellWidth: 28 }, 2: { cellWidth: 28, halign: "center" }, 4: { halign: "right", fontStyle: "bold" } },
      body: result.transactions.map((tx, i) => [String(i + 1), tx.fromName, "->", tx.toName, money(tx.amount, result)]),
    });
    y = lastY();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(t.paymentsLine(result.transactions.length), margin, y + 20);
    y += 20;
  }

  if (!result.isAllZero && !result.allSpentEqually) {
    doc.setFontSize(10);
    doc.text(`${t.biggest}: ${joinNames(result.biggestSpenders.map((p) => p.name))}`, margin, y + 22);
    doc.text(`${t.lowest}: ${joinNames(result.lowestSpenders.map((p) => p.name))}`, margin, y + 38);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(120, 113, 150);
  doc.text(t.footer, pageWidth / 2, pageHeight - 28, { align: "center" });

  const fileSlug = tripName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";
  doc.save(`billdrama-${fileSlug}-settlement.pdf`);
}
