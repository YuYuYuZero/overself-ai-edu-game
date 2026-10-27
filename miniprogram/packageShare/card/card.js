// 分享卡片（分包 packageShare：16 型 × 男女的形象图都放在这里，不占主包体积）。
// 绘制逻辑与网页版共用 shared/share-card.js；人物用 tools/render-portraits.mjs 预先渲染的 PNG（真机 Canvas 画不了 SVG）。
const env = require("../../shared/index.js");
const store = require("../../core/store");

// 小程序码：在小程序后台「工具 → 生成小程序码」下载后放到 miniprogram/img/qrcode.png，再把这里改成 "/img/qrcode.png"
const QR = "";
const FOOTER = "微信搜索「MBTI 性格修炼手册」小程序";

Page({
  data: { img: "", cover: "", loading: true, type: "", failed: false },

  onLoad() {
    const res = store.mbti();
    if (!res) { wx.showToast({ title: "先做一次测试吧", icon: "none" }); return setTimeout(() => wx.redirectTo({ url: "/pages/quiz/quiz" }), 800); }
    this.res = res;
    this.setData({ type: res.type });
  },
  onReady() { if (this.res) this.draw(); },

  node(id) {
    return new Promise(ok => wx.createSelectorQuery().in(this).select(id).fields({ node: true, size: true }).exec(r => ok(r && r[0] && r[0].node)));
  },
  load(canvas, src) {
    return new Promise(ok => {
      if (!src) return ok(null);
      const img = canvas.createImage();
      img.onload = () => ok(img); img.onerror = () => ok(null);
      img.src = src;
    });
  },
  async paint(id, w, h, fn) {
    const canvas = await this.node(id);
    if (!canvas) throw new Error("canvas 未就绪");
    const dpr = 2;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const sex = store.avatarSex();
    const [portrait, logo, qr] = await Promise.all([
      this.load(canvas, `/packageShare/portraits/${this.res.type}-${sex}.png`), this.load(canvas, "/img/logo-icon.png"), this.load(canvas, QR)
    ]);
    fn(ctx, { portrait, logo, qr });
    return new Promise((ok, no) => wx.canvasToTempFilePath({ canvas, fileType: "png", success: r => ok(r.tempFilePath), fail: no }));
  },
  async draw() {
    const SC = env.ShareCard, d = SC.data(this.res, { footer: FOOTER, cta: QR ? "长按识别，测出你的 MBTI" : "测出你的 MBTI，体验另一面" });
    try {
      const img = await this.paint("#poster", SC.W, SC.H, (ctx, imgs) => SC.poster(ctx, d, imgs));
      this.setData({ img, loading: false });
      const cover = await this.paint("#cover", SC.CW, SC.CH, (ctx, imgs) => SC.cover(ctx, d, imgs));
      this.setData({ cover });
    } catch (e) {
      console.error("分享卡片生成失败", e);
      this.setData({ loading: false, failed: true });
    }
  },

  preview() { if (this.data.img) wx.previewImage({ urls: [this.data.img] }); },
  save() {
    if (!this.data.img) return;
    // 基础库 2.14.3+：系统的图片分享菜单（发给朋友 / 保存 / 朋友圈），否则退回保存到相册
    if (wx.showShareImageMenu) return wx.showShareImageMenu({ path: this.data.img, fail: () => this.saveAlbum() });
    this.saveAlbum();
  },
  saveAlbum() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.img,
      success: () => wx.showToast({ title: "已保存到相册" }),
      fail: e => {
        if (/auth|deny/.test(e.errMsg || "")) {
          wx.showModal({ title: "需要相册权限", content: "允许保存到相册后，才能把卡片存下来", confirmText: "去设置", success: r => r.confirm && wx.openSetting() });
        }
      }
    });
  },

  onShareAppMessage() {
    const M = env.MBTI, t = this.res && this.res.type;
    return { title: t ? `我的 MBTI 是 ${t}（${M.names[t]}），来测测你的另一面` : "MBTI 性格修炼手册", path: "/pages/index/index", imageUrl: this.data.cover || undefined };
  },
  onShareTimeline() {
    const t = this.res && this.res.type;
    return { title: t ? `我的 MBTI 是 ${t}，测出你的 MBTI，体验另一面` : "MBTI 性格修炼手册", imageUrl: this.data.cover || undefined };
  }
});
