// Opens the app in headless Chrome at phone size and hands back a few helpers.
// Used by tools/screenshots.mjs and tools/e2e.mjs. No dependencies: the project is
// served by a small static server here, and Chrome is driven over the DevTools protocol.
//
// Needs Chrome or Chromium on this computer. Set CHROME=/path/to/chrome if it is
// not found, and CHROME_FLAGS for extra flags (for example "--no-sandbox" in a container).

import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, extname, normalize } from "node:path";
import { ROOT } from "./app-files.mjs";

const PHONE = {width: 375, height: 812, deviceScaleFactor: 2, mobile: true};
const TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png"};

// share: the address of a sharing service, put in js/config.js and in the page's
// Content-Security-Policy the way tools/build.mjs does it; "self" for `api`, a fake of
// the service answering /v1/ on this very server: (method, path, body) → {status, body}.
export function serve({share, api, moved = ""} = {}){
  const server = createServer(async (req, res) => {
    if(api && req.url.startsWith("/v1/")){
      let raw = "";
      for await(const chunk of req) raw += chunk;
      const out = await api(req.method, new URL(req.url, "http://x").pathname, raw ? JSON.parse(raw) : {}, req.headers);
      res.writeHead(out.status, {"content-type": "application/json"}).end(JSON.stringify(out.body));
      return;
    }
    share = share === "self" ? "" : share;
    const address = share || (api ? `http://${req.headers.host}` : "");
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
    const file = join(ROOT, path === "" || path.endsWith("/") ? path + "index.html" : path);
    // Never serve the folders that hold real trips.
    if(!file.startsWith(ROOT) || /^(private|originale)([/\\]|$)/.test(path)){ res.writeHead(404).end(); return; }
    try{
      let data = await readFile(file);
      if(address && path === "js/config.js") data = Buffer.from(data.toString("utf8").replace('export const SHARE_URL = "";', `export const SHARE_URL = ${JSON.stringify(address)};`));
      // The copy left at an old address (tools/build.mjs --moved-to).
      if(moved && path === "js/config.js") data = Buffer.from(data.toString("utf8").replace('export const MOVED_TO = "";', `export const MOVED_TO = ${JSON.stringify(moved)};`));
      if(share && file.endsWith("index.html")) data = Buffer.from(data.toString("utf8").replace("connect-src 'self'", `connect-src 'self' ${share}`));
      res.writeHead(200, {"content-type": TYPES[extname(file)] || "application/octet-stream"}).end(data);
    }catch(e){
      res.writeHead(404).end();
    }
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function findChrome(){
  const names = [process.env.CHROME, "chromium", "chromium-browser", "google-chrome", "google-chrome-stable",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"].filter(Boolean);
  for(const name of names){
    const probe = spawnSync(name, ["--version"], {stdio: "ignore"});
    if(!probe.error && probe.status === 0) return name;
  }
  throw new Error("Chrome or Chromium not found. Set CHROME=/path/to/chrome and run again.");
}

async function launch(profile){
  const flags = ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-gpu",
    ...(process.env.CHROME_FLAGS ? process.env.CHROME_FLAGS.split(" ") : []), "about:blank"];
  const chrome = spawn(findChrome(), flags, {stdio: ["ignore", "ignore", "pipe"]});
  const wsUrl = await new Promise((resolve, reject) => {
    let log = "";
    // A busy runner can take its time: a minute before giving up.
    const timer = setTimeout(() => { chrome.kill(); reject(new Error("Chrome did not start:\n" + log)); }, 60000);
    chrome.stderr.on("data", chunk => {
      log += chunk;
      const m = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if(m){ clearTimeout(timer); resolve(m[1]); }
    });
    chrome.on("exit", code => { clearTimeout(timer); reject(new Error(`Chrome exited (${code}):\n${log}`)); });
  });
  return {chrome, wsUrl};
}

async function connect(wsUrl){
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error("cannot reach Chrome")); });
  let next = 0;
  const waiting = new Map();
  const events = [];   // what the page reports on its own, such as blocked loads
  const listeners = new Map();   // DevTools events a test listens to (on)
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if(msg.method === "Log.entryAdded") events.push(msg.params.entry);
    if(msg.method && listeners.has(msg.method)) listeners.get(msg.method)(msg.params);
    const w = waiting.get(msg.id);
    if(!w) return;
    waiting.delete(msg.id);
    msg.error ? w.reject(new Error(msg.error.message)) : w.resolve(msg.result);
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++next;
    waiting.set(id, {resolve, reject});
    ws.send(JSON.stringify({id, method, params, sessionId}));
  });
  const {targetId} = await send("Target.createTarget", {url: "about:blank"});
  const {sessionId} = await send("Target.attachToTarget", {targetId, flatten: true});
  return {page: (method, params) => send(method, params, sessionId), close: () => ws.close(), events,
    on: (method, fn) => listeners.set(method, fn)};
}

