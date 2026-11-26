// The account's sheets: the form to make an account with the sharing service (a sign-up
// code, a handle, a passkey), and the chat apps linked to it. They only collect and ask
// js/share.js; what happens after is the caller's.

import { t, getLang } from "./i18n.js";
import { esc } from "./util.js";
import { REPO_URL } from "./config.js";
import { openSheet, row, rowValue } from "./sheet.js";
import { ask } from "./ask.js";
import { signUp, ShareError, linkedApps, unlinkApp, passkeys, openSessions, endOtherSessions, removePasskey, addPasskey, needsSignIn, signInAgain,
  recoveryState, makeRecoveryCodes, recoverAccount, connectorAddress, startLink, linkState, finishLink, lookLink, approveLink } from "./share.js";

const FINGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6.5 8.5a6.5 6.5 0 0111.6-2.4M18.9 9.2c.4 1.6.4 3.3.1 4.8M5.6 11.5v2.2c0 2.6 1 5 2.7 6.8"/><path d="M8.6 12v1.7a8.6 8.6 0 002.2 5.8M12 9.8a2.3 2.3 0 012.3 2.3v1.6c0 1.6.4 3.1 1.2 4.4"/><path d="M12 13v.8a11 11 0 001.7 5.9"/></svg>';

/** What the service said, for people: its known sentences in the app's language. */
export function accountError(e){
  if(!(e instanceof ShareError)) return t("accountFailed");
  if(e.status === 0) return t("accountOffline");
  if(/^code:/.test(e.message)) return t("codeInvalid");
  if(/^handle: already/.test(e.message)) return t("handleTaken");
  if(/^handle:/.test(e.message)) return t("handleBad");
  if(/^passkey: already on this device/.test(e.message)) return t("passkeyHere");
  if(/^passkey: another account/.test(e.message)) return t("passkeyOther");
  if(/^recovery:/.test(e.message)) return t("recoverBad");
  if(/^link:/.test(e.message)) return t("linkEnded");
  if(e.status === 429 || e.status === 503) return t("accountBusy");
  return t("accountFailed");
}

/**
 * Opens the form.
 * @param {object} o
 *   onDone(user)   the account was made and this phone is signed in
 *   onSignIn()     the person has an account already
 *   onRecover()    the person lost every passkey and has a recovery code
 */
// The terms of use and the privacy policy, in the app's language (docs/terms.md,
// docs/privacy.md and their Italian twins), opened apart from the app.
export const legalUrl = name => `${REPO_URL || "https://github.com/Frafal/TIMP"}/blob/main/docs/${name}${getLang() === "it" ? ".it" : ""}.md`;
const legalLink = (name, label) => `<a href="${esc(legalUrl(name))}" target="_blank" rel="noopener">${esc(label)}</a>`;
// A sentence of the strings with the two documents as links in it.
const agreeText = key => esc(t(key, {terms: "\u0001", privacy: "\u0002"})).replace("\u0001", legalLink("terms", t("termsWord"))).replace("\u0002", legalLink("privacy", t("privacyWord")));

/**
 * The terms changed, or the account was made before they were asked: read and accept
 * them to go on as before. onAccept() saves the acceptance; closed without, asked again
 * next time.
 */
export function openTerms({onAccept}){
  const dlg = openSheet({id: "terms-title", title: t("termsTitle"), body: `
    <p>${agreeText("termsNew")}</p>
    <p class="errbox" data-error role="alert" hidden></p>
    <div class="sheet-actions"><span class="grow"></span><button type="button" class="btn" data-close>${esc(t("termsLater"))}</button><button type="button" class="btn primary" data-accept>${esc(t("termsAccept"))}</button></div>`});
  dlg.addEventListener("click", async e => {
    const b = e.target.closest("[data-accept]");
    if(!b) return;
    b.disabled = true;
    try{ await onAccept(); dlg.close(); }
    catch(err){ const box = dlg.querySelector("[data-error]"); box.textContent = accountError(err); box.hidden = false; b.disabled = false; }
  });
  return dlg;
}

