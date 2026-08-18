# Truck Junction Web Automation — Agent Guide

Cypress UI automation for `https://trucks.tractorjunction.com`, a third-party
site we do not control. Every convention below exists because of that: no test
hooks in the markup, client-side rendering, and localized copy.

**Primary audience of reports:** non-technical stakeholders (QA leads, PMs,
managers) who use Allure / screenshots to raise Jira bugs. Write every
assertion message, step name, and failure text so a non-engineer can understand
what the user tried and what went wrong — without CSS classes, DOM noise, or
framework jargon.

---

## Golden rules (read before any change)

1. **Do not alter any code unless necessary.** Prefer the smallest change that
   satisfies the request. Do not refactor, rename, or “clean up” unrelated files.
2. **Section-based modules, not page dumps.** Homepage is not one class. Each
   UI section gets its own spec + page object + test data (e.g.
   `SearchRightTruck`, `TruckInIndia`). Same rule for any other area of the site.
3. **Always cover all languages** (`en`, `hi`, `ta`) unless the user explicitly
   scopes to one language. Localized copy lives in `testData/`.
4. **If required data is missing, ask the user** — do not invent brand lists,
   expected URLs, validation copy, or localized strings.
5. **Reusable methods.** New helpers/actions must be callable from other
   sections later (LeadFormSuite, other pages). Prefer
   `helpers/` for shared field fillers; keep section-specific open/scroll in the
   page object. **Lead forms are never their own page object or dedicated lead
   spec file** when owned by a page (Homepage, PDP, Listing, …) — expose
   open/fill/submit/close as methods on that page object (named from the
   visible CTA short form, e.g. `submitGetOffersLead`), call them from `it`s,
   and reuse `helpers/leadFormFiller.js` whenever name/mobile/city fields match.
6. **If the user did not provide a TC ID**, derive one from the **section** you
   are writing, same pattern as Homepage (`TC-SRT-nn`, `TC-TIY-nn`). Pick a
   short feature prefix from the section name / heading, append the next free
   number, and keep IDs append-only.
7. **Name forms, methods, and variables from visible UI text** — buttons,
   headings, CTAs, and form titles the user sees (e.g. `openCheckOffersLeadForm`,
   `clickSearch`, `heroSelectBrand`), not generic names like `btn1` / `form2`.
8. **If Cypress cannot find or hydrate an element**, do not guess the locator —
   capture the live DOM with the Playwright CLI (`npm run capture:dom`) and
   write the locator from that capture.
9. **Write → run → capture only on failure → then other languages.** When the
   user supplies DOM / brand lists for one language (usually English): implement
   from that input first, run the section tests, and **only if they fail**
   re-capture live HTML with Playwright CLI and fix. After that language
   passes, add `hi` / `ta` (capture localized copy if the user did not provide
   it). Do not capture every language up front when English data was already
   given.
10. **Three-agent layer (local, not in git):** For new or changed automation,
    follow **Planner → Reviewer → Coder**. Local prompts live under
    `.cursor/agents/` (gitignored — never push). Committed summary is below;
    detailed role files are local-only.

### Three-agent layer (Planner → Reviewer → Coder)

These agents are **independent of Cypress tests** and are **not pushed to git**
(`.cursor/` is gitignored). Use them when writing or changing automation.

| Agent | Responsibility | Edits `cypress/` / `pages/` / `helpers/`? |
| --- | --- | --- |
| **Planner** | Prepare test cases (ID, title, Description, Expected Result, steps) and test-data plan | No |
| **Reviewer** | Review the plan for clarity, scope, data gaps, reuse, Jira-readiness; APPROVED or CHANGES_REQUESTED | No |
| **Coder** | Implement only an **APPROVED** handoff; run EN first, capture on fail, then other languages | Yes (approved scope only) |

**Flow:** User request → Planner handoff → Reviewer decision → (if APPROVED)
Coder implements. If CHANGES_REQUESTED, return to Planner. Coder must not
start without approval.

