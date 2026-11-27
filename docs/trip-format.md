# The trip file

A trip is one JSON file, in the format `travel-in-my-pocket/2`. The app reads it,
checks it, and keeps it on the device. Nothing in it is ever sent to a server.

The file says **what the trip is**: days, stops, where you sleep, what to remember. It
says nothing about how the app looks: colours, map zones, labels and icons are worked
out by the app from the content. How to write a *good* trip is in
[creating-a-trip.md](creating-a-trip.md).

<!-- llms.txt: skip -->
- Working example: [`examples/demo-trip.json`](../examples/demo-trip.json)
- Check a file: `node tools/validate-trip.mjs --map my-trip.json`
- The same rules as a JSON Schema, for tools and AI assistants that can follow one:
  `trip.schema.json`, published next to the app (for example
  https://usetimp.com/trip.schema.json).

The checker, the schema and the app are all made from one table in
[`js/trip.js`](../js/trip.js) (`FIELDS`): what passes the checker loads in the app.
<!-- llms.txt: end -->

## Smallest valid file

```json
{
  "format": "travel-in-my-pocket/2",
  "title": "Rome in three days",
  "days": [
    {"date": "2027-04-10", "stops": [{"title": "Colosseum"}]}
  ]
}
```

A useful one gives each day a `city` and a `title`, and each stop a `time`, a `type`,
an `address` and its position (`lat`, `lng`):

```json
{
  "format": "travel-in-my-pocket/2",
  "title": "Rome in three days",
  "lang": "en",
  "timezone": "Europe/Rome",
  "days": [
    {
      "date": "2027-04-10",
      "city": "Rome",
      "title": "The ancient city",
      "stay": {"name": "Hotel Example", "address": "Via Cavour 1, Rome"},
      "notes": ["Colosseum tickets booked for 9:00"],
      "stops": [
        {"time": "09:00", "title": "Colosseum", "type": "sight", "tag": "Booked",
         "text": "Enter from the Via Sacra side.", "address": "Piazza del Colosseo, Rome",
         "lat": 41.8902, "lng": 12.4922},
        {"time": "midday", "title": "Lunch in Monti", "type": "food"},
        {"time": "15:00", "title": "Capitoline Museums", "type": "museum", "travel": "bus",
         "address": "Piazza del Campidoglio 1, Rome", "lat": 41.8930, "lng": 12.4828}
      ]
    }
  ],
  "info": [
    {"title": "In case of need", "items": [{"label": "Emergency", "text": "112"}]}
  ]
}
```

## The trip

| Field | Required | Meaning |
|---|---|---|
| `format` | yes | Always `"travel-in-my-pocket/2"`. |
| `title` | yes | The name of the trip. |
| `days` | yes | One entry per date, in date order. |
| `lang` | no | Language of the app while this trip is open: `"en"` or `"it"`. Without it, the phone's. |
| `timezone` | no | IANA time zone of the destination, like `"Europe/Rome"`: decides which day is "today". Without it, the phone's. |
| `info` | no | Sections of the Info page. |
| `currency` | no | The currency money is spent in, as its code: `"JPY"`, `"EUR"`. Every `cost` without its own `currency` is in it. See [Costs](#costs). |
| `expenses` | no | Money spent outside the stops: flights, hotels, passes. See [Costs](#costs). |
| `private` | no | The traveller's own spending, not shared with the trip. See [Private expenses](#private-expenses). |
| `googleMapsKey` | no | A Google Maps key for everyone who loads the trip. See [Google Maps key](#google-maps-key). |
| `basedOn` | written by the app | The published trip this one was copied from, with "Use as a base": `url` (its page), `title`, `by` (who published it). The copy is the traveller's own; nothing links it to the original. |
| `id` | written by the app | Identifies the trip on the phone. Without it the app makes one from the title and the first date, so a corrected file for the same trip updates it. Keep it when you change a file the app saved. |
| `version` | written by the app | Keep it exactly as it is.<!-- llms.txt: skip --> See [Versions](#versions).<!-- llms.txt: end --> |

## A day

| Field | Required | Meaning |
|---|---|---|
| `date` | yes | `"YYYY-MM-DD"`. |
| `stops` | one of the two | The stops, in order. |
| `plans` | one of the two | Two or more alternative plans for the day, each with a `name` (on its button) and its `stops`. The day goes with the plan that has `"chosen": true`, for everyone, or the first; on a phone, the traveller can look at another. |
| `city` | no | Where the day is spent: a city or an area. Days in the same city share a colour; a day in another city than the day before shows "Rome → Naples". |
| `title` | no | What the day is about, in a few words. |
| `stay` | no | Where the night is spent: an object with `name` (required), `address` and `note`, listed with its nights on the Info page; or plain text for a night that is not a place to sleep (`"Night train"`), shown on its day only. |
| `notes` | no | Things to remember that day, shown at the top: tickets, what to bring, what to do if it rains. |

## A stop

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | The name of the place or of the activity. |
| `local` | no | The name in the local language and script, as on the sign: `"一蘭 渋谷店"`. Shown under the title, to recognise the place, show it to staff or a taxi driver, and search it: the review link uses it. |
| `time` | no | A clock time, `"09:30"`, or a part of the day: `sunrise`, `morning`, `midday`, `afternoon`, `sunset`, `evening`, `night`. Sunrise and sunset fall at their real time where the day is. No `time`: all day, at the top of the day. Words written before ("Evening", "Pranzo") are read as their part; others are shown as written, with a warning. |
| `type` | no | What kind of place it is: `sight`, `museum`, `food`, `park`, `view`, `shop`, `walk`, `hotel`. It gives the stop its icon, in the list and on the map pin. |
| `travel` | no | How you get there from the stop before: `metro`, `bus`, `train`, `plane`, `boat`. Drawn on the leg of the map that arrives at the stop. |
| `text` | no | What to know: what to see, what to order, tickets. |
| `tag` | no | A short label above the title, like `"Booked 19:30"` or `"Optional"`. |
| `booking` | no | `"required"`: no entry without booking, and the stop shows a warning until it is done; `"advised"`: better booked; `"booked"`: done, shown as Booked (the time and the people go in `tag`). |
| `cost` | no | What the traveller pays there: the ticket, the meal, the ride; their share when it is split. A number, `0` for free. See [Costs](#costs). |
| `currency` | no | The currency of `cost`, when it is not the trip's `currency`: `"EUR"` for a ticket bought from home. |
| `closed` | no | When the place is closed: days of the week (`"mon"` … `"sun"`) and dates (`"2027-05-03"`). The stop shows a warning when its day is one of them, also after it is moved. |
| `address` | no | Where it is, as you would search it in Google Maps: a street address, or name and town (`"Pantheon, Rome"`). Used by the Map and Directions links. |
| `lat`, `lng` | no | The position, both or neither. Gives the stop its pin on the map. |
| `link` | no | A Google Maps link (`https://…`) to the exact place. The Map link opens it. |
| `choice` | no | Options for one moment of the day, like three places for lunch: the stops of a day (or of a plan) with the same `choice` (`"Lunch"`) are one group, shown under that name. Two to four. All stay in the trip; the day goes to the chosen one. See [Alternatives](#alternatives). |
| `chosen` | no | `true` on the option of its group the day goes to. None: the group is still to choose. |
| `id` | written by the app | Lets ticks, edits and merges follow the stop. Twelve characters, `0-9` and `a-z`, unique in the trip; a new stop has none (the app gives it one). An id made from a title by an older app (`"lunch"`) becomes one of these by a fixed rule, the same on every device. A stop copied with its id gets its own. |

### Alternatives

A group of options for one moment: a meal at one of three places, one museum or
another. Each option is a stop like the others, in the same list, with the same
`choice`; the one chosen has `"chosen": true`:

```json
{"time": "13:00", "title": "Taberna Exemplo", "type": "food", "choice": "Lunch", "chosen": true},
{"time": "13:00", "title": "Casa Exemplo", "type": "food", "choice": "Lunch"},
{"time": "13:15", "title": "Mercado Exemplo", "type": "food", "choice": "Lunch"}
```

The day goes through the chosen option only: its number, the route, the map, the day's
costs. The others are shown in one line under it, and in full when the group is opened.
A group with none chosen is "to choose", and the day's costs leave it out. A `choice` on
one stop alone is a plain stop. Use plans (below) only when the whole day changes;
for one meal, a choice.

A stop without a position is still shown, without a pin. A journey can be a stop of its
own ("Train to Naples", `"travel": "train"`, no position): it marks the leg from the
pin before it to the pin after it.

A `type`, `travel` or `booking` the app does not know yet is accepted with a warning and
drawn as a plain stop: files written for a newer app still load.

A stop of `type` `food` also gets a link to the reviews people read in that part of the
world, searched by its `local` name or its title: Tabelog in Japan, Naver Map in Korea,
Yelp in the United States and Canada, TheFork in Europe. The app picks the site from
the position, or from the trip's `timezone`; nothing about it goes in the file.

## Costs

A trip can say what it costs the traveller who holds it. Every amount is what they pay:
their share of what is split, so a double room for two at 200 is 100, and a taxi shared
by three is a third. How many people travel does not matter to the app. Each stop has
its `cost`; the money spent outside the stops, often before leaving, goes in `expenses`:

```json
"currency": "JPY",
"expenses": [
  {"title": "Flights Rome – Tokyo", "date": "2027-02-01", "cost": 1280, "currency": "EUR"},
  {"title": "Ryokan in Kyoto, 3 nights", "date": "2027-03-10", "cost": 96000}
]
```

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | What it was. |
| `cost` | yes | What the traveller pays: their share when it is split. |
| `currency` | no | Its currency, when it is not the trip's. |
| `date` | no | When it was paid, `"YYYY-MM-DD"`. Without it, the first day of the trip. |
| `id` | written by the app | Lets edits and merges follow the expense. |

Amounts are written in the currency they are paid in. The app converts each one into
the traveller's own currency at the rate of its day: a stop on the date of its day, an
expense on the date it was paid. Days still to come use today's rate, as an estimate
that changes until then. The traveller's currency is a setting of the phone, not of
the file: two people on the same trip can each see their own. Write only prices you
know (tickets, trains, a booked dinner), never a guess; the traveller corrects them
with what was really spent.

On the stop it shows small, under its time; an opened stop shows it in full, and a tap
on it shows what it makes at home. The end of the Info page sums it all up: day by day,
by kind of place, and the expenses, or as a receipt.

### Private expenses

What the traveller spends only for themselves, a watch or a thousand onigiri, is not
part of the shared trip. It goes in `private`:

```json
"private": {
  "owner": "p-3f9a1c0b7d2e",
  "expenses": [
    {"title": "Souvenirs, Nishiki Market", "date": "2027-04-12", "cost": 4500},
    {"title": "Fushimi Inari", "date": "2027-04-11", "cost": 1500, "stop": "fushimi-inari"}
  ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `expenses` | yes | The private expenses, written like the trip's. |
| `stop` | no | In a private expense only: the `id` of the stop where it was paid, on the day in its `date`, which it then needs. The stop shows it ("¥1,500 private"). If the stop is deleted, the expense stays, with its own title. |
| `owner` | written by the app | Whose they are: a random code made by the traveller's phone. Keep it exactly as it is; never write or change it. |
| `marks` | written by the app | On the account only, never in a file: what the traveller ticked, skipped and chose for themselves, so it reaches all their phones. |

Private expenses are never part of a version: they take no part in merges, and a file
with them or without them is the same version of the trip. The app writes them in a
file only when the traveller saves it with them: it asks each time. A phone that loads a
file with its own `owner` takes them; any other phone asks first. A file without `owner`
(an assistant wrote it) suggests taking them, and they become the expenses of whoever
loads it. The Info page counts them with the trip's costs, apart: the trip's, and the
private ones.

## Info

```json
"info": [
  {"title": "In case of need", "items": [
    {"label": "Emergency", "text": "112"},
    {"label": "Ferry booking", "text": "AB12CD, show it at the gate"}
  ]},
  {"title": "Words", "items": [{"label": "Thank you", "text": "Grazie"}]}
]
```

Each section has a `title` and `items`; each item a `label` and a `text`. A text that is
only a phone number becomes a link to call it.

## Text formatting

Texts are plain text. The only formatting is `**bold**`, in a stop's `text`, in
`notes`, in a stay's `note` and in info items. HTML is shown as written, never run.

<!-- llms.txt: skip -->
## How the app draws the map

The file gives positions; the app does the rest.

- **Online**: an interactive map with a pin per stop (its number, and the icon of its
  `type`), a straight line from stop to stop, and a card for each pin.
- **Offline**: a sketch to scale, with the same numbers.
- Stops more than 12 km apart are drawn on separate maps (a day in Rome, then Naples).
- Stops less than 30 m apart share a pin, named after the first one.
- Skipped stops keep their pin, greyed; the line goes past them.
- Each pin has the colour of its `type`, the lines that of the day's `city`. Their
  shade follows the part of the day: lighter in the morning, darker after sunset.
- Sunrise and sunset are worked out from the date and the first stop with a position,
  on the clock of `timezone`. Stops after sunset get a moon in the list; a part of the
  day shows its own sign instead, the sun on its arc.

<!-- llms.txt: end -->
<!-- llms.txt: skip -->
## Google Maps key

Without a key, the interactive map uses OpenStreetMap. With `googleMapsKey`, it uses
Google Maps, for everyone who loads the file. Restrict the key to the address of the
app and to the Maps JavaScript API, set a daily quota, and never put a file with a key
in a public repository. How to create one:
[Google Maps](google-maps.md). Each phone can also save its own key, or
turn Google Maps off, on the You page (the circle at the top right).

<!-- llms.txt: end -->
<!-- llms.txt: skip -->
## Versions

The app writes a `version` into every file it saves:

```json
"version": {
  "id": "3f2a9c1e0b7d4a55",
  "parents": ["a1b2c3d4e5f60718"],
  "history": ["a1b2c3d4e5f60718", "0f9e8d7c6b5a4938"],
  "date": "2026-11-16T10:42:00.000Z"
}
```

| Field | Meaning |
|---|---|
| `id` | 16 hex characters: the start of the SHA-256 of the trip's content (without `version` and `private`, keys in a fixed order) and of its parents. The same content from the same parents has the same id on every device. |
| `parents` | The version this one was made from; two after a merge; none for the first. |
| `history` | Every earlier version, newest first. It tells a newer file from an older one, or from one that changed separately. |
| `date` | When the version was made. Not part of the id. |

A file without `version` gets one when it is loaded, computed from its content, so two
phones loading the same file agree on it. Each phone keeps the content of every version
it has seen, the way Git does, as pieces shared between versions.

**Changing a file by hand or with an assistant:** leave `id` and `version` as they are.
The app sees that the content no longer matches the version and makes a new version
from it, then joins it with what changed on other phones.

**Two trips with the same id:** a trip's id comes from its title and first day, so a
friend's trip can have the same one. A file that shares no version at all with the
trip on the phone is most likely another trip: the app asks, and can keep it apart
under a new id (`…-2`), or join the two if it is the same trip written again.

### A trip with its history

"Save with its history" writes a file of its own around the trip file, to carry every
version to another phone or address without an account:

```json
{"format": "travel-in-my-pocket/history", "trip": { "…the trip file…": "" }, "versions": [ "…the earlier versions, newest first…" ]}
```

Each version is a whole trip file of its time. Loading it, the app keeps each version only
if it is a valid trip of the same `id`, in the current format, whose version id is the
hash of its content; then it loads `trip` as any file. Nobody writes one by hand.

<!-- llms.txt: end -->
## Changes

To change a trip that already exists, an AI assistant does not need to write the whole
file again. The app gives it an outline of the trip (Trips → Plan it with your AI →
Change this trip), and the assistant answers with a short list of changes, which the app applies
as one new version (Paste, at the bottom of the app):

```json
{"format": "travel-in-my-pocket/changes", "trip": "rome-in-three-days-2027-04-10", "from": "3f2a9c1e0b7d4a55", "changes": [
  {"add": {"day": "2027-04-10", "stop": {"time": "13:00", "title": "Lunch in Monti", "type": "food"}}},
  {"update": {"day": "2027-04-10", "stop": "colosseum", "set": {"time": "10:00", "tag": null}}},
  {"update": {"day": "2027-04-10", "stop": "pantheon", "to": {"day": "2027-04-11"}}},
  {"remove": {"day": "2027-04-11", "stop": "trevi"}},
  {"setDay": {"day": "2027-04-11", "set": {"title": "Churches and squares"}}},
  {"addDay": {"date": "2027-04-12", "city": "Rome", "stops": [{"title": "Last coffee"}]}},
  {"removeDay": {"day": "2027-04-13"}},
  {"addPlan": {"day": "2027-04-11", "first": "Sunny", "plan": {"name": "If it rains", "stops": [
    {"time": "10:00", "title": "Vatican Museums", "type": "museum"}]}}},
  {"setPlan": {"day": "2027-04-11", "plan": "sunny", "set": {"name": "Squares"}}},
  {"removePlan": {"day": "2027-04-12", "plan": "lazy-morning"}},
  {"update": {"day": "2027-04-10", "stop": "colosseum", "set": {"cost": 36}}},
  {"setTrip": {"set": {"currency": "EUR"}}},
  {"addExpense": {"expense": {"title": "Train Rome – Naples", "date": "2027-03-01", "cost": 58}}},
  {"setExpense": {"expense": "train-rome-naples", "set": {"cost": 49}}},
  {"removeExpense": {"expense": "hotel-deposit"}},
  {"addExpense": {"private": true, "expense": {"title": "Leather gloves", "date": "2027-04-11", "cost": 45}}}
]}
```

Stops are named by their `id`, plans by theirs (`"plan": "…"` next to `"day"`). In
`set`, `null` removes a field. A new stop goes in time order. `addPlan` gives a day an
alternative plan; on a day that has none yet, the stops it has become the first plan,
named by `first`, and their ticks follow. A day left with one plan by `removePlan` has
plain stops again. `setPlan` changes only the name: the stops of a plan change one by
one. `setTrip` changes the trip's `title`, `lang`, `timezone`, `info` or `currency`;
`addExpense`, `setExpense` and `removeExpense` its `expenses`, named by their `id`; with
`"private": true` next to `"expense"`, the traveller's private expenses, which change on
the phone, outside the trip's versions. The changes are applied in order, all or none: if one is wrong, the app lists
which one and why, and changes nothing. The result is checked like any trip file.
`trip` may be left out: the changes then apply to the trip open on the phone.
`from` is the version named at the top of the outline. When the trip has changed on the
phone since the outline was copied, the app applies the changes to that version and
joins the result with what changed after, as it does with two files; without `from`,
or with a version the phone does not have, they apply to the trip as it is.
<!-- llms.txt: skip -->The rules are in [`js/changes.js`](../js/changes.js).<!-- llms.txt: end -->

<!-- llms.txt: skip -->
## The old format

Files in `travel-in-my-pocket/1` (TIMP 1.0 to 2.4) still load: the app converts them
once, as a new version made from the old one. Map settings of the old format
(`places` colours, `glyph`, `mapZones`, `mapImages`, `zoneNames`, `mapSplitKm`,
`mapLabel`) are dropped; the app works them out now.

<!-- llms.txt: end -->
<!-- llms.txt: skip -->
## Checks the app makes

The app refuses a file, and lists every problem with its position, when: it is not JSON,
`format` is wrong, `title`, `days`, a day's `date` or a stop's `title` is missing, a day
has neither `stops` nor `plans` (or both), dates are not real or not in order,
coordinates are out of range or not in pairs, a `link` is not `https://`, or an `id` is
used twice in a list.

Unknown fields, an unknown `type` or `travel`, and days without any position are
warnings: the file loads, and the command-line checker shows them.
<!-- llms.txt: end -->

## What changed, version by version

Only what a trip file, or a list of changes, can say differently. Files written for an
older version still load.

- **3.26**: `basedOn` on the trip, written by the app on a copy of a published trip
  (`url`, `title`, `by`). Optional.
- **3.9**: changes say the version they were written for: `from`, from the outline.
- **3.8**: a `cost` is what the traveller pays, their share of what is split; in 3.7
  it was the total for everyone. Private expenses: `private`, with its `expenses` (a
  private one can name the `stop` where it was paid) and `owner`, outside versions and
  merges. Changes reach them with `"private": true`.
- **3.7**: what things cost: `cost` and `currency` on a stop; `currency` and
  `expenses` on the trip. Changes can set them: `setTrip`, `addExpense`, `setExpense`,
  `removeExpense`.
- **3.5**: three optional stop fields: `local` (the name as on the sign), `booking`
  (`required`, `advised`, `booked`) and `closed` (days of the week and dates).
- **3.4**: changes can add, rename and remove a day's plans: `addPlan`, `setPlan`,
  `removePlan`.
- **3.1**: a list of changes instead of the whole file again:
  `travel-in-my-pocket/changes`.
- **3.0**: format `travel-in-my-pocket/2`: the file says only what the trip is, and
  `type` gives each stop its kind of place.
