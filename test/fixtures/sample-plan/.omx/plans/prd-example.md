# Example Plan

## Requirements Summary
Build a local research document manager with searchable markdown imports and exportable research notes.

## ADR
Decision: Use Next.js, TypeScript, SQLite, and Playwright.
Rejected: Electron | unnecessary desktop complexity for v1.

## Acceptance Criteria
- Users can import markdown files.
- Users can search title and body.
- Users can export selected notes as markdown.

## Implementation Steps
- Scaffold Next.js with TypeScript.
- Add SQLite persistence.
- Add import, search, and export flows.

## Verification Steps
- Run lint and typecheck.
- Run unit tests for import/search.
- Run Playwright smoke tests for the main flow.
