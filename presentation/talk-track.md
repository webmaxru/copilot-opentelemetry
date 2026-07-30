# Copilot, Traced — full talk track

**Runtime:** 25:00 to the last slide. Q&A after.
**Audience:** developers. Assume they know distributed tracing; assume they know nothing about Copilot telemetry.
**Deck:** `slides.html` (press <kbd>N</kbd> for these notes inside the deck, <kbd>?</kbd> for all shortcuts).

Every heading below carries the **planned arrival time** — the moment you should *land* on that slide.
The deck's HUD timer turns green when you're ahead of that mark and amber when you're behind, so you
never have to do arithmetic on stage.

Text in quotes is what you say. Text in *italics* is what you do.

---

## Chapter 1 — the blind spot (0:00 → 2:55)

### Slide 1 · 0:00 · "Copilot, Traced"

*Don't talk over the title. Let it sit for three seconds. Then, no preamble, no "hi my name is":*

> "Everyone in this room has instrumented a service. You know what p99 means. You've stared at a flame
> graph at eleven at night trying to work out which downstream call went bad.
>
> Now — quick — think about the last thing GitHub Copilot did for you today. And hold that thought,
> because I'm going to ask you three questions about it."

*Advance immediately. Don't do the "about me" slide. There isn't one.*

---

### Slide 2 · 0:45 · Three questions

*Read the three cards. Slow down. Put a beat between each one. Do not rush this — the whole talk hangs
off the audience noticing they can't answer.*

> "One. How many tokens did that turn send? Not roughly — the number.
>
> Two. What did it cost? In credits. For that one turn, on that one repo.
>
> Three — and this is the one — was any of it cached? Or did you pay full price to re-send a prompt the
> model had already seen, word for word, thirty seconds earlier?"

*Pause. Look at the room, not the screen.*

> "I've asked this at three meetups now. Nobody has answered. Not once. And these are people who would
> absolutely notice a 200-millisecond regression in a checkout endpoint."

**Cue:** if someone shouts an answer, take it — "Great, you're the one. Where did you get it from?"
Ninety-nine times out of a hundred the answer is "the billing page", which is *monthly, aggregated, and
a month late.* That's a gift; use it.

---

### Slide 3 · 1:45 · The double standard

> "Here's the shape of it. Your checkout service — traced, dashboarded, alerted, on-call rota, error
> budget, the works.
>
> Copilot: a vibe. 'It felt slow this afternoon.' 'I think the new model is worse?'
>
> And Copilot is not a small dependency. It reads your files, calls your tools, hits the network several
> times per turn, and sends you an invoice. If a vendor shipped you a service like that with no metrics
> you would not accept it."

**Transition:**

> "So the obvious question is: why don't we instrument it? And the answer surprised me, because the
> answer is — we can. It's already emitting. Most people just don't know the switch exists."

---

## Chapter 2 — it's already talking (2:55 → 5:45)

### Slide 4 · 2:55 · The reframe

*This is the thesis. Slow, deliberate delivery. This sentence should be the one they tweet.*

> "There is a distributed system running on your laptop, and you have been calling it autocomplete.
>
> A planner that calls a model. A model that calls tools. Tools that call your file system, your shell,
> an MCP server two networks away. Retries. Timeouts. A cache. And a bill.
>
> You have instrumented this exact shape a hundred times. It's a service mesh with a language model in
> the middle. The only unusual thing about it is that nobody told you it was there."

---

### Slide 5 · 3:50 · The whole integration

*Let them read the two code blocks. Say the number out loud:*

> "Four settings in VS Code. Two environment variables for the CLI. That is the entire integration.
>
> No SDK. No agent to inject. No proxy in front of anything. Copilot speaks OTLP natively — you are
> just telling it where to send what it already produces."

*Point at the callout.*

> "And this is the part that matters more than the setup: it's real OpenTelemetry, and the attributes
> follow the GenAI semantic conventions. So it lands in Tempo, Jaeger, Application Insights, Grafana
> Cloud, Honeycomb, Datadog — whatever you already run. There is no new vendor in this talk."

*Point at the CLI comment.*

