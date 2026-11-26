import { validateTrip, upgrade, citiesOf, stayOf, placeQuery, formatBrief, FORMAT, TRAVEL, TYPES } from "./trip.js";
import * as store from "./store.js";
import { t, setLang, deviceLang, getLang, LANGS } from "./i18n.js";
import { esc, rich, mapsUrl, dirUrl, dateParts as calendarParts, todayIn, jsonIn, cutShort, weekdayName } from "./util.js";
import { zonesOf, routeUrl, zoneSVG, painter, TYPE_COLORS } from "./geo.js";
import { daylight, partsOfDay, clockOf } from "./sun.js";
import { reviewSite, closedOn, regionOf, localLang } from "./places.js";
import { clockMinutes } from "./edit.js";
import { icon, partSign, CHECK, EDIT } from "./icons.js";
import { AHEAD, placeOf, localHours, dayWeather, stopWeather } from "./weather.js";
import { createLiveMap } from "./livemap.js";
import { googleNeedsReload, googleRefusedKey } from "./google.js";
import { versionStore } from "./objects.js";
import { REPO_URL } from "./config.js";
import { openStopEditor, openDayEditor, openExpenseEditor, openMoveDay } from "./editor.js";
import { ask } from "./ask.js";
import { openSheet } from "./sheet.js";
import { addStop, updateStop, removeStop, addDay, updateDay, removeDay, swapDays, moveDayStops, moveWarnings, addExpense, updateExpense, removeExpense, ensureIds, chooseOption, addAlternative, moveGroup, leaveGroup, choosePlan } from "./edit.js";
import { tidyGroups } from "./choices.js";
import { convert, monthsFor, formatMoney, formatRate, symbolOf, homeOf, currencies, currencyName } from "./money.js";
import { keptRates, fetchMonth } from "./rates.js";
import { prepare, saveEdit, inspect, apply, restore, moveMarks, followIds, rejoin, fileName, fileText, separate, joinChanges } from "./trips.js";
import { newOwner, splitPrivate, onLoad as privateOnLoad, join as joinPrivate, emptySet, withMarks, marksInto, mergePrivate, addPrivate, updatePrivate, removePrivate, atStop, setAtStop, followStops, unlinkStop, followIds as followIdsPrivate } from "./private.js";
import { needsStopIds } from "./ids.js";
import { openFindPositions } from "./positions.js";
import { groupOf, groupsIn, chosenIn, programOf, chosenPlan, groupName, withMine } from "./choices.js";
import { areaAround } from "./geocode.js";
import { isChanges, applyChanges, outline, changesBrief } from "./changes.js";
import { diffTrips, counts } from "./diff.js";
import { describe, openHistory } from "./history.js";
import { shortId, canonical, contentOf } from "./version.js";
import { weatherOf, hasService, linkedApps, passkeys, whoAmI, acceptTerms, session as shareSession, signIn, signOut, serviceApi, deleteFromAccount, leaveTrip, chatRequestId, chatRequest, answerChat, onThisComputer, exportAccount, deleteAccount, lockOnAccount, inviteToken, acceptInvite, publicTrip, publicLink, pageUrl, tripHistory, tripMembers } from "./share.js";
import { openShareSheet } from "./sharing.js";
import { chooseFirstDay } from "./publishing.js";
import { asBase } from "./publish.js";
import { syncTrip, syncPrivate, syncGroup, withGroup, whereOf, pendingTicks } from "./sync.js";
import { openSignUp, openLinkedApps, openDevices, openRecover, openTerms, legalUrl, accountError, recently } from "./account.js";
import { TERMS } from "./share-api.js";
import { searchTrip } from "./search.js";
import { PARTS, partOf, minutesOf, atTime } from "./parts.js";
import { openSearch, closeSearch, searching } from "./search-sheet.js";

// Where the number of a stop with a position is: a sign, crossed, for one without.
const NO_POS = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.6"/><path d="M3.6 3.6l8.8 8.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const CHEVRON = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const UNFOLD = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 6L8 2.5 11.5 6M4.5 10L8 13.5 11.5 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const FOLD = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 2.5L8 6l3.5-3.5M4.5 13.5L8 10l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLUS = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const CLIP = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5.5" y="4.5" width="13" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M9 4.5h6v2.5H9z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12h6M9 15.5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const DOTS = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12.5" cy="8" r="1.5" fill="currentColor"/></svg>';
const LOCK = '<svg class="lock" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="currentColor"/><path d="M5.5 7V5.2a2.5 2.5 0 015 0V7" stroke="currentColor" stroke-width="1.6"/></svg>';
// Icons of the opened stop's actions, and of the signals: the level gives the colour,
// the kind the icon (design/README.md, W5).
const SWAP = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 5h9.5M10 2.5L12.5 5 10 7.5M13 11H3.5M6 8.5L3.5 11 6 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SKIP = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8h8M8 4.5L11.5 8 8 11.5M13.5 3.5v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DASH = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 8h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
// The sky of a day (WX1), and the weather as a signal: a cloud with its rain.
const RAIN = '<path d="M4.5 10.5a3 3 0 01.4-6 4 4 0 017.6 1.2 2.4 2.4 0 01-.5 4.8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>';
const WX_ICON = Object.fromEntries(Object.entries({
  sun: '<circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  cloud: RAIN, fog: RAIN + '<path d="M3 13h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  rain: RAIN + '<path d="M6 12.5l-.7 1.6M9 12.5l-.7 1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  snow: RAIN + '<path d="M6 13h.01M9 13h.01M7.5 14.6h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  storm: RAIN + '<path d="M8.6 11l-1.4 2.2h1.6l-1.2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'
}).map(([k, v]) => [k, `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">${v}</svg>`]));
const SIG_ICON = {
  weather: WX_ICON.rain,
  shared: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="5.5" cy="5.5" r="2.3" stroke="currentColor" stroke-width="1.4"/><circle cx="11" cy="6.5" r="1.9" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 13c.6-2.3 2-3.5 3.7-3.5s3.1 1.2 3.7 3.5M9.5 13c.3-1.6 1-2.6 2-2.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  link: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.5 9.5l3-3M5 8l-1.3 1.3a2.1 2.1 0 003 3L8 11M11 8l1.3-1.3a2.1 2.1 0 00-3-3L8 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  closed: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3M6.3 9.2l3.4 3.1M9.7 9.2l-3.4 3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  ticket: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 5a1 1 0 011-1h10a1 1 0 011 1v1.5a1.5 1.5 0 000 3V11a1 1 0 01-1 1H3a1 1 0 01-1-1V9.5a1.5 1.5 0 000-3z" stroke="currentColor" stroke-width="1.4"/></svg>',
  choice: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 14.5V9M8 9L3.8 3.8M8 9l4.2-5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="3.5" cy="3.2" r="1.5" fill="currentColor"/><circle cx="12.5" cy="3.2" r="1.5" fill="currentColor"/></svg>',
  note: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l6.6 11.7H1.4z" fill="currentColor"/><path d="M8 6.2v3.6M8 11.6v.1" stroke="var(--warn-bg)" stroke-width="1.6" stroke-linecap="round"/></svg>'
};
const ROUTE = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 13.5V8.5a3 3 0 013-3h5.5M10 3l2.5 2.5L10 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SELECTOR = '<svg class="sel" viewBox="0 0 10 14" fill="none" aria-hidden="true"><path d="M2 5l3-3 3 3M2 9l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LIST = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5.5 4h8M5.5 8h8M5.5 12h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="2.5" cy="4" r="1.1" fill="currentColor"/><circle cx="2.5" cy="8" r="1.1" fill="currentColor"/><circle cx="2.5" cy="12" r="1.1" fill="currentColor"/></svg>';
const MAPICON = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.5 3.5l4-1.5 5 2 4-1.5v10l-4 1.5-5-2-4 1.5z M5.5 2v10 M10.5 4v10" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const INFO = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const SEARCH = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.8" stroke="currentColor" stroke-width="1.6"/><path d="M10.6 10.6l3.4 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const LOCATE = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 9.5L17 3l-6.5 14-1.6-5.9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const FRAME = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const SHRINK = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 3v4H3M13 3v4h4M17 13h-4v4M3 13h4v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CLOSE = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
// The parts of the day (design/README.md, T2): the sun on its arc, rising to setting;
// after it, the moon. One family of signs, drawn here once.
// A time in words (T2): a clock time as it is; a part of the day by its name, sunrise
// and sunset with their real time where the day is; a word that names none, as written.
function timeText(time, light = dayLight){
  const p = partOf(time);
  if(!p) return String(time ?? "");
  const real = light && (p === "sunrise" || p === "sunset") ? " · " + hhmm(p === "sunrise" ? light.sunrise : light.sunset) : "";
  return t("part_" + p) + real;
}
// The same, drawn: a part of the day with its sign.
function timeHTML(time, light = dayLight){
  const p = partOf(time);
  return p ? `<span class="tm part">${partSign(p)}<span>${esc(timeText(time, light))}</span></span>` : `<span class="tm">${esc(time)}</span>`;
}
let dayLight = null;   // sunrise and sunset of the day drawn (renderDay)

// The weather (design/README.md, WX1–WX7), kept on the phone by place: asked again after
// an hour, trusted 12 hours (WX5). When it arrives, the day is drawn again.
const wx = new Map(), wxAsked = new Set();   // place → {at, forecast}
let dayWx = null;                            // the hours of the day drawn, on the trip's clock
async function wantWeather(place){
  if(!wx.has(place)){ const kept = await store.getKV("wx:" + place).catch(() => null); if(kept){ wx.set(place, kept); renderKeepingFocus(); } }
  const k = wx.get(place);
  if((k && Date.now() - k.at < 3600_000) || wxAsked.has(place) || !hasService() || !S.online) return;
  wxAsked.add(place);
  try{
    const v = {at: Date.now(), forecast: await weatherOf(place)};
    wx.set(place, v);
    store.setKV("wx:" + place, v).catch(() => {});
    renderKeepingFocus();
  }catch(e){}
  setTimeout(() => wxAsked.delete(place), 600_000);
}
// The last forecast of each day, kept for the days gone (WX6).
function keepWeather(date, w){
  if(canonical(S.wxLog[date] || null) === canonical(w)) return;
  S.wxLog = {...S.wxLog, [date]: w};
  store.setKV("wxlog:" + S.rec.id, S.wxLog).catch(() => {});
}
let uid = 0;   // ids for aria-controls, unique on the page

const S = {
  records: [],            // [{id, trip, importedAt, fileName, exported, priv, privUnsaved}]
                          // priv: the traveller's private expenses (js/private.js), outside the versions
  rec: null,              // the open one
  state: {done: {}, skipped: {}, plans: {}},
  ui: {mapOpen: false, mapView: "live", expandAll: false, route: true, costsOpen: false, costView: "sum", costCur: "", tripSort: "date"},
  tripSearch: "",         // what the traveller looks for among their trips (Trips page)
  langPref: "auto",       // "auto" follows the trip, or a language chosen on this device
  theme: document.documentElement.dataset.theme || "auto",   // set early by js/theme.js
  openStops: new Map(),   // descriptions opened or closed one by one, until the page is closed
  openGroups: new Set(),  // groups of alternatives opened ("date|plan|name"), until the page is closed
  menuFor: null,          // the stop whose ⋯ menu is open
  deviceKey: "",
  useGoogle: true,        // false: always OpenStreetMap, even with a key (saves Google map loads)
  importError: null,      // {title, items, all}: items shown, all copied for an assistant
  online: navigator.onLine !== false,
  wxLog: {},              // the last forecast of each day of the open trip (WX6)
  version: "",
  home: homeOf(navigator.language),   // the traveller's own currency
  rates: {},              // exchange rates of the days the trip needs (js/money.js)
  owner: "",              // this phone's code for its private expenses, made with the first one
  account: null,          // the sharing service's account on this phone ({id, handle, …}), or null
  sync: "",               // "", "busy", "ok", "partial", "offline", "error": the last sync with the service
  syncErrors: new Map(),  // trip id → why it did not sync (the others did), until the next sync
  hidden: new Set(),      // trips of the account taken off this phone only: not downloaded again
  drafts: {},             // what the traveller wrote for an assistant: {new: "…", "edit:<trip id>": "…"}
  openDetails: new Set(), // folded sections opened (data-keep), kept open when the page is drawn again
  openCosts: new Set()    // stops whose cost shows what it makes at home, until the page is closed
};

const $app = document.getElementById("app");
const $strip = document.querySelector(".strip");
const $days = document.getElementById("days");
// The element the page scrolls in: <body> on Android (js/theme.js), the window elsewhere.
const scroller = document.documentElement.classList.contains("own-scroll") ? document.body : null;

// Focus rings are for the keyboard. After a tap the app often puts the focus back on
// the button it has just drawn again, or on the first button of a dialog: the browser
// then shows a ring around a button that was only touched. The page says how the last
// interaction came, and the CSS shows rings only after a key.
for(const [type, kind] of [["pointerdown", "pointer"], ["keydown", "key"]]){
  addEventListener(type, () => { if(document.documentElement.dataset.input !== kind) document.documentElement.dataset.input = kind; }, true);
}
const scrollTop = () => scroller ? scroller.scrollTop : window.scrollY;
const scrollToY = y => { if(scroller) scroller.scrollTop = y; else window.scrollTo(0, y); };
const $file = document.getElementById("file");
const $toast = document.getElementById("toast");

let live = null;          // {key, handle} — the interactive map survives re-renders
let versions = null;      // every version of every trip on this phone (js/objects.js), set at start
let toastTimer = 0;

/* ---------- small helpers ---------- */

let pendingOffer = null;  // a toast with a button waits behind short messages instead of being lost

// A short message at the bottom: four seconds; with an action (Undo, Save the file), ten,
// with its button and a ✕. A short message meanwhile puts it back after itself; once its
// time is over it is gone: what it offered is still there (the history, the card's
// signal). A finger or the focus on it keeps it while there.
const TOAST_MS = 4000, OFFER_MS = 10000;
function toast(text, action){
  $toast.innerHTML = `<span class="msg">${esc(text)}</span>` + (action
    ? `<button type="button" class="act">${esc(action.label)}</button><button type="button" class="x" aria-label="${esc(t("close"))}">×</button>`
    : "");
  $toast.hidden = false;
  if(action){
    pendingOffer = {text, action};
    $toast.querySelector(".act").onclick = () => { pendingOffer = null; $toast.hidden = true; action.run(); };
    $toast.querySelector(".x").onclick = () => { pendingOffer = null; $toast.hidden = true; };
  }
  toastFor(action ? OFFER_MS : TOAST_MS);
}
function toastFor(ms){
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    const offer = pendingOffer, itself = !!$toast.querySelector(".act");
    $toast.hidden = true;
    pendingOffer = null;
    if(offer && !itself) toast(offer.text, offer.action);
  }, ms);
}
for(const [on, keep] of [["pointerenter", true], ["focusin", true], ["pointerleave", false], ["focusout", false]])
  $toast.addEventListener(on, () => { if($toast.hidden) return; if(keep) clearTimeout(toastTimer); else toastFor($toast.querySelector(".act") ? OFFER_MS : TOAST_MS); });

const trip = () => S.rec && S.rec.trip;
// Each city of the trip gets a colour of the palette in css/app.css (--p0…--p7), in
// the order the cities first appear: the file says nothing about colours.
const PALETTE = 8;
const cityIndex = city => Math.max(0, citiesOf(trip()).indexOf(city || "")) % PALETTE;
const cityVar = city => `var(--p${cityIndex(city)})`;
// The same colour as a value, for the interactive map, in the theme on screen.
const cityColor = city => getComputedStyle(document.documentElement).getPropertyValue(`--p${cityIndex(city)}`).trim();
// The same city on the map, which is always light (R11): the light colour in both themes.
const mapColor = city => getComputedStyle(document.documentElement).getPropertyValue(`--map-p${cityIndex(city)}`).trim();
// The key the interactive map uses: none if Google is turned off on this device;
// otherwise the key saved on this device, which wins over the one in the trip file.
const tripKey = () => (trip() && trip().googleMapsKey) || "";
const googleKey = () => S.useGoogle ? (S.deviceKey || tripKey()) : "";

// After the key, the language or the trip changes: if Google's script is already in
// the page with other settings, only a fresh page can apply the new ones.
function applyMapSettings(){
  if(googleNeedsReload(googleKey())){ location.reload(); return true; }
  return false;
}
// Ticks, skips, a plan and options of my own: on this phone, and for a trip on the
// account in the personal set too, so they reach all my phones (js/private.js).
function saveState(){
  if(!S.rec) return;
  store.setKV("state:" + S.rec.id, S.state).catch(() => {});
  if(!S.rec.share || S.rec.share.gone) return;
  const priv = withMarks(privOf(), S.state);
  if(canonical(priv) === canonical(privOf())) return;
  // Ticks for everyone (G3): what changed waits to go to the group, at the next sync.
  const g = S.rec.group, share = g && g.ticks ? {...S.rec.share, groupPending: pendingTicks((privOf() || {}).marks, S.state, S.rec.share.groupPending)} : S.rec.share;
  S.rec = {...S.rec, priv, share};
  S.records = S.records.map(r => r.id === S.rec.id ? S.rec : r);
  store.putTrip(S.rec).catch(() => {});
  syncSoon();
}
const saveUi = () => { store.setKV("ui", S.ui).catch(() => {}); };

function todayIndex(){
  if(!trip()) return -1;
  const today = todayIn(trip().timezone);
  return trip().days.findIndex(d => d.date === today);
}

function route(){
  const h = location.hash.slice(1);
  // You: the account and the settings, with or without a trip.
  if(h === "me") return {name: "me"};
  if(!trip()) return {name: "welcome"};
  if(h === "trips") return {name: "trips"};
  if(h === "info") return {name: "info"};
  const m = h.match(/^day-(\d{1,3})$/);
  if(m && +m[1] >= 1 && +m[1] <= trip().days.length) return {name: "day", i: +m[1] - 1};
  const ti = todayIndex();
  return {name: "day", i: ti >= 0 ? ti : 0};
}

// A day's date as the app says it. Someone else's trip published without its dates
// carries them moved to 2001: it says the day of the week and "Day N", never that date.
function dateParts(iso, lang){
  const p = calendarParts(iso, lang);
  const rec = S.rec;
  if(!(rec && rec.public && rec.public.dates === "hidden")) return p;
  const i = rec.trip.days.findIndex(d => d.date === iso);
  const weekday = new Intl.DateTimeFormat(lang, {weekday: "long", timeZone: "UTC"}).format(new Date(iso + "T12:00:00Z"));
  return {...p, long: weekday.charAt(0).toUpperCase() + weekday.slice(1), short: i >= 0 ? `${t("day")} ${i + 1}` : p.dow};
}

/* ---------- theme ---------- */


// "auto" follows the phone; "light" and "dark" are a choice made on this device.
// The choice is kept in localStorage so js/theme.js can apply it before the page is drawn.
function setTheme(value){
  S.theme = value;
  try{ value === "auto" ? localStorage.removeItem("timp-theme") : localStorage.setItem("timp-theme", value); }catch(e){}
  if(value === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = value;
  syncThemeColor();
}

// The colour of the phone's status bar follows the theme in use.
function syncThemeColor(){
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    if(!m.dataset.auto) m.dataset.auto = m.getAttribute("content");
    m.setAttribute("content", S.theme === "auto" ? m.dataset.auto : (S.theme === "dark" ? "#0f1113" : "#f7f7f8"));
  });
}

// The interface follows the trip's language, unless one was chosen on this device.
function applyLang(){
  setLang(S.langPref !== "auto" ? S.langPref : ((trip() && trip().lang) || deviceLang()));
}

/* ---------- loading and switching trips ---------- */

async function openRecord(rec){
  S.rec = rec || null;
  S.state = {done: {}, skipped: {}, plans: {}};
  if(rec){
    const saved = await store.getKV("state:" + rec.id);
    if(saved && typeof saved === "object") S.state = {done: saved.done || {}, skipped: saved.skipped || {}, plans: saved.plans || {},
      ...(saved.notesOpen ? {notesOpen: true} : {}), ...(saved.found ? {found: saved.found} : {})};
    S.state = marksInto(S.state, rec.priv);
    S.wxLog = (await store.getKV("wxlog:" + rec.id).catch(() => null)) || {};
    followNewIds();
    saveState();   // the marks of before into the set, once
    await store.setKV("active", rec.id);
  }else{
    await store.delKV("active");
  }
  S.openStops.clear();
  S.openCosts.clear();
  applyLang();
  document.title = rec ? rec.trip.title : "TIMP";
  await loadRates();
}

// Saves a trip record and makes it the open one. `exported` is the version the
// traveller already has as a file: anything newer is offered for saving.
async function keepRecord(rec){
  await store.putTrip(rec);
  S.records = S.records.filter(r => r.id !== rec.id).concat(rec);
  if(S.rec && S.rec.id === rec.id){ S.rec = rec; document.title = rec.trip.title; }
  else await openRecord(rec);
  syncSoon();
}

// A trip on the service, as it is here: a file adds nothing to keep it safe.
const synced = rec => !!(rec && rec.share && !rec.share.gone && rec.share.head === rec.trip.version.id && canonical(rec.share.privBase || null) === canonical(rec.priv || null));
const needsSaving = rec => !!rec && !synced(rec) && (rec.exported !== rec.trip.version.id || !!rec.privUnsaved);

// The private expenses of the open trip, and this phone's owner code, made when needed.
const privOf = () => (S.rec && S.rec.priv) || null;
function ownerNow(prefer){
  if(!S.owner){ S.owner = prefer || newOwner(); store.setKV("owner", S.owner).catch(() => {}); }
  return S.owner;
}

// A list of changes written by an AI assistant (js/changes.js): applied to the trip it
// names, or to the open one, as one new version, like an edit made on this phone.
async function importChanges(data){
  const rec = data.trip ? S.records.find(r => r.id === data.trip) : S.rec;
  const fail = items => { S.importError = {title: t("changesFailed"), items: items.slice(0, 12), all: items}; render(); scrollToY(0); };
  // Not on this phone (a private window closed, the browser cleared): said as it is; what
  // goes to the assistant asks for the whole trip, which its chat has.
  if(!rec && data.trip){ S.importError = {title: t("changesNoTripTitle"), items: [t("changesNoTripWhy", {id: data.trip})], all: [], ai: t("changesNoTripAi", {id: data.trip}), help: t("changesNoTripHelp")}; render(); scrollToY(0); return; }
  if(!rec) return fail([t("changesNoOpen")]);
  if(isLocked(rec) && data.changes.some(c => !Object.values(c || {}).some(x => x && x.private))) return fail([lockedText(rec, "lockedNoChanges", {t: rec.trip.title})]);
  // Written for the version the outline showed: when the trip changed since, applied
  // to that version and joined with what came after. A version this phone does not
  // have: tried on the trip as it is.
  const behind = !!data.from && data.from !== rec.trip.version.id;
  const from = behind ? await versions.get(rec.id, data.from) : null;
  const res = applyChanges(from || rec.trip, data, rec.priv || null, S.owner);
  if(!res.ok) return fail(behind && !from ? [t("changesOtherVersion", {v: shortId(data.from)}), ...res.errors] : res.errors);
  if(res.priv && !res.priv.owner) res.priv.owner = ownerNow();
  S.importError = null;
  if(S.rec !== rec) await openRecord(rec);
  if(!from){
    const before = rec.trip;
    await applyEdit(() => ({trip: res.trip, marks: res.moves, priv: res.priv}), "changesApplied", res.counts);
    knowAfterChanges(before, res);
    return;
  }
  const trip = await joinChanges(versions, rec.trip, from, res.trip);
  const priv = emptySet(res.priv) ? null : res.priv;
  const privChanged = canonical(priv) !== canonical(rec.priv || null);
  if(trip === rec.trip && !privChanged) return;
  if(res.moves.length){ S.state = moveMarks(S.state, res.moves); saveState(); }
  const next = {...S.rec, trip, priv, ...(privChanged ? {privUnsaved: true} : {})};
  await keepRecord(next);
  render();
  offerSave(next, trip === rec.trip ? t("privSaved") : t("changesJoined", {...res.counts, f: shortId(data.from), v: shortId(trip.version.id)}));
}

// An assistant's changes that moved stops to other days (MV6): what to know there, said
// once they are applied, with Undo.
function knowAfterChanges(before, res){
  const lines = [];
  for(const m of res.moves || []){
    if(!m.toDate || m.toDate === m.date) continue;
    const d = res.trip.days.find(x => x.date === m.toDate);
    const list = d ? (d.plans ? (d.plans.find(p => p.id === m.toPlan) || {stops: []}).stops : d.stops) : [];
    const s = list.find(x => x.id === m.to);
    if(!s) continue;
    for(const w of moveWarnings(before, s, {date: m.toDate, plan: m.toPlan || null}, {date: m.date, plan: m.plan || null, id: m.from}))
      lines.push(w.kind === "closed" ? (w.date ? t("mwClosedDate", {s: s.title, d: shortDay(m.toDate)}) : t("mwClosed", {s: s.title, d: weekdayName(w.weekday, getLang())}))
        : w.kind === "booked" ? t("mwBooked", {s: s.title, d: shortDay(m.date)}) : w.kind === "time" ? t("mwTime", {s: s.title, when: atTime(w.time), x: w.title}) : t("mwGroup", {s: s.title, g: w.name}));
  }
  if(!lines.length || !S.rec || S.rec.trip === before) return;
  const after = S.rec.trip;
  toast(t("changesKnow", {k: lines.slice(0, 2).join(" ") + (lines.length > 2 ? " +" + (lines.length - 2) : "")}), {label: t("undo"), run: () => undoEdit(before, after, res.moves)});
}

