// 首页（网页版 game.js › home）：测 → 体验 → 解锁、T 与 F、三个故事、日常练习、更多维度预告。
const env = require("../../shared/index.js");
const AU = require("../../core/au");
const SVG = require("../../core/svg");
const store = require("../../core/store");
const lay = require("../../core/lay");
const { mix } = require("../../core/color");

const firstBg = st => {
  const n = (st.chapters[0].seq || st.chapters[0][st.defaultStart || "A"] || []).find(x => x.bg);
  return st.cover || (n && n.bg);
};

Page({
  data: { lay: {}, muted: false, hero: {}, sides: [], mine: null, cardCount: 0, stories: [], routes: [], coming: [] },

  onLoad() {
    const M = env.MBTI;
    this.setData({
      lay: lay(),
      hero: { bg: SVG.bg("classroom_evening"), chars: [SVG.char("chenyu", "normal"), SVG.char("xiaoman", "smile")] },
      sides: [
        { c: "#4a8fe0", tint: mix("#4a8fe0", .14), av: SVG.head("chenyu", "think"), who: "T 型（思考）的你", pain: "道理都对，却常常读不懂人心", grow: "解锁 F：读懂人心", how: "在讲道理之前，先看见对方的情绪、接住对方" },
        { c: "#f07c5a", tint: mix("#f07c5a", .14), av: SVG.head("xiaoman", "think"), who: "F 型（情感）的你", pain: "感受很深，却容易被情绪带着走", grow: "解锁 T：冷静解题", how: "情绪是警报不是导航：先停一下，再把问题拆开解决" }
      ],
      coming: ["E", "I", "S", "N", "J", "P"].map(k => { const c = M.complement[k]; return { title: `${k} 解锁 ${c.to} · ${c.title}`, desc: c.desc.split(" → ")[0] }; })
    });
  },

  onShow() {
    AU.bgm("home"); AU.amb(null); AU.heart(0);
    const M = env.MBTI, mine = store.mbti(), progress = store.progress();
    const stories = store.list().map(st => {
      const saved = store.saved(st.id), P = st.POV;
      return {
        id: st.id, cover: SVG.bg(firstBg(st)), chars: ["A", "B"].map(p => SVG.char(P[p].char, "normal")),
        badge: st.order === 1, tag: `${st.tag} · 约 ${st.minutes} 分钟`, title: `《${st.title}》`, blurb: st.blurb,
        resume: saved ? `继续：${(st.chapters[saved.ch] || {}).title || ""}` : "",
        povs: ["A", "B"].map(p => ({ p, color: P[p].color, text: `从${P[p].name}开始（${P[p].tag}）` }))
      };
    });
    const routes = Object.values(env.ROUTES).map(r => ({
      id: r.id, color: r.color, tint: mix(r.color, .15), dir: r.dir, title: r.title, subtitle: r.subtitle,
      info: `${r.levels.length} 关 · 每关 3 分钟 · 已完成 ${r.levels.filter(l => progress.stars[l.id]).length}`
    }));
    this.setData({
      muted: AU.isMuted(),
      mine: mine ? { type: mine.type, name: M.names[mine.type] } : null,
      cardCount: Object.keys(progress.cards).length + store.storyCards().length,
      stories, routes
    });
  },

  unlock() { AU.unlock(); },
  go(e) { AU.unlock(); wx.navigateTo({ url: e.currentTarget.dataset.url }); },
  onMute() { AU.unlock(); AU.setMuted(!AU.isMuted()); this.setData({ muted: AU.isMuted() }); },

  onShareAppMessage() { return { title: "MBTI 性格修炼手册：测出你的 MBTI，体验另一面，解锁另一个你", path: "/pages/index/index" }; },
  onShareTimeline() { return { title: "MBTI 性格修炼手册：测出你的 MBTI，体验另一面，解锁另一个你" }; }
});
