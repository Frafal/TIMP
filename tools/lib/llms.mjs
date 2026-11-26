// llms.txt: everything an AI assistant needs to write a trip, in one plain text page
// published with the app (https://usetimp.com/llms.txt). Without an account it
// is how a chat (Claude, ChatGPT, Gemini…) plans a trip for TIMP: it must work at the
// first read.
//
// Chat assistants read one page when given a link; they do not clone the repository. The
// page, made by the build: what to do and what to hand over (the guide's steps), the
// format in short (formatBrief in js/trip.js: every field, the same text the app copies),
// the guide's advice (docs/creating-a-trip.md, without what only matters inside the
// repository: between <!-- llms.txt: skip --> and <!-- llms.txt: end -->) with the format
// of changes where it says how to update a trip, and a complete example, compact. The
// field reference (docs/trip-format.md) stays for people. Nothing is written twice:
// every line is read, and paid for, by every assistant that writes a trip.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./app-files.mjs";
import { formatBrief } from "../../js/trip.js";
import { changesBrief } from "../../js/changes.js";

const read = (root, f) => readFileSync(join(root, f), "utf8").trim();

// Parts of the documents for people working in the repository: the checker, the code,
// how versions and the map work inside the app.
const SKIP = /<!-- llms\.txt: skip -->[\s\S]*?<!-- llms\.txt: end -->\n?/g;
// The example as a chat assistant should write it: no ids or version (the app adds
// them), one stop per line. A third of the length of the file as the app saves it.
function compactExample(trip){
  const t = JSON.parse(JSON.stringify(trip, (k, v) => k === "id" || k === "version" ? undefined : v));
  const one = v => JSON.stringify(v);
  const fields = (o, skip) => Object.entries(o).filter(([k]) => !skip.includes(k)).map(([k, v]) => `${one(k)}: ${one(v)}`).join(", ");
  const list = (items, pad) => "[\n" + items.map(x => pad + "  " + x).join(",\n") + "\n" + pad + "]";
  const stops = (l, pad) => list(l.map(one), pad);
  const plan = p => `{${fields(p, ["stops"])}, "stops": ${stops(p.stops, "      ")}}`;
  const day = d => `{${fields(d, ["stops", "plans"])},\n    ` +
    (d.plans ? `"plans": ${list(d.plans.map(plan), "    ")}}` : `"stops": ${stops(d.stops, "    ")}}`);
  return `{${fields(t, ["days", "info"])},\n "days": ${list(t.days.map(day), " ")}` +
    (t.info ? `,\n "info": ${list(t.info.map(one), " ")}` : "") + "\n}";
}

// The two documents point at each other and at files of the repository. Here they are
// both in one page, so those pointers are rewritten: an assistant that follows them
// finds nothing (a 404) and stops to ask for a file it already has.
const ELSEWHERE = /\*\*If you are an AI assistant:\*\*[\s\S]*?\n\n/;
function forOnePage(md){
  return md
    .replace(SKIP, "")
    .replace(ELSEWHERE, "")
    .replace(/\[([^\]]+)\]\((?!https?:)[^)]+\)/g, "$1")
    .replace(/\btrip-format\.md\b/g, "the format reference (further down this page)")
    .replace(/\bcreating-a-trip\.md\b/g, "the guide (earlier in this page)")
    .replace(/`?examples\/demo-trip\.json`?/g, "the complete example (at the end of this page)")
    .replace(/\n{3,}/g, "\n\n");
}

export function llmsText({root = ROOT, site = "https://usetimp.com/", resolver = ""} = {}){
  const version = JSON.parse(read(root, "package.json")).version;
  const guide = forOnePage(read(root, "docs/creating-a-trip.md"));
  // The guide's steps first, then the format, then its advice; the format of changes goes
  // where the advice says how to update a trip.
  const steps = guide.slice(guide.indexOf("Write for someone"), guide.indexOf("\n## Days")).trim();
  let advice = guide.slice(guide.indexOf("\n## Days")).trim();
  const key = advice.indexOf("\n## A Google Maps key");
  advice = advice.slice(0, key).trim() + "\n\nThe changes, in their format:\n\n```text\n" + changesBrief() + "\n```\n" + advice.slice(key);
  const links = resolver ? `
## Google Maps links

If the traveller gives you Google Maps links (\`https://maps.app.goo.gl/…\`) and you can
open web addresses, ask the link resolver of this site, one link at a time:

    GET ${resolver}?url=<the link, URL-encoded>

It answers with JSON: \`title\`, \`address\`, \`lat\`, \`lng\`, \`type\` (each only when
known) and \`link\`. Put them in the stop as they are. It keeps nothing.
` : "";
  return `# TIMP (Travel in my pocket): how to write a trip

> For AI assistants asked to plan a trip for TIMP, the app that shows it on the
> traveller's phone day by day, even offline (${site}). A trip is ONE JSON object in the
> format below; the app refuses it whole if one rule is broken, so follow it exactly and
> invent no fields. This page is complete: do not look for other files. The same format
> as a JSON Schema: ${site}trip.schema.json

**Version ${version}.** Remember it: when a message from TIMP names a newer version,
open this page again.

**Linked to TIMP?** If you have TIMP's tools (\`list_trips\`, \`get_trip\`, \`create_trip\`,
\`change_trip\`…), use them, not JSON in the chat: they work on the trips of the
traveller's account. Without them, the traveller can link you: in TIMP, You → Your AI.

${steps}

## The format

\`\`\`text
${formatBrief()}
\`\`\`
${links}
${advice}

## A complete example

\`\`\`json
${compactExample(JSON.parse(read(root, "examples/demo-trip.json")))}
\`\`\`
`;
}