// demo: the example's private expenses are taken without asking.
async function importText(text, name, {demo = false, said = ""} = {}){
  let data;
  try{ data = JSON.parse(text); }
  catch(e){
    // Copied while the assistant was still writing it: nothing to fix, only to wait.
    if(cutShort(text)){ S.importError = {title: t("jsonCutTitle"), items: [t("jsonCutWhy")]}; render(); scrollToY(0); return; }
    const why = t("notJson") + " " + String(e && e.message || "");
    S.importError = {title: t("importFailed"), items: [why], all: [why]};
    render(); scrollToY(0); return;
  }
  if(isChanges(data)){ await importChanges(data); return; }
  data = upgrade(data);   // a file in the old format is converted, then checked
  // Its stops get ids of their own, and one copied with its id (an assistant that copied
  // a stop) another: the original is the one where the version it was made from has it.
  if(data && typeof data === "object" && !Array.isArray(data)){
    const v = data.version && typeof data.version.id === "string" && typeof data.id === "string" ? await versions.get(data.id, data.version.id).catch(() => null) : null;
    data = ensureIds(data, v).trip;
  }
  const res = validateTrip(data);
  if(!res.ok){ S.importError = {title: t("importFailed"), items: res.errors.slice(0, 12), all: res.errors}; render(); scrollToY(0); return; }
  S.importError = null;
  try{
    // The private expenses travel apart: they never enter a version (js/private.js).
    const {trip: shared, priv: file} = splitPrivate(data);
    const {trip: incoming} = await prepare(shared);
    const theirs = followIdsPrivate(file, incoming);
    const local = S.records.find(r => r.id === incoming.id);
    let pv = demo && theirs ? {action: "mine"} : privateOnLoad(local ? local.priv || null : null, theirs, S.owner);
    const check = pv.action === "ask" ? {label: t("privCheck", {n: theirs.expenses.length}), checked: pv.yes} : null;
    // asked: the merge question had the box for the private expenses.
    let rec, message, offer = false, asked = false, mine = local ? local.priv || null : null;
    if(!local){
      await versions.put(incoming);
      rec = {id: incoming.id, trip: incoming, importedAt: Date.now(), fileName: name || "", exported: incoming.version.id};
      message = said || t("imported", {t: incoming.title});
    }else{
      const x = await inspect(versions, local.trip, incoming);
      // Locked: nothing of this file goes into it (another trip with the same id may go apart).
      if(isLocked(local) && x.kind !== "same" && !x.unrelated){
        S.importError = {title: t("importFailed"), items: [lockedText(local, "lockedNoFile", {t: local.trip.title})]};
        render(); scrollToY(0);
        return;
      }
      asked = x.kind === "diverged" && !x.unrelated;
      const choice = x.kind !== "diverged" ? (x.kind === "newer" ? "take" : "keep")
        : x.unrelated ? await chooseUnrelated(x) : await chooseMerge(x, check);
      if(choice === null) return;   // the traveller cancelled: nothing changes
      if(choice === "separate"){
        // Another trip with the same id: a trip of its own, with its own private expenses.
        const trip = await separate(versions, incoming, new Set(S.records.map(r => r.id)));
        rec = {id: trip.id, trip, importedAt: Date.now(), fileName: name || "", exported: incoming.version.id};
        message = t("recvSeparate", {t: trip.title});
        mine = null;
        if(pv.action !== "none") pv = privateOnLoad(null, theirs, S.owner);
      }else{
        const trip = await apply(versions, x, choice);
        const v = shortId(trip.version.id);
        rec = {...local, trip, importedAt: Date.now(), fileName: name || local.fileName};
        if(x.kind === "same") message = t("recvSame", {v});
        else if(x.kind === "newer"){ rec.exported = trip.version.id; message = t("recvNewer", {t: trip.title, v}); }
        else if(x.kind === "older"){
          // Nothing changes, unless the traveller wants this older file back; its private
          // expenses are older too.
          toast(t("recvOlder", {v}), {label: t("backToFile"), run: () => backToFile(x)});
          return;
        }
        else if(choice === "theirs"){ message = t("recvTheirs", {v}); offer = true; }
        else { const c = counts(diffTrips(local.trip, trip)); message = t("recvMerged", {a: c.added, c: c.changed, r: c.removed, v}); offer = true; }
      }
    }
    // The file's private expenses: taken when they are this phone's, or when the
    // traveller says so (in the merge question, or in one of their own).
    const take = pv.action === "mine" || (pv.action === "ask" && (asked ? check.checked : await askPrivate(theirs, pv.yes)));
    if(take){
      rec.priv = joinPrivate(mine, theirs, ownerNow(theirs.owner));
      message += " " + t("privLoaded", {n: theirs.expenses.length});
    }else if(pv.action === "other") message += " " + t("privOther");
    await keepRecord(rec);
    store.askPersistence();
    if(location.hash) history.replaceState(null, "", location.pathname + location.search);
    render();
    scrollToY(0);
    if(offer) offerSave(rec, message); else toast(message);
  }catch(e){
    S.importError = {title: t("importFailed"), items: [String(e && e.message || e)]};
    render();
  }
}

// Both the file and this phone changed: show what, and ask what to do. `check`: the box
// for the file's private expenses, when there is a question about them.
async function chooseMerge(x, check){
  const answer = await ask({
    check: check || undefined,
    title: t("divTitle"),
    text: [
      {title: t("divInFile"), items: describe(x.theirs, 4)},
      {title: t("divOnPhone"), items: describe(x.mine, 4)},
      x.base ? "" : t("divNoBase")
    ],
    actions: [{id: "cancel", label: t("cancel")}, {id: "theirs", label: t("useFile")}, {id: "merge", label: t("mergeBoth"), kind: "primary"}]
  });
  return answer === "theirs" || answer === "merge" ? answer : null;
}

// The file and the trip on this phone have the same id but no version in common: most
// likely two trips with the same name and first day (a friend's), or the same trip
// written again from scratch, which is joined as before.
async function chooseUnrelated(x){
  const answer = await ask({title: t("unrelTitle"), text: t("unrelText", {t: x.incoming.title}),
    actions: [{id: "cancel", label: t("cancel")}, {id: "merge", label: t("mergeBoth")}, {id: "separate", label: t("keepApart"), kind: "primary"}]});
  return answer === "merge" || answer === "separate" ? answer : null;
}

// A file with private expenses that may not be this traveller's: add them or not.
// `yes`: they are no one's yet (an assistant wrote them), and adding is suggested.
async function askPrivate(priv, yes){
  const n = priv.expenses.length;
  const answer = await ask({title: t("privTitle"), text: t(yes ? "privTextNew" : "privText", {n}),
    actions: [{id: "no", label: t("privSkip")}, {id: "yes", label: t("privTake"), kind: yes ? "primary" : ""}]});
  return answer === "yes";
}

// An older file loaded on purpose: its content comes back as a new version.
async function backToFile(x){
  if(!editable(S.records.find(r => r.id === x.local.id))) return;
  const trip = await apply(versions, x, "back");
  const rec = {...S.records.find(r => r.id === trip.id), trip};
  await keepRecord(rec);
  render();
  offerSave(rec, t("recvBack", {v: shortId(trip.version.id)}));
}

// The history of the open trip, with a way back to any version this phone has.
function showHistory(id){
  const rec = S.records.find(r => r.id === id);
  if(!rec) return;
  // On the account, the service says who made each version, and whether a chat did.
  const onAccount = S.account && rec.share && rec.share.id && !rec.share.gone && !rec.public;
  const who = onAccount ? async () => ({me: S.account.handle, versions: new Map((await tripHistory(rec.share.id)).map(v => [v.id, v]))}) : null;
  // Restoring a shared trip changes it for everyone: the question says who will see it.
  const forAll = async () => { const o = await othersOnTrip(rec); return o === null ? "" : o.length ? t("restoreShared", {who: o.join(", ")}) : t("restoreSharedAnyone"); };
  openHistory({trip: rec.trip, versions, who, forAll, onRestore: async vid => {
    if(!editable(rec)) return;
    const {trip} = await restore(versions, rec.trip, vid);
    const next = {...rec, trip};
    await keepRecord(next);
    render();
    offerSave(next, t("restored", {v: shortId(trip.version.id)}));
  }}).catch(err => toast(String(err.message || err)));
}

/* ---------- locked trips ---------- */

// A locked trip stays at its version: no edit, no file or chat taken into it, no
// version brought back, no deleting, until it is unlocked. Ticks and private expenses
// are not the trip's version: they stay free. On the account, the lock is the
// service's (its owner's, for everyone); on this phone only, this phone's.
// A trip opened from someone's page ("Open in TIMP") is read only, as a locked trip, for
// good: it is theirs. To change it, "Use as a base" makes a copy.
const isLocked = rec => !!(rec && (rec.locked || rec.public || (rec.share && !rec.share.gone && rec.share.locked)));
// What a locked trip says when something would change it: its own words for a trip of someone else's.
const lockedText = (rec, key, vars) => rec && rec.public ? t("publicNoEdit", {h: rec.public.by}) : t(key, vars);
const editable = (rec = S.rec) => { if(!isLocked(rec)) return true; toast(lockedText(rec, "lockedNoEdit")); return false; };

async function toggleLock(id){
  const rec = S.records.find(r => r.id === id);
  if(!rec || rec.public) return;
  const locked = isLocked(rec), title = rec.trip.title;
  const yes = await ask({title: t(locked ? "unlockTitle" : "lockTitle"), text: t(locked ? "unlockText" : "lockText", {t: title}),
    actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t(locked ? "unlock" : "lock"), kind: "primary"}]});
  if(yes !== "yes") return;
  let next;
  if(rec.share && rec.share.id && !rec.share.gone && S.account){
    // On the account: the owner's lock, for every phone and person; it needs the service.
    try{ const r = await lockOnAccount(rec.share.id, !locked); next = {...rec, share: {...rec.share, locked: r.locked}}; }
    catch(e){ toast(e && e.status === 0 ? t("removeNeedsNet") : accountError(e)); return; }
  }else next = {...rec, locked: !locked};
  await keepSynced(next);
  render();
  toast(t(locked ? "unlockedDone" : "lockedDone", {t: title}));
}

/* ---------- editing stops ---------- */

// Applies an edit to the open trip: a new version, kept on the phone, then offered
// as a file. `change(trip)` returns {trip, marks?, priv?}: marks move ticks with a
// stop; priv, the private expenses after the edit (no version: privMessage says so).
// A locked trip takes only what leaves its version alone (private expenses).
// `form`: made with a form and Save, so not asked first: on a shared trip, saved for
// everyone says so after, with Undo.
async function applyEdit(change, message, extra = {}, privMessage = "privSaved", {form = false} = {}){
  const cur = S.rec.trip, had = privOf();
  const out = change(cur);
  if(isLocked(S.rec) && canonical(contentOf(out.trip)) !== canonical(contentOf(cur))){ toast(lockedText(S.rec, "lockedNoEdit")); return; }
  const {trip: next, changed} = await saveEdit(versions, cur, out.trip);
  const priv = out.priv === undefined ? had : emptySet(out.priv) ? null : out.priv;
  const privChanged = canonical(priv) !== canonical(had);
  if(!changed && !privChanged) return;
  if(out.marks && out.marks.length){ S.state = moveMarks(S.state, out.marks); saveState(); }
  const rec = {...S.rec, trip: next, priv, ...(privChanged ? {privUnsaved: true} : {})};
  await keepRecord(rec);
  render();
  offerSave(rec, changed ? t(message, {v: shortId(next.version.id), ...extra}) : t(privMessage));
  if(form && changed) othersOnTrip().then(others => {
    if(others === null || S.rec.trip !== next) return;
    toast(others.length ? t("savedForAll", {who: others.join(", ")}) : t("savedForAllAnyone"), {label: t("undo"), run: () => undoEdit(cur, next, out.marks)});
  });
}

// Undo, right after a change saved for everyone: a new version with the content from
// before (as History → Restore), while nothing else changed since. The ticks and the
// private expenses that followed moved stops go back with them.
async function undoEdit(before, after, moves = []){
  if(!S.rec || S.rec.trip.version.id !== after.version.id){ toast(t("undoLate")); return; }
  const back = moves.map(m => ({date: m.toDate || m.date, plan: m.toDate ? m.toPlan : m.plan, from: m.to, to: m.from, toDate: m.date, toPlan: m.plan}));
  await applyEdit(() => ({trip: JSON.parse(JSON.stringify(contentOf(before))), marks: back, priv: followStops(privOf(), back)}), "undone");
}

function currentPlace(){
  const r = route();
  if(r.name !== "day") return {dayIndex: Math.max(0, todayIndex()), planId: null};
  const d = trip().days[r.i];
  const plan = planShown(d);
  return {dayIndex: r.i, planId: plan ? plan.id : null};
}

function editorBase(){
  return {trip: trip(), timezone: trip().timezone, googleKey: googleKey()};
}

// The trip with the day a stop goes to, when the form chose a new one after the last.
const withDay = (tr, newDay) => newDay ? addDay(tr, {...newDay, stops: []}) : tr;
const goToDay = date => { const k = trip().days.findIndex(d => d.date === date); if(route().name !== "day" || route().i !== k) location.hash = "#day-" + (k + 1); };

// A new stop: on the day on screen, or today when the trip is under way; with
// newDay, on a new day after the last.
function newStop(prefill, newDay = false){
  if(!editable()) return;
  const here = currentPlace(), ti = todayIndex();
  const dayIndex = route().name === "day" ? here.dayIndex : (ti >= 0 ? ti : 0);
  openStopEditor({...editorBase(), money: moneyOptions(), dayIndex, planId: here.planId, prefill, newDay,
    onSave: ({stop, date, plan, newDay, priv: paid}) => applyEdit(tr => {
      const out = addStop(withDay(tr, newDay), {date, plan}, stop);
      return {trip: out.trip, priv: paid ? setAtStop(privOf(), out.trip, ownerNow(), {date, stop: out.ref.id, title: stop.title}, paid, null) : undefined};
    }, newDay ? "dayAdded" : "stopAdded", newDay ? {n: trip().days.length + 1} : {}, "privAdded", {form: true})
      .then(() => goToDay(date))
      .catch(err => toast(String(err.message || err)))});
}

// The day on screen: its city, title, night and notes, or deleted with its stops (DY1–DY4);
// the private expenses paid there stay, no longer at a stop.
const stopsOfDay = d => d.plans ? d.plans.flatMap(p => p.stops) : d.stops;
function editDay(){
  if(!editable()) return;
  const tr = trip(), i = currentPlace().dayIndex, d = tr.days[i];
  const ids = stopsOfDay(d).map(s => s.id), priv = privOf();
  const goes = {stops: ids.length, done: Object.keys(S.state.done || {}).filter(k => k.startsWith(d.date + "|")).length,
    priv: priv ? priv.expenses.filter(x => x.date === d.date && ids.includes(x.stop)).length : 0};
  openDayEditor({day: d, number: i + 1, canDelete: tr.days.length > 1, goes,
    cities: [...new Set(tr.days.map(x => x.city).filter(Boolean))], before: i ? tr.days[i - 1].stay : undefined,
    onSave: set => applyEdit(tr => ({trip: updateDay(tr, d.date, set)}), "daySaved", {}, "privSaved", {form: true}).catch(err => toast(String(err.message || err))),
    onDelete: () => applyEdit(tr => ({trip: removeDay(tr, d.date), priv: ids.reduce((p, id) => unlinkStop(p, d.date, id), privOf())}), "dayDeleted")
      .then(() => { location.hash = "#day-" + Math.max(1, Math.min(i + 1, trip().days.length)); })
      .catch(err => toast(String(err.message || err)))});
}

// The day on screen moved (MV1–MV5): swapped with another, or its stops joined to another.
// One version; ticks, skips, private expenses and the plan looked at follow; on a shared
// trip, asked first, saying who will see it (A9).
function moveDay(){
  if(!mayChange()) return;
  const i = currentPlace().dayIndex;
  openMoveDay({trip: trip(), dayIndex: i, onSave: async ({how, to}) => {
    const from = trip().days[i].date, j = trip().days.findIndex(d => d.date === to);
    const swap = how === "swap", n = {a: Math.min(i, j) + 1, b: Math.max(i, j) + 1, m: i + 1, k: j + 1};
    if(!(await sureForAll(t(swap ? "swapAsk" : "joinAsk", n), t("moveDayChange")))) return;
    await applyEdit(tr => {
      const out = swap ? swapDays(tr, from, to) : moveDayStops(tr, from, to);
      return {...out, priv: followStops(privOf(), out.marks)};
    }, swap ? "daysSwapped" : "dayJoined", n);
    if(swap){
      const p = {...S.state.plans}, a = p[from], b = p[to];
      delete p[from]; delete p[to];
      if(b) p[from] = b;
      if(a) p[to] = a;
      S.state = {...S.state, plans: p};
      saveState();
    }
    const k = trip().days.findIndex(d => d.date === to);
    location.hash = "#day-" + (k + 1);
  }});
}

// The stops of the open day without a position, found all at once (js/positions.js),
// checked, and the ticked ones saved as one version; `only`: one stop's (its sign, where
// its number would be). Once some are saved, the line that says what is left goes below
// the stops.
async function findPositions(only = null){
  if(!editable()) return;
  const here = currentPlace(), d = trip().days[here.dayIndex];
  const listIn = t => { const x = t.days.find(y => y.date === d.date); return !x ? [] : here.planId ? ((x.plans || []).find(p => p.id === here.planId) || {stops: []}).stops : x.stops || []; };
  const list = listIn(trip()), missing = list.filter(s => s.lat === undefined && s.id && (!only || s.id === only));
  if(!missing.length) return;
  if(navigator.onLine === false){ toast(t("posFindOffline")); return; }
  const around = list.filter(s => s.lat !== undefined);
  const all = trip().days.flatMap(x => x.plans ? x.plans.flatMap(p => p.stops) : x.stops);
  const res = await openFindPositions({stops: missing.map(s => ({id: s.id, title: s.title, address: s.address})), city: d.city,
    near: areaAround(around) || areaAround(all), around, googleKey: googleKey()});
  if(!res) return;
  if(res.open){ editStop(res.open); return; }
  if(res.found.length) await applyEdit(tr => {
    let out = tr;
    // The trip as it is now (a sync may have come meanwhile): only stops still without one.
    for(const f of res.found){
      const s = listIn(out).find(x => x.id === f.id);
      if(s && s.lat === undefined) out = updateStop(out, {date: d.date, plan: here.planId, id: f.id}, {...s, lat: f.lat, lng: f.lng}).trip;
    }
    return {trip: out};
  }, res.found.length === 1 ? "posSavedOne" : "posSaved", {n: res.found.length});
  S.state.found = {...(S.state.found || {}), [d.date]: true};
  saveState();
  render();
}

/* ---------- alternatives (js/choices.js) ---------- */

// The list of the open day (its plan's), as it is in the trip, and where it is.
function hereList(){
  const here = currentPlace(), d = trip().days[here.dayIndex];
  const p = here.planId && d.plans ? d.plans.find(x => x.id === here.planId) : null;
  return {here, d, ref: {date: d.date, plan: here.planId}, list: p ? p.stops : d.stops};
}

// A list after an option left it: a group left with one option is a plain stop again.
function tidyIn(tr, {date, plan}){
  const out = JSON.parse(JSON.stringify(tr)), d = out.days.find(x => x.date === date);
  const p = plan && d.plans ? d.plans.find(x => x.id === plan) : null;
  if(p) p.stops = tidyGroups(p.stops); else if(d.stops) d.stops = tidyGroups(d.stops);
  return out;
}

// Whoever else will see a change of the trip's programme: null when nobody else has the
// trip; [] when they cannot be known now (offline, slow).
async function othersOnTrip(rec = S.rec){
  const sh = rec.share;
  if(!sh || !sh.id || sh.gone) return null;
  try{
    const members = await Promise.race([tripMembers(sh.id), new Promise((_, no) => setTimeout(() => no(new Error("slow")), 4000))]);
    const me = S.account && S.account.handle;
    const others = members.map(m => m.handle).filter(h => h && h !== me);
    return others.length ? others : null;
  }catch(e){ return []; }
}

// A change everyone with the trip will see, made with one tap: on a shared trip it is
// asked first, saying what changes and who will see it. A trip of this phone only: never.
async function sureForAll(title, change){
  const others = await othersOnTrip();
  if(others === null) return true;
  const text = [change, others.length ? t("altConfirmShared", {who: others.join(", ")}) : t("altConfirmSharedAnyone")];
  return (await ask({title, text, actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("altForAll"), kind: "primary"}]})) === "yes";
}

// Whether the trip's programme can be changed here: locked, or shared to read only, says why.
function mayChange(){
  if(!editable()) return false;
  if(!canChange()){ toast(t("altReadOnly")); return false; }
  return true;
}

// Mine, with whoever goes there too among those who show it (G2): "You and ugo".
const youMark = (with_ = []) => `<span class="you">${S.account ? `<i aria-hidden="true">${esc(S.account.handle.slice(0, 1).toUpperCase())}</i>` : ""}${esc(!with_.length ? t("altMine") : with_.length === 1 ? t("altMineWith", {h: with_[0]}) : t("altMineWithN", {n: with_.length}))}</span>`;
// Names in a narrow place (G7): two, then "+N"; circles: three, then "+N"; all of them said.
const namesShort = hs => hs.length <= 2 ? hs.join(", ") : `${hs.slice(0, 2).join(", ")} +${hs.length - 2}`;
const whoCircles = hs => !hs.length ? "" : `<span class="who" role="img" aria-label="${esc(hs.join(", "))}">${hs.slice(0, 3).map(h => `<i>${esc(h.slice(0, 1).toUpperCase())}</i>`).join("")}${hs.length > 3 ? `<i class="more">+${hs.length - 3}</i>` : ""}</span>`;
// Who goes to each option of a group, of those who show where they go: their own, or the group's.
function goersIn(options, groups){
  const out = new Map();
  for(const p of (S.rec && S.rec.group && S.rec.group.shown) || []){
    const o = options.find(x => x.id && p.chosen[x.id]) || groups;
    if(o) out.set(o, [...(out.get(o) || []), p.handle]);
  }
  return out;
}
const optionLabel = s => s ? [s.title, s.time ? timeText(s.time) : ""].filter(Boolean).join(", ") : t("altNone");

// "Choose this" (design/README.md, P1–P2). A trip of mine only: the trip goes to this
// option. Shared: asked, for everyone or only for me; read only or locked, only for me
// at once. The group's own option again: my choice goes.
async function chooseHere(id){
  const {ref, list} = hereList();
  const s = list.find(x => x.id === id), g = groupOf(s);
  if(!g) return;
  const options = groupsIn(list).get(g) || [], was = chosenIn(options);
  const mine = options.find(x => S.state.chosen && S.state.chosen[x.id] && x !== was) || null;
  if(s === was){ if(mine) setMine(options, null); return; }
  if(s === mine) return;
  const others = await othersOnTrip();
  if(others === null){
    if(mayChange()) await applyEdit(tr => ({trip: chooseOption(tr, {...ref, id})}), "altChosenMsg", {g, s: s.title});
    return;
  }
  const reach = !canChange() ? "me" : await ask({title: t("altConfirmTitle", {g, s: s.title}),
    text: [`${optionLabel(was)} → ${optionLabel(s)}`, others.length ? t("altConfirmShared", {who: others.join(", ")}) : t("altConfirmSharedAnyone"), t("altOnlyMeSays")],
    actions: [{id: "no", label: t("cancel")}, {id: "me", label: t("altOnlyMe")}, {id: "all", label: t("altForAll"), kind: "primary"}]});
  if(reach === "all"){
    setMine(options, null);
    await applyEdit(tr => ({trip: chooseOption(tr, {...ref, id})}), "altChosenMsg", {g, s: s.title});
  }else if(reach === "me"){
    setMine(options, s);
    toast(t(canChange() ? "altMineMsg" : "altMineReadOnly", {g, s: s.title}), {label: t("undo"), run: () => setMine(options, mine)});
  }
}

// My option of a group, or none (the group's): in my marks, never in the trip.
function setMine(options, s){
  const chosen = {...S.state.chosen};
  for(const o of options) delete chosen[o.id];
  if(s) chosen[s.id] = 1;
  S.state = {...S.state, chosen};
  saveState();
  render();
}

// "Add an alternative" to a stop: the stop form, with its day, time and kind, in its
// group (or a new one, named from the time and kind: Lunch, Dinner, Alternatives).
function addAlternativeHere(id){
  if(!mayChange()) return;
  const {here, ref, list} = hereList();
  const s = list.find(x => x.id === id);
  if(!s) return;
  const groups = groupsIn(list), g = groupOf(s);
  const group = g || groupName(s, {lunch: t("altLunch"), dinner: t("altDinner"), other: t("altOther")}, list);
  const others = g && groups.has(g) ? groups.get(g).filter(x => x !== s).map(x => x.title) : [];
  openStopEditor({...editorBase(), money: moneyOptions(), dayIndex: here.dayIndex, planId: here.planId,
    template: {time: s.time, type: s.type}, alternative: {group, fixed: groups.has(g), of: s.title, others},
    onSave: ({stop, date, plan, newDay, priv: paid, group: name}) => applyEdit(tr => {
      // Moved to another day in the form: a plain new stop there.
      const same = !newDay && date === ref.date && (plan || null) === (ref.plan || null);
      const out = same ? addAlternative(tr, {...ref, id}, stop, name) : addStop(withDay(tr, newDay), {date, plan}, stop);
      return {trip: out.trip, priv: paid ? setAtStop(privOf(), out.trip, ownerNow(), {date, stop: out.ref.id, title: stop.title}, paid, null) : undefined};
    }, "altAdded", {g: groupOf(s) || name || group, s: stop.title}, "privAdded", {form: true}).catch(err => toast(String(err.message || err)))});
}

// The plan looked at, chosen for the day, for everyone.
async function choosePlanHere(pid){
  if(!mayChange()) return;
  const {d} = hereList();
  const p = d.plans && d.plans.find(x => x.id === pid), was = chosenPlan(d);
  if(!p || p === was) return;
  if(!(await sureForAll(t("planConfirmTitle"), `${was.name} → ${p.name}`))) return;
  await applyEdit(tr => ({trip: choosePlan(tr, d.date, pid)}), "planChosenMsg", {p: p.name});
}

