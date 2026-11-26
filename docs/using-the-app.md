# Using the app, in detail

The [README](../README.md) has the short version. This page has the details: installing,
changing a trip on the way, versions and files.

## Installing

1. Open <https://usetimp.com>.
2. Install it on the Home Screen:
   - **iPhone**: open the page in Safari (or Chrome), tap Share, then "Add to Home Screen".
   - **Android**: open the browser menu, tap "Install app" or "Add to Home screen".
3. Open it from the new icon. No trip yet: **Plan it with your AI**. A `.json` file you
   received (from Files, Drive, a chat): **Load a file**.
4. Done. From now on it also opens in airplane mode.

Good to know:

- **iPhone: load the trip from the Home Screen icon, not from Safari.** The two keep
  separate storage. Installed on the Home Screen, the trip is also safe from Safari's
  habit of clearing data of sites not visited for a week.
- **Open the app once with a connection** before you leave, so the phone can save it.
- **Without an account, the phone holds the only copy.** Keep the trip file somewhere
  (Files, Drive, a chat) in case you change phone or clear the browser data.
- **To update a trip**, load the new version of the file from the Trips page. The stops
  already ticked stay ticked.
- You can keep several trips on the same phone and switch between them from Trips.

## Changing the trip on the way

**+ Add a stop** is the last row of every day. The form takes a name, an address or a
link (a name is searched around the day), the day as a chip ("+" for a new day after the
last) and the time; the rest is a row each, opened in place. A stop opened shows **Edit**
(change it, move it to another day, delete it), **Skip** (a stop you leave out) and
**+ Alternative**. On the map a skipped stop keeps its pin, greyed, and the route goes
from the stop before it straight to the one after. Moving a stop says first what to know
there: closed that day, already booked, a time already taken.

At the end of a day: **Edit day** changes what it is about, its city (the trip's cities
are chips), where you sleep (with its note, and the night before in one tap) and its
notes, or deletes it; **Move day** swaps it with another day (each date keeps its night)
or moves its stops into another, saying first what to know. The day's notes are one line
at the top ("3 notes · …"): a tap opens them all, another closes them; the app remembers
which, for each trip.

**Stops without a position** (an AI assistant often leaves them out) have no pin and no
route: a crossed sign where their number would be (a tap finds that one). A line above
the stops says how many, with **Find**: the app looks for all of
them, one after the other, the way the stop form does, and shows what it found before
saving anything: the place in the search's own words, what kind of place it is, how far
it is from the other stops, and **Verify**, which opens Google Maps on the point found. A
result more than 30 km away comes unticked ("probably another place"): a common name
can be in another town. **Save** keeps the ticked ones as one new version. If some are
left, the line moves below the stops, to come back to later; one not found opens in the
stop form, to search by hand. A stop without a position on purpose (a train ride):
untick it, and **Leave as it is** moves the line below the stops all the same; **Not
now** leaves it where it is. Alternative plans for a day, like one for when it rains, are a job
for an AI assistant: "add a plan for day 3 if it rains" is all it takes.

### Alternatives

Options for one moment of the day, a meal at one of three places or one museum or
another, are a group: its name above it ("Lunch · 3 alternatives"), the option chosen
as a stop like the others, and the others in one line under it ("others: Casa · Mercado",
or how many when the names do not fit). The day goes through the chosen one: its
number, the route, the map, what the day costs. A tap on the group opens it: every
option in full, **Choose this** on the others, and **+ Alternative**. A group with none
chosen says "to choose", and the day's costs say "1 choice to make", with what it may
cost.

**+ Alternative**, in a stop opened, opens the stop form with its day, time and
kind, and the group's name: from the time and the kind for a new group (Lunch, Dinner,
Alternatives), which you can change. A tick on an option not chosen asks whether you
went there: yes makes it the choice. Moving an option to another day asks whether it goes
alone (out of its group) or with the whole group. Deleting the chosen one leaves the
group to choose; one option left is a plain stop again. Options not chosen are never
deleted for you: they stay for whoever uses the trip as a base.

On a day with plans, the day goes with one of them for everyone (the first, until
another is chosen). Looking at another, a line says which one the day goes with, and
**Choose … for everyone**.

**On a shared trip** a choice changes the trip for everyone: Choose this, a plan chosen
for everyone and History → Restore ask first, saying who will see it. What you change
with a form and Save is not asked: a message says it was saved for everyone, with
**Undo**. Shared with you to read only, the trip shows the choices but cannot change them.

### Places to eat

A meal is the easiest thing to lose, so food stops get more help:

- The name as on the sign, under the title ("一蘭 渋谷店"): to find the door, and to show
  it to the staff or a taxi driver.
