# PHQ-9 local assessment schema (v1)

The intended browser storage key is `phq9.assessments`. Its JSON value is one envelope, not an array by itself. Empty history is exactly:

```json
{"schemaVersion":1,"records":[]}
```

One completed assessment has this shape:

```json
{
  "schemaVersion": 1,
  "records": [
    {
      "id": "local-opaque-1",
      "createdAt": "2026-09-26T10:30:00.000Z",
      "answers": [0, 1, 2, 3, 0, 1, 2, 3, 0],
      "totalScore": 12,
      "severityCategory": "moderate",
      "result": {
        "severityLabel": "افسردگی متوسط",
        "recommendation": "صحبت با یک روانشناس یا مشاور توصیه می‌شود.",
        "warnings": []
      }
    }
  ]
}
```

`id` is a nonempty opaque string, unique within the envelope. `createdAt` is the UTC submission instant in ISO 8601 form `YYYY-MM-DDTHH:mm:ssZ`, optionally with one to three fractional second digits before `Z`; the calendar date and time must exist. `answers` contains exactly nine integer values, each 0–3, in questionnaire order. Zero is an answer and must be retained. `totalScore` is an integer from 0 to 27 and must equal the answer sum. `severityCategory` uses the existing `Phq9SeverityCategory` type and thresholds: 0–4 `minimal`, 5–9 `mild`, 10–14 `moderate`, 15–19 `moderately_severe`, 20–27 `severe`.

`result` is a snapshot of what the user saw at submission: nonempty `severityLabel` and `recommendation` strings, and an array of nonempty warning messages. Current behavior has no separate warning, so `warnings` is `[]`. Future detail views should show this snapshot rather than recompute possibly changed copy. The display text need not match current release wording when reading an older v1 record.

Only `schemaVersion: 1` is supported. A reader must reject missing or malformed JSON, an absent or invalid envelope, and older or future versions without crashing or overwriting the stored value. Within a valid v1 envelope, reject malformed or inconsistent records individually and retain valid records. This includes duplicate IDs, impossible dates, invalid answers, score or category mismatches, and missing result fields. For duplicates, retain the first valid record with that ID and reject later records with that ID. Reading must not silently rewrite rejected data. Parsing, storage error handling, and user-visible recovery are part of issue #17; this task supplies the record-level consistency guard only.

Increment `schemaVersion` if record fields are added, removed, renamed, or change meaning; if answer order, score or category semantics change; if timestamp, ID, or result snapshot formats change; or if envelope structure changes. Any migration must be explicit and tested before accepting an old version. This standalone application has no shipped pre-v1 local schema to migrate.