**Local files (create/keep on each machine, never commit):**

```
.cursor/agents/README.md
.cursor/agents/01-planner.md
.cursor/agents/02-reviewer.md
.cursor/agents/03-coder.md
.cursor/agents/workflow.md
```

In chat, name the layer explicitly (“Act as Planner…”) so each turn stays in
role.

### Before modifying an existing test or method

Answer all four — if any answer is weak, stop and ask or choose a safer path:

1. **Is this change necessary?** (Does the user’s request require touching this?)
2. **What impact will it have on other tests?** (Shared helpers, tags, IDs,
   locators used elsewhere.)
3. **Is there an existing similar method in the framework** that should be
   reused or extended instead of duplicating?
4. **Can this method be reused elsewhere?** (Design the API so another section
   can call it with different copy/selectors.)

---

## Project guide (read this instead of exploring the whole repo)

New agents should use this map first — do **not** scan the entire framework each
session unless the task requires it.

| Need | Where |
| --- | --- |
| Homepage Search The Right Truck | `pages/Homepage/SearchRightTruck.js`, `cypress/e2e/ui/Homepage/SearchRightTruck.cy.js`, `testData/HomePage/SearchRightTruckData.json` — IDs `TC-SRT-nn` |
| Homepage Truck in India | `pages/Homepage/TruckInIndia.js`, `…/TruckInIndia.cy.js`, `…/TruckInIndiaData.json` — IDs `TC-TIY-nn`; lead form methods on the page object; shared filler `helpers/leadFormFiller.js` |
| Homepage Popular Truck Brands | `pages/Homepage/PopularTruckBrands.js`, `…/PopularTruckBrands.cy.js`, `…/PopularTruckBrandsData.json` — IDs `TC-PTB-nn` |
| Homepage The Buzz Board | `pages/Homepage/TheBuzzBoard.js`, `…/TheBuzzBoard.cy.js`, `…/TheBuzzBoardData.json` — IDs `TC-TBB-nn` (en/hi; not on ta) |
| Homepage Latest Truck Updates | `pages/Homepage/LatestTruckUpdates.js`, `…/LatestTruckUpdates.cy.js` — IDs `TC-LTU-nn` |
| Homepage Find Reliable Used Trucks | `pages/Homepage/FindReliableUsedTrucksNearYou.js`, `…/FindReliableUsedTrucksNearYou.cy.js` — IDs `TC-FRU-nn` |
| Homepage SEO / About content | `pages/Seo/Homepage/HomePageSeoContent.js`, `cypress/e2e/seo/Homepage/HomePageSeoContent.cy.js`, `testData/Seo/Homepage/` — IDs `TC-SEO-nn` |
| New Truck PDP | `pages/PDP/NewTruckPdp.js`, `cypress/e2e/ui/PDP/NewTruckPdp.cy.js`, `testData/PDP/NewTruckPdpData.json` — IDs `TC-NTPDP-nn`; sticky jump nav = **SecondaryNavbar**; leads = methods on the page object (not separate lead classes), named from visible CTA short form (`GetOffersLead`, `CheckOffersLead`, …), reuse `helpers/leadFormFiller.js` when fields match |
| Tags / timeouts | `constants/constants.js` (`TEST_TAGS`, …) |
| Random mobile | `helpers/randomNumberGenerator.js` (+ `cy.randomNumberGenerator`) |
| Test case Description / Expected Result | `helpers/documentTestCase.js` (`documentTestCase`, `allureStep`) |
| Base URL / Allure / scrollBehavior | `cypress.config.js`; secrets `cypress/.env` from `.env.example` |
| App error filter | `cypress/support/e2e.js` |
| Live DOM capture | `npm run capture:dom` → `scripts/capture-dom.js` → `artifacts/` (git-ignored) |
| Agent conventions | this file (`AGENTS.md`) |
| Local Planner/Reviewer/Coder prompts | `.cursor/agents/` (**gitignored — not in remote**) |

