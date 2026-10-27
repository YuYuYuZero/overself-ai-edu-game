// 网页版大量用 color-mix(in srgb, var(--route) N%, white)；小程序的 WebView 不一定支持，这里先算好再当 CSS 变量传进去。
function rgb(hex) {
  let h = String(hex || "#5a48c2").replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h, 16);
  return [n >> 16, n >> 8 & 255, n & 255];
}
// k = 这个颜色占的比例，其余是白色
function mix(hex, k) {
  const [r, g, b] = rgb(hex), f = v => Math.round(v * k + 255 * (1 - k));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function alpha(hex, a) { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; }
// 页面根节点 style：--route 及其浅色 / 半透明版本
function routeVars(c) {
  c = c || "#5a48c2";
  return `--route:${c};--route-6:${mix(c, .06)};--route-8:${mix(c, .08)};--route-12:${mix(c, .12)};--route-15:${mix(c, .15)};` +
    `--route-45:${mix(c, .45)};--route-55:${mix(c, .55)};--route-a25:${alpha(c, .25)};--route-a50:${alpha(c, .5)};--route-a70:${alpha(c, .7)};`;
}
module.exports = { mix, alpha, routeVars };
