import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { esc, rich, dateParts, mapsUrl, jsonIn, cutShort } from "../js/util.js";
import { zonesOf, routeUrl, zoneSVG, distKm, legsOf, bridgesOf, pinGone } from "../js/geo.js";
import { TRAVEL, TYPES, FIELDS, validateTrip, placeQuery, formatBrief } from "../js/trip.js";
import { STRINGS } from "../js/i18n.js";
import { ROOT, precacheList, readSw } from "../tools/lib/app-files.mjs";
import { llmsText } from "../tools/lib/llms.mjs";
import { changesBrief } from "../js/changes.js";

/* ---------- text from trip files is never trusted ---------- */

test("text from a trip file cannot become HTML", () => {
  assert.equal(esc(`<img src=x onerror="alert(1)">`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(rich("**bold** <script>x</script>"), "<b>bold</b> &lt;script&gt;x&lt;/script&gt;");
  assert.equal(rich("**<i>x</i>**"), "<b>&lt;i&gt;x&lt;/i&gt;</b>");
});

test("links to Google Maps encode what they are given", () => {
  assert.equal(mapsUrl(`Colosseum "Rome" & more`), "https://www.google.com/maps/search/?api=1&query=Colosseum%20%22Rome%22%20%26%20more");
  assert.equal(placeQuery({title: "A", address: "A, Rome"}), "A, Rome");
  assert.equal(placeQuery({title: "A", lat: 41.9, lng: 12.5}), "41.9,12.5");
  assert.equal(placeQuery({title: "Free afternoon"}), "");
});

test("a trip pasted from a chat is found in the text around it", () => {
  const trip = '{"format": "travel-in-my-pocket/1", "id": "x"}';
  assert.equal(jsonIn(trip), trip);
  assert.equal(jsonIn("Here is your trip:\n```json\n" + trip + "\n```\nEnjoy!"), trip);
  assert.equal(jsonIn("Here is your trip:\n```\n" + trip + "\n```"), trip);
  assert.equal(jsonIn("Sure! " + trip + " Have a nice trip."), trip);
  assert.equal(jsonIn("  nothing here  "), "nothing here");
});

test("dates are written in the language of the trip", () => {
  assert.equal(dateParts("2027-05-14", "en").long, "Friday, May 14");
  assert.equal(dateParts("2027-05-14", "it").long, "Venerdì 14 maggio");
  assert.equal(dateParts("2027-05-14", "it").dow, "ven");
});

/* ---------- map zones ---------- */

const stop = (title, lat, lng, extra = {}) => ({time: "10:00", title, address: title, lat, lng, ...extra});
const ROME = [stop("Colosseum", 41.8902, 12.4922), stop("Forum", 41.8925, 12.4853), {time: "13:00", title: "Lunch"}, stop("Pantheon", 41.8986, 12.4769)];
const FLORENCE = stop("Duomo", 43.7731, 11.256);

test("stops close to each other share one zone, numbered by position in the list", () => {
  const zones = zonesOf(ROME);
  assert.equal(zones.length, 1);
  assert.deepEqual(zones[0].pts.map(p => p.nums), [[1], [2], [4]]);
  assert.deepEqual(zones[0].path.map(p => p.name), ["Colosseum", "Forum", "Pantheon"]);
});

test("a long jump starts a new zone", () => {
  assert.equal(zonesOf([...ROME, FLORENCE]).length, 2);
});

test("a place visited twice is one pin with both numbers, named after the first visit", () => {
  const zones = zonesOf([stop("Hotel", 41.9, 12.5), stop("Forum", 41.8925, 12.4853), stop("Back to the hotel", 41.9, 12.5)]);
  assert.deepEqual(zones[0].pts.map(p => [p.name, p.nums]), [["Hotel", [1, 3]], ["Forum", [2]]]);
  assert.equal(zones[0].path.length, 3);
});

test("a pin carries the kind of its place, when the app knows it", () => {
  const [zone] = zonesOf([stop("A", 41.9, 12.5, {type: "museum"}), stop("B", 41.91, 12.51, {type: "nightclub"}), stop("C", 41.92, 12.52)]);
  assert.deepEqual(zone.pts.map(p => p.type), ["museum", null, null]);
});

test("a day without coordinates has no zones", () => {
  assert.deepEqual(zonesOf([{time: "08:00", title: "Train"}]), []);
});

test("the route link walks short distances and drives long ones", () => {
  const [walk] = zonesOf(ROME);
  assert.match(routeUrl(walk), /origin=Colosseum&destination=Pantheon&waypoints=Forum&travelmode=walking$/);
  const [drive] = zonesOf([...ROME, stop("EUR", 41.83, 12.47)]);
  assert.match(routeUrl(drive), /travelmode=driving$/);
});

test("each leg of the route knows the stop it arrives at", () => {
  // Hotel, Forum, Lunch (no pin), Pantheon, back to the hotel
  const list = [stop("Hotel", 41.9, 12.5), stop("Forum", 41.8925, 12.4853), {time: "13:00", title: "Lunch"}, stop("Pantheon", 41.8986, 12.4769), stop("Back", 41.9, 12.5)];
  const [zone] = zonesOf(list);
  assert.deepEqual(zone.pathIdx, [0, 1, 3, 4]);
  assert.deepEqual(legsOf(zone).map(l => [l.from.name, l.to.name, l.idx]), [["Hotel", "Forum", 1], ["Forum", "Pantheon", 3], ["Pantheon", "Hotel", 4]]);
});

test("travel marks the leg that arrives at a stop, or the one a journey without a pin spans", () => {
  const list = [
    stop("Hotel", 41.9, 12.5),
    stop("Colosseum", 41.8902, 12.4922, {travel: "metro"}),
    stop("Forum", 41.8925, 12.4853),
    {time: "14:00", title: "Train to Florence", travel: "train"},
    {time: "16:00", title: "Coffee"},
    FLORENCE,
    stop("Ferry", 43.7712, 11.2531, {travel: "boat"}),
    stop("Rickshaw", 43.775, 11.259, {travel: "rickshaw"})
  ];
  const zones = zonesOf(list);
  assert.equal(zones.length, 2);
  assert.deepEqual(legsOf(zones[0]).map(l => [l.to.name, l.travel]), [["Colosseum", "metro"], ["Forum", null]]);
  assert.deepEqual(bridgesOf(zones).map(b => [b.from.name, b.to.name, b.idx, b.travel]), [["Forum", "Duomo", 5, "train"]]);
  assert.deepEqual(legsOf(zones[1]).map(l => [l.to.name, l.travel]), [["Ferry", "boat"], ["Rickshaw", null]], "a way the app does not know draws a plain leg");
});

test("a skipped stop keeps its pin, and the route goes past it", () => {
  const list = [stop("Colosseum", 41.8902, 12.4922), stop("Forum", 41.8925, 12.4853, {travel: "bus"}), stop("Pantheon", 41.8986, 12.4769)];
  const [zone] = zonesOf(list, i => i === 1);
  assert.deepEqual(zone.pts.map(p => p.name), ["Colosseum", "Forum", "Pantheon"], "every pin is still there");
  assert.deepEqual(legsOf(zone).map(l => [l.from.name, l.to.name, l.idx, l.travel]), [["Colosseum", "Pantheon", 2, null]], "the bus took you to the Forum, not past it");
  assert.ok(!routeUrl(zone).includes("Forum"));
  // A zone of skipped stops only: its pins, no route into it, a link still made.
  const far = [...list, {time: "14:00", title: "Train", travel: "train"}, FLORENCE, stop("Back in Rome", 41.9, 12.5)];
  const zones = zonesOf(far, i => i === 4);
  assert.equal(zones.length, 3, "skipping does not move pins between zones");
  assert.deepEqual(zones[1].path, []);
  assert.ok(routeUrl(zones[1]).includes("Duomo"));
  assert.deepEqual(bridgesOf(zones).map(b => [b.from.name, b.to.name]), [["Pantheon", "Back in Rome"]]);
  assert.deepEqual(zonesOf(list).map(z => legsOf(z).length), [2], "nothing skipped: the route as before");
});

test("the sketch shows how a leg is travelled", () => {
  const [zone] = zonesOf([stop("A", 41.9, 12.5), stop("B", 41.91, 12.51, {travel: "metro"})]);
  const svg = zoneSVG(zone, "x");
  assert.equal((svg.match(/class="tv"/g) || []).length, 1);
  assert.ok(zoneSVG(zone, "x", i => i === 1).includes('class="tv gone"'));
});

test("a pin is behind you only when every stop it stands for is done or skipped", () => {
  const list = [stop("Hotel", 41.9, 12.5), stop("Forum", 41.8925, 12.4853), stop("Back", 41.9, 12.5)];
  const hotel = zonesOf(list)[0].pts[0];
  assert.equal(pinGone(hotel, i => i === 0), false, "left the hotel, not back yet");
  assert.equal(pinGone(hotel, i => i === 0 || i === 2), true);
});

test("the sketch dashes the legs and pins already behind you", () => {
  const [zone] = zonesOf(ROME);
  const none = zoneSVG(zone, "Rome");
  assert.equal((none.match(/class="route"/g) || []).length, 2);
  assert.ok(!none.includes("gone"));
  const some = zoneSVG(zone, "Rome", i => i <= 1); // Colosseum and Forum done
  assert.equal((some.match(/class="route gone"/g) || []).length, 1, "the leg arriving at the Forum");
  assert.equal((some.match(/class="badge gone"/g) || []).length, 2);
});

test("distances are right to within a few percent", () => {
  const km = distKm([41.8902, 12.4922], [43.7731, 11.256]); // Rome to Florence, about 232 km
  assert.ok(km > 225 && km < 240, String(km));
});

test("the sketch escapes its label and draws one badge per pin", () => {
  const [zone] = zonesOf([stop(`<b>"A"</b>`, 1, 1), stop("B", 1.01, 1.01)]);
  const svg = zoneSVG(zone, `Zone "one"`);
  assert.equal((svg.match(/class="badge"/g) || []).length, 2);
  assert.ok(svg.includes(`aria-label="Zone &quot;one&quot;"`));
  assert.ok(!svg.includes("<b>"));
});

test("every kind of place and way of travelling has a name in every language", () => {
  for(const lang of Object.keys(STRINGS)){
    for(const v of TRAVEL) assert.ok(STRINGS[lang]["travel_" + v], `${lang} travel_${v}`);
    for(const v of TYPES) assert.ok(STRINGS[lang]["type_" + v], `${lang} type_${v}`);
  }
});

/* ---------- interface texts ---------- */

test("every language has exactly the same texts as English", () => {
  const en = Object.keys(STRINGS.en).sort();
  for(const [lang, strings] of Object.entries(STRINGS)){
    assert.deepEqual(Object.keys(strings).sort(), en, `language "${lang}"`);
    for(const [key, value] of Object.entries(strings)){
      const placeholders = s => (s.match(/\{\w+\}/g) || []).sort();
      assert.deepEqual(placeholders(value), placeholders(STRINGS.en[key]), `${lang}.${key}`);
    }
  }
});

test("no text is written twice in a language: the second would hide the first", () => {
  const src = readFileSync(join(ROOT, "js/i18n.js"), "utf8");
  for(const block of src.split(/^  \w+: \{$/m).slice(1)){
    const keys = [...block.split(/^  \},?$/m)[0].matchAll(/(?:^|[\s,{])(\w+): ["`]/gm)].map(m => m[1]);
    assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
  }
});

/* ---------- offline ---------- */

test("the service worker lists every file of the app", () => {
  const {files} = readSw(readFileSync(join(ROOT, "sw.js"), "utf8"));
  assert.deepEqual([...files].sort(), precacheList().sort());
});

test("the copy kept offline is never a redirect, as hosts that send index.html to / answer", async () => {
  const listeners = {}, stored = new Map();
  const res = (url, redirected) => Object.defineProperty(new Response("<!doctype html>" + url, {headers: {"content-type": "text/html"}}), "redirected", {value: redirected});
  const self = {location: new URL("https://app.example/"), registration: {scope: "https://app.example/"},
    addEventListener: (type, f) => { listeners[type] = f; }};
  const caches = {open: async () => ({put: async (url, r) => { stored.set(url, r); }})};
  const fetch = async req => res(req.url, /index\.html$/.test(req.url));
  const source = readFileSync(join(ROOT, "sw.js"), "utf8").replace(/const FILES = \[[\s\S]*?\];/, `const FILES = ["index.html", "js/app.js"];`);
  new Function("self", "caches", "fetch", "Request", "Response", source)(self, caches, fetch, class { constructor(url){ this.url = new URL(url, "https://app.example/").href; } }, Response);
  let done; listeners.install({waitUntil: p => { done = p; }});
  await done;
  assert.deepEqual([...stored.keys()].sort(), ["index.html", "js/app.js"]);
  assert.equal(stored.get("index.html").redirected, false);
  assert.equal(await stored.get("index.html").text(), "<!doctype html>https://app.example/index.html");
});

test("the manifest for Samsung Internet is the same, but shares text and links only", () => {
  const full = JSON.parse(readFileSync(join(ROOT, "manifest.webmanifest"), "utf8"));
  const basic = JSON.parse(readFileSync(join(ROOT, "manifest-basic.webmanifest"), "utf8"));
  const {share_target: a, ...restFull} = full, {share_target: b, ...restBasic} = basic;
  assert.deepEqual(restBasic, restFull);
  assert.deepEqual([a.method, a.params.files.length > 0], ["POST", true]);
  assert.deepEqual([b.method, b.params.files], ["GET", undefined]);
  assert.match(readFileSync(join(ROOT, "js/theme.js"), "utf8"), /SamsungBrowser[\s\S]*manifest-basic\.webmanifest/);
});

test("the build publishes only the app, stamped with a version", () => {
  const out = mkdtempSync(join(ROOT, ".build-test-"));
  try{
    execFileSync(process.execPath, [join(ROOT, "tools/build.mjs"), "--out", out, "--repo", "https://github.com/someone/fork"], {stdio: "pipe"});
    const {version, files} = readSw(readFileSync(join(out, "sw.js"), "utf8"));
    assert.match(version, /^\d+\.\d+\.\d+\+[0-9a-f]{8}$/);
    for(const f of files.filter(f => f !== "./")) assert.ok(existsSync(join(out, f)), f);
    assert.ok(readFileSync(join(out, "js/config.js"), "utf8").includes(`"https://github.com/someone/fork"`));
    // Icons get an address per version, so browsers do not keep showing an old one.
    const v = version.split("+").pop();
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.ok(html.includes(`<link rel="icon" href="icons/icon.svg?v=${v}"`), "favicon");
    assert.ok(html.includes(`<link rel="apple-touch-icon" href="icons/apple-touch-icon.png?v=${v}"`), "iPhone icon");
    const manifest = JSON.parse(readFileSync(join(out, "manifest.webmanifest"), "utf8"));
    assert.ok(manifest.icons.length > 0 && manifest.icons.every(i => i.src.endsWith(`?v=${v}`)), "manifest icons");
    for(const i of manifest.icons) assert.ok(existsSync(join(out, i.src.split("?")[0])), i.src);
    for(const f of ["README.md", "package.json", "tools", "test", "private", ".claude", ".github"]) assert.ok(!existsSync(join(out, f)), f);
    assert.ok(readFileSync(join(out, "llms.txt"), "utf8").startsWith("# TIMP"), "llms.txt for AI assistants");
  }finally{
    rmSync(out, {recursive: true, force: true});
  }
});

test("a second app to try changes: its own name and icons", () => {
  const out = mkdtempSync(join(ROOT, ".build-test-"));
  try{
    execFileSync(process.execPath, [join(ROOT, "tools/build.mjs"), "--out", out, "--name", "TIMP dev", "--icons", "tools/dev-icons"], {stdio: "pipe"});
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.ok(html.includes("<title>TIMP dev</title>") && html.includes('content="TIMP dev"'), "page and Home Screen name");
    const manifest = JSON.parse(readFileSync(join(out, "manifest.webmanifest"), "utf8"));
    assert.equal(manifest.short_name, "TIMP dev");
    for(const i of manifest.icons){
      const f = i.src.split("?")[0];
      assert.ok(readFileSync(join(out, f)).equals(readFileSync(join(ROOT, "tools/dev-icons", f.slice(6)))), f);
    }
  }finally{
    rmSync(out, {recursive: true, force: true});
  }
});

/* ---------- documentation ---------- */

test("llms.txt gives a chat assistant the whole format in one page, with valid examples", () => {
  const text = llmsText();
  // What to do first (the guide's steps), then the format, then the guide's advice with the
  // format of changes; the field reference stays for people: the format in short already
  // has every field, and every line here is paid for by every assistant that reads it.
  const at = h => text.indexOf(h);
  assert.ok(at("## Steps") > 0 && at("## Steps") < at("## The format") && at("## The format") < at("## Days") && at("## Updating a trip") < at(changesBrief()), "steps, format, advice, changes");
  assert.ok(at(changesBrief()) < at("## Mistakes to avoid") && at("## Mistakes to avoid") < at("## A complete example"), "the example last");
  assert.ok(!text.includes(readFileSync(join(ROOT, "docs/trip-format.md"), "utf8").split("\n")[0]), "the reference is not pasted again");
  assert.ok(!/\]\((?!https?:)[^)]+\)/.test(text), "no links to files of the repository");
  // It is one complete page: nothing sends the assistant to look for another file.
  assert.ok(!/trip-format\.md|creating-a-trip\.md|demo-trip\.json|ask for it/.test(text), "no pointer to a file the page already contains");
  assert.match(text, /This page is complete/);
  // Its version at the top: an assistant asked again opens the page again when TIMP names a newer one.
  const version = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
  assert.ok(text.includes(`**Version ${version}.**`), "the version at the top");
  assert.ok(!/## What's new|## What changed, version by version/.test(text), "no history of the format: it is in the reference");
  // Nothing written twice: each heading once.
  const heads = text.match(/^#+ .+$/gm);
  assert.deepEqual(heads, [...new Set(heads)], "each heading once");
  // Only what a chat assistant needs: nothing about the repository, no ids in the example.
  assert.ok(!/llms\.txt: skip|validate-trip|js\/trip\.js|js\/changes\.js|## The old format|## Versions/.test(text), "parts for the repository left out");
  const example = text.slice(text.indexOf("# A complete example"));
  assert.ok(!/"id"\s*:/.test(example), "the example has no ids: the app writes them");
  assert.ok(text.includes(formatBrief()), "the format in short, the same text the app copies");
  assert.ok(text.includes("trip.schema.json"));
  const blocks = [...text.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m => m[1]).filter(b => b.trim().startsWith("{") && b.includes('"travel-in-my-pocket/2"'));
  assert.ok(blocks.length >= 1, "the complete example");
  assert.ok(text.includes(changesBrief()), "how to write changes, for a trip that exists");
  for(const b of blocks) assert.deepEqual(validateTrip(JSON.parse(b)).errors, [], b.slice(0, 60));
  // The link resolver is described only on a site that has one.
  assert.ok(!text.includes("link resolver"));
  assert.match(llmsText({resolver: "https://resolver.example"}), /GET https:\/\/resolver\.example\?url=/);
});

test("the format in short has every field an assistant writes, a valid example, and no key", () => {
  const brief = formatBrief();
  // Kinds only the app writes (basedOn) are not in it at all.
  assert.ok(!/^basedOn:$/m.test(brief));
  for(const [kind, fields] of Object.entries(FIELDS).filter(([k]) => k !== "basedOn")){
    for(const [name, f] of Object.entries(fields)){
      const listed = new RegExp(`^  ${name}( \\(required\\))?:`, "m").test(brief.split(`\n${kind}:\n`)[1] || "");
      assert.equal(listed, !f.byApp && f.inBrief !== false, `${kind}.${name}`);
    }
  }
  assert.deepEqual(validateTrip(JSON.parse(brief.split("\n").pop())).errors, []);
  // 4,500 until 3.32 (alternatives added three fields): still one paste on a phone.
  assert.ok(brief.length < 5000, "short enough to paste on a phone: " + brief.length);
});

test("the format reference documents every field of the format", () => {
  const reference = readFileSync(join(ROOT, "docs/trip-format.md"), "utf8");
  const missing = Object.entries(FIELDS).flatMap(([kind, fields]) => Object.keys(fields).filter(f => !reference.includes("`" + f + "`")).map(f => `${kind}.${f}`));
  assert.deepEqual(missing, [], "documented in docs/trip-format.md");
});

test("instructions for assistants point to files that exist", () => {
  for(const doc of ["AGENTS.md", "CLAUDE.md", ".claude/skills/create-trip-file/SKILL.md", "docs/creating-a-trip.md"]){
    const text = readFileSync(join(ROOT, doc), "utf8");
    const paths = [...text.matchAll(/`((?:docs|examples|tools|js|test)\/[\w./-]+\.\w+)`/g)].map(m => m[1]);
    for(const p of paths) assert.ok(existsSync(join(ROOT, p)), `${doc} mentions ${p}`);
  }
  assert.match(readFileSync(join(ROOT, "CLAUDE.md"), "utf8"), /^@AGENTS\.md$/m);
});

test("a JSON cut short (copied while the assistant still wrote it) is told apart from a wrong one", () => {
  const trip = '{"format":"travel-in-my-pocket/2","title":"A {brace} in \\"text\\"","days":[{"date":"2027-05-14","stops":[]}]}';
  assert.equal(cutShort(trip), false);
  assert.equal(cutShort(trip.slice(0, 40)), true, "cut in a string");
  assert.equal(cutShort(trip.slice(0, trip.length - 3)), true, "cut before its brackets close");
  assert.equal(cutShort('{"title": "x",}'), false, "wrong, not cut");
});