> "One thing to notice now, because it'll matter in ten minutes: I did **not** set `OTEL_SERVICE_NAME`.
> Leave it unset. That single omission is what keeps VS Code and the CLI separable on the dashboard."

---

### Slide 6 · 4:50 · The honest coverage map

*Credibility slide. Twenty seconds, no more — but do not skip it. Nothing buys a technical audience's
trust faster than volunteering the limits.*

> "Before anyone promises their VP a dashboard: this is the honest coverage.
>
> VS Code and the CLI are solid — I've verified both on the wire. The SDK is configurable. The desktop
> Copilot app rides the CLI runtime, so it reports as `github-copilot` too. JetBrains got a panel this
> month, but GitHub hasn't documented the service name, so I'm not going to invent one for you.
>
> Visual Studio: nothing today. The cloud coding agent that opens PRs: server-side, you don't get it.
>
> Two surfaces is enough. That's most of your day."

---

## Chapter 3 — the vocabulary (5:45 → 10:40)

### Slide 7 · 5:45 · Anatomy of one turn

*Walk the tree top-down, once. Point at each span with the cursor as you name it.*

> "Here's what actually comes out. One turn, one trace.
>
> **`invoke_agent`** is the turn. It's the root, and it's the only span carrying cost and the agent
> identity — which is why you sum credits here and nowhere else, or you double-count.
>
> **`chat`** is one LLM round trip. Tokens live here. So does the cache.
>
> **`execute_tool`** is a tool call — same as any downstream dependency span you've ever looked at."

*Point at the two chat spans.*

> "Now look at the two `chat` spans. The first one is orange. The second one is green. Hold that
> thought for ninety seconds."

---

### Slide 8 · 6:45 · ▶ DEMO 1 — Trace explorer

*Live figure. Click, don't narrate abstractly. Suggested path:*

**1 · Click the first `chat` span.**

> "Cold start. `cache_creation.input_tokens` is 21,504 — the entire prompt just got written into the
> cache. Time to first token: 0.94 seconds."

**2 · Click the second `chat` span** (the one below the two tool calls).

> "Same session, seconds later. Now `cache_read.input_tokens` is 21,504 and creation is 1,606 — only
> the new turn was fresh. Time to first token: 0.31 seconds. Three times faster, for the same prompt,
> because it didn't have to be re-sent."

**3 · Click the last `chat` span** and point at the compaction event marker.

> "And down here is a span *event* — `session.compaction_complete`. Copilot is telling you, in the
> trace, the exact moment it rewrote your conversation history. Remember that; it's the single most
> useful correlation in this whole talk."

**4 · Hit the surface toggle** (VS Code ↔ Copilot CLI).

> "Same attributes, different `service.name`. That's the only difference. Which means one dashboard
> covers both."

**If you're behind:** do steps 1 and 2 only, then move on. They're the payload.

---

### Slide 9 · 8:30 · How the prompt cache works

> "So why is one of those cheap and one expensive?
>
> The prompt is a sequence: system prompt, tool definitions, conversation history, your new message.
> The cache keys on the **prefix**. If the prefix is byte-identical to last time, the model reads it
> back instead of re-processing it.
>
> Change one token near the front — a timestamp, a reordered tool, a compacted history — and everything
> after it is new again. One byte moves, and you re-send twenty-one thousand tokens.
>
> This is not a Copilot quirk. It's how every major provider's prompt cache works. What's new is that
> you can now *see* it happen."

*Point at the bottom line.*

> "And the definitions are trivially simple. `cache_read.input_tokens` greater than zero: hit.
> `cache_creation.input_tokens` greater than zero: miss. Both zero: no cache in play at all."

---

### Slide 10 · 9:30 · Why hit rate is the metric

> "If you take one number away from this talk, take this one.
>
> Cache hit rate means your prompt is stable — a well-behaved system prompt, a tool inventory that
> isn't shuffling, sessions that aren't thrashing their context window.
>
> It predicts cost, because cached input bills at a fraction of fresh input. Your hit rate falls today;
> the finance conversation happens next month.
>
> And it predicts latency, because a hit shaves most of the time-to-first-token. 'Copilot feels
> sluggish this week' is usually a hit-rate chart that nobody was looking at."

