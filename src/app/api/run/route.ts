import { NextResponse } from "next/server";
import { runComplaintPipeline } from "@/lib/runPipeline";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      letter?: string;
      todayIso?: string;
    };
    const letter = body.letter?.trim();
    if (!letter || letter.length < 40) {
      return NextResponse.json(
        { error: "Paste a letter (at least ~40 characters)." },
        { status: 400 }
      );
    }
    const result = await runComplaintPipeline(letter, body.todayIso);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
