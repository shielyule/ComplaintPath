import { jsPDF } from "jspdf";
import type { PipelineResult } from "./runPipeline";
import { schemePlain } from "./plainEnglish";

/** Short instruction for the citizen after download. */
export function nextStepsInstruction(result: PipelineResult): string {
  const door = schemePlain(result.decision.targetScheme);
  const url = result.decision.portalUrl;
  if (result.decision.status !== "ELIGIBLE" || !url) {
    return "Resolve the gate blocker before filing. ComplaintPath does not submit forms for you.";
  }
  return `Next steps: log on to ${door} at ${url} and fill out their complaint form using the data collated in this Gate Pack. ComplaintPath does not file for you.`;
}

export function buildPackMarkdown(
  result: PipelineResult,
  approved: Record<string, boolean>
): string {
  const lines = result.pack.map((s) => {
    const ok = approved[s.id] ? "APPROVED" : "PENDING";
    return `## ${s.title} [${ok}]\n\n${s.body}\n`;
  });
  return [
    `# ComplaintPath Gate Pack`,
    `Trace: ${result.trace_id}`,
    `Gate: ${result.decision.status} → ${result.decision.targetScheme ?? "—"}`,
    ``,
    `## How to use this pack`,
    ``,
    nextStepsInstruction(result),
    ``,
    ...lines,
  ].join("\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Download markdown + PDF of the same Gate Pack. */
export function downloadPackFiles(
  result: PipelineResult,
  approved: Record<string, boolean>
) {
  const markdown = buildPackMarkdown(result, approved);
  const base = `complaintpath-${result.trace_id}`;

  triggerDownload(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
    `${base}.md`
  );

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 14;
  let y = margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const wrapped = doc.splitTextToSize(markdown, maxWidth) as string[];
  for (const line of wrapped) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(`${base}.pdf`);
}
