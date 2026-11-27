import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ensureVersion, commit, commitMerge, relation, commonBase, versionId, canonical, shortId } from "../js/version.js";
import { mergeTrips } from "../js/merge.js";
import { diffTrips, counts } from "../js/diff.js";
const merge = (base, ours, theirs) => { const trip = mergeTrips(base, ours, theirs); return {trip, report: counts(diffTrips(ours, trip))}; };
import { ensureIds, addStop, updateStop, removeStop, insertIndex, clockMinutes, newId, dayAfter, addDay, updateDay, removeDay, addExpense, updateExpense, removeExpense } from "../js/edit.js";
import { validateTrip } from "../js/trip.js";
import { isStopId, oldStopId } from "../js/ids.js";
import { demo, ID } from "./demo.mjs";

const stopsOf = (trip, date) => trip.days.find(d => d.date === date).stops;
const ids = (trip, date) => stopsOf(trip, date).map(s => s.id);
const titles = (trip, date) => stopsOf(trip, date).map(s => s.title);
const DAY1 = "2027-05-14", DAY2 = "2027-05-15";

/* ---------- versions ---------- */

test("the same content and parents always give the same id, key order does not matter", async () => {
  const a = {format: "x", id: "t", b: 1, a: [1, {d: 2, c: 3}]};
  const b = {a: [1, {c: 3, d: 2}], id: "t", b: 1, format: "x"};
  assert.equal(canonical(a), canonical(b));
  assert.equal(await versionId(a, ["p2", "p1"]), await versionId(b, ["p1", "p2"]));
  assert.notEqual(await versionId(a, []), await versionId(a, ["p1"]));
  assert.match(await versionId(a, []), /^[0-9a-f]{16}$/);
  assert.equal(shortId("0123456789abcdef"), "0123456");
});

test("a file without a version gets the same root version on every device, and the version is ignored by the id", async () => {
  const one = await ensureVersion(demo()), two = await ensureVersion(demo());
  assert.equal(one.version.id, two.version.id);
  assert.deepEqual(one.version.parents, []);
  assert.equal(Object.keys(one).indexOf("version"), 2, "written right after format and id");
  assert.equal(await ensureVersion(one), one, "a trip with a version keeps it");
  assert.deepEqual(validateTrip(one).errors, []);
});

test("an edit makes a child version; no change makes none", async () => {
  const root = await ensureVersion(demo());
  const {trip: edited, ref: coffee} = addStop(root, {date: DAY1}, {time: "12:00", title: "Coffee"});
  const v2 = await commit(edited, root);
  assert.deepEqual(v2.version.parents, [root.version.id]);
  assert.deepEqual(v2.version.history, [root.version.id]);
  assert.equal(await commit(root, root), root);
  const v3 = await commit(removeStop(v2, coffee), v2);
  assert.deepEqual(v3.version.history, [v2.version.id, root.version.id]);
  assert.deepEqual(validateTrip(v3).errors, []);
});

test("relation tells newer, older, same and diverged apart", async () => {
  const root = await ensureVersion(demo());
  const a1 = await commit(addStop(root, {date: DAY1}, {time: "12:00", title: "A"}).trip, root);
  const b1 = await commit(addStop(root, {date: DAY1}, {time: "13:00", title: "B"}).trip, root);
  assert.equal(relation(root, root), "same");
  assert.equal(relation(root, a1), "newer");
  assert.equal(relation(a1, root), "older");
  assert.equal(relation(a1, b1), "diverged");
  assert.equal(commonBase(a1, b1, new Set([root.version.id])), root.version.id);
  assert.equal(commonBase(a1, b1, new Set()), null, "a base whose content is gone cannot be used");
});

/* ---------- merge ---------- */

async function fork(){
  const root = await ensureVersion(demo());
  const a = await commit(addStop(root, {date: DAY1}, {time: "12:15", title: "Gelato", travel: "metro"}).trip, root);
  let bt = addStop(root, {date: DAY2}, {time: "13:00", title: "Lunch by the river"}).trip;
  bt = updateStop(bt, {date: DAY1, id: ID("se")}, {...stopsOf(bt, DAY1).find(s => s.id === ID("se")), text: "Changed on the other phone."}).trip;
  const b = await commit(bt, root);
  return {root, a, b};
}

test("a merge keeps what both sides added and what only one side changed", async () => {
  const {root, a, b} = await fork();
  const {trip, report} = merge(root, a, b);
  assert.ok(titles(trip, DAY1).includes("Gelato"));
  assert.ok(titles(trip, DAY2).includes("Lunch by the river"));
  assert.equal(stopsOf(trip, DAY1).find(s => s.id === ID("se")).text, "Changed on the other phone.");
  assert.deepEqual(report, {added: 1, changed: 1, removed: 0});
  assert.deepEqual(validateTrip(trip).errors, []);
});

