# Privacy policy

Version of 27 November 2026. [In italiano](privacy.it.md).

## Who is responsible

Francesco Falqui, a private person, is the controller of the personal data of TIMP's
service (accounts, sync, sharing, publishing, linked chats). Write to
**privacy@usetimp.com** for anything about your data.

In short: without an account your trips stay on your phone. An account needs only a name
you choose and a passkey: no email, no password. No ads, no tracking, nothing sold. Your
trips are encrypted where they are kept, in the European Union.

## The app, with or without an account

- Trips live in your browser's storage on the phone. The app has no cookies, no analytics
  and no third-party scripts at startup; what it keeps on the phone is only what it needs
  to work. Google's map code loads only if you choose Google Maps, under Google's terms.
- Your phone asks other services only for what a feature needs, and they see your IP
  address: the map tiles (OpenFreeMap, OpenStreetMap or Google) for the area you look at;
  a stop's name and address to find its position (Google with a key, otherwise
  OpenStreetMap); a Google Maps short link to TIMP's link resolver, which keeps nothing;
  the month of an exchange rate from Frankfurter, never an amount or a place.
- The weather is asked of TIMP's service with a place rounded to about 10 km; the service
  asks MET Norway with at most a kilometre of precision and keeps nothing about who asked.
- The app's files are served by Cloudflare at usetimp.com, which sees your IP address when
  they load (until 26 December 2026 also by GitHub Pages, at the app's old address).
- A trip file you save goes only where you send it; private expenses go in it only if you
  say so.

## With an account: what is kept, why, for how long

| What | Why | Legal basis | Kept |
|---|---|---|---|
| Your name (handle), your passkeys' public keys, the name each browser gives itself | Your account, signing in, telling your devices apart | Contract (GDPR art. 6.1.b) | Until you delete the account |
| Sessions and recovery codes, as hashes | Keeping you signed in, letting you back in | Contract | Sessions 180 days or until you sign out; codes until used or replaced |
| Your trips, their versions and your private expenses, encrypted | Your trips on every phone, shared with whom you choose | Contract | Until you delete them or the account |
| Who a trip is shared with, invitations, what you show the group | Sharing | Contract | Invitations 14 days; the rest until removed |
| A trip you publish | The page you chose to publish | Contract | Until you withdraw it |
| A phone added with a code: the names the asking and the approving browsers give themselves, the code and a secret as hashes | Adding a phone to your account, and telling your other phones | Contract | 10 minutes while it waits; once used, 14 days |
| The chats you link (which app, what it may do, when it was used) and their keys, as hashes | Letting your AI work on your trips | Contract | Until you unlink it; keys 1 hour, renewable for 60 days |
| The invitation you signed up with | Accounts are by invitation | Legitimate interest (art. 6.1.f) | Until you delete the account |
| A security log: sign-ins, sign-outs, chats linked, trips deleted… by an internal number, never trip content, addresses or IPs | Security, preventing abuse | Legitimate interest | 180 days |
| The version of the terms of use and of this policy you accepted, and when | Proof of acceptance | Legitimate interest | Until you delete the account |

The service keeps no request logs. Network addresses are used for a minute, to limit
abuse, and not stored. Changes you made to a trip someone else shared with you stay in
their trip after you leave, no longer linked to you.

## Who helps, and where

- **Cloudflare** runs the service and its database. The database is in the European Union
  and stays there; Cloudflare's network may carry requests outside it, under its data
  processing agreement and the EU's standard contractual clauses.
- **Cloudflare** also serves the app's files; **GitHub** served them at the old address
  until 26 December 2026. **MET Norway** gets a rounded place for the weather.
  The map, search and exchange-rate services are asked by your phone, as above.
- **Your AI chat**: when you link Claude, ChatGPT or another chat, what it reads of your
  trips goes to that company, under its own terms. You choose which, and unlink it in
  You → Your AI whenever you want.

## Your rights

- See and take everything the service keeps about you: You → Export my data.
- Delete everything: You → Delete account, at once. Backups keep the database's history
  for up to 30 days, then it is gone from them too.
- Correct, restrict or object: change your trips in the app, or write to
  privacy@usetimp.com.
- Complain to the Italian supervisory authority, the Garante per la protezione dei dati
  personali (garanteprivacy.it), or to the one where you live.

## Age, and changes

An account is for people aged 16 or more. When this policy changes, the app tells you and
asks you to read it before you go on.
