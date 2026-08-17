/* Copilot, Traced v2 - audience deck. Speaker notes are intentionally not loaded here. */
(function () {
  'use strict';

  var CHANNEL_NAME = 'copilot-traced-v2';
  var STATE_KEY = 'copilot-traced-v2-state';
  var CONTROL_KEY = 'copilot-traced-v2-control';

  var deck, stage, slides = [], idx = 0, lastIdx = 0;
  var elProgress, elCount, elChapter, elOverview, elOvGrid, elHelp;
  var channel = null;

  function init() {
    deck = document.querySelector('.deck');
    stage = document.querySelector('.stage');
    slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
    if (!stage || !slides.length) return;

    setupSync();
    buildChrome();
    buildOverview();

    window.addEventListener('resize', fit);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', fromHash);

    fit();
    fromHash(true);

    if (/[?&]export=1/.test(location.search)) enterExportMode();
  }

  function setupSync() {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', function (event) {
        handleControl(event.data);
      });
    }

    window.addEventListener('storage', function (event) {
      if (event.key !== CONTROL_KEY || !event.newValue) return;
      try {
        handleControl(JSON.parse(event.newValue));
      } catch (error) {
        console.error('Could not read presenter control message.', error);
      }
    });
  }

  function handleControl(message) {
    if (!message || message.type !== 'deck-control') return;

    if (message.action === 'request-state') {
      broadcastState();
      return;
    }

    if (message.action === 'go') go(Number(message.index));
    if (message.action === 'next') go(idx + 1);
    if (message.action === 'previous') go(idx - 1);
    if (message.action === 'first') go(0);
    if (message.action === 'last') go(slides.length - 1);
  }

  function broadcastState() {
    if (!slides.length) return;
    var slide = slides[idx];
    var state = {
      type: 'deck-state',
      index: idx,
      total: slides.length,
      title: slide.dataset.title || 'Slide ' + (idx + 1),
      chapter: slide.dataset.chapter || '',
      mark: Number(slide.dataset.mark || 0),
      nonce: Date.now()
    };

    if (channel) channel.postMessage(state);
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Deck state could not be stored.', error);
    }
  }

  function fit() {
    if (document.body.classList.contains('export')) {
      document.documentElement.style.setProperty('--scale', '1');
      return;
    }
    var scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    document.documentElement.style.setProperty('--scale', String(scale));
  }

  function buildChrome() {
    var hud = document.createElement('div');
    hud.className = 'hud';
    hud.innerHTML =
      '<span class="brand"><i class="sq"></i>copilot, traced</span>' +
      '<span class="chapter"></span>' +
      '<span class="spacer"></span>' +
      '<span class="duration">20 min</span>' +
      '<span class="count"><b>1</b> / ' + slides.length + '</span>';
    stage.appendChild(hud);

    var progress = document.createElement('div');
    progress.className = 'progress';
    progress.innerHTML = '<i></i>';
    stage.appendChild(progress);

    elProgress = progress.firstChild;
    elCount = hud.querySelector('.count b');
    elChapter = hud.querySelector('.chapter');

    elHelp = document.createElement('div');
    elHelp.className = 'help';
    elHelp.innerHTML =
      '<div class="help-card"><h4>Audience deck controls</h4><div class="keys">' +
      '<kbd>&rarr;</kbd><span>Next slide (also Space, Down, PgDn)</span>' +
      '<kbd>&larr;</kbd><span>Previous slide</span>' +
      '<kbd>O</kbd><span>Slide overview</span>' +
      '<kbd>P</kbd><span>Open presenter notes in a separate window</span>' +
      '<kbd>F</kbd><span>Fullscreen</span>' +
      '<kbd>E</kbd><span>Export mode, then print to PDF</span>' +
      '<kbd>Home / End</kbd><span>First / last slide</span>' +
      '<kbd>?</kbd><span>This help</span>' +
      '</div><p class="help-safe">This audience page never loads speaker notes.</p></div>';
    document.body.appendChild(elHelp);
    elHelp.addEventListener('click', function () {
      elHelp.classList.remove('open');
    });

    var arrows = document.createElement('div');
    arrows.className = 'arrows';
    arrows.innerHTML =
      '<button type="button" data-go="-1" aria-label="Previous slide">&lsaquo;</button>' +
      '<button type="button" data-go="1" aria-label="Next slide">&rsaquo;</button>' +
      '<button type="button" data-overview="1" aria-label="Slide overview">&#8862;</button>';
    document.body.appendChild(arrows);
    arrows.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.overview) toggleOverview();
      else go(idx + Number(button.dataset.go));
    });

    var idleTimer = null;
    function wakePointer() {
      document.body.classList.add('pointer-live');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        document.body.classList.remove('pointer-live');
      }, 2400);
    }
    document.addEventListener('mousemove', wakePointer, { passive: true });
    document.addEventListener('touchstart', wakePointer, { passive: true });
  }

  function buildOverview() {
    elOverview = document.createElement('div');
    elOverview.className = 'overview';
    elOverview.innerHTML = '<h4>Overview - ' + slides.length + ' slides</h4><div class="ov-grid"></div>';
    document.body.appendChild(elOverview);
    elOvGrid = elOverview.querySelector('.ov-grid');

    slides.forEach(function (slide, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ov-item';
      button.innerHTML =
        '<div class="i">' + String(index + 1).padStart(2, '0') + '</div>' +
        '<div class="t">' + (slide.dataset.title || 'Slide ' + (index + 1)) + '</div>' +
        '<div class="c">' + (slide.dataset.chapter || '') + '</div>';
      button.addEventListener('click', function () {
        toggleOverview(false);
        go(index);
      });
      elOvGrid.appendChild(button);
    });
  }

  function go(next, skipHash) {
    next = Math.max(0, Math.min(slides.length - 1, Number(next)));
    if (!Number.isFinite(next)) return;
    if (next === idx && slides[next].classList.contains('is-active')) {
      broadcastState();
      return;
    }

    lastIdx = idx;
    idx = next;
    slides.forEach(function (slide) {
      slide.classList.remove('is-active', 'is-back');
    });

    var current = slides[idx];
    current.classList.add('is-active');
    if (idx < lastIdx) current.classList.add('is-back');

    elProgress.style.transform = 'scaleX(' + ((idx + 1) / slides.length) + ')';
    elCount.textContent = String(idx + 1);
    elChapter.textContent = current.dataset.chapter || '';

    mountFigures(current);
    markOverview();
    if (!skipHash) location.hash = String(idx + 1);
    broadcastState();
  }

  function fromHash(first) {
    var parsed = parseInt(String(location.hash).replace('#', ''), 10);
    go(isNaN(parsed) ? 0 : parsed - 1, true);
    if (first && !location.hash) location.hash = '1';
  }

  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    if (target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName)) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        event.preventDefault();
        go(idx + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault();
        go(idx - 1);
        break;
      case 'Home':
        event.preventDefault();
        go(0);
        break;
      case 'End':
        event.preventDefault();
        go(slides.length - 1);
        break;
      case 'o':
      case 'O':
        toggleOverview();
        break;
      case 'p':
      case 'P':
        openPresenter();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'e':
      case 'E':
        enterExportMode();
        break;
      case '?':
        elHelp.classList.toggle('open');
        break;
      case 'Escape':
        elHelp.classList.remove('open');
        elOverview.classList.remove('open');
        break;
    }
  }

  function toggleOverview(force) {
    var open = force === undefined ? !elOverview.classList.contains('open') : force;
    elOverview.classList.toggle('open', open);
    if (open) markOverview();
  }

  function markOverview() {
    Array.prototype.forEach.call(elOvGrid.children, function (item, index) {
      item.classList.toggle('current', index === idx);
    });
  }

  function openPresenter() {
    var url = new URL('presenter.html', location.href);
    url.search = '';
    url.hash = String(idx + 1);
    window.open(url.href, 'copilot-v2-presenter', 'popup,width=1320,height=900');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  function mountFigures(slide) {
    var hosts = slide.querySelectorAll('.fig-host[data-figure]');
    Array.prototype.forEach.call(hosts, function (host) {
      if (host.classList.contains('mounted')) {
        if (window.CopilotFigures && window.CopilotFigures.refresh) {
          window.CopilotFigures.refresh(host);
        }
        return;
      }

      var api = window.CopilotFigures;
      if (!api || typeof api.mount !== 'function') return;
      try {
        api.mount(host.dataset.figure, host);
        host.classList.add('mounted');
      } catch (error) {
        host.innerHTML = '<div class="figure-error">Figure failed to mount.</div>';
        host.classList.add('mounted');
        console.error(error);
      }
    });
  }

  function enterExportMode() {
    if (document.body.classList.contains('export')) return;
    document.body.classList.add('export');
    document.documentElement.style.setProperty('--scale', '1');

    var fragment = document.createDocumentFragment();
    slides.forEach(function (slide) {
      mountFigures(slide);
      var wrapper = document.createElement('div');
      wrapper.className = 'stage';
      wrapper.appendChild(slide);
      slide.classList.add('is-active');
      fragment.appendChild(wrapper);
    });
    stage.remove();
    deck.appendChild(fragment);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
