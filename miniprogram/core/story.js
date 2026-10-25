// 故事引擎（网页版 demo/story.js 的小程序版）：经历 → 镜面 → 倒带 → 复盘。
// 流程、数值、存档格式、节点处理与网页版逐段对应（同一份 story-*.js 数据、同一个存档 key）；
// 网页版拼 DOM 的地方，这里拼页面数据：舞台走 core/vn.js，交互面板走 ui.panel，章首/复盘/结局走 view。
const env = require("../shared/index.js");
const AU = require("./au");
const SVG = require("./svg");
const VN = require("./vn");
const store = require("./store");
const { routeVars } = require("./color");
const { esc, markup } = require("./text");

const METER = { aware: { label: "觉察", color: "#4a8fe0" }, temp: { label: "情绪温度", hot: true } };
const PHASES = [["live", "经历"], ["mirror", "镜面"], ["rewind", "倒带"]];
const other = p => (p === "A" ? "B" : "A");
const val = (x, G) => (typeof x === "function" ? x(G) : x);
const clone = o => JSON.parse(JSON.stringify(o));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const phaseKey = label => (PHASES.find(p => p[1] === label) || PHASES[0])[0];
const firstBg = nodes => { const n = (nodes || []).find(x => x.bg); return n && n.bg; };
const shuffle = n => Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);

