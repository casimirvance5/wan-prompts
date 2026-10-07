// Every prompt must be a request the Wan routes accept, and the README must match library.jsonl.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { billedSeconds, body, cost, loadLibrary, problems, readmeSection } from "../wan.mjs";

const lib = loadLibrary();

test("at least 30 prompts, numbered 1..N without gaps", () => {
  assert.ok(lib.length >= 30);
  assert.deepEqual(lib.map((e) => e.n), lib.map((_, i) => i + 1));
});

for (const e of lib) {
  test(`#${e.n} ${e.title} is a valid ${e.model} request`, () => {
    assert.deepEqual(problems(e), []);
  });
}

test("model-specific rules are enforced", () => {
  const prime = { n: 0, model: "wan-3-prime", mode: "text", duration: 6, resolution: "720p", prompt: "x" };
  assert.ok(problems({ ...prime, aspect_ratio: "21:9" }).length);
  assert.ok(problems({ ...prime, aspect_ratio: "16:9", seed: 1 }).length);
  assert.ok(problems({ ...prime, aspect_ratio: "16:9", silent: true }).length);
  assert.ok(problems({ ...prime, aspect_ratio: "16:9", duration: 3 }).length);
  assert.ok(problems({ ...prime, aspect_ratio: "16:9", mode: "first_frame", frames: ["a"] }).length);
  assert.ok(problems({ ...prime, aspect_ratio: "16:9", mode: "reference", references: [{ kind: "audio", role: "x" }] }).length);
  const wan = { ...prime, model: "wan-3", aspect_ratio: "adaptive", duration: 2 };
  assert.deepEqual(problems({ ...wan, mode: "reference", references: [{ kind: "audio", role: "x" }] }), []);
  assert.ok(problems({ ...wan, prompt: "@Image 1 waves" }).length);
});

test("billing: reference clips add seconds and edits count the source twice", () => {
  const teaser = lib.find((e) => e.n === 27);
  assert.equal(billedSeconds(teaser), 12);
  assert.equal(cost(teaser), 12 * 0.11);
  const watercolor = lib.find((e) => e.n === 19);
  assert.equal(billedSeconds(watercolor), 20);
  assert.equal(cost(watercolor), 3);
});

test("request bodies carry seed, silence and the edit shape", () => {
  const seeded = body(lib.find((e) => e.n === 32));
  assert.equal(seeded.seed, 2026);
  const silent = body(lib.find((e) => e.n === 29));
  assert.equal(silent.generate_audio, false);
  const edit = body(lib.find((e) => e.n === 18), { source: "https://a.test/s.mp4", image: ["https://a.test/car.png"] });
  assert.equal(edit.omni_reference_task_type, "edit");
  assert.ok(!("duration" in edit) && !("aspect_ratio" in edit));
  assert.deepEqual(edit.reference_videos, [{ url: "https://a.test/s.mp4" }]);
  assert.throws(() => body(lib.find((e) => e.n === 24)), /needs 1 --image/);
});

test("README library section is generated from library.jsonl", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const section = readme.split("<!-- library:start -->\n")[1].split("\n<!-- library:end -->")[0];
  assert.equal(section, readmeSection(lib));
});