export function openSignUp(o){
  const dlg = openSheet({id: "acct-title", title: t("signUpTitle"), form: true, body: `
    <p class="foot">${esc(t("accountHelp"))}</p>
    <div class="field">
      <label for="acct-code">${esc(t("fSignupCode"))}</label>
      <input id="acct-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD-EFGH-…">
    </div>
    <div class="field">
      <label for="acct-handle">${esc(t("fHandle"))}</label>
      <input id="acct-handle" type="text" autocomplete="username webauthn" autocapitalize="off" spellcheck="false" maxlength="30">
      <p class="foot">${esc(t("fHandleHelp"))}</p>
    </div>
    <div class="passkey">${FINGER}<span>${esc(t("passkeyHelp"))}</span></div>
    <label class="agree"><input type="checkbox" id="acct-terms"><span>${agreeText("agreeTerms")}</span></label>
    <p class="errbox" data-error role="alert" hidden></p>
    <p class="foot"><button type="button" class="tbtn" data-recover>${esc(t("lostPasskey"))}</button></p>
    <div class="sheet-actions">
      <button type="button" class="btn" data-signin>${esc(t("haveAccount"))}</button>
      <span class="grow"></span>
      <button type="submit" class="btn primary">${esc(t("createPasskey"))}</button>
    </div>`});
  const $ = sel => dlg.querySelector(sel);
  const fail = (text, focus) => { const box = $("[data-error]"); box.textContent = text; box.hidden = false; if(focus) $(focus).focus(); };
  dlg.addEventListener("click", e => {
    if(e.target.closest("[data-signin]")){ dlg.close(); o.onSignIn(); }
    else if(e.target.closest("[data-recover]")){ dlg.close(); o.onRecover(); }
  });
  $("form").addEventListener("submit", async e => {
    e.preventDefault();
    const code = $("#acct-code").value.trim(), handle = $("#acct-handle").value.trim();
    if(!code) return fail(t("codeRequired"), "#acct-code");
    if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,29}$/.test(handle)) return fail(t("handleBad"), "#acct-handle");
    if(!$("#acct-terms").checked) return fail(t("termsRequired"), "#acct-terms");
    const go = $("[type=submit]");
    go.disabled = true;
    try{
      const user = await signUp(code, handle);
      if(user){ dlg.close(); o.onDone(user); }
    }catch(err){
      fail(accountError(err), /^handle/.test(err && err.message) ? "#acct-handle" : /^code/.test(err && err.message) ? "#acct-code" : null);
    }finally{ go.disabled = false; }
  });
  $("#acct-code").focus();
}

/**
 * The chat apps (Claude, ChatGPT…) that can reach the trips, each with what it can do,
 * since when, when last used, and Unlink: its keys stop working at once.
 * @param toast  says something short over the page
 */
