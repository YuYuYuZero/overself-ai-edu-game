// 故事引擎（视觉小说式）：经历 → 镜面 → 倒带 → 复盘。数据在 story-*.js（window.STORIES），舞台在 vn.js。
window.Story = (function () {
  const app = document.getElementById("app");
  const METER = { aware: { label: "觉察", color: "#4a8fe0" }, temp: { label: "情绪温度", hot: true } };
  const other = p => (p === "A" ? "B" : "A");
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const val = (x, G) => (typeof x === "function" ? x(G) : x);
  const clone = o => JSON.parse(JSON.stringify(o));

  let ST = null;       // 当前故事
  let POV = null;      // 当前故事的两个视角
  let G = null;        // 全局存档状态
  let UI = null;       // 当前屏幕的 DOM 引用
  let onExit = null;   // 回到首页的回调
  let runToken = 0;    // 退出时让正在跑的异步流程失效

  function fresh(start) {
    return { story: ST.id, start, ch: 0, v: { rel: 0, tempA: 20, tempB: 20, aware: 10, named: 0 }, f: {}, picks: {}, firsts: {}, cards: [], history: [], snaps: {}, seen: {} };
  }
  function save() { try { localStorage.setItem(ST.key, JSON.stringify(G)); } catch (e) {} }
  function load(st) { try { return JSON.parse(localStorage.getItem((st || ST).key)); } catch (e) { return null; } }
  function use(id) { ST = window.STORIES[id]; POV = ST.POV; }

  // ---------- DOM ----------
  const el = VN.el;
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  // 标记：[事实] 在滤镜下模糊；**情绪词** 在滤镜下放大；==回听高亮==
  function markup(text, filtered) {
    return esc(text)
      .replace(/\[(.+?)\]/g, (_, s) => filtered ? `<span class="blurred">${s}</span>` : s)
      .replace(/\*\*(.+?)\*\*/g, (_, s) => filtered ? `<strong class="hotword">${s}</strong>` : s)
      .replace(/==(.+?)==/g, (_, s) => `<mark class="fact">${s}</mark>`);
  }
  function waitClick(btn) { return new Promise(r => btn.addEventListener("click", r, { once: true })); }
  function alive(tok) { if (tok !== runToken) throw new Error("__exit__"); }
  // 交互面板（选项、分类、拼句……）放在对话框上方
  function panel(...kids) { UI.action.innerHTML = ""; const box = el("div", { class: "action" }, ...kids); UI.action.append(box); return box; }
  function clearPanel() { UI.action.innerHTML = ""; }

  // ---------- 外壳 ----------
  function shell(ch, pov, phaseLabel) {
    document.documentElement.style.setProperty("--route", POV[pov].color);
    document.body.className = "story vn pov-" + pov;
    const meters = el("div", { class: "meters" });
    const caughtBadge = el("span", { class: "caught" });
    app.innerHTML = "";
    const hud = el("div", { class: "hud" },
      el("button", { class: "back", title: "存档退出", onclick: exit }, "‹ ", el("span", { class: "tl" }, "存档退出")),
      el("button", { class: "back toc-btn", title: "目录", onclick: () => toc() }, ["☰ ", el("span", { class: "tl" }, "目录 "), el("span", { class: "toc-pct" })]),
      el("div", { class: "level-head" }, el("h2", {}, ch.title)),
      el("div", { class: "pov-badge", style: `background:${POV[pov].color}` }, `${POV[pov].name} · ${POV[pov].tag}`, phaseLabel ? el("span", { class: "phase-tag" }, phaseLabel) : null),
      meters,
      el("button", { class: "back log-btn", onclick: () => UI.vn.showBacklog() }, "回看"));
    const vn = VN.mount(app, { pov: POV[pov], cast: ST.cast });
    vn.stage.prepend(hud, progBar());
    vn.stage.append(el("div", { class: "vignette" }));
    UI = { ch, pov, vn, meters, action: vn.action, caughtBadge, keys: (ch.meters && ch.meters[pov]) || [] };
    G.seen[`${G.start}:${G.ch}:${phaseKey(phaseLabel)}`] = 1;
    paintMeters();
  }
  function curTemp() { return UI.pov === "A" ? G.v.tempA : G.v.tempB; }
  function paintMeters(pulse) {
    const box = UI.meters; box.innerHTML = "";
    box.style.display = UI.keys.length ? "" : "none";
    for (const k of UI.keys) {
      const m = METER[k], v = k === "temp" ? curTemp() : G.v[k];
      const val = Math.max(0, Math.min(100, Math.round(v)));
      const fill = el("div", { class: "fill", style: `width:${val}%;background:${m.hot ? `hsl(${120 - val * 1.2},65%,50%)` : m.color}` });
      box.append(el("div", { class: "meter" + (pulse ? " pulse" : "") }, el("div", { class: "lbl" }, el("span", {}, m.label), el("span", {}, val)), el("div", { class: "bar" }, fill)));
    }
    UI.caughtBadge.textContent = UI.caught && UI.caught.size ? `🔍 ${UI.caught.size}` : "";
    if (UI.keys.length) box.append(UI.caughtBadge);
    const t = UI.keys.includes("temp") ? curTemp() : 0;
    document.body.classList.toggle("hot", t >= 60);
    document.body.classList.toggle("very-hot", t >= 80);
    AU.heart(UI.keys.includes("temp") ? t : 0);
  }
  function apply(fx) {
    fx = val(fx, G);
    if (!fx) return;
    for (const [k, d] of Object.entries(fx)) {
      if (k === "temp") { const key = UI.pov === "A" ? "tempA" : "tempB"; G.v[key] = clamp(G.v[key] + d, 0, 100); }
      else if (k === "rel") G.v.rel = clamp(G.v.rel + d, -50, 100);
      else G.v[k] = clamp((G.v[k] || 0) + d, 0, 100);
    }
    paintMeters(true);
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function setFlags(s) { s = val(s, G); if (s) Object.assign(G.f, s); }

  // ---------- 对白 ----------
  // who：旁白 / 内心 / 你 / 角色名。旁白以漫画字幕叠在背景上，角色说话时立绘亮起。
  function bubble(who, html, opts = {}) {
    return UI.vn.line(who, html, { expr: opts.expr, call: opts.call, chat: opts.chat, group: opts.group, tag: opts.tag, kind: opts.kind });
  }
  function note(text) { UI.vn.narr(esc(text), "sys"); }
  function decodeBox(text, inner) {
    AU.sfx("decode_low");
    UI.vn.decode(text);
    if (inner) UI.vn.sigLayer.lastChild.append(el("div", { class: "di" }, "心里：" + inner));
  }

  // 情绪信号：短暂出现，点击捕捉
  function showSignals(list) {
    if (!list || !list.length) return;
    const tok = runToken;
    const wrap = el("div", { class: "sigs" });
    UI.vn.sigLayer.append(wrap);
    list.forEach((s, i) => {
      if (s.hideHot && curTemp() >= 60) return;
      setTimeout(() => {
        if (tok !== runToken) return;
        const mult = (UI.phase === "rewind" ? 2 : 1) * (UI.pov === "A" ? 1 : 1.2);
        const glow = s.glow || UI.phase === "rewind";
        const chip = el("button", { class: "sig" + (glow ? " glow" : "") + (s.self ? " self" : "") + (UI.pov === "A" ? " faint" : "") }, `（${s.text}）`);
        let done = false;
        chip.onclick = () => {
          if (done) return; done = true;
          if (s.fake) { chip.classList.add("fake"); chip.textContent = "（这条和情绪无关）"; AU.sfx("signal_miss"); setTimeout(() => chip.remove(), 1200); return; }
          UI.caught.add(s.id); chip.classList.add("got"); chip.textContent = `🔍 ${s.text}`;
          AU.sfx("signal"); if (UI.pov === "A") apply({ aware: 3 }); else paintMeters();
          UI.onCatch && UI.onCatch();
          setTimeout(() => chip.remove(), 1600);
        };
        wrap.append(chip);
        setTimeout(() => { if (!done) { done = true; chip.classList.add("gone"); AU.sfx("signal_miss"); setTimeout(() => chip.remove(), 600); } }, s.dur * 1000 * mult);
      }, 500 + i * 700);
    });
  }

  function cont(label) {
    const b = el("button", { class: "btn adv" }, label || "▼");
    UI.vn.advance.innerHTML = ""; UI.vn.advance.append(el("div", { class: "next-row" }, b));
    return waitClick(b).then(() => { UI.vn.advance.innerHTML = "";});
  }
  async function replies(list, tok, o = {}) {
    for (const r of list || []) {
      const [who, text, expr] = r;
      await sleep(450); alive(tok);
      bubble(who, esc(text), { expr, chat: o.chat && who !== "旁白", call: o.call && who !== "旁白" && who !== "内心" });
      await cont(); alive(tok);
    }
  }

  // ---------- 节点处理 ----------
  const H = {
    async scene(n) {
      if (n.bgm !== undefined) AU.bgm(n.bgm === null ? null : n.bgm || POV[UI.pov].bgm);
      if (n.amb !== undefined) AU.amb(n.amb);
      if (n.sfx) AU.sfx(n.sfx);
      if (UI.board && (n.bg || n.chars)) { UI.board.remove(); UI.board = null; }
      UI.vn.scene({ bg: n.bg, chars: n.chars, text: n.text });
      await sleep(n.bg ? 500 : 150);
    },
    async title(n) {
      // 关键旁白：黑屏白字
      const t = el("div", { class: "title-card" }, el("div", { class: "tt" }, n.text));
      document.body.append(t);
      await sleep(Math.max(2400, n.text.length * 160)); t.classList.add("out"); await sleep(500); t.remove();
    },
    async tip(n) {
      panel(el("div", { class: "tipbox" }, "💡 " + n.text), el("div", { class: "next-row" }, el("button", { class: "btn", onclick: e => e.target.dispatchEvent(new CustomEvent("ok", { bubbles: true })) }, "知道了")));
      await new Promise(r => UI.action.addEventListener("ok", r, { once: true }));
      clearPanel();
    },
    async table(n) {
      if (UI.board) UI.board.remove();
      UI.board = el("div", { class: "board" }, el("table", { class: "dtable" }, n.rows.map((r, i) => el("tr", {}, r.map(c => el(i ? "td" : "th", {}, c))))));
      UI.vn.stage.append(UI.board);
      await sleep(400);
    },
    async say(n, tok) {
      if (n.preFx) apply(n.preFx);
      if (n.sfx) AU.sfx(n.sfx);
      const filtered = n.filter && UI.pov === "B" && curTemp() >= 60;
      if (n.replayKey) UI.replays[n.replayKey] = n;
      const { b } = bubble(n.who, markup(n.text, filtered), n);
      if (filtered) b.classList.add("filtered");
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
      bubble(n.who, esc(n.lines[k] || n.lines[n.def]), { ...n, expr: n.expr && (n.expr[k] || n.expr) });
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
          panel(n.prompt ? el("div", { class: "prompt" }, n.prompt) : null,
            ...opts.map(o => el("button", { class: "opt" + (o.req || o.reqAny ? " unlocked" : ""), onclick: () => { UI.onCatch = null; clearPanel(); resolve(o); } },
              (o.req || o.reqAny) ? el("span", { class: "lock" }, "🔍 ") : null, o.text)));
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
          const bar = el("div", { class: "t" });
          const pauseBtn = el("button", { class: "opt" + (hinted ? " pause hint" : ""), onclick: () => done(null) }, (hinted ? "⏸ " : "") + (n.pauseText || "先停一下"));
          const btns = n.opts.map(o => el("button", { class: "opt impulse-opt", onclick: () => done(o) }, o.text));
          btns.splice(hinted ? 0 : Math.floor(Math.random() * (btns.length + 1)), 0, pauseBtn);
          panel(el("div", { class: "prompt" }, "⚡ " + n.prompt), el("div", { class: "timer" }, bar),
            hinted ? el("div", { class: "muted small", style: "margin-bottom:6px" }, "这一次，试试先停一下") : null, ...btns);
          const total = n.secs * 1000, t0 = Date.now(); let lastTick = 0;
          const iv = setInterval(() => {
            if (tok !== runToken) { clearInterval(iv); return; }
            const left = 1 - (Date.now() - t0) / total;
            bar.style.width = Math.max(0, left * 100) + "%";
            const step = left < 0.35 ? 180 : 400;
            if (Date.now() - lastTick > step) { AU.sfx("tick"); lastTick = Date.now(); }
            if (left <= 0) done(n.opts[0], true);
          }, 50);
          function done(o, timeout) { clearInterval(iv); resolve({ o, timeout }); }
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
        const b = el("button", { class: "btn" }, "⏪ 倒回那一刻");
        panel(el("div", { class: "next-row" }, b));
        await waitClick(b); alive(tok); clearPanel();
        AU.sfx("rewind"); G.v = clone(snap); paintMeters(true);
        UI.vn.stage.classList.add("rewinding"); await sleep(700); UI.vn.stage.classList.remove("rewinding");
        note("⏪ 时间倒回到刚才那一刻……"); hinted = true;
        await sleep(600); alive(tok);
      }
    },
    async breathe(n, tok) {
      const circle = el("div", { class: "circle" }), phase = el("div", { class: "phase" }, "准备");
      const skip = el("button", { class: "btn plain", style: "visibility:hidden" }, "我平静下来了");
      UI.vn.stage.classList.add("underwater");
      panel(el("div", { class: "breathe" }, el("div", { class: "muted" }, "跟着圆圈呼吸"), circle, phase, skip));
      const cycles = n.cycles || 2, total = (val(n.fx, G) || {}).temp || 0; let appliedC = 0, skipped = false;
      skip.onclick = () => { skipped = true; };
      for (let c = 0; c < cycles && !skipped; c++) {
        for (const [name, ms, inn, s] of [["吸气", 4000, true, "breath_in"], ["屏住", 2000, true, null], ["呼气", 4000, false, "breath_out"]]) {
          if (skipped) break;
          phase.textContent = name; circle.classList.toggle("in", inn); if (s) AU.sfx(s);
          const t0 = Date.now(); while (Date.now() - t0 < ms && !skipped) { await sleep(100); alive(tok); }
        }
        appliedC++; apply({ temp: total / cycles });
        skip.style.visibility = "visible";
      }
      if (appliedC < cycles) apply({ temp: total * (cycles - appliedC) / cycles });
      AU.sfx("unmute");
      UI.vn.stage.classList.remove("underwater");
      clearPanel();
      UI.vn.narr(esc(n.text ? "呼——<br>" + n.text : "呼——").replace(/&lt;br&gt;/g, "<br>"), "breath");
      await cont();
    },
    async replay(n, tok) {
      const b = el("button", { class: "btn ghost" }, `🔁 回听${n.who}刚才说的`);
      panel(el("div", { class: "next-row", style: "justify-content:center" }, b));
      await waitClick(b); alive(tok); clearPanel();
      AU.sfx("tape_rewind");
      UI.vn.stage.classList.add("rewinding"); await sleep(800); UI.vn.stage.classList.remove("rewinding");
      const { b: bb } = bubble(n.who, markup(n.text, false), { expr: n.expr });
      bb.classList.add("replayed"); AU.sfx("signal");
      if (n.fx) apply(n.fx);
      await cont();
      for (const t of n.after || []) { alive(tok); bubble("内心", esc(t)); await cont(); }
    },
    async sort(n, tok) {
      const assign = new Map();
      const order = n.items.map((_, i) => i).sort(() => Math.random() - 0.5);
      const submit = el("button", { class: "btn", disabled: true }, "分好了");
      const rows = order.map(i => {
        const [text] = n.items[i];
        const bins = n.bins.map(b => el("button", { class: "bin", onclick: () => { assign.set(i, b); bins.forEach(x => x.classList.toggle("on", x.textContent === b)); submit.disabled = assign.size < n.items.length; } }, b));
        const r = el("div", { class: "sort-row" }, el("div", { class: "txt" }, text), el("div", { class: "bins" }, bins)); r._i = i; r._b = bins; return r;
      });
      const box = panel(el("div", { class: "prompt" }, "🧩 " + n.prompt), ...rows, el("div", { class: "next-row" }, submit));
      box.classList.add("big");
      await waitClick(submit); alive(tok);
      let ok = 0;
      rows.forEach(r => { const right = assign.get(r._i) === n.items[r._i][1]; r._b.forEach(b => b.disabled = true); r.classList.add(right ? "ok" : "no"); if (right) ok++; else r.append(el("div", { class: "ans" }, `→ 应该是「${n.items[r._i][1]}」`)); });
      submit.remove();
      const ratio = ok / n.items.length;
      const fx = val(n.fx, G); if (fx) { const e = {}; for (const k in fx) e[k] = Math.round(fx[k] * ratio); apply(e); }
      AU.sfx(ratio >= 0.8 ? "good" : "page_turn");
      box.append(el("div", { class: "feedback " + (ratio >= 0.8 ? "good" : "info") }, el("div", { class: "ft" }, `分对了 ${ok} / ${n.items.length}`), n.explain));
      const b = el("button", { class: "btn" }, "继续 ›"); box.append(el("div", { class: "next-row" }, b)); box.scrollTop = box.scrollHeight;
      await waitClick(b); clearPanel();
    },
    // 排序：依次点选，按每项离正确位置的距离计分
    async rank(n, tok) {
      const order = n.items.map((_, i) => i).sort(() => Math.random() - 0.5);
      const seq = [];
      const submit = el("button", { class: "btn", disabled: true }, "排好了");
      const reset = el("button", { class: "btn plain" }, "重排");
      const btns = order.map(i => {
        const b = el("button", { class: "rank-item" }, el("span", { class: "rn" }, ""), el("span", {}, n.items[i][0]));
        b.onclick = () => { if (seq.includes(i)) return; seq.push(i); b.classList.add("on"); b.firstChild.textContent = seq.length; submit.disabled = seq.length < n.items.length; };
        b._i = i; return b;
      });
      reset.onclick = () => { seq.length = 0; btns.forEach(b => { b.classList.remove("on"); b.firstChild.textContent = ""; }); submit.disabled = true; };
      const box = panel(el("div", { class: "prompt" }, "🔢 " + n.prompt), el("div", { class: "rank-list" }, btns), el("div", { class: "next-row" }, reset, submit));
      box.classList.add("big");
      await waitClick(submit); alive(tok);
      reset.remove(); submit.remove();
      const N = n.items.length; let dist = 0;
      seq.forEach((i, pos) => { dist += Math.abs(n.items[i][1] - pos); });
      const ratio = Math.max(0, 1 - dist / Math.max(1, Math.floor(N * N / 2)));
      btns.forEach(b => { const right = seq.indexOf(b._i) === n.items[b._i][1]; b.classList.add(right ? "ok" : "no"); b.disabled = true;
        if (!right) b.append(el("em", { class: "ans" }, ` → 第 ${n.items[b._i][1] + 1}`)); });
      G.picks[n.id || "rank"] = Math.round(ratio * 100);
      const fx = val(n.fx, G); if (fx) { const e = {}; for (const k in fx) e[k] = Math.round(fx[k] * ratio); apply(e); }
      AU.sfx(ratio >= 0.8 ? "good" : "page_turn");
      box.append(el("div", { class: "feedback " + (ratio >= 0.8 ? "good" : "info") }, el("div", { class: "ft" }, ratio >= 0.999 ? "顺序全对" : `顺序吻合度 ${Math.round(ratio * 100)}%`), n.explain));
      const b = el("button", { class: "btn" }, "继续 ›"); box.append(el("div", { class: "next-row" }, b)); box.scrollTop = box.scrollHeight;
      await waitClick(b); clearPanel();
    },
    async qa(n, tok) {
      const who = n.who || "王医生";
      note(n.intro || `向${who}提问（选 ${n.pick} 个）`);
      await sleep(300);
      let asked = 0; const used = new Set();
      while (asked < n.pick) {
        const q = await new Promise(res => {
          panel(el("div", { class: "prompt" }, `还能问 ${n.pick - asked} 个`), ...n.qs.map((q, i) => el("button", { class: "opt", disabled: used.has(i), onclick: () => res(i) }, q.q)));
        });
        alive(tok); used.add(q); asked++; clearPanel();
        const item = n.qs[q];
        bubble("你", esc(item.q), { call: n.call }); await cont(); alive(tok);
        bubble(who, esc(item.a), { call: n.call, expr: item.expr }); apply(item.fx); setFlags(item.set);
        if (item.key) AU.sfx("signal");
        await cont(); alive(tok);
      }
    },
    async body(n, tok) {
      const named = new Set();
      const fig = el("div", { class: "figure", html: window.ART.char(POV[UI.pov].char, "worry") });
      const parts = n.parts.map(p => {
        const btn = el("button", { class: "part" }, el("b", {}, p.name), el("span", {}, p.desc));
        btn.onclick = () => {
          if (named.has(p.name)) return;
          const words = el("div", { class: "chips", style: "margin-top:8px" }, p.words.map(w => el("button", { class: "chip", onclick: () => {
            named.add(p.name); words.remove();
            const ok = p.ok.includes(w);
            if (ok) { G.v.named = (G.v.named || 0) + 1; apply({ aware: 5 }); AU.sfx("signal"); } else AU.sfx("page_turn");
            btn.classList.add(ok ? "named" : "named-off");
            btn.append(el("em", {}, ` → ${w}`));
            if (named.size === n.parts.length) finish();
          } }, w)));
          btn.after(words);
        };
        return btn;
      });
      const box = panel(el("div", { class: "tipbox" }, "💡 " + n.prompt), el("div", { class: "body-panel" }, fig, el("div", { class: "parts" }, parts)));
      box.classList.add("big");
      let finish; const done = new Promise(r => finish = r);
      await done; alive(tok);
      await sleep(400);
      clearPanel();
      bubble("内心", esc(n.after));
      await cont();
    },
    async compose(n, tok) {
      const slots = n.slotsBy ? n.slotsBy[UI.pov] : n.slots;
      const sel = slots.map(() => null);
      const preview = el("div", { class: "compose-preview" }, "（还没选）");
      const send = el("button", { class: "btn", disabled: true }, n.msg ? "发送" : "说出口");
      const cols = slots.map((s, si) => el("div", { class: "cslot" }, el("div", { class: "muted small" }, s.label),
        ...s.opts.map(([t], oi) => el("button", { class: "chip", onclick: () => {
          sel[si] = oi; cols[si].querySelectorAll(".chip").forEach((x, xi) => x.classList.toggle("on", xi === oi));
          preview.textContent = sel.map((x, i) => x == null ? "____" : slots[i].opts[x][0]).join("");
          send.disabled = sel.some(x => x == null);
        } }, t))));
      const box = panel(el("div", { class: "prompt" }, "✍️ " + n.prompt), el("div", { class: "compose" }, cols), preview, el("div", { class: "next-row" }, send));
      box.classList.add("big");
      await waitClick(send); alive(tok); clearPanel();
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
      const card = el("div", { class: "reveal-card" }, el("div", { class: "rt" }, n.title), el("div", { class: "handwrite" }, n.text));
      UI.vn.stage.append(card);
      await sleep(600); await cont(); card.remove();
    },
    async voice(n, tok) {
      const lines = val(n.text, G);
      const bar = el("button", { class: "voice" }, el("span", {}, "▶"), el("span", { class: "wave" }, "▁▂▃▅▃▂▁▂▅▆▃▂▁▂▃"), el("span", {}, `${n.secs}″`));
      const { b } = bubble(n.who, "", { chat: true, group: n.group });
      b.append(bar);
      panel(el("div", { class: "muted small", style: "text-align:center" }, "点击语音条收听"));
      await waitClick(bar); alive(tok); clearPanel();
      bar.classList.add("playing"); AU.motif({ voices: ["warm"], beatLen: 0.6 });
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
      const type = n.t;
      const h = H[type];
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
    const t = el("div", { class: "interstitial " + cls }, el("div", { class: "it" }, title), sub ? el("div", { class: "is" }, sub) : null);
    document.body.append(t);
    await sleep(ms); t.remove();
  }
  const firstBg = nodes => (nodes || []).find(n => n.bg)?.bg;
  // 不在舞台上的页面（章首、复盘、结局）：铺一层虚化的场景背景
  function page(bgId, ...kids) {
    app.innerHTML = "";
    document.body.className = "story page-mode";
    document.documentElement.style.setProperty("--route", "#6b5bd2");
    app.append(el("div", { class: "page-bg", html: bgId ? window.ART.bg(bgId) : "" }),
      progBar(), el("div", { class: "page-bar" }, el("button", { class: "back", title: "存档退出", onclick: exit }, "‹ ", el("span", { class: "tl" }, "存档退出")), el("button", { class: "back toc-btn", title: "目录", onclick: () => toc() }, ["☰ ", el("span", { class: "tl" }, "目录 "), el("span", { class: "toc-pct" })])),
      el("div", { class: "page" }, ...kids));
    window.scrollTo(0, 0);
  }
  function portrait(p, expr) { return el("div", { class: "portrait", style: `--c:${POV[p].color}`, html: window.ART.char(POV[p].char, expr || "normal", { crop: "head" }) }); }
  async function chapterIntro(ch, tok) {
    AU.bgm("home");
    const s = G.start;
    const b = el("button", { class: "btn" }, "开始");
    page(firstBg(ch.seq || ch[s]), el("div", { class: "chapter-intro" },
      el("div", { class: "muted" }, `《${ST.title}》 · ${ch.sub || ""}`),
      el("h1", {}, ch.title),
      ch.goal ? el("div", { class: "goal" },
        ...["A", "B"].map(p => el("div", { class: "goal-row" }, portrait(p), el("div", {}, el("b", { style: `color:${POV[p].color}` }, `${POV[p].short}这一章要学会`), el("div", {}, ch.goal[p]))))) : null,
      el("p", { class: "muted small" }, ch.noMirror ? `你将以${POV[s].name}的视角进入。` : `先以${POV[s].name}的视角经历，再从${POV[other(s)].name}的眼睛重看一遍，最后倒带。`),
      b));
    await waitClick(b); alive(tok);
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
    if (ch.seq) { shell(ch, s, ""); track(ch.seq, 0); UI.phase = "live"; UI.caught = new Set(); UI.replays = {}; return runNodes(ch.seq, 0, tok); }
    const init = val(ch.init, G) || {};
    Object.assign(G.v, init);
    let snap = null;
    // ① 经历
    if (from <= 0) {
      shell(ch, s, ch.noMirror ? "" : "经历"); track(ch[s], 0);
      UI.phase = "live"; UI.caught = new Set(); UI.replays = {};
      await runNodes(ch[s], 0, tok, { at: ch.rewindAt && ch.rewindAt[s], onAt: () => { snap = clone(G.v); } });
      if (ch.noMirror) return;
    }
    // ② 镜面
    let relDelta = 0;
    if (from <= 1) {
      await interstitial("mirror-it", "镜 面", `现在，换成${POV[o].name}的眼睛。你刚才说的每一句话，${POV[o].short}都会听到。`, "mirror", 3400);
      const relBefore = G.v.rel;
      const tk = o === "A" ? "tempA" : "tempB";
      if (init[tk] != null) G.v[tk] = init[tk];
      shell(ch, o, "镜面"); track(ch[o], 1);
      UI.phase = "mirror"; UI.caught = new Set(); UI.replays = {};
      await runNodes(ch[o], 0, tok);
      relDelta = G.v.rel - relBefore;
      for (const n of (ch.mirrorOutro && ch.mirrorOutro[s]) || []) { await H.say(n, tok); }
    }
    // ③ 倒带
    await interstitial("rewind-it", "⏪ 倒 带", ch.rewindTip[s], "rewind", 2800);
    if (snap) { const keep = G.v.named; G.v = { ...snap, rel: clamp(snap.rel + relDelta, -50, 100), named: keep }; }
    shell(ch, s, "倒带"); track(ch[s], 2);
    UI.phase = "rewind"; UI.caught = new Set(); UI.replays = {};
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
    const firstLive = mine.find(h => h.phase === "live"), lastRw = [...mine].reverse().find(h => h.phase === "rewind");
    const imp = Object.entries(G.firsts).filter(([k]) => k.startsWith(G.ch + ":" + s + ":")).map(([, v]) => v);
    for (const p of ["A", "B"]) if (!G.cards.find(c => c.title === ch.cards[p].title)) G.cards.push({ ...ch.cards[p], pov: p, ch: ch.title });
    save();
    AU.sfx("card");
    const b = el("button", { class: "btn" }, G.ch + 1 < ST.chapters.length ? "下一章 ›" : "完成");
    page(firstBg(ch[s]),
      el("div", { class: "card result" }, el("div", { class: "muted small" }, "复盘"), el("h2", {}, ch.title)),
      firstLive || imp.length ? el("div", { class: "card" },
        el("div", { class: "muted small" }, "你的自然反应"),
        firstLive ? el("p", {}, "第一次：", el("b", {}, `「${firstLive.text}」`), el("span", { class: "muted" }, `（${firstLive.type}）`)) : el("p", {}, `第一次：${imp[0].type}`),
        lastRw ? el("p", {}, "倒带后：", el("b", {}, `「${lastRw.text}」`), el("span", { class: "muted" }, `（${lastRw.type}）`)) : null,
        el("p", { class: "muted small" }, "第一次的反应没有对错——那是你习惯的方式。倒带后的选择，是你多出来的那一种。")) : null,
      ...["A", "B"].map(p => el("div", { class: "card takeaway", style: `border-left:5px solid ${POV[p].color}` },
        el("div", { class: "card-head" }, portrait(p), el("div", {}, el("div", { class: "muted small" }, `🎴 ${POV[p].name}的技能卡`), el("h3", {}, ch.cards[p].title))),
        el("ul", {}, ch.cards[p].points.map(x => el("li", {}, x))))),
      el("div", { class: "feedback info" }, el("div", { class: "ft" }, "📌 本周小任务"), ch.tasks[s]),
      el("details", { class: "card" }, el("summary", {}, "讨论题（课堂 / 小组用）"), el("ol", {}, ch.questions.map(q => el("li", {}, q)))),
      el("div", { class: "next-row", style: "justify-content:center" }, b));
    await waitClick(b); alive(tok);
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
    const again = E.retry ? el("button", { class: "btn plain" }, `⏪ 回到${ST.chapters.find(c => c.id === E.retry)?.title || "上一章"}`) : null;
    const other2 = el("button", { class: "btn ghost" }, `从${POV[other(G.start)].name}的视角再玩一遍`);
    const home = el("button", { class: "btn" }, "回到首页");
    page(UI.vn.bgId(),
      el("div", { class: "card result ending" }, el("div", { class: "muted small" }, `《${ST.title}》 · 结局`), el("h1", {}, `「${E.title}」`), el("p", {}, E.text),
        el("div", { class: "ending-pair" }, portrait("A", E.id === "low" ? "sad" : "smile"), portrait("B", E.id === "low" ? "sad" : "smile"))),
      el("div", { class: "card" }, el("div", { class: "muted small" }, "这一路"),
        el("p", {}, ST.endingStats ? ST.endingStats(G) : ""),
        G.f.finalMsg ? el("p", {}, "你最后发出的消息：", el("b", {}, `「${G.f.finalMsg}」`)) : null),
      el("div", { class: "card" }, el("div", { class: "muted small" }, `🎴 收集的技能卡（${G.cards.length}）`), el("ul", {}, G.cards.map(c => el("li", {}, `${c.title}`, el("span", { class: "muted small" }, ` · ${POV[c.pov].name}`))))),
      el("div", { class: "card reveal" }, el("p", { style: "line-height:1.9;margin:0" }, ST.closing)),
      el("div", { class: "row", style: "justify-content:center" }, again, other2, home));
    G.ended = E.id; save();
    return new Promise(r => {
      if (again) again.onclick = () => r("retry:" + E.retry);
      other2.onclick = () => r("other"); home.onclick = () => r("home");
    });
  }

  // ---------- 全局进度条与目录 ----------
  // 进度 = (已完成章数 + 本章阶段进度) / 总章数；本章阶段进度 = (阶段序号 + 阶段内节点位置) / 阶段数
  const PROG = { k: 0, n: 1, f: 0, nodes: null };
  const PHASES = [["live", "经历"], ["mirror", "镜面"], ["rewind", "倒带"]];
  const phaseKey = label => (PHASES.find(p => p[1] === label) || PHASES[0])[0];
  function track(nodes, k) { PROG.nodes = nodes; PROG.k = k; setProg(0); }
  function setProg(f) {
    PROG.f = f;
    const seg = document.querySelector(".prog .seg.cur .fill");
    if (seg) seg.style.width = ((PROG.k + f) / PROG.n * 100).toFixed(1) + "%";
    const pct = Math.round((G.ch + (PROG.k + f) / PROG.n) / ST.chapters.length * 100) + "%";
    document.querySelectorAll(".toc-pct").forEach(x => x.textContent = pct);
  }
  function progBar() {
    const bar = el("div", { class: "prog", title: "点击打开目录", onclick: e => { e.stopPropagation(); toc(); } },
      ST.chapters.map((c, k) => el("div", { class: "seg" + (k < G.ch ? " done" : k === G.ch ? " cur" : ""), title: c.title },
        el("div", { class: "fill", style: `width:${k < G.ch ? 100 : 0}%` }),
        !c.noMirror && !c.seq ? [el("i", { style: "left:33.3%" }), el("i", { style: "left:66.6%" })] : null)));
    setTimeout(() => setProg(PROG.f));
    return bar;
  }

  // 目录：任意章、任意阶段都能跳；pov 可以切换视角
  function toc(fromHome) {
    document.querySelector(".toc")?.remove();
    let pov = G.start;
    const box = el("div", { class: "toc", onclick: e => { if (e.target === box) close(); } });
    const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    function render() {
      box.innerHTML = "";
      const chips = (k, c) => (c.noMirror || c.seq ? [["live", "进入"]] : PHASES).map(([ph, label], pi) => {
        const seen = G.seen[`${pov}:${k}:${ph}`];
        const here = !fromHome && pov === G.start && k === G.ch && (c.noMirror || c.seq || pi === PROG.k);
        return el("button", { class: "toc-chip" + (seen ? " seen" : "") + (here ? " here" : ""), title: seen ? "玩过" : "",
          onclick: () => { close(); jumpTo(k, pi, pov); } }, (here ? "▶ " : seen ? "✓ " : "") + (c.noMirror || c.seq ? label : `${pi + 1} ${label}`));
      });
      box.append(el("div", { class: "toc-card" },
        el("div", { class: "toc-head" }, el("div", {}, el("div", { class: "muted small" }, "目录"), el("b", {}, `《${ST.title}》`)),
          el("button", { class: "btn plain", onclick: close }, "关闭")),
        el("div", { class: "toc-pov" }, el("span", { class: "muted small" }, "视角"),
          ["A", "B"].map(p => el("button", { class: "toc-pov-btn" + (p === pov ? " on" : ""), style: `--c:${POV[p].color}`, onclick: () => { pov = p; render(); } },
            el("span", { class: "pav", html: window.ART.char(POV[p].char, "normal", { crop: "head" }) }), `${POV[p].name}（偏 ${POV[p].tag}）`))),
        el("div", { class: "toc-list" }, ST.chapters.map((c, k) => {
          const done = (c.noMirror || c.seq ? ["live"] : PHASES.map(p => p[0])).filter(ph => G.seen[`${pov}:${k}:${ph}`]).length;
          const cur = !fromHome && pov === G.start && k === G.ch;
          return el("div", { class: "toc-row" + (cur ? " cur" : "") },
            el("div", { class: "toc-thumb", html: window.ART.bg(firstBg(c.seq || c[pov]) || "black") }),
            el("div", { class: "toc-info" },
              el("div", { class: "toc-title" }, c.title, cur ? el("span", { class: "toc-now" }, "当前") : null),
              el("div", { class: "muted small" }, c.sub || "", done ? ` · 已玩 ${done}/${c.noMirror || c.seq ? 1 : 3}` : ""),
              el("div", { class: "toc-chips" }, chips(k, c))));
        })),
        el("div", { class: "muted small toc-note" }, "跳转后从所选位置开始。玩过的章节会恢复到你当时进入这一章的状态；没玩过的章节用默认状态。")));
    }
    render();
    document.body.append(box);
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
        if (!from) { const { snaps, seen, ...rest } = G; G.snaps[`${G.start}:${G.ch}`] = clone(rest); save(); }
        G._chStart = clone(G);
        const r = await playChapter(ch, tok, from);
        alive(tok);
        if (r === "ending") {
          const next = await ending(tok);
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
    document.querySelectorAll(".interstitial,.title-card,.toc").forEach(x => x.remove());
  }
  function exit() {
    stopFlow();
    document.body.className = "";
    // 章中途退出：存回本章开始时的状态，下次从章首继续
    if (G && G._chStart) { const s0 = G._chStart; delete G._chStart; G = s0; }
    if (G) save();
    onExit && onExit();
  }

  return {
    setHome(fn) { onExit = fn; },
    list() { return Object.values(window.STORIES); },
    saved(id) { const s = load(window.STORIES[id]); return s && !s.ended ? s : null; },
    cards() { return Object.values(window.STORIES).flatMap(st => ((load(st) || {}).cards || []).map(c => ({ ...c, story: st.title, P: st.POV[c.pov] }))); },
    start(id, pov) { AU.unlock(); use(id); G = fresh(pov || ST.defaultStart || "A"); save(); loop(); },
    resume(id) { AU.unlock(); use(id); G = load(); if (!G) return; G.snaps = G.snaps || {}; G.seen = G.seen || {}; loop(); },
    // 首页打开目录：有存档就沿用，没有就按默认视角新建（不落盘，选了才落盘）
    toc(id) { use(id); G = load() || fresh(ST.defaultStart || "A"); G.snaps = G.snaps || {}; G.seen = G.seen || {}; toc(true); }
  };
})();
