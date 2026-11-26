# Changelog

Versions follow [Semantic Versioning](https://semver.org/). The trip file format has
its own version: `travel-in-my-pocket/2` since 3.0. Files in `travel-in-my-pocket/1`
(1.0 to 2.4) still load: the app converts them.

## 4.15.0

- **A new logo, which is the app's icon**: a stitched pocket with the trip's things in it (a
  map, a boarding pass, a passport), "timp" in Inter, the pin over its i. It fills the whole
  icon: no more black frame around a card on the phone. Readable on a Home Screen; Android's
  round masks keep the pocket inside.
- **The brand's colours are tokens** of the design system (teal, the pocket, cream), with a
  Brand section in it; the welcome screen shows the logo.

## 4.14.0

- **Terms of use and privacy policy** for the service, in English and Italian
  (`docs/terms.md`, `docs/privacy.md` and their Italian twins): who is responsible, what is
  kept, why and for how long, who helps and where, your rights.
- **Signing up asks to accept them**: you are 16 or older, you accept the terms of use and
  you have read the privacy policy, both linked. The service keeps the version and the date
  (they are in your data's export).
- **When they change**, and for accounts made before them, TIMP asks once to read and
  accept them; links to both at the end of You.
- Needs the service 1.14.0.

## 4.13.0 · the first milestone

**Your AI is your travel agent.** With this release TIMP is what it set out to be: a chat
plans the trip, TIMP keeps it in your pocket, and a chat linked to your account changes it
while you travel. What this release adds to make that whole:

- **Your AI, linked**: the instructions TIMP gives a linked chat now say which tool takes
  the trip or the changes, never "paste it" (that is for chats without an account).
- **llms.txt, rewritten for chats**: what to do and what to hand over first, then the
  format, then only the advice the format does not give, the format of changes where it
  says how to update a trip, and a complete example. A third shorter, nothing said twice.
- **One set of words**: "Plan it with your AI", "Load a file", "Paste trip" on Welcome and
  Trips alike, and in every guide.
- **The README and its pictures**, new: what TIMP is in two lines, the first screen as an
  iPhone sees it, the forms, moving a day, the costs.
- **The guides** follow the app as it is now: adding a stop, the day's own actions,
  moving days, Your AI.

## 4.12.0

- **Your AI**: "Linked chats" is now **Your AI**, first among the account's rows, saying which
  chats are linked. Its sheet lists them, a row each (opened: what it can do, since when,
  Unlink); with none, it shows how to link one for your app only (Claude, ChatGPT or
  another), the address to copy and what to ask it.
- **Passkeys and devices** as three rows with their value: passkeys, recovery codes left,
  devices signed in; opened in place; actions as text buttons.
- **The trip's costs, shorter**: day by day, by kind of place and the expenses are lists, a
  row each; the trip's expenses and your own are one list by date, the lock on yours, with
  "+ Add an expense" as its last row.
- **Closed, the costs no longer say "≈ $0"** while the rates are on their way: "…" until
  they come.

## 4.11.0

- **Welcome, for whoever comes first**: "Your AI is your travel agent.", on one line in every
  language; one main action, **Plan it with your AI**; Create account and Sign in as two
  plain buttons right under it; then See an example · Load a file · Paste trip in a quiet
  row. The Home Screen's steps only when TIMP is not installed, this phone's first.
- **You**: the account first; this phone's settings as rows with their value (language,
  theme, your currency, the map with its key), opened in place; the Home Screen's steps as
  a row only when not installed; About small at the end.
- The assistant's sheet says that with an account the chat can be linked and change the
  trip itself.

## 4.10.1

From the owner's tries of 4.10.0:
- **Italian**: a time in a warning reads right when it is a part of the day ("c'è già … nel
  pomeriggio", no longer "alle pomeriggio"); moving days and an assistant's moves said the
  part in English and the dates as 2027-05-17: now as the language says them. Also
  "chiuso il …" for a date, "Giorno 2, sabato 15 maggio" over the warnings, "Aggiungi al
  nuovo giorno 5", and no more "1 tappe".
- **An expense paid "Before"**: the date starts at the day before the trip's first, and its
  field shows a pencil to change it, not the phone's arrow.
- **A stop's cost is the expense's block**: whose it is first ("For the trip" or "Only
  mine", with who sees it), then how much, large; a private cost added below, set apart.
- In Italian an expense's name is asked as "Per" (voli, hotel, …), no longer "Cos'era".
- **A row of chips longer than the screen** (the trip's cities, the days of a long trip)
  fades at the edge it goes on past, instead of being cut clean; with a sixth chip the row
  shrank to a sliver (a class name it shared with the ⋯ button): fixed.

## 4.10.0

- **A day's form, rethought** like the stop's: what the day is about and its city first;
  under the city, the trip's cities as chips (one tap, one spelling, so the day keeps its
  colour). Where you sleep and the notes are a row each, with their value; the night gets
  its note (check-in, a door code), and "Same as day 3: …" takes the night before in one
  tap. Cancel and Save stay at the bottom; Delete is the last row and says what goes with
  the day, counted.
- **Deleting a day** leaves the private expenses paid there in place, no longer at a stop
  (they kept pointing at a stop that was gone).
- **An expense's form, rethought**: whose it is first ("For the trip" or "Only mine", the
  same words as a stop's cost), what it was, the amount large, then when it was paid as
  chips: "Before" (with its date, today at first) or a day of the trip. A private expense
  paid at a stop says where. "Add expense" and Cancel at the bottom; an error shows under
  its own field.
- The day chips centre their text, also with a single word ("Before", a city).

## 4.9.1

- **Moving a day**: in the swap's summary a date no longer breaks in the middle ("Sun May /
  16"); each date stays on one line.
- **The README's screenshots retaken** from 4.9 (they were of before 4.x), with one more:
  moving a day, with what to know. Their alt texts say what they show now.

## 4.9.0

- **Moving days.** At the bottom of a day, "Move this day" (no more "+ Day": a new day
  comes from the stop form's day chips). Two ways, one sheet:
  - **Swap with another day**: the two programmes trade dates (stops, plans, notes,
    title, city); each date keeps its own place to sleep and its weather.
  - **Join into another day**: its stops go to the end of the other day and the day goes
    away. A day with plans moves whole (swap only); it says why.
  - What to know is said before saving, by stop: closed that day, already booked, a time
    that falls on another stop, a group you are leaving. Done and skipped ticks and
    private expenses follow the stops.
- **An assistant's changes that move stops** say what to know there once applied (closed
  that day, already booked), with Undo.
- **Undo moves things back too**: after a change that moved stops (the form, an
  assistant's changes), Undo also brings their ticks and private expenses back.
- **Alternatives**: the line on their left stops at the last option, also at the end of a day.
- **Spacing has names** in the design system (R17): tight, related, group, section. The
  share and devices sheets use them (the button sat too close to the link and the text).

## 4.8.1

From the owner's tries of 4.8.0:
- **The search's places have a box**: a tap on a place shows it on the small map; its box
  takes it, the map closes and only it stays; its box again brings the others back.
- **On Android the form went wider than the screen** once a place was taken (a long
  address in its row): fixed, and checked by the tests with a long address.
- **No floating "+"** on a day: "+ Add a stop" is the last row of the list, every day (it
  was missing on the day itself, and covered the stops on the others).
- The form says **Name**, **Kind** and **Name on the sign**; one "+" in "+ Add a private cost".
- **A day gone shows its weather's sign and highest**, quiet, without "was".
- **The hours of light have their own sign** (the sun's arc over the horizon), no longer
  the same sun as the weather beside them.

## 4.8.0

- **Adding a stop, rethought.** One field, "Name, address or link": a link or a place
  from Google Maps is read at once; a name is searched (Search, or Enter) around the day,
  up to three places with their kind and how far, the first taken and shown on a small
  map. The day is a row of chips, "+" for a new day. The rest is a row each, with its
  value, opened in place: kind, how you get there, booking, cost, closed on,
  description, position. The name as on the sign is small and only if you want it. The
  buttons stay at the bottom and say what they do: "Add to day 2", "Move to day 3".
- **Moving a stop says what to know first**: closed that day, already booked, the time
  already taken there, a choice of the same name there. Nothing is blocked.
- **No more blue underlined links for actions**: the time is "Time | Part of the day";
  "Choose for everyone" is a button; the others are plain text buttons (R16).

## 4.7.2

- **The assistant says when the trip is ready**: after the JSON (one line, which a chat
  writes bit by bit) it adds a short line saying it is complete and can be pasted into
  TIMP; the format guide and every message for an assistant ask for it.
- **A trip copied before it was finished** is told apart: "The trip is cut short: wait
  until the assistant says it is ready, then copy it again", not "not valid JSON", and
  nothing to send back to the assistant.

## 4.7.1

- **Compact JSON from the assistants**: the format guide (`llms.txt`) and every message
  for an assistant (a new trip, changes, corrections) ask for the JSON minified on a
  single line: one line to copy, and the chat stays readable (tried with Gemini).
- **Changes for a trip that is not on this phone** (a private window closed, the
  browser's data cleared): said as it is, no longer as a mistake of the assistant; what
  is copied for the assistant asks for the whole trip with its changes.

## 4.7.0

- **What the group sees**, on a shared trip: two boxes in the trip's sheet (⋯), unticked
  to start. **Where I go**: the people on the trip see the options and plans you choose
  only for you; you see theirs, a circle each beside the option or plan ("You and ugo";
  "Elsewhere: ugo" when you go with the group). **Ticks for everyone**: a stop ticked by
  one is done for all who ticked the box, with who did it under it. Never seen by a
  linked chat, a published page or a file. Needs TIMP-share 1.12.0.
- Fixed: since 4.3.0, on a trip on the account, ticks after the first one reached your
  other phones only once the trip was opened again.

## 4.6.2

- With an assistant: switching between "A new trip" and "Change this trip" no longer
  changes the sheet's height; the two fill its width. Clear is a button beside the field,
  only when there is something to clear.

## 4.6.1

- The history, on the account: who made each version ("ugo, in the app") could vanish
  from the rows when the service answered while the rows were still coming (4.5.0). Now
  the names stay.

## 4.6.0

- **Trips, new**: a tap on a trip's card opens the trip (on today if it is under way);
  ⋯ opens its sheet, with History, Save the file, Share, Lock and, apart, Delete.
- **A trip's state in signals** on its card, only when there is something to know: not
  synced, changes not in a file, shared with you, published, locked. Its version and
  where it is kept are in its sheet; "loaded on" is gone.
- **With an assistant**, one sheet for Trips and Welcome: a new trip or a change to the
  open one; 1 Copy the message, 2 Paste its answer. The draft stays on the phone.
- **One Paste**, in Trips: it takes anything (a trip, an assistant's changes, a place
  from Google Maps). The floating Paste is gone.
- **Messages at the bottom go by themselves**: four seconds; with an action (Undo, Save
  the file) ten. A finger on one keeps it.

## 4.5.0

- **Every sheet opens at once**, on the tap: what comes from far (the history, the
  people of a trip, passkeys, linked chats) arrives inside it, and such a sheet is tall
  from the start, so nothing moves when it comes. The history no longer waits for the
  service to say who made each version: the rows come first, the names after.
- **Finding positions**: a tap on a row shows the point found on a small map in the
  sheet, with the day's other stops around it; the tick takes it. Verify no longer
  leaves the app for Google Maps.
- One sheet for all (`js/sheet.js`): the same title and ×, a tap outside or Escape
  closes it. Measured in the tests: a sheet that takes more than 100 ms to appear fails.
- **You** has no Back link: the circle at the top right, which opens You, is the way
  back from it.

## 4.4.0

- **The weather**, from today to 3 days ahead: the day's sky and its lowest and highest
  temperature next to sunrise and sunset.
- **A warning only where it matters**: on a park, a view or a walk, at its time: storm,
  rain, strong wind; heat and cold with what to do. In the day's line: the first and how
  many stops, and the day's other plan as its action. A museum in the rain says nothing.
- A day gone keeps the last forecast it had ("was 21°, sun"), on this phone.
- From MET Norway (CC BY 4.0, named under You, About), through TIMP's service: only a
  place rounded to about 10 km leaves the phone. Needs TIMP-share 1.11.0.

## 4.3.0

- **Only for me**, on a shared trip: choosing an option asks "Only for me" or "For
  everyone". Only for me: nobody else sees it, and the trip gets no new version. Your
  choice is marked "Only you", with the group's named under it; the numbers, the route,
  the map and the costs follow yours. Choosing the group's option again takes you back.
- Shared to read only: an option is chosen only for you at once, with Undo.
- **Ticks, skips, the plan you look at and your own choices** now reach all your phones
  on the account (until now they stayed on one phone). They stay yours: never in the
  trip, never seen by the people it is shared with, nor by a linked chat.
- Needs TIMP-share 1.10.0 (the service keeps a personal set without expenses).

## 4.2.2

- **List | Map while scrolling** keeps your place, like a larger or smaller map: the
  stop you were reading stays at its line, just under the map or the bar.

## 4.2.1

- **The map** has an edge and a shadow at its bottom: the stops slide under it, clearly.
- **Larger and smaller map while scrolling** push the list down instead of covering it:
  the stop you were reading stays just under the map, at the same line. (4.1.7 measured
  it after the map had already grown.) Checked in Chrome and in WebKit.

## 4.2.0

- **Parts of the day**: a stop's time is a clock time or one of seven parts: sunrise,
  morning, midday, afternoon, sunset, evening, night. The form offers only these, so a
  time never wraps. In the list each part has its sign, the sun on its arc then the
  moon; sunrise and sunset show their real time where the day is ("Sunset · 20:12").
- Words written before ("Evening", "Pranzo", "Cena", in several languages) are shown as
  their part and keep their place in the day; files are not rewritten. Another word is
  shown as written, and the check warns.
- **All day**: a stop with no time goes at the top of the day.
- The format and the guide for chats (`llms.txt`) say it; the design system has rules
  T1–T5 and a Time section.

## 4.1.7

- **The map**: larger and smaller at once, without the lag, and the list is pushed down so
  the stop you were looking at stays under the map. Holding a stop's name shows it on the
  map, like its number.
- **Zoom**: the app no longer zooms with two fingers; the map does, also when a pinch
  starts on the names of a day's places. Text still grows with the phone's text size.
- **The row of days** runs to the end of the bar on Info, Trips and You.
- **A day's notes** in its form: one field each, with ✕ to take one away and "+ Add a
  note". They used to be one box where notes ran together.
- **A day with one stop** draws no line.

## 4.1.6

- **The app is now checked in WebKit**, Safari's engine, on every change
  (`tools/webkit.mjs`: WebKitGTK on Linux in the CI, Safari on a Mac; no new dependencies): no page wider than the screen, even with very long
  texts; the bar of one size on every page; the map still under the bar; a search field
  Safari does not zoom into, with its results fixed under the bar.
- Tests: Chrome gets a minute to start on a busy runner, and a second try.

## 4.1.5

- **iPhone**: a day was wider than the screen (Safari sized the page by the full length
  of a line kept on one line, such as the day's line or a folded description): the cards
  went past the right edge and their circle could not be seen. The page's column is now
  never wider than the screen, and the e2e checks it on every day.

## 4.1.4

- **Search in the bar**: the lens becomes ✕ and the field takes the title's place; only
  the circle of you stays. The results fill a panel fixed under the bar that scrolls on
  its own: on Android it no longer moves or shrinks with the results and the keyboard.
  ✕, Escape, the circle of you or another page close it. One ✕ only.
- **A day's notes** are found by their own words: searching a city no longer lists every
  note of its days.
- The design system's rules (S5, S6) and page follow.

## 4.1.3

- **iPhone**: with the app installed on an iPhone with a notch, the map stays right
  under the bar (it went partly under it), and the list goes to now, to a search result
  or to a stop chosen on the map, under the bar too. The search field no longer makes
  Safari zoom the page. On Safari before 16.2 the ring of the next stop, the line of now
  and the marked words stay.
- **The trip's title**: the sign that opens the list of trips sits beside the title and
  its dates, in line with the search and the circle of you.

## 4.1.2

- **The map no longer moves** when the list starts to scroll: it is right under the bar
  from the start (it began 16 points lower, then climbed).
- **Larger map**: the button with the corners makes the map larger, and smaller again;
  the whole day is framed again, and the choice is kept. Before, it only framed the day,
  which the map already showed. The map starts a little lower.

## 4.1.1

- **List | Map** moves to the end of the row of days, and keeps its place on every page
  of a trip: going to Info, Trips or You no longer changes the bar, and the page no
  longer jumps by two points. The trip's title has more room.

## 4.1.0

The map, in the design system ([design/README.md](design/README.md), M1–M9).

- **A view of the day**: List | Map in the top bar. The map takes the heading's place,
  right under the bar, and stays there while the day's stops scroll under it.
- **Pins are stations**: the stop's number in its kind's colour, the same sign as in the
  list; done, empty and grey. A tap on a pin brings its stop just under the map, marked
  (no card on the map); a tap on a number in the list shows its pin.
- **The lines are always there**, in dots where you have been. No switch for them, and no
  choice between map and sketch: the sketch comes by itself without a connection.
- **Two controls**: my position (asked of the phone only when tapped; it stays on the
  phone) and the whole day. Zoom with the fingers.
- The design system's page shows the map too.

## 4.0.1

- **A group of alternatives with no choice yet** no longer draws a stray piece of line in
  the middle of its card.
- **The design system as a page** (`design/index.html`, published at `/design/`): the
  tokens with their contrast in the theme chosen, the line of the day, a stop, the
  alternatives, the day, the day itself, the signals, search, accessibility; everything
  drawn with the app's own styles. Never kept offline.

## 4.0.0

The design system ([design/README.md](design/README.md)): one set of tokens, rules for
every screen, accessibility in each. This release brings it to the day.

- **Tokens** (`design/tokens.json`, `css/tokens.css` made from it): colours checked for
  contrast in both themes, seven text sizes in rem, spaces, radii, durations. **Inter**,
  kept with the app (no request at startup, offline). "Reduce motion" is followed.
- **The map is always light**, in the dark theme too; pins are never lighter than their
  kind's colour, so their numbers stay readable.
- **The top bar**: the trip is the title (a tap opens the list of trips), List | Map, you;
  the days under it, today called so.
- **A day**: its heading with its city written as the name of a line. **The day's line**:
  what matters today in one place (closed doors and bookings of the stops ahead, choices
  to make, stops without a position, the notes), the first and "+N", each with its action.
- **A stop**: a card of its own on the line of the day, its number in the colour of its
  kind (the same sign as on the map), the time above the name, the name on two lines,
  one signal and "+N". Opened: every signal, the description, then "Go" (Map, Directions,
  TheFork) and, quieter, "Change" (Edit, Skip, + Alternative): no more ⋯. Done: a tick
  in ink.
- **Alternatives**: chosen, the option and "+N"; opened, the options as a choice to make;
  with no choice yet, dashed, the options in view.
- **On the day itself**: the list goes to now, a mark says how long until the next stop,
  which is open; the stops done are in one line; when the next stop's card leaves the
  screen, a bar at the bottom brings it back and gives Directions from where you are.
- **Adding** is the last row of every day (a new stop, or what a chat wrote); + floats on
  the other days only.
- **Accessibility**: every control named and its state said, areas of 44 points, stop
  names as headings under the day's; checked by the e2e.
- **Search**: a lens in the top bar searches the whole trip as you type, offline: names,
  local names, descriptions, addresses, labels, groups, plans, the days' notes; without
  accents or case, every word found. A result shows the stop's sign, its day and time,
  the word marked; a tap goes to the stop, open and in view (`js/search.js`).

## 3.32.2

- **A stop without a position** has a crossed sign where its number would be, instead of
  the "no position" label: a tap finds its position (that stop only).
- **The search for positions** no longer jumps while it searches: the rows have their
  final size from the start, and only the one that changes is drawn again.

## 3.32.1

- **A phone that had the app of before when its shared trip was converted** (3.30.0)
  sends its changes once updated. The service refuses, from an app of before, a version
  with stop ids made from titles on a converted trip; this app now converts the changes
  not yet sent when it starts. And if the app of before joined the converted trip with
  them (it joined without converting: a stop it changed kept twice, a removal undone),
  that join is made again with this app's, first: nothing twice, nothing lost.

## 3.32.0

- **Alternatives for one moment of the day**: a meal at one of three places, one museum
  or another. They are stops like the others in the same day, with the same `choice`
  ("Lunch"), the one the day goes to `"chosen": true` (two optional fields: the format
  stays `travel-in-my-pocket/2`; an older app shows them as stops one after the other).
  The day shows the group's name, the chosen option as a stop, the others in one line;
  a tap opens them all, with **Choose this** and **+ Alternative**. The number, the
  route, the map and the day's costs follow the chosen one; a group with none chosen
  says "1 choice to make", with what it may cost. **Add an alternative** in any stop's
  ⋯; a tick on an option not chosen asks whether you went there; moving one asks
  whether it goes alone or with its group. Not chosen ones stay in the trip.
- **The plan a day goes with is in the trip**, for everyone (`"chosen": true` on a plan;
  without it, the first). Looking at another, **Choose … for everyone**.
- **On a shared trip, a change everyone will see** made with one tap (choosing an
  option or a plan, restoring a version) asks first, saying who will see it. Made with a
  form and Save, it is not asked: a message says it was saved for everyone, with Undo.
- **Assistants** see the groups in the outline (`Lunch: chosen`, `Lunch: option`), add an
  option with the same `choice`, and choose one with `"chosen": true` (the others lose
  it). The guide says: plans only when the whole day changes; for one meal, a choice.
- **History** says it in words: "Dinner: Rifugio chosen", "Lunch: + Mercado".
- **Positions: Leave as it is.** After a search, with nothing ticked (a train has no
  position on purpose), the line about stops without a position moves below the stops,
  as after saving some.

## 3.31.0

- **Positions for the stops that lack one, all at once.** Stops an AI assistant wrote
  often come without a position: no pin, no route. A line above the day's stops says how
  many, with **Find**: each one is searched as the stop form searches it, then shown to
  be checked before anything is saved (the place found, its kind, how far it is from the
  other stops, **Verify** on Google Maps). A result more than 30 km away comes unticked.
  The ticked ones are saved as one new version; what is left moves below the stops. Not
  on a trip that cannot be changed (locked, someone else's page, shared to read).
- **The day's notes in one line**: how many, and the start of the first. A tap opens
  them all, numbered; open or closed is remembered for the trip on this phone. Before,
  each note was a box of its own, and with four of them the stops started halfway down
  the screen.

## 3.30.0

**Every stop has an id of its own, unique in the trip.** Before, a stop's id came from
its title (`lunch`, `lunch-2`) and was unique only in its day or plan: the same id could
be in two places of a trip, and a join had to guess which stop was which. Now:

- **A new stop gets a random id**: twelve characters, `0-9` and `a-z`, the last one a
  check. Two stops with the same title are two stops, also when two phones add them.
- **The ids of before become ids of their own by a fixed rule** (the SHA-256 of the
  trip, the day and the old id): every phone, the sharing service and a join make the
  same id from the same old one, without asking each other. The app converts the trips
  only on the phone when it starts, as a new version made from the one it had: the same
  version on every phone. Trips on an account are converted by the sharing service, once
  for everyone. Ticks, skips and the private expenses paid at a stop follow; History says
  "Stops given ids of their own".
- **A stop copied with its id** (an AI assistant that copied a stop in the file, a file
  edited by hand) is two stops: the original keeps the id (the one where the version the
  file was made from has it), the copy gets its own. On loading a file, on changes from
  an assistant, in every join.
- Changes from an assistant that still name a stop by its id of before (an outline read
  before) find the stop it became. Bringing back a version from before (History →
  Restore) gives its stops the ids they have now.
- Joins of a version from before with one converted join stop by stop, as if both were
  converted: checked on random edits, with phones of before and copies among them.

The format does not change (`travel-in-my-pocket/2`): the new ids follow its rule, so an
older app opens the trips. For contributors: `js/ids.js`; `addStop` takes the id as a
fourth argument in the tests.

## 3.29.0

Joining two versions, made robust. After #1 we stopped trusting hand-picked cases: the
joins are now held to their rules on thousands of random edits made on two phones, and
on three phones that edit, bring back old versions and sync in any order. That found,
and this release fixes:

- **A join that made an invalid trip**, which then could not be synced: a plan added to
  a day on one phone (or by a linked chat) while a stop of that day changed on another;
  a plan removed on one side while one of its stops changed on the other; each side
  removing one of the last two stops, plans, days or expenses.
- **Notes, closing days and lines of the Info page** added on two phones: both are kept.
  Before, one of the two was lost.
- **An expense added on one phone** while the other removed the last one: kept.
- **A stop doubled** after it was moved on one phone and changed on another, also when
  its id is used in another plan of the trip; or brought back on two phones with
  History → Restore and moved on one.
- **Stops out of time order** after a join, when one side changed a time.
- Joining a version with a copy that changed nothing gives that version, exactly: no
  extra versions.

For contributors: `test/merge-properties.test.mjs` (400 random cases in every test run),
and a weekly workflow that tries 20,000 more. A new kind of edit gets its step there.

## 3.28.1

Two fixes from the first outside contribution: thank you,
[@Akkatrone](https://github.com/Akkatrone) ([#1](https://github.com/Frafal/TIMP/pull/1)).

- **A stop moved to another day on one phone, and changed on another** (or by a linked
  chat), no longer comes back twice after the two are joined: it is on its new day, with
  the change. When both move it, the same side wins on every phone.
- **Use as a base** keeps a place's closing dates as they are, instead of moving them
  with the trip to days when the place is open. From a page with hidden dates, whose
  dates are not real, they are left out; closing days of the week stay.
- Tests: every stop moved on one side and changed, or moved elsewhere, on the other; 200
  random pairs of edits, joined in both orders.
- **README** much shorter: what the app does, how to start, how to make a trip, the
  account and linked chats, privacy in short. The details moved to
  [Using the app](docs/using-the-app.md), [Privacy](docs/privacy.md) and
  [Google Maps](docs/google-maps.md).
- The checks need Node 22 or later (CI on 22 and 24); the e2e says why when it fails.

## 3.28.0

Linking a chat app, said where it is needed.

- **You → Linked chats → Link a chat**: the connector's address, with Copy, and the
  steps for Claude and ChatGPT. Before, the app said to add a connector without saying
  which address.
- **README**: "With an account" (sync, sharing, publishing, lock, history) and "Link a
  chat app (Claude, ChatGPT)": how, and what a linked chat can and cannot do.
- **llms.txt**: a chat with TIMP's tools uses them, not files; one without them can be
  linked.

## 3.27.2

- History: an open version lists every change, however many (no more "and N more"),
  and closes with a tap anywhere on it.

## 3.27.1

- History: versions made before the service kept how they were made no longer say
  "in the app" (some were made by a chat): only who made them, on a shared trip.

## 3.27.0

The history of a trip, easier to read.

- **One line per version**: what it changed first, with how many more changes; a tap
  opens it, with every change and "Restore".
- **Who made it, and how**: for a trip on the account, "in the app" or "with Claude"
  (the chat app that made it), and the name of whoever made it on a shared trip.
  The service says so (`via` in a trip's history, new in the contract).
- **What changed besides the stops**, in words: the day and what of it (notes, night,
  name or city, plans; a day added or taken away), and the trip's own (practical info,
  expenses), instead of "Other changes".
- For chat apps: to change a day's notes, the whole list as it should be.

## 3.26.0

Published trips, from their page into the app.

- **Open in TIMP**, on a published trip's page: the trip on your phone, read only (with
  the map, offline), under "From others" on Trips, with who published it. Opened again,
  it is brought up to date. It is theirs: it never goes to your account, and you can
  delete it whenever you like.
- **Use as a base**, on the page or on that trip's card: a copy all yours, from the first
  day you choose (asked when its dates were not published), that you change as you like
  and that syncs like your other trips. The original learns nothing of it.
- The copy says where it came from: "Based on … by @…", with the page's link. In the
  file: `basedOn` (`url`, `title`, `by`), written by the app.
- A trip published without its dates shows the day of the week and "Day N", never a
  made-up date.
- **Sheets**: a long title wraps beside the ×, which keeps its size; the buttons beside
  long names (Remove, Unlink, Take off) too.

## 3.25.1

- **Passkeys and devices, Linked chats, Share** open whole: their lists are loaded
  first, so the sheet no longer opens empty and then grows under your finger. The
  button you tapped waits meanwhile.

## 3.25.0

Publishing a trip, with the link.

- **Share → With the link → Publish**: a page anyone with its address can read, even
  without the app; it never shows up in searches.
- **What goes out is shown first**: booking codes, phone numbers, emails and where you
  sleep are found in the trip and taken out (ticked) unless you keep them. Your private
  expenses, a Google key and the trip's history never go. The service makes the page
  from the version on your account, with the same rules: no phone can publish more.
- **Dates**: as "Day 1, 2…" with the day of the week and the month (a trip not done
  yet), or the real ones.
- **Then**: the page's address to send or copy, **Publish again** after changes (the
  same address), **Withdraw** (the page then says it was withdrawn). The card says
  "With the link".
- Published under CC BY 4.0: whoever copies it says it is yours.

## 3.24.1

- **Trips** stays in view at the top right, next to the circle: on a phone the days
  scroll on their own and no longer push it out of sight.

## 3.24.0

You: the account and the settings in a place of their own.

- **The circle at the top right**, on every page: your initial when you are signed in
  (a photo, one day), a person when not. It opens **You**.
- **You** has the account (who you are, since when; passkeys and devices, linked chats,
  export, sign out, delete; or sign in and make an account), then the **settings of
  this device** (map and Google key, language, theme, your currency, install), then
  the app's version.
- **Trips** has only the trips: the open one, the others, loading and pasting, the AI
  assistant. When you are signed in, one line says whether they are synced, with Sync
  now (and the trips taken off this phone, to bring back).

## 3.23.0

Safer account, after a security review.

- **Linking a chat app** asks for your passkey again when you did not sign in during the
  last few minutes: a link lasts longer than a session, so a phone left open is not
  enough to make one.
- **A recovery code resets who can get in**: the new passkey made on this phone replaces
  all the others (a lost phone's passkey stops working), every other device is signed
  out, and every linked chat is unlinked. The codes now say plainly that whoever has one
  can get into the account.
- **Removing a passkey** also signs out the devices that signed in with it.

## 3.22.1

Faster with big trips.

- Comparing and hashing a trip (`canonical` in `js/version.js`) in one pass: the same
  text as before, held to it by a test, so every version id stays the same.
- Checking a trip asks each time zone once, not once per place.
- On the sharing service, with these and its own changes, a change to a 60-day trip
  costs about a fifth of the CPU it did.

## 3.22.0

Recovery codes, for when every passkey is lost.

- **Passkeys and devices → Recovery codes**: ten codes, shown once, to copy or save as a
  file and keep away from the phone. How many are left, and when they were made. New
  ones replace the old (asked first); making them asks for your passkey again when you
  did not just sign in.
- **Lost your passkey?** In the form to make an account: your handle and one code, and
  the phone makes a new passkey. Every other device is signed out (a lost phone too);
  the code works once.

## 3.21.0

Passkeys and devices.

- **Trips → Account → Passkeys and devices**: the account's passkeys, with the device
  each was made on, when added and when last used; the devices signed in, this one
  marked.
- **Add a passkey on this device**, so a lost phone does not lock you out. **Remove**
  one you no longer use; never the last. Both ask for your passkey again when you did
  not sign in during the last few minutes.
- **Sign out all other devices**, at once: they need a passkey to come back.

## 3.20.0

Sharing a trip, from the app.

- **Share** on a trip of yours on the account: who sees it and what they may do (see
  it, change it), with Take off; the invites not accepted yet, with Take back; a new
  invite as a link, for one person, for 14 days, sent however you like.
- **A link received** opens the app: sign in (or make an account), and the trip joins
  yours, shared with you; on every phone of yours at the next sync.

## 3.19.0

The Trips page, for people who travel a lot.

- **The open trip on top**, in full: under way (which day of how many), coming (in how
  many days) or over, its dates, and what you can do with it.
- **My trips below**, one line each: title, dates, days, and small signs (locked,
  shared, not synced). A line opens to the trip's details and its Open button.
- **Grouped by when**: under way, coming, then past by year, the latest first. Or one
  list **by name** or **by recently loaded**; the choice is kept.
- **Find a trip** by its title or a city, when there are many.

## 3.18.0

Locked trips.

- **Lock** on a trip's card (Trips): the trip stays at its version. No edits, no
  changes pasted from an assistant or made by a linked chat, no file taken into it, no
  older version brought back, no deleting, until you unlock it. Ticks and private
  expenses still work: they are not the trip's version.
- **On your account** the lock is the owner's, for every phone and for the people the
  trip is shared with; a phone that had changes waiting says so on the card and keeps
  them until the trip is unlocked. A trip on this phone only is locked on this phone.

## 3.17.0

Private expenses for chats, only if you tick them.

- **Connecting a chat app**: when it asks for your private expenses too, the question
  shows "Also my private expenses: read them and change them", not ticked. Left so,
  the chat reaches your trips only. Ticked, it can read your private expenses with the
  trip, add and change them; taking one away still needs your yes, as for stops.
- **Linked chats** says which chats can reach your private expenses.

## 3.16.0

Your data, yours.

- **Trips → Account**: one place for what you can do with your account: the linked
  chats, a copy of your data, signing out, deleting it.
- **Export my data**: a file with everything the service keeps about you, readable:
  your trips and those shared with you, your private expenses, the linked chats, and
  what the service noted (sign-ins, chats, deletions).
- **Delete account**: for good, asked twice: write your handle, then your passkey is
  asked. Your trips and private expenses go from the service, also for the people you
  share them with; what you wrote on other people's trips stays in their history,
  without your name. The trips on this phone stay, on this phone only.

## 3.15.0

Chats that change your trips; deleting for good asks for the trip's name.

- **Delete from my account** now asks once more: write the trip's name, and only then
  "Delete for good" can be pressed. It goes from every phone and for the people it is
  shared with, so one tap is no longer enough. "This phone only" asks as before.
- **Claude, ChatGPT and other chat apps can change your trips** (on the sharing
  service): they change the version they read and their changes join those made on
  your phones; anything they would take away or empty, they ask you first. They can
  also put a new trip on your account. Your private expenses stay out of their reach.

## 3.14.1

Sync that says what went wrong.

- **One trip does not stop the others**: if the service fails on a trip, the others
  still sync; that trip's card says "Not synced" and why, and the next sync tries it
  again. Before, one failing trip stopped every trip after it, with only "Sync did not
  work" to see.
- **Put on my account**: a trip marked "No longer on your account" (deleted from the
  account on another phone, or no longer shared with you) can go back on it, as yours.
- The service let a trip deleted from the account block the same trip going on it
  again (the example, loaded once more): fixed there.

## 3.14.0

Linked chats.

- **Trips → Linked chats**: the chat apps that can reach your trips, what each can do,
  since when and when it was last used. Unlink stops one at once; to link it again you
  start from the chat.
- **Chats can read your trips**: in a few words, the trip day by day with the ids of
  its stops, then a day, a stop or the practical information in full. Your private
  expenses stay out.

## 3.13.0

Your trips in Claude and ChatGPT: the first step.

- **A chat app can ask for your trips**: connecting TIMP in Claude, ChatGPT or Claude
  Code opens the app, which shows who asks, what it will be able to do (read your trips,
  change them) and where the answer goes. You allow or deny, signed in with your
  passkey; the chat app gets a key of its own, never your passkey or your session. Only
  on a copy of the app with a sharing service, and only with an account.
- For now the chat lists your trips. Reading their days and stops, and changing them,
  come next.

## 3.12.2

Asking an AI assistant, from the phone.

- **Write your request in the app**: a box for the trip to write ("Your trip") and one
  for the changes to the open trip ("What to change"). Copy makes the whole message,
  with your words as its last line: in the chat you only paste and send. What you wrote
  stays on the phone until you clear it, one draft per trip.
- **The messages end with the line to fill in**: the format and the trip come first.
  With an empty box, the part in brackets is there to complete in the chat, right
  where the cursor is.

## 3.12.1

Deleting a trip that is on your account.

- **Delete asks where**: from this phone only (it stays on your account and your other
  phones, and is not downloaded here again, until "Bring back trips taken off"), or
  from your account (gone from every phone, also for the people you shared it with).
  A trip shared with you: this phone only, or leave the sharing.
- **A trip deleted on another phone, or no longer shared with you**, stays on this
  phone, marked "No longer on your account", and is no longer sent: before, every sync
  failed on it.
- **A new phone** that signs in shows the trips that arrive from the account: before,
  they came but nothing opened them.

## 3.12.0

Your trips on every phone.

- **Sync**: signed in, your trips go to your account and come back on your other
  phones, by themselves: after every change, when the connection comes back, when you
  open the app, or with "Sync now". The same rules as two files: what one side has is
  taken, what both changed is joined, the same version on every phone.
- **Private expenses** sync too, for you only: joined by expense, what changed wins and
  what you delete goes from your other phones as well.
- **Trips shared with you** come down; read-only ones keep your changes on your phone.
- A synced trip no longer asks to be saved as a file: the account keeps it. Files work
  as before.

## 3.11.0

An account, if you want one.

- **Account**, at the top of Trips and on the welcome screen, only on a copy of the app
  that has a sharing service (built with `--share`). Created with an invitation code
  and a **passkey**: no password, no email; the phone makes a key that never leaves
  it, opened with your fingerprint, face or PIN. Sign in again on any phone with the
  same passkey; sign out when you like. Without an account the app is as before.
- **The sharing service's API is a contract** (`js/share-api.js`): every route, what it
  takes and answers, checked on both sides; `contract/v1.lock.json` and
  `tools/check-contract.mjs` keep it from breaking. Next: your trips synced between
  phones, and shared with people.

## 3.10.0

Maps you can read, wherever you are.

- **The map of OpenStreetMap is drawn by the phone** (MapLibre, with OpenFreeMap's
  vector tiles), instead of being a mosaic of pictures. Names are in the app's
  language, or in Latin letters, and under them as on the signs when the place writes
  in another script: "Kyoto" over "京都市", "Shibuya Station" over "渋谷駅",
  "Jongno 3-ga" over "종로3가". In Europe nothing changes but the look.
- **A real dark map** in the dark theme, instead of the light one turned around.
- **Sturdier**: if OpenFreeMap does not answer, the same map comes as pictures from
  OpenStreetMap, as before. A phone without WebGL keeps the sketch.
- MapLibre takes the place of Leaflet. It is downloaded the first time a map is
  opened, not with the app: the interactive map needs a connection anyway.

## 3.9.0

Ready for trips that are not only yours.

- **Two trips with the same name and first day** have the same id. A file that shares
  no version with the trip on the phone (a friend's trip, say) was offered for a
  merge; now the app asks, and can keep it as a trip of its own, under a new id. It
  can still join them, for the same trip written again from scratch.
- **Changes say which version they were written for.** The outline for an assistant
  names the trip's version, and the changes carry it back in `from`. If the trip has
  changed on the phone in the meantime, the changes are applied to the version the
  assistant saw and joined with what came after, as two files are, instead of
  landing on a trip the assistant never read.

## 3.8.1

Buttons that feel like buttons.

- **No box around a tapped button**: the phone's own tap highlight, a rectangle that
  ignored the round shape of the buttons, is gone everywhere. A pressed button gives
  way a little instead; links and rows fade while pressed.
- **No ring after a tap**: the app puts the focus back on the button it draws again,
  or on the first button of a dialog, for keyboards and screen readers. After a tap
  that showed a ring wider than the button, on iPhone above all. Rings now show only
  after a key.
- Text on buttons is not selected by a long press, and hover effects stay with the
  mouse: on a phone they stuck after the tap.

## 3.8.0

What the trip costs you, and what you keep for yourself.

- **A cost is what you pay**: your share of what is split with others, so a double
  room for two is half its price. The app no longer needs to know how many travel:
  the trip's total is what it costs the person who holds it. In 3.7 a cost was the
  total for everyone; costs written then are worth a look.
- **Private expenses**, for what you buy only for yourself: a watch, a thousand
  onigiri. Under every amount, Trip or Private; a stop can have both, its cost and
  what you spent there privately ("€30 · ¥1,500 private"). A mistake is one tap away:
  change the choice and save, and the expense moves.
- **Kept out of the shared trip**: private expenses are on your phone and in your
  file, but never in a version or a merge. The trip with or without them is the same
  version, so a friend who skips them shares the trip with you as before.
- **You choose what a file carries**: Save the file asks, when there are private
  expenses, whether they go in it (for you) or not (for someone else).
- **A file with private expenses** is recognised: your own are taken; someone else's
  are asked about, in the merge question or in one of their own, and left out unless
  you say so. Those an assistant wrote, no one's yet, become yours if you take them.
- **Info** counts them apart: the trip's costs and the private ones, a list of them,
  and a lock on the receipt.
- **AI assistants** see them in the outline and change them with `"private": true`;
  the format guide says a cost is the traveller's share.

## 3.7.0

What the trip costs, and stops as cards.

- **Stops are cards**, as in the lists of Android (Gmail, Settings): a light card on a
  darker page, a little apart, rounder at the two ends of the list. In the dark theme
  the page is nearly black and the cards dark grey. Done and skipped stops sink halfway
  into the page.
- **What a stop costs**: written in its form (the amount as you type it, "16.000" or
  "4,50", and its currency on two buttons, the trip's and yours, or any other). It
  shows small under the stop's time, in the currency it is paid in; an opened stop has
  it as its last line, and one more tap shows what it makes in your currency, with the
  rate. Next to "2/5 done", the day's total.
- **At the rate of its day**: each cost is converted at the rate of the day it is paid,
  a stop on its day, an expense on the date it was paid, not the day you look at it.
  Days still to come use today's rate, marked ≈, as an estimate that may change.
- **Expenses outside the stops**: flights, hotels, passes, often paid before leaving,
  each with the date it was paid.
- **What the trip costs**, folded at the end of Info: the total in your currency, the
  dollar, the euro or the trip's, how much is done and how much still to come; day by
  day, by kind of place, and the expenses. Or the same as a receipt.
- **Your currency** is a setting of the phone (Trips), taken from its language at
  first: two people on the same trip can each see their own.
- The rates come from Frankfurter (frankfurter.dev, open source, the median of about
  90 central banks for every day). What leaves the phone is only which month: the
  request is always "every currency against the euro, this month", never an amount, a
  place or the trip's currency. Each month is kept on the phone, so costs convert
  offline once it is there. A new exception to "the trip never leaves the device",
  written in the README.
- Trip format: optional `cost` and `currency` on a stop, `currency` and `expenses` on
  the trip. Changes from an assistant can set them: `setTrip`, `addExpense`,
  `setExpense`, `removeExpense`. Older apps load these files and ignore the costs.

## 3.6.1

What a first try on real phones showed.

- **Holding a number** no longer leaves words selected: while the finger is down
  nothing on the page can be selected, and the phone's own menu does not open.
- **Directions start from the stop before** (not skipped, with a place), in the list
  and on the map. The first stop of a day starts from where the night before was
  spent, or else from the last place of the day before. From where you are: Map.
- **The cards on the map** show the name as on the sign and, for a place to eat, the
  review link. On Google Maps a tap outside the card closes it, and its close button
  shows in the dark theme too (the page's dark color-scheme drew it white on white).
- **Paste** opens its sheet first; Paste in the sheet reads what was copied into the
  field, where you see it before Continue. The phone asks for permission only then.
- **iPhone:** the fields of the forms are 16 px, so the page no longer zooms in when
  you type; lists look the same on every phone, and Day and Time line up.

## 3.6.0

- **Hold a stop's number to see it on the map.** The map opens if it is closed, and the
  pin comes to the middle with its card; on the sketch, its badge pulses. Only a hold:
  a tap or a scroll that starts on the number does nothing.
- The TheFork link searches only TheFork's pages, on its site in the app's language
  (thefork.it in Italian, thefork.com otherwise): a list shows at once whether the
  place is there. TheFork lists only its partners, so a jump to the first result
  could land on another restaurant.
- **Lines on and off without drawing the map again.** The lines and the travel icons
  are always drawn and only hidden: the map keeps its zoom and its place.
- **llms.txt says its version**, and what changed in the format version by version, at
  the top. It asks the assistant to remember the version and to read the page again
  before changing a trip later in the chat. The list comes from a new section of
  docs/trip-format.md, "What changed, version by version".
- The messages the app copies for an assistant (change this trip, problems to fix)
  carry the app's version and the guide's address: in a chat that read an older guide,
  that is the signal to read it again.
- llms.txt is shorter: about 535 lines instead of 991. What only matters inside the
  repository (the checker, the code, versions and maps inside the app, the old format)
  is left out between `<!-- llms.txt: skip -->` markers in the docs, and the complete
  example is one stop per line, without the ids the app writes.

## 3.5.0

- **Places to eat.** Three optional fields for every stop, so files written for 3.4
  still load and older apps ignore them with a warning:
  - `local`: the name as on the sign ("一蘭 渋谷店"), shown under the title.
  - `booking`: `required` shows a warning until it is done, `advised` a softer line,
    `booked` the Booked label. Set it in the stop form (Booking: Done after booking).
  - `closed`: days of the week and dates. The stop warns when its day is one of them,
    also after it is moved. Seven day buttons in the form.
- A review link on food stops, from the stop's position or the trip's time zone:
  Tabelog in Japan (searched by the local name), Naver Map in Korea, Yelp in North
  America, TheFork in Europe (through a web search: its own search pages cannot be
  linked by a name). New js/places.js, no DOM. Nothing is fetched by the app.
- The guide for assistants (docs/creating-a-trip.md, llms.txt) has a section on places
  to eat: local names, booking, closing days, how the place works, a fallback nearby,
  and no invented links to review sites. The outline for changes shows booking and
  closing days.
- The example trip: a dinner that is better booked, a lunch closed on Sundays.

## 3.4.0

- **Days in the app.** Each day has its own ⋯, next to Map of the day. **Edit day**
  changes its city, title, where you sleep and its notes, or deletes the day (asked
  first; History brings it back). **Add a day** opens the stop form on a new day after
  the last: a day cannot be empty, so it is made with its first stop. The stop form
  also offers that new day at the end of its list of days.
- **Plans from an AI assistant.** The changes format has `addPlan`, `setPlan` and
  `removePlan`: "add a plan B for day 3 if it rains" gives the day a second plan to
  choose. On a day without plans, the stops it has become the first plan, named by
  `first`, with their ticks; a day left with one plan has plain stops again.
- Plans stay out of the app's forms on purpose: an alternative itinerary is written
  when the trip is planned, and an assistant writes it better than a phone keyboard.

## 3.3.1

- Paste shows its word only at the top or at the end of a page; anywhere in between it
  is only its icon, scrolling up as well.

## 3.3.0

- **Paste**, at the bottom of every page of a trip, next to +: it reads what you copied
  and does what the Share menu does on Android. A place from Google Maps opens the stop
  form filled in; an AI assistant's answer, a trip or its changes, is loaded. On an
  iPhone, where web apps cannot appear in the Share menu, this is the way in: Copy, then
  Paste. If the phone does not hand over what was copied, a field to paste it opens.
  While the page scrolls down it shrinks to its icon; scrolling up, its word is back.
- The time of a stop is chosen from two lists, hour and minutes, instead of the phone's
  clock: Chrome on Android put that clock's Set button off narrow screens.
- The + button is the accent colour in both themes: the dark one was hard to see.

## 3.2.1

- Samsung Internet can install the app again: it failed ("Download failed") with the
  manifest whose share target takes files. It now gets the same manifest sharing text
  and links only (manifest-basic.webmanifest); Chrome keeps file sharing.
- The list of days shows no scroll bar in Samsung Internet either: the bar is drawn in
  room below the list that its box cuts off.
- Dark theme: the + button is a dark raised button instead of a white disc. The page
  declares it supports light and dark (color-scheme), and the manifest gives the colours
  of the installed app's bars for a dark phone, for the browsers that read them.
- The time picker has no Clear button, which pushed Set off narrow screens on Android.

## 3.2.0

Colours that say what and when, sunrise and sunset, and files shared to the app.

- **Colours on the maps.** Each pin is filled with the colour of its kind of place
  (gold for sights, violet for museums, red for food, green for parks, blue for views,
  pink for shops, brown for walks, indigo for hotels); the lines take the city's. The
  shade follows the part of the day: lighter in the morning, full in the afternoon,
  darker after sunset. The numbers in the list and in the sketch's legend, and the icon
  by each title, use the same colours.
- **Sunrise and sunset**, worked out on the phone from the date and the first stop with
  a position (js/sun.js: no network, nothing in the file). The day shows them under its
  date, and the stops after dark have a moon by their time.
- **Android: share a .json file to TIMP.** The app now accepts files in the Share menu,
  such as a trip or a list of changes from Claude or another assistant, besides text
  and links. Android may take a day to notice; reinstalling the app is immediate.
  iPhone does not let web apps receive shares: copy and paste, or Files and Load.
- **No scroll bar on Android.** The page scrolls inside the app instead of the window,
  whose bar Android draws whatever the styles say.

## 3.1.1

- No scroll bars at all: 3.1.0 hid them only on devices that call themselves touch
  only, and some phones do not.
- The bar of days is frosted glass: the page shows blurred under it while scrolling,
  and an edge appears once it has scrolled. The list of days fades out on the side
  where there are more days to scroll to. Day buttons are a little more polished.
- Older Safari (iOS 15.4 to 16.1): solid colours where color-mix() is missing, and the
  link resolver works without AbortSignal.timeout.
- **Lines**, next to Map and Sketch: hides the lines between the stops (and the travel
  icons on them), on both maps. The choice is kept.
- The example trip shows what the app does now: a fourth day in Porto, reached by train,
  with every kind of place, the metro and the flight home, a night that is not a place
  to sleep, two stops sharing a pin, a map of its own for the airport; the bus up to
  Pena; a Google Maps link on a stop; the emergency number to call with a tap.

## 3.1.0

Changing a trip with an AI assistant costs a few lines, not the whole file again.

- **Changes instead of the whole file.** "Have an AI assistant change this trip" copies
  a message with how to write changes and an outline of the trip (a few lines per day,
  every stop with its id). The assistant answers with the changes only, format
  `travel-in-my-pocket/changes`: add, update, move and remove stops; change, add and
  remove days. Paste a trip applies them as one new version, all or none, with the
  reason when one is wrong. llms.txt and the format reference describe it.
- **Android: share the answer to TIMP.** An assistant's answer with a trip or with
  changes, shared to the app, is loaded as if pasted: no copy and paste.
- **A clock for the time** in the stop form: the phone's own time picker. "Write it in
  words" keeps times like "Evening".
- No scroll bars on phones and tablets.
- The note under a day's stops stands apart from them.

## 3.0.2

- The message to give an AI assistant is short again (three lines). It points to
  `llms.txt` in the GitHub repository, which assistants open more readily than the
  app's site; the copy there is checked by `npm run check` and never falls behind.
- For an assistant that opens no link at all, a second button copies the message with
  the whole format.
- At the bottom of Trips, "With an AI assistant": the message to write a new trip, and
  **Have an AI assistant change this trip**, three steps and one button that copies the
  message together with the trip. The answer comes back through Paste a trip, as a new
  version merged like any changed file.

## 3.0.1

- The message to give an AI assistant (first screen, and Trips) now carries the whole
  format, about forty lines made from the table of fields: the assistant needs no link.
  Gemini could not open llms.txt. The message for the problems of a refused file no
  longer points to a link either.
- llms.txt starts with the same short format.

## 3.0.0

A simpler trip file, kinds of places, and Google Maps short links that work.

**The trip file, format 2.** It says what the trip is, and nothing about how it looks:
the app picks colours, draws the maps and chooses the icons.

- Required: `format`, `title`, and for each day its `date` and `stops` (or `plans`);
  for each stop its `title`. Everything else is optional, `time` included.
- No more cross-references: a day has its `city` as a name and its `stay` inside it
  (a name, or `{name, address, note}`); `places` and `stays` are gone.
- Gone, worked out by the app: colours (`color`, `colorDark`), `glyph`, the trip and
  plan `id` (made from title and date when missing), `from`, `mapZones`, `mapImages`,
  `zoneNames`, `mapSplitKm`, `mapLabel`, the stays' `dates`.
- Renamed: `query` → `address`, `reminders` and `note` → `notes`, info `rows` →
  `items` (`number` folds into `text`: a phone number becomes a link to call),
  `map.googleMapsKey` → `googleMapsKey`. `infoNote` becomes an Info section.
- A `type` or `travel` the app does not know yet is a warning, not an error, so newer
  files load in older apps.
- One table in `js/trip.js` describes every field. The checks, the JSON Schema
  (`trip.schema.json`, published with the app for models that follow one) and the
  reference test of the documentation are made from it.
- Old files and the trips on the phone are converted on their own, as a new version
  made from the old one; the same on every phone.

**Kinds of places.** `type`: `sight`, `museum`, `food`, `park`, `view`, `shop`, `walk`,
`hotel`. Each has an icon by the stop's title and on its pin on the map; the stop form
has a row to pick one, filled in from OpenStreetMap or Google when a position is looked up.

**Google Maps short links.** The new link resolver (`worker/`, on Cloudflare Workers)
follows a short link and answers with name, address, position and kind of place. The
app uses it when a short link is pasted or shared; AI assistants that open web
addresses can call it too. It keeps nothing. It is optional: the build gets its address
from the repository variable `RESOLVER_URL` and adds it to the Content-Security-Policy.

Also:

- A link to a street address keeps the house number in the stop's name.
- `llms.txt` and other pages of the site open in a browser where the app is installed:
  the service worker answered them with the app, or with ERR_CACHE_MISS.
- The first screen explains how to have a trip written by an AI assistant, with the
  message to copy; the Trips page has the same, folded.
- The Info page lists the places to sleep with their nights, worked out from the days.
- The map has two views, the interactive map and the sketch: the "Picture" view of
  embedded map pictures is gone with `mapImages`.

## 2.4.0

Trips written by chat assistants (Gemini, ChatGPT…), which read one page and not the
repository.

- `llms.txt` is published with the app (https://frafal.github.io/TIMP/llms.txt): the
  whole format in one page, with a checklist of the mistakes chat assistants make
  first (no "format", "name" instead of "title", places without a colour) and a
  complete example. The build makes it from the documents, so it never falls behind.
- The README tells an assistant reading it to start from that page, and has a prompt
  to copy.
- **Paste a trip**, on the Trips page and the first screen: paste what the assistant
  answered, even with its sentences and the ```json fences around the file. No file
  to save on the phone.
- When a file is refused, **Copy for the assistant** copies every problem with a
  request to fix them following llms.txt, ready to paste into the chat. A text that
  is not JSON says where it breaks.

## 2.3.2

- With the interactive map open, tapping ⋯ or Edit on a stop no longer scrolls the
  page up by the height of the map. The page was rebuilt with the map taken out for a
  moment; it now keeps its height until the map is back.

## 2.3.1

Adding a stop from Google Maps, and the route on the map.

- A street address shared from the Maps app on Android ("Via Roma, 3" and a short
  link) becomes the stop's name and is looked up, instead of being glued to the link
  with no position.
- Positions are searched around the stops of that day first, then anywhere: an
  address without its town is found in the right town. OpenStreetMap is asked at most
  once a second, as its rules want.
- **On the map**, in the stop form: a small map to put the pin by hand, by tapping or
  dragging, when the search got it wrong.
- The field for what Maps shares shows it on several lines.
- A skipped stop leaves the route: the line goes from the stop before it to the one
  after, on the interactive map, on the sketch and in "Open in Google Maps". Its pin
  stays, greyed.
- While a form or a question is open, the page under it no longer scrolls.

## 2.3.0

History, choices when files disagree, and a Content-Security-Policy.

- **History**, on the Trips page: the versions on the phone, each with what it added,
  removed, changed or moved ("+ Museum", "~ Lunch · time"), and **Restore** on any
  earlier one. Restoring makes a new version with the old content, like `git revert`:
  nothing is deleted, and the restore can itself be undone from the History.
- A file that changed separately from the phone no longer merges silently. A dialog
  shows what is new in the file and what is new on the phone, and offers **Join both**,
  **Use only the file** (the file's content, as a new version that remembers the phone's
  changes) or **Cancel**.
- An older file still changes nothing, but its message has **Use this one**, to go back
  to it on purpose, as a new version.
- New way of getting there: **bus**, with its icon by the stop and on the map
  (`"travel": "bus"`).
- A Content-Security-Policy limits where the page may load code from and send requests
  to: the app itself, Google's map servers, OpenStreetMap. It is a second lock behind
  the escaping of trip text. The browser test now fails if the policy blocks anything.
- Trip files do not change; the format stays `travel-in-my-pocket/1`.

## 2.2.0

Versions are kept the way Git keeps them.

- Each version on the phone is a snapshot made of pieces shared with the other versions
  (a stop, a day, a map picture), each stored once under its SHA-256. A version that
  changes one stop adds about 2 KB instead of a full copy of the trip: for a trip of
  100 KB, a hundred changes take about 290 KB instead of 10 MB.
- The history of a version is rebuilt from its parents instead of being stored with
  each one, so it does not grow faster than the versions themselves.
- After a merge, the history lists the versions in the same order on every phone.
- Deleting a trip now deletes its versions too (2.0 and 2.1 left them behind).
- Deleting a trip or a stop asks first, in a dialog of the app with Cancel and Delete.
  It replaces the browser's own box (which claude.ai answers "no" without showing) and
  the second tap on the stop's Delete button.
- The browser database moves to version 3; the full copies kept by 2.0 and 2.1 are moved
  into pieces on first start.
- Trip files do not change.

## 2.1.1

- The message at the bottom of the screen ("New version available", "Save the file")
  uses the whole width: its text no longer wraps one word per line. Messages with a
  button also have a × to close them.
- An app left open in the background looks for a new version when you come back to
  it, and once an hour while it is open, not only when it starts.
- Italian: the merge message reads "tappe nuove 1" instead of "1 nuove".

## 2.1.0

A more compact stop, so more of the day fits on the screen.

- The way you get there (metro, train, plane, boat) moves to the left column, under the
  time and the pin number. The title starts at the edge and has the whole line.
- Labels like "Booking needed" sit above the title, small, and no longer push the links
  onto a second line.
- Skip and Edit move into a ⋯ menu under the tick. The links row keeps only Map and
  Directions, on one line. The menu works with the keyboard, closes with Escape or a tap
  outside, and opens upwards when there is no room below.

## 2.0.2

- "Save the file" works on Android. Chrome offers the share sheet but refuses to share
  `.json` files in it; the app took that refusal as a failure. It now downloads the file
  instead (to Downloads), and goes straight to the download for the rest of the session.

## 2.0.1

- The new icon now shows up after an update. Browsers keep icons by address, apart
  from the page, so the same address kept showing the 1.x icon in the tab and in the
  manifest. The published copy now gives the icons an address per version.

## 2.0.0

Trips can now change on the phone and travel between friends. The app is now called
**TIMP**, with a new icon: a station nameplate with the line's colours and the day's stops.

- **Add, edit, move and delete stops** from the app: a + button on each day and an
  Edit link on each stop. Paste what Google Maps shares, an address or coordinates:
  name, address and position are filled in.
- **Positions are looked up** from the address when they are missing: with Google's
  Geocoding API when the key allows it, with OpenStreetMap otherwise.
- **Android:** the app appears in the Share menu of Google Maps.
- **Versions**, with ids like Git's: every change makes one, shown on the Trips page.
- **Save and share the trip as a file** after a change; the Trips page reminds you
  until the latest version is saved.
- **Merge:** a file of the same trip that changed separately is joined with the one on
  the phone, the same way on every phone.
- New stop field `link`; new top-level field `version`, written by the app.
- A file edited by hand with its old version left in becomes a new version.

Breaking for people who host a copy: the browser database moves to version 2 (a new
store for versions); trips saved by 1.0 are upgraded on first start.

## 1.0.0

First release: offline day-by-day guide from a private trip file; folding descriptions,
done and skipped stops; metro, train, plane and boat icons; interactive map (Google
Maps or OpenStreetMap) and offline sketch; light and dark theme; English and Italian.
