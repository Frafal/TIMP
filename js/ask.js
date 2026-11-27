// A question in a small dialog over the page, answered with one of its buttons.
// It replaces confirm(): the browser's own box cannot follow the app's look, and some
// viewers (claude.ai) answer it with "no" without showing it.
//
//   const answer = await ask({title, text, actions: [{id: "no", label: "Cancel"},
//                                                     {id: "yes", label: "Delete", kind: "danger"}]});
//
// `text` is a sentence, or a list of sentences and of {title, items} groups shown as
// short lists. Resolves with the id of the button, or null when the dialog is closed
// another way (Escape, a tap outside). The first button takes the focus: put the safe
// one first.
//
// `check`, {label, checked}, or a list of them: boxes above the buttons. Once the dialog
// is answered, each one's `checked` says how the traveller left it.
//
// `type`, {label, expected}: a field where the traveller writes `expected` (a trip's
// name) to confirm something that cannot be undone. The buttons marked `needsType`
// work only once it matches (case and extra spaces do not matter); the field takes the
// focus, and Enter answers with that button.

import { esc } from "./util.js";

const same = (a, b) => String(a).trim().replace(/\s+/g, " ").toLowerCase() === String(b).trim().replace(/\s+/g, " ").toLowerCase();

export function ask({title, text = "", actions, check, type}){
  return new Promise(resolve => {
    const d = document.createElement("dialog");
    d.className = "ask";
    d.setAttribute("aria-labelledby", "ask-title");
    const body = [].concat(text).filter(Boolean).map(x => typeof x === "string" ? `<p>${esc(x)}</p>`
      : `<section><h3>${esc(x.title)}</h3><ul>${x.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></section>`).join("");
    const checks = [].concat(check || []);
    const box = checks.map(c => `<label class="ask-check"><input type="checkbox"${c.checked ? " checked" : ""}><span>${esc(c.label)}</span></label>`).join("");
    const field = type ? `<label class="ask-type"><span>${esc(type.label)}</span><input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(type.expected)}"></label>` : "";
    d.innerHTML = `<h2 id="ask-title">${esc(title)}</h2>${body}${box}${field}` +
      `<div class="ask-actions">${actions.map(a => `<button type="button" class="btn ${esc(a.kind || "")}" data-answer="${esc(a.id)}"${a.needsType ? " data-needs-type disabled" : ""}>${esc(a.label)}</button>`).join("")}</div>`;
    document.body.appendChild(d);
    const done = answer => {
      d.querySelectorAll(".ask-check input").forEach((input, i) => { checks[i].checked = input.checked; });
      if(d.open) d.close();
      d.remove();
      resolve(answer);
    };
    d.addEventListener("click", e => {
      const b = e.target.closest("[data-answer]");
      if(b) done(b.dataset.answer);
      else if(e.target === d) done(null);   // the dimmed backdrop
    });
    d.addEventListener("cancel", e => { e.preventDefault(); done(null); });
    if(type){
      const input = d.querySelector(".ask-type input"), gated = [...d.querySelectorAll("[data-needs-type]")];
      input.addEventListener("input", () => { for(const b of gated) b.disabled = !same(input.value, type.expected); });
      input.addEventListener("keydown", e => {
        if(e.key === "Enter" && gated[0] && !gated[0].disabled){ e.preventDefault(); done(gated[0].dataset.answer); }
      });
    }
    d.showModal();
    (type ? d.querySelector(".ask-type input") : d.querySelector("[data-answer]")).focus();
  });
}
