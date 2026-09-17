# Reasoning and Design Decisions

## The Problem

The ask was pretty specific: build a parking management system for a busy, multi-level, city-centre garage. Not a toy demo — something an attendant could actually use during a rush.

Breaking down what that actually meant:

- Cars need to check in and check out
- Pricing had to be tiered — expensive first hour, cheaper after that, with a daily cap so nobody gets a $300 bill for leaving their car over the weekend
- Partial hours round up (nobody's charging someone for 47 minutes of parking)
- Different spot types: compact, standard, and EV with a charger
- EVs *have* to go in EV spots — no exceptions
- The attendant needs to see at a glance whether EV spots are free
- Needs a quick way to find a car by plate number
- Every transaction gets logged
- And critically — no double-parking. Two cars can't end up assigned to the same spot.

On top of the functional list, there were some real-world constraints hiding underneath: this has to work for *any* garage, not just one hardcoded layout. The attendant is going to be moving fast, so the interface can't get in their way. And by evening, the transaction log could be pretty long, so it needed to hold up.

## How I Approached It

### Keeping it client-side, no backend

I went with a plain React app — no server, no database, everything living in React state.

Honestly, the brief never asked for persistence, so building a whole backend felt like solving a problem nobody had yet. Keeping everything in-memory made this dramatically faster to build, test, and reason about. The trade-off is obvious: refresh the page and everything's gone, and there's no multi-user support. I did think about just bolting on localStorage to fix the refresh issue, but decided against it — didn't want to add complexity that wasn't actually part of what was asked for.

### One hook to run it all

All the parking logic lives in a single custom hook, `useParkingGarage`. It owns:

- `spots` — every spot in the garage and whether it's occupied
- `parkedCars` — whoever's currently parked
- `transactions` — the completed history
- `pricing` — the configurable rates

Pulling everything into one hook meant the components themselves could stay dumb and focused — they just render state and call functions, they don't have to know *how* any of it works. Didn't see a reason to reach for Redux or Zustand for something this size.

### Typing everything

TypeScript throughout, mainly because it catches dumb mistakes before they ship. The core shapes:

```
ParkingSpot { id, type, label, occupied }
ParkedCar { plate, spotId, spotType, checkInTime }
Transaction { id, plate, spotId, spotType, checkInTime, checkOutTime, durationHours, fee }
```

### The pricing math

The algorithm:

1. Work out how long the car's been parked, in minutes
2. Round up to the next full hour
3. One hour or less? Charge the first-hour rate
4. More than that? First-hour rate, plus (extra hours × additional-hour rate)
5. Cap it — whatever that comes to, it never exceeds the daily maximum

I tested it against a handful of cases to make sure the edges held up: a flat hour charges the base rate, two hours adds one extra increment, an hour and fifteen minutes bumps up to two full hours, and anything long enough just flatlines at the daily cap.

### Assigning spots

When a car checks in:

1. First, make sure it's not already parked somewhere (can't check in twice)
2. Grab the first free spot matching the requested type
3. Mark it occupied right away
4. Record the assignment

Nothing fancy — just first-available. I toyed with letting people pick a specific spot number, but that adds a UI decision and a way for people to pick something already taken, so I scrapped it. EVs land in EV spots automatically because that's just which type they select — no separate enforcement logic needed.

### Splitting up the UI

Six components, each doing one job:

- `CheckIn` — the check-in form
- `CheckOut` — the check-out form
- `CarLookup` — plate search
- `SpotOverview` — the garage map
- `TransactionLog` — history and revenue
- `PricingSettings` — rate configuration

Keeping them this narrow made each one easy to test in isolation and easy to hand off if someone else needed to touch just one piece.

### Tabs, and Tailwind for styling

Four tabs: Check In/Out for daily operations, Garage Map for the overview, Transactions for history, and Rates for configuration. Tailwind did the heavy lifting on styling — fast to iterate with, and it kept things responsive without much extra effort.

## Adapting It for India

