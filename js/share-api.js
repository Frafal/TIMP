// The contract between the app and its sharing service (accounts, sync, sharing):
// every route, what it takes and what it answers. One table, as FIELDS is for the trip
// file: the checks on both sides, the OpenAPI page and the lock are made from it.
// No DOM here: the service runs this file too.
//
// Inside a version only additions: a new route, a new optional field in a request, a
// new field in an answer. Anything else is /v2/, next to /v1/. contract/v1.lock.json
// is the contract as released; `node tools/check-contract.mjs` fails on a change that
// would break a client or a service built on it.

export const API = "1";

// The version of the terms of use and of the privacy policy (docs/terms.md,
// docs/privacy.md): accepted at sign-up, and again by every account when it changes.
export const TERMS = "2026-11-26";

/*
 * A field: {type, req, null, values, of, doc}
 *   type: "text" | "number" | "bool" | "any" | "list" (items: `of`) | the name of a shape
 *   req: always there; null: may be null; values: one of them (text)
 */
const text = (doc, more = {}) => ({type: "text", req: true, doc, ...more});
const num = doc => ({type: "number", req: true, doc});

export const SHAPES = {
  user: {
    id: text("The account's id."),
    handle: text("The name others see: lower case letters, digits, dots, dashes."),
    name: {type: "text", doc: "A display name; may be empty."},
    since: text("When the account was made (ISO date)."),
    terms: {type: "text", null: true, doc: "The version of the terms and privacy policy the account accepted (TERMS); null before it was asked."},
    linked: {type: "linkedPhone", null: true, doc: "The newest phone added with a code in the last 14 days, for the account's other phones to say so once; null: none."}
  },
  linkedPhone: {
    device: {type: "text", req: true, doc: "The phone added (its browser's words)."},
    by: {type: "text", req: true, doc: "The device that approved it."},
    at: text("When it made its passkey (ISO date)."),
    passkey: text("Its passkey's id: removing it signs that phone out.")
  },
  linkRequest: {
    id: text("The request's id."),
    code: text("Shown on this phone, typed on one already signed in: two groups of four."),
    secret: text("Kept by this phone, never shown: it alone may follow the request."),
    expires: text("When the code stops working (ISO date).")
  },
  linkState: {
    state: text("waiting, or approved (then what the new passkey signs).", {values: ["waiting", "approved"]}),
    handle: {type: "text", doc: "Approved: the account the phone joins."},
    by: {type: "text", doc: "Approved: the device that approved it."},
    challengeId: {type: "text", doc: "Approved: sent back with the new passkey."},
    publicKey: {type: "any", doc: "Approved: the options for navigator.credentials.create (WebAuthn), as JSON."}
  },
  linkAsker: {
    device: {type: "text", req: true, doc: "The phone asking (its browser's words)."},
    asked: text("When it asked (ISO date).")
  },
  session: {
    token: text("Goes in `Authorization: Bearer <token>` on every request; kept on the phone."),
    user: {type: "user", req: true, doc: "Who signed in."}
  },
  ceremony: {
    challengeId: text("Sent back with the passkey's answer."),
    publicKey: {type: "any", req: true, doc: "The options for navigator.credentials (WebAuthn), as JSON."}
  },
  tripSummary: {
    id: text("The service's id of the trip (not the file's)."),
    localId: text("The id in the trip file."),
    title: text("Its title."),
    head: text("Its latest version id."),
    role: text("What the user may do with it.", {values: ["owner", "edit", "read"]}),
    visibility: text("Who sees it.", {values: ["private", "people", "link", "public"]}),
    firstDay: {type: "text", req: true, null: true, doc: "Its first date."},
    lastDay: {type: "text", req: true, null: true, doc: "Its last date."},
    days: num("How many days."),
    updatedAt: text("When it last changed here (ISO date)."),
    locked: {type: "bool", doc: "Locked by its owner: it stays at its version; nobody sends changes or deletes it until it is unlocked."},
    publication: {type: "publication", doc: "Its page, if its owner published it (to its owner only)."}
  },
  weather: {
    place: text("The place asked, rounded to two decimals (about a kilometre): \"38.80,-9.39\"."),
    at: text("When the forecast was made (ISO date)."),
    source: text("Where it comes from, to be named where it is shown: \"MET Norway\"."),
    hours: {type: "list", of: "weatherHour", req: true, doc: "From now to 4 days ahead, in time order: hour by hour where the source has hours, then by 6 hours."}
  },
  weatherHour: {
    t: text("Its start (ISO date, UTC)."),
    h: num("How many hours it covers: 1 or 6."),
    temp: num("Air temperature at its start, °C."),
    wind: num("Wind at its start, m/s."),
    rain: num("Rain in its hours, mm."),
    sky: text("The sky, as MET Norway's symbol code (\"rain\", \"partlycloudy_day\", \"heavyrainandthunder\"…).")
  },
  publication: {
    page: text("The page's id: the page is at /t/<page> on the service, its trip at /v1/public/<page>."),
    version: text("The version published: changes made after it are not on the page."),
    level: text("Who may read it.", {values: ["link", "public"]}),
    dates: text("\"hidden\": moved to 2001, keeping each day's month and weekday; \"real\": as they are.", {values: ["hidden", "real"]}),
    publishedAt: text("When it was first published (ISO date)."),
    updatedAt: text("When it was last published again (ISO date).")
  },
  publicTrip: {
    trip: {type: "any", req: true, doc: "The trip as published (js/publish.js): never private expenses, a Google key, its history or its id."},
    by: text("The handle of who published it."),
    dates: text("Whether its dates are the real ones.", {values: ["hidden", "real"]}),
    publishedAt: text("When it was first published (ISO date)."),
    updatedAt: text("When it was last published again (ISO date).")
  },
  pushResult: {
    trip: text("The service's id of the trip."),
    kind: text("What the version sent was to the one here.", {values: ["new", "same", "newer", "older", "diverged"]}),
    head: text("The trip's version now: the phone takes it."),
    merged: {type: "any", doc: "When `kind` is diverged: the joined trip, the same a phone would make."}
  },
  versionInfo: {
    id: text("Version id."),
    parents: {type: "list", of: "text", req: true, doc: "The versions it was made from."},
    date: {type: "text", req: true, null: true, doc: "When it was made."},
    by: text("Handle of who sent it."),
    via: {type: "text", null: true, doc: "The chat app that made it for them (as it registered, \"Claude\"), or null when made in the app; absent when not known (made before the service kept it)."}
  },
  group: {
    where: {type: "bool", req: true, doc: "Mine shown (\"Where I go\"): the people on the trip see my options and plans chosen only for me."},
    ticks: {type: "bool", req: true, doc: "Mine joined (\"Ticks for everyone\"): my ticks and skips are the group's."},
    shown: {type: "list", of: "groupShown", req: true, doc: "The others on the trip who show where they go; never mine."},
    marks: {type: "any", req: true, null: true, doc: "The group's ticks and skips, {done: {key: {by, at}}, skipped: {…}} by the stop keys of the personal set (`by` a handle, null for an account deleted), when `ticks` is on; null otherwise."}
  },
  groupShown: {
    handle: text("Who."),
    chosen: {type: "any", req: true, doc: "Their options chosen only for them, as the personal set's `marks.chosen`."},
    plans: {type: "any", req: true, doc: "Their plans, as the personal set's `marks.plans`."}
  },
  privateSet: {
    data: {type: "any", req: true, null: true, doc: "The private expenses, as the trip file's `private` section, or null."},
    rev: num("Revision: send it back with the next change; 0 when there are none.")
  },
  invite: {
    token: text("Goes to one person, who accepts it signed in."),
    role: text("What they will be able to do.", {values: ["read", "edit"]}),
    expires: text("Until when it can be accepted (ISO date).")
  },
  passkey: {
    id: text("The passkey's id."),
    device: {type: "text", doc: "The device it was made on (its browser's words), empty if not known."},
    added: text("When it was added (ISO date)."),
    lastUsed: {type: "text", req: true, null: true, doc: "When it last signed in (ISO date), or null."},
    byCode: {type: "bool", doc: "Added with a code approved on another device."}
  },
  recoveryState: {
    made: {type: "text", req: true, null: true, doc: "When the account's recovery codes were made (ISO date), or null: none."},
    left: {type: "number", req: true, doc: "How many of them can still be used."}
  },
  recoveryCodes: {
    codes: {type: "list", of: "text", req: true, doc: "The new codes, shown this once: the service keeps only their hashes."}
  },
  openSession: {
    id: text("The session's id (not its token)."),
    device: {type: "text", doc: "What the device said it was, when it signed in (its browser)."},
    since: text("When it signed in (ISO date)."),
    current: {type: "bool", req: true, doc: "The device asking."}
  },
  pendingInvite: {
    id: text("The invite's id (not its token: the token only its link has)."),
    role: text("What the person will be able to do.", {values: ["read", "edit"]}),
    expires: text("Until when it can be accepted (ISO date).")
  },
  member: {
    id: {type: "text", doc: "Account id (absent for the owner)."},
    handle: text("Their handle."),
    role: text("Their role.", {values: ["owner", "edit", "read"]})
  },
  ok: {ok: {type: "bool", req: true, doc: "Done."}},
  oauthRequest: {
    client: text("The name the chat app gave itself (Claude, ChatGPT…), as it registered."),
    redirectHost: text("Where the answer goes: the host of its redirect address."),
    scopes: {type: "list", of: "text", req: true, doc: "What it asks to do: trips:read, trips:write, private:read, private:write (the traveller's private expenses)."},
    expires: text("Until when it can be answered (ISO date).")
  },
  oauthRedirect: {
    redirect: text("Where the page goes now: the chat app's address, with its code or the refusal.")
  },
  accountExport: {
    exportedAt: text("When this copy was made (ISO date)."),
    user: {type: "user", req: true, doc: "The account."},
    trips: {type: "list", of: "any", req: true, doc: "Each trip the account owns or that is shared with it: {id, role, file} (file: the trip as it is now)."},
    privateExpenses: {type: "list", of: "any", req: true, doc: "The account's private expenses: {trip, data}, readable."},
    shownToGroup: {type: "list", of: "any", req: true, doc: "What the account shows the people of each shared trip: {trip, where ({chosen, plans} or null), ticks}."},
    linkedApps: {type: "list", of: "linkedApp", req: true, doc: "The chat apps that can reach the trips."},
    passkeys: {type: "list", of: "passkey", doc: "The account's passkeys (their public half stays on the service)."},
    publications: {type: "list", of: "any", doc: "The account's published trips: {page, tripId, version, level, dates, publishedAt, updatedAt}."},
    sessions: {type: "list", of: "any", doc: "The devices signed in: {device, since}."},
    recovery: {type: "recoveryState", doc: "The recovery codes: when made, how many left (never the codes)."},
    audit: {type: "list", of: "any", req: true, doc: "What the service noted about this account (sign-ins, chats, deletions…), the last 180 days."}
  },
  linkedApp: {
    id: text("This link's id: one yes given to a chat app."),
    client: text("The chat app's name (Claude, ChatGPT…)."),
    scopes: {type: "list", of: "text", req: true, doc: "What it can do: trips:read, trips:write, private:read, private:write."},
    since: text("When the user said yes (ISO date)."),
    lastUsed: text("When it last renewed its access, about once an hour while used (ISO date).")
  },
  error: {
    error: text("A short sentence, safe to show."),
    current: {type: "any", doc: "With 409 on private expenses: what is there now, to join and send again."}
  }
};

