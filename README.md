# OpenTelemetry for GitHub Copilot — VS Code + the CLI

A hands-on experiment and reference implementation for wiring **OpenTelemetry** through the GitHub
Copilot surfaces that **actually emit customer-collectable OTel today** — **VS Code Copilot Chat** and
the **GitHub Copilot CLI** — and visualizing the result in Grafana. (**JetBrains** joined the list in
July 2026; the coverage table below is the honest map.) It's built to be the working foundation for a
longread article: each backend is a self-contained, reproducible setup, and the dashboards let you
compare VS Code vs the CLI (or look at both together).

The running theme is **prompt-cache efficiency** — how often Copilot reads from the prompt cache
(a *hit*: faster, cheaper, more stable) versus rebuilds it (a *miss*) — plus token usage, model mix,
tool calls, and latency. All of it comes from the OTel [GenAI semantic conventions](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/),
so the same queries work for both surfaces and any OTel-compatible backend.

![Copilot Prompt Cache Dashboard](docs/dashboard.png)

**Prefer the talk?** [***Copilot, Traced***](https://copilot-opentelemetry.isainative.dev/presentation/v2/) is a
20-minute walkthrough with three interactive demos. Open the separate
[presenter view](https://copilot-opentelemetry.isainative.dev/presentation/v2/presenter.html) on a
second monitor; the audience page never loads its notes. Source lives in
[`presentation/v2/`](presentation/v2/).

**Releases:** [latest on GitHub](https://github.com/webmaxru/copilot-opentelemetry/releases/latest) ·
[release history](CHANGELOG.md)

---

## The two axes: surfaces × backends

This repo is organized around two independent choices.

### 1. Surfaces — *what* emits OpenTelemetry

Only some Copilot surfaces expose OTel you can export to your own backend today. The honest map
(**August 2026**):

| Surface | Export OTel to your backend? | `resource.service.name` | How |
|---------|------------------------------|-------------------------|-----|
| **VS Code Copilot Chat** | ✅ Yes | `copilot-chat` | `github.copilot.chat.otel.*` settings, `OTEL_*` env vars, or [managed settings](#rolling-this-out-to-a-team-enterprise-managed-settings) |
| **GitHub Copilot CLI** | ✅ Yes | `github-copilot` | `OTEL_*` env vars (`COPILOT_OTEL_ENABLED=true`) or managed settings |
| **Copilot SDK** (Node/Py/Go/.NET/Java/Rust) | ✅ Yes — for apps you build | configurable | `TelemetryConfig` (drives the CLI process) |
| **JetBrains** plugins | ✅ **Yes — new in July 2026** | *not yet verified* | **Settings → Tools → GitHub Copilot → Chat** → OpenTelemetry export ([changelog](https://github.blog/changelog/2026-07-27-github-copilot-for-jetbrains-adds-improvved-opentelemetry-configuration-and-model-management/)) |
| **Copilot app** (desktop) | ✅ Yes | `github-copilot` | Its own client (own policy since [2026-07-27](https://github.blog/changelog/2026-07-27-manage-github-copilot-app-access-with-a-dedicated-policy/)) but built on the CLI runtime — same `OTEL_*` env vars, reports as `github-copilot` (verified) |
| **Claude agent / Claude Code** (via Copilot) | ✅ Yes | `copilot-chat`, `claude-code` | Extension-emitted spans; `claude-code` appears when `CLAUDE_CODE_ENABLE_TELEMETRY` is forwarded |
| **Visual Studio** extension | ❌ Not today | — | — |
| **Cloud coding agent** (opens PRs) | ❌ Not directly | — | server-side; the *client* only emits session counters |

> **JetBrains caveat.** The plugin gained an OTel export panel in the July 2026 release, but GitHub
> hasn't documented which `service.name` it reports and we have not been able to verify it on a
> machine with a JetBrains IDE. Rather than guess, the dashboards don't yet ship a JetBrains option —
> point it at the same collector, run `{ } | count_over_time() by (resource.service.name)` in Tempo,
> and add whatever name shows up.

**Two axes, not one.** The repo used to treat `resource.service.name` as a synonym for "surface". As of
the July 2026 docs that's no longer exact, so the dashboards now slice on **two** attributes:

| Axis | Attribute | Values |
|------|-----------|--------|
| **Surface** (which runtime emitted it) | `resource.service.name` | `copilot-chat` (VS Code extension) · `github-copilot` (CLI runtime) · `claude-code` (Claude Code subprocess) |
| **Agent** (what was running inside it) | `gen_ai.agent.name` (display name) / `gen_ai.agent.id` (stable definition ID) | `GitHub Copilot Chat` · `copilotcli` · `claude` · `github.copilot.default` |

The subtlety: a **Copilot CLI session started from inside VS Code** emits the extension wrapper span as
`copilot-chat` *and* the SDK's native spans as `github-copilot`. So `github-copilot` is **not** "the
terminal CLI only" — filtering on it alone over-counts. The **Turns by Agent** panel on both dashboards
separates foreground chat from CLI and Claude sessions.

> **Why there's no *Agent* dropdown.** Only `invoke_agent` spans carry `gen_ai.agent.*`; `chat` and
> `execute_tool` don't. A board-wide agent filter would therefore silently zero out most panels, so the
> agent axis is exposed as its own panel rather than as a template variable.

Everything still follows the **same GenAI conventions** (identical `gen_ai.*` attributes), which is why
one dashboard covers all of it. Keep `OTEL_SERVICE_NAME` **unset** so each surface keeps its distinct
default name — and note that an admin-set `telemetry.serviceName` in managed settings would collapse
them all into one name and break the surface selector.

### 2. Backends — *where* the telemetry goes

| Option | Runs locally | Backend | View dashboards in | Cost |
|--------|--------------|---------|--------------------|------|
| **A - Local** | Docker: Tempo + Grafana | Grafana Tempo | Local Grafana `http://localhost:3001` (TraceQL) | Free (local) |
| **B - Azure, local collector** | Docker: Collector + Tempo + Grafana | Application Insights (+ local Tempo) | Local Grafana **and** Azure Monitor → Dashboards with Grafana | Azure usage-based |
| **C - Azure Container Apps** | Nothing | Application Insights | Azure Monitor → Dashboards with Grafana | Azure usage-based, scale-to-zero |
| **D - Grafana Cloud** | Nothing | Grafana Cloud (managed Tempo) | Grafana Cloud | Free tier to start |

> **None of these need a paid Grafana instance.** B and C view dashboards *inside the Azure
> portal* via [Azure Monitor dashboards with Grafana](https://learn.microsoft.com/en-us/azure/azure-monitor/visualize/visualize-use-grafana-dashboards)
> — the same Grafana engine at no extra licence cost, versus ~$68/mo for Azure Managed Grafana. D uses Grafana Cloud's free tier.

Every backend carries **both surfaces** — the surface selector works everywhere. See
[Choosing a backend](#choosing-a-backend-detailed-trade-offs) for a full comparison.

---

## Choosing a backend (detailed trade-offs)

### Comparison matrix

| Dimension | A - Local | B - Azure, local collector | C - ACA collector | D - Grafana Cloud |
|-----------|-----------|----------------------------|-------------------|-------------------|
| **Runs on your machine** | Docker: Tempo + Grafana | Docker: Collector + Tempo + Grafana | Nothing | Nothing |
| **Managed in the cloud** | none | Application Insights | ACA collector + Application Insights | Grafana Cloud (everything) |
| **Telemetry backend** | Grafana Tempo (local) | Tempo (local) + App Insights | Application Insights | Grafana Cloud Tempo |
| **Query language** | TraceQL | TraceQL **and** KQL | KQL | TraceQL |
| **Surfaces covered** | both (selector) | both (selector) | both (selector) | both (selector) |
| **Collector in path** (redaction / fan-out / buffering) | No | **Yes** (local) | **Yes** (cloud) | No (direct) |
| **Auth on the wire** | none (localhost) | none (localhost) | Bearer token (public endpoint) | Basic (instance ID + token) |
| **Where data lives** | your laptop only | laptop + your Azure region | your Azure region | Grafana Labs SaaS region |
| **Cost** | Free (local) | Azure usage-based (5 GB/mo App Insights free grant) | Azure usage-based (ACA free grant + scale-to-zero) | Free tier, then usage-based |
| **Free-tier caps** | n/a | App Insights: 5 GB/mo, 90-day | ACA: 180k vCPU-s + 2M req/mo; App Insights 5 GB/mo | 50 GB traces/mo, 14-day, 3 users |
| **Cold start** | no | no | **yes** (first request after idle) | no |
| **Works offline / no cloud account** | **Yes** | No | No | No |
| **Team / fleet ready** | No (per machine) | No (per machine) | **Yes** (shared endpoint) | **Yes** (shared endpoint) |

### Cross-cutting trade-offs

- **Collector vs. direct.** B and C put an OTel Collector in the path, which buys **redaction/filtering**,
  **fan-out** (B sends to Tempo *and* App Insights), and **batching/retry/buffering**. B scrubs locally
  before telemetry leaves the machine. C receives the raw payload over TLS in Azure and minimizes it
  before Application Insights stores it. D (direct to Grafana Cloud) has no scrub point.
- **TraceQL vs. KQL.** A, D, and the local view of B use Grafana Tempo and **TraceQL**. B's Azure view
  and C use App Insights and **KQL**. B gives you both at once.
- **Data residency.** A keeps data on the laptop. B and C keep the cloud copy in **your Azure region**
  under your RBAC. D sends data to **Grafana Labs' SaaS** (a third party).
- **Single dev vs. fleet.** A and B run per-machine. To cover a fleet you need a **shared endpoint** —
  C (your cloud collector) or D (Grafana Cloud) — delivered through Copilot managed settings and,
  where agent-host authentication needs it, device-managed environment variables.
- **Security.** C and D send auth over the wire; C's endpoint is **public**, so treat the bearer token
  as a secret. Keep content capture **off**. C's collector strips content and identifiers before
  storage, but the raw OTLP request has already left the developer machine. D has no collector to scrub it.

### When to pick each

- **A - Local.** Solo, quick check, offline, or no cloud account. Zero setup, fully private.
- **B - Azure, local collector.** You want *both* the local TraceQL dashboard and the Azure one, with a
  collector for redaction/fan-out, and data in your Azure tenant — great for evaluating before a rollout.
- **C - Azure Container Apps collector.** Azure org that wants a **fleet-ready, nothing-local** setup,
  data staying in Azure, a collector in the path, and scale-to-zero when idle.
- **D - Grafana Cloud.** A Grafana-Cloud shop or small team that wants **nothing to run** and the
  fastest path to a hosted dashboard.

---

## What the telemetry looks like

Copilot spans (both surfaces) carry these attributes ([GenAI semantic conventions](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/)):

| Attribute | Meaning |
|-----------|---------|
| `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens` | Raw token counts |
| `gen_ai.usage.cache_read.input_tokens` | Tokens served **from** cache → **cache HIT** |
| `gen_ai.usage.cache_creation.input_tokens` | Tokens **written to** cache → **cache MISS** |
| `gen_ai.request.model` | Model (slice by model) |
| `gen_ai.operation.name` | `chat`, `invoke_agent`, `execute_tool`, or `execute_hook` |
| `resource.service.name` | **The surface** — `copilot-chat` (VS Code), `github-copilot` (CLI runtime), `claude-code` |
| `gen_ai.agent.name` / `gen_ai.agent.id` | **The agent** — `GitHub Copilot Chat`, `copilotcli`, `claude`, `github.copilot.default` |

### Cost and AI credits (CLI, new)

The CLI runtime now puts spend directly on the span, so you no longer have to infer cost from tokens:

| Attribute | Meaning |
|-----------|---------|
| `github.copilot.aiu` | AI credits consumed by the call (current documented field) |
| `github.copilot.cost` | Request cost as reported by the service |
| `github.copilot.server_duration` | Server-side duration (ms), vs. the span's wall-clock duration |
| `gen_ai.response.time_to_first_chunk` | TTFT in seconds (streaming) |
| `github.copilot.turn_count` | LLM round-trips in the session |

> **Compatibility.** Current clients document `github.copilot.aiu` on `chat` spans. Copilot CLI 1.0.76
> was observed emitting `github.copilot.nano_aiu` on `invoke_agent`; the dashboards retain a legacy
> fallback and divide that value by `1e9`.

### Span events — why a cache miss happened

Cache hit rate tells you *that* the prefix changed; these events tell you *why*:

| Event | Meaning |
|-------|---------|
| `github.copilot.session.truncation` | History was trimmed (`token_limit`, `pre_tokens`, `post_tokens`, `tokens_removed`) |
| `github.copilot.session.compaction_start` / `_complete` | History was summarised and rewritten |
| `github.copilot.skill.invoked` | A skill was injected into the prompt |
| `github.copilot.session.shutdown` / `.abort` | Session totals or cancellation reason |

**Truncation and compaction rewrite the prompt prefix — they are a direct *cause* of the next cache
miss.** Overlaying them on the hit/miss chart is the most useful correlation in this repo.

### Metrics (not just traces)

Both surfaces also emit **metrics**, which a traces-only pipeline silently drops (this repo's collector
configs used to do exactly that — now fixed):

`gen_ai.client.operation.duration` · `gen_ai.client.token.usage` ·
`gen_ai.client.operation.time_to_first_chunk` · `gen_ai.client.operation.time_per_output_chunk` ·
`gen_ai.invoke_agent.inference_calls` ·
`gen_ai.invoke_agent.tool_calls` · `github.copilot.agent.turn.count`

Grafana **Tempo stores traces only**, so metrics need a metrics store (Application Insights in options
B/C, Grafana Cloud in D).

**Cache hit** = `cache_read.input_tokens > 0` · **Cache miss** = `cache_creation.input_tokens > 0` · **No cache** = both 0.

Each interaction is a span tree: `invoke_agent` → `chat` (LLM calls, where cache tokens live) →
`execute_tool` (tool runs). Unstable prompt prefixes (a drifting system message, unstable tool
ordering, a workspace hint that changes every call) quietly destroy your hit rate — these dashboards
make that visible, per surface.

---

## Enable telemetry per surface

Copilot emits OTel when `github.copilot.chat.otel.enabled` is `true`, `COPILOT_OTEL_ENABLED=true`,
or `OTEL_EXPORTER_OTLP_ENDPOINT` is set. The **endpoint** you point at determines the backend:
`http://localhost:4318` for the local options (A, B) or a cloud URL for C, D.

### VS Code Copilot Chat (`copilot-chat`)

**Local backends (A, B)** — add to your **User** `settings.json` (`Ctrl+Shift+P` → *Open User Settings (JSON)*), then reload the window:

```json
{
  "github.copilot.chat.otel.enabled": true,
  "github.copilot.chat.otel.exporterType": "otlp-http",
  "github.copilot.chat.otel.otlpEndpoint": "http://localhost:4318",
  "github.copilot.chat.otel.captureContent": false
}
```

**Cloud backends (C, D)** — cloud endpoints need an auth token. There is no *user-level*
`settings.json` key for headers, so an individual developer uses environment variables and restarts VS Code:

```powershell
setx OTEL_EXPORTER_OTLP_ENDPOINT "https://<your-cloud-endpoint>"
setx OTEL_EXPORTER_OTLP_HEADERS  "Authorization=Bearer <token>"   # Grafana Cloud uses "Basic <base64>"
setx COPILOT_OTEL_ENABLED        "true"
```

> **New in July 2026:** administrators *do* have a supported key — `telemetry.headers` in
> [enterprise managed settings](#rolling-this-out-to-a-team-enterprise-managed-settings). That is now
> the right way to ship a collector token to a fleet, instead of `setx` on every machine.

### GitHub Copilot CLI (`github-copilot`)

The [Copilot CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#opentelemetry-monitoring)
reads the **same `OTEL_*` environment variables** — so the cloud block above enables it too. Just run
`copilot` from a shell that has those vars. Notes:

- Default `OTEL_SERVICE_NAME` is **`github-copilot`** (VS Code uses `copilot-chat`). **Leave it unset**
  so the two surfaces stay distinct in the dashboards.
- Content capture is a different flag: `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` (default `false`).
- For a **local** backend (A/B), point the CLI at the collector: `setx OTEL_EXPORTER_OTLP_ENDPOINT "http://localhost:4318"`.
- The **desktop GitHub Copilot app** runs on the CLI runtime, so these same vars enable its telemetry too — it reports as `github-copilot` (verified by testing).
- ⚠️ **Protocol mismatch gotcha.** The CLI defaults `OTEL_EXPORTER_OTLP_PROTOCOL` to **`http/json`**,
  while VS Code defaults to **`http/protobuf`**. Most collectors accept both, but some backends
  (including Grafana Cloud's OTLP gateway) want protobuf — which is why Option D sets it explicitly.
- Useful extras: `COPILOT_OTEL_FILE_EXPORTER_PATH` (write every signal to a JSON-lines file — the
  fastest way to see exactly what your version emits, no backend required), `COPILOT_OTEL_EXPORTER_TYPE`,
  and `OTEL_LOG_LEVEL` for exporter diagnostics.

> **Safety.** Use **User** settings / user env vars, not Workspace. Keep `captureContent` **off** — set
> to `true` and full prompts, responses, and code land in the traces (fine for debugging your own,
> risky otherwise). Option C scrubs at the Azure-hosted collector before storage; option D has no
> collector and therefore no scrub point.
>
> ⚠️ **"Content capture off" does not mean "anonymous."** Prompts, responses, system instructions,
> tool schemas, arguments, and results are content-capture-only. Operational identifiers and work
> metadata still ship:
>
> | Attribute | What it reveals |
> |---|---|
> | `enduser.pseudo.id` (CLI) | a stable pseudonymous **user id** when available |
> | `gen_ai.agent.*` | built-in or custom agent identity and description |
> | `github.copilot.skill.*` span-event attributes | invoked skill name, path, plugin name/version |
> | `github.copilot.tool.parameters.*` | tool metadata such as skill or MCP tool name |
> | `github.copilot.git.*` / `copilot_chat.repo.*` (VS Code) | repository URL, branch, commit SHA, org |
>
> For a backend you own (A, B) that is usually useful. The option B collector drops the pseudonymous
> user id locally. The option C strict profile additionally removes repository/content attributes and
> current skill-event metadata before Application Insights stores it. Option D sends directly.

> **Enable both surfaces at once (the fleet shape).** Set the four env vars once at the user/machine
> level and both surfaces report: VS Code as `copilot-chat`, the CLI as `github-copilot`. This is
> exactly what Option D + the surface selector are built for.

---

## Option A — Local (Docker, no cloud)

```
VS Code / Copilot CLI --OTLP/HTTP :4318--> Grafana Tempo --TraceQL :3200--> Grafana :3001
```

### 1. Start the stack

```bash
docker compose up -d
```

| Service | Host port | Purpose |
|---------|-----------|---------|
| Tempo   | 4318 / 4317 | OTLP receiver (HTTP / gRPC) |
| Tempo   | 3200 | Tempo query API |
| Grafana | **3001** | Dashboards — login `admin` / `admin` |

> **Port note:** upstream uses `3000` for Grafana; it's remapped to **3001** here because `3000` was
> already taken on the author's machine. The container still listens on 3000 internally.

### 2. Enable the surfaces

Apply the VS Code settings and/or CLI env vars from [Enable telemetry per surface](#enable-telemetry-per-surface) (local endpoint `http://localhost:4318`).

### 3. Generate traces

Use Copilot Chat and/or run `copilot` for a few minutes.

### 4. View the dashboard

Open **http://localhost:3001** → Dashboards → **GitHub Copilot OTel — VS Code + CLI (Tempo / TraceQL)**.
Use the **Copilot surface** dropdown to switch between *All (VS Code + CLI)*, *VS Code*, and *Copilot CLI*.

### 5. Explore raw traces (Explore → Tempo)

```traceql
{ resource.service.name =~ "copilot-chat|github-copilot" }
```
```traceql
{ span.gen_ai.usage.cache_read.input_tokens > 0 }
```

### Stop

```bash
docker compose down -v
```

---

## Option B — Azure, local collector (in-portal dashboards)

An **OpenTelemetry Collector** runs locally and **fans out** to *both* Grafana Tempo (local TraceQL
dashboard) **and** Azure Application Insights. View the in-portal dashboard, the local Tempo
dashboard, or both.

```mermaid
flowchart LR
    VS["VS Code / Copilot CLI"] -->|OTLP/HTTP :4318| Col["OTel Collector<br/>(contrib)"]
    Col -->|OTLP :4317| Tempo["Grafana Tempo<br/>(local :3001 dashboard)"]
    Col -->|azuremonitor exporter| AI["Azure Application Insights"]
    Portal["Azure Monitor > Dashboards with Grafana"] -->|KQL| AI
```

### 1. Provision the Azure backend (Log Analytics + Application Insights)

```powershell
az login
./azure/setup-azure.ps1 -Location swedencentral -ResourceGroup rg-ghcp-otel -NamePrefix ghcpotel
```

Idempotent. Creates a workspace-based Application Insights, grants your user read access, and writes
the connection string to `.env` (git-ignored). **No Managed Grafana is created.**

### 2. Switch to the collector-fronted stack

```powershell
docker compose -f docker-compose.yml down
docker compose -f docker-compose.azure.yml up -d
```

### 3. Enable the surfaces

Same as Option A (local endpoint `http://localhost:4318`, now the collector) — see [Enable telemetry per surface](#enable-telemetry-per-surface).

### 4. Verify data reached Application Insights (both surfaces)

```powershell
$id = az monitor app-insights component show -g rg-ghcp-otel -a ghcpotel-appi --query id -o tsv
az monitor app-insights query --ids $id --analytics-query `
  "dependencies | where timestamp > ago(1h) | where cloud_RoleName matches regex 'copilot-chat|github-copilot' | summarize count() by cloud_RoleName"
```

The `azuremonitor` exporter maps Copilot spans into the App Insights **`dependencies`** table with
`cloud_RoleName` = the surface and all `gen_ai.*` values in `customDimensions`.

Copilot also emits OTLP **metrics**, which land in **`customMetrics`**. Check them too — if this comes
back empty your collector is missing a `metrics:` pipeline (the one in this repo has had one since the
July 2026 update; earlier revisions were traces-only and silently dropped every metric):

```powershell
az monitor app-insights query --ids $id --analytics-query `
  "customMetrics | where timestamp > ago(1h) | where name startswith 'gen_ai.' or name startswith 'github.copilot.' | summarize count() by name"
```

### 5. View the dashboards

- **Local Grafana** (`http://localhost:3001`): the TraceQL dashboard (as in Option A).
- **Azure portal** → **Azure Monitor** → **Dashboards with Grafana**: import
  `dashboards/appinsights/copilot-otel-appinsights.json` (surface selector included), or use the
  official **GitHub Copilot** gallery dashboard (note: the gallery one covers `copilot-chat` **only** —
  ours adds the CLI).

### 6. Tear down

```powershell
./azure/teardown-azure.ps1 -ResourceGroup rg-ghcp-otel
```

---

## Option C — Azure Container Apps collector (nothing runs locally, scale-to-zero)

Run the OTel Collector in the cloud on **Azure Container Apps** (Consumption plan, `minReplicas: 0`),
exposing a public, token-protected OTLP endpoint that forwards to Application Insights. Nothing runs
on your machine; it scales to zero while idle, waking on the first request.

```mermaid
flowchart LR
    VS["VS Code / Copilot CLI"] -->|OTLP/HTTP + Bearer token| ACA["OTel Collector on<br/>Azure Container Apps (scale-to-zero)"]
    ACA -->|azuremonitor exporter| AI["Azure Application Insights"]
    Portal["Azure Monitor > Dashboards with Grafana"] --> AI
```

### 1. Provision App Insights (if you haven't)

```powershell
az login
./azure/setup-azure.ps1 -ResourceGroup rg-ghcp-otel -NamePrefix ghcpotel
```

### 2. Deploy the collector to Azure Container Apps

```powershell
./azure/deploy-collector-aca.ps1 -ResourceGroup rg-ghcp-otel -NamePrefix ghcpotel
```

Creates a Consumption Container Apps environment and a scale-to-zero app, generates a random 64-hex
bearer token, wires `config/otel-collector-cloud.yaml` + the App Insights connection string as
secrets, and writes the endpoint + token + ready-to-paste env vars to `.env.aca` (git-ignored):

```
OTLP endpoint : https://<app>.<region>.azurecontainerapps.io
Bearer token  : <64-hex>
```

### 3. Point the surfaces at it (values from `.env.aca`)

```powershell
setx OTEL_EXPORTER_OTLP_ENDPOINT "https://<app>.<region>.azurecontainerapps.io"
setx OTEL_EXPORTER_OTLP_HEADERS  "Authorization=Bearer <token>"
setx COPILOT_OTEL_ENABLED        "true"
```

Restart VS Code; run `copilot` from a fresh shell. Both surfaces now report through the cloud collector.

### 4. Verify + view

Query App Insights `dependencies | where cloud_RoleName matches regex 'copilot-chat|github-copilot'`,
then open **Azure Monitor → Dashboards with Grafana** and import `dashboards/appinsights/copilot-otel-appinsights.json`.

### 5. Stop / tear down

```powershell
az containerapp delete     -g rg-ghcp-otel -n ghcpotel-collector --yes
az containerapp env delete -g rg-ghcp-otel -n ghcpotel-acaenv     --yes
```

Or remove everything: `./azure/teardown-azure.ps1 -ResourceGroup rg-ghcp-otel`.

> **Cost:** Consumption + `minReplicas: 0` means no always-running instance; ACA's monthly free grant
> typically covers demo traffic. First request after idle incurs a few-second cold start.

---

## Option D — Grafana Cloud (nothing runs locally)

Point the surfaces straight at Grafana Cloud's managed OTLP endpoint. No Docker, no collector, no
Azure — traces go to Grafana Cloud's managed Tempo and you use TraceQL there.

```mermaid
flowchart LR
    VS["VS Code / Copilot CLI"] -->|OTLP/HTTP + Basic auth| GC["Grafana Cloud<br/>(managed Tempo + Grafana)"]
```

### 1. Create a Grafana Cloud stack

Sign up at [grafana.com](https://grafana.com/). In the Grafana Cloud Portal, open your stack →
**Configure** on the **OpenTelemetry** tile → generate a token. It shows ready-made
`OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` values (base64 already computed).

### 2. Enable both surfaces

```powershell
setx OTEL_EXPORTER_OTLP_PROTOCOL "http/protobuf"
setx OTEL_EXPORTER_OTLP_ENDPOINT "https://otlp-gateway-<zone>.grafana.net/otlp"
setx OTEL_EXPORTER_OTLP_HEADERS  "Authorization=Basic <base64>"
setx COPILOT_OTEL_ENABLED        "true"
# Do NOT set OTEL_SERVICE_NAME — leave VS Code=copilot-chat, CLI=github-copilot for the surface selector.
```

Open a **new** terminal (so it inherits the vars), verify `echo $env:OTEL_EXPORTER_OTLP_ENDPOINT`,
then use VS Code Copilot Chat and run `copilot`. Both surfaces flow to the same stack.

### 3. View

Import `dashboards/tempo/copilot-otel-tempo.json` into Grafana Cloud (Dashboards → New → Import;
pick your Grafana Cloud **Traces/Tempo** data source). Use the **Copilot surface** selector to view
*All (VS Code + CLI)*, *VS Code*, or *Copilot CLI*. Or use Explore → your traces data source with the TraceQL above.

---

## Dashboards (surface-aware, uploadable)

Both dashboards have a **Copilot surface** template variable — *All (VS Code + CLI)* / *VS Code (copilot-chat)*
/ *Copilot CLI (github-copilot)* — that filters every panel on `resource.service.name` (TraceQL) or
`cloud_RoleName` (KQL). They also expose a **data source** variable so you can upload them into any Grafana.

The **August 2026 compatibility release** adds the headline hit-rate KPI and refreshes three sections:

| Section | What it answers |
|---------|-----------------|
| **Summary** | Total calls, cache-hit calls, cache-miss calls, and the **prompt-cache token hit rate** (`read / (read + creation)`) for the selected time range. |
| **Cost, AI credits & agents** | Current `github.copilot.aiu` and `github.copilot.cost` are summed from `chat` spans; older `nano_aiu` data has an explicit fallback. **Turns by Agent** prefers `gen_ai.agent.name` and falls back to `gen_ai.agent.id`. |
| **Why the cache missed** | Cache **token volume** (read vs created) next to the `github.copilot.session.*` span events. Truncation and compaction rewrite the prompt prefix, so a spike there should be followed by a jump in cache-creation tokens — cause next to effect. |
| **OTLP metrics** *(KQL only)* | Copilot's OTel **metrics** (`gen_ai.client.token.usage`, `gen_ai.invoke_agent.tool_calls`, …) from `customMetrics`. Tempo stores traces only, so there is no TraceQL equivalent. |

> The Tempo dashboard keeps current AIU and legacy nano-AIU totals separate because TraceQL has no
> coalesce function. The KQL dashboard automatically prefers current AIU and falls back to nano-AIU.

| File | Backend / data source | Use it for |
|------|-----------------------|------------|
| `dashboards/tempo/copilot-otel-tempo.json` | Grafana **Tempo** (TraceQL) | Options **A, B** (local Grafana) and **D** (Grafana Cloud) |
| `dashboards/appinsights/copilot-otel-appinsights.json` | Grafana **Azure Monitor** (KQL / Logs) | Options **B, C** (App Insights via Dashboards with Grafana) |

- **Local (A/B):** the Tempo dashboard is auto-provisioned into the Docker Grafana (`dashboards/tempo`
  is mounted). Just open it.
- **Grafana Cloud (D):** import the Tempo JSON, pick your Tempo data source.
- **Azure Monitor Grafana / in-portal (B/C):** import the App Insights JSON, pick your Azure Monitor
  data source, and set the **Application Insights resource ID** variable
  (`az monitor app-insights component show -g <rg> -a <name> --query id -o tsv`).

Panels: total LLM calls, cache-hit/miss call counts, **prompt-cache token hit rate**, cache token volume,
calls by surface, model latency, tools, cost/credits, session events, and recent calls — all filtered
by the selected surface.

---

## Repository layout

| Path | Purpose |
|------|---------|
| `docker-compose.yml` | **Option A** — Tempo + Grafana |
| `docker-compose.azure.yml` | **Option B** — OTel Collector + Tempo + Grafana |
| `config/tempo.yaml` | Tempo: OTLP receivers, local storage, TraceQL-metrics generator |
| `config/grafana/*.yaml` | Grafana provisioning (Tempo data source + dashboards) |
| `config/otel-collector.yaml` | **Option B** collector: OTLP in (traces + metrics + logs) → `otlp_grpc/tempo` + `azuremonitor`, lenient scrub |
| `config/otel-collector-cloud.yaml` | **Option C** collector: OTLP + bearer auth → `azuremonitor`, strict span + span-event scrub |
| `dashboards/tempo/copilot-otel-tempo.json` | Surface-aware **TraceQL** dashboard (A, B, D) |
| `dashboards/appinsights/copilot-otel-appinsights.json` | Surface-aware **KQL** dashboard (B, C) |
| `azure/setup-azure.ps1` | Provisions Log Analytics + Application Insights, writes `.env` |
| `azure/deploy-collector-aca.ps1` | **Option C** — deploy the collector to Azure Container Apps |
| `azure/teardown-azure.ps1` | Deletes the resource group |
| `.env.example` | Templates for `APPLICATIONINSIGHTS_CONNECTION_STRING` (collector) + `APPINSIGHTS_CONNECTION_STRING` (site analytics) |
| `package.json`, `build.mjs`, `src/analytics.js` | Cookieless RUM for the promo site — esbuild bundles the beacon into `docs/analytics.js`, injecting the connection string at build time |
| `.github/workflows/deploy-pages.yml` | Builds `docs/` (injecting the connection string from a repo variable) and deploys to GitHub Pages |
| `.github/release.yml`, `CHANGELOG.md` | Generated-release-note categories and human-readable release history |
| `azure/dashboard.json`, `scripts/report.ps1` | Engagement dashboard template + terminal/Portal report for the site analytics |

## Rolling this out to a team (enterprise managed settings)

Until July 2026 the only realistic fleet rollout was "push environment variables with Intune and hope".
GitHub now ships a supported path: **Copilot managed settings**, with a dedicated `telemetry` block that
maps onto the VS Code `chat.agentHost.otel.*` policy namespace and is documented for **VS Code, Copilot
CLI, and JetBrains**. The desktop app can emit through its CLI runtime, but the managed `telemetry`
key is not listed for the app or cloud coding agent in the current support matrix.

### The `telemetry` block

| Key | Purpose |
|-----|---------|
| `telemetry.enabled` | force OTel **on** (developers can't turn it off) |
| `telemetry.endpoint` | the mandated OTLP collector URL |
| `telemetry.protocol` | `otlp-http` or `otlp-grpc` |
| `telemetry.captureContent` | content capture on/off |
| `telemetry.lockCaptureContent` | **prevent developers re-enabling content capture** |
| `telemetry.serviceName` | override `service.name` — ⚠️ see the warning below |
| `telemetry.resourceAttributes` | JSON object of extra resource attributes (team, cost centre, …) |
| `telemetry.headers` | JSON object of OTLP headers — **this is where the collector auth token goes** |

Precedence is **policy → environment variable → user setting → default**, so a managed value always
wins over a developer's `settings.json`.

> ⚠️ **Don't set `telemetry.serviceName` fleet-wide.** It collapses every surface into a single
> `service.name`, and the **Copilot surface** selector in both dashboards — which filters on
> `resource.service.name` / `cloud_RoleName` — stops distinguishing VS Code from the CLI. If you need
> org tagging, put it in `telemetry.resourceAttributes` instead and leave `serviceName` alone.

> **Header caveat.** Managed `telemetry.headers` are delivered to the **Chat extension exporter only** —
> never to the agent host. That is deliberate: it keeps tokens out of tool subprocesses. Practically it
> means a mandated *cloud* endpoint (C, D) gets authenticated traffic from the extension, while agent-host
> spans need an unauthenticated in-network collector. Pointing the fleet at an internal collector
> (**Option B/C shape**) side-steps this entirely — which is another argument for the collector hop.
>
> The agent host reads its configuration at start-up, so a managed change needs a **VS Code reload**.

### Three delivery channels

| Channel | Where it lives |
|---|---|
| **Native MDM** (Intune, Jamf, …) | Windows `HKLM\SOFTWARE\Policies\GitHubCopilot`, macOS `com.github.copilot` |
| **Server-managed** | `copilot/managed-settings.json` in the org's `.github-private` repository |
| **File-based** | `%ProgramFiles%\GitHubCopilot\managed-settings.json` · `/Library/Application Support/GitHubCopilot/managed-settings.json` · `/etc/github-copilot/managed-settings.json` |

Precedence between channels is **Native MDM > server-managed > file-based**, resolved **per key**:
the highest-priority source wins when two sources set the same key, while lower-priority sources can
still supply keys that higher-priority sources omit.
File-based settings must be root/administrator-owned, not world-writable, and not symlinks.

Verify what actually applied with **`Developer: Policy Diagnostics`** in the VS Code command palette.

### Ready-to-paste `managed-settings.json`

**Option B — local/in-network collector** (each machine runs the collector, or points at a shared one):

```json
{
  "telemetry": {
    "enabled": true,
    "endpoint": "http://localhost:4318",
    "protocol": "otlp-http",
    "captureContent": false,
    "lockCaptureContent": true,
    "resourceAttributes": { "deployment.environment": "dev", "team": "platform" }
  }
}
```

**Option C — Azure Container Apps collector** (bearer-authenticated, scale-to-zero):

```json
{
  "telemetry": {
    "enabled": true,
    "endpoint": "https://<your-aca-collector>.azurecontainerapps.io",
    "protocol": "otlp-http",
    "captureContent": false,
    "lockCaptureContent": true,
    "headers": { "Authorization": "Bearer <collector-token>" },
    "resourceAttributes": { "deployment.environment": "prod" }
  }
}
```

**Option D — Grafana Cloud direct** (no collector; note the protocol, see the gotcha above):

```json
{
  "telemetry": {
    "enabled": true,
    "endpoint": "https://otlp-gateway-<region>.grafana.net/otlp",
    "protocol": "otlp-http",
    "captureContent": false,
    "lockCaptureContent": true,
    "headers": { "Authorization": "Basic <base64 instanceID:token>" }
  }
}
```

> With no collector in the path, Option D means **no scrubbing** — the identifiers listed in the safety
> note above reach Grafana Cloud as-is. If that matters to you, use B or C.

## Using this repo as an article foundation

Each section maps to a beat in a longread on Copilot observability:

1. **Why** — prompt-cache efficiency as a leading indicator of prompt stability and cost.
2. **What** — the surfaces (VS Code, CLI) and the shared GenAI conventions.
3. **How** — four backends from a laptop (offline) to a fleet-ready cloud endpoint.
4. **See it** — one surface-aware dashboard, TraceQL and KQL variants, side-by-side VS Code vs CLI.
5. **Scale it** — collector fan-out/redaction and enterprise managed-settings rollout.

Good follow-up experiments: per-surface cache-hit rate over a week, model-mix drift, tool latency
outliers, and comparing agent (`invoke_agent`) vs single-shot (`chat`) shapes across surfaces.

## Watching the promo site itself (cookieless analytics)

The landing page under [`docs/`](docs/) (published at **https://copilot-opentelemetry.isainative.dev/**)
is itself instrumented with **cookieless Azure Application Insights** Real User Monitoring via
[`@webmaxru/cookieless-insights`](https://github.com/webmaxru/cookieless-insights) — a tiny **beacon**
(`navigator.sendBeacon`). It uses **no cookies, no local/session storage, and no persistent identifier**,
so it needs **no consent/GDPR banner**. Telemetry goes to *our own* Application Insights
(`ghcpotel-web-ai`), never to a third party — the same privacy stance as the rest of this repo.

- **Free tier:** workspace-based (`ghcpotel-web-law`), 30-day retention, **0.16 GB/day** ingestion cap.
- **What's collected** (metadata only — no PII, no prompts, no code): `page_view`, `opened_via_shared_link`
  (UTM/referrer), `cta_click`, `outbound_click`, `nav_click`, `section_view` (scroll depth, **debounced**),
  and an `engagement` summary (dwell time + max scroll) on exit.
- **Build-time injection:** the connection string is a **public client key**, injected at build time from
  `APPINSIGHTS_CONNECTION_STRING` — locally via `.env`, in CI from the repo **variable** of the same name
  (never a secret, never committed). `npm run build` bundles `src/analytics.js` → `docs/analytics.js`
  (esbuild); the **GitHub Actions** workflow ([`deploy-pages.yml`](.github/workflows/deploy-pages.yml)) does
  this on every push and deploys `docs/` to Pages.
- **Kill switch (one line):** set `ANALYTICS_ENABLED = false` at the top of
  [`src/analytics.js`](src/analytics.js) (or `init({ …, enabled: false })`) and redeploy — telemetry stops.
- **Report:**
  ```powershell
  npm run report
  # or directly:
  pwsh scripts/report.ps1 -ResourceGroup rg-ghcp-otel -AppInsights ghcpotel-web-ai -Days 30 -Open
  ```
  prints page views, sessions, per-visit dwell, key events, top pages, geo, and browser/OS, and opens the
  **`cookieless-insights-dashboard`** in the Azure Portal. Data appears ~1–3 minutes after a visit.

## Credits

- Original concept, local Docker stack, and dashboard by **Samuel Tauil** —
  [samueltauil/copilot-traces](https://github.com/samueltauil/copilot-traces) and the article
  [Visualizing Copilot Prompt Cache with OTel + Grafana](https://samueltauil.github.io/github-copilot/devops/2026/07/02/visualizing-copilot-prompt-cache-otel-grafana.html).
- This fork extends it to the Copilot **CLI** alongside VS Code — the two OTel-emitting surfaces — with
  surface-aware dashboards, and adds the **Azure Monitor "Dashboards with Grafana"** variant (Option B), an **Azure
  Container Apps** scale-to-zero collector (Option C), and a **Grafana Cloud** direct path (Option D).
- Licensed under [MIT](LICENSE).

## References

- [Monitor agent usage with OpenTelemetry (VS Code docs)](https://code.visualstudio.com/docs/agents/guides/monitoring-agents)
- [Manage AI settings in the enterprise (VS Code docs)](https://code.visualstudio.com/docs/enterprise/ai-settings)
- [GitHub Copilot CLI — OpenTelemetry monitoring](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#opentelemetry-monitoring)
- [Enterprise-managed OpenTelemetry export for VS Code and CLI (changelog, 2026-07-08)](https://github.blog/changelog/2026-07-08-enterprise-managed-opentelemetry-export-for-vs-code-and-cli/)
- [Deploy managed Copilot settings via MDM (changelog, 2026-07-08)](https://github.blog/changelog/2026-07-08-deploy-managed-copilot-settings-via-mdm/)
- [Copilot for JetBrains adds improved OpenTelemetry configuration (changelog, 2026-07-28)](https://github.blog/changelog/2026-07-28-github-copilot-for-jetbrains-ides-adds-agent-hooks-improved-opentelemetry-configuration-and-more/)
- [Monitor AI coding agents with Grafana (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/managed-grafana/grafana-opentelemetry-app-insights)
- [Azure Monitor dashboards with Grafana](https://learn.microsoft.com/en-us/azure/azure-monitor/visualize/visualize-use-grafana-dashboards)
- [Grafana Cloud OTLP endpoint](https://grafana.com/docs/grafana-cloud/send-data/otlp/)
- [OTel GenAI semantic conventions](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/)
