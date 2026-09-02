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
11. **Every spec (UI or SEO) starts with the redirection health check.** Call
    `registerRedirectionCheck(...)` from `helpers/verifyPageRedirections.js`
    as the first statement in each `describe` block, before any other `it`.
    It registers as that section's `TC-<PREFIX>-00` — see **Redirection /
    broken-link health check** below for what it does and why it never fails
    a test.
12. **Auditing a page for lead forms: click every CTA, don't trust one
    selector.** A page can have more than one *distinct* lead form, and a
    second one can use completely different markup (no `id`/`name`, only
    placeholders) than the one you already know about — checking only for
    `input#name[name="name"]` will silently miss it. When asked "how many
    lead forms are on this page", click every plausible CTA (Check Offers,
    Check Truck Price, Contact Seller, Notify Me, Call Now, …) on a fresh
    page load each time and inspect the resulting inputs' `id`/`name`/
    `placeholder` directly, rather than assuming buttons with different
    labels must open the same form (or that one without matches must not be
    a form at all). This is how `NewListingPages`' Call Now → "Get Offers"
    assistance form — a second, distinct lead form with no id/name markup —
    was found after an id-only check first missed it.
13. **Every lead-form name field uses `testqa`, framework-wide.** This site
    has no sandbox/test mode — every automated form submission becomes a
    real lead in production. Per explicit user direction, the name is always
    the literal string `testqa` (matching `testData/HomePage/
    TruckInIndiaData.json` → `CheckOffersForm.name`) — do not derive it from
    a page/CTA identifier. (An earlier convention used a traceable
    `${identifierKey}${FormType}Form` string per CTA; the user explicitly
    reversed that in favour of a single consistent `testqa` everywhere.) When
    a form has no clear "Thank You" text to assert on, verify the real
    submission with `cy.intercept`/`cy.wait` on the network call (status 2xx
    + a lead/enquiry-like URL) rather than a weaker proxy like "the modal
    closed".
14. **Every spec's tag helper includes `deviceTag()`.** This site branches on
    `navigator.userAgent`/request headers, not just viewport size, so mobile
    coverage uses real device emulation (see **Device emulation** below), not
    a viewport-only resize. `deviceTag()` from `helpers/deviceTags.js` must be
    spread into every `langTags`-style tag array (already done for all
    existing specs) so `grepTags=@mobile`/`@desktop` and Allure results
    reflect which device a run actually used.
15. **Never let `cypress/support/e2e.js`'s `Cypress.on('fail', ...)` handler
    lose its trailing `throw err;`.** Under this Cypress version, attaching a
    `fail` listener suppresses the failure by default unless the handler
    re-throws — confirmed by a deliberately-impossible assertion
    (`expect(1).to.equal(2)`) reporting as passing when that line was missing.
    The handler must return `false` **only** for the specific Allure
    serialization-noise case it targets, and `throw err` for everything else.
    If you ever touch this handler, verify with a throwaway spec containing a
    guaranteed-failing assertion that real failures still fail before trusting
    the change — do not assume "no errors in the run" means the suite is
    healthy.
