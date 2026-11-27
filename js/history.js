// The history of a trip, in words, and a way back to any version this phone has.
// describe() turns a comparison (js/diff.js) into short lines; openHistory() lists the
// versions with what each one changed, and offers "Restore" on the earlier ones.

import { t, getLang } from "./i18n.js";
import { esc, dateParts } from "./util.js";
import { diffTrips } from "./diff.js";
import { shortId, isIntact } from "./version.js";
import { ask } from "./ask.js";
import { openSheet } from "./sheet.js";

const day = date => dateParts(date, getLang()).long;
const fields = fs => fs.map(f => t("field_" + f)).join(", ");

// Alternatives (js/choices.js) in their own words: "Dinner: Rifugio chosen", "Lunch: +
// Mercado", "Dinner: 3 alternatives" when a group came all at once.
function choices(d){
  const out = [], added = new Map();
  for(const x of d.added) if(x.stop.choice){ const k = x.stop.choice; if(!added.has(k)) added.set(k, []); added.get(k).push(x.stop); }
  for(const [g, xs] of added) out.push(xs.length > 1 ? t("histAlts", {g, n: xs.length}) : t("histAltAdded", {g, s: xs[0].title}));
  // A choice: the option now chosen (the one that lost it says nothing more).
  for(const x of d.changed) if(x.fields.length === 1 && x.fields[0] === "choice" && x.stop.chosen === true && x.stop.choice && !added.has(x.stop.choice))
    out.push(t("histChosen", {g: x.stop.choice, s: x.stop.title}));
  return out;
}

/** Short lines saying what changed, at most `max` of them. */
export function describe(d, max = 6){
  // The days and the trip first: few lines, easily lost after many stops.
  const lines = [
    ...(d.ids ? [t("changedIds")] : []),
    ...(d.days || []).map(x => `~ ${day(x.date)} · ${x.fields.map(f => t("dayField_" + f)).join(", ")}`),
    ...(d.trip && d.trip.length ? [`~ ${t("tripFields")} · ${d.trip.map(f => t("tripField_" + f)).join(", ")}`] : []),
    ...(d.other && !(d.days || []).length && !(d.trip || []).length ? [t("changedOther")] : []),
    ...choices(d),
    ...d.added.filter(x => !x.stop.choice).map(x => "+ " + x.stop.title),
    ...d.removed.map(x => "− " + x.stop.title),
    ...d.changed.filter(x => !(x.fields.length === 1 && x.fields[0] === "choice")).map(x => `~ ${x.stop.title} · ${fields(x.fields)}`),
    ...d.moved.map(x => `→ ${x.stop.title} · ${day(x.date)}`)
  ];
  if(!lines.length) return [t("changedNothing")];
  return lines.length > max ? [...lines.slice(0, max - 1), t("changedMore", {n: lines.length - max + 1})] : lines;
}

// The same arrow as the other things that open (js/app.js).
const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Who made a version and how, from what the service says of it: in the app, or with a
// chat app (Claude, ChatGPT…) the traveller linked; another person's name on a shared trip.
export function madeBy(info, me){
  if(!info) return "";
  // Made before the service kept how: only who, when it was someone else.
  if(info.via === undefined) return info.by && info.by !== me ? info.by : "";
  const how = info.via ? t("historyViaChat", {app: info.via}) : t("historyViaApp");
  return info.by && info.by !== me ? t("historyWho", {who: info.by, how}) : how;
}

// What the service says of the versions, or nothing: offline, slow or not on the account.
async function authors(who){
  if(!who) return null;
  try{ return await Promise.race([who(), new Promise(ok => setTimeout(() => ok(null), 5000))]); }
  catch(e){ return null; }
}

/**
 * @param {{trip: object, versions: object, onRestore: (id: string) => Promise<void>,
 *   who?: () => Promise<{me: string, versions: Map<string, {by: string, via: string|null}>}>}} o
 *   who: the trip's versions as the service has them, when it is on the account
 *   forAll?: () => Promise<string>: on a shared trip, who will see a version restored
 */