test("a merge gives the same trip and the same version on both phones", async () => {
  const {root, a, b} = await fork();
  const ab = await commitMerge(merge(root, a, b).trip, a, b);
  const ba = await commitMerge(merge(root, b, a).trip, b, a);
  assert.equal(canonical(ab), canonical(ba).replace(ba.version.date, ab.version.date));
  assert.equal(ab.version.id, ba.version.id);
  assert.equal(relation(ab, a), "older");
  assert.equal(relation(a, ab), "newer");
});

test("a stop removed on one side goes, unless the other side changed it", async () => {
  const root = await ensureVersion(demo());
  const a = await commit(removeStop(root, {date: DAY1, id: ID("castelo")}), root);
  const b = await commit(addStop(root, {date: DAY2}, {time: "08:00", title: "Early coffee"}).trip, root);
  let merged = merge(root, a, b);
  assert.ok(!ids(merged.trip, DAY1).includes(ID("castelo")));
  assert.equal(merged.report.removed, 0, "already gone on this phone");
  assert.equal(merge(root, b, a).report.removed, 1, "seen from the phone that still had it");

  const castelo = stopsOf(root, DAY1).find(s => s.id === ID("castelo"));
  const c = await commit(updateStop(root, {date: DAY1, id: ID("castelo")}, {...castelo, time: "13:00"}).trip, root);
  merged = merge(root, a, c);
  assert.ok(ids(merged.trip, DAY1).includes(ID("castelo")), "changed on one side wins over removed");
});

test("both sides changed the same field: the same side wins on both phones", async () => {
  const root = await ensureVersion(demo());
  const se = stopsOf(root, DAY1).find(s => s.id === ID("se"));
  const a = await commit(updateStop(root, {date: DAY1, id: ID("se")}, {...se, time: "11:05"}).trip, root);
  const b = await commit(updateStop(root, {date: DAY1, id: ID("se")}, {...se, time: "11:10"}).trip, root);
  const winner = a.version.id > b.version.id ? "11:05" : "11:10";
  assert.equal(stopsOf(merge(root, a, b).trip, DAY1).find(s => s.id === ID("se")).time, winner);
  assert.equal(stopsOf(merge(root, b, a).trip, DAY1).find(s => s.id === ID("se")).time, winner);
});

test("without a base nothing is removed, and a stop added at the same place by both is kept once", async () => {
  const {a, b} = await fork();
  const {trip} = merge(null, a, b);
  for(const id of ids(a, DAY1)) assert.ok(ids(trip, DAY1).includes(id), id);
  assert.ok(titles(trip, DAY2).includes("Lunch by the river"));
  assert.equal(new Set(ids(trip, DAY1)).size, ids(trip, DAY1).length);
});

test("a stop moved to another day on one side moves", async () => {
  const root = await ensureVersion(demo());
  const lunch = stopsOf(root, DAY1).find(s => s.id === ID("lunch"));
  const a = await commit(updateStop(root, {date: DAY1, id: ID("lunch")}, lunch, {date: DAY2}).trip, root);
  const b = await commit(addStop(root, {date: DAY2}, {time: "17:00", title: "Shopping"}).trip, root);
  const {trip} = merge(root, a, b);
  assert.ok(!ids(trip, DAY1).includes(ID("lunch")));
  assert.ok(ids(trip, DAY2).includes(ID("lunch")));
});

test("a day's city, stay and plans merge field by field", async () => {
  const root = await ensureVersion(demo());
  const a0 = JSON.parse(JSON.stringify(root)); a0.days[1].city = "Belém";
  const b0 = JSON.parse(JSON.stringify(root)); b0.days[0].stay.note = "New note"; b0.days[2].plans[1].name = "Cascais and the coast";
  const a = await commit(a0, root), b = await commit(b0, root);
  const {trip} = merge(root, a, b);
  assert.equal(trip.days[1].city, "Belém");
  assert.equal(trip.days[0].stay.note, "New note");
  assert.equal(trip.days[2].plans[1].name, "Cascais and the coast");
  assert.deepEqual(validateTrip(trip).errors, []);
});

/* ---------- edits ---------- */

test("times and parts of the day order the stops", () => {
  assert.equal(clockMinutes("9:30"), 570);
  assert.equal(clockMinutes("21.05"), 1265);
  assert.equal(clockMinutes("Evening"), null);
  assert.equal(clockMinutes("25:00"), null);
  const list = [{time: "09:00"}, {time: "Lunch"}, {time: "14:00"}, {time: "Evening"}];
  assert.equal(insertIndex(list, "08:00"), 0);
  assert.equal(insertIndex(list, "10:00"), 1);
  assert.equal(insertIndex(list, "14:00"), 3);
  assert.equal(insertIndex(list, "20:00"), 3);
  assert.equal(insertIndex(list, "Night"), 4);
  assert.equal(insertIndex([], "10:00"), 0);
});

