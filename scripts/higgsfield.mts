/**
 * Higgsfield image generation from the terminal, in a Claude Code cloud session.
 *
 *   npx tsx scripts/higgsfield.mts --check
 *   npx tsx scripts/higgsfield.mts "a glass flywheel in teal light" --aspect 16:9
 *   npx tsx scripts/higgsfield.mts "..." --model higgsfield-ai/soul/v2/standard --out media-src/ai
 *   npx tsx scripts/higgsfield.mts --request <id>      (finish one already paid for)
 *
 * Credentials: none in this file or in the repo. In a cloud session the
 * environment's Network secret for api.higgsfield.ai adds the Authorization
 * header on the way out. Locally, set HF_CREDENTIALS (e.g. in .env.local) and
 * it is sent as `Authorization: Key ...`.
 *
 * Node's built-in fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY is set at
 * startup, and the secret is only added by that proxy, so when a proxy is set
 * this script re-runs itself once with the flag on.
 */

import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const child = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
  });
  process.exit(child.status ?? 1);
}

const API = "https://api.higgsfield.ai";
const POLL_MS = 4000;
const MAX_WAIT_MS = 10 * 60 * 1000;
const TERMINAL = new Set(["completed", "failed", "nsfw", "canceled"]);

const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
if (process.env.HF_CREDENTIALS) headers.Authorization = `Key ${process.env.HF_CREDENTIALS}`;

interface Result {
  status: string;
  request_id: string;
  images?: { url?: string }[];
  video?: { url?: string };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const text = await res.text();
  // The body is Higgsfield's message; it never contains the credential.
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${path.split("?")[0]}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

/** Retries read-only steps when the connection drops. Never the paid submit. */
async function retrying<T>(step: () => Promise<T>): Promise<T> {
  for (const wait of [2000, 4000, 8000, 16000, 30000, 0]) {
    try {
      return await step();
    } catch (error) {
      if (!(error instanceof TypeError) || !wait) throw error;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("unreachable");
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    check: { type: "boolean" },
    model: { type: "string", default: "higgsfield-ai/soul/v2/standard" },
    aspect: { type: "string", default: "16:9" },
    out: { type: "string", default: "media-src/higgsfield" },
    request: { type: "string" },
  },
});

if (values.check) {
  // Free: asks for the status of a request that doesn't exist.
  // 404 or 422 means the key works; 401 means it was rejected.
  const res = await fetch(`${API}/requests/00000000-0000-0000-0000-000000000000/status`, { headers });
  console.log(res.status === 401 || res.status === 403 ? `Key rejected (HTTP ${res.status}).` : `Key accepted (HTTP ${res.status}).`);
  process.exit(res.status === 401 || res.status === 403 ? 1 : 0);
}

const prompt = positionals.join(" ").trim();
if (!prompt && !values.request) {
  console.error('Give a prompt: npx tsx scripts/higgsfield.mts "your prompt" [--aspect 16:9]');
  process.exit(1);
}

let result: Result = values.request
  ? await retrying(() => call<Result>(`/requests/${values.request}/status`))
  : await call<Result>(`/${values.model}`, {
      method: "POST",
      body: JSON.stringify({ prompt, aspect_ratio: values.aspect }),
    });
const id = result.request_id ?? values.request;
console.log(`request ${id} (${result.status})`);

const started = Date.now();
while (!TERMINAL.has(result.status)) {
  if (Date.now() - started > MAX_WAIT_MS) {
    console.error(`Still ${result.status}. It's paid for: resume with --request ${id}`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
  result = await retrying(() => call<Result>(`/requests/${id}/status`));
}
if (result.status === "nsfw") throw new Error("Rejected by moderation (refunded).");
if (result.status !== "completed") throw new Error(`Finished with status ${result.status}.`);

const urls = [...(result.images ?? []).map((i) => i.url), result.video?.url].filter((u): u is string => Boolean(u));
await mkdir(values.out!, { recursive: true });
for (const [n, url] of urls.entries()) {
  const res = await retrying(() => fetch(url));
  const type = res.headers.get("content-type") ?? "";
  const ext = type.includes("webp") ? "webp" : type.includes("png") ? "png" : type.includes("video") ? "mp4" : "jpg";
  const file = `${values.out}/${id}${urls.length > 1 ? `-${n + 1}` : ""}.${ext}`;
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log(`saved ${file}`);
}
