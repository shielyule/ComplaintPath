import { readFileSync } from "fs";
import path from "path";
import { routeComplaint } from "./routeComplaint";
import type { ComplaintPayload } from "./types";

type Vector = {
  scenario: string;
  input: ComplaintPayload;
  expected: { targetScheme: string | null; status: string };
};

const file = path.join(__dirname, "testVectors.json");
const vectors = JSON.parse(readFileSync(file, "utf8")) as Vector[];

let failed = 0;
for (const v of vectors) {
  const got = routeComplaint(v.input);
  const ok =
    got.status === v.expected.status &&
    got.targetScheme === v.expected.targetScheme;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${v.scenario}  → ${got.status}/${got.targetScheme}`
  );
  if (!ok) {
    console.log("  expected", v.expected, "got", {
      status: got.status,
      targetScheme: got.targetScheme,
    });
    failed++;
  }
}

if (failed) {
  process.exit(1);
}
console.log(`\n${vectors.length - failed}/${vectors.length} vectors passed`);
