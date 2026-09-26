# PHQ-9

Minimal standalone Angular shell for the PHQ-9 application.

## Local development

Install dependencies, run the deterministic headless test suite, and create a production build from the repository root:

```powershell
npm install
npm run test:headless
npm run build
```

The headless test script uses a no-GPU Chrome launcher for reliable execution in CI and restricted desktop environments. Run the development server with `npm start`.
