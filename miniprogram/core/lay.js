// 屏幕与胶囊按钮位置：舞台页是自定义导航栏（全屏），HUD 要让开状态栏和右上角胶囊。
// 故事页、练习关页允许横屏（pageOrientation: auto），旋转后在 onResize 里重新调用。
module.exports = function lay() {
  const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  const W = win.windowWidth, H = win.windowHeight, sb = win.statusBarHeight || 20;
  const land = W > H;
  let m = null;
  try { m = wx.getMenuButtonBoundingClientRect(); } catch (e) {}
  if (!m || !m.height || m.left > W) m = { top: land ? 8 : sb + 6, height: 32, bottom: land ? 40 : sb + 38, left: W - 94 };
  const safeB = win.safeArea ? Math.max(0, H - win.safeArea.bottom) : 0;
  // 竖屏：立绘区与网页版手机竖屏一致，高 56%，底边在对话框上沿。
  // 横屏：与网页版宽屏一致，立绘站满舞台（高 92%），对话框压在腿上。立绘框按 SVG 的 400×760 等比。
  const charsH = land ? H * 0.92 : H * 0.56;
  return {
    W, H, sb, safeB, land,
    capTop: m.top, capH: m.height, capB: m.bottom, capW: W - m.left + 6,
    sw: Math.round(charsH * 0.95 * 400 / 760), swc: Math.round(charsH * (land ? 0.88 : 0.836) * 400 / 760)
  };
};