**Run patterns:**

All `npm run test:*` and `npm run cypress:run` use **Chrome** (headless), not Electron —
closer to real user behaviour on the SPA. Use `npm run cypress:run:headed` for headed Chrome.

```bash
npm run test:searchRightTruck
npm run test:truckInIndia
npm run test:popularTruckBrands
npm run test:en                    # all Homepage specs, English tag
npx cypress run --spec "cypress/e2e/ui/Homepage/<Section>.cy.js" --expose grep=TC-XXX-01,grepOmitFiltered=true
```

**Conventions in one line:** section page object + JSON copy per language; no
barrels; no CSS-module hashes; sticky-header scroll offset; React select via
native `value` setter; plain-language `expect` messages; append-only TC IDs.

---

## Layout (module / section based)

```
cypress/e2e/ui/<Area>/<Section>.cy.js   UI specs (assertions + tags + Allure steps)
cypress/e2e/seo/<Area>/<Section>.cy.js  SEO content specs (About / description blocks)
pages/<Area>/<Section>.js               UI page objects
pages/Seo/<Area>/<Section>.js           SEO page objects
testData/<Area>/<Section>Data.json      UI localized copy
testData/Seo/<Area>/<Section>Data.json  SEO localized copy
constants/constants.js                  TEST_TAGS, TIMEOUTS, VIEWPORT_SIZES
helpers/randomNumberGenerator.js        shared unique 10-digit random numbers
helpers/leadFormFiller.js               reusable name/mobile/city lead-form filler
helpers/documentTestCase.js             Allure description + expected result + steps
scripts/capture-dom.js                  Playwright DOM capture helper
cypress/support/e2e.js                  Allure + grep registration, app error filter
cypress/support/commands.js             framework Cypress commands
cypress.config.js                       baseUrl, Allure, timeouts, scrollBehavior
```

| Area example | Section examples |
| --- | --- |
| `Homepage` (UI) | `SearchRightTruck`, `TruckInIndia`, `TheBuzzBoard`, `LatestTruckUpdates` |
| `PDP` (UI) | `NewTruckPdp` (SecondaryNavbar + section blocks; lead = page methods) |
| `Seo/Homepage` | `HomePageSeoContent` (About + Read More SEO headings) |
| Future `Listing` / `Compare` | One folder section per UI block |

**When the user asks for a new test:**

1. Identify the **area** (Homepage, listing, PDP, …) and **section**.
2. If `cypress/e2e/ui/<Area>/` or `pages/<Area>/` does not exist — **create them**.
3. Add `<Section>.cy.js`, `pages/<Area>/<Section>.js`, and
   `testData/<Area>/<Section>Data.json` — do **not** fold a new section into an
   unrelated page class “because it is also on the homepage”.
4. Mirror the pattern used by `SearchRightTruck` and `TruckInIndia`: separate
   section → isolated run when that section changes.

There are no barrel `index.js` files. Import modules by their real path:

```js
const TruckInIndia = require('../../../../pages/Homepage/TruckInIndia');
const { TEST_TAGS } = require('../../../../constants/constants');
const { randomNumberGenerator } = require('../../../../helpers/randomNumberGenerator');
```

---

## Non-technical reporting (Allure + Jira-ready failures)

Reports are the product for non-technical observers. A failed case must be
usable to file a Jira bug without reading source code.

### Test title, description, and expected result

When the user provides a **test case title** and **expected result** (and
checklist steps) — or when writing any new case — use the professional format
via `helpers/documentTestCase.js` at the start of each `it`:

```js
const { documentTestCase, allureStep } = require('../../../../helpers/documentTestCase');

documentTestCase({
  id: 'TC-PTB-01',
  title: 'Popular Truck Brands section is visible with heading',
  language: lang,
  description: 'What the test is checking, in plain language.',
  expectedResult: 'What the user should see if the product behaves correctly.',
  steps: ['Step 1', 'Step 2', 'Step 3'],
});

allureStep('Short user-facing action name', () => {
  page.verifySectionVisible();
});
```

