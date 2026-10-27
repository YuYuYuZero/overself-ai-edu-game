// 故事页、练习关页共用的舞台事件（模板见 templates/stage.wxml）。页面需提供 this.ui 和 this.engine。
const AU = require("./au");
const lay = require("./lay");
const HINT_KEY = "overself.rotateHint.v1";

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
  // ---------- 横屏 ----------
  // 页面配置了 pageOrientation: auto，手机横过来就会触发；重新量尺寸、HUD 高度
  onResize() {
    this.setData({ lay: lay() }, () => this.measureHud());
  },
  // HUD 上的「横屏 / 竖屏」按钮。wx.setPageOrientation 是基础库里有、但文档没写的接口，没有就提示用户转手机
  onRotate() {
    AU.unlock();
    const to = this.data.lay.land ? "portrait" : "landscape";
    if (typeof wx.setPageOrientation === "function") {
      wx.setPageOrientation({ orientation: to, fail: () => this.rotateTip(to) });
    } else this.rotateTip(to);
  },
  rotateTip(to) {
    wx.showModal({
      title: to === "landscape" ? "横过来玩" : "竖过来玩",
      content: to === "landscape" ? "把手机横过来，舞台会更大，人物和对话框也更舒展。\n\n如果没有反应，请先关闭手机的「竖排方向锁定」。" : "把手机竖过来即可。",
      showCancel: false, confirmText: "知道了"
    });
  },
  // 第一次进舞台时提示一次可以横屏
  rotateHint() {
    try {
      if (this.data.lay.land || wx.getStorageSync(HINT_KEY)) return;
      wx.setStorageSync(HINT_KEY, 1);
      setTimeout(() => wx.showToast({ title: "横过手机，舞台更大", icon: "none", duration: 2200 }), 1600);
    } catch (e) {}
  },
  leave() {
    if (this._left) return;
    this._left = true;
    if (getCurrentPages().length > 1) wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) });
    else wx.reLaunch({ url: "/pages/index/index" });
  }
};
