# wan-3 prompt library

A curated, testable prompt library for wan-3 video work on Argolink.

[Open the Argolink model page →](https://argolink.io/gh-wan-prompts)

## Prompt design

Each prompt separates output, subject, timeline, camera, look, sound, and hard constraints. Keep the prompt self-contained and name reference assets in the same order as the request arrays.

- [`prompts/`](./prompts): reusable prompt cards.
- [`docs/prompt-schema.md`](./docs/prompt-schema.md): field-by-field review rules.

The examples are text only; they do not claim that a prompt bypasses model safety or capability limits.

## Argolink boundary

Runtime requests read credentials from `ARGOLINK_API_KEY` and never from committed files.

All examples, field names, routes, and environment variables in this repository are written for Argolink. Check the linked documentation for live availability and limits. No external provider credentials, author attribution, or copied checkout material is required to use this repository.

## Layout

- `docs/` contains the public design and validation notes.
- `examples/` contains small runnable examples.
- `argolink/` contains the Argolink mapping for this repository.
- `ARGOLINK_LINKS.md` contains the tracked landing link.