- **Booking**: a stop that needs one shows a warning until you mark it done in the form
  (Booking: Done); then it shows Booked.
- **Closing days**: a stop on a day its place is closed shows a warning, also after you
  move it to another day.
- A link to the reviews people use there, searched by the local name or the title:
  **Tabelog** in Japan, **Naver** in Korea, **Yelp** in the United States and Canada,
  **TheFork** in Europe. Nothing is fetched: the link opens only when you tap it.

### Pasting a place

The quickest way to fill in a stop is to paste what Google Maps gives you. The form
reads it on the phone:

| You paste | The stop gets |
|---|---|
| A link copied from Google Maps in a browser (`google.com/maps/place/…`) | name, address, position |
| The text the Maps app shares (name, address, link) | name, address; the position is looked up |
| A full address | the address; the position is looked up |
| A short link (`maps.app.goo.gl/…`), or the Maps app's text with one | name, address, position and kind of place, through the link resolver (below); without it, the link, and the name and address the text gives |
| Coordinates, `geo:` links, Apple Maps links | the position |

**Android:** once the app is installed, it appears in the Share menu: share a place from
Google Maps and the form opens already filled in; share an AI assistant's answer, or a
`.json` file, and the trip or the changes are loaded. (After an update, Android can take
a day to learn that TIMP accepts files; removing the app and installing it again is
immediate.)

**iPhone:** iOS does not let web apps receive shared content. Copy instead, then tap
**Paste** on Trips (**Paste trip** on the first screen) and **Paste** in the sheet that
opens; **Continue** does the same as the Share menu on Android. In Maps, Share → Copy;
from an AI assistant, copy the answer. A `.json` file: save it in Files and use **Load a
file**.

When a position has to be looked up, the app asks Google (with a key that has the
Geocoding API enabled, see [Google Maps](google-maps.md)) or OpenStreetMap otherwise. It
searches around the stops of that day first, because Maps often shares an address
without its town. If the pin lands in the wrong place, or nothing is found, tap **On the
map** and put it where it belongs. A stop without a position is saved without a pin: its
Map and Directions links work all the same. When the place is known, its kind (museum,
restaurant, park…) is filled in too.

**The link resolver.** A browser is not allowed to follow a short link to the place
(Google sends no CORS header). So the app asks a tiny service of this project, the
[link resolver](../worker/README.md), which follows the link and answers with name,
address, position and kind of place. Only the link is sent, and the resolver keeps
nothing. It is optional: a copy of the app without one reads full links on its own and
asks for the name of a short one.

## Versions, files and merges

Each change makes a new version of the trip, with an id like Git's, shown on the Trips
page (`Version 3f2a9c1`). Without an account, after a change the app offers to **save
the file**: on an iPhone that opens the share sheet (WhatsApp, Drive, Files…); on
Android and on a computer it downloads `<trip>-<version>.json`. Trips shows a notice
until the latest version has been saved. With an account, versions sync by themselves.

When someone loads a file of a trip they already have (same trip `id`):

- **a newer version** made from theirs replaces it;
- **an older one** changes nothing, unless they tap **Use this one**: the old content
  then comes back as a new version, and nothing is lost;
- **a version that changed separately** shows what is new in the file and what is new
  on the phone, and asks:
  - **Join both** merges the two: what was added on either side is kept (stops, notes,
    expenses, lines of the Info page), a stop changed on one side takes that change, a
    stop removed on one side and untouched on the other goes, a stop moved to another day
    on one side and changed on the other is moved and changed. A stop is never doubled,
    and the stops stay in time order. When both changed the same detail, the same side
    wins on every phone, so two friends who swap files end on the same version;
  - **Use only the file** keeps the file as it is, as a new version that still remembers
    the phone's changes;
  - **Cancel** loads nothing.

**History** (on the Trips page) lists the versions with what each one changed, and who
made it on a trip on your account. Any of them can come back: going back makes a new
version with the old content, the way `git revert` does, so it can itself be undone.

Ticked and skipped stops are never part of the file: they stay on each phone.

## Changing a trip with an AI assistant, without an account

Small changes are quicker in the app (+ Add a stop, Edit). For bigger ones, on
**Trips** open **Plan it with your AI** → **Change this trip**: one button copies a message
with an outline of the trip, you write what to change, and the assistant answers with
the changes only, a few lines instead of the whole file. Copy them and tap **Paste** (on
Android, share the answer to TIMP): the app applies them as a new version, and Undo is
one tap in History.

When a new trip from an assistant has a problem, the app lists each one with its
position in the file; **Copy for the assistant** copies that list with a request to fix
it. An assistant that cannot open links at all: **Copy the message with the whole
format** puts the format itself in the message.
