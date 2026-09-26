# PHQ-9 dependency inventory

## Purpose and inspection boundary

This inventory records dependencies that can be verified from the current
checkout. It covers the PHQ-9 reference artifact under
`copied-from-main-repo/src/app/user/tests/phq9/`, its directly imported shared
code, the copied Angular workspace configuration, and the current standalone
shell under `src/`.

The copied artifact is reference material, not the current production
application. The current production source contains only the shell and route
established by issues #1–#3. This document does not replace, remove, or copy
any dependency; replacement and cleanup are deferred to issues #5, #6, #14,
#23, #28, and #29.

### Classification meanings

- **required** — evidenced as needed by the PHQ-9 experience or by the current
  shell/build baseline.
- **unrelated scaffolding** — present because it belongs to the copied parent
  application, but not evidenced as needed by the PHQ-9 behavior in scope.
- **replace locally** — the PHQ-9 consumes it across the copied application
  boundary and the final offline app needs a local equivalent or direct local
  implementation.
- **not verifiable** — the checkout does not contain enough source or runtime
  evidence to decide.

The classifications are planning evidence only. An item is not marked for
removal merely because it appears unused.

## Current repository baseline

| Evidence | Current state | Classification | Evidence and next action |
| --- | --- | --- | --- |
| `src/app/phq9/phq9-shell.component.ts` | Standalone shell rendering `PHQ-9` | required | It is the current local PHQ-9 entry shell. It does not yet implement the questionnaire. |
| `src/app/phq9/index.ts` | Local feature entry point | required | It is the current feature boundary used by the shell/routing work. |
| `src/app/app.routes.ts` | Root route to the local shell | required | It establishes the current `/` entry point. |
| `package.json` | Package name `phq9`; Angular 17 shell dependencies | required | This is the current install/build/test baseline. The copied manifest is reference evidence only. |
| `copied-from-main-repo/src/app/user/tests/phq9/` | Reference PHQ-9 source artifact is present here | required | The product scope's original `src/app/user/tests/phq9/` path is absent at repository root, but its explicitly copied equivalent is available under `copied-from-main-repo/`. |
| `src/app/user/tests/phq9/` | Absent from the current production source tree | not verifiable | Do not assume a root-level path exists; use the copied artifact until isolation work is performed. |
| `copied-from-main-repo/src/app/share/` and `ui-share/` | Copied shared modules are present | replace locally | The PHQ-9 module imports both. Their contents include unrelated application features, so the exact retained subset must be established by issue #5. |
| `src/assets/` | No checked-in production asset directory is currently present | not verifiable | The shell currently has no PHQ-9 image/font asset evidence in `src/`; copied assets are inventoried below. |

## Templates

| Source path | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `copied-from-main-repo/src/app/user/tests/phq9/phq9.component.html` | `Phq9Component` | Questionnaire title, introduction, question text, four answer choices, navigation, progress bar, result text, gauge, and restart control | required | The component metadata references this template and the template contains the complete visible PHQ-9 flow. |
| `copied-from-main-repo/src/index.html` | Application document | Document shell and external tracking script | unrelated scaffolding | The PHQ-9 component does not import it. It contains Google Tag Manager/analytics runtime code, which is explicitly outside product scope. |

The template uses Persian/RTL text and emoji. The source contains visible
encoding-integrity risk in the copied extraction, so wording and Unicode
correction are deferred to issue #23 rather than changed here.

## Component and helper code

| Source path | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `copied-from-main-repo/src/app/user/tests/phq9/phq9.component.ts` | PHQ-9 template and route | Owns form creation, answer navigation, score total, result state, restart, HTTP calls, and session use | required | The class is the behavior source for the questionnaire and result flow. Its HTTP/session portions are separately flagged under backend references. |
| `copied-from-main-repo/src/app/user/tests/phq9/phq9.constants.ts` | Component and helpers | Defines five severity categories, labels, recommendations, colors, emoji, and nine questions | required | `phq9.component.ts` imports `SeverityCategory` and `questions`; `phq9.helpers.ts` imports `SEVERITY_LEVELS`. |
| `copied-from-main-repo/src/app/user/tests/phq9/phq9.helpers.ts` | Component | Maps score/category to severity text, recommendation, gauge color, emoji, and gauge markers | required | All exported helpers are called by the component. |
| `copied-from-main-repo/src/app/user/tests/phq9/phq9.module.ts` | PHQ-9 route/module | Declares the component and imports Angular/shared UI modules | required | The module is the reference assembly point, although it cannot be used unchanged in the standalone shell. |
| `copied-from-main-repo/src/app/user/tests/phq9/phq9-routing.module.ts` | PHQ-9 module | Provides the reference child route for `Phq9Component` | required | It imports `RouterModule`, `Routes`, and the component. The final root routing strategy remains a later implementation concern. |

