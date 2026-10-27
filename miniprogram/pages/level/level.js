// 日常练习关：?route=t2f&i=0
const createUI = require("../../core/ui");
const createLevel = require("../../core/level");
const stage = require("../../core/stage-page");
const { initial } = require("../../core/vn");
const lay = require("../../core/lay");
const AU = require("../../core/au");

Page(Object.assign({}, stage, {
  data: {
    isStory: false, mode: "", rv: "", lay: {}, hudB: 120, muted: false,
    vn: initial(), panel: null, hud: {}, meters: [], caught: "", pulse: false, hot: false, veryHot: false, result: null
  },
  onLoad(q) {
    this.ui = createUI(this);
    this.setData({ lay: lay(), muted: AU.isMuted() });
    this.rotateHint();
    this.engine = createLevel(this, this.ui);
    this.engine.play(q.route, +q.i || 0);
  },
  onUnload() { this.engine.dispose(); this.ui.kill(); },
  onExit() { this.leave(); }
}));
