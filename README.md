# Trip Planner

A small single-page app for laying out a trip itinerary day by day.

You create a trip by giving it a destination and a start/end date — the app
generates one card per day in the range. Activity ideas go into a shared
"Ideas" pool, and you drag them onto the day you want: into the day's activity
list (reorderable by dropping between items) or into its dedicated **lunch** and
**dinner** slots. Dragging an item back, or clicking its ×, returns it to the
pool. Each day also has a free-text title, and you can add or remove days after
the fact — remaining days are renumbered and re-dated automatically, and any
items on a removed day go back to the Ideas pool.

You can keep several trips side by side and switch between them from the trip
list. Everything is stored in the browser's `localStorage` (key
`trip-planner-state-v2`) — there is no backend and no account. A sample Paris
trip is seeded on first run.

## URLs

| Path | Shows |
| --- | --- |
| `/` | The last opened trip (the address bar is then switched to that trip's URL) |
| `/trips/<city>-<day>-<mon>` | A specific trip, e.g. `/trips/paris-14-oct` |
| `/all` | The trip list |
| `/new` | The new-trip form |

A trip's URL is derived from its destination and the date of its first day, so
it changes if you edit those (for example, removing the first day). If several
trips would share a URL, later ones get a `-2`, `-3`, … suffix in trip-list
order. A trip with no parseable start date uses just the city. Older
`/trips/<trip-id>` links still resolve and are redirected to the new form; an
unknown trip URL shows the trip list.

Because trips live in `localStorage`, a trip URL only works in the browser that
created the trip. When deploying, configure the server to serve `index.html` for
all of these paths (the Vite dev and preview servers already do).

## Tech stack

React 19 + TypeScript, built with Vite. No state library, no router library
(routing is a few helpers over the History API), and no
runtime dependencies beyond React — the whole app lives in
[App.tsx](air-file://lasjqteqhjilpe1f1748/workspaces/trip-planner/src/App.tsx?type=file&root=%252F).

## Running it

Requires Node.js 20.19+ (or 22.12+) for Vite 8.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

## Other scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint over the project |