export async function openLinkedApps(toast){
  // Linking, for the chat app chosen (AI2): its steps, the address, what to ask it.
  const APPS = [["claude", "Claude"], ["chatgpt", "ChatGPT"], ["other", t("otherApp")]];
  const steps = app => [t({claude: "linkStepClaude", chatgpt: "linkStepChatgpt", other: "linkStepOther"}[app]), t("linkStepPaste")];
  const dlg = openSheet({id: "chats-title", title: t("chatsTitle"), cls: "tall", body: `
    <p class="foot">${esc(t("chatsHelp"))}</p>
    <div class="srows" data-chats aria-busy="true"><p class="foot">…</p></div>
    <button type="button" class="tbtn" data-link-another hidden>${esc(t("linkAnother"))}</button>
    <section class="connect" data-connect hidden>
      <div class="seg" role="group" aria-label="${esc(t("linkApp"))}">${APPS.map(([id, name], i) => `<button type="button" data-link-app="${id}" aria-pressed="${i === 0}">${esc(name)}</button>`).join("")}</div>
      <ol class="steps" data-link-steps>${steps("claude").map(x => `<li>${esc(x)}</li>`).join("")}</ol>
      <code class="addr" data-connector aria-label="${esc(t("connectAddress"))}">${esc(connectorAddress())}</code>
      <button type="button" class="btn primary" data-copy-connector>${esc(t("copyAddress"))}</button>
      <p class="foot">${esc(t("linkAsk"))}</p>
      <p class="say-this">${esc(t("linkAskExample"))}</p>
    </section>`});
  const $ = sel => dlg.querySelector(sel), $list = $("[data-chats]");
  const when = d => new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"}).format(new Date(d));
  const day = d => new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "short"}).format(new Date(d));
  const can = scopes => t(scopes.includes("trips:write") ? (scopes.includes("trips:read") ? "chatsReadWrite" : "chatsWrite") : "chatsRead")
    + (scopes.some(s => s.startsWith("private:")) ? t("chatsPrivate") : "");
  let apps = [];
  // A row per chat linked, Unlink inside it; none, the way to link one, open.
  const draw = () => {
    $list.removeAttribute("aria-busy");
    $list.hidden = !apps.length;
    $list.innerHTML = apps.map((a, i) => `<div class="srow" data-chat="${esc(a.id)}"><button type="button" class="dhead set" aria-expanded="false" aria-controls="row-chat-${i}"><span>${esc(a.client)}</span><span class="v">${esc(t("chatsUsed", {d: day(a.lastUsed)}))}</span></button>` +
      `<div class="dbody" id="row-chat-${i}" hidden><p class="foot">${esc([can(a.scopes), t("chatsSince", {d: when(a.since)}), t("chatsUsed", {d: when(a.lastUsed)})].join(" · "))}</p>` +
      `<button type="button" class="tbtn danger" data-unlink="${esc(a.id)}">${esc(t("chatUnlinkNamed", {app: a.client}))}</button></div></div>`).join("");
    $("[data-link-another]").hidden = !apps.length || !$("[data-connect]").hidden;
    if(!apps.length) $("[data-connect]").hidden = false;
  };
  const failed = e => { $list.removeAttribute("aria-busy"); $list.innerHTML = `<p class="errbox" role="alert">${esc(accountError(e))}</p>`; };
  dlg.addEventListener("click", async e => {
    if(e.target.closest("[data-close]")) return;
    const app = e.target.closest("[data-link-app]");
    if(app){
      dlg.querySelectorAll("[data-link-app]").forEach(b => b.setAttribute("aria-pressed", String(b === app)));
      $("[data-link-steps]").innerHTML = steps(app.dataset.linkApp).map(x => `<li>${esc(x)}</li>`).join("");
      return;
    }
    if(e.target.closest("[data-link-another]")){ $("[data-connect]").hidden = false; $("[data-link-another]").hidden = true; return; }
    if(e.target.closest("[data-copy-connector]")){
      const field = $("[data-connector]");
      await navigator.clipboard.writeText(field.textContent).then(() => toast(t("connectCopied")), () => getSelection().selectAllChildren(field));
      return;
    }
    const b = e.target.closest("[data-unlink]");
    if(!b) return;
    const one = apps.find(a => a.id === b.dataset.unlink);
    if(!one) return;
    const yes = await ask({title: t("chatUnlinkQ", {app: one.client}), text: t("chatUnlinkText"),
      actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("chatUnlink"), kind: "danger"}]});
    if(yes !== "yes") return;
    b.disabled = true;
    try{
      await unlinkApp(one.id);
      apps = apps.filter(a => a.id !== one.id);
      draw();
      toast(t("chatUnlinked", {app: one.client}));
    }catch(err){ b.disabled = false; toast(accountError(err)); }
  });
  // The sheet is open and tall already (SH2): the list arrives inside it.
  await linkedApps().then(list => { apps = list; draw(); }, failed);
  return dlg;
}

/** A browser's User-Agent in a few words, "iPhone · Safari", "" if nothing is recognised. */
export function deviceName(ua){
  ua = String(ua || "");
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /CrOS/.test(ua) ? "ChromeOS"
    : /Macintosh|Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  // The order matters: Edge, Opera and Samsung say Chrome too, and Chrome says Safari.
  const app = /Edg(A|iOS)?\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Chrome|CriOS/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "";
  return [os, app].filter(Boolean).join(" · ");
}

