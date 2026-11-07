/* Original NEON//NULL score. One clock, bounded voices, no external audio assets. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeonImmersionAudio = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));
  const THEMES = Object.freeze({
    relay: { roots: [38, 34, 41, 36], melody: [0, 7, 10, 14, 12, 7, 5, 10, 0, 7, 15, 14, 10, 5, 7, 2], wave: 'triangle' },
    archive: { roots: [45, 41, 38, 43], melody: [0, 12, 7, 3, 10, 7, 14, 12, 0, 3, 15, 14, 7, 5, 3, 10], wave: 'sine' },
    grid: { roots: [36, 39, 34, 41], melody: [0, 0, 7, 10, 12, 7, 0, 3, 10, 12, 15, 7, 14, 10, 7, 3], wave: 'triangle' },
    spectrum: { roots: [42, 38, 45, 40], melody: [0, 12, 14, 17, 19, 12, 9, 14, 0, 7, 19, 21, 19, 14, 9, 7], wave: 'sine', lift: 14, texture: 'glass' },
    blackpowder: { roots: [38, 36, 34, 33], melody: [0, 0, 7, 3, 5, 3, 2, 0, 0, 7, 10, 7, 5, 3, 2, 0], wave: 'triangle', lift: 10, texture: 'march' },
    frontier: { roots: [40, 43, 38, 45], melody: [0, 7, 12, 10, 7, 5, 3, 0, 3, 7, 15, 12, 10, 7, 3, 2], wave: 'triangle', lift: 16, texture: 'strings' },
    brassworks: { roots: [36, 36, 39, 34], melody: [0, 0, 6, 7, 10, 3, 6, 7, 0, 3, 6, 10, 12, 7, 6, 2], wave: 'sine', lift: 13, texture: 'ratchet' }
  });
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  function create(options) {
    const ac = options.context, destination = options.destination;
    if (!ac || !destination) throw new TypeError('An audio context and destination are required.');
    const getState = options.getState || (() => ({}));
    const getTheme = options.getTheme || (() => ({}));
    const schedule = options.setInterval || setInterval;
    const unschedule = options.clearInterval || clearInterval;
    const voices = new Set(), layers = {};
    const beat = 60 / 104 / 2;
    let timer = null, destroyed = false, nextAt = 0, step = 0, wasSuspended = false;
    let currentMode = 'explore', candidate = 'explore', candidateAt = 0, operation = 'relay';
    let transpose = 0, rotation = 0, melodyWave = 'triangle', lastNow = 0, scheduledNotes = 0;
    let victoryPlayed = false, lastStatus = '', lastFault = '';
    const levels = {
      menu: { atmosphere: .42, harmony: .38, melody: .35, bass: .15, rhythm: 0, boss: 0 },
      explore: { atmosphere: .65, harmony: .56, melody: .44, bass: .24, rhythm: .08, boss: 0 },
      combat: { atmosphere: .4, harmony: .7, melody: .68, bass: .7, rhythm: .65, boss: 0 },
      pressure: { atmosphere: .32, harmony: .75, melody: .8, bass: .9, rhythm: .88, boss: .12 },
      boss: { atmosphere: .35, harmony: .85, melody: .48, bass: .9, rhythm: .85, boss: .9 }
    };
    const mix = ac.createGain(); mix.gain.value = 1; mix.connect(destination);
    for (const key of ['atmosphere', 'harmony', 'melody', 'bass', 'rhythm', 'boss']) {
      layers[key] = ac.createGain(); layers[key].gain.value = 0; layers[key].connect(mix);
    }
    let noise = options.noiseBuffer;
    if (!noise && typeof ac.createBuffer === 'function') {
      noise = ac.createBuffer(1, Math.ceil(ac.sampleRate * .23), ac.sampleRate);
      const data = noise.getChannelData(0);
      // Fixed noise avoids random allocations in the scheduler and is repeatable in tests.
      let seed = 11337;
      for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
    }
    function gainAt(param, value, time, speed) {
      param.cancelScheduledValues(time);
      param.setTargetAtTime(Math.max(0, value), time, speed || .28);
    }
    function retire(voice) {
      if (!voices.delete(voice)) return;
      for (const node of voice.nodes) { try { node.disconnect(); } catch (_) {} }
    }
    function register(source, nodes, at, duration) {
      if (voices.size >= 48) { for (const n of nodes) try { n.disconnect(); } catch (_) {} return false; }
      const voice = { source, nodes };
      voices.add(voice); source.onended = () => retire(voice);
      source.start(at); source.stop(at + duration + .025); scheduledNotes++;
      return true;
    }
    function tone(layer, note, at, duration, wave, amplitude, sweep) {
      if (voices.size >= 48) return;
      const source = ac.createOscillator(), amp = ac.createGain();
      source.type = wave || 'sine';
      const hz = midi(note);
      source.frequency.setValueAtTime(hz, at);
      if (sweep) source.frequency.exponentialRampToValueAtTime(Math.max(22, hz + sweep), at + duration);
      amp.gain.setValueAtTime(.0001, at);
      amp.gain.linearRampToValueAtTime(amplitude, at + Math.min(.025, duration * .15));
      amp.gain.exponentialRampToValueAtTime(.0001, at + duration);
      source.connect(amp); amp.connect(layers[layer]);
      register(source, [source, amp], at, duration);
    }
    function hiss(at, duration, amplitude, highpass) {
      if (!noise || voices.size >= 48) return;
      const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), amp = ac.createGain();
      src.buffer = noise; filter.type = 'highpass'; filter.frequency.setValueAtTime(highpass, at);
      amp.gain.setValueAtTime(.0001, at); amp.gain.linearRampToValueAtTime(amplitude, at + .004);
      amp.gain.exponentialRampToValueAtTime(.0001, at + duration);
      src.connect(filter); filter.connect(amp); amp.connect(layers.rhythm);
      register(src, [src, filter, amp], at, duration);
    }
    function modeFor(s) {
      if (!s.active) return 'menu';
      if (s.boss) return 'boss';
      if ((s.enemies || 0) >= 14 || s.pressure > .7) return 'pressure';
      return (s.enemies || 0) > 0 ? 'combat' : 'explore';
    }
    function updateMix(s, now) {
      const mode = modeFor(s);
      if (candidate !== mode) { candidate = mode; candidateAt = now; }
      // Enter boss promptly; ordinary encounter changes need stability and a phrase boundary.
      if (mode === 'boss' || now - candidateAt >= 1.5 && step % 8 === 0) currentMode = mode;
      const values = levels[currentMode];
      const pausedScale = s.paused ? .18 : 1;
      for (const key of Object.keys(layers)) {
        let level = values[key];
        if (s.powered && key === 'harmony') level = Math.min(1, level + .16);
        gainAt(layers[key].gain, level * pausedScale, now, .38);
      }
      gainAt(mix.gain, s.warning ? .55 : 1, now, s.warning ? .055 : .28);
    }
    function phrase(at, index, s) {
      const theme = THEMES[operation] || THEMES.relay;
      const pos = index % 16, bar = Math.floor(index / 16) % 4;
      const root = theme.roots[bar] + transpose;
      const melodic = (pos + rotation) % 16;
      if (pos % 8 === 0) {
        tone('atmosphere', root + 12, at, beat * 7.5, 'sine', .032);
        tone('harmony', root + 19, at, beat * 6, 'sine', .026);
        tone('harmony', root + (theme.lift || 22), at, beat * 6, 'triangle', .012);
      }
      if (pos % 2 === 0 || currentMode === 'boss' && pos % 4 === 3) {
        tone('melody', root + 24 + theme.melody[melodic], at, beat * .72, melodyWave, .057);
      }
      if (pos % 2 === 0) tone('bass', root + (pos === 6 || pos === 14 ? 7 : 0), at, beat * .78, 'triangle', .077);
      if (pos % 4 === 0) tone('rhythm', 43, at, .14, 'sine', .11, -78);
      if (pos % 8 === 4) hiss(at, .105, .04, 1300);
      if (pos % 2 === 0) hiss(at, .035, .013, 5600);
      if (currentMode !== 'explore' && currentMode !== 'menu') {
        if (theme.texture === 'glass' && pos % 8 === 6) tone('rhythm', 79, at, .071, 'sine', .037, -174);
        if (theme.texture === 'march' && pos % 4 === 2) hiss(at, .105, .036, 750);
        if (theme.texture === 'strings' && pos % 4 === 3) tone('harmony', root + 19, at, .1, 'triangle', .042, -38);
        if (theme.texture === 'ratchet' && pos % 4 === 1) tone('rhythm', 57, at, .06, 'triangle', .054, -85);
      }
      if (currentMode === 'boss' && pos % 2 === 1) {
        const motif = [0, 3, 7, 10, 12, 10, 7, 2][Math.floor(pos / 2)];
        tone('boss', root + 24 + motif, at, beat * .64, 'triangle', .062);
      }
      if (!victoryPlayed && (s.status === 'victory' || s.status === 'extraction' || s.status === 'results')) {
        victoryPlayed = true;
        for (let i = 0; i < 4; i++) tone('harmony', root + 24 + [0, 7, 10, 14][i], at + i * beat, beat * 1.6, 'sine', .07);
      }
    }
    function tick() {
      if (destroyed) return;
      try {
        const now = ac.currentTime;
        if (ac.state && ac.state !== 'running') { wasSuspended = true; return; }
        const s = getState() || {}, cosmetic = getTheme() || {};
        if (wasSuspended || now - lastNow > .5 || nextAt < now - .18) nextAt = now + .035;
        wasSuspended = false; lastNow = now;
        const nextOperation = Object.hasOwn(THEMES, s.operation) ? s.operation : 'relay';
        // Operation and cosmetic changes retain the shared beat and use the next phrase.
        if (step % 8 === 0) {
          operation = nextOperation;
          transpose = clamp(cosmetic.transpose, -7, 7);
          rotation = Math.floor(clamp(cosmetic.rotation, 0, 15));
          melodyWave = THEMES[operation].texture ? THEMES[operation].wave : ['sine', 'triangle'].includes(cosmetic.wave) ? cosmetic.wave : THEMES[operation].wave;
        }
        if (s.status !== lastStatus) {
          if (s.status !== 'victory' && s.status !== 'results' && s.status !== 'extraction') victoryPlayed = false;
          lastStatus = s.status || '';
        }
        updateMix(s, now);
        if (s.paused) { nextAt = now + .035; return; }
        let count = 0;
        while (nextAt < now + .12 && count++ < 3) {
          phrase(nextAt, step, s); nextAt += beat; step = (step + 1) % 64;
        }
      } catch (error) { lastFault = String(error && error.message || error); }
    }
    function start() {
      if (destroyed || timer !== null) return;
      nextAt = ac.currentTime + .06; lastNow = ac.currentTime;
      tick(); timer = schedule(tick, 25);
    }
    function stop() {
      if (timer !== null) { unschedule(timer); timer = null; }
      for (const voice of Array.from(voices)) {
        try { voice.source.stop(); } catch (_) {}
        retire(voice);
      }
      for (const key of Object.keys(layers)) gainAt(layers[key].gain, 0, ac.currentTime, .02);
    }
    function destroy() {
      if (destroyed) return;
      stop(); destroyed = true;
      for (const key of Object.keys(layers)) layers[key].disconnect();
      mix.disconnect();
    }
    return Object.freeze({ start, stop, destroy, tick,
      stats: () => ({ running: timer !== null, voices: voices.size, maxVoices: 48,
        mode: currentMode, operation, step, nextAt, scheduledNotes, lastFault }) });
  }
  return Object.freeze({ create, themes: THEMES });
});