test("a stop with no time is all day: at the top, after the other all-day ones", () => {
  const trip = {format: "travel-in-my-pocket/2", title: "T", days: [{date: "2027-04-10", stops: [{id: "a", title: "Beach"}, {id: "b", time: "09:00", title: "B"}]}]};
  const {trip: t1} = addStop(trip, {date: "2027-04-10"}, {title: "Park"}, "c");
  assert.deepEqual(t1.days[0].stops.map(s => s.id), ["a", "c", "b"]);
  const {trip: t2} = addStop(t1, {date: "2027-04-10"}, {title: "Dinner", time: "evening"}, "d");
  assert.deepEqual(t2.days[0].stops.map(s => s.id), ["a", "c", "b", "d"]);
});

test("a new stop gets an id of its own and goes in time order", () => {
  const trip = demo();
  const {trip: t2, ref} = addStop(trip, {date: DAY1}, {time: "11:15", title: "Sé", text: "", lat: 1, lng: 2});
  assert.ok(isStopId(ref.id));
  assert.notEqual(addStop(trip, {date: DAY1}, {title: "Sé"}).ref.id, ref.id, "random: the same title twice is two stops");
  assert.deepEqual(ids(t2, DAY1).slice(0, 4), [ID("comercio"), ID("se"), ref.id, ID("santa-luzia")]);
  assert.equal("text" in stopsOf(t2, DAY1)[2], false, "empty fields are left out");
  assert.equal(ids(trip, DAY1).length, 6, "the original is untouched");
  assert.equal(newId("Café São Jorge!", new Set()), "cafe-sao-jorge");
});

test("an edit keeps the id and the field order; a new time or day moves the stop", () => {
  const trip = demo();
  const se = stopsOf(trip, DAY1)[1];
  const same = updateStop(trip, {date: DAY1, id: ID("se")}, {...se, text: "New"}).trip;
  assert.deepEqual(Object.keys(stopsOf(same, DAY1)[1]), Object.keys(se));
  const later = updateStop(trip, {date: DAY1, id: ID("se")}, {...se, time: "12:45"}).trip;
  assert.deepEqual(ids(later, DAY1).slice(0, 4), [ID("comercio"), ID("santa-luzia"), ID("castelo"), ID("se")]);
  const moved = updateStop(trip, {date: DAY1, id: ID("se")}, se, {date: DAY2});
  assert.deepEqual(moved.ref, {date: DAY2, plan: null, id: ID("se")});
  assert.ok(ids(moved.trip, DAY2).includes(ID("se")));
});

test("a day is added after the last, its own fields changed, and removed; days merge by date", async () => {
  assert.equal(dayAfter("2027-05-17"), "2027-05-18");
  assert.equal(dayAfter("2028-02-28"), "2028-02-29");
  assert.equal(dayAfter("2027-12-31"), "2028-01-01");
  const base = await ensureVersion(ensureIds(demo()).trip);
  // The way the app adds one: a new day after the last, made with its first stop.
  const added = addStop(addDay(base, {date: "2027-05-18", city: "Porto", stops: []}), {date: "2027-05-18"}, {time: "10:00", title: "Last coffee"}).trip;
  assert.deepEqual(added.days.map(d => d.date).slice(-2), ["2027-05-17", "2027-05-18"]);
  assert.deepEqual(validateTrip(added).errors, []);
  assert.throws(() => addDay(base, {date: DAY1, stops: [{title: "x"}]}), /already a day/);
  // City, title, stay and notes; empty removes; stops stay, field order kept.
  const changed = updateDay(base, DAY2, {title: "Belém slowly", notes: [], stay: "Night train"});
  const d2 = changed.days.find(d => d.date === DAY2);
  assert.equal(d2.title, "Belém slowly");
  assert.equal(d2.notes, undefined);
  assert.equal(d2.stay, "Night train");
  assert.deepEqual(Object.keys(d2).slice(-1), ["stops"]);
  assert.deepEqual(ids(changed, DAY2), ids(base, DAY2));
  assert.throws(() => updateDay(base, DAY2, {stops: []}), /cannot change stops/);
  assert.equal(removeDay(base, DAY1).days.length, base.days.length - 1);
  assert.throws(() => removeDay({...base, days: [base.days[0]]}, DAY1), /at least one day/);
  // One phone adds the day, the other changes a stop: the merge has both, on both phones.
  const ours = await commit(added, base);
  const theirs = await commit(updateStop(base, {date: DAY1, plan: null, id: ID("se")}, {...stopsOf(base, DAY1)[1], time: "11:30"}).trip, base);
  const a = await commitMerge(mergeTrips(base, ours, theirs), ours, theirs), b = await commitMerge(mergeTrips(base, theirs, ours), theirs, ours);
  assert.equal(a.version.id, b.version.id);
  assert.equal(a.days.at(-1).date, "2027-05-18");
  assert.equal(stopsOf(a, DAY1).find(s => s.id === ID("se")).time, "11:30");
});

