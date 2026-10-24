// 截图工具：node tools/shot.mjs <url> <out.png> [宽] [高]
import { spawn } from "node:child_process"; import { writeFileSync } from "node:fs";
const [url, out, W = 1500, H = 1100] = process.argv.slice(2);
const PORT = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/cg-shot-${PORT}`, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails.exception?.description); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable"); await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url }); await sleep(1500);
const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(out, Buffer.from(r.data, "base64"));
if (errs.length) console.log("ERR", errs); ws.close(); chrome.kill();
