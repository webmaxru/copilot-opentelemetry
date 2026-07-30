/* ==========================================================================
   Copilot, Traced — deck engine
   Plain classic script (no modules) so the deck runs straight off file://
   with no server, no build step, no network.
   ========================================================================== */
(function () {
  'use strict';

  var TALK_LENGTH_SEC = 25 * 60;

  var deck, stage, slides = [], idx = 0, lastIdx = 0;
  var elProgress, elCount, elChapter, elTimer, elNotes, elNotesBody, elNotesMeta;
  var elOverview, elOvGrid, elHelp;
  var timer = { running: false, elapsed: 0, last: 0 };

  /* ------------------------------------------------------------------ boot */

  function init() {
    deck = document.querySelector('.deck');
    stage = document.querySelector('.stage');
    slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    if (!stage || !slides.length) return;

    buildChrome();
    buildOverview();

    window.addEventListener('resize', fit);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', fromHash);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && timer.running) tick();
    });

    fit();
    fromHash(true);
    requestAnimationFrame(loop);

    if (/[?&]export=1/.test(location.search)) enterExportMode();
  }

  /* ------------------------------------------------------------- scaling */

  function fit() {
    if (document.body.classList.contains('export')) {
      document.documentElement.style.setProperty('--scale', '1');
      return;
    }
    var w = window.innerWidth, h = window.innerHeight;
    var s = Math.min(w / 1280, h / 720);
    document.documentElement.style.setProperty('--scale', String(s));
  }

  /* -------------------------------------------------------------- chrome */

  function buildChrome() {
    var hud = document.createElement('div');
    hud.className = 'hud';
    hud.innerHTML =
      '<span class="brand"><i class="sq"></i>copilot, traced</span>' +
      '<span class="chapter"></span>' +
      '<span class="spacer"></span>' +
      '<span class="timer paused" title="T = start/pause · Shift+T = reset">00:00</span>' +
      '<span class="count"><b>1</b> / ' + slides.length + '</span>';
    stage.appendChild(hud);

    var prog = document.createElement('div');
    prog.className = 'progress';
    prog.innerHTML = '<i></i>';
    stage.appendChild(prog);

    elProgress = prog.firstChild;
    elCount = hud.querySelector('.count b');
    elChapter = hud.querySelector('.chapter');
    elTimer = hud.querySelector('.timer');
    elTimer.addEventListener('click', toggleTimer);

    elNotes = document.createElement('div');
    elNotes.className = 'notes';
    elNotes.innerHTML =
      '<h4>Speaker notes</h4><div class="body"></div><div class="meta"></div>';
    document.body.appendChild(elNotes);
    elNotesBody = elNotes.querySelector('.body');
    elNotesMeta = elNotes.querySelector('.meta');

    elHelp = document.createElement('div');
    elHelp.className = 'help';
    elHelp.innerHTML =
      '<div class="help-card"><h4>Keyboard</h4><div class="keys">' +
      '<kbd>→</kbd><span>Next slide (also <kbd>Space</kbd>, <kbd>↓</kbd>, <kbd>PgDn</kbd>)</span>' +
      '<kbd>←</kbd><span>Previous slide</span>' +
      '<kbd>N</kbd><span>Speaker notes drawer</span>' +
      '<kbd>O</kbd><span>Slide overview — click to jump</span>' +
      '<kbd>T</kbd><span>Start / pause the 25-minute timer</span>' +
      '<kbd>Shift</kbd> + <kbd>T</kbd><span>Reset the timer</span>' +
      '<kbd>F</kbd><span>Fullscreen</span>' +
      '<kbd>E</kbd><span>Export mode — then print to PDF</span>' +
      '<kbd>Home</kbd> / <kbd>End</kbd><span>First / last slide</span>' +
      '<kbd>?</kbd><span>This help</span>' +
      '</div></div>';
    document.body.appendChild(elHelp);
    elHelp.addEventListener('click', function () { elHelp.classList.remove('open'); });

    var arrows = document.createElement('div');
    arrows.className = 'arrows';
    arrows.innerHTML =
      '<button type="button" data-go="-1" aria-label="Previous slide">‹</button>' +
      '<button type="button" data-go="1" aria-label="Next slide">›</button>' +
      '<button type="button" data-ov="1" aria-label="Slide overview">⊞</button>';
    document.body.appendChild(arrows);
    arrows.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.ov) toggleOverview();
      else go(idx + Number(b.dataset.go));
    });

    var idleTimer = null;
    function wake() {
      document.body.classList.add('pointer-live');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        document.body.classList.remove('pointer-live');
      }, 2400);
    }
    document.addEventListener('mousemove', wake, { passive: true });
    document.addEventListener('touchstart', wake, { passive: true });
    arrows.addEventListener('mouseenter', function () { clearTimeout(idleTimer); });
    arrows.addEventListener('mouseleave', wake);
  }

  function buildOverview() {
    elOverview = document.createElement('div');
    elOverview.className = 'overview';
    elOverview.innerHTML = '<h4>Overview — ' + slides.length + ' slides</h4><div class="ov-grid"></div>';
    document.body.appendChild(elOverview);
    elOvGrid = elOverview.querySelector('.ov-grid');

    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ov-item';
      b.innerHTML =
        '<div class="i">' + String(i + 1).padStart(2, '0') + '</div>' +
        '<div class="t">' + (s.dataset.title || 'Slide ' + (i + 1)) + '</div>' +
        '<div class="c">' + (s.dataset.chapter || '') + '</div>';
      b.addEventListener('click', function () { toggleOverview(false); go(i); });
      elOvGrid.appendChild(b);
    });
  }

  /* ---------------------------------------------------------- navigation */

  function go(n, skipHash) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === idx && slides[n].classList.contains('is-active')) return;
    lastIdx = idx;
    idx = n;

    slides.forEach(function (s) { s.classList.remove('is-active', 'is-back'); });
    var cur = slides[idx];
    cur.classList.add('is-active');
    if (idx < lastIdx) cur.classList.add('is-back');

    elProgress.style.transform = 'scaleX(' + ((idx + 1) / slides.length) + ')';
    elCount.textContent = String(idx + 1);
    elChapter.textContent = cur.dataset.chapter || '';

    renderNotes(cur);
    mountFigures(cur);
    markOverview();
    if (!skipHash) location.hash = String(idx + 1);
    updateTimerClass();
  }

  function fromHash(first) {
    var n = parseInt(String(location.hash).replace('#', ''), 10);
    go(isNaN(n) ? 0 : n - 1, true);
    if (first && !location.hash) location.hash = '1';
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;

    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
        e.preventDefault(); go(idx + 1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); go(idx - 1); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(slides.length - 1); break;
      case 'n': case 'N': elNotes.classList.toggle('open'); break;
      case 'o': case 'O': toggleOverview(); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case 'e': case 'E': enterExportMode(); break;
      case 't': e.shiftKey ? resetTimer() : toggleTimer(); break;
      case 'T': resetTimer(); break;
      case '?': elHelp.classList.toggle('open'); break;
      case 'Escape':
        elHelp.classList.remove('open');
        elOverview.classList.remove('open');
        elNotes.classList.remove('open');
        break;
    }
  }

  function toggleOverview(force) {
    var open = force === undefined ? !elOverview.classList.contains('open') : force;
    elOverview.classList.toggle('open', open);
    if (open) markOverview();
  }

  function markOverview() {
    if (!elOvGrid) return;
    Array.prototype.forEach.call(elOvGrid.children, function (c, i) {
      c.classList.toggle('current', i === idx);
    });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  /* -------------------------------------------------------------- notes */

  function renderNotes(slide) {
    var src = slide.querySelector('script[type="text/notes"]');
    elNotesBody.innerHTML = src
      ? src.textContent.trim()
      : '<p style="color:var(--faint)">No notes for this slide.</p>';

    var mark = Number(slide.dataset.mark || 0);
    var bits = [];
    bits.push('slide ' + (idx + 1) + ' / ' + slides.length);
    if (slide.dataset.chapter) bits.push(slide.dataset.chapter);
    if (mark) bits.push('planned arrival ' + fmt(mark));
    if (slide.dataset.cut === '1') bits.push('CUTTABLE if running late');
    elNotesMeta.textContent = bits.join('   ·   ');
  }

  /* -------------------------------------------------------------- timer */

  function toggleTimer() {
    timer.running = !timer.running;
    timer.last = Date.now();
    elTimer.classList.toggle('paused', !timer.running);
  }

  function resetTimer() {
    timer.running = false; timer.elapsed = 0; timer.last = 0;
    elTimer.classList.add('paused');
    paintTimer();
  }

  function tick() {
    var now = Date.now();
    if (timer.running && timer.last) timer.elapsed += (now - timer.last) / 1000;
    timer.last = now;
  }

  function loop() {
    tick();
    paintTimer();
    requestAnimationFrame(loop);
  }

  function paintTimer() {
    if (!elTimer) return;
    var txt = fmt(timer.elapsed);
    if (elTimer.textContent !== txt) elTimer.textContent = txt;
  }

  function updateTimerClass() {
    if (!elTimer) return;
    var mark = Number(slides[idx].dataset.mark || 0);
    elTimer.classList.remove('ahead', 'behind');
    if (!timer.running || !mark) return;
    if (timer.elapsed < mark - 20) elTimer.classList.add('ahead');
    else if (timer.elapsed > mark + 45) elTimer.classList.add('behind');
  }
  setInterval(updateTimerClass, 3000);

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  /* ------------------------------------------------------------ figures */

  function mountFigures(slide) {
    var hosts = slide.querySelectorAll('.fig-host[data-figure]');
    Array.prototype.forEach.call(hosts, function (host) {
      if (host.classList.contains('mounted')) {
        if (window.CopilotFigures && window.CopilotFigures.refresh) {
          window.CopilotFigures.refresh(host);
        }
        return;
      }
      var name = host.dataset.figure;
      var api = window.CopilotFigures;
      if (!api || typeof api.mount !== 'function') return;
      try {
        api.mount(name, host);
        host.classList.add('mounted');
      } catch (err) {
        host.innerHTML = '<div style="display:grid;place-items:center;height:100%;' +
          'font-family:var(--mono);font-size:12px;color:var(--miss)">figure "' + name +
          '" failed to mount</div>';
        host.classList.add('mounted');
        if (window.console) console.error(err);
      }
    });
  }

  /* -------------------------------------------------------- export mode */

  function enterExportMode() {
    if (document.body.classList.contains('export')) return;
    document.body.classList.add('export');
    document.documentElement.style.setProperty('--scale', '1');

    var frag = document.createDocumentFragment();
    slides.forEach(function (s) {
      mountFigures(s);
      var wrap = document.createElement('div');
      wrap.className = 'stage';
      wrap.appendChild(s);
      s.classList.add('is-active');
      frag.appendChild(wrap);
    });
    stage.remove();
    deck.appendChild(frag);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