function editStop(stopId){
  if(!editable()) return;
  const here = currentPlace();
  const d = trip().days[here.dayIndex];
  const list = d.plans ? d.plans.find(p => p.id === here.planId).stops : d.stops;
  const stop = list.find(s => s.id === stopId);
  if(!stop) return;
  const ref = {date: d.date, plan: here.planId, id: stop.id};
  // What the traveller paid there for themselves: the form shows the first one.
  const paid = atStop(privOf(), d.date, stop.id)[0] || null;
  openStopEditor({...editorBase(), money: moneyOptions(), dayIndex: here.dayIndex, planId: here.planId, stop,
    privateCost: paid && {cost: paid.cost, currency: paid.currency},
    onSave: async ({stop: next, date, plan, newDay, priv: cost}) => {
      // An option of a group moved to another day or plan: only it (it leaves the group),
      // or the whole group?
      const g = groupOf(stop), moved = date !== ref.date || (plan || null) !== (ref.plan || null);
      const options = g && moved ? groupsIn(list).get(g) : null;
      let how = "one";
      if(options){
        how = await ask({title: t("altMoveTitle", {s: stop.title, g}), text: t("altMoveText"),
          actions: [{id: "cancel", label: t("cancel")}, {id: "one", label: t("altMoveOne")}, {id: "all", label: t("altMoveAll"), kind: "primary"}]});
        if(how !== "one" && how !== "all") return;
      }
      await applyEdit(tr => {
        if(how === "all"){
          const there = updateStop(tr, ref, next).trip;
          const out = moveGroup(withDay(there, newDay), ref, g, {date, plan});
          const marks = options.map(o => ({date: ref.date, plan: ref.plan, from: o.id, to: o.id, toDate: date, toPlan: plan}));
          const priv = setAtStop(followStops(privOf(), marks), out, cost ? ownerNow() : "", {date, stop: ref.id, title: next.title}, cost, paid && paid.id);
          return {trip: out, marks, priv};
        }
        const leaving = options ? leaveGroup(next) : next;
        const out = updateStop(withDay(tr, newDay), ref, leaving, {date, plan});
        const trip1 = options ? tidyIn(out.trip, ref) : out.trip;
        const marks = [{date: ref.date, plan: ref.plan, from: ref.id, to: out.ref.id, toDate: date, toPlan: plan}];
        const priv = setAtStop(followStops(privOf(), marks), trip1, cost ? ownerNow() : "", {date, stop: out.ref.id, title: next.title}, cost, paid && paid.id);
        return {trip: trip1, marks, priv};
      }, "stopSaved", {}, "privSaved", {form: true}).catch(err => toast(String(err.message || err)));
    },
    // What was paid there privately stays, under its own name.
    onDelete: () => applyEdit(tr => ({trip: removeStop(tr, ref), priv: unlinkStop(privOf(), ref.date, ref.id)}), "stopDeleted").catch(err => toast(String(err.message || err)))});
}

// An expense outside the stops, of the trip or private: a new one, or the one with
// this id. Changing which it is moves it from one list to the other.
function editExpense(id, isPrivate = false){
  if(!isPrivate && !editable()) return;
  const tr = trip(), list = isPrivate ? (privOf() ? privOf().expenses : []) : (tr.expenses || []);
  const x = id ? list.find(e => e.id === id) : null;
  if(id && !x) return;
  const fail = err => toast(String(err.message || err));
  const at = x && x.stop && tr.days.find(d => d.date === x.date);
  const stop = at && stopsOfDay(at).find(s => s.id === x.stop);
  openExpenseEditor({expense: x, private: isPrivate, money: moneyOptions(), tripCurrency: tr.currency || "", today: tripToday(),
    days: tr.days.map(d => d.date), stopTitle: stop ? stop.title : "",
    onSave: (e, toPrivate) => applyEdit(cur => {
      let next = cur, priv = privOf();
      const {stop, ...shared} = e;
      if(x && isPrivate === toPrivate){
        if(toPrivate) priv = updatePrivate(priv, cur, x.id, e); else next = updateExpense(cur, x.id, shared);
      }else{
        if(x){ if(isPrivate) priv = removePrivate(priv, cur, x.id); else next = removeExpense(cur, x.id); }
        if(toPrivate) priv = addPrivate(priv, next, ownerNow(), e).priv; else next = addExpense(next, shared).trip;
      }
      return {trip: next, priv};
    }, x ? "expenseSaved" : "expenseAdded", {}, x ? "privSaved" : "privAdded").catch(fail),
    onDelete: () => applyEdit(cur => isPrivate ? {trip: cur, priv: removePrivate(privOf(), cur, x.id)} : {trip: removeExpense(cur, x.id)},
      "expenseDeleted", {}, "privDeleted").catch(fail)});
}

/* ---------- the trip as a file ---------- */

function download(file){
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Chrome on Android offers the share sheet but refuses .json files in it
// (NotAllowedError: the type is not on its list). Once refused, download directly.
let shareRefused = false;

// Hands a file over: the share sheet where the phone has one and takes the file
// (WhatsApp, Drive, Files…), a download otherwise. false if the traveller closed the
// sheet or it could not be done (said already).
async function handOver(file, title){
  try{
    if(!shareRefused && navigator.canShare && navigator.canShare({files: [file]})){
      try{
        await navigator.share({files: [file], title});
      }catch(e){
        if(e && e.name === "AbortError") return false;   // the traveller closed the share sheet
        shareRefused = true;
        download(file);
      }
    }else{
      download(file);
    }
    return true;
  }catch(e){
    toast(t("fileFailed"));
    return false;
  }
}

// A trip as a file, handed over; the version marked as saved. With private expenses,
// the traveller says first whether they go in the file: kept for themselves, left out
// for someone else.
async function saveFile(rec){
  let priv = null;
  if(rec.priv && rec.priv.expenses.length){
    const answer = await ask({title: t("saveFile"), text: t("saveWhich", {n: rec.priv.expenses.length}),
      actions: [{id: "cancel", label: t("cancel")}, {id: "without", label: t("saveWithout")}, {id: "with", label: t("saveWith"), kind: "primary"}]});
    if(answer !== "with" && answer !== "without") return;
    if(answer === "with") priv = rec.priv;
  }
  const file = new File([fileText(rec.trip, priv)], fileName(rec.trip), {type: "application/json"});
  if(!(await handOver(file, rec.trip.title))) return;
  const done = {...rec, exported: rec.trip.version.id, ...(priv ? {privUnsaved: false} : {})};
  await keepRecord(done);
  render();
  toast(t("fileSaved", {f: file.name}));
}

function offerSave(rec, message){
  toast(message, {label: t("saveFile"), run: () => saveFile(S.records.find(r => r.id === rec.id) || rec)});
}

async function loadDemo(){
  try{
    const r = await fetch("examples/demo-trip.json");
    if(!r.ok) throw new Error(String(r.status));
    await importText(await r.text(), "demo-trip.json", {demo: true});
  }catch(e){
    S.importError = {title: t("importFailed"), items: [String(e && e.message || e)]};
    render();
  }
}

async function removeRecord(id){
  const rec = S.records.find(r => r.id === id);
  if(!rec) return;
  // Someone else's trip, read only, can always go from this phone.
  if(isLocked(rec) && !rec.public){ toast(t("lockedNoDelete")); return; }
  const onAccount = !!(rec.share && rec.share.id && !rec.share.gone && S.account);
  let message = "removed";
  if(!onAccount){
    const answer = await ask({title: t("removeTripTitle"), text: t("removeConfirm", {t: rec.trip.title}),
      actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("remove"), kind: "danger"}]});
    if(answer !== "yes") return;
  }else{
    // On the account: from this phone only, or from the account (the owner), or out of
    // the sharing (someone it was shared with).
    const own = rec.share.role === "owner";
    const answer = await ask({title: t("removeTripTitle"), text: t(own ? "removeSyncedText" : "removeSharedText", {t: rec.trip.title}),
      actions: [{id: "no", label: t("cancel")}, {id: "here", label: t("removeHere")}, {id: "all", label: t(own ? "removeEverywhere" : "leaveShare"), kind: "danger"}]});
    if(answer !== "here" && answer !== "all") return;
    // From the account, for everyone, for good: once more, with the trip's name written.
    if(answer === "all" && own){
      const sure = await ask({title: t("removeForeverTitle"), text: t("removeForeverText", {t: rec.trip.title}),
        type: {label: t("removeForeverLabel"), expected: rec.trip.title},
        actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("removeForever"), kind: "danger", needsType: true}]});
      if(sure !== "yes") return;
    }
    if(answer === "all"){
      try{ own ? await deleteFromAccount(rec.share.id) : await leaveTrip(rec.share.id, S.account.id); }
      catch(e){ toast(e && e.status === 0 ? t("removeNeedsNet") : accountError(e)); return; }
      message = own ? "removedEverywhere" : "leftShare";
    }else{
      S.hidden.add(rec.share.id);
      await store.setKV("share:hidden", [...S.hidden]);
      message = "removedHere";
    }
  }
  await store.deleteTrip(id);
  await store.delKV("state:" + id);
  await versions.drop(id);
  S.records = S.records.filter(r => r.id !== id);
  if(S.rec && S.rec.id === id) await openRecord(S.records[S.records.length - 1] || null);
  if(!S.rec && location.hash) history.replaceState(null, "", location.pathname + location.search);
  render();
  toast(t(message));
}

/* ---------- rendering ---------- */

function renderStrip(r){
  drawMeButton(r);
  if(!trip()){ $strip.hidden = true; return; }
  $strip.hidden = false;
  const lang = getLang(), ti = todayIndex();
  // The trip is the title: a tap opens the list of trips (R12: a sign for what leads
  // elsewhere). Its dates under it.
  const tr = trip(), first = tr.days[0], last = tr.days[tr.days.length - 1];
  const title = document.getElementById("trip-title");
  title.innerHTML = `<span class="tt2"><b>${esc(tr.title)}</b>${first ? `<small>${esc(dateRange(tr, lang))}</small>` : ""}</span>${SELECTOR}`;
  title.setAttribute("aria-label", t("tripsOf", {s: tr.title}));
  if(r.name === "trips") title.setAttribute("aria-current", "page"); else title.removeAttribute("aria-current");
  // Search, on every page of a trip (S1).
  const sb = document.getElementById("search-btn");
  sb.hidden = false;
  if(!searching()){
    sb.innerHTML = SEARCH;
    sb.setAttribute("aria-label", t("search"));
    sb.title = t("search");
    sb.setAttribute("aria-expanded", "false");
  }
  // List | Map, on a day (M2), at the end of the row of days. Elsewhere it keeps its place,
  // unseen: the bar never changes its size from one page to another.
  const vt = document.getElementById("view-toggle"), onDay = r.name === "day";
  vt.classList.toggle("off", !onDay);
  if(onDay) vt.removeAttribute("aria-hidden"); else vt.setAttribute("aria-hidden", "true");
  vt.setAttribute("aria-label", t("dayView"));
  const away = onDay ? "" : ' tabindex="-1"';
  vt.innerHTML = `<button type="button" data-view-list aria-pressed="${!S.ui.mapOpen}" aria-label="${esc(t("viewList"))}"${away}>${LIST}</button><button type="button" data-map aria-pressed="${S.ui.mapOpen}" aria-label="${esc(t("viewMap"))}"${away}>${MAPICON}</button>`;
  $days.setAttribute("aria-label", t("tripDays"));
  $days.innerHTML = `<a class="dchip info" href="#info"${r.name === "info" ? ' aria-current="page"' : ""}><span class="w">${esc(t("info"))}</span><span class="n">${INFO}</span></a>` + tr.days.map((d, i) => {
    const dp = dateParts(d.date, lang), cur = r.name === "day" && r.i === i;
    return `<a class="dchip${i === ti ? " today" : ""}" href="#day-${i + 1}" style="--c:${cityVar(d.city)}"${cur ? ' aria-current="page"' : ""} aria-label="${esc(t("day"))} ${i + 1}, ${esc(dp.long)}${i === ti ? ", " + esc(t("today")) : ""}"><span class="w">${esc(i === ti ? t("today") : dp.dow)}</span><span class="n">${i + 1}</span></a>`;
  }).join("");
  const active = $days.querySelector('[aria-current="page"]');
  if(active) $days.scrollLeft = active.offsetLeft - ($days.clientWidth - active.offsetWidth) / 2;
  markStrip();
}

// The circle at the top right: who you are (your initial; a photo, one day), and the
// way to the account and the settings. On a page without the bar of days (welcome, You
// without a trip) it floats in the same place.
const PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 19.5c1.3-3.3 4-5 7.2-5s5.9 1.7 7.2 5"/></svg>';
function drawMeButton(r){
  const b = document.getElementById("me-btn");
  const u = hasService() && S.account;
  b.innerHTML = u ? `<span>${esc(u.handle.slice(0, 1).toUpperCase())}</span>` : PERSON;
  b.classList.toggle("signed", !!u);
  // On You, the circle is the way back (no Back link: the bar is there, or nothing else is).
  const here = r.name === "me";
  b.href = here ? "#" : "#me";
  b.setAttribute("aria-label", here ? t("back") : t("meTitle") + (u ? " · @" + u.handle : ""));
  b.title = here ? t("back") : t("meTitle");
  b.classList.toggle("on", here);
  // Without the bar it goes on the page itself, top right.
  const float = !trip();
  b.classList.toggle("float", float);
  if(float && b.parentElement !== document.body) document.body.appendChild(b);
  if(!float && b.parentElement === document.body) document.querySelector(".strip .tbar").appendChild(b);
}

// The bar of days: an edge once the page has scrolled under it, and a fade on each side
// of the list of days where there is more to scroll (css/app.css, .strip).
// Where the bar ends on the screen: under an iPhone's notch, the notch is above it.
const barBottom = () => $strip.getBoundingClientRect().bottom;

function markStrip(){
  $strip.classList.toggle("scrolled", scrollTop() > 4);
  // The map stays right under the bar (M2).
  document.documentElement.style.setProperty("--strip-h", $strip.offsetHeight + "px");
  const max = $days.scrollWidth - $days.clientWidth;
  $days.classList.toggle("more-l", $days.scrollLeft > 2);
  $days.classList.toggle("more-r", $days.scrollLeft < max - 2);
}
let stripFrame = 0;
const onScroll = () => { if(!stripFrame) stripFrame = requestAnimationFrame(() => { stripFrame = 0; markStrip(); }); };
(scroller || window).addEventListener("scroll", onScroll, {passive: true});
window.addEventListener("resize", onScroll, {passive: true});
$days.addEventListener("scroll", onScroll, {passive: true});

function errorBox(){
  const e = S.importError;
  if(!e) return "";
  const more = e.all && e.all.length > e.items.length ? `<li>${esc(t("moreProblems", {n: e.all.length - e.items.length}))}</li>` : "";
  return `<div class="errbox" role="alert"><b>${esc(e.title)}</b><ul>${e.items.map(x => `<li>${esc(x)}</li>`).join("")}${more}</ul>` +
    (e.all ? `<p class="aihelp">${esc(e.help || t("aiHelp"))}</p><div class="actions"><button type="button" class="btn small" data-act="copy-errors">${esc(t("copyForAi"))}</button></div>` : "") + `</div>`;
}

// How to have a trip written by an AI assistant: a short message to copy and fill in,
// then Paste a trip. On the first screen, and folded on the Trips page.
// The message points to llms.txt in the project's repository: chat assistants open
// github.com pages more readily than a small site (tools/check-llms.mjs keeps it up to
// date). For an assistant that opens no link at all, the second button copies the
// format itself (formatBrief), about forty lines.
const llmsUrl = () => REPO_URL ? `${REPO_URL}/blob/main/llms.txt` : new URL("llms.txt", document.baseURI).href;
// The request the traveller wrote in the app, as the last line; without one, the part in
// brackets to fill in, in the chat.
const tripLine = () => t("aiTripLine", {x: (S.drafts.new || "").trim() || t("aiTripPh")});
const aiMessage = () => t("aiPrompt", {url: llmsUrl()}) + "\n" + tripLine();
// The long part first, the line to fill in last: pasted in a chat, the cursor is already there.
const aiMessageFull = () => formatBrief() + "\n\n" + t("aiPromptFull") + "\n" + tripLine();

// The row that opens it (Trips, Welcome: TR5), and the sheet: a new trip, or a change to
// the one open. Two numbered actions, no paragraph of steps (R8); copying keeps the sheet
// open (the person goes to the chat and comes back); Paste closes it.
const assistantRow = () => `<nav class="me-list" aria-label="${esc(t("aiSheetTitle"))}"><button type="button" data-act="assistant">${esc(t("planWithAi"))}</button></nav>`;
function openAssistant(){
  const canEdit = !!S.rec && !S.rec.public;
  // Both panes are in the sheet, one over the other, the other one unseen: the sheet keeps
  // the taller's height and does not jump when one changes to the other.
  const pane = (edit, key) => `<div class="ai-pane${edit ? " off" : ""}" data-pane="${edit ? "edit" : "new"}"${edit ? " inert" : ""}>` +
    (edit ? requestBox("ai-edit", key, t("aiEditLabel"), t("aiEditHint")) : requestBox("ai-new", key, t("aiTripLabel"), t("aiTripHint"))) +
    `<div class="steps2"><button type="button" class="btn primary" data-act="${edit ? "copy-edit" : "copy-prompt"}" data-stay><i>1</i>${esc(t("aiCopy"))}</button>` +
    `<p class="foot">${esc(t("aiWhere"))}</p><button type="button" class="btn" data-act="paste-any"><i>2</i>${esc(t("aiPasteAnswer"))}</button></div>` +
    `<p class="foot">${edit ? "" : `${esc(t("aiNoLinks"))} <button type="button" class="tbtn" data-act="copy-prompt-full" data-stay>${esc(t("copyPromptFull"))}</button>`}</p></div>`;
  const dlg = openSheet({title: t("aiSheetTitle"), cls: "assistant", body: (canEdit ? `<div class="seg" role="group" aria-label="${esc(t("aiSheetTitle"))}">` +
      `<button type="button" data-ai-mode="new" aria-pressed="true">${esc(t("aiModeNew"))}</button>` +
      `<button type="button" data-ai-mode="edit" aria-pressed="false">${esc(t("aiModeEdit"))}</button></div>` : "") +
    `<div class="ai-panes">${pane(false, "new")}${canEdit ? pane(true, "edit:" + S.rec.id) : ""}</div>` +
    (hasService() ? `<p class="foot">${esc(t("aiLinkChat"))}</p>` : "")});
  dlg.addEventListener("input", e => {
    if(!e.target.matches("[data-draft]")) return;
    setDraft(e.target.dataset.draft, e.target.value);
    e.target.closest(".ask-box").querySelector("[data-act='clear-draft']").hidden = !e.target.value;
  });
  dlg.addEventListener("click", e => {
    const m = e.target.closest("[data-ai-mode]");
    if(m){
      for(const b of dlg.querySelectorAll("[data-ai-mode]")) b.setAttribute("aria-pressed", String(b === m));
      for(const x of dlg.querySelectorAll("[data-pane]")){ const off = x.dataset.pane !== m.dataset.aiMode; x.classList.toggle("off", off); x.inert = off; }
      return;
    }
    const act = e.target.closest("[data-act]");
    if(!act) return;
    if(!act.hasAttribute("data-stay")) dlg.close();
    runAct(act);
  });
}

// How to have the open trip changed by an AI assistant: the message carries how to
// write changes and an outline of the trip (js/changes.js), so it needs no link; the
// assistant answers with only the changes, which come back through Paste a trip as one
// new version. Few tokens either way.
// The version of the app, for an assistant that read the format guide (llms.txt) earlier
// in the chat: a newer one tells it to read the guide again. Only on a published copy.
const appVersion = () => (/^\d+\.\d+\.\d+/.exec(S.version) || [""])[0];
const versionLine = () => appVersion() ? "\n\n" + t("aiVersion", {v: appVersion(), url: llmsUrl()}) : "";
const aiEditMessage = () => changesBrief() + "\n\n" + outline(S.rec.trip, privOf()) + versionLine() + "\n\n" + t("aiEditPrompt") +
  "\n" + t("aiEditLine", {x: (S.drafts["edit:" + S.rec.id] || "").trim() || t("aiEditPh")});

// What the traveller writes for an assistant stays on the phone (a draft per new trip,
// one per trip to change), until they clear it.
let draftTimer = 0;
function setDraft(key, value){
  if(value) S.drafts[key] = value; else delete S.drafts[key];
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => store.setKV("drafts", S.drafts).catch(() => {}), 400);
}
// The box where the request is written: the hint shows while it is empty; Clear beside its
// label, only when there is something to clear.
const requestBox = (id, key, label, hint) => `<div class="field ask-box"><div class="lrow"><label for="${id}">${esc(label)}</label>` +
  `<button type="button" class="btn small" data-act="clear-draft" data-key="${esc(key)}" data-stay${S.drafts[key] ? "" : " hidden"}>${esc(t("clearDraft"))}</button></div>` +
  `<textarea id="${id}" rows="3" data-draft="${esc(key)}" placeholder="${esc(hint)}">${esc(S.drafts[key] || "")}</textarea></div>`;

// Copies a message for an assistant. Without a clipboard a short one is shown to copy
// by hand; a long one (a whole trip) cannot be, so the file is the way instead.
async function copyText(text, done){
  try{ await navigator.clipboard.writeText(text); toast(done); }
  catch(e){
    if(text.length > 4000){ toast(t("copyTooLong")); return; }
    await ask({title: t("copyByHand"), text: text.split("\n").filter(Boolean), actions: [{id: "ok", label: t("close")}]});
  }
}

// The problems of a refused file, worded for the assistant that wrote it.
function messageForAi(){
  const e = S.importError;
  return e.ai ? e.ai + versionLine() : t("aiFixPrompt") + versionLine() + "\n\n" + e.all.map(x => "- " + x).join("\n");
}

function copyErrors(){
  if(S.importError && S.importError.all) copyText(messageForAi(), t("copiedForAi"));
}

// A trip pasted as text, as a chat assistant gives it: no file to save on the phone.
// `any`: opened by the Paste button at the bottom, so it takes a place too (takeText
// decides what it is).
function pasteTrip(any = false){
  const d = openSheet({id: "paste-title", title: t(any ? "paste" : "pasteTrip"), form: true, body: `
    <p class="foot">${esc(t(any ? "pasteAnyHelp" : "pasteHelp"))}</p>
    <textarea id="paste-text" rows="8" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(any ? t("pasteAnyPh") : '{"format": "travel-in-my-pocket/2", …}')}"></textarea>
    <p class="errbox" data-error role="alert" hidden></p>
    <div class="sheet-actions">
      <button type="button" class="btn small" data-paste>${esc(t("paste"))}</button>
      <span class="grow"></span>
      <button type="button" class="btn" data-close>${esc(t("cancel"))}</button>
      <button type="submit" class="btn primary">${esc(t(any ? "pasteGo" : "pasteLoad"))}</button>
    </div>`});
  const area = d.querySelector("#paste-text");
  d.onclick = async e => {
    if(e.target.closest("[data-paste]")){
      try{ area.value = await navigator.clipboard.readText(); }
      catch(err){ area.focus(); }
    }
  };
  d.querySelector("form").onsubmit = async e => {
    e.preventDefault();
    if(!area.value.trim()){
      const box = d.querySelector("[data-error]");
      box.textContent = t("pasteEmpty");
      box.hidden = false;
      return;
    }
    d.close();
    try{ if(any) await takeText(area.value, "pasted.json"); else await importText(jsonIn(area.value), "pasted.json"); }
    catch(err){ S.importError = {title: t("importFailed"), items: [String(err && err.message || err)]}; render(); }
  };
  // From the Paste button the next tap is Paste in the sheet: no keyboard over it.
  if(!any) area.focus();
}

// Installed, or open in a browser tab; and which phone, only to say its steps first.
const installed = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const phoneOs = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios"
  : /Android/.test(navigator.userAgent) ? "android" : "";
// Adding TIMP to the Home Screen (WL5, YO3): this phone's steps; the other phone's folded.
function installSteps(){
  const os = phoneOs(), step = k => `<li>${rich(t(k))}</li>`;
  const mine = os === "ios" ? ["installIos"] : os === "android" ? ["installAndroid"] : ["installIos", "installAndroid"];
  const other = os === "ios" ? "installAndroid" : os === "android" ? "installIos" : "";
  return `<ol class="steps">${mine.map(step).join("")}${step("installOnce")}</ol>` +
    (other ? `<details class="others"><summary class="tbtn quiet">${esc(t("otherPhones"))}</summary><ol class="steps">${step(other)}</ol></details>` : "");
}

function langPicker(){
  const options = [["auto", t("langAuto")], ...Object.entries(LANGS)];
  return `<div class="seg" role="group" aria-label="${esc(t("language"))}">${options.map(([id, name]) =>
    `<button type="button" data-lang="${esc(id)}" aria-pressed="${S.langPref === id}">${esc(name)}</button>`).join("")}</div>`;
}

function themePicker(){
  const options = [["auto", t("themeAuto")], ["light", t("themeLight")], ["dark", t("themeDark")]];
  return `<div class="seg" role="group" aria-label="${esc(t("theme"))}">${options.map(([id, name]) =>
    `<button type="button" data-theme-choice="${id}" aria-pressed="${S.theme === id}">${esc(name)}</button>`).join("")}</div>`;
}

// The traveller's own currency: what costs are converted into.
function homePicker(){
  const lang = getLang();
  const common = ["EUR", "USD", "GBP", "CHF", "JPY"];
  const all = [...new Set([S.home, ...common, ...currencies()])];
  const opt = c => `<option value="${c}"${c === S.home ? " selected" : ""}>${esc(c + " · " + currencyName(c, lang))}</option>`;
  return `<div class="field">
    <select id="home-cur" aria-label="${esc(t("homeCurrency"))}">${all.map(opt).join("")}</select>
    <p class="foot">${esc(t("homeCurrencyHelp"))}</p></div>`;
}

