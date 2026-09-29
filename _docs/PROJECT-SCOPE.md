# PHQ-9 Standalone Angular Project

## 1. Project goal

Create a standalone, offline Angular application for completing the PHQ-9 depression screening questionnaire.

The application is extracted from the original `yekravankav` Angular project. The standalone repository must be usable by developers who have no access to the original repository.

The final application must run independently, without importing code from the original repository and without requiring a backend, login, API, or external service.

## 2. Product scope

The application must:

- Present the existing PHQ-9 questionnaire.
- Preserve the existing questions, answer choices, scoring thresholds, severity categories, recommendations, visual design, RTL behavior, and language support.
- Use the existing PHQ-9 feature as the behavioral and visual reference.
- Start at a simple root URL such as `/`.
- Work fully offline after dependencies have been installed.
- Persist completed assessments locally in the browser.
- Allow a user to start a new assessment.
- Allow a user to view previously completed assessments.
- Display previous assessments as read-only records.
- Allow deletion of individual saved assessments.
- Allow clearing all saved assessment history.
- Display scores and interpretations on screen.
- Include no export or print feature.
- Include automated tests for the PHQ-9 behavior.
- Produce a static Angular build deployable to any static web server.

The five severity-category recommendations in the copied PHQ-9 reference are the complete intended result messaging. No separate warning or question-9-specific warning is required. See issues #12 and #38 for the reference behavior and product decision.

## 3. Explicit non-goals

The final application must not include:

- User registration or login.
- Authentication or authorization.
- Backend communication.
- HTTP calls for saving, starting, or updating an assessment.
- Database or server-side persistence.
- Cross-device synchronization.
- Analytics, telemetry, tracking, or third-party runtime services.
- CDN-hosted runtime assets.
- Unrelated psychology tests.
- The original application's user area, dashboard, navigation, or business features.
- Export, download, email, or print functionality.

## 4. Source material currently copied

The copied extraction currently contains:

```text
src/app/user/tests/phq9/
src/app/share/
src/app/ui-share/
src/assets/images/user/phq-9-img.jpeg
src/assets/fonts/
src/styles.scss
src/themes.scss
src/index.html
src/main.ts
src/favicon.png
src/environments/
angular.json
package.json
package-lock.json
tsconfig.json
tsconfig.app.json
tsconfig.spec.json
```

The `share` and `ui-share` folders were copied only because the current PHQ-9 module imports them. They are extraction scaffolding, not final product scope. The team must reduce or replace them with only the local functionality actually required by PHQ-9.

## 5. Current PHQ-9 feature files

The primary feature is located at:

```text
src/app/user/tests/phq9/
```

It currently contains:

- `phq9.component.ts`
- `phq9.component.html`
- `phq9.component.scss`
- `phq9.constants.ts`
- `phq9.helpers.ts`
- `phq9.module.ts`
- `phq9-routing.module.ts`

These files are the starting reference. Preserve their intended behavior and structure where possible, but adapt imports and implementation as required for offline independence.

## 6. Important current-state issues

Before considering the project complete, the team must address these issues:

### 6.1 Backend dependencies

The current component imports `HttpClient`, `SessionID`, and an environment configuration, and sends POST/PATCH requests. These calls must be removed or replaced with local browser persistence.

The final application must not require `HttpClient` for assessment operation, a session ID service, an API base URL, or any server endpoint.

### 6.2 Shared module dependencies

The current PHQ-9 module imports:

```text
src/app/share/share.module.ts
src/app/ui-share/ui-share.module.ts
```

These modules contain unrelated application functionality. Replace them with minimal local modules, standalone imports, or local utilities containing only what PHQ-9 needs, such as:

- Angular reactive forms.
- Angular Material card, divider, button, radio, and progress-bar components.
- The gauge component or an approved local replacement.
- The Persian-number pipe.
- Required local styles.

### 6.3 Local persistence

Define a versioned local-storage schema for assessment history. A saved record should contain, at minimum:

- A unique local record ID.
- Creation/submission timestamp.
- The submitted answers.
- Total score.
- Severity category.
- Displayed recommendation/result data required for read-only viewing.

Handle missing, malformed, or older local-storage data without crashing the application.

### 6.4 Persian and Unicode integrity

All Persian text, RTL content, punctuation, and emoji must remain valid UTF-8 and must not become mojibake.

Review the copied constants and templates carefully. If text is already corrupted, restore the intended Persian wording using an encoding-safe edit and verify it visually in the browser.

### 6.5 Static deployment and routing

