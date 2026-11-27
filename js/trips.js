// What happens to a trip when it changes: an edit on this phone, a file received, a
// return to an earlier version. It joins the pieces (js/edit.js, js/version.js,
// js/merge.js, js/diff.js) and keeps every version (js/objects.js). No DOM here.
//
// versions: {put(trip), get(tripId, id), ids(tripId)} — see versionStore in js/objects.js

import { validateTrip, upgrade, FORMAT } from "./trip.js";
import { ensureIds } from "./edit.js";
import { findStopId, needsStopIds } from "./ids.js";
import { ensureVersion, childOf, commit, commitMerge, relation, commonBase, isIntact, unrelated, canonical, contentOf } from "./version.js";
import { mergeTrips } from "./merge.js";
import { diffTrips } from "./diff.js";
import { withPrivate } from "./private.js";

/**
 * Makes a trip ready for versions: in format 2, with ids, with a version. Files
 * without them get them the same way on every device. `renamed` lists the stops that
 * got an id, so ticks saved under their old key can follow. A file in format 1 keeps
 * its version as the parent of the converted one.
 */
export async function prepare(trip){
  const {trip: withIds, renamed} = ensureIds(upgrade(trip));
  if(!withIds.version) return {trip: await ensureVersion(withIds), renamed};
  // A file edited by hand keeps the version it was made from, but its content changed,
  // so the id no longer matches: it becomes a new version made from the one it names.
  if(await isIntact(withIds)) return {trip: withIds, renamed};
  return {trip: await childOf(withIds, withIds.version), renamed};
}

// Keeps a version after checking it, and returns it.
async function keep(versions, trip){
  const check = validateTrip(trip);
  if(!check.ok) throw new Error(check.errors[0]);
  await versions.put(trip);
  return trip;
}

/** An edit made on this phone: a new version made from the current one. */
export async function saveEdit(versions, current, content){
  const next = await commit(content, current);
  if(next === current) return {trip: current, changed: false};
  await versions.put(current);
  return {trip: await keep(versions, next), changed: true};
}

/**
 * Back to an earlier version, the way git revert does it: a new version, made from the
 * current one, with the old content. Sent to another phone, it is newer than what that
 * phone has, so the change undone does not come back from there.
 */
export async function restore(versions, current, id){
  const old = await versions.get(current.id, id);
  if(!old) throw new Error("version not on this device: " + id);
  // A version from before the stops had ids of their own comes back with them.
  return saveEdit(versions, current, ensureIds(old, current).trip);
}

/**
 * A file received for a trip this phone already has: what it is, and what each choice
 * would give. Nothing changes on the phone yet; apply() does it.
 *   same      the same version
 *   newer     made from this phone's version: take it as it is
 *   older     this phone already has everything in it
 *   diverged  both changed: `merged` is the two joined; `theirs` and `mine` say what
 *             changed on each side since the version they shared (js/diff.js);
 *             `unrelated` when they share no version at all: two different trips with
 *             the same id, most likely (see separate)
 */
export async function inspect(versions, local, incoming){
  const kind = relation(local, incoming);
  await versions.put(local);
  await versions.put(incoming);
  if(kind !== "diverged") return {kind, local, incoming};
  const baseId = commonBase(local, incoming, new Set(await versions.ids(local.id)));
  const base = baseId ? await versions.get(local.id, baseId) : null;
  return {kind, local, incoming, base: !!base, unrelated: unrelated(local, incoming), merged: mergeTrips(base, local, incoming),
    theirs: diffTrips(base || local, incoming), mine: diffTrips(base || incoming, local)};
}

/**
 * Carries out a choice on what inspect() found, and returns the trip to keep.
 *   "merge"   the two joined, as a version with both as parents
 *   "theirs"  the file's content, as a version with both as parents (git merge -s theirs):
 *             what this phone drops cannot come back from an old copy of it
 *   "take"    a newer file, as it is
 *   "back"    an older file's content, as a new version made from this phone's one
 *   anything else keeps this phone's version
 */
export async function apply(versions, x, choice){
  if(choice === "merge" && x.kind === "diverged") return keep(versions, await commitMerge(x.merged, x.local, x.incoming));
  if(choice === "theirs" && x.kind === "diverged") return keep(versions, await commitMerge(x.incoming, x.local, x.incoming));
  if(choice === "take" && x.kind === "newer") return x.incoming;
  if(choice === "back" && x.kind === "older") return (await saveEdit(versions, x.local, x.incoming)).trip;
  return x.local;
}

/**
 * A file that shares no version with the trip of the same id, kept as a trip of its
 * own: under the first of "<id>-2", "<id>-3"… not in `taken`, as a version made from
 * the file's.
 */
export async function separate(versions, incoming, taken){
  const base = String(incoming.id).slice(0, 60);
  let n = 2, id;
  do id = `${base}-${n++}`; while(taken.has(id));
  return keep(versions, await childOf({...incoming, id}, incoming.version));
}

