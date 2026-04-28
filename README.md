# AI-Powered Self-Healing Playwright Framework

An AI-powered test automation framework that uses **Playwright** for browser testing and **Ollama** (local LLM) to automatically generate and self-heal failing tests.

---

## How It Works

1. **Crawl** — Scans the web app and discovers all sections/pages
2. **Generate** — Uses an LLM to write Playwright test scripts from the crawl data
3. **Run** — Executes the tests via Playwright
4. **Self-Heal** — If a test fails, the LLM analyzes the error and patches the test automatically (up to 3 retries)

---

## Prerequisites

### 1. Node.js
Download from [nodejs.org](https://nodejs.org) (v18 or higher recommended).

### 2. Ollama (Local LLM)
Download and install from [ollama.com](https://ollama.com).

After installing, pull the required model:
```bash
ollama pull qwen2.5-coder
```

Start the Ollama server (must be running before executing AI features):
```bash
ollama serve
```

> Ollama runs locally on `http://localhost:11434` — no API key or internet connection needed.

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/harshvardhanaiv/Automation_Test.git
cd Automation_Test
```

### 2. Install dependencies
```bash
npm install
```

### 3. Install Playwright browsers
```bash
npx playwright install
```

### 4. Configure the project

Open `ai/config.js` and update:

```js
baseUrl: 'https://your-app-url.com/',
credentials: {
    username: 'your-username',
    password: 'your-password',
},
model: 'qwen2.5-coder',
```

---

## Running Tests

### Run all daily tests
```bash
npm run daily
```

### Run all daily tests (specific browser)
```bash
npm run daily:chromium
npm run daily:chrome
npm run daily:edge
npm run daily:mobile
```

### Run individual daily suites
```bash
npm run daily:login
npm run daily:viz
npm run daily:reports
npm run daily:merge-reports
npm run daily:shared-resources
npm run daily:quick-run
npm run daily:masterdata
npm run daily:request
npm run daily:administration
npm run daily:api-token
npm run daily:dynamic-message
npm run daily:annotations
npm run daily:bursting-group
npm run daily:themes
npm run daily:viz-widgets
npm run daily:widget-settings
npm run daily:viz-widgets-extended
```

### Run with custom workers / reporter
```bash
npm run daily:viz-widgets-extended -- --workers=4 --reporter=html
```

### Run with AI self-healing
```bash
npm run daily:heal
npm run daily:heal:fast        # 10 parallel workers
npm run daily:heal:file        # heal a specific file
npm run daily:heal:dry         # dry run (no patches applied)
```

### Explore mode (crawl → generate → test → self-heal)
```bash
npm run explore
npm run explore:skip-crawl     # reuse existing crawl-result.json
npm run explore:skip-generate  # reuse existing explore.spec.ts
```

### Generate a test from a prompt
```bash
node ai/runner.js "Test that the user can log in and see the dashboard"
```

---

## Daily Test Suites

| # | File | Coverage |
|---|------|----------|
| 01 | `01-login.spec.ts` | Login, session, invalid credentials |
| 02 | `02-viz.spec.ts` | Viz list, create, delete, search, context menu |
| 03 | `03-reports.spec.ts` | Reports list, scheduler, run |
| 04 | `04-merge-reports.spec.ts` | Merge reports CRUD |
| 05 | `05-shared-resources.spec.ts` | Shared resources grid |
| 06 | `06-quick-run.spec.ts` | Quick run dialog |
| 07 | `07-masterdata.spec.ts` | Datasource, datasets, parameters |
| 08 | `08-request.spec.ts` | Notifications, requests, alerts |
| 09 | `09-administration.spec.ts` | Users, roles, departments, email users |
| 10 | `10-api-token.spec.ts` | API token create / revoke |
| 11 | `11-dynamic-message.spec.ts` | Dynamic messages CRUD |
| 12 | `12-annotations.spec.ts` | Annotations grid |
| 13 | `13-report-bursting-group-report.spec.ts` | Report bursting, group reports |
| 14 | `14-themes.spec.ts` | Theme create, edit, canvas/widget settings |
| 15 | `15-viz-widgets.spec.ts` | Viz editor, widget sidebar, Charts, Card, Pie, Line |
| 16 | `16-widget-settings.spec.ts` | Widget properties panel |
| 17 | `17-viz-widgets-extended.spec.ts` | Table, Filter, Custom Visualization, Image & Text widgets |

### 17 — Viz Widgets Extended (`17-viz-widgets-extended.spec.ts`)

Covers creation and configuration of four widget types inside the Viz editor:

**Table widget**
- Add widget → open Edit panel → select `automation_testing` dataset → click **Select All** to add all columns → save

**Filter widget**
- Add widget → open Edit panel → click **Add** button to create a filter row → save

**Custom Visualization widget**
- Add widget → switch to **Datasets** tab → select `automation_testing` from the dataset dropdown
- Write **HTML**: `<div id="chart-container"></div>`
- Write **JS** with dataset link: `const data = {{dataset::automation_testing}};`
- Write **CSS**: `#chart-container { width: 100%; height: 100%; }`
- Save

**Image & Text widget**
- Add widget → Quill editor opens inline (no separate Edit button)
- Enter text via `quill-editor` paragraph → `.ql-editor.ql-blank` fill
- Apply font size: select all → Normal → Huge / Large via Quill toolbar buttons
- Insert hyperlink: select word → **Insert Link** → fill URL → `.ql-action` confirm
- Insert image: search textbox → fill `'logo'` → pick `AIVLogo.png`

**Combined test** — adds all four widgets to a single viz and saves

---

## Project Structure

```
├── ai/
│   ├── config.js                        # Central config (URL, credentials, model)
│   ├── crawl.js                         # Crawls the app to discover sections
│   ├── generateFromCrawl.js             # Generates tests from crawl data
│   ├── generateTest.js                  # Generates a test from a text prompt
│   ├── fixTest.js                       # Self-heals failing tests using Ollama
│   ├── runner.js                        # Main AI runner loop
│   ├── daily-runner.js                  # Self-healing runner for daily suite
│   ├── explore-runner.js                # Full explore pipeline
│   ├── users-roles-runner.js
│   ├── api-token-runner.js
│   ├── reports-runner.js
│   └── merge-reports-runner.js
├── tests/
│   ├── helpers.ts                       # Shared helpers (login, goTo, shot, etc.)
│   ├── daily/
│   │   ├── 01-login.spec.ts
│   │   ├── 02-viz.spec.ts
│   │   ├── 03-reports.spec.ts
│   │   ├── 04-merge-reports.spec.ts
│   │   ├── 05-shared-resources.spec.ts
│   │   ├── 06-quick-run.spec.ts
│   │   ├── 07-masterdata.spec.ts
│   │   ├── 08-request.spec.ts
│   │   ├── 09-administration.spec.ts
│   │   ├── 10-api-token.spec.ts
│   │   ├── 11-dynamic-message.spec.ts
│   │   ├── 12-annotations.spec.ts
│   │   ├── 13-report-bursting-group-report.spec.ts
│   │   ├── 14-themes.spec.ts
│   │   ├── 15-viz-widgets.spec.ts
│   │   ├── 16-widget-settings.spec.ts
│   │   └── 17-viz-widgets-extended.spec.ts
│   ├── users-roles.spec.ts
│   ├── api-token.spec.ts
│   ├── reports.spec.ts
│   ├── merge-reports.spec.ts
│   └── explore.spec.ts
├── docs/                                # Feature documentation for test generation
├── screenshots/                         # Test screenshots (gitignored)
├── playwright.config.ts
└── package.json
```

---

## Requirements

| Requirement | Version / Notes |
|-------------|-----------------|
| Node.js | v18+ |
| Playwright | Installed via `npm install` |
| Ollama | Latest — [ollama.com](https://ollama.com) |
| LLM Model | `qwen2.5-coder` (pull via Ollama) |

---

## Notes

- `node_modules/`, `test-results/`, `screenshots/`, and `.auth/` are excluded via `.gitignore`.
- `.auth/` stores Playwright session state — never commit this as it contains login credentials.
- Self-healing creates a `.bak` backup of the original test file before applying patches.
- Pass extra Playwright flags after `--` when using `npm run`: `npm run daily -- --workers=4 --reporter=html`
