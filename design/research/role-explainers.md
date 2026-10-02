# Meeting a wearer: how other organisations explain their people

Researched Oct 2, 2026, on the organisations' own pages. The claims the decisions below rest on were checked a second time: parkrun, Reagan National, City of Melbourne, the Census Bureau, the missionaries' page, Reddit and Google Developer Experts.

**Why:** most people who land on a role page met someone wearing the button and want to know who that was and how to think of them. Brendan put it at about 80% (Oct 2, 2026). Fewer come to take the role.

## The question

When strangers meet an organisation's visibly identified people, what does the organisation do about it?
- Where does the explanation live, and how is it reached from the home page?
- What does it say, and in what order?
- What's printed on the object itself?
- How are trust and "not staff" handled?

## Cases

### Symbols worn in public

- **Hidden Disabilities Sunflower:**
  - The explainer is written to the wearer.
  - It says what the sunflower doesn't mean: no automatic priority access.
  - There's no way to verify a wearer.
- **TfL "Please offer me a seat" and "Baby on Board":**
  - The badge's words are an instruction, so no one needs to look anything up.
  - Guidance for other passengers lives in campaign posts.
- **Alzheimer's Society forget-me-not pin:**
  - One page serves both the people who spot it and the people who wear it.
  - It says what the pin doesn't mean: it isn't a sign that someone has dementia.
- **University of Glasgow "Ask Me" (2018):** pink badges. The university published two parallel posts.
  - The students' post covers how to spot them and what they help with, and has no join button.
  - The staff post explains how to sign up.
- **Conferences:**
  - Write the Docs explains its lanyard colours only in the organiser guide and at registration.
  - WordCamp Philly 2017 defines each colour badge by what the wearer wants and what you should do.

### People working among the public

- **parkrun, "Volunteer vests explained: A guide":**
  - Written for first-timers and regulars.
  - Order: why vests help you know who to turn to → each role, with its colour, its job and where you'll find it → the call to volunteer at the very end.
  - It's on the blog, not in the main menu.
  - The role is printed on the back of each vest.
  - In 2017 parkrun renamed Tail Runner to Tail Walker so walkers would feel welcome, and published why.
- **Reagan National, "Information Desks"** (under Customer Service): Travelers Aid volunteers → "royal blue vests" → what they know → desks and hours → the call to volunteer at the bottom.
- **City of Melbourne, "City Ambassadors"** (under Visitor info):
  - Order: red uniforms → what they help with → where and when to find them.
  - Recruitment is on a separate site.
- **DowntownDC's SAMs:**
  - A section of About › What We Do: who they are → what they do → "look for the distinctive SAM uniforms".
  - Pay and limits appear only in the job posting.
- **City Year:** the red jacket is explained to donors and members, not to the people who meet corps members.
- **Museums and libraries:**
  - The Smithsonian's National Museum of American History gives one line on its Visit page.
  - DC Public Library's Digital Navigators page is written to patrons.

### Trust and verification

- **Census Bureau:**
  - The pages describe the badge's features.
  - You can verify someone through the staff search or a regional office phone line.
  - Scams are on a separate page.
- **American Red Cross:** scams have their own page, so the volunteer pages stay warm.
- **Election workers:** the polling place itself is the credential.
- **AmeriCorps:**
  - Members wear the logo and introduce themselves with a scripted spoken line.
  - There's no public lookup.
- **The Church of Jesus Christ of Latter-day Saints, "10 Things to Know about Missionaries":**
  - Order: how to recognise them (name tags) → pairs → ages → unpaid ("They actually pay their own way") → respectful of your time ("If you ask them to leave, they go").

### Role marks online

- **Stack Exchange ♦ moderators:**
  - The help centre explains them: elected volunteers, what they can do, and the restraint expected of them.
  - There's a public list of moderators, and staff have a separate page.
- **Reddit, "What's a moderator?":** mods are "unpaid volunteers who are responsible for their own communities", while admins are employees responsible for the whole platform.
- **Wikipedia administrators:**
  - Described as tools, not authority.
  - Not employees of the Wikimedia Foundation.
- **Microsoft MVP, Google Developer Experts and GitHub Stars:**
  - Each has a public directory you can use to verify someone.
  - Google: "They are not Google employees, but independent professionals."

## Patterns

