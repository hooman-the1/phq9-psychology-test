import { calculatePhq9Score, Phq9SeverityCategory } from './phq9-scoring';

export const PHQ9_ASSESSMENT_STORAGE_KEY = 'phq9.assessments';
export const PHQ9_ASSESSMENT_SCHEMA_VERSION = 1 as const;

export interface Phq9AssessmentResultSnapshot {
  readonly severityLabel: string;
  readonly recommendation: string;
  readonly warnings: readonly string[];
}

export interface Phq9AssessmentRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly answers: readonly number[];
  readonly totalScore: number;
  readonly severityCategory: Phq9SeverityCategory;
  readonly result: Phq9AssessmentResultSnapshot;
}

export interface Phq9AssessmentEnvelope {
  readonly schemaVersion: typeof PHQ9_ASSESSMENT_SCHEMA_VERSION;
  readonly records: readonly Phq9AssessmentRecord[];
}

/** Checks one record's fields and scoring invariants; envelope parsing belongs to the storage reader. */
export function isPhq9AssessmentRecord(value: unknown): value is Phq9AssessmentRecord {
  if (!isObject(value) || !isNonemptyString(value['id']) || !isUtcTimestamp(value['createdAt'])) {
    return false;
  }

  const score = calculatePhq9Score(value['answers'] as readonly unknown[]);
  if (!score || value['totalScore'] !== score.total || value['severityCategory'] !== score.category) {
    return false;
  }

  const result = value['result'];
  return isObject(result)
    && isNonemptyString(result['severityLabel'])
    && isNonemptyString(result['recommendation'])
    && Array.isArray(result['warnings'])
    && result['warnings'].every(isNonemptyString);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) {
    return false;
  }

  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime())
    && timestamp.toISOString() === `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`;
}
