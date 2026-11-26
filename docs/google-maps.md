# Google Maps (optional)

Without any setup the interactive map uses OpenStreetMap. If you prefer Google Maps,
you need a key from Google. The key belongs to whoever prepares the trip: put it in the
trip file and everyone who receives the file gets the Google map without doing anything.

1. Go to the [Google Cloud console](https://console.cloud.google.com/) and create a project.
2. Enable billing on the project. Google asks for a card even if you stay within the
   free allowance.
3. In "APIs & Services → Library", enable **Maps JavaScript API**, and **Geocoding API**
   if you want positions looked up with Google when you add stops.
4. In "APIs & Services → Credentials", create an **API key**.
5. Restrict the key. This is what makes it safe to share:
   - Application restriction: **Websites**, with the address of the app, for example
     `https://usetimp.com/*` (or the address of your own copy)
   - API restriction: **Maps JavaScript API**, plus **Geocoding API** if you enabled it.
6. Set a daily limit in "Google Maps Platform → Quotas → Maps JavaScript API": find
   "Map loads per day", untick "Unlimited" and enter 300 or less. At 300 a day the
   month can never exceed the free allowance, so the key cannot cost anything.
7. Add the key to the trip file:

   ```json
   "googleMapsKey": "AIza..."
   ```

Cost: the key itself is free. Google includes 10,000 free map loads a month and charges
about $7 per 1,000 beyond that (figures from November 2026: check the
[current prices](https://developers.google.com/maps/billing-and-pricing/pricing)).
A group of travellers uses a few hundred, and the daily limit of step 6 keeps it at zero.

If Google refuses the key (wrong site, quota reached), the app says so and shows
OpenStreetMap instead. Without the Geocoding API, positions are looked up on
OpenStreetMap.

On each device, the You page (the circle at the top right) shows which map is in use
and lets you:

- save a key that applies to every trip on that device, in place of the trip's key;
- turn Google Maps off and use OpenStreetMap even when a key is present, to save
  map loads when you do not need Google's map.

What the map cannot do: Google does not allow its maps to be saved for offline use, so
without a connection the app shows the sketch. Lines between stops are straight; for
real routes and transport times, tap "Directions" on a stop.
