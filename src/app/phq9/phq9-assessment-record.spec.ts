import { isPhq9AssessmentRecord } from './phq9-assessment-record';

describe('PHQ-9 assessment record contract', () => {
  const validRecord = () => ({
    id: 'local-opaque-1',
    createdAt: '2026-09-26T10:30:00.000Z',
    answers: [0, 1, 2, 3, 0, 1, 2, 3, 0],
    totalScore: 12,
    severityCategory: 'moderate',
    result: {
      severityLabel: 'Moderate',
      recommendation: 'Saved recommendation',
      warnings: [] as string[],
    },
  });

  it('accepts a complete record, including zero answers and an empty warning snapshot', () => {
    expect(isPhq9AssessmentRecord(validRecord())).toBeTrue();
    expect(isPhq9AssessmentRecord({ ...validRecord(), createdAt: '2026-09-26T10:30:00Z' })).toBeTrue();
  });

  it('rejects malformed identifiers and impossible or non-UTC timestamps', () => {
    for (const id of ['', '   ', null, 42]) {
      expect(isPhq9AssessmentRecord({ ...validRecord(), id })).toBeFalse();
    }
    for (const createdAt of ['2026-02-30T10:30:00Z', '2026-09-26T10:30:00+03:30', '2026-09-26', 'invalid']) {
      expect(isPhq9AssessmentRecord({ ...validRecord(), createdAt })).toBeFalse();
    }
  });

  it('rejects missing, extra, noninteger, and out-of-range answers', () => {
    for (const answers of [[0], [...validRecord().answers, 0],
      [null, ...validRecord().answers.slice(1)],
      [0.5, ...validRecord().answers.slice(1)],
      [4, ...validRecord().answers.slice(1)]]) {
      expect(isPhq9AssessmentRecord({ ...validRecord(), answers })).toBeFalse();
    }
  });

  it('rejects score and category inconsistencies', () => {
    expect(isPhq9AssessmentRecord({ ...validRecord(), totalScore: 13 })).toBeFalse();
    expect(isPhq9AssessmentRecord({ ...validRecord(), totalScore: 12.5 })).toBeFalse();
    expect(isPhq9AssessmentRecord({ ...validRecord(), severityCategory: 'mild' })).toBeFalse();
  });

  it('requires a complete, nonempty display snapshot', () => {
    for (const result of [null, {},
      { recommendation: 'Saved', warnings: [] },
      { severityLabel: ' ', recommendation: 'Saved', warnings: [] },
      { severityLabel: 'Moderate', recommendation: '', warnings: [] },
      { severityLabel: 'Moderate', recommendation: 'Saved', warnings: [''] },
      { severityLabel: 'Moderate', recommendation: 'Saved', warnings: 'none' }]) {
      expect(isPhq9AssessmentRecord({ ...validRecord(), result })).toBeFalse();
    }
  });

  it('rejects non-record values', () => {
    for (const value of [null, [], 'record', 12]) {
      expect(isPhq9AssessmentRecord(value)).toBeFalse();
    }
  });
});
