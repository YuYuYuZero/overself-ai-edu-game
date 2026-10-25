// 故事页、练习关页共用的舞台事件（模板见 templates/stage.wxml）。页面需提供 this.ui 和 this.engine。
const AU = require("./au");

module.exports = {
  vn() { return this.engine && this.engine.vn(); },
  // 交互面板、目录、页面按钮：统一 data-id → ui 里登记的回调
  onTap(e) { AU.unlock(); this.ui.tap(e.currentTarget.dataset.id); },
  // 点舞台空白处 = 点"▼ 继续"
  onStage() { AU.unlock(); const vn = this.vn(); if (vn) vn.tapAdvance(); },
  onAdv() { AU.unlock(); const vn = this.vn(); if (vn) vn.tapAdvance(); },
  onVoice() { const vn = this.vn(); if (vn) vn.tapVoice(); },
  onLog() { const vn = this.vn(); if (vn) vn.showBacklog(); },
  onLogClose() { const vn = this.vn(); if (vn) vn.hideBacklog(); },
  onMute() { AU.unlock(); AU.setMuted(!AU.isMuted()); this.setData({ muted: AU.isMuted() }); },
  noop() {},
  // 舞台上的地点牌、旁白框、手机等按 HUD 下沿定位
  measureHud() {
    wx.createSelectorQuery().in(this).select(".hud").boundingClientRect(r => {
      if (r && r.height) this.setData({ hudB: Math.round(r.bottom) });
    }).exec();
  },
  leave() {
    if (this._left) return;
    this._left = true;
    if (getCurrentPages().length > 1) wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) });
    else wx.reLaunch({ url: "/pages/index/index" });
  }
};
