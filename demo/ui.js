// 网页版的 DOM 小工具（首页、测试、练习关共用）→ window.UI
window.UI = (function () {
  const app = document.getElementById("app");

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k === "style") n.style.cssText = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }

  let timers = [];
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; }
  function track(t) { timers.push(t); return t; }

  // 换一整屏：清掉上一屏的定时器和心跳，回到页面顶部
  function screen(...kids) {
    clearTimers(); AU.heart(0);
    document.body.className = "";
    app.innerHTML = ""; app.append(...kids); window.scrollTo(0, 0);
  }
  function starsEl(n, size) {
    const s = el("span", { class: "stars", style: size ? `font-size:${size}px` : "" });
    for (let i = 0; i < 3; i++) s.append(el("span", { class: i < n ? "" : "off" }, "★"));
    return s;
  }
  function setRouteColor(c) { document.documentElement.style.setProperty("--route", c || "#5a48c2"); }
  // 章节标题：壹 / 贰 / 叁 … + 标题
  const NUM = "壹贰叁肆伍陆柒捌玖拾";
  function secTitle(i, text, extra) {
    return el("h3", { class: "sec-title" }, el("span", { class: "sec-no" }, NUM[i] || i + 1), el("span", {}, text), extra || null);
  }

  return { app, el, later, clearTimers, track, screen, starsEl, setRouteColor, secTitle };
})();