// Some things need a sign-in of the last minutes (the service says "sign in again"):
// adding or taking off a passkey, recovery codes, linking a chat app. The passkey is
// asked again, then the thing is done. A passkey to make needs a tap of its own
// (browsers allow one passkey prompt per tap): `again` labels it. null if the person
// stopped.
export async function recently(fn, again){
  try{ return await fn(); }
  catch(e){
    if(!needsSignIn(e)) throw e;
    const go = await ask({title: t("itsYouQ"), text: t("itsYouText"), actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("usePasskey"), kind: "primary"}]});
    if(go !== "yes" || !(await signInAgain())) return null;
    if(again && await ask({title: t("itsYouDone"), actions: [{id: "no", label: t("cancel")}, {id: "yes", label: again, kind: "primary"}]}) !== "yes") return null;
    return fn();
  }
}

/**
 * Who can get in: the account's passkeys (one more on this device, one taken off, never
 * the last), the recovery codes (made, shown once) and the devices signed in (all the
 * others signed out in one go).
 * @param o.toast  says something short over the page
 * @param o.save   save(file, title): gives a file to the person (share sheet or download)
 * @param o.handle the account's handle, for the codes' file
 */
export async function openDevices({toast, save, handle}){
  const dlg = openSheet({id: "devices-title", title: t("devicesTitle"), cls: "devices tall", body: `<div class="srows">
    ${row("keys", t("passkeysTitle"), `<p class="foot">${esc(t("passkeysHelp"))}</p>
      <div class="chats" data-keys aria-busy="true"><p class="foot">…</p></div>
      <button type="button" class="tbtn" data-add-key>${FINGER}${esc(t("addPasskey"))}</button>
      <button type="button" class="tbtn" data-approve>${esc(t("approvePhone"))}</button>`)}
    ${row("codes", t("recoveryTitle"), `<p class="foot" data-recovery>…</p>
      <button type="button" class="tbtn" data-make-codes hidden></button>
      <div class="codes" data-codes hidden>
        <textarea readonly rows="10" spellcheck="false" aria-label="${esc(t("recoveryTitle"))}"></textarea>
        <p class="foot">${esc(t("recoveryKeep"))}</p>
        <div class="sheet-actions"><button type="button" class="btn" data-copy-codes>${esc(t("copyLink"))}</button><button type="button" class="btn primary" data-save-codes>${esc(t("recoverySave"))}</button></div>
      </div>`)}
    ${row("sessions", t("sessionsTitle"), `<div class="chats" data-sessions aria-busy="true"><p class="foot">…</p></div>
      <button type="button" class="tbtn danger" data-end-others hidden>${esc(t("endOthers"))}</button>`)}
    </div>`});
  const $ = sel => dlg.querySelector(sel);
  // The year only when it is not this one.
  const when = d => new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    ...(new Date(d).getFullYear() !== new Date().getFullYear() ? {year: "numeric"} : {})}).format(new Date(d));
  let keys = [], devices = [], recovery = null;
  const draw = () => {
    for(const box of [$("[data-keys]"), $("[data-sessions]")]) box.removeAttribute("aria-busy");
    $("[data-keys]").innerHTML = keys.map((k, i) => `
      <div class="chat" data-key="${esc(k.id)}">
        <span class="who"><b>${esc(deviceName(k.device) || t("passkeyN", {n: i + 1}))}</b><small>${esc(t(k.byCode ? "passkeyByCode" : "passkeyAdded", {d: when(k.added)}))}</small><small>${esc(k.lastUsed ? t("chatsUsed", {d: when(k.lastUsed)}) : t("passkeyUnused"))}</small></span>
        ${keys.length > 1 ? `<button type="button" class="tbtn danger" data-remove-key="${esc(k.id)}">${esc(t("passkeyRemove"))}</button>` : ""}
      </div>`).join("") + (keys.length === 1 ? `<p class="foot">${esc(t("passkeyLast"))}</p>` : "");
    $("[data-sessions]").innerHTML = devices.map(d => `
      <div class="chat" data-session="${esc(d.id)}"${d.current ? " data-current" : ""}>
        <span class="who"><b>${esc(deviceName(d.device) || t("deviceUnknown"))}</b><small>${esc(d.current ? t("deviceThis") : t("deviceSince", {d: when(d.since)}))}</small></span>
      </div>`).join("");
    $("[data-end-others]").hidden = devices.length < 2;
    // Each row says what it holds (DV1).
    rowValue(dlg, "keys", keys.length === 1 ? t("passkeysOne") : t("passkeysMany", {n: keys.length}));
    rowValue(dlg, "sessions", devices.length === 1 ? t("devicesOne") : t("devicesMany", {n: devices.length}));
    if(recovery) rowValue(dlg, "codes", recovery.made ? t("codesLeft", {n: recovery.left}) : "");
    if(recovery){
      $("[data-recovery]").textContent = recovery.made ? t("recoveryLeft", {n: recovery.left, d: when(recovery.made)}) : t("recoveryNone");
      $("[data-make-codes]").textContent = t(recovery.made ? "recoveryAgain" : "recoveryMake");
      $("[data-make-codes]").hidden = false;
    }
  };
  const failed = e => { for(const box of [$("[data-keys]"), $("[data-sessions]")]){ box.removeAttribute("aria-busy"); box.innerHTML = `<p class="errbox" role="alert">${esc(accountError(e))}</p>`; } };
  const load = () => Promise.all([passkeys(), openSessions(), recoveryState()]).then(([k, d, r]) => { keys = k; devices = d; recovery = r; draw(); }, failed);
  const codesText = () => t("recoveryFile", {h: handle}) + "\n\n" + $("[data-codes] textarea").value + "\n";
  // One thing at a time: the buttons wait while the service answers.
  const busy = async (b, fn) => {
    b.disabled = true;
    try{ await fn(); }catch(err){ toast(accountError(err)); }
    finally{ b.disabled = false; }
  };
  dlg.addEventListener("click", async e => {
    if(e.target.closest("[data-close]")) return;
    const add = e.target.closest("[data-add-key]"), off = e.target.closest("[data-remove-key]"), others = e.target.closest("[data-end-others]");
    const make = e.target.closest("[data-make-codes]"), copy = e.target.closest("[data-copy-codes]"), keep = e.target.closest("[data-save-codes]");
    if(e.target.closest("[data-approve]")){ openApprove({toast, onDone: load}); return; }
    if(make){
      // New codes void the old ones: asked first when there are some.
      if(recovery && recovery.made && await ask({title: t("recoveryAgainQ"), text: t("recoveryAgainText"),
        actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("recoveryAgain"), kind: "primary"}]}) !== "yes") return;
      busy(make, async () => {
        const codes = await recently(makeRecoveryCodes);
        if(!codes) return;
        $("[data-codes] textarea").value = codes.join("\n");
        $("[data-codes]").hidden = false;
        await load();
        $("[data-codes]").scrollIntoView({block: "nearest"});
      });
      return;
    }
    if(copy){
      await navigator.clipboard.writeText(codesText()).then(() => toast(t("recoveryCopied")), () => $("[data-codes] textarea").select());
      return;
    }
    if(keep){
      const day = new Date().toISOString().slice(0, 10);
      await save(new File([codesText()], `timp-recovery-codes-${handle}-${day}.txt`, {type: "text/plain"}), t("recoveryTitle"));
      return;
    }
    if(add) busy(add, async () => {
      if(await recently(addPasskey, t("addPasskey"))){ toast(t("passkeyAddedDone")); await load(); }
    });
    else if(off){
      const yes = await ask({title: t("passkeyRemoveQ"), text: t("passkeyRemoveText"),
        actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("passkeyRemove"), kind: "danger"}]});
      if(yes === "yes") busy(off, async () => {
        if(await recently(() => removePasskey(off.dataset.removeKey))){ toast(t("passkeyRemoved")); await load(); }
      });
    }
    else if(others){
      const yes = await ask({title: t("endOthersQ"), text: t("endOthersText"),
        actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("endOthers"), kind: "danger"}]});
      if(yes === "yes") busy(others, async () => { await endOtherSessions(); toast(t("endOthersDone")); await load(); });
    }
  });
  await load();
  return dlg;
}

