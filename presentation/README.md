# Copilot, Traced

### *Your AI pair programmer is a distributed system. Instrument it like one.*

**25 minutes · developer audience · 4 live demos · everything runs offline**

**Watch it online:** <https://copilot-opentelemetry.isainative.dev/presentation/> ·
interactive figures at <https://copilot-opentelemetry.isainative.dev/presentation/interactive/>

---

## Abstract

You have instrumented every service you own — traces, dashboards, alerts, an on-call rota — and then you
let the tool that writes your code run as a black box. How many tokens did your last Copilot turn send?
What did it cost? Was any of it cached, or did you pay full price to re-send a prompt the model had
already seen thirty seconds earlier? Almost nobody can answer, and almost nobody realises that Copilot
has been emitting OpenTelemetry this whole time — real OTLP, real GenAI semantic conventions, four
settings away from landing in the Grafana or Application Insights you already run. This talk turns
Copilot into a service you can actually observe: we read one real turn as a span tree, learn why a single
moved byte costs twenty-one thousand tokens, build a telemetry pipeline live and take the generated
config with us, and put a number on what a bad prompt prefix costs a forty-person team per month. We also
cover the parts the docs get wrong — the cost attribute that is documented under one name and shipped
under another, and why "content capture off" is not the same as anonymous. You'll leave able to see your
own prompt-cache hit rate in about twenty minutes, on your laptop, without asking anyone's permission.

---

## Contents

| Path | What it is |
| --- | --- |
| `slides.html` | The deck. 24 slides, self-contained, opens straight from disk. |
| `index.html` | Redirect to `slides.html`, so `/presentation/` works when the folder is served. |
| `talk-track.md` | Word-for-word script with timing marks, demo click-paths, cut lines and Q&A prep. |
| `interactive/index.html` | All four interactive figures on one scrollable page. |
| `interactive/figure.html?f=…` | One figure, full-window — for demoing or sharing on its own. |
| `figures/*.svg` | Seven static illustrations, also usable in blog posts and docs. |
| `assets/css/deck.css` | The visual system. |
| `assets/js/deck.js` | Deck engine: navigation, pacing timer, notes, overview, export. |
| `assets/js/figures.js` | The four interactive figures. Classic script, no build step. |
| `assets/img/` | Dashboard crops used by slides 14–15, plus the favicon. Full-resolution originals live in `../docs/images/`. |

---

## Presenting it

Open `presentation/slides.html` in any modern browser. There is no build step and no server required —
`file://` works. The only network dependency is Google Fonts; offline it falls back to system fonts and
still looks fine.

| Key | Does |
| --- | --- |
| <kbd>→</kbd> <kbd>Space</kbd> <kbd>PgDn</kbd> | Next slide |
| <kbd>←</kbd> <kbd>PgUp</kbd> | Previous slide |
| <kbd>N</kbd> | Speaker notes drawer (per-slide script, demo click-paths, pacing) |
| <kbd>O</kbd> | Overview grid — jump anywhere |
| <kbd>T</kbd> | Start / pause the 25-minute pace timer (<kbd>Shift</kbd>+<kbd>T</kbd> resets it) |
| <kbd>F</kbd> | Fullscreen |
| <kbd>E</kbd> | Export mode (all slides stacked) — then print to PDF |
| <kbd>?</kbd> | Shortcut help |
| <kbd>Home</kbd> <kbd>End</kbd> | First / last slide |

**The pace timer is the useful bit.** Every slide declares the time it should be reached. Once the timer
is running it turns **green** when you're ahead of that mark and **amber** when you're behind — so you
never have to work out whether to start cutting. The notes drawer flags which slides are safe to drop
(slides 13 and 22), and `talk-track.md` has a full rescue table.

Slide URLs are hash-routed (`slides.html#16`), so you can link straight to a slide or reload without
losing your place.

### Exporting to PDF

Press <kbd>E</kbd> (or open `slides.html?export=1`), then print. Set paper size to **1280 × 720 px**,
margins **none**, and enable **background graphics**. The interactive figures render in whatever state
they're in, so set them up the way you want them frozen before exporting.

### The live demos

Four slides are live, not screenshots: **8** (trace explorer), **12** (pipeline builder), **16** (cache
timeline), **17** (cache economics). They keep their state as you navigate, so you can set one up during
a break and come back to it. Click-by-click paths for each are in the speaker notes and in
`talk-track.md`.

If a projector or a browser lets you down, `interactive/figure.html?f=trace` (or `timeline`, `pipeline`,
`economics`) opens the same figure full-window as a standalone page.

---

## Where the numbers come from

Everything in the deck is grounded in this repository's README and in spans captured off the wire — no
invented benchmarks.

- **Cache hit / miss** — `gen_ai.usage.cache_read.input_tokens > 0` is a hit,
  `gen_ai.usage.cache_creation.input_tokens > 0` is a miss.
- **`github.copilot.nano_aiu`** — the docs say `github.copilot.aiu`; the wire says `nano_aiu`. Verified
  against Copilot CLI 1.0.76: a turn reported as "AI Credits 20.5" emitted `20546625000`.
- **Surface coverage** — VS Code (`copilot-chat`), Copilot CLI and the desktop app (`github-copilot`),
  the SDK (configurable), Claude via Copilot (`claude-code`), JetBrains (service name not yet
  documented). Visual Studio and the cloud coding agent do not export today.
- **Privacy** — with `captureContent: false`, `enduser.pseudo.id`, `gen_ai.tool.definitions`,
  `github.copilot.context.skills`, custom agent names and `github.copilot.git.*` still ship on every
  span. The collector's `attributes/scrub` processor removes them.

The **cache economics** figure is explicitly a *model*, and the deck says so out loud: cached input is
priced at roughly 10% of fresh input, credits are calibrated from the real span above, and the timing
figures come from measured time-to-first-token (0.94 s cold vs 0.31 s on a hit). Treat the shape as
real and the absolute numbers as illustrative — which is the honest way to present it.

---

## Reusing the pieces

The SVGs in `figures/` are plain, hand-written, dark-theme illustrations at 1120 px wide with proper
`<title>`/`<desc>` for screen readers. They drop into blog posts and docs unchanged.

The interactive figures expose a tiny API — mount any of them into any element:

```html
<div id="host" style="height:560px"></div>
<script src="assets/js/figures.js"></script>
<script>
  CopilotFigures.mount('timeline', document.getElementById('host'));
  // names: 'trace' · 'economics' · 'pipeline' · 'timeline'
</script>
```

No bundler, no dependencies, no globals beyond `window.CopilotFigures`.

---

## Links

- Repository — <https://github.com/webmaxru/copilot-opentelemetry>
- Project site — <https://copilot-opentelemetry.isainative.dev/>
- Dashboards — `dashboards/tempo/` (TraceQL) and `dashboards/appinsights/` (KQL) in the repo root

MIT licensed, like the rest of the repository.
