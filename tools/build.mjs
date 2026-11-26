#!/usr/bin/env node
// Prepares the folder to publish: only the files of the app, with the service
// worker stamped with a version and the exact list of files to keep offline.
//
//   node tools/build.mjs                         -> dist/
//   node tools/build.mjs --out _site --repo https://github.com/you/your-fork \
//                        --resolver https://timp-resolve.you.workers.dev \
//                        --share https://timp-share.you.workers.dev
//   node tools/build.mjs --out _site --name "TIMP dev" --icons tools/dev-icons …
//
// --resolver is the address of the link resolver (worker/README.md): it goes in
// js/config.js and in the Content-Security-Policy, the one place it may be reached.
//
// --name and --icons make a second app to try changes on, next to the real one on the
// same phone: its own name, and icons (the files of the folder) that never look alike.
//
// The version is the package version plus a fingerprint of the app's content.
// Same content, same version: phones are asked to update only when something
// in the app really changed.

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve, relative } from "node:path";
import { ROOT, appFiles, precacheList, stampSw } from "./lib/app-files.mjs";
import { llmsText } from "./lib/llms.mjs";
import { tripSchema } from "../js/trip.js";

function option(name, fallback){
  const i = process.argv.indexOf("--" + name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const out = resolve(ROOT, option("out", "dist"));
const repoUrl = option("repo", "");
const resolverUrl = option("resolver", "").replace(/\/+$/, "");
// --share: the sharing service (accounts, sync); the account section shows only with it.
const shareUrl = option("share", "").replace(/\/+$/, "");
const appName = option("name", "");
const iconsDir = option("icons", "");
const inside = relative(ROOT, out);
if(!inside || inside.startsWith("..") || appFiles().some(f => f === inside || f.startsWith(inside + "/"))){
  console.error(`Refusing to build into "${out}": choose an empty folder inside the project, like dist/ or _site/.`);
  process.exit(2);
}
if(repoUrl && !/^https:\/\/[\w.-]+\/[\w./-]+$/.test(repoUrl)){
  console.error(`--repo must be an https address, got "${repoUrl}"`);
  process.exit(2);
}
if(shareUrl && !/^https:\/\/[\w.-]+(:\d+)?$/.test(shareUrl)){
  console.error(`--share must be an https origin, got "${shareUrl}"`);
  process.exit(2);
}
if(resolverUrl && !/^https:\/\/[\w.-]+(\/[\w./-]*)?$/.test(resolverUrl)){
  console.error(`--resolver must be an https address, got "${resolverUrl}"`);
  process.exit(2);
}

const files = appFiles();
const contents = new Map(files.map(f => [f, readFileSync(join(ROOT, f))]));

// Fills in a setting of js/config.js.
function configure(name, value){
  const src = contents.get("js/config.js").toString("utf8");
  const next = src.replace(new RegExp(`export const ${name} = "[^"]*";`), `export const ${name} = ${JSON.stringify(value)};`);
  if(!next.includes(`export const ${name} = ${JSON.stringify(value)};`)){ console.error(`js/config.js: ${name} not found`); process.exit(1); }
  contents.set("js/config.js", Buffer.from(next));
}
if(repoUrl) configure("REPO_URL", repoUrl);
// A service the page may call: added to connect-src, the one directive that needs it.
function allowConnect(url){
  const html = contents.get("index.html").toString("utf8");
  const next = html.replace("connect-src 'self'", `connect-src 'self' ${new URL(url).origin}`);
  if(next === html){ console.error("index.html: connect-src not found in the Content-Security-Policy"); process.exit(1); }
  contents.set("index.html", Buffer.from(next));
}
if(resolverUrl){ configure("RESOLVER_URL", resolverUrl); allowConnect(resolverUrl); }
if(shareUrl){ configure("SHARE_URL", shareUrl); allowConnect(shareUrl); }
if(appName){
  const html = contents.get("index.html").toString("utf8");
  contents.set("index.html", Buffer.from(html.replace("<title>TIMP</title>", `<title>${appName}</title>`)
    .replace('name="apple-mobile-web-app-title" content="TIMP"', `name="apple-mobile-web-app-title" content="${appName}"`)));
  for(const name of ["manifest.webmanifest", "manifest-basic.webmanifest"]){
    const manifest = JSON.parse(contents.get(name).toString("utf8"));
    contents.set(name, Buffer.from(JSON.stringify({...manifest, name: appName, short_name: appName}, null, 2) + "\n"));
  }
}
for(const f of iconsDir ? readdirSync(resolve(ROOT, iconsDir)) : []){
  if(!contents.has("icons/" + f)){ console.error(`--icons: icons/${f} is not an icon of the app`); process.exit(2); }
  contents.set("icons/" + f, readFileSync(join(resolve(ROOT, iconsDir), f)));
}

const hash = createHash("sha256");
files.filter(f => f !== "sw.js").forEach(f => { hash.update(f); hash.update("\0"); hash.update(contents.get(f)); hash.update("\0"); });
// The service worker's own logic counts too: zero out what the build stamps, hash the rest.
hash.update(stampSw(contents.get("sw.js").toString("utf8"), "", []));
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const version = option("version", `${pkg.version}+${hash.digest("hex").slice(0, 8)}`);

contents.set("sw.js", Buffer.from(stampSw(contents.get("sw.js").toString("utf8"), version, precacheList())));

// Browsers keep icons by address, for a long time and apart from the page: the same
// address would show the old icon after an update. Each version gets its own.
const tag = "?v=" + encodeURIComponent(version.split("+").pop());
contents.set("index.html", Buffer.from(contents.get("index.html").toString("utf8")
  .replace(/(<link rel="(?:icon|apple-touch-icon)" href=")(icons\/[\w.-]+)"/g, `$1$2${tag}"`)));
for(const name of ["manifest.webmanifest", "manifest-basic.webmanifest"]){
  const manifest = JSON.parse(contents.get(name).toString("utf8"));
  manifest.icons = manifest.icons.map(i => ({...i, src: i.src + tag}));
  contents.set(name, Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
}

rmSync(out, {recursive: true, force: true});
for(const [f, data] of contents){
  const target = join(out, f);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, data);
}
copyFileSync(join(ROOT, "LICENSE"), join(out, "LICENSE"));
// For AI assistants that read one page: the format, the method and the example.
// Not part of the app, so not in the version or offline.
writeFileSync(join(out, "llms.txt"), llmsText({resolver: resolverUrl}));
writeFileSync(join(out, "trip.schema.json"), JSON.stringify(tripSchema(), null, 1) + "\n");

console.log(`Built ${files.length} files into ${relative(ROOT, out)}/ — version ${version}`);