export async function openHistory({trip, versions, onRestore, who, forAll = null, fetchVersion = null}){
  // Open on the tap, tall (SH2): the versions arrive inside it, ten at a time, and who
  // made them when the service answers.
  const dialog = openSheet({title: t("historyTitle"), cls: "history tall", body: `
    <p class="foot">${esc(t("historyHelp"))}</p>
    <ol class="versions" aria-busy="true"><li class="foot">${esc(t("mapLoading"))}</li></ol>`});
  const list = dialog.querySelector(".versions");
  dialog.addEventListener("click", async e => {
    // An open version closes with a tap anywhere on it, Restore excepted: a long one
    // need not be scrolled back to its top.
    const body = e.target.closest("details[open] > .body");
    if(body && !e.target.closest("[data-restore]")){ body.parentElement.open = false; return; }
    const b = e.target.closest("[data-restore]");
    if(!b) return;
    const shared = forAll ? await forAll().catch(() => "") : "";
    const answer = await ask({title: t("restoreTitle", {v: shortId(b.dataset.restore)}), text: [t("restoreText"), shared],
      actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("restore"), kind: "primary"}]});
    if(answer !== "yes") return;
    dialog.close();
    await onRestore(b.dataset.restore);
  });
  // Who made each version, put in its row once known (the rows may be there already).
  const byOf = (id, known) => {
    const info = known && known.versions.get(id), by = madeBy(info, known && known.me);
    return by ? `<span class="by${info.via ? " via" : ""}">${esc(by)}</span>` : "";
  };
  // In the rows still to be drawn again too, not only on screen: a later batch redraws
  // the list from them.
  let known = null, rows = [];
  const EMPTY = /<span data-by="([^"]+)"><\/span>/;
  authors(who).then(k => {
    known = k;
    if(!k) return;
    rows = rows.map(r => r.replace(EMPTY, (_, id) => byOf(id, k)));
    for(const el of list.querySelectorAll("[data-by]")) el.outerHTML = byOf(el.dataset.by, k);
  });

  // Each row compares a version with the one it was made from. Rebuilding a version
  // takes a few milliseconds; the 60 most recent are enough to find one's way back.
  const ids = [trip.version.id, ...trip.version.history];
  const here = new Set(await versions.ids(trip.id));
  // A version this phone has not got (made on another, or before the app had this
  // address): from the account, which keeps them all, if it is what its id says; then
  // kept here too.
  const version = async id => {
    if(here.has(id)) return versions.get(trip.id, id);
    const v = fetchVersion && await fetchVersion(id).catch(() => null);
    if(!v || v.id !== trip.id || !v.version || v.version.id !== id || !(await isIntact(v))) return null;
    await versions.put(v);
    here.add(id);
    return v;
  };
  const fmt = new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"});
  let away = 0;
  const flush = () => { if(away){ rows.push(`<li class="away">${esc(t("historyAway", {n: away}))}</li>`); away = 0; } };
  const draw = (wait = true) => { if(dialog.open) list.innerHTML = rows.join("") + (wait ? `<li class="foot">${esc(t("mapLoading"))}</li>` : ""); };
  for(const id of ids.slice(0, 60)){
    if(!dialog.open) return;
    const v = await version(id);
    if(!v){ away++; continue; }
    flush();
    const parent = v.version.parents[0] ? await version(v.version.parents[0]) : null;
    const what = !v.version.parents.length ? [t("historyFirst")]
      : parent ? describe(diffTrips(parent, v), Infinity) : [t("historyUnknown")];
    if(v.version.parents.length > 1) what.unshift(t("historyMerge", {v: shortId(v.version.parents[1])}));
    const when = v.version.date ? fmt.format(new Date(v.version.date)) : "";
    const current = id === trip.version.id;
    const by = known ? byOf(id, known) : `<span data-by="${esc(id)}"></span>`;
    // One line each; a tap opens it: every change, and the way back to it.
    rows.push(`<li class="${current ? "current" : ""}"><details><summary>` +
      `<code class="vid">${esc(shortId(id))}</code>` +
      `<span class="sum"><span class="l">${esc(what[0])}</span>${what.length > 1 ? `<span class="n">${esc(t("historyMore", {n: what.length - 1}))}</span>` : ""}</span>` +
      (current ? `<span class="badge-on">${esc(t("historyCurrent"))}</span>` : `<span class="chev">${CHEVRON}</span>`) +
      `<span class="meta">${when ? `<span>${esc(when)}</span>` : ""}${by}</span></summary>` +
      `<div class="body"><ul class="what">${what.map(l => `<li>${esc(l)}</li>`).join("")}</ul>` +
      (current ? "" : `<button type="button" class="btn small" data-restore="${esc(id)}">${esc(t("restore"))}</button>`) + `</div></details></li>`);
    if(rows.length % 10 === 0) draw();
  }
  flush();
  if(ids.length > 60) rows.push(`<li class="away">${esc(t("historyOlder", {n: ids.length - 60}))}</li>`);
  draw(false);
  list.removeAttribute("aria-busy");
}
