# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/yzrzlrizal-blip/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/yzrzlrizal-blip/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Platinum Road** — a free, open-source, offline trophy guide and progress tracker for Grand Theft Auto VI. All 55 trophies with their official names, descriptions and grades, a checklist saved in your browser (with export and import), search and filters by grade and kind, a spoiler setting that hides story trophies until you earn them, a five-phase roadmap to the Platinum, a missables page, a "next up" planner, and a guide to every trophy in our own words, with sources cited. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Try it in a browser:

```sh
node serve.ts
# open http://localhost:8080
```

## What is inside

- `app/` — the static guide. `app/index.html` is the page, `app/js/` the tracker (progress store, filters, views), `app/css/style.css` the theme, and `app/data/trophies.json` the full list of 55 trophies with guides.
- `screenshots/` — four screenshots of the guide running in Chromium.
- `main.ts` — the Node 22 entrypoint: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier` library.
- `serve.ts` — a small static server for trying the guide locally.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.

## The list, honestly

55 trophies: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden. Names, descriptions, grades and PSN progress targets are the official list as published at launch week (Exophase and PSNProfiles agree on every name, description and grade). The guides are our own writing from those official descriptions. Five trophies had no confirmed unlock method at launch — In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There and Ten Pin — and one more, Personal Best, is reported but not proven; those entries say so plainly instead of inventing a method. One trophy is reported as missable: Positive Mental Attitude, because of Lucia's balcony meditation in Chapter 1. The guide warns you before Chapter 1 ends.

## Sources

- Exophase — Grand Theft Auto VI Trophies (PS5): https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — Grand Theft Auto VI Trophies: https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- Output Lag — GTA 6 Trophy List: https://outputlag.com/guides/gta-6-trophy-list/
- Push Square — GTA 6 Trophy Guide & Roadmap: https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap

Grand Theft Auto is a trademark of Rockstar Games. This is an independent fan-made guide, not affiliated with Rockstar Games.

---

<sub>Entered on [make.fun](https://make.fun/?ref=wdbz3sg5&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
