import { appendFile, mkdir } from "fs/promises";
import path from "path";

export type TraceEvent = {
  timestamp: string;
  trace_id: string;
  agent_name: string;
  action: string;
  input_summary?: string;
  output_summary?: string;
  target_agent?: string;
  confidence?: number;
  retry_count?: number;
  status: string;
};

export async function appendTrace(event: TraceEvent): Promise<void> {
  const dir = path.join(process.cwd(), "logs");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${event.trace_id}.jsonl`);
  await appendFile(file, `${JSON.stringify(event)}\n`, "utf8");
  console.log(
    `[trace] ${event.agent_name}.${event.action} → ${event.status}`
  );
}