1. **Explainers for people who meet a wearer are rare and short, and live away from the home page.** They sit in a visitor or customer-service page, a help centre or a blog post. None touches the home page's opening screen.
2. **They follow one order:** who they are → how to recognise them → what they'll help you with → where and when to find them. Recruitment comes last, or on a page of its own.
3. **Recognition leads with colour, and the role word comes second.** Where the object's words are an instruction, no one needs to look anything up.
4. **None of the objects checked prints a web address or QR code.** People find the explanation by searching.
5. **The spoken line does what the object can't** (AmeriCorps' scripted introduction).
6. **"Not staff" is said as a difference of scope, not rank, and the role's limits are concrete.** Stated that way, the limits read as the shape of the role.
7. **Trust comes from low stakes stated plainly and from the setting.** Scam and verification material lives on its own page.
8. **"What it doesn't mean" appears wherever a misreading would cost something.**
9. **Role names are public statements** (parkrun's Tail Walker).

## What the site does with it (#47)

- **Home page:**
  - The world is unchanged.
  - The role pages stay out of the menu (Brendan, Oct 2); they're in the footer, whose column is now "Who you'll meet".
  - The Pod scene names the Poderator in words only: "everyone finds a Pod, and a Poderator keeps it together" (patterns 1 and 6).
- **Role pages with `met`** (Upskiller, Poderator, Mentor) open for someone who met a wearer:
  - "Met someone wearing this?"
  - who they are, in one line, under the button the hero already shows;
  - three things to know, including what the button doesn't mean ("A role, not a certification") and the role's scope ("A volunteer. Looking after one Pod, for one Build Cycle.");
  - where you'd meet one, and something to ask them;
  - then the role's cost and dates.

  The page turns at "Could this be you?" ("In short"), and the role's own button comes after "How it works" (patterns 2, 6 and 8).
- **The Ambassador page keeps its manifesto.** In the ambassadors' own voice, it already says why that person talked to you.
- **The search snippet** (`description`) is a third-person definition on those three pages, since search is the route (pattern 4).
- **The spoken line:**
  - Each `met.lede` doubles as the line the role's training gives wearers.
  - The ambassador guide adds the button question, "What's an ambassador?", with its one-sentence answer (pattern 5).
  - Its cost and time answers now use the time shape (twelve weeks, busiest at the start and the end) instead of the old event count.

**Still open:**
- Indexing the role pages once OLOS adopts them. They're `noindex` today.
- Confirming that Poderators and Mentors are volunteers. The home page already calls Mentors "experienced volunteers".
- A colour cue between buttons (button audit item 5 in `recognition-system.md`).
- Poderator or shepherd, weighed by what an outsider hears.

## Sources

- parkrun, Volunteer vests explained: https://blog.parkrun.com/uk/2024/10/21/volunteer-vests-explained-a-guide/
- parkrun, Walking the talk (Tail Walker): https://blog.parkrun.com/uk/2020/04/20/walking-the-talk/
- Reagan National, Information Desks: https://www.flyreagan.com/information-desks
- City of Melbourne, City Ambassadors: https://whatson.melbourne.vic.gov.au/visitor-info/city-ambassadors
- DowntownDC, What We Do: https://www.downtowndc.org/about-us/what-we-do/
- NMAH, Visit: https://americanhistory.si.edu/visit
- City Year, Red Jacket Society: https://www.cityyear.org/about/partnerships/red-jacket-society/
- University of Glasgow, "Ask Me" ambassadors: https://www.gla.ac.uk/myglasgow/news/studentupdates/headline_604951_en.html
- Hidden Disabilities Sunflower (US): https://hdsunflower.com/us/insights/post/for-people-with-non-visible-disabilities
- TfL, Why we have priority seating: https://madeby.tfl.gov.uk/2025/04/28/tfl-priority-seating/
- Alzheimer's Society, forget-me-not badge: https://www.alzheimers.org.uk/blog/what-different-forget-me-not-badges-for-dementia
- WordCamp Philly 2017, colour communication badges: https://philadelphia.wordcamp.org/2017/color-communication-badges/
- Write the Docs organiser guide, registration: https://www.writethedocs.org/organizer-guide/confs/registration/
- Census Bureau, How to identify a Census employee: https://www.census.gov/about/regions/philadelphia/contact/identify.html
- Census Bureau, Verify a survey: https://www.census.gov/programs-surveys/surveyhelp/verify-a-survey.html
- American Red Cross, Scams: https://www.redcross.org/contact-us/scams.html
- EAC, Voter FAQs: https://www.eac.gov/voters/voter-faqs
- AmeriCorps brand guidelines (2026): https://userve.utah.gov/wp-content/uploads/2026/06/2026-americorps-brand-guidelines-original-file-1-2.pdf
- 10 Things to Know about Missionaries: https://www.churchofjesuschrist.org/comeuntochrist/belong/share-goodness/10-things-to-know-about-missionaries
- Stack Overflow, site moderators: https://stackoverflow.com/help/site-moderators
- Reddit Help, What's a moderator?: https://support.reddithelp.com/hc/en-us/articles/204533859-What-s-a-moderator
- Wikipedia: Administrators: https://en.wikipedia.org/wiki/Wikipedia:Administrators
- Microsoft MVP FAQ: https://mvp.microsoft.com/en-US/faq?section=mvp
- Google Developer Experts: https://developers.google.com/community/experts
- GitHub Stars: https://stars.github.com/program
