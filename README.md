# Wan Prompts — 33 Wan 3.0 and Wan 3.0 Prime video prompts

A numbered prompt library for Alibaba's Wan 3.0 video models, with the exact settings to send and what each prompt costs to run. It leans on what sets Wan 3.0 apart: takes up to 30 seconds, first and last frames, editing footage you already have, audio as the only reference, repeatable seeds and silent output. Every entry is checked against the published limits by the tests; no sample renders are bundled.

**Contents:** [What Wan 3.0 is](#what-wan-30-is) · [Wan 3.0 vs Prime](#wan-30-vs-wan-30-prime) · [Writing prompts for Wan](#writing-prompts-for-wan) · [Run a prompt](#run-a-prompt) · [The library](#the-library)

<sub>Last checked: 2026-10-07.</sub>

## What Wan 3.0 is

Alibaba describes Wan 3.0 (`wan3.0-video` on [Alibaba Cloud Model Studio](https://www.alibabacloud.com/help/en/model-studio/wan3-0-video)) as one all-in-one model for text-to-video, image-to-video from a first frame or a first and last frame, and reference-based video from text, images, video and audio, at 480P, 720P or 1080P and up to 30 seconds. [Wan 3.0 Prime](https://www.alibabacloud.com/help/en/model-studio/wan3-0-video-prime) is the accelerated version: faster generation at a higher price.

## Wan 3.0 vs Wan 3.0 Prime

Capabilities of the two model IDs on the async `/v1/videos` API used by this library:

| | `wan-3` | `wan-3-prime` |
|---|:---:|:---:|
| Text to video | ✓ | ✓ |
| References: up to 10 images, 5 clips, 5 audio, 20 total | ✓ | ✓ |
| Audio as the only reference | ✓ | — |
| First frame / first + last frame | ✓ | — (400 on this route) |
| Edit an existing 1–15 s clip | ✓ | — |
| `seed` (0–4294967295) | ✓ | — |
| Silent output (`generate_audio: false`) | ✓ | — |
| Duration | 2–30 s | 4–30 s |
| Aspect ratios | 21:9, 16:9, 4:3, 1:1, 3:4, 9:16, adaptive | 16:9, 1:1, 9:16 |
| Turnaround | standard | faster |

Both: 480p, 720p or 1080p; prompt up to 20,000 characters; reference clips 1–15 s each and 15 s per kind, with output plus reference video at most 30 s; one video per request.

## Writing prompts for Wan

- **Give long takes a route.** At 20–30 s, write the shot as stages ("start on…, glide past…, rise to…, end on…") or hold the camera and let one thing change.
- **Name the sound.** Both models generate a soundtrack (`wan-3` unless you turn it off), so ambience, dialogue in quotes and music cues belong in the prompt.
- **Point at assets** as `@Image 1`, `@Video 1`, `@Audio 1`, numbered in the order you pass them. In an edit, `@Video 1` is the clip being edited.
- **For edits, say what stays.** "Keep the people, their movement and the camera move" protects everything you did not ask to change.
- **Frames:** `adaptive` keeps the first frame's shape on `wan-3`; a fixed ratio crops it.
- **Iterate on a seed** (`wan-3`): fix the seed, change one phrase, compare.
- **Draft at 480p**, then render the keeper at 720p or 1080p.

## Run a prompt

The library runs against [ArgoLink](https://argolink.io/gh-wan-prompts), which serves both models on one API. Its per-second rates are the costs listed below; Alibaba's own list prices are shown for comparison.

| Per second | 480p | 720p | 1080p |
|---|---:|---:|---:|
| `wan-3` on [ArgoLink](https://argolink.io/en/models/wan-3) | $0.038 | $0.075 | $0.15 |
| `wan3.0-video` on Alibaba Cloud, Singapore list price | $0.05 | $0.10 | $0.20 |
| `wan-3-prime` on [ArgoLink](https://argolink.io/en/models/wan-3-prime) | $0.051 | $0.11 | $0.21 |
| `wan3.0-video-prime` on Alibaba Cloud, Singapore list price | $0.068 | $0.14 | $0.28 |

<sub>All read 2026-10-07. Alibaba's US and other global regions list lower prices ($0.041256 / $0.082513 / $0.165025 for Wan 3.0 and $0.0636 / $0.127199 / $0.254399 for Prime). Billed seconds = output seconds plus reference-clip seconds; an edit counts the source clip twice; reference images and audio are free; failed jobs are not billed.</sub>

```bash
git clone https://github.com/casimirvance5/wan-prompts && cd wan-prompts
export WAN_API_KEY=your-key                                  # Node 18+, nothing to install

node wan.mjs list                                             # all 33 with model, settings, cost
node wan.mjs run 1 --dry-run                                  # print the request, send nothing
node wan.mjs run 1 --out market.mp4                           # submit, wait, save
node wan.mjs run 18 --source street.mp4 --image car.png       # local files are uploaded first
```

The same request with curl:

```bash
curl https://argolink.io/v1/videos/generations \
  -H "Authorization: Bearer $WAN_API_KEY" -H "Content-Type: application/json" \
  -d "$(node wan.mjs run 2 --dry-run 2>/dev/null)"
# -> {"request_id": "..."}; poll GET /v1/videos/{request_id} until "done", then GET /v1/videos/{request_id}/content
```

## The library

<!-- library:start -->
| # | Prompt | Model | Mode | Settings | Cost |
|---:|---|---|---|---|---:|
| 1 | [One-take market walk](#1-one-take-market-walk) | `wan-3` | text | 30 s · 720p · 21:9 | $2.250 |
| 2 | [Lighthouse from dusk to dark](#2-lighthouse-from-dusk-to-dark) | `wan-3` | text | 24 s · 1080p · 16:9 | $3.600 |
| 3 | [Train window journey](#3-train-window-journey) | `wan-3` | text | 20 s · 720p · 16:9 | $1.500 |
| 4 | [Bread from dough to loaf](#4-bread-from-dough-to-loaf) | `wan-3` | text | 18 s · 720p · 1:1 | $1.350 |
| 5 | [Cheap long draft](#5-cheap-long-draft) | `wan-3` | text | 30 s · 480p · 9:16 | $1.140 |
| 6 | [Mascot in three places at once](#6-mascot-in-three-places-at-once) | `wan-3` | reference | 12 s · 720p · 16:9 | $0.900 |
| 7 | [Product hero on Prime](#7-product-hero-on-prime) | `wan-3-prime` | reference | 6 s · 1080p · 9:16 | $1.260 |
| 8 | [Two references, one handshake](#8-two-references-one-handshake) | `wan-3` | reference | 8 s · 720p · 16:9 | $0.600 |
| 9 | [Pet in a costume](#9-pet-in-a-costume) | `wan-3` | reference | 6 s · 720p · 1:1 | $0.450 |
| 10 | [Product photo to motion](#10-product-photo-to-motion) | `wan-3` | first frame | 5 s · 1080p · adaptive | $0.750 |
| 11 | [Portrait to cinemagraph](#11-portrait-to-cinemagraph) | `wan-3` | first frame | 6 s · 720p · adaptive | $0.450 |
| 12 | [Landscape photo, vertical crop](#12-landscape-photo-vertical-crop) | `wan-3` | first frame | 8 s · 720p · 9:16 | $0.600 |
| 13 | [Concept art to opening shot](#13-concept-art-to-opening-shot) | `wan-3` | first frame | 10 s · 1080p · adaptive | $1.500 |
| 14 | [Before and after renovation](#14-before-and-after-renovation) | `wan-3` | first last frame | 8 s · 720p · adaptive | $0.600 |
| 15 | [Seasons in one tree](#15-seasons-in-one-tree) | `wan-3` | first last frame | 10 s · 1080p · 16:9 | $1.500 |
| 16 | [Character turnaround](#16-character-turnaround) | `wan-3` | first last frame | 4 s · 720p · adaptive | $0.300 |
| 17 | [Day footage to night](#17-day-footage-to-night) | `wan-3` | edit | edit of a 8 s clip · 720p | $1.200 |
| 18 | [Swap one object](#18-swap-one-object) | `wan-3` | edit | edit of a 6 s clip · 720p | $0.900 |
| 19 | [Live action to watercolor](#19-live-action-to-watercolor) | `wan-3` | edit | edit of a 10 s clip · 1080p | $3.000 |
| 20 | [Remove the crowd](#20-remove-the-crowd) | `wan-3` | edit | edit of a 5 s clip · 720p | $0.750 |
| 21 | [New sky, same shot](#21-new-sky-same-shot) | `wan-3` | edit | edit of a 12 s clip · 1080p | $3.600 |
| 22 | [Visualize a podcast line](#22-visualize-a-podcast-line) | `wan-3` | reference | 10 s · 720p · 16:9 | $0.750 |
| 23 | [Abstract shapes to a beat](#23-abstract-shapes-to-a-beat) | `wan-3` | reference | 8 s · 480p · 1:1 | $0.304 |
| 24 | [Singer from a photo and a track](#24-singer-from-a-photo-and-a-track) | `wan-3` | reference | 12 s · 720p · 9:16 | $0.900 |
| 25 | [Storyboard frame in motion](#25-storyboard-frame-in-motion) | `wan-3-prime` | text | 5 s · 480p · 16:9 | $0.255 |
| 26 | [Square social loop](#26-square-social-loop) | `wan-3-prime` | text | 6 s · 720p · 1:1 | $0.660 |
| 27 | [Vertical teaser with a reference clip](#27-vertical-teaser-with-a-reference-clip) | `wan-3-prime` | reference | 8 s · 720p · 9:16 | $1.320 |
| 28 | [Widescreen establishing shot](#28-widescreen-establishing-shot) | `wan-3-prime` | text | 4 s · 1080p · 16:9 | $0.840 |
| 29 | [Website hero background](#29-website-hero-background) | `wan-3` | text | 10 s · 1080p · 21:9 | $1.500 |
| 30 | [Fireplace ambience](#30-fireplace-ambience) | `wan-3` | text | 30 s · 720p · 16:9 | $2.250 |
| 31 | [Slide deck backdrop](#31-slide-deck-backdrop) | `wan-3` | text | 8 s · 720p · 16:9 | $0.600 |
| 32 | [Same seed, three lenses](#32-same-seed-three-lenses) | `wan-3` | text | 5 s · 480p · 16:9 | $0.190 |
| 33 | [Lock a look, change the weather](#33-lock-a-look-change-the-weather) | `wan-3` | text | 6 s · 720p · 9:16 | $0.450 |

### Long takes (up to 30 s)

#### 1. One-take market walk

`wan-3` · text · 30 s · 720p · 21:9 · **$2.250**  
Assets: nothing

```text
A single continuous steadicam take through a morning fish market: start on ice crates of silver fish, glide past a vendor shouting prices, weave between customers, rise up a short staircase and end on a balcony looking down over the whole hall. Wet floors reflect the light. Constant market chatter, a bell rings near the end.
```

Script the path in stages (start, pass, rise, end) so a 30-second take has somewhere to go.

#### 2. Lighthouse from dusk to dark

`wan-3` · text · 24 s · 1080p · 16:9 · **$3.600**  
Assets: nothing

```text
Locked-off wide shot of a lighthouse on a rocky point as dusk turns to night: the sky shifts from orange to deep blue, the beam starts turning, waves break white on the rocks, the first stars appear. Steady surf, wind, a distant foghorn twice.
```

A locked camera and one slow change (light) is the safest use of a long duration.

#### 3. Train window journey

`wan-3` · text · 20 s · 720p · 16:9 · **$1.500**  
Assets: nothing

```text
View from a train window: fields, a river, a small village and a tunnel pass by; in the tunnel the glass shows the reflection of a woman reading, then daylight returns over the sea. Rhythmic rail clatter, a page turning.
```

A reflection beat in the middle breaks a long travelling shot without a cut.

#### 4. Bread from dough to loaf

`wan-3` · text · 18 s · 720p · 1:1 · **$1.350**  
Assets: nothing

```text
Top-down on a floured wooden table: hands knead a ball of dough, shape it, score the top with a blade, then the loaf sits golden and cracked on the same spot. Kneading thumps, a knife swish, the crackle of a fresh crust.
```

Process videos read well top-down: the frame stays fixed while the object changes.

#### 5. Cheap long draft

`wan-3` · text · 30 s · 480p · 9:16 · **$1.140**  
Assets: nothing

```text
Vertical timelapse-style shot of a busy crosswalk from above: waves of pedestrians and umbrellas cross as the light changes from green to red several times, a cyclist weaves through at the end. City noise, crossing signal beeps.
```

Judge pacing at 480p ($1.14 for 30 s) before rendering 1080p.

### References: characters and products

#### 6. Mascot in three places at once

`wan-3` · reference · 12 s · 720p · 16:9 · **$0.900**  
Assets: image: mascot character sheet; image: beach; image: snowy street

```text
@Image 1 waves on the beach from @Image 2, then the camera whips to the same mascot building a snowman on the street from @Image 3. Upbeat whistling, waves, then crunchy snow.
```

One character image plus one image per location keeps the mascot identical across places.

#### 7. Product hero on Prime

`wan-3-prime` · reference · 6 s · 1080p · 9:16 · **$1.260**  
Assets: image: the product, front facing

```text
@Image 1 stands on a wet black stone as water droplets bounce off it in slow motion, the camera tilts up from the base to the cap. Cold blue light, droplets ticking, a low hum.
```

Prime accepts 16:9, 1:1 or 9:16 only; this vertical hero fits a story ad.

#### 8. Two references, one handshake

`wan-3` · reference · 8 s · 720p · 16:9 · **$0.600**  
Assets: image: first person; image: second person

```text
In a bright glass office, @Image 1 stands up from the desk and shakes hands with @Image 2, who just walked in; both smile and sit down. Light keyboard noise, a door closing.
```

Give each person an action of their own so the two references do not blend.

#### 9. Pet in a costume

`wan-3` · reference · 6 s · 720p · 1:1 · seed 1234 · **$0.450**  
Assets: image: your dog; image: a pirate hat

```text
@Image 1 wears the hat from @Image 2 and proudly trots across a sandy beach toward the camera, tail wagging, waves behind. Paws on sand, gulls, a cheerful accordion tune.
```

The seed lets you change only the prompt wording and compare like for like.

### Image to video (first frame)

#### 10. Product photo to motion

`wan-3` · first frame · 5 s · 1080p · adaptive · **$0.750**  
Assets: your existing product photo

```text
The camera slowly orbits the product while soft light glides across its surface; everything else in the photo stays still. Quiet studio air.
```

adaptive keeps the photo's own framing; a fixed ratio would crop it.

#### 11. Portrait to cinemagraph

`wan-3` · first frame · 6 s · 720p · adaptive · silent · **$0.450**  
Assets: a portrait photo

```text
Only the hair and the scarf move in a light breeze; the face stays still, eyes blink once. Subtle, looping feel.
```

Silent output suits a cinemagraph that will play muted in a feed.

#### 12. Landscape photo, vertical crop

`wan-3` · first frame · 8 s · 720p · 9:16 · **$0.600**  
Assets: a wide landscape photo

```text
Clouds roll over the mountains and the lake ripples as the camera tilts slowly from the shore up to the peaks. Wind and water lapping.
```

On wan-3 a fixed ratio with a first frame crops the photo, here to vertical.

#### 13. Concept art to opening shot

`wan-3` · first frame · 10 s · 1080p · adaptive · **$1.500**  
Assets: a concept painting of a floating city

```text
The camera pushes in through drifting clouds toward the floating city as airships cross in front of it and lights flicker on in the towers. Deep wind, distant engines, a rising string note.
```

Concept art makes a strong first frame for a title sequence.

### First + last frame transitions

#### 14. Before and after renovation

`wan-3` · first last frame · 8 s · 720p · adaptive · **$0.600**  
Assets: the empty old room; the same room renovated

```text
Walls repaint themselves, the old floor peels away into new oak, furniture slides into place and lamps switch on. Quick construction sounds that settle into calm.
```

Both photos must be taken from the same spot for a clean morph.

#### 15. Seasons in one tree

`wan-3` · first last frame · 10 s · 1080p · 16:9 · **$1.500**  
Assets: the tree in winter; the same tree in full autumn color

```text
Snow melts, buds open into green leaves, summer light passes, and the leaves turn red and gold. Birdsong rises and fades with the seasons.
```

16:9 here crops both frames to widescreen; use adaptive to keep their shape.

#### 16. Character turnaround

`wan-3` · first last frame · 4 s · 720p · adaptive · **$0.300**  
Assets: the character facing front; the character seen from behind

```text
The character turns slowly on the spot, a full half turn, arms relaxed. Plain studio background, no sound but a soft footstep.
```

Turnarounds help when you build a character sheet for later reference jobs.

### Video edit

#### 17. Day footage to night

`wan-3` · edit · edit of a 8 s clip · 720p · **$1.200**  
Assets: the clip to edit

```text
Turn the scene into night: street lamps and shop signs glow, the sky is dark blue, wet asphalt reflects the lights. Keep the people, their movement and the camera move unchanged.
```

State what must stay unchanged; the edit keeps the clip's length and ratio.

#### 18. Swap one object

`wan-3` · edit · edit of a 6 s clip · 720p · **$0.900**  
Assets: the clip to edit; image: the new car

```text
Replace the parked red car with the car from @Image 1, matching the lighting and reflections. Everything else stays as it is.
```

In an edit @Video 1 is the clip being edited; extra references keep their own numbers.

#### 19. Live action to watercolor

`wan-3` · edit · edit of a 10 s clip · 1080p · **$3.000**  
Assets: the clip to edit

```text
Restyle the whole clip as a loose watercolor painting with visible paper texture and soft bleeding edges, keeping every movement and cut timing the same.
```

Style edits bill the source twice: 10 s source = 20 billed seconds.

#### 20. Remove the crowd

`wan-3` · edit · edit of a 5 s clip · 720p · **$0.750**  
Assets: the clip to edit

```text
Remove all the people in the background so the plaza is empty; keep the fountain, the pigeons and the camera move.
```

Short sources keep edits cheap while you test the instruction.

#### 21. New sky, same shot

`wan-3` · edit · edit of a 12 s clip · 1080p · silent · **$3.600**  
Assets: the clip to edit

```text
Replace the flat grey sky with a dramatic sunset of orange and violet clouds and warm the light on the buildings to match. No other changes.
```

Silent output avoids replacing the clip's original sound when you remux later.

### Audio-driven

#### 22. Visualize a podcast line

`wan-3` · reference · 10 s · 720p · 16:9 · **$0.750**  
Assets: audio: a 10 s voice clip

```text
An animated chalkboard illustrates the story told in @Audio 1: simple drawings appear in sync with each idea, a hand sketching quickly.
```

On wan-3 audio may be the only reference; Prime would need an image or video too.

#### 23. Abstract shapes to a beat

`wan-3` · reference · 8 s · 480p · 1:1 · **$0.304**  
Assets: audio: an 8 s drum loop

```text
Bold geometric shapes pulse, split and recombine on every hit of @Audio 1, bright primary colors on black.
```

480p keeps music visualizer drafts under $0.31 for 8 s.

#### 24. Singer from a photo and a track

`wan-3` · reference · 12 s · 720p · 9:16 · **$0.900**  
Assets: image: the singer; audio: the verse, 12 s

```text
@Image 1 sings @Audio 1 into a vintage microphone in a smoky jazz club, lips in sync, warm spotlight, slow push-in.
```

Audio references are free; only the 12 output seconds are billed.

### Fast drafts on Prime

#### 25. Storyboard frame in motion

`wan-3-prime` · text · 5 s · 480p · 16:9 · **$0.255**  
Assets: nothing

```text
A detective in a trench coat steps out of a taxi into heavy rain, looks up at a neon motel sign and pulls his hat down. Rain hiss, taxi door slam.
```

Prime's faster turnaround suits blocking out a scene; 5 s at 480p is $0.255.

#### 26. Square social loop

`wan-3-prime` · text · 6 s · 720p · 1:1 · **$0.660**  
Assets: nothing

```text
A cup of matcha is whisked into a bright green foam in a ceramic bowl, top view, a final swirl. Bamboo whisk sounds.
```

1:1 is one of Prime's three ratios.

#### 27. Vertical teaser with a reference clip

`wan-3-prime` · reference · 8 s · 720p · 9:16 · **$1.320**  
Assets: image: the hero character; video: a 4 s camera move

```text
@Image 1 runs up a spiral staircase toward the light at the top, the camera moving like @Video 1. Echoing footsteps, heavy breathing.
```

8 output seconds + 4 reference seconds = 12 billed seconds on Prime.

#### 28. Widescreen establishing shot

`wan-3-prime` · text · 4 s · 1080p · 16:9 · **$0.840**  
Assets: nothing

```text
Aerial shot over a coastal town at sunrise, fishing boats leaving the harbor in a line. Gulls, distant engines.
```

Prime's minimum is 4 s; Wan 3.0 goes down to 2 s.

### Silent loops and backgrounds

#### 29. Website hero background

`wan-3` · text · 10 s · 1080p · 21:9 · silent · **$1.500**  
Assets: nothing

```text
Slow drifting macro of ink clouds blooming in clear water, deep blue and teal, very calm motion, no objects.
```

generate_audio false gives a silent file ready for an autoplay background.

#### 30. Fireplace ambience

`wan-3` · text · 30 s · 720p · 16:9 · silent · **$2.250**  
Assets: nothing

```text
Static close shot of logs burning in a stone fireplace, flames licking upward, embers glowing and falling. Warm, steady, hypnotic.
```

Add your own crackle track later; the price is the same with or without sound.

#### 31. Slide deck backdrop

`wan-3` · text · 8 s · 720p · 16:9 · silent · **$0.600**  
Assets: nothing

```text
Soft gradient light leaks in amber and rose drift slowly across a dark background, gentle bokeh, nothing in focus.
```

Keep backdrops low in contrast so slide text stays readable over them.

### Seeded variations

#### 32. Same seed, three lenses

`wan-3` · text · 5 s · 480p · 16:9 · seed 2026 · **$0.190**  
Assets: nothing

```text
A red vintage scooter parked on a cobblestone street in Rome at noon, a cat walks past it. Shot on a 24 mm wide lens. Vespa idle, church bells.
```

Rerun with the same seed changing only the lens (24 mm, 50 mm, 85 mm) to compare framing.

#### 33. Lock a look, change the weather

`wan-3` · text · 6 s · 720p · 9:16 · seed 77 · **$0.450**  
Assets: nothing

```text
A lone hiker stands on a ridge looking over a valley, light rain falling, mist in the trees. Raindrops on the jacket, distant thunder.
```

Keep the seed and swap 'light rain' for 'clear sunset' to get a matching pair.
<!-- library:end -->

## Adding prompts

Append a line to `library.jsonl` (keep `n` sequential), run `node --test` to check it against the model rules, and paste the output of `node wan.mjs readme` between the library markers in this README.

## License

MIT