test("expenses get ids, stay in date order, and merge by id on both phones alike", async () => {
  const base = await ensureVersion(ensureIds(demo()).trip);
  assert.ok(base.expenses.every(x => x.id), "ids for expenses written without them");
  const {trip: added, id} = addExpense(base, {title: "Travel insurance", date: "2026-09-20", cost: 35, currency: undefined});
  assert.deepEqual(added.expenses.map(x => x.id)[0], id, "in date order");
  assert.deepEqual(Object.keys(added.expenses[0]), ["id", "title", "cost", "date"]);
  const changed = updateExpense(added, id, {title: "Travel insurance", date: "2027-03-20", cost: 30});
  assert.deepEqual(changed.expenses.map(x => x.title), ["Flights to Lisbon and back (invented)", "Casa do Exemplo, 3 nights (invented)", "Travel insurance"]);
  assert.equal(changed.expenses[2].id, id);
  assert.equal(removeExpense(removeExpense(base, base.expenses[0].id), base.expenses[1].id).expenses, undefined, "no empty list");
  assert.throws(() => updateExpense(base, "nope", {title: "x", cost: 1}), /no expense/);
  // One phone adds an expense, the other changes the cost of another: both, on both phones.
  const ours = await commit(added, base);
  const theirs = await commit(updateExpense(base, base.expenses[0].id, {...base.expenses[0], cost: 250}), base);
  const a = await commitMerge(mergeTrips(base, ours, theirs), ours, theirs), b = await commitMerge(mergeTrips(base, theirs, ours), theirs, ours);
  assert.equal(a.version.id, b.version.id);
  assert.deepEqual(a.expenses.map(x => x.cost).sort((x, y) => x - y), [35, 250, 390]);
  assert.deepEqual(validateTrip(a).errors, []);
  // the comparison sees a stop's cost as a change of its cost
  const priced = updateStop(base, {date: DAY1, plan: null, id: ID("se")}, {...stopsOf(base, DAY1)[1], cost: 12}).trip;
  assert.deepEqual(diffTrips(base, priced).changed[0].fields, ["cost"]);
});

test("stops without an id get one, and the old keys are reported so ticks can follow", () => {
  const trip = demo();
  delete stopsOf(trip, DAY1)[4].id;
  const {trip: fixed, renamed} = ensureIds(trip);
  // From its title, the way ids were made before, then the id that one becomes.
  const id = oldStopId("demo-lisbon", DAY1, "lunch-in-alfama");
  assert.equal(stopsOf(fixed, DAY1)[4].id, id);
  assert.deepEqual(renamed, [{date: DAY1, plan: null, from: "#4", to: id}, {date: DAY1, plan: null, from: "lunch-in-alfama", to: id}]);
});

/* ---------- receiving files and editing, as the app does ---------- */

import { prepare, saveEdit, inspect, apply, restore, moveMarks, fileName } from "../js/trips.js";
// What the app does on "Unisci", "Prendi" and so on: inspect, then apply the usual choice.
async function receive(versions, local, incoming, choice){
  const x = await inspect(versions, local, incoming);
  const trip = await apply(versions, x, choice || {diverged: "merge", newer: "take"}[x.kind]);
  return {...x, trip, report: counts(diffTrips(local, trip))};
}
import { versionStore } from "../js/objects.js";
import { memoryBackend } from "../js/store.js";

// The real version store, on the memory backend the app uses when storage is refused.
const memoryStore = () => versionStore(memoryBackend());

test("two phones edit the same trip; each one receiving the other's file ends on the same version", async () => {
  const phoneA = memoryStore(), phoneB = memoryStore();
  const {trip: root} = await prepare(demo());
  // Both load the same file, then each adds a stop.
  const a = (await saveEdit(phoneA, root, addStop(root, {date: DAY1}, {time: "12:15", title: "Gelato"}).trip)).trip;
  const b = (await saveEdit(phoneB, root, addStop(root, {date: DAY2}, {time: "13:00", title: "Lunch"}).trip)).trip;
  const onA = await receive(phoneA, a, b), onB = await receive(phoneB, b, a);
  assert.equal(onA.kind, "diverged");
  assert.equal(onA.base, true);
  assert.equal(onA.trip.version.id, onB.trip.version.id);
  assert.deepEqual(onA.report, {added: 1, changed: 0, removed: 0});
  // A sends the merged file back: B sees it as the same version.
  assert.equal((await receive(phoneB, onB.trip, onA.trip)).kind, "same");
});

test("a newer file replaces, an older one changes nothing", async () => {
  const store = memoryStore();
  const {trip: root} = await prepare(demo());
  const v2 = (await saveEdit(store, root, addStop(root, {date: DAY1}, {time: "12:15", title: "Gelato"}).trip)).trip;
  assert.equal((await receive(store, root, v2)).kind, "newer");
  const older = await receive(store, v2, root);
  assert.equal(older.kind, "older");
  assert.equal(older.trip, v2);
});