Rules:

- Put the behaviour in the `it(...)` title after the stable ID
  (`TC-<FEATURE>-nn: <user-facing title>`).
- Always set **Description** and **Expected Result** so Allure (and Jira bugs
  filed from the report) show intent without reading code.
- Encode checklist items as Allure steps / assertions so the report shows:
  what was done → what was expected → what was observed.
- Prefer the user’s wording in titles/steps when it matches the live UI
  (after DOM capture confirms copy).
- Apply this format to **new** specs; migrate existing specs when those cases
  are next edited (do not mass-rewrite unrelated suites).

### Assertion messages (plain language)

```js
// Good — readable in Allure / screenshot failure
expect(pathname, `After Search, user should land on the "${brandLabel}" brand page`).to.eq(expectedPath);

// Bad — CSS / selector noise non-technical readers cannot use
cy.get('select.w-full.px-2...').should('have.value', 'ashok-leyland');
```

Rules:

- Message describes the **user outcome**, not the DOM node.
- Include the **expected** label/URL/text in the message.
- Never leave Cypress default subject text (long Tailwind class lists) as the
  only failure signal — wrap values in `expect(..., 'clear message')`.
- Prefer verifying visible labels users see (`"Ashok Leyland"`) over raw
  technical dumps; slugs may appear in parentheses when needed for URL checks.

### Screenshots on failure

- Keep `screenshotOnRunFailure: true` (already in `cypress.config.js`).
- Failure text above the screenshot must state the real user failure
  (e.g. “Budget tab did not show Select Budget dropdown”), not “expected true
  to equal false” alone.

### Allure steps

Every test must add **clear Allure steps** for the user journey, for example:

1. Open homepage (language)
2. Open Brand tab / select brand
3. Click Search
4. Verify brand page URL

Use step names a non-technical reader can follow. Prefer
`cy.allure().step('...')` / project Allure helpers when available; otherwise
document the journey with `cy.log` + `cy.task('log', ...)` until a shared
Allure step helper exists — then migrate new tests to that helper.

Generate/open reports:

```bash
npm run test:truckInIndia && npm run generate:report && npm run open:report
```

Allure results are cleared automatically at the start of every Cypress run (`before:run` in
`cypress.config.js`), so each run writes a clean `allure-results/` folder.

`npm run generate:report` builds a branded report named **Truck Junction Automation Report**
using the official Truck Junction logo/favicon from `trucks.tractorjunction.com`
(`assets/allure/truck-logo.svg`, `favicon.ico`) via `scripts/generate-allure-report.js`
and `config/allure/`.

```bash
npm run clear:result      # delete allure-results only
npm run generate:report   # branded Truck Junction Automation Report
npm run open:report       # open the generated HTML report
```

Allure only; mochawesome was removed. `npm run clean` clears results, report,
screenshots, videos, downloads and `artifacts`. Allure CLI needs Java on PATH.

---

## Languages

The site ships in **English (`en`), Hindi (`hi`), and Tamil (`ta`)**.

- Specs loop `supportedLanguages` (or equivalent) unless the user limits scope.
- All user-facing strings, placeholders, errors, and CTA labels come from
  `testData/...Data.json` per language — never hardcode one language in the
  page object.
- Tags: `@en` / `@hi` / `@ta` plus `@language`, plus `@positive` /
  `@negative` / `@edge` / `@smoke` as appropriate.
- If the user did not provide localized data for hi/ta, **ask** before guessing.

---

## Capture the real DOM before writing locators

The site is a client-rendered SPA. `curl` returns only pre-hydration HTML, and
tabs/filters rewrite the DOM on interaction. **Never guess a selector — capture
the live markup with the Playwright script first**, then write the locator
against what you captured.

