// The design system (design/README.md): the tokens, the contrast of every pair that
// must be read, and the styles that may only use tokens.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../tools/lib/app-files.mjs";
import { readTokens, values, tokensCss, contrast, TOKENS_CSS } from "../tools/lib/tokens.mjs";
import { TYPE_COLORS } from "../js/geo.js";

const tokens = readTokens();
const css = readFileSync(join(ROOT, "css", "app.css"), "utf8");

test("css/tokens.css is the one made from design/tokens.json", () => {
  assert.equal(readFileSync(TOKENS_CSS, "utf8"), tokensCss(tokens), "run node tools/tokens.mjs --fix");
});

test("the two themes have the same colours", () => {
  assert.deepEqual(Object.keys(values(tokens.color.light)).sort(), Object.keys(values(tokens.color.dark)).sort());
  assert.equal(tokens.city.light.$value.length, tokens.city.dark.$value.length);
});

test("every pair that must be read is readable, in both themes (R9)", () => {
  for(const theme of ["light", "dark"]){
    const c = values(tokens.color[theme]);
    for(const [fg, bg, min] of tokens.contrast.pairs){
      assert.ok(c[fg] && c[bg], `${theme}: ${fg} or ${bg} is not a colour token`);
      const r = contrast(c[fg], c[bg]);
      assert.ok(r >= min, `${theme}: ${fg} on ${bg} is ${r.toFixed(2)}:1, at least ${min}:1 is needed`);
    }
  }
});

test("a stop's white number is readable on the colour of its kind, and the circle on a dark card", () => {
  const dark = values(tokens.color.dark).card;
  for(const [kind, colour] of Object.entries(values(tokens.place))){
    assert.ok(contrast("#ffffff", colour) >= 4.5, `${kind}: white on ${colour} is ${contrast("#ffffff", colour).toFixed(2)}:1`);
    assert.ok(contrast(colour, dark) >= 2.8, `${kind}: ${colour} on the dark card`);
  }
});

test("the lines of the cities stand out from the card and from the map (3:1)", () => {
  for(const theme of ["light", "dark"]){
    const card = values(tokens.color[theme]).card;
    for(const c of tokens.city[theme].$value) assert.ok(contrast(c, card) >= 3, `${theme}: ${c} on ${card}`);
  }
  for(const c of tokens.city.light.$value) assert.ok(contrast(c, "#f2efe9") >= 3, `${c} on the light map`);
});

test("the map's pins take the colours of the kinds of places", () => {
  assert.deepEqual(TYPE_COLORS, values(tokens.place));
});

test("the page loads the tokens before its styles, and the fonts are the app's own", () => {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  assert.ok(html.indexOf("css/tokens.css") > 0 && html.indexOf("css/tokens.css") < html.indexOf("css/app.css"));
  for(const f of ["inter-latin.woff2", "inter-latin-ext.woff2", "LICENSE"]) readFileSync(join(ROOT, "css", "fonts", f));
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic/);
});

test("colours are defined only in the tokens", () => {
  assert.doesNotMatch(css, /--(bg|ink|muted|accent|card|surface|line)\s*:/, "a colour token redefined in css/app.css");
});

// R10: only token values. The styles written before the design system still have their
// own; these numbers may only go down, release after release, to zero.
const LEFT = {hex: 40, font: 139, radius: 67, rgba: 14, space: 198};
test("the styles use tokens, and fewer values of their own than before (R10)", () => {
  const count = {
    hex: (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length,
    font: (css.match(/font(-size)?:[^;}]+/g) || []).filter(x => !/var\(--fs-/.test(x)).length,
    radius: (css.match(/border-radius:[^;}]+/g) || []).filter(x => !/var\(--r-/.test(x)).length,
    rgba: (css.match(/rgba?\([^)]*\)/g) || []).length,
    // R17: margins, paddings and gaps in px or rem of their own, not the scale's tokens.
    space: [...css.matchAll(/(?:^|[;{\s])(?:margin|padding|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block))?\s*:\s*([^;}]+)/g)].filter(m => /(^|[^\w-])(?!0(px|rem)\b)\d*\.?\d+(px|rem)\b/.test(m[1])).length
  };
  for(const k of Object.keys(LEFT)) assert.ok(count[k] <= LEFT[k], `css/app.css: ${count[k]} ${k} values of its own, at most ${LEFT[k]}: use the tokens`);
});

test("the logo is drawn in the brand's tokens (BR2), as paths: no font needed to show it", () => {
  const tokens = JSON.parse(readFileSync(join(ROOT, "design/tokens.json"), "utf8"));
  for(const f of ["icons/icon.svg", "icons/icon-maskable.svg"]){
    const svg = readFileSync(join(ROOT, f), "utf8");
    for(const k of ["teal", "pocket", "cream"]) assert.ok(svg.includes(tokens.brand[k].$value), `${f}: brand-${k}`);
    assert.ok(!/<text\b/.test(svg), `${f}: the word as paths`);
  }
});
