// 立绘与背景：网页版 art.js 直接产出 SVG 字符串，这里转成 <image> 能用的 data URI（带缓存）。
// 网页版靠页面 CSS 控制立绘的眨眼（.eo/.ec）和说话口型（.mo/.mc）；图片里的 SVG 读不到页面样式，
// 所以把这几条动画写进 SVG 自己的 <style>：static = 不动，idle = 眨眼，talk = 眨眼 + 说话。
const { ART } = require("../shared/index.js");

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function base64(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) c = 0x10000 + ((c - 0xd800) << 10) + (str.charCodeAt(++i) - 0xdc00);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | c >> 6, 0x80 | c & 63);
    else if (c < 0x10000) bytes.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    else bytes.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
  }
  const out = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const n = bytes[i] << 16 | (bytes[i + 1] || 0) << 8 | (bytes[i + 2] || 0);
    out.push(B64[n >> 18 & 63], B64[n >> 12 & 63], i + 1 < bytes.length ? B64[n >> 6 & 63] : "=", i + 2 < bytes.length ? B64[n & 63] : "=");
  }
  return out.join("");
}

const BLINK = "@keyframes bo{0%,95%,100%{opacity:1}96%,98%{opacity:0}}@keyframes bc{0%,95%,100%{opacity:0}96%,98%{opacity:1}}";
const TALK = ".mo{animation:to .26s steps(1) infinite}.mc{animation:tc .26s steps(1) infinite}" +
  "@keyframes to{0%{opacity:1}50%{opacity:0}}@keyframes tc{0%{opacity:0}50%{opacity:1}}";
function style(kind, d) {
  if (kind === "static") return ".mo,.ec{opacity:0}";
  const blink = `.mo,.ec{opacity:0}.eo{animation:bo 4.6s ${d}s infinite}.ec{animation:bc 4.6s ${d}s infinite}${BLINK}`;
  return kind === "talk" ? blink + TALK : blink;
}
// 每个人物固定一个眨眼相位，同屏的人不会同时眨眼
function delayOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return (h % 5) * 0.9;
}

// 同一标签里重复的属性只留第一个：内嵌在 HTML 里时浏览器会忽略重复项，单独当图片解析（XML）时会直接报错不显示
function dedupe(svg) {
  return svg.replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")+)\s*(\/?)>/g, (m, tag, attrs, close) => {
    const seen = {};
    const kept = attrs.match(/\s+[\w:-]+="[^"]*"/g).filter(a => { const k = a.trim().split("=")[0]; return seen[k] ? false : (seen[k] = true); });
    return `<${tag}${kept.join("")}${close ? "/" : ""}>`;
  });
}

// 压缩空白；根节点按 viewBox 补上宽高（图片需要固有尺寸），去掉网页用的 class/style，插入动画样式
function toUri(svg, css) {
  if (!svg || svg.indexOf("<svg") !== 0) return "";
  svg = dedupe(svg.replace(/\s*\n\s*/g, " ").replace(/>\s+</g, "><")).replace(/^<svg([^>]*)>/, (m, a) => {
    a = a.replace(/\s(style|class)="[^"]*"/g, "");
    const vb = /viewBox="([^"]+)"/.exec(a);
    if (vb) { const p = vb[1].trim().split(/[\s,]+/).map(Number); a += ` width="${+p[2].toFixed(2)}" height="${+p[3].toFixed(2)}"`; }
    return `<svg${a}>${css ? `<style>${css}</style>` : ""}`;
  });
  return "data:image/svg+xml;base64," + base64(svg);
}

const cache = new Map();
function get(key, make) {
  let v = cache.get(key);
  if (v === undefined) {
    if (cache.size > 160) cache.clear();
    v = make();
    cache.set(key, v);
  }
  return v;
}

module.exports = {
  // kind: static / idle / talk
  char: (id, expr = "normal", kind = "static") => get(`c|${id}|${expr}|${kind}`, () => toUri(ART.char(id, expr), style(kind, delayOf(id)))),
  head: (id, expr = "normal") => get(`h|${id}|${expr}`, () => toUri(ART.char(id, expr, { crop: "head" }), style("static"))),
  bg: id => (id ? get(`b|${id}`, () => toUri(ART.bg(id), "")) : ""),
  has: id => ART.has(id),
  base64
};
