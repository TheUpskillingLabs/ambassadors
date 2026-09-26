# Ambassador Guide

A mobile-first site that gets Upskilling Labs ambassadors ready to represent The Labs. It's one path of five steps, one page each: **The Labs → The Conversation → Your Story → The Room → Practice**. Finishing the path earns the ambassador pin. There's also a boilerplate deck you can present from `/present`.

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
| **The five steps** (one Markdown file each, in `order`) | `content/steps/*.md` |
| Practice situations (the prospect game will read these too) | `content/scenarios/*.json` |
| Questions you'll get (shown on The Labs) | `content/faq/*.json` |
| Deck copy, ladder, Your Story questions, coordinator contact | `content/site/*.json` |
| The public program page's copy | `content/site/join.json` |
| The apply flow: registration labels, the Ambassador Agreement (versioned), the video slot, the quiz | `content/site/apply.json` |
| Every UI string a component renders | `content/site/ui.en.json` |
| **Upcoming sessions (the only moving data)** | `data/schedule.json` |
| The ambassador pin: production art, spec, and Blender notes | `design/pin/` |

Components don't hard-code copy. To add a translation later, add `content/site/ui.<locale>.json` and per-locale content folders.

## Common edits (no developer needed)

You can make all of these in GitHub's web editor. Open the file, click the pencil icon, and commit. The site redeploys within a couple of minutes.

