# Namma Smooth Roads: product requirements

Status: draft v0.1, written against the prototype on `main` (commit `6cc3f88`)
Date: 11 October 2026
Live prototype: https://namma-smooth-south.feybread16.chatgpt.site/

This document says what the product is for, what the prototype does today, and what should come next. Where the code and the README disagree, this file follows the code. The technical side lives in [architecture.md](architecture.md).

## 1. Summary

Namma Smooth Roads is a web app, built to work on phones as well as desktops, for two-wheeler riders in the BBMP South Zone of Bengaluru. It compares the fastest route to the smoothest one, using road reports from riders and bump signals recorded by phones on handlebars. Nobody signs up. Nothing about a rider's identity is collected.

The prototype covers one zone only. It is a proof that comfort data can be collected cheaply and used in routing, not a finished navigation product, and the UI says so ("Prototype · not navigation advice").

## 2. Problem

Google Maps and Apple Maps optimize for time or distance. A rider who saves two minutes can end up on cracked asphalt, a string of potholes or an unpaved detour. Riding on bad surfaces every day is hard on the back and on the bike's suspension, and there is no shared place where riders can say which roads are bad or pick a route by comfort.

The missing piece is data more than routing. Road quality is not in any routing feed riders can use, and the people who know it best are the ones riding it.

## 3. Who it is for

Primary: people who commute on motorcycles and scooters in South Bengaluru, mostly on a phone browser. They care about comfort and are willing to spend a few seconds tapping a map, but not to make an account.

Secondary: contributors who ride anyway and are happy to leave a phone recording on a mounted handlebar. Their value is volume.

Later audience: ward engineers and civic repair teams who need a ranked list of bad stretches. The prototype has an operations tab, but it is a transparency view, not a work queue.

## 4. Goals and non-goals

Goals for the prototype stage:

- Show a smoothest route next to the fastest one, with a 0 to 100 comfort score the rider can read at a glance.
- Let anyone report a bad road in one tap and a short form, with no account.
- Turn a phone ride into anonymous bump evidence without uploading the rider's path.
- Keep every piece of data inside the official BBMP South Zone boundary.
- Be honest about how thin the data is. A route with no nearby evidence says so.

Non-goals for now:

- Turn-by-turn navigation or voice guidance.
- Live traffic. The UI states that it is absent until a licensed source is chosen.
- Background sensing. Recording works only while the page is open in the foreground.
- User accounts, profiles, points or leaderboards.
- Zones other than South Zone.
- Photos or free-form media with reports.

## 5. What the prototype does today

The app is one page with four tabs: Explore, Report, Ride and Operations. A map with the zone boundary sits beside the controls on desktop. On a phone the map stacks above them.

### 5.1 Explore: compare routes

The rider taps a start and a destination inside the boundary, or uses their current location as the start. The first tap sets the start, the second sets the destination, and a third tap begins a new start. Two default points are pre-filled so the screen is not empty (12.925, 77.5838 to 12.9166, 77.5736).

"Compare smoothest and fastest" requests route alternatives from the public OSRM server, scores each one against the stored reports and bump signals, and shows:

- the smoothest route, with duration, distance, comfort score and the number of nearby observations;
- the fastest route as a second card when it differs from the smoothest, with how many minutes faster it is;
- both routes drawn on the map, the smoothest in green and heavier, the alternative in blue.

If a route has no reports or signals near it, the card says "No nearby community evidence yet". If OSRM is down, the status line asks the rider to try again shortly.

### 5.2 Report: flag a road

The rider taps the map, or uses their current location, then picks one of three conditions:

| Condition | Meaning | Score penalty |
| --- | --- | --- |
| Rough | Uneven surface, minor bumps, worn tarmac | 8 |
| Bumpy | Deep potholes, speed-breaker clusters, broken patches | 15 |
| Not drivable | Excavation, waterlogging or a blocked road | 35 |

A road or landmark name (up to 100 characters) and a note (up to 240) are optional. Submitting adds the report to the map straight away. Points outside the South Zone are refused, on the client and again on the server.

### 5.3 Ride: record bump signals

The rider mounts the phone, taps "Grant access and start ride", and keeps Safari open. On iPhone the app asks for motion permission first. While recording, the app watches GPS position and the accelerometer. When acceleration reaches 2.8 m/s² or more, and the GPS fix is good (accuracy 80 m or better) and inside the zone, it uploads one bump event. At most one event is sent every 2.5 seconds. The screen shows signals sent, current speed and elapsed time.

A short safety note tells riders to set up before moving and not to touch the screen while riding. A "What is collected?" panel lists the fields.

### 5.4 Operations: road condition pulse

A read-only view with four counts (reports, ride signals, not-drivable reports, coverage), the six most recent reports, and a note that low speed alone never marks a road as bad. The counts come from the newest 300 reports and 500 signals the API returns, so they stop growing once those limits are reached.