/**
 * Changes an assistant wrote for an earlier version of the trip, the one its outline
 * showed: `changed` is that version as the changes left it. It becomes a version made
 * from that one, joined with what changed on the phone since, as two files are.
 * @returns the trip to keep (this phone's, when the changes changed nothing)
 */
export async function joinChanges(versions, current, from, changed){
  if(canonical(contentOf(changed)) === canonical(contentOf(from))) return current;
  const branch = await childOf(changed, from.version);
  const x = await inspect(versions, current, branch);
  return apply(versions, x, x.kind === "diverged" ? "merge" : x.kind === "newer" ? "take" : "keep");
}

/**
 * Ticks and skips are saved under "date|plan|stop id". When stops get an id, or move
 * to another day or plan, their saved marks move with them.
 * moves: [{date, plan, from, to, toDate?, toPlan?}]
 */
export function moveMarks(state, moves){
  const out = {...state, done: {...state.done}, skipped: {...state.skipped}, plans: {...state.plans}};
  for(const m of moves){
    const from = `${m.date}|${m.plan || ""}|${m.from}`;
    const to = `${m.toDate || m.date}|${(m.toDate ? m.toPlan : m.plan) || ""}|${m.to}`;
    if(from === to) continue;
    for(const set of [out.done, out.skipped]){
      if(set[from]){ set[to] = set[from]; delete set[from]; }
    }
  }
  return out;
}

/**
 * A join an app of before made of a version with stop ids of before and a converted one:
 * it joined them without converting (a stop it changed kept twice, a removal undone), and
 * the service refused it. Made again with this app's join, which converts first; the
 * trip as it is when it is not such a join. Never sent: nobody else has it.
 * versions: as in inspect.
 */
export async function rejoin(versions, trip){
  const ps = (trip.version && trip.version.parents) || [];
  if(ps.length !== 2 || !needsStopIds(trip)) return trip;
  const [a, b] = await Promise.all(ps.map(id => versions.get(trip.id, id)));
  if(!a || !b || needsStopIds(a) === needsStopIds(b)) return trip;
  const baseId = commonBase(a, b, new Set(await versions.ids(trip.id)));
  const base = baseId ? await versions.get(trip.id, baseId) : null;
  const joined = await commitMerge(mergeTrips(base, a, b), a, b);
  await versions.put(joined);
  return joined;
}

/**
 * Ticks and skips saved under a stop's id of before, when the trip came with the ids it
 * became (converted on another phone, or on the service): moved to them.
 * @returns the state, the same object when nothing moved
 */
export function followIds(state, trip){
  const moves = [];
  for(const set of [state.done || {}, state.skipped || {}]) for(const key of Object.keys(set)){
    const [date, plan, id] = key.split("|");
    const d = trip.days.find(x => x.date === date);
    const list = !d ? null : d.plans ? (d.plans.find(p => p.id === plan) || {}).stops : plan ? null : d.stops;
    const to = list && !list.some(s => s.id === id) ? findStopId(trip, date, plan || null, list, id) : undefined;
    if(to) moves.push({date, plan: plan || null, from: id, to});
  }
  return moves.length ? moveMarks(state, moves) : state;
}

/** The name of the file to save: the trip's id and the version's short id. */
export function fileName(trip){
  return `${trip.id}-${String(trip.version.id).slice(0, 7)}.json`;
}

/**
 * The trip as a file: readable JSON, the version near the top. With `priv`, the
 * traveller's private expenses go at the end (js/private.js).
 */
export function fileText(trip, priv = null){
  return JSON.stringify(withPrivate(trip, priv), null, 1) + "\n";
}

/*
 * A trip with its history: the file as above, and the versions before it that this phone
 * has, to carry the whole history to another phone or address without an account. A
 * format of its own around the trip file, which stays as it is.
 */
export const HISTORY = "travel-in-my-pocket/history";
export const isHistory = data => !!data && typeof data === "object" && data.format === HISTORY;

/** The versions this phone has before the trip's own, newest first. */
export async function olderVersions(versions, trip){
  const here = new Set(await versions.ids(trip.id));
  const out = [];
  for(const id of trip.version.history) if(here.has(id)){ const v = await versions.get(trip.id, id); if(v) out.push(v); }
  return out;
}

/** The file of a trip with its history (`older`, from olderVersions). */
export function historyText(trip, priv, older){
  return JSON.stringify({format: HISTORY, trip: withPrivate(trip, priv), versions: older}, null, 1) + "\n";
}
export const historyName = trip => fileName(trip).replace(/\.json$/, "-history.json");

/**
 * The versions of a history file kept here, each only if it is a valid trip of the same
 * id, in the current format, whose id is the hash of its content: a file cannot slip
 * another trip into a history. The trip file inside, to load as any file; how many kept.
 */
export async function keepHistory(versions, data){
  const trip = data.trip;
  let kept = 0;
  for(const v of Array.isArray(data.versions) ? data.versions : []){
    if(!v || !trip || v.id !== trip.id || v.format !== FORMAT || !validateTrip(v).ok || !(await isIntact(v))) continue;
    await versions.put(v);
    kept++;
  }
  return {trip, kept};
}
