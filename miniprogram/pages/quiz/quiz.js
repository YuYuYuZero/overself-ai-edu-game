// MBTI 测试与结果（网页版 game.js › quiz / quizResult）。?view=result 直接看上次的结果。
const env = require("../../shared/index.js");
const store = require("../../core/store");
const AU = require("../../core/au");

Page({
  data: { mode: "", i: 0, total: 0, pct: 0, q: "", opts: [], res: null },

  onLoad(q) {
    const mine = q.view === "result" && store.mbti();
    if (mine) this.showResult(mine); else this.startQuiz();
  },

  startQuiz() {
    this.qs = env.QUIZ; this.i = 0;
    this.score = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    this.order = this.qs.map(() => Math.random() < 0.5); // 随机左右顺序，避免位置偏好
    wx.setNavigationBarTitle({ title: "MBTI 测试" });
    this.show();
  },
  show() {
    const qs = this.qs, i = this.i;
    if (i >= qs.length) return this.finish();
    const q = qs[i], a = { text: q.a, v: q.dim[0] }, b = { text: q.b, v: q.dim[1] };
    this.opts = this.order[i] ? [a, b] : [b, a];
    this.setData({ mode: "quiz", i: i + 1, total: qs.length, pct: i / qs.length * 100, q: q.q, opts: this.opts.map(o => o.text) });
  },
  pick(e) {
    AU.unlock();
    const d = e.currentTarget.dataset;
    if (+d.q !== this.i + 1) return; // 连点时只算当前这一题
    this.score[this.opts[d.i].v]++;
    this.i++;
    this.show();
  },
  finish() {
    // 每个维度都是奇数道题，不会打平；保留平局兜底（取首字母）
    const type = ["EI", "SN", "TF", "JP"].map(d => (this.score[d[0]] >= this.score[d[1]] ? d[0] : d[1])).join("");
    const res = { type, score: this.score };
    store.saveMbti(res);
    this.showResult(res);
  },

  showResult(res) {
    const M = env.MBTI, type = res.type, score = res.score, tf = type[2];
    const main = M.complement[tf], rec = tf === "T" ? env.ROUTES.t2f : env.ROUTES.f2t;
    const dims = ["EI", "SN", "TF", "JP"].map(d => {
      const a = score[d[0]], b = score[d[1]], n = a + b || 1;
      return { l: `${M.dims[d][d[0]]} ${a}`, r: `${b} ${M.dims[d][d[1]]}`, lOn: type.includes(d[0]), rOn: type.includes(d[1]), wa: a / n * 100, wb: b / n * 100, close: Math.abs(a - b) <= 1 };
    });
    // 在同一侧（T 或 F）的角色里，找和你字母重合最多的那一位
    const cands = [];
    for (const st of store.list()) for (const p of ["A", "B"]) {
      const t = st.POV[p].tag;
      if (t && t[2] === tf) cands.push({ st, p, t, same: t.split("").filter((c, k) => c === type[k]).length });
    }
    cands.sort((x, y) => y.same - x.same || x.st.order - y.st.order);
    const best = cands[0], campus = cands.find(c => c.st.id === "campus");
    const others = ["EI", "SN", "JP"].map(d => {
      const k = type["EI SN TF JP".split(" ").indexOf(d)], c = M.complement[k];
      return { title: `${k} 解锁 ${c.to} · ${c.title}`, desc: c.desc };
    });
    wx.setNavigationBarTitle({ title: "我的 MBTI" });
    this.setData({
      mode: "result",
      res: {
        letters: type.split(""), name: M.names[type], dims, color: rec.color,
        recTag: `现在就能玩 · ${tf} 解锁 ${main.to}`, title: `你的解锁方向：${main.title}`, desc: main.desc,
        best: best ? {
          text: `和你最像的角色是 ${best.st.POV[best.p].name}（${best.t}），和你有 ${best.same} 个字母相同。你会先以 TA 的身份经历，再切到相反类型的那个人身上。`,
          btn: `从${best.st.POV[best.p].name}（${best.t}）开始《${best.st.title}》`, url: `/pages/story/story?id=${best.st.id}&pov=${best.p}`
        } : null,
        campus: campus && best && best.st.id !== "campus" ? `/pages/story/story?id=campus&pov=${campus.p}` : "",
        route: { text: `日常练习：${rec.title}`, url: `/pages/route/route?id=${rec.id}` },
        others
      }
    });
  },

  // 从结果页开始故事 / 练习：替换掉测试页，退出后直接回首页（与网页版一致）
  go(e) { AU.unlock(); wx.redirectTo({ url: e.currentTarget.dataset.url }); },
  home() { wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) }); },

  onShareAppMessage() {
    const r = this.data.res;
    return { title: r ? `我的 MBTI 是 ${r.letters.join("")}，来测测你的另一面` : "MBTI 性格修炼手册：测出你的 MBTI，体验另一面", path: "/pages/index/index" };
  }
});