## Styles

| Source path | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `copied-from-main-repo/src/app/user/tests/phq9/phq9.component.scss` | PHQ-9 component | Card sizing, question typography, answer layout, navigation controls, progress spacing, result card, gauge hiding, and restart button layout | required | The component metadata references the stylesheet and its selectors match the PHQ-9 template. |
| `copied-from-main-repo/src/styles.scss` | Parent application | Material/Nebular global styles, Font Awesome import, typography, Persian font faces, and global layout | replace locally | The PHQ-9 visual reference relies on global Material typography and local font declarations, but the file also contains unrelated parent styling. Exact extraction is deferred to issues #25 and #28. |
| `copied-from-main-repo/src/themes.scss` | Parent application | Nebular theme forwarding | unrelated scaffolding | No PHQ-9 source file imports it directly; it belongs to the broader copied application and must not be removed solely on this observation. |
| `src/styles.css` | Current shell | Minimal global reset and Arial fallback | required | It is included by the current `angular.json` build/test configuration. It does not yet provide the reference visual system. |

## Angular modules, providers, and framework packages

### Direct PHQ-9 Angular imports

| Source path or package | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `@angular/core` (`Component`, `OnInit`, `NgModule`) | Component/module | Angular component lifecycle and declarations | required | Direct imports in `phq9.component.ts` and `phq9.module.ts`. |
| `@angular/common` (`CommonModule`) | `phq9.module.ts` | Structural directives such as `*ngIf` and `*ngFor` | required | Imported by the reference PHQ-9 module and required by its template. |
| `@angular/forms` (`ReactiveFormsModule`, `FormsModule`, `FormBuilder`, `FormGroup`, `FormArray`, `FormControl`, `Validators`) | Module and component | Four-choice answer form, required validation, and form state | required | Direct imports and use in the component/template. `FormsModule` is imported by the module but no direct template use is proven. Retention is not decided here. |
| `@angular/router` (`RouterModule`, `Routes`) | `phq9-routing.module.ts` | Reference feature route | required | Direct import and route declaration. |
| `@angular/common/http` (`HttpClient`) | `phq9.component.ts` | POST/PATCH assessment lifecycle requests | replace locally | Direct constructor injection and calls are present, but backend communication is an explicit product non-goal. Issue #14 owns removal. |
| `@angular/material/card` | `phq9.component.html`, `ui-share.module.ts` | Cards and card content/title/actions | required | Template uses `mat-card`, `mat-card-title`, `mat-card-content`, and `mat-card-actions`; shared module exports the Material module. |
| `@angular/material/divider` | PHQ-9 template | Section dividers | required | Template uses `mat-divider`; shared module imports it. |
| `@angular/material/button` | PHQ-9 template | Navigation, submit, and restart buttons | required | Template uses `mat-button`, `mat-raised-button`, and `mat-stroked-button`. |
| `@angular/material/radio` | PHQ-9 template | Four answer choices | required | Template uses `mat-radio-group` and `mat-radio-button`. |
| `@angular/material/progress-bar` | PHQ-9 template | Question progress indicator | required | Template uses `mat-progress-bar`. |
| `ngx-gauge` / `NgxGaugeModule` | PHQ-9 template and `ui-share.module.ts` | Arc gauge for the result score | required | Template uses `<ngx-gauge>` and the shared module imports `NgxGaugeModule`. A local replacement may be selected later, but the visual behavior is currently evidenced. |
| `@angular/platform-browser` and `@angular/platform-browser-dynamic` | Parent bootstrap | Browser bootstrap/runtime | required | Present in the copied manifest and imported by copied `main.ts`; the current shell uses the platform runtime through its Angular bootstrap. |

