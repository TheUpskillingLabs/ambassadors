# Contributor Community page: rework plan (draft)

Plan for reworking `/contributing/` (`content/site/contributing.json`, `src/pages/contributing/index.astro`) after the October 2026 feedback round. The page itself is now rebuilt to this plan; the design docs are not yet updated.

## What changed in our thinking

- **Everyone builds.** Every role (chapter lead, experience lead, poderator, community manager, and the rest) works hands-on in OLOS. Building with AI and working on shared things through review is baseline, like email. Up to now the roles have been mostly operational; this page is part of how we cross that threshold together.
- **Each Lab runs its own fork of OLOS.** Most building happens there. HQ maintains the core, drives major updates, refactors and core features, and takes in what Labs have proven.
- **The gold (brass) pin is graduation.** You learned enough to build something, it was reviewed and merged into your Lab's OLOS, and your Lab now runs on it. It recognizes a contributor to your Lab, not a steward.
- **The nickel pin is the same at the core.** Your work, proven in a Lab, was reviewed and merged into the core for every Lab.
- **Show, don't pitch.** Ideas get in by being built and shown working, not by being handed to someone else to add.
- **You do the work; review decides.** No one acts alone, and no one waits for someone else to do their work for them. The people who build and look after OLOS shape it, through review.
- **Stewardship is separate from the pin.** Reviewer, Approver and Maintainer are defined by what they do in review. You ask, and current stewards invite you based on the quality of your work. If the answer is "not yet", they tell you what would change it.
- **Out:** Supporting Member on this page, levels counted by workstreams, "go as far as you like", and "the pin says what you did, not what you're allowed to do."

## New page structure

The page tells one story: **learn to build → build in your Lab → graduate → (look after your Lab) → the best of it reaches every Lab.**

| # | Section (id) | Replaces | Content |
|---|---|---|---|
| 0 | Hero (`top`) | Hero | Title stays. New lede: "Build it in your Lab. Prove it there. The best of it ends up in every Lab." Fixes the ambiguous "become one of them." Brass pin. |
| 1 | Why here (`why`) | Why here | Keep. Rework the "Hands-on" item around baseline: building with AI and working through review is what work looks like now. |
| — | Cover 1: "Learn to build it." | "Start anywhere." | |
| 2 | Every role builds (`roles`) | Ways in (`start`) | One card per role: what you run, and what you'll build in OLOS from it. Note: "This is baseline now…" plus the on-ramp (pairing, first guided contribution). Supporting Member removed. |
| 3 | How work gets in (`how`) | new | "Have an idea? Show us." Four steps: build it, propose it, work it through review with your Lab, merged. Plus "You don't have to wait for someone else to do it. Nothing goes in unreviewed, but the work and the credit are yours." |
| — | Cover 2: "Graduate." | "Go as far as you like." | |
| 4 | The gold pin (`pin`) | How it's given (`given`) | Graduation: what it certifies, how it's given (merged → put forward → pinned at the regional get-together). Named builders from a Lab and what they built (placeholder until real names are approved). |
| 5 | Looking after the Lab (`rings`, the steward picker) | The way up (`rings`) | Reviewer, Approver, Maintainer described by what they do in review. Ask; invited on quality; "not yet" comes with specifics. Active and emeritus folded in here (replaces `status`). |
| — | Cover 3: "Every Lab." | "Yours for good." | |
| 6 | From your Lab to every Lab (`core`) | new | Four steps: works in your Lab → put forward by your Lab's stewards → reviewed by national stewards → merged into the core with your name and your Lab's. HQ's role. The nickel pin. |
| 7 | What stays true (`decides`) | What stays true | Rewritten: builders shape the system through review; the boards govern the organization (money, people, legal, brand); nothing goes in unreviewed; no one can buy a pin, role or vote; emeritus keeps the pin; only a serious Code of Conduct breach loses it. |
| 8 | Join (`join`) | Join | "Every pin starts with your first contribution." CTA stays (ambassador program) unless the on-ramp gets its own page. |

Nav becomes: Every role builds · How work gets in · The pin · Every Lab.

## Code changes

- `content/site/contributing.json`: rewrite as above. Remove `start`, `rings.steps` level criteria, `given`, and `status` as separate blocks; add `roles`, `how`, `pin`, `stewards`, `core`. Update `$comment`, `description`, `meta.need`, `draft`.
- `src/pages/contributing/index.astro`: new sections `how` and `core` (reuse the existing step-list markup from `given`). `roles` reuses the `start` card grid. `stewards` replaces the rings picker (see decision 1). Update the nav `spy` lists and the chapter covers.
- `src/scripts/rankpin.ts`: no change if the picker goes. The hero stays `metal: "brass", rings: 0`; the core section can show `metal: "silver"` if we want a second pin view.
- `src/styles/contributing.css`: drop picker styles if unused; otherwise minor.
- `src/pages/index.astro`: check the Share path copy that leads here still matches.

## Docs to bring in line

- `design/research/recognition-system.md`: record the decisions above; mark superseded sections (level criteria, rank plates, Supporting Member on this page).
- `design/pin/README.md`: brass = recognized contributor to a Lab, nickel = recognized contributor to the core; resolve the backing plates (decision 1).

## Decisions needed before building

1. ~~Steward recognition~~ **Decided:** stewards are Reviewer, Committer and Maintainer (Approver is renamed Committer). Each adds a ring behind the gold pin; the level picker stays, now for the steward roles.
2. ~~Nickel pin~~ **Decided:** the national/core level of the same system: nickel pin, and national Reviewers, Committers and Maintainers.
3. ~~Role list~~ **Decided:** roles are still being worked out and a Lab can make its own. The page shows four examples (chapter lead, experience lead, poderator, community manager) and says so.
4. **What lives in OLOS:** confirm that workshop and training materials, frameworks, journey maps and sample deliverables live there or will, since the pin depends on it.
5. **The on-ramp:** what the first guided contribution is and who pairs with newcomers. The page shouldn't promise it before it exists.
6. **Who puts work forward to the core:** a Lab's stewards (as drafted) or any individual.
7. **Named builders:** whose names and builds can appear, with their permission.
8. **Visibility:** the page stays unlisted (noindex) until the board approves. Does that still hold?

## Order of work

1. Settle decisions 1–3 (they change the structure).
2. Rewrite `contributing.json` copy and get it reviewed.
3. Rebuild the sections in `index.astro`; run the build and check the page on phone and desktop widths.
4. Update the two design docs.
5. Fill placeholders (named builders, on-ramp link) as decisions 5–7 land.

## Notes from the build

- The copy linter (`scripts/lint-copy.mjs`) bans "your Lab" ("no one owns a Lab"), so the page says "the Lab" and "the Lab near you".
- Section ids kept where markup was reused (`start`, `given`, `rings`, `status`); new sections are `how` and `core`.
