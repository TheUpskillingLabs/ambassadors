# Ambassador Guide

A mobile-first site that gets Upskilling Labs ambassadors ready to represent The Labs. The idea behind every screen: **think of someone who's figuring out what's next.** The site keeps offering that prompt, then gives the ambassador the words and the nerve. The ladder is four verbs: **Raise your hand → Get in → Get ready → Pass it on.** Getting in takes ten minutes on a phone (`/apply/`) and ends with the coordinator handing over the button in person. Getting ready is the guide: one path of five steps, one page each, **The Labs → The Conversation → Your Story → The Room → Practice**. Passing it on earns the pin. There's also a boilerplate deck you can present from `/present`.

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
| **Upcoming sessions** (moving data) | `data/schedule.json` |
| **The founding ten** (moving data; the launch roster on the program page) | `data/roster.json` |
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
| `/` | The front door: the public Ambassador Program page. The hero is the Ambassador button in live 3D, turning to follow the pointer. It borrows the pin's bundle (`public/join/pin3d.js`: three.js, the pin's studio lighting and renderer, built in the design canvas), hides the pin, and lathes the button from its profile in `LabsPin.blend` in `src/scripts/button3d.ts`, printed with the button's own art (`public/join/button-art.webp`). It loads once the page is idle, on screens 900 px and wider with a mouse and a real GPU; a Cycles still (the "Button Hero" scene) shows on phones, with reduced motion, and without GPU WebGL (`?pin3d=force` overrides that last check for testing). The page is in three chapters, each opened by a full-width cover with its tagline (Spark curiosity, Build community, Inspire confidence). Inside: our why (one manifesto block in the ambassadors' voice, with one effect: it brightens letter by letter, line by line, as you scroll), what you'll do ("Coffee. A mic. A welcome.": three moments told in order, each with a polished brass outline icon rendered in Blender, `public/join/moment-*.webp`), listening and leading (the path, with the button beside the steps on wide screens, then a card on the member community: Supporting and Contributing, either or both), the launch goal with an ambassador's quote, questions, and what it takes. The pin isn't on this page: it's the Contributing Member pin (`/contributing/`), not an ambassador reward. The share image is the button (`public/join/button-share.jpg`). Every "Become an ambassador" goes to `/apply/`. Copy in `content/site/join.json`, media in `public/join/`. `/join/` redirects here. |
| `/contributing/` | **Unlisted** (`noindex`, not linked from the program page) until the board approves the levels: joining the contributor community and working your way up. The Contributing Member pin in live 3D in the hero (desktop with a real GPU; Cycles stills otherwise); why here (in person, beginners and experts side by side, learning by doing, local problems); four ways in (contribute, take a role, share what you know, get recognized); the way up, four levels (Contributing Member, Reviewer, Approver, Maintainer), each more workstreams hands-on, with the pins building as you scroll; each level's pin up close, to turn; how recognition happens; active or emeritus; what stays true. The 3D is `src/scripts/rankpin.ts` on top of `public/join/pin3d.js`; renders in `public/contributing/`. Copy in `content/site/contributing.json`, from `design/research/recognition-system.md`. `/roles/`, `/pin/` and `/contributors/` redirect here. |
| `/apply/` | Getting in (orientation), one screen at a time, in the order that gives before it takes: The Labs in three minutes (the film, or the short read the questions are written from), the coordinator's ten-question quiz (eight right to pass, retry any time, a hint on each), the Ambassador Agreement, then your name (first and last, email, ZIP, who brought you in). Ends with **the pass**: "You're in", the button, your name, and "Show this to your coordinator", who hands you the button at the event. Then the signature question, **Who's first?**: one name, and your phone sends the dated invite (the same message as the Conversation step). People without a pre-approved invite see "Almost there" until the coordinator sends them an invite link; opening it confirms them. An invite link pre-fills the form and shows who invited them; a share link (`/apply/#ref=Name`) only fills "Who brought you in?". Copy in `content/site/apply.json`. |
| `/invite/` | **For coordinators (unlisted, not linked anywhere, `noindex`).** Makes a pre-approved invite link (`/apply/#invite=…`) to copy, text, or email, and keeps a list of invites made on that device. The invitee still passes the quiz and signs the agreement, then they're in straight away. An invite opened by someone who already finished on their own confirms them. Also holds the texts a coordinator sends later ("someone just joined through you"), since the site can't see those moments. Copy in `content/site/invite.json`. |
| `/nominate/` | An ambassador suggests someone to their coordinator (a pre-filled text or email from their own phone). The coordinator decides and, if yes, sends a pre-approved invite. |
| `/guide/` | The guide's Home, and the ambassador's dashboard after getting in: one button (Start, Continue, or, once all five are done, "Tell your coordinator you're ready") and the five steps. It's open to anyone; people who haven't finished orientation see a nudge to apply, people waiting on their coordinator see "Almost there", and ambassadors are welcomed by name. Anyone who has finished gets **Bring someone in**: share your ambassador link, or nominate someone. |
| `/labs/`, `/conversation/`, `/your-story/`, `/room/`, `/practice/` | The five steps. Each ends with **Done**, which checks it off and opens a short "done" dialog: the five dots and one button to the next unfinished step (or the guide's Home and "You're ready" once all five are done). Esc stays on the page. |
| `/present/` | Full-screen deck. Arrows, click, and swipe move between slides; F toggles full screen. |
| `/present/?short` | 60-second version (slides 1, 5, 6) |
| `/present/?notes` | Laptop notes view: current slide, next slide, cues, and a timer. It drives any presentation window open on the same device. |
| `/present/?practice` | Talk cues shown under each slide |

## Design rules

The site follows The Labs Brand Style Guide via the OLOS design system. Some rules are easy to break by accident:

- **The logo always sits on ink.** The program page header has no bar: a soft pool of ink behind the logo fades out across it. The guide's bar is solid ink.
- **Sentence case, with one deliberate exception.** The brand kit says no all-caps on the website. The program page's hero sets "Ambassador Program" in caps on purpose: it is treated as a product wordmark, the way a launch page sets a product name, and the 12px kickers follow the OLOS label style. Everything else is sentence case.
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

- **Structure:** Start Here and Know The Labs merged into **The Labs**. Each playbook is one page: The Conversation (Ask, Share, Invite) and The Room (the talk, the 60-second version, Q&A). Practice is its own step. There are no per-page templates, section landings, or progress meters; Home is the only progress view.
- **Removed:**
  - the tab bar and desktop nav (the app bar has the logo and **Present**);
  - the onboarding flow, the event countdown, and the if-then plan;
  - Refreshers (each step's opening line is the refresher);
  - the Deck page and the Canva customization guide (present the boilerplate deck as is);
  - Help & Updates (the coordinator link is on Home; **Start over** is in the footer);
  - audience profiles (one line each in Invite), the glossary, story examples, and the story rehearsal timer;
  - practice filters, the Close rating, and Undo.
- **Kept, because the evidence is strongest:** the dated personal ask (**Who will you ask?**), your own 30-second story, and retrieval practice with a think-first pause.
- **Added:** "ready" as the guide's finish line. When all five steps are done, Home's button becomes "Tell your coordinator you're ready". The button is the coordinator's, handed over in person when you get in. The pin is the Contributor pin (see Roles below). The coordinator confirms everything, because the site can't see anyone's progress. Nothing is sent by the site.
- **Added:** the first ask on "You're in". The strongest thing in the guide is the dated personal ask, so the pass screen asks for one name the moment someone gets in, and saves it to the front of the Conversation step's list.

## Roles

**What exists today:** the Ambassador button and the ambassador program. Public copy talks only about those, and about the pin as what The Labs is building toward. Don't mention rims, levels, membership or dues on linked pages until they exist.

The longer-term system (role buttons in two tiers; the Contributing Member pin, with one ring per level from Reviewer up; two ways to belong) is in `design/research/recognition-system.md`, a draft not yet board-approved, and explained on the unlisted `/contributing/` page.

Avoid "certified" anywhere, and "core contributor" (OLOS's staff flag).

## Privacy

The site never sends personal information anywhere. The ambassador application (`ag.application.v1`: name, email, ZIP, who brought you in, agreement version, quiz score) stays on the device until the applicant chooses to text or email it to their coordinator from their own phone. Steps done (`ag.progress.v1`), the story (`ag.story.v1`), practice self-checks (`ag.practice.v1`), your first name (`ag.profile.v1`), and the ask list (`ag.asks.v1`) live only in the browser's `localStorage`. **Start over** in the footer clears them. There are no cookies, and analytics aren't enabled.

## Hooking the apply flow up to OLOS

**Invites and pre-approval.** Until OLOS exists, the invite link itself is the pre-approval, and `/invite/` is coordinator-only only because its address isn't published. The invite's details sit after `#` in the link, so they never reach the web server. With OLOS: coordinators (and above) create invitations there (OLOS already has admin invitations, `app/api/invitations/route.ts`), `/invite/` goes behind sign-in, and nominations from `/nominate/` become a queue the coordinator approves. `toOlosPayload()` already sends `source: "invited"` and `invite: { invited_by, pre_approved }`.

**The personal link.** The program page says everyone who joins The Labs through you counts. Today the only mechanism is the free-text "Who referred you?" field in OLOS's registration funnel, so the ask messages say "say {me} sent you", and the guide's share button makes an *ambassador* invite link (`/apply/#ref=Name`), which counts new ambassadors, not new Upskillers. For the promise to be literal, OLOS needs to accept a `?ref=` parameter on its join URL and pre-fill "Who referred you?" from it; then the guide's button can share a Labs URL. With sign-in, `/apply/` can also drop "Your name" (Google already has it) and the founding roster can come from OLOS instead of `data/roster.json`.

`src/lib/apply.ts` is the only place that changes. `toOlosPayload()` already maps the application to OLOS's registration fields (`POST /api/registrations/funnel`: `first_name`, `last_name`, `email`, `zip`, `source`, `referred_by`), plus the ambassador parts OLOS doesn't have yet: an agreement with `doc: "ambassador"` and the quiz result. Before launch, OLOS needs:

- an `ambassador` document type in `agreement_acceptances` (its `doc` CHECK allows `participation | guidelines | mentor` today);
- a place to record orientation (quiz score, when passed);
- its Terms of Service §3 updated: it says "The only additional agreement is the Build Cycle agreement", which an Ambassador Agreement would contradict;
- Google sign-in on `/apply/` (OLOS registration requires it). Then the guide can require sign-in instead of the on-device nudge.

## Assets

`npm run covers` makes the portrait crops of the three chapter covers that phones get (`public/join/*-p-900.webp` and `*-p-1400.webp`, from the 1800w files, centred on each cover's `position`). The phone-sized orbits video (`orbits-600.mp4`, `orbits-600.webm`) was encoded with ffmpeg at 600px wide; re-encode it the same way if the source changes.

`npm run assets` regenerates web-sized brand assets from a sibling OLOS checkout (`../OLOS`): the white logo lockup, partner marks, the grayscale community photo, and the app icons. The white lockup only appears on dark surfaces: the app bar and the dark slides.

## License

Split in two (see `LICENSE`):

- **The playbook is CC BY 4.0:** `content/steps/`, `content/scenarios/`, `content/faq/`, `content/site/deck.json` and `content/site/story.json` (`content/LICENSE.md`). CC BY grants no trademark rights.
- **Everything else is all rights reserved,** © 2026 The Upskilling Labs, Inc.: the code, the rest of `content/` (program page, apply flow, pin page, invites, interface text), `design/`, `public/`, the pin and button art, and the name and marks.

Third-party parts keep their own licenses: three.js in `public/join/pin3d.js` (MIT, notice kept), the Lucide glyphs behind the program page's brass icons (ISC), Geologica (SIL OFL), and npm dependencies. Partner logos belong to their owners. Copies taken under the earlier MIT / CC BY terms stay under them.