**If Cypress fails to find, click, or wait for an element** (timeouts, detached
nodes, empty after hydration), stop guessing and re-capture with Playwright CLI
(`npm run capture:dom`), including any `--click` / `--wait-before` /
`--wait-after` needed to reach the same UI state. Diff the new capture against
the previous one, then fix the locator or wait strategy from real markup.

```bash
# whole section containing some text (default homepage)
MSYS_NO_PATHCONV=1 npm run capture:dom -- --contains "Truck in India" --wait-before 2500 --out artifacts/tiy-popular.html

# capture the DOM after interacting (e.g. Latest tab)
MSYS_NO_PATHCONV=1 npm run capture:dom -- --contains "Truck in India" \
  --click "button[title=Latest]" --wait-before 2500 --wait-after 2000 --out artifacts/tiy-latest.html

# Upcoming tab
MSYS_NO_PATHCONV=1 npm run capture:dom -- --contains "Truck in India" \
  --click "button[title=Upcoming]" --wait-before 2500 --wait-after 2000 --out artifacts/tiy-upcoming.html

# any explicit selector, or a different route
MSYS_NO_PATHCONV=1 npm run capture:dom -- --selector "header" --path /en/popular-trucks
```

Flags: `--path`, `--url`, `--contains`, `--scope`, `--selector`, `--click`
(repeatable), `--wait-until`, `--wait-before`, `--wait-after`, `--out`.
`--wait-before` is required on this SPA — React hydrates after `load`, and a
click before that is discarded.

The script writes the outer HTML and prints a JSON summary (`heading`, `tabs`,
`viewAll`, `visibleCards`). Diff captures to confirm what an interaction
actually changes — that is how the per-tab `View All` URLs were verified:

| Tab | View All label | href |
| --- | --- | --- |
| Popular (default) | View All Popular Trucks | `/en/popular-trucks` |
| Latest | View All Latest Trucks | `/en/latest-trucks` |
| Upcoming | View All Upcoming Trucks | `/en/upcoming-trucks` |

Output goes to `artifacts/` (git-ignored). Delete captures after locators are
confirmed.

On Git Bash, prefix with `MSYS_NO_PATHCONV=1` when passing a bare `/` path,
otherwise MSYS rewrites it into a Windows path.

---

## Selector rules

The site has no `data-cy`/`data-testid`. Prefer, in order:

1. `title`/`href`/`placeholder` attributes and `option[value=...]` slugs
2. Exact visible text via `cy.contains` with an anchored regex (`exactText`)
3. Semantic tags plus a stable non-hashed class (`button.tab-btn`, `a.viewLinkWrapper`)

Never use CSS-module hashes (`index-module__4WSkmq__wrapper`) or positional
`.eq()` on a page-wide query — they change on every deploy. Indexing *within a
scoped section* (`section.find('button.tab-btn').eq(1)`) is acceptable when the
order is part of the UI contract.

**PDP SecondaryNavbar:** scope with the stable tokens `div.secondaryNav.sticky`
(not the hashed `index-module__…__navbar`). Item labels via visible text /
`title` inside that root.

**Page blocks:** each major UI block on a page object is its own method (and
usually its own `it`) so a failing block can be fixed without rewriting the
whole page.
---

## Scrolling and hydration

`scrollBehavior: false` in `cypress.config.js` — Cypress auto-scroll is off, so
page objects scroll explicitly. A sticky topbar overlays content, so scroll with
an offset rather than centring:

```js
this.getHeading().scrollIntoView({ offset: { top: -STICKY_HEADER_OFFSET, left: 0 } });
```

React hydrates after load, so a click that lands too early is silently
discarded. For tab/filter controls, re-click until the UI reports the new state
instead of clicking once and asserting (see `TruckInIndia.openTab`).

React `<select>` values: use the native
`HTMLSelectElement.prototype.value` setter plus `input`/`change` events (see
`SearchRightTruck.setSelectValue`) — plain `option.selected = true` often does
not update React state.