/*
 * A route: {method, path, auth, body, answer, doc}
 *   path: ":name" are parameters; auth: a session is needed; body: its fields (requests
 *   with a body); answer: a shape's name, or fields.
 */
export const ROUTES = {
  health: {method: "GET", path: "/v1/health", auth: false, answer: {ok: {type: "bool", req: true}, api: {type: "list", of: "text", req: true, doc: "The API versions served."},
    version: {type: "text", doc: "The service's own release (SemVer), apart from the API version."},
    commit: {type: "text", doc: "The commit that release was built from, where it says."}}, doc: "Whether the service is up, which API versions it has, which release runs."},
  registerOptions: {method: "POST", path: "/v1/auth/register/options", auth: false, body: {code: text("A sign-up code."), handle: text("The handle wanted."), terms: {type: "text", doc: "The version of the terms and privacy policy accepted (TERMS): required by the service since 1.14.0."}}, answer: "ceremony", doc: "Sign-up, step one: the code and the handle are checked, the terms accepted; the phone gets what its passkey signs."},
  recoverOptions: {method: "POST", path: "/v1/auth/recover/options", auth: false, body: {handle: text("The account's handle."), code: text("One of its recovery codes.")}, answer: "ceremony", doc: "Every passkey lost, step one: the handle and a recovery code are checked (one answer for any mistake); the phone gets what a new passkey signs. The code is not used yet."},
  recover: {method: "POST", path: "/v1/auth/recover", auth: false, body: {challengeId: text("From step one."), credential: {type: "any", req: true, doc: "The new passkey, as PublicKeyCredential.toJSON()."}}, answer: "session", doc: "Step two: the code used (once, for good), the new passkey on the account, every other device signed out, a session here."},
  register: {method: "POST", path: "/v1/auth/register", auth: false, body: {challengeId: text("From step one."), credential: {type: "any", req: true, doc: "The new passkey, as PublicKeyCredential.toJSON()."}}, answer: "session", doc: "Sign-up, step two: the account, its passkey, a session."},
  loginOptions: {method: "POST", path: "/v1/auth/login/options", auth: false, body: {}, answer: "ceremony", doc: "Sign-in, step one."},
  login: {method: "POST", path: "/v1/auth/login", auth: false, body: {challengeId: text("From step one."), credential: {type: "any", req: true, doc: "The passkey's answer, as PublicKeyCredential.toJSON()."}}, answer: "session", doc: "Sign-in, step two: a session."},
  linkStart: {method: "POST", path: "/v1/auth/link", auth: false, body: {}, answer: "linkRequest",
    doc: "A phone without a passkey of the account asks to join it: a code to show, approved on a device already signed in (approveLink). It works 10 minutes."},
  linkState: {method: "POST", path: "/v1/auth/link/:id", auth: false, body: {secret: text("The request's secret.")}, answer: "linkState",
    doc: "Asked every few seconds by the phone that started it: waiting, or approved with what its new passkey signs. 410 once expired or used."},
  linkFinish: {method: "POST", path: "/v1/auth/link/:id/passkey", auth: false, body: {secret: text("The request's secret."), challengeId: text("From linkState."),
    credential: {type: "any", req: true, doc: "The new passkey, as PublicKeyCredential.toJSON()."}}, answer: "session",
    doc: "The new passkey on the account, marked as added with a code, and a session bound to it; the request used up."},
  logout: {method: "POST", path: "/v1/auth/logout", auth: true, body: {}, answer: "ok", doc: "Ends this session."},
  me: {method: "GET", path: "/v1/me", auth: true, answer: "user", doc: "The signed-in account."},
  acceptTerms: {method: "POST", path: "/v1/me/terms", auth: true, body: {terms: text("The version accepted: the current one (TERMS).")}, answer: "user", doc: "The account accepts the current terms of use and privacy policy."},
  trips: {method: "GET", path: "/v1/trips", auth: true, answer: {trips: {type: "list", of: "tripSummary", req: true}}, doc: "The user's trips and those shared with them, newest change first."},
  createTrip: {method: "POST", path: "/v1/trips", auth: true, body: {trip: {type: "any", req: true, doc: "A trip file with its version, as the app keeps it."}}, answer: "pushResult", doc: "A trip sent for the first time (again: a push)."},
  trip: {method: "GET", path: "/v1/trips/:id", auth: true, answer: "tripSummary", doc: "One trip."},
  deleteTrip: {method: "DELETE", path: "/v1/trips/:id", auth: true, answer: "ok", doc: "The owner deletes a trip, for everyone."},
  history: {method: "GET", path: "/v1/trips/:id/history", auth: true, answer: {versions: {type: "list", of: "versionInfo", req: true}}, doc: "Its versions, newest first."},
  version: {method: "GET", path: "/v1/trips/:id/versions/:version", auth: true, answer: "any", doc: "A version, as its trip file. Never changes."},
  push: {method: "POST", path: "/v1/trips/:id/push", auth: true, body: {trip: {type: "any", req: true, doc: "The trip as the phone has it."}}, answer: "pushResult", doc: "A version from a phone: taken, or joined."},
  getPrivate: {method: "GET", path: "/v1/trips/:id/private", auth: true, answer: "privateSet", doc: "The user's own private expenses of a trip."},
  getGroup: {method: "GET", path: "/v1/trips/:id/group", auth: true, answer: "group", doc: "What the people on a shared trip show each other (alternatives, step 3): mine, the others' choices, the group's ticks. Never to a linked chat."},
  putGroup: {method: "PUT", path: "/v1/trips/:id/group", auth: true, body: {
    where: {type: "any", req: true, null: true, doc: "My choices to show, {chosen, plans} as the personal set's marks, or null: not shown (removed at once)."},
    ticks: {type: "bool", req: true, doc: "Whether my ticks and skips are the group's."}
  }, answer: "group", doc: "What I show the group of this trip; nothing at all removes my row."},
  markGroup: {method: "POST", path: "/v1/trips/:id/group/marks", auth: true, body: {
    done: {type: "any", req: true, doc: "Stop keys → true (ticked) or false (unticked)."},
    skipped: {type: "any", req: true, doc: "The same, for skips."}
  }, answer: "group", doc: "Changes the group's ticks, with who and when; only with my `ticks` on (403 otherwise). A key: the last one wins."},
  putPrivate: {method: "PUT", path: "/v1/trips/:id/private", auth: true, body: {data: {type: "any", req: true, null: true, doc: "The whole set, or null to remove it."}, rev: num("The revision it was made from.")}, answer: "privateSet", doc: "Replaces them, if `rev` is still the one here (409 otherwise, with `current`)."},
  invite: {method: "POST", path: "/v1/trips/:id/invites", auth: true, body: {role: text("read or edit.", {values: ["read", "edit"]})}, answer: "invite", doc: "The owner invites one person."},
  acceptInvite: {method: "POST", path: "/v1/invites/accept", auth: true, body: {token: text("The invite's token.")}, answer: "tripSummary", doc: "The trip joins the user's \"Shared with you\"."},
  members: {method: "GET", path: "/v1/trips/:id/members", auth: true, answer: {members: {type: "list", of: "member", req: true}}, doc: "Who a trip is shared with."},
  invites: {method: "GET", path: "/v1/trips/:id/invites", auth: true, answer: {invites: {type: "list", of: "pendingInvite", req: true}}, doc: "The owner sees the invites not accepted yet and not expired."},
  revokeInvite: {method: "DELETE", path: "/v1/trips/:id/invites/:invite", auth: true, answer: "ok", doc: "The owner takes back an invite not accepted yet: its link opens nothing."},
  removeMember: {method: "DELETE", path: "/v1/trips/:id/members/:user", auth: true, answer: "ok", doc: "The owner takes someone off; anyone can leave."},
  oauthRequest: {method: "POST", path: "/v1/oauth/request", auth: true, body: {request: text("The id in the app's address (#authorize=…).")}, answer: "oauthRequest", doc: "A chat app asks to reach the user's trips (MCP): what it is and what it asks, to show before the answer."},
  oauthApprove: {method: "POST", path: "/v1/oauth/approve", auth: true, body: {request: text("The request's id."),
    scopes: {type: "list", of: "text", doc: "What the user allows, among what was asked (the private expenses only if they ticked it); all of it if left out."}},
    answer: "oauthRedirect", doc: "The user allows it: a one-time code for the chat app, bound to this request."},
  oauthDeny: {method: "POST", path: "/v1/oauth/deny", auth: true, body: {request: text("The request's id.")}, answer: "oauthRedirect", doc: "The user refuses: the chat app is told."},
  linkedApps: {method: "GET", path: "/v1/oauth/apps", auth: true, answer: {apps: {type: "list", of: "linkedApp", req: true}}, doc: "The chat apps that can reach the user's trips, newest use first."},
  unlinkApp: {method: "DELETE", path: "/v1/oauth/apps/:id", auth: true, answer: "ok", doc: "Ends a link: the chat app's tokens stop working at once."},
  publishTrip: {method: "PUT", path: "/v1/trips/:id/publication", auth: true, body: {
    version: {type: "text", doc: "The version to publish; the latest if not said."},
    dates: text("\"hidden\" or \"real\".", {values: ["hidden", "real"]}),
    remove: {type: "any", req: true, doc: "What found in it is taken out: {codes, phones, emails, stays}, each true or false (true if not said)."}
  }, answer: "publication", doc: "Owner only. The service makes the copy (js/publish.js) from the version it holds, and the page: the same page if published before. Readable by anyone with its address."},
  unpublishTrip: {method: "DELETE", path: "/v1/trips/:id/publication", auth: true, answer: "ok", doc: "Owner only. The page answers 410 from now on; copies already made by others stay theirs."},
  weather: {method: "GET", path: "/v1/weather/:lat/:lng", auth: false, answer: "weather", doc: "The forecast of a place (decimal degrees, rounded by the service to two decimals), for anyone: nothing about who asks or why is sent or kept. 503 when the source does not answer."},
  publicTrip: {method: "GET", path: "/v1/public/:page", auth: false, answer: "publicTrip", doc: "A published trip, for anyone with its address: 404 if unknown, 410 if withdrawn."},
  lockTrip: {method: "PUT", path: "/v1/trips/:id/lock", auth: true, body: {locked: {type: "bool", req: true, doc: "true to lock, false to unlock."}}, answer: "tripSummary",
    doc: "The owner locks a trip at its version (no changes, from anyone, no deleting), or unlocks it."},
  passkeys: {method: "GET", path: "/v1/account/passkeys", auth: true, answer: {passkeys: {type: "list", of: "passkey", req: true}}, doc: "The account's passkeys."},
  addPasskeyOptions: {method: "POST", path: "/v1/account/passkeys/options", auth: true, body: {}, answer: "ceremony",
    doc: "Step one of adding a passkey on this device. Only with a recent sign-in (403 \"sign in again\" otherwise): a session alone never adds a key."},
  addPasskey: {method: "POST", path: "/v1/account/passkeys", auth: true, body: {challengeId: text("From step one."), credential: {type: "any", req: true, doc: "The new passkey, as PublicKeyCredential.toJSON()."}}, answer: "ok",
    doc: "Step two: the passkey made on this device joins the account."},
  removePasskey: {method: "DELETE", path: "/v1/account/passkeys/:id", auth: true, answer: "ok", doc: "Takes a passkey off the account: never the last one; only with a recent sign-in."},
  lookLink: {method: "POST", path: "/v1/account/links", auth: true, body: {code: text("The code shown on the other phone.")}, answer: "linkAsker",
    doc: "Who asks with this code, before approving it. 404 for any code not waiting (wrong, expired, used)."},
  approveLink: {method: "POST", path: "/v1/account/links/approve", auth: true, body: {code: text("The code shown on the other phone.")}, answer: "ok",
    doc: "That phone may join this account: it then has 5 minutes to make its passkey. Only with a recent sign-in (403 \"sign in again\"), as for adding a passkey."},
  recovery: {method: "GET", path: "/v1/account/recovery", auth: true, answer: "recoveryState", doc: "Whether the account has recovery codes, and how many are left."},
  makeRecovery: {method: "POST", path: "/v1/account/recovery", auth: true, body: {}, answer: "recoveryCodes", doc: "Ten new recovery codes; those made before stop working. Only with a sign-in of the last 10 minutes (403 \"sign in again\")."},
  sessions: {method: "GET", path: "/v1/account/sessions", auth: true, answer: {sessions: {type: "list", of: "openSession", req: true}}, doc: "The devices signed in to the account."},
  endOtherSessions: {method: "POST", path: "/v1/account/sessions/end", auth: true, body: {}, answer: "ok", doc: "Signs out every other device: their sessions end now."},
  exportAccount: {method: "GET", path: "/v1/account/export", auth: true, answer: "accountExport", doc: "Everything the service keeps about the account, readable: a copy to take away."},
  deleteAccount: {method: "POST", path: "/v1/account/delete", auth: true, body: {
    handle: text("The account's handle, written again by the person."),
    challengeId: text("From loginOptions: a passkey asked again, now."),
    credential: {type: "any", req: true, doc: "The passkey's answer (WebAuthn, as JSON): only a passkey of this account will do."}
  }, answer: "ok", doc: "Deletes the account and everything it has, for good: its trips (for everyone), sharing, private expenses, sessions, passkeys, linked chats."}
};

