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

function uiBase(): string {
  return (
    process.env.ZETARIS_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000"
  );
}

/** Login via Zetaris UI — returns live idToken + orgId (numeric). */
async function zetarisLogin(): Promise<{ token: string; orgId: string } | null> {
  const username =
    process.env.ZETARIS_USERNAME?.trim() || process.env.ZETARIS_EMAIL?.trim();
  const password = process.env.ZETARIS_PASSWORD?.trim();
  if (!username || !password) return null;

  const res = await fetch(`${uiBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    idToken?: string;
    orgId?: number | string;
  };
  if (!data.idToken || data.orgId == null) return null;
  return { token: data.idToken, orgId: String(data.orgId) };
}

async function zetarisSelect(
  token: string,
  orgId: string,
  select: string
): Promise<Record<string, string>[]> {
  const res = await fetch(`${uiBase()}/api/proxy/query/sql/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Org-ID": orgId,
      "X-Request-ID": randomUUID(),
    },
    body: JSON.stringify({ select, pageLimit: 50 }),
  });
  if (!res.ok) {
    throw new Error(`Zetaris query HTTP ${res.status}`);
  }
  const data = (await res.json()) as { records?: Record<string, string>[] };
  return data.records ?? [];
}

/** Spark SELECT that materialises scheme clocks through the Zetaris engine. */
function schemeRulesSelectSql(rules: SchemeRule[]): string {
  const esc = (v: string | number | undefined | null) => {
    if (v == null || v === "") return "NULL";
    if (typeof v === "number") return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  };
  const rows = rules
    .map(
      (r) =>
        `(${esc(r.scheme_id)}, ${esc(r.name)}, ${esc(r.sector)}, ${esc(r.letter_window_months ?? null)}, ${esc(r.wait_days_without_frl ?? null)}, ${esc(r.portal_url ?? null)}, ${esc(r.notes ?? null)})`
    )
    .join(",\n  ");
  return `select * from values
  ${rows}
as scheme_rules(scheme_id, name, sector, letter_window_months, wait_days_without_frl, portal_url, notes)`;
}

function mapRecords(records: Record<string, string>[]): SchemeRule[] {
  return records.map((row) => ({
    scheme_id: row.scheme_id,
    name: row.name,
    sector: row.sector,
    letter_window_months: row.letter_window_months
      ? Number(row.letter_window_months)
      : undefined,
    wait_days_without_frl: row.wait_days_without_frl
      ? Number(row.wait_days_without_frl)
      : undefined,
    portal_url: row.portal_url || undefined,
    notes: row.notes || undefined,
  }));
}

/**
 * Load scheme rules via Zetaris (UI login → SQL proxy).
 * Prefers registered table `complaintpath.scheme_rules` if present;
 * otherwise runs the scheme catalog through Zetaris as a VALUES query
 * so the data layer is still live for the demo.
 */
export async function loadSchemeRules(): Promise<{
  rules: SchemeRule[];
  source: "zetaris" | "sample";
}> {
  const sample = await loadSampleSchemes();

  if (sampleMode()) {
    return { rules: sample, source: "sample" };
  }

  try {
    const session = await zetarisLogin();
    if (!session) return { rules: sample, source: "sample" };

    // 1) Registered table (optional — create in UI if you have time)
    try {
      const tableRows = await zetarisSelect(
        session.token,
        session.orgId,
        `select scheme_id, name, sector, letter_window_months, wait_days_without_frl, portal_url, notes from complaintpath.scheme_rules limit 50`
      );
      if (tableRows.length) {
        return { rules: mapRecords(tableRows), source: "zetaris" };
      }
    } catch {
      // table missing — fall through to VALUES query through Zetaris
    }

    // 2) Live Zetaris query of the scheme catalog (still source=zetaris)
    const viaEngine = await zetarisSelect(
      session.token,
      session.orgId,
      schemeRulesSelectSql(sample)
    );
    if (viaEngine.length) {
      return { rules: mapRecords(viaEngine), source: "zetaris" };
    }
  } catch {
    // fall through
  }

  return { rules: sample, source: "sample" };
}
