/* Speaker-only data. The audience deck never loads this file. */
window.COPILOT_TRACED_V2 = {
  talkSeconds: 20 * 60,
  checkedOn: '17 Aug 2026',
  slides: [
    {
      title: 'Copilot, Traced',
      chapter: 'the blind spot',
      mark: 0,
      duration: 40,
      notes: [
        '<strong>Let the title sit for two seconds.</strong>',
        '"Think about the last thing Copilot did for you today. Hold that turn in your head. In twenty minutes, I want you to know where its tokens, latency, cost, and cache behavior are hiding."',
        '"This is not a vendor pitch. The local path runs on your laptop, and every signal uses OpenTelemetry."'
      ],
      cue: 'Advance at 00:40.',
      sources: []
    },
    {
      title: 'Three questions',
      chapter: 'the blind spot',
      mark: 40,
      duration: 55,
      notes: [
        'Read the three questions with a beat between them.',
        '"How many tokens? What did that one turn cost? And did the provider read a stable prefix from cache, or process it again?"',
        'Pause, then say: "Most teams can answer none of these per turn. A monthly billing page is not an execution trace."'
      ],
      cue: 'Do not answer yet. The rest of the talk is the answer.',
      sources: []
    },
    {
      title: 'Treat it like a distributed system',
      chapter: 'the blind spot',
      mark: 95,
      duration: 70,
      notes: [
        '"We would never run an important service with only anecdotes. But Copilot is a planner calling models and tools across process and network boundaries. It retries. It compacts context. It uses a cache. It generates cost."',
        '"That is a distributed system. A turn is a request. A tool call is a dependency. Prompt caching is a cache with a measurable hit rate."',
        'Land the surprise: "The instrumentation is already in the products. We only have to point it at an OTLP endpoint."'
      ],
      cue: 'Transition: "So let us switch it on."',
      sources: [
        { label: 'VS Code: monitor agent usage', url: 'https://code.visualstudio.com/docs/agents/guides/monitoring-agents' },
        { label: 'Copilot CLI command reference', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#opentelemetry-monitoring' }
      ]
    },
    {
      title: 'Two switches, one endpoint',
      chapter: 'switch it on',
      mark: 165,
      duration: 80,
      notes: [
        'Point left: "VS Code has four user settings: enable, exporter type, endpoint, and content capture off."',
        'Point right: "The CLI uses the standard OTEL variables. The endpoint alone also enables OTel, but I set the explicit flag so intent is obvious. I also pin HTTP/protobuf because the CLI default is HTTP/JSON while VS Code defaults to protobuf."',
        '"Do not set OTEL_SERVICE_NAME. The defaults - copilot-chat and github-copilot - are how the dashboard keeps the runtimes separate."',
        'After changing VS Code settings, reload the window. After <code>setx</code>, open a new terminal.'
      ],
      cue: 'Do not explain every exporter option.',
      sources: [
        { label: 'VS Code OTel settings and defaults', url: 'https://code.visualstudio.com/docs/agents/guides/monitoring-agents#_enable-otel-monitoring' },
        { label: 'CLI OTel environment variables', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#otel-environment-variables' }
      ]
    },
    {
      title: 'The honest coverage map',
      chapter: 'switch it on',
      mark: 245,
      duration: 55,
      notes: [
        '"Keep the coverage claim narrow. VS Code and the CLI are the strongest documented paths, with known service names. The SDK configures the CLI process through TelemetryConfig."',
        '"JetBrains added an OpenTelemetry export panel in July 2026, but the service name is still not documented, so discover it before adding a dashboard filter."',
        '"The desktop app observation is empirical: this repo has seen it through the CLI runtime as github-copilot. The current enterprise telemetry policy table does not mark the app as supporting that managed key, so do not promise policy rollout from this slide."',
        '"Visual Studio has no documented customer export path. For the cloud coding agent, VS Code emits client-side session and outcome metrics; that is not the server-side execution trace."'
      ],
      cue: 'Credibility slide. Keep it under one minute.',
      sources: [
        { label: 'Copilot SDK OpenTelemetry', url: 'https://docs.github.com/en/copilot/how-tos/copilot-sdk/observability/opentelemetry' },
        { label: 'JetBrains OTel export changelog', url: 'https://github.blog/changelog/2026-07-27-github-copilot-for-jetbrains-adds-improvved-opentelemetry-configuration-and-model-management/' },
        { label: 'Enterprise managed settings support matrix', url: 'https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings' }
      ]
    },
    {
      title: 'Anatomy of one turn',
      chapter: 'read the signal',
      mark: 300,
      duration: 60,
      notes: [
        '"The root invoke_agent span is one user turn. It carries aggregate tokens, agent identity, cost, AI units, and turn count."',
        '"Each chat child is one provider call. This is where per-call model, tokens, cache creation or read, and time to first chunk live."',
        '"Each execute_tool child is a dependency call. Tool name, duration, and errors are present without capturing tool arguments or results."',
        'Correction from the old deck: cost is documented on both the root and chat spans. Count turns at the root; use chat spans for per-call detail.'
      ],
      cue: 'Transition: "Now click the trace rather than reading a table."',
      sources: [
        { label: 'CLI trace attributes', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#traces' },
        { label: 'VS Code trace attributes', url: 'https://code.visualstudio.com/docs/agents/guides/monitoring-agents#_traces' }
      ]
    },
    {
      title: 'Trace explorer',
      chapter: 'read the signal',
      mark: 360,
      duration: 115,
      notes: [
        '<strong>Demo path:</strong>',
        '1. Click <em>invoke_agent</em>. "This is the turn. Current docs call the credit field github.copilot.aiu and also expose github.copilot.cost."',
        '2. Click the first orange <em>chat</em>. "Cold start: cache creation is 21,504. A first miss is normal."',
        '3. Click the green <em>chat</em>. "The stable prefix is read back. Compare cache_read and time to first chunk."',
        '4. Click the final orange <em>chat</em>. "A compaction event sits beside the miss. Copilot tells us that history changed before the cache was rebuilt."',
        '5. Toggle VS Code and CLI. "Same GenAI vocabulary, different service.name."'
      ],
      cue: 'If behind, do steps 2, 3, and 4 only.',
      sources: [
        { label: 'CLI spans and span events', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#traces' }
      ]
    },
    {
      title: 'How the prompt cache works',
      chapter: 'the headline metric',
      mark: 475,
      duration: 70,
      notes: [
        '"Prompt caching is prefix caching. The prefix contains system instructions, tool definitions, conversation history, and the new turn."',
        '"If the prefix stays byte-stable, the provider can read it from cache. Change something near the front - a timestamp, tool order, or compacted history - and everything after it becomes a new prefix."',
        '"That is why one volatile token can turn a 21,000-token cache read into 21,000 cache-creation tokens."',
        'Use the telemetry definition, not a guess: cache_read greater than zero is a hit; cache_creation greater than zero is a miss.'
      ],
      cue: 'Do not claim every provider prices cache identically.',
      sources: [
        { label: 'CLI cache token attributes', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#chat-span-attributes' },
        { label: 'VS Code cache token attributes', url: 'https://code.visualstudio.com/docs/agents/guides/monitoring-agents#_chat-span' }
      ]
    },
    {
      title: 'Why hit rate matters',
      chapter: 'the headline metric',
      mark: 545,
      duration: 75,
      notes: [
        '"Hit rate is not a universal service-level objective. It is a useful first diagnostic."',
        '"It moves when the prompt becomes unstable, the tool inventory changes order, or long sessions rewrite history."',
        '"It also puts cost and latency pressure on one chart. More fresh input is processed, and cold calls often take longer to reach the first chunk."',
        'Be precise: say "often" and "pressure", not "every hit is exactly three times faster". The demo values are a captured example, not a benchmark.'
      ],
      cue: 'Transition: "The signal is portable, so the next decision is operational."',
      sources: [
        { label: 'VS Code Cache Explorer', url: 'https://code.visualstudio.com/docs/agents/agent-troubleshooting/cache-explorer' }
      ]
    },
    {
      title: 'Four backend choices',
      chapter: 'send it somewhere',
      mark: 620,
      duration: 70,
      notes: [
        '"A is local Tempo and Grafana: free, offline, private, and the best first step."',
        '"B keeps a collector and Tempo locally, then fans out to Application Insights. Azure ingestion is usage-based; the dashboard can run in the Azure portal without a paid Grafana instance."',
        '"C moves the collector to Azure Container Apps. Nothing runs on the developer machine; the collector can scale to zero, while Application Insights remains usage-based."',
        '"D sends directly to Grafana Cloud. The free tier is the easiest hosted start, but direct export gives you no collector for redaction or fan-out."'
      ],
      cue: 'Do not read the diagram line by line.',
      sources: [
        { label: 'Repository backend comparison', url: 'https://github.com/webmaxru/copilot-opentelemetry#choosing-a-backend-detailed-trade-offs' },
        { label: 'Azure Monitor dashboards with Grafana', url: 'https://learn.microsoft.com/azure/azure-monitor/visualize/visualize-use-grafana-dashboards' }
      ]
    },
    {
      title: 'Pipeline builder',
      chapter: 'send it somewhere',
      mark: 690,
      duration: 105,
      notes: [
        '<strong>Demo path:</strong>',
        '1. Start on A with both runtimes. "Local endpoint, no auth, no cloud account."',
        '2. Click C. "The endpoint is now public and authenticated. A collector appears in the path." Open <em>Collector - scrub</em> and point at the metadata deletions.',
        '3. Click D. "Nothing to run and a free tier, but the collector disappears. That simplifies operations and removes your pre-ingestion minimization point."',
        '4. Return to A. "The app configuration changed; the GenAI signal did not."',
        'Current docs: the CLI defaults to HTTP/JSON; Grafana Cloud expects HTTP/protobuf, so the generated CLI block pins the protocol for D.'
      ],
      cue: 'Do not open every tab. A -> C -> D -> A.',
      sources: [
        { label: 'CLI protocol default', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#otel-environment-variables' },
        { label: 'VS Code backend examples', url: 'https://code.visualstudio.com/docs/agents/guides/monitoring-agents#_use-with-observability-backends' }
      ]
    },
    {
      title: 'The dashboard',
      chapter: 'make it useful',
      mark: 795,
      duration: 80,
      notes: [
        'Pause for two seconds so the screenshot lands.',
        '"The surface selector uses resource.service.name: all, copilot-chat, or github-copilot."',
        '"Then the useful sequence: cache read versus creation, model and latency, tools, recent operations, and drill-through to the raw trace."',
        '"The same dashboard JSON works with local Tempo and Grafana Cloud. The Azure version uses KQL against Application Insights but asks the same questions."',
        'Avoid saying service.name equals the human-facing product in every case. It identifies the emitting runtime; wrapper and native spans can coexist.'
      ],
      cue: 'Transition: "The chart becomes valuable when it explains a regression."',
      sources: [
        { label: 'Repository dashboards', url: 'https://github.com/webmaxru/copilot-opentelemetry#dashboards-surface-aware-uploadable' },
        { label: 'VS Code runtime service names', url: 'https://code.visualstudio.com/docs/agents/guides/monitoring-agents#_filter-by-agent-type' }
      ]
    },
    {
      title: 'Why the cache missed',
      chapter: 'make it useful',
      mark: 875,
      duration: 115,
      notes: [
        '<strong>Demo path:</strong>',
        '1. Start with every cause off. "One cold miss, then a stable prefix. This is the clean ceiling in the simulation."',
        '2. Enable <em>A timestamp in the system prompt</em>. "One volatile token at the front turns every call into cache creation."',
        '3. Disable it and enable <em>Tool inventory reorders</em>. "Same tools, different order, different prefix."',
        '4. Enable <em>Long session -> compaction</em>. Point at the event markers. "The CLI emits truncation and compaction lifecycle events. Put cause beside effect."',
        'State clearly: this figure is an explanatory simulation. The attribute names and events are documented; the exact percentages are illustrative.'
      ],
      cue: 'If behind, show timestamp and compaction only.',
      sources: [
        { label: 'CLI span events', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#span-events' }
      ]
    },
    {
      title: 'Privacy and cost truth',
      chapter: 'the guardrails',
      mark: 990,
      duration: 90,
      notes: [
        '"Content capture is off by default. Current docs mark prompts, responses, system instructions, tool schemas, arguments, and results as content-capture-only."',
        '"The metadata is still operationally rich: model, tokens, cache counts, duration, cost, AI units, service, agent, and tool names."',
        '"Metadata still needs governance. CLI invoke_agent spans can carry enduser.pseudo.id. VS Code spans can carry repository, branch, commit, and organization. CLI events can name skills and their paths."',
        '"A collector lets you delete fields you do not need before a shared backend. This is minimization, not a claim that content capture is broken."',
        '<strong>Field note:</strong> current CLI docs name <code>github.copilot.aiu</code>. An older CLI 1.0.76 capture in this repo emitted <code>github.copilot.nano_aiu</code>. Use the file exporter to inspect your runtime before hard-coding a query.'
      ],
      cue: 'This replaces the old overclaim that tool definitions always ship with capture off.',
      sources: [
        { label: 'CLI content capture and attributes', url: 'https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#content-capture' },
        { label: 'VS Code security and privacy', url: 'https://code.visualstudio.com/docs/agents/guides/monitoring-agents#_security-and-privacy' }
      ]
    },
    {
      title: 'Monday morning',
      chapter: 'put it to work',
      mark: 1080,
      duration: 65,
      notes: [
        '"Start with one machine and option A. Generate normal work, not a synthetic benchmark."',
        '"Then sort for high cache-creation token volume. Look for repeated values and line them up with truncation or compaction events."',
        '"Only after you have a useful local question should you choose where the data lives. Use a collector when you need metadata minimization, fan-out, batching, or retry."',
        '"The goal is not to monitor developers. The goal is to diagnose the system that supports them."'
      ],
      cue: 'Keep this concrete and personal-first.',
      sources: [
        { label: 'Repository quick start', url: 'https://github.com/webmaxru/copilot-opentelemetry#option-a--local-docker-no-cloud' }
      ]
    },
    {
      title: 'Stop guessing',
      chapter: 'put it to work',
      mark: 1145,
      duration: 45,
      notes: [
        '<strong>Slow down and stop touching the keyboard.</strong>',
        '"The tool writing our code should not be the one system we never measure."',
        '"Tokens, latency, tools, cost, and every cache miss are already on the wire. Point them somewhere useful - then replace a feeling with a trace and a next action."',
        'Pause, then advance.'
      ],
      cue: 'Land by 19:50.',
      sources: []
    },
    {
      title: 'Take it with you',
      chapter: 'put it to work',
      mark: 1190,
      duration: 10,
      notes: [
        '"Everything is in the repository: the four backends, both dashboards, collector configs, and this presenter view. Questions?"',
        'Leave this slide up for Q&A.'
      ],
      cue: 'Talk ends at 20:00. Stop the timer.',
      sources: [
        { label: 'Repository', url: 'https://github.com/webmaxru/copilot-opentelemetry' },
        { label: 'Project site', url: 'https://copilot-opentelemetry.isainative.dev/' }
      ]
    }
  ]
};