16. **If a requested page turns out to be a large multi-step flow (not a
    lead form) or looks OTP-gated, flag it instead of assuming scope.** When
    auditing turns up something structurally different from what's already
    automated — e.g. a multi-step wizard with many fields per step, or any
    flow that plausibly ends in phone/OTP verification (common for "post
    your ad"/"list your vehicle" flows) — stop and tell the user what was
    found rather than either silently skipping it or sinking large effort
    into something that may be impossible to finish end-to-end. This is what
    happened with Sell Used Trucks: a 3-step truck-listing wizard (8+ fields
    on step 2 alone) was found while the other four Used Truck pages had
    simple, already-established lead-form patterns — it was called out
    rather than assumed in scope.
17. **Matching `id`/`name` attributes do not prove two CTAs open the same
    component — check the submit button text and confirmation copy too.**
    `CheckOffersLead` and `GetSellerDetailsLead` both use `input#name[name=
    "name"]`/`input#phone[name="phone"]`, which made an initial audit wrongly
    assume "Contact Seller" on Buy Used Trucks/Vehicle Report was
    `CheckOffersLead` — the bug only surfaced once the flow was actually run
    to submit, revealing a different submit button ("Get Seller Details") and
    a different confirmation heading ("Thank You For Contact" vs. "Thank
    You!!!"). When two CTAs share the same input ids, still verify the
    *submit button text* and the *post-submit confirmation* independently
    before treating them as the same reusable component.
18. **No fixed waits, no unnecessary `{ force: true }` — treat both as code
    smells to fix at the root, not routes around a flaky test.** `cy.wait(ms)`
    hides a real timing bug behind an arbitrary number; replace it with a
    condition Cypress can actually retry on (`.should('have.length.at.least',
    n)` on an observable DOM signal, or a self-verifying retry like
    `pickAutocompleteOption` in `pages/UsedTruck/SellUsedTrucks.js`).
    `{ force: true }` on a click/type can turn a genuine UI defect (a broken
    overlay, an unreachable control) into a silently-passing test — reach for
    it only when there's a specific, commented reason a control is
    legitimately not "visible" to Cypress by design (e.g. a native file input
    deliberately hidden behind a styled button, see `fillStep3Photos`), never
    as a first response to a click/type failure. Prefer a small, targeted fix
    (a real wait condition, a corrected selector, a minimal scroll nudge
    proven necessary by an actual failure) over reaching for `force: true` or
    a fixed wait. Code should read as industry-standard, clean, and
    understandable to someone unfamiliar with the flakiness history. Also
    never overwhelm the real production server this project drives — no tight
    retry loops, no parallel hammering of the same endpoint, no submitting
    more real leads than a test actually needs.
19. **Run verification passes in headed mode.** While actively debugging or
    confirming a fix works (as opposed to a routine CI-style run), use
    `--headed` so the user can watch the browser and interject with
    corrections in real time, rather than only headless with a report
    afterward.
20. **`LeadFormFiller`'s `nameSelector`/`mobileSelector` must never contain
    `:visible` (or any other jQuery-only pseudo-class).** `getFormRoot()`'s
    fallback path calls the *native* `Element.querySelector(this.
    mobileSelector)`, which throws a `SyntaxError` (a `DOMException`) on
    invalid native selector syntax — `:visible` is jQuery-only, not valid
    CSS. That path only runs when `fillPriceOrBudgetIfPresent()` or `submit()`
    is actually called (`getSubmitButton()` also goes through
    `getFormRoot()`), so a `:visible`-suffixed selector can sit unnoticed
    until a real run finally exercises it. When it does, Cypress's own
    internal retry/error-handling crashes trying to process the thrown
    `DOMException`, surfacing as an opaque `TypeError: Cannot set property
    message of [object DOMException] which has only a getter` — with no
    stack trace pointing at the actual page-object line, and no relation to
    the real symptom (a form that otherwise fills and looks correct). This
    was chased through several wrong hypotheses (network intercept matching
    third-party traffic, click-target/timing issues) on
    `pages/CategoryPages/ElectricVehicle.js`'s Call Now form before being
    traced to this. `NewListingPages.js`'s `getOffersLead` config uses the
    same `:visible`-suffixed pattern and calls `fillAndSubmit()` (which
    always calls both `fillPriceOrBudgetIfPresent()` and `submit()`) — it
    has not been confirmed to hit this exact crash, but it is the same latent
    bug and worth keeping in mind if a New Listing Page's Call Now test ever
    fails with this identical, confusing error. Only add `:visible` to these
    selectors if there are genuinely multiple same-placeholder inputs on the
    page needing disambiguation, and even then, prefer scoping via
    `formRootFinder` over baking `:visible` into a selector string that also
    reaches native `querySelector`.
21. **Every section/page's test coverage must include positive, negative, and
    edge cases** (`@positive` / `@negative` / `@edge` tags), not positive-only
    happy-path coverage. Positive = the documented success flow (valid input,
    expected confirmation). Negative = invalid/missing required input is
    rejected with the real validation message(s) shown on the live page, and
    no submission goes through. Edge = boundary/unusual-but-legal input (e.g.
    minimum/maximum field lengths, special characters, the smallest/largest
    valid selection, submitting via keyboard `{enter}` instead of the submit
    button) that a happy-path test wouldn't otherwise exercise. When adding or
    reviewing a section's tests, check it has all three categories before
    considering it done; if the live page's real validation copy for a
    negative/edge case isn't already known, capture it live (golden rule 8)
    rather than inventing it.
22. **Keep a multi-page spec file (via `pageKey`, like `NewListingPages` or
    `CategoryListing`) to roughly 10 pages or fewer — split larger groups
    into multiple spec files sharing the same page object/test data.**
    Running many pages back-to-back in one continuous Cypress browser
    session causes cumulative slowdown that gets worse the later a page
    runs in that session — a real, reproducible effect, not a guess: a
    28-page single-spec version of `CategoryListing` had ~11 pages near the
    end of the sequence intermittently fail dropdown interactions even with
    a 30s retry window, and moving `ElectricVehicle.cy.js` (normally 100%
    reliable run alone) to run *after* that 28-page batch in one combined
    Cypress invocation made it start failing the exact same way — proving
    the cause was the session's accumulated length, not anything about
    those specific pages or their code. No code-level fix (selectors,
    timeouts, retry logic) addresses this, because the cause isn't in the
    code. `CategoryListing` was split into four ~7–9-page spec files by nav
    group as a result, each running as its own fresh Cypress invocation
    (`&&`-chained in the npm script, not a single combined `--spec` list) so
    no run accumulates enough session length to degrade. (In hindsight, some
    of what looked like session-length degradation may have been the same
    stale-chainable bug below manifesting more often under heavier load —
    the two were investigated together and are hard to fully separate — but
    splitting large multi-page specs into smaller files remains good
    practice regardless.)
23. **A helper that types/clicks into a dropdown and retries via `.should()`
    must receive the field as a function it re-invokes on every call
    (`() => cy.get(...)`), never an already-evaluated `cy.get(...)` result
    passed in once and reused across several separate `.should()`/
    `.clear()`/`.type()` calls.** A reused chainable does not re-query the
    live DOM on each Cypress retry tick the way a brand-new `cy.get()` call
    does. The symptom is easy to miss: the assertion just fails with a plain
    message and **no** "Timed out retrying after Xms:" wrapper at all — a
    real retry loop's failure always carries that wrapper, so its absence is
    the tell that `.should()` never actually retried. A failure screenshot
    can even show the field visually holding the correct, fully-selected
    value at the exact moment the assertion reports `false`, which looks
    like a pure timing coincidence but is actually this bug. See
    `pages/CategoryPages/CategoryListing.js`/`ElectricVehicle.js`'s
    `pickDropdownSuggestionWithRetry` for the corrected pattern.
24. **Don't type a hardcoded search term into an autocomplete field across
    many different pages sharing the same component.** Different pages can
    have entirely different underlying data (e.g. different truck brand
    inventories on different category listing pages) — a term that matches
    reliably on one page (`"Tata"` on `ElectricVehicle`) may not exist at
    all on another (LPG's model list). Where the field's *content* doesn't
    matter for the test (any valid selection is fine), clicking the field to
    focus it and picking whatever default suggestion it shows — no typing —
    is more robust than a fixed search term, and was the actual fix for a
    long-stuck failure the user diagnosed themselves from a working recorded
    Playwright interaction. See `CategoryListing.pickAnyDefaultSuggestion`.
25. **Never use `try...catch` in automation files.** Cypress should handle
    test failures naturally. A `try...catch` around Cypress commands can
    swallow a genuine failure the same way an unguarded `Cypress.on('fail',
    ...)` handler can (golden rule 15) — let failures surface and fail the
    test rather than catching and hiding them.
26. **Never use a generic element selector (`button`, `a`, `div`, etc.)
    combined with `.contains()` to locate an element** (e.g. avoid
    `cy.get('button').contains('Receive similar offers').click();`). See
    **Selector rules** below for the full priority order this project follows.

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
| New Listing Pages (Best Trucks/Popular Truck/Find New Trucks/Upcoming Trucks/Latest Trucks/BS6 Trucks) | `pages/ListingPages/NewListingPages.js`, `cypress/e2e/ui/ListingPages/NewListingPages.cy.js`, `testData/ListingPages/NewListingPagesData.json` — IDs `TC-NLP-00` (redirection) + `TC-NLP-01..05`; scope for now is **only** the lead forms per page (not page content/filters/cards). Every distinct CTA that asks for name/mobile/other details is its own lead form and gets its own test (per explicit user direction — even CTAs that reuse the same underlying modal count separately, since they're different user-facing entry points; Contact Seller even renders different placeholder copy, "Enter Your Name" vs "Name"). Fixed 5-slot numbering reused across every page (`NewListingPages.leadFormSlots`), a page missing a slot skips that TC (`hasLeadForm(slotKey)`) rather than renumbering: `TC-NLP-01` Check Offers, `-02` Check Truck Price, `-03` Contact Seller, `-04` Notify Me — all four reach the same `CheckOffersLead` modal (`id="name"`/`id="phone"`) — and `-05` Call Now, which opens a **different** component (`GetOffersLead`: placeholder-only inputs with no id/name, heading "SHARE YOUR DETAILS TO GET ASSISTANCE", submit "Get Offers"; verified via `cy.intercept`/`cy.wait` on the real submit POST since it has no "Thank You" text). 19 of 30 slots exist across the 6 pages. Every submission is a **real production lead** (no sandbox) — the submitted name is `testqa` (golden rule 13). `en` only for now (URLs given were English-only, hi/ta not yet confirmed) |
| Compare Trucks | `pages/Compare/CompareTrucks.js`, `cypress/e2e/ui/Compare/CompareTrucks.cy.js`, `testData/Compare/CompareTrucksData.json` — IDs `TC-CT-00` (redirection) + `TC-CT-01`; scope is only the "Check Offers" lead form (same shared `CheckOffersLead` modal), not the comparison tool. Live audit found exactly one lead form on this page. `en` only for now |
| Brochure | `pages/Brochure/Brochure.js`, `cypress/e2e/ui/Brochure/Brochure.cy.js`, `testData/Brochure/BrochureData.json` — IDs `TC-BR-00` (redirection) + `TC-BR-01..04`; scope is the "Download Brochure" lead form. Live-scoped audit confirmed it opens the same `CheckOffersLead` modal — the modal's own submit button reads "Check Offers" even though the trigger CTA is "Download Brochure". `TC-BR-01` covers the static "Download Brochure" CTA near the top of the page; `TC-BR-02..04` cover the "Best Selling Trucks" carousel further down (the same reusable tabbed component as Homepage's Truck in India section) — Popular/Upcoming/Latest tabs each get their own test, submitting via one card's Download Brochure button per tab, per golden rule 12 (every distinct entry point counts separately, even when they open the identical form). `en` only for now |
| UsedTruck: Buy Used Trucks | `pages/UsedTruck/BuyUsedTrucks.js`, `cypress/e2e/ui/UsedTruck/BuyUsedTrucks.cy.js`, `testData/UsedTruck/BuyUsedTrucksData.json` — IDs `TC-BUT-00/01`; one lead form, "Contact Seller" → `GetSellerDetailsLead` (a **fourth** distinct component — see below) |
| UsedTruck: CV Permit | `pages/UsedTruck/CvPermit.js`, `cypress/e2e/ui/UsedTruck/CvPermit.cy.js`, `testData/UsedTruck/CvPermitData.json` — IDs `TC-CVP-00/01/02`; two lead forms — "Check Offers" (`CheckOffersLead`) and "Check Permit Info" (`GetInformationLead` — see below) |
| UsedTruck: Vehicle Report | `pages/UsedTruck/VehicleReport.js`, `cypress/e2e/ui/UsedTruck/VehicleReport.cy.js`, `testData/UsedTruck/VehicleReportData.json` — IDs `TC-VHR-00/01/02/03`; three lead forms — "Check Offers" (`CheckOffersLead`), "Contact Seller" (`GetSellerDetailsLead` — **not** `CheckOffersLead`, despite sharing the same `id="name"`/`id="phone"`), and "Check Vehicle Report" (`GetInformationLead`) |
| UsedTruck: E Challan | `pages/UsedTruck/EChallan.js`, `cypress/e2e/ui/UsedTruck/EChallan.cy.js`, `testData/UsedTruck/EChallanData.json` — IDs `TC-ECH-00/01/02`; two lead forms — "Check Offers" (`CheckOffersLead`) and "Check Challan" (`GetInformationLead`) |
| UsedTruck: Sell Used Trucks | `pages/UsedTruck/SellUsedTrucks.js`, `cypress/e2e/ui/UsedTruck/SellUsedTrucks.cy.js`, `testData/UsedTruck/SellUsedTrucksData.json` — IDs `TC-SUT-00/01`. Not a simple lead form — a full 4-step truck-listing wizard (Brand → Model/Year/Kilometers Driven/Expected Price → Upload Photos [min. 2, real images from `cypress/fixtures/sample-truck-*.png`] → seller contact info). Flagged to the user before automating (golden rule 16); per explicit direction, driven for real end to end and verified up to the OTP screen — it is OTP-gated at the final step like `GetInformationLead`, with no configured test OTP in this repo |
| CategoryPages: Electric Vehicle | `pages/CategoryPages/ElectricVehicle.js`, `cypress/e2e/ui/CategoryPages/ElectricVehicle.cy.js`, `testData/CategoryPages/ElectricVehicleData.json` — IDs `TC-EV-00` (redirection) + `TC-EV-01/02`; scope is only the two lead forms found on this page, not the truck list/budget-brand filters/comparisons/FAQ content. Live click-and-inspect audit found this page reuses the exact same underlying listing-page component as `NewListingPages` — "Check Truck Price" (one per truck card) opens the shared `CheckOffersLead` modal, and the "Still confused?" widget's "Call Now" opens `GetOffersLead` (reuses `testData/ListingPages/NewListingPagesData.json` → `GetOffersAssistanceForm` copy rather than duplicating it, since it's the identical component/copy; fills name/mobile/city and the optional "Enter model name" field, both of which are autocomplete dropdowns). No "Check Offers"/"Contact Seller"/"Notify Me" CTA text was found on this page. `en` only for now (only the English URL was given). This page has two independent scroll regions (main content vs. a right sidebar that only starts following scroll past roughly the page's halfway point) — `openGetOffersLead` scrolls the window by two fixed steps rather than `scrollIntoView()` to reveal the Call Now widget; see golden rule 20 for a separate, unrelated `LeadFormFiller` selector bug this page's Call Now form also surfaced |
| CategoryPages: Category Listing | `pages/CategoryPages/CategoryListing.js` (shared page object), `testData/CategoryPages/CategoryListingData.json` (shared test data) — **6 spec files**, one per nav submenu group, each with its own `PAGE_KEYS` subset of the same `pageKey`-parametrized class (same multi-page pattern as `NewListingPages`): `CategoryListingCategory.cy.js` (Tippers, Trailers, Mini Trucks, Pickups, Transit Mixer, Auto Rickshaw, Tempo Traveller, 3 Wheeler — 8 pages, `TC-CL-nn`), `CategoryListingWheelers.cy.js` (4/6/8/10/12/14/16/18/22 Wheeler — 9, `TC-CL-nn`), `CategoryListingFuelType.cy.js` (Diesel, Petrol, CNG, LPG, LNG, Hydrogen, Bi Fuel — 7, `TC-CL-nn`), `CategoryListingGvw.cy.js` (LCV, HCV, SCV, ICV — 4, `TC-CL-nn`), `CategoryListingBrands.cy.js` (Tata, Ashok Leyland, Eicher, Mahindra Trucks — 4, `TC-TBR-nn`), `CategoryListingTruckSeries.cy.js` (Tata Ace, Mahindra Blazo, Mahindra Bolero, Ashok Leyland Boss, Ashok Leyland Dost — 5, `TC-TSR-nn`). The Brand/Truck Series pages reuse the identical `CategoryListing` class and `TC-CL-01..03` test bodies (Check Truck Price positive/negative/edge; none of the 9 have Call Now) but get their own `TC-TBR`/`TC-TSR` prefixes rather than `TC-CL`, since they're a conceptually distinct nav section even though the underlying component is the same. IDs within each file are reused identically across every page-instance in that file (genuinely the same test case per page, like `NewListingPages`). **Split into 4 files rather than one 28-page mega-spec deliberately**: running all 28 pages back-to-back in a single Cypress browser session caused cumulative slowdown severe enough that dropdown interactions on whichever pages ran last exceeded even a 30s retry window — confirmed by moving a page later in a combined run (with `ElectricVehicle.cy.js`, normally 100% reliable alone) and watching it start failing the exact same way. Two separate real bugs stacked on top of the session-length issue: (1) `getInput` in `pickDropdownSuggestionWithRetry`/`pickAnyDefaultSuggestion` must be a **function** re-invoked fresh on every call, not an already-evaluated `cy.get(...)` chainable passed in once and reused across several `.should()`/`.clear()`/`.type()` calls — a stale reused chainable doesn't retry against the live DOM the way a brand-new `cy.get()` call does (the tell: a failing assertion with no "Timed out retrying" wrapper at all, meaning it wasn't actually retrying); (2) the model field must **not** be typed into with a fixed brand name like `"Tata"` — different category pages carry different inventories (LPG's model list has no reliable "Tata" match, unlike Diesel/Electric), so a hardcoded search term isn't safe everywhere. Fixed per the user's own diagnosis (a working recorded Playwright interaction) by simply clicking the model field to focus it (`pickAnyDefaultSuggestion`) and picking whichever suggestion it defaults to, with no typing at all — plus a single 312px window scroll (not the two-step 500+150px tuned for `ElectricVehicle`'s longer page) to reveal the Call Now widget reliably on these shorter pages. Every code-level fix chased along the way (leaf-child click target, `:visible` selector, content-match filter, a real bug where city's success check trivially passed on the raw typed text instead of verifying a real selection, corrected on-screen field order Model→Name→Mobile→City, extended timeouts) was independently valid and is kept. All 28 pages pass cleanly as of this writing. Live-audited across all 28 pages (button text counted per page, not assumed from one sample): every page has "Check Truck Price" (`TC-CL-01/02/03` — positive/negative/edge on the shared `CheckOffersLead` modal, identical to `ElectricVehicle`'s); "Call Now" (`TC-CL-04`, `GetOffersLead`) is present **only** on the Fuel Type and GVW pages, confirmed absent (0 matches) on every Category/Wheelers page — `hasCallNow` per page in the test data drives a clean skip rather than a guess. `npm run test:categoryListing` runs all six groups as **separate Cypress invocations** (`&&`-chained, each its own fresh browser session) rather than one combined run, to avoid reintroducing the cumulative-session problem. "All Brands" (`/en/brands`) and "View All" truck series (`/en/commercial-vehicle-series`) are deliberately out of scope — live-audited as pure link directories (150+/170+ "Check Offers" buttons, no page-level truck listing, no "Check Truck Price" at all), a structurally different page type from the individual brand/series pages, not lead-form pages in their own right. Utility pages (Dealers, EMI Calculator, Tyres, News, Videos, Offers, etc.) from the same nav are a **different, not-yet-audited** pattern and remain out of scope; the Buses section is now covered separately (see the `Buses` area below). `en` only for now |
| Buses: Bus Listing | `pages/Buses/BusListing.js`, `cypress/e2e/ui/Buses/BusListing.cy.js`, `testData/Buses/BusListingData.json` — IDs `TC-BUS-00` (redirection) + `TC-BUS-01..03`; **9 pages** in one class via `pageKey` (same multi-page pattern as `CategoryListing`), all in a single spec file (kept together per explicit user direction — category-style pages like New/Popular/Latest Buses and product-style pages like the individual bus brand pages are not split apart): New Buses, Popular Buses, Upcoming Buses, Latest Buses, Ashok Leyland Buses, Tata Buses, Eicher Buses, SML ISUZU Buses, Mahindra Buses. Live-audited across all 9 (button text counted per page): every page reuses the exact same shared `CheckOffersLead` modal already used across the rest of the site — only the *trigger* CTA label differs: "Check Bus Price" on every page except Upcoming Buses, which uses "Notify Me" instead (same reasoning as `NewListingPages`' `upcomingTrucks` slot — unreleased vehicles get a waitlist CTA, not a price-check one); `leadTriggerCta` per page in the test data records this rather than assuming one label works everywhere. No "Call Now" widget was found on any of the 9 pages. "All Bus Brands" (`/en/buses/brands`) is deliberately out of scope — a pure link directory (108 "Check Offers" buttons, no page-level bus listing of its own), the same exclusion already applied to "All Brands"/"View All" elsewhere in `CategoryListing`. Kept in its own `Buses` area rather than folded into `CategoryPages`, since buses are a distinct product line from trucks even though the underlying lead-form component is identical. `en` only for now. **The per-model bus popup is a genuinely different component from the shared `CheckOffersLead` used everywhere else** — its name/mobile inputs only register typed keystrokes after a genuine, non-forced `.click()` (`{ force: true }` clear+type alone leaves the field permanently empty, confirmed live), its confirmation heading reads "Thank You for your interest." (rendered visually upper-case via CSS) rather than "Thank You!!!", and its phone field validates in real time — any non-10-digit value silently reverts to empty in the DOM, so the edge-case test asserts the "mobile required" validation message rather than "mobile invalid format". See `focusFieldsBeforeType`/`assertMobileValueAfterType` on `helpers/leadFormFiller.js`'s `LeadFormFiller` — both default `false`/`true` respectively (every other page's fields work fine with the forced clear/type and keep whatever was typed verbatim), and `BusListing.js` is the only page object that overrides them |
| UtilityPages: Tabbed Model Offers | `pages/UtilityPages/TabbedModelOffers.js`, `cypress/e2e/ui/UtilityPages/TabbedModelOffers.cy.js`, `testData/UtilityPages/TabbedModelOffersData.json` — IDs `TC-TMO-00` (redirection) + `TC-TMO-01..03`; **2 pages** (Select Your Truck, Offers) via `pageKey`, each built around a "Popular Models by Application/Category" tab strip (`button.tab-btn[title="<label>"]`) — clicking a tab swaps the model cards shown below it, each card's "Check Offers" opening the standard shared `CheckOffersLead` modal (no field quirks here, unlike Buses/Tyres — confirmed live). Per explicit user direction ("fill one lead form from each tab wherever we encounter this approach"), `TC-TMO-01` submits one real lead **per tab** (13 tabs on Select Your Truck, 10 on Offers) to prove every tab's CTA genuinely works, not just the default one; `TC-TMO-02/03` (validation-only, same modal regardless of which tab opened it) run once against the default tab. Tabs and CTA label are per-page in the test data (`selectTab`/`tabs` in the page object) rather than assumed. A same-test `cy.visit()` between tabs does **not** reset storage the way a fresh `it()` does — without `cy.clearCookies()`/`cy.clearLocalStorage()` before each subsequent tab's re-navigation, the previous tab's submitted name bled into the next tab's fresh page load (`testqatestqa`, confirmed live). A successful submission swaps the form into a "you may also be interested in" upsell screen with several interactive elements (alternative-truck cards, a "Receive similar offers" button) and no reliably distinguishable close control — one attempt at closing it accidentally navigated to an unrelated truck's PDP page, so the loop re-navigates fresh for the next tab instead of trying to close it in place. On the Offers page specifically, `LeadFormFiller`'s default `getFormRoot()` ancestor-walk resolves to a container spanning ~40 unrelated "Check Offers" buttons elsewhere on the page (the modal isn't portal-isolated there) rather than just the modal — fixed via a custom `formRootFinder: (filler) => filler.getNameInput().closest('[class*="max-w-"]')`, scoping tightly to the modal's own Tailwind `max-w-[...]` wrapper class regardless of where in the DOM it mounts. `en` only for now |
| UtilityPages: Tyres | `pages/UtilityPages/Tyres.js`, `cypress/e2e/ui/UtilityPages/Tyres.cy.js` — IDs `TC-TYR-00` (redirection) + `TC-TYR-01..03`; single page (`/en/tyres`), no page-level CTA — only repeated per-tyre-model card CTAs ("View \<current month\> Offer" ×7, derived at runtime by `helpers/tyresOfferCta.js` since the label rotates monthly on the live site — it broke going from August to September when it was still hardcoded), tested via a deterministic click on the first match (same directory-style pattern as the Bus brand pages), reusing the same `formRootFinder` scoping fix as `TabbedModelOffers` for the same non-portal-modal reason. **`TC-TYR-01` (positive submission) is a known, currently-failing live finding, not a test bug**: the site returns a real production error — "Sorry! right now we not able to submit your request" — even with a fully valid, correctly-filled form (name/mobile/city all client-side validated with checkmarks). Confirmed via direct native-DOM-click reproduction outside Cypress too, ruling out a Cypress-specific interaction issue. Left as-is rather than "fixed" by loosening the assertion, since the test is correctly catching real behavior; flag to the site's backend team, though it may also be session-based rate-limiting from repeated live testing rather than a permanent outage — re-verify independently before escalating |
| UtilityPages: Body Makers | `pages/UtilityPages/BodyMakers.js`, `cypress/e2e/ui/UtilityPages/BodyMakers.cy.js` — IDs `TC-BDM-00` (redirection) + `TC-BDM-01..03`; single page (`/en/body-makers`), no page-level CTA — only repeated per-dealer card CTAs ("Talk To Dealer" ×12), tested via a deterministic click on the first match. The modal here is a genuine bespoke variant, not reused via `LeadFormFiller`: same Name/Mobile/City selectors as `CheckOffersLead`, but with two extra **required** dropdowns (Brand, then Model — Model only populates real options after Brand is chosen, confirmed live; `fillFields({ model: 'auto' })` waits for that and picks whichever option ends up first) and a "Talk To Dealer" submit instead of "Check Offers". Confirmed live validation copy: "Please enter your name", "Please enter mobile no.", "Please select your location" (the first three match the standard `CheckOffersForm` copy exactly), plus "Please select a brand"/"Please select a model". **Unlike every other lead form in this project, a successful submission here closes the modal entirely and shows a top-right toast** ("Success" / "Your request has been submitted successfully") instead of an in-modal "Thank You!!!" heading — confirmed live via DOM inspection after the modal had already vanished. Same `formRootFinder`-style `[class*="max-w-"]` scoping as `Tyres`/`TabbedModelOffers` for the same non-portal-modal reason |
| UtilityPages: Content Pages | `pages/UtilityPages/ContentPage.js`, `cypress/e2e/ui/UtilityPages/ContentPages.cy.js`, `testData/UtilityPages/ContentPageData.json` — ID `TC-CNT-00` (redirection) only; **8 pages** via `pageKey`: Dealers, Service Center, Spare Parts, EMI Calculator, Brand And Tonnage, News, Videos, Web Story (`/web-stories`, no `/en/` prefix — confirmed 404 with it, 200 without). Live-audited (button/input scan per page, not assumed): none of these 8 has any lead-capture element at all — no "Check Offers"-style button, no name/mobile/city fields anywhere on the page, only the site-wide search box and the generic footer tel:/mailto: links present identically on every page across this whole project. A structurally different page type (calculator, dealer locator, article/video listings) from every other page automated so far — scope is redirection/load health only, per user direction, matching the baseline every other page object gets |

Two more distinct lead-form components were found across UsedTruck, beyond `CheckOffersLead`/`GetOffersLead`:

- **`GetInformationLead`** (`helpers/getInformationLeadFiller.js`) — on the three vehicle-tool pages (CV Permit, Vehicle Report, E Challan). It only appears after its page's vehicle-registration-number field is filled and the primary tool CTA is clicked (Check Permit Info / Check Vehicle Report / Check Challan) — **typing a complete, valid-format reg number can auto-open it with no click needed**, so `open*` methods check whether it's already open before clicking (a blind click on the now-vanished CTA was the first bug found here). Fields are matched by `name` attribute only (no `id`), phone is `type="number"`, and the third field is a required truck-brand autocomplete labelled "Choose Your Brand" (not "Brands\*" — that label belongs to a different page's wizard; don't reuse label text across components without checking each one). **It is OTP-gated**: submitting advances to a verification screen with an "Enter OTP" **floating label** (not a placeholder attribute) rather than completing the lead. There is no configured test OTP in this repo (`TJ_USER_OTP` in `cypress/.env.example` is an empty, unused placeholder), so the honest, achievable checkpoint is that OTP screen appearing — not full end-to-end completion. An initial `cy.intercept`/`cy.wait` network check was tried and dropped: the real request didn't match the assumed `**/api/**vehicle-permit**` pattern on every page, so it was less reliable than just asserting the OTP screen directly.
- **`GetSellerDetailsLead`** (a `LeadFormFiller` instance with `submitText: 'Get Seller Details'`, no separate helper file needed since `LeadFormFiller` already handles its optional price field via `fillPriceOrBudgetIfPresent`) — the real form behind "Contact Seller" on used-truck-listing pages (Buy Used Trucks, Vehicle Report). It shares `id="name"`/`id="phone"` with `CheckOffersLead`, which caused an initial false-positive ("same ids ⇒ assumed same component") that only surfaced as a failure once the submit button (real text "Get Seller Details", not "Check Offers") and confirmation heading (real text "Thank You For Contact", not "Thank You!!!") were exercised for real. Never assume two CTAs are the same component from matching input ids alone — check the submit button text and confirmation copy too.
| Tags / timeouts | `constants/constants.js` (`TEST_TAGS`, …) |
| Random mobile | `helpers/randomNumberGenerator.js` (+ `cy.randomNumberGenerator`) |
| Test case Description / Expected Result | `helpers/documentTestCase.js` (`documentTestCase`, `allureStep`) |
| Redirection / broken-link check (every spec's `TC-<PREFIX>-00`) | `helpers/verifyPageRedirections.js` (`registerRedirectionCheck`); Node task `checkLinkStatuses` in `cypress.config.js` |
| Base URL / Allure / scrollBehavior | `cypress.config.js`; secrets `cypress/.env` from `.env.example` |
| Terminal console output during a run | `cypress-terminal-report`: printer in `cypress.config.js` (`installLogsPrinter`), collector in `cypress/support/e2e.js` (`installLogsCollector`, scoped to `cons:log/info/warn/error`, `cy:log`, `cy:xhr`, `cy:request` — deliberately excludes `cy:fetch`/`cy:command`, which fire on every static asset/every command and drown out real output) |
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
npm run test:newListingPages
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
helpers/leadFormFiller.js               reusable name/mobile/city lead-form filler (CheckOffersLead, GetOffersLead, GetSellerDetailsLead)
helpers/getInformationLeadFiller.js     name/phone(name-attr)/brand filler for the OTP-gated GetInformationLead form
helpers/documentTestCase.js             Allure description + expected result + steps
helpers/verifyPageRedirections.js       TC-<PREFIX>-00 redirection/broken-link check (every spec)
helpers/deviceTags.js                   @desktop/@mobile tag from the current DEVICE run mode
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
| `ListingPages` (UI) | `NewListingPages` (Best/Popular/New/Upcoming/Latest/BS6 Trucks; lead form only for now) |
| `Compare` (UI) | `CompareTrucks` (Check Offers lead form only) |
| `Brochure` (UI) | `Brochure` (Download Brochure lead form only) |
| `UsedTruck` (UI) | `BuyUsedTrucks`, `CvPermit`, `VehicleReport`, `EChallan` — one spec per page (lead forms only); `SellUsedTrucks` — full multi-step wizard, driven for real up to its OTP gate |
| `CategoryPages` (UI) | `ElectricVehicle` (`/en/electric`; lead forms only — Check Truck Price + Call Now); `CategoryListing` (37 Wheelers/Fuel Type/GVW/Category/Brand/Truck Series pages via `pageKey`, split across 6 spec files by nav group; lead forms only) |
| `Buses` (UI) | `BusListing` (9 pages — New/Popular/Upcoming/Latest Buses + 5 bus brand pages via `pageKey`, all in one spec file; lead forms only) |
| `UtilityPages` (UI) | `TabbedModelOffers` (Select Your Truck + Offers, one lead per tab); `Tyres`, `BodyMakers` (single per-item-CTA pages, bespoke Brand/Model dropdowns on the latter); `ContentPage` (8 pages — Dealers/Service Center/Spare Parts/EMI Calculator/Brand And Tonnage/News/Videos/Web Story, redirection-only, no lead form on any of them) |

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
- **`CheckOffersForm.validation`** (`testData/HomePage/TruckInIndiaData.json`)
  — the required-field/invalid-mobile error copy for the shared
  `CheckOffersLead` modal used across most of the site — **only exists for
  `en`**. A quick, non-Cypress capture attempt found the `hi`/`ta` modal
  renders ambiguous text in the same DOM location (placeholder-looking
  strings, not confirmed error copy), so it was not trusted enough to record
  as real validation data. Any new negative/edge test asserting on
  `validation.*` messages must be scoped to `en` only (`if (lang === 'en')`
  around the `it()`, see `ElectricCommercialVehicles.cy.js`/
  `LatestModelsByCategory.cy.js`) until the real `hi`/`ta` copy is captured
  live with Cypress and confirmed, not guessed.

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

General priority order (golden rule 26) — always prefer the most specific,
stable selector available and never reach past it for a generic one:

1. A dedicated test attribute — `data-testid`, `data-cy`, `data-leadtype`, etc.
2. A unique, stable ID
3. A specific, unique, stable class
4. If the target itself has no reliable ID/class/attribute, locate it through
   a unique and stable parent/ancestor and then find the child from there
   (e.g. `cy.get('.offer-card').find('button').click();`) — the
   parent/ancestor must itself be specific and stable, never a generic tag
   like a bare `div` when a unique class/ID is available on it.
5. Text-based `.contains()` only as a last resort when no stable selector
   exists anywhere in the chain — and even then, always with an anchored
   exact-text regex (`exactText`), never a bare substring match on a generic
   tag (never `cy.get('button').contains('...').click()`).

This site specifically has no `data-cy`/`data-testid`/`data-leadtype`
attributes (tier 1 above is effectively unavailable here today — recheck
before assuming so on any newly-audited page), so in practice selectors on
this project land on tiers 2–5. Prefer, in order:

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

**Default to no scroll call at all, and only add one once a real, observed
failure proves it's needed.** Manually scrolling a small leaf element (e.g. an
autocomplete `<li>`) tends to align it flush against the viewport edge, which
is exactly where a sticky header/topbar sits — this can *create* "element is
being covered by" failures that plain, no-scroll interaction never had in the
first place. Confirmed live in `pages/UsedTruck/SellUsedTrucks.js`: removing
every `scrollIntoView()` call fixed a chain of sticky-header click failures
outright, because most fields never needed scrolling to begin with — the
`.parent().scrollIntoView()` calls added while chasing an earlier bug were
the actual cause of later ones. Where a control genuinely sits below the
fold after a step's content grows (confirmed via a real failure, not
assumed), prefer the smallest fix that clears it — e.g. a small fixed
`cy.window().then((win) => win.scrollBy(0, 10))` nudge — over a full
`scrollIntoView()` on the element or its parent.

React hydrates after load, so a click that lands too early is silently
discarded. For tab/filter controls, re-click until the UI reports the new state
instead of clicking once and asserting (see `TruckInIndia.openTab`).

React `<select>` values: use the native
`HTMLSelectElement.prototype.value` setter plus `input`/`change` events (see
`SearchRightTruck.setSelectValue`) — plain `option.selected = true` often does
not update React state.

---

## Redirection / broken-link health check

Every UI and SEO spec must open with a passive link-health check, registered
via `helpers/verifyPageRedirections.js`:

```js
const { registerRedirectionCheck } = require('../../../../helpers/verifyPageRedirections');

// inside the describe block, right after beforeEach()/before() — before any
// other it():
registerRedirectionCheck({
  prefix: 'PTB',                              // this section's TC prefix
  lang,
  tags: langTags(lang, TEST_TAGS.REDIRECTION),
  label: 'Homepage - Popular Truck Brands',
});
```

This registers as `TC-<PREFIX>-00` — it runs **first**, before `TC-<PREFIX>-01`,
without renumbering any existing test (IDs stay append-only, per the golden
rules above).

**What it checks:** every `<a href>` on the page under test once it has
loaded — absolute `https`/`http` links, relative internal links, and
client-side-routed links (React/Next `Link` still renders a real `href`, so
internal JS navigation is covered without needing to click anything).
`mailto:`, `tel:`, `javascript:`, and pure `#` fragments are skipped.

**How it checks:** each unique URL is sent to the `checkLinkStatuses` Node
task (`cypress.config.js`), which uses native `fetch` with
`redirect: 'manual'` so a 301/302/307/308 is seen as its real status code
instead of being silently followed.

**Pass/fail behaviour — this is a monitor, not an assertion:**

- `200` and `30x` → healthy, logged only.
- `404` / `500` (or any other status, or a network error) → logged to the
  console/task log and attached to the Allure report as "Broken links
  (404/500)", but the test **always passes**. A third-party link going stale
  must never fail a UI/SEO spec that isn't testing that link directly.

Do not add `expect`/`should` assertions to this check or otherwise make it
fail the build — if you need a hard assertion on a specific link (e.g. "View
All must go to /en/brands"), that belongs in the section's own page-object
method and its own `TC-<PREFIX>-nn`, not in this shared health check.

---

## Device emulation (desktop vs. mobile)

This site branches on `navigator.userAgent` and/or the request's UA header,
not only on viewport size — resizing the viewport alone does not reliably
trigger mobile-specific behaviour. Mobile coverage therefore uses a **real
Android Chrome user agent**, set together with a matching viewport, rather
than a viewport-only resize.

**How it works:**

- `constants/constants.js` → `DEVICES.desktop` / `DEVICES.mobile` defines the
  real UA string (a current Pixel-class Android Chrome UA) and matching
  viewport (412×915) for mobile; desktop leaves the browser's real UA and
  viewport untouched.
- `cypress.config.js` reads the `DEVICE` env var (`desktop` by default) at
  config-load time and sets `userAgent` + `viewportWidth`/`viewportHeight`
  from `DEVICES[DEVICE]` — this is Cypress's own CDP-backed `userAgent`
  config, so it changes both `navigator.userAgent` **and** the real outgoing
  request headers (important for any server-side/SSR device branching, not
  just client-side checks). The same UA is also passed as a `--user-agent`
  Chrome launch flag as a belt-and-suspenders measure. `config.env.device` is
  set so specs can read `Cypress.env('device')`.
- `helpers/deviceTags.js` exports `deviceTag()`, which resolves to
  `TEST_TAGS.MOBILE`/`TEST_TAGS.DESKTOP` from `Cypress.env('device')`. Every
  spec's `langTags`-style helper spreads it in, so tests are labelled with
  the device they actually ran under (`grepTags=@mobile` / `@desktop`), and
  Allure results record which mode a run used.

**Running mobile vs. desktop:**

```bash
npm run cypress:run:desktop                      # explicit desktop (default)
npm run cypress:run:mobile                       # real Android UA + viewport
npm run test:newListingPages:mobile               # one section, mobile mode
DEVICE=mobile npm run test:truckInIndia           # any script, mobile mode (bash)
cross-env DEVICE=mobile npm run test:truckInIndia # any script, mobile mode (cross-platform)
```

`cross-env` (devDependency) is required for `DEVICE=...` to work identically
on Windows and POSIX shells — do not inline `VAR=value` before an npm script
without it, since that syntax silently fails on `cmd.exe`.

New specs must call `deviceTag()` in their tag helper from the start (golden
rule 14); do not add mobile-only test *content* unless asked — the same test
bodies simply run under a different device.

---

## Test case naming and tags

Each `it` starts with a stable test-case ID: `TC-<FEATURE>-<NN>`, then a
behaviour description suitable for Allure / Jira. `TC-<FEATURE>-00` is
reserved across every spec for the redirection/broken-link health check (see
above) and always runs first; feature test cases start at `-01`.

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
| New Listing Pages | `TC-NLP-nn` | `ui/ListingPages/NewListingPages.cy.js` |
| Compare Trucks | `TC-CT-nn` | `ui/Compare/CompareTrucks.cy.js` |
| Brochure | `TC-BR-nn` (00 redirection, 01 static CTA, 02–04 Popular/Upcoming/Latest tabs) | `ui/Brochure/Brochure.cy.js` |
| UsedTruck: Buy Used Trucks | `TC-BUT-nn` | `ui/UsedTruck/BuyUsedTrucks.cy.js` |
| UsedTruck: CV Permit | `TC-CVP-nn` | `ui/UsedTruck/CvPermit.cy.js` |
| UsedTruck: Vehicle Report | `TC-VHR-nn` | `ui/UsedTruck/VehicleReport.cy.js` |
| UsedTruck: E Challan | `TC-ECH-nn` | `ui/UsedTruck/EChallan.cy.js` |
| UsedTruck: Sell Used Trucks | `TC-SUT-nn` | `ui/UsedTruck/SellUsedTrucks.cy.js` |
| CategoryPages: Electric Vehicle | `TC-EV-nn` | `ui/CategoryPages/ElectricVehicle.cy.js` |
| CategoryPages: Category Listing (28 pages, 4 spec files) | `TC-CL-nn` | `ui/CategoryPages/CategoryListingCategory.cy.js`, `CategoryListingWheelers.cy.js`, `CategoryListingFuelType.cy.js`, `CategoryListingGvw.cy.js` |
| CategoryPages: Truck Brands (4 pages) | `TC-TBR-nn` | `ui/CategoryPages/CategoryListingBrands.cy.js` |
| CategoryPages: Truck Series (5 pages) | `TC-TSR-nn` | `ui/CategoryPages/CategoryListingTruckSeries.cy.js` |
| Buses: Bus Listing (9 pages) | `TC-BUS-nn` | `ui/Buses/BusListing.cy.js` |
| UtilityPages: Tabbed Model Offers (Select Your Truck, Offers) | `TC-TMO-nn` | `ui/UtilityPages/TabbedModelOffers.cy.js` |
| UtilityPages: Tyres | `TC-TYR-nn` | `ui/UtilityPages/Tyres.cy.js` |
| UtilityPages: Body Makers | `TC-BDM-nn` | `ui/UtilityPages/BodyMakers.cy.js` |
| UtilityPages: Content Pages (8 pages, redirection-only) | `TC-CNT-00` | `ui/UtilityPages/ContentPages.cy.js` |

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
breaks traceability. The `TC-<PREFIX>-00` redirection check carries
`TEST_TAGS.REDIRECTION` (`@redirection`) instead of a positive/negative/edge
category tag, since it is a passive health signal, not a behaviour assertion.

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
