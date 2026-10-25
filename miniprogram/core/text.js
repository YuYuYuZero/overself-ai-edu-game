// 台词标记（与网页版 story.js 一致）：[事实] 在情绪滤镜下模糊；**情绪词** 在滤镜下放大变红；==回听高亮==。
// 网页版把它们拼成 HTML；小程序这边再把这几种受限 HTML 拆成 [{ t: 文本, c: 样式类 }]，用 <text> 逐段渲染。
const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const unesc = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function markup(text, filtered) {
  return esc(text)
    .replace(/\[(.+?)\]/g, (_, s) => filtered ? `<span class="blurred">${s}</span>` : s)
    .replace(/\*\*(.+?)\*\*/g, (_, s) => filtered ? `<strong class="hotword">${s}</strong>` : s)
    .replace(/==(.+?)==/g, (_, s) => `<mark class="fact">${s}</mark>`);
}

function segs(html) {
  const out = [], stack = [];
  const push = t => {
    const c = stack.join(" ");
    const last = out[out.length - 1];
    if (last && last.c === c) last.t += t; else out.push({ t, c });
  };
  const re = /<(\/?)(span|strong|mark|b|br)\b([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(String(html)))) {
    if (m[4] != null) { push(unesc(m[4])); continue; }
    if (m[2] === "br") { push("\n"); continue; }
    if (m[1]) stack.pop();
    else { const c = /class="([^"]*)"/.exec(m[3]); stack.push(c ? c[1] : m[2]); }
  }
  return out;
}
const plain = html => segs(html).map(s => s.t).join("");

module.exports = { esc, markup, segs, plain };
