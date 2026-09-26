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
