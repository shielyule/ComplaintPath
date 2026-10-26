import { NextResponse } from "next/server";
import { getMeterlessClient, sampleMode } from "@/lib/meterless";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };
    const imageBase64 = body.imageBase64?.trim();
    const mimeType = body.mimeType || "image/jpeg";
    if (!imageBase64 || imageBase64.length < 100) {
      return NextResponse.json(
        { error: "Image payload missing or too small." },
        { status: 400 }
      );
    }
    // Soft limit ~6MB base64
    if (imageBase64.length > 8_000_000) {
      return NextResponse.json(
        { error: "Image too large — try a smaller screenshot or paste text." },
        { status: 400 }
      );
    }

    if (sampleMode()) {
      return NextResponse.json({
        text: "",
        error:
          "SAMPLE_MODE is on — image OCR needs Nightshift. Paste letter text, or set SAMPLE_MODE=false.",
        via: "sample",
      }, { status: 503 });
    }

    const client = getMeterlessClient();
    if (!client) {
      return NextResponse.json(
        {
          error:
            "OCR unavailable (Meterless not configured). Paste the letter text instead.",
        },
        { status: 503 }
      );
    }

    const model = process.env.METERLESS_MODEL || "meterless/auto";
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    const reply = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL readable text from this UK complaint / final response letter image.
Return plain text only — preserve dates, refs, firm names, and wording. No commentary.`,
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const text = reply.choices[0]?.message?.content?.trim() ?? "";
    if (text.length < 20) {
      return NextResponse.json(
        {
          error:
            "Could not read enough text from the image. Try a clearer photo or paste the letter.",
        },
        { status: 422 }
      );
    }
    return NextResponse.json({ text, via: "nightshift" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
