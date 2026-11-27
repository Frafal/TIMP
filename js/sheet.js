// Every sheet over the page (design/README.md, SH1–SH2): a <dialog> with its title and ×,
// open on the tap in its final shape; what is slow arrives inside it. A tap on the dim
// backdrop, × (or any [data-close]) or Escape closes it; closed, it leaves the page.

import { t } from "./i18n.js";
import { esc } from "./util.js";

let n = 0;

/**
 * @param {{title: string, body: string, id?: string, form?: boolean, cls?: string}} o
 *   id: the title's; form: a <form method="dialog"> (Enter submits it), whose × says
 *   Cancel; cls: the sheet's own class
 * @returns {HTMLDialogElement} open
 */
export function openSheet({title, body, id = "sheet-" + (++n), form = false, cls = ""}){
  const dlg = document.createElement("dialog");
  dlg.className = ("sheet " + cls).trim();
  dlg.setAttribute("aria-labelledby", id);
  const [open, close] = form ? ['form method="dialog" novalidate', "form"] : ["div", "div"];
  dlg.innerHTML = `<${open} class="sheet-form"><div class="sheet-head"><h2 id="${esc(id)}">${esc(title)}</h2>` +
    `<button type="button" class="iconbtn" data-close aria-label="${esc(t(form ? "cancel" : "close"))}">×</button></div>${body}</${close}>`;
  document.body.appendChild(dlg);
  dlg.addEventListener("click", e => {
    if(e.target === dlg || e.target.closest("[data-close]")) return dlg.close();
    const head = e.target.closest(".dhead[aria-controls]");
    if(head) openRow(dlg, head.getAttribute("aria-expanded") === "true" ? null : head);
  });
  dlg.addEventListener("close", () => dlg.remove());
  dlg.showModal();
  // A row of chips wider than the sheet fades at the edge it goes on past (ST2).
  const edges = el => { el.classList.toggle("edge-r", el.scrollLeft + el.clientWidth < el.scrollWidth - 1); el.classList.toggle("edge-l", el.scrollLeft > 1); };
  for(const el of dlg.querySelectorAll(".daychips")){ edges(el); el.addEventListener("scroll", () => edges(el), {passive: true}); }
  return dlg;
}

// A sheet's rows (ST3, DV1, AI2): a label, its value at the right ("+" when empty), its
// content opened in place, one row at a time (the sheet opens and closes them); Delete
// last, red.
export const row = (k, label, body, value = "") => `<div class="srow" data-row="${k}"><button type="button" class="dhead${value ? " set" : ""}" aria-expanded="false" aria-controls="row-${k}"><span>${esc(label)}</span><span class="v" data-v="${k}">${esc(value)}</span></button><div class="dbody" id="row-${k}" hidden>${body}</div></div>`;
export const dangerRow = label => `<div class="srow"><button type="button" class="dhead danger" data-delete><span>${esc(label)}</span></button></div>`;
export function openRow(dlg, head){
  dlg.querySelectorAll(".dhead[aria-controls]").forEach(h => { const on = h === head; h.setAttribute("aria-expanded", String(on)); dlg.querySelector("#" + h.getAttribute("aria-controls")).hidden = !on; });
}
export function rowValue(dlg, k, text){
  const el = dlg.querySelector(`[data-v="${k}"]`);
  el.textContent = text || "";
  el.closest(".dhead").classList.toggle("set", !!text);
}

/**
 * Text to the clipboard, true when copied. First a field selected and copied, in the open
 * sheet (a modal sheet makes the rest of the page inert): it works right after a passkey
 * or Face ID prompt, when iPhones refuse the Clipboard API because the page has not got
 * its focus back; then the Clipboard API.
 */
export async function copyText(text){
  const area = document.createElement("textarea");
  area.value = text;
  area.readOnly = true;
  // 16px: Safari zooms into a smaller field, even an invisible one.
  area.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px";
  ([...document.querySelectorAll("dialog[open]")].pop() || document.body).appendChild(area);
  area.focus({preventScroll: true});
  area.select();
  area.setSelectionRange(0, text.length);
  let done = false;
  try{ done = document.execCommand("copy"); }catch(e){}
  area.remove();
  if(done) return true;
  try{ await navigator.clipboard.writeText(text); return true; }catch(e){ return false; }
}

