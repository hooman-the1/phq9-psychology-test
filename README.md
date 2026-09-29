# PHQ-9

Minimal standalone Angular shell for the PHQ-9 application.

## Local development

Install dependencies, run the deterministic headless test suite, and create a production build from the repository root:

```powershell
npm install
npm run check:boundary
npm run test:boundary
npm run test:headless
npm run build
```

`check:boundary` verifies that production source and Angular build/test inputs
do not reference the original application, parent-directory imports, undeclared
packages, or Git submodules. `test:boundary` verifies the check itself against
the current repository and a temporary prohibited-reference fixture; the
fixture is removed automatically and is never part of the repository.

The headless test script uses a no-GPU Chrome launcher for reliable execution in CI and restricted desktop environments. Run the development server with `npm start`.

## Static deployment

Run `npm run build`, then serve the files in `dist/phq9/browser` at the web
server root (`/`). This is a static deployment: no backend, API, CDN, or
server-side application runtime is required. The production document uses
`<base href="/">`, so its scripts, stylesheet, favicon, and local fonts load
from that root.

The app uses Angular's history-based routing. Configure the static server to
serve an existing file normally and return `index.html` for a request to a
client-side route. Currently the only application route is `/`, which opens
the PHQ-9 screen. A direct load or refresh of `/` must return `index.html`;
the same fallback rule will support direct loads and refreshes if client-side
routes are added later.

## Completed assessments

Successful submissions are stored in this browser's `localStorage` under
`phq9.assessments` as a version 1 JSON envelope. Each record keeps the nine
answers, score, severity, UTC submission time, and a snapshot of the displayed
result. The history action on the questionnaire and result opens a local list
of saved assessments, newest first, with their submission time, score, and saved
severity. Returning to the assessment preserves the current page state. The
`Phq9AssessmentStorage.read()` method supplies the list. A partially corrupt
v1 envelope returns valid records in stored order with a partial-data status;
invalid and duplicate records are skipped.
Invalid envelopes, unsupported versions, and storage read failures return distinct
failures. Reads never rewrite stored data, and saving refuses to overwrite data
that could not be fully read. Data stays in the same browser profile and is not sent
to a server or synchronized across devices.

If storage cannot be read or written, the result remains visible for the current
page session and the app shows an unsaved notice. The storage service returns an
explicit failure to callers. It does not overwrite existing data it cannot
safely read. A notice on opening the app explains when history could not be fully
loaded, and a failed submission shows an unsaved notice. See
`_docs/phq9-assessment-schema.md` for the v1 data contract.