- **A step's copy:** edit its file in `content/steps/`. It's plain Markdown. To place a built-in block, put one of these on its own line: `<!-- ladder -->`, `<!-- faq -->`, `<!-- story -->` (the reader's saved 30-second why), `<!-- asks -->` (Who will you ask?), or `<!-- present -->` (the deck buttons). A misspelled name fails the build and names the file.
- **Next session:** add an entry to `data/schedule.json`. The deck (slides 5 and 6) and the invite text pick up the next future session automatically, and past sessions drop off on their own.
- **A practice situation:** copy any file in `content/scenarios/` and give it a new `id` and filename. `"core": true` puts it in the first round, which should stay at 6.

Every build validates the files against the schemas in `src/content.config.ts`. `npm run lint:copy` also runs on every build. It flags the brand's banned words (course, class, student, lesson, module), "TUL", exclamation points, emoji, "civic problems", and "Sign up / Get started".

## Replacing placeholder copy

Every seeded entry has `"placeholder": true` (or `placeholder: true` in the Markdown frontmatter). While the flag is set, the page shows a `[PLACEHOLDER] draft copy` marker. When you replace an entry with real copy, set the flag to `false` and the marker disappears. To find what's left:

```sh
grep -rl "placeholder: true\|\"placeholder\": true" content/
```

These also need real values:

- `content/site/help.json`: the coordinator's name and email (currently `coordinator@example.org`).
- `data/schedule.json`: real dates and places.
- `content/site/story.json`: example stories from real people, with their permission and credit.

## Routes

| Route | What |
| --- | --- |
| `/` | The front door: the public Ambassador Program page, in three chapters, each opened by a full-width cover with its tagline (Spark curiosity, Build community, Inspire confidence). Inside: why join, how it works (a sticky picture that turns from the button into the pin on wide screens), the launch goal with an ambassador's quote, questions, and what it takes. Every "Become an ambassador" goes to `/apply/`. Copy in `content/site/join.json`, media in `public/join/`. `/join/` redirects here. |
| `/apply/` | Becoming an ambassador, one screen at a time: about you (first and last name, email, ZIP, who brought you in), the Ambassador Agreement, a short video, and a five-question quiz about The Labs (four right to pass, retry any time). Ends with "You're in", a pre-filled text to the coordinator, and a link into the guide. Copy in `content/site/apply.json`. |
| `/guide/` | The guide's Home, and the ambassador's dashboard after they pass: one button (Start, Continue, or, once all five are done, "Text your coordinator for your pin") and the five steps. It's open to anyone; people who haven't passed initiation see a nudge to apply, and ambassadors are welcomed by name. |
| `/labs/`, `/conversation/`, `/your-story/`, `/room/`, `/practice/` | The five steps. Each ends with **Done**, which checks it off and opens a short "done" dialog: the five dots and one button to the next unfinished step (or the guide's Home and the pin once all five are done). Esc stays on the page. |
| `/present/` | Full-screen deck. Arrows, click, and swipe move between slides; F toggles full screen. |
| `/present/?short` | 60-second version (slides 1, 5, 6) |
| `/present/?notes` | Laptop notes view: current slide, next slide, cues, and a timer. It drives any presentation window open on the same device. |
| `/present/?practice` | Talk cues shown under each slide |

## Design rules

The site follows The Labs Brand Style Guide via the OLOS design system. Some rules are easy to break by accident:

- **Never let anything look like a button unless it is one.** Filled or outlined rounded boxes (`.btn`, `.chip`, `.ctl`) are only for things you can press. Labels, statuses, counters, page lists, and example quotes are plain text or text with a rule, never boxed. On slides, "Join The Labs" is words over a red rule, because nobody can press a projected slide.
- **Full width.** Pages run edge to edge with one fluid gutter (`--gutter: clamp(16px, 4vw, 64px)`); text keeps a readable measure (`--measure: 68ch`) and sits left-aligned. On wide screens the steps become a sticky rail and Home splits into two columns. See `design/research/award-benchmarks.md` for the references behind this.
- **One path, one button.** Every step is one page with one primary action (Done). Anything that adds a second path, a second menu, or a choice the ambassador has to make before they can start should earn its place with evidence.
- Clickable rows are white cards with a trailing chevron (`Row.astro`). Information panels are tinted (`.panel`) or plain text, never white boxes, so anything that looks like a card can be pressed.
- Every gesture has a button and a key. The practice deck supports swipe, buttons, and keys (Space flips, → Had it, ← Not yet).
- Keep copy as short as it can be. One idea per line, no helper text where a title is enough.
- One 14px radius, no pills. Circles are only for controls that really are round (the deck's action buttons). Red is only for "Join The Labs". Teal is for focus rings and accents; use teal-deep for text on light backgrounds.
- The white logo lockup goes only on dark surfaces.

## Deliberate deviations from the v1 spec

The spec's seven sections became one five-step path so an ambassador never has to choose where to go. Evidence for the cuts is in the "Ambassador guide ruthless cuts" research report.

- **Structure:** Start Here and Know the Labs merged into **The Labs**. Each playbook is one page: The Conversation (Ask, Share, Invite) and The Room (the talk, the 60-second version, Q&A). Practice is its own step. There are no per-page templates, section landings, or progress meters; Home is the only progress view.
- **Removed:**
  - the tab bar and desktop nav (the app bar has the logo and **Present**);
  - the onboarding flow, the event countdown, and the if-then plan;
  - Refreshers (each step's opening line is the refresher);
  - the Deck page and the Canva customization guide (present the boilerplate deck as is);
  - Help & Updates (the coordinator link is on Home; **Start over** is in the footer);
  - audience profiles (one line each in Invite), the glossary, story examples, and the story rehearsal timer;
  - practice filters, the Close rating, and Undo.
- **Kept, because the evidence is strongest:** the dated personal ask (**Who will you ask?**), your own 30-second story, and retrieval practice with a think-first pause.
- **Added:** the pin as the finish line. When all five steps are done, Home's button becomes "Text your coordinator for your pin". The coordinator confirms, because the site can't see anyone's progress. Nothing is sent by the site.

## Privacy

The site never sends personal information anywhere. The ambassador application (`ag.application.v1`: name, email, ZIP, who brought you in, agreement version, quiz score) stays on the device until the applicant chooses to text or email it to their coordinator from their own phone. Steps done (`ag.progress.v1`), the story (`ag.story.v1`), practice self-checks (`ag.practice.v1`), your first name (`ag.profile.v1`), and the ask list (`ag.asks.v1`) live only in the browser's `localStorage`. **Start over** in the footer clears them. There are no cookies, and analytics aren't enabled.

## Hooking the apply flow up to OLOS

`src/lib/apply.ts` is the only place that changes. `toOlosPayload()` already maps the application to OLOS's registration fields (`POST /api/registrations/funnel`: `first_name`, `last_name`, `email`, `zip`, `source`, `referred_by`), plus the ambassador parts OLOS doesn't have yet: an agreement with `doc: "ambassador"` and the quiz result. Before launch, OLOS needs:

- an `ambassador` document type in `agreement_acceptances` (its `doc` CHECK allows `participation | guidelines | mentor` today);
- a place to record initiation (quiz score, when passed);
- its Terms of Service §3 updated: it says "The only additional agreement is the Build Cycle agreement", which an Ambassador Agreement would contradict;
- Google sign-in on `/apply/` (OLOS registration requires it). Then the guide can require sign-in instead of the on-device nudge.

## Assets

`npm run assets` regenerates web-sized brand assets from a sibling OLOS checkout (`../OLOS`): the white logo lockup, partner marks, the grayscale community photo, and the app icons. The white lockup only appears on dark surfaces: the app bar and the dark slides.

## Licenses

Code is MIT (`LICENSE`). Content in `content/` and `data/` is CC BY 4.0 (`content/LICENSE.md`).
