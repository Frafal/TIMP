# TIMP's design system

How TIMP looks and behaves, for every screen and every component, today in the web
app and tomorrow in native ones. The rules are written as behaviour, not as CSS, so a
native app can follow them too.

- **`tokens.json`**: the only source of colours, type, space, shapes and motion
  ([W3C Design Tokens](https://design-tokens.github.io/community-group/format/) format).
  `css/tokens.css` is made from it: `node tools/tokens.mjs --fix` after a change
  (`npm run check` fails until you do). Names say what a value is for, never what it
  looks like.
- **`test/design.test.mjs`** holds what can be checked: the contrast of every pair in
  both themes, the colours of the map, and the styles that may only use tokens.
- **`tools/e2e.mjs`** checks the rest in the browser: names, states, sizes, focus.
- **`index.html`** (published at `/design/`) shows it all: the tokens, their contrast in
  the theme chosen, and every component drawn with the app's own styles.

A new component says, in its comment, which rules it follows. A change that breaks one
needs a reason in its pull request.

## The rules

**R1. One element, one action.** Everything that can be tapped does one thing, and it
is clear which. A closed stop: tapping it opens it; its circle marks it done. Going
there (Map, Directions, TheFork) and changing it (Edit, Skip, Alternative) live in the
opened stop.

**R2. Little on screen; actions grow only by opening.** A closed stop shows its time,
name, place, one signal and its circle. Opened, actions sit in **zones by meaning,
never mixed**: "Go" (leaves the app, ↗) above, "Change" (stays in the app) below a
line, quieter. At most four per zone.

**R3. One main action per screen, and it depends on the moment.** One filled element in
the accent colour. On a day, adding is the last row of the list ("+ Add a stop ·
Paste"), every day; on the day itself the next stop's bar is the one thing floating.
Nothing else floats (the owner, 25 November: a "+" over the stops covered them and said
again what the last row says).

**R4. Three weights of button; the weight says the consequence.** Filled: the main
action. Outlined: an action that changes the trip. Text: add, open, cancel. Changes for
everyone on a shared trip ask first, saying who will see them.

**R5. Narrow places hold only values from a known set.** Never free text where the
width is fixed: nothing wraps, nothing is cut.

**R6. At once, then the content.** A sheet or a page appears on the tap (the first frame
within 100 ms) in its final shape; slow content (history, search, weather) arrives
inside it without anything jumping. Long lists are drawn in parts.

**R7. Motion explains, it does not decorate.** Three durations: a change of state, a
thing opening in place, a thing coming in (`motion` tokens). What has no action does not
move. With "reduce motion", things only fade.

**R8. It explains itself.** No paragraph of instructions on a screen. If something needs
explaining, change the thing.

**R9. For everyone.** See "Accessibility" below: it is part of every rule.

**R10. Tokens only.** Styles use the tokens. `test/design.test.mjs` counts the values
the older styles still have of their own: the counts may only go down.

**R11. The map is always light.** In the dark theme everything darkens but the map: a
dark map cannot be read outdoors. Pins and lines keep the light colours; the frame
around the map follows the theme.

**R12. No arrows to open in place.** What opens says so by what it hides: "+2" beside
alternatives, "+3" on the day's line, a description ending in "…". Opened, it closes
with "Close" or a tap on its heading. A sign remains only for what leads elsewhere (the
trip's title opens the list of trips) or out of the app (↗). No Back links: the circle
of you opens You, and on You it is the way back.

**R13. Distinct stops, read at a glance.** Every stop is a card of its own; the line of
the day joins them in the gaps. Inside, in the order they are looked for: the time
(marked, above), the name (full width, at most two lines, whole when opened), the place
(the area first). On the left only the number.

**R14. On the day, the list starts from now.** When the day shown is today (in the
trip's time zone), the list scrolls to the next stop, with the one before just visible;
a "now" mark on the line says the time and how long until the next; the next stop is
open; the stops done today are compact. It scrolls when the app opens and when it comes
back, never while the traveller scrolls. Other days, and after the trip, every stop has
the same shape.

**R15. Full, dots, dashes.** Three strokes, three meanings, in the list and on the map.
Full: what is there and ahead. Dots: where you have already been. Dashes: what is not
there yet (a choice to make, an option not chosen, "+ Add a stop").

**R16. No links for actions.** Blue and underlined is a link inside a text, and only
that; what leaves the app keeps its ↗. An action is a button: the text weight (R4) is the
text's colour, semibold, no underline, 44 points, "+" before it when it adds. A choice of
two is a choice (a segment); an action that changes the trip for everyone is outlined; a
line that can be changed is itself the button.

**R17. What belongs together is closer.** Four spaces, by what they separate (tokens
`--gap-*`, on the scale): tight, 4, an icon and its label, a title and its line; related, 8,
within a group (buttons in a row, a label and its field, a text and its action); group,
16, between the groups of a sheet or a card; section, 24, between sections. Nothing that
can be told apart touches. `test/design.test.mjs` counts the spacings written by hand:
they may only go down (198 on 25 November).

## Brand

The logo is the app's icon (`icons/icon.svg`, its source; the PNGs are made from it).

- **BR1** A stitched pocket with the trip's things in it (a map, a boarding pass, a
  passport): what the trip keeps, its history, and what is travelled together, sharing.
  "timp" in Inter Bold, drawn as paths, very readable; the pin over its i in the accent.
- **BR2** Its colours are tokens (`brand`): the teal ground, the deeper pocket, the cream of
  the word and the stitching; the same in both themes. Inside the app the days and places
  keep their own colours.
- **BR3** Full bleed, never a frame: iOS and Android round it. The maskable icon keeps the
  pocket inside Android's safe circle; TIMP dev adds an ink DEV band.
- PNGs: `rsvg-convert -w 512 icons/icon.svg -o icons/icon-512.png` (192, 180 for
  `apple-touch-icon.png`), and `icons/icon-maskable.svg` for `icon-maskable-512.png`.

## The line of the day

Every city is a line, every stop a station, as on a metro map. The line takes the
city's colour (`city` tokens); a station shows the stop's number in the colour of its
kind of place (`place` tokens), the same sign as on the map. Behind you the line turns
to dots; ahead it stays full; "now" is the accent's dot. When a day changes city, the
line changes colour at an interchange that shows the means and the times.

- **The circle**: to do (an empty ring), done (a full tick in ink: green means "in
  order", booked), skipped (a dash; the name struck through; the route leaves it out).
- **Stations**: to do (the kind's colour), done or skipped (empty, grey), to choose
  (dashed, no number), without a position (crossed, no number; a tap finds it).

**One colour, one meaning, per shape.** Accent: now and the main action. City: the line.
Kind of place: the station. Ink: text, and done. Yellow, green, red: attention, in
order, error. The accent belongs to none of the palettes.

## On the day (travelling)

- **V1** The day starts from now (R14).
- **V2** The main action changes with the moment (R3).
- **V3** The next stop's bar appears at the bottom, within reach of a thumb, when the
  next stop's card leaves the screen; it goes when the card comes back. Number, name,
  time, how long until it, distance; "Directions" from where you are; a tap on the rest
  brings back the card.
- **V4** Distances from your position, if you give it to the app: asked the first time
  it is needed, saying why; it stays on the phone. Without it, from the stop before.
- **V5** In the sun, tired, one hand: time and name always in full ink (7:1), the name
  at least 15 points; the actions of the moment at the bottom; no hidden gesture for
  anything important.
- **V6** No reproach: stops left behind do not warn and do not move.
- **V7** Offline, the whole day works; the map becomes the sketch.
- **V8** A choice still to make that is the next stop shows time, cost and distance for
  each option.

## Time and the parts of the day

- **T1** A stop's time is a clock time ("09:30") or one of seven parts of the day:
  sunrise, morning, midday, afternoon, sunset, evening, night. A form offers only these;
  nothing in between, so a time never wraps.
- **T2** A part is shown by its name in the app's language; sunrise and sunset add their
  real time where the day is ("Sunset · 20:12"). A word written before ("Evening",
  "Pranzo") is shown as its part; a word that names none, as written.
- **T3** A part has its sign before the name: the sun on its arc over the horizon
  (rising, morning, high, afternoon, setting), then the moon (evening, night). One
  family, in ink. From sunset on, the sign takes the place of the moon after sunset:
  never both.
- **T4** For order and for now, a part counts from its start (`js/parts.js`): sunrise and
  sunset from the real sun, the others from fixed hours around them.
- **T5** All day is no time: the stop goes at the top of the day, before the timed ones.

## Alternatives: for everyone or only for me

A group of alternatives is one card: the option chosen, "+N" and the others' names;
opened, the options as a choice. A shared trip has two layers, never more: the group's
plan, in the trip, and mine, only where I differ, on all my phones and nobody else's.

- **P1** The option is the action; a question gives its reach. On a shared trip a tap
  asks: Cancel · Only for me · For everyone, the safe answer first. No second row of
  buttons on every option.
- **P2** No question when there is one answer: a trip of mine only, the trip changes;
  read only or locked, only for me at once, said with Undo; the group's own option
  again, back to it; my own again, nothing.
- **P3** Mine is marked: the circle of you and "Only you" (never the circle alone, A8);
  under it, quietly, "The group: …". Opened, the group's option says "The group's". The
  number, the line, the map, the next stop and the costs follow mine.
- **P4** A plan the same way: the one I look at is mine, on all my phones; the day's line
  says which the day goes with, and who can edit chooses it for everyone.
- **P5** The group moves after me: mine stays; if the group comes to mine, or mine is
  deleted, the difference goes by itself.
- **P6** Ticks and skips are mine too, on all my phones; a linked chat and a published
  page see the group's plan only.

## What the group sees

On a shared trip, each person decides what the others see of their own choices (P1–P6).

- **G1** Two boxes per trip, in the trip's sheet under its rows, on a trip shared with
  others: "Where I go" and "Ticks for everyone". Unticked to start. Never a question at
  each choice or tick.
- **G2** Where I go: the options and plans I chose only for me are seen by the trip's
  people: their circles beside each option and plan; mine says "You and ugo"; following
  the group, a line says who goes elsewhere.
- **G3** Ticks for everyone: a stop ticked or skipped is so for whoever ticked the box
  too, with who made it under it (said to a screen reader). Who did not keeps their own.
- **G4** Seen by the trip's people only: never a linked chat, a published page, a file.
- **G5** Unticked or off the trip: my choices leave at once; ticks made for everyone stay
  the group's.
- **G6** Without an account, nothing of this.
- **G7** Many people: three circles, then "+N"; two names, then "+N"; every name said, and
  all of them in an opened option's line.

## Signals and warnings

Four levels: **error** (red; something failed or may be lost), **attention** (yellow;
it may leave you at a closed door), **to know** (grey), **in order** (green). The level
gives the colour; the kind gives the icon (a calendar for a closure, a cloud for the
weather, a ticket for a booking, a fork for a choice). Four places: the app (a strip
under the bar, one at a time), the day (one line that opens), the stop (one signal), the
moment (a message that passes, with Undo when there is one).

- **W1** Every warning says what to do, or why it matters.
- **W2** One fact, one place.
- **W3** Warnings end: a stop done or skipped, a day gone, a decision taken.
- **W4** The trip's own label (`tag`) stays free text, in "to know", last.
- **W5** Several signals on one stop: closed, it shows the first (closed, booking
  needed, weather, choice, booking advised, label, booked) and "+N"; opened, all of
  them first, one per row, each with its action.
- **W6** A passing message (at the bottom) goes by itself: four seconds; with an action
  (Undo, Save the file) ten, with a ✕. A finger or the focus on it keeps it. What it
  offered is never only there: the history undoes, the trip's card says what is not
  saved.

## The weather

A signal like the others (W1–W5), from MET Norway through TIMP's service (`js/weather.js`).

- **WX1** The day's head says the day's weather next to sunrise and sunset: the sign of the
  worst sky from 8:00 to 20:00 and the lowest and highest temperature, in °C ("14–19°");
  words for a screen reader. Nothing to tap. The hours of light have the sun's arc over
  the horizon (T3), never the weather's sun with rays: two signs, never one for both.
- **WX2** A warning only where it changes something: a park, a view or a walk, at its time
  (a clock time and the hour after; a part of the day, its window; all day, 9:00 to
  19:00). Storm, rain (1 mm in an hour), strong wind (10 m/s): attention; heat (35°) and
  cold (−5°): to know, with what to do. A museum in the rain says nothing.
- **WX3** The day's line says the first and how many stops, after closures and bookings;
  with another plan, its action is that plan.
- **WX4** Only today and the next 3 days. Further away, nothing, not an empty place.
- **WX5** A forecast is asked again after an hour and trusted 12 hours; older, nothing.
  MET Norway is named under You, About.
- **WX6** A day gone keeps the last forecast it had, quiet in its head: its sign and its
  highest ("☀ 21°", muted), "was 21°, sun" for a screen reader; a memory, on this phone,
  never a warning.
- **WX7** Only a place rounded to about 10 km leaves the phone, through the service, which
  asks MET at most once every 3 hours per place: never the trip, the account or who asks.

## Search

- **S1** One field, the whole trip: a stop's name, its local name, description,
  address, label and group, the plan, the city and title of its day; a day's notes by
  their own words. On the phone, offline (`js/search.js`, no DOM).
- **S2** Letters without accents or case; every word typed must be found.
- **S3** A result is the stop's sign (its number in its kind's colour), its day and time,
  its name; the word found is marked, and where it was found when not in the name.
- **S4** A tap goes there: the day, the stop open and in view, the focus on it. An option
  not chosen: its group opened.
- **S5** In the bar, at once (R6): the lens becomes ✕, the field takes the title's place,
  ready to type; only the circle of you stays. The results fill a panel fixed under the
  bar, which scrolls on its own and never moves or changes size as one types (the
  keyboard comes and goes on a phone). How many were found is said (a `status`).
- **S6** ✕, Escape, the circle of you or another page close it; the focus goes back to
  the lens. One ✕ only: the browser's own "clear" is not shown.

## The map

- **M1** The same sign in the list and on the map: a station, the stop's number in its
  kind's colour; done or skipped, empty and grey; chosen, larger, with a ring.
- **M2** A view of the day (List | Map at the end of the row of days, on a day only:
  elsewhere the days run to the end of the row; the bar keeps one size), not a panel: the map takes the
  heading's place, right under the bar from the start, and stays there, still, while
  the list scrolls under it.
- **M3** A pin, one action: its stop comes up just under the map, marked. No card on the
  map. A stop's number in the list shows its pin; held, the number or the stop's name
  opens the map on it.
- **M4** The lines are always there: full ahead, dots where you have been.
- **M5** Two controls: my position (asked of the phone only then; it stays on the
  phone), and larger or smaller (the choice kept, at once, not animated), which frames
  the whole day again and pushes the list down: the stop looked at stays under the map.
  Only the map zooms with two fingers: the app does not (A12). Zoom is with the fingers or the wheel. A day in more than one
  place: a row of their names, a tap shows that one.
- **M6** Offline, the sketch by itself, in scale.
- **M7** Always light (R11), with its attribution.
- **M8** At once (R6): the stage has its size before the tiles come.
- **M9** Choosing a point (the stop form): the sign stays in the middle, the map moves.
- **M10** Under the bar, the map has an edge and a shadow: the list slides under it.
  Larger or smaller, List or Map: the list is pushed, never covered, and the stop read
  first stays at its line, just under the map or the bar.

## A stop's form

Adding a stop and changing one: the same sheet (`js/editor.js`).

- **ST1** What, found: one field for a name, an address or a link. A link or coordinates
  pasted are read at once; a name is searched with Search or Enter, never while typing
  (OpenStreetMap's rules), around the day first: up to three places, with their kind and
  how far; a tap on one shows it on a small map; its box (SH5) takes it (name, address,
  position, kind): the map closes and only it stays; its box again brings the others
  back. The name on the sign is small and optional, under the field.
- **ST2** When: the trip's days as chips, "+" last for a new day; the time as hours and
  minutes or a part of the day (a choice of two, T1); a day with plans, its plan. A row of
  chips wider than the sheet fades at the edge it goes on past, never cut clean.
- **ST3** The rest, a row each with its value ("+" when empty), opened in place, one at a
  time: kind, how you get there, booking, cost, closed on, description, position; Delete
  last, red, asking.
- **ST4** The actions always at the bottom; the main one says what it does: "Add to day
  2", "Add to a new day 5", "Save", "Move to day 3".
- **ST5** Before a stop goes to a day, what to know, once, under When: closed that day,
  booked (for the day it leaves), the time taken there, a choice of the same name there
  (`moveWarnings`, `js/edit.js`). Nothing blocks.
- **ST6** A new day is the next after the last, in its city, said in a line.
- **ST7** Opened on a stop, the field shows its name; searching again changes name and
  position only through a place taken.
- **ST8** R16 in the form: no links; "+ A private cost" and "+ As on the sign" are text
  buttons.

## Moving days

A day's programme moves whole (`js/edit.js`, `swapDays`, `moveDayStops`).

- **MV1** "Move day" among the day's own actions, at its end, with Edit day. One sheet,
  two ways (a choice of two): swap with another day, or move its stops to another day.
  There is no "+ Day": a new day is the stop form's "+" chip (ST6).
- **MV2** Swapping: the two days exchange title, city, stops or plans, notes; the dates
  and the nights (where one sleeps is booked for a date) stay. Said in a line.
- **MV3** Moving its stops: they join the other day in time order; the day left without
  stops goes, said before; the dates after it stay. A day with plans, or to one, swaps only;
  the other way is off, with why.
- **MV4** Before, what to know, a line per stop that has something (`moveWarnings`):
  closed on its new day, booked for the day it leaves; joining, a time taken there.
- **MV5** One version; the button says what it does ("Swap days 2 and 4", "Move 6 stops
  to day 2"); ticks, skips, private expenses and the plan looked at follow; on a shared
  trip, asked first (A9).
- **MV6** An assistant's changes that move stops: what to know, said once applied, with
  Undo.

## A day's form

A day's own sheet (`openDayEditor`, `js/editor.js`), on the stop form's parts (ST3, ST4).

- **DY1** What the day is about and its city first, always open. Under the city, the
  trip's cities as chips (two or more, five at most): one tap, one spelling, so a day
  keeps its city's colour in the strip.
- **DY2** The rest a row each with its value: where you sleep (name, address, its note:
  check-in, a door code), the notes (how many; one field each, ✕ takes one away, "+ Add a
  note" a text button).
- **DY3** The night of the day before, in one tap, when this day's is empty or different:
  "Same as day 3: Casa do Exemplo".
- **DY4** Cancel and Save at the bottom; Delete the last row, red, asking what goes with
  it, counted (its stops, the ticked ones); private expenses paid there stay, no longer at
  a stop; the days after it keep their dates.

## An expense's form

An expense outside the stops (`openExpenseEditor`), the same parts.

- **EX1** Whose it is first: "For the trip" or "Only mine", with a line saying who sees it.
  A stop's Cost row is the same block (whose, then how much, large), twice when the stop
  has both a trip's cost and a private one.
- **EX2** What it was, then how much: the amount large, its currency, what it makes at
  home at that day's rate.
- **EX3** When it was paid: "Before" and the trip's days as chips (ST2's); "Before" opens
  the date, the day before the first until changed, with a pencil (not the phone's
  arrow). Paid at a stop, said under them.
- **EX4** "Add expense" or "Save" at the bottom; Delete the last row, asking; an error
  under its own field.

## Welcome and You

Welcome is the first screen, with no trip (`renderWelcome`); You is the account and this
phone's settings (`renderMe`). TIMP's business: your travel agent is your AI.

- **WL1** The headline, on one line in every language (smaller when it is longer): "Your AI
  is your travel agent."; one short line under it; the name and icon small above.
- **WL2** One main action: Plan it with your AI (the assistant's sheet). No "by hand": the
  app pushes to an AI; the example shows what a trip is.
- **WL3** The account as two plain buttons right under it, Create account and Sign in, no
  text (only with the service; signed in, Welcome is not shown).
- **WL4** The rest in one quiet row of text buttons: See an example · Load a file · Paste trip.
- **WL5** Keep it on your Home Screen only when TIMP is not installed, this phone's steps
  first, the other phone's folded ("Other phones").
- **YO1** You: the account first, as its card and rows.
- **YO2** This phone's settings as rows with their value, opened in place, one at a time:
  language, theme, your currency, the map (its key inside).
- **YO3** Keep it on your Home Screen as a row, only when not installed.
- **YO4** About last, small; with the service, links to the privacy policy and the terms of
  use.
- **YO5** Signing up asks to accept the terms: a box (16 or older, terms of use, privacy
  policy, both linked), required. When they change, or for an account made before them, a
  sheet asks once a session, not over another sheet: Accept, Not now.

## Costs, your AI, devices

Info's costs (`costsSection`) and the account's sheets (`js/account.js`).

- **CO1** Closed, the costs say the real total: "…" while the rates are on their way, never a
  sum short of them ("≈ $0").
- **CO2** Grouped lists: day by day, by kind of place, the expenses; one card each, a row
  each with a line between, its amount at the right, one line of title.
- **CO3** One list of expenses, the trip's and mine together by date, a lock and "Only mine"
  on mine; "+ Add an expense" its last row (R3).
- **AI1** Your AI first among the account's rows, its value the chats linked.
- **AI2** Your AI's sheet: a row per chat (when it was used; opened, what it can do, since
  when, Unlink red and asked); none linked, how to link one, open: your app chosen (Claude,
  ChatGPT, Other), its two steps, the address with Copy, what to ask it.
- **DV1** Passkeys and devices as three rows with their value (passkeys, recovery codes
  left, devices signed in), opened in place; actions as text buttons, red when they cannot
  be undone, always asked.
- A sheet opens and closes its rows itself (`js/sheet.js`): one open at a time.

## Sheets

A sheet comes up over the page for what is done apart: a form, the history, finding
positions, sharing, the account. One for all (`js/sheet.js`).

- **SH1** One shape: from the bottom on a phone, in the middle on a wide screen; the
  title and × at the top (× says Cancel on a form), the actions at the bottom. A tap
  outside, × or Escape closes it; the focus stays inside (A4).
- **SH2** At once (R6): open on the first frame after the tap, in its final shape. What
  comes from far (the history, the people of a trip, passkeys, linked chats) arrives
  inside it; such a sheet is tall from the start, so nothing moves when it comes. The
  e2e measures the opening: over 100 ms fails.
- **SH3** Finding positions: one row, two actions. The tick takes the point found; a tap
  on the row shows it on a small map in the sheet, with the day's other stops around it
  (no leaving the app). Far from them (over 30 km): unticked, and it says how far.
- **SH4** One main action that says what it does: "Save 2 positions", or with none
  ticked "Leave as it is"; saved as one version.
- **SH5** A choice in a sheet is a square box with its line (finding positions, publishing,
  with the group); the circle is only a stop done, in the list. One shape, one meaning.

## Trips

The list of trips (`#trips`): the open one first, larger; the others grouped by when.

- **TR1** A trip's card, one action: a tap opens the trip, on today if it is under way.
  ⋯ is its only other control: the trip's sheet.
- **TR2** Its state in signals, one fact each, only when there is something to know: not
  synced, changes not in a file (a trip only on this phone), shared with you, published,
  locked, only on this phone. The version and where it is kept are in its sheet.
- **TR3** The trip's sheet: where it is and its version under the title; what can be
  done, a row each with its value (History · 14 versions); Delete apart, last, asking.
- **TR4** Grouped by when (under way, coming, past by year, of others); sorted and found
  when there are many.
- **TR5** Adding: "Load a file" the main action, Paste beside it (anything: a trip,
  an assistant's changes, a place); "Plan it with your AI" a row that opens its sheet (a
  new trip, or a change to the open one: the sheet keeps its height between them; Clear
  beside the field, only with something in it), Welcome's main action (WL2). The same
  words everywhere. Nothing floats on Trips, Info or You.

## Accessibility

Part of every component, checked where it can be.

- **A1 Semantic HTML first.** A button is a `<button>`; a link (`<a href>`) only goes
  somewhere; lists are lists; headings in order (the page, the day, the stops);
  landmarks (`header`, `nav`, `main`).
- **A2 Every control has a name** a screen reader says, in the interface's language:
  its text, or `aria-label` from `js/i18n.js`. An icon alone always has one.
- **A3 States are said, not only shown**: `aria-pressed` (the circle, a view),
  `aria-expanded` with `aria-controls` (what opens in place), `aria-current` (the day),
  `aria-checked` (an option), `aria-disabled` with the reason a tap gives.
- **A4 Focus is visible** and follows the order on screen; a sheet keeps the focus inside
  and gives it back when it closes.
- **A5 Targets of at least 44 × 44** (`--touch`), even when the sign drawn is smaller.
- **A6 Live regions**: a passing message is a `status`, an error of the app an `alert`.
- **A7 Text grows**: sizes in `rem`, no fixed heights that cut text; at twice the size
  rows wrap, they do not overlap.
- **A8 Colour is never alone**: a level has its icon and its word; a state its shape.
- **A9 Contrast** (tokens): 4.5:1 for text, 3:1 for controls and lines, 7:1 for a stop's
  time and name.
- **A10 Language**: the page's `lang` follows the interface; a local name carries its
  own.
- **A12 Zoom**: the app does not zoom with two fingers, the map does; text grows with
  the phone's own text size (sizes in rem). A day with one stop draws no line.
- **A11 iPhone**: what is typed is at least 16 points (`--fs-field`: Safari zooms into a
  smaller field); what sticks to the top is placed from where the bar ends, under the
  notch (`env(safe-area-inset-top)`); a colour mixed with `color-mix()` has a plain one
  before it, for Safari before 16.2. A column that holds text is `minmax(0, 1fr)`, never `auto`, and
  its children may shrink (`min-width: 0`): Safari sizes an auto column by the full
  length of a text kept on one line. The e2e fails if a page is wider than the screen.
