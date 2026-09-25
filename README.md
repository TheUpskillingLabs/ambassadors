# Ambassador Guide

A mobile-first learning site that gets Upskilling Labs ambassadors ready to represent The Labs: Start Here, Know the Labs, two playbooks (The Conversation and The Room), Your Story, Refreshers, Help & Updates, and a boilerplate deck you can present from `/present`.

It uses the same design system as OLOS: the brand tokens, type scale, buttons, cards, and ink chrome are ported from `OLOS/app/globals.css`.

**Status:** v1 prototype. All copy is seed copy marked `[PLACEHOLDER]` until real Labs copy replaces it (see [Replacing placeholder copy](#replacing-placeholder-copy)).

## Stack

- [Astro](https://astro.build) static site with content collections (Markdown + JSON, validated by schemas in `src/content.config.ts`). There's no backend and no database.
- Geologica, self-hosted via `@fontsource-variable/geologica` (OFL).
- QR codes are generated in the browser with `qrcode-generator`.
- A service worker (`dist/sw.js`, generated at build) precaches every page, so the site works offline after the first visit. It can be installed as a PWA.
- Deploys to **GitHub Pages** via `.github/workflows/deploy-pages.yml` on every push to `main`. PRs build and type-check but don't deploy. For this to work, **Settings → Pages → Build and deployment → Source** must be set to **GitHub Actions**. The "Deploy from a branch" option runs Jekyll on the raw repo and fails.
- The site works at any base path. The workflow passes the Pages path (`/ambassadors` on `theupskillinglabs.github.io`, or `/` on a custom domain) as `BASE_PATH`. Every internal link goes through `u()` in `src/lib/url.ts`, so new links in components should use it too. A root deploy (Vercel via `vercel.json`, or a custom domain) needs no configuration.

```sh
nvm use            # Node 22.12+
npm install
npm run dev        # http://localhost:4321
npm run build      # checks copy, builds dist/, writes sw.js
npm run preview    # serve dist/ (the service worker only runs in a production build)
npm run check      # type-check
```

## Where things live

| What | Where |
| --- | --- |
| Playbook pages (one Markdown file each, following the page template) | `content/playbooks/{conversation,room}/*.md` |
| Start Here, Know the Labs, and the other guide pages | `content/pages/<section>/*.md` |
| Practice scenarios (the prospect game will read these too) | `content/scenarios/*.json` |
| Audience profiles (Who we recruit) | `content/audiences/*.json` |
| FAQ, glossary, what's-new log | `content/faq/`, `content/glossary/`, `content/updates/` |
| Refresher cheat sheets | `content/refreshers/*.json` |
| Deck copy, ladder, Your Story prompts, coordinator contact, section list | `content/site/*.json` |
| Every UI string a component renders | `content/site/ui.en.json` |
| **Upcoming sessions (the only moving data)** | `data/schedule.json` |

Components don't hard-code copy. To add a translation later, add `content/site/ui.<locale>.json` and per-locale content folders.

## Common edits (no developer needed)

You can make all of these in GitHub's web editor. Open the file, click the pencil icon, and commit. Vercel redeploys within a minute or two.

- **Next session:** add an entry to `data/schedule.json`. The deck (slides 5 and 6), Home, and the refreshers pick up the next future session automatically, and past sessions drop off without anyone touching them. If there's no future session, slide 5 says "Next dates coming soon" and the QR still points to theupskillinglabs.org.
- **What's new:** add a file to `content/updates/`, for example `2026-10-01-new-scenarios.json` containing `{ "date": "2026-10-01", "change": "…", "link": "/practice/" }`. Home shows a dot until the ambassador opens Help.
- **A practice scenario:** copy any file in `content/scenarios/` and give it a new `id` and filename.

Every build validates the files against the schemas. If a required field is missing, or a playbook page has more than 3 examples, the build fails with a message naming the file. `npm run lint:copy` also runs on every build. It flags the brand's banned words (course, class, student, lesson, module), "TUL", exclamation points, emoji, "civic problems", and "Sign up / Get started".

## Replacing placeholder copy

Every seeded entry has `"placeholder": true` (or `placeholder: true` in the Markdown frontmatter). While the flag is set, the page shows a `[PLACEHOLDER] draft copy` marker. When you replace an entry with real copy, set the flag to `false` and the marker disappears. To find what's left:

```sh
grep -rl "placeholder: true\|\"placeholder\": true" content/
```

These also need real values:

- `content/site/help.json`: the coordinator's name and email (currently `coordinator@example.org`).
- `content/site/deck.json`: `templateUrl` and `assetsUrl`, which should be the Canva template and asset library links.
- `data/schedule.json`: real dates and places.
- `content/site/story.json`: example stories from real people, with their permission and credit.

## Routes

| Route | What |
| --- | --- |
| `/` | Home. First visit leads with Start Here; once Start Here is complete it leads with Refreshers, Present now, and what's new. |
| `/start-here/`, `/know-the-labs/` | Section overview with "n of N read", plus one page per topic |
| `/playbooks/conversation/…`, `/playbooks/room/…` | Playbook pages (Overview, then each step, then Practice) |
| `/practice/` | All scenarios. `?mode=room`, `?audience=workshop` preselect a filter. |
| `/your-story/` | Worksheet that builds a 30-second why, with word count and speaking time. Saved on the device. |
| `/refreshers/{conversation,room}/` | One-page cheat sheets (printable) |
| `/deck/`, `/deck/customize/` | Present now; how to tailor the Canva template |
| `/present/` | Full-screen deck. Arrows, click, and swipe move between slides; F toggles full screen. |
| `/present/?short` | 60-second version (slides 1, 5, 6) |
| `/present/?notes` | Laptop notes view: current slide, next slide, cues, and a timer. It drives any presentation window open on the same device. |
| `/present/?practice` | Talk cues shown under each slide |
| `/help/` | Coordinator contact, what's new, and Reset progress |

## Design rules

The site follows The Labs Brand Style Guide via the OLOS design system. Some rules are easy to break by accident:

- **Never let anything look like a button unless it is one.** Filled or outlined rounded boxes (`.btn`, `.chip`, `.ctl`) are only for things you can press. Labels, statuses, counters, page lists, and example quotes are plain text or text with a rule, never boxed. On slides, "Join The Labs" is words over a red rule, because nobody can press a projected slide.
- One 14px radius, no pills. Red is only for "Join The Labs". Teal is for focus rings and accents; use teal-deep for text on light backgrounds.
- The white logo lockup goes only on dark surfaces. Never put two dark sections in a row.

## Privacy

The site never collects personal information. Read progress (`ag.progress.v1`), the story draft (`ag.story.v1`), and the last-seen update (`ag.updatesSeen.v1`) live only in the browser's `localStorage`. There are no cookies, and analytics aren't enabled.

## Assets

`npm run assets` regenerates web-sized brand assets from a sibling OLOS checkout (`../OLOS`): the white logo lockup, partner marks, the grayscale community photo, and the app icons. The white lockup only appears on dark surfaces: the nav, the footer, and the dark slides.

## Licenses

Code is MIT (`LICENSE`). Content in `content/` and `data/` is CC BY 4.0 (`content/LICENSE.md`).
