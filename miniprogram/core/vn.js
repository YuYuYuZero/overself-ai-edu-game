// 视觉小说舞台（网页版 demo/vn.js 的小程序版）：背景 + 立绘 + 对话框 + 漫画旁白框 + 手机。
// 接口与网页版一致（scene / line / narr / decode / coachCard …）；网页版改 DOM 的地方，这里改页面数据 vn.*，
// 由 templates/stage.wxml 渲染。立绘图片放在 vn.img（key → data URI），立绘列表只引用 key，换表情、换焦点时不用重传图片。
const SVG = require("./svg");
const T = require("./text");

function initial() {
  return {
    bg0: "", bg1: "", bgOn: 0, sprites: [], crowd: false, img: {},
    place: { on: false, text: "", k: 0 },
    cap: { on: false, kind: "", k: 0, s: [] },
    dialog: { on: false, c: "", name: "", bg: "", k: 0, s: [], filtered: false, replayed: false },
    phone: { on: false, head: "", msgs: [] },
    sigs: [], decodes: [], coach: [], board: null, reveal: null,
    fx: "", adv: false, log: null, logTo: ""
  };
}

// opts: { pov: { name, char, color }, cast: { 名字: 立绘 id } }
function mount(ui, opts) {
  const pov = opts.pov || {};
  const castOf = who => (opts.cast && opts.cast[who]) || (SVG.has(who) ? who : null);
  const S = {
    sprites: new Map(), order: [], leaving: [], u: 0, k: 0,
    bgFront: 0, bgId: null, history: [], phoneOn: false,
    img: {}, imgKey: new Map(), imgN: 0,
    dialog: { on: false }, cap: { on: false }, phone: { on: false, head: "", msgs: [] },
    sigs: [], decodes: [], coach: [], fx: {}, advCb: null, voiceCb: null, talkT: 0,
    timers: new Set()
  };
  ui.drop("sig");
  ui.set({ vn: initial() });

  function later(fn, ms) { const t = setTimeout(() => { S.timers.delete(t); fn(); }, ms); S.timers.add(t); return t; }
  function cancel(t) { if (t) { clearTimeout(t); S.timers.delete(t); } }

  // ---------- 图片 ----------
  function img(cacheKey, make) {
    let k = S.imgKey.get(cacheKey);
    if (!k) {
      k = "i" + (++S.imgN);
      S.imgKey.set(cacheKey, k);
      S.img[k] = make();
      ui.set({ ["vn.img." + k]: S.img[k] });
    }
    return k;
  }
  const charImg = (id, expr, kind) => img(`${id}|${expr}|${kind}`, () => SVG.char(id, expr, kind));
  const headImg = (id, expr) => img(`${id}|${expr}|head`, () => SVG.head(id, expr));
  // 一局下来表情会越攒越多：超过一定数量就只留舞台上还在用的
  function prune() {
    if (S.imgKey.size <= 36) return;
    const used = new Set();
    for (const sp of S.sprites.values()) { used.add(sp.k); used.add(sp.kt); }
    S.leaving.forEach(sp => used.add(sp.k));
    S.phone.msgs.forEach(m => used.add(m.av));
    for (const [ck, k] of S.imgKey) if (!used.has(k)) { S.imgKey.delete(ck); delete S.img[k]; }
    ui.set({ "vn.img": S.img });
  }

  // ---------- 背景、地点牌 ----------
  function setBg(id) {
    if (!id || id === S.bgId) return;
    S.bgId = id;
    const back = 1 - S.bgFront;
    S.bgFront = back;
    ui.set({ ["vn.bg" + back]: SVG.bg(id), "vn.bgOn": back });
  }
  function setPlace(text) {
    ui.set({ "vn.place": { on: !!text, text: text || "", k: ++S.k } });
  }

  // ---------- 立绘 ----------
  function paintSprites() {
    const n = S.order.length, pos = n === 1 ? [50] : n === 2 ? [27, 73] : [17, 50, 83];
    S.order.forEach((id, i) => { S.sprites.get(id).l = pos[i]; });
    const view = sp => ({
      u: sp.u, l: sp.l, z: sp.active ? 3 : 1, d: sp.d, k: sp.k, kt: sp.talking ? sp.kt : "",
      c: [sp.enter && "enter", sp.leave && "leave", sp.active && "active", sp.dim && "dim", sp.talking && "talking", sp.remote && "remote"].filter(Boolean).join(" ")
    });
    ui.set({ "vn.sprites": S.order.map(id => view(S.sprites.get(id))).concat(S.leaving.map(view)), "vn.crowd": n >= 3 });
    prune();
  }
  function sprite(id, expr) {
    let sp = S.sprites.get(id);
    if (!sp) {
      sp = { id, u: ++S.u, expr: expr || "normal", d: +(Math.random() * 4).toFixed(2), enter: true, l: 50 };
      sp.k = charImg(id, sp.expr, "idle");
      S.sprites.set(id, sp);
      // 视角人物固定在最左
      if (id === pov.char) S.order.unshift(id); else S.order.push(id);
      if (S.order.length > 3) removeChar(S.order.find(x => x !== pov.char && x !== id));
      later(() => { sp.enter = false; paintSprites(); }, 400);
      paintSprites();
    } else if (expr && expr !== sp.expr) {
      sp.expr = expr;
      sp.k = charImg(id, expr, "idle");
      if (sp.talking) sp.kt = charImg(id, expr, "talk");
      paintSprites();
    }
    return sp;
  }
  function removeChar(id) {
    const sp = S.sprites.get(id);
    if (!sp) return;
    S.sprites.delete(id);
    S.order = S.order.filter(x => x !== id);
    Object.assign(sp, { leave: true, enter: false, active: false, talking: false });
    S.leaving.push(sp);
    later(() => { S.leaving = S.leaving.filter(x => x !== sp); paintSprites(); }, 350);
    paintSprites();
  }
  function clearChars() { S.order.slice().forEach(removeChar); }
  function setChars(ids, expr) { clearChars(); (ids || []).forEach(id => sprite(castOf(id) || id, expr)); paintSprites(); }
  function focus(id, talkMs, remote) {
    for (const [k, sp] of S.sprites) {
      const on = k === id;
      sp.active = on; sp.dim = !!id && !on; sp.talking = false;
      if (on) sp.remote = !!remote;
    }
    cancel(S.talkT); S.talkT = 0;
    const sp = id && talkMs && S.sprites.get(id);
    if (sp) {
      sp.talking = true;
      sp.kt = charImg(sp.id, sp.expr, "talk");
      S.talkT = later(() => { sp.talking = false; paintSprites(); }, talkMs);
    }
    paintSprites();
  }

  // ---------- 文本 ----------
  function clearTransient() {
    if (S.coach.length) { S.coach = []; ui.set({ "vn.coach": [] }); }
    if (S.decodes.length) { S.decodes = []; ui.set({ "vn.decodes": [] }); }
  }
  function narr(html, kind) {
    clearTransient();
    S.dialog.on = false;
    S.cap = { on: true, kind: kind || "", k: ++S.k, s: T.segs(html) };
    focus(null);
    ui.set({ "vn.dialog.on": false, "vn.cap": S.cap });
    S.history.push(["", T.plain(html)]);
  }
  // who: "旁白" / "内心" / "你" / 角色名；o: { expr, call, chat, tag, group, kind, filtered, replayed, voice }
  function line(who, html, o = {}) {
    if (who === "旁白" || who === "") return narr(html, o.kind);
    if (o.chat) return phoneMsg(who, html, o);
    clearTransient();
    const inner = who === "内心", me = who === "你";
    const id = inner || me ? pov.char : castOf(who);
    const name = inner ? `${pov.name}（心里）` : me ? pov.name : who;
    if (S.phoneOn && !me && !inner) hidePhone();
    if (id) sprite(id, o.expr || null);
    const len = T.plain(html).length;
    focus(id, inner ? 0 : Math.min(3500, 300 + len * 90), o.call && !me && !inner);
    S.cap.on = false;
    S.dialog = {
      on: true, k: ++S.k, s: T.segs(html),
      c: (inner ? " inner" : "") + (me ? " me" : "") + (o.call ? " call" : ""),
      name: name + (o.call && !me && !inner ? " · 📞" : "") + (o.tag ? ` · ${o.tag}` : ""),
      bg: id && id === pov.char ? (pov.color || "") : "",
      filtered: !!o.filtered, replayed: !!o.replayed
    };
    ui.set({ "vn.dialog": S.dialog, "vn.cap.on": false });
    S.history.push([name, T.plain(html)]);
  }
  function phoneMsg(who, html, o) {
    clearTransient();
    if (!S.phoneOn) { S.phone.msgs = []; S.phoneOn = true; }
    // 看手机的人（视角人物）留在画面里
    if (pov.char && !S.sprites.has(pov.char)) sprite(pov.char, "normal");
    focus(pov.char, 0);
    const me = who === "你", id = me ? pov.char : castOf(who);
    const name = me ? pov.name : who;
    S.phone.head = o.group || S.phone.head || "消息";
    S.phone.on = true;
    S.phone.msgs.push({
      k: ++S.k, me, name, s: T.segs(html),
      av: id ? headImg(id, o.expr || "normal") : "",
      voice: o.voice ? { secs: o.voice.secs, playing: false } : null
    });
    while (S.phone.msgs.length > 5) S.phone.msgs.shift();
    S.dialog.on = false; S.cap.on = false;
    ui.set({ "vn.phone": S.phone, "vn.dialog.on": false, "vn.cap.on": false });
    S.history.push([name + "（消息）", T.plain(html)]);
    prune();
  }
  function hidePhone() {
    S.phoneOn = false;
    if (!S.phone.on && !S.phone.head) return;
    S.phone.on = false; S.phone.head = "";
    ui.set({ "vn.phone.on": false, "vn.phone.head": "" });
  }
  function hideCaption() { if (S.cap.on) { S.cap.on = false; ui.set({ "vn.cap.on": false }); } }
  function coachCard(kind, title, text) {
    S.coach.push({ k: ++S.k, kind, title: title || "", text: text || "" });
    ui.set({ "vn.coach": S.coach });
  }
  function decode(text, inner) {
    S.decodes.push({ k: ++S.k, text, inner: inner || "" });
    ui.set({ "vn.decodes": S.decodes });
  }
  function scene(o) {
    if (o.bg) setBg(o.bg);
    if (o.bg || o.chars) { hidePhone(); setChars(o.chars || []); }
    if (o.text) setPlace(o.text);
    S.cap.on = false; S.dialog.on = false;
    ui.set({ "vn.cap.on": false, "vn.dialog.on": false });
  }

  // ---------- 回看 ----------
  function showBacklog() {
    ui.set({ "vn.log": S.history.slice(-80).map(([n, t], i) => ({ i, n, t })), "vn.logTo": "" });
    later(() => ui.set({ "vn.logTo": "bl-end" }), 80);
  }
  function hideBacklog() { ui.set({ "vn.log": null }); }

  // ---------- 情绪信号（点击捕捉）：o = { t, c, tap } ----------
  function addSig(o) {
    const k = ++S.k;
    S.sigs.push({ k, t: o.t, c: o.c || "", id: o.tap ? ui.reg(o.tap, "sig") : "" });
    ui.set({ "vn.sigs": S.sigs });
    return k;
  }
  function updSig(k, patch) {
    const s = S.sigs.find(x => x.k === k);
    if (!s) return;
    Object.assign(s, patch);
    ui.set({ "vn.sigs": S.sigs });
  }
  function delSig(k) { S.sigs = S.sigs.filter(x => x.k !== k); ui.set({ "vn.sigs": S.sigs }); }

  // ---------- "▼ 继续"：点按钮或点舞台空白处 ----------
  function setAdv(cb) { S.advCb = cb; ui.set({ "vn.adv": !!cb }); }
  function waitAdvance() { return new Promise(r => setAdv(() => { setAdv(null); r(); })); }
  function advance(fn) { setAdv(() => { setAdv(null); fn(); }); }
  function tapAdvance() { if (S.advCb) S.advCb(); }

  // ---------- 语音条 ----------
  function waitVoice() { return new Promise(r => { S.voiceCb = () => { S.voiceCb = null; r(); }; }); }
  function tapVoice() { if (S.voiceCb) S.voiceCb(); }
  function voicePlaying() {
    const m = S.phone.msgs.slice().reverse().find(x => x.voice);
    if (m) { m.voice.playing = true; ui.set({ "vn.phone": S.phone }); }
  }

  // ---------- 其他舞台元素 ----------
  function board(rows) { ui.set({ "vn.board": rows ? { rows: rows.map((r, i) => ({ i, cells: r.map(String) })) } : null }); }
  function reveal(card) { ui.set({ "vn.reveal": card || null }); }
  // 舞台特效：rewinding（倒带）/ underwater（暂停、呼吸）
  function fx(name, on) {
    S.fx[name] = !!on;
    ui.set({ "vn.fx": Object.keys(S.fx).filter(k => S.fx[k]).join(" ") });
  }
  function stop() { S.timers.forEach(clearTimeout); S.timers.clear(); S.advCb = null; S.voiceCb = null; }

  return {
    setBg, setPlace, scene, sprite, hideCaption, removeChar, clearChars, setChars, focus, line, narr, decode, coachCard, hidePhone,
    showBacklog, hideBacklog, addSig, updSig, delSig, waitAdvance, advance, tapAdvance, waitVoice, tapVoice, voicePlaying,
    board, reveal, fx, stop, history: S.history, bgId: () => S.bgId, castOf
  };
}

module.exports = { mount, initial };
