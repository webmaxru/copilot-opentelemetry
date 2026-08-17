(function () {
  'use strict';

  var CHANNEL_NAME = 'copilot-traced-v2';
  var STATE_KEY = 'copilot-traced-v2-state';
  var CONTROL_KEY = 'copilot-traced-v2-control';

  var data = window.COPILOT_TRACED_V2;
  var slides = data && data.slides ? data.slides : [];
  var talkSeconds = data && data.talkSeconds ? data.talkSeconds : 20 * 60;
  var idx = 0;
  var channel = null;
  var connected = false;
  var lastAudienceState = 0;
  var timer = { running: false, elapsed: 0, last: 0 };

  var el = {};

  function init() {
    if (!slides.length) {
      document.body.innerHTML = '<p class="fatal">Speaker notes could not be loaded.</p>';
      throw new Error('COPILOT_TRACED_V2 slide data is missing.');
    }

    bindElements();
    setupUrls();
    setupSync();
    setupEvents();

    var hashIndex = parseInt(String(location.hash).replace('#', ''), 10);
    idx = isNaN(hashIndex) ? 0 : clamp(hashIndex - 1);
    render();
    requestState();
    requestAnimationFrame(loop);

    setInterval(function () {
      requestState();
      if (connected && Date.now() - lastAudienceState > 6500) {
        connected = false;
        renderConnection('Waiting for audience window', '');
      }
    }, 2500);
  }

  function bindElements() {
    [
      'connection', 'slide-number', 'chapter', 'current-title', 'planned-time',
      'slide-duration', 'deck-progress', 'timer', 'remaining', 'pace', 'timer-toggle',
      'timer-reset', 'notes', 'cue', 'checked-on', 'next-number', 'next-title',
      'sources', 'previous', 'next', 'open-audience', 'copy-audience',
      'audience-url', 'presenter-url'
    ].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  function setupUrls() {
    var audienceUrl = new URL('index.html', location.href);
    audienceUrl.search = '';
    audienceUrl.hash = '';
    var presenterUrl = new URL('presenter.html', location.href);
    presenterUrl.search = '';
    presenterUrl.hash = '';

    el['audience-url'].href = audienceUrl.href;
    el['audience-url'].textContent = audienceUrl.href;
    el['presenter-url'].href = presenterUrl.href;
    el['presenter-url'].textContent = presenterUrl.href;
  }

  function setupSync() {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', function (event) {
        handleState(event.data);
      });
    }

    window.addEventListener('storage', function (event) {
      if (event.key !== STATE_KEY || !event.newValue) return;
      try {
        handleState(JSON.parse(event.newValue));
      } catch (error) {
        renderConnection('Audience state was unreadable', 'error');
        console.error(error);
      }
    });
  }

  function setupEvents() {
    el.previous.addEventListener('click', function () { navigate(idx - 1); });
    el.next.addEventListener('click', function () { navigate(idx + 1); });
    el['open-audience'].addEventListener('click', openAudience);
    el['copy-audience'].addEventListener('click', copyAudienceUrl);
    el['timer-toggle'].addEventListener('click', toggleTimer);
    el['timer-reset'].addEventListener('click', resetTimer);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', function () {
      var parsed = parseInt(String(location.hash).replace('#', ''), 10);
      if (!isNaN(parsed) && clamp(parsed - 1) !== idx) navigate(parsed - 1);
    });
  }

  function handleState(message) {
    if (!message || message.type !== 'deck-state') return;
    connected = true;
    lastAudienceState = Date.now();
    renderConnection('Audience linked - slide ' + (Number(message.index) + 1), 'connected');

    var nextIndex = clamp(Number(message.index));
    if (nextIndex !== idx) {
      idx = nextIndex;
      location.hash = String(idx + 1);
      render();
    }
  }

  function sendControl(action, index) {
    var message = {
      type: 'deck-control',
      action: action,
      index: index,
      nonce: Date.now()
    };
    if (channel) channel.postMessage(message);
    try {
      localStorage.setItem(CONTROL_KEY, JSON.stringify(message));
    } catch (error) {
      renderConnection('Browser storage blocked; using live channel only', channel ? '' : 'error');
      console.warn(error);
    }
  }

  function requestState() {
    sendControl('request-state');
  }

  function navigate(nextIndex) {
    idx = clamp(nextIndex);
    location.hash = String(idx + 1);
    render();
    sendControl('go', idx);
  }

  function clamp(index) {
    return Math.max(0, Math.min(slides.length - 1, Number(index) || 0));
  }

  function render() {
    var slide = slides[idx];
    var nextSlide = slides[idx + 1];

    el['slide-number'].textContent = String(idx + 1).padStart(2, '0') + ' / ' + slides.length;
    el.chapter.textContent = slide.chapter || '';
    el['current-title'].textContent = slide.title;
    el['planned-time'].textContent = formatTime(slide.mark);
    el['slide-duration'].textContent = formatTime(slide.duration);
    el['deck-progress'].style.transform = 'scaleX(' + ((idx + 1) / slides.length) + ')';
    el['checked-on'].textContent = 'checked ' + String(data.checkedOn || '').replace(/-/g, ' ');

    el.notes.innerHTML = slide.notes.map(function (note) {
      return '<p>' + note + '</p>';
    }).join('');
    el.cue.innerHTML = '<strong>Cue:</strong> ' + slide.cue;

    if (nextSlide) {
      el['next-number'].textContent = String(idx + 2).padStart(2, '0');
      el['next-title'].textContent = nextSlide.title;
    } else {
      el['next-number'].textContent = '--';
      el['next-title'].textContent = 'Q&A';
    }

    if (slide.sources && slide.sources.length) {
      el.sources.innerHTML = slide.sources.map(function (source) {
        return '<a href="' + source.url + '" target="_blank" rel="noreferrer">' + source.label + '</a>';
      }).join('');
    } else {
      el.sources.innerHTML = '<span class="none">No source needed for this slide.</span>';
    }

    el.previous.disabled = idx === 0;
    el.next.disabled = idx === slides.length - 1;
    paintTimer();
  }

  function renderConnection(text, state) {
    el.connection.className = 'connection' + (state ? ' ' + state : '');
    el.connection.querySelector('span').textContent = text;
  }

  function openAudience() {
    var url = new URL('index.html', location.href);
    url.search = '?audience=1';
    url.hash = String(idx + 1);
    var audience = window.open(url.href, 'copilot-v2-audience', 'popup,width=1280,height=720');
    if (!audience) {
      renderConnection('Popup blocked - allow popups, then try again', 'error');
      return;
    }
    renderConnection('Audience window opened; linking...', '');
    setTimeout(function () {
      sendControl('go', idx);
      requestState();
    }, 700);
  }

  function copyAudienceUrl() {
    var url = new URL('index.html', location.href);
    url.search = '';
    url.hash = '';

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      renderConnection('Clipboard API unavailable - use the URL at the bottom', 'error');
      return;
    }

    navigator.clipboard.writeText(url.href).then(function () {
      renderConnection('Audience URL copied', connected ? 'connected' : '');
    }, function (error) {
      renderConnection('Could not copy URL - use the URL at the bottom', 'error');
      console.error(error);
    });
  }

  function toggleTimer() {
    timer.running = !timer.running;
    timer.last = Date.now();
    el['timer-toggle'].textContent = timer.running ? 'Pause timer' : 'Start timer';
    paintTimer();
  }

  function resetTimer() {
    timer.running = false;
    timer.elapsed = 0;
    timer.last = 0;
    el['timer-toggle'].textContent = 'Start timer';
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
    if (!el.timer) return;
    var elapsed = Math.max(0, timer.elapsed);
    var remaining = talkSeconds - elapsed;
    el.timer.textContent = formatTime(elapsed);
    el.remaining.textContent = remaining >= 0
      ? formatTime(remaining) + ' remaining'
      : formatTime(Math.abs(remaining)) + ' overtime';

    var mark = slides[idx].mark;
    var paceText = timer.running ? 'on pace' : 'ready';
    var paceClass = timer.running ? 'on-time' : '';
    if (timer.running && elapsed < mark - 20) {
      paceText = 'ahead';
      paceClass = 'ahead';
    } else if (timer.running && elapsed > mark + 45) {
      paceText = 'behind';
      paceClass = 'behind';
    }
    el.pace.textContent = paceText;
    el.pace.className = 'pace' + (paceClass ? ' ' + paceClass : '');
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(Number(seconds) || 0));
    var minutes = Math.floor(seconds / 60);
    var remainder = seconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
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
        navigate(idx + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault();
        navigate(idx - 1);
        break;
      case 'Home':
        event.preventDefault();
        navigate(0);
        break;
      case 'End':
        event.preventDefault();
        navigate(slides.length - 1);
        break;
      case 't':
        if (event.shiftKey) resetTimer();
        else toggleTimer();
        break;
      case 'T':
        resetTimer();
        break;
      case 'f':
      case 'F':
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        break;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