test("a merge without the base keeps both sides' stops", async () => {
  const {trip: root} = await prepare(demo());
  const a = await commit(removeStop(root, {date: DAY1, id: ID("castelo")}), root);
  const b = await commit(addStop(root, {date: DAY2}, {time: "13:00", title: "Lunch"}).trip, root);
  const r = await receive(memoryStore(), a, b);   // a phone that never saw the base
  assert.equal(r.base, false);
  assert.ok(ids(r.trip, DAY1).includes(ID("castelo")), "without the base the removal cannot be told from an addition");
  assert.ok(titles(r.trip, DAY2).includes("Lunch"));
});

test("a file edited by hand, with its old version left in, becomes a new version made from it", async () => {
  const store = memoryStore();
  const {trip: v1} = await prepare(demo());
  const byHand = JSON.parse(JSON.stringify(v1));
  stopsOf(byHand, DAY1)[0].time = "09:45";
  const {trip: v2} = await prepare(byHand);
  assert.notEqual(v2.version.id, v1.version.id);
  assert.deepEqual(v2.version.parents, [v1.version.id]);
  const r = await receive(store, v1, v2);
  assert.equal(r.kind, "newer");
  assert.equal(stopsOf(r.trip, DAY1)[0].time, "09:45");
  assert.equal((await prepare(v2)).trip.version.id, v2.version.id, "an intact file keeps its version");
});

test("saving without changes makes no version", async () => {
  const {trip: root} = await prepare(demo());
  const r = await saveEdit(memoryStore(), root, JSON.parse(JSON.stringify(root)));
  assert.equal(r.changed, false);
  assert.equal(r.trip, root);
});

test("marks follow a stop that gets an id or moves", () => {
  const state = {done: {[`${DAY1}||#4`]: 1}, skipped: {[`${DAY1}||se`]: 1}, plans: {}};
  const moved = moveMarks(state, [
    {date: DAY1, plan: null, from: "#4", to: "lunch-in-alfama"},
    {date: DAY1, plan: null, from: "se", to: "se", toDate: DAY2, toPlan: null}
  ]);
  assert.deepEqual(moved.done, {[`${DAY1}||lunch-in-alfama`]: 1});
  assert.deepEqual(moved.skipped, {[`${DAY2}||se`]: 1});
  assert.deepEqual(state.done, {[`${DAY1}||#4`]: 1}, "the original is untouched");
});

test("the file name carries the trip and the short version", async () => {
  const {trip} = await prepare(demo());
  assert.match(fileName(trip), /^demo-lisbon-[0-9a-f]{7}\.json$/);
});


/* ---------- choices: the file only, back to an older file, back to an earlier version ---------- */

test("using only the file drops this phone's changes, and an old copy cannot bring them back", async () => {
  const store = memoryStore();
  const {trip: root} = await prepare(demo());
  const mine = (await saveEdit(store, root, addStop(root, {date: DAY1}, {time: "12:15", title: "Wrong stop"}).trip)).trip;
  const theirs = await commit(addStop(root, {date: DAY2}, {time: "13:00", title: "Lunch"}).trip, root);
  const x = await inspect(store, mine, theirs);
  assert.equal(x.kind, "diverged");
  assert.deepEqual(x.mine.added.map(a => a.stop.title), ["Wrong stop"]);
  assert.deepEqual(x.theirs.added.map(a => a.stop.title), ["Lunch"]);
  const kept = await apply(store, x, "theirs");
  assert.ok(!titles(kept, DAY1).includes("Wrong stop"));
  assert.ok(titles(kept, DAY2).includes("Lunch"));
  assert.deepEqual([...kept.version.parents].sort(), [mine.version.id, theirs.version.id].sort());
  assert.equal((await inspect(store, kept, mine)).kind, "older", "the dropped version is already in the history");
  assert.equal((await apply(store, await inspect(store, mine, theirs), "cancel")).version.id, mine.version.id, "cancel keeps this phone's version");
});

test("back to an older file makes a new version with its content, newer for every phone", async () => {
  const store = memoryStore();
  const {trip: root} = await prepare(demo());
  const v2 = (await saveEdit(store, root, addStop(root, {date: DAY1}, {time: "12:15", title: "Wrong stop"}).trip)).trip;
  const x = await inspect(store, v2, root);
  assert.equal(x.kind, "older");
  const back = await apply(store, x, "back");
  assert.ok(!titles(back, DAY1).includes("Wrong stop"));
  assert.deepEqual(back.version.parents, [v2.version.id]);
  assert.equal((await inspect(memoryStore(), v2, back)).kind, "newer", "a phone that has v2 takes it");
});

