import { readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { sampleMode } from "./meterless";

export type SchemeRule = {
  scheme_id: string;
  name: string;
  sector: string;
  letter_window_months?: number;
  wait_days_without_frl?: number;
  portal_url?: string;
  notes?: string;
};

async function loadSampleSchemes(): Promise<SchemeRule[]> {
  const p = path.join(process.cwd(), "src/lib/sample/schemes.json");
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as SchemeRule[];
}

/** Load scheme rules — Zetaris SQL when live, sample JSON otherwise. */
export async function loadSchemeRules(): Promise<{
  rules: SchemeRule[];
  source: "zetaris" | "sample";
}> {
  const url = process.env.ZETARIS_REST_URL;
  const key = process.env.ZETARIS_API_KEY;
  const org = process.env.ZETARIS_ORG_ID;

  if (!sampleMode() && url && key && org) {
    try {
      const sql = `
SELECT scheme_id, name, sector, letter_window_months, wait_days_without_frl, portal_url, notes
FROM complaintpath.scheme_rules
LIMIT 50`;
      const res = await fetch(`${url.replace(/\/$/, "")}/sql-editor/sqls/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Org-ID": org,
          "X-Request-ID": randomUUID(),
        },
        body: JSON.stringify({ sql }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          rows?: SchemeRule[];
          data?: SchemeRule[];
        };
        const rows = data.rows ?? data.data ?? [];
        if (rows.length) return { rules: rows, source: "zetaris" };
      }
    } catch {
      // fall through to sample
    }
  }

  return { rules: await loadSampleSchemes(), source: "sample" };
}
