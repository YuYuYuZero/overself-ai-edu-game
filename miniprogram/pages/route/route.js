// 练习路线的关卡列表（网页版 game.js › routeScreen）：?id=t2f
const env = require("../../shared/index.js");
const store = require("../../core/store");
const { routeVars } = require("../../core/color");

Page({
  data: { rv: "", r: null, levels: [] },
  onLoad(q) {
    this.r = env.ROUTES[q.id] || env.ROUTES[Object.keys(env.ROUTES)[0]];
    wx.setNavigationBarTitle({ title: this.r.title });
    this.setData({ rv: routeVars(this.r.color), r: { id: this.r.id, dir: this.r.dir, title: this.r.title, subtitle: this.r.subtitle, color: this.r.color, otherView: this.r.otherView } });
  },
  onShow() {
    const p = store.progress();
    this.setData({ levels: this.r.levels.map((l, i) => ({ i, n: `第 ${i + 1} 关`, title: l.title, skill: l.skill, stars: [0, 1, 2].map(k => (k < (p.stars[l.id] || 0) ? "" : "off")) })) });
  },
  play(e) { wx.navigateTo({ url: `/pages/level/level?route=${this.r.id}&i=${e.currentTarget.dataset.i}` }); }
});
