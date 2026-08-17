# Copilot, Traced - 20-minute timing map

The full speaker notes and source links live in `assets/js/notes.js` and are rendered only by
`presenter.html`.

| # | Arrival | Duration | Slide | Purpose |
| ---: | ---: | ---: | --- | --- |
| 1 | 00:00 | 00:40 | Copilot, Traced | Promise: tokens, latency, cost, and cache behavior in 20 minutes |
| 2 | 00:40 | 00:55 | Three questions | Establish the observability blind spot |
| 3 | 01:35 | 01:10 | Treat it like a distributed system | Transfer familiar tracing concepts to coding agents |
| 4 | 02:45 | 01:20 | Two switches, one endpoint | Enable VS Code and CLI with current settings |
| 5 | 04:05 | 00:55 | The honest coverage map | State documented, new, indirect, and unavailable paths |
| 6 | 05:00 | 01:00 | Anatomy of one turn | Explain `invoke_agent`, `chat`, and `execute_tool` |
| 7 | 06:00 | 01:55 | Demo 1: trace explorer | Inspect cache tokens, latency, compaction, and service names |
| 8 | 07:55 | 01:10 | How the prompt cache works | Explain prefix stability |
| 9 | 09:05 | 01:15 | Why hit rate matters | Connect prompt stability to cost and latency pressure |
| 10 | 10:20 | 01:10 | Four backend choices | Compare local, Azure, ACA, and Grafana Cloud |
| 11 | 11:30 | 01:45 | Demo 2: pipeline builder | Show A, C, D and the collector minimization point |
| 12 | 13:15 | 01:20 | The dashboard | Show the runtime selector and drill-through |
| 13 | 14:35 | 01:55 | Demo 3: why the cache missed | Make timestamp, tool-order, and compaction regressions visible |
| 14 | 16:30 | 01:30 | Privacy and cost truth | Separate content capture from identifiers and metadata |
| 15 | 18:00 | 01:05 | Monday morning | Give the smallest useful adoption path |
| 16 | 19:05 | 00:45 | Stop guessing | Land the takeaway |
| 17 | 19:50 | 00:10 | Take it with you | Repository, sources, and Q&A |
|  | **20:00** |  | **End** | Q&A starts |

## Demo rescue plan

| If the timer is behind at... | Do this |
| --- | --- |
| Demo 1 | Show only the first miss, the cache hit, and the compaction miss |
| Demo 2 | Click A, C, and D; do not open configuration tabs except `Collector - scrub` |
| Demo 3 | Show only the timestamp and compaction switches |

Do not cut slides 4, 7, 8, 13, 14, or 16. They carry the setup, proof, cache model, diagnosis,
guardrails, and close.
