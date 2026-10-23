/**
 * Stands in for a fingerprint terminal (or its bridge agent): sends the same
 * requests a real device would, authenticated by a device API key. Register a
 * device under /api/devices first to get one.
 *
 *   DEVICE_KEY=fod_... npm run scanner                       # interactive: type a biometric ID, Enter = punch now
 *   DEVICE_KEY=fod_... npm run scanner -- punch 17 [time]    # one punch; time like 2026-10-22T07:45:00, default now
 *   DEVICE_KEY=fod_... npm run scanner -- roster
 *   DEVICE_KEY=fod_... npm run scanner -- heartbeat
 *
 * API_URL defaults to http://localhost:4000.
 */
import { createInterface } from "node:readline/promises";

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const DEVICE_KEY = process.env.DEVICE_KEY;

if (!DEVICE_KEY) {
  console.error("Set DEVICE_KEY to a device's API key (issued when the device is registered or its key rotated).");
  process.exit(1);
}

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_URL}/api/biometric${path}`, {
    method,
    headers: { "x-device-key": DEVICE_KEY!, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

/** Devices report wall-clock time with no offset, so mimic that rather than sending UTC. */
function localNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function punch(biometricId: string, punchedAt = localNow()) {
  const { results } = await call("POST", "/punches", { punches: [{ biometricId, punchedAt }] });
  console.log(`${punchedAt}  #${biometricId}  →`, results[0]);
}

async function interactive() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log(`Simulated scanner on ${API_URL}. Enter a biometric ID to punch, "roster" to list enrolments, Ctrl+D to quit.`);
  rl.setPrompt("finger> ");
  rl.prompt();
  for await (const raw of rl) {
    const line = raw.trim();
    try {
      if (line === "roster") console.table(await call("GET", "/roster"));
      else if (line) await punch(line);
    } catch (error) {
      console.error((error as Error).message);
    }
    rl.prompt();
  }
}

const [command, ...args] = process.argv.slice(2);

try {
  if (!command) await interactive();
  else if (command === "punch" && args[0]) await punch(args[0], args[1]);
  else if (command === "roster") console.table(await call("GET", "/roster"));
  else if (command === "heartbeat") await call("POST", "/heartbeat"), console.log("ok");
  else {
    console.error("Usage: scanner [punch <biometricId> [time] | roster | heartbeat]");
    process.exit(1);
  }
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