// Welcome, for whoever comes first (WL1–WL5): your AI is your travel agent; the account in
// sight; the rest in a quiet row; the Home Screen's steps only when not installed.
function renderWelcome(){
  return `<section class="welcome">
    <div class="brand"><img src="icons/icon.svg" width="44" height="44" alt=""><div><b>TIMP</b><small>Travel in my pocket</small></div></div>
    <div class="say"><h1>${esc(t("welcomeHead"))}</h1><p>${esc(t("welcomeLine"))}</p></div>
    ${errorBox()}
    <button type="button" class="btn primary big" data-act="assistant">${esc(t("planWithAi"))}</button>
    ${S.account ? syncLine() : hasService() ? `<div class="two"><button type="button" class="btn" data-act="signup">${esc(t("signUp"))}</button><button type="button" class="btn" data-act="signin">${esc(t("signIn"))}</button></div>` : ""}
    <div class="already"><button type="button" class="tbtn" data-act="demo">${esc(t("seeExample"))}</button><span aria-hidden="true">·</span><button type="button" class="tbtn" data-act="pick">${esc(t("loadFile"))}</button><span aria-hidden="true">·</span><button type="button" class="tbtn" data-act="paste">${esc(t("pasteTripShort"))}</button></div>
    ${installed() ? "" : `<section class="install"><h2>${esc(t("installTitle"))}</h2>${installSteps()}</section>`}
    ${store.isPersistent() ? "" : `<p class="foot">${esc(t("storageWarn"))}</p>`}
  </section>`;
}

// The account with the sharing service, on You (and on the welcome screen, for a new
// phone, to sign in), only when this copy of the app has one (js/config.js). Without an
// account the app is exactly as before.
function accountSection(){
  if(!hasService()) return "";
  const u = S.account;
  if(!u) return `<section class="acct" aria-label="${esc(t("account"))}"><span class="av" aria-hidden="true">${PERSON}</span>` +
    `<span class="who"><b>${esc(t("account"))}</b><small>${esc(t("accountShort"))}</small></span>` +
    `<span class="acts"><button type="button" class="btn small" data-act="signin">${esc(t("signIn"))}</button><button type="button" class="btn small primary" data-act="signup">${esc(t("signUp"))}</button></span></section>`;
  const since = new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "long", year: "numeric"}).format(new Date(u.since));
  // Your AI first, with the chats linked; the passkeys counted (AI1): asked once, again
  // after their sheets close.
  const v = S.acctValues, val = x => x ? `<span class="val">${esc(x)}</span>` : "";
  if(v === undefined){
    S.acctValues = null;
    Promise.all([linkedApps(), passkeys()]).then(([apps, keys]) => { S.acctValues = {ai: apps.map(a => a.client), keys: keys.length}; if(route().name === "me") render(); }, () => {});
  }
  return `<section class="acct me" aria-label="${esc(t("account"))}"><span class="av" aria-hidden="true">${esc(u.handle.slice(0, 1).toUpperCase())}</span>` +
    `<span class="who"><b>@${esc(u.handle)}</b><small>${esc(t("accountSince", {d: since}))}</small></span></section>` +
    `<nav class="me-list" aria-label="${esc(t("account"))}">
      <button type="button" data-me="chats">${esc(t("chatsTitle"))}${val(v && v.ai.join(", "))}</button>
      <button type="button" data-me="devices">${esc(t("devicesTitle"))}${val(v && (v.keys === 1 ? t("passkeysOne") : t("passkeysMany", {n: v.keys})))}</button>
      <button type="button" data-me="export">${esc(t("exportData"))}</button>
      <button type="button" data-me="signout">${esc(t("signOut"))}</button>
      <button type="button" class="danger" data-me="delete">${esc(t("deleteAccount"))}</button>
    </nav>`;
}

// On Trips, signed in: whether the trips agree with the account, and Sync now.
function syncLine(){
  if(!hasService() || !S.account) return "";
  return `<section class="sync-line"><small data-sync="${esc(S.sync)}">${esc(t({busy: "syncBusy", ok: "syncOk", partial: "syncPartial", offline: "syncOffline", error: "syncError"}[S.sync] || "signedIn", {n: S.syncErrors.size}))}</small>` +
    `<span class="acts"><button type="button" class="btn small" data-act="sync"${S.sync === "busy" ? " disabled" : ""}>${esc(t("syncNow"))}</button>` +
    (S.hidden.size ? `<button type="button" class="btn small" data-act="unhide">${esc(t("hiddenBack", {n: S.hidden.size}))}</button>` : "") + `</span></section>`;
}

// You (YO1–YO4): the account, then this phone's settings as rows with their value (the
// open one kept across redraws), then the app, small.
const meRow = (k, label, value, body) => `<div class="srow"><button type="button" class="dhead${value ? " set" : ""}" data-me-row="${k}" aria-expanded="${S.meRow === k}" aria-controls="me-${k}"><span>${esc(label)}</span><span class="v">${esc(value || "")}</span></button>` +
  `<div class="dbody" id="me-${k}"${S.meRow === k ? "" : " hidden"}>${body}</div></div>`;
function renderMe(){
  const lang = S.langPref === "auto" ? `${t("langAuto")} · ${LANGS[getLang()]}` : LANGS[S.langPref];
  const theme = t({auto: "themeAuto", light: "themeLight", dark: "themeDark"}[S.theme] || "themeAuto");
  return `
  <h1>${esc(t("meTitle"))}</h1>
  ${errorBox()}
  ${accountSection()}
  <h2 class="part">${esc(t("settings"))}</h2>
  <div class="srows">
    ${meRow("lang", t("language"), lang, langPicker())}
    ${meRow("theme", t("theme"), theme, themePicker())}
    ${meRow("home", t("homeCurrency"), S.home, homePicker())}
    ${meRow("map", t("mapProvider"), S.useGoogle ? "Google Maps" : "OpenStreetMap", mapSettings())}
    ${installed() ? "" : meRow("install", t("installTitle"), "", installSteps())}
  </div>
  <section class="sec about"><p class="foot">TIMP · Travel in my pocket${S.version ? " · " + esc(t("version", {v: S.version})) : ""}${REPO_URL ? ` · <a href="${esc(REPO_URL)}" target="_blank" rel="noopener">GitHub ↗</a>` : ""}</p>
    <p class="foot">${esc(t("wxCredit"))}</p>
    ${hasService() ? `<p class="foot"><a href="${esc(legalUrl("privacy"))}" target="_blank" rel="noopener">${esc(t("legalPrivacy"))}</a> · <a href="${esc(legalUrl("terms"))}" target="_blank" rel="noopener">${esc(t("legalTerms"))}</a></p>` : ""}
    ${store.isPersistent() ? "" : `<p class="foot">${esc(t("storageWarn"))}</p>`}
  </section>`;
}

/* ---------- sync with the sharing service ---------- */

// Trips go to the service and come from it (js/sync.js): those of this phone, those of
// the same account made on another phone, those shared with this account. One sync at
// a time; one asked for meanwhile runs after it.
let syncing = null, syncAgain = false, syncTimer = 0;
const syncSoon = (ms = 1500) => { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, ms); };

async function keepSynced(next, from){
  // Marked here while it synced: joined with what came, and sent at the next sync.
  if(from && S.rec && S.rec.id === next.id && S.rec.priv !== from.priv){ next = {...next, priv: mergePrivate(from.priv, S.rec.priv, next.priv)}; syncSoon(); }
  // Ticked for the group meanwhile: kept to send (sending one twice changes nothing).
  const pend = S.rec && S.rec.id === next.id && S.rec.share && S.rec.share.groupPending;
  if(from && pend && pend !== (from.share && from.share.groupPending)){ next = {...next, share: {...next.share, groupPending: pend}}; syncSoon(); }
  await store.putTrip(next);
  S.records = S.records.map(r => r.id === next.id ? next : r);
  if(S.rec && S.rec.id === next.id){ S.rec = next; S.state = marksInto(S.state, next.priv); followNewIds(); }
}

// The open trip came with its stops' ids of their own (converted on another phone, or on
// the service): ticks and skips saved under the ids of before follow (js/ids.js).
function followNewIds(){
  const next = followIds(S.state, S.rec.trip);
  if(next !== S.state){ S.state = next; saveState(); }
}

function syncNow(){
  if(!hasService() || !S.account || !S.online) return Promise.resolve();
  if(syncing){ syncAgain = true; return syncing; }
  S.sync = "busy";
  syncing = (async () => {
    // What the screen shows of the trips: a new version, or ticks come from another phone or
    // the group (their marks), redraws it.
    const shownNow = () => canonical(S.records.map(r => [r.id, r.trip.version.id, r.share && r.share.head, r.priv && r.priv.marks || null, r.group || null]));
    const before = shownNow();
    try{
      const api = serviceApi(), remote = await api.list();
      for(const r of remote){
        if(S.hidden.has(r.id) || S.records.some(x => x.share && x.share.id === r.id)) continue;
        const trip = await api.version(r.id, r.head);
        const here = S.records.find(x => x.id === trip.id);
        // The same trip, on this phone already (from a file): linked, then joined below.
        if(here && !here.share){ await keepSynced({...here, share: {id: r.id, role: r.role}}); continue; }
        if(here) continue;   // another trip with the same id: it stays on the service
        await versions.put(trip);
        const rec = {id: trip.id, trip, importedAt: Date.now(), fileName: "", exported: trip.version.id, share: {id: r.id, role: r.role, head: r.head}};
        await store.putTrip(rec);
        S.records.push(rec);
      }
      // One trip that does not go (refused, or the service failing on it) does not stop
      // the others: it says why on its card, and is tried again at the next sync.
      const errors = new Map();
      for(const rec of [...S.records]){
        // Gone from the account, or someone else's published trip: never sent.
        if((rec.share && rec.share.gone) || rec.public) continue;
        const remoteOf = remote.find(r => rec.share && r.id === rec.share.id) || null;
        // Deleted from the account on another phone, or no longer shared with this
        // account: the copy here stays, on this phone only, and is not sent again.
        if(rec.share && rec.share.id && !remoteOf){ await keepSynced({...rec, share: {...rec.share, gone: true}}); continue; }
        try{
          let next = rec;
          if(remoteOf && remoteOf.locked){
            // Locked by its owner: the account's version, taken if newer; nothing sent.
            // Changes made here before the lock wait, said on the card, until it is unlocked.
            if(remoteOf.head !== rec.trip.version.id){
              const x = await inspect(versions, rec.trip, await api.version(remoteOf.id, remoteOf.head));
              if(x.kind === "newer") next = {...rec, trip: await apply(versions, x, "take"), share: {...rec.share, head: remoteOf.head}};
              else if(x.kind !== "same") errors.set(rec.id, t("lockedWaiting"));
            }
          }else next = await syncTrip(versions, rec, remoteOf, api);
          // The group first: its ticks become mine, which then go with the personal set.
          next = await syncGroup(next, remoteOf, api);
          next = await syncPrivate(next, api);
          if(remoteOf && !!remoteOf.locked !== !!(next.share && next.share.locked)) next = {...next, share: {...next.share, locked: !!remoteOf.locked}};
          // Shared with someone (theirs, or mine with people in it): the group's boxes (G1).
          const shared = !!remoteOf && (remoteOf.role !== "owner" || remoteOf.visibility !== "private");
          if(remoteOf && shared !== !!(next.share && next.share.shared)) next = {...next, share: {...next.share, shared}};
          // Its page, if its owner published it: said on the card, kept for the Share sheet.
          if(remoteOf && canonical(remoteOf.publication || null) !== canonical((next.share && next.share.publication) || null)) next = {...next, share: {...next.share, publication: remoteOf.publication || null}};
          if(next !== rec) await keepSynced(next, rec);
        }catch(e){
          if(!e || e.status === 0 || e.status === 401) throw e;   // offline, or signed out: all of it waits
          errors.set(rec.id, String(e.message || e).slice(0, 160));
        }
      }
      S.syncErrors = errors;
      // A new phone: nothing open yet, the trips just arrived: one is opened, so they show.
      if(!S.rec && S.records.length) await openRecord(S.records[S.records.length - 1]);
      S.sync = errors.size ? "partial" : "ok";
      if(!termsAsked){ termsAsked = true; checkTerms(); }
    }catch(e){
      S.sync = e && e.status === 0 ? "offline" : "error";
      if(e && e.status === 401){ S.account = null; }
    }finally{
      syncing = null;
      const after = shownNow();
      if(after !== before || route().name === "trips" || !document.querySelector(".stop, .tripcard")) renderKeepingFocus();
      if(syncAgain){ syncAgain = false; syncSoon(500); }
    }
  })();
  return syncing;
}

// The terms the account accepted, asked of the service once a session, at the first
// sync: changed, or never asked (an account made before them), the sheet to read and
// accept them. Not over another sheet: then next time.
let termsAsked = false;
async function checkTerms(){
  try{
    const user = await whoAmI();
    S.account = user;
    if(user.terms === TERMS || document.querySelector("dialog[open]")) return;
    openTerms({onAccept: async () => { S.account = await acceptTerms(); toast(t("termsThanks")); }});
  }catch(e){}
}

// What the account's buttons on You lead to.
async function accountActions(what){
  if(!S.account) return;
  const again = dlg => dlg && dlg.addEventListener("close", () => { S.acctValues = undefined; if(route().name === "me") render(); });
  if(what === "devices") again(await openDevices({toast, save: handOver, handle: S.account.handle}));
  else if(what === "chats") again(await openLinkedApps(toast));
  else if(what === "export") exportMyData();
  else if(what === "signout"){ await signOut(); S.account = null; S.sync = ""; termsAsked = false; render(); toast(t("signedOut")); }
  else if(what === "delete") removeAccount();
}

// A copy of everything the service keeps about the account, as a file to keep.
async function exportMyData(){
  try{
    const data = await exportAccount();
    const day = new Date().toISOString().slice(0, 10);
    const file = new File([JSON.stringify(data, null, 2)], `timp-account-${S.account.handle}-${day}.json`, {type: "application/json"});
    if(await handOver(file, t("exportData"))) toast(t("exportDone"));
  }catch(e){ toast(accountError(e)); }
}

// The account deleted for good: the handle written again, then a passkey of it used now.
// The trips on this phone stay, as this phone's only.
async function removeAccount(){
  const handle = S.account.handle;
  const sure = await ask({title: t("deleteAccountTitle"), text: t("deleteAccountText"), type: {label: t("deleteAccountLabel"), expected: handle},
    actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("deleteAccount"), kind: "danger", needsType: true}]});
  if(sure !== "yes") return;
  try{ if(!(await deleteAccount(handle))) return; }
  catch(e){ toast(accountError(e)); return; }
  for(const rec of S.records.filter(r => r.share)){ const {share, ...rest} = rec; await keepSynced(rest); }
  S.account = null; S.sync = ""; S.syncErrors = new Map(); S.hidden.clear();
  await store.delKV("share:hidden").catch(() => {});
  render();
  toast(t("accountDeleted"));
}

// A trip no longer on the account (deleted on another phone, no longer shared): on
// request it goes on the account again, as the owner's, at the next sync.
async function putBackOnAccount(id){
  const rec = S.records.find(r => r.id === id);
  if(!rec || !rec.share || !rec.share.gone) return;
  const {share, ...rest} = rec;
  await keepSynced(rest);
  render();
  await syncNow();
  toast(t(S.syncErrors.has(id) ? "syncPartial" : "putBack", {n: S.syncErrors.size}));
}

async function accountSignIn(){
  try{
    const user = await signIn();
    if(!user) return;
    S.account = user;
    render();
    toast(t("welcomeBack", {h: user.handle}));
    syncNow();
  }catch(e){ toast(accountError(e)); }
}

// Every passkey lost: a recovery code and a new passkey on this phone. Resolves when the
// form is closed, signed in or not.
function accountRecover(){
  return new Promise(done => openRecover({onClose: done,
    onDone: user => { S.account = user; render(); toast(t("recoveredDone", {h: user.handle})); syncNow(); }}));
}

/* ---------- a published trip, from its page ---------- */

const pageError = e => e && e.status === 410 ? t("publicGone") : e && e.status === 404 ? t("publicMissing") : accountError(e);

// "Open in TIMP" (#public=<page>): someone's published trip on this phone, read only, as
// its page shows it now (opened again, brought up to date). An id of its own, so it never
// meets a trip of this phone's; never sent to the account: it is theirs.
async function openPublic(page){
  history.replaceState(null, "", location.pathname + location.search);
  if(!hasService()) return;
  let pub;
  try{ pub = await publicTrip(page); }catch(e){ toast(pageError(e)); return; }
  const id = "pub-" + page, info = {page, by: pub.by, dates: pub.dates, updatedAt: pub.updatedAt};
  const {trip} = await prepare({...pub.trip, id});
  const local = S.records.find(r => r.id === id);
  let rec;
  if(local && canonical(contentOf(local.trip)) === canonical(contentOf(trip))) rec = {...local, public: info};
  else{
    await versions.put(trip);
    rec = {...(local || {}), id, trip, importedAt: Date.now(), fileName: "", exported: trip.version.id, public: info};
  }
  await keepRecord(rec);
  render();
  scrollToY(0);
  toast(t("publicOpened", {t: trip.title, h: pub.by}));
}

// "Use as a base" (#base=<page>, or from a published trip opened here): the traveller's
// own copy, from the first day they choose; a trip like any other of theirs.
async function useAsBase(page, known){
  history.replaceState(null, "", location.pathname + location.search);
  if(!hasService()) return;
  let pub = known;
  if(!pub){ try{ pub = await publicTrip(page); }catch(e){ toast(pageError(e)); return; } }
  const first = await chooseFirstDay({title: pub.trip.title, by: pub.by, hidden: pub.dates === "hidden", first: pub.dates === "real" && pub.trip.days[0] ? pub.trip.days[0].date : ""});
  if(!first) return;
  const copy = asBase(pub, {url: pageUrl(page), first});
  await importText(JSON.stringify(copy), "", {said: t("baseDone", {t: copy.title, h: pub.by})});
}

/* ---------- a trip shared with this person ---------- */

// Someone sent an invite: its link opens the app with #invite=<token>. Signed in (or
// once they sign in, or make an account), the trip joins theirs, shared with them.
async function takeInvite(token){
  history.replaceState(null, "", location.pathname + location.search);
  if(!hasService()) return;
  if(!S.account){
    const go = await ask({title: t("inviteTitle"), text: t("inviteSignIn"),
      actions: [{id: "no", label: t("cancel")}, {id: "up", label: t("signUp")}, {id: "in", label: t("signIn"), kind: "primary"}]});
    if(go === "in") await accountSignIn();
    else if(go === "up") await new Promise(done => openSignUp({onDone: user => { S.account = user; render(); done(); }, onSignIn: () => accountSignIn().then(done), onRecover: () => accountRecover().then(done)}));
    if(!S.account) return;
  }
  let summary;
  try{ summary = await acceptInvite(token); }
  catch(e){ toast(e && e.status === 404 ? t("inviteGone") : e && e.status === 410 ? t("inviteUsed") : accountError(e)); return; }
  await syncNow();
  const rec = S.records.find(r => r.share && r.share.id === summary.id);
  if(rec){ await openRecord(rec); location.hash = "#day-1"; }
  render();
  toast(t("inviteAccepted", {t: summary.title}));
}

/* ---------- chat apps ---------- */

// A chat app (Claude, ChatGPT…) asks to reach the trips: it sent the person here with
// #authorize=<id>. They answer signed in, after seeing who asks, what for, and where the
// answer goes; the page then goes back to the chat app. Closing the question is a no.
// Never inside another site's frame: it could cover the question with its own page.
async function answerChatApp(id){
  history.replaceState(null, "", location.pathname + location.search);
  if(!hasService() || window.top !== window) return;
  if(!S.account){
    const go = await ask({title: t("chatAsk"), text: t("chatSignIn"), actions: [{id: "no", label: t("cancel")}, {id: "in", label: t("signIn"), kind: "primary"}]});
    if(go !== "in") return;
    await accountSignIn();
    if(!S.account) return;
  }
  const failed = e => toast(e && e.status === 404 ? t("chatGone") : accountError(e));
  let req;
  try{ req = await chatRequest(id); }catch(e){ failed(e); return; }
  const can = req.scopes.map(s => ({"trips:read": t("chatRead"), "trips:write": t("chatWrite")})[s]).filter(Boolean);
  // The private expenses, if asked, only when ticked: left out unless the person says so.
  const privAsked = req.scopes.some(s => s.startsWith("private:"));
  const check = privAsked ? {label: t("chatPrivateToo"), checked: false} : undefined;
  let yes = await ask({title: t("chatTitle", {app: req.client}),
    text: [{title: t("chatCan", {app: req.client, h: S.account.handle}), items: can}, onThisComputer(req.redirectHost) ? t("chatLocal") : t("chatBack", {host: req.redirectHost})],
    check, actions: [{id: "no", label: t("chatDeny")}, {id: "yes", label: t("chatAllow"), kind: "primary"}]}) === "yes";
  const scopes = req.scopes.filter(s => !s.startsWith("private:") || (check && check.checked));
  if(!scopes.length) yes = false;
  // A yes needs a sign-in of the last minutes (a link outlives this session): the passkey
  // is asked again if not. A no, never.
  try{
    const to = yes ? await recently(() => answerChat(id, true, scopes)) : await answerChat(id, false, scopes);
    if(to) location.replace(to);
  }catch(e){ failed(e); }
}

// Where a trip is in time, seen from today where it happens: under way (which day),
// coming (in how many days), or over.
function tripWhen(tr){
  const first = tr.days[0] && tr.days[0].date, last = tr.days.length && tr.days[tr.days.length - 1].date;
  const today = todayIn(tr.timezone);
  if(!first || today > last) return {phase: "past", first, last};
  if(today < first) return {phase: "next", first, last, inDays: Math.round((Date.parse(first) - Date.parse(today)) / 864e5)};
  return {phase: "now", first, last, day: tr.days.findIndex(d => d.date === today) + 1};
}

// A trip's dates as a card says them: its range, or only its month for a trip of someone
// else's published without its dates (they are 2001 in the copy: never the real ones).
function datesOf(r, lang){
  if(r.public && r.public.dates === "hidden" && r.trip.days[0]){
    const m = new Intl.DateTimeFormat(lang, {month: "long", timeZone: "UTC"}).format(new Date(r.trip.days[0].date + "T12:00:00Z"));
    return m.charAt(0).toUpperCase() + m.slice(1);
  }
  return dateRange(r.trip, lang);
}

// A trip's dates as a short range: "14–17 May 2027".
function dateRange(tr, lang){
  const w = tripWhen(tr);
  if(!w.first) return "";
  const f = new Intl.DateTimeFormat(lang, {day: "numeric", month: "short", year: "numeric", timeZone: "UTC"});
  const a = new Date(w.first + "T00:00:00Z"), b = new Date(w.last + "T00:00:00Z");
  try{ return f.formatRange(a, b); }catch(e){ return f.format(a) + " – " + f.format(b); }
}

// A trip's card (TR1, TR2): a tap opens the trip; its state in signals, only what there
// is to know; ⋯ opens its sheet, where everything else is.
const sig = (level, svg, text, name) => `<span class="sig ${level}" data-${name}>${svg}<span>${esc(text)}</span></span>`;
const tripSigns = r => [
  S.syncErrors.has(r.id) && sig("err", SIG_ICON.warn, t("notSyncedBadge"), "sync-error"),
  needsSaving(r) && sig("warn", SIG_ICON.warn, t("unsavedBadge"), "unsaved"),
  r.share && !r.share.gone && r.share.role !== "owner" && sig("info", SIG_ICON.shared, t(r.share.role === "edit" ? "sharedEditBadge" : "sharedReadBadge"), "shared"),
  r.share && !r.share.gone && r.share.publication && sig("ok", SIG_ICON.link, t("withLink"), "published"),
  !r.public && isLocked(r) && sig("info", LOCK, t("locked"), "locked"),
  r.share && r.share.gone && sig("info", SIG_ICON.warn, t("goneBadge"), "gone")
].filter(Boolean).join("");

function tripCard(r, current, lang){
  // Someone else's published trip is not "in N days": it is theirs, read here.
  const w = !r.public && tripWhen(r.trip);
  const when = !w ? "" : w.phase === "now" ? t("phaseNow", {d: w.day, n: r.trip.days.length})
    : w.phase === "next" ? (w.inDays === 1 ? t("phaseTomorrow") : t("phaseNext", {n: w.inDays})) : current ? t("phasePast") : "";
  const signs = tripSigns(r);
  return `<div class="tripcard${current ? " current" : ""}">
    <button type="button" class="open" data-act="open" data-id="${esc(r.id)}">${when ? `<span class="when${w.phase === "now" ? "" : " later"}">${esc(when)}</span>` : ""}<b>${esc(r.trip.title)}</b>` +
      `<span class="d">${esc(datesOf(r, lang))} · ${esc(t("daysCount", {n: r.trip.days.length}))}${r.public ? ` · <span data-public-badge>${esc(t("publicBadge", {h: r.public.by}))}</span>` : ""}</span>` +
      (signs ? `<span class="sigline">${signs}</span>` : "") + `</button>
    <button type="button" class="iconbtn more" data-act="trip-menu" data-id="${esc(r.id)}" aria-label="${esc(t("tripMore", {t: r.trip.title}))}">${DOTS}</button></div>`;
}