test("restoring an earlier version undoes what came after, as a new version", async () => {
  const store = memoryStore();
  const {trip: v1} = await prepare(demo());
  const v2 = (await saveEdit(store, v1, addStop(v1, {date: DAY1}, {time: "12:15", title: "Gelato"}).trip)).trip;
  const v3 = (await saveEdit(store, v2, removeStop(v2, {date: DAY1, id: ID("castelo")}))).trip;
  const {trip: back} = await restore(store, v3, v1.version.id);
  assert.equal(canonical(diffTrips(v1, back)), canonical(diffTrips(v1, v1)), "same stops as v1");
  assert.deepEqual(back.version.history.slice(0, 3), [v3.version.id, v2.version.id, v1.version.id]);
  await assert.rejects(restore(store, v3, "0000000000000000"));
});

test("the comparison names what changed: added, removed, changed fields, moved", () => {
  const trip = demo();
  let next = addStop(trip, {date: DAY1}, {time: "12:15", title: "Gelato"}).trip;
  next = removeStop(next, {date: DAY1, id: ID("castelo")});
  const se = stopsOf(next, DAY1).find(s => s.id === ID("se"));
  next = updateStop(next, {date: DAY1, id: ID("se")}, {...se, time: "11:30", lat: 1, lng: 2}).trip;
  next = updateStop(next, {date: DAY1, id: ID("lunch")}, stopsOf(next, DAY1).find(s => s.id === ID("lunch")), {date: DAY2}).trip;
  const d = diffTrips(trip, next);
  assert.deepEqual(d.added.map(x => x.stop.title), ["Gelato"]);
  assert.deepEqual(d.removed.map(x => x.stop.id), [ID("castelo")]);
  assert.deepEqual(d.changed.map(x => [x.stop.id, x.fields]), [[ID("se"), ["time", "place"]]]);
  assert.deepEqual(d.moved.map(x => [x.stop.id, x.from.date, x.date]), [[ID("lunch"), DAY1, DAY2]]);
  assert.equal(d.other, false);
  assert.deepEqual(counts(d), {added: 1, changed: 2, removed: 1});
  const renamed = JSON.parse(JSON.stringify(trip)); renamed.title = "Other";
  assert.equal(diffTrips(trip, renamed).other, true);
  const reordered = JSON.parse(JSON.stringify(trip));
  reordered.days[0].stops[0] = Object.fromEntries(Object.entries(reordered.days[0].stops[0]).reverse());
  assert.equal(diffTrips(trip, reordered).changed.length, 0, "the order of fields is not a change");
});

test("the comparison names what changed besides the stops: which day, which of its parts, the trip's own", () => {
  const trip = demo();
  const next = JSON.parse(JSON.stringify(trip));
  next.days[0].notes = [...(next.days[0].notes || []), "Bring a jacket"];
  next.days[1].stay = "Another hotel";
  next.days[1].city = "Sintra";
  next.info = [...(next.info || []), {title: "Taxis", items: [{label: "Number", text: "123"}]}];
  next.title = "Lisbon, again";
  const d = diffTrips(trip, next);
  assert.equal(d.other, true);
  assert.deepEqual(d.days, [{date: trip.days[0].date, fields: ["notes"]}, {date: trip.days[1].date, fields: ["title", "stay"]}]);
  assert.deepEqual([...d.trip].sort(), ["info", "other"]);
  const fewer = JSON.parse(JSON.stringify(trip)); fewer.days.pop();
  assert.deepEqual(diffTrips(trip, fewer).days, [{date: trip.days.at(-1).date, fields: ["removed"]}]);
  assert.deepEqual(diffTrips(trip, trip).days, []);
});

import { separate, joinChanges } from "../js/trips.js";
import { unrelated } from "../js/version.js";
import { applyChanges, outline, CHANGES } from "../js/changes.js";

test("a file with the same id but no version in common is another trip, kept apart under a new id", async () => {
  const store = memoryStore();
  const {trip: mine} = await prepare(demo());
  // Someone else's trip with the same name and first day: the same id, its own history.
  const other = demo(); other.days[0].stops[0].title = "Breakfast somewhere else";
  const {trip: theirs} = await prepare(other);
  assert.equal(theirs.id, mine.id);
  const x = await inspect(store, mine, theirs);
  assert.deepEqual([x.kind, x.unrelated], ["diverged", true]);
  // The same trip changed on another phone shares its history: related.
  const edited = await commit(addStop(mine, {date: DAY1}, {time: "12:15", title: "Gelato"}).trip, mine);
  const changedHere = await commit(addStop(mine, {date: DAY2}, {time: "13:00", title: "Lunch"}).trip, mine);
  assert.equal(unrelated(edited, changedHere), false);
  assert.equal((await inspect(store, edited, changedHere)).unrelated, false);
  // Kept apart: the first free "<id>-n", a version made from the file's.
  const kept = await separate(store, theirs, new Set([mine.id, mine.id + "-2"]));
  assert.equal(kept.id, mine.id + "-3");
  assert.deepEqual(kept.version.parents, [theirs.version.id]);
  assert.equal(kept.days[0].stops[0].title, "Breakfast somewhere else");
});