/* ---------- checks ---------- */

const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);

function value(v, f, path, errors){
  if(v === null){ if(!f.null) errors.push(`${path}: must not be null`); return; }
  switch(f.type){
    case "any": return;
    case "text":
      if(typeof v !== "string") errors.push(`${path}: must be a text`);
      else if(f.values && !f.values.includes(v)) errors.push(`${path}: must be one of ${f.values.join(", ")}`);
      return;
    case "number": if(typeof v !== "number" || !Number.isFinite(v)) errors.push(`${path}: must be a number`); return;
    case "bool": if(typeof v !== "boolean") errors.push(`${path}: must be true or false`); return;
    case "list":
      if(!Array.isArray(v)){ errors.push(`${path}: must be a list`); return; }
      v.forEach((x, i) => value(x, {type: f.of}, `${path}[${i}]`, errors));
      return;
    default: fields(v, SHAPES[f.type], path, errors);
  }
}

// Fields a check does not know are let through: a newer side may send more.
function fields(o, spec, path, errors){
  if(!isObj(o)){ errors.push(`${path || "body"}: must be an object`); return; }
  for(const [k, f] of Object.entries(spec)){
    const p = path ? `${path}.${k}` : k;
    if(o[k] === undefined){ if(f.req) errors.push(`${p}: is required`); continue; }
    value(o[k], f, p, errors);
  }
}