The application must work when served as a static build. Configure the root route and deployment behavior appropriately. If history-based routing is used, document the required server fallback; otherwise use a deployment-safe routing strategy.

## 7. Required architecture

Use a small standalone Angular application with clear local boundaries:

```text
src/
├─ app/
│  ├─ phq9/
│  │  ├─ components/
│  │  ├─ services/
│  │  ├─ models/
│  │  └─ ...
│  ├─ app.component.*
│  └─ app.routes.ts or app-routing.module.ts
├─ assets/
└─ styles.scss
```

The team may preserve the copied PHQ-9 folder structure if that is safer, but all production imports must resolve within this repository.

Do not reference the original repository using absolute paths, parent-directory imports, Git submodules, workspace aliases, or shared packages that are not included in this repository.

## 8. Backlog-ready work breakdown

### Epic A — Establish the standalone Angular shell

- Create or confirm the standalone Angular workspace.
- Set the application name and package metadata to `phq9`.
- Configure the root route to display the PHQ-9 experience.
- Remove unrelated routes, modules, components, and providers.
- Confirm `npm install`, `ng serve`, `ng build`, and the test command work from this repository alone.

### Epic B — Extract and isolate PHQ-9

- Move or retain the PHQ-9 source files in a local feature boundary.
- Replace imports pointing to the original application structure.
- Identify every template, style, pipe, module, and package dependency used by PHQ-9.
- Remove unused copied files and dependencies after successful isolation.
- Confirm no source file references `yekravankav` or paths outside this repository.

### Epic C — Implement offline assessment flow

- Remove backend POST/PATCH calls.
- Remove session ID and environment API dependencies.
- Preserve question navigation and validation behavior.
- Preserve score calculation and severity thresholds.
- Preserve result display and restart behavior.
- Add local persistence for submitted assessments.

### Epic D — Implement assessment history

- Add a history view for saved assessments.
- Add read-only detail viewing.
- Add individual record deletion with confirmation or an equally safe interaction.
- Add clear-all history with confirmation.
- Handle empty history state.
- Handle malformed local data safely.

### Epic E — Preserve visual and language behavior

- Reproduce the current Material Design-based visual appearance.
- Preserve responsive behavior for the same device classes supported by the current feature.
- Preserve RTL layout.
- Preserve Persian text and Persian-number rendering.
- Use only local fonts and assets.
- Verify all copied text is correctly encoded and readable.

### Epic F — Testing

- Add unit tests for score calculation and severity classification.
- Add unit tests for recommendations and gauge-color mapping.
- Add tests for required-answer validation and question navigation.
- Add tests for local persistence, retrieval, deletion, and clear-all behavior.
- Add tests for malformed local-storage data.
- Add component tests for result display and restart behavior.
- Add a production-build verification step.

### Epic G — Offline and static deployment verification

- Verify the app works without a backend running.
- Verify browser network requests are not required during assessment use.
- Verify runtime assets load locally.
- Verify the production build can be served by a static web server.
- Verify refresh behavior at the root route.
- Verify a fresh browser profile can complete and save an assessment.

## 9. Acceptance criteria

The project is complete when all of the following are true:

1. A developer can clone the repository and run the documented Angular commands without access to the original repository.
2. The app opens at the root URL and displays the PHQ-9 assessment.
3. All nine questions require an answer before submission.
4. Scores and severity categories match the existing PHQ-9 implementation.
5. The five severity-category recommendations match the intended existing behavior, with no separate warning.
6. Persian and RTL content renders correctly without mojibake.
7. A completed assessment is saved locally and remains available after refresh and browser restart.
8. Multiple assessments can be saved and viewed.
9. Previous assessments cannot be edited.
10. Individual records and all history can be deleted.
11. No login, server, API, analytics, CDN, or external runtime service is required.
12. No request is sent to the original application or any backend during normal use.
13. The app works with local assets and local fonts.
14. Automated tests pass.
15. The production build succeeds and can be hosted as static files.

## 10. Suggested verification commands

```powershell
npm install
npm test
ng build
ng serve
```

The exact test command may be adjusted to the final repository configuration, but it must remain documented and reproducible.

## 11. Definition of done

The repository is ready for handoff when:

- The standalone app has no dependency on the original repository.
- The copied scaffolding has been reduced to PHQ-9-specific code and assets.
- Offline persistence and history management are implemented.
- The visual, scoring, language, and RTL requirements are verified.
- Automated tests and production build pass.
- No secrets or unrelated application data are present.
- The Git history contains a clean, reviewable implementation.