The copied `ui-share.module.ts` imports many additional Material/Nebular/chart
modules (`dialog`, `form-field`, `icon`, `input`, `stepper`, `snack-bar`,
`list`, `sidenav`, `toolbar`, `expansion`, `progress-spinner`, `chips`,
`paginator`, `ng2-charts`, and `@angular/cdk/overlay`). Those imports serve the
shared module's broader components. The PHQ-9 template directly evidences only
card, divider, button, radio, progress-bar, and gauge usage; the remaining
shared-module imports are **unrelated scaffolding** for this feature until a
later inspection proves otherwise. They are not removal actions in this task.

## Pipes and directives

| Source path or package | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `copied-from-main-repo/src/app/share/latin-to-persian-numbers.pipe.ts` | PHQ-9 template | Formats question numbers, score, and gauge score as Persian digits | replace locally | The template uses `latinToPersianNumbers` three times; `ShareModule` declares/exports the pipe. |
| `copied-from-main-repo/src/app/share/share.module.ts` | PHQ-9 module | Aggregates the Persian-number pipe and unrelated shared components/providers | replace locally | `phq9.module.ts` imports `ShareModule`; only the number pipe is directly evidenced by the PHQ-9 template. |
| `copied-from-main-repo/src/app/share/persian-to-latin-numbers.pipe.ts` | Shared application | Converts Persian numbers to Latin numbers | unrelated scaffolding | No PHQ-9 template or component import/use is evidenced. It is included through the shared module, but no removal is performed here. |
| `copied-from-main-repo/src/app/share/fa-date-only.pipe.ts` and `fa-date-ymd.pipe.ts` | Shared application | Persian date formatting | unrelated scaffolding | No PHQ-9 template use is evidenced. |
| `copied-from-main-repo/src/app/share/fa-paginator-intl.ts` and `fa-digits-paginator.directive.ts` | Shared application | Persian paginator labels/digits | unrelated scaffolding | PHQ-9 has no paginator. The files are reachable from the shared module but not feature-consumed. |
| `copied-from-main-repo/src/app/share/new-review/` | Shared application | Review dialog UI | unrelated scaffolding | No PHQ-9 template or component reference exists. |
| `copied-from-main-repo/src/app/ui-share/` components/directives | Shared application | Loading overlay and emotion badge UI | unrelated scaffolding | The PHQ-9 module imports the aggregate `UiShareModule`, but the PHQ-9 template contains neither component. |

## Assets and images

| Source path | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `copied-from-main-repo/src/assets/images/user/phq-9-img.jpeg` | No direct reference found in the PHQ-9 component/template | Candidate PHQ-9 image | not verifiable | The filename is PHQ-9-specific, but no current consumer was found in the inspected feature files. It must be retained or removed only after runtime/visual inspection in issue #29. |
| `copied-from-main-repo/src/assets/fonts/material-symbols/material-symbols-outlined.woff2` | Parent global styles | Material Symbols font | replace locally | Referenced by `copied-from-main-repo/src/styles.scss`; whether PHQ-9 needs any symbol glyph is not proven by its template. |
| `copied-from-main-repo/src/assets/` other files | Parent application | Application images/fonts/icons | unrelated scaffolding | No complete PHQ-9 consumer mapping is available from the current shell. Do not remove based on filename alone. |
| `src/assets/` | Current shell | Angular asset input path | not verifiable | The current `angular.json` names this path, but no checked-in asset files are present in the current production source tree. |

## Fonts and typography

| Source path | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `copied-from-main-repo/src/assets/fonts/Vazir.ttf` | Parent `styles.scss` | Persian regular font face | required | Global stylesheet declares and uses it for Persian typography; PHQ-9 is Persian/RTL. |
| `copied-from-main-repo/src/assets/fonts/Vazir-Thin.ttf` | Parent `styles.scss` | Persian thin font face | not verifiable | Global stylesheet declares it, but the PHQ-9 component does not select a thin weight directly. |
| `copied-from-main-repo/src/assets/fonts/Vazir-Bold.ttf` | Parent `styles.scss` | Persian bold font face | required | The template uses bold/strong content and the parent stylesheet declares the bold face. Exact final weight usage needs visual verification. |
| `copied-from-main-repo/src/assets/fonts/IRANSans.ttf` | Parent `styles.scss` | Alternative Persian regular font face | not verifiable | Declared globally; no PHQ-9 selector proves it is the active family. |
| `copied-from-main-repo/src/assets/fonts/IRANSans_Light.ttf` | Parent `styles.scss` | Alternative Persian light font face | not verifiable | Declared globally; no PHQ-9 selector proves it is required. |

