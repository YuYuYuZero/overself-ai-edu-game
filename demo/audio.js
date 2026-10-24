// 程序化音频：WebAudio 实时合成全部音乐与音效，零外部资源、可离线。
// 浏览器要求用户交互后才能出声，所以 AU.unlock() 挂在第一次点击上。
window.AU = (function () {
  let ctx = null, master = null, musicBus = null, sfxBus = null, lp = null;
  let muted = localStorage.getItem("complement.muted") === "1";
  let bgmTimer = null, bgmName = null, bgmNodes = [];
  let hbTimer = null, hbRate = 0;
  let ambNodes = [];

  function unlock() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
    lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 18000;
    musicBus = ctx.createGain(); musicBus.gain.value = 0.35;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7;
    musicBus.connect(lp); sfxBus.connect(lp); lp.connect(master); master.connect(ctx.destination);
    if (bgmName) { const n = bgmName; bgmName = null; bgm(n); }
  }
  const now = () => ctx.currentTime;
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);

  // 单个音：振荡器 + ADSR 包络
  function tone(freq, { type = "sine", dur = 0.3, vol = 0.3, attack = 0.01, release = null, at = 0, bus = sfxBus, detune = 0, glide = null } = {}) {
    if (!ctx) return;
    const t = now() + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    const rel = release ?? dur * 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + rel);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + attack + rel + 0.05);
    return o;
  }
  // 噪声（呼吸、翻页、风）
  function noise({ dur = 0.3, vol = 0.2, f0 = 800, f1 = null, q = 1, at = 0, type = "bandpass", attack = 0.02 } = {}) {
    if (!ctx) return;
    const t = now() + at, len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxBus); src.start(t); src.stop(t + dur + 0.05);
  }

  // ---------- 音效表（ID 与剧本【SFX】一致） ----------
  const SFX = {
    msg_in() { tone(880, { dur: 0.12, vol: 0.2 }); tone(1320, { dur: 0.18, vol: 0.18, at: 0.08 }); },
    phone_vibrate() { for (let i = 0; i < 2; i++) tone(140, { type: "square", dur: 0.35, vol: 0.12, attack: 0.02, release: 0.3, at: i * 0.55 }); },
    phone_ring() { for (let i = 0; i < 3; i++) { tone(440, { dur: 0.4, vol: 0.12, at: i * 0.9 }); tone(480, { dur: 0.4, vol: 0.12, at: i * 0.9 }); } },
    phone_dial() { for (let i = 0; i < 2; i++) tone(425, { dur: 0.8, vol: 0.1, at: i * 1.4, attack: 0.02, release: 0.7 }); },
    signal() { tone(1568, { dur: 0.9, vol: 0.12, type: "triangle" }); tone(2349, { dur: 1.2, vol: 0.07, at: 0.06 }); },
    signal_miss() { noise({ dur: 0.5, vol: 0.03, f0: 4000, f1: 1500 }); },
    tick() { tone(1200, { dur: 0.03, vol: 0.08, type: "square", release: 0.03 }); },
    heartbeat_soft() { beat(0.25); },
    heartbeat_fast() { beat(0.4); setTimeout(() => beat(0.4), 420); },
    decode_low() { tone(98, { dur: 2.2, vol: 0.28, attack: 0.05 }); tone(147, { dur: 1.8, vol: 0.1, attack: 0.1 }); },
    mirror() { tone(1760, { dur: 2.5, vol: 0.12, type: "triangle" }); tone(2637, { dur: 2.8, vol: 0.06, at: 0.05 }); tone(880, { dur: 2.0, vol: 0.08, at: 0.1 }); noise({ dur: 0.4, vol: 0.05, f0: 3000, f1: 800 }); },
    rewind() { const o = tone(900, { type: "sawtooth", dur: 0.9, vol: 0.06, glide: 120 }); noise({ dur: 0.9, vol: 0.05, f0: 2500, f1: 300 }); },
    tape_rewind() { SFX.rewind(); },
    good() { [60, 64, 67, 72].forEach((m, i) => tone(midi(m), { dur: 1.4, vol: 0.09, type: "triangle", at: i * 0.05 })); },
    bad() { tone(70, { dur: 0.6, vol: 0.3, attack: 0.005 }); tone(55, { dur: 0.8, vol: 0.2, attack: 0.01 }); },
    music_box() { [84, 88, 91].forEach((m, i) => tone(midi(m), { dur: 1.2, vol: 0.12, type: "triangle", at: i * 0.32 })); },
    card() { noise({ dur: 0.15, vol: 0.1, f0: 2000 }); [67, 71, 74].forEach((m, i) => tone(midi(m), { dur: 1, vol: 0.07, at: 0.1 + i * 0.07 })); },
    page_turn() { noise({ dur: 0.35, vol: 0.08, f0: 1500, f1: 4000, q: 0.7 }); },
    door_close() { tone(80, { dur: 0.3, vol: 0.25, attack: 0.003 }); noise({ dur: 0.2, vol: 0.08, f0: 400 }); },
    door_open() { noise({ dur: 0.5, vol: 0.06, f0: 600, f1: 1200 }); },
    call_bell() { [0, 0.5].forEach(t => tone(988, { dur: 0.4, vol: 0.12, at: t })); },
    monitor() { tone(1000, { dur: 0.08, vol: 0.06, release: 0.08 }); },
    cry_muffled() { noise({ dur: 1.2, vol: 0.02, f0: 500, f1: 300 }); },
    breath_in() { noise({ dur: 3.8, vol: 0.06, f0: 300, f1: 1400, q: 0.6, attack: 1.5 }); tone(220, { dur: 3.8, vol: 0.05, glide: 330, attack: 1.5, release: 2.2, bus: musicBus }); },
    breath_out() { noise({ dur: 3.8, vol: 0.05, f0: 1400, f1: 250, q: 0.6, attack: 0.3 }); tone(330, { dur: 3.8, vol: 0.05, glide: 220, attack: 0.3, release: 3.4, bus: musicBus }); },
    mute_dive() { if (!ctx) return; lp.frequency.cancelScheduledValues(now()); lp.frequency.setValueAtTime(lp.frequency.value, now()); lp.frequency.exponentialRampToValueAtTime(350, now() + 0.6); },
    unmute() { if (!ctx) return; lp.frequency.cancelScheduledValues(now()); lp.frequency.setValueAtTime(lp.frequency.value, now()); lp.frequency.exponentialRampToValueAtTime(18000, now() + 1.5); },
  };
  function beat(vol) { tone(55, { dur: 0.18, vol, attack: 0.005, release: 0.15 }); tone(48, { dur: 0.2, vol: vol * 0.7, attack: 0.005, release: 0.18, at: 0.16 }); }
  function sfx(id) { unlock(); if (SFX[id]) try { SFX[id](); } catch (e) {} }

  // ---------- 心跳：温度 ≥ 50 时持续，频率随温度上升 ----------
  function heart(temp) {
    const want = temp >= 50 ? 60 + temp * 0.8 : 0;
    if (Math.abs(want - hbRate) < 4) return;
    hbRate = want; clearInterval(hbTimer); hbTimer = null;
    if (!want) return;
    const vol = 0.12 + (temp - 50) / 50 * 0.3;
    hbTimer = setInterval(() => ctx && beat(vol), 60000 / want);
  }

  // ---------- 背景音乐：和弦进行循环 ----------
  const THEMES = {
    home: { chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], type: "triangle", vol: 0.05, arp: true, len: 3.2 },
    warm: { chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60, 65], [55, 59, 62]], type: "triangle", vol: 0.055, arp: true, len: 3.6, vib: 6 },
    cool: { chords: [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]], type: "sine", vol: 0.06, arp: false, len: 4.2, detune: 7 },
    night: { chords: [[45, 52], [41, 48], [43, 50], [40, 47]], type: "sine", vol: 0.04, arp: false, len: 6 },
  };
  // 主题动机（4 小节），尾声由冷暖两个声部合奏
  const MOTIF = [[64, 1], [67, 1], [69, 2], [67, 1], [64, 1], [62, 2], [60, 1], [62, 1], [64, 1], [67, 1], [64, 4]];
  function motif({ voices = ["warm"], beatLen = 0.42, at = 0.2 } = {}) {
    unlock(); if (!ctx) return;
    voices.forEach((v, vi) => {
      let t = at + (vi ? 0.02 : 0);
      for (const [m, b] of MOTIF) {
        const freq = midi(m + (v === "cool" ? -12 : 0));
        tone(freq, { dur: b * beatLen, vol: v === "cool" ? 0.08 : 0.1, type: v === "cool" ? "sine" : "triangle", at: t, attack: 0.02, release: b * beatLen * 1.1, bus: musicBus });
        t += b * beatLen;
      }
    });
  }
  function stopBgm() { clearInterval(bgmTimer); bgmTimer = null; bgmNodes.forEach(n => { try { n.stop(); } catch (e) {} }); bgmNodes = []; }
  function bgm(name) {
    if (name === bgmName) return;
    bgmName = name; stopBgm();
    if (!ctx || !name || !THEMES[name]) return;
    const th = THEMES[name]; let ci = 0;
    const play = () => {
      const ch = th.chords[ci++ % th.chords.length];
      ch.forEach((m, i) => {
        const o = tone(midi(m), { type: th.type, dur: th.len, vol: th.vol, attack: th.arp ? 0.02 : 1.2, release: th.len * 0.95, at: th.arp ? i * 0.28 : 0, bus: musicBus, detune: th.detune ? (i % 2 ? th.detune : -th.detune) : 0 });
        if (o) bgmNodes.push(o);
      });
      if (bgmNodes.length > 40) bgmNodes = bgmNodes.slice(-20);
    };
    play(); bgmTimer = setInterval(play, th.len * 1000);
  }
  // 环境音：监护仪滴声、夜风
  function amb(name) {
    ambNodes.forEach(clearInterval); ambNodes = [];
    if (!name) return;
    if (name === "monitor") ambNodes.push(setInterval(() => SFX.monitor(), 1100));
    if (name === "wind") ambNodes.push(setInterval(() => noise({ dur: 4, vol: 0.025, f0: 300, f1: 600, q: 0.5, attack: 1.5 }), 3800));
    if (name === "office") ambNodes.push(setInterval(() => noise({ dur: 5, vol: 0.012, f0: 200, q: 0.3, type: "lowpass", attack: 1 }), 4800));
  }

  function setMuted(m) {
    muted = m; localStorage.setItem("complement.muted", m ? "1" : "0");
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, now(), 0.1);
  }
  return { unlock, sfx, bgm, amb, heart, motif, setMuted, isMuted: () => muted, stopAll() { stopBgm(); amb(null); heart(0); bgmName = null; } };
})();
