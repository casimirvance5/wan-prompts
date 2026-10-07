#!/usr/bin/env node
// Wan 3.0 / Wan 3.0 Prime prompt library runner. Node 18+, no dependencies.
//
//   node wan.mjs list                         numbered list with model, settings and cost
//   node wan.mjs show 17                      one prompt as JSON
//   node wan.mjs run 1 --dry-run              the request body, nothing sent
//   node wan.mjs run 18 --source street.mp4 --image car.png --out edit.mp4
//   node wan.mjs readme                       regenerate the README library section
//
// Prompts that need assets take them in @-number order: --image, --video, --audio (repeatable),
// --first / --last for frame prompts, --source for edits. Local files are uploaded first.
// WAN_API_KEY must be set to run; WAN_BASE_URL defaults to https://argolink.io/v1.

import { readFileSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const HERE = fileURLToPath(new URL(".", import.meta.url));

// Per-second prices read from the two model pages on 2026-10-07.
export const MODELS = {
  "wan-3": {
    rate: { "480p": 0.038, "720p": 0.075, "1080p": 0.15 }, seconds: [2, 30],
    ratios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "adaptive"],
    frames: true, edit: true, seed: true, silent: true, audioAlone: true,
  },
  "wan-3-prime": {
    rate: { "480p": 0.051, "720p": 0.11, "1080p": 0.21 }, seconds: [4, 30],
    ratios: ["16:9", "1:1", "9:16"],
    frames: false, edit: false, seed: false, silent: false, audioAlone: false,
  },
};
const CAPS = { image: 10, video: 5, audio: 5, total: 20 };
const FIELD = { image: "reference_images", video: "reference_videos", audio: "reference_audios" };
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4",
  ".mov": "video/quicktime", ".mp3": "audio/mpeg", ".wav": "audio/wav" };

