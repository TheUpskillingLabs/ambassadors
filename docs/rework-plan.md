# Reworking this repo into the whole site: the plan (draft)

Oct 3, 2026.

**Brendan, Oct 3:** "Create a plan to rework the /ambassadors repo accordingly."

"Accordingly" means `information-architecture.md` (second version) and `org-pages.md`. The repo becomes the whole experience: the public site, the account, the open project and the network of Labs.

This is a plan, not a commitment. Each PR below is a proposal to approve.

> **Update, Oct 9, 2026:** the Ambassador role's signed-in tools (the apply flow, the guide and its steps, the deck, invites, nominating; the "roles and the guide" part of PR 8) were built in OLOS instead (see `docs/ambassadors/CLAUDE.md` in the OLOS repo; content in its `lib/ambassador/content/`). This repo no longer carries them: `/account/…`, `/ambassador/` and the older tool addresses redirect to theupskillinglabs.org, the steps, scenarios, faq, schedule and roster data moved with them, and the service worker that precached the account now only unregisters itself. Where this plan mentions those files, read it as history.

## 1. Where the repo is today

- **Stack:**
  - Astro 7, static, deployed to GitHub Pages under `/ambassadors/` on every push to main.
  - `npm run build` runs the copy lint, then `astro check`, then the build.
  - A service worker precaches every page.
- **Content:**
  - Three collections in `src/content.config.ts`: steps, scenarios, faq.
  - Everything else is loose JSON: `content/site/*.json` (home, government, enterprise, contributing, join, apply…) and `content/roles/*.json`.
  - Moving data in `data/`: `schedule.json` (sessions; past ones are skipped), `roster.json`, `register.json`.
- **Public pages:**
  - `/` (`index.astro`, with the world in `orbnet.ts`);
  - the role template (`RolePage.astro`, `role.css`) for five roles;
  - `/government/`, `/enterprise/` (world in `orgworld.ts`), `/contributing/`.
- **Ambassador tools on `Base.astro`:**
  - `/guide/` and the five steps (`[step].astro`: `/labs/`, `/conversation/`, `/your-story/`, `/room/`, `/practice/`);
  - `/apply/`, `/invite/`, `/nominate/`, `/present/`, `/offline/`.
- **Styles:** eleven sheets.
  - `join.css` is the shared base for the public pages in practice.
  - `app.css`, `system.css` and `guide.css` serve the tools.
  - `colors_and_type.css` holds the tokens.
  - The home, role, government, enterprise, contributing and deck pages each have their own sheet.
- **Every public page builds its own header and footer.** Only the home's footer links across the site.
- **Redirects:** `/join` → `/ambassador/`, and `/contributors`, `/pin`, `/roles` → `/contributing/`.
- **Names:** the package is `ambassador-guide`; the repo is `ambassadors`.

## 2. What stays

- **The worlds:** `orbnet.ts`, `orgworld.ts`, `swoosh.ts`, `button3d.ts`, `rankpin.ts`, and their posters and fallbacks.
- **The role template and its content,** including the "met a wearer" opening.
- **The copy** of For government and For enterprise.
- **The voice:** the lint rules, and the guides in `home-copy.md`.
- **The design tokens and Geologica.**
- **The ambassador guide's content and the deck.** Both move, but nothing is lost.

## 3. Target architecture

### 3.1 Routes

| Route | Template | Source | PR |
|---|---|---|---|
| `/` | Front door (the journey) | `content/pages/home.json` + collections | 4 |
| `/join/` | Start page | `content/pages/join.json` | 1 |
| `/workshops/` | Owner page | page JSON + events + playbooks | 3 |
| `/events/`, `/events/<date>-<name>/` | Catalogue, object | events | 3 |
| `/build-cycles/`, `/build-cycles/<lab>-<season>-<year>/` | Owner page, object | cycles | 3 |
| `/labs/`, `/labs/<lab>/`, `/labs/start/` | Catalogue, object, start page | labs | 3 |
| `/problems/`, `/problems/<slug>/` | Catalogue, object | problems | 5 |
| `/projects/`, `/projects/<slug>/` | Catalogue, object | projects | 5 |
| `/people/<handle>/` | Object (opt-in) | people | 5 |
| `/about/`, `/about/results/`, `/about/board/`, `/about/brand/` | Owner page, pages | page JSON | 5 |
| `/newsroom/`, `/newsroom/<slug>/` | Catalogue, object | stories | 5 |
| `/partners/`, `/partners/<type>/` | Hub, sales pages | partners | 6 |
| `/orgs/<slug>/` | Object | orgs | 6 |
| `/contribute/`, `/contribute/community/` | Owner page, page | page JSON | 7 |
| `/playbooks/`, `/playbooks/<slug>/` | Catalogue, object | playbooks | 7 |
| `/handbook/…`, `/platform/` | Handbook pages | Markdown | 7 |
| `/upskiller/`, `/poderator/`, `/mentor/`, `/ambassador/` | Role | roles | 1 (moved onto the new layout) |
| `/account/…` | Account screens | fixtures | 1 (guide moved), 8 (the rest) |
| `/donate/`, `/contact/`, `/privacy/`, `/terms/`, `/code-of-conduct/` | Utility | page JSON | 5 |