// page 需提供：leave()（离开页面）、measureHud()（量 HUD 高度）
module.exports = function createStory(page, ui) {
  const STORIES = env.STORIES;
  let ST = null;      // 当前故事
  let POV = null;     // 当前故事的两个视角
  let G = null;       // 全局存档状态
  let UI = null;      // 当前舞台
  let runToken = 0;   // 退出 / 跳章时让正在跑的异步流程失效
  let disposed = false, timerK = 0, pageK = 0, pulseT = 0;
  const timers = new Set(), intervals = new Set();

  function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; }
  const sleep = ms => new Promise(r => later(r, ms));
  function every(fn, ms) { const t = setInterval(fn, ms); intervals.add(t); return t; }
  function stopEvery(t) { clearInterval(t); intervals.delete(t); }

  function fresh(start) {
    return { story: ST.id, start, ch: 0, v: { rel: 0, tempA: 20, tempB: 20, aware: 10, named: 0 }, f: {}, picks: {}, firsts: {}, cards: [], history: [], snaps: {}, seen: {} };
  }
  function save() { store.set(ST.key, G); }
  function load(st) { return store.get((st || ST).key); }
  function use(id) { ST = STORIES[id] || store.list()[0]; POV = ST.POV; }

  function alive(tok) { if (tok !== runToken) throw new Error("__exit__"); }
  const panel = (blocks, opt) => ui.panel(blocks, opt);
  const clearPanel = () => ui.panel(null);
  const btn = (text, tap, c, dis) => ({ text, tap, c: c || "", dis: !!dis });
  const btns = (items, center) => ({ k: "btns", center: !!center, items });
  // 等玩家点一个按钮：build(resolve) 返回面板 blocks
  const ask = (build, opt) => new Promise(r => panel(build(r), opt));

  // ---------- 外壳 ----------
  function shell(ch, pov, phaseLabel) {
    if (UI && UI.vn) UI.vn.stop();
    const vn = VN.mount(ui, { pov: POV[pov], cast: ST.cast });
    UI = { ch, pov, vn, keys: (ch.meters && ch.meters[pov]) || [], caught: new Set(), replays: {} };
    clearPanel();
    ui.set({
      mode: "stage", rv: routeVars(POV[pov].color), view: null,
      hud: { title: ch.title, pov: `${POV[pov].name} · ${POV[pov].tag}`, color: POV[pov].color, phase: phaseLabel || "" }
    }, () => page.measureHud && page.measureHud());
    progBar();
    G.seen[`${G.start}:${G.ch}:${phaseKey(phaseLabel)}`] = 1;
    paintMeters();
  }
  function curTemp() { return UI.pov === "A" ? G.v.tempA : G.v.tempB; }
  function paintMeters(pulse) {
    const meters = UI.keys.map(k => {
      const m = METER[k], x = clamp(Math.round(k === "temp" ? curTemp() : G.v[k]), 0, 100);
      return { k, label: m.label, v: x, color: m.hot ? `hsl(${120 - x * 1.2},65%,50%)` : m.color };
    });
    const t = UI.keys.includes("temp") ? curTemp() : 0;
    ui.set({ meters, caught: UI.keys.length && UI.caught.size ? `🔍 ${UI.caught.size}` : "", hot: t >= 60, veryHot: t >= 80 });
    // 数值变化时闪一下：先摘掉再加回 pulse 类，动画才会重播
    if (pulse) {
      clearTimeout(pulseT);
      ui.set({ pulse: false });
      pulseT = setTimeout(() => { ui.set({ pulse: true }); pulseT = setTimeout(() => ui.set({ pulse: false }), 1300); }, 40);
    }
    AU.heart(UI.keys.includes("temp") ? t : 0);
  }
  function apply(fx) {
    fx = val(fx, G);
    if (!fx) return;
    for (const k of Object.keys(fx)) {
      const d = fx[k];
      if (k === "temp") { const key = UI.pov === "A" ? "tempA" : "tempB"; G.v[key] = clamp(G.v[key] + d, 0, 100); }
      else if (k === "rel") G.v.rel = clamp(G.v.rel + d, -50, 100);
      else G.v[k] = clamp((G.v[k] || 0) + d, 0, 100);
    }
    paintMeters(true);
  }
  function setFlags(s) { s = val(s, G); if (s) Object.assign(G.f, s); }

  // ---------- 对白 ----------
  // who：旁白 / 内心 / 你 / 角色名。旁白以漫画字幕叠在背景上，角色说话时立绘亮起。
  function bubble(who, html, o = {}) {
    UI.vn.line(who, html, { expr: o.expr, call: o.call, chat: o.chat, group: o.group, tag: o.tag, kind: o.kind, filtered: o.filtered, replayed: o.replayed, voice: o.voice });
  }
  function note(text) { UI.vn.narr(esc(text), "sys"); }
  function decodeBox(text, inner) { AU.sfx("decode_low"); UI.vn.decode(text, inner); }

  // 情绪信号：短暂出现，点击捕捉
  function showSignals(list) {
    if (!list || !list.length) return;
    const tok = runToken, U = UI;
    list.forEach((s, i) => {
      if (s.hideHot && curTemp() >= 60) return;
      later(() => {
        if (tok !== runToken || U !== UI) return;
        const mult = (UI.phase === "rewind" ? 2 : 1) * (UI.pov === "A" ? 1 : 1.2);
        const glow = s.glow || UI.phase === "rewind";
        const c = (glow ? " glow" : "") + (s.self ? " self" : "") + (UI.pov === "A" ? " faint" : "");
        let done = false;
        const k = U.vn.addSig({ t: `（${s.text}）`, c, tap: () => {
          if (done || U !== UI) return;
          done = true;
          if (s.fake) { U.vn.updSig(k, { c: c + " fake", t: "（这条和情绪无关）" }); AU.sfx("signal_miss"); later(() => U.vn.delSig(k), 1200); return; }
          UI.caught.add(s.id);
          U.vn.updSig(k, { c: c + " got", t: `🔍 ${s.text}` });
          AU.sfx("signal");
          if (UI.pov === "A") apply({ aware: 3 }); else paintMeters();
          UI.onCatch && UI.onCatch();
          later(() => U.vn.delSig(k), 1600);
        } });
        later(() => {
          if (done) return;
          done = true;
          U.vn.updSig(k, { c: c + " gone" }); AU.sfx("signal_miss");
          later(() => U.vn.delSig(k), 600);
        }, s.dur * 1000 * mult);
      }, 500 + i * 700);
    });
  }

  function cont() { return UI.vn.waitAdvance(); }
  async function replies(list, tok, o = {}) {
    for (const r of list || []) {
      const [who, text, expr] = r;
      await sleep(450); alive(tok);
      bubble(who, esc(text), { expr, chat: o.chat && who !== "旁白", call: o.call && who !== "旁白" && who !== "内心" });
      await cont(); alive(tok);
    }
  }

  // ---------- 节点处理（与网页版 H 表一一对应） ----------
  const H = {
    async scene(n) {
      if (n.bgm !== undefined) AU.bgm(n.bgm === null ? null : n.bgm || POV[UI.pov].bgm);
      if (n.amb !== undefined) AU.amb(n.amb);
      if (n.sfx) AU.sfx(n.sfx);
      if (UI.board && (n.bg || n.chars)) { UI.vn.board(null); UI.board = false; }
      UI.vn.scene({ bg: n.bg, chars: n.chars, text: n.text });
      await sleep(n.bg ? 500 : 150);
    },
    async title(n) {
      // 关键旁白：黑屏白字
      ui.set({ tcard: { text: n.text, out: false } });
      await sleep(Math.max(2400, n.text.length * 160));
      ui.set({ "tcard.out": true });
      await sleep(500);
      ui.set({ tcard: null });
    },
    async tip(n) {
      await ask(ok => [{ k: "tip", text: "💡 " + n.text }, btns([btn("知道了", ok, "btn")])]);
      clearPanel();
    },
    async table(n) {
      UI.vn.board(n.rows); UI.board = true;
      await sleep(400);
    },
    async say(n, tok) {
      if (n.preFx) apply(n.preFx);
      if (n.sfx) AU.sfx(n.sfx);
      const filtered = !!(n.filter && UI.pov === "B" && curTemp() >= 60);
      if (n.replayKey) UI.replays[n.replayKey] = n;
      bubble(n.who, markup(n.text, filtered), Object.assign({}, n, { filtered }));
      showSignals(n.sig);
      setFlags(n.set);
      if (n.fx) apply(n.fx);
      if (n.motif) AU.motif({ voices: n.motif });
      if (n.decode && (n.decodeWhen !== "mirror" || UI.phase === "mirror")) { await sleep(700); alive(tok); decodeBox(n.decode, n.decodeInner); }
      await sleep(n.sig ? 900 : 200); alive(tok);
      await cont();
    },
    async echo(n, tok) {
      const k = G.picks[n.from] || n.def;
      bubble(n.who, esc(n.lines[k] || n.lines[n.def]), Object.assign({}, n, { expr: n.expr && (n.expr[k] || n.expr) }));
      if (n.decode && n.decode[k] && (n.decodeWhen !== "mirror" || UI.phase === "mirror")) {
        await sleep(800); alive(tok); decodeBox(val(n.decode[k], G), n.inner && val(n.inner[k], G));
        if (n.fx && n.fx[k]) apply(n.fx[k]);
        await sleep(300); alive(tok); await cont();
      } else {
        if (n.fx && n.fx[k]) apply(n.fx[k]);
        await sleep(300); alive(tok); await cont();
        if (n.inner && n.inner[k]) { bubble("内心", esc(val(n.inner[k], G))); await cont(); }
      }
      if (n.jump && n.jump[k]) return { goto: n.jump[k] };
    },
    async choice(n, tok) {
      const o = await new Promise(resolve => {
        const render = () => {
          const opts = n.opts.filter(o => {
            if (o.when && !o.when(G)) return false;
            if (o.req && !o.req.every(id => UI.caught.has(id))) return false;
            if (o.reqAny && !o.reqAny.some(id => UI.caught.has(id))) return false;
            return true;
          });
          panel([n.prompt ? { k: "prompt", text: n.prompt } : null,
            { k: "opts", items: opts.map(o => ({ text: o.text, c: o.req || o.reqAny ? "unlocked" : "", lock: !!(o.req || o.reqAny), tap: () => { UI.onCatch = null; clearPanel(); resolve(o); } })) }]);
        };
        UI.onCatch = render;
        render();
      });
      alive(tok);
      record(n, o);
      const narr = o.text.startsWith("（");
      bubble(narr ? "旁白" : "你", esc(narr ? o.text.replace(/^（|）$/g, "") : o.text), { chat: n.chat && !narr, call: n.call, expr: o.expr });
      const fx = val(o.fx, G);
      if (o.sfx) AU.sfx(o.sfx); else if (fx && fx.rel > 0) AU.sfx("good"); else if (fx && fx.rel < 0) AU.sfx("bad");
      apply(fx); setFlags(o.set);
      await sleep(250); alive(tok);
      await cont(); alive(tok);
      await replies(o.reply, tok, { chat: n.chat, call: n.call });
      if (o.inner) { bubble("内心", esc(o.inner)); await cont(); alive(tok); }
      return o.goto ? { goto: o.goto } : undefined;
    },
    async impulse(n, tok) {
      let hinted = UI.phase === "rewind", first = true;
      const snap = clone(G.v);
      for (;;) {
        const res = await new Promise(resolve => {
          let iv = 0, fin = false;
          const done = (o, timeout) => { if (fin) return; fin = true; stopEvery(iv); resolve({ o, timeout }); };
          const pause = { text: (hinted ? "⏸ " : "") + (n.pauseText || "先停一下"), c: hinted ? "pause hint" : "", tap: () => done(null) };
          const items = n.opts.map(o => ({ text: o.text, c: "impulse-opt", tap: () => done(o) }));
          items.splice(hinted ? 0 : Math.floor(Math.random() * (items.length + 1)), 0, pause);
          panel([{ k: "prompt", text: "⚡ " + n.prompt }, { k: "timer", secs: n.secs, key: ++timerK },
            hinted ? { k: "muted", text: "这一次，试试先停一下" } : null, { k: "opts", items }]);
          // 倒计时条是 CSS 动画；这里只管滴答声和超时
          const total = n.secs * 1000, t0 = Date.now(); let lastTick = 0;
          iv = every(() => {
            if (tok !== runToken) { stopEvery(iv); return; }
            const left = 1 - (Date.now() - t0) / total;
            const step = left < 0.35 ? 180 : 400;
            if (Date.now() - lastTick > step) { AU.sfx("tick"); lastTick = Date.now(); }
            if (left <= 0) done(n.opts[0], true);
          }, 50);
        });
        alive(tok);
        clearPanel();
        if (first) { recordType(n, res.o ? res.o.type : "暂停"); first = false; }
        G.history.push({ ch: G.ch, pov: UI.pov, phase: UI.phase, id: n.id, type: res.o ? res.o.type : "暂停", text: res.o ? res.o.text : (n.pauseText || "先停一下") });
        if (!res.o) {
          G.picks[n.id] = "pause";
          AU.sfx("mute_dive");
          UI.vn.narr("你停了下来。<br>先停一下。", "pause");
          await sleep(500); await cont(); return;
        }
        if (res.timeout) note("⏱ 你还在犹豫——情绪替你做了选择");
        if (res.timeout) { await sleep(900); alive(tok); }
        bubble("你", esc(res.o.text), { expr: "angry" }); apply(res.o.fx);
        await sleep(700); alive(tok);
        UI.vn.coachCard("bad", "后来……", res.o.cons); AU.sfx("bad");
        await sleep(600);
        await ask(r => [btns([btn("⏪ 倒回那一刻", r, "btn")])]); alive(tok); clearPanel();
        AU.sfx("rewind"); G.v = clone(snap); paintMeters(true);
        UI.vn.fx("rewinding", true); await sleep(700); UI.vn.fx("rewinding", false);
        note("⏪ 时间倒回到刚才那一刻……"); hinted = true;
        await sleep(600); alive(tok);
      }
    },
    async breathe(n, tok) {
      let skipped = false, appliedC = 0;
      const render = (phase, inn) => panel([{ k: "breathe", phase, inn, skip: appliedC ? { tap: () => { skipped = true; } } : null }]);
      // 手机竖屏上，居中的「你停了下来」会和呼吸面板叠在一起：开始呼吸时先收起旁白
      UI.vn.hideCaption();
      UI.vn.fx("underwater", true);
      render("准备", false);
      const cycles = n.cycles || 2, total = (val(n.fx, G) || {}).temp || 0;
      for (let c = 0; c < cycles && !skipped; c++) {
        for (const [name, ms, inn, s] of [["吸气", 4000, true, "breath_in"], ["屏住", 2000, true, null], ["呼气", 4000, false, "breath_out"]]) {
          if (skipped) break;
          render(name, inn); if (s) AU.sfx(s);
          const t0 = Date.now();
          while (Date.now() - t0 < ms && !skipped) { await sleep(100); alive(tok); }
        }
        appliedC++; apply({ temp: total / cycles });
      }
      if (appliedC < cycles) apply({ temp: total * (cycles - appliedC) / cycles });
      AU.sfx("unmute");
      UI.vn.fx("underwater", false);
      clearPanel();
      UI.vn.narr(esc(n.text ? "呼——<br>" + n.text : "呼——").replace(/&lt;br&gt;/g, "<br>"), "breath");
      await cont();
    },
    async replay(n, tok) {
      await ask(r => [btns([btn(`🔁 回听${n.who}刚才说的`, r, "btn ghost")], true)]); alive(tok); clearPanel();
      AU.sfx("tape_rewind");
      UI.vn.fx("rewinding", true); await sleep(800); UI.vn.fx("rewinding", false);
      bubble(n.who, markup(n.text, false), { expr: n.expr, replayed: true });
      AU.sfx("signal");
      if (n.fx) apply(n.fx);
      await cont();
      for (const t of n.after || []) { alive(tok); bubble("内心", esc(t)); await cont(); }
    },
    async sort(n, tok) {
      const assign = {}, order = shuffle(n.items.length);
      let result = null;
      const render = r => panel([
        { k: "prompt", text: "🧩 " + n.prompt },
        { k: "sort", rows: order.map(i => {
          const [text, ans] = n.items[i], right = assign[i] === ans;
          return { text, c: result ? (right ? "ok" : "no") : "", ans: result && !right ? `→ 应该是「${ans}」` : "",
            bins: n.bins.map(b => ({ text: b, on: assign[i] === b, dis: !!result, tap: () => { assign[i] = b; render(r); } })) };
        }) },
        result ? { k: "feedback", c: result.ratio >= 0.8 ? "good" : "info", title: `分对了 ${result.ok} / ${n.items.length}`, text: n.explain } : null,
        btns([result ? btn("继续 ›", r, "btn") : btn("分好了", r, "btn", Object.keys(assign).length < n.items.length)])
      ], { big: true, to: result ? "pend" : "" });
      await new Promise(render); alive(tok);
      let ok = 0;
      order.forEach(i => { if (assign[i] === n.items[i][1]) ok++; });
      const ratio = ok / n.items.length;
      const fx = val(n.fx, G); if (fx) { const e = {}; for (const k in fx) e[k] = Math.round(fx[k] * ratio); apply(e); }
      AU.sfx(ratio >= 0.8 ? "good" : "page_turn");
      result = { ok, ratio };
      await new Promise(render); clearPanel();
    },
    // 排序：依次点选，按每项离正确位置的距离计分
    async rank(n, tok) {
      const order = shuffle(n.items.length), seq = [], N = n.items.length;
      let result = null;
      const render = r => panel([
        { k: "prompt", text: "🔢 " + n.prompt },
        { k: "rank", items: order.map(i => {
          const at = seq.indexOf(i), right = at === n.items[i][1];
          return { text: n.items[i][0], n: at >= 0 ? at + 1 : "", c: (at >= 0 ? " on" : "") + (result ? (right ? " ok" : " no") : ""),
            ans: result && !right ? ` → 第 ${n.items[i][1] + 1}` : "", dis: !!result || at >= 0, tap: () => { seq.push(i); render(r); } };
        }) },
        result ? { k: "feedback", c: result >= 0.8 ? "good" : "info", title: result >= 0.999 ? "顺序全对" : `顺序吻合度 ${Math.round(result * 100)}%`, text: n.explain } : null,
        btns(result ? [btn("继续 ›", r, "btn")] : [btn("重排", () => { seq.length = 0; render(r); }, "btn plain"), btn("排好了", r, "btn", seq.length < N)])
      ], { big: true, to: result ? "pend" : "" });
      await new Promise(render); alive(tok);
      let dist = 0;
      seq.forEach((i, pos) => { dist += Math.abs(n.items[i][1] - pos); });
      const ratio = Math.max(0, 1 - dist / Math.max(1, Math.floor(N * N / 2)));
      G.picks[n.id || "rank"] = Math.round(ratio * 100);
      const fx = val(n.fx, G); if (fx) { const e = {}; for (const k in fx) e[k] = Math.round(fx[k] * ratio); apply(e); }
      AU.sfx(ratio >= 0.8 ? "good" : "page_turn");
      result = Math.max(ratio, 0.0001);
      await new Promise(render); clearPanel();
    },
    async qa(n, tok) {
      const who = n.who || "王医生";
      note(n.intro || `向${who}提问（选 ${n.pick} 个）`);
      await sleep(300);
      let asked = 0; const used = new Set();
      while (asked < n.pick) {
        const q = await ask(res => [{ k: "prompt", text: `还能问 ${n.pick - asked} 个` },
          { k: "opts", items: n.qs.map((q, i) => ({ text: q.q, dis: used.has(i), c: used.has(i) ? "dis" : "", tap: () => res(i) })) }]);
        alive(tok); used.add(q); asked++; clearPanel();
        const item = n.qs[q];
        bubble("你", esc(item.q), { call: n.call }); await cont(); alive(tok);
        bubble(who, esc(item.a), { call: n.call, expr: item.expr }); apply(item.fx); setFlags(item.set);
        if (item.key) AU.sfx("signal");
        await cont(); alive(tok);
      }
    },
    async body(n, tok) {
      const named = {}, open = {};
      const fig = SVG.char(POV[UI.pov].char, "worry", "static");
      await new Promise(finish => {
        const render = () => panel([
          { k: "tip", text: "💡 " + n.prompt },
          { k: "body", fig, parts: n.parts.map(p => {
            const r = named[p.name];
            return { name: p.name, desc: p.desc, c: r ? (r.ok ? "named" : "named-off") : "", em: r ? ` → ${r.w}` : "",
              tap: r ? null : () => { open[p.name] = true; render(); },
              words: !r && open[p.name] ? p.words.map(w => ({ text: w, tap: () => {
                const ok = p.ok.includes(w);
                named[p.name] = { ok, w };
                if (ok) { G.v.named = (G.v.named || 0) + 1; apply({ aware: 5 }); AU.sfx("signal"); } else AU.sfx("page_turn");
                render();
                if (Object.keys(named).length === n.parts.length) finish();
              } })) : null };
          }) }
        ], { big: true });
        render();
      });
      alive(tok);
      await sleep(400);
      clearPanel();
      bubble("内心", esc(n.after));
      await cont();
    },
    async compose(n, tok) {
      const slots = n.slotsBy ? n.slotsBy[UI.pov] : n.slots;
      const sel = slots.map(() => null);
      await new Promise(send => {
        const render = () => panel([
          { k: "prompt", text: "✍️ " + n.prompt },
          { k: "compose", slots: slots.map((s, si) => ({ label: s.label, opts: s.opts.map(([t], oi) => ({ text: t, on: sel[si] === oi, tap: () => { sel[si] = oi; render(); } })) })),
            preview: sel.some(x => x != null) ? sel.map((x, i) => (x == null ? "____" : slots[i].opts[x][0])).join("") : "（还没选）" },
          btns([btn(n.msg ? "发送" : "说出口", send, "btn", sel.some(x => x == null))])
        ], { big: true });
        render();
      });
      alive(tok); clearPanel();
      const text = sel.map((x, i) => slots[i].opts[x][0]).join("");
      const score = sel.reduce((a, x, i) => a + slots[i].opts[x][1], 0);
      G.picks[n.id || "compose"] = score;
      if (n.msg) { G.f.finalMsg = text; AU.sfx("msg_in"); }
      bubble("你", esc(text), { chat: n.msg, call: n.call });
      await cont(); alive(tok);
      const out = n.outcomes.find(o => score >= o.min);
      if (out) {
        apply(out.fx); setFlags(out.set); AU.sfx(score >= 3 ? "good" : "page_turn");
        await replies(out.reply, tok, { chat: n.msg, call: n.call });
        if (out.feedback) { UI.vn.coachCard(score >= 3 ? "good" : "info", "", out.feedback); await cont(); }
      }
    },
    async reveal(n) {
      if (n.sfx) AU.sfx(n.sfx);
      UI.vn.reveal({ title: n.title, text: n.text });
      await sleep(600); await cont(); UI.vn.reveal(null);
    },
    async voice(n, tok) {
      const lines = val(n.text, G);
      bubble(n.who, "", { chat: true, group: n.group, voice: { secs: n.secs } });
      panel([{ k: "muted", text: "点击语音条收听", center: true }]);
      await UI.vn.waitVoice(); alive(tok); clearPanel();
      UI.vn.voicePlaying(); AU.motif({ voices: ["warm"], beatLen: 0.6 });
      for (const l of lines) { await sleep(500); alive(tok); bubble(n.who, esc(l), { tag: "语音", expr: n.expr || "smile" }); await cont(); alive(tok); }
    },
    async if(n) { if (!n.cond(G)) return { goto: n.else }; },
    async goto(n) { return { goto: n.to }; },
    async noop() {},
    async ending() { return { ending: true }; }
  };

  function recordType(n, type) {
    const key = `${G.ch}:${UI.pov}:${n.id}`;
    if (!(key in G.firsts)) G.firsts[key] = { type, phase: UI.phase, title: n.id };
  }
  function record(n, o) {
    if (n.id) G.picks[n.id] = o.k;
    if (n.key) {
      recordType(n, o.type);
      G.history.push({ ch: G.ch, pov: UI.pov, phase: UI.phase, id: n.id, type: o.type, text: o.text });
    }
  }

  async function runNodes(nodes, startIdx, tok, hooks = {}) {
    let i = startIdx || 0;
    const idx = id => nodes.findIndex(x => x.id === id);
    while (i < nodes.length) {
      alive(tok);
      const n = nodes[i];
      if (nodes === PROG.nodes) setProg(i / nodes.length);
      if (hooks.at && n.id === hooks.at) hooks.onAt();
      const h = H[n.t];
      if (!h) { console.warn("未知节点", n); i++; continue; }
      const r = await h(n, tok);
      alive(tok);
      if (r && r.ending) return "ending";
      if (r && r.goto) { const j = idx(r.goto); if (j < 0) { console.warn("找不到节点", r.goto); i++; } else i = j; continue; }
      i++;
    }
  }

  // ---------- 章节流程 ----------
  async function interstitial(cls, title, sub, sfx, ms = 2600) {
    if (sfx) AU.sfx(sfx);
    ui.set({ inter: { cls, title, sub: sub || "" } });
    await sleep(ms);
    ui.set({ inter: null });
  }
  // 不在舞台上的页面（章首、复盘、结局）：铺一层虚化的场景背景
  function showPage(bgId, view) {
    if (UI && UI.vn) UI.vn.stop();
    clearPanel();
    ui.drop("page");
    ui.set({ mode: "page", rv: routeVars("#6b5bd2"), pageBg: SVG.bg(bgId), view: view ? ui.strip(view, "page") : null, pageK: ++pageK, hot: false, veryHot: false });
    progBar();
  }
  const portrait = (p, expr) => ({ av: SVG.head(POV[p].char, expr || "normal"), color: POV[p].color });
  async function chapterIntro(ch, tok) {
    AU.bgm("home");
    const s = G.start;
    await new Promise(go => showPage(firstBg(ch.seq || ch[s]), {
      type: "intro", story: `《${ST.title}》 · ${ch.sub || ""}`, title: ch.title,
      goals: ch.goal ? ["A", "B"].map(p => Object.assign(portrait(p), { who: `${POV[p].short}这一章要学会`, text: ch.goal[p] })) : null,
      note: ch.noMirror ? `你将以${POV[s].name}的视角进入。` : `先以${POV[s].name}的视角经历，再从${POV[other(s)].name}的眼睛重看一遍，最后倒带。`,
      go: { text: "开始", tap: go }
    }));
    alive(tok);
  }
  // 从某个节点中途开始时，把它之前最近的场景（背景、在场人物）铺好
  function restoreScene(nodes, idx) {
    for (let i = idx - 1; i >= 0; i--) if (nodes[i].t === "scene" && nodes[i].bg) { UI.vn.scene({ bg: nodes[i].bg, chars: nodes[i].chars }); return; }
  }

  // from：0 经历 / 1 镜面 / 2 倒带（从目录跳进来时可以直接进镜面或倒带）
  async function playChapter(ch, tok, from = 0) {
    const s = G.start, o = other(s);
    PROG.k = 0; PROG.n = ch.noMirror || ch.seq ? 1 : 3;
    if (!from) await chapterIntro(ch, tok);
    if (ch.seq) { shell(ch, s, ""); track(ch.seq, 0); UI.phase = "live"; return runNodes(ch.seq, 0, tok); }
    const init = val(ch.init, G) || {};
    Object.assign(G.v, init);
    let snap = null;
    // ① 经历
    if (from <= 0) {
      shell(ch, s, ch.noMirror ? "" : "经历"); track(ch[s], 0);
      UI.phase = "live";
      await runNodes(ch[s], 0, tok, { at: ch.rewindAt && ch.rewindAt[s], onAt: () => { snap = clone(G.v); } });
      if (ch.noMirror) return;
    }
    // ② 镜面
    let relDelta = 0;
    if (from <= 1) {
      await interstitial("mirror-it", "镜 面", `现在，换成${POV[o].name}的眼睛。你刚才说的每一句话，${POV[o].short}都会听到。`, "mirror", 3400);
      alive(tok);
      const relBefore = G.v.rel;
      const tk = o === "A" ? "tempA" : "tempB";
      if (init[tk] != null) G.v[tk] = init[tk];
      shell(ch, o, "镜面"); track(ch[o], 1);
      UI.phase = "mirror";
      await runNodes(ch[o], 0, tok);
      relDelta = G.v.rel - relBefore;
      for (const n of (ch.mirrorOutro && ch.mirrorOutro[s]) || []) { await H.say(n, tok); }
    }
    // ③ 倒带
    await interstitial("rewind-it", "⏪ 倒 带", ch.rewindTip[s], "rewind", 2800);
    alive(tok);
    if (snap) { const keep = G.v.named; G.v = Object.assign({}, snap, { rel: clamp(snap.rel + relDelta, -50, 100), named: keep }); }
    shell(ch, s, "倒带"); track(ch[s], 2);
    UI.phase = "rewind";
    const start = Math.max(0, ch[s].findIndex(n => n.id === ch.rewindAt[s]));
    restoreScene(ch[s], start);
    note("⏪ 回到那一刻");
    await sleep(900); alive(tok);
    await runNodes(ch[s], start, tok);
    if (ch.after) { await runNodes(ch.after, 0, tok); }
  }

  async function review(ch, tok) {
    AU.bgm("home"); AU.heart(0); AU.amb(null);
    const s = G.start;
    const mine = G.history.filter(h => h.ch === G.ch && h.pov === s);
    const firstLive = mine.find(h => h.phase === "live"), lastRw = mine.slice().reverse().find(h => h.phase === "rewind");
    const imp = Object.keys(G.firsts).filter(k => k.startsWith(G.ch + ":" + s + ":")).map(k => G.firsts[k]);
    for (const p of ["A", "B"]) if (!G.cards.find(c => c.title === ch.cards[p].title)) G.cards.push(Object.assign({}, ch.cards[p], { pov: p, ch: ch.title }));
    save();
    AU.sfx("card");
    let qOpen = false;
    await new Promise(next => showPage(firstBg(ch[s]), {
      type: "review", title: ch.title,
      react: firstLive || imp.length ? {
        first: firstLive ? { text: `「${firstLive.text}」`, type: `（${firstLive.type}）` } : null,
        firstType: firstLive ? "" : imp[0].type,
        rw: lastRw ? { text: `「${lastRw.text}」`, type: `（${lastRw.type}）` } : null
      } : null,
      cards: ["A", "B"].map(p => Object.assign(portrait(p), { who: `🎴 ${POV[p].name}的技能卡`, title: ch.cards[p].title, points: ch.cards[p].points })),
      task: ch.tasks[s],
      questions: ch.questions || [],
      qToggle: { tap: () => { qOpen = !qOpen; ui.set({ "view.qOpen": qOpen }); } },
      qOpen: false,
      go: { text: G.ch + 1 < ST.chapters.length ? "下一章 ›" : "完成", tap: next }
    }));
    alive(tok);
  }

  async function ending(tok) {
    const E = ST.endings.find(e => !e.when || e.when(G)) || ST.endings[ST.endings.length - 1];
    await sleep(600); alive(tok);
    for (const l of val(E.lines, G) || []) {
      if (l.t === "scene") { UI.vn.scene(l); await sleep(400); continue; }
      bubble(l.who, esc(l.text), { chat: l.chat, group: l.group, expr: l.expr });
      if (l.chat) AU.sfx("msg_in");
      await cont(); alive(tok);
    }
    if (E.motif) { AU.bgm(null); AU.motif({ voices: E.motif, beatLen: 0.5 }); }
    await interstitial("title-it", `「${E.title}」`, E.text, null, 3200); alive(tok);
    G.ended = E.id; save();
    const retryCh = E.retry && ST.chapters.find(c => c.id === E.retry);
    return new Promise(r => showPage(UI.vn.bgId(), {
      type: "ending", story: `《${ST.title}》 · 结局`, title: `「${E.title}」`, text: E.text,
      pair: ["A", "B"].map(p => portrait(p, E.id === "low" ? "sad" : "smile")),
      stats: ST.endingStats ? ST.endingStats(G) : "",
      finalMsg: G.f.finalMsg ? `「${G.f.finalMsg}」` : "",
      cards: G.cards.map(c => ({ title: c.title, who: ` · ${POV[c.pov].name}` })),
      closing: ST.closing || "",
      btns: [
        E.retry ? { text: `⏪ 回到${retryCh ? retryCh.title : "上一章"}`, c: "btn plain", tap: () => r("retry:" + E.retry) } : null,
        { text: `从${POV[other(G.start)].name}的视角再玩一遍`, c: "btn ghost", tap: () => r("other") },
        { text: "回到首页", c: "btn", tap: () => r("home") }
      ]
    }));
  }

  // ---------- 全局进度条与目录 ----------
  // 进度 = (已完成章数 + 本章阶段进度) / 总章数；本章阶段进度 = (阶段序号 + 阶段内节点位置) / 阶段数
  const PROG = { k: 0, n: 1, f: 0, nodes: null };
  function track(nodes, k) { PROG.nodes = nodes; PROG.k = k; setProg(0); }
  function setProg(f) {
    PROG.f = f;
    ui.set({
      "prog.w": ((PROG.k + f) / PROG.n * 100).toFixed(1),
      "prog.pct": Math.round((G.ch + (PROG.k + f) / PROG.n) / ST.chapters.length * 100) + "%"
    });
  }
  function progBar() {
    ui.set({ prog: { segs: ST.chapters.map((c, k) => ({ k, c: k < G.ch ? "done" : k === G.ch ? "cur" : "", ticks: !c.noMirror && !c.seq })), w: "0", pct: "" } });
    setProg(PROG.f);
  }

  // 目录：任意章、任意阶段都能跳；pov 可以切换视角。fromHome = 从首页直接打开（关掉就回首页）
  function toc(fromHome) {
    let pov = G.start;
    const hide = () => { ui.drop("toc"); ui.set({ toc: null }); };
    const close = () => { hide(); if (fromHome) page.leave(); };
    function render() {
      const chips = (k, c) => (c.noMirror || c.seq ? [["live", "进入"]] : PHASES).map(([ph, label], pi) => {
        const seen = G.seen[`${pov}:${k}:${ph}`];
        const here = !fromHome && pov === G.start && k === G.ch && (c.noMirror || c.seq || pi === PROG.k);
        return { c: (seen ? " seen" : "") + (here ? " here" : ""), text: (here ? "▶ " : seen ? "✓ " : "") + (c.noMirror || c.seq ? label : `${pi + 1} ${label}`),
          tap: () => { hide(); jumpTo(k, pi, pov); } };
      });
      ui.drop("toc");
      ui.set({ toc: ui.strip({
        title: `《${ST.title}》`,
        listH: Math.min(ST.chapters.length * 100 + 10, 460),
        close: { tap: close },
        povs: ["A", "B"].map(p => ({ c: p === pov ? "on" : "", color: POV[p].color, av: SVG.head(POV[p].char), text: `${POV[p].name}（${POV[p].tag}）`, tap: () => { pov = p; render(); } })),
        rows: ST.chapters.map((c, k) => {
          const done = (c.noMirror || c.seq ? ["live"] : PHASES.map(p => p[0])).filter(ph => G.seen[`${pov}:${k}:${ph}`]).length;
          const cur = !fromHome && pov === G.start && k === G.ch;
          return { k, cur, thumb: SVG.bg(firstBg(c.seq || c[pov]) || "black"), title: c.title,
            sub: (c.sub || "") + (done ? ` · 已玩 ${done}/${c.noMirror || c.seq ? 1 : 3}` : ""), chips: chips(k, c) };
        })
      }, "toc") });
    }
    render();
  }

  function jumpTo(k, from, pov) {
    stopFlow();
    if (G._chStart) { const s0 = G._chStart; delete G._chStart; G = s0; }
    const meta = { snaps: G.snaps || {}, seen: G.seen || {} };
    const snap = meta.snaps[`${pov}:${k}`];
    if (snap) G = clone(snap);
    else if (pov !== G.start) G = fresh(pov);
    G.start = pov; G.ch = k; delete G.ended; G._from = from || 0;
    Object.assign(G, meta);
    save(); AU.unlock(); loop();
  }

  async function loop() {
    const tok = ++runToken;
    try {
      const chs = ST.chapters;
      while (G.ch < chs.length) {
        const ch = chs[G.ch];
        const from = G._from || 0; delete G._from;
        delete G._chStart;
        if (!from) { const rest = Object.assign({}, G); delete rest.snaps; delete rest.seen; G.snaps[`${G.start}:${G.ch}`] = clone(rest); save(); }
        G._chStart = clone(G);
        const r = await playChapter(ch, tok, from);
        alive(tok);
        if (r === "ending") {
          const next = await ending(tok);
          alive(tok);
          if (next.startsWith("retry:")) { G.ch = chs.findIndex(c => c.id === next.slice(6)); delete G.ended; save(); continue; }
          if (next === "other") { G = Object.assign(fresh(other(G.start)), { snaps: G.snaps, seen: G.seen }); save(); continue; }
          exit(); return;
        }
        if (!ch.noMirror) await review(ch, tok);
        G.ch++; save();
      }
      exit();
    } catch (e) {
      if (e.message !== "__exit__") { console.error(e); throw e; }
    }
  }

  function stopFlow() {
    runToken++;
    AU.heart(0); AU.amb(null);
    timers.forEach(clearTimeout); timers.clear();
    intervals.forEach(clearInterval); intervals.clear();
    clearTimeout(pulseT);
    if (UI && UI.vn) UI.vn.stop();
    clearPanel(); ui.drop("toc");
    ui.set({ inter: null, tcard: null, toc: null });
  }
  // 章中途退出：存回本章开始时的状态，下次从章首继续
  function saveOnExit() {
    if (G && G._chStart) { const s0 = G._chStart; delete G._chStart; G = s0; }
    if (G && ST) save();
  }
  function exit() { stopFlow(); saveOnExit(); disposed = true; page.leave(); }

  return {
    start(id, pov) { AU.unlock(); use(id); G = fresh(pov || ST.defaultStart || "A"); save(); loop(); },
    resume(id) { AU.unlock(); use(id); G = load(); if (!G) return false; G.snaps = G.snaps || {}; G.seen = G.seen || {}; loop(); return true; },
    // 首页打开目录：有存档就沿用，没有就按默认视角新建（不落盘，选了才落盘）
    toc(id) {
      use(id); G = load() || fresh(ST.defaultStart || "A"); G.snaps = G.snaps || {}; G.seen = G.seen || {};
      AU.bgm("home");
      showPage(ST.cover || firstBg(ST.chapters[0].seq || ST.chapters[0][G.start]), null);
      toc(true);
    },
    openToc() { if (G) toc(false); },
    exit,
    vn: () => UI && UI.vn,
    // 页面被关掉（系统返回键、左滑）：停掉流程并存档，不再跳转
    dispose() { if (disposed) return; disposed = true; stopFlow(); saveOnExit(); }
  };
};