export function loadLibrary(path = `${HERE}library.jsonl`) {
  return readFileSync(path, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

const refsOf = (e, kind) => (e.references ?? []).filter((r) => r.kind === kind);

export function billedSeconds(e) {
  if (e.mode === "edit") return 2 * e.source_seconds; // the edited clip is output and reference
  const ref = refsOf(e, "video").reduce((s, r) => s + (r.seconds ?? 0), 0);
  return e.duration + Math.floor(ref);
}

export const cost = (e) => Math.round(billedSeconds(e) * MODELS[e.model].rate[e.resolution] * 10000) / 10000;

/** Every way an entry could be refused by the API; [] means it is a valid request. */
export function problems(e) {
  const m = MODELS[e.model];
  if (!m) return [`unknown model ${e.model}`];
  const out = [];
  const counts = { image: refsOf(e, "image").length, video: refsOf(e, "video").length, audio: refsOf(e, "audio").length };
  if (!e.prompt || e.prompt.length > 20000) out.push("prompt must be 1-20,000 characters");
  if (!(e.resolution in m.rate)) out.push(`resolution ${e.resolution}`);
  if (e.seed !== undefined && (!m.seed || !Number.isInteger(e.seed) || e.seed < 0 || e.seed > 4294967295)) out.push("seed");
  if (e.silent && !m.silent) out.push(`${e.model} always has sound`);
  if (e.mode === "edit") {
    if (!m.edit) out.push(`${e.model} cannot edit`);
    if (!(e.source_seconds >= 1 && e.source_seconds <= 15)) out.push("edit source must be 1-15 s");
    if (e.duration !== undefined || e.aspect_ratio !== undefined) out.push("an edit keeps the source length and ratio");
    if (counts.video > 4) out.push("an edit takes at most 4 extra videos");
  } else {
    const [lo, hi] = m.seconds;
    if (!Number.isInteger(e.duration) || e.duration < lo || e.duration > hi) out.push(`duration ${lo}-${hi} s`);
    if (!m.ratios.includes(e.aspect_ratio)) out.push(`aspect_ratio ${e.aspect_ratio}`);
  }
  if (e.mode === "first_frame" || e.mode === "first_last_frame") {
    if (!m.frames) out.push(`${e.model} takes no frames`);
    if ((e.references ?? []).length) out.push("frames cannot be mixed with references");
    if (e.frames?.length !== (e.mode === "first_frame" ? 1 : 2)) out.push("frames list");
  }
  if (counts.image > CAPS.image || counts.video > CAPS.video || counts.audio > CAPS.audio) out.push("reference caps");
  if (counts.image + counts.video + counts.audio > CAPS.total) out.push("20 references in total");
  if (counts.audio && !counts.image && !counts.video && !m.audioAlone && e.mode !== "edit") out.push("audio alone");
  if (e.mode === "reference" && !(e.references ?? []).length) out.push("reference mode needs references");
  for (const r of refsOf(e, "video")) if (!(r.seconds >= 1 && r.seconds <= 15)) out.push("reference clip 1-15 s");
  if (e.mode !== "edit" && e.duration + refsOf(e, "video").reduce((s, r) => s + r.seconds, 0) > 30) out.push("output + reference video over 30 s");
  for (const [, tag, n] of e.prompt.matchAll(/@(Image|Video|Audio) (\d+)/g)) {
    const have = counts[tag.toLowerCase()] + (e.mode === "edit" && tag === "Video" ? 1 : 0);
    if (Number(n) < 1 || Number(n) > have) out.push(`@${tag} ${n} has no asset`);
  }
  return out;
}

export function body(e, assets = {}) {
  const b = { model: e.model, prompt: e.prompt, resolution: e.resolution };
  if (e.mode === "edit") {
    b.omni_reference_task_type = "edit";
    b.reference_videos = [{ url: need(assets.source, "--source") }, ...(assets.video ?? []).map((url) => ({ url }))];
  } else {
    b.duration = e.duration;
    b.aspect_ratio = e.aspect_ratio;
  }
  if (e.mode === "first_frame" || e.mode === "first_last_frame") {
    b.start_image = { url: need(assets.first, "--first") };
    if (e.mode === "first_last_frame") b.end_image = { url: need(assets.last, "--last") };
  }
  for (const kind of ["image", "video", "audio"]) {
    const want = refsOf(e, kind).length;
    const got = assets[kind] ?? [];
    if (got.length !== want) throw new Error(`prompt ${e.n} needs ${want} --${kind}, got ${got.length}`);
    if (want && !(e.mode === "edit" && kind === "video")) b[FIELD[kind]] = got.map((url) => ({ url }));
  }
  if (e.seed !== undefined) b.seed = e.seed;
  if (e.silent) b.generate_audio = false;
  return b;
}

function need(value, flag) {
  if (!value) throw new Error(`this prompt needs ${flag}`);
  return value;
}

const settings = (e) => e.mode === "edit"
  ? `edit of a ${e.source_seconds} s clip · ${e.resolution}`
  : `${e.duration} s · ${e.resolution} · ${e.aspect_ratio}`;

const extras = (e) => [e.seed !== undefined ? `seed ${e.seed}` : "", e.silent ? "silent" : ""].filter(Boolean).join(", ");

function assetsLine(e) {
  const parts = [];
  if (e.mode === "edit") parts.push("the clip to edit");
  for (const f of e.frames ?? []) parts.push(f);
  for (const r of e.references ?? []) parts.push(`${r.kind}: ${r.role}`);
  return parts.length ? parts.join("; ") : "nothing";
}

export function readmeSection(lib) {
  const lines = ["| # | Prompt | Model | Mode | Settings | Cost |", "|---:|---|---|---|---|---:|"];
  for (const e of lib) {
    lines.push(`| ${e.n} | [${e.title}](#${e.n}-${slug(e.title)}) | \`${e.model}\` | ${e.mode.replaceAll("_", " ")} | ${settings(e)} | $${cost(e).toFixed(3)} |`);
  }
  let category = "";
  for (const e of lib) {
    if (e.category !== category) {
      category = e.category;
      lines.push("", `### ${category}`);
    }
    const extra = extras(e);
    lines.push("", `#### ${e.n}. ${e.title}`, "",
      `\`${e.model}\` · ${e.mode.replaceAll("_", " ")} · ${settings(e)}${extra ? ` · ${extra}` : ""} · **$${cost(e).toFixed(3)}**  `,
      `Assets: ${assetsLine(e)}`, "", "```text", e.prompt, "```", "", e.tip);
  }
  return lines.join("\n");
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/ +/g, "-");

// ------------------------------------------------------------------ running one prompt

async function api(method, path, payload, { raw = false } = {}) {
  const base = (process.env.WAN_BASE_URL || "https://argolink.io/v1").replace(/\/+$/, "");
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${process.env.WAN_API_KEY}`, ...(payload ? { "Content-Type": "application/json" } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${await res.text()}`);
  return raw ? Buffer.from(await res.arrayBuffer()) : res.json();
}

async function toUrl(value, model) {
  if (!value || value.startsWith("https://")) return value;
  const type = MIME[extname(value).toLowerCase()];
  if (!type) throw new Error(`${value}: use PNG/JPEG, MP4/MOV or MP3/WAV`);
  const ticket = await api("POST", "/media/uploads", { model, type: type.split("/")[0], content_type: type, size_bytes: (await stat(value)).size });
  const put = await fetch(ticket.upload_url, { method: "PUT", headers: { "Content-Type": type }, body: await readFile(value) });
  if (!put.ok) throw new Error(`upload failed: HTTP ${put.status}`);
  return ticket.media_url;
}

async function run(e, o) {
  const stand = (v) => (v && !v.startsWith("https://") ? `https://upload.invalid/${basename(v)}` : v);
  const preview = body(e, { image: o.image?.map(stand), video: o.video?.map(stand), audio: o.audio?.map(stand),
    first: stand(o.first), last: stand(o.last), source: stand(o.source) });
  if (o["dry-run"]) {
    console.log(JSON.stringify(preview, null, 2));
    console.error(`estimated cost: $${cost(e).toFixed(3)}`);
    return;
  }
  if (!process.env.WAN_API_KEY) throw new Error("export WAN_API_KEY first (or use --dry-run)");
  const up = (v) => toUrl(v, e.model);
  const real = body(e, { image: await Promise.all((o.image ?? []).map(up)), video: await Promise.all((o.video ?? []).map(up)),
    audio: await Promise.all((o.audio ?? []).map(up)), first: await up(o.first), last: await up(o.last), source: await up(o.source) });
  const { request_id } = await api("POST", "/videos/generations", real);
  console.error(`#${e.n}: ${request_id}`);
  let job;
  for (;;) {
    job = await api("GET", `/videos/${request_id}`);
    if (job.status === "done") break;
    if (job.status === "failed" || job.status === "expired") throw new Error(`${job.status}: ${JSON.stringify(job.error)} (not billed)`);
    console.error(`${job.status} ${job.progress ?? 0}%`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  const out = o.out ?? `wan-${e.n}.mp4`;
  await writeFile(out, await api("GET", `/videos/${request_id}/content`, undefined, { raw: true }));
  console.log(JSON.stringify({ file: out, usage: job.usage }));
}

async function main(argv) {
  const { values: o, positionals: [cmd, id] } = parseArgs({
    args: argv, allowPositionals: true,
    options: { image: { type: "string", multiple: true }, video: { type: "string", multiple: true },
      audio: { type: "string", multiple: true }, first: { type: "string" }, last: { type: "string" },
      source: { type: "string" }, out: { type: "string" }, "dry-run": { type: "boolean" } },
  });
  const lib = loadLibrary();
  const pick = () => lib.find((e) => e.n === Number(id)) ?? (() => { throw new Error(`no prompt #${id}`); })();
  if (cmd === "list") {
    for (const e of lib) console.log(`${String(e.n).padStart(2)}  ${e.model.padEnd(11)} ${settings(e).padEnd(30)} $${cost(e).toFixed(3)}  ${e.title}`);
  } else if (cmd === "show") {
    console.log(JSON.stringify(pick(), null, 2));
  } else if (cmd === "run") {
    await run(pick(), o);
  } else if (cmd === "readme") {
    console.log(readmeSection(lib));
  } else {
    console.error("usage: node wan.mjs list | show N | run N [--dry-run] [assets] | readme");
    process.exitCode = 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
