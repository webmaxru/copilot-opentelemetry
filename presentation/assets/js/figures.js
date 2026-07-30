/* ==========================================================================
   Copilot, Traced — interactive figures
   Four self-contained widgets, mounted by the deck or by the standalone
   pages in interactive/. Classic script, no dependencies, file:// safe.

   window.CopilotFigures.mount(name, hostElement)
     'trace'      Anatomy of one Copilot turn — clickable span tree
     'economics'  What a cache miss costs, at fleet scale
     'pipeline'   Surface × backend wiring, with generated config
     'timeline'   Prompt-prefix stability → hit/miss over a session

   All numbers and attribute names track README.md.
   ========================================================================== */
(function () {
  'use strict';

  var CSS = [
'.cf{--cf-hit:#73bf69;--cf-miss:#ff9830;--cf-otel:#f97316;--cf-vscode:#4c8dff;--cf-cli:#a06bff;',
'  --cf-ink:#eef3fb;--cf-muted:#94a1b6;--cf-faint:#5f6b7f;--cf-line:rgba(255,255,255,.09);',
'  --cf-mono:"DM Mono",ui-monospace,Consolas,monospace;--cf-body:"Karla",system-ui,sans-serif;',
'  --cf-disp:"Sora",system-ui,sans-serif;',
'  height:100%;width:100%;display:flex;flex-direction:column;font-family:var(--cf-body);',
'  color:var(--cf-ink);font-size:14px;overflow:hidden}',
'.cf *{box-sizing:border-box}',
'.cf-bar{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--cf-line);',
'  flex:0 0 auto;flex-wrap:wrap}',
'.cf-bar .cf-t{font-family:var(--cf-mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--cf-faint)}',
'.cf-sp{flex:1}',
'.cf-seg{display:inline-flex;border:1px solid var(--cf-line);border-radius:8px;overflow:hidden}',
'.cf-seg button{font-family:var(--cf-mono);font-size:12px;padding:6px 13px;background:transparent;border:0;',
'  color:var(--cf-muted);cursor:pointer;transition:background .15s,color .15s}',
'.cf-seg button + button{border-left:1px solid var(--cf-line)}',
'.cf-seg button:hover{color:var(--cf-ink)}',
'.cf-seg button[aria-pressed="true"]{background:rgba(249,115,22,.14);color:var(--cf-otel)}',
'.cf-seg.vs button[aria-pressed="true"]{background:rgba(76,141,255,.16);color:var(--cf-vscode)}',
'.cf-seg.cl button[aria-pressed="true"]{background:rgba(160,107,255,.16);color:var(--cf-cli)}',
'.cf-body{flex:1;min-height:0;display:flex}',
'.cf-scroll{overflow:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}',
'.cf-scroll::-webkit-scrollbar{width:8px;height:8px}',
'.cf-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:4px}',
'.cf-mono{font-family:var(--cf-mono)}',
'.cf-note{font-family:var(--cf-mono);font-size:11.5px;color:var(--cf-faint);line-height:1.6}',

/* ---- trace explorer ---- */
'.cf-tree{flex:1.15;padding:14px 8px 14px 16px;min-width:0}',
'.cf-side{flex:1;border-left:1px solid var(--cf-line);padding:14px 16px;min-width:0;',
'  background:rgba(255,255,255,.014)}',
'.cf-span{display:grid;grid-template-columns:1fr 132px 62px;align-items:center;gap:10px;width:100%;',
'  text-align:left;background:transparent;border:1px solid transparent;border-radius:9px;',
'  padding:7px 10px;cursor:pointer;color:inherit;font:inherit;transition:background .14s,border-color .14s}',
'.cf-span:hover{background:rgba(255,255,255,.045)}',
'.cf-span[aria-selected="true"]{background:rgba(249,115,22,.11);border-color:rgba(249,115,22,.4)}',
'.cf-span .op{font-family:var(--cf-mono);font-size:12.5px;color:var(--cf-ink);white-space:nowrap;',
'  overflow:hidden;text-overflow:ellipsis}',
'.cf-span .op i{font-style:normal;color:var(--cf-faint)}',
'.cf-span .dur{font-family:var(--cf-mono);font-size:11.5px;color:var(--cf-faint);text-align:right}',
'.cf-lane{height:7px;border-radius:4px;background:rgba(255,255,255,.07);position:relative;overflow:hidden}',
'.cf-lane i{position:absolute;top:0;bottom:0;border-radius:4px;display:block}',
'.cf-tag{font-family:var(--cf-mono);font-size:9.5px;letter-spacing:.1em;padding:2px 6px;border-radius:5px;',
'  text-transform:uppercase;white-space:nowrap}',
'.cf-tag.hit{background:rgba(115,191,105,.16);color:var(--cf-hit)}',
'.cf-tag.miss{background:rgba(255,152,48,.16);color:var(--cf-miss)}',
'.cf-tag.none{background:rgba(255,255,255,.06);color:var(--cf-faint)}',
'.cf-indent{padding-left:22px;position:relative}',
'.cf-indent::before{content:"";position:absolute;left:9px;top:0;bottom:0;width:1px;background:var(--cf-line)}',
'.cf-attr{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;font-family:var(--cf-mono);font-size:11.5px;',
'  align-items:baseline}',
'.cf-attr dt{color:var(--cf-faint);white-space:nowrap}',
'.cf-attr dd{color:var(--cf-ink);word-break:break-word}',
'.cf-attr dd.hit{color:var(--cf-hit)} .cf-attr dd.miss{color:var(--cf-miss)}',
'.cf-side h4{font-family:var(--cf-disp);font-size:16px;margin:0 0 3px}',
'.cf-side .sub{font-family:var(--cf-mono);font-size:11px;color:var(--cf-faint);margin-bottom:12px}',
'.cf-why{margin-top:13px;padding:10px 12px;border-radius:9px;font-size:12.5px;line-height:1.55;',
'  background:rgba(255,255,255,.035);border:1px solid var(--cf-line);color:var(--cf-muted)}',
'.cf-why b{color:var(--cf-ink);font-weight:600}',
'.cf-evt{display:flex;align-items:center;gap:8px;margin:5px 0 0 32px;font-family:var(--cf-mono);',
'  font-size:11px;color:var(--cf-miss)}',
'.cf-evt::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--cf-miss);flex:0 0 auto}',

/* ---- economics ---- */
'.cf-ctl{flex:0 0 300px;padding:14px 18px;border-right:1px solid var(--cf-line);display:flex;',
'  flex-direction:column;gap:14px}',
'.cf-out{flex:1;padding:16px 20px;display:flex;flex-direction:column;gap:14px;min-width:0}',
'.cf-field label{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--cf-mono);',
'  font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--cf-faint);margin-bottom:7px}',
'.cf-field label b{font-size:13px;color:var(--cf-ink);letter-spacing:0;text-transform:none;font-weight:500}',
'.cf-field input[type=range]{width:100%;accent-color:var(--cf-otel);height:18px;cursor:pointer}',
'.cf-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}',
'.cf-kpi{border:1px solid var(--cf-line);border-radius:11px;padding:13px 15px;background:rgba(255,255,255,.022)}',
'.cf-kpi .k{font-family:var(--cf-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--cf-faint)}',
'.cf-kpi .v{font-family:var(--cf-disp);font-weight:700;font-size:30px;line-height:1.1;margin-top:6px;letter-spacing:-.02em}',
'.cf-kpi .u{font-family:var(--cf-mono);font-size:11px;color:var(--cf-faint);margin-top:3px}',
'.cf-kpi.hit .v{color:var(--cf-hit)} .cf-kpi.miss .v{color:var(--cf-miss)} .cf-kpi.otel .v{color:var(--cf-otel)}',
'.cf-split{height:30px;border-radius:8px;overflow:hidden;display:flex;border:1px solid var(--cf-line)}',
'.cf-split i{display:flex;align-items:center;justify-content:center;font-family:var(--cf-mono);font-size:11px;',
'  color:#0a0e1a;font-style:normal;transition:flex-grow .3s ease;min-width:0;overflow:hidden;white-space:nowrap}',
'.cf-split .h{background:var(--cf-hit)} .cf-split .m{background:var(--cf-miss)}',
'.cf-delta{font-size:13px;line-height:1.6;color:var(--cf-muted)}',
'.cf-delta b{color:var(--cf-ink)}',
'.cf-preset{display:flex;gap:7px;flex-wrap:wrap}',
'.cf-preset button{font-family:var(--cf-mono);font-size:11px;padding:5px 10px;border-radius:999px;cursor:pointer;',
'  border:1px solid var(--cf-line);background:transparent;color:var(--cf-muted)}',
'.cf-preset button:hover{border-color:rgba(249,115,22,.5);color:var(--cf-otel)}',

/* ---- pipeline ---- */
'.cf-flow{flex:1;padding:18px 20px;display:flex;flex-direction:column;gap:14px;min-width:0}',
'.cf-nodes{display:flex;align-items:center;gap:0;flex-wrap:nowrap}',
'.cf-node{border:1px solid var(--cf-line);border-radius:11px;padding:11px 14px;background:rgba(255,255,255,.025);',
'  min-width:0;flex:1}',
'.cf-node .n1{font-family:var(--cf-disp);font-size:14px;font-weight:600;line-height:1.25}',
'.cf-node .n2{font-family:var(--cf-mono);font-size:10.5px;color:var(--cf-faint);margin-top:4px;line-height:1.5}',
'.cf-node.vs{border-color:rgba(76,141,255,.42)} .cf-node.vs .n1{color:var(--cf-vscode)}',
'.cf-node.cl{border-color:rgba(160,107,255,.42)} .cf-node.cl .n1{color:var(--cf-cli)}',
'.cf-node.col{border-color:rgba(249,115,22,.42)} .cf-node.col .n1{color:var(--cf-otel)}',
'.cf-node.dim{opacity:.28}',
'.cf-wire{flex:0 0 62px;height:2px;background:rgba(255,255,255,.13);position:relative;margin:0 2px}',
'.cf-wire::after{content:"";position:absolute;right:-1px;top:-3px;border-left:6px solid rgba(255,255,255,.28);',
'  border-top:4px solid transparent;border-bottom:4px solid transparent}',
'.cf-wire b{position:absolute;top:-2px;left:0;width:6px;height:6px;border-radius:50%;background:var(--cf-otel);',
'  animation:cf-travel 1.9s linear infinite}',
'.cf-wire b:nth-child(2){animation-delay:.63s} .cf-wire b:nth-child(3){animation-delay:1.26s}',
'@keyframes cf-travel{from{transform:translateX(0);opacity:0}',
'  12%{opacity:1} 88%{opacity:1} to{transform:translateX(58px);opacity:0}}',
'@media (prefers-reduced-motion:reduce){.cf-wire b{animation:none;opacity:.7}}',
'.cf-stack{display:flex;flex-direction:column;gap:8px;flex:1}',
'.cf-code{background:#070b14;border:1px solid var(--cf-line);border-radius:10px;padding:12px 14px;',
'  font-family:var(--cf-mono);font-size:11.5px;line-height:1.7;color:#c9d6ea;white-space:pre;overflow:auto;flex:1}',
'.cf-code .c{color:var(--cf-faint)} .cf-code .k{color:var(--cf-cli)} .cf-code .s{color:var(--cf-hit)}',
'.cf-code .f{color:var(--cf-vscode)} .cf-code .n{color:var(--cf-miss)}',
'.cf-facts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}',
'.cf-fact{border:1px solid var(--cf-line);border-radius:9px;padding:9px 11px}',
'.cf-fact .k{font-family:var(--cf-mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--cf-faint)}',
'.cf-fact .v{font-size:12.5px;margin-top:4px;color:var(--cf-ink);line-height:1.4}',
'.cf-tabs{display:flex;gap:6px}',
'.cf-tabs button{font-family:var(--cf-mono);font-size:11px;padding:5px 11px;border-radius:7px;cursor:pointer;',
'  border:1px solid var(--cf-line);background:transparent;color:var(--cf-muted)}',
'.cf-tabs button[aria-pressed="true"]{background:rgba(249,115,22,.13);border-color:rgba(249,115,22,.42);color:var(--cf-otel)}',

/* ---- timeline ---- */
'.cf-toggles{flex:0 0 322px;padding:14px 16px;border-right:1px solid var(--cf-line);display:flex;',
'  flex-direction:column;gap:9px}',
'.cf-tog{display:grid;grid-template-columns:34px 1fr;gap:11px;align-items:start;padding:9px 11px;border-radius:10px;',
'  border:1px solid var(--cf-line);cursor:pointer;background:transparent;text-align:left;color:inherit;font:inherit;',
'  transition:border-color .14s,background .14s}',
'.cf-tog:hover{background:rgba(255,255,255,.035)}',
'.cf-tog[aria-pressed="true"]{border-color:rgba(255,152,48,.45);background:rgba(255,152,48,.07)}',
'.cf-sw{width:30px;height:17px;border-radius:999px;background:rgba(255,255,255,.12);position:relative;margin-top:2px}',
'.cf-sw::after{content:"";position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;',
'  background:var(--cf-faint);transition:transform .18s ease,background .18s ease}',
'.cf-tog[aria-pressed="true"] .cf-sw{background:rgba(255,152,48,.3)}',
'.cf-tog[aria-pressed="true"] .cf-sw::after{transform:translateX(13px);background:var(--cf-miss)}',
'.cf-tog .tt{display:block;font-size:13.5px;font-weight:600;line-height:1.32}',
'.cf-tog .td{display:block;font-size:11.5px;color:var(--cf-muted);margin-top:4px;line-height:1.46}',
'.cf-tl{flex:1;padding:18px 22px 20px;display:flex;flex-direction:column;gap:18px;min-width:0}',
'.cf-strip{display:flex;gap:3px;align-items:stretch;height:170px}',
'.cf-turn{flex:1;border-radius:4px 4px 2px 2px;position:relative;transform-origin:bottom center;',
'  transition:transform .3s ease,background .3s ease}',
'.cf-turn.h{background:var(--cf-hit)} .cf-turn.m{background:var(--cf-miss)}',
'.cf-axis{display:flex;justify-content:space-between;font-family:var(--cf-mono);font-size:10px;color:var(--cf-faint)}',
'.cf-gauge{display:flex;align-items:center;gap:16px}',
'.cf-gauge .num{font-family:var(--cf-disp);font-weight:700;font-size:44px;line-height:1;letter-spacing:-.03em;',
'  transition:color .3s ease}',
'.cf-gauge .lb{font-family:var(--cf-mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--cf-faint)}',
'.cf-diag{font-size:13px;line-height:1.62;color:var(--cf-muted);min-height:62px}',
'.cf-diag b{color:var(--cf-ink)} .cf-diag .m{color:var(--cf-miss)} .cf-diag .h{color:var(--cf-hit)}',
'.cf-marks{display:flex;gap:3px;height:14px}',
'.cf-mark{flex:1;display:flex;align-items:center;justify-content:center}',
'.cf-mark i{width:9px;height:9px;border-radius:2px;transform:rotate(45deg);background:var(--cf-miss);',
'  border:1px solid rgba(10,14,26,.6)}'
  ].join('\n');

  var mounted = false;
  function ensureCSS() {
    if (mounted) return;
    var s = document.createElement('style');
    s.setAttribute('data-copilot-figures', '');
    s.textContent = CSS;
    document.head.appendChild(s);
    mounted = true;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtK(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k';
    return String(Math.round(n));
  }

  /* =====================================================================
     FIGURE 1 — Trace explorer
     One real-shaped Copilot turn: invoke_agent → chat / execute_tool.
     ===================================================================== */

  function figTrace(host) {
    var surface = 'cli';

    var SPANS = [
      { id: 'agent', op: 'invoke_agent', name: '', depth: 0, start: 0, dur: 12.4, cache: 'none',
        why: 'One <b>turn</b>. This is the span the dashboards count, and the only one carrying <b>cost</b> and <b>agent</b> attributes — which is why AI credits are summed here and nowhere else.',
        attrs: [
          ['gen_ai.operation.name', 'invoke_agent'],
          ['github.copilot.nano_aiu', '20546625000', 'note:÷ 1e9 = 20.5 AI credits'],
          ['github.copilot.turn_count', '7'],
          ['github.copilot.server_duration', '9840'],
          ['gen_ai.invoke_agent.tool_calls', '4']
        ] },
      { id: 'chat1', op: 'chat', name: 'gpt-5.6', depth: 1, start: 0.1, dur: 3.9, cache: 'miss',
        why: 'First call of the session. Nothing to read from, so the whole prefix is <b>written</b> to cache: <span style="color:var(--cf-miss)">cache_creation &gt; 0</span>. A cold miss is normal — you pay it once.',
        attrs: [
          ['gen_ai.operation.name', 'chat'],
          ['gen_ai.request.model', 'gpt-5.6'],
          ['gen_ai.usage.input_tokens', '21,504'],
          ['gen_ai.usage.output_tokens', '318'],
          ['gen_ai.usage.cache_read.input_tokens', '0'],
          ['gen_ai.usage.cache_creation.input_tokens', '21,504', 'miss'],
          ['gen_ai.response.time_to_first_chunk', '0.94']
        ] },
      { id: 'tool1', op: 'execute_tool', name: 'read_file', depth: 1, start: 4.1, dur: 0.4, cache: 'none',
        why: 'Tool spans tell you <b>which</b> tools the agent reaches for and how slow they are. A tool that takes seconds shows up here long before anyone files a bug about "Copilot feels sluggish".',
        attrs: [
          ['gen_ai.operation.name', 'execute_tool'],
          ['gen_ai.tool.name', 'read_file'],
          ['gen_ai.tool.type', 'function']
        ] },
      { id: 'tool2', op: 'execute_tool', name: 'grep_search', depth: 1, start: 4.6, dur: 1.1, cache: 'none',
        why: 'Four tool calls in one turn is ordinary agent behaviour. Each one appends to the prompt — which is exactly how a long session drifts toward the context limit.',
        attrs: [
          ['gen_ai.operation.name', 'execute_tool'],
          ['gen_ai.tool.name', 'grep_search'],
          ['gen_ai.tool.type', 'function']
        ] },
      { id: 'chat2', op: 'chat', name: 'gpt-5.6', depth: 1, start: 5.8, dur: 2.6, cache: 'hit',
        why: 'The prefix did not move, so the model reads it back: <span style="color:var(--cf-hit)">cache_read &gt; 0</span>. Cheaper, and roughly a second faster to first token than the cold call above.',
        attrs: [
          ['gen_ai.operation.name', 'chat'],
          ['gen_ai.request.model', 'gpt-5.6'],
          ['gen_ai.usage.input_tokens', '23,110'],
          ['gen_ai.usage.output_tokens', '640'],
          ['gen_ai.usage.cache_read.input_tokens', '21,504', 'hit'],
          ['gen_ai.usage.cache_creation.input_tokens', '1,606'],
          ['gen_ai.response.time_to_first_chunk', '0.31']
        ] },
      { id: 'chat3', op: 'chat', name: 'gpt-5.6', depth: 1, start: 8.6, dur: 3.6, cache: 'miss',
        event: 'github.copilot.session.compaction_complete',
        why: 'Between the two calls the session ran out of context and <b>compacted</b> — the history was summarised and rewritten. New prefix, so the cache is rebuilt from scratch. The span <b>event</b> is the receipt: cause and effect, side by side.',
        attrs: [
          ['gen_ai.operation.name', 'chat'],
          ['gen_ai.request.model', 'gpt-5.6'],
          ['gen_ai.usage.input_tokens', '18,940'],
          ['gen_ai.usage.output_tokens', '512'],
          ['gen_ai.usage.cache_read.input_tokens', '0'],
          ['gen_ai.usage.cache_creation.input_tokens', '18,940', 'miss'],
          ['gen_ai.response.time_to_first_chunk', '1.02']
        ] }
    ];

    var SURFACES = {
      vscode: {
        label: 'VS Code',
        service: 'copilot-chat',
        agentKey: 'gen_ai.agent.name',
        agentVal: 'GitHub Copilot Chat',
        extra: [['copilot_chat.repo.name', 'webmaxru/copilot-opentelemetry']]
      },
      cli: {
        label: 'Copilot CLI',
        service: 'github-copilot',
        agentKey: 'gen_ai.agent.id',
        agentVal: 'copilotcli',
        extra: [['github.copilot.git.repo', 'webmaxru/copilot-opentelemetry']]
      }
    };

    var total = 12.4, sel = 'chat2';

    host.innerHTML = '';
    var root = el('div', 'cf');

    var bar = el('div', 'cf-bar');
    bar.appendChild(el('span', 'cf-t', 'one turn · 6 spans'));
    var seg = el('div', 'cf-seg');
    seg.innerHTML =
      '<button type="button" data-s="vscode">VS Code · copilot-chat</button>' +
      '<button type="button" data-s="cli">Copilot CLI · github-copilot</button>';
    bar.appendChild(seg);
    bar.appendChild(el('span', 'cf-sp'));
    bar.appendChild(el('span', 'cf-note', 'click any span'));
    root.appendChild(bar);

    var body = el('div', 'cf-body');
    var tree = el('div', 'cf-tree cf-scroll');
    var side = el('div', 'cf-side cf-scroll');
    body.appendChild(tree); body.appendChild(side);
    root.appendChild(body);
    host.appendChild(root);

    function drawTree() {
      tree.innerHTML = '';
      SPANS.forEach(function (s) {
        var wrap = el('div', s.depth ? 'cf-indent' : '');
        var b = el('button', 'cf-span');
        b.type = 'button';
        b.setAttribute('aria-selected', String(s.id === sel));
        var left = (s.start / total) * 100, w = Math.max(2, (s.dur / total) * 100);
        var col = s.cache === 'hit' ? 'var(--cf-hit)' : s.cache === 'miss' ? 'var(--cf-miss)'
          : s.op === 'execute_tool' ? 'rgba(148,161,182,.55)' : 'rgba(249,115,22,.65)';
        b.innerHTML =
          '<span class="op">' + s.op + (s.name ? ' <i>· ' + s.name + '</i>' : '') + '</span>' +
          '<span class="cf-lane"><i style="left:' + left + '%;width:' + w + '%;background:' + col + '"></i></span>' +
          '<span class="dur">' + s.dur.toFixed(1) + 's</span>';
        b.addEventListener('click', function () { sel = s.id; drawTree(); drawSide(); });
        wrap.appendChild(b);
        if (s.event) wrap.appendChild(el('div', 'cf-evt', s.event));
        tree.appendChild(wrap);
      });
    }

    function drawSide() {
      var s = SPANS.filter(function (x) { return x.id === sel; })[0];
      var sf = SURFACES[surface];
      var tag = s.cache === 'hit' ? '<span class="cf-tag hit">cache hit</span>'
        : s.cache === 'miss' ? '<span class="cf-tag miss">cache miss</span>'
        : '<span class="cf-tag none">no cache signal</span>';

      var rows = s.attrs.map(function (a) {
        var cls = a[2] === 'hit' ? ' class="hit"' : a[2] === 'miss' ? ' class="miss"' : '';
        var note = a[2] && a[2].indexOf('note:') === 0
          ? ' <span style="color:var(--cf-faint)">' + a[2].slice(5) + '</span>' : '';
        return '<dt>' + a[0] + '</dt><dd' + cls + '>' + a[1] + note + '</dd>';
      });
      rows.push('<dt style="color:var(--cf-otel)">resource.service.name</dt><dd style="color:var(--cf-' +
        (surface === 'vscode' ? 'vscode' : 'cli') + ')">' + sf.service + '</dd>');
      if (s.id === 'agent') {
        rows.push('<dt style="color:var(--cf-otel)">' + sf.agentKey + '</dt><dd>' + sf.agentVal + '</dd>');
        rows.push('<dt>' + sf.extra[0][0] + '</dt><dd>' + sf.extra[0][1] + '</dd>');
      }

      side.innerHTML =
        '<h4>' + s.op + (s.name ? ' · ' + s.name : '') + ' ' + tag + '</h4>' +
        '<div class="sub">duration ' + s.dur.toFixed(1) + 's · starts +' + s.start.toFixed(1) + 's into the turn</div>' +
        '<dl class="cf-attr">' + rows.join('') + '</dl>' +
        '<div class="cf-why">' + s.why + '</div>';
    }

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      surface = b.dataset.s;
      seg.className = 'cf-seg ' + (surface === 'vscode' ? 'vs' : 'cl');
      Array.prototype.forEach.call(seg.children, function (c) {
        c.setAttribute('aria-pressed', String(c.dataset.s === surface));
      });
      drawSide();
    });
    seg.querySelector('[data-s="cli"]').click();
    drawTree(); drawSide();
  }

  /* =====================================================================
     FIGURE 2 — Cache economics
     ===================================================================== */

  function figEconomics(host) {
    var st = { devs: 40, turns: 18, prefix: 22, hit: 62 };

    // Grounded in the sample turn above: ~21.5k-token prefix, 20.5 AI credits
    // for a 7-round-trip turn. Cached input is billed at ~10% of fresh input,
    // which is the conservative public figure for prompt caching.
    var CREDITS_PER_TURN_COLD = 20.5 / 7;  // per LLM round trip, everything fresh
    var CACHED_RATE = 0.10;
    var TTFT_COLD = 0.94, TTFT_HIT = 0.31;

    host.innerHTML = '';
    var root = el('div', 'cf');
    root.appendChild(el('div', 'cf-bar',
      '<span class="cf-t">fleet cache model</span>' +
      '<span class="cf-sp"></span>' +
      '<span class="cf-note">drag anything · presets on the left</span>'));

    var body = el('div', 'cf-body');
    var ctl = el('div', 'cf-ctl cf-scroll');
    var out = el('div', 'cf-out');
    body.appendChild(ctl); body.appendChild(out);
    root.appendChild(body); host.appendChild(root);

    var FIELDS = [
      ['devs', 'Developers', 1, 500, 1, function (v) { return v + ' devs'; }],
      ['turns', 'Turns per dev per day', 1, 80, 1, function (v) { return v + ' turns'; }],
      ['prefix', 'Prompt prefix size', 4, 120, 1, function (v) { return v + 'k tokens'; }],
      ['hit', 'Cache hit rate', 0, 100, 1, function (v) { return v + '%'; }]
    ];

    FIELDS.forEach(function (f) {
      var w = el('div', 'cf-field');
      w.innerHTML = '<label for="cf-' + f[0] + '"><span>' + f[1] + '</span><b data-v="' + f[0] + '"></b></label>' +
        '<input id="cf-' + f[0] + '" type="range" min="' + f[2] + '" max="' + f[3] + '" step="' + f[4] + '" value="' + st[f[0]] + '">';
      w.querySelector('input').addEventListener('input', function (e) {
        st[f[0]] = Number(e.target.value); render();
      });
      ctl.appendChild(w);
    });

    var presets = el('div', 'cf-preset');
    presets.innerHTML =
      '<button type="button" data-p="solo">solo dev</button>' +
      '<button type="button" data-p="team">40-dev team</button>' +
      '<button type="button" data-p="bad">unstable prefix</button>' +
      '<button type="button" data-p="tuned">after tuning</button>';
    presets.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var P = {
        solo:  { devs: 1,   turns: 25, prefix: 22, hit: 62 },
        team:  { devs: 40,  turns: 18, prefix: 22, hit: 62 },
        bad:   { devs: 40,  turns: 18, prefix: 34, hit: 18 },
        tuned: { devs: 40,  turns: 18, prefix: 22, hit: 89 }
      }[b.dataset.p];
      Object.keys(P).forEach(function (k) { st[k] = P[k]; });
      sync(); render();
    });
    ctl.appendChild(presets);
    ctl.appendChild(el('div', 'cf-note',
      'Model: cached input tokens bill at ~10% of fresh ones. Credits calibrated to a real span — ' +
      '<span style="color:var(--cf-ink)">nano_aiu 20,546,625,000 ÷ 1e9 = 20.5</span> over 7 round trips.'));

    out.innerHTML =
      '<div class="cf-grid3">' +
      '<div class="cf-kpi miss"><div class="k">rebuilt / month</div><div class="v" data-k="rebuilt">—</div><div class="u">prefix tokens re-sent</div></div>' +
      '<div class="cf-kpi otel"><div class="k">AI credits / month</div><div class="v" data-k="credits">—</div><div class="u">vs <span data-k="creditsIdeal">—</span> at 95% hit</div></div>' +
      '<div class="cf-kpi hit"><div class="k">waiting saved / month</div><div class="v" data-k="hours">—</div><div class="u">time-to-first-token, team-wide</div></div>' +
      '</div>' +
      '<div><div class="cf-note" style="margin-bottom:7px">every LLM call this month</div>' +
      '<div class="cf-split"><i class="h" data-k="barH"></i><i class="m" data-k="barM"></i></div></div>' +
      '<div class="cf-delta" data-k="delta"></div>';

    function q(k) { return out.querySelector('[data-k="' + k + '"]'); }

    function sync() {
      FIELDS.forEach(function (f) {
        ctl.querySelector('#cf-' + f[0]).value = st[f[0]];
      });
    }

    function render() {
      FIELDS.forEach(function (f) {
        ctl.querySelector('[data-v="' + f[0] + '"]').textContent = f[5](st[f[0]]);
      });

      var callsMo = st.devs * st.turns * 22 * 7;     // 22 working days, ~7 LLM calls per turn
      var misses = callsMo * (1 - st.hit / 100);
      var hits = callsMo - misses;
      var prefixTok = st.prefix * 1000;

      var rebuilt = misses * prefixTok;
      var credits = (misses + hits * CACHED_RATE) * CREDITS_PER_TURN_COLD * (st.prefix / 22);
      var ideal = (callsMo * 0.05 + callsMo * 0.95 * CACHED_RATE) * CREDITS_PER_TURN_COLD * (st.prefix / 22);
      var hours = (misses * (TTFT_COLD - TTFT_HIT)) / 3600;

      q('rebuilt').textContent = fmtK(rebuilt);
      q('credits').textContent = fmtK(credits);
      q('creditsIdeal').textContent = fmtK(ideal);
      q('hours').textContent = hours < 10 ? hours.toFixed(1) + ' h' : Math.round(hours) + ' h';

      var hp = Math.max(0, st.hit), mp = 100 - hp;
      q('barH').style.flexGrow = hp; q('barM').style.flexGrow = mp;
      q('barH').textContent = hp >= 14 ? hp + '% hit' : '';
      q('barM').textContent = mp >= 14 ? mp + '% miss' : '';

      var over = credits - ideal;
      q('delta').innerHTML = st.hit >= 90
        ? '<b>' + fmtInt(callsMo) + '</b> LLM calls a month, and the prefix mostly stays put. ' +
          'This is what a stable system prompt buys you: the tokens are already there.'
        : 'Those misses re-send <b>' + fmtK(rebuilt) + ' tokens</b> the model had already seen, cost about ' +
          '<b>' + fmtK(over) + ' extra AI credits</b> a month, and make ' + fmtInt(misses) +
          ' calls start slower. <span style="color:var(--cf-muted)">Nobody files a bug for this. It just shows up on the invoice.</span>';
    }

    sync(); render();
  }

  /* =====================================================================
     FIGURE 3 — Pipeline builder
     ===================================================================== */

  function figPipeline(host) {
    var st = { vscode: true, cli: true, backend: 'A', tab: 0 };

    var BACKENDS = {
      A: { name: 'Local', collector: false,
        store: { n1: 'Grafana Tempo', n2: 'local Docker · traces only' },
        view: { n1: 'Grafana :3001', n2: 'TraceQL · auto-provisioned board' },
        facts: ['Free · runs offline', 'No collector in the path', 'Data never leaves the laptop', 'Per-machine — not fleet-ready'] },
      B: { name: 'Azure · local collector', collector: true,
        store: { n1: 'Tempo + App Insights', n2: 'collector fans out to both' },
        view: { n1: 'Grafana + Azure Monitor', n2: 'TraceQL and KQL' },
        facts: ['Azure metered · 5 GB/mo free grant', 'Collector scrubs + fans out', 'Cloud copy stays in your tenant', 'Both query languages at once'] },
      C: { name: 'Azure Container Apps', collector: true,
        store: { n1: 'Application Insights', n2: 'via cloud collector, scale-to-zero' },
        view: { n1: 'Azure Monitor + Grafana', n2: 'KQL · in-portal dashboards' },
        facts: ['Scale-to-zero · nothing runs locally', 'Public endpoint — token is a secret', 'Fleet-ready shared endpoint', 'Cold start on first request'] },
      D: { name: 'Grafana Cloud', collector: false,
        store: { n1: 'Managed Tempo', n2: 'Grafana Labs SaaS' },
        view: { n1: 'Grafana Cloud', n2: 'TraceQL · import the board' },
        facts: ['Free tier · 50 GB traces/mo', 'No collector = no scrubbing', 'Third-party region', 'Wants http/protobuf explicitly'] }
    };

    host.innerHTML = '';
    var root = el('div', 'cf');

    var bar = el('div', 'cf-bar');
    bar.innerHTML = '<span class="cf-t">surfaces</span>';
    var segS = el('div', 'cf-seg');
    segS.innerHTML = '<button type="button" data-x="vscode">VS Code</button><button type="button" data-x="cli">Copilot CLI</button>';
    bar.appendChild(segS);
    bar.appendChild(el('span', 'cf-t', 'backend'));
    var segB = el('div', 'cf-seg');
    segB.innerHTML = ['A', 'B', 'C', 'D'].map(function (k) {
      return '<button type="button" data-b="' + k + '">' + k + ' · ' + BACKENDS[k].name + '</button>';
    }).join('');
    bar.appendChild(segB);
    root.appendChild(bar);

    var flow = el('div', 'cf-flow');
    flow.innerHTML =
      '<div class="cf-nodes" data-k="nodes"></div>' +
      '<div class="cf-facts" data-k="facts"></div>' +
      '<div class="cf-stack"><div class="cf-tabs" data-k="tabs"></div><div class="cf-code" data-k="code"></div></div>';
    root.appendChild(flow);
    host.appendChild(root);

    function q(k) { return flow.querySelector('[data-k="' + k + '"]'); }
    function wire() { return '<div class="cf-wire"><b></b><b></b><b></b></div>'; }
    function node(cls, n1, n2) {
      return '<div class="cf-node ' + cls + '"><div class="n1">' + n1 + '</div><div class="n2">' + n2 + '</div></div>';
    }

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

    function configs() {
      var b = BACKENDS[st.backend];
      var cloud = st.backend === 'C' || st.backend === 'D';
      var endpoint = st.backend === 'D'
        ? 'https://otlp-gateway-<zone>.grafana.net/otlp'
        : cloud ? 'https://<app>.<region>.azurecontainerapps.io' : 'http://localhost:4318';
      var auth = st.backend === 'D' ? 'Basic <base64 instanceID:token>'
        : st.backend === 'C' ? 'Bearer <64-hex token>' : null;

      var tabs = [];

      if (st.vscode) {
        tabs.push(['VS Code settings.json', cloud
          ? '<span class="c">// Cloud endpoints need a header, and there is no user-level</span>\n' +
            '<span class="c">// settings.json key for headers — so an individual dev uses env vars.</span>\n' +
            '<span class="c">// Fleet-wide, use managed settings (next tab).</span>\n' +
            '<span class="f">setx</span> <span class="k">OTEL_EXPORTER_OTLP_ENDPOINT</span> <span class="s">"' + esc(endpoint) + '"</span>\n' +
            '<span class="f">setx</span> <span class="k">OTEL_EXPORTER_OTLP_HEADERS</span>  <span class="s">"Authorization=' + esc(auth) + '"</span>\n' +
            (st.backend === 'D' ? '<span class="f">setx</span> <span class="k">OTEL_EXPORTER_OTLP_PROTOCOL</span> <span class="s">"http/protobuf"</span>\n' : '') +
            '<span class="f">setx</span> <span class="k">COPILOT_OTEL_ENABLED</span>        <span class="s">"true"</span>'
          : '{\n' +
            '  <span class="k">"github.copilot.chat.otel.enabled"</span>: <span class="n">true</span>,\n' +
            '  <span class="k">"github.copilot.chat.otel.exporterType"</span>: <span class="s">"otlp-http"</span>,\n' +
            '  <span class="k">"github.copilot.chat.otel.otlpEndpoint"</span>: <span class="s">"' + esc(endpoint) + '"</span>,\n' +
            '  <span class="k">"github.copilot.chat.otel.captureContent"</span>: <span class="n">false</span>\n' +
            '}\n<span class="c">// User settings, not Workspace. Reload the window.</span>']);
      }

      if (st.cli) {
        tabs.push(['Copilot CLI env', '<span class="c"># The CLI reads the same OTEL_* vars. Restart the shell after setx.</span>\n' +
          '<span class="f">setx</span> <span class="k">COPILOT_OTEL_ENABLED</span>        <span class="s">"true"</span>\n' +
          '<span class="f">setx</span> <span class="k">OTEL_EXPORTER_OTLP_ENDPOINT</span> <span class="s">"' + esc(endpoint) + '"</span>\n' +
          (auth ? '<span class="f">setx</span> <span class="k">OTEL_EXPORTER_OTLP_HEADERS</span>  <span class="s">"Authorization=' + esc(auth) + '"</span>\n' : '') +
          (st.backend === 'D' ? '<span class="f">setx</span> <span class="k">OTEL_EXPORTER_OTLP_PROTOCOL</span> <span class="s">"http/protobuf"</span>  <span class="c"># CLI defaults to http/json</span>\n' : '') +
          '<span class="c"># Leave OTEL_SERVICE_NAME unset — that is what keeps the two surfaces apart.</span>']);
      }

      tabs.push(['Fleet · managed-settings.json',
        '{\n  <span class="k">"telemetry"</span>: {\n' +
        '    <span class="k">"enabled"</span>: <span class="n">true</span>,\n' +
        '    <span class="k">"endpoint"</span>: <span class="s">"' + esc(endpoint) + '"</span>,\n' +
        '    <span class="k">"protocol"</span>: <span class="s">"otlp-http"</span>,\n' +
        '    <span class="k">"captureContent"</span>: <span class="n">false</span>,\n' +
        '    <span class="k">"lockCaptureContent"</span>: <span class="n">true</span>' +
        (auth ? ',\n    <span class="k">"headers"</span>: { <span class="k">"Authorization"</span>: <span class="s">"' + esc(auth) + '"</span> }' : '') +
        ',\n    <span class="k">"resourceAttributes"</span>: { <span class="k">"team"</span>: <span class="s">"platform"</span> }\n' +
        '  }\n}\n' +
        '<span class="c">// Policy &gt; env var &gt; user setting. Do NOT set telemetry.serviceName —</span>\n' +
        '<span class="c">// it collapses every surface into one name and kills the selector.</span>']);

      if (b.collector) {
        tabs.push(['Collector · scrub', 'processors:\n' +
          '  <span class="k">attributes/scrub</span>:\n    actions:\n' +
          '      - key: <span class="s">enduser.pseudo.id</span>\n        action: <span class="n">delete</span>\n' +
          (st.backend === 'C'
            ? '      - key: <span class="s">gen_ai.tool.definitions</span>\n        action: <span class="n">delete</span>\n' +
              '      - key: <span class="s">github.copilot.context.skills</span>\n        action: <span class="n">delete</span>\n'
            : '') +
          '<span class="c"># This is the whole argument for the collector hop: content capture is off,</span>\n' +
          '<span class="c"># but a stable per-developer id ships on every span until you delete it.</span>']);
      }

      return tabs;
    }

    function render() {
      Array.prototype.forEach.call(segS.children, function (c) {
        c.setAttribute('aria-pressed', String(!!st[c.dataset.x]));
      });
      Array.prototype.forEach.call(segB.children, function (c) {
        c.setAttribute('aria-pressed', String(c.dataset.b === st.backend));
      });

      var b = BACKENDS[st.backend];
      var src = '';
      if (st.vscode && st.cli) {
        src = '<div style="flex:1;display:flex;flex-direction:column;gap:8px">' +
          node('vs', 'VS Code', 'service.name = copilot-chat') +
          node('cl', 'Copilot CLI', 'service.name = github-copilot') + '</div>';
      } else if (st.vscode) {
        src = node('vs', 'VS Code', 'service.name = copilot-chat');
      } else if (st.cli) {
        src = node('cl', 'Copilot CLI', 'service.name = github-copilot');
      } else {
        src = '<div class="cf-node dim"><div class="n1">no surface</div><div class="n2">pick at least one</div></div>';
      }

      q('nodes').innerHTML = src + wire() +
        (b.collector ? node('col', 'OTel Collector', st.backend === 'C' ? 'Azure Container Apps · bearer auth' : 'local Docker · fan-out + scrub') + wire() : '') +
        node('', b.store.n1, b.store.n2) + wire() +
        node('', b.view.n1, b.view.n2);

      q('facts').innerHTML = b.facts.map(function (f, i) {
        return '<div class="cf-fact"><div class="k">' + ['cost', 'pipeline', 'data', 'watch out'][i] +
          '</div><div class="v">' + f + '</div></div>';
      }).join('');

      var tabs = configs();
      if (st.tab >= tabs.length) st.tab = 0;
      q('tabs').innerHTML = tabs.map(function (t, i) {
        return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === st.tab) + '">' + t[0] + '</button>';
      }).join('');
      q('code').innerHTML = tabs[st.tab][1];
    }

    segS.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      st[b.dataset.x] = !st[b.dataset.x];
      render();
    });
    segB.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      st.backend = b.dataset.b; render();
    });
    q('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      st.tab = Number(b.dataset.i); render();
    });

    render();
  }

  /* =====================================================================
     FIGURE 4 — Prompt-prefix stability timeline
     ===================================================================== */

  function figTimeline(host) {
    var TURNS = 26;
    var st = { clock: false, tools: false, compact: false, model: false };

    var CAUSES = [
      ['clock', 'A timestamp in the system prompt',
        'Something injects "current time" on every call. The first token of the prefix changes, so every byte after it is new.'],
      ['tools', 'Tool inventory reorders',
        'MCP servers register in a race. The tool list is serialised in a different order each session — same tools, different prefix.'],
      ['compact', 'Long session → compaction',
        'History hits the context limit and gets summarised. Copilot emits session.truncation / compaction_* right before the miss.'],
      ['model', 'Model switched mid-session',
        'A different model means a different cache. Switching back does not bring the old one along.']
    ];

    host.innerHTML = '';
    var root = el('div', 'cf');
    root.appendChild(el('div', 'cf-bar',
      '<span class="cf-t">one 26-turn session</span><span class="cf-sp"></span>' +
      '<span class="cf-note">flip a cause · watch the strip</span>'));

    var body = el('div', 'cf-body');
    var togs = el('div', 'cf-toggles cf-scroll');
    var tl = el('div', 'cf-tl');
    body.appendChild(togs); body.appendChild(tl);
    root.appendChild(body); host.appendChild(root);

    CAUSES.forEach(function (c) {
      var b = el('button', 'cf-tog');
      b.type = 'button';
      b.dataset.c = c[0];
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="cf-sw"></span><span><span class="tt">' + c[1] + '</span>' +
        '<span class="td">' + c[2] + '</span></span>';
      b.addEventListener('click', function () {
        st[c[0]] = !st[c[0]];
        b.setAttribute('aria-pressed', String(st[c[0]]));
        render();
      });
      togs.appendChild(b);
    });

    tl.innerHTML =
      '<div><div class="cf-strip" data-k="strip"></div>' +
      '<div class="cf-marks" data-k="marks"></div>' +
      '<div class="cf-axis"><span>turn 1</span><span>turn ' + TURNS + '</span></div></div>' +
      '<div class="cf-gauge"><div><div class="num" data-k="rate">—</div>' +
      '<div class="lb">prompt-cache hit rate</div></div>' +
      '<div style="flex:1"><div class="cf-diag" data-k="diag"></div></div></div>';

    function q(k) { return tl.querySelector('[data-k="' + k + '"]'); }

    function simulate() {
      var out = [];
      for (var i = 0; i < TURNS; i++) {
        var miss = i === 0;                      // cold start — always paid once
        var evt = false;
        if (st.clock) miss = true;               // prefix changes every single call
        if (st.tools && i % 3 === 0) miss = true;
        if (st.compact && (i === 9 || i === 18)) { miss = true; evt = true; }
        if (st.model && i === 13) miss = true;
        out.push({ miss: miss, evt: evt });
      }
      return out;
    }

    function render() {
      var sim = simulate();
      var misses = sim.filter(function (t) { return t.miss; }).length;
      var rate = Math.round(((TURNS - misses) / TURNS) * 100);

      q('strip').innerHTML = sim.map(function (t, i) {
        var s = t.miss ? 1 : 0.52;
        return '<div class="cf-turn ' + (t.miss ? 'm' : 'h') + '" style="transform:scaleY(' + s + ')" ' +
          'title="turn ' + (i + 1) + ' — cache ' + (t.miss ? 'miss' : 'hit') + '"></div>';
      }).join('');

      q('marks').innerHTML = sim.map(function (t) {
        return '<div class="cf-mark">' + (t.evt ? '<i title="github.copilot.session.compaction_complete"></i>' : '') + '</div>';
      }).join('');

      var rateEl = q('rate');
      rateEl.textContent = rate + '%';
      rateEl.style.color = rate >= 80 ? 'var(--cf-hit)' : rate >= 50 ? 'var(--cf-miss)' : '#e5534b';

      var on = CAUSES.filter(function (c) { return st[c[0]]; });
      var msg;
      if (!on.length) {
        msg = 'A stable prefix. One cold miss at the start, then the model reads the same ' +
          '21k tokens back for the rest of the session. <b>This is the ceiling</b> — and it is reachable.';
      } else if (st.clock) {
        msg = '<span class="m">Every single turn is a miss.</span> One volatile token at the front of the prompt ' +
          'invalidates everything behind it. The fix is a one-line change — but you will never find it by feel, ' +
          'only by looking at <b>cache_creation.input_tokens</b> staying pinned high.';
      } else {
        msg = 'Hit rate drops to <b>' + rate + '%</b> from: ' +
          on.map(function (c) { return '<span class="m">' + c[1].toLowerCase() + '</span>'; }).join(', ') + '. ' +
          (st.compact ? 'The <b>◆</b> marks are <b>session.compaction_complete</b> events — Copilot tells you exactly when it rewrote the prefix. ' : '') +
          'Cause and effect on one chart.';
      }
      q('diag').innerHTML = msg;
    }

    render();
  }

  /* ------------------------------------------------------------ registry */

  var FIGURES = {
    trace: figTrace,
    economics: figEconomics,
    pipeline: figPipeline,
    timeline: figTimeline
  };

  window.CopilotFigures = {
    list: Object.keys(FIGURES),
    mount: function (name, host) {
      ensureCSS();
      var f = FIGURES[name];
      if (!f) throw new Error('Unknown figure: ' + name);
      f(host);
      return host;
    },
    refresh: function () { /* figures are stateful on purpose — keep what the speaker set up */ }
  };
})();
