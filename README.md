# Truck Junction Web Automation

Cypress UI automation for [trucks.tractorjunction.com](https://trucks.tractorjunction.com/),
a new/used commercial-truck marketplace. Conventions and the locator workflow are
documented in [AGENTS.md](./AGENTS.md).

## Prerequisites

- Node.js >= 18, npm >= 9
- Java on PATH (only for generating the Allure HTML report)

## Installation

```bash
npm install
cp cypress/.env.example cypress/.env   # optional: override base URL / add secrets
```

## Usage

```bash
npm run cypress:open              # interactive runner
npm test                          # every spec

npm run test:searchRightTruck     # single feature
npm run test:truckInIndia
npm run test:truckInIndia:positive

npm run test:en                   # one language
npm run test:language             # all languages
npm run cypress:run:tags --tags=@en+@smoke
```

Reporting and cleanup:

```bash
npm run allure:report             # generate + open Allure
npm run clean                     # drop results, screenshots, videos, artifacts
```

Capture live DOM before writing selectors (see AGENTS.md for all flags):

```bash
npm run capture:dom -- --contains "Truck in India" --out artifacts/tiy.html
```

## Structure

```
cypress/e2e/ui/Homepage/     specs, grouped by page section
pages/Homepage/              page objects (locators + actions)
testData/HomePage/           localized copy, slugs, expected URLs
constants/constants.js       test tags, timeouts, viewports
scripts/capture-dom.js       Playwright DOM capture helper
cypress/support/e2e.js       Allure + grep registration, app error filter
cypress.config.js            baseUrl, Allure, timeouts, scroll behaviour
```

## Coverage

| Feature | Prefix | Spec |
| --- | --- | --- |
| Search The Right Truck | `TC-SRT-nn` | `SearchRightTruck.cy.js` |
| Truck in India {year} | `TC-TIY-nn` | `TruckInIndia.cy.js` |

Each spec runs positive, negative and edge cases, tagged for selective
execution (`@positive`, `@negative`, `@edge`, `@smoke`, `@en`/`@hi`/`@ta`).

## Notes on testing a third-party site

- No `data-cy`/`data-testid` attributes exist, so locators use `title`, `href`,
  `placeholder`, option slugs and exact visible text.
- The site is client-rendered; capture the real DOM with Playwright rather than
  guessing selectors, and expect React hydration to swallow very early clicks.
- Cypress auto-scroll is disabled; page objects scroll explicitly with a sticky
  header offset.

## License

MIT
