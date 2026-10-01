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
| `/` | **Unlisted** (`noindex`): The Upskilling Labs home page, a prototype of the pre-login experience for OLOS (the app behind theupskillinglabs.org) to adopt. It's one world and one journey: a live model of The Labs (below, The world) sits behind the whole page, and the page scrolls over it, through six scenes, each a tall section whose words stay pinned at the foot of the screen while the world above is the picture: **the whole system** under the title ("Find your people. Build your edge.", the cycle's state as its eyebrow, and a line of facts); **one account, three paths** ("Learn it. Build it. Pass it on.", the thread stemming from the orb, the three paths' labels); **Learn**, **Build** and **Pass it on** (`src/components/HomeChapter.astro`: each path's name set large with its gem, what it is, how often, and a line or two); and **the close** ("Join once. Start anywhere.", where the thread ties into a new Lab). Between the scenes, where there's detail to read, the world dims: the intro (what this is, the cohort's faces, Join The Labs) and the four facts; after Learn, the next few workshops and what they teach, then a real evening at the library (Pull up a chair); after Build, how a Build Cycle works, before you apply (what it is and isn't, then what happens next, dated), Upskiller spotlights, and the next Build Cycle with the Upskiller button (open until `cycle.closes`, then underway, set on the page from the date); after Pass it on, the ways to pass it on (mentor, improve how it works, build the tools); then our story and the cities. Each path's detail ends with its way in (the free account with its path). Copy in `content/site/home.json`; the sessions, cities and member count there are a snapshot from Sep 29, 2026 that OLOS would fill from its own data, and links point at the live site. The Ambassador program page moved to `/ambassador/`; `/join/` redirects there. The faces and the room are OLOS's own photos (`public/assets/cohort-grid-sample.png`, `spotlights/`, `img_9531.jpg`), cropped into `public/home/`. |
| `/ambassador/`, `/upskiller/`, `/poderator/`, `/mentor/`, `/supporting-member/` | **Unlisted drafts** (`noindex`) until the board approves the roles: one recruitment page per role button (`/ambassador/` is the Ambassador program page, with its brass moment pins; every "Become an ambassador" goes to `/apply/`), all from one template (`src/components/RolePage.astro`, styles in `src/styles/role.css`, words in `content/roles/<slug>.json`, the list of roles in `content/roles/roles.json`). The structure follows two product pages for a single round object, Apple's AirTag and Lusion's Oryzo; the look is the program page's (ink, the teal and red glows with the grain only inside them, Geologica, hairline rules, teal labels, The Futur's type steps). In order: the hero (the role's name, one line, and its button centred, with rings slowly spreading out from it; live 3D on wide screens with a mouse and a real GPU, a Cycles still otherwise); the intro (a few sentences, what the role asks of you, the one button); what you'll do (three moments as rows: label, line, sentence); in short (four facts with small icons); how it works (the steps, a white dot where the account starts and a teal one where the button is given); the button drawn face on from its print file, with its cut line, construction marks and callouts; which role is right for you (every role's button side by side, sideways-scrolling on narrow screens); questions; join. The buttons are the art script's output for each role word (`design/button/tools/button_art_text.py`), rendered in LabsPin.blend's "Button Hero" scene like the Ambassador one: `public/roles/<slug>/` (the web art for the 3D, the hero stills, and a small still for the comparison). Every path starts with the same free Upskilling account (OLOS manages everything centrally): each role's button goes to account creation on the live site with the role as `?path=<slug>` (proposed; OLOS doesn't read it yet), the first step on every path is "Create your account.", a line under each button says so, and every page's questions end with why. The logo always sits on the header's pool of ink; the band and blur across the top fade in once the page scrolls. Unset details are marked `[PLACEHOLDER]` and shown with a dashed underline. |
| `/contributing/` | **Unlisted** (`noindex`, not linked from the program page) until the board approves the levels: the Contributor Community: joining it and working your way up. The hero says so ("Contributor Community") over the Contributing Member pin in live 3D (desktop with a real GPU; Cycles stills otherwise); why here (in person, beginners and experts side by side, learning by doing, local problems); four ways in (make something, take a role, teach what you know, or back it as a Supporting Member), then how the pin works whichever door you take; the way up, one section for the four levels (Contributing Member, Reviewer, Approver, Maintainer), each more workstreams hands-on: on wide screens the stage holds while you scroll and the pin builds level by level, a level picker jumps to any of them, and the pin can be dragged to turn; on phones the picker is tabs over one pin; how recognition happens; active or emeritus; what stays true. Like the program page, it's in three chapters, each opened by a full-width cover on the same macro shots of the pin (`src/components/JoinCover.astro`, with this page's taglines: Start anywhere, Go as far as you like, Yours for good). The 3D is `src/scripts/rankpin.ts` on top of `public/join/pin3d.js`; renders in `public/contributing/`. Copy in `content/site/contributing.json`, from `design/research/recognition-system.md`. `/roles/`, `/pin/` and `/contributors/` redirect here. |
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

## The visual language

The home page's live model, the orbit emblem, the braid and the pins are one system. The idea: The Labs is a solar system you can join, a complex adaptive system round one orb, made of the same materials as its pins. Each element has one meaning, wherever it appears.

- **The ground is ink** (`#00141B`). Light comes only from the glows (teal above, red below, as in the logo), with the grain only in the light, and from sparks.
- **The orb is The Labs:** the logo's orb, with its three latitude bands. It's the deepest well, and it's always the way in (Join The Labs).
- **Orbits are paths, in gold.** In the live model they're gold dust, bending into the wells of dense Labs. In renders they're polished gold wire. A swoosh (the logo's chevron, a craft in orbit) flies a path.
- **One set of glyphs** (`.gem` and `.mk` in `src/styles/home.css`; the same shapes in `src/scripts/orbnet.ts`):

  | Glyph | Actor in the model | Path | Colour (on the page / as light) | Material |
  |---|---|---|---|---|
  | pearl dot | people | (the people on every path) | `#FFDBBD` | pearl |
  | teal square | places | **Learn** | `#00A8B8` / `#24D6DB` | teal candy enamel |
  | red diamond | projects | **Build** | `#ED1920` / `#FF5C47` | red candy enamel |
  | gold ring | knowledge, and contributors' ties | **Pass it on** | `#CFAB67` / `#FFCA70` | polished gold |
  | small orb | a Lab | | the logo's bands | |

- **The paths in motion.** Sparks follow the cycle: red out along a project's ties (build), teal up through a contributor to the orb (what was learned), then gold back out to every Lab (passed on), where it spreads again. The wave from the orb is gold. The world's scenes go in the same order, each bringing its actors forward.
- **The weave: one journey, in, through and with The Labs** (`src/scripts/weave.ts`). The three paths, braided into one thread that runs through the model's own world: it stems from the bottom of the orb, reaches into the DC Lab's library (learn), on to a team round its project (build), rises over the commons to the top of the orb (pass it on), and carries on out to an empty stretch of orbit where a new Lab is born (with). It grows with the page, each scene drawing it as far as that scene, and twists as you go. In each chapter its own strand is lit and the other two drop to bronze, and sparks run along the lit one. Each strand is shaded as a tube in its material: candy enamel (deep edges, a glowing core, a clear gloss, fine glitter) or polished gold reflecting a studio's softboxes. The paths aren't steps: use the weave only to stand for them, never as ornament.
- **The emblem** (for print and social, not on the page). The orb with three gold orbits crossing over and under each other, a swoosh flying each in its path's material: `LabsPin.blend`, scene "Home Paths".
- **Materials.** Candy enamel (deep colour, a gloss, fine glitter) and polished metal, from `LabsPin.blend`. Renders use its studio and its materials (the Home Paths and Home Braid scenes); the live weave is shaded to match them. On the page, glyphs are drawn in CSS with a gloss and a gold rim.
- **Interface colour is separate.** Teal for links, kickers and focus, and the Join button's own colour, are the interface. The candy colours mean a path. Don't use a path colour for chrome, or chrome colours for a path.
- **Calm.** One big idea at a time on a slow heartbeat; nothing follows the cursor; no stars or dust that could be mistaken for actors. Regional Labs carry no labels until the structure is announced.

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

The home page's world (`src/scripts/orbnet.ts`) is a live model of The Labs, plain WebGL 2, no library, fixed behind the whole page. The Labs as a federated, practice-based research network, drawn the way actor-network theory sees one: people, places, projects and knowledge are all actors (a pearl dot, a teal square, a red diamond, a gold ring: the page's glyphs, see The visual language), and a Lab is nothing but their ties. Local Labs orbit the orb through orbits of gold dust; a commons of contributors and shared knowledge circles it; contributors bridge each Lab to the commons. It behaves like a complex adaptive system: newcomers drift in and are pulled into the Lab with the strongest pull near them, and ideas that spread leave new ties. Gravity is the density of relationships: a dense Lab's actors orbit tighter and faster, it pulls in more newcomers, glows, bends the orbits under it into a deeper well, and past a density closes into a small orb of its own. Innovations are sparks, in the three paths' colours: out along a project's ties (red, build), up through the commons to the orb (teal, what was learned), and, after the orb glows and a gold wave crosses the orbits, back out to every Lab (gold, passed on), one spark to each by a contributor who bridges it; the heartbeat is slow on purpose, so one idea can be followed rather than many flashing at once. The orb is the logo's: its three bands are latitude bands round one pole, fitted to `orb-mark.png`, coloured from the mark by latitude. **The camera travels the page's scenes** (`OrbNetOptions.anchors`: the sections marked `data-scene`, in order), holding on each while it fills the screen and moving between them in the stretch between: the whole system first, wide, so the story is grounded in the whole before it moves in; the orb, with the thread stemming from it; inside the DC Lab, its people and its library forward (learn); close on a team round its project, the first cohort's faces lit (build); out between the Labs as an idea goes up to the orb and back out (pass it on); and an empty stretch of orbit where a new Lab is born (the close). **The thread** (`src/scripts/weave.ts`) is the three paths braided, drawn in the same world through the model's own camera: it stems from the bottom of the orb, reaches the DC Lab's library, the team's project, rises over the commons to the top of the orb, and carries on out to the new Lab, growing with the page so each scene draws it as far as that scene; in each chapter its own strand is lit and the other two drop to bronze, and sparks run along the lit one; it hides where it passes behind the orb. Between the scenes the world dims, so the detail reads. Anything in the world can be asked what it is (in a scene, not over detail): point at an actor (on a touch screen, tap it) and a small card beside it says what it is and what it's doing here, while it lights up with its ties and its Lab steps forward; the words are in `content/site/home.json` (`model.hover`). Nothing follows your cursor. The orb is the hero's button, "Join The Labs": a real link laid exactly over it, its label on the orb's own face, revealed as you point at it or focus it; pressing it sets off the one big pulse before the account opens. One orb at a time: while the world's orb holds the screen the header carries the wordmark alone. It's rendered into a high-range buffer with a finishing pass (bloom on true highlights, a gentle shoulder that keeps the brand colours, grain only in the light) and composited with screen blending over the glows, so the title sits inside its light. Quality adapts to the frame rate; there's a pause button in the scenes; reduced motion holds the world and the thread still (the camera still follows the page); no WebGL keeps the poster (`public/join/hub-poster.webp`). To re-render the poster and the share image, open `/?orb=poster` and save the canvas (it's drawn with `preserveDrawingBuffer`).

`npm run covers` makes the portrait crops of the three chapter covers that phones get (`public/join/*-p-900.webp` and `*-p-1400.webp`, from the 1800w files, centred on each cover's `position`). The phone-sized orbits video (`orbits-600.mp4`, `orbits-600.webm`) was encoded with ffmpeg at 600px wide; re-encode it the same way if the source changes.

`npm run assets` regenerates web-sized brand assets from a sibling OLOS checkout (`../OLOS`): the white logo lockup, partner marks, the grayscale community photo, and the app icons. The white lockup only appears on dark surfaces: the app bar and the dark slides.

## License

Split in two (see `LICENSE`):

- **The playbook is CC BY 4.0:** `content/steps/`, `content/scenarios/`, `content/faq/`, `content/site/deck.json` and `content/site/story.json` (`content/LICENSE.md`). CC BY grants no trademark rights.
- **Everything else is all rights reserved,** © 2026 The Upskilling Labs, Inc.: the code, the rest of `content/` (program page, apply flow, pin page, invites, interface text), `design/`, `public/`, the pin and button art, and the name and marks.

Third-party parts keep their own licenses: three.js in `public/join/pin3d.js` (MIT, notice kept), the Lucide glyphs behind the program page's pin icons (ISC), Geologica (SIL OFL), and npm dependencies. Partner logos belong to their owners. Copies taken under the earlier MIT / CC BY terms stay under them.