Once the brief shifted to an Indian context, a handful of things needed to change — not just currency, but the whole feel of it:

**Money.** USD out, INR in — ₹40 for the first hour, ₹20 for each additional, ₹200 daily cap (previously $5 / $3 / $25).

**Two-wheelers.** This was the big one. Bikes and scooters are everywhere in Indian cities, so a garage without dedicated two-wheeler parking would be missing the point entirely. Added a whole new spot type — 20 spots — alongside compact, standard, and EV.

**Plates.** Switched to the Indian format — state code, RTO number, series, number. Something like `MH 12 AB 1234`. Also added a list of state codes.

**Dates and time.** DD/MM/YYYY instead of the US format, with a 12-hour clock and AM/PM.

**Wording.** Small things that add up — "Vehicle Number" instead of "License Plate," "Today's Collection" instead of "Today's Revenue."

**Payments.** Added UPI as an option, since it's the dominant way people pay for things day-to-day, alongside cash and card.

None of these were arbitrary — two-wheelers needed their own category because they're such a huge share of vehicles on the road, the plate format had to match what's actually printed on Indian plates, and UPI needed a mention because ignoring it would've made the payment flow feel disconnected from reality.

## How I Tested It

No automated test suite here — I went through it manually, which for an app this size was manageable.

**Functionality:** checked cars in across every spot type, checked them out and watched the fee calculate, searched by plate, and paged through the transaction log.

**Edge cases:** tried checking the same car in twice, tried checking out a car that was never parked, filled every spot of a given type, ran the daily-cap math, and made sure partial hours actually rounded up.

**UI:** clicked through every button, tested form validation, checked how it held up on smaller screens, and confirmed error states actually showed something useful.

### Bugs along the way

A few things broke and got fixed as I went:

- **Type errors around `SpotType`.** Indexing into it wasn't type-safe at first. Fixed by introducing a proper `AvailabilitySummary` type and cleaning up `useParkingGarage.ts` to use it correctly.
- **Wrong date format.** Started out US-style by default. Swapped in manual formatting instead of relying on `toLocaleString`, so it would consistently render DD/MM/YYYY.
- **Two-wheelers weren't wired in everywhere.** Adding the new spot type meant touching `types.ts`, updating the hook to generate 20 two-wheeler spots, and making sure every component that displayed spot types actually accounted for four categories instead of three — `SpotOverview` especially.
- **Currency formatting.** Originally USD-formatted. Switched to `toLocaleString('en-IN')` so numbers actually read the way they should in India (lakhs, not thousands separators every three digits).

After every meaningful change, I ran `npm run build` just to make sure nothing was quietly broken — no type errors, nothing failing to import, everything compiling clean.

## Where This Is Strong, and Where It Isn't

**What's solid:** the TypeScript coverage catches a lot before it becomes a runtime problem, the components stay small and reusable, the hook keeps the logic in one predictable place, the UI gives immediate feedback, and the India-specific details feel like they were actually thought through rather than bolted on.

**What I'd still want to fix:** there's no persistence, so a refresh wipes everything. Input validation is thin. Error handling could be more forgiving. There's zero automated testing. Accessibility — ARIA labels, keyboard navigation — isn't really addressed. And performance on a very large transaction log hasn't been stress-tested.

**If this went to production**, the real list would be: a proper backend (Node/Express, Postgres), attendant login and auth, real persistence, WebSockets for multi-user syncing, actual reporting (daily/weekly/monthly), real UPI and card payment integration, a mobile app for attendants on the floor, license-plate recognition via camera, notifications for cars parked too long, and some basic analytics on peak hours and revenue trends.

## Where It Landed

Everything from the original brief got covered — check-in/check-out, tiered pricing with the cap, rounding, multiple spot types including two-wheelers, EV enforcement, availability checks, plate lookup, transaction logging, no double-parking, and the full India adaptation.

It's not production-grade, and it's not trying to be. But the code is clean, the logic is easy to follow, and the pricing math holds up under the edge cases that matter.
