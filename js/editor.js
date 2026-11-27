// The form to add or change a stop, in a dialog over the page.
// It only collects the stop: saving, versions and files are the caller's job
// (onSave and onDelete), so the same form serves every way a stop arrives:
// the + button, the Edit link, and a place shared from Google Maps.

import { t, getLang } from "./i18n.js";
import { esc, dateParts, weekdayName } from "./util.js";
import { parseMapsInput } from "./gmaps.js";
import { findStop, searchPlaces, areaAround, resolveLink } from "./geocode.js";
import { newMap, miniMap } from "./livemap.js";
import { icon } from "./icons.js";
import { TRAVEL, TYPES } from "./trip.js";
import { clockMinutes, dayAfter, moveWarnings } from "./edit.js";
import { PARTS, partOf, atTime } from "./parts.js";
import { ask } from "./ask.js";
import { CHECK, EDIT } from "./icons.js";
import { openSheet, row, dangerRow, openRow, rowValue } from "./sheet.js";
import { km, middleOf } from "./positions.js";
import { closedOn } from "./places.js";
import { parseAmount, formatPlain, formatMoney, symbolOf, currencies, currencyName } from "./money.js";

// "14:05" in the trip's time zone, for a stop added now.
function timeNow(timezone){
  try{
    return new Intl.DateTimeFormat("en-GB", {timeZone: timezone || undefined, hour: "2-digit", minute: "2-digit", hourCycle: "h23"}).format(new Date());
  }catch(e){
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
}

// The days of the week on the buttons for closing days, Monday first.
const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// The actions at the bottom of a form (ST4): Cancel, and the main one saying what it does.
const formActions = go => `<div class="sheet-actions fixed"><span class="grow"></span><button type="button" class="btn" data-close>${esc(t("cancel"))}</button><button type="submit" class="btn primary" data-go>${esc(go)}</button></div>`;


/**
 * Opens the form.
 * @param {object} o
 *   trip, dayIndex, planId     where the stop is, or goes by default
 *   newDay                      true: it goes by default on a new day after the last
 *   stop                        the stop to change (absent: a new stop)
 *   prefill                     text to read as if pasted (a shared place)
 *   timezone, googleKey
 *   money                       for the costs: see moneyField
 *   privateCost                 {cost, currency}: what the traveller paid there only for
 *                               themselves, or null
 *   onSave({stop, date, plan, newDay, priv})  the stop as filled in, and where it goes;
 *                               newDay ({date, city}) when that day is still to be made;
 *                               priv: the private cost {cost, currency}, or null
 *   onDelete()                  remove the stop being changed
 *   alternative                 {group, fixed, of, others}: a new option for the stop `of`
 *                               (its title), in the group `group` (`fixed`: the group exists,
 *                               with the options `others`; else a new name, to change);
 *                               `template` gives the day, time and kind to start from
 *   template                    {time, type}: the new stop's fields to start from
 *   onSave(…, group)            with an alternative, the group's name as written
 */
export function openStopEditor(o){
  let dlg;
  const editing = !!o.stop;
  const lang = getLang();
  const st = {
    lat: o.stop ? o.stop.lat : undefined,
    lng: o.stop ? o.stop.lng : undefined,
    source: o.stop && o.stop.lat !== undefined ? "kept" : "",
    link: o.stop ? o.stop.link : undefined,
    address: (o.stop && o.stop.address) || "",
    travel: (o.stop && o.stop.travel) || "",
    type: (o.stop && o.stop.type) || (o.template && o.template.type) || "",
    booking: (o.stop && o.stop.booking) || "",
    searching: false
  };
  const s0 = o.stop || o.template || {};
  const alt = !editing && o.alternative ? o.alternative : null;
  const closed0 = Array.isArray(s0.closed) ? s0.closed : [];
  const tripCurrency = o.trip.currency || "";
  // Two costs at most: what the trip pays there, and what only the traveller pays.
  // Each says which it is; changing one changes the other too.
  const mine = o.privateCost || null, hasCost = s0.cost !== undefined, both = hasCost && !!mine;
  const first = hasCost || !mine ? "trip" : "private";
  const other = k => k === "trip" ? "private" : "trip";
  const own = (c, has) => c || (has && tripCurrency) || "";
  const addCost = () => {
    const b = dlg.querySelector("[data-add-cost]");
    b.textContent = t(money.kind() === "trip" ? "addPrivateCost" : "addTripCost");
  };
  const money = moneyField("stop-cost", o.money, hasCost ? s0.cost : mine ? mine.cost : undefined,
    hasCost ? own(s0.currency, true) : mine ? own(mine.currency, true) : "", t("tripCostHelp"),
    {kind: first, kindApart: true, big: true, label: t("fHowMuch"), onKind: k => { money2.setKind(other(k)); addCost(); }});
  const money2 = moneyField("stop-cost2", o.money, both ? mine.cost : undefined, both ? own(mine.currency, true) : "", t("tripCostHelp"),
    {kind: other(first), kindApart: true, big: true, label: t("fHowMuch"), hidden: !both, onKind: k => { money.setKind(other(k)); addCost(); }});
  // The time: hour and minutes from two lists, or a part of the day from a list of seven
  // (design/README.md, T1). A word of before is shown as its part; one that names none
  // stays as it was, the first in the list. Not <input type="time">: Chrome on Android
  // opens its own clock, whose Set button falls off narrow screens.
  const time0 = s0.time || timeNow(o.timezone);
  const clock0 = clockMinutes(time0);
  const part0 = clock0 === null ? partOf(time0) : null;
  const keep0 = clock0 === null && !part0 ? time0 : "";
  const partOpts = (keep0 ? `<option value="${esc(keep0)}" selected>${esc(keep0)}</option>` : "") +
    PARTS.map(p => `<option value="${p}"${p === part0 ? " selected" : ""}>${esc(t("part_" + p))}</option>`).join("");
  const two = n => String(n).padStart(2, "0");
  const h0 = clock0 !== null ? Math.floor(clock0 / 60) : 12, m0 = clock0 !== null ? clock0 % 60 : 0;
  // Minutes in steps of five, plus the stop's own minute when it is not one of them.
  const minutes = [...new Set([...Array(12).keys()].map(i => i * 5).concat(m0))].sort((a, b) => a - b);
  const opts = (list, cur) => list.map(n => `<option value="${two(n)}"${n === cur ? " selected" : ""}>${two(n)}</option>`).join("");

  // The days of the trip, and one more after the last: a stop put there makes it (a
  // day cannot be empty). It is in the same city as the last day, until changed.
  const last = o.trip.days[o.trip.days.length - 1];
  const days = [...o.trip.days, {date: dayAfter(last.date), city: last.city, stops: [], isNew: true}];
  const dayIndex = o.newDay ? days.length - 1 : o.dayIndex;
  const dayOptions = days.map((d, i) => {
    const p = dateParts(d.date, lang), when = `${p.dow} ${p.long.split(" ").slice(1).join(" ")}`;
    const label = d.isNew ? t("newDayOption", {d: when})
      : `${t("day")} ${i + 1} · ${when}${d.title || d.city ? " · " + (d.title || d.city) : ""}`;
    return `<option value="${i}"${i === dayIndex ? " selected" : ""}>${esc(label)}</option>`;
  }).join("");

  // A row of buttons to pick one value of TYPES or TRAVEL, or none.
  const choice = (kind, values, label) => `<div class="field">
      <span class="label" id="${kind}-label">${esc(label)}</span>
      <div class="seg wrap" role="radiogroup" aria-labelledby="${kind}-label">
        ${["", ...values].map(m => `<button type="button" role="radio" data-${kind}="${m}" aria-checked="${st[kind] === m}">${icon(m, 16)}<span>${esc(t(m ? `${kind}_${m}` : `${kind}_none`))}</span></button>`).join("")}
      </div>
    </div>`;

  const local0 = s0.local || "";

  dlg = openSheet({title: alt ? (alt.fixed ? t("altFormTitle", {g: alt.group}) : t("altFormTitleNew", {s: alt.of})) : t(editing ? "editStopTitle" : "newStopTitle"), form: true, cls: "stopform", body: `
    ${alt ? `<p class="foot">${esc(t("altFormHelp", {s: alt.of}))}</p>` : ""}

    <div class="field">
      <label for="stop-title">${esc(t("fWhat"))}</label>
      <div class="row">
        <textarea id="stop-title" rows="1" required autocomplete="off" spellcheck="false" placeholder="${esc(t("fWhatPh"))}">${esc(s0.title || "")}</textarea>
        <button type="button" class="btn small" data-search>${esc(t("search"))}</button>
      </div>
      <p class="foot" data-src-note hidden></p>
      <button type="button" class="local" data-local-show${local0 ? "" : " hidden"}>${esc(t("fLocalLine", {s: local0}))}</button>
      <button type="button" class="tbtn quiet" data-local-add${local0 ? " hidden" : ""}>+ ${esc(t("fLocalAdd"))}</button>
      <div class="field" data-local-field hidden>
        <label for="stop-local">${esc(t("fLocal"))}</label>
        <input id="stop-local" type="text" autocomplete="off" placeholder="${esc(t("fLocalPh"))}" value="${esc(local0)}">
      </div>
      <div class="hits" data-hits hidden></div>
      <div class="live mini" data-hit-map hidden><div class="msg">${esc(t("mapLoading"))}</div></div>
    </div>
    ${alt ? `<div class="field">
      <label for="stop-group">${esc(t("fGroup"))}</label>
      <input id="stop-group" type="text" required value="${esc(alt.group)}"${alt.fixed ? " readonly" : ""}>
      <p class="foot">${esc(t("fGroupHelp", {s: [alt.of, ...(alt.others || [])].join(", ")}))}</p>
    </div>` : ""}

    <div class="field">
      <span class="label" id="stop-day-label">${esc(t("fWhen"))}</span>
      <select id="stop-day" hidden>${dayOptions}</select>
      <div class="daychips" role="group" aria-labelledby="stop-day-label">${days.map((d, i) => {
        const p = dateParts(d.date, lang);
        return `<button type="button" data-day-chip="${i}" class="${d.isNew ? "new" : ""}" aria-pressed="${i === dayIndex}" aria-label="${esc(d.isNew ? t("newDayOption", {d: p.long}) : `${t("day")} ${i + 1}, ${p.long}`)}"><small>${esc(p.dow)}</small>${d.isNew ? "+" : i + 1}</button>`;
      }).join("")}</div>
      <p class="foot" data-new-day hidden></p>
      <div class="seg timeway" role="group" aria-label="${esc(t("fTime"))}"><button type="button" data-time-mode="clock" aria-pressed="${clock0 !== null}">${esc(t("timeClockShort"))}</button><button type="button" data-time-mode="words" aria-pressed="${clock0 === null}">${esc(t("timePart"))}</button></div>
      <span id="stop-time" class="clock" role="group" aria-label="${esc(t("fTime"))}"${clock0 !== null ? "" : " hidden"}><select id="stop-hh" aria-label="${esc(t("fHour"))}">${opts([...Array(24).keys()], h0)}</select><span aria-hidden="true">:</span><select id="stop-mm" aria-label="${esc(t("fMinute"))}">${opts(minutes, m0)}</select></span>
      <select id="stop-time-words" aria-label="${esc(t("fTimePart"))}"${clock0 === null ? "" : " hidden"}>${partOpts}</select>
    </div>
    <div class="field" data-plan-field hidden>
      <label for="stop-plan">${esc(t("fPlan"))}</label>
      <select id="stop-plan"></select>
    </div>
    <div class="warns" data-warns role="status" hidden></div>

    <div class="srows">
      ${row("type", t("fType"), choice("type", TYPES, t("fType")))}
      ${row("travel", t("fTravel"), choice("travel", TRAVEL, t("fTravel")))}
      ${row("booking", t("fBooking"), choice("booking", ["advised", "required", "booked"], t("fBooking")))}
      ${row("cost", t("fCost"), `${money.kindHtml}${money.html}${money2.kindHtml}${money2.html}<div class="addcost"${both ? " hidden" : ""}><button type="button" class="tbtn" data-add-cost>${esc(t(first === "trip" ? "addPrivateCost" : "addTripCost"))}</button></div>`)}
      ${row("closed", t("fClosed"), `<div class="seg wrap week" role="group" aria-label="${esc(t("fClosed"))}">${WEEK.map(d => `<button type="button" data-closed="${d}" aria-pressed="${closed0.includes(d)}">${esc(weekdayName(d, lang, "short"))}</button>`).join("")}</div>`)}
      ${row("text", t("fText"), `<textarea id="stop-text" rows="3" aria-label="${esc(t("fText"))}">${esc(s0.text || "")}</textarea>`)}
      ${row("pos", t("fPosition"), `<p class="pos" data-pos></p>
        <div class="actions">
          <button type="button" class="btn small" data-find>${esc(t("posSearch"))}</button>
          <button type="button" class="btn small" data-pick aria-expanded="false">${esc(t("posPick"))}</button>
          <button type="button" class="btn small" data-clear-pos>${esc(t("posClear"))}</button>
        </div>
        <div class="pickwrap" data-pick-box hidden>
          <p class="foot">${esc(t("posPickHelp"))}</p>
          <div class="live pick"><div class="msg">${esc(t("mapLoading"))}</div></div>
        </div>`)}
      ${editing ? dangerRow(t("deleteStop")) : ""}
    </div>

    <p class="errbox" data-error role="alert" hidden></p>

    ${formActions(t("save"))}`});

  const $ = sel => dlg.querySelector(sel);
  const form = $("form");

  function fillPlans(){
    const day = days[+$("#stop-day").value];
    const field = $("[data-plan-field]");
    if(!day.plans){ field.hidden = true; return; }
    field.hidden = false;
    const want = +$("#stop-day").value === o.dayIndex ? o.planId : null;
    $("#stop-plan").innerHTML = day.plans.map(p => `<option value="${esc(p.id)}"${p.id === want ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  }

  function showPos(){
    const has = st.lat !== undefined;
    const label = st.searching ? t("posSearching")
      : has ? `${st.lat.toFixed(5)}, ${st.lng.toFixed(5)}` + (st.source === "link" ? " · " + t("posFromLink") : st.source === "map" ? " · " + t("posFromMap") : st.source === "google" ? " · Google" : st.source === "osm" ? " · OpenStreetMap" : "")
      : t("posNone");
    $("[data-pos]").textContent = label;
    $("[data-pos]").classList.toggle("muted", !has);
    $("[data-clear-pos]").hidden = !has;
    $("[data-find]").disabled = st.searching;
  }

  // A line under the What field, only when there is something to say.
  function note(text){ const n = $("[data-src-note]"); n.textContent = text || ""; n.hidden = !text; }

  function setChoice(kind, value){
    st[kind] = value;
    dlg.querySelectorAll(`[data-${kind}]`).forEach(b => b.setAttribute("aria-checked", String(b.dataset[kind] === value)));
  }

  // Where the trip is: the stops of the chosen day, or of the whole trip.
  function area(){
    const day = days[+$("#stop-day").value];
    const stopsOf = d => d.plans ? d.plans.flatMap(p => p.stops) : d.stops;
    return areaAround(stopsOf(day)) || areaAround(days.flatMap(stopsOf));
  }

  // The What field grows with what is pasted or shared (name, address, link).
  function fitSource(){
    const el = $("#stop-title");
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight + 2, 104) + "px";   // about three lines, then it scrolls
  }

  // A small map to put the pin where it belongs, when the search got it wrong.
  let pick = null;
  async function openPicker(){
    openRow(dlg, $('.dhead[aria-controls="row-pos"]'));
    const box = $("[data-pick-box]");
    if(!box.hidden){ closePicker(); return; }
    if(navigator.onLine === false){ note(t("posOffline")); return; }
    box.hidden = false;
    $("[data-pick]").setAttribute("aria-expanded", "true");
    const el = box.querySelector(".live");
    try{
      const a = area();
      const start = st.lat !== undefined ? [st.lng, st.lat] : a ? [(a.west + a.east) / 2, (a.south + a.north) / 2] : [0, 0];
      el.innerHTML = "";
      const {ml, map} = await newMap(el, {center: start, zoom: st.lat !== undefined ? 17 : a ? 14 : 1});
      if(box.hidden || !dlg.open){ map.remove(); return; }
      const node = document.createElement("div");
      node.className = "pinwrap";
      node.innerHTML = `<span class="pin pickpin">+</span>`;
      const marker = new ml.Marker({element: node, draggable: true}).setLngLat(start).addTo(map);
      const put = ll => { st.lat = Math.round(ll.lat * 1e5) / 1e5; st.lng = Math.round(ll.lng * 1e5) / 1e5; st.source = "map"; showPos(); };
      marker.on("dragend", () => put(marker.getLngLat()));
      map.on("click", e => { marker.setLngLat(e.lngLat); put(e.lngLat); });
      pick = {map, marker};
      el.scrollIntoView({block: "nearest", behavior: "smooth"});
    }catch(err){
      el.innerHTML = `<div class="msg">${esc(t("mapFailed"))}</div>`;
    }
  }
  function closePicker(){
    if(pick){ pick.map.remove(); pick = null; }
    const box = $("[data-pick-box]");
    box.hidden = true;
    box.querySelector(".live").innerHTML = `<div class="msg">${esc(t("mapLoading"))}</div>`;
    $("[data-pick]").setAttribute("aria-expanded", "false");
  }
  // A position found or pasted moves the pin on the open map.
  function movePick(){
    if(pick && st.lat !== undefined){ pick.marker.setLngLat([st.lng, st.lat]); pick.map.jumpTo({center: [st.lng, st.lat], zoom: Math.max(pick.map.getZoom(), 16)}); }
  }

  // What the traveller pasted or typed in the first field.
  let lastRead = null;
  async function readSource(text){
    if(text === lastRead) return;   // the same text, read again on blur: nothing new
    lastRead = text;
    fitSource();
    const r = parseMapsInput(text);
    if(r.link) st.link = r.link;
    // A short link says nothing by itself: the link resolver, when there is one, reads
    // it and answers with name, address, position and kind of place.
    if(r.short){
      st.searching = true; showPos();
      const found = await resolveLink(r.link);
      st.searching = false;
      if(text !== lastRead) return;   // something else was pasted meanwhile
      if(found){
        // Its address has the town, which a shared line ("Via Roma, 3") lacks; a name
        // the traveller shared stays.
        for(const k of ["address", "lat", "lng"]) if(found[k] !== undefined) r[k] = found[k];
        if(found.title && !r.title) r.title = found.title;
        if(found.type && !st.type) setChoice("type", found.type);
      }
    }
    // The field held the link (or the text shared): it becomes the name, if one came.
    $("#stop-title").value = r.title || "";
    fitSource();
    st.address = r.address || "";
    if(r.lat !== undefined){ st.lat = r.lat; st.lng = r.lng; st.source = "link"; movePick(); }
    note(r.short && !r.title ? t("shortLinkNote") : "");
    refresh();
    showPos();
    // A position is searched only for something that looks like an address, once.
    if(st.lat === undefined && (st.address || (r.title && r.address))) findPosition();
  }

  async function findPosition(){
    const day = days[+$("#stop-day").value];
    const title = $("#stop-title").value.trim();
    if(!title && !st.address) return;
    if(navigator.onLine === false){ note(t("posOffline")); return; }
    st.searching = true; showPos();
    const hit = await findStop({title, address: st.address}, day.city, {googleKey: o.googleKey, lang, near: area()});
    st.searching = false;
    if(hit){
      st.lat = hit.lat; st.lng = hit.lng; st.source = hit.source; movePick();
      if(hit.type && !st.type) setChoice("type", hit.type);
    }
    else note(t("posNotFound"));
    showPos();
  }

  // The time as written in the form: hours and minutes, or a part of the day.
  const timeValue = () => $("#stop-time").hidden ? $("#stop-time-words").value.trim() : `${$("#stop-hh").value}:${$("#stop-mm").value}`;
  const closedNow = () => [...[...dlg.querySelectorAll('[data-closed][aria-pressed="true"]')].map(b => b.dataset.closed), ...closed0.filter(d => !WEEK.includes(d))];
  const stopsOf = d => d.plans ? d.plans.flatMap(p => p.stops) : d.stops;
  const placed = () => stopsOf(days[+$("#stop-day").value]).filter(x => x.lat !== undefined);
  // Where the stop is now (changing it), to say what moving it means (ST5).
  const fromRef = editing ? {date: o.trip.days[o.dayIndex].date, plan: o.planId || null, id: o.stop.id} : null;
  const fmtKm = d => new Intl.NumberFormat(lang, {maximumFractionDigits: d < 10 ? 1 : 0}).format(d);
  // The place's address, without its name in front.
  const shortLabel = h => { const l = h.label || ""; return h.name && l.startsWith(h.name + ", ") ? l.slice(h.name.length + 2) : l; };

  // What was typed, searched (ST1): up to three places around the day; a tap on one shows
  // it on a small map, its box takes it (name, position, address, kind): the map closes and
  // only it stays. Its box again: the others back.
  let hits = [], hitMap = null, hitTurn = 0, shown = 0, chosen = -1, asked = "";
  async function search(){
    const text = $("#stop-title").value.trim();
    if(!text) return;
    if(isSource(text)){ readSource(text); return; }
    if(navigator.onLine === false){ note(t("posOffline")); return; }
    note(t("posSearching"));
    asked = text;
    hits = await searchPlaces(text, {googleKey: o.googleKey, lang, near: area()});
    note(hits.length ? "" : t("whatNotFound"));
    shown = 0; chosen = -1;
    drawHits();
    if(hits.length) showHit(0);
  }
  function drawHits(){
    const mid = middleOf(placed()), box = $("[data-hits]");
    box.hidden = !hits.length;
    box.innerHTML = (chosen >= 0 ? [chosen] : hits.map((_, i) => i)).map(i => {
      const h = hits[i], on = i === chosen;
      return `<div class="hit${i === shown && !on ? " shown" : ""}">` +
        `<button type="button" class="flag" data-hit="${i}" aria-pressed="${on}" aria-label="${esc(t(on ? "hitChosen" : "hitChoose", {s: h.name || asked}))}">${on ? CHECK : ""}</button>` +
        `<button type="button" class="hbody" data-hit-show="${i}"><b>${esc(h.name || asked)}</b>` +
        `<small>${esc([shortLabel(h), h.type ? t("type_" + h.type) : ""].filter(Boolean).join(" · "))}</small>` +
        (mid ? `<span class="km">${esc(t("kmAway", {d: fmtKm(km(mid, h))}))}</span>` : "") + `</button></div>`;
    }).join("");
  }
  // A place on the small map, with the day's stops around it.
  async function showHit(i){
    const h = hits[i], turn = ++hitTurn, box = $("[data-hit-map]");
    shown = i;
    dlg.querySelectorAll(".hit").forEach(r => r.classList.toggle("shown", r.querySelector(`[data-hit-show="${i}"]`) !== null && chosen < 0));
    box.hidden = false;
    if(hitMap){ hitMap.remove(); hitMap = null; }
    box.innerHTML = `<div class="msg">${esc(t("mapLoading"))}</div>`;
    try{
      const map = await miniMap(box, h, placed());
      if(turn !== hitTurn || !dlg.open || chosen >= 0) map.remove(); else hitMap = map;
    }catch(err){ if(turn === hitTurn) box.innerHTML = `<div class="msg">${esc(t("mapFailed"))}</div>`; }
  }
  function hideHitMap(){
    hitTurn++;
    if(hitMap){ hitMap.remove(); hitMap = null; }
    $("[data-hit-map]").hidden = true;
  }
  // Its box: taken (or, taken already, the others back).
  function take(i){
    if(chosen === i){ chosen = -1; drawHits(); showHit(i); return; }
    const h = hits[i];
    chosen = i;
    if(h.name) $("#stop-title").value = h.name;
    st.lat = h.lat; st.lng = h.lng; st.source = h.source; st.address = shortLabel(h);
    if(h.type) setChoice("type", h.type);
    hideHitMap();
    drawHits();
    showPos(); movePick(); fitSource(); refresh();
  }


  // What follows the day, the time and the fields: the chips, the new day's line, what
  // to know before it goes there (ST5), the rows' values (ST3), what the button says (ST4).
  function warnText(w){
    if(w.kind === "closed") return w.date ? t("warnClosedDate") : t("warnClosed", {d: weekdayName(w.weekday, lang)});
    if(w.kind === "booked") return t("warnBooked");
    if(w.kind === "time") return t("warnTime", {when: atTime(w.time), s: w.title});
    return t("warnGroup", {g: w.name});
  }
  function refresh(){
    const i = +$("#stop-day").value, day = days[i], when = dateParts(day.date, lang).long;
    dlg.querySelectorAll("[data-day-chip]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.dayChip === i)));
    const nd = $("[data-new-day]");
    nd.hidden = !day.isNew;
    if(day.isNew) nd.textContent = t(day.city ? "newDayLine" : "newDayLineNoCity", {d: when, c: day.city || ""});
    const plan = day.plans ? $("#stop-plan").value : null;
    const moved = !!fromRef && (fromRef.date !== day.date || (fromRef.plan || null) !== (plan || null));
    const ws = moveWarnings(o.trip, {title: $("#stop-title").value.trim(), time: timeValue(), closed: closedNow(), booking: st.booking, choice: s0.choice}, {date: day.date, plan}, fromRef);
    const box = $("[data-warns]");
    box.hidden = !ws.length;
    box.innerHTML = !ws.length ? "" : `<p class="h">${esc(t(moved ? "warnMoving" : "warnOn", {d: when, n: i + 1}))}</p>` + ws.map(w => `<p>${esc(warnText(w))}</p>`).join("");
    const v = (k, text) => rowValue(dlg, k, text);
    v("type", st.type ? t("type_" + st.type) : "");
    v("travel", st.travel ? t("travel_" + st.travel) : "");
    v("booking", st.booking ? t("booking_" + st.booking) : "");
    v("cost", ["#stop-cost-amount", "#stop-cost2-amount"].map(x => $(x) && $(x).value.trim()).filter(Boolean).join(" + "));
    v("closed", closedNow().filter(d => WEEK.includes(d)).map(d => weekdayName(d, lang, "short")).join(", "));
    const text = $("#stop-text").value.trim();
    v("text", text.length > 28 ? text.slice(0, 27) + "…" : text);
    v("pos", st.lat !== undefined ? (st.address || `${st.lat.toFixed(4)}, ${st.lng.toFixed(4)}`) : "");
    $("[data-go]").textContent = !editing ? t(day.isNew ? "addToNewDay" : "addToDay", {n: i + 1}) : moved ? t("moveToDay", {n: i + 1}) : t("save");
  }

  dlg.onclick = async e => {
    if(e.target === dlg) return;
    if(e.target.closest("[data-close]")) return;
    const mode = e.target.closest("[data-time-mode]");
    if(mode){
      const words = mode.dataset.timeMode === "words";
      $("#stop-time").hidden = words; $("#stop-time-words").hidden = !words;
      dlg.querySelectorAll("[data-time-mode]").forEach(b => b.setAttribute("aria-pressed", String(b === mode)));
      refresh();
      return;
    }
    const chip = e.target.closest("[data-day-chip]");
    if(chip){ $("#stop-day").value = chip.dataset.dayChip; $("#stop-day").dispatchEvent(new Event("change")); return; }
    if(e.target.closest("[data-local-add], [data-local-show]")){
      $("[data-local-add]").hidden = $("[data-local-show]").hidden = true;
      $("[data-local-field]").hidden = false;
      $("#stop-local").focus();
      return;
    }
    if(e.target.closest("[data-search]")){ search(); return; }
    const hit = e.target.closest("[data-hit]");
    if(hit){ take(+hit.dataset.hit); return; }
    const look = e.target.closest("[data-hit-show]");
    if(look){ if(chosen < 0) showHit(+look.dataset.hitShow); return; }
    const head = e.target.closest(".dhead[aria-controls]");
    if(head) return;   // opened or closed by the sheet
    const day = e.target.closest("[data-closed]");
    if(day){ day.setAttribute("aria-pressed", String(day.getAttribute("aria-pressed") !== "true")); refresh(); return; }
    if(money.click(e) || money2.click(e)) return;
    if(e.target.closest("[data-add-cost]")){
      e.target.closest(".addcost").hidden = true;
      money2.show();
      $("#stop-cost2-amount").focus();
      return;
    }
    for(const kind of ["type", "travel", "booking"]){
      const b = e.target.closest(`[data-${kind}]`);
      if(b){ setChoice(kind, b.dataset[kind]); refresh(); return; }
    }
    if(e.target.closest("[data-find]")){ findPosition(); return; }
    if(e.target.closest("[data-pick]")){ openPicker(); return; }
    if(e.target.closest("[data-clear-pos]")){ st.lat = st.lng = undefined; st.source = ""; showPos(); refresh(); return; }
    if(e.target.closest("[data-delete]")){
      const title = $("#stop-title").value.trim() || s0.title;
      const answer = await ask({title: t("deleteStopTitle"), text: t("deleteStopText", {t: title}),
        actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("deleteStop"), kind: "danger"}]});
      if(answer !== "yes") return;
      dlg.close();
      o.onDelete();
    }
  };

  // What was pasted or shared (a link, coordinates, a place from Google Maps) is read at
  // once; a name is searched only when asked (Search, or Enter).
  const isSource = text => { const r = parseMapsInput(text); return !!(r.link || r.lat !== undefined); };
  $("#stop-title").addEventListener("paste", e => setTimeout(() => { if(isSource(e.target.value)) readSource(e.target.value); }, 0));
  $("#stop-title").addEventListener("change", e => { if(isSource(e.target.value)) readSource(e.target.value); });
  $("#stop-title").addEventListener("input", () => { fitSource(); refresh(); });
  $("#stop-title").addEventListener("keydown", e => {
    if(e.key === "Enter" && !e.shiftKey && !e.isComposing){ e.preventDefault(); search(); }
  });
  dlg.addEventListener("input", e => { if(e.target.closest(".dbody")) refresh(); });
  dlg.addEventListener("close", () => { closePicker(); hideHitMap(); }, {once: true});
  dlg.addEventListener("change", e => { if(e.target.matches("#stop-hh, #stop-mm, #stop-time-words, #stop-plan")) refresh(); });
  $("#stop-day").addEventListener("change", () => { fillPlans(); refresh(); });
  const dateNow = () => days[+$("#stop-day").value].date;
  money.wire(dlg, dateNow);
  money2.wire(dlg, dateNow);
  $("#stop-day").addEventListener("change", () => { money.update(); money2.update(); });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const title = $("#stop-title").value.trim();
    if(!title){
      const box = $("[data-error]");
      box.textContent = t("titleRequired");
      box.hidden = false;
      $("#stop-title").focus();
      return;
    }
    const costs = [money.read(), money2.read()];
    const bad = costs.findIndex(c => c.error);
    if(bad >= 0){
      const box = $("[data-error]");
      box.textContent = costs[bad].error;
      box.hidden = false;
      $(bad ? "#stop-cost2-amount" : "#stop-cost-amount").focus();
      return;
    }
    const cost = costs.find(c => !c.private && c.cost !== undefined) || {};
    const priv = costs.find(c => c.private && c.cost !== undefined);
    const day = days[+$("#stop-day").value];
    // What Map and Directions search for: the address, or else the name in its town.
    const address = st.address || (day.city ? `${title}, ${day.city}` : undefined);
    const stop = {
      ...s0,
      time: timeValue() || timeNow(o.timezone),
      title,
      type: st.type || undefined,
      travel: st.travel || undefined,
      text: $("#stop-text").value.trim() || undefined,
      local: $("#stop-local").value.trim() || undefined,
      booking: st.booking || undefined,
      cost: cost.cost,
      // A cost in the trip's currency says nothing more.
      currency: cost.cost !== undefined && cost.currency !== tripCurrency ? cost.currency : undefined,
      // Days of the week from the buttons; dates the file had stay as they are.
      closed: closedNow(),
      address,
      lat: st.lat, lng: st.lng,
      link: st.link
    };
    delete stop.id;
    if(!stop.closed.length) delete stop.closed;
    if(st.lat === undefined){ delete stop.lat; delete stop.lng; }
    dlg.close();
    const newDay = day.isNew ? (day.city ? {date: day.date, city: day.city} : {date: day.date}) : null;
    o.onSave({stop, date: day.date, plan: day.plans ? $("#stop-plan").value : null, newDay,
      priv: priv ? {cost: priv.cost, currency: priv.currency !== tripCurrency ? priv.currency : undefined} : null,
      ...(alt ? {group: $("#stop-group").value.trim() || alt.group} : {})});
  });

  fillPlans();
  showPos();
  refresh();
  fitSource();
  // Something shared or pasted: read if it is a place, else searched as a name.
  if(o.prefill){ $("#stop-title").value = o.prefill; if(isSource(o.prefill)) readSource(o.prefill); else search(); }
  else if(!editing) $("#stop-title").focus();
}

/**
 * Moving a day (design/README.md, MV1–MV5): swapped with another (its programme; the date
 * and the night stay), or its stops joined to another in time order (the day left empty
 * goes). A day with plans, or to one: swapping only. What to know about each stop that
 * changes date, before (moveWarnings). Nothing here changes the trip:
 * @param {object} o  trip, dayIndex, onSave({how: "swap"|"join", to: date})
 */
export function openMoveDay(o){
  const lang = getLang(), days = o.trip.days, from = days[o.dayIndex];
  const stopsOf = d => d.plans ? d.plans.flatMap(p => p.stops.map(s => [p.id, s])) : d.stops.map(s => [null, s]);
  const dayShort = d => { const p = dateParts(d.date, lang); return `${p.dow} ${p.long.split(" ").slice(1).join(" ")}`; };
  let how = "swap", to = -1;
  const dlg = openSheet({title: t("moveDayTitle", {n: o.dayIndex + 1}), form: true, cls: "stopform", body: `
    <div class="seg timeway" role="group" aria-label="${esc(t("moveHow"))}"><button type="button" data-how="swap" aria-pressed="true">${esc(t("moveSwap"))}</button><button type="button" data-how="join" aria-pressed="false">${esc(t("moveJoin"))}</button></div>
    <p class="foot" data-why hidden></p>
    <div class="daychips" role="group" aria-label="${esc(t("moveTo"))}">${days.map((d, i) => {
      const p = dateParts(d.date, lang);
      return `<button type="button" data-to="${i}" aria-pressed="false" aria-label="${esc(`${t("day")} ${i + 1}, ${p.long}`)}"><small>${esc(p.dow)}</small>${i + 1}</button>`;
    }).join("")}</div>
    <div class="swapsum" data-sum hidden></div>
    <div class="warns" data-warns role="status" hidden></div>
    <div class="sheet-actions fixed"><span class="grow"></span><button type="button" class="btn" data-close>${esc(t("cancel"))}</button><button type="submit" class="btn primary" data-go disabled>${esc(t("moveDayGo"))}</button></div>`});
  const $ = sel => dlg.querySelector(sel);
  // A stop and what to know where it goes, in a line: "Castle: closed on Monday."
  const line = (s, w, leaving) => {
    if(w.kind === "closed") return w.date ? t("mwClosedDate", {s: s.title, d: dayShort(days[to])}) : t("mwClosed", {s: s.title, d: weekdayName(w.weekday, lang)});
    if(w.kind === "booked") return t("mwBooked", {s: s.title, d: dayShort(leaving)});
    if(w.kind === "time") return t("mwTime", {s: s.title, when: atTime(w.time), x: w.title});
    return t("mwGroup", {s: s.title, g: w.name});
  };
  function refresh(){
    const plans = !!from.plans, dest = days[to];
    if(plans && how === "join") how = "swap";
    const joinOff = plans || (dest && dest.plans);
    dlg.querySelectorAll("[data-how]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.how === how)));
    $('[data-how="join"]').setAttribute("aria-disabled", String(!!plans));
    dlg.querySelectorAll("[data-to]").forEach(b => {
      const i = +b.dataset.to;
      b.disabled = i === o.dayIndex || (how === "join" && !!days[i].plans);
      b.setAttribute("aria-pressed", String(i === to));
    });
    if(to >= 0 && (to === o.dayIndex || (how === "join" && joinOff))) to = -1;
    const why = $("[data-why]");
    why.hidden = !(plans || (how === "join" && to >= 0));
    why.textContent = plans ? t("moveWhyPlans", {p: from.plans.map(p => p.name).join(", ")})
      : to >= 0 ? t("moveJoinNote", {k: from.stops.length, n: to + 1, m: o.dayIndex + 1}) : "";
    const sum = $("[data-sum]");
    sum.hidden = how !== "swap" || to < 0;
    const dates = (a, b) => `<small><span>${esc(dayShort(a))}</span> → <span>${esc(dayShort(b))}</span></small>`;
    if(!sum.hidden) sum.innerHTML = `<div><b>${esc(from.title || from.city || "")}</b>${dates(from, days[to])}</div><span class="arrow" aria-hidden="true">⇄</span>` +
      `<div><b>${esc(days[to].title || days[to].city || "")}</b>${dates(days[to], from)}</div><p class="foot">${esc(t("moveNights"))}</p>`;
    // What to know, a line per stop that has something: the swap's both ways (closed,
    // booked: their programmes go whole, no time is taken); a join, the time too.
    const lines = [];
    if(to >= 0){
      const pairs = how === "swap" ? [[from, days[to]], [days[to], from]] : [[from, days[to]]];
      for(const [a, b] of pairs) for(const [plan, s] of stopsOf(a)){
        const ws = moveWarnings(o.trip, s, {date: b.date, plan: how === "swap" ? plan : null}, {date: a.date, plan, id: s.id}).filter(w => how === "join" || w.kind === "closed" || w.kind === "booked");
        for(const w of ws) lines.push(line(s, w, a));
      }
    }
    const box = $("[data-warns]");
    box.hidden = !lines.length;
    box.innerHTML = !lines.length ? "" : `<p class="h">${esc(t("toKnow"))}</p>` + lines.map(l => `<p>${esc(l)}</p>`).join("");
    const go = $("[data-go]");
    go.disabled = to < 0;
    go.textContent = to < 0 ? t("moveDayGo") : how === "swap" ? t("swapDaysGo", {a: Math.min(o.dayIndex, to) + 1, b: Math.max(o.dayIndex, to) + 1}) : t("joinDayGo", {what: count(from.stops.length, "stopsOne", "stopsMany"), n: to + 1});
  }
  dlg.addEventListener("click", e => {
    const h = e.target.closest("[data-how]");
    if(h){ if(h.getAttribute("aria-disabled") !== "true") how = h.dataset.how; refresh(); return; }
    const c = e.target.closest("[data-to]");
    if(c && !c.disabled){ to = +c.dataset.to; refresh(); }
  });
  $("form").addEventListener("submit", e => {
    e.preventDefault();
    if(to < 0) return;
    dlg.close();
    o.onSave({how, to: days[to].date});
  });
  refresh();
}

/**
 * The form to change a day (DY1–DY4): what it is about and its city, open; where the
 * night is spent and the notes, a row each; Delete last, asked. The date and the stops
 * stay: stops are changed one by one, with their own form.
 * @param {object} o
 *   day                  the day as it is
 *   number               its number in the trip, for the title
 *   cities               the trip's cities, offered as chips when two or more (DY1)
 *   before               the night of the day before, offered when this one differs (DY3)
 *   goes                 {stops, done, priv}: what deleting it takes, for the question
 *   canDelete            false for the only day of a trip
 *   onSave(set)          the fields as filled in; an empty one is removed
 *   onDelete()           remove the day and its stops
 */
// A note of the day in the form: its text, and ✕ to take it away.
let noteN = 0;
function noteRow(text){
  const id = "note-" + (++noteN);
  return `<li><label class="sr" for="${id}">${esc(t("fNote"))}</label><textarea id="${id}" rows="2">${esc(text)}</textarea>` +
    `<button type="button" class="iconbtn" data-note-remove aria-label="${esc(t("fNoteRemove"))}" title="${esc(t("fNoteRemove"))}">×</button></li>`;
}
const stayOf = s => typeof s === "string" ? {name: s} : (s || {});
const count = (n, one, many) => t(n === 1 ? one : many, {n});

export function openDayEditor(o){
  let dlg;
  const d = o.day, lang = getLang();
  const $ = sel => dlg.querySelector(sel);
  const stay = stayOf(d.stay), before = stayOf(o.before);
  const p = dateParts(d.date, lang);
  const cities = (o.cities || []).length > 1 ? o.cities.slice(0, 5) : [];
  const field = (id, label, value, ph = "") => `<label class="sr" for="${id}">${esc(label)}</label><input id="${id}" type="text" autocomplete="off" placeholder="${esc(ph)}" value="${esc(value || "")}">`;
  dlg = openSheet({title: t("editDayTitle", {n: o.number}), form: true, body: `
    <p class="foot">${esc(p.long)}</p>
    <div class="field">
      <label for="day-title">${esc(t("fDayTitle"))}</label>
      <input id="day-title" type="text" autocomplete="off" value="${esc(d.title || "")}">
    </div>
    <section>
      <div class="field">
        <label for="day-city">${esc(t("fCity"))}</label>
        <input id="day-city" type="text" autocomplete="off" value="${esc(d.city || "")}">
      </div>
      ${cities.length ? `<div class="daychips" role="group" aria-label="${esc(t("tripCities"))}">${cities.map(c => `<button type="button" data-city="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("")}</div>` : ""}
    </section>
    <div class="srows">
      ${row("stay", t("fStay"), `${field("day-stay", t("fStayName"), stay.name, t("fStayPh"))}
        ${field("day-stay-address", t("fStayAddress"), stay.address, t("fStayAddress"))}
        <label class="sr" for="day-stay-note">${esc(t("fStayNote"))}</label><textarea id="day-stay-note" rows="2" placeholder="${esc(t("fStayNotePh"))}">${esc(stay.note || "")}</textarea>
        ${before.name ? `<button type="button" class="tbtn" data-same-night>${esc(t("sameNight", {n: o.number - 1, s: before.name}))}</button>` : ""}`)}
      ${row("notes", t("fNotes"), `<ol class="notes-l" id="day-notes">${(d.notes || []).map(noteRow).join("")}</ol>
        <button type="button" class="tbtn" data-note-add>${esc(t("fNoteAdd"))}</button>`)}
      ${o.canDelete ? dangerRow(t("deleteDay")) : ""}
    </div>
    ${formActions(t("save"))}`});

  const val = id => $("#" + id).value.trim();
  function refresh(){
    const notes = [...dlg.querySelectorAll("#day-notes textarea")].filter(x => x.value.trim()).length;
    rowValue(dlg, "stay", val("day-stay"));
    rowValue(dlg, "notes", notes ? count(notes, "notesOne", "notesMany") : "");
    dlg.querySelectorAll("[data-city]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.city === val("day-city"))));
    const same = $("[data-same-night]");
    if(same) same.hidden = val("day-stay") === before.name && val("day-stay-address") === (before.address || "") && val("day-stay-note") === (before.note || "");
  }
  dlg.addEventListener("input", refresh);

  dlg.onclick = async e => {
    if(e.target === dlg) return;
    if(e.target.closest("[data-close]")) return;
    const head = e.target.closest(".dhead[aria-controls]");
    if(head) return;   // opened or closed by the sheet
    const city = e.target.closest("[data-city]");
    if(city){ $("#day-city").value = city.dataset.city; refresh(); return; }
    // The night of the day before, in one tap (DY3).
    if(e.target.closest("[data-same-night]")){
      $("#day-stay").value = before.name; $("#day-stay-address").value = before.address || ""; $("#day-stay-note").value = before.note || "";
      refresh();
      $("#day-stay").focus();
      return;
    }
    // A note taken away, or one more: each note is a field of its own.
    const gone = e.target.closest("[data-note-remove]");
    if(gone){
      const li = gone.closest("li"), next = li.nextElementSibling || li.previousElementSibling;
      li.remove();
      refresh();
      (next ? next.querySelector("textarea") : $("[data-note-add]")).focus();
      return;
    }
    if(e.target.closest("[data-note-add]")){
      $("#day-notes").insertAdjacentHTML("beforeend", noteRow(""));
      $("#day-notes li:last-child textarea").focus();
      return;
    }
    if(e.target.closest("[data-delete]")){
      // What goes with it, counted (DY4); private expenses paid there stay, unlinked.
      const g = {stops: 0, done: 0, priv: 0, ...o.goes};
      const what = count(g.stops, "stopsOne", "stopsMany") + (g.done ? ` (${count(g.done, "tickedOne", "tickedMany")})` : "");
      const text = t("deleteDayText", {n: o.number, d: p.long, what}) + (g.priv ? " " + count(g.priv, "deleteDayPrivOne", "deleteDayPrivMany") : "");
      const answer = await ask({title: t("deleteDayTitle"), text,
        actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("deleteDay"), kind: "danger"}]});
      if(answer !== "yes") return;
      dlg.close();
      o.onDelete();
    }
  };
  $("form").addEventListener("submit", e => {
    e.preventDefault();
    const name = val("day-stay"), address = val("day-stay-address"), note = val("day-stay-note");
    // Where the night is spent: a place (with its address and note, or as it was) or
    // plain text ("Night train"), as the file had it. No name, no stay.
    let nextStay;
    if(name){
      if(address || note || typeof d.stay === "object") nextStay = Object.fromEntries(Object.entries({...stay, name, address: address || undefined, note: note || undefined}).filter(([, v]) => v !== undefined));
      else nextStay = name;
    }
    const same = JSON.stringify(nextStay) === JSON.stringify(d.stay);
    dlg.close();
    o.onSave({
      city: val("day-city"),
      title: val("day-title"),
      ...(same ? {} : {stay: nextStay}),
      notes: [...dlg.querySelectorAll("#day-notes textarea")].map(x => x.value.trim()).filter(Boolean)
    });
  });
  refresh();
}

/* ---------- money ---------- */

/*
 * The cost of a stop or an expense: the amount, then its currency on two buttons, the
 * one spent on the trip and the traveller's own, or any other from a list. Under it,
 * what it makes in the traveller's currency on its day.
 *   m: {local, home, convert(amount, currency, date) → {value, on, estimate} | null, onRates(fn)}
 *   amount, currency: what the stop or expense has
 *   o.kind: "trip" or "private": shows the choice between the two, the trip's cost or
 *     the traveller's own (js/private.js); o.onKind(kind) when the traveller changes it.
 *   o.label: the field's name; o.hidden: it starts hidden (the second cost of a stop).
 *   o.kindApart: the choice of whose it is, with its line, in kindHtml, to put elsewhere
 *     (at the top of the expense's form, EX1); o.big: the amount large (EX2).
 */
function moneyField(id, m, amount, currency, help, o = {}){
  const lang = getLang();
  m = {local: "", home: "", convert: () => null, ...m};
  const quick = [...new Set([m.local, m.home].filter(Boolean))];
  let cur = currency || m.local || m.home || "EUR";
  const other = !quick.includes(cur);
  const label = c => `${symbolOf(c, lang) === c ? "" : symbolOf(c, lang) + " "}${c}`;
  const all = currencies();
  let kind = o.kind || "";
  const helpOf = () => kind === "private" ? t("privateHelp") : help;
  const kinds = kind ? `<div class="seg kind" role="radiogroup" aria-label="${esc(t("fKind"))}">${["trip", "private"].map(k => `<button type="button" role="radio" data-kind="${k}" aria-checked="${k === kind}"><span>${esc(t(k === "trip" ? "kindTrip" : "kindPrivate"))}</span></button>`).join("")}</div>` : "";
  const helpLine = `<p class="foot" data-money-help${helpOf() ? "" : " hidden"}>${esc(helpOf())}</p>`;
  // Its parts are found in the field, or in the choice put apart.
  const inField = sel => `[data-money="${id}"] ${sel}, [data-money-kind="${id}"] ${sel}`;
  const html = `<div class="field money${o.big ? " big" : ""}" data-money="${id}"${o.hidden ? " hidden" : ""}>
      <label for="${id}-amount">${esc(o.label || t("fCost"))}</label>
      <div class="amount"><span class="sym" aria-hidden="true" data-sym>${esc(symbolOf(cur, lang))}</span><input id="${id}-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(formatPlain(amount, lang))}"></div>
      <div class="seg wrap" role="radiogroup" aria-label="${esc(t("fCurrency"))}">
        ${quick.map(c => `<button type="button" role="radio" data-cur="${c}" aria-checked="${!other && c === cur}"><span>${esc(label(c))}</span></button>`).join("")}<button type="button" role="radio" data-cur="" aria-checked="${other}"><span>${esc(t("otherCurrency"))}</span></button>
      </div>
      <select id="${id}-other" aria-label="${esc(t("fCurrency"))}"${other ? "" : " hidden"}>${all.map(c => `<option value="${c}"${c === cur ? " selected" : ""}>${esc(c + " · " + currencyName(c, lang))}</option>`).join("")}</select>
      ${o.kindApart ? "" : kinds}
      <p class="foot money-hint" data-money-hint aria-live="polite"></p>
      ${o.kindApart ? "" : helpLine}
    </div>`;
  const kindHtml = o.kindApart ? `<section data-money-kind="${id}"${o.hidden ? " hidden" : ""}>${kinds}${helpLine}</section>` : "";
  let dlg = null, dateOf = () => "";
  const $ = sel => dlg.querySelector(`[data-money="${id}"] ${sel}`);
  function setKind(k){
    kind = k;
    dlg.querySelectorAll(inField("[data-kind]")).forEach(b => b.setAttribute("aria-checked", String(b.dataset.kind === k)));
    const h = dlg.querySelector(inField("[data-money-help]"));
    h.textContent = helpOf();
    h.hidden = !helpOf();
  }
  function setCur(c){
    cur = c;
    dlg.querySelectorAll(`[data-money="${id}"] [data-cur]`).forEach(b => b.setAttribute("aria-checked", String(b.dataset.cur === c || (!b.dataset.cur && !quick.includes(c)))));
    $("[data-sym]").textContent = symbolOf(c, lang);
    update();
  }
  function update(){
    // The dialog may hold another form by now (rates arrive later).
    const hint = $("[data-money-hint]"), input = $("input");
    if(!hint || !input) return;
    const text = input.value.trim();
    const n = parseAmount(text);
    hint.classList.remove("bad");
    if(!text){ hint.textContent = ""; return; }
    if(n === null){ hint.textContent = t("costBad"); hint.classList.add("bad"); return; }
    if(!m.home || cur === m.home){ hint.textContent = ""; return; }
    const c = m.convert(n, cur, dateOf());
    hint.textContent = !c ? t("costNoRate", {c: m.home})
      : (c.estimate ? "≈ " : "= ") + formatMoney(c.value, m.home, lang) + " · " + t(c.estimate ? "rateEstimate" : "rateOf", {d: shortDate(c.on, lang)});
  }
  return {
    html,
    kindHtml,
    wire(d, when){
      dlg = d; dateOf = when;
      $("input").addEventListener("input", update);
      $("select").addEventListener("change", e => setCur(e.target.value));
      if(m.onRates) m.onRates(update);
      update();
    },
    update(){ update(); },
    kind: () => kind,
    setKind,
    show(){ dlg.querySelectorAll(`[data-money="${id}"], [data-money-kind="${id}"]`).forEach(x => { x.hidden = false; }); update(); },
    click(e){
      const k = e.target.closest(inField("[data-kind]"));
      if(k){
        if(k.dataset.kind !== kind){ setKind(k.dataset.kind); if(o.onKind) o.onKind(kind); }
        return true;
      }
      const b = e.target.closest(`[data-money="${id}"] [data-cur]`);
      if(!b) return false;
      const sel = $("select");
      if(b.dataset.cur){ sel.hidden = true; setCur(b.dataset.cur); }
      else{ sel.hidden = false; setCur(sel.value); sel.focus(); }
      return true;
    },
    // {cost, currency, private}; cost undefined when empty or hidden; {error} when it
    // is not a number.
    read(){
      const text = $("input").value.trim(), priv = kind === "private";
      if(!text || dlg.querySelector(`[data-money="${id}"]`).hidden) return {cost: undefined, currency: cur, private: priv};
      const n = parseAmount(text);
      return n === null ? {error: t("costBad")} : {cost: n, currency: cur, private: priv};
    }
  };
}

// "18 nov": the day of a rate.
const shortDate = (date, lang) => new Intl.DateTimeFormat(lang, {day: "numeric", month: "short", timeZone: "UTC"}).format(new Date(date + "T12:00:00Z"));

/**
 * The form for an expense outside the stops (EX1–EX4): whose it is, first; what it was;
 * how much; when it was paid, as the trip's days or "Before".
 * @param {object} o
 *   expense              the expense to change (absent: a new one)
 *   private              true for one of the traveller's private expenses
 *   money                as for the stop form (local, home, convert)
 *   tripCurrency         the trip's currency, left out of the expense when it is that one
 *   days                 the trip's dates, as chips
 *   today                a new expense's day, when it is one of the trip's
 *   stopTitle            the stop a private expense was paid at, said under the days
 *   onSave(expense, private)  {title, date, cost, currency, stop?}, and whether it is private
 *   onDelete()
 */
export function openExpenseEditor(o){
  let dlg;
  const x = o.expense || {}, editing = !!o.expense, lang = getLang();
  const $ = sel => dlg.querySelector(sel);
  const days = o.days || [], onDay = date => days.includes(date);
  // "Before": the day before the first, until changed (EX3).
  const before = days.length ? new Date(Date.parse(days[0] + "T12:00:00Z") - 864e5).toISOString().slice(0, 10) : "";
  const date0 = editing ? x.date || "" : onDay(o.today) ? o.today : before;
  const money = moneyField("exp-cost", o.money, x.cost, x.currency || (editing && o.tripCurrency) || "", t("tripCostHelp"),
    {kind: o.private ? "private" : "trip", kindApart: true, big: true, label: t("fHowMuch")});
  dlg = openSheet({title: t(editing ? "editExpenseTitle" : "newExpenseTitle"), form: true, body: `
    ${money.kindHtml}
    <div class="field">
      <label for="exp-title">${esc(t("fExpense"))}</label>
      <input id="exp-title" type="text" autocomplete="off" placeholder="${esc(t("fExpensePh"))}" value="${esc(x.title || "")}">
    </div>
    ${money.html}
    <section>
      <span class="label" id="exp-when">${esc(t("fPaidOn"))}</span>
      <div class="daychips" role="group" aria-labelledby="exp-when"><button type="button" data-paid="" aria-pressed="${!onDay(date0)}">${esc(t("paidBefore"))}</button>${days.map((d, i) => {
        const p = dateParts(d, lang);
        return `<button type="button" data-paid="${d}" aria-pressed="${d === date0}" aria-label="${esc(`${t("day")} ${i + 1}, ${p.long}`)}"><small>${esc(p.dow)}</small>${i + 1}</button>`;
      }).join("")}</div>
      <div class="field datefield" data-other-date${onDay(date0) ? " hidden" : ""}><label class="sr" for="exp-date">${esc(t("fPaidOn"))}</label><input id="exp-date" type="date" value="${esc(date0)}">${EDIT}</div>
      ${x.stop && o.stopTitle ? `<p class="foot" data-at>${esc(t("paidAt", {s: o.stopTitle}))}</p>` : ""}
    </section>
    ${editing ? `<div class="srows">${dangerRow(t("deleteExpense"))}</div>` : ""}
    <p class="errbox" data-error role="alert" hidden></p>
    ${formActions(t(editing ? "save" : "addExpenseGo"))}`});
  const dateNow = () => $("#exp-date").value || "";
  const dated = () => { money.update(); const at = $("[data-at]"); if(at) at.hidden = dateNow() !== x.date; };
  money.wire(dlg, dateNow);
  $("#exp-date").addEventListener("change", dated);
  dlg.onclick = async e => {
    if(e.target === dlg) return;
    if(e.target.closest("[data-close]")) return;
    if(money.click(e)) return;
    // A day of the trip, or "Before": its date, today unless today is in the trip (EX3).
    const paid = e.target.closest("[data-paid]");
    if(paid){
      dlg.querySelectorAll("[data-paid]").forEach(b => b.setAttribute("aria-pressed", String(b === paid)));
      $("[data-other-date]").hidden = !!paid.dataset.paid;
      $("#exp-date").value = paid.dataset.paid || (onDay(dateNow()) || !dateNow() ? before : dateNow());
      dated();
      return;
    }
    if(e.target.closest("[data-delete]")){
      const answer = await ask({title: t("deleteExpenseTitle"), text: t("deleteExpenseText", {t: x.title}),
        actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("deleteExpense"), kind: "danger"}]});
      if(answer !== "yes") return;
      dlg.close();
      o.onDelete();
    }
  };
  $("form").addEventListener("submit", e => {
    e.preventDefault();
    const title = $("#exp-title").value.trim(), cost = money.read();
    // An error under its own field (EX4).
    const fail = (text, focus) => { const box = $("[data-error]"); box.textContent = text; box.hidden = false; $(focus).closest(".field").after(box); $(focus).focus(); };
    if(!title) return fail(t("expenseTitleRequired"), "#exp-title");
    if(cost.error) return fail(cost.error, "#exp-cost-amount");
    if(cost.cost === undefined) return fail(t("costRequired"), "#exp-cost-amount");
    const date = dateNow();
    dlg.close();
    // Paid at a stop: still there if it stays private, on the same day.
    const stop = cost.private && x.stop && date === x.date ? x.stop : undefined;
    o.onSave({title, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined, cost: cost.cost,
      currency: cost.currency !== o.tripCurrency ? cost.currency : undefined, stop}, cost.private);
  });
  if(!editing) $("#exp-title").focus();
}