No font is currently copied into the production `src/` tree. Local font
packaging and final selection are deferred to issue #28.

## Package dependencies

The following versions are taken from
`copied-from-main-repo/package.json`; the current shell versions are taken from
the root `package.json`. A package classification describes its evidence for
the PHQ-9 reference, not a permission to edit either manifest.

| Package | Consumer/evidence | Runtime class | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `@angular/animations` | Copied manifest; no direct PHQ-9 import | browser runtime candidate | not verifiable | No animation is directly used by the inspected PHQ-9 files. |
| `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router` | Angular feature/module/bootstrap imports | browser runtime | required | Direct framework use in the feature or application bootstrap. |
| `@angular/forms` | PHQ-9 module/component | browser runtime | required | Reactive form and validators are directly used. |
| `@angular/material` | Shared module Material imports | browser runtime | required | PHQ-9 template directly needs the listed Material controls. |
| `@angular/cdk` | Shared module overlay import | browser runtime candidate | unrelated scaffolding | Overlay is used by shared application code; no PHQ-9 consumer is evidenced. |
| `@nebular/theme`, `@nebular/auth`, `@nebular/security`, `@nebular/eva-icons`, `eva-icons` | Shared module/global theme and parent application | browser runtime candidate | unrelated scaffolding | No direct PHQ-9 template use; these packages are part of the copied parent shell. |
| `@ng-bootstrap/ng-bootstrap`, `bootstrap`, `@popperjs/core` | Shared `ShareModule` and parent styles | browser runtime candidate | unrelated scaffolding | PHQ-9 does not use Bootstrap or the review/rating components in the inspected files. |
| `ngx-gauge` | PHQ-9 result template | browser runtime | required | Direct `<ngx-gauge>` use and module import. |
| `chart.js`, `chartjs-plugin-datalabels`, `ng2-charts` | Parent `main.ts`/shared module | browser runtime candidate | unrelated scaffolding | No PHQ-9 chart is present; copied bootstrap registers Chart.js for the wider application. |
| `arcaptcha-angular` | Parent application/environment | browser runtime candidate | unrelated scaffolding | No PHQ-9 template or component reference is evidenced. |
| `rxjs` | Angular/runtime and HTTP observables | browser runtime | required | Angular application dependency; HTTP calls currently return observables even though their removal is later work. |
| `zone.js` | Angular bootstrap/test | browser runtime and test | required | Listed in current and copied Angular polyfills. |
| `tslib` | TypeScript runtime helpers | browser runtime/build | required | Current and copied manifests include it. |

### Build-time and test-only packages