---

## Test case naming and tags

Each `it` starts with a stable test-case ID: `TC-<FEATURE>-<NN>`, then a
behaviour description suitable for Allure / Jira.

| Feature | Prefix | Spec |
| --- | --- | --- |
| Search The Right Truck | `TC-SRT-nn` | `SearchRightTruck.cy.js` |
| Truck in India {year} | `TC-TIY-nn` | `TruckInIndia.cy.js` |
| Popular Truck Brands | `TC-PTB-nn` | `PopularTruckBrands.cy.js` |
| The Buzz Board | `TC-TBB-nn` | `TheBuzzBoard.cy.js` |
| Latest Truck Updates | `TC-LTU-nn` | `LatestTruckUpdates.cy.js` |
| Find Reliable Used Trucks | `TC-FRU-nn` | `FindReliableUsedTrucksNearYou.cy.js` |
| Homepage SEO / About | `TC-SEO-nn` | `seo/Homepage/HomePageSeoContent.cy.js` |
| New Truck PDP | `TC-NTPDP-nn` | `ui/PDP/NewTruckPdp.cy.js` |

If the user **does not supply a TC ID**, invent the prefix from the section
(e.g. a new Homepage “Compare Trucks” section → `TC-CT-01`, `TC-CT-02`, …) and
document the prefix in this table when the section is added. Never reuse or
renumber existing IDs.

```js
it(
  'TC-TIY-05: switching to Latest updates View All label and URL for latest trucks',
  { tags: langTags(lang, TEST_TAGS.POSITIVE) },
  () => { /* ... */ }
);
```

Name page-object members after **visible** copy where practical:

```js
// Good — matches UI
openBrandTab() / getSearchButton() / submitCheckOffersLeadFromTab()
TIYPopularCheckOffers — tied to section + CTA

// Bad — opaque
handleClick1() / doStuff() / el2
```

Every test carries a category tag (`@positive`, `@negative`, `@edge`), a
language tag (`@en`/`@hi`/`@ta` plus `@language`), and feature/area tags. Add
`@smoke` to the few that gate a quick run. IDs are append-only — renumbering
breaks traceability.

---

## Running tests

```bash
npm run test:truckInIndia               # one spec
npm run test:truckInIndia:positive      # by category
npm run test:en                         # one language across Homepage specs
npm run test:language                   # all languages
npm run cypress:run:tags --tags=@en+@smoke
```

Always let Cypress stream its output. **Do not pipe a run through `tail`/`head`**
— it buffers everything until exit, hiding progress and making a hung run
indistinguishable from a slow one.

---

## Environment and secrets

`baseUrl` comes from `CYPRESS_BASE_URL`, defaulting to production in
`cypress.config.js`. Copy `cypress/.env.example` to `cypress/.env` (git-ignored)
and set values there; `dotenv` loads it before the config resolves. Confidential
values are exposed to tests through `config.env`:

```js
cy.get('input[name="mobile"]').type(Cypress.env('userMobile'));
cy.get('input[name="mobile"]').type(randomNumberGenerator());
// or, from a spec: cy.randomNumberGenerator().then((mobile) => cy.get('input[name="mobile"]').type(mobile));
```

Never hardcode a URL in a spec or page object, and never commit real
credentials — add new keys to `.env.example` with empty values.

Use `randomNumberGenerator()` (or `cy.randomNumberGenerator()`) for throwaway
form data. It returns a 10-digit number starting with 6–9, with no repeated
digits, and it will not reuse a number in the same run.

---

## Housekeeping

Delete temporary debug specs and captured `artifacts/` once a locator is
confirmed; they must not land in the repo. Known third-party app errors
(service worker 500s, `ResizeObserver` loops, React hydration `#418`/`#423`/
`#425`) are filtered in `cypress/support/e2e.js` — extend that filter rather
than adding `uncaught:exception` handlers inside specs.
