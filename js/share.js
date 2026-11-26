// The app's side of the sharing service: the account, kept on this phone, and calls to
// the service as js/share-api.js describes them. Without SHARE_URL (js/config.js) none
// of this runs and nothing leaves the phone.
//
// Signing up and in uses a passkey (WebAuthn): the phone makes a key that never leaves
// it, opened with a fingerprint, the face or the PIN; the service keeps only its public
// half. No password anywhere.

import { SHARE_URL } from "./config.js";
import { getKV, setKV, delKV } from "./store.js";
import { ROUTES, TERMS, pathOf, checkAnswer } from "./share-api.js";

const SESSION = "share:session";

/** Whether this copy of the app has a sharing service. */
export const hasService = () => !!SHARE_URL;

/** The address a chat app (Claude, ChatGPT…) is given to add TIMP as a connector. */
export const connectorAddress = () => SHARE_URL + "/mcp";

/** An error of the service: its status and its sentence (js/share-api.js, shape `error`). */
export class ShareError extends Error {
  constructor(status, message, current){
    super(message);
    this.status = status;
    this.current = current;
  }
}

/** The account on this phone: {token, user} or null. */
export async function session(){
  try{
    const s = await getKV(SESSION);
    return s && s.token && s.user ? s : null;
  }catch(e){ return null; }
}

/**
 * A route of the contract. Its answer is checked against the contract: anything else is
 * an error, never something half understood.
 */
export async function call(name, {params = {}, body, token} = {}){
  const r = ROUTES[name];
  const headers = {"Content-Type": "application/json"};
  if(r.auth){
    const s = token ? {token} : await session();
    if(!s) throw new ShareError(401, "sign in first");
    headers.Authorization = "Bearer " + s.token;
  }
  let res;
  try{
    res = await fetch(SHARE_URL + pathOf(name, params), {method: r.method, headers, body: r.body ? JSON.stringify(body || {}) : undefined, credentials: "omit"});
  }catch(e){ throw new ShareError(0, "offline"); }
  let data = null;
  try{ data = await res.json(); }catch(e){}
  if(!res.ok){
    // A session the service no longer knows is gone here too.
    if(res.status === 401 && r.auth && !token) await delKV(SESSION).catch(() => {});
    throw new ShareError(res.status, data && typeof data.error === "string" ? data.error : `error ${res.status}`, data && data.current);
  }
  const problems = checkAnswer(name, data);
  if(problems.length) throw new ShareError(502, "the service answered outside the contract: " + problems[0]);
  return data;
}

