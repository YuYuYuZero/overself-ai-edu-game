// 视觉小说舞台：背景 + 立绘 + 底部对话框 + 漫画式旁白字幕 + 手机界面 → window.VN
// story.js（主线）和 game.js（练习关）共用。设计说明见 docs/04-美术与UI设计.md。
window.VN = (function () {
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

  // 手机竖屏第一次进舞台时提示可以横过来（只提示一次，和小程序共用同一个说法）
  const HINT_KEY = "overself.rotateHint.v1";
  function rotateHint(stage) {
    try {
      if (!matchMedia("(orientation: portrait) and (pointer: coarse)").matches || localStorage.getItem(HINT_KEY)) return;
      localStorage.setItem(HINT_KEY, "1");
      setTimeout(() => stage.isConnected && stage.append(el("div", { class: "rotate-tip", onanimationend: e => e.target.remove() }, "横过手机，舞台更大")), 1600);
    } catch (e) {}
  }

  // opts: { pov:{name, char, color}, cast:{名字:立绘id}, hud:元素, onBack }
  function mount(host, opts) {
    const bgA = el("div", { class: "bg" }), bgB = el("div", { class: "bg" });
    const chars = el("div", { class: "chars" });
    const place = el("div", { class: "place" });
    const caption = el("div", { class: "caption" });
    const phoneHead = el("div", { class: "phone-head" }), phoneBody = el("div", { class: "phone-body" });
    const phone = el("div", { class: "phone" }, el("div", { class: "phone-notch" }), phoneHead, phoneBody);
    const sigLayer = el("div", { class: "sig-layer" });
    const coach = el("div", { class: "coach" });
    const nameplate = el("div", { class: "nameplate" }), dtext = el("div", { class: "dtext" }, el("div", { class: "txt" }));
    const dialog = el("div", { class: "dialog" }, nameplate, dtext);
    const action = el("div", { class: "action-layer" });
    const advance = el("div", { class: "advance" });
    const backlog = el("div", { class: "backlog" });
    const stage = el("div", { class: "stage" }, bgA, bgB, el("div", { class: "bg-shade" }), chars, place, caption, phone, sigLayer, coach, dialog, action, advance, backlog);
    host.append(stage);
    rotateHint(stage);

    const S = { sprites: new Map(), order: [], bgFront: bgA, bgId: null, history: [], phoneOn: false };
    const pov = opts.pov || {};
    const castOf = who => (opts.cast && opts.cast[who]) || (window.ART.has(who) ? who : null);

    // 点舞台空白处 = 点"继续"
    stage.addEventListener("click", e => {
      if (e.target.closest("button,.action-layer,.backlog,.phone .voice,a,input")) return;
      const b = advance.querySelector(".next-row .btn");
      if (b && !b.disabled) b.click();
    });

    function setBg(id) {
      if (!id || id === S.bgId) return;
      S.bgId = id;
      const back = S.bgFront === bgA ? bgB : bgA;
      back.innerHTML = window.ART.bg(id);
      back.classList.add("on"); S.bgFront.classList.remove("on");
      S.bgFront = back;
      stage.dataset.bg = id;
    }
    function setPlace(text) {
      if (!text) { place.classList.remove("on"); return; }
      place.textContent = text; place.classList.remove("on"); void place.offsetWidth; place.classList.add("on");
    }

    // ---------- 立绘 ----------
    function layout() {
      const list = S.order.map(id => S.sprites.get(id));
      const n = list.length;
      const pos = n === 1 ? [50] : n === 2 ? [27, 73] : [17, 50, 83];
      list.forEach((sp, i) => { sp.style.left = pos[i] + "%"; sp.style.zIndex = sp.classList.contains("active") ? 3 : 1; });
      stage.classList.toggle("crowd", n >= 3);
    }
    function sprite(id, expr) {
      let sp = S.sprites.get(id);
      if (!sp) {
        sp = el("div", { class: "sprite enter", "data-id": id, style: `--d:${(Math.random() * 4).toFixed(2)}s` });
        sp.innerHTML = window.ART.char(id, expr || "normal"); sp.dataset.expr = expr || "normal";
        chars.append(sp); S.sprites.set(id, sp);
        // 视角人物固定在最左
        if (id === pov.char) S.order.unshift(id); else S.order.push(id);
        if (S.order.length > 3) { const drop = S.order.find(x => x !== pov.char && x !== id); removeChar(drop, true); }
        layout();
        setTimeout(() => sp.classList.remove("enter"), 400);
      } else if (expr && expr !== sp.dataset.expr) {
        sp.innerHTML = window.ART.char(id, expr); sp.dataset.expr = expr;
      }
      return sp;
    }
    function removeChar(id, quiet) {
      const sp = S.sprites.get(id); if (!sp) return;
      S.sprites.delete(id); S.order = S.order.filter(x => x !== id);
      sp.classList.add("leave"); setTimeout(() => sp.remove(), 350);
      if (!quiet) layout();
    }
    function clearChars() { for (const id of [...S.order]) removeChar(id, true); }
    function setChars(ids, expr) { clearChars(); (ids || []).forEach(id => sprite(castOf(id) || id, expr)); layout(); }
    function focus(id, talkMs, remote) {
      for (const [k, sp] of S.sprites) {
        const on = k === id;
        sp.classList.toggle("active", on); sp.classList.toggle("dim", !!id && !on);
        sp.classList.remove("talking");
        if (on) sp.classList.toggle("remote", !!remote);
      }
      if (id && talkMs) { const sp = S.sprites.get(id); sp.classList.add("talking"); clearTimeout(sp._t); sp._t = setTimeout(() => sp.classList.remove("talking"), talkMs); }
      layout();
    }

    // ---------- 文本 ----------
    function plain(html) { const d = document.createElement("div"); d.innerHTML = html; return d.textContent; }
    function clearTransient() { coach.innerHTML = ""; sigLayer.querySelectorAll(".decode").forEach(x => x.remove()); }
    function narr(html, kind) {
      clearTransient();
      dialog.classList.remove("on");
      caption.className = "caption on" + (kind ? " " + kind : "");
      caption.innerHTML = `<div class="txt">${html}</div>`;
      focus(null);
      S.history.push(["", plain(html)]);
      return { row: caption, b: caption };
    }
    // who: "旁白" / "内心" / "你" / 角色名；opts: { expr, call, chat, tag, group }
    function line(who, html, o = {}) {
      if (who === "旁白" || who === "") return narr(html, o.kind);
      if (o.chat) return phoneMsg(who, html, o);
      clearTransient();
      caption.classList.remove("on");
      const inner = who === "内心", me = who === "你";
      const id = inner || me ? pov.char : castOf(who);
      const name = inner ? `${pov.name}（心里）` : me ? pov.name : who;
      if (S.phoneOn && !me && !inner) hidePhone();
      if (id) sprite(id, o.expr || (inner ? null : null));
      const len = plain(html).length;
      focus(id, inner ? 0 : Math.min(3500, 300 + len * 90), o.call && !me && !inner);
      dialog.className = "dialog on" + (inner ? " inner" : "") + (me ? " me" : "") + (o.call ? " call" : "");
      nameplate.textContent = name + (o.call && !me && !inner ? " · 📞" : "") + (o.tag ? ` · ${o.tag}` : "");
      nameplate.style.background = id === pov.char ? (pov.color || "") : "";
      const txt = el("div", { class: "txt", html });
      dtext.innerHTML = ""; dtext.append(txt);
      dtext.classList.remove("filtered", "replayed");
      S.history.push([name, plain(html)]);
      return { row: dialog, b: dtext };
    }
    function phoneMsg(who, html, o) {
      clearTransient();
      if (!S.phoneOn) { phoneBody.innerHTML = ""; S.phoneOn = true; }
      // 看手机的人（视角人物）留在画面里
      if (pov.char && !S.sprites.has(pov.char)) sprite(pov.char, "normal");
      focus(pov.char, 0);
      phoneHead.textContent = o.group || phoneHead.textContent || "消息";
      phone.classList.add("on");
      const me = who === "你", id = me ? pov.char : castOf(who);
      const name = me ? pov.name : who;
      const av = el("div", { class: "pav", html: id ? window.ART.char(id, o.expr || "normal", { crop: "head" }) : "💬" });
      const msg = el("div", { class: "pmsg" + (me ? " me" : "") }, av, el("div", {}, el("div", { class: "pname" }, name), el("div", { class: "pb txt", html })));
      phoneBody.append(msg);
      while (phoneBody.children.length > 5) phoneBody.firstChild.remove();
      dialog.classList.remove("on"); caption.classList.remove("on");
      S.history.push([name + "（消息）", plain(html)]);
      return { row: msg, b: msg.querySelector(".pb") };
    }
    function hidePhone() { phone.classList.remove("on"); S.phoneOn = false; phoneHead.textContent = ""; }
    function coachCard(kind, title, text) {
      coach.append(el("div", { class: "feedback " + kind }, title ? el("div", { class: "ft" }, title) : null, text));
    }
    function decode(text) {
      const d = el("div", { class: "decode" }, el("div", { class: "dl" }, "对方听到的"), el("div", { class: "dt" }, `「${text}」`));
      sigLayer.append(d);
    }
    function showBacklog() {
      backlog.innerHTML = "";
      backlog.append(el("div", { class: "bl-card" },
        el("div", { class: "bl-head" }, el("b", {}, "回看"), el("button", { class: "btn plain", onclick: () => backlog.classList.remove("on") }, "关闭")),
        el("div", { class: "bl-list" }, S.history.slice(-80).map(([n, t]) => el("div", { class: "bl-row" + (n ? "" : " narr") }, n ? el("b", {}, n + "：") : null, t)))));
      backlog.classList.add("on");
      const list = backlog.querySelector(".bl-list"); list.scrollTop = list.scrollHeight;
    }
    function scene(o) {
      if (o.bg) setBg(o.bg);
      if (o.bg || o.chars) { hidePhone(); setChars(o.chars || []); }
      if (o.text) setPlace(o.text);
      caption.classList.remove("on"); dialog.classList.remove("on");
    }

    return { stage, action, advance, sigLayer, coach, setBg, setPlace, scene, sprite, removeChar, clearChars, setChars, focus, line, narr, decode, coachCard, hidePhone, showBacklog, history: S.history, bgId: () => S.bgId, castOf };
  }

  return { mount, el };
})();
