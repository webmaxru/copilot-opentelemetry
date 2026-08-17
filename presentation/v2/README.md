# Copilot, Traced - v2

The compressed **20-minute** edition: 17 slides, 3 interactive demos, and a separate presenter view
for speaker notes.

## URLs

- **Audience slides:** <https://copilot-opentelemetry.isainative.dev/presentation/v2/>
- **Presenter notes:** <https://copilot-opentelemetry.isainative.dev/presentation/v2/presenter.html>

The audience page does **not** load `assets/js/notes.js` and has no notes drawer. Speaker notes exist
only in `presenter.html`, so sharing the audience browser window cannot reveal them.

## Two-monitor setup

1. Open the **presenter notes** URL on the second monitor.
2. Select **Open audience window**.
3. Move the new audience window to the monitor you will share and press <kbd>F</kbd> for fullscreen.
4. In Teams, Zoom, or Meet, share the **audience window**, not the entire desktop.
5. Start the 20-minute timer in the presenter view. Use the arrow keys from either window; the two
   views stay synchronized through `BroadcastChannel`, with a same-origin storage fallback.

The hosted URLs are the recommended setup. The audience deck can open directly from disk, but
cross-window synchronization is browser-dependent for `file://` pages.

## What changed from v1

- Runtime reduced from 25:00 to exactly 20:00.
- Slide count reduced from 24 to 17.
- Live demos reduced from four to three: trace explorer, pipeline builder, and cache-miss timeline.
- The rollout slide and the six-traps slide were removed completely.
- The double-standard and distributed-system setup became one slide.
- The two dashboard slides became one.
- Cost and privacy became one current-docs guardrail slide.
- Speaker notes moved out of the audience document into a dedicated presenter-only data file.

## Documentation validation

Checked on **17 August 2026** against:

- [GitHub Copilot CLI OpenTelemetry monitoring](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#opentelemetry-monitoring)
- [VS Code: Monitor agent usage with OpenTelemetry](https://code.visualstudio.com/docs/agents/guides/monitoring-agents)
- [OpenTelemetry instrumentation for Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk/observability/opentelemetry)
- [Enterprise managed settings support matrix](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings)
- [JetBrains OpenTelemetry export announcement](https://github.blog/changelog/2026-07-27-github-copilot-for-jetbrains-adds-improvved-opentelemetry-configuration-and-model-management/)

Corrections reflected in v2:

- Current CLI docs list `github.copilot.cost` and `github.copilot.aiu` on `invoke_agent` and `chat`
  spans. The presenter notes retain the repo's wire observation that CLI 1.0.76 emitted
  `github.copilot.nano_aiu`, and recommend checking the file exporter before hard-coding a query.
- Tool schemas, prompts, responses, system instructions, tool arguments, and tool results are described
  as **content-capture-only**. V1's claim that tool definitions always ship with content capture off was
  removed.
- The privacy message now distinguishes content from metadata: the CLI can emit
  `enduser.pseudo.id`; VS Code can emit repository, branch, commit, and organization metadata; CLI
  lifecycle events can include skill names and paths.
- JetBrains is included as a documented export path, with its `service.name` explicitly left
  unverified.
- Cloud coding agent coverage is qualified as client-side session/outcome metrics, not direct export
  of the server-side execution trace.
- The deck says **traces and metrics**. It does not overclaim a separate logs pipeline.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Audience deck; no notes data or notes UI |
| `presenter.html` | Second-monitor notes, timer, pacing, sources, and slide controls |
| `assets/js/notes.js` | Presenter-only speaker notes and timing data |
| `assets/js/deck.js` | Audience navigation, figures, export, and presenter synchronization |
| `assets/js/presenter.js` | Presenter controls, timer, and audience synchronization |
| `talk-track.md` | 20-minute timing map |

## Audience controls

| Key | Action |
| --- | --- |
| <kbd>Right</kbd> / <kbd>Space</kbd> / <kbd>PgDn</kbd> | Next slide |
| <kbd>Left</kbd> / <kbd>PgUp</kbd> | Previous slide |
| <kbd>O</kbd> | Slide overview |
| <kbd>P</kbd> | Open the separate presenter window |
| <kbd>F</kbd> | Fullscreen |
| <kbd>E</kbd> | Export mode, then print to PDF |
| <kbd>?</kbd> | Help |

## Presenter controls

| Key | Action |
| --- | --- |
| <kbd>Right</kbd> / <kbd>Space</kbd> | Next slide in both windows |
| <kbd>Left</kbd> | Previous slide in both windows |
| <kbd>T</kbd> | Start or pause timer |
| <kbd>Shift</kbd>+<kbd>T</kbd> | Reset timer |
| <kbd>F</kbd> | Fullscreen presenter view |

The pace label turns green when ahead, blue when on time, and amber when behind.
