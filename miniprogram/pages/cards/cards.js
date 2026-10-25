// 技能卡收藏（网页版 game.js › collection）：故事里的技能卡在前，练习关的在后。
const env = require("../../shared/index.js");
const store = require("../../core/store");

Page({
  data: { items: [] },
  onShow() {
    const progress = store.progress(), items = [];
    for (const r of Object.values(env.ROUTES)) for (const l of r.levels) {
      if (progress.cards[l.id]) items.push({ color: r.color, sub: `${r.title} · ${l.title}`, title: l.takeaway.title, points: l.takeaway.points });
    }
    for (const c of store.storyCards()) items.unshift({ color: c.P.color, sub: `《${c.story}》· ${c.ch} · ${c.P.name}`, title: c.title, points: c.points });
    this.setData({ items });
  }
});
