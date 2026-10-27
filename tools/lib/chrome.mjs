// 无头 Chrome（CDP）小封装：截图、执行脚本、收集页面报错。tools/ 下的自动化脚本共用，不需要装 npm 包。
//   const b = await launch({ width: 390, height: 844, mobile: true });
//   await b.open("file:///…/demo/index.html"); await b.eval("…"); await b.shot("/tmp/a.png"); b.close();
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

export const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch({ width = 1280, height = 900, mobile = false, scale = 1 } = {}) {
  const port = 9400 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/ov-chrome-${port}`, "--allow-file-access-from-files", "about:blank"], { stdio: "ignore" });
  let tabs;
  for (let i = 0; i < 60 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
  const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl);
  await new Promise(r => (ws.onopen = r));
  let id = 0;
  const pend = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map(a => a.value ?? a.description).join(" "));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }).then(m => m.result);
  await send("Runtime.enable");
  const size = (w, h) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: scale, mobile });
  await size(width, height);
  return {
    send, errors, size,
    async open(url, wait = 1200) { await send("Page.navigate", { url }); await sleep(wait); },
    async eval(expr, wait = 300) {
      const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) errors.push(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      await sleep(wait);
      return r.result && r.result.value;
    },
    async shot(out, full = true) {
      const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
      writeFileSync(out, Buffer.from(r.data, "base64"));
    },
    close() { try { ws.close(); } catch {} proc.kill(); }
  };
}
