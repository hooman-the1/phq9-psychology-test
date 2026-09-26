import { Injectable } from '@angular/core';

import {
  isPhq9AssessmentRecord,
  PHQ9_ASSESSMENT_SCHEMA_VERSION,
  PHQ9_ASSESSMENT_STORAGE_KEY,
  Phq9AssessmentEnvelope,
  Phq9AssessmentRecord,
} from './phq9-assessment-record';

export type Phq9StorageReadResult =
  | { readonly ok: true; readonly records: readonly Phq9AssessmentRecord[] }
  | { readonly ok: true; readonly records: readonly Phq9AssessmentRecord[]; readonly partial: true; readonly skippedCount: number }
  | { readonly ok: false; readonly error: 'unavailable' | 'invalid-data' };

export type Phq9StorageSaveResult =
  | { readonly ok: true; readonly record: Phq9AssessmentRecord }
  | { readonly ok: false; readonly error: 'unavailable' | 'invalid-data' | 'write-failed' };

let nextLocalId = 0;

/** Browser storage boundary for completed assessments. */
@Injectable({ providedIn: 'root' })
export class Phq9AssessmentStorage {
  read(): Phq9StorageReadResult {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY);
    } catch {
      return { ok: false, error: 'unavailable' };
    }

    if (raw === null) {
      return { ok: true, records: [] };
    }

    try {
      const value: unknown = JSON.parse(raw);
      if (!isAssessmentEnvelope(value)) {
        return { ok: false, error: 'invalid-data' };
      }
      const records: Phq9AssessmentRecord[] = [];
      const seenIds = new Set<string>();
      let skippedCount = 0;
      for (const candidate of value.records) {
        if (!isPhq9AssessmentRecord(candidate) || seenIds.has(candidate.id)) {
          skippedCount++;
          continue;
        }
        seenIds.add(candidate.id);
        records.push(candidate);
      }
      return skippedCount > 0
        ? { ok: true, records, partial: true, skippedCount }
        : { ok: true, records };
    } catch {
      return { ok: false, error: 'invalid-data' };
    }
  }

  save(assessment: Omit<Phq9AssessmentRecord, 'id' | 'createdAt'>): Phq9StorageSaveResult {
    const existing = this.read();
    if (!existing.ok || ('partial' in existing && existing.partial)) {
      return { ok: false, error: existing.ok ? 'invalid-data' : existing.error };
    }

    let id: string;
    do {
      id = `local-${Date.now()}-${++nextLocalId}`;
    } while (existing.records.some((record) => record.id === id));

    const record: Phq9AssessmentRecord = {
      id,
      createdAt: new Date().toISOString(),
      answers: [...assessment.answers],
      totalScore: assessment.totalScore,
      severityCategory: assessment.severityCategory,
      result: {
        severityLabel: assessment.result.severityLabel,
        recommendation: assessment.result.recommendation,
        warnings: [...assessment.result.warnings],
      },
    };
    if (!isPhq9AssessmentRecord(record)) {
      return { ok: false, error: 'invalid-data' };
    }

    const envelope: Phq9AssessmentEnvelope = {
      schemaVersion: PHQ9_ASSESSMENT_SCHEMA_VERSION,
      records: [...existing.records, record],
    };
    try {
      window.localStorage.setItem(PHQ9_ASSESSMENT_STORAGE_KEY, JSON.stringify(envelope));
      return { ok: true, record };
    } catch {
      return { ok: false, error: 'write-failed' };
    }
  }
}

function isAssessmentEnvelope(value: unknown): value is { schemaVersion: typeof PHQ9_ASSESSMENT_SCHEMA_VERSION; records: unknown[] } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const envelope = value as Record<string, unknown>;
  return envelope['schemaVersion'] === PHQ9_ASSESSMENT_SCHEMA_VERSION && Array.isArray(envelope['records']);
}
