// The sheet to share a trip on the account: who sees it and what they may do, the
// invites not accepted yet (taken back with one tap), a new invite for one person, as a
// link sent however the owner likes, and the trip's page "with the link" (published,
// published again, withdrawn: js/publishing.js). Only the trip's owner opens it.

import { t, getLang } from "./i18n.js";
import { esc } from "./util.js";
import { openSheet, copyText } from "./sheet.js";
import { ask } from "./ask.js";
import { createInvite, pendingInvites, revokeInvite, tripMembers, leaveTrip, inviteLink, pageUrl, unpublishTrip } from "./share.js";
import { accountError } from "./account.js";
import { openPublishSheet } from "./publishing.js";
import { shortId } from "./version.js";

/**
 * @param {object} o
 *   rec              the trip's record (on the account, owned)
 *   toast            says something short over the page
 *   onPublication(p) the trip's page changed: the publication, or null once withdrawn
 */
export async function openShareSheet({rec, toast, onPublication = () => {}}){
  // A link copied, or its field selected to copy by hand.
  const copied = async field => { if(await copyText(field.value)) toast(t("linkCopied")); else field.select(); };
  const id = rec.share.id;
  const dlg = openSheet({id: "share-title", title: t("shareTitle", {t: rec.trip.title}), cls: "tall", body: `
    <section><h3 class="sheet-h">${esc(t("whoSees"))}</h3><div class="people" data-people aria-busy="true"><p class="foot">…</p></div></section>
    <section data-pending-box hidden><h3 class="sheet-h">${esc(t("pendingInvites"))}</h3><div class="people" data-pending></div></section>
    <section><h3 class="sheet-h">${esc(t("invitePerson"))}</h3>
      <div class="invite-new">
        <select data-role aria-label="${esc(t("invitePerson"))}"><option value="read">${esc(t("roleRead"))}</option><option value="edit">${esc(t("roleEdit"))}</option></select>
        <button type="button" class="btn primary" data-make>${esc(t("makeLink"))}</button>
      </div>
      <div class="invite-link" data-link hidden>
        <input type="text" readonly data-link-text aria-label="${esc(t("shareLink"))}">
        <div class="actions"><button type="button" class="btn small primary" data-send>${esc(t("shareLink"))}</button><button type="button" class="btn small" data-copy>${esc(t("copyLink"))}</button></div>
      </div>
      <p class="foot">${esc(t("linkHelp"))}</p>
    </section>
    <section><h3 class="sheet-h">${esc(t("withLink"))}</h3><div class="pub" data-pub></div></section>`});
  const $ = sel => dlg.querySelector(sel);
  const role = r => t(r === "owner" ? "roleOwner" : r === "edit" ? "roleEdit" : "roleRead");
  const until = d => new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "short"}).format(new Date(d));
  let people = [], pending = [], pub = rec.share.publication || null;
  const when = d => new Intl.DateTimeFormat(getLang(), {day: "numeric", month: "short", year: "numeric"}).format(new Date(d));
  // The page: its address, what it shows, again or withdrawn; or a way to make it.
  const drawPub = () => {
    $("[data-pub]").innerHTML = !pub ? `<p class="foot">${esc(t("publishHelp"))}</p>
      <div class="actions"><button type="button" class="btn" data-pub-make>${esc(t("publishLink"))}</button></div>` : `
      <p class="foot">${esc(t("publishedOn", {v: shortId(pub.version), d: when(pub.updatedAt)}))}${pub.dates === "hidden" ? " " + esc(t("publishedHidden")) : ""}</p>
      ${pub.version !== rec.trip.version.id ? `<p class="warnline" data-pub-changed>${esc(t("publishChanged"))}</p>` : ""}
      <div class="invite-link"><input type="text" readonly data-pub-link value="${esc(pageUrl(pub.page))}" aria-label="${esc(t("withLink"))}">
        <div class="actions"><button type="button" class="btn small primary" data-pub-send>${esc(t("shareLink"))}</button><button type="button" class="btn small" data-pub-copy>${esc(t("copyLink"))}</button></div></div>
      <div class="actions"><button type="button" class="btn small" data-pub-make>${esc(t("publishAgain"))}</button><button type="button" class="btn small danger" data-pub-off>${esc(t("unpublish"))}</button></div>`;
  };
  const published = p => { pub = p; drawPub(); onPublication(p); };
  const draw = () => {
    $("[data-people]").removeAttribute("aria-busy");
    $("[data-people]").innerHTML = people.map(m => `<div class="person" data-person="${esc(m.id || "")}">
      <span class="who"><b>@${esc(m.handle)}</b><small>${esc(role(m.role))}${m.role === "owner" ? " · " + esc(t("you")) : ""}</small></span>
      ${m.role !== "owner" ? `<button type="button" class="btn small danger" data-remove="${esc(m.id)}" data-handle="${esc(m.handle)}">${esc(t("removePerson"))}</button>` : ""}</div>`).join("");
    $("[data-pending-box]").hidden = !pending.length;
    $("[data-pending]").innerHTML = pending.map(i => `<div class="person" data-invite="${esc(i.id)}">
      <span class="who"><b>${esc(role(i.role))}</b><small>${esc(t("inviteUntil", {d: until(i.expires)}))}</small></span>
      <button type="button" class="btn small" data-revoke="${esc(i.id)}">${esc(t("revoke"))}</button></div>`).join("");
  };
  const load = async () => {
    try{ [people, pending] = await Promise.all([tripMembers(id), pendingInvites(id)]); draw(); }
    catch(e){ $("[data-people]").removeAttribute("aria-busy"); $("[data-people]").innerHTML = `<p class="errbox" role="alert">${esc(accountError(e))}</p>`; }
  };
  dlg.addEventListener("click", async e => {
    if(e.target.closest("[data-close]")) return;
    const b = e.target.closest("button");
    if(!b) return;
    try{
      if(b.matches("[data-make]")){
        b.disabled = true;
        const inv = await createInvite(id, $("[data-role]").value);
        $("[data-link]").hidden = false;
        $("[data-link-text]").value = inviteLink(inv.token);
        await load();
      }else if(b.matches("[data-send]")){
        const url = $("[data-link-text]").value;
        if(navigator.share) await navigator.share({title: rec.trip.title, text: t("inviteText", {t: rec.trip.title}), url}).catch(() => {});
        else copied($("[data-link-text]"));
      }else if(b.matches("[data-copy]")){
        copied($("[data-link-text]"));
      }else if(b.matches("[data-pub-make]")){
        openPublishSheet({rec: {...rec, share: {...rec.share, publication: pub}}, toast, onDone: p => { published(p); toast(t("publishedDone")); }});
      }else if(b.matches("[data-pub-send]")){
        const url = $("[data-pub-link]").value;
        if(navigator.share) await navigator.share({title: rec.trip.title, url}).catch(() => {});
        else copied($("[data-pub-link]"));
      }else if(b.matches("[data-pub-copy]")){
        copied($("[data-pub-link]"));
      }else if(b.matches("[data-pub-off]")){
        const yes = await ask({title: t("unpublishQ"), text: t("unpublishText"),
          actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("unpublish"), kind: "danger"}]});
        if(yes !== "yes") return;
        await unpublishTrip(id);
        published(null);
        toast(t("unpublished"));
      }else if(b.dataset.revoke){
        await revokeInvite(id, b.dataset.revoke);
        toast(t("inviteRevoked"));
        await load();
      }else if(b.dataset.remove){
        const h = b.dataset.handle;
        const yes = await ask({title: t("removePersonQ", {h}), text: t("removePersonText"),
          actions: [{id: "no", label: t("cancel")}, {id: "yes", label: t("removePerson"), kind: "danger"}]});
        if(yes !== "yes") return;
        await leaveTrip(id, b.dataset.remove);
        toast(t("personRemoved", {h}));
        await load();
      }
    }catch(err){ toast(accountError(err)); }
    finally{ b.disabled = false; }
  });
  // The sheet is open and tall already (SH2): who sees the trip arrives inside it.
  drawPub();
  await load();
}