| Package/group | Consumer | Runtime class | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `@angular-devkit/build-angular`, `@angular/cli`, `@angular/compiler-cli`, `typescript` | Root/copy build and TypeScript configuration | build-time | required | Needed to build the current Angular shell and compile the reference workspace. |
| `jasmine-core`, `karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `@types/jasmine` | Root/copy test configuration | test-only | required | Current `package.json` exposes `test` and `test:headless`; these packages are not browser application dependencies. |

The current root manifest intentionally contains only the Angular shell set,
not the copied application's larger package set. This inventory does not
change that manifest.

## Environment configuration

| Source path | PHQ-9 consumer | Purpose | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `copied-from-main-repo/src/environments/environment.ts` | `phq9.component.ts`, copied `main.ts` | Development `production` flag and `apiBaseUrl` | replace locally | The component concatenates `apiBaseUrl` with assessment endpoints; the API dependency is outside offline scope. |
| `copied-from-main-repo/src/environments/environment.prod.ts` | Copied Angular file replacement | Production environment values | replace locally | It is referenced by copied `angular.json`; the exact production API behavior is not needed for the offline product and is deferred to issue #14. |
| `copied-from-main-repo/src/environments/environment.spec.ts` | Environment test | Checks development flag and CAPTCHA site key | unrelated scaffolding | CAPTCHA is unrelated to PHQ-9 product scope. No secret is reproduced here. |
| `copied-from-main-repo/angular.json` | Parent build | Environment replacement, copied assets, Font Awesome styles, and build/test inputs | replace locally | It describes the copied workspace, not the current root workspace. Its PHQ-9-relevant asset/style inputs must be re-evaluated during local extraction. |

## HTTP, session, backend, and external runtime references

| Source path/reference | PHQ-9 consumer | Purpose | Classification | Evidence and risk |
| --- | --- | --- | --- | --- |
| `@angular/common/http` `HttpClient` | `phq9.component.ts` constructor | Sends assessment lifecycle requests | replace locally | `ngOnInit` POSTs, `submit` PATCHes, and `restart` POSTs. This violates the offline/no-backend product boundary; issue #14 owns removal. |
| `copied-from-main-repo/src/app/share/sessionid.service.ts` | `phq9.component.ts` | Stores/generates `phq9_session_id` for server requests | replace locally | It is a cross-boundary `share` import and localStorage access. Session IDs are not part of the final saved-record requirement; issue #14 owns the decision/removal. |
| `copied-from-main-repo/src/environments/environment.ts` `apiBaseUrl` | `phq9.component.ts` | Base URL for POST/PATCH requests | replace locally | Current value is a localhost API endpoint in the inspected source. The final app must not require it. |
| `initialSubRoute = /test/phq9?action=enter` | `phq9.component.ts` | Start-assessment API route suffix | replace locally | Used only in HTTP POST construction. |
| `patchSubRoute = /test/phq9?action=calculate-result` | `phq9.component.ts` | Result API route suffix | replace locally | Used only in HTTP PATCH construction. |
| `https://www.googletagmanager.com/gtag/js?...` | `copied-from-main-repo/src/index.html` | Analytics/tracking script | unrelated scaffolding | It is an external CDN/network runtime request and explicitly prohibited by `_docs/PROJECT-SCOPE.md`. Removal is outside this issue. |
| CAPTCHA site key/configuration | Copied environment and parent application | CAPTCHA/authentication protection | unrelated scaffolding | No PHQ-9 template use is evidenced; the product explicitly has no login or external service. The value is intentionally not reproduced. |

The copied PHQ-9 source also uses browser `localStorage` for the session ID.
That is a browser API dependency, but it is not yet the required versioned
assessment-history schema. The local persistence design belongs to issues
#15–#17.

## Cross-boundary import map

These are all imports crossing the PHQ-9 feature's local folder boundary in the
inspected reference source:

| Import in | Import target | Purpose | Classification |
| --- | --- | --- | --- |
| `phq9.module.ts` | `src/app/share/share.module` | Shared pipe and unrelated shared declarations/providers | replace locally |
| `phq9.module.ts` | `src/app/ui-share/ui-share.module` | Material/gauge/shared declarations | replace locally |
| `phq9.component.ts` | `src/app/share/sessionid.service` | Session ID for HTTP calls | replace locally |
| `phq9.component.ts` | `@angular/common/http` | Backend requests | replace locally |
| `phq9.component.ts` | `src/environments/environment` | API base URL | replace locally |
| `phq9-routing.module.ts` | `@angular/router` | Feature route assembly | required |
| `phq9.module.ts` | `@angular/common`, `@angular/forms`, `@angular/core` | Angular module/form assembly | required |

No import to a parent directory, external workspace alias, or package named
`yekravankav` was found inside the PHQ-9 feature files. The copied package
metadata itself is named `yekravankav`, and the copied workspace is therefore
still original-application scaffolding; issue #6 owns removal/verification of
such references.

## Offline readiness summary

The reference PHQ-9 behavior can be identified, but it is not offline-ready in
the current checkout. Before the questionnaire can run independently, the next
engineer must retain the question/constants/helper/template behavior, provide a
local form/UI assembly, replace the Persian-number pipe locally, decide how to
render the gauge, remove HTTP/session/API calls, and package verified local
fonts/assets. The analytics script and parent shared application modules must
not become runtime requirements.

This conclusion is based only on the paths and manifests present in this
checkout. Runtime network inspection, visual comparison, and removal decisions
are intentionally deferred to their linked implementation and verification
issues.
