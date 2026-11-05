> この文書はV3段階の設計記録です。現行UIと実装範囲は[技術仕様書V4](technical-specification-v4.md)を参照してください。

# V3 draft architecture and decisions

## Approved scope

Japanese Next.js + TypeScript UI, four connected learning surfaces plus settings, fixed demo data, future Tutor adapter seam. Authentication, database, live AI and asynchronous analytics remain deferred. Deliver as a feature branch and Draft PR against `main`; no merge or hosting deployment.

## Data boundaries

One browser-level `DemoState` (version 1) owns messages, attempts, saved canonical topic IDs, preferences, dismissed suggestions and a sample-insight correction. `DemoProvider` loads and validates stored records after hydration, then persists changes. Invalid/incompatible records reset to defaults; unavailable/full storage produces a visible notice. This is a single-browser prototype, without cross-tab conflict handling, import, database ownership, or production retention guarantees.

The 6 manually authored topics share canonical IDs across Tree, Graph, Board, exercise attempts and saved-topic links. Classification is a category projection; conceptual relations are separate directed objects with explanations. No AI generation or validation status is fabricated.

A fixed exercise is selected by topic. Each submitted answer receives a separate UUID and timestamp. Retry preserves the old record. Hints and solution reveal are separate controls. Fixed root/slope checks accept only documented limited formats and return inconclusive for unsupported text. They do not inspect reasoning. Proofs are recorded without grading. Aggregation excludes inconclusive attempts and attempts submitted after solution reveal from the assessed denominator. Hint use makes no claim about ability.

The Tutor gateway accepts arbitrary text without a domain allowlist. Fixed examples/definitions are available; all other questions receive an explicit unconnected-demo response. User text remains text. Board math is manually authored and rendered through bounded KaTeX with trust disabled. There is no arbitrary model HTML renderer.

Progress starts empty and shows actual browser exercise records. The narrative insight preview and its excerpts are explicitly fictional and never claimed to describe the learner. The learner's correction is shown as a self-report, replacing no real inference. Four fixed recommendations demonstrate reinforcement, extension, connection and challenge; dismissal persists and never locks another route.

## V3 traceability

| V3 requirement              | Draft implementation / limit                                                   |
| --------------------------- | ------------------------------------------------------------------------------ |
| PR-03 / PR-04 autonomy      | All surfaces freely reachable; suggestions optional                            |
| 6.3–6.5 unified map         | Shared IDs; independent categories and typed directed relations                |
| 7 Board + explanation       | Fixed concept, formula, example, optional question; explicit detail preference |
| EX-05 / EX-08 / EX-09       | Staged hints, separate reveal, preserved retries and linked attempts           |
| 9.4 observed vs interpreted | Real attempt facts separated from fictional inference preview                  |
| 9.5 evidence                | Raw attempts open inline; preview has clearly fictional excerpts               |
| 9.8 controls                | Opt-in preference placeholders; sample correction; local deletion              |
| 10 four optional next steps | Fixed labeled suggestions; persistent dismissal                                |
| 11 explicit UI override     | Compact/detailed Board setting; Tree/Graph preference                          |
| 17.2 untrusted content      | React text rendering, KaTeX trust disabled; no generated code execution        |
| T-18 user isolation         | Not implemented; no accounts or backend exist in draft                         |
| T-20 portability/deletion   | Local JSON export and reset, verified in browser tests                         |

## Before live AI

These decisions remain for the owner, rather than being silently fixed by this draft:

1. Model provider, model and usage budget. The `TutorGateway` logical contract must move behind a server-only provider adapter with authentication, scoped context, bounded requests, timeouts, abuse/rate controls and schema-validated outputs.
2. Authentication and primary database. Add server-authorized ownership, migrations, retention and deletion propagation, privacy controls and cross-user isolation tests before any private cloud data is stored.
3. Board schema and scoped mathematical validation. Add validated structured outputs, safe streaming, uncertainty notices and independent checks. Do not label an AI-generated proof verified.
4. Queue/worker service for Organizer and Progress. Add minimal event contracts, idempotent jobs, provenance, evidence authorization, opt-in checks and user-correctable insights; do not block foreground Tutor.
5. Hosting and production controls. Review environment secrets, CSP/security headers, dependency scanning, accessibility, data privacy and measured budget/latency limits before public rollout.

No provider endpoint or production key setting is included because turning on a key alone would bypass these required boundaries. Adding a provider does not require rewriting the navigation, shared topic identity, or presentation layer.

## Validation

Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`. The browser suite covers shared map identity, cross-surface handoff, proof uncertainty, hints, retries, local persistence, text injection, user display override, export, deletion, dismissal and horizontal overflow at desktop/mobile widths. It is Chromium with desktop/touch viewport configurations, not an assertion of Safari compatibility. GitHub Actions repeats these checks. CI status must be read separately after PR creation.
