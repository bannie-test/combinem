/*
 * Audio: every sound is synthesized with WebAudio (no asset files).
 * Merge notes climb a major scale while a combo lasts, so a fast chain plays a melody.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const C5 = 523.25;
  const noteFreq = (degree, base) => {
    const oct = Math.floor(degree / 7);
    const semi = 12 * oct + MAJOR[((degree % 7) + 7) % 7];
    return (base || C5) * Math.pow(2, semi / 12);
  };
  const semis = (base, n) => base * Math.pow(2, n / 12);

  const A = NOA.audio = {
    ctx: null,
    master: null,
    sfxBus: null,
    musicBus: null,
    noiseBuf: null,
    musicTimer: null,
    musicStep: 0,

    settings() { return (NOA.state && NOA.state.settings) || { sfx: true, music: true, haptics: true }; },

    /** Must be called from a user gesture (browsers block audio before one). */
    unlock() {
      if (!globalThis.AudioContext && !globalThis.webkitAudioContext) return;
      if (!A.ctx) {
        const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
        A.ctx = new Ctx();
        A.master = A.ctx.createGain();
        A.master.gain.value = 0.9;
        const comp = A.ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 4;
        A.master.connect(comp); comp.connect(A.ctx.destination);
        A.sfxBus = A.ctx.createGain(); A.sfxBus.gain.value = 0.8; A.sfxBus.connect(A.master);
        A.musicBus = A.ctx.createGain(); A.musicBus.gain.value = 0.0; A.musicBus.connect(A.master);
        // shared echo for the music
        A.delay = A.ctx.createDelay(1); A.delay.delayTime.value = 0.34;
        A.fb = A.ctx.createGain(); A.fb.gain.value = 0.32;
        A.dlp = A.ctx.createBiquadFilter(); A.dlp.type = 'lowpass'; A.dlp.frequency.value = 2200;
        A.delay.connect(A.dlp); A.dlp.connect(A.fb); A.fb.connect(A.delay); A.dlp.connect(A.musicBus);
        const len = A.ctx.sampleRate * 1;
        A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
        const data = A.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (A.ctx.state === 'suspended') A.ctx.resume();
      A.applySettings();
    },

    applySettings() {
      if (!A.ctx) return;
      const s = A.settings();
      A.sfxBus.gain.setTargetAtTime(s.sfx ? 0.8 : 0, A.ctx.currentTime, 0.05);
      const musicOn = s.music && NOA.FEATURES.music;
      A.musicBus.gain.setTargetAtTime(musicOn ? 0.55 : 0, A.ctx.currentTime, 0.4);
      if (musicOn && !A.musicTimer) A.startMusic();
      if (!musicOn && A.musicTimer) A.stopMusic();
    },

    vibrate(pattern) {
      if (!A.settings().haptics) return;
      try { if (globalThis.navigator && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
    },

    /* ------------------------------------------------------------ primitives */
    tone(o) {
      if (!A.ctx || !A.settings().sfx) return;
      const t = A.ctx.currentTime + (o.when || 0);
      const osc = A.ctx.createOscillator();
      const g = A.ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.f, t);
      if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + (o.slideTime || o.dur || 0.2));
      if (o.detune) osc.detune.value = o.detune;
      const peak = o.gain != null ? o.gain : 0.2;
      const atk = o.attack || 0.005;
      const dur = o.dur || 0.25;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dur);
      osc.connect(g);
      g.connect(o.bus || A.sfxBus);
      osc.start(t);
      osc.stop(t + atk + dur + 0.05);
    },
    noise(o) {
      if (!A.ctx || !A.settings().sfx) return;
      const t = A.ctx.currentTime + (o.when || 0);
      const src = A.ctx.createBufferSource();
      src.buffer = A.noiseBuf;
      const f = A.ctx.createBiquadFilter();
      f.type = o.filter || 'bandpass';
      f.frequency.setValueAtTime(o.freq || 1200, t);
      if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, t + (o.dur || 0.3));
      f.Q.value = o.q || 1;
      const g = A.ctx.createGain();
      const dur = o.dur || 0.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.gain || 0.15, t + (o.attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(A.sfxBus);
      src.start(t);
      src.stop(t + dur + 0.05);
    },
    bell(f, when, gain) {
      A.tone({ f, type: 'sine', dur: 0.9, gain: gain || 0.12, when });
      A.tone({ f: f * 2.76, type: 'sine', dur: 0.35, gain: (gain || 0.12) * 0.35, when });
      A.tone({ f: f * 5.4, type: 'sine', dur: 0.15, gain: (gain || 0.12) * 0.15, when });
    },
    shimmer(when, n) {
      for (let i = 0; i < (n || 7); i++) {
        A.tone({ f: 1400 + Math.random() * 2200, type: 'sine', dur: 0.18, gain: 0.04, when: (when || 0) + i * 0.07 });
      }
    },
    chord(freqs, when, dur, gain, type) {
      for (const f of freqs) A.tone({ f, type: type || 'triangle', dur: dur || 1, gain: gain || 0.06, attack: 0.03, when });
    },

    /* ------------------------------------------------------------ game sounds */
    play(name, a, b) {
      if (!A.ctx) return;
      const fn = A.sfx[name];
      if (fn) { try { fn(a, b); } catch (e) { console.warn(e); } }
    },
    sfx: {
      tap() { A.tone({ f: 880, type: 'sine', dur: 0.05, gain: 0.06 }); },
      pick() { A.tone({ f: 620, slideTo: 760, type: 'sine', dur: 0.08, gain: 0.08 }); },
      drop() { A.tone({ f: 420, slideTo: 300, type: 'sine', dur: 0.08, gain: 0.07 }); },
      invalid() {
        A.tone({ f: 180, type: 'square', dur: 0.09, gain: 0.05 });
        A.tone({ f: 150, type: 'square', dur: 0.12, gain: 0.05, when: 0.09 });
      },
      spawn() {
        A.tone({ f: 700, slideTo: 1100, type: 'sine', dur: 0.09, gain: 0.12 });
        A.noise({ freq: 3000, dur: 0.05, gain: 0.04, filter: 'highpass' });
      },
      /** level: item level, combo: 1.. (pitch climbs the major scale) */
      merge(level, combo) {
        const f = noteFreq(Math.max(0, (combo || 1) - 1));
        A.noise({ freq: 2400, dur: 0.04, gain: 0.05, filter: 'highpass' });
        A.tone({ f, type: 'triangle', dur: 0.38, gain: 0.2 });
        A.tone({ f: f * 2, type: 'sine', dur: 0.26, gain: 0.07 });
        A.tone({ f: f * 3, type: 'sine', dur: 0.14, gain: 0.03 });
        if ((level || 1) >= 3) A.tone({ f: f * 4, type: 'sine', dur: 0.2, gain: 0.035, when: 0.06 });
        if ((level || 1) >= 5) A.shimmer(0.05, 5);
      },
      breakthrough() {
        A.tone({ f: 523, slideTo: 1568, slideTime: 0.25, type: 'sawtooth', dur: 0.3, gain: 0.05 });
        A.chord([1046, 1318, 1568], 0.18, 0.7, 0.05);
      },
      gene() {
        A.noise({ freq: 400, sweepTo: 5000, dur: 0.7, gain: 0.07, q: 2 });
        A.shimmer(0.1, 10);
        A.chord([523.25, 659.25, 783.99, 987.77, 1174.66], 0.25, 1.6, 0.045);
        A.bell(2093, 0.6, 0.06);
      },
      purity() {
        A.bell(1318.5, 0, 0.09); A.bell(1760, 0.1, 0.08);
      },
      geneLost() {
        A.tone({ f: 660, slideTo: 330, slideTime: 0.4, type: 'sine', dur: 0.45, gain: 0.08 });
      },
      harvest() {
        A.noise({ freq: 900, dur: 0.12, gain: 0.08 });
        A.tone({ f: 523, type: 'triangle', dur: 0.12, gain: 0.1 });
        A.tone({ f: 784, type: 'triangle', dur: 0.16, gain: 0.1, when: 0.08 });
      },
      plant() {
        A.noise({ freq: 500, dur: 0.1, gain: 0.08, filter: 'lowpass' });
        A.tone({ f: 330, slideTo: 440, type: 'sine', dur: 0.1, gain: 0.08, when: 0.05 });
      },
      coin() {
        A.tone({ f: 1975, type: 'square', dur: 0.05, gain: 0.025 });
        A.tone({ f: 2637, type: 'square', dur: 0.12, gain: 0.025, when: 0.05 });
      },
      gem() { A.bell(2349, 0, 0.05); A.bell(3136, 0.06, 0.04); },
      sell() { A.sfx.coin(); A.tone({ f: 392, type: 'triangle', dur: 0.12, gain: 0.06 }); },
      order() {
        [523, 659, 784, 1046].forEach((f, i) => A.tone({ f, type: 'triangle', dur: 0.2, gain: 0.09, when: i * 0.07 }));
      },
      levelUp() {
        [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => A.tone({ f, type: 'triangle', dur: 0.3, gain: 0.1, when: i * 0.08 }));
        A.chord([261.63, 392, 523.25], 0.5, 1.4, 0.05);
        A.shimmer(0.5, 8);
      },
      unlock() { A.bell(1046, 0, 0.08); A.bell(1568, 0.12, 0.08); },
      secret() {
        A.tone({ f: 392, type: 'sine', dur: 0.5, gain: 0.08 });
        A.tone({ f: 466.16, type: 'sine', dur: 0.5, gain: 0.08, when: 0.18 });
        A.tone({ f: 587.33, type: 'sine', dur: 0.8, gain: 0.08, when: 0.36 });
        A.shimmer(0.4, 10);
      },
      star() { A.tone({ f: 2600, slideTo: 1200, slideTime: 0.4, type: 'sine', dur: 0.45, gain: 0.05 }); A.shimmer(0.05, 4); },
      swoosh() { A.noise({ freq: 600, sweepTo: 3000, dur: 0.25, gain: 0.07, q: 1.5 }); },
      open() { A.tone({ f: 300, slideTo: 600, type: 'sine', dur: 0.12, gain: 0.08 }); },
      close() { A.tone({ f: 600, slideTo: 300, type: 'sine', dur: 0.1, gain: 0.06 }); },
      // --- blindbox
      boxShake(i) {
        const g = 0.25 + 0.1 * (i || 0);
        A.tone({ f: 110, slideTo: 55, type: 'sine', dur: 0.18, gain: g });
        A.noise({ freq: 700, dur: 0.07, gain: 0.08, filter: 'lowpass' });
      },
      boxTease(step) {
        const fs = [880, 1046.5, 1318.5, 1568, 2093];
        A.bell(fs[Math.min(step, fs.length - 1)], 0, 0.08 + step * 0.015);
      },
      boxBurst(r) {
        A.noise({ freq: 2500, sweepTo: 600, dur: 0.5, gain: 0.16, filter: 'highpass' });
        A.tone({ f: 80, slideTo: 40, type: 'sine', dur: 0.35, gain: 0.35 });
        if (r >= 2) A.shimmer(0.1, 8);
      },
      reveal(r) {
        const base = 523.25;
        const seqs = [
          [0, 7],
          [0, 4, 7],
          [0, 4, 7, 12],
          [0, 4, 7, 12, 16, 19],
          [0, 4, 7, 11, 12, 16, 19, 24]
        ];
        const seq = seqs[Math.min(r, 4)];
        seq.forEach((n, i) => A.tone({ f: semis(base, n), type: 'triangle', dur: 0.32, gain: 0.1, when: i * 0.075 }));
        if (r >= 2) A.chord([semis(base, 0), semis(base, 4), semis(base, 7)], seq.length * 0.075, 1.2, 0.04);
        if (r >= 3) { A.tone({ f: 130.81, type: 'sine', dur: 1.4, gain: 0.12, attack: 0.02 }); A.shimmer(0.3, 12); }
        if (r >= 4) {
          [0, 4, 7, 11].forEach((n) => {
            A.tone({ f: semis(261.63, n), type: 'sawtooth', dur: 2.2, gain: 0.018, attack: 0.4, detune: -8 });
            A.tone({ f: semis(261.63, n), type: 'sawtooth', dur: 2.2, gain: 0.018, attack: 0.4, detune: 8 });
          });
        }
      },
      flip() { A.noise({ freq: 1800, dur: 0.06, gain: 0.06 }); A.tone({ f: 990, type: 'sine', dur: 0.06, gain: 0.05 }); }
    },

    /* ------------------------------------------------------------ generative background music */
    startMusic() {
      if (!A.ctx || A.musicTimer) return;
      const PENTA = [0, 2, 4, 7, 9];
      const bassLine = [0, -5, -3, -7]; // C, G, A, F (relative to C3)
      A.musicStep = 0;
      A.musicTimer = setInterval(() => {
        if (!A.ctx || A.ctx.state !== 'running') return;
        const night = NOA.time && NOA.time.isNight();
        const step = A.musicStep++;
        const t = A.ctx.currentTime + 0.05;
        const chance = night ? 0.38 : 0.55;
        if (Math.random() < chance) {
          const deg = PENTA[Math.floor(Math.random() * PENTA.length)];
          const oct = Math.random() < 0.3 ? 12 : 0;
          const f = semis(night ? 392 : 523.25, deg + oct - 12);
          const osc = A.ctx.createOscillator();
          const g = A.ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
          osc.connect(g); g.connect(A.musicBus); g.connect(A.delay);
          osc.start(t); osc.stop(t + 1);
        }
        if (step % 8 === 0) {
          const f = semis(130.81, bassLine[(step / 8) % bassLine.length]);
          const osc = A.ctx.createOscillator();
          const g = A.ctx.createGain();
          osc.type = 'triangle'; osc.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.035, t + 0.2);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
          osc.connect(g); g.connect(A.musicBus);
          osc.start(t); osc.stop(t + 3.3);
        }
      }, 420);
    },
    stopMusic() { clearInterval(A.musicTimer); A.musicTimer = null; },

    noteFreq
  };
})();