// A trip's sheet (TR3): where it is and its version under the title; what can be done, a
// row each with its value; Delete apart, last (it asks).
function tripMenu(id){
  const r = S.records.find(x => x.id === id);
  if(!r) return;
  const lang = getLang(), sh = r.share, onAcc = sh && sh.id && !sh.gone, owner = !sh || sh.gone || sh.role === "owner";
  const where = r.public ? t("publicWhere", {h: r.public.by}) : sh ? t(sh.gone ? "goneFromAccount" : sh.role === "owner" ? "onAccount" : sh.role === "edit" ? "sharedEdit" : "sharedRead") : t("onThisPhone");
  const ver = t("versionLabel") + " " + shortId(r.trip.version.id) + (r.trip.version.date ? ", " + new Intl.DateTimeFormat(lang, {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"}).format(new Date(r.trip.version.date)) : "");
  const n = 1 + r.trip.version.history.length;
  const row = (act, label, value = "", cls = "") => `<button type="button"${cls ? ` class="${cls}"` : ""} data-act="${act}" data-id="${esc(r.id)}">${esc(label)}${value ? `<span class="val">${esc(value)}</span>` : ""}</button>`;
  const rows = [
    r.public && row("base-copy", t("useAsBase")),
    onAcc && sh.role === "owner" && S.account && row("share-trip", t("share")),
    row("history", t("history"), n === 1 ? t("versionsOne") : t("versionsN", {n})),
    row("save", t("saveFile")),
    !r.public && owner && row("lock", t(isLocked(r) ? "unlock" : "lock")),
    sh && sh.gone && S.account && row("reup", t("putOnAccount"))
  ].filter(Boolean).join("");
  const notes = [S.syncErrors.has(r.id) && t("notSynced", {why: S.syncErrors.get(r.id)}), needsSaving(r) && t("unsaved")].filter(Boolean);
  // With the group (G1): two boxes, on a trip shared with someone, signed in.
  const g = r.group || {where: false, ticks: false};
  const box = (k, label, help) => `<label class="found-row"><input type="checkbox" data-group-box="${k}"${g[k] ? " checked" : ""}><span><b>${esc(label)}</b><small>${esc(help)}</small></span></label>`;
  const group = onAcc && sh.shared && S.account ? `<section class="groupbox"><h3 class="sheet-h">${esc(t("groupTitle"))}</h3>${box("where", t("groupWhere"), t("groupWhereHelp"))}${box("ticks", t("groupTicks"), t("groupTicksHelp"))}</section>` : "";
  const dlg = openSheet({title: r.trip.title, cls: "tripmenu", body: `
    <p class="sub"><span class="where">${esc(where)}</span> · <span data-version="${esc(r.trip.version.id)}">${esc(ver)}</span></p>
    ${r.trip.basedOn ? `<p class="sub" data-based-on>${esc(t("basedOnLine", {t: r.trip.basedOn.title, h: r.trip.basedOn.by}))} <a href="${esc(r.trip.basedOn.url)}" target="_blank" rel="noopener">↗</a></p>` : ""}
    ${notes.map(x => `<p class="unsaved">${esc(x)}</p>`).join("")}
    <nav class="me-list" aria-label="${esc(r.trip.title)}">${rows}</nav>
    ${group}
    <nav class="me-list" aria-label="${esc(t("remove"))}">${row("remove", t("removeAsk"), "", "danger")}</nav>`});
  dlg.addEventListener("click", e => {
    const act = e.target.closest("[data-act]");
    if(act){ dlg.close(); runAct(act); }
  });
  dlg.addEventListener("change", e => { if(e.target.matches("[data-group-box]")) setGroupBox(r.id, e.target); });
}

// A box of "With the group" (G1): saved on the service at once; offline or refused, it
// goes back as it was. Joining the ticks makes mine so far the group's too (G3).
async function setGroupBox(id, input){
  const rec = S.records.find(r => r.id === id);
  if(!rec || !rec.share || !rec.share.id) return;
  const was = rec.group || {where: false, ticks: false}, want = {...was, [input.dataset.groupBox]: input.checked};
  input.disabled = true;
  try{
    const api = serviceApi(), sid = rec.share.id;
    let g = await api.putGroup(sid, want.where ? whereOf(rec.priv) : null, want.ticks);
    const m = (rec.priv && rec.priv.marks) || {}, all = k => Object.fromEntries(Object.keys(m[k] || {}).map(x => [x, true]));
    if(want.ticks && !was.ticks && (Object.keys(all("done")).length || Object.keys(all("skipped")).length)) g = await api.markGroup(sid, all("done"), all("skipped"));
    const now = S.records.find(r => r.id === id);
    await keepSynced(withGroup({...now, share: {...now.share, groupSent: g.where ? canonical(whereOf(now.priv)) : null}}, g));
    render();
  }catch(e){ input.checked = !input.checked; toast(e && e.status === 0 ? t("groupOffline") : accountError(e)); }
  finally{ input.disabled = false; }
}

// The Trips page: the active trip on top, in full; the others below, a line each,
// grouped (under way, coming, past by year) or in one list by name or by recent use,
// found by title or city when there are many. A line opens to the trip's details.
function renderTrips(){
  const lang = getLang();
  const active = S.rec ? S.records.find(r => r.id === S.rec.id) || null : null;
  const activeCard = !active ? "" : `<section class="active-trip" aria-label="${esc(t("activeTrip"))}">${tripCard(active, true, lang)}</section>`;
  const others = S.records.filter(r => r !== active);
  const q = (S.tripSearch || "").trim().toLowerCase();
  const found = !q ? others : others.filter(r => [r.trip.title, ...r.trip.days.map(d => d.city || "")].some(x => String(x).toLowerCase().includes(q)));
  const row = r => tripCard(r, false, lang);
  const sort = S.ui.tripSort || "date";
  let list;
  if(sort === "name") list = found.slice().sort((a, b) => a.trip.title.localeCompare(b.trip.title, lang)).map(row).join("");
  else if(sort === "recent") list = found.slice().sort((a, b) => b.importedAt - a.importedAt).map(row).join("");
  else{
    const by = {now: [], next: [], past: new Map()}, theirs = [];
    for(const r of found){
      if(r.public){ theirs.push(r); continue; }
      const x = tripWhen(r.trip);
      if(x.phase === "past"){ const y = (x.last || "").slice(0, 4); by.past.set(y, [...(by.past.get(y) || []), r]); }
      else by[x.phase].push(r);
    }
    const start = r => r.trip.days[0] ? r.trip.days[0].date : "", end = r => r.trip.days.length ? r.trip.days[r.trip.days.length - 1].date : "";
    const group = (title, rs) => rs.length ? `<h3 class="trip-group">${esc(title)}</h3>${rs.map(row).join("")}` : "";
    list = group(t("groupNow"), by.now.sort((a, b) => start(a).localeCompare(start(b))))
      + group(t("groupNext"), by.next.sort((a, b) => start(a).localeCompare(start(b))))
      + [...by.past.keys()].sort().reverse().map(y => group(t("groupPast", {y}), by.past.get(y).sort((a, b) => end(b).localeCompare(end(a))))).join("")
      + group(t("groupPublic"), theirs.sort((a, b) => b.importedAt - a.importedAt));
  }
  const tools = others.length < 2 ? "" : `<div class="trip-tools">
      ${others.length >= 6 ? `<input type="search" data-trips-search placeholder="${esc(t("searchTrips"))}" aria-label="${esc(t("searchTrips"))}" value="${esc(S.tripSearch || "")}">` : ""}
      <select data-trips-sort aria-label="${esc(t("sortBy"))}">${["date", "name", "recent"].map(k => `<option value="${k}"${k === sort ? " selected" : ""}>${esc(t("sort_" + k))}</option>`).join("")}</select>
    </div>`;
  const cards = activeCard + (others.length ? `<section class="sec my-trips"><div class="list-head"><h2>${esc(t("myTrips", {n: others.length}))}</h2></div>${tools}
    ${list || `<p class="foot">${esc(t("noTripsFound"))}</p>`}</section>` : "");
  return `
  <h1>${esc(t("yourTrips"))}</h1>
  ${errorBox()}
  ${syncLine()}
  ${cards}
  <section class="sec add-trip"><h2>${esc(t("addTrip"))}</h2>
    <div class="actions">
      <button type="button" class="btn primary" data-act="pick">${esc(t("loadFile"))}</button>
      <button type="button" class="btn" data-act="paste-any">${esc(t("paste"))}</button>
      ${S.records.some(r => r.fileName === "demo-trip.json") ? "" : `<button type="button" class="btn" data-act="demo">${esc(t("tryDemo"))}</button>`}
    </div>
    ${assistantRow()}
  </section>`;
}

// The map: Google (with a key: this device's or the trip's) or OpenStreetMap.
function mapSettings(){
  const key = googleKey();
  const status = !S.useGoogle ? "statusOsmChosen"
    : !key ? "statusNoKey"
    : googleRefusedKey(key) ? "statusRefused"
    : S.deviceKey ? "statusGoogleDevice" : "statusGoogleTrip";
  return `<div class="seg" role="group" aria-label="${esc(t("mapProvider"))}">
      <button type="button" data-provider="google" aria-pressed="${S.useGoogle}">Google Maps</button>
      <button type="button" data-provider="osm" aria-pressed="${!S.useGoogle}">OpenStreetMap</button>
    </div>
    <p class="foot" data-map-status="${status}"><b>${esc(t(status))}</b> ${esc(t("providerHelp"))}</p>
    <form class="field" data-form="key">
      <label for="gkey">${esc(t("googleKeyTitle"))}</label>
      <p class="foot">${esc(t("googleKeyHelp"))}${tripKey() ? " " + esc(t("googleKeyFromTrip")) : ""}</p>
      <input id="gkey" name="gkey" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" value="${esc(S.deviceKey)}" placeholder="AIza…">
      <div class="actions"><button type="submit" class="btn small">${esc(t("save"))}</button></div>
    </form>`;
}

// A line of the Info page that is only a phone number becomes a link to call it.
const PHONE = /^\+?\d[\d ().-]{1,18}\d$/;

// The places to sleep of the trip, from its days, each with the nights it covers. A
// stay given as plain text ("Night train") is not a place: it shows on its day only.
function staysOf(tr){
  const byName = new Map();
  tr.days.forEach(d => {
    if(!d.stay || typeof d.stay !== "object") return;
    const s = d.stay;
    const seen = byName.get(s.name);
    if(seen) seen.last = d.date;
    else byName.set(s.name, {...s, city: d.city, first: d.date, last: d.date});
  });
  return [...byName.values()];
}

function renderInfo(){
  const tr = trip(), lang = getLang();
  const nights = h => {
    const a = dateParts(h.first, lang).short, b = dateParts(h.last, lang).short;
    return a === b ? a : `${a} → ${b}`;
  };
  const stays = staysOf(tr).map(h =>
    `<div class="card" style="--c:${cityVar(h.city)}"><div class="t"><span class="dot"></span>${esc(h.name)}</div>` +
    `<div class="s">${esc([nights(h), h.address].filter(Boolean).join(" · "))}</div>` +
    (h.note ? `<div class="s">${rich(h.note)}</div>` : "") +
    `<div><a class="maplink" href="${esc(mapsUrl(h.address || h.name))}" target="_blank" rel="noopener">${esc(t("mapLink"))}</a></div></div>`
  ).join("");
  const line = text => PHONE.test(text) ? `<a class="num" href="tel:${esc(text.replace(/[^\d+]/g, ""))}">${esc(text)}</a>` : rich(text);
  const sections = (tr.info || []).map(sec =>
    `<section class="sec"><h2>${esc(sec.title)}</h2><div class="rows">` + sec.items.map(r =>
      `<div><span class="k">${esc(r.label)}</span><span class="v">${line(r.text)}</span></div>`
    ).join("") + `</div></section>`
  ).join("");
  return `
  <h1>${esc(tr.title)}</h1>
  ${stays ? `<section class="sec"><h2>${esc(t("whereYouSleep"))}</h2>${stays}</section>` : ""}
  ${sections}
  ${costsSection()}`;
}

/* ---------- what the trip cost ---------- */

// The currencies the totals can be shown in: the traveller's, the trip's, euro or dollar.
function costCurrencies(){
  return [...new Set([S.home, localCurrency(), S.home === "EUR" ? "USD" : "EUR"])].slice(0, 3);
}

// At the end of Info, folded: what the trip costs, as a summary or as a receipt.
function costsSection(){
  const tr = trip(), lang = getLang();
  const items = costItems(tr).filter(x => !x.skipped);
  const choices = costCurrencies();
  const to = choices.includes(S.ui.costCur) ? S.ui.costCur : S.home;
  const all = sumIn(items, to);
  const approx = all.estimate || all.missing.length ? "≈ " : "";
  // Closed, the total (CO1): "…" while rates are on their way, never a sum short of them.
  const head = !items.length || (all.missing.length && !S.online) ? "" : `<span class="tot">${esc(all.missing.length ? "…" : approx + money(all.value, to, {round: true}))}</span>`;
  let body = "";
  if(S.ui.costsOpen){
    const view = S.ui.costView === "receipt" ? "receipt" : "sum";
    const seg = (attr, list, cur, label) => `<div class="seg" role="group" aria-label="${esc(label)}">${list.map(([id, name]) => `<button type="button" ${attr}="${esc(id)}" aria-pressed="${id === cur}">${esc(name)}</button>`).join("")}</div>`;
    body = `<div class="costtools">${seg("data-cost-view", [["sum", t("costSummary")], ["receipt", t("costReceipt")]], view, t("costView"))}${seg("data-cost-cur", choices.map(c => [c, c]), to, t("fCurrency"))}</div>` +
      (!items.length ? `<p class="foot">${esc(t("costNone"))}</p>` : view === "sum" ? costSummary(items, to, all) : costReceipt(items, to, all)) +
      (items.length && view === "sum" ? "" : `<button type="button" class="btn small" data-expense-add>${esc(t("addExpense"))}</button>`) +
      (all.missing.length ? `<p class="foot warnline">${esc(t(S.online ? "costMissingOnline" : "costMissing", {a: all.missing.map(x => money(x.amount, x.currency)).join(" + ")}))}</p>` : "") +
      `<p class="foot">${esc(t("costNote"))}</p>`;
  }
  return `<details class="costs" data-costs${S.ui.costsOpen ? " open" : ""}><summary><span class="h">${esc(t("tripCost"))}</span>${head}<span class="chev">${CHEVRON}</span></summary><div class="costsbody">${body}</div></details>`;
}

// Approximate when any rate is an estimate.
const approxMoney = (r, to, o) => (r.estimate ? "≈ " : "") + money(r.value, to, o);

// The summary: the total, done and still to do, then day by day, by kind of place, the
// expenses outside the stops and the private ones (a tap changes one).
function costSummary(items, to, all){
  const tr = trip(), lang = getLang();
  const stops = items.filter(x => x.kind === "stop"), outside = items.filter(x => x.kind === "expense"), privs = items.filter(x => x.kind === "private");
  const done = sumIn(items.filter(x => x.done), to), todo = sumIn(items.filter(x => !x.done), to);
  const inStops = sumIn(stops, to), inOutside = sumIn(outside, to);
  // Day by day: the stops, and what was paid privately that day.
  const byDay = tr.days.map((d, i) => {
    const list = items.filter(x => (x.kind === "stop" || x.kind === "private") && x.day === i);
    if(!list.length) return null;
    const sum = sumIn(list, to), curs = [...new Set(list.map(x => x.currency))];
    const own = curs.length === 1 && curs[0] !== to ? money(list.reduce((a, x) => a + x.amount, 0), curs[0]) : "";
    return {d, i, sum, own};
  }).filter(x => x && x.sum.value > 0);
  const max = Math.max(1, ...byDay.map(x => x.sum.value));
  const days = byDay.map(x => `<a class="crow" href="#day-${x.i + 1}" style="--c:${cityVar(x.d.city)}"><span class="n">${x.i + 1}</span>` +
    `<span class="w"><b>${esc(x.d.city || dateParts(x.d.date, lang).long)}<small>${esc(dateParts(x.d.date, lang).short)}</small></b><span class="bar"><i style="width:${(x.sum.value / max * 100).toFixed(1)}%"></i></span></span>` +
    `<span class="a">${esc(approxMoney(x.sum, to, {round: true}))}${x.own ? `<small>${esc(x.own)}</small>` : ""}</span></a>`).join("");
  // By kind of place: a stop without one that is a journey counts as getting around.
  const kinds = new Map();
  for(const x of stops){
    const k = x.stop.type || (x.stop.travel ? "travel" : "");
    if(!kinds.has(k)) kinds.set(k, []);
    kinds.get(k).push(x);
  }
  const kindRows = [...kinds].map(([k, list]) => ({k, list, sum: sumIn(list, to)})).filter(x => x.sum.value > 0).sort((a, b) => b.sum.value - a.sum.value);
  const kindName = k => k === "travel" ? t("costTravel") : k && TYPES.includes(k) ? t("type_" + k) : t("type_none");
  const kindIcon = x => x.k === "travel" ? icon(x.list[0].stop.travel, 16) : x.k && TYPES.includes(x.k) ? icon(x.k, 16) : "";
  const kindsHTML = kindRows.map(x => `<div class="crow" style="--c:${x.k && TYPE_COLORS[x.k] ? TYPE_COLORS[x.k] : "var(--muted)"}"><span class="n ic">${kindIcon(x)}</span>` +
    `<span class="w"><b>${esc(kindName(x.k))}<small>${esc(x.list.length === 1 ? t("stopsOne") : t("stopsCount", {n: x.list.length}))}</small></b></span>` +
    `<span class="a">${esc(approxMoney(x.sum, to, {round: true}))}<small>${inStops.value ? Math.round(x.sum.value / inStops.value * 100) : 0}%</small></span></div>`).join("");
  // The expenses outside the stops, the trip's and mine in one list by date, a lock on
  // mine (CO3); a tap changes one; adding is the last row (R3).
  const expenseRows = [...outside, ...privs].sort((a, b) => (a.expense.date || "9999").localeCompare(b.expense.date || "9999")).map(x => {
    const mine = x.kind === "private", c = conv(x.amount, x.currency, to, x.date);
    const sub = [x.expense.date ? dateParts(x.expense.date, lang).short : "", x.currency !== to ? money(x.amount, x.currency) : "", mine ? t("kindPrivate") : ""].filter(Boolean).join(" · ");
    return `<button type="button" class="crow" ${mine ? "data-private-expense" : "data-expense"}="${esc(x.expense.id)}" style="--c:var(--muted)"><span class="n ic">${mine ? LOCK : esc(symbolOf(x.currency, lang))}</span>` +
      `<span class="w"><b>${esc(mine ? privateTitle(x.expense) : x.expense.title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>` +
      `<span class="a">${c ? esc(approxMoney(c, to, {round: true})) : esc(money(x.amount, x.currency))}</span></button>`;
  }).join("") + `<button type="button" class="crow add" data-expense-add>+ ${esc(t("addExpense"))}</button>`;
  const total = all.value || 1;
  // Under the total: in the stops and outside them; with private expenses, the trip's and those.
  const round = r => money(r.value, to, {round: true});
  const sub = privs.length ? [t("costTripPart", {a: round(sumIn([...stops, ...outside], to))}), t("costPrivatePart", {a: round(sumIn(privs, to))})]
    : [stops.length ? t("costInStops", {a: round(inStops)}) : "", outside.length ? t("costOutside", {a: round(inOutside)}) : ""];
  return `<div class="chero">
      <span class="lab">${esc(t("costTotal"))}</span>
      <span class="big">${esc((all.estimate || all.missing.length ? "≈ " : "") + money(all.value, to, {round: true}))}</span>
      <span class="sub">${esc(sub.filter(Boolean).join(" · "))}</span>
      <span class="split" aria-hidden="true"><i class="done" style="flex:${done.value}"></i><i class="todo" style="flex:${Math.max(todo.value, todo.value ? total * .03 : 0)}"></i></span>
      <span class="legend"><span><i class="done"></i>${esc(t("costDone"))} <b>${esc(approxMoney(done, to, {round: true}))}</b></span><span><i class="todo"></i>${esc(t("costTodo"))} <b>${esc(approxMoney(todo, to, {round: true}))}</b></span></span>
    </div>` +
    (days ? `<h3 class="ch">${esc(t("costByDay"))}</h3><div class="clist">${days}</div>` : "") +
    (kindsHTML ? `<h3 class="ch">${esc(t("costByKind"))}</h3><div class="clist">${kindsHTML}</div>` : "") +
    `<h3 class="ch">${esc(t("costExpensesTitle"))}</h3><div class="clist">${expenseRows}</div>`;
}

// The receipt: every cost in a column, day by day, with the rate of the day. Private
// expenses have a lock; those of a day outside the trip come last.
function costReceipt(items, to, all){
  const tr = trip(), lang = getLang();
  const line = (name, amount, cls = "", mark = "") => `<div class="ln${cls}"><span class="t">${mark}${esc(name)}</span><span class="f"></span><span>${esc(amount)}</span></div>`;
  const item = x => x.kind === "private" ? line(privateTitle(x.expense), money(x.amount, x.currency), "", LOCK)
    : line(x.stop.title, x.amount === 0 ? t("free") : money(x.amount, x.currency));
  let html = "";
  tr.days.forEach((d, i) => {
    const list = items.filter(x => (x.kind === "stop" || x.kind === "private") && x.day === i);
    if(!list.length) return;
    const p = dateParts(d.date, lang);
    html += `<div class="dy" style="--c:${cityVar(d.city)}"><b>${i + 1}</b> · ${esc(p.short)}${d.city ? " · " + esc(d.city) : ""}</div>`;
    html += list.map(item).join("");
    const curs = [...new Set(list.map(x => x.currency))];
    const sum = sumIn(list, to);
    if(curs.length === 1 && curs[0] !== to){
      const c = conv(1, to, curs[0], d.date);
      html += line(c ? `${c.estimate ? t("rateGuess") + " " : ""}1 ${symbolOf(to, lang)} = ${formatRate(c.value, lang)} ${symbolOf(curs[0], lang)}` : "", sum.missing.length ? "" : approxMoney(sum, to), " sub");
    }else if(curs.length > 1 || sum.missing.length) html += line("", approxMoney(sum, to), " sub");
  });
  const outside = items.filter(x => x.kind === "expense");
  if(outside.length){
    html += `<div class="dy">${esc(t("costOutsideTitle"))}</div>`;
    for(const x of outside){
      html += line(x.expense.title, money(x.amount, x.currency));
      if(x.currency !== to){ const c = conv(x.amount, x.currency, to, x.date); if(c) html += line("", approxMoney(c, to), " sub"); }
    }
  }
  const away = items.filter(x => x.kind === "private" && x.day < 0);
  if(away.length){
    html += `<div class="dy">${esc(t("costPrivateTitle"))}</div>`;
    for(const x of away){
      html += item(x);
      if(x.currency !== to){ const c = conv(x.amount, x.currency, to, x.date); if(c) html += line("", approxMoney(c, to), " sub"); }
    }
  }
  const todo = sumIn(items.filter(x => !x.done), to);
  const first = dateParts(tr.days[0].date, lang).short, last = dateParts(tr.days[tr.days.length - 1].date, lang).short;
  return `<div class="receipt"><div class="hd"><b>${esc(tr.title)}</b>${esc(first === last ? first : first + " – " + last)}</div>${html}` +
    `<div class="tot"><span>${esc(t("costTotal"))}</span><span>${esc((all.estimate || all.missing.length ? "≈ " : "") + money(all.value, to))}</span></div>` +
    (todo.value ? line(t("costTodoOf"), approxMoney(todo, to), " sub") : "") + `</div>`;
}

// Live when there is a connection, the sketch when not (M6): no choice to make.
function effectiveView(){
  return S.online ? "live" : "schema";
}

// The day as a map (M2–M7): a stage on top of the list, which scrolls under it. The lines
// always (M4); two controls, you and the whole day (M5); a row of zones on a day with
// more than one. Offline, the sketch, in scale.
function mapStage(zs, color, view, gone, paint){
  const zoneTitle = z => zs.length > 1 ? z.pts[0].name : t("stopsOfDay");
  const zoneLink = z => `<a class="maplink" href="${esc(z.pts.length < 2 ? mapsUrl(z.pts[0].q) : routeUrl(z))}" target="_blank" rel="noopener">${esc(z.pts.length < 2 ? t("mapLink") : t("openInMaps"))}</a>`;
  if(view === "live"){
    // Larger or smaller (the choice kept): the day is framed again, whole.
    const big = !!S.ui.mapBig;
    return `<section class="mapstage${big ? " big" : ""}" style="--c:${color}" aria-label="${esc(t("dayMap"))}"><div id="live-slot"></div>` +
      `<div class="mctl" role="group" aria-label="${esc(t("mapControls"))}"><button type="button" class="mbtn" data-locate aria-label="${esc(t("mapMe"))}" title="${esc(t("mapMe"))}">${LOCATE}</button><button type="button" class="mbtn" data-map-size aria-pressed="${big}" aria-label="${esc(t("mapLarger"))}" title="${esc(t(big ? "mapSmaller" : "mapLarger"))}">${big ? SHRINK : FRAME}</button></div>` +
      (zs.length > 1 ? `<div class="zchips">${zs.map((z, i) => `<button type="button" class="zchip" data-fit="${i}">${esc(zoneTitle(z))}</button>`).join("")}</div>` : "") + `</section>`;
  }
  let o = `<section class="mapstage sketch" style="--c:${color}" aria-label="${esc(t("dayMap"))}"><p class="off">${esc(t("offlineMap"))}</p>`;
  zs.forEach(z => {
    if(z.enter && z.enter.travel){
      o += `<p class="off move${gone(z.enter.idx) ? " gone" : ""}"><span class="tvchip">${icon(z.enter.travel, 16)}</span><span>${esc(t("travel_" + z.enter.travel))} · ${esc(z.enter.from.name)} → ${esc(zoneTitle(z))}</span></p>`;
    }
    if(z.pts.length < 2){
      o += `<p class="off"><span class="mb" style="--pf:${paint.pin(z.pts[0])}">${z.pts[0].nums.join("·")}</span><span>${esc(z.pts[0].name)} · ${esc(t("offSketch"))}</span>${zoneLink(z)}</p>`;
      return;
    }
    o += `<div class="zone"><div class="zhead"><span class="zname">${esc(zoneTitle(z))}</span>${zoneLink(z)}</div>${zoneSVG(z, zoneTitle(z), gone, true, paint)}</div>`;
  });
  return o + `</section>`;
}

// The map larger or smaller, without drawing it again: the stage grows, the map follows
// it and frames the whole day once it has its new size.
function resizeMap(b){
  S.ui.mapBig = !S.ui.mapBig;
  saveUi();
  const stage = b.closest(".mapstage");
  b.setAttribute("aria-pressed", String(S.ui.mapBig));
  b.title = t(S.ui.mapBig ? "mapSmaller" : "mapLarger");
  b.innerHTML = S.ui.mapBig ? SHRINK : FRAME;
  // At once, not animated: growing the stage every frame made the page lag.
  keepReading(() => stage.classList.toggle("big", S.ui.mapBig));
  if(live){ live.handle.refresh(); live.handle.fit(null); }
}

// The stop read first stays at its line while what is above the list changes: the map
// larger or smaller, List | Map (M10). Read first is the first stop not hidden under the
// map, or under the bar without it; measured before `change`, put back after it.
function keepReading(change){
  const line = () => { const st = $app.querySelector(".mapstage:not(.sketch)"); return st ? st.getBoundingClientRect().bottom : barBottom(); };
  const stops = () => [...$app.querySelectorAll(".stops > li")];
  const from = line(), i = scrollTop() > 0 ? stops().findIndex(li => li.getBoundingClientRect().bottom > from + 1) : -1;
  const gap = i >= 0 ? stops()[i].getBoundingClientRect().top - from : 0;
  change();
  const li = i >= 0 && stops()[i];
  if(li) scrollToY(Math.max(0, scrollTop() + li.getBoundingClientRect().top - line() - gap));
}

// A stop chosen on the map (M3): its card, just under the map, marked.
function pickStop(idx){
  const nb = $app.querySelector(`.stops .nb[data-pin="${idx}"]`);
  const card = nb && nb.closest(".stop, .group");
  if(!card) return;
  $app.querySelectorAll(".stops .picked").forEach(c => c.classList.remove("picked"));
  card.classList.add("picked");
  const stage = $app.querySelector(".mapstage:not(.sketch)");
  const top = (stage ? stage.getBoundingClientRect().bottom : barBottom()) + 8;
  scrollToY(Math.max(0, scrollTop() + card.getBoundingClientRect().top - top));
}

const stopKey = (day, planId, s, i) => `${day.date}|${planId || ""}|${s.id || "#" + i}`;

const isOpen = id => S.openStops.has(id) ? S.openStops.get(id) : S.ui.expandAll;

// An icon with its name for screen readers, for a value of TRAVEL or TYPES. Values the
// app does not know (a newer file) get none.
function chip(kind, value){
  const known = kind === "travel" ? TRAVEL : TYPES;
  if(!known.includes(value)) return "";
  const name = esc(t(kind + "_" + value));
  const hue = kind === "type" ? ` style="color:${TYPE_COLORS[value]}"` : "";
  return `<span class="${kind === "travel" ? "tvchip" : "tychip"}"${hue} role="img" aria-label="${name}" title="${name}">${icon(value, kind === "travel" ? 16 : 15)}</span>`;
}

// Where the traveller comes from to reach the stop at `k` of a day's list: the stop
// before it that has a place and is not skipped; for the first one, where the night
// before was spent (the day before's stay, when it is a place), or else the last place
// of the day before. "" when there is none: directions then start from the phone.
function comingFrom(dayIndex, list, k, skipped){
  for(let j = k - 1; j >= 0; j--){ if(skipped(j)) continue; const q = placeQuery(list[j]); if(q) return q; }
  const prev = trip().days[dayIndex - 1];
  if(!prev) return "";
  if(prev.stay && typeof prev.stay === "object") return prev.stay.address || prev.stay.name;
  const plan = planShown(prev);
  const before = programOf(mineIn(plan ? plan.stops : prev.stops));
  for(let j = before.length - 1; j >= 0; j--){
    const key = stopKey(prev, plan ? plan.id : null, before[j], j);
    if(!S.state.done[key] && S.state.skipped[key]) continue;
    const q = placeQuery(before[j]);
    if(q) return q;
  }
  return "";
}

/* ---------- money ---------- */

// The currency of a place, when the trip does not say: from where its stops are.
const REGION_CURRENCY = {jp: "JPY", kr: "KRW", na: "USD", eu: "EUR"};
function localCurrency(){
  const tr = trip();
  if(tr.currency) return tr.currency;
  const here = tr.days.flatMap(d => d.plans ? d.plans.flatMap(p => p.stops) : d.stops).find(s => s.lat !== undefined);
  return REGION_CURRENCY[regionOf(here || {}, tr.timezone)] || S.home;
}
// A stop's or an expense's currency.
const costCurrency = x => x.currency || localCurrency();
const tripToday = () => todayIn(trip().timezone) || new Date().toISOString().slice(0, 10);
const money = (amount, currency, o) => formatMoney(amount, currency, getLang(), o);
const shortDay = date => new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "short", timeZone: "UTC"}).format(new Date(date + "T12:00:00Z"));

// Rates are asked for a month at a time, only when a cost on screen needs them, and
// only once while the app is open (again after a failure, when back online).
const ratesAsked = new Set();
let ratesWanted = new Set(), ratesTimer = 0, ratesListener = null;
function conv(amount, from, to, date){
  const today = tripToday();
  const c = convert(amount, from, to, date, S.rates, today);
  if(!c) for(const m of monthsFor([date], today)) if(!ratesAsked.has(m)) ratesWanted.add(m);
  return c;
}
function askRates(){
  if(!ratesWanted.size || !S.online || ratesTimer) return;
  ratesTimer = setTimeout(async () => {
    const months = [...ratesWanted];
    ratesWanted = new Set();
    let got = false;
    for(const m of months){
      if(ratesAsked.has(m)) continue;
      ratesAsked.add(m);
      try{ Object.assign(S.rates, await fetchMonth(m)); got = true; }
      catch(e){ ratesFailed.add(m); }
    }
    ratesTimer = 0;
    if(got){ renderKeepingFocus(); if(ratesListener) ratesListener(); }
  }, 30);
}
const ratesFailed = new Set();
function retryRates(){ for(const m of ratesFailed) ratesAsked.delete(m); ratesFailed.clear(); }

// The rates kept on the phone for the trip's costs; the months not over yet are asked
// for again once, for today's rate.
async function loadRates(){
  S.rates = {};
  if(!trip()) return;
  const {rates, stale} = await keptRates(monthsFor(costItems(trip()).map(x => x.date), tripToday()));
  S.rates = rates;
  for(const m of stale) ratesWanted.add(m);
}

// The sum of some costs in a currency, converted on their days.
function sumIn(items, to){
  let value = 0, estimate = false;
  const missing = new Map();
  for(const x of items){
    const c = conv(x.amount, x.currency, to, x.date);
    if(c){ value += c.value; estimate = estimate || c.estimate; }
    else missing.set(x.currency, (missing.get(x.currency) || 0) + x.amount);
  }
  return {value, estimate, missing: [...missing].map(([currency, amount]) => ({amount, currency}))};
}

/**
 * Every cost of the trip: the stops of the plan chosen for each day, the expenses
 * outside the stops, then the private ones. done: a stop ticked, or an expense paid
 * by today (a private one paid at a stop: that stop ticked); skipped stops are marked,
 * and left out of every sum. day: the index of the day, -1 for a date outside the trip.
 */
function costItems(tr){
  const items = [], ticked = new Map();
  tr.days.forEach((d, i) => {
    const plan = planShown(d);
    // What the day goes through: the chosen option of each group (js/choices.js).
    programOf(mineIn(plan ? plan.stops : d.stops)).forEach((s, k) => {
      const key = stopKey(d, plan ? plan.id : null, s, k);
      const done = !!S.state.done[key];
      ticked.set(d.date + "|" + s.id, done);
      if(typeof s.cost !== "number") return;
      items.push({kind: "stop", day: i, date: d.date, stop: s, amount: s.cost, currency: costCurrency(s), done, skipped: !done && !!S.state.skipped[key]});
    });
  });
  const first = tr.days[0].date, today = tripToday();
  const dayOf = date => tr.days.findIndex(d => d.date === date);
  for(const x of tr.expenses || []){
    if(typeof x.cost !== "number") continue;
    const date = x.date || first;
    items.push({kind: "expense", expense: x, day: dayOf(date), date, amount: x.cost, currency: costCurrency(x), done: date <= today, skipped: false});
  }
  const priv = S.rec && S.rec.trip === tr ? privOf() : null;
  for(const x of priv ? priv.expenses : []){
    if(typeof x.cost !== "number") continue;
    const date = x.date || first, at = x.stop ? ticked.get(date + "|" + x.stop) : undefined;
    items.push({kind: "private", expense: x, day: dayOf(date), date, amount: x.cost, currency: costCurrency(x), done: at !== undefined ? at : date <= today, skipped: false});
  }
  return items;
}

// The name of a private expense: the stop's, while it is paid at one that exists.
function privateTitle(x){
  const d = x.stop && trip().days.find(d => d.date === x.date);
  const s = d && (d.plans ? d.plans.flatMap(p => p.stops) : d.stops).find(s => s.id === x.stop);
  return s ? s.title : x.title;
}

// What a form needs to write its costs and show what they make at home. The rates that
// arrive later update the fields of the last form opened.
function moneyOptions(){
  const fields = [];
  return {local: localCurrency(), home: S.home,
    convert: (amount, currency, date) => { const c = conv(amount, currency, S.home, date); askRates(); return c; },
    onRates: fn => { fields.push(fn); ratesListener = () => fields.forEach(f => f()); }};
}

// What the traveller paid privately at a stop, in one text: "¥1,500", "¥1,500 + €4".
const paidText = (paid, o) => paid.map(x => money(x.cost, costCurrency(x), o)).join(" + ");

// The cost in the margin of a stop: small, in the currency it is paid in. The trip's;
// without one, the private one.
const costShort = (s, paid) => typeof s.cost !== "number" ? paidText(paid.slice(0, 1), {compact: true})
  : s.cost === 0 ? t("free") : money(s.cost, costCurrency(s), {compact: true});

// The last line of an opened stop: its cost and what was paid there privately, and with
// one more tap what they make at home.
function costRow(s, id, date, paid){
  const lang = getLang(), has = typeof s.cost === "number";
  const parts = [...(has ? [{amount: s.cost, currency: costCurrency(s), date}] : []), ...paid.map(x => ({amount: x.cost, currency: costCurrency(x), date}))];
  const amount = has ? (s.cost === 0 ? t("free") : money(s.cost, costCurrency(s))) : paidText(paid);
  // Private only: a lock by the amount. Both: the private one on a line of its own.
  const mine = !paid.length ? "" : has ? `<span class="pv">${LOCK}${esc(paidText(paid) + " " + t("privateMark"))}</span>` : `<span class="pv in">${esc(t("privateMark"))}</span>`;
  const label = `<span class="l">${esc(t("cost"))}</span><span class="y">${has ? "" : LOCK}${esc(amount)}</span>${mine}`;
  const away = parts.filter(p => p.amount > 0 && p.currency !== S.home);
  if(!away.length) return `<div class="costrow"><span class="costbtn">${label}</span></div>`;
  const shown = S.openCosts.has(id);
  let rate = "";
  if(shown){
    const c = conv(away[0].amount, away[0].currency, S.home, date), sum = sumIn(parts, S.home);
    rate = c && !sum.missing.length
      ? `<p class="rate"><b>${sum.estimate ? "≈" : "="} ${esc(money(sum.value, S.home))}</b><span>${esc(t(c.estimate ? "rateEstimateFull" : "rateOfFull", {d: shortDay(c.on), r: `1 ${symbolOf(S.home, lang)} = ${formatRate(c.rate, lang)} ${symbolOf(away[0].currency, lang)}`}))}</span></p>`
      : `<p class="rate">${esc(t(S.online ? "rateLoading" : "rateOffline", {c: S.home}))}</p>`;
  }
  return `<div class="costrow"><button type="button" class="costbtn" data-cost-rate="${esc(id)}" aria-expanded="${shown}" aria-label="${esc(t("costIn", {c: S.home}))}">${label}<span class="to">${esc(symbolOf(S.home, lang))}<span class="chev">${CHEVRON}</span></span></button>${rate}</div>`;
}

// The day's total, by its progress: in the currency of its costs, and what it makes at home.
function dayTotal(items){
  const paid = items.filter(x => !x.skipped);
  const sum = paid.reduce((a, x) => a + x.amount, 0);
  if(!paid.length || !sum) return "";
  const curs = [...new Set(paid.map(x => x.currency))];
  const home = sumIn(paid, S.home);
  const homeText = home.missing.length ? "" : (home.estimate ? "≈ " : "") + money(home.value, S.home, {round: true});
  if(curs.length === 1){
    const own = money(sum, curs[0], {compact: true});
    return ` · <span class="daycost"><b>${esc(own)}</b>${curs[0] !== S.home && homeText ? " · " + esc(homeText) : ""}</span>`;
  }
  return homeText ? ` · <span class="daycost"><b>${esc(homeText)}</b></span>` : "";
}



// The plan a day is shown with: the one looked at on this phone, else the trip's chosen one.
const planShown = d => d.plans ? (d.plans.find(p => p.id === S.state.plans[d.date]) || chosenPlan(d)) : null;
// A list of the day as I see it: with the options I chose only for me (js/choices.js).
const mineIn = stops => withMine(stops, new Set(Object.keys(S.state.chosen || {})));

// Whether the open trip can be changed here: not locked, not someone else's page, not
// shared with this account to read only.
const canChange = () => !isLocked(S.rec) && !(S.rec.share && !S.rec.share.gone && S.rec.share.role === "read");

// The day's stops (design/README.md: R1, R2, R12–R15, W5, M1). `list`: what the day goes
// through (programOf in js/choices.js), which the numbers, the route and the map follow;
// `all`: every stop of the list, the options of each group too; `now`: where the day is,
// when it is today (nowOf). A group is drawn once, where its first option is: with a
// choice, the chosen option and "+N" for the others; opened, or with no choice yet, its
// options as a choice to make.
function stopsHTML(day, planId, list, parts, paint, all = list, now = {today: false, next: -1}){
  const dayIndex = trip().days.indexOf(day);
  const skippedAt = j => { const k = stopKey(day, planId, list[j], j); return !S.state.done[k] && !!S.state.skipped[k]; };
  const change = canChange();
  // i: its place in `list` (-1 for an option the day does not go to); opt.slot: the
  // place it would take, for Directions.
  const stopEl = (s, i, opt = {}, tag = "li") => {
    const id = stopKey(day, planId, s, i);
    const isDone = !!S.state.done[id], isSkipped = !isDone && !!S.state.skipped[id];
    const isNext = i >= 0 && i === now.next;
    // The next stop of today is open, unless the traveller closed it (R14).
    const open = S.openStops.has(id) ? S.openStops.get(id) : (S.ui.expandAll || isNext);
    const compact = now.today && isDone && !open;
    const past = now.today && i >= 0 && (now.next < 0 || i < now.next);
    const q = placeQuery(s);
    const paid = atStop(privOf(), day.date, s.id);
    const hasCost = typeof s.cost === "number" || paid.length > 0;
    const mid = "more-" + (++uid);
    // The rail: the stop's number, the same sign as on the map (M1); a crossed sign for a
    // stop without a position, which finds it (P1).
    const kind = TYPES.includes(s.type) ? t("type_" + s.type) : "";
    const rail = s.lat !== undefined && i >= 0
      ? `<span class="nb" data-pin="${i}" style="--pf:${paint.stop(s.type, i)}" role="img" aria-label="${esc(t("stopNumber", {n: i + 1}) + (kind ? ", " + kind : ""))}">${i + 1}</span>`
      : s.lat === undefined && change && s.id ? `<button type="button" class="nopos-sign" data-find-pos="${esc(s.id)}" aria-label="${esc(t("noPosFind", {s: s.title}) + (kind ? ", " + kind : ""))}" title="${esc(t("noPosTag"))}">${NO_POS}</button>`
      : s.lat === undefined ? `<span class="nopos-sign" role="img" aria-label="${esc(t("noPosTag") + (kind ? ", " + kind : ""))}">${NO_POS}</span>` : `<span class="nb blank" aria-hidden="true"></span>`;
    // Above the name: when, after dark, how you get there, what it costs (R13).
    const night = parts && i >= 0 && parts[i] === "night" && !["sunset", "evening", "night"].includes(partOf(s.time)) ? `<span class="nightmark" role="img" aria-label="${esc(t("afterDark"))}" title="${esc(t("afterDark"))}">${icon("moon", 13)}</span>` : "";
    const when = s.time || night || s.travel || (hasCost && !compact)
      ? `<p class="when">${s.time ? timeHTML(s.time) : ""}${night}${chip("travel", s.travel)}${hasCost && !compact ? `<span class="cost">${esc(costShort(s, paid))}</span>` : ""}</p>` : "";
    const name = `<h2 class="tt"><button type="button" class="tap" data-open="${esc(id)}" aria-expanded="${open}" aria-controls="${mid}">${esc(s.title)}</button></h2>`;
    const lang = s.local ? localLang(s.local, regionOf(s, trip().timezone)) : "";
    const local = s.local && !compact ? `<p class="local"${lang ? ` lang="${lang}"` : ""}>${esc(s.local)}</p>` : "";
    const sigs = compact ? [] : signalsOf(s, day, isDone || isSkipped);
    // Closed: the first signal, and how many more (W5); the description in one line.
    const closedPart = open || compact ? "" :
      (s.text ? `<p class="desc clamp">${rich(s.text)}</p>` : "") +
      (sigs.length ? `<p class="sigline">${sigHTML(sigs[0])}${sigs.length > 1 ? `<span class="plus" role="img" aria-label="${esc(t("sigMore", {n: sigs.length - 1}))}">+${sigs.length - 1}</span>` : ""}</p>` : "");
    // Opened: every signal first, the description, the cost; then two zones, never mixed
    // (R2): going there, out of the app (↗), and changing it, quieter.
    let more = "";
    if(open){
      const review = reviewSite(s, {city: day.city, timezone: trip().timezone, lang: getLang()});
      const go = [
        q || s.link ? `<a class="maplink" href="${esc(s.link || mapsUrl(q))}" target="_blank" rel="noopener">${esc(t("mapLink"))}</a>` : "",
        q ? `<a class="maplink" href="${esc(dirUrl(q, comingFrom(dayIndex, list, i >= 0 ? i : opt.slot, skippedAt)))}" target="_blank" rel="noopener">${esc(t("routeLink"))}</a>` : "",
        review ? `<a class="maplink" href="${esc(review.url)}" target="_blank" rel="noopener" aria-label="${esc(t("reviewsOn", {s: review.site}))}">${esc(review.site)} ↗</a>` : ""
      ].filter(Boolean);
      const changes = [
        s.id ? `<button type="button" data-edit="${esc(s.id)}">${EDIT}${esc(t("editStop"))}</button>` : "",
        isDone ? "" : `<button type="button" data-skip="${esc(id)}" aria-pressed="${isSkipped}">${SKIP}${esc(t(isSkipped ? "unskip" : "skip"))}</button>`,
        s.id && change && !opt.group ? `<button type="button" data-alt-add="${esc(s.id)}">${esc(t("altAdd"))}</button>` : ""
      ].filter(Boolean);
      more = `<div class="xpand" id="${mid}">` +
        (sigs.length ? `<div class="sigs">${sigs.map(x => `<p class="sigrow ${x.level}">${SIG_ICON[x.kind]}<span>${esc(x.text)}</span>${x.act || ""}</p>`).join("")}</div>` : "") +
        (s.text ? `<p class="desc">${rich(s.text)}</p>` : "") +
        (hasCost ? costRow(s, id, day.date, paid) : "") +
        (go.length ? `<div class="go" role="group" aria-label="${esc(t("goZone"))}">${go.join("")}</div>` : "") +
        (changes.length ? `<div class="chg" role="group" aria-label="${esc(t("changeZone"))}">${changes.join("")}</div>` : "") +
        `</div>`;
    }
    // Ticked for everyone by someone else: who, quietly (G3).
    const gm = S.rec.group && S.rec.group.marks, gby = gm && (isDone ? gm.done[id] : isSkipped ? gm.skipped[id] : null);
    const by = gby && gby.by && (!S.account || gby.by !== S.account.handle) ? gby.by : "";
    const tick = `<button class="tick" type="button" data-tick="${esc(id)}" aria-pressed="${isDone}" aria-label="${esc(t(isDone ? "markUndone" : "markDone"))}: ${esc(s.title)}${by ? esc(t("tickBy", {h: by})) : ""}">${isSkipped ? DASH : CHECK}</button>`;
    const cls = ["stop", isDone && "done", isSkipped && "skipped", open && "open", isNext && "next", compact && "compact", past && "past", hasCost && "has-cost", opt.group && "in-group"].filter(Boolean).join(" ");
    return `<${tag} class="${cls}"><div class="rail">${rail}</div><div class="body">${when}${name}${by ? `<p class="by">${esc(by)}</p>` : ""}${local}${closedPart}${more}</div>${tick}</${tag}>`;
  };
  // The mark of now, on the line, before the next stop (R14).
  const nowMark = () => {
    const s = list[now.next], m = minutesOf(s.time, dayLight), hh = hhmm(now.min);
    const text = m !== null && m >= now.min ? t("nowNext", {t: hh, s: s.title, m: m - now.min}) : t("nowNextNoTime", {t: hh, s: s.title});
    return `<li class="now"><span class="nrail" aria-hidden="true"><i></i></span><span class="nt">${esc(text)}</span></li>`;
  };
  const groups = groupsIn(all), drawn = new Set();
  let html = "";
  for(const s of all){
    const g = groupOf(s);
    if(!groups.has(g)){
      const i = list.indexOf(s);
      if(i < 0) continue;
      if(i === now.next) html += nowMark();
      html += stopEl(s, i);
      continue;
    }
    if(drawn.has(g)) continue;
    drawn.add(g);
    const options = groups.get(g), chosen = chosenIn(options), others = options.filter(o => o !== chosen);
    // Chosen only for me (P3): marked, the group's named.
    const theirs = options.find(o => o.theirs);
    // Who goes where, of those who show it (G2, G7).
    const goers = goersIn(options, theirs || (chosen && !chosen.mine ? chosen : null)), at_ = o => goers.get(o) || [];
    const mark = o => o.mine ? youMark(at_(o)) : o.theirs ? `<span class="gtag">${esc(t("altTheirs"))}</span>` : "";
    const elsewhere = chosen && !chosen.mine ? options.filter(o => o !== chosen).flatMap(at_) : [];
    const key = `${day.date}|${planId || ""}|${g}`, opened = S.openGroups.has(key);
    // Where the group sits in the day: the chosen option's place, or the next stop's.
    const at = all.indexOf(s), nx = list.findIndex(x => all.indexOf(x) > at), slot = chosen ? list.indexOf(chosen) : nx < 0 ? list.length : nx;
    const gid = "grp-" + (++uid);
    // Its options, a choice to make: one tap chooses (R1), asking first on a shared trip (A9).
    const options_ = `<div class="opts" id="${gid}" role="radiogroup" aria-label="${esc(g)}">` + options.map(o => {
      const line = [typeof o.cost === "number" ? costShort(o, []) : "", o.local || "", at_(o).join(", ")].filter(Boolean).join(" · ");
      return `<button type="button" class="opt" role="radio" aria-checked="${o === chosen}" data-choose="${esc(o.id)}"><span class="rd" aria-hidden="true"></span><span class="ot"><b>${esc(o.title)}${mark(o)}${o.mine ? "" : whoCircles(at_(o))}</b>${line ? `<small>${esc(line)}</small>` : ""}</span>${o.time ? `<span class="otm">${esc(timeText(o.time))}</span>` : ""}</button>`;
    }).join("") + `</div>` + (change ? `<button type="button" class="addopt" data-alt-add="${esc(options[0].id)}">${esc(t("altAdd"))}</button>` : "");
    if(chosen && slot === now.next) html += nowMark();
    if(!chosen){
      // No choice yet: dashed, like everything not there yet (R15); the route and the
      // costs leave it out until one is chosen.
      html += `<li class="group pending"><div class="ghead"><div class="rail"><span class="nb q" role="img" aria-label="${esc(t("altPendingSig"))}"></span></div><div class="body">` +
        `${options[0].time ? `<p class="when">${timeHTML(options[0].time)}</p>` : ""}<h2 class="tt"><span class="gname">${esc(g)}</span></h2>` +
        `<p class="where">${esc(t("altOptions", {n: options.length}))}${groupRange(options)}</p><p class="sigline">${sigHTML({level: "warn", kind: "choice", text: t("altPendingSig")})}</p></div></div>${options_}</li>`;
    }else if(opened){
      html += `<li class="group open"><p class="gh"><b>${esc(g)}</b><span>${esc(t("altChooseOne"))}</span><button type="button" class="gclose" data-group="${esc(key)}" aria-expanded="true" aria-controls="${gid}">${esc(t("close"))}</button></p>${options_}</li>`;
    }else{
      html += `<li class="group${slot === now.next ? " next" : ""}"><p class="gh"><b>${esc(g)}</b>${mark(chosen)}</p>${stopEl(chosen, slot, {group: g, chosen: true}, "div")}` +
        (chosen.mine ? `<p class="theirs">${esc(t("altTheirsLine", {s: theirs ? optionLabel(theirs) : t("altPendingSig")}))}${theirs && at_(theirs).length ? " · " + esc(namesShort(at_(theirs))) : ""}</p>` : "") +
        (elsewhere.length ? `<p class="theirs">${esc(t("groupElsewhere", {who: namesShort(elsewhere)}))}</p>` : "") +
        `<button type="button" class="alts-line" data-group="${esc(key)}" aria-expanded="false" aria-label="${esc(t("altOthers", {s: others.map(o => o.title).join(", ")}))}"><span class="plus" aria-hidden="true">+${others.length}</span><span class="names" aria-hidden="true">${esc(others.map(o => o.title).join(" · "))}</span></button></li>`;
    }
  }
  return `<ol class="stops${now.today ? " today" : ""}" style="--c:${cityVar(day.city)}">${html}</ol>`;
}

// What a stop has to say, the most important first (W5): closed that day, booking
// needed, the weather outdoors (WX2), booking advised, the trip's own label (W4), booked. Nothing once it is done or
// skipped (W3).
function signalsOf(s, day, ended){
  if(ended) return [];
  const out = [];
  const closed = closedOn(s, day.date);
  if(closed) out.push({level: "warn", kind: "closed", text: closed.date ? t("closedDate") : t("closedWeekday", {d: weekdayName(closed.weekday, getLang())}),
    act: s.id && canChange() ? `<button type="button" class="sigact" data-edit="${esc(s.id)}">${esc(t("sigMove"))}</button>` : ""});
  if(s.booking === "required") out.push({level: "warn", kind: "ticket", text: t("bookingRequired")});
  const w = dayWx && dayWx.date === day.date && stopWeather(dayWx.hours, day.date, s, dayLight);
  if(w) out.push({level: w.kind === "heat" || w.kind === "cold" ? "info" : "warn", kind: "weather", text: t("wx_" + w.kind + "At", {t: hhmm(w.at)})});
  if(s.booking === "advised") out.push({level: "info", kind: "ticket", text: t("bookingAdvised")});
  if(s.tag) out.push({level: "info", kind: "note", text: s.tag});
  if(s.booking === "booked") out.push({level: "ok", kind: "ticket", text: t("booked")});
  return out;
}
const sigHTML = x => `<span class="sig ${x.level}">${SIG_ICON[x.kind]}<span>${esc(x.text)}</span></span>`;

// What a group of options may cost, when every option says it in the same currency.
function groupRange(options){
  const priced = options.every(o => typeof o.cost === "number") && new Set(options.map(costCurrency)).size === 1;
  if(!priced) return "";
  const by = [...options].sort((a, b) => a.cost - b.cost);
  return " · " + (by[0].cost === by.at(-1).cost ? costShort(by[0], []) : `${costShort(by[0], [])}–${costShort(by.at(-1), [])}`);
}

// Where today is (R14): the next stop to do (the first not done nor skipped from now,
// by the clock; or after the last done), and the time now, on the trip's clock. Stops
// left behind stay as they are (V6).
function nowOf(day, planId, list){
  const today = trip().days.indexOf(day) === todayIndex();
  if(!today) return {today: false, next: -1, min: null};
  const min = clockOf(new Date(), trip().timezone);
  const ended = j => { const k = stopKey(day, planId, list[j], j); return !!(S.state.done[k] || S.state.skipped[k]); };
  let last = -1;
  list.forEach((s, j) => { if(ended(j)) last = j; });
  const byClock = list.findIndex((s, j) => !ended(j) && j > last && (minutesOf(s.time, dayLight) ?? -1) >= min - 30);
  const next = byClock >= 0 ? byClock : list.findIndex((s, j) => j > last && !ended(j));
  return {today: true, next, min};
}
const hhmm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

// Welcome's headline on one line in every language (WL1): smaller when it is longer.
function fitHeadline(){
  const h = document.querySelector(".welcome .say h1");
  if(!h) return;
  h.style.fontSize = "";
  // Text does not shrink in proportion everywhere (Safari): measured again until it fits.
  for(let i = 0; i < 4 && h.scrollWidth > h.clientWidth; i++)
    h.style.fontSize = Math.floor(parseFloat(getComputedStyle(h).fontSize) * h.clientWidth / h.scrollWidth * 0.98 * 10) / 10 + "px";
}

// The day's line ends at the last stop's sign (R15): a group last in the day ends it at
// its last option's circle, or at its chosen stop's number, measured once drawn.
function markTail(){
  for(const g of document.querySelectorAll(".stops > .group:last-child")){
    const signs = g.querySelectorAll(".ghead .nb, .stop .nb, .stop .nopos-sign, .opt .rd");
    const last = signs[signs.length - 1];
    if(!last) continue;
    const box = g.getBoundingClientRect(), r = last.getBoundingClientRect();
    g.style.setProperty("--tail", Math.max(0, Math.round(box.bottom - (r.top + r.height / 2))) + "px");
  }
}

// Returns the page and, when the interactive map is showing, what it must display.
function renderDay(i){
  const tr = trip(), d = tr.days[i], lang = getLang();
  const color = cityVar(d.city);
  const prev = tr.days[i - 1], next = tr.days[i + 1];
  const plan = planShown(d);
  // Every stop of the list (options too), and what the day goes through (js/choices.js).
  const all = mineIn(plan ? plan.stops : d.stops), list = programOf(all);
  const pid = plan ? plan.id : null;
  const keys = list.map((s, k) => stopKey(d, pid, s, k));
  const doneCount = keys.filter(k => S.state.done[k]).length;
  const skipCount = keys.filter(k => !S.state.done[k] && S.state.skipped[k]).length;
  // For the map: is the stop at this position in the list done or skipped?
  const gone = k => !!(S.state.done[keys[k]] || S.state.skipped[keys[k]]);
  const isSkipped = k => !S.state.done[keys[k]] && !!S.state.skipped[keys[k]];
  const anyText = list.some(s => s.text || typeof s.cost === "number" || atStop(privOf(), d.date, s.id).length);
  const costsToday = costItems(tr).filter(x => (x.kind === "stop" || x.kind === "private") && x.day === i);
  const stay = stayOf(d.stay);
  const zs = zonesOf(list, isSkipped);
  // What the cards on the map add to a pin: the name as on the sign, directions from
  // the stop before, and the review site for a place to eat.
  for(const z of zs) for(const pt of z.pts){
    const k = pt.items[0].idx, s = list[k];
    if(pt.q) pt.dir = dirUrl(pt.q, comingFrom(i, list, k, isSkipped));
    pt.review = reviewSite(s, {city: d.city, timezone: tr.timezone, lang});
    if(s.local){ pt.local = s.local; pt.lang = localLang(s.local, regionOf(s, tr.timezone)); }
  }
  const view = effectiveView();
  // Sunrise and sunset where the day is (its first stop with a position), and so the
  // part of the day of each stop: it shades the maps and marks the stops after dark.
  const here = list.find(s => s.lat !== undefined);
  const light = here ? daylight(d.date, here.lat, here.lng, tr.timezone) : null;
  const parts = partsOfDay(list, light, clockMinutes);
  dayLight = light;
  // The weather (WX1, WX4, WX6): today to 3 days ahead, the forecast of the day's place;
  // a day gone, the last one it had.
  const ahead = (Date.parse(d.date) - Date.parse(tripToday())) / 864e5;
  const place = here && placeOf(here.lat, here.lng), kept = place && wx.get(place);
  if(place && ahead >= 0 && ahead <= AHEAD) wantWeather(place);
  dayWx = kept && ahead >= 0 && ahead <= AHEAD && Date.now() - kept.at < 12 * 3600_000 ? {date: d.date, hours: localHours(kept.forecast, tr.timezone)} : null;
  const w = dayWx && dayWeather(dayWx.hours, d.date), was = ahead < 0 && S.wxLog[d.date];
  if(w) keepWeather(d.date, w);
  const wxHead = w ? `<span class="wx" role="img" aria-label="${esc(t("wxHead", {k: t("wx_" + w.kind), a: w.min, b: w.max}))}">${WX_ICON[w.kind]}${w.min}–${w.max}°</span>`
    : was ? `<span class="wx was" role="img" aria-label="${esc(t("wxWas", {b: was.max, k: t("wx_" + was.kind).toLowerCase()}))}">${WX_ICON[was.kind] || ""}${was.max}°</span>` : "";
  // The colours of this day's pins, lines and numbers (js/geo.js).
  const paint = painter(cityColor(d.city), parts);
  const dp = dateParts(d.date, lang), ti = todayIndex();
  // The heading: the day, its title, its city as the name of a line; the night, the
  // sun, how far the day has gone.
  const city = d.city || "";
  const from = prev && prev.city && city && prev.city !== city ? prev.city : "";
  const now = nowOf(d, pid, list);
  const cityLine = city ? `<span class="cityp" style="--c:${cityVar(prev && from ? prev.city : city)}">${esc(from || city)}</span>${from ? ` → <span class="cityp" style="--c:${color}">${esc(city)}</span>` : ""}` : "";
  let html = `
  <header class="dayhead" style="--c:${color}">
    <p class="dmeta">${esc(t("day"))} ${i + 1}${i === ti ? " · " + esc(t("today")) : ""} · ${esc(dp.long)}</p>
    <h1>${esc(d.title || city || dp.long)}</h1>
    <p class="dsub">${cityLine}${light ? `<span class="sun" role="img" aria-label="${esc(t("sunTimes", {r: hhmm(light.sunrise), s: hhmm(light.sunset)}))}">${partSign("midday")}${hhmm(light.sunrise)}–${hhmm(light.sunset)}</span>` : ""}${wxHead}</p>
    <p class="dsub">${stay ? `<span>${esc(t("night"))} · <b>${esc(stay.name)}</b>${typeof d.stay === "object" ? ` <a class="maplink" href="${esc(mapsUrl(stay.address || stay.name))}" target="_blank" rel="noopener">${esc(t("mapLink"))}</a>` : ""}</span>` : ""}<span class="progress">${esc(t("doneCount", {a: doneCount, b: list.length}))}${skipCount ? " · " + esc(skipCount === 1 ? t("skippedOne") : t("skippedCount", {n: skipCount})) : ""}${dayTotal(costsToday)}</span></p>
  </header>`;

  let wanted = null;
  // The day as a map (M2): the map takes the heading's place, the list scrolls under it.
  const mapMode = S.ui.mapOpen && zs.length > 0;
  if(mapMode){
    html = mapStage(zs, color, view, gone, paint);
    // Skipping a stop changes the route: the map is drawn again.
    const skippedNow = list.map((s, k) => isSkipped(k) ? k : -1).filter(k => k >= 0).join(",");
    // The lines are not in the key: hiding them keeps the map, its zoom and its place.
    if(view === "live") wanted = {key: [S.rec.id, S.rec.trip.version.id, i, pid || "", googleKey(), lang, skippedNow].join("|"), zones: zs, color: mapColor(d.city), gone, paint: painter(mapColor(d.city), parts)};
  }
  if(!mapMode) html += dayLine(d, pid, list, all);
  if(d.plans){
    // Who goes with each plan, of those who show it (G2): theirs, or the day's.
    const goes = chosenPlan(d), shown = (S.rec.group && S.rec.group.shown) || [];
    const on = p => shown.filter(x => (x.plans[d.date] || goes.id) === p.id).map(x => x.handle);
    html += `<div class="seg" role="group" aria-label="${esc(t("choosePlan"))}">` + d.plans.map(p =>
      `<button type="button" data-plan="${esc(p.id)}" aria-pressed="${p.id === pid}">${esc(p.name)}${whoCircles(on(p))}</button>`).join("") + `</div>`;
    // Another plan than the one the day goes with: mine, on all my phones (P4); it can be
    // chosen for everyone by who can edit.
    if(plan !== goes) html += `<p class="plan-note"><span>${esc(t("planGoesWith", {p: goes.name}))}</span>${canChange() ? `<button type="button" class="btn small" data-plan-choose="${esc(pid)}">${esc(t("planChooseAll", {p: plan.name}))}</button>` : ""}</p>`;
  }
  html += stopsHTML(d, pid, list, light ? parts : null, paint, all, now);
  // Adding is always the last row (R3, V2): a new stop, or what a chat wrote.
  if(!isLocked(S.rec)) html += `<div class="addrow"><button type="button" data-add-stop>${PLUS}${esc(t("addStop"))}</button><button type="button" data-add-paste>${CLIP}${esc(t("addPaste"))}</button></div>`;
  // Changing the day itself: quiet, at the end (R2).
  if(!mapMode) html += `<div class="chg dayfoot" role="group" aria-label="${esc(t("dayActions"))}">${isLocked(S.rec) ? "" : `<button type="button" data-day-edit>${EDIT}${esc(t("editDay"))}</button><button type="button" data-day-move>${SWAP}${esc(t("moveDay"))}</button>`}${anyText ? `<button type="button" data-expand aria-pressed="${S.ui.expandAll}">${S.ui.expandAll ? FOLD : UNFOLD}${esc(t(S.ui.expandAll ? "collapseAll" : "expandAll"))}</button>` : ""}</div>`;
  // The next stop's bar (V3): its number, its name, how long until it, Directions from
  // where the traveller is (no origin: the phone's position).
  let bar = "";
  if(now.today && now.next >= 0){
    const s = list[now.next], m = minutesOf(s.time, dayLight), q = placeQuery(s);
    const when = m !== null && m >= now.min ? t("nextIn", {m: m - now.min}) : t("nextLabel");
    bar = `<button type="button" class="nb-t" data-to-next><span class="nb" style="--pf:${paint.stop(s.type, now.next)}" aria-hidden="true">${s.lat !== undefined ? now.next + 1 : ""}</span><span class="nb-tx"><small>${esc(when)}</small><b>${esc(s.title)}</b>${s.time ? `<small>${esc(timeText(s.time))}</small>` : ""}</span></button>` +
      (q ? `<a class="nb-go" href="${esc(dirUrl(q, ""))}" target="_blank" rel="noopener">${ROUTE}${esc(t("routeShort"))}</a>` : "");
  }
  return {html, wanted, now, bar};
}

// The day's line (W1–W5): what matters today, in one place. Closed, the most important
// and "+N"; opened, one per row, each with its action. Closures and bookings of the
// stops still ahead, choices to make, stops without a position, the lock, the notes.
function dayLine(d, pid, list, all){
  const items = [];
  const ended = s => { const j = list.indexOf(s), k = stopKey(d, pid, s, j); return !!(S.state.done[k] || S.state.skipped[k]); };
  for(const s of list){
    if(ended(s)) continue;
    const closed = closedOn(s, d.date);
    if(closed) items.push({level: "warn", kind: "closed", text: t("lineClosed", {s: s.title, d: closed.date ? t("closedDate").toLowerCase() : t("closedWeekday", {d: weekdayName(closed.weekday, getLang())}).toLowerCase()}),
      act: s.id && canChange() ? `<button type="button" class="sigact" data-edit="${esc(s.id)}">${esc(t("sigMove"))}</button>` : ""});
    if(s.booking === "required") items.push({level: "warn", kind: "ticket", text: t("lineBooking", {s: s.title})});
  }
  // The weather on the stops outdoors (WX3): the first, how many, and the day's other plan.
  const wet = dayWx && dayWx.date === d.date ? list.filter(s => !ended(s)).map(s => [s, stopWeather(dayWx.hours, d.date, s, dayLight)]).filter(([, w]) => w) : [];
  if(wet.length){
    const [[s, w]] = wet, what = t("wx_" + w.kind + "At", {t: hhmm(w.at)}), other = d.plans && d.plans.find(p => p.id !== pid);
    items.push({level: "warn", kind: "weather", text: wet.length === 1 ? t("wxLineOne", {w: what, s: s.title}) : t("wxLineMany", {w: what, n: wet.length}),
      act: other ? `<button type="button" class="sigact" data-plan="${esc(other.id)}">${esc(t("wxPlan", {p: other.name}))}</button>` : ""});
  }
  for(const [g, xs] of groupsIn(all)) if(!chosenIn(xs)) items.push({level: "warn", kind: "choice", text: t("lineChoose", {g})});
  const missing = canChange() ? all.filter(s => s.lat === undefined && s.id).length : 0;
  // "Leave as it is" decided it on this phone: the line no longer asks (W3).
  if(missing && !(S.state.found && S.state.found[d.date])) items.push({level: "info", kind: "nopos", text: t(missing === 1 ? "posMissingOne" : "posMissing", {n: missing}),
    act: `<button type="button" class="sigact" data-find-pos>${esc(t("posFind"))}</button>`});
  if(isLocked(S.rec)) items.push({level: "info", kind: "note", text: S.rec.public ? t("publicNote", {h: S.rec.public.by}) : t("lockedNote"), locked: true});
  for(const n of d.notes || []) items.push({level: "info", kind: "note", html: rich(n), text: String(n).replace(/\*\*/g, "")});
  if(!items.length) return "";
  const open = !!S.state.notesOpen;
  const icon_ = x => x.kind === "nopos" ? NO_POS : SIG_ICON[x.kind];
  const row = x => `<li class="${x.level}"><span class="k" aria-hidden="true">${icon_(x)}</span><span class="tx"${x.locked ? " data-locked" : ""}>${x.html || esc(x.text)}</span>${x.act || ""}</li>`;
  if(!open && items.length === 1 && items[0].act) return `<section class="dayline" aria-label="${esc(t("lineTitle"))}"><ul>${row(items[0])}</ul></section>`;
  const first = items[0];
  const head = open
    ? `<button type="button" class="lhead" data-notes aria-expanded="true" aria-controls="day-line"><span class="tx"><b>${esc(t("lineTitle"))}</b> · ${items.length}</span><span class="close">${esc(t("close"))}</span></button>`
    : `<button type="button" class="lhead" data-notes aria-expanded="false" aria-controls="day-line"><span class="k ${first.level}" aria-hidden="true">${icon_(first)}</span><span class="tx"><b>${esc(first.text)}</b></span>${items.length > 1 ? `<span class="plus" aria-label="${esc(t("sigMore", {n: items.length - 1}))}">+${items.length - 1}</span>` : ""}</button>`;
  return `<section class="dayline${open ? " open" : ""}" aria-label="${esc(t("lineTitle"))}">${head}<ul id="day-line"${open ? "" : " hidden"}>${items.map(row).join("")}</ul></section>`;
}

function syncLive(wanted){
  const slot = document.getElementById("live-slot");
  if(!wanted || !slot){
    if(live){ live.handle.destroy(); live = null; }
    return;
  }
  // A key that changed in another way (a trip loaded, an update) is caught here.
  if(applyMapSettings()) return;
  if(!live || live.key !== wanted.key){
    if(live) live.handle.destroy();
    live = {key: wanted.key, handle: createLiveMap({zones: wanted.zones, color: wanted.color, googleKey: googleKey(), paint: wanted.paint, onNotice: k => toast(t(k)), onPick: pickStop})};
  }
  slot.appendChild(live.handle.el);
  live.handle.refresh();
  live.handle.setMarks(wanted.gone);
  live.handle.setRoute(true);
}

// List | Map in the top bar (M2): Map is pressed while the map shows.
$strip.addEventListener("click", e => {
  if(e.target.closest("#search-btn")){ if(searching()) closeSearch(); else openSearchHere(); return; }
  // The circle of you closes the search too, on its way to You.
  if(e.target.closest("#me-btn")) closeSearch(false);
  const b = e.target.closest("#view-toggle button");
  if(!b) return;
  const map = b.hasAttribute("data-map") ? !S.ui.mapOpen : false;
  if(S.ui.mapOpen !== map) keepReading(() => { S.ui.mapOpen = map; saveUi(); render(); });
  refocus(map || b.hasAttribute("data-map") ? "#view-toggle [data-map]" : "#view-toggle [data-view-list]");
});

// The next stop's bar (V3): at the bottom, within reach of a thumb, only while the next
// stop's card is off the screen. A tap on it brings the card back.
const $next = document.createElement("div");
$next.className = "nextbar";
$next.hidden = true;
$next.setAttribute("role", "region");
document.body.appendChild($next);
let nextSeen = null;
function watchNext(){
  if(nextSeen){ nextSeen.disconnect(); nextSeen = null; }
  const card = $app.querySelector(".stops .next");
  $next.setAttribute("aria-label", t("nextLabel"));
  if(!card || !$next.innerHTML || typeof IntersectionObserver !== "function"){ $next.hidden = true; return; }
  nextSeen = new IntersectionObserver(([e]) => { $next.hidden = e.isIntersecting; }, {root: scroller, rootMargin: "-60px 0px -40px 0px"});
  nextSeen.observe(card);
}
$next.addEventListener("click", e => { if(e.target.closest("[data-to-next]")) goToNow(true); });

// Search (S1–S5): the trip's stops and notes, found as one types; a tap goes there.
function openSearchHere(){
  const tr = trip(), lang = getLang();
  let shown = [];
  openSearch({strip: $strip, button: document.getElementById("search-btn"), icons: {lens: SEARCH, close: CLOSE},
    find: q => {
      shown = searchTrip(tr, q);
      return shown.map(r => {
        const d = tr.days[r.dayIndex], dp = dateParts(d.date, lang);
        const day = `${t("day")} ${r.dayIndex + 1} · ${dp.dow} ${dp.short}`;
        if(r.kind === "note") return {sign: `<span class="nb blank">${INFO}</span>`, meta: day, name: t("searchNote"), nameMark: null, where: r.where, label: `${t("searchNote")}, ${day}`};
        // The stop's sign: its number in the day the day goes through, in its kind's colour.
        const plan = r.planId ? (d.plans || []).find(p => p.id === r.planId) : null;
        const all = mineIn(plan ? plan.stops : d.stops), s = all[r.index], i = programOf(all).indexOf(s);
        const colour = TYPE_COLORS[s.type] || cityColor(d.city);
        const sign = s.lat !== undefined && i >= 0 ? `<span class="nb" style="--pf:${colour}">${i + 1}</span>` : s.lat === undefined ? `<span class="nopos-sign">${NO_POS}</span>` : `<span class="nb q"></span>`;
        const meta = [day, r.time ? timeText(r.time, null) : "", plan ? plan.name : "", r.choice && !s.chosen ? r.choice : ""].filter(Boolean).join(" · ");
        return {sign, meta, name: r.title, nameMark: r.name, where: r.where, label: [r.title, meta].join(", ")};
      });
    },
    onPick: k => goToResult(shown[k])
  });
}

// The day of a result, with the stop open and in view, the focus on it (S4).
let revealing = null;
function goToResult(r){
  if(!r) return;
  const tr = trip(), d = tr.days[r.dayIndex];
  if(r.planId && S.state.plans[d.date] !== r.planId){ S.state.plans[d.date] = r.planId; saveState(); }
  if(r.kind === "note"){
    S.state.notesOpen = true; saveState();
    revealing = ".dayline";
  }else{
    const plan = r.planId ? (d.plans || []).find(p => p.id === r.planId) : null;
    const all = mineIn(plan ? plan.stops : d.stops), s = all[r.index], list = programOf(all), i = list.indexOf(s);
    if(i < 0 && s.choice){
      // An option not chosen: its group opened, the option in view.
      S.openGroups.add(`${d.date}|${r.planId || ""}|${s.choice}`);
      revealing = `[data-choose="${CSS.escape(s.id)}"]`;
    }else{
      const key = stopKey(d, r.planId, s, i);
      S.openStops.set(key, true);
      revealing = `[data-open="${CSS.escape(key)}"]`;
    }
  }
  const hash = `#day-${r.dayIndex + 1}`;
  if(location.hash !== hash){ location.hash = hash; return; }   // hashchange draws and reveals
  render();
  reveal();
}
function reveal(){
  if(!revealing) return false;
  const el = $app.querySelector(revealing);
  revealing = null;
  if(!el) return false;
  const card = el.closest(".stop, .group, .dayline") || el;
  scrollToY(Math.max(0, scrollTop() + card.getBoundingClientRect().top - barBottom() - 12));
  el.focus({preventScroll: true});
  return true;
}

// On the day itself the list starts from now (R14): the mark of now at the top, the
// stop before just visible above it. Not while the traveller scrolls: only when a day
// opens and when the app comes back. True when it moved the page.
function goToNow(smooth = false){
  const r = route();
  if(r.name !== "day" || r.i !== todayIndex()) return false;
  const mark = $app.querySelector(".stops .now") || $app.querySelector(".stops .next");
  if(!mark) return false;
  const y = scrollTop() + mark.getBoundingClientRect().top - barBottom() - 56;
  if(smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches) (scroller || window).scrollTo({top: Math.max(0, y), behavior: "smooth"});
  else scrollToY(Math.max(0, y));
  return true;
}

function render(){
  const r = route();
  renderStrip(r);
  // While the page is rebuilt the interactive map is out of it, and the page is shorter
  // by its height: a browser that lays the page out in that moment pulls the scroll up
  // (a tap on ⋯ or Edit under an open map jumped by the map's height). The page keeps
  // its height until the map is back.
  const y = scrollTop();
  $app.style.minHeight = $app.offsetHeight + "px";
  if(live) live.handle.el.remove(); // keep the map alive while the page is rebuilt
  let wanted = null, bar = "";
  if(r.name === "welcome") $app.innerHTML = renderWelcome();
  else if(r.name === "me") $app.innerHTML = renderMe();
  else if(r.name === "trips") $app.innerHTML = renderTrips();
  else if(r.name === "info") $app.innerHTML = renderInfo();
  else { const out = renderDay(r.i); $app.innerHTML = out.html; wanted = out.wanted; bar = out.bar; }
  $next.innerHTML = bar;
  watchNext();
  syncLive(wanted);
  markTail();
  fitHeadline();
  $app.style.minHeight = "";
  if(scrollTop() !== y) scrollToY(y);
  askRates();
}

// The page drawn again by itself (rates arrived): what had the focus keeps it.
function renderKeepingFocus(){
  const a = document.activeElement;
  let sel = null;
  if(a && a !== document.body && $app.contains(a)){
    if(a.id) sel = "#" + CSS.escape(a.id);
    else{
      const attr = a.getAttributeNames().find(n => n.startsWith("data-"));
      if(attr) sel = `[${attr}="${CSS.escape(a.getAttribute(attr))}"]`;
    }
  }
  // Typing in a box: the caret stays where it was.
  const caret = a && typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null;
  render();
  if(sel) refocus(sel);
  const b = sel && document.querySelector(sel);
  if(b && caret && typeof b.setSelectionRange === "function") try{ b.setSelectionRange(caret[0], caret[1]); }catch(e){}
}

/* ---------- events ---------- */

function refocus(selector){
  const el = document.querySelector(selector);
  if(el) el.focus({preventScroll: true});
}

$app.addEventListener("input", e => {
  if(e.target.matches && e.target.matches("[data-trips-search]")){ S.tripSearch = e.target.value; renderKeepingFocus(); return; }
  const box = e.target.closest && e.target.closest("[data-draft]");
  if(!box) return;
  setDraft(box.dataset.draft, box.value);
});
// Folded sections the traveller opened stay open when the page is drawn again.
$app.addEventListener("toggle", e => {
  const d = e.target;
  if(!d.dataset || !d.dataset.keep) return;
  if(d.open) S.openDetails.add(d.dataset.keep); else S.openDetails.delete(d.dataset.keep);
}, true);

$app.addEventListener("click", e => {
  // Any tap outside the open ⋯ menu closes it first (its own button toggles it below).
  if(S.menuFor && !e.target.closest(".menu") && !e.target.closest("[data-more]")) hideMenu();
  // On the map, a stop's number shows its pin (M3).
  const num = S.ui.mapOpen && live && e.target.closest(".stops .nb[data-pin]");
  if(num){ live.handle.focus(+num.dataset.pin); pickStop(+num.dataset.pin); return; }
  const group = e.target.closest("[data-group]");
  if(group){
    const k = group.dataset.group;
    if(S.openGroups.has(k)) S.openGroups.delete(k); else S.openGroups.add(k);
    render();
    refocus(`[data-group="${CSS.escape(k)}"]`);
    return;
  }
  const choose = e.target.closest("[data-choose]");
  if(choose){ chooseHere(choose.dataset.choose); return; }
  const altAdd = e.target.closest("[data-alt-add]");
  if(altAdd){ S.menuFor = null; render(); addAlternativeHere(altAdd.dataset.altAdd); return; }
  const planAll = e.target.closest("[data-plan-choose]");
  if(planAll){ choosePlanHere(planAll.dataset.planChoose); return; }
  const tick = e.target.closest("[data-tick]");
  if(tick){
    const id = tick.dataset.tick;
    if(S.state.done[id]) delete S.state.done[id];
    else { S.state.done[id] = 1; delete S.state.skipped[id]; }
    saveState();
    render();
    refocus(`[data-tick="${CSS.escape(id)}"]`);
    return;
  }
  const skip = e.target.closest("[data-skip]");
  if(skip){
    const id = skip.dataset.skip;
    S.menuFor = null;
    if(S.state.skipped[id]) delete S.state.skipped[id]; else S.state.skipped[id] = 1;
    saveState();
    render();
    refocus(`[data-skip="${CSS.escape(id)}"]`);
    return;
  }
  const more = e.target.closest("[data-more]");
  if(more){
    S.menuFor = S.menuFor === more.dataset.more ? null : more.dataset.more;
    render();
    const menu = S.menuFor && document.querySelector(`[data-more="${CSS.escape(S.menuFor)}"] + .menu`);
    if(menu){ placeMenu(menu); menu.querySelector("[role=menuitem]").focus({preventScroll: true}); }
    else refocus(`[data-more="${CSS.escape(more.dataset.more)}"]`);
    return;
  }
  const edit = e.target.closest("[data-edit]");
  if(edit){ S.menuFor = null; render(); editStop(edit.dataset.edit); return; }
  if(e.target.closest("[data-day-edit]")){ S.menuFor = null; render(); editDay(); return; }
  if(e.target.closest("[data-day-move]")){ S.menuFor = null; moveDay(); return; }
  const rate = e.target.closest("[data-cost-rate]");
  if(rate){
    const id = rate.dataset.costRate;
    if(S.openCosts.has(id)) S.openCosts.delete(id); else S.openCosts.add(id);
    render();
    refocus(`[data-cost-rate="${CSS.escape(id)}"]`);
    return;
  }
  const tap = e.target.closest("[data-open]");
  if(tap){ toggleStop(tap.dataset.open); return; }
  // Adding: a new stop, or what a chat wrote (the last row of a day, R3).
  if(e.target.closest("[data-add-stop]")){ newStop(); return; }
  if(e.target.closest("[data-add-paste]")){ pasteAnything(); return; }
  // A tap anywhere on a stop's card opens or closes it, like its name (R1), but not on
  // a link, a button or what the opened card shows.
  const card = !e.target.closest("a, button, input, select, label, .xpand, .opts") && e.target.closest(".stop");
  if(card){ const b = card.querySelector("[data-open]"); if(b && getSelection().isCollapsed) toggleStop(b.dataset.open); return; }
  for(const [attr, field] of [["data-cost-view", "costView"], ["data-cost-cur", "costCur"]]){
    const b = e.target.closest(`[${attr}]`);
    if(!b) continue;
    S.ui[field] = b.getAttribute(attr);
    saveUi();
    render();
    refocus(`[${attr}="${CSS.escape(b.getAttribute(attr))}"]`);
    return;
  }
  if(e.target.closest("[data-expense-add]")){ editExpense(null); return; }
  const expense = e.target.closest("[data-expense]");
  if(expense){ editExpense(expense.dataset.expense); return; }
  const own = e.target.closest("[data-private-expense]");
  if(own){ editExpense(own.dataset.privateExpense, true); return; }
  if(e.target.closest("[data-expand]")){
    S.ui.expandAll = !S.ui.expandAll;
    S.openStops.clear();
    saveUi();
    render();
    refocus("[data-expand]");
    return;
  }
  const meRowBtn = e.target.closest("[data-me-row]");
  if(meRowBtn){
    S.meRow = S.meRow === meRowBtn.dataset.meRow ? null : meRowBtn.dataset.meRow;
    render();
    refocus(`[data-me-row="${meRowBtn.dataset.meRow}"]`);
    return;
  }
  const themeBtn = e.target.closest("[data-theme-choice]");
  if(themeBtn){
    setTheme(themeBtn.dataset.themeChoice);
    render();
    refocus(`[data-theme-choice="${themeBtn.dataset.themeChoice}"]`);
    return;
  }
  const provider = e.target.closest("[data-provider]");
  if(provider){
    S.useGoogle = provider.dataset.provider === "google";
    store.setKV("useGoogle", S.useGoogle).catch(() => {}).then(() => {
      if(applyMapSettings()) return;
      render();
      refocus(`[data-provider="${provider.dataset.provider}"]`);
    });
    return;
  }
  const langBtn = e.target.closest("[data-lang]");
  if(langBtn){
    S.langPref = langBtn.dataset.lang;
    (S.langPref === "auto" ? store.delKV("lang") : store.setKV("lang", S.langPref)).catch(() => {});
    applyLang();
    if(applyMapSettings()) return;
    render();
    refocus(`[data-lang="${CSS.escape(S.langPref)}"]`);
    return;
  }
  if(e.target.closest("[data-notes]")){
    S.state.notesOpen = !S.state.notesOpen;
    if(!S.state.notesOpen) delete S.state.notesOpen;
    saveState();
    render();
    refocus("[data-notes]");
    return;
  }
  const findPos = e.target.closest("[data-find-pos]");
  if(findPos){ findPositions(findPos.dataset.findPos || null); return; }
  if(e.target.closest("[data-map]")){
    keepReading(() => { S.ui.mapOpen = !S.ui.mapOpen; saveUi(); render(); });
    refocus("[data-map]");
    return;
  }
  // The lines between the stops on both maps: shown or hidden, remembered.
  if(e.target.closest("[data-route]")){
    S.ui.route = !S.ui.route;
    saveUi();
    render();
    refocus("[data-route]");
    return;
  }
  const view = e.target.closest("[data-view]");
  if(view){
    S.ui.mapView = view.dataset.view;
    saveUi();
    render();
    refocus(`[data-view="${view.dataset.view}"]`);
    return;
  }
  const fit = e.target.closest("[data-fit]");
  if(fit){ if(live) live.handle.fit(fit.dataset.fit === "" ? null : +fit.dataset.fit); return; }
  if(e.target.closest("[data-locate]")){ if(live) live.handle.locate(); return; }
  const size = e.target.closest("[data-map-size]");
  if(size){ resizeMap(size); return; }
  const plan = e.target.closest("[data-plan]");
  if(plan){
    const r = route();
    if(r.name !== "day") return;
    S.state.plans[trip().days[r.i].date] = plan.dataset.plan;
    saveState();
    render();
    refocus(`[data-plan="${CSS.escape(plan.dataset.plan)}"]`);
    return;
  }
  const meBtn = e.target.closest("#app [data-me]");
  if(meBtn){
    // A sheet opens once its data is here: the button waits with it, tapped once.
    if(meBtn.disabled) return;
    meBtn.disabled = true;
    accountActions(meBtn.dataset.me).finally(() => { meBtn.disabled = false; });
    return;
  }
  const act = e.target.closest("[data-act]");
  if(act) runAct(act);
});

// What a [data-act] button does, on the page or in a sheet (the trip's, the assistant's).
function runAct(act){
  const a = act.dataset.act;
  if(a === "pick"){ $file.value = ""; $file.click(); }
  else if(a === "paste") pasteTrip();
  else if(a === "paste-any") pasteAnything();
  else if(a === "assistant") openAssistant();
  else if(a === "trip-menu") tripMenu(act.dataset.id);
  else if(a === "copy-errors") copyErrors();
  else if(a === "copy-prompt") copyText(aiMessage(), t((S.drafts.new || "").trim() ? "copiedReady" : "copiedPrompt"));
  else if(a === "copy-prompt-full") copyText(aiMessageFull(), t((S.drafts.new || "").trim() ? "copiedReady" : "copiedPrompt"));
  else if(a === "copy-edit" && S.rec) copyText(aiEditMessage(), t((S.drafts["edit:" + S.rec.id] || "").trim() ? "copiedReady" : "copiedEdit"));
  else if(a === "clear-draft"){
    setDraft(act.dataset.key, "");
    const box = document.querySelector(`[data-draft="${CSS.escape(act.dataset.key)}"]`);
    if(box){ box.value = ""; box.focus(); }
    act.hidden = true;
  }
  else if(a === "demo") loadDemo();
  else if(a === "signup") openSignUp({onDone: user => { S.account = user; render(); toast(t("welcome", {h: user.handle})); syncNow(); }, onSignIn: accountSignIn, onRecover: accountRecover});
  else if(a === "sync") syncNow();
  else if(a === "unhide"){ S.hidden.clear(); store.delKV("share:hidden").catch(() => {}); render(); syncNow(); }
  else if(a === "reup") putBackOnAccount(act.dataset.id);
  else if(a === "lock") toggleLock(act.dataset.id);
  else if(a === "base-copy"){
    const rec = S.records.find(r => r.id === act.dataset.id);
    if(rec && rec.public) useAsBase(rec.public.page, {trip: contentOf(rec.trip), by: rec.public.by, dates: rec.public.dates});
  }
  else if(a === "share-trip"){
    const rec = S.records.find(r => r.id === act.dataset.id);
    if(rec && rec.share && !act.disabled){
      act.disabled = true;
      openShareSheet({rec, toast, onPublication: async publication => {
        const now = S.records.find(r => r.id === rec.id);
        if(now && now.share){ await keepSynced({...now, share: {...now.share, publication}}); render(); }
      }}).finally(() => { act.disabled = false; });
    }
  }
  else if(a === "signin") accountSignIn();
  else if(a === "me") location.hash = "#me";
  else if(a === "remove") removeRecord(act.dataset.id);
  else if(a === "save"){ const rec = S.records.find(r => r.id === act.dataset.id); if(rec) saveFile(rec); }
  else if(a === "history") showHistory(act.dataset.id);
  else if(a === "open"){
    // The trip, on today if it is under way (TR1): the open one is only shown again.
    const rec = S.records.find(r => r.id === act.dataset.id);
    const show = () => { history.replaceState(null, "", location.pathname + location.search); if(applyMapSettings()) return; render(); scrollToY(0); };
    if(rec && S.rec && S.rec.id === rec.id) show();
    else if(rec) openRecord(rec).then(show);
  }
}

// Holding a stop's number shows it on the day's map: the map opens if it is closed and
// the pin comes to the middle, with its card. Only a hold: a tap or a scroll that
// starts on the number does nothing. While the finger is down nothing on the page can
// be selected: a long press would otherwise select the words near the number, and
// leave them selected once the map is open.
let hold = null;
const $root = document.documentElement;
const clearSelection = () => { try{ const sel = getSelection(); if(sel && sel.rangeCount) sel.removeAllRanges(); }catch(e){} };
function endHold(){
  if(!hold) return;
  clearTimeout(hold.timer);
  const fired = hold.fired;
  hold = null;
  // Only the click that comes as the finger lifts is the hold's: not a later one.
  if(fired) setTimeout(() => { held = false; }, 350);
  // The phone may still select or open its menu as the finger lifts: wait a moment.
  setTimeout(() => { $root.classList.remove("holding"); if(fired) clearSelection(); }, fired ? 400 : 0);
}
$app.addEventListener("pointerdown", e => {
  // The number, or the stop's name: held, the stop on the map.
  const title = e.target.closest(".stops .tt .tap");
  const nb = e.target.closest("[data-pin]") || (title && title.closest(".stop").querySelector(".nb[data-pin]"));
  endHold();
  if(!nb || (e.pointerType === "mouse" && e.button !== 0)) return;
  $root.classList.add("holding");
  hold = {x: e.clientX, y: e.clientY, fired: false};
  hold.timer = setTimeout(() => { if(!hold) return; hold.fired = true; held = true; clearSelection(); showOnMap(+nb.dataset.pin); }, 450);
});
// The tap that ends a hold does not also open or close the stop.
let held = false;
$app.addEventListener("click", e => { if(held){ held = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
// Safari's own pinch: the app does not zoom, the map does (it handles its touches itself).
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("pointermove", e => { if(hold && !hold.fired && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 10) endHold(); });
for(const type of ["pointerup", "pointercancel"]) document.addEventListener(type, endHold);
// The phone's own menu for a long press (copy, select) would open on top of the map.
document.addEventListener("contextmenu", e => { if($root.classList.contains("holding")) e.preventDefault(); });
document.addEventListener("selectionchange", () => { if(hold && hold.fired) clearSelection(); });

function showOnMap(idx){
  try{ if(navigator.vibrate) navigator.vibrate(12); }catch(e){}
  if(!S.ui.mapOpen){ S.ui.mapOpen = true; saveUi(); render(); }
  const box = document.querySelector(".mapstage");
  if(!box) return;
  pickStop(idx);
  if(live && document.getElementById("live-slot")) live.handle.focus(idx);
  // The sketch: its badge for that stop pulses.
  else box.querySelectorAll(".badge").forEach(b => {
    if(!String(b.dataset.idx || "").split(" ").includes(String(idx))) return;
    b.classList.remove("hit"); void b.getBoundingClientRect(); b.classList.add("hit");
  });
}

function toggleStop(id){
  S.openStops.set(id, !isOpen(id));
  render();
  refocus(`[data-open="${CSS.escape(id)}"]`);
}

// The ⋯ menu opens upwards when there is no room below it (the + button is there).
function placeMenu(menu){
  menu.classList.toggle("up", menu.getBoundingClientRect().bottom > window.innerHeight - 76);
}

// Closes the menu where it is, without redrawing the page.
function hideMenu(){
  S.menuFor = null;
  document.querySelectorAll(".menu").forEach(m => { m.hidden = true; });
  document.querySelectorAll("[data-more]").forEach(b => b.setAttribute("aria-expanded", "false"));
}

function closeMenu(){
  const id = S.menuFor;
  hideMenu();
  if(id) refocus(`[data-more="${CSS.escape(id)}"]`);
}

// Menu keys: Escape closes it, arrows move between its items.
document.addEventListener("keydown", e => {
  if(!S.menuFor) return;
  if(e.key === "Escape"){ e.preventDefault(); closeMenu(); return; }
  const items = [...document.querySelectorAll(".menu:not([hidden]) [role=menuitem]")];
  const at = items.indexOf(document.activeElement);
  if(at < 0 || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
  e.preventDefault();
  items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus();
});

// The description is a button for the keyboard too.
$app.addEventListener("keydown", e => {
  if(e.key !== "Enter" && e.key !== " ") return;
  const tap = e.target.closest && e.target.closest("[data-open]");
  if(!tap || e.target !== tap) return;
  e.preventDefault();
  toggleStop(tap.dataset.open);
});

$app.addEventListener("submit", e => {
  const form = e.target.closest('[data-form="key"]');
  if(!form) return;
  e.preventDefault();
  S.deviceKey = form.elements.gkey.value.trim();
  (S.deviceKey ? store.setKV("googleKey", S.deviceKey) : store.delKV("googleKey")).then(() => {
    if(applyMapSettings()) return;
    render();
    toast(t("saved"));
  });
});

// What the trip cost, folded at the end of Info: open or closed, remembered.
$app.addEventListener("toggle", e => {
  if(!e.target.matches || !e.target.matches("[data-costs]") || S.ui.costsOpen === e.target.open) return;
  S.ui.costsOpen = e.target.open;
  saveUi();
  render();
}, true);

$app.addEventListener("change", e => {
  if(e.target.matches && e.target.matches("[data-trips-sort]")){ S.ui.tripSort = e.target.value; saveUi(); render(); refocus("[data-trips-sort]"); return; }
  if(e.target.id !== "home-cur") return;
  S.home = e.target.value;
  store.setKV("home", S.home).catch(() => {});
  S.openCosts.clear();
  render();
  refocus("#home-cur");
});

$file.addEventListener("change", async () => {
  const f = $file.files && $file.files[0];
  if(!f) return;
  try{
    await importText(await f.text(), f.name);
  }catch(e){
    S.importError = {title: t("importFailed"), items: [String(e && e.message || e)]};
    render();
  }
});

window.addEventListener("hashchange", () => {
  const chat = chatRequestId(location.hash);
  if(chat){ answerChatApp(chat); return; }
  const invite = inviteToken(location.hash);
  if(invite){ takeInvite(invite); return; }
  const pageLink = publicLink(location.hash);
  if(pageLink){ (pageLink.kind === "base" ? useAsBase : openPublic)(pageLink.page); return; }
  closeSearch(false);
  S.importError = null; S.menuFor = null; render();
  if(!reveal() && !goToNow()) scrollToY(0);
});
// A tap outside the app's content (the strip of days, the + button) closes the menu.
// The path is the one at the time of the tap: the page may have been redrawn since.
document.addEventListener("click", e => { if(S.menuFor && !e.composedPath().includes($app)) closeMenu(); });
window.addEventListener("resize", () => { markTail(); fitHeadline(); });
window.addEventListener("online", () => { S.online = true; retryRates(); render(); syncSoon(200); });
// Back in the app after a while, on the day itself: the list goes to now again (R14).
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "hidden"){ hiddenAt = Date.now(); return; }
  syncSoon(800);
  if(hiddenAt && Date.now() - hiddenAt > 5 * 60000){ render(); goToNow(); }
});
window.addEventListener("offline", () => { S.online = false; render(); });

/* ---------- offline support ---------- */

function setupServiceWorker(){
  if(!("serviceWorker" in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  const offer = sw => toast(t("updateReady"), {label: t("reload"), run: () => sw.postMessage("skip-waiting")});
  navigator.serviceWorker.register("sw.js").then(reg => {
    if(reg.waiting && hadController) offer(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if(sw) sw.addEventListener("statechange", () => { if(sw.state === "installed" && hadController) offer(sw); });
    });
    if(!hadController) navigator.serviceWorker.ready.then(() => toast(t("offlineReady")));
    // The browser looks for a new version when the app opens. An app left open in the
    // background is checked again when it comes back, and once an hour while open.
    const check = () => { reg.update().catch(() => {}); };
    document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") check(); });
    setInterval(check, 60 * 60 * 1000);
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if(reloading || !hadController) return;
    reloading = true;
    location.reload();
  });
}

async function readVersion(){
  try{
    const keys = await caches.keys();
    const k = keys.filter(x => x.startsWith("timp-shell-")).sort().pop();
    if(k) S.version = k.slice("timp-shell-".length);
  }catch(e){}
}

// Android: what is shared to the app (share_target in manifest.webmanifest) is kept by
// the service worker and the app opens with ?shared=1; older installs still send it as
// ?title=…&text=…&url=…. An AI assistant's answer or a .json file with a trip or a list
// of changes is loaded as if pasted; a place shared from Google Maps opens the stop
// form, filled in.
async function takeSharedPlace(){
  const q = new URLSearchParams(location.search);
  let parts = ["title", "text", "url"].map(k => q.get(k)).filter(Boolean);
  if(q.get("shared") === "1"){
    try{
      const box = await caches.open("timp-share");
      const res = await box.match("shared");
      await box.delete("shared");
      const got = res ? await res.json() : {};
      parts = [got.title, got.text, got.url, got.file].filter(x => typeof x === "string" && x.trim());
    }catch(e){ parts = []; }
  }
  if(!parts.length && q.get("shared") !== "1") return;
  history.replaceState(null, "", location.pathname + location.hash);
  if(!parts.length) return;
  takeText(parts.join("\n"), "shared.json");
}

// What was shared or pasted, wherever it came from: JSON (a trip, or an assistant's
// changes, even with text around it) is loaded; anything else is a place, and opens
// the stop form filled in. The share menu on Android and the Paste button everywhere
// end here, so they behave the same.
async function takeText(text, name){
  const json = jsonIn(text);
  if(json.startsWith("{")){ await importText(json, name); return; }
  if(!trip()){ toast(t("shareNeedsTrip")); return; }
  // The Maps app often repeats the link inside the text: keep each piece once.
  newStop([...new Set(String(text).split("\n").map(s => s.trim()).filter(Boolean))].join("\n"));
}

// The Paste button: the sheet first, then Paste in it reads what was copied into the
// field, where the traveller sees it before going on. The phone asks for permission
// (or shows its own Paste bubble) only then, on a tap meant for it.
function pasteAnything(){
  pasteTrip(true);
}

/* ---------- start ---------- */

async function start(){
  versions = versionStore(await store.backend());
  // 2.0 and 2.1 kept each version as a full copy: move them into pieces, once.
  const legacy = await store.legacyVersions();
  if(legacy.length){
    for(const trip of legacy) await versions.put(trip);
    await store.clearLegacyVersions();
  }
  const [records, activeId, ui, key, lang, useGoogle, home, owner] = await Promise.all([store.listTrips(), store.getKV("active"), store.getKV("ui"), store.getKV("googleKey"), store.getKV("lang"), store.getKV("useGoogle"), store.getKV("home"), store.getKV("owner")]);
  if(typeof home === "string" && /^[A-Z]{3}$/.test(home)) S.home = home;
  if(typeof owner === "string") S.owner = owner;
  if(hasService()){
    S.account = ((await shareSession()) || {}).user || null;
    const hidden = await store.getKV("share:hidden");
    if(Array.isArray(hidden)) S.hidden = new Set(hidden);
  }
  {
    const drafts = await store.getKV("drafts");
    if(drafts && typeof drafts === "object") S.drafts = drafts;
  }
  if(useGoogle === false) S.useGoogle = false;
  if(typeof lang === "string" && LANGS[lang]) S.langPref = lang;
  S.records = (records || []).sort((a, b) => a.importedAt - b.importedAt);
  // Trips saved before versions existed, in format 1, or with stop ids of before: ids
  // of their own, a version, format 2. A converted trip is a new version made from the
  // old one, the same one every phone makes; ticks and the private expenses paid at a
  // stop follow. A trip on the account is converted by the sharing service, once for
  // everyone, and comes back newer: they follow then (followNewIds). Unless this phone
  // has changes not sent yet, made by the app of before (the service refuses ids of
  // before on a converted trip): converted here, so they can go; a join the app of before
  // made with the converted trip, made again first (rejoin).
  for(const rec of S.records){
    if(rec.public) continue;
    const onAccount = !!(rec.share && rec.share.id && !rec.share.gone);
    const unsent = onAccount && rec.share.head !== (rec.trip.version && rec.trip.version.id);
    const start = unsent && rec.trip.version ? await rejoin(versions, rec.trip) : rec.trip;
    const old = !start.version || start.format !== FORMAT || (needsStopIds(start) && (!onAccount || unsent));
    const {trip: ready, renamed} = old ? await prepare(start) : {trip: start, renamed: []};
    const saved = await store.getKV("state:" + rec.id);
    if(saved && typeof saved === "object"){
      const state = followIds(moveMarks({done: {}, skipped: {}, plans: {}, ...saved}, renamed), ready);
      if(canonical(state) !== canonical({done: {}, skipped: {}, plans: {}, ...saved})) await store.setKV("state:" + rec.id, state);
    }
    const priv = rec.priv ? followIdsPrivate(followStops(rec.priv, renamed), ready) : rec.priv;
    if(!old && priv === rec.priv && start === rec.trip) continue;
    Object.assign(rec, {trip: ready, priv, ...(old || start !== rec.trip ? {exported: ready.version.id} : {})});
    await store.putTrip(rec);
    await versions.put(ready);
  }
  if(ui && typeof ui === "object") S.ui = {mapOpen: !!ui.mapOpen, mapBig: !!ui.mapBig, mapView: ui.mapView === "schema" ? "schema" : "live", expandAll: !!ui.expandAll, route: ui.route !== false,
    costsOpen: !!ui.costsOpen, costView: ui.costView === "receipt" ? "receipt" : "sum", costCur: typeof ui.costCur === "string" ? ui.costCur : "", tripSort: ["date", "name", "recent"].includes(ui.tripSort) ? ui.tripSort : "date"};
  if(typeof key === "string") S.deviceKey = key;
  syncThemeColor();
  await openRecord(S.records.find(r => r.id === activeId) || S.records[S.records.length - 1] || null);
  await readVersion();
  const chat = chatRequestId(location.hash), invite = inviteToken(location.hash), pageLink = publicLink(location.hash);
  if(chat || invite || pageLink) history.replaceState(null, "", location.pathname + location.search);
  render();
  goToNow();
  setupServiceWorker();
  takeSharedPlace();
  if(chat) answerChatApp(chat);
  if(invite) takeInvite(invite);
  if(pageLink) (pageLink.kind === "base" ? useAsBase : openPublic)(pageLink.page);
  syncNow();
}

start().catch(e => {
  $app.innerHTML = `<div class="errbox" role="alert"><b>TIMP</b><ul><li>${esc(String(e && e.message || e))}</li></ul></div>`;
});