test("changes written for an earlier version are applied there, and joined with what changed since", async () => {
  const store = memoryStore();
  const {trip: v1} = await prepare(demo());
  // The outline names the version; the phone changes the trip meanwhile.
  assert.match(outline(v1), new RegExp(`^Trip "[^"]+", id demo-lisbon, version ${v1.version.id}, 4 days`));
  const v2 = (await saveEdit(store, v1, addStop(v1, {date: DAY1}, {time: "12:15", title: "Gelato"}).trip)).trip;
  const data = {format: CHANGES, trip: "demo-lisbon", from: v1.version.id, changes: [
    {update: {day: DAY1, stop: "castelo", set: {tag: "Tickets online"}}},   // an outline from before: the id of before
    {add: {day: DAY2, stop: {time: "21:00", title: "Fado evening"}}}
  ]};
  const res = applyChanges(v1, data);
  assert.equal(res.ok, true, JSON.stringify(res.errors));
  const joined = await joinChanges(store, v2, v1, res.trip);
  assert.ok(titles(joined, DAY1).includes("Gelato"), "what the phone added stays");
  assert.ok(titles(joined, DAY2).includes("Fado evening"), "what the assistant added comes");
  assert.equal(stopsOf(joined, DAY1).find(s => s.id === ID("castelo")).tag, "Tickets online");
  assert.equal(joined.version.parents.length, 2, "a merge, in the history");
  assert.ok(joined.version.history.includes(v2.version.id));
  // Changes that change nothing: the phone's trip as it is.
  assert.equal(await joinChanges(store, v2, v1, v1), v2);
  // "from" must look like a version
  assert.match(applyChanges(v1, {...data, from: "abc"}).errors[0], /^from: must be the version named in the outline/);
});

test("canonical JSON never changes: the same text as the first way it was written, for any value", async () => {
  // The first version of canonical(), kept here as the reference: version ids depend on it.
  const reference = value => {
    if(Array.isArray(value)) return "[" + value.map(reference).join(",") + "]";
    if(value && typeof value === "object"){
      return "{" + Object.keys(value).filter(k => value[k] !== undefined).sort()
        .map(k => JSON.stringify(k) + ":" + reference(value[k])).join(",") + "}";
    }
    return JSON.stringify(value);
  };
  const demo = JSON.parse(readFileSync(new URL("../examples/demo-trip.json", import.meta.url), "utf8"));
  assert.equal(canonical(demo), reference(demo));
  // Random values, edge cases included: undefined in arrays and objects, null, nested.
  let seed = 7;
  const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const leaf = () => [null, undefined, true, false, 0, -1.5, 1e21, "", "a\"b\\c\n", "ünï ✈", NaN][rnd(11)];
  const value = depth => {
    if(depth > 4 || rnd(3) === 0) return leaf();
    if(rnd(2)) return Array.from({length: rnd(5)}, () => value(depth + 1));
    const o = {};
    for(let i = rnd(6); i > 0; i--) o[["z", "a", "id", "é", "10", "2", "__proto_", ""][rnd(8)] + rnd(3)] = value(depth + 1);
    return o;
  };
  for(let i = 0; i < 3000; i++){
    const v = value(0);
    assert.equal(canonical(v), reference(v), JSON.stringify(v));
  }
  assert.equal(canonical(undefined), reference(undefined));
  assert.equal(canonical([undefined, null, () => 1]), reference([undefined, null, () => 1]));
});

test("a move and a concurrent edit keep one edited stop on its new day", async () => {
  const root = await ensureVersion(demo());
  const ref = {date: DAY1, id: ID("se")}, stop = stopsOf(root, DAY1).find(s => s.id === ref.id);
  const moved = await commit(updateStop(root, ref, stop, {date: DAY2}).trip, root);
  const edited = await commit(updateStop(root, ref, {...stop, cost: 20}).trip, root);
  for(const [a, b] of [[moved, edited], [edited, moved]]){
    const merged = mergeTrips(root, a, b);
    assert.deepEqual(stopsOf(merged, DAY1).filter(s => s.id === ref.id), []);
    assert.deepEqual(stopsOf(merged, DAY2).filter(s => s.id === ref.id), [{...stop, cost: 20}]);
  }
});

// Every stop of a trip with where it is, plans included: an id is unique in its list only.
const placed = trip => trip.days.flatMap(d => d.plans ? d.plans.flatMap(p => p.stops.map(s => ({date: d.date, plan: p.id, stop: s}))) : d.stops.map(s => ({date: d.date, plan: null, stop: s})));
const copies = (trip, id) => placed(trip).filter(x => x.stop.id === id);