**Transition:**

> "Right. You know what it emits and which number matters. Let's point it somewhere."

---

## Chapter 4 — wire it up (10:40 → 14:15)

### Slide 11 · 10:40 · Two surfaces, four backends

*Don't read all four. Give them the shape and one sentence each.*

> "Same wire, four reasonable destinations.
>
> **A** — local Docker. Tempo and Grafana on your laptop. Free, offline, nothing leaves the machine.
> Start here, today, without asking anyone.
>
> **B** — a collector on your laptop fanning out to Tempo *and* Application Insights. You get TraceQL
> and KQL over the same spans.
>
> **C** — that same collector on Azure Container Apps, scale-to-zero, bearer auth. This is the one you
> point a team at.
>
> **D** — straight to Grafana Cloud. Free tier, nothing to run. But no collector in the path means
> nothing gets scrubbed, and I'll come back to why that matters."

*Point at the footer.*

> "A collector buys you three things: redaction, fan-out, and batching with retry. Going direct buys
> you none of them."

---

### Slide 12 · 11:40 · ▶ DEMO 2 — Pipeline builder

*Live figure. Let them drive if it's a small room — genuinely ask "who wants which backend?"*

**1 · Start on A with both surfaces on.**

> "Both surfaces, local Docker. Free, offline, per-machine. Twenty minutes of work."

**2 · Click B.**

> "Now a collector appears in the path, and it fans out. Notice that the config below changed with it."

**3 · Click C.**

> "Same collector, on Azure, scale-to-zero — so it costs nothing when nobody's coding. This is the
> fleet answer."

**4 · Click the `Fleet · managed-settings.json` tab.**

> "And this is what you hand your platform team."

**5 · Click D, then point at the missing collector.**

> "Free tier, nothing to run — and no place to strip anything before it leaves. Which is the perfect
> setup for the next slide."

**If you're behind:** click A → C → done.

---

### Slide 13 · 13:20 · Surface ≠ agent  *(cuttable)*

> "One gotcha that will bite you in week one.
>
> `service.name` tells you which **runtime** emitted the span. `gen_ai.agent` tells you what was
> **running inside it**. They are not the same axis.
>
> Start the CLI inside a VS Code terminal and one session lands in two cells — the extension wrapper
> reports `copilot-chat`, the native spans report `github-copilot`. Filter on `service.name` alone and
> you count that session twice.
>
> Filter on both, and you get an honest number."

---

## Chapter 5 — see it (14:15 → 17:55)

### Slide 14 · 14:15 · The dashboard

*Let it breathe for three seconds before you say anything. The picture does the work.*

> "This is what falls out. Fifteen minutes after you start.
>
> One dropdown at the top — All, VS Code, Copilot CLI. Cache reads, cache creations, calls and p50 by
> model, top tools, and every recent call linking straight through to the raw trace.
>
> Nothing here is bespoke. It's a Grafana dashboard over a Tempo data source. The JSON is in the repo —
> import it into whatever Grafana you already have."

---

### Slide 15 · 15:15 · VS Code vs CLI, side by side

> "Same panels, one variable changed. And this is why the dropdown exists.
>
> Agent sessions and foreground chat behave nothing alike — turn length, tool-call volume, how fast
> they burn the context window. Average them together and you get a number that describes neither."

---

### Slide 16 · 16:15 · ▶ DEMO 3 — Why the cache missed

*The best demo in the deck. Start with everything off.*

> "One session, twenty-six turns. Everything off: one cold miss at the start, then green all the way.
> Ninety-six percent. That's the ceiling, and it's reachable."

**1 · Flip *A timestamp in the system prompt*.** *Let the strip go orange.*

> "Every single turn is now a miss. One volatile token at the front of the prefix. This is a real bug
> in real prompt templates — and you cannot *feel* it. You can only see it."

**2 · Turn it off. Flip *Tool inventory reorders*.**

> "MCP servers registering in a race. Same tools, different order, different prefix, one miss in three."

