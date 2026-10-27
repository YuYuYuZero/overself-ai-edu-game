// 网页版 MBTI 测试：说明页 → 分页作答（7 级量表，可回上一页，自动存草稿）→ 结果页 → 分享卡片。
// 题库与计分在 quiz.js（window.MBTI），分享卡片的绘制在 share-card.js（window.ShareCard），两者与小程序共用。
window.QuizUI = (function () {
  const { el, screen, setRouteColor, secTitle } = window.UI;
  const M = window.MBTI, ART = window.ART;
  const TYPE_KEY = "overself.mbti.v1", DRAFT_KEY = "overself.quiz.draft.v2", SEX_KEY = "overself.avatar.v1";
  const SITE = "https://yuyuyuzero.github.io/overself-ai-edu-game/";

  const get = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const mine = () => M.normalize(get(TYPE_KEY));
  const avatarSex = () => get(SEX_KEY) === "m" ? "m" : "f";
  const back = (fn, label) => el("div", { class: "topbar" }, el("button", { class: "back", onclick: fn }, label || "‹ 首页"));
  const home = () => window.Game.home();

  // ---------- 说明页 ----------
  function intro() {
    setRouteColor();
    const draft = get(DRAFT_KEY), done = draft ? Object.keys(draft.answers || {}).length : 0;
    const dimCard = d => {
      const D = M.dims[d];
      return el("div", { class: "qi-dim" }, el("div", { class: "qi-dim-n" }, D.name),
        el("div", { class: "qi-dim-ab" }, el("b", {}, `${d[0]} ${D[d[0]]}`), el("span", {}, "·"), el("b", {}, `${D[d[1]]} ${d[1]}`)),
        el("div", { class: "muted small" }, `${D[d[0] + "d"]}；或${D[d[1] + "d"]}`));
    };
    const mode = (k, rec) => {
      const m = M.MODES[k];
      return el("button", { class: "mode-card" + (rec ? " rec" : ""), onclick: () => { set(DRAFT_KEY, null); run(k); } },
        rec ? el("span", { class: "mode-rec" }, "推荐") : null,
        el("div", { class: "mode-t" }, m.label),
        el("div", { class: "mode-n" }, `${m.n} 题 · 约 ${m.minutes} 分钟`),
        el("div", { class: "muted small" }, rec ? "每个维度 15 题，结果更稳定，附偏好清晰度" : "每个维度 6 题，先快速看一眼你的类型"));
    };
    screen(
      back(home),
      el("div", { class: "quiz-intro" },
        el("div", { class: "qi-kicker" }, "MBTI 性格测试"),
        el("h1", { class: "qi-title" }, "了解你习惯用的那一面"),
        el("p", { class: "qi-lead" }, "接下来是一些描述日常想法和做法的句子。读完每一句，选出它和你有多像——从「非常同意」到「非常不同意」共 7 级。"),
        el("div", { class: "qi-dims" }, M.DIMS.map(dimCard)),
        el("ul", { class: "qi-tips" },
          el("li", {}, "凭第一反应作答，想想你", el("b", {}, "平时"), "通常怎么做，而不是「应该」怎么做"),
          el("li", {}, "尽量少选中间的「说不准」，它不计入任何一边"),
          el("li", {}, "答案只保存在你自己的设备上，可以随时退出，下次接着答")),
        draft && done ? el("button", { class: "btn wide", onclick: () => run(draft.mode, draft) }, `继续上次的测试（已答 ${done} / ${M.MODES[draft.mode].n}）`) : null,
        el("div", { class: "mode-grid" }, mode("full", true), mode("quick")),
        el("p", { class: "muted small center" }, "这是基于 MBTI 四维度理论的自评问卷，用于自我了解和成长练习，不是心理诊断，也不代表官方 MBTI® 测评。")));
  }

  // ---------- 作答 ----------
  function run(mode, draft) {
    setRouteColor();
    const items = M.items(mode), per = M.MODES[mode].per, pages = Math.ceil(items.length / per);
    const answers = (draft && draft.answers) || {};
    let page = draft ? Math.min(draft.page || 0, pages - 1) : 0;
    const save = () => set(DRAFT_KEY, { mode, answers, page });

    function show(scrollTop) {
      const list = items.slice(page * per, page * per + per);
      const total = Object.keys(answers).length;
      const nextBtn = el("button", { class: "btn", onclick: next }, page < pages - 1 ? "下一页 ›" : "查看结果 ✓");
      const rows = list.map(q => {
        const row = el("div", { class: "qi" + (answers[q.id] != null ? " done" : ""), id: "q" + q.id },
          el("div", { class: "qi-text" }, el("span", { class: "qi-no" }, String(items.indexOf(q) + 1).padStart(2, "0")), q.text),
          el("div", { class: "scale" },
            el("span", { class: "sc-l agree" }, "同意"),
            el("div", { class: "sc-dots" }, M.SCALE.map((s, i) => el("button", {
              class: `dot d${i}` + (answers[q.id] === s.v ? " on" : ""), title: s.label, "aria-label": s.label,
              onclick: () => pick(q, s.v, row)
            }))),
            el("span", { class: "sc-r disagree" }, "不同意")));
        return row;
      });
      const refresh = () => {
        const all = list.every(q => answers[q.id] != null);
        nextBtn.disabled = !all;
        bar.style.width = Object.keys(answers).length / items.length * 100 + "%";
        count.textContent = `已答 ${Object.keys(answers).length} / ${items.length}`;
      };
      function pick(q, v, row) {
        answers[q.id] = v; save();
        row.classList.add("done");
        row.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("on", M.SCALE[i].v === v));
        refresh();
        // 自动滚到本页下一道没答的题
        const nextQ = list.find(x => answers[x.id] == null);
        const target = nextQ ? document.getElementById("q" + nextQ.id) : nextBtn;
        setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
      }
      function next() {
        if (list.some(q => answers[q.id] == null)) return;
        if (page < pages - 1) { page++; save(); show(true); }
        else { const res = M.score(answers, mode); set(DRAFT_KEY, null); result(res, true); }
      }
      const bar = el("div", { class: "qbar-fill" }), count = el("span", {});
      screen(
        el("div", { class: "quiz-head" },
          el("button", { class: "back", onclick: () => { save(); intro(); } }, "‹ 暂停"),
          el("div", { class: "qbar" }, bar),
          el("div", { class: "qmeta" }, el("span", {}, `${M.MODES[mode].label} · 第 ${page + 1} / ${pages} 页`), count)),
        el("div", { class: "qlist" }, rows),
        el("div", { class: "qnav" },
          page > 0 ? el("button", { class: "btn plain", onclick: () => { page--; save(); show(true); } }, "‹ 上一页") : el("span"),
          nextBtn));
      refresh();
      if (scrollTop) window.scrollTo(0, 0);
    }
    show();
  }

  // ---------- 结果 ----------
  function result(res, fresh) {
    res = M.normalize(res);
    if (fresh) set(TYPE_KEY, res);
    setRouteColor();
    const type = res.type, gk = M.groupOf(type), g = M.groups[gk], prof = M.profiles[type], tf = type[2];
    const main = M.complement[tf], rec = tf === "T" ? window.ROUTES.t2f : window.ROUTES.f2t;
    let sex = avatarSex();
    const avatar = el("div", { class: "rh-char" });
    const paintAvatar = () => { avatar.innerHTML = ART.char(ART.typeChar(type, sex), type[0] === "E" ? "smile" : "normal"); };
    paintAvatar();
    const sexBtn = s => el("button", { class: "sx" + (sex === s ? " on" : ""), onclick: e => {
      sex = s; set(SEX_KEY, s); paintAvatar();
      e.target.parentNode.querySelectorAll(".sx").forEach(b => b.classList.toggle("on", b === e.target));
    } }, s === "f" ? "女生形象" : "男生形象");

    const dimRow = r => el("div", { class: "dim2" },
      el("div", { class: "dim2-head" }, el("span", { class: "dim2-name" }, r.name), el("span", { class: `clar c${r.clarity.k}` }, `偏好${r.clarity.label}`)),
      el("div", { class: "dim2-bar" },
        el("span", { class: "dim2-end" + (r.left ? " on" : "") }, `${r.an} ${r.a}`),
        el("div", { class: "dim2-track" },
          el("div", { class: "dim2-fill", style: `${r.left ? "right" : "left"}:50%;width:${(r.p - 50)}%;background:${g.color}` }),
          el("div", { class: "dim2-mid" })),
        el("span", { class: "dim2-end" + (r.left ? "" : " on") }, `${r.b} ${r.bn}`)),
      el("div", { class: "dim2-desc" }, el("b", { style: `color:${g.deep}` }, `${r.p}% ${r.letterName}`), `　${r.desc}`));

    // 在同一侧（T 或 F）的故事角色里，找和你字母重合最多的那一位
    const cands = [];
    for (const st of window.Story.list()) for (const p of ["A", "B"]) {
      const t = st.POV[p].tag;
      if (t && t[2] === tf) cands.push({ st, p, t, same: [...t].filter((c, k) => c === type[k]).length });
    }
    cands.sort((x, y) => y.same - x.same || x.st.order - y.st.order);
    const best = cands[0], campus = cands.find(c => c.st.id === "campus");
    const others = ["EI", "SN", "JP"].map(d => {
      const k = type[M.DIMS.indexOf(d)], c = M.complement[k];
      return el("div", { class: "coming-chip" }, el("b", {}, `${k} 解锁 ${c.to} · ${c.title}`), el("span", {}, c.desc), el("span", { class: "soon" }, "即将上线"));
    });
    const modeNote = res.mode === "quick" ? "快速版（24 题）" : res.mode === "full" ? "专业版（60 题）" : "旧版测试（22 题）";

    screen(
      el("div", { class: "topbar" }, el("button", { class: "back", onclick: home }, "‹ 首页"),
        el("button", { class: "btn sm share-btn", style: `background:${g.color}`, onclick: () => share(res, sex) }, "生成分享卡片")),
      el("section", { class: "result-hero", style: `--g:${g.color};--gd:${g.deep}` },
        el("div", { class: "rh-text" },
          el("div", { class: "rh-k" }, "你的 MBTI 人格类型"),
          el("div", { class: "rh-type" }, [...type].map(c => el("span", {}, c))),
          el("div", { class: "rh-name" }, M.names[type]),
          el("div", { class: "rh-group" }, el("b", {}, g.name), ` · ${g.desc}`),
          el("p", { class: "rh-tag" }, `「${prof.tagline}」`),
          el("div", { class: "rh-sex" }, sexBtn("f"), sexBtn("m"))),
        avatar),
      el("div", { class: "card" },
        secTitle(0, "四个维度"),
        M.dimRows(res).map(dimRow),
        el("p", { class: "muted small" }, "百分比表示你在这一维上偏向哪一边、偏多少；50% 就是正中间。「偏好轻微」说明两种方式你都常用。" + M.TERM_NOTE)),
      el("div", { class: "card" },
        secTitle(1, `${type} 的画像`),
        el("p", { class: "lead-p" }, prof.desc),
        el("div", { class: "sw-grid" },
          el("div", { class: "sw good" }, el("div", { class: "sw-t" }, "你的优势"), el("ul", {}, prof.strengths.map(s => el("li", {}, s)))),
          el("div", { class: "sw warn" }, el("div", { class: "sw-t" }, "可能的盲点"), el("ul", {}, prof.blind.map(s => el("li", {}, s)))))),
      el("div", { class: "card unlock-card", style: `--c:${rec.color}` },
        secTitle(2, "你的解锁方向"),
        el("div", { class: "tag" }, `现在就能玩 · ${tf} 解锁 ${main.to}`),
        el("h2", {}, main.title),
        el("p", {}, main.desc),
        el("div", { class: "growth" }, el("b", {}, "成长建议　"), prof.growth),
        best ? el("p", { class: "muted small" }, `和你最像的角色是 ${best.st.POV[best.p].name}（${best.t}），和你有 ${best.same} 个字母相同。你会先以 TA 的身份经历，再切到相反类型的那个人身上。`) : null,
        el("div", { class: "row" },
          best ? el("button", { class: "btn", style: `background:${rec.color}`, onclick: () => window.Story.start(best.st.id, best.p) }, `从${best.st.POV[best.p].name}（${best.t}）开始《${best.st.title}》`) : null,
          campus && best && best.st.id !== "campus" ? el("button", { class: "btn ghost", style: `color:${rec.color};border-color:${rec.color}`, onclick: () => window.Story.start("campus", campus.p) }, "或：推荐首玩《汇演前三天》") : null,
          el("button", { class: "btn plain", onclick: () => window.Game.routeScreen(rec.id) }, `日常练习：${rec.title}`))),
      el("div", { class: "card" },
        secTitle(3, "另外三个维度的解锁"),
        el("div", { class: "coming-grid" }, others)),
      el("p", { class: "muted small center" }, `本次结果来自${modeNote}。这不是心理诊断，只反映你在这些情境里的习惯；字母说明你更常用哪一面，另一面一样可以练。`),
      el("div", { class: "row center", style: "margin-top:10px" },
        el("button", { class: "btn", style: `background:${g.color}`, onclick: () => share(res, sex) }, "生成分享卡片"),
        el("button", { class: "btn plain", onclick: intro }, "重新测一次"),
        el("button", { class: "btn plain", onclick: home }, "回首页")));
  }

  // ---------- 分享卡片 ----------
  const loadImg = src => new Promise(ok => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  async function share(res, sex) {
    const SC = window.ShareCard, d = SC.data(res, { footer: "在线测一测：" + SITE.replace(/^https?:\/\//, "") });
    const portrait = SC.svgUri(ART.char(ART.typeChar(res.type, sex), res.type[0] === "E" ? "smile" : "normal"));
    const [p, logo, qr] = await Promise.all([loadImg(portrait), loadImg("img/logo-icon.png"), loadImg("img/qrcode.png")]);
    // 双击 index.html 打开（file://）时，本地图片会"污染"画布、导不出图：依次去掉 logo / 二维码、人物重画
    const tries = [{ portrait: p, logo, qr }, { portrait: p }, {}];
    let url = "";
    for (const imgs of tries) {
      const k = 2, cv = el("canvas", { width: SC.W * k, height: SC.H * k });
      const ctx = cv.getContext("2d"); ctx.scale(k, k);
      SC.poster(ctx, d, imgs);
      try { url = cv.toDataURL("image/png"); break; } catch (e) {}
    }
    if (!url) return alert("这个浏览器暂时生成不了分享卡片，可以直接截图结果页分享。");
    const close = () => box.remove();
    const box = el("div", { class: "share-modal", onclick: e => { if (e.target === box) close(); } },
      el("div", { class: "share-card" },
        el("img", { src: url, alt: "我的 MBTI 分享卡片" }),
        el("div", { class: "muted small center" }, "手机上长按图片即可保存或发送给朋友"),
        el("div", { class: "row center" },
          el("a", { class: "btn", href: url, download: `我的MBTI-${res.type}.png` }, "保存图片"),
          el("button", { class: "btn plain", onclick: () => { navigator.clipboard?.writeText(`我的 MBTI 是 ${res.type}（${M.names[res.type]}），来测测你的另一面：${SITE}`); } }, "复制邀请文字"),
          el("button", { class: "btn plain", onclick: close }, "关闭"))));
    document.body.append(box);
  }

  return { intro, run, result, share, mine, avatarSex };
})();