test("a stop moved on one side, and changed or moved elsewhere on the other: one copy, the same on both phones", async () => {
  const root = await ensureVersion(ensureIds(demo()).trip);
  const plain = root.days.filter(d => !d.plans).map(d => d.date);
  let n = 0;
  for(const x of placed(root).filter(y => !y.plan)) for(const to of plain.filter(d => d !== x.date)) for(const other of ["cost", "time", "elsewhere"]){
    const ref = {date: x.date, id: x.stop.id};
    const moved = await commit(updateStop(root, ref, x.stop, {date: to}).trip, root);
    const away = plain.find(d => d !== x.date && d !== to);
    if(other === "elsewhere" && !away) continue;
    const changed = await commit(other === "elsewhere" ? updateStop(root, ref, x.stop, {date: away}).trip
      : updateStop(root, ref, {...x.stop, ...(other === "cost" ? {cost: 99} : {time: "23:59"})}).trip, root);
    const a = mergeTrips(root, moved, changed), b = mergeTrips(root, changed, moved);
    assert.equal(canonical(a), canonical(b), "the same whichever phone joins");
    const got = copies(a, x.stop.id);
    assert.equal(got.length, 1, `${x.stop.id} to ${to}, ${other}: on ${got.map(g => g.date).join(", ")}`);
    if(other === "cost") assert.equal(got[0].stop.cost, 99);
    if(other === "time") assert.equal(got[0].stop.time, "23:59");
    if(other !== "elsewhere") assert.equal(got[0].date, to);
    assert.ok(validateTrip(a).ok);
    n++;
  }
  assert.ok(n > 20);
});

test("random pairs of edits: the join is the same on both phones, valid, and never makes a stop twice", async () => {
  // A small fixed generator: the same pairs on every run.
  const rnd = seed => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const edit = (trip, r) => {
    const plain = trip.days.filter(d => !d.plans), stops = placed(trip).filter(x => !x.plan);
    const pick = list => list[Math.floor(r() * list.length)];
    const k = r();
    if(!stops.length || k < .15) return addStop(trip, {date: pick(plain).date}, {time: "23:" + String(Math.floor(r() * 59)).padStart(2, "0"), title: "New " + Math.floor(r() * 1e6)}).trip;
    const x = pick(stops), ref = {date: x.date, id: x.stop.id};
    if(k < .5) return updateStop(trip, ref, x.stop, {date: pick(plain).date}).trip;
    if(k < .8) return updateStop(trip, ref, {...x.stop, cost: Math.floor(r() * 100)}).trip;
    return removeStop(trip, ref);
  };
  let n = 0;
  for(let seed = 1; seed <= 200; seed++){
    const r = rnd(seed), root = await ensureVersion(ensureIds(demo()).trip);
    let a = root, b = root;
    for(let i = 0; i < 1 + Math.floor(r() * 4); i++) a = await commit(edit(a, r), a);
    for(let i = 0; i < 1 + Math.floor(r() * 4); i++) b = await commit(edit(b, r), b);
    if(a.version.id === b.version.id) continue;
    const m = mergeTrips(root, a, b);
    assert.equal(canonical(m), canonical(mergeTrips(root, b, a)), "seed " + seed);
    assert.ok(validateTrip(m).ok, "seed " + seed);
    for(const id of new Set(placed(m).map(x => x.stop.id)))
      assert.ok(copies(m, id).length <= Math.max(copies(a, id).length, copies(b, id).length), `seed ${seed}: ${id} made twice`);
    n++;
  }
  assert.ok(n > 150);
});

import { historyText, keepHistory, olderVersions, isHistory, historyName } from "../js/trips.js";

test("a file with its history: another phone gets every version before it; a version that is not what its id says, or of another trip, is left out", async () => {
  const phoneA = memoryStore(), phoneB = memoryStore();
  const {trip: root} = await prepare(demo());
  await phoneA.put(root);
  const v1 = (await saveEdit(phoneA, root, addStop(root, {date: DAY1}, {time: "12:15", title: "Gelato"}).trip)).trip;
  const v2 = (await saveEdit(phoneA, v1, addStop(v1, {date: DAY2}, {time: "13:00", title: "Lunch"}).trip)).trip;
  const older = await olderVersions(phoneA, v2);
  assert.deepEqual(older.map(v => v.version.id), [v1.version.id, root.version.id], "newest first");
  const data = JSON.parse(historyText(v2, null, older));
  assert.ok(isHistory(data));
  assert.equal(historyName(v2), fileName(v2).replace(".json", "-history.json"));
  // Tampered with: a version whose content no longer is its id, and another trip's.
  const forged = {...JSON.parse(JSON.stringify(v1)), title: "Changed by hand"};
  const other = {...JSON.parse(JSON.stringify(root)), id: "another-trip"};
  data.versions.push(forged, other);
  const {trip, kept} = await keepHistory(phoneB, data);
  assert.equal(kept, 2, "the two real ones");
  assert.deepEqual((await phoneB.ids(v2.id)).sort(), [root.version.id, v1.version.id].sort());
  assert.equal((await phoneB.get(v2.id, v1.version.id)).title, v1.title, "the forged one did not replace it");
  assert.equal(trip.version.id, v2.version.id, "the trip, to load as any file");
});
