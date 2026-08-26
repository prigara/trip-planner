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

## Tech stack

React 19 + TypeScript, built with Vite. No state library, no router, and no
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