### 3.2 Layouts and shared components

- **`layouts/Site.astro`:** the global header, the global footer, a `localNav` slot and SEO.
  - Variants: `quiet` for immersive pages (the header stays light over the world, as the home's does now) and `draft` (the draft note and `noindex`).
- **`layouts/Account.astro`:** the signed-in shell. It replaces `Base.astro`.
- **New components:**

| Component | Does |
|---|---|
| `GlobalHeader` | Main nav and utility nav, with the phone menu (reuses `navmenu.ts`) |
| `GlobalFooter` | The five columns, and the legal line |
| `LocalNav` | Section links or scroll-spy anchors (today's per-page headers become this) |
| `Seo` | Title, description, canonical, Open Graph, JSON-LD, and the index flag |
| `OneLine` | The sentence on what The Labs is, on every deep page |
| `Spec` | Length · format · cost · who it's for |
| `Status` | Forming, active, applications open, underway, Pilot/Regional/National, draft |
| `NextStep` | The one action at the end of every page |
| Object cards | Event, Lab, Cycle, Problem, Project, Playbook, Person, Org |
| `EmptyState` | Honest empty states ("Be the first on the list"), never a zero |
| `Breadcrumbs` | Where you are, on object pages |

### 3.3 Styles

Fold the eleven sheets into a system, keeping page sheets only where a page truly has its own look:

- **`tokens.css`:** `colors_and_type.css`, plus `--metal` (gold) and `--national` (silver) from `home.css`.
- **`base.css`, `layout.css`, `components.css`:** the shared parts of `join.css`, `system.css` and `app.css`. `layout.css` holds the Swiss grid and the type scale.
- **Page sheets that stay:**
  - `home.css`, `enterprise.css` and `government.css` for the worlds and their sales sections;
  - `role.css`;
  - `deck.css`;
  - `account.css`, made from `guide.css`.

### 3.4 The content model

**Every collection gets these governance fields:**
- `need`: "As a…, I need…, so that…";
- `owner`: a role;
- `review`: a date;
- `status`: draft, live or withdrawn;
- `source`: where the data comes from;
- `placeholder`;
- `index`.

People, stories, orgs and problems also get `consent`: who agreed, to what, and when.

| Collection | Key fields |
|---|---|
| labs | Name (charter form), slug, status (list, forming, first workshops, first cycle, chartered), host library, places, rhythm, contact, parent region |
| events | Date, time, time zone, type (workshop, anchor, open house), Lab, cycle, playbook, place or online, RSVP link. Built from `data/schedule.json`. |
| cycles | Lab, season, theme, dates, state, anchor events, problems, projects, results |
| problems | Title, who it affects, owner (an org, with consent), cycle, status |
| projects | Title, team (people, with consent), problem, cycle, status, repo, recording |
| playbooks | Title, type (workshop, guide, kit), maturity (pilot, regional, national), credits, licence, source URL, used in |
| people | Handle, name, roles, affiliations (each with "ask to be shown" and the organization's acceptance), credits |
| credits | A contribution credited to an organization: person, organization, activity, date, hours, paid time or not, the Lab Reviewer's confirmation, the organization's acceptance |
| orgs | Name, kind, parent, website, claimed (yes/no, how), roles, Labs hosted, ladder step |
| roles | Today's `content/roles/*.json`, moved in |
| stories | Title, date, people, source (press or ours), permission |
| partners | Today's `government.json` and `enterprise.json`, plus libraries and funders |
| pages | Copy for the owner pages and utility pages |
| steps, scenarios, faq | As now; steps become account content |

### 3.5 Data

- **Read, never retype.** One adapter per source in `src/data/`:
  - the platform (OLOS) for Labs, events, cycles and counts, once it has an API;
  - until then, dated snapshots in `data/` taken from the public site, each carrying the date it was taken.
- **Hide anything past its date.** Shared helpers drop past sessions and switch cycle states by date, as the home's cycle band already does.
- **Rebuild daily.** Add a daily `schedule` trigger to `deploy-pages.yml`, so dated pages never go stale between commits.
- **No invented records.**
  - Real records come only from public sources or the people themselves, with consent.
  - Prototypes of organisations, people and the account use clearly fictional samples, marked as samples.

### 3.6 Redirects

- **Today's prototype routes**, as Astro redirects (meta refresh on GitHub Pages):
  - `/labs/`, `/conversation/`, `/your-story/`, `/room/`, `/practice/`, `/guide/`, `/apply/`, `/invite/`, `/nominate/` → their `/account/…` homes;
  - `/government/` → `/partners/government/`, and `/enterprise/` → `/partners/enterprise/`;
  - `/contributing/` (and its old aliases) → `/contribute/community/`.
  - `/join` stops redirecting and becomes the start page.
- **`redirects.json`:** one map from every production and legacy address to its new home (the appendix of `information-architecture.md`). The host turns it into real 301s at launch.

### 3.7 Search and indexing

- **One `INDEX` switch.** It's off for the GitHub Pages build, so every page is `noindex`. At launch, each page's own `index` field decides.
- **`@astrojs/sitemap`,** with only indexable pages.
- **The robots file** never blocks pages that carry `noindex`.
- **JSON-LD** via `Seo`: Organization on `/` and `/about/`, Event on in-person events, breadcrumbs on object pages.

### 3.8 Offline

The service worker precaches every page today, which won't scale to a full site. Narrow it to what an ambassador needs on a phone in a room: the account's guide, its steps, the deck and the offline page.

### 3.9 Checks, run on every build

- **`lint-copy.mjs`:** walk every collection, not just `content/` and two data files.
- **`check-meta.mjs` (new):** every page has a need, an owner and a review date. The build fails if:
  - a review date has passed;
  - a `placeholder` page is linked from a live page;
  - a person or story lacks consent.
- **`check-links.mjs` (new):** every internal link resolves, and live pages never link to drafts.
- **`capture.mjs` (new):** the Playwright captures I've been running from scratch scripts, moved into the repo. They take desktop and phone screenshots for each PR, scrolling through immersive pages rather than taking one full-page shot.

### 3.10 Docs

- **Slim the README** (44 KB today) to what the repo is and how to run it.
- **Move the rest to `docs/`:** architecture, content model, governance, voice, worlds, assets.
- The project docs stay the decision log.

## 4. The PRs, in order

Each PR follows the same steps:
- its own branch, opened as a draft;
- the preview artifact refreshed, and desktop and phone screenshots;
- the project docs updated;
- merged only when Brendan says "merge".

Sizes are relative: S, M, L.

### PR 1 · Skeleton (L)

- **Layouts and navigation:**
  - `Site.astro` and `Account.astro`;
  - `GlobalHeader`, `GlobalFooter`, `LocalNav`, `Seo`.
- **Every public page moves onto the global header and footer:** home (quiet), roles, government, enterprise, contributing. Each page's own anchors become its local nav.
- **The ambassador tools move under `/account/`,** with redirects. That frees `/labs/`.
- **`/join/` becomes the start page:** what you get, one Google button, what happens next. Every "Join The Labs" points here.
- **First style consolidation:** `tokens.css` and the shared header and footer styles.
- **Done when:**
  - every page reaches every zone in one click;
  - the worlds look and move exactly as before;
  - the build is clean;
  - the phone menu works.

### PR 2 · Content model and data (M)

- **Collections and schemas** with the governance fields; roles and partners move in.
- **Events from `schedule.json`** and the home's snapshot.
- **Date helpers** and the daily rebuild.
- **The checks:** `check-meta.mjs` and `check-links.mjs`, plus the wider lint.
- **Done when:** the build fails on a stale review date, a broken link, or a placeholder linked from a live page.

### PR 3 · Take part (L)

- **Pages:** `/workshops/`, `/events/` and event pages, `/build-cycles/` and cycle pages, `/labs/`, `/labs/dc/`, the forming Labs, and `/labs/start/`.
- **Cycle pages:**
  - Fall 2026 as the current cycle;
  - Civic & Elections (Summer 2026) as the first archive page, filled from the Oct 13 Showcase.
- **Forming Labs** show their stage and "Be the first on the list", never a count of zero.
- **Done when:** every take-part need in the owner table (`information-architecture.md` §4.8) has its page, with a working next step.

### PR 4 · The home, realigned (M)

- **The nav goes to pages,** and each scene that has an owner page gets a quiet link to it.
- **Read from the collections:** "Coming up" from events, the cities from labs, counts from data. No snapshots are stored in the home.
- **The 10-second test** is checked against the hero and "What this is".
- **Done when:** no dated fact lives in `home.json`, and the journey is unchanged.

### PR 5 · Proof (L)

- **Pages:** `/projects/`, `/problems/` (with "Bring us a problem" going to the account, `path=problem`), `/people/<handle>/` (opt-in), `/about/` and its pages, `/newsroom/`.
- **Drafts:** `/about/results/` stays a draft until the first published numbers. The partner pages' results lines stay off live pages until then.
- **Done when:** every person and quote shown has a consent record, and the Showcase projects are live (with consent).

### PR 6 · Partners and organisation pages (L)

- **Partner pages:**
  - the `/partners/` hub, with government and enterprise moved under it;
  - libraries and funders as drafts;
  - "Bring a problem" as a door.
- **Organisation pages** (`/orgs/<slug>/`, from `org-pages.md`):
  - the public page in its two states (started, claimed);
  - the ladder;
  - people shown only when they asked and the organization accepted;
  - accepted credit (paid time included) as totals, with named items where people agreed;
  - the page's own fractal ladder: Maintainers and Committers accept, Reviewers check.
  - Built with a fictional sample organisation, marked as a sample.
- **For enterprise gets its self-serve door:** "Start your organization's page" and "Lend your experts", beside "Talk to us".
- **On the site it's an "organization page"** (decided Oct 3).
- **Done when:** an organization page renders in both states with sample data, nobody appears without both sides agreeing, and no credit counts until a Lab Reviewer has confirmed it and the organization has accepted it.

### PR 7 · The open project (L)

- **`/contribute/`:** give time (the roles, and production's volunteer teams) or give work.
- **`/contribute/community/`:** today's `/contributing/`, with the levels held back until the board approves them.
- **`/playbooks/`:** a short, honest catalogue of real items only (the ambassador deck, the guide), each with its maturity, credits and source.
- **`/handbook/`:** the code of conduct, licences, contribution terms, a draft brand and trademark policy, and role duties.
- **`/platform/`.**
- **Done when:** every playbook links to its source and shows its maturity.

### PR 8 · The account (L)

*(Oct 9, 2026: the ambassador tools moved to OLOS instead; see the update at the top.)*

The signed-in map, with fictional states switchable by a query value:
- home by state (new, applied, in a cycle, after);
- your Lab and calendar;
- your cycle;
- contribute, with help wanted, your credits and the review queue;
- roles and the guide;
- organizations: start or claim a page; list workplaces and ask to be shown; credit an organization and mark paid time; and, by rank on a page, requests, credit to accept and the time report; plus the Lab Reviewer's queue of contributions to confirm;
- profile and consent.

**Done when:** each state's home shows exactly one next step, and every consent setting is reachable in two taps.

### PR 9 · Ready to launch (M)

- **Redirects and search:** `redirects.json` complete, the sitemap, structured data, and the `INDEX` switch wired up.
- **Quality:** an accessibility pass (WCAG 2.2 AA), a performance budget for the worlds, and real-device checks (iPhone, Android, laptop) on the live preview.
- **Housekeeping:** rename the repo and package (Brendan's call), and `docs/` complete.

### Order and overlap

- PR 1 → PR 2 come first.
- After that, 3, 5, 6 and 7 can be built side by side off PR 2.
- PR 4 follows PR 3, PR 8 follows PR 6, and PR 9 comes last.

## 5. Before it starts

- **The Oct 13 Showcase.** Capture each project:
  - title, team (with written consent), problem, repo, a photo, and a one-line "what it does";
  - the consent wording, shared beforehand.
  This fills PR 3's archive page and PR 5's projects.
- **The top-task vote and paper tree test** at the same Summit. The labels are JSON, so PR 1 can ship with the proposed ones and change after.
- **Decisions, by PR:**

| PR | Decision |
|---|---|
| 1 | The header labels; `/join/` as the start page; moving the tools into the account |
| 3 | Lab stages and the forming threshold |
| 5 | Public problems and who can be named; the consent policy for profiles; results before partner pages go public |
| 6 | `/partners/` nesting; the organisation-page open questions (`org-pages.md`) |
| 7 | Playbook maturity names; what's in the handbook first |
| 8 | Whether the account's map belongs in this repo (assumed yes) |
| 9 | The repo's new name |

## 6. Risks

| Risk | How the plan handles it |
|---|---|
| The scope is large | Nine PRs, each shippable and reviewable alone; drafts stay unlinked |
| Dated content goes stale | Date helpers, the daily rebuild, and review dates enforced by the build |
| Invented content creeps in | Real records only from public sources or with consent; samples marked as samples; `check-meta` checks consent |
| The worlds regress while the layout changes | PR 1 changes only the header and footer around them; captures compare before and after |
| GitHub Pages has no server | Redirects are meta refresh for now; the account is a prototype with fictional state; real 301s and auth come at launch |
| Board approvals lag (roles, levels, enterprise, dues) | Pages stay drafts, unlinked and `noindex`; org pages can launch first as a recognition feature |
| Privacy on organization pages | Listing an employer tells it nothing until the person asks to be shown; the organization must accept people and credit; a Lab Reviewer confirms first; records stay on the person's account; all enforced in the schema |

Related project docs: `information-architecture.md`, `org-pages.md`, `role-pages.md`, `home-three-paths.md`, `enterprise-page.md`. This file is the repo's copy of the plan; the project doc is the decision log.