**3 · Turn it off. Flip *Long session → compaction*** and point at the diamonds.

> "Those diamonds are span events — `session.compaction_complete`. Copilot is telling you it rewrote
> the prefix. Overlay them on the miss chart and you have cause sitting next to effect."

**4 · Flip everything on.**

> "And this is a bad Tuesday. Every one of these is fixable, and every one of them is invisible without
> the trace."

---

## Chapter 6 — what it's worth (17:55 → 21:00)

### Slide 17 · 17:55 · ▶ DEMO 4 — What a miss costs

*Start on the `solo dev` preset.*

> "One developer. Look at the number of tokens re-sent per month — tokens the model had already seen.
> Annoying, survivable."

**1 · Click `40-dev team`.**

> "Now multiply by a team."

**2 · Drag the hit-rate slider from 95% down to 60%.**

> "That is the difference between a stable prompt and a sloppy one. Nobody files a bug for this. It
> shows up on the invoice, one month later, with no explanation attached."

**3 · Click `after tuning`.**

> "And that's the recovery. Same team, same work, stable prefix."

*Be honest about the model — point at the small print bottom-left:*

> "These multipliers are a model, not a receipt — cached input at roughly a tenth of fresh, credits
> calibrated against a real span. The point isn't the exact number. The point is that for the first
> time it's a number at all, and it's *your* number, from *your* traces."

---

### Slide 18 · 19:40 · Cost is on the span

> "And you don't have to infer cost any more — it's on the span. `github.copilot.cost`, server
> duration, time-to-first-chunk, turn count."

*Point at the callout. This is the fun bit — a war story in fifteen seconds.*

> "Now, a small field note that cost me an evening. The documentation says the attribute is
> `github.copilot.aiu`. The wire says `github.copilot.nano_aiu`.
>
> I verified it against Copilot CLI 1.0.76: a run the CLI reported as 'AI Credits 20.5' emitted
> `nano_aiu = 20546625000`. Divide by 1e9.
>
> And the nice ending: Grafana has an SI nano unit. Set the field unit to `si:nAIU` and it rescales
> for you, with no transformation at all."

---

## Chapter 7 — the fine print (21:00 → 23:05)

### Slide 19 · 21:00 · "Off" is not "anonymous"

*Slow down. This is the slide you'd want someone to show you before you rolled this out to a team.*

> "Everybody sets `captureContent: false` and stops worrying. That setting is real — your prompts, the
> model's responses, file contents, diffs, tool arguments. None of it leaves the machine. That part
> works exactly as advertised.
>
> But here's what still ships, on every span, with content capture off. I checked this on the wire.
>
> A stable pseudonymous user id. Your full tool and MCP inventory. Every skill installed locally. Your
> custom agent names. Repo URL, branch, commit, org.
>
> Content capture off does not mean anonymous. Every span is attributable to one named developer, and
> the tool inventory alone tells you a great deal about how someone works."

*Point at the YAML.*

> "The fix is four lines in the collector — an attributes processor that deletes them. Which is the
> real argument for having a collector in the path at all. For a backend you don't own, this is not
> optional.
>
> And if you go with option D, straight to a managed backend with no collector — you don't have this
> lever. Know that before you choose it, not after."

---

### Slide 20 · 22:10 · Rolling it out to a fleet

> "Since mid-2026 this is a supported path instead of a hack. Three delivery channels — native MDM,
> a server-managed `managed-settings.json` in a private repo, or a root-owned file on disk. Winner
> takes all; the blocks don't merge.
>
> You can force telemetry on, lock content capture off so developers can't turn it back on, attach an
> auth header, and stamp team attributes onto every span.
>
> Two warnings. Do **not** set `serviceName` fleet-wide — it collapses every surface into one name and
> you lose the whole dashboard. And managed headers reach the Chat extension's exporter only, never the
> agent host — deliberately, to keep tokens out of subprocesses. If you need auth for everything, put a
> collector inside your network.
>
> Verify what actually landed with `Developer: Policy Diagnostics`."

---

## Chapter 8 — Monday (23:05 → 25:00)

### Slide 21 · 23:05 · Monday morning, in order