const specOf = s => typeof s === "string" ? (s === "any" ? null : SHAPES[s]) : s;

/** The problems of a request body for a route; [] when it is right. */
export function checkRequest(name, body){
  const r = ROUTES[name], errors = [];
  if(r.body) fields(body, r.body, "", errors);
  return errors;
}

/** The problems of an answer of a route (status 2xx); [] when it is right. */
export function checkAnswer(name, body){
  const spec = specOf(ROUTES[name].answer), errors = [];
  if(spec) fields(body, spec, "", errors);
  return errors;
}

/** A route's address, with its parameters: pathOf("push", {id: "a b"}) → "/v1/trips/a%20b/push". */
export function pathOf(name, params = {}){
  return ROUTES[name].path.replace(/:(\w+)/g, (_, k) => {
    if(params[k] === undefined) throw new Error(`${name}: missing ${k}`);
    return encodeURIComponent(params[k]);
  });
}

/* ---------- the lock: what a released version promises ---------- */

const flat = spec => spec && Object.fromEntries(Object.entries(spec).map(([k, f]) =>
  [k, {type: f.type, ...(f.of ? {of: f.of} : {}), ...(f.req ? {req: true} : {}), ...(f.null ? {null: true} : {}), ...(f.values ? {values: f.values} : {})}]));

