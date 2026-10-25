// MBTI 性格修炼手册（Overself）—— 游戏引擎（数据在 scenarios.js）
(function () {
  const app = document.getElementById("app");
  // 练习关的角色立绘（art.js）与默认背景
  const CAST = { "小雨": "xiaoyu", "妈妈": "mom", "小林": "xiaolin", "领导": "zhao", "室友": "roommate", "大刘": "daliu", "林可": "linke", "周老师": "teacher_zhou", "何女士": "client", "老周": "laozhou" };
  const LEVEL_BG = { "t2f-1": "cafe", "t2f-2": "home_night", "t2f-3": "open_office" };
  const meOf = (route, level) => level.me || (route.id === "t2f" ? "you_m" : /classroom|teacher|school/.test(level.bg || "") ? "you_sf" : "you_f");
  const STORE_KEY = "complement.progress.v1";

  // ---------- 进度存档 ----------
  const progress = load();
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { stars: {}, cards: {} }; }
    catch (e) { return { stars: {}, cards: {} }; }
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {} }

  // ---------- DOM 小工具 ----------
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k === "style") n.style.cssText = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }
  function screen(...kids) { clearTimers(); AU.heart(0); document.body.classList.remove("home"); app.innerHTML = ""; app.append(...kids); window.scrollTo(0, 0); }
  function starsEl(n, size) {
    const s = el("span", { class: "stars", style: size ? `font-size:${size}px` : "" });
    for (let i = 0; i < 3; i++) s.append(el("span", { class: i < n ? "" : "off" }, "★"));
    return s;
  }
  let timers = [];
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; }
  function setRouteColor(c) { document.documentElement.style.setProperty("--route", c || "#6b5bd2"); }

  // ---------- 首页 ----------
  const TYPE_KEY = "overself.mbti.v1";
  function savedType() { try { return JSON.parse(localStorage.getItem(TYPE_KEY)); } catch (e) { return null; } }
  function home() {
    setRouteColor();
    const ART = window.ART, M = window.MBTI, mine = savedType();
    const routes = Object.values(window.ROUTES).map(r => {
      const done = r.levels.filter(l => progress.stars[l.id]).length;
      return el("button", { class: "card route-card", style: `--c:${r.color}`, onclick: () => routeScreen(r.id) },
        el("div", { class: "tag" }, r.dir),
        el("h2", {}, r.title),
        el("div", { class: "muted" }, r.subtitle),
        el("div", { class: "progress-dots" }, `${r.levels.length} 关 · 每关 3 分钟 · 已完成 ${done}`));
    });
    const coming = ["E", "I", "S", "N", "J", "P"].map(k => {
      const c = M.complement[k];
      return el("div", { class: "coming-chip" }, el("b", {}, `${k} 解锁 ${c.to} · ${c.title}`), el("span", {}, c.desc.split(" → ")[0]));
    });
    AU.bgm("home"); AU.amb(null); AU.heart(0);
    const cardCount = Object.keys(progress.cards).length + window.Story.cards().length;
    const stories = window.Story.list().map(st => {
      const saved = window.Story.saved(st.id), P = st.POV;
      const firstBg = st.cover || (st.chapters[0].seq || st.chapters[0][st.defaultStart || "A"] || []).find(n => n.bg)?.bg;
      return el("div", { class: "card story-card" },
        el("div", { class: "story-cover", html: ART.bg(firstBg) },
          el("div", { class: "cover-chars" }, ["A", "B"].map(p => el("div", { class: "cover-char", html: ART.char(P[p].char, "normal") }))),
          st.order === 1 ? el("div", { class: "cover-badge" }, "推荐首玩") : null),
        el("div", { class: "story-info" },
          el("div", { class: "tag" }, `${st.tag} · 约 ${st.minutes} 分钟`),
          el("h2", {}, `《${st.title}》`),
          el("p", { class: "muted blurb" }, st.blurb),
          el("div", { class: "story-actions" },
            saved ? el("button", { class: "btn", onclick: () => window.Story.resume(st.id) }, `继续：${st.chapters[saved.ch]?.title || ""}`) : null,
            ...["A", "B"].map(p => el("button", { class: "btn ghost", style: `border-color:${P[p].color};color:${P[p].color}`, onclick: () => window.Story.start(st.id, p) }, `从${P[p].name}开始（${P[p].tag}）`)),
            el("button", { class: "btn plain", onclick: () => window.Story.toc(st.id) }, "☰ 章节目录"))));
    });
    const side = (cls, char, who, pain, grow, how) => el("div", { class: "side-card " + cls },
      el("div", { class: "side-av", html: ART.char(char, "think", { crop: "head" }) }),
      el("div", {},
        el("div", { class: "side-who" }, who),
        el("div", { class: "side-pain" }, pain),
        el("div", { class: "side-grow" }, "→ ", grow),
        el("div", { class: "muted small" }, how)));
    const step = (n, t, d) => el("div", { class: "loop-step" }, el("div", { class: "loop-n" }, n), el("b", {}, t), el("div", { class: "muted small" }, d));
    screen(
      el("section", { class: "hero" },
        el("div", { class: "hero-bg", html: ART.bg("classroom_evening") }),
        el("div", { class: "hero-shade" }),
        el("div", { class: "hero-chars" }, ["chenyu", "xiaoman"].map(c => el("div", { class: "hero-char", html: ART.char(c, c === "xiaoman" ? "smile" : "normal") }))),
        el("div", { class: "hero-text" },
          el("div", { class: "brand" },
            el("img", { class: "brand-logo", src: "img/logo-icon.png", alt: "MBTI 性格修炼手册" }),
            el("div", { class: "brand-en" }, "Overself")),
          el("h1", {}, "MBTI ", el("span", {}, "性格修炼手册")),
          el("p", { class: "hero-lead" }, "测出你的 MBTI，", el("br"), "体验另一面，解锁另一个你。"),
          el("p", { class: "hero-sub" }, "测试告诉你「你是哪一型」。在这本修炼手册里，你先以同型的角色走进一个真实故事，再切到相反类型的人身上，把同一件事重新经历一遍。"),
          mine ? el("div", { class: "hero-type" }, "你的类型：", el("b", {}, mine.type), ` · ${M.names[mine.type]}`) : null,
          el("div", { class: "row hero-cta" },
            el("button", { class: "btn", onclick: quiz }, mine ? "重新测一次" : "测我的 MBTI（22 题 · 约 3 分钟）"),
            mine ? el("button", { class: "btn light", onclick: () => quizResult(mine) }, "查看我的解锁方向")
              : el("button", { class: "btn light", onclick: () => window.Story.start("campus", "B") }, "直接开始《汇演前三天》"),
            el("button", { class: "btn link", onclick: collection }, `我的技能卡（${cardCount}）`)))),
      el("section", { class: "home-sec" },
        el("h3", { class: "sec-title" }, "三步：测 → 体验 → 解锁"),
        el("div", { class: "loop-grid three" },
          step("测", "测出你的类型", "22 道情境题，得到你的四个字母，以及每个维度偏向多少"),
          step("验", "体验另一面", "在故事里先用你习惯的方式做选择，再切到相反类型的人身上，听见「对方听到的」"),
          step("解", "解锁另一个你", "倒带重来，换一种做法；带走技能卡和本周小任务，把另一面也练出来"))),
      el("section", { class: "home-sec" },
        el("h3", { class: "sec-title" }, "第一组解锁：T 与 F"),
        el("div", { class: "side-grid" },
          side("rational", "chenyu", "T 型（思考）的你", "道理都对，却常常读不懂人心", "解锁 F：读懂人心", "在讲道理之前，先看见对方的情绪、接住对方"),
          side("emotional", "xiaoman", "F 型（情感）的你", "感受很深，却容易被情绪带着走", "解锁 T：冷静解题", "情绪是警报不是导航：先停一下，再把问题拆开解决")),
        el("p", { class: "muted small center" }, "字母只说明你更常用哪一面。T 型的人也有感受，F 型的人也会讲道理——解锁，是把不常用的那一面也练出来。")),
      el("section", { class: "home-sec" },
        el("h3", { class: "sec-title" }, "每一章，都是同一个循环"),
        el("div", { class: "loop-grid" },
          step("1", "经历", "以和你同型的角色，用习惯的方式做选择"),
          step("2", "镜面", "切到相反类型的人身上，听见「对方听到的」"),
          step("3", "倒带", "回到那一刻，换一种做法"),
          step("4", "复盘", "看见自己的习惯，带走一个小任务"))),
      el("section", { class: "home-sec" },
        el("h3", { class: "sec-title" }, "故事 · 每个角色都有自己的 MBTI"),
        el("div", { class: "story-grid" }, stories)),
      el("section", { class: "home-sec" },
        el("h3", { class: "sec-title" }, "日常练习"),
        el("div", { class: "route-grid" }, routes)),
      el("section", { class: "home-sec" },
        el("h3", { class: "sec-title" }, "更多维度的解锁 · 即将上线"),
        el("div", { class: "coming-grid" }, coming)),
      el("p", { class: "muted small center foot" },
        "MBTI 是理解自己的一种语言，不是给人定性的标签，也不是心理诊断。每个人都同时拥有两面，只是习惯用其中一面更多。")
    );
    document.body.classList.add("home");
  }

  // ---------- MBTI 测试 ----------
  function quiz() {
    setRouteColor();
    const qs = window.QUIZ; let i = 0;
    const score = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    const order = qs.map(() => Math.random() < 0.5); // 随机左右顺序，避免位置偏好
    function show() {
      if (i >= qs.length) return quizResult(typeOf(score), true);
      const q = qs[i];
      const a = { text: q.a, v: q.dim[0] }, b = { text: q.b, v: q.dim[1] };
      const opts = order[i] ? [a, b] : [b, a];
      screen(
        el("div", { class: "topbar" }, el("button", { class: "back", onclick: home }, "‹ 返回")),
        el("div", { class: "quiz-bar" }, el("div", { style: `width:${i / qs.length * 100}%` })),
        el("div", { class: "muted small", style: "margin-top:8px" }, `${i + 1} / ${qs.length}　凭第一反应选，没有对错`),
        el("div", { class: "quiz-q" }, q.q),
        ...opts.map(o => el("button", { class: "opt", onclick: () => { score[o.v]++; i++; show(); } }, o.text)));
    }
    show();
  }
  function typeOf(score) {
    // 每个维度都是奇数道题，不会打平；保留平局兜底（取首字母）
    const type = ["EI", "SN", "TF", "JP"].map(d => score[d[0]] >= score[d[1]] ? d[0] : d[1]).join("");
    return { type, score };
  }
  function quizResult(res, fresh) {
    if (fresh) { try { localStorage.setItem(TYPE_KEY, JSON.stringify(res)); } catch (e) {} }
    setRouteColor();
    const M = window.MBTI, { type, score } = res, tf = type[2];
    const main = M.complement[tf], rec = tf === "T" ? window.ROUTES.t2f : window.ROUTES.f2t;
    const dimRow = d => {
      const a = score[d[0]], b = score[d[1]], n = a + b || 1;
      return el("div", { class: "dim-row" },
        el("div", { class: "dim-labels" },
          el("span", { class: type.includes(d[0]) ? "on" : "" }, `${M.dims[d][d[0]]} ${a}`),
          el("span", { class: type.includes(d[1]) ? "on" : "" }, `${b} ${M.dims[d][d[1]]}`)),
        el("div", { class: "spectrum" },
          el("div", { style: `width:${a / n * 100}%;background:#4a8fe0` }),
          el("div", { style: `width:${b / n * 100}%;background:#f07c5a` })),
        Math.abs(a - b) <= 1 ? el("div", { class: "muted small" }, "这一维两边很接近，两种方式你都常用") : null);
    };
    // 在同一侧（T 或 F）的角色里，找和你字母重合最多的那一位
    const cands = [];
    for (const st of window.Story.list()) for (const p of ["A", "B"]) {
      const t = st.POV[p].tag;
      if (t && t[2] === tf) cands.push({ st, p, t, same: [...t].filter((c, k) => c === type[k]).length });
    }
    cands.sort((x, y) => y.same - x.same || x.st.order - y.st.order);
    const best = cands[0], campus = cands.find(c => c.st.id === "campus");
    const others = ["EI", "SN", "JP"].map(d => {
      const k = type["EI SN TF JP".split(" ").indexOf(d)], c = M.complement[k];
      return el("div", { class: "coming-chip" }, el("b", {}, `${k} 解锁 ${c.to} · ${c.title}`), el("span", {}, c.desc), el("span", { class: "soon" }, "即将上线"));
    });
    screen(
      el("div", { class: "topbar" }, el("button", { class: "back", onclick: home }, "‹ 返回")),
      el("div", { class: "card mbti-result" },
        el("div", { class: "muted small" }, "你的 MBTI"),
        el("div", { class: "mbti-type" }, [...type].map(c => el("span", {}, c))),
        el("div", { class: "mbti-name" }, M.names[type]),
        ["EI", "SN", "TF", "JP"].map(dimRow),
        el("p", { class: "muted small" }, "这不是心理诊断，只反映你在这 22 个情境里的第一反应。字母说明你更常用哪一面，另一面一样可以练。")),
      el("div", { class: "card", style: `border-left:5px solid ${rec.color}` },
        el("div", { class: "tag" }, `现在就能玩 · ${tf} 解锁 ${main.to}`),
        el("h2", { style: "margin:6px 0" }, `你的解锁方向：${main.title}`),
        el("p", { style: "line-height:1.7" }, main.desc),
        best ? el("p", { class: "muted small" }, `和你最像的角色是 ${best.st.POV[best.p].name}（${best.t}），和你有 ${best.same} 个字母相同。你会先以 TA 的身份经历，再切到相反类型的那个人身上。`) : null,
        el("div", { class: "row" },
          best ? el("button", { class: "btn", onclick: () => window.Story.start(best.st.id, best.p) }, `从${best.st.POV[best.p].name}（${best.t}）开始《${best.st.title}》`) : null,
          campus && best && best.st.id !== "campus" ? el("button", { class: "btn ghost", onclick: () => window.Story.start("campus", campus.p) }, `或：推荐首玩《汇演前三天》`) : null,
          el("button", { class: "btn plain", style: `color:${rec.color}`, onclick: () => routeScreen(rec.id) }, `日常练习：${rec.title}`))),
      el("div", { class: "card" },
        el("h3", { style: "margin-top:0" }, "你的另外三个维度"),
        el("div", { class: "coming-grid" }, others),
        el("div", { class: "row", style: "margin-top:14px" },
          el("button", { class: "btn plain", onclick: quiz }, "重新测一次"),
          el("button", { class: "btn plain", onclick: home }, "回首页"))));
  }

  // ---------- 技能卡收藏 ----------
  function collection() {
    setRouteColor();
    const items = [];
    for (const r of Object.values(window.ROUTES)) for (const l of r.levels) {
      if (!progress.cards[l.id]) continue;
      items.push(el("div", { class: "card takeaway", style: `border-left:5px solid ${r.color}` },
        el("div", { class: "muted small" }, `${r.title} · ${l.title}`),
        el("h3", {}, l.takeaway.title),
        el("ul", {}, l.takeaway.points.map(p => el("li", {}, p)))));
    }
    for (const c of window.Story.cards()) {
      const P = c.P;
      items.unshift(el("div", { class: "card takeaway", style: `border-left:5px solid ${P.color}` },
        el("div", { class: "muted small" }, `《${c.story}》· ${c.ch} · ${P.name}`),
        el("h3", {}, c.title), el("ul", {}, c.points.map(p => el("li", {}, p)))));
    }
    screen(
      el("div", { class: "topbar" }, el("button", { class: "back", onclick: home }, "‹ 返回")),
      el("h2", {}, "我的技能卡"),
      items.length ? items : el("p", { class: "muted" }, "还没有技能卡。完成一关就能收集一张。"));
  }

  // ---------- 路线（关卡列表） ----------
  function routeScreen(id) {
    const r = window.ROUTES[id]; setRouteColor(r.color);
    screen(
      el("div", { class: "topbar" }, el("button", { class: "back", onclick: home }, "‹ 首页")),
      el("div", { class: "level-head" }, el("div", { class: "skill" }, r.dir), el("h2", {}, r.title)),
      el("p", { class: "muted" }, r.subtitle),
      ...r.levels.map((l, i) => el("button", { class: "card level-item", onclick: () => playLevel(r, i) },
        el("div", {}, el("div", { class: "muted small" }, `第 ${i + 1} 关`), el("h3", {}, l.title),
          el("div", { class: "small", style: `color:${r.color}` }, l.skill)),
        starsEl(progress.stars[l.id] || 0))),
      el("div", { class: "feedback info" }, el("div", { class: "ft" }, "写给你"), r.otherView));
  }

  // ---------- 关卡运行 ----------
  function playLevel(route, idx) {
    const level = route.levels[idx];
    setRouteColor(route.color);
    const S = { route, level, idx, step: 0, meters: {}, got: 0, max: 0 };
    route.meters.forEach(m => S.meters[m.key] = m.init);

    const meterEls = {};
    const metersBox = el("div", { class: "meters" }, route.meters.map(m => {
      const v = el("span", {}), fill = el("div", { class: "fill" });
      const box = el("div", { class: "meter" }, el("div", { class: "lbl" }, el("span", {}, m.label), v), el("div", { class: "bar" }, fill));
      meterEls[m.key] = { box, v, fill, m };
      return box;
    }));
    clearTimers(); AU.heart(0); app.innerHTML = "";
    document.body.className = "story vn practice";
    const vn = window.VN.mount(app, { pov: { name: "你", char: meOf(route, level), color: route.color }, cast: CAST });
    vn.stage.prepend(el("div", { class: "hud" },
      el("button", { class: "back", onclick: () => { document.body.className = ""; routeScreen(route.id); } }, "‹ 退出本关"),
      el("div", { class: "level-head" }, el("h2", {}, `第 ${idx + 1} 关 · ${level.title}`)),
      el("div", { class: "pov-badge", style: `background:${route.color}` }, level.skill),
      metersBox,
      el("button", { class: "back log-btn", onclick: () => vn.showBacklog() }, "回看")));
    const action = vn.action;
    vn.scene({ bg: level.bg || LEVEL_BG[level.id] || "cafe" });
    vn.narr(level.intro, "sys");
    paintMeters(false);

    function paintMeters(pulse) {
      for (const k in meterEls) {
        const { box, v, fill, m } = meterEls[k];
        const val = Math.max(0, Math.min(100, Math.round(S.meters[k])));
        v.textContent = val;
        fill.style.width = val + "%";
        fill.style.background = m.hot ? `hsl(${120 - val * 1.2}, 65%, 50%)` : route.color;
        if (pulse) { box.classList.remove("pulse"); void box.offsetWidth; box.classList.add("pulse"); }
        if (m.hot) AU.heart(val);
      }
    }
    function apply(effects) {
      if (!effects) return;
      for (const k in effects) if (k in S.meters) S.meters[k] = Math.max(0, Math.min(100, S.meters[k] + effects[k]));
      paintMeters(true);
    }
    const esc = t => String(t).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    function say(who, text, kind, expr, tag) {
      if (kind === "sys") return vn.narr(esc(text), "sys");
      vn.line(who || "旁白", esc(text), { expr, tag });
    }
    function inner(who, text) { if (text) vn.line(who === "你" ? "内心" : who, esc(`（心里）${text}`), { expr: "sad" }); }
    function feedback(kind, title, text) { vn.coachCard(kind, title, text); }
    function setAction(...kids) { action.innerHTML = ""; const box = el("div", { class: "action" }, ...kids); action.append(box); return box; }
    function nextBtn(label, fn) { return el("div", { class: "next-row" }, el("button", { class: "btn", onclick: fn || next }, label || "继续 ›")); }
    function advance(fn) { vn.advance.innerHTML = ""; vn.advance.append(el("div", { class: "next-row" }, el("button", { class: "btn adv", onclick: () => { vn.advance.innerHTML = ""; (fn || next)(); } }, "▼"))); }
    function next() { S.step++; run(); }

    function run() {
      clearTimers();
      action.innerHTML = "";
      const st = level.steps[S.step];
      if (!st) return finish();
      const snap = { ...S.meters };
      const rewind = (msg) => { S.meters = { ...snap }; paintMeters(true); say("", msg || "⏪ 时间倒回到刚才那一刻……", "sys"); };
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
        const picked = new Set();
        const chips = st.options.map(o => {
          const c = el("button", { class: "chip", onclick: () => { picked.has(o) ? picked.delete(o) : picked.add(o); c.classList.toggle("on"); submit.disabled = !picked.size; } }, o);
          return c;
        });
        const submit = el("button", { class: "btn", disabled: true, onclick: check }, "就是这些");
        const box = setAction(el("div", { class: "prompt" }, "🔍 " + st.prompt), el("div", { class: "chips" }, chips), el("div", { class: "next-row" }, submit));
        box.classList.add("big");
        function check() {
          const ans = new Set(st.answer);
          let hit = 0;
          chips.forEach((c, i) => {
            const o = st.options[i]; c.disabled = true; c.classList.remove("on");
            if (picked.has(o) && ans.has(o)) { c.classList.add("hit"); hit++; }
            else if (picked.has(o)) c.classList.add("miss");
            else if (ans.has(o)) c.classList.add("lost");
          });
          const union = new Set([...picked, ...ans]).size;
          const good = hit / union >= 0.66;
          S.max++; if (good) S.got++;
          submit.remove();
          box.append(el("div", { class: "feedback " + (good ? "good" : "bad") }, el("div", { class: "ft" }, good ? "读得很准" : `${st.who}真实的感受是：${st.answer.join("、")}`), st.explain), nextBtn());
        }
      },

      choice(st, rewind) {
        let first = true;
        const tried = new Set();
        render();
        function render() {
          setAction(el("div", { class: "prompt" }, st.prompt),
            ...st.options.map((o, i) => el("button", { class: "opt" + (tried.has(i) ? " tried" : ""), disabled: tried.has(i), onclick: () => pick(o, i) }, o.text)));
        }
        function pick(o, i) {
          if (first) { S.max++; if (o.good) S.got++; first = false; }
          AU.sfx(o.good ? "good" : "bad");
          action.innerHTML = "";
          say("你", o.text, null, o.expr);
          apply(o.effects);
          const verdict = () => {
            feedback(o.good ? "good" : "bad", `${o.good ? "✓ " : ""}${o.tag}`, o.feedback);
            if (o.good) setAction(nextBtn());
            else {
              tried.add(i);
              setAction(el("div", { class: "next-row" },
                el("button", { class: "btn", onclick: () => { AU.sfx("rewind"); rewind("⏪ 时间倒回到刚才那一刻……换个说法试试"); render(); } }, "⏪ 倒带，换个说法")));
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
          const bar = el("div", { class: "t" });
          const pauseBtn = el("button", { class: "opt pause" + (hinted ? " hint" : ""), onclick: () => choose(null) }, "⏸ " + (st.pauseText || "先停一下"));
          const opts = st.options.map(o => el("button", { class: "opt", onclick: () => choose(o) }, o.text));
          // 暂停按钮随机插在冲动选项中间，不总在最显眼的位置
          const pos = hinted ? 0 : Math.floor(Math.random() * (opts.length + 1));
          opts.splice(pos, 0, pauseBtn);
          setAction(el("div", { class: "prompt" }, "⚡ " + st.prompt),
            el("div", { class: "timer" }, bar),
            hinted ? el("div", { class: "muted small", style: "margin-bottom:6px" }, "提示：这一次，试试先停一下") : null,
            ...opts);
          const total = (st.seconds || 8) * 1000, t0 = Date.now(); let lastTick = -1;
          const iv = setInterval(() => {
            const left = 1 - (Date.now() - t0) / total;
            bar.style.width = Math.max(0, left * 100) + "%";
            const slot = Math.floor((Date.now() - t0) / 500);
            if (slot !== lastTick) { lastTick = slot; AU.sfx("tick"); }
            if (left <= 0) { clearInterval(iv); choose(st.options[0], true); }
          }, 50);
          timers.push(iv);
        }
        function choose(o, timeout) {
          clearTimers();
          if (first) { S.max++; if (!o) S.got++; first = false; }
          action.innerHTML = "";
          if (!o) { AU.sfx("mute_dive"); say("", "你停了下来。先停一下。", "sys"); return advance(); }
          if (timeout) say("", "⏱ 你还在犹豫——情绪替你做了选择", "sys");
          say("你", o.text);
          apply(o.effects);
          later(() => {
            feedback("bad", "后来……", o.consequence);
            feedback("info", "发生了什么？", "情绪上来的时候，大脑会催你立刻行动。冲动的动作往往很难撤回。");
            setAction(el("div", { class: "next-row" },
              el("button", { class: "btn", onclick: () => { AU.sfx("rewind"); hinted = true; rewind(); render(); } }, "⏪ 倒回那一刻")));
          }, 600);
        }
      },

      breathe(st) {
        const circle = el("div", { class: "circle" });
        const phase = el("div", { class: "phase" }, "准备");
        const skip = el("button", { class: "btn plain", style: "visibility:hidden", onclick: done }, "我平静下来了");
        setAction(el("div", { class: "breathe" }, el("div", { class: "muted" }, "跟着圆圈呼吸"), circle, phase, skip));
        const seq = [];
        for (let c = 0; c < (st.cycles || 2); c++) seq.push(["吸气", 4000, true], ["屏住", 2000, true], ["呼气", 4000, false]);
        let i = 0, finished = false;
        function tick() {
          if (finished) return;
          if (i >= seq.length) return done();
          const [name, ms, inn] = seq[i];
          phase.textContent = name;
          circle.classList.toggle("in", inn);
          if (name !== "屏住") AU.sfx(inn ? "breath_in" : "breath_out");
          if (i === 3) skip.style.visibility = "visible";
          S.meters.temp != null && i % 3 === 2 && apply({ temp: (st.effects?.temp || 0) / (st.cycles || 2) });
          i++;
          later(tick, ms);
        }
        later(tick, 500);
        function done() {
          if (finished) return; finished = true; clearTimers();
          // 提前结束的补齐剩余降温
          const applied = Math.floor(i / 3) * ((st.effects?.temp || 0) / (st.cycles || 2));
          const rest = (st.effects?.temp || 0) - applied;
          if (rest) apply({ temp: rest });
          action.innerHTML = "";
          AU.sfx("unmute");
          say("", "🌬 呼——" + (st.text ? " " + st.text : ""), "sys");
          advance();
        }
      },

      sort(st) {
        const assign = new Map();
        const order = st.items.map((_, i) => i).sort(() => Math.random() - 0.5);
        const rows = order.map(i => {
          const it = st.items[i];
          const bins = st.bins.map(b => el("button", { class: "bin", onclick: () => {
            assign.set(i, b);
            [...bins].forEach(x => x.classList.toggle("on", x.textContent === b));
            submit.disabled = assign.size < st.items.length;
          } }, b));
          const row = el("div", { class: "sort-row" }, el("div", { class: "txt" }, it.text), el("div", { class: "bins" }, bins));
          row._i = i; row._bins = bins;
          return row;
        });
        const submit = el("button", { class: "btn", disabled: true, onclick: check }, "分好了");
        setAction(el("div", { class: "prompt" }, "🧩 " + st.prompt), ...rows, el("div", { class: "next-row" }, submit)).classList.add("big");
        function check() {
          let ok = 0;
          rows.forEach(r => {
            const it = st.items[r._i], right = assign.get(r._i) === it.bin;
            r._bins.forEach(b => b.disabled = true);
            r.classList.add(right ? "ok" : "no");
            if (right) ok++;
            else r.append(el("div", { class: "ans", style: "color:var(--bad)" }, `→ 应该是「${it.bin}」`));
          });
          const ratio = ok / st.items.length;
          S.max++; if (ratio >= 0.8) S.got++;
          if (st.effects) { const e = {}; for (const k in st.effects) e[k] = Math.round(st.effects[k] * ratio); apply(e); }
          submit.remove();
          const box = action.firstChild;
          box.append(el("div", { class: "feedback " + (ratio >= 0.8 ? "good" : "info") },
            el("div", { class: "ft" }, `分对了 ${ok} / ${st.items.length}`), st.explain), nextBtn());
        }
      },

      cards(st) {
        const opened = new Set();
        const cont = nextBtn("继续 ›", () => { apply(st.effects); next(); });
        cont.firstChild.disabled = true;
        const flips = st.items.map((c, i) => {
          const f = el("button", { class: "flip", onclick: () => {
            if (opened.has(i)) return;
            opened.add(i); f.classList.add("open"); f.innerHTML = "";
            f.append(el("div", { style: "font-weight:600;margin-bottom:6px" }, c.front), c.back);
            cont.firstChild.disabled = opened.size < st.items.length;
          } }, el("div", { class: "f" }, c.front), el("div", { class: "muted small" }, "点开想一想"));
          return f;
        });
        setAction(el("div", { class: "prompt" }, "🃏 " + st.prompt), el("div", { class: "flip-grid" }, flips), cont).classList.add("big");
      },

      reveal(st) {
        vn.stage.append(el("div", { class: "reveal-card" }, el("div", { class: "rt" }, "👁 另一个视角 · " + st.title), el("div", { class: "handwrite" }, st.text)));
        setAction(nextBtn("完成本关 ›"));
      }
    };

    function finish() {
      clearTimers();
      document.body.className = "";
      const ratio = S.max ? S.got / S.max : 1;
      const stars = ratio >= 0.85 ? 3 : ratio >= 0.5 ? 2 : 1;
      progress.stars[level.id] = Math.max(progress.stars[level.id] || 0, stars);
      progress.cards[level.id] = true;
      save();
      const nextLevel = route.levels[idx + 1];
      screen(
        el("div", { class: "topbar" }, el("button", { class: "back", onclick: () => routeScreen(route.id) }, "‹ 关卡列表")),
        el("div", { class: "card result" },
          el("div", { class: "muted small" }, `第 ${idx + 1} 关 · ${level.title}`),
          el("div", { class: "big-stars" }, starsEl(stars, 40)),
          el("div", { class: "muted" }, `第一反应就选对了 ${S.got} / ${S.max} 处`),
          el("div", { class: "row", style: "justify-content:center;margin-top:10px" },
            route.meters.map(m => el("span", { class: "small" }, `${m.label} ${Math.round(S.meters[m.key])}　`)))),
        el("div", { class: "card takeaway", style: `border-left:5px solid ${route.color}` },
          el("div", { class: "muted small" }, "🎴 获得技能卡"),
          el("h3", {}, level.takeaway.title),
          el("ul", {}, level.takeaway.points.map(p => el("li", {}, p)))),
        el("div", { class: "feedback info" }, el("div", { class: "ft" }, "写给你"),
          stars < 3 ? "倒带过不丢人——在游戏里试错，正是为了在生活里少走弯路。" : "很棒！试着在这周的生活里，找一个类似的时刻用上它。"),
        el("div", { class: "row", style: "justify-content:center" },
          el("button", { class: "btn plain", onclick: () => playLevel(route, idx) }, "再玩一次"),
          nextLevel ? el("button", { class: "btn", onclick: () => playLevel(route, idx + 1) }, `下一关：${nextLevel.title} ›`)
                    : el("button", { class: "btn", onclick: () => routeScreen(route.id) }, "路线完成 🎉")));
    }

    run();
  }

  window.Story.setHome(home);
  home();
})();