/**
 * Every passkey lost: the handle and one recovery code, then a new passkey made on this
 * phone. Every other device is signed out.
 * @param onDone(user)  signed in on this phone
 * @param onClose()     the form is closed, done or not
 */
export function openRecover({onDone, onClose = () => {}}){
  const dlg = openSheet({id: "recover-title", title: t("recoverTitle"), form: true, body: `
    <p class="foot">${esc(t("recoverHelp"))}</p>
    <div class="field">
      <label for="rec-handle">${esc(t("fHandle"))}</label>
      <input id="rec-handle" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="31">
    </div>
    <div class="field">
      <label for="rec-code">${esc(t("fRecoveryCode"))}</label>
      <input id="rec-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD-EFGH-…">
    </div>
    <div class="passkey">${FINGER}<span>${esc(t("recoverPasskey"))}</span></div>
    <p class="errbox" data-error role="alert" hidden></p>
    <div class="sheet-actions">
      <span class="grow"></span>
      <button type="submit" class="btn primary">${esc(t("createPasskey"))}</button>
    </div>`});
  const $ = sel => dlg.querySelector(sel);
  const fail = text => { const box = $("[data-error]"); box.textContent = text; box.hidden = false; };
  dlg.addEventListener("close", onClose);
  $("form").addEventListener("submit", async e => {
    e.preventDefault();
    const handle = $("#rec-handle").value.trim(), code = $("#rec-code").value.trim();
    if(!handle || !code) return fail(t("recoverBad"));
    const go = $("[type=submit]");
    go.disabled = true;
    try{
      const user = await recoverAccount(handle, code);
      if(user){ dlg.close(); onDone(user); }
    }catch(err){ fail(accountError(err)); }
    finally{ go.disabled = false; }
  });
  $("#rec-handle").focus();
}