## 6. How comfort is scored

A route starts at 100. For every report within 90 m of the route, subtract its condition penalty (8, 15 or 35). For every ride signal within 70 m, subtract `min(8, max(1, intensity - 2))`. The result is rounded and never goes below 5. Routes are ranked by score, with shorter duration breaking ties. The top route is labelled smoothest and the shortest-duration one fastest. They can be the same route, in which case the card reads "Smoothest + fastest".

Product rules that follow from this:

- A low score means evidence of a rough road, never merely a slow one. Speed is recorded with a signal for context and does not enter the score.
- Absence of data is not a good score. Right now an unreported road scores 100, which overstates certainty. See section 9.

## 7. Privacy and safety requirements

These are the promises the product makes. Section 9 lists where the implementation falls short.

- No accounts, emails, phone numbers or passwords.
- No continuous GPS trail is sent or stored. Only discrete bump events leave the phone.
- Ride coordinates are rounded to 5 decimal places before upload, which is roughly one metre.
- Each ride gets a random session ID that is not reused across rides.
- Recording runs only in the foreground, so the app does not drain battery or track a rider in the background.
- Everything outside the South Zone boundary is rejected.
- The app never presents itself as navigation advice.

## 8. How we will know it works

The prototype has no analytics, so none of these are measured yet. Targets are left open on purpose until there is a baseline.

- Contribution: reports and ride signals per week, and the share of weekly contributors who come back.
- Coverage: the share of South Zone road length with at least one observation within 90 m, ideally broken down by ward.
- Usefulness: how often the smoothest route differs from the fastest, and how often riders who see a difference go on to ride it. This needs a way to observe the choice that does not break the privacy promises.
- Data quality: the share of reports that another rider confirms or contradicts, and the share of bump signals that cluster near an existing report.
- Reliability: how often route requests fail because OSRM is unavailable.

## 9. Known gaps and risks

These come from reading the code. Each one is a candidate for the next milestone.

1. Session IDs are public. `GET /api/bumps` returns every column, including `session_id` and timestamps. Anyone can group one ride's events and draw a rough trail, which cuts against "no route trails". The map UI does not use the field. The API should stop returning it, or the ID should rotate.
2. Report coordinates are not rounded. Only ride signals are rounded, and that happens in the browser. The server does not enforce it.
3. No abuse controls. Both POST endpoints are open, with no rate limit, no deduplication and no moderation. One person can drop the score of any route to 5 by pinning "Not drivable" a few times, and there is no way to remove a report.
4. Data never ages. Reports and signals count the same however old they are, and a road that was repaired stays penalized. Penalties also add up without limit, so repeated reports at the same spot count repeatedly.
5. Uncertainty is hidden. A route with no evidence scores 100, the same as a route that has been ridden many times and found smooth.
6. The routing profile is for cars. Requests go to OSRM's `driving` profile on the public demo server, which has no uptime guarantee and is not tuned for two-wheelers, despite what the README says.
7. Counts are capped. Scoring and the operations tab only see the newest 300 reports and 500 signals. Past that, older evidence silently drops out of the scores.
8. There is no confirmation step. Nothing lets a rider say a reported road has been fixed or is still bad.

## 10. Roadmap

Items marked (README) come from the existing README roadmap. The rest are proposed here.

Next, to make the prototype safe to widen:

- Stop returning `session_id` from the public API; round report coordinates on the server.
- Add rate limiting and a basic duplicate check on both POST endpoints.
- Weight observations by age, and cap the penalty from stacked evidence at one location.
- Show confidence on the route card, for example "based on 12 observations", and avoid scoring 100 when there is none.
- Let riders confirm "still bad" or "fixed" on an existing report.

After that:

- Move to a routing source that supports two-wheelers, or self-host OSRM with a suitable profile.
- Add more BBMP zones (README).
- Export ward-level road quality reports for civic and BBMP repair teams (README).
- Show a Kannada interface (README).

Later:

- A native app with background sensing on iOS (CoreMotion) and Android (README).
- Real-time Bengaluru traffic layers, once a licensed source is chosen (README).

## 11. Open questions

- Who owns moderation, and what happens when the BBMP or a ward office asks for a report to be removed?
- Is a free public routing server acceptable for launch, or does the first public push need a self-hosted router?
- How should a repaired road clear its penalty: by time, by confirmation, or both?
- Is the Operations tab for riders, for civic staff, or for both? The answer changes what it should show.
- What is the minimum amount of data that makes a comfort score worth trusting? The current thresholds (90 m, 70 m, the penalty values) were chosen by hand and have not been checked against real roads.

## 12. Data and attribution

- BBMP South Zone boundary, 2022: OpenCity.in, from the Karnataka State Remote Sensing Applications Centre.
- Basemap and road network: OpenStreetMap contributors, under the ODbL.
- Routing: Project OSRM.
