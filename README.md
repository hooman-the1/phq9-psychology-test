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

## Completed assessments

Successful submissions are stored in this browser's `localStorage` under
`phq9.assessments` as a version 1 JSON envelope. Each record keeps the nine
answers, score, severity, UTC submission time, and a snapshot of the displayed
result. The `Phq9AssessmentStorage.read()` method returns saved records for the
future history view. Data stays in the same browser profile and is not sent to a
server or synchronized across devices.

If storage cannot be read or written, the result remains visible for the current
page session and the app shows an unsaved notice. The storage service returns an
explicit failure to callers. It does not overwrite existing data it cannot
safely read. See `_docs/phq9-assessment-schema.md` for the v1 data contract;
detailed recovery from malformed or older data is tracked in issue #17.