/**
 * Sign in found no passkey of the account on this phone, or the prompt was closed (LK5):
 * this phone added from one already signed in first; the passkey again; a recovery code,
 * which replaces every passkey, last.
 */
export function openSignInHere({onLink, onRetry, onRecover}){
  const dlg = openSheet({id: "here-title", title: t("signInHereTitle"), body: `
    <p class="foot">${esc(t("signInHereHelp"))}</p>
    <button type="button" class="btn primary" data-pick="link">${esc(t("fromSignedIn"))}</button>
    <p class="foot">${esc(t("fromSignedInHelp"))}</p>
    <button type="button" class="tbtn" data-pick="retry">${esc(t("tryPasskeyAgain"))}</button>
    <button type="button" class="tbtn" data-pick="recover">${esc(t("lostPasskey"))}</button>`});
  dlg.addEventListener("click", e => {
    const b = e.target.closest("[data-pick]");
    if(!b) return;
    dlg.close();
    ({link: onLink, retry: onRetry, recover: onRecover})[b.dataset.pick]();
  });
  return dlg;
}

/**
 * This phone joins the account from a device already signed in (LK1, LK3): a code shown
 * here, typed and approved there; then this phone makes its passkey and is signed in.
 * The request is followed only while the sheet is open; its secret never leaves it.
 * onDone(user) once signed in.
 */