> "Three steps, and the order is the whole point.
>
> **Twenty minutes.** `docker compose up -d`, paste four settings, use Copilot normally for an hour,
> open localhost. Nothing leaves your laptop. No cloud account, no approval, no meeting.
>
> **One afternoon.** Sort by `cache_creation.input_tokens`, find your worst prefix. Look for a repeating
> high value — that's your volatile token. Overlay the session events to see whether it's compaction or
> something you wrote.
>
> **Then, and only then, talk about a fleet.** Collector in the path, drop the pseudo id, roll it out
> with managed settings."

*Point at the callout.*

> "Every failed observability rollout I've watched started at step three. Earn the fleet with a number
> you already have."

---

### Slide 22 · 24:00 · Six traps  *(cuttable — skip this if the timer is amber)*

*Speed-read. Don't dwell; this slide exists so people can screenshot it.*

> "Six things that will cost you an evening, pre-sprung. Traces-only pipelines silently drop metrics.
> The CLI defaults to `http/json` and VS Code to `http/protobuf`. Don't set `OTEL_SERVICE_NAME`. Managed
> headers only reach the Chat extension. Use *User* settings, not Workspace, or you'll point your
> teammates' telemetry at your endpoint. And reload the window — the agent host reads config at start-up."

---

### Slide 23 · 24:30 · The close

*Stop clicking. Step away from the laptop. Say this to the room.*

> "We let the tool that writes our code be the one thing we never measure.
>
> It's been telling us the whole time — tokens, cost, latency, every cache miss and the reason for it.
> Four settings and a docker compose, and it stops being a feeling and starts being a number."

*One beat.*

---

### Slide 24 · 25:00 · Take it with you

> "Everything is in the repo, MIT licensed — the Docker Compose, both collector configs, the Azure
> scripts, and both dashboards.
>
> Questions — and I'd genuinely like to hear what your hit rate turns out to be."

---

## Timing rescue plan

| If at… | you're not yet on… | do this |
|---|---|---|
| 9:00 | slide 9 | Demo 1: keep clicks 1–2, drop the compaction beat (you re-explain it on slide 16 anyway). |
| 14:00 | slide 14 | **Cut slide 13** (surface ≠ agent). Nothing downstream depends on it. |
| 19:00 | slide 18 | Demo 4: presets only, don't drag sliders. |
| 23:30 | slide 22 | **Cut slide 22** (six traps). Say "there's a gotcha list on the last slide of the repo" and go to the close. |

Never cut: slides 2, 4, 8, 9, 16, 19, 21, 23. That's the spine.
The deck's timer already knows all of this — amber means start cutting.

---

## Q&A — prepared answers

**"Does this send my code to a third party?"**
No, and that's the point of starting at option A. Local Docker: the OTLP endpoint is `localhost`,
nothing leaves the machine. With content capture off, prompts and file contents never leave regardless
of backend. What *does* leave — even with capture off — is on slide 19, and the collector strips it.

**"What's the performance overhead?"**
Batched OTLP export off the hot path. I have not been able to measure it against normal turn latency,
which is seconds. If you're worried, the exporter has a queue and it drops rather than blocks.

**"Can I get this for the coding agent / Visual Studio?"**
Not today. The cloud agent runs server-side, so the client only sees session-level counters. Visual
Studio has no export path yet. This is exactly why slide 6 exists.

**"Metrics or just traces?"**
Both — Copilot emits metrics and logs as well. But if your collector only defines a `traces` pipeline,
the metrics are silently dropped, and Tempo can't store them at all. That's trap number one on slide 22.

**"How do I attribute cost to a team?"**
`resourceAttributes` in managed settings — stamp `team` onto every span at the source. Then group by it.
Don't try to derive it from the repo URL; people work across repos.

**"Isn't this just what the admin billing page shows?"**
The billing page is monthly, aggregated, and a month late. This is per-turn, per-span, in real time,
and it tells you *why* — which the invoice never does.

**"Our security team will ask about the pseudonymous id."**
Good — they should. Slide 19 is the answer: it ships by default, and you delete it in the collector
with four lines. Show them that slide before they ask.
