// MBTI 测试（网页版 quiz-ui.js）：说明页 → 分页作答（7 级量表，可回上一页，自动存草稿）→ 结果页。
// ?view=result 直接看上次的结果。题库、计分、16 型档案都在共享模块 quiz.js（env.MBTI）。
const env = require("../../shared/index.js");
const store = require("../../core/store");
const SVG = require("../../core/svg");
const AU = require("../../core/au");

const M = env.MBTI;
// 7 个圆圈的大小（px），两端大、中间小
const DOT = [44, 36, 28, 22, 28, 36, 44];

Page({
  data: { mode: "", intro: null, q: null, res: null },

  onLoad(q) {
    const mine = q.view === "result" && store.mbti();
    if (mine) this.showResult(mine); else this.showIntro();
  },

  // ---------- 说明页 ----------
  showIntro() {
    const draft = store.quizDraft(), done = draft ? Object.keys(draft.answers || {}).length : 0;
    wx.setNavigationBarTitle({ title: "MBTI 测试" });
    this.setData({
      mode: "intro",
      intro: {
        dims: M.DIMS.map(d => { const D = M.dims[d]; return { name: D.name, a: `${d[0]} ${D[d[0]]}`, b: `${D[d[1]]} ${d[1]}`, desc: `${D[d[0] + "d"]}；或${D[d[1] + "d"]}` }; }),
        draft: draft && done ? `继续上次的测试（已答 ${done} / ${M.MODES[draft.mode].n}）` : "",
        modes: [
          { k: "full", rec: true, t: M.MODES.full.label, n: `${M.MODES.full.n} 题 · 约 ${M.MODES.full.minutes} 分钟`, d: "每个维度 15 题，结果更稳定，附偏好清晰度" },
          { k: "quick", rec: false, t: M.MODES.quick.label, n: `${M.MODES.quick.n} 题 · 约 ${M.MODES.quick.minutes} 分钟`, d: "每个维度 6 题，先快速看一眼你的类型" }
        ]
      }
    });
  },
  startMode(e) { AU.unlock(); store.saveQuizDraft(null); this.begin(e.currentTarget.dataset.k); },
  resume() { AU.unlock(); const d = store.quizDraft(); if (d) this.begin(d.mode, d); },

  // ---------- 作答 ----------
  begin(mode, draft) {
    this.qmode = mode;
    this.items = M.items(mode);
    this.per = M.MODES[mode].per;
    this.pages = Math.ceil(this.items.length / this.per);
    this.answers = (draft && draft.answers) || {};
    this.page = draft ? Math.min(draft.page || 0, this.pages - 1) : 0;
    wx.setNavigationBarTitle({ title: M.MODES[mode].label + "测试" });
    this.renderPage(true);
  },
  saveDraft() { store.saveQuizDraft({ mode: this.qmode, answers: this.answers, page: this.page }); },
  renderPage(top) {
    const list = this.items.slice(this.page * this.per, this.page * this.per + this.per), A = this.answers;
    const n = Object.keys(A).length;
    this.setData({
      mode: "quiz",
      q: {
        label: `${M.MODES[this.qmode].label} · 第 ${this.page + 1} / ${this.pages} 页`, count: `已答 ${n} / ${this.items.length}`,
        pct: n / this.items.length * 100, first: this.page === 0, last: this.page === this.pages - 1,
        ready: list.every(x => A[x.id] != null),
        items: list.map(x => ({
          id: x.id, no: String(this.items.indexOf(x) + 1).padStart(2, "0"), text: x.text, done: A[x.id] != null,
          dots: M.SCALE.map((s, i) => ({ v: s.v, i, size: DOT[i], on: A[x.id] === s.v }))
        }))
      }
    });
    if (top) wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },
  pick(e) {
    AU.unlock();
    const { id, v } = e.currentTarget.dataset;
    this.answers[id] = +v;
    this.saveDraft();
    this.renderPage(false);
    // 自动滚到本页下一道没答的题
    const next = this.data.q.items.find(x => !x.done);
    setTimeout(() => wx.pageScrollTo({ selector: next ? `#q${next.id}` : "#qnav", offsetTop: -160, duration: 260 }), 80);
  },
  prev() { if (this.page > 0) { this.page--; this.saveDraft(); this.renderPage(true); } },
  next() {
    if (!this.data.q.ready) return wx.showToast({ title: "这一页还有题没答", icon: "none" });
    if (this.page < this.pages - 1) { this.page++; this.saveDraft(); this.renderPage(true); return; }
    const res = M.score(this.answers, this.qmode);
    store.saveQuizDraft(null);
    store.saveMbti(res);
    this.showResult(res);
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },
  pause() { this.saveDraft(); this.showIntro(); },

  // ---------- 结果 ----------
  showResult(res) {
    res = M.normalize(res);
    this.result = res;
    const type = res.type, gk = M.groupOf(type), g = M.groups[gk], prof = M.profiles[type], tf = type[2];
    const main = M.complement[tf], rec = tf === "T" ? env.ROUTES.t2f : env.ROUTES.f2t;
    // 在同一侧（T 或 F）的故事角色里，找和你字母重合最多的那一位
    const cands = [];
    for (const st of store.list()) for (const p of ["A", "B"]) {
      const t = st.POV[p].tag;
      if (t && t[2] === tf) cands.push({ st, p, t, same: t.split("").filter((c, k) => c === type[k]).length });
    }
    cands.sort((x, y) => y.same - x.same || x.st.order - y.st.order);
    const best = cands[0], campus = cands.find(c => c.st.id === "campus");
    wx.setNavigationBarTitle({ title: "我的 MBTI" });
    this.setData({
      mode: "result",
      res: {
        type, letters: type.split(""), name: M.names[type], g: { name: g.name, desc: g.desc, color: g.color, deep: g.deep, soft: g.soft },
        tagline: prof.tagline, desc: prof.desc, strengths: prof.strengths, blind: prof.blind, growth: prof.growth,
        dims: M.dimRows(res).map(r => ({
          name: r.name, a: `${r.an} ${r.a}`, b: `${r.b} ${r.bn}`, left: r.left, p: r.p, w: r.p - 50, letterName: r.letterName,
          desc: r.desc, clar: `偏好${r.clarity.label}`, ck: r.clarity.k
        })),
        color: rec.color, recTag: `现在就能玩 · ${tf} 解锁 ${main.to}`, unlockTitle: main.title, unlockDesc: main.desc,
        best: best ? {
          text: `和你最像的角色是 ${best.st.POV[best.p].name}（${best.t}），和你有 ${best.same} 个字母相同。你会先以 TA 的身份经历，再切到相反类型的那个人身上。`,
          btn: `从${best.st.POV[best.p].name}（${best.t}）开始《${best.st.title}》`, url: `/pages/story/story?id=${best.st.id}&pov=${best.p}`
        } : null,
        campus: campus && best && best.st.id !== "campus" ? `/pages/story/story?id=campus&pov=${campus.p}` : "",
        route: { text: `日常练习：${rec.title}`, url: `/pages/route/route?id=${rec.id}` },
        others: ["EI", "SN", "JP"].map(d => { const k = type[M.DIMS.indexOf(d)], c = M.complement[k]; return { title: `${k} 解锁 ${c.to} · ${c.title}`, desc: c.desc }; }),
        termNote: M.TERM_NOTE,
        modeNote: res.mode === "quick" ? "快速版（24 题）" : res.mode === "full" ? "专业版（60 题）" : "旧版测试（22 题）"
      }
    });
    this.paintAvatar();
  },
  paintAvatar() {
    const type = this.result.type, sex = store.avatarSex();
    this.setData({ sex, avatar: SVG.char(env.ART.typeChar(type, sex), type[0] === "E" ? "smile" : "normal", "idle") });
  },
  setSex(e) { store.saveAvatarSex(e.currentTarget.dataset.s); this.paintAvatar(); },
  shareCard() { AU.unlock(); wx.navigateTo({ url: "/packageShare/card/card" }); },

  // 从结果页开始故事 / 练习：替换掉测试页，退出后直接回首页（与网页版一致）
  go(e) { AU.unlock(); wx.redirectTo({ url: e.currentTarget.dataset.url }); },
  retest() { store.saveQuizDraft(null); this.showIntro(); wx.pageScrollTo({ scrollTop: 0, duration: 0 }); },
  home() { wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) }); },

  onShareAppMessage() {
    const r = this.data.res;
    return {
      title: r && this.data.mode === "result" ? `我的 MBTI 是 ${r.type}（${r.name}），来测测你的另一面` : "MBTI 性格修炼手册：60 题专业测试，测出你的 MBTI",
      path: "/pages/index/index"
    };
  },
  onShareTimeline() { return { title: "MBTI 性格修炼手册：测出你的 MBTI，体验另一面" }; }
});