export function openLinkPhone({onDone}){
  const dlg = openSheet({id: "link-title", title: t("linkTitle"), body: `<div data-link aria-live="polite"><p class="foot">…</p></div>`});
  const box = dlg.querySelector("[data-link]");
  let req = null, timer = 0;
  const stop = () => clearTimeout(timer);
  dlg.addEventListener("close", stop);
  const show = html => { box.innerHTML = html; };
  const failed = e => show(`<p class="errbox" role="alert">${esc(accountError(e))}</p><button type="button" class="btn primary" data-again>${esc(t("linkAgain"))}</button>`);
  const start = async () => {
    stop();
    try{ req = await startLink(); }catch(e){ return failed(e); }
    show(`<ol class="steps"><li>${esc(t("linkStep1"))}</li><li>${esc(t("linkStep2"))}</li></ol>
      <p class="lcode" aria-label="${esc(t("linkCodeLabel"))}">${esc(req.code)}</p>
      <p class="foot">${esc(t("linkThisPhone", {d: deviceName(navigator.userAgent) || t("deviceUnknown"), n: Math.max(1, Math.round((Date.parse(req.expires) - Date.now()) / 60e3))}))}</p>
      <p class="foot">${esc(t("linkWaiting"))}</p>`);
    follow();
  };
  // Every few seconds while it waits; approved, one tap makes the passkey (iPhones want a tap for it).
  const follow = () => { timer = setTimeout(async () => {
    if(!dlg.open) return;
    let now;
    try{ now = await linkState(req.id, req.secret); }
    catch(e){ return e instanceof ShareError && e.status === 0 ? follow() : failed(e); }
    if(now.state !== "approved") return follow();
    show(`<div class="passkey">${FINGER}<span>${esc(t("linkApproved", {h: now.handle, d: deviceName(now.by) || t("deviceUnknown")}))}</span></div>
      <div class="sheet-actions"><span class="grow"></span><button type="button" class="btn primary" data-make>${esc(t("createPasskey"))}</button></div>`);
    dlg.querySelector("[data-make]").addEventListener("click", async e => {
      e.target.disabled = true;
      try{
        const user = await finishLink(req.id, req.secret, now);
        if(user){ dlg.close(); onDone(user); }
      }catch(err){ failed(err); }
      finally{ e.target.disabled = false; }
    });
  }, 4000); };
  dlg.addEventListener("click", e => { if(e.target.closest("[data-again]")) start(); });
  start();
  return dlg;
}

/**
 * On a device signed in: another phone may join this account (LK2). The warning first,
 * the code typed, who asks as that phone said it, then the passkey asked again to
 * approve. onDone() once approved.
 */
export function openApprove({toast, onDone = () => {}}){
  const dlg = openSheet({id: "approve-title", title: t("approveTitle"), form: true, body: `
    <div class="warns"><b>${esc(t("approveWarnHead"))}</b> ${esc(t("approveWarn"))}</div>
    <div class="field">
      <label for="approve-code">${esc(t("approveCode"))}</label>
      <input id="approve-code" type="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="ABCD-EFGH">
    </div>
    <div data-asker></div>
    <p class="errbox" data-error role="alert" hidden></p>
    <div class="sheet-actions"><span class="grow"></span><button type="submit" class="btn primary" disabled>${esc(t("approveGo"))}</button></div>`});
  const $ = sel => dlg.querySelector(sel), go = $("[type=submit]");
  const fail = text => { $("[data-error]").textContent = text; $("[data-error]").hidden = !text; };
  // Who asks, as soon as the code is whole: approving is possible only after seeing it.
  let asked = "";
  $("#approve-code").addEventListener("input", async e => {
    const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    go.disabled = true; $("[data-asker]").innerHTML = ""; fail("");
    if(code.length !== 8 || code === asked) return;
    asked = code;
    try{
      const who = await lookLink(code);
      if(asked !== code) return;
      $("[data-asker]").innerHTML = `<div class="chat"><span class="who"><b>${esc(deviceName(who.device) || t("deviceUnknown"))}</b><small>${esc(t("approveAsked", {d: new Intl.DateTimeFormat(getLang(), {hour: "2-digit", minute: "2-digit"}).format(new Date(who.asked))}))}</small></span></div>
        <p class="foot">${esc(t("approveInHand"))}</p>`;
      go.disabled = false;
    }catch(err){ asked = ""; fail(accountError(err)); }
  });
  $("form").addEventListener("submit", async e => {
    e.preventDefault();
    go.disabled = true;
    try{
      if(await recently(() => approveLink(asked))){ dlg.close(); toast(t("approveDone")); onDone(); }
    }catch(err){ fail(accountError(err)); }
    finally{ go.disabled = !asked; }
  });
  $("#approve-code").focus();
  return dlg;
}

