/**
 * Client-side letter ingest: plain text, PDF text layer, or image → /api/ocr.
 */

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use CDN worker matching installed major to avoid bundler worker path issues
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(line);
  }
  const text = parts.join("\n\n").replace(/[ \t]+\n/g, "\n").trim();
  if (text.length < 20) {
    throw new Error(
      "This PDF has little readable text (likely a scan). Try a PNG/JPEG screenshot, or paste the letter text."
    );
  }
  return text;
}

export async function extractTextFromImage(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 = btoa(binary);
  const mime = file.type || "image/jpeg";

  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: b64, mimeType: mime }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Image OCR failed");
  return String(data.text || "").trim();
}

export async function ingestLetterFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "text/plain" || name.endsWith(".txt")) {
    return (await file.text()).trim();
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }
  if (
    type.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|heic)$/i.test(name)
  ) {
    return extractTextFromImage(file);
  }
  throw new Error("Supported uploads: PDF, PNG, JPEG, WebP, or plain text.");
}
