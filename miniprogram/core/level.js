// 日常练习关（网页版 demo/game.js › playLevel 的小程序版）：同一份 scenarios.js 数据，同一个进度存档。
const env = require("../shared/index.js");
const AU = require("./au");
const VN = require("./vn");
const store = require("./store");
const { routeVars } = require("./color");
const { esc } = require("./text");

// 练习关的角色立绘（art.js）与默认背景
const CAST = { "小雨": "xiaoyu", "妈妈": "mom", "小林": "xiaolin", "领导": "zhao", "室友": "roommate", "大刘": "daliu", "林可": "linke", "周老师": "teacher_zhou", "何女士": "client", "老周": "laozhou" };
const LEVEL_BG = { "t2f-1": "cafe", "t2f-2": "home_night", "t2f-3": "open_office" };
const meOf = (route, level) => level.me || (route.id === "t2f" ? "you_m" : /classroom|teacher|school/.test(level.bg || "") ? "you_sf" : "you_f");

// page 需提供：leave()、measureHud()
module.exports = function createLevel(page, ui) {
  let timers = [], vn = null, pulseT = 0, timerK = 0;
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; }
  const setAction = (blocks, opt) => ui.panel(blocks, opt);
  const clearAction = () => ui.panel(null);

  function playLevel(route, idx) {
    const level = route.levels[idx];
    const S = { route, level, idx, step: 0, meters: {}, got: 0, max: 0 };
    route.meters.forEach(m => { S.meters[m.key] = m.init; });

    clearTimers(); AU.heart(0);
    if (vn) vn.stop();
    vn = VN.mount(ui, { pov: { name: "你", char: meOf(route, level), color: route.color }, cast: CAST });
    clearAction();
    ui.drop("page");
    ui.set({ mode: "stage", result: null, rv: routeVars(route.color),
      hud: { title: `第 ${idx + 1} 关 · ${level.title}`, pov: level.skill, color: route.color, phase: "" } }, () => page.measureHud && page.measureHud());
    vn.scene({ bg: level.bg || LEVEL_BG[level.id] || "cafe" });
    vn.narr(esc(level.intro), "sys");
    paintMeters(false);

    function paintMeters(pulse) {
      ui.set({ meters: route.meters.map(m => {
        const v = Math.max(0, Math.min(100, Math.round(S.meters[m.key])));
        if (m.hot) AU.heart(v);
        return { k: m.key, label: m.label, v, color: m.hot ? `hsl(${120 - v * 1.2}, 65%, 50%)` : route.color };
      }) });
      if (pulse) {
        clearTimeout(pulseT);
        ui.set({ pulse: false });
        pulseT = setTimeout(() => { ui.set({ pulse: true }); pulseT = setTimeout(() => ui.set({ pulse: false }), 1300); }, 40);
      }
    }
    function apply(effects) {
      if (!effects) return;
      for (const k in effects) if (k in S.meters) S.meters[k] = Math.max(0, Math.min(100, S.meters[k] + effects[k]));
      paintMeters(true);
    }
    function say(who, text, kind, expr, tag) {
      if (kind === "sys") return vn.narr(esc(text), "sys");
      vn.line(who || "旁白", esc(text), { expr, tag });
    }
    function inner(who, text) { if (text) vn.line(who === "你" ? "内心" : who, esc(`（心里）${text}`), { expr: "sad" }); }
    function feedback(kind, title, text) { vn.coachCard(kind, title, text); }
    const nextBtn = (label, fn) => ({ k: "btns", items: [{ text: label || "继续 ›", c: "btn", tap: fn || next }] });
    function advance(fn) { vn.advance(() => (fn || next)()); }
    function next() { S.step++; run(); }

    function run() {
      clearTimers();
      clearAction();
      const st = level.steps[S.step];
      if (!st) return finish();
      const snap = Object.assign({}, S.meters);
      const rewind = msg => { S.meters = Object.assign({}, snap); paintMeters(true); say("", msg || "⏪ 时间倒回到刚才那一刻……", "sys"); };
      const H = handlers[st.type];
      if (!H) { console.warn("未知步骤类型", st.type); return next(); }
      H(st, rewind);
    }

    const handlers = {
      say(st) {
        if (st.bg) vn.setBg(st.bg);
        say(st.who, st.text, null, st.expr, st.tagline);
        apply(st.effects);
        advance();
      },

      read(st) {
        const picked = {}, ans = {};
        st.answer.forEach(a => { ans[a] = true; });
        let checked = null;
        const render = () => setAction([
          { k: "prompt", text: "🔍 " + st.prompt },
          { k: "chips", items: st.options.map(o => ({
            text: o, dis: !!checked,
            c: checked ? (picked[o] && ans[o] ? "hit" : picked[o] ? "miss" : ans[o] ? "lost" : "") : picked[o] ? "on" : "",
            tap: () => { if (picked[o]) delete picked[o]; else picked[o] = true; render(); }
          })) },
          checked ? { k: "feedback", c: checked.good ? "good" : "bad", title: checked.good ? "读得很准" : `${st.who}真实的感受是：${st.answer.join("、")}`, text: st.explain } : null,
          checked ? nextBtn() : { k: "btns", items: [{ text: "就是这些", c: "btn", dis: !Object.keys(picked).length, tap: check }] }
        ], { big: true, to: checked ? "pend" : "" });
        function check() {
          const hit = st.options.filter(o => picked[o] && ans[o]).length;
          const union = st.options.filter(o => picked[o] || ans[o]).length;
          const good = hit / union >= 0.66;
          S.max++; if (good) S.got++;
          checked = { good };
          render();
        }
        render();
      },

      choice(st, rewind) {
        let first = true;
        const tried = {};
        render();
        function render() {
          setAction([{ k: "prompt", text: st.prompt },
            { k: "opts", items: st.options.map((o, i) => ({ text: o.text, c: tried[i] ? "tried" : "", dis: !!tried[i], tap: () => pick(o, i) })) }]);
        }
        function pick(o, i) {
          if (first) { S.max++; if (o.good) S.got++; first = false; }
          AU.sfx(o.good ? "good" : "bad");
          clearAction();
          say("你", o.text, null, o.expr);
          apply(o.effects);
          const verdict = () => {
            feedback(o.good ? "good" : "bad", `${o.good ? "✓ " : ""}${o.tag}`, o.feedback);
            if (o.good) setAction([nextBtn()]);
            else {
              tried[i] = true;
              setAction([{ k: "btns", items: [{ text: "⏪ 倒带，换个说法", c: "btn", tap: () => { AU.sfx("rewind"); rewind("⏪ 时间倒回到刚才那一刻……换个说法试试"); render(); } }] }]);
            }
          };
          const afterReply = () => (o.inner && o.reply) ? (inner(o.reply.who, o.inner), advance(verdict)) : verdict();
          advance(() => { if (o.reply) { say(o.reply.who, o.reply.text, null, o.reply.expr || (o.good ? "smile" : "sad")); advance(afterReply); } else afterReply(); });
        }
      },

      impulse(st, rewind) {
        let first = true, hinted = false;
        render();
        function render() {
          const pause = { text: "⏸ " + (st.pauseText || "先停一下"), c: "pause" + (hinted ? " hint" : ""), tap: () => choose(null) };
          const opts = st.options.map(o => ({ text: o.text, c: "", tap: () => choose(o) }));
          // 暂停按钮随机插在冲动选项中间，不总在最显眼的位置
          opts.splice(hinted ? 0 : Math.floor(Math.random() * (opts.length + 1)), 0, pause);
          setAction([{ k: "prompt", text: "⚡ " + st.prompt }, { k: "timer", secs: st.seconds || 8, key: ++timerK },
            hinted ? { k: "muted", text: "提示：这一次，试试先停一下" } : null, { k: "opts", items: opts }]);
          const total = (st.seconds || 8) * 1000, t0 = Date.now(); let lastTick = -1;
          const iv = setInterval(() => {
            const left = 1 - (Date.now() - t0) / total;
            const slot = Math.floor((Date.now() - t0) / 500);
            if (slot !== lastTick) { lastTick = slot; AU.sfx("tick"); }
            if (left <= 0) { clearInterval(iv); choose(st.options[0], true); }
          }, 50);
          timers.push(iv);
        }
        function choose(o, timeout) {
          clearTimers();
          if (first) { S.max++; if (!o) S.got++; first = false; }
          clearAction();
          if (!o) { AU.sfx("mute_dive"); say("", "你停了下来。先停一下。", "sys"); return advance(); }
          if (timeout) say("", "⏱ 你还在犹豫——情绪替你做了选择", "sys");
          say("你", o.text);
          apply(o.effects);
          later(() => {
            feedback("bad", "后来……", o.consequence);
            feedback("info", "发生了什么？", "情绪上来的时候，大脑会催你立刻行动。冲动的动作往往很难撤回。");
            setAction([{ k: "btns", items: [{ text: "⏪ 倒回那一刻", c: "btn", tap: () => { AU.sfx("rewind"); hinted = true; rewind(); render(); } }] }]);
          }, 600);
        }
      },

      breathe(st) {
        const seq = [];
        for (let c = 0; c < (st.cycles || 2); c++) seq.push(["吸气", 4000, true], ["屏住", 2000, true], ["呼气", 4000, false]);
        let i = 0, finished = false, phase = "准备", inn = false, skipOn = false;
        const render = () => setAction([{ k: "breathe", phase, inn, skip: skipOn ? { tap: done } : null }]);
        render();
        function tick() {
          if (finished) return;
          if (i >= seq.length) return done();
          const [name, ms, isIn] = seq[i];
          phase = name; inn = isIn;
          if (name !== "屏住") AU.sfx(isIn ? "breath_in" : "breath_out");
          if (i === 3) skipOn = true;
          render();
          if (S.meters.temp != null && i % 3 === 2) apply({ temp: ((st.effects && st.effects.temp) || 0) / (st.cycles || 2) });
          i++;
          later(tick, ms);
        }
        later(tick, 500);
        function done() {
          if (finished) return;
          finished = true; clearTimers();
          // 提前结束的补齐剩余降温
          const total = (st.effects && st.effects.temp) || 0;
          const rest = total - Math.floor(i / 3) * (total / (st.cycles || 2));
          if (rest) apply({ temp: rest });
          clearAction();
          AU.sfx("unmute");
          say("", "🌬 呼——" + (st.text ? " " + st.text : ""), "sys");
          advance();
        }
      },

      sort(st) {
        const assign = {};
        const order = st.items.map((_, i) => i).sort(() => Math.random() - 0.5);
        let result = null;
        const render = () => setAction([
          { k: "prompt", text: "🧩 " + st.prompt },
          { k: "sort", rows: order.map(i => {
            const it = st.items[i], right = assign[i] === it.bin;
            return { text: it.text, c: result ? (right ? "ok" : "no") : "", ans: result && !right ? `→ 应该是「${it.bin}」` : "",
              bins: st.bins.map(b => ({ text: b, on: assign[i] === b, dis: !!result, tap: () => { assign[i] = b; render(); } })) };
          }) },
          result ? { k: "feedback", c: result.ratio >= 0.8 ? "good" : "info", title: `分对了 ${result.ok} / ${st.items.length}`, text: st.explain } : null,
          result ? nextBtn() : { k: "btns", items: [{ text: "分好了", c: "btn", dis: Object.keys(assign).length < st.items.length, tap: check }] }
        ], { big: true, to: result ? "pend" : "" });
        function check() {
          let ok = 0;
          order.forEach(i => { if (assign[i] === st.items[i].bin) ok++; });
          const ratio = ok / st.items.length;
          S.max++; if (ratio >= 0.8) S.got++;
          if (st.effects) { const e = {}; for (const k in st.effects) e[k] = Math.round(st.effects[k] * ratio); apply(e); }
          result = { ok, ratio };
          render();
        }
        render();
      },

      cards(st) {
        const opened = {};
        const render = () => setAction([
          { k: "prompt", text: "🃏 " + st.prompt },
          { k: "flips", items: st.items.map((c, i) => ({ front: c.front, back: c.back, open: !!opened[i], tap: opened[i] ? null : () => { opened[i] = true; render(); } })) },
          { k: "btns", items: [{ text: "继续 ›", c: "btn", dis: Object.keys(opened).length < st.items.length, tap: () => { apply(st.effects); next(); } }] }
        ], { big: true });
        render();
      },

      reveal(st) {
        vn.reveal({ title: "👁 另一个视角 · " + st.title, text: st.text });
        setAction([nextBtn("完成本关 ›")]);
      }
    };

    function finish() {
      clearTimers();
      AU.heart(0);
      vn.stop();
      const ratio = S.max ? S.got / S.max : 1;
      const stars = ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
      const progress = store.progress();
      progress.stars[level.id] = Math.max(progress.stars[level.id] || 0, stars);
      progress.cards[level.id] = true;
      store.saveProgress(progress);
      const nextLevel = route.levels[idx + 1];
      clearAction();
      ui.drop("page");
      ui.set({ mode: "result", rv: routeVars(route.color), result: ui.strip({
        head: `第 ${idx + 1} 关 · ${level.title}`,
        stars: [0, 1, 2].map(i => (i < stars ? "" : "off")),
        got: `第一反应就选对了 ${S.got} / ${S.max} 处`,
        meters: route.meters.map(m => `${m.label} ${Math.round(S.meters[m.key])}`).join("　"),
        color: route.color,
        card: level.takeaway,
        note: stars < 3 ? "倒带过不丢人——在游戏里试错，正是为了在生活里少走弯路。" : "很棒！试着在这周的生活里，找一个类似的时刻用上它。",
        btns: [
          { text: "再玩一次", c: "btn plain", tap: () => playLevel(route, idx) },
          nextLevel ? { text: `下一关：${nextLevel.title} ›`, c: "btn", tap: () => playLevel(route, idx + 1) }
            : { text: "路线完成 🎉", c: "btn", tap: () => page.leave() }
        ]
      }, "page") });
    }

    run();
  }

  return {
    play(routeId, idx) {
      AU.unlock();
      const route = env.ROUTES[routeId] || env.ROUTES[Object.keys(env.ROUTES)[0]];
      playLevel(route, Math.max(0, Math.min(route.levels.length - 1, idx || 0)));
    },
    vn: () => vn,
    dispose() { clearTimers(); clearTimeout(pulseT); AU.heart(0); if (vn) vn.stop(); }
  };
};
