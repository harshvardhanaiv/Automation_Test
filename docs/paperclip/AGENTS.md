# AGENTS.md — Automation Test Agent Instructions

This file defines the behavior, responsibilities, and constraints for all agents
running inside the **Automation Test** workspace on Paperclip (GStack).

---

## Purpose

These agents are responsible for planning, executing, and reviewing automated
test activities for the AIV (Analytics Intelligence Visualization) application.
Each agent has a specific role in the QA pipeline and must operate within its
defined scope.

---

## Agent Roles

### QA Engineer
- Primary owner of test case design and execution.
- Reviews Playwright test results and triages failures.
- Decides when a failing test needs a code fix vs. a product bug report.
- Escalates critical failures to the Release Engineer.

### Release Engineer
- Owns the release pipeline and deployment gates.
- Blocks releases if daily test suite pass rate drops below 90%.
- Coordinates with QA Engineer on hotfix test coverage.
- Approves merges to main after all daily tests pass.

### CTO
- Sets overall quality standards and testing strategy.
- Reviews test coverage reports weekly.
- Approves changes to the self-healing AI configuration (model, retries, prompts).

### CEO
- Receives high-level quality dashboards only.
- Notified on critical production failures.
- Does not interact with test code directly.

### Staff Engineer
- Maintains the Playwright framework and AI self-healing pipeline.
- Owns `playwright.config.ts`, `ai/config.js`, `ai/systemPrompt.js`.
- Reviews and merges changes to `tests/helpers.ts`.
- Responsible for adding new daily spec files when new features ship.

---

## Workflow

```
New Feature Shipped
      ↓
Staff Engineer adds spec file (tests/daily/NN-feature.spec.ts)
      ↓
QA Engineer reviews test cases and approves
      ↓
Daily runner executes: npm run daily:heal
      ↓
Self-healing patches failures (up to 3 retries via Ollama)
      ↓
Pass → Release Engineer approves release gate
Fail → QA Engineer triages → Staff Engineer fixes → re-run
      ↓
CEO receives weekly quality summary
```

---

## Constraints

- Agents must NOT modify production data or credentials.
- Agents must NOT commit directly to `main` — always use a branch + PR.
- Agents must NOT disable self-healing retries without CTO approval.
- All test screenshots go to `screenshots/` — never commit this folder.
- `.auth/session.json` must never be committed — it contains live credentials.

---

## Key Files

| File | Owner | Purpose |
|------|-------|---------|
| `playwright.config.ts` | Staff Engineer | Browser, timeout, reporter config |
| `ai/config.js` | Staff Engineer | App URL, credentials, Ollama model |
| `ai/systemPrompt.js` | Staff Engineer | LLM prompt — update when app changes |
| `tests/helpers.ts` | Staff Engineer | Shared login, navigation, grid helpers |
| `tests/daily/` | QA Engineer | Daily regression specs (18 suites) |
| `ai/daily-runner.js` | Staff Engineer | Self-healing runner for daily suite |
| `docs/` | QA Engineer | Feature documentation for test generation |

---

## Communication Protocol

- Use **Issues** in Paperclip for bug reports from test failures.
- Use **Routines** for recurring daily test run summaries.
- Tag the relevant agent role when creating an issue.
- Include: test file name, test title, error message, screenshot path.

---

## Environment

- **App URL**: `https://aiv.test.oneaiv.com:8086/aiv/`
- **Test runner**: Playwright v1.43.0
- **AI model**: `qwen2.5-coder` via Ollama (local, `http://localhost:11434`)
- **Max self-heal retries**: 3
- **Browsers**: Chromium, Chrome, Edge, Mobile Chrome