/**
 * Runs `work` with the app open on its welcome screen, in a fresh browser profile.
 * Helpers:
 *   run(code)             runs code in the page (it may use await and return a value)
 *   until(what, cond, ms) waits until the expression `cond` is true in the page
 *   theme("light"|"dark") switches the colour scheme
 *   reload()              reloads the page and waits for the app
 *   capture()             returns a PNG of the screen as a Buffer
 *   blocked()             what the Content-Security-Policy blocked so far
 *   page(method, params)  any DevTools Protocol command, for what the helpers do not cover
 *   on(event, fn)         listens to a DevTools Protocol event (one listener per event)
 * Options: {share, api} a sharing service for the app (see serve); {host} the host the
 *   page is opened on ("localhost" for passkeys: they refuse an IP address).
 */
export async function withApp(work, {share = "", api = null, host = "127.0.0.1", moved = ""} = {}){
  const server = await serve({share, api, moved});
  const base = `http://${host}:${server.address().port}/`;
  const profile = await mkdtemp(join(tmpdir(), "timp-browser-"));
  // One more try when Chrome does not start: on a shared runner it sometimes stalls.
  const {chrome, wsUrl} = await launch(profile).catch(e => { console.error("  " + e.message.split("\n")[0] + ": trying again"); return launch(profile); });
  try{
    const {page, close, events, on} = await connect(wsUrl);
    const blocked = () => events.filter(e => /Content Security Policy/i.test(e.text || "")).map(e => e.text);
    const run = async code => {
      const r = await page("Runtime.evaluate", {expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true});
      if(r.exceptionDetails) throw new Error("in the page: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    };
    const until = async (what, condition, ms = 20000) => {
      const end = Date.now() + ms;
      while(Date.now() < end){
        // While the page reloads there is nothing to ask: try again.
        try{ if(await run(`return !!(${condition});`)) return; }catch(e){}
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error("timed out waiting for: " + what);
    };
    const theme = value => page("Emulation.setEmulatedMedia", {features: [{name: "prefers-color-scheme", value}]});
    const ready = () => until("the app", `document.querySelector("#app") && document.querySelector("#app").children.length > 0`);
    const reload = async () => { await page("Page.reload"); await new Promise(r => setTimeout(r, 300)); await ready(); };
    const capture = async () => Buffer.from((await page("Page.captureScreenshot", {format: "png"})).data, "base64");

    await page("Emulation.setDeviceMetricsOverride", PHONE);
    await page("Emulation.setLocaleOverride", {locale: "en-US"});
    await theme("light");
    await page("Page.enable");
    await page("Log.enable");
    await page("Page.navigate", {url: base});
    await until("the welcome screen", `document.querySelector('[data-act="demo"]')`);

    await work({run, until, theme, reload, capture, base, blocked, page, on});
    close();
  }finally{
    chrome.kill();
    server.close();
    await rm(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 200}).catch(() => {});
  }
}