/* ---------- passkeys: JSON on the wire, bytes for the browser ---------- */

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const bytes = s => Uint8Array.from(atob(String(s).replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

/** WebAuthn options as the service sends them (base64url) → as navigator.credentials wants them. */
export function creationOptions(o){
  return {...o, challenge: bytes(o.challenge), user: {...o.user, id: bytes(o.user.id)},
    excludeCredentials: (o.excludeCredentials || []).map(c => ({...c, id: bytes(c.id)}))};
}
export function requestOptions(o){
  return {...o, challenge: bytes(o.challenge), allowCredentials: (o.allowCredentials || []).map(c => ({...c, id: bytes(c.id)}))};
}

/** A new or used passkey as JSON for the service: toJSON() where the phone has it. */
export function credentialJSON(c){
  if(typeof c.toJSON === "function"){
    try{ return c.toJSON(); }catch(e){}
  }
  const r = c.response, out = {id: c.id, rawId: b64url(c.rawId), type: c.type, authenticatorAttachment: c.authenticatorAttachment || undefined,
    clientExtensionResults: c.getClientExtensionResults ? c.getClientExtensionResults() : {}};
  if(r.attestationObject){
    const key = r.getPublicKey && r.getPublicKey();
    out.response = {clientDataJSON: b64url(r.clientDataJSON), attestationObject: b64url(r.attestationObject),
      authenticatorData: r.getAuthenticatorData ? b64url(r.getAuthenticatorData()) : undefined,
      publicKey: key ? b64url(key) : undefined, publicKeyAlgorithm: r.getPublicKeyAlgorithm ? r.getPublicKeyAlgorithm() : undefined,
      transports: r.getTransports ? r.getTransports() : []};
  }else{
    out.response = {clientDataJSON: b64url(r.clientDataJSON), authenticatorData: b64url(r.authenticatorData), signature: b64url(r.signature),
      userHandle: r.userHandle ? b64url(r.userHandle) : undefined};
  }
  return out;
}

// The person closed the passkey prompt, or the phone refused: not an error to report.
const cancelled = e => e && (e.name === "NotAllowedError" || e.name === "AbortError");

async function keep(s){
  await setKV(SESSION, {token: s.token, user: s.user});
  return s.user;
}

// The account as the service answers it now, kept with the session.
async function keepUser(user){
  const s = await session();
  if(s) await setKV(SESSION, {...s, user});
  return user;
}

/** The signed-in account as the service has it now: its terms accepted, or not yet. */
export const whoAmI = async () => keepUser(await call("me"));

/** The current terms of use and privacy policy accepted (TERMS): the account, as now. */
export const acceptTerms = async () => keepUser(await call("acceptTerms", {body: {terms: TERMS}}));

/** A new account: a sign-up code, a handle, the terms accepted, a passkey. The user, or null if the person cancelled. */
export async function signUp(code, handle){
  const opt = await call("registerOptions", {body: {code, handle, terms: TERMS}});
  let cred;
  try{ cred = await navigator.credentials.create({publicKey: creationOptions(opt.publicKey)}); }
  catch(e){ if(cancelled(e)) return null; throw e; }
  return keep(await call("register", {body: {challengeId: opt.challengeId, credential: credentialJSON(cred)}}));
}

/** Signing in with a passkey of this app. The user, or null if the person cancelled. */
export async function signIn(){
  const opt = await call("loginOptions", {body: {}});
  let cred;
  try{ cred = await navigator.credentials.get({publicKey: requestOptions(opt.publicKey)}); }
  catch(e){ if(cancelled(e)) return null; throw e; }
  return keep(await call("login", {body: {challengeId: opt.challengeId, credential: credentialJSON(cred)}}));
}

/** Signing out: the session ends on the service (if it can be reached) and here. */
export async function signOut(){
  const s = await session();
  if(s) await call("logout", {token: s.token}).catch(() => {});
  await delKV(SESSION).catch(() => {});
}

/** The service as js/sync.js uses it: the routes of the contract, with this phone's session. */
export function serviceApi(){
  return {
    list: async () => (await call("trips")).trips,
    create: trip => call("createTrip", {body: {trip}}),
    push: (id, trip) => call("push", {params: {id}, body: {trip}}),
    version: (id, version) => call("version", {params: {id, version}}),
    getPrivate: id => call("getPrivate", {params: {id}}),
    putPrivate: (id, data, rev) => call("putPrivate", {params: {id}, body: {data, rev}}),
    getGroup: id => call("getGroup", {params: {id}}),
    putGroup: (id, where, ticks) => call("putGroup", {params: {id}, body: {where, ticks}}),
    markGroup: (id, done, skipped) => call("markGroup", {params: {id}, body: {done, skipped}})
  };
}

/** The owner deletes a trip from the account: gone for every phone and every person. */
/** A trip's versions as the service has them: who sent each, and with which chat app. */
export const tripHistory = async id => (await call("history", {params: {id}})).versions;

export const deleteFromAccount = id => call("deleteTrip", {params: {id}});

/** The owner locks a trip on the account at its version, or unlocks it: its summary. */
export const lockOnAccount = (id, locked) => call("lockTrip", {params: {id}, body: {locked}});

/** Leaves a trip someone shared with this account. */
export const leaveTrip = (id, userId) => call("removeMember", {params: {id, user: userId}});

/* ---------- chat apps (Claude, ChatGPT…) ---------- */

// A chat app sends the person to the app with #authorize=<id>: they answer here, signed
// in with their passkey, and the page goes back to the chat app with the answer.

const LOOPBACK = ["localhost", "127.0.0.1", "[::1]"];

/** The id of a chat app's request in the app's address, or "". */
export function chatRequestId(hash){
  const m = /^#authorize=([A-Za-z0-9_-]{16,128})$/.exec(hash || "");
  return m ? m[1] : "";
}

/** Whether an answer goes to a program on this computer (Claude Code…), not to a site. */
export const onThisComputer = host => LOOPBACK.includes(host);

/** Where the page may go with the answer: a site over https, or this computer. "" otherwise. */
export function chatAddress(redirect){
  let u;
  try{ u = new URL(redirect); }catch(e){ return ""; }
  return u.protocol === "https:" || (u.protocol === "http:" && onThisComputer(u.hostname)) ? u.href : "";
}

/** What a chat app asks: {client, redirectHost, scopes, expires}. */
export const chatRequest = id => call("oauthRequest", {body: {request: id}});

/** The person's answer, yes (with what they allow, all asked if not said) or no: the chat app's address to go to now. */
export async function answerChat(id, yes, scopes){
  const {redirect} = await call(yes ? "oauthApprove" : "oauthDeny", {body: {request: id, ...(yes && scopes ? {scopes} : {})}});
  const to = chatAddress(redirect);
  if(!to) throw new ShareError(502, "redirect: not a chat app's address");
  return to;
}

/** The chat apps that can reach the trips: [{id, client, scopes, since, lastUsed}]. */
export const linkedApps = async () => (await call("linkedApps")).apps;

/** Ends a chat app's link: its keys stop working at once. */
export const unlinkApp = id => call("unlinkApp", {params: {id}});

/* ---------- the person's data ---------- */

/** Everything the service keeps about the account, readable. */
export const exportAccount = () => call("exportAccount");

/**
 * Deletes the account for good: the handle written again by the person, and a passkey
 * of the account used now (the phone asks for the fingerprint, face or PIN). true when
 * done (this phone is signed out), null if the person closed the passkey prompt.
 */
export async function deleteAccount(handle){
  const opt = await call("loginOptions", {body: {}});
  let cred;
  try{ cred = await navigator.credentials.get({publicKey: requestOptions(opt.publicKey)}); }
  catch(e){ if(cancelled(e)) return null; throw e; }
  await call("deleteAccount", {body: {handle, challengeId: opt.challengeId, credential: credentialJSON(cred)}});
  await delKV(SESSION).catch(() => {});
  return true;
}

/* ---------- who can get in: passkeys and devices ---------- */

/** The account's passkeys: [{id, device, added, lastUsed}]. */
export const passkeys = async () => (await call("passkeys")).passkeys;

/** The devices signed in: [{id, device, since, current}]. */
export const openSessions = async () => (await call("sessions")).sessions;

/** Every other device signed out; this one stays. */
export const endOtherSessions = () => call("endOtherSessions", {body: {}});

/** A passkey off the account (never its last one). Needs a recent sign-in. */
export const removePasskey = id => call("removePasskey", {params: {id}});

/**
 * A passkey of the account made on this device: true when added, null if the person
 * closed the prompt. Needs a recent sign-in. A device that has one already says so
 * (409 "passkey: already on this device").
 */
export async function addPasskey(){
  const opt = await call("addPasskeyOptions", {body: {}});
  let cred;
  try{ cred = await navigator.credentials.create({publicKey: creationOptions(opt.publicKey)}); }
  catch(e){
    if(cancelled(e)) return null;
    if(e && e.name === "InvalidStateError") throw new ShareError(409, "passkey: already on this device");
    throw e;
  }
  await call("addPasskey", {body: {challengeId: opt.challengeId, credential: credentialJSON(cred)}});
  return true;
}

/** The recovery codes: {made, left}, never the codes. */
export const recoveryState = () => call("recovery");

/** Ten new recovery codes, shown this once; the old ones stop working. Needs a recent sign-in. */
export const makeRecoveryCodes = async () => (await call("makeRecovery", {body: {}})).codes;

/**
 * Every passkey lost: the handle and a recovery code, then a new passkey made on this
 * phone, which signs in (every other device signed out). The user, or null if the
 * person closed the prompt (the code is then not used).
 */
export async function recoverAccount(handle, code){
  const opt = await call("recoverOptions", {body: {handle, code}});
  let cred;
  try{ cred = await navigator.credentials.create({publicKey: creationOptions(opt.publicKey)}); }
  catch(e){ if(cancelled(e)) return null; throw e; }
  return keep(await call("recover", {body: {challengeId: opt.challengeId, credential: credentialJSON(cred)}}));
}

/** The service wants a sign-in of the last minutes for this (a passkey added or taken off). */
export const needsSignIn = e => e instanceof ShareError && e.status === 403 && /^sign in again/.test(e.message);

/**
 * The passkey asked again, now: a fresh session for the same account, the old one
 * ended. true when done, null if the person closed the prompt; a passkey of another
 * account changes nothing (403 "passkey: another account's").
 */
export async function signInAgain(){
  const old = await session();
  if(!old) throw new ShareError(401, "sign in first");
  const opt = await call("loginOptions", {body: {}});
  let cred;
  try{ cred = await navigator.credentials.get({publicKey: requestOptions(opt.publicKey)}); }
  catch(e){ if(cancelled(e)) return null; throw e; }
  const s = await call("login", {body: {challengeId: opt.challengeId, credential: credentialJSON(cred)}});
  if(s.user.id !== old.user.id){
    await call("logout", {token: s.token}).catch(() => {});
    throw new ShareError(403, "passkey: another account's");
  }
  await keep(s);
  await call("logout", {token: old.token}).catch(() => {});
  return true;
}

/* ---------- publishing a trip ---------- */

/** The page of a published trip: on the service, readable with or without the app. */
export const pageUrl = page => SHARE_URL + "/t/" + page;

/** Publishes the account's version of a trip (or one named), with the choices made: the publication. */
export const publishTrip = (id, {version, dates, remove}) => call("publishTrip", {params: {id}, body: {...(version ? {version} : {}), dates, remove}});

/** A published trip, for anyone: {trip, by, dates, publishedAt, updatedAt}. */
export const publicTrip = page => call("publicTrip", {params: {page}});

/** The forecast of a place, "38.7,-9.1" (js/weather.js): nothing about who asks. */
export const weatherOf = place => { const [lat, lng] = place.split(","); return call("weather", {params: {lat, lng}}); };

/** A page's way into the app: "#public=<page>" (open it, read only) or "#base=<page>" (a copy). */
export function publicLink(hash){
  const m = /^#(public|base)=([a-z2-9]{14})$/.exec(String(hash || ""));
  return m ? {kind: m[1], page: m[2]} : null;
}

/** Withdraws the page: it answers "withdrawn" from now on. */
export const unpublishTrip = id => call("unpublishTrip", {params: {id}});

/* ---------- sharing a trip ---------- */

// The owner invites one person: a link with a token, for one person, for 14 days. The
// token travels in the address's fragment (#invite=…), which no server ever sees, and is
// sent to the service in a body, never in an address.

/** The id of an invite in the app's address (#invite=…), or "". */
export function inviteToken(hash){
  const m = /^#invite=([A-Za-z0-9_-]{16,128})$/.exec(hash || "");
  return m ? m[1] : "";
}
/** The link to send: this app's address with the invite. */
export const inviteLink = token => location.origin + location.pathname + "#invite=" + token;

export const createInvite = (id, role) => call("invite", {params: {id}, body: {role}});
export const pendingInvites = async id => (await call("invites", {params: {id}})).invites;
export const revokeInvite = (id, invite) => call("revokeInvite", {params: {id, invite}});
export const tripMembers = async id => (await call("members", {params: {id}})).members;
export const acceptInvite = token => call("acceptInvite", {body: {token}});
