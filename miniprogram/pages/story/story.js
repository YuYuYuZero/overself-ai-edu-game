// 故事页：?id=campus&pov=B 新开一局；&act=resume 读档继续；&act=toc 直接打开章节目录。
const createUI = require("../../core/ui");
const createStory = require("../../core/story");
const stage = require("../../core/stage-page");
const { initial } = require("../../core/vn");
const lay = require("../../core/lay");
const AU = require("../../core/au");

Page(Object.assign({}, stage, {
  data: {
    isStory: true, mode: "", rv: "", lay: {}, hudB: 140, muted: false,
    vn: initial(), panel: null, hud: {}, meters: [], caught: "", pulse: false, hot: false, veryHot: false,
    prog: { segs: [], w: "0", pct: "" }, view: null, pageBg: "", pageK: 0, inter: null, tcard: null, toc: null
  },
  onLoad(q) {
    this.ui = createUI(this);
    this.setData({ lay: lay(), muted: AU.isMuted() });
    this.rotateHint();
    this.engine = createStory(this, this.ui);
    const id = q.id || "campus";
    if (q.act === "resume") { if (!this.engine.resume(id)) this.engine.start(id); }
    else if (q.act === "toc") this.engine.toc(id);
    else this.engine.start(id, q.pov);
  },
  onUnload() { this.engine.dispose(); this.ui.kill(); },
  onExit() { this.engine.exit(); },
  onToc() { this.engine.openToc(); }
}));