/** The contract as data, without the docs: what contract/v1.lock.json keeps. */
export function lockOf(){
  return {
    api: API,
    shapes: Object.fromEntries(Object.entries(SHAPES).map(([k, s]) => [k, flat(s)])),
    routes: Object.fromEntries(Object.entries(ROUTES).map(([k, r]) => [k, {method: r.method, path: r.path, auth: r.auth,
      ...(r.body ? {body: flat(r.body)} : {}), answer: typeof r.answer === "string" ? r.answer : flat(r.answer)}]))
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What in `now` breaks what `lock` promised. Allowed: new routes, new shapes, new
 * optional request fields, new answer fields, values added to a request field.
 */
export function breaks(lock, now = lockOf()){
  const out = [];
  // An answer field: still there, as sure, of the same type, no new null, no new value.
  const answer = (was, is, where) => {
    if(typeof was === "string" || typeof is === "string"){ if(!same(was, is)) out.push(`${where}: answer changed`); return; }
    for(const [k, f] of Object.entries(was)){
      const g = is[k];
      if(!g){ out.push(`${where}.${k}: removed`); continue; }
      if(g.type !== f.type || g.of !== f.of) out.push(`${where}.${k}: type changed`);
      if(f.req && !g.req) out.push(`${where}.${k}: no longer always there`);
      if(g.null && !f.null) out.push(`${where}.${k}: may now be null`);
      if(f.values && (!g.values || g.values.some(v => !f.values.includes(v)))) out.push(`${where}.${k}: new values`);
    }
  };
  // A request field: still taken, of the same type, not newly required, no value dropped.
  const request = (was = {}, is = {}, where) => {
    for(const [k, f] of Object.entries(was)){
      const g = is[k];
      if(!g){ out.push(`${where}.${k}: no longer taken`); continue; }
      if(g.type !== f.type || g.of !== f.of) out.push(`${where}.${k}: type changed`);
      if(f.null && !g.null) out.push(`${where}.${k}: null no longer taken`);
      if(f.values && g.values && f.values.some(v => !g.values.includes(v))) out.push(`${where}.${k}: values dropped`);
    }
    for(const [k, g] of Object.entries(is)) if(!was[k] && g.req) out.push(`${where}.${k}: new and required`);
  };
  if(lock.api !== now.api) out.push(`api: ${lock.api} is now ${now.api}`);
  for(const [k, s] of Object.entries(lock.shapes)){
    if(!now.shapes[k]) out.push(`shape ${k}: removed`);
    else answer(s, now.shapes[k], `shape ${k}`);
  }
  for(const [k, r] of Object.entries(lock.routes)){
    const n = now.routes[k];
    if(!n){ out.push(`route ${k}: removed`); continue; }
    for(const p of ["method", "path", "auth"]) if(n[p] !== r[p]) out.push(`route ${k}: ${p} changed`);
    request(r.body, n.body, `route ${k} request`);
    answer(r.answer, n.answer, `route ${k} answer`);
  }
  return out;
}

/* ---------- for people and tools ---------- */

/** The contract as an OpenAPI 3.1 document. */
export function openApi(){
  const schema = f => {
    const base = f.type === "text" ? {type: "string", ...(f.values ? {enum: f.values} : {})}
      : f.type === "number" ? {type: "number"} : f.type === "bool" ? {type: "boolean"} : f.type === "any" ? {}
      : f.type === "list" ? {type: "array", items: schema({type: f.of})} : {$ref: `#/components/schemas/${f.type}`};
    return {...(f.null ? {anyOf: [base, {type: "null"}]} : base), ...(f.doc ? {description: f.doc} : {})};
  };
  const object = spec => ({type: "object", properties: Object.fromEntries(Object.entries(spec).map(([k, f]) => [k, schema(f)])), required: Object.keys(spec).filter(k => spec[k].req)});
  const answer = a => typeof a === "string" ? (a === "any" ? {} : {$ref: `#/components/schemas/${a}`}) : object(a);
  const paths = {};
  for(const [name, r] of Object.entries(ROUTES)){
    const path = r.path.replace(/:(\w+)/g, "{$1}");
    paths[path] = paths[path] || {};
    paths[path][r.method.toLowerCase()] = {
      operationId: name, summary: r.doc,
      parameters: [...r.path.matchAll(/:(\w+)/g)].map(m => ({name: m[1], in: "path", required: true, schema: {type: "string"}})),
      ...(r.auth ? {security: [{session: []}]} : {}),
      ...(r.body ? {requestBody: {required: true, content: {"application/json": {schema: object(r.body)}}}} : {}),
      responses: {200: {description: "Done.", content: {"application/json": {schema: answer(r.answer)}}},
        default: {description: "An error.", content: {"application/json": {schema: {$ref: "#/components/schemas/error"}}}}}
    };
  }
  return {openapi: "3.1.0", info: {title: "TIMP sharing service", version: API}, paths,
    components: {schemas: Object.fromEntries(Object.entries(SHAPES).map(([k, s]) => [k, object(s)])), securitySchemes: {session: {type: "http", scheme: "bearer"}}}};
}
