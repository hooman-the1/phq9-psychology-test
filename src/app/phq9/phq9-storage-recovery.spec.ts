import { TestBed } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY, Phq9AssessmentRecord } from './phq9-assessment-record';
import { Phq9AssessmentStorage } from './phq9-assessment-storage';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('assessment storage recovery', () => {
  const key = PHQ9_ASSESSMENT_STORAGE_KEY;
  const storage = new Phq9AssessmentStorage();
  const validRecord: Phq9AssessmentRecord = {
    id: 'first',
    createdAt: '2026-09-26T10:30:00.000Z',
    answers: [0, 1, 2, 3, 0, 1, 2, 3, 0],
    totalScore: 12,
    severityCategory: 'moderate',
    result: { severityLabel: 'Saved label', recommendation: 'Saved advice', warnings: ['Saved warning'] },
  };
  const assessment = {
    answers: validRecord.answers,
    totalScore: validRecord.totalScore,
    severityCategory: validRecord.severityCategory,
    result: validRecord.result,
  };

  beforeEach(() => localStorage.removeItem(key));
  afterEach(() => localStorage.removeItem(key));

  it('treats a missing key and a valid empty envelope as clean empty history', () => {
    expect(storage.read()).toEqual({ ok: true, records: [] });
    localStorage.setItem(key, '{"schemaVersion":1,"records":[]}');
    expect(storage.read()).toEqual({ ok: true, records: [] });
  });

  it('keeps valid records in order with their original result snapshots', () => {
    const second = { ...validRecord, id: 'second', result: { ...validRecord.result, recommendation: 'Older advice' } };
    const original = JSON.stringify({ schemaVersion: 1, records: [validRecord, second] });
    localStorage.setItem(key, original);
    expect(storage.read()).toEqual({ ok: true, records: [validRecord, second] });
    expect(localStorage.getItem(key)).toBe(original);
  });

  for (const raw of [
    '{broken', 'null', '[]', '42', '"text"', 'false', '{}',
    '{"records":[]}', '{"schemaVersion":1}', '{"schemaVersion":1,"records":null}',
    '{"schemaVersion":0,"records":[]}', '{"schemaVersion":2,"records":[]}',
    '{"schemaVersion":"1","records":[]}', '{"schemaVersion":999,"records":[]}',
  ]) {
    it(`rejects an invalid envelope without changing its bytes: ${raw}`, () => {
      localStorage.setItem(key, raw);
      expect(storage.read()).toEqual({ ok: false, error: 'invalid-data' });
      expect(storage.save(assessment).ok).toBeFalse();
      expect(storage.read()).toEqual({ ok: false, error: 'invalid-data' });
      expect(localStorage.getItem(key)).toBe(raw);
    });
  }

  it('retains only first valid IDs and reports skipped records without rewriting', () => {
    const second = { ...validRecord, id: 'second' };
    const invalidFirst = { ...validRecord, id: 'later', createdAt: '2026-02-30T10:30:00Z' };
    const laterValid = { ...validRecord, id: 'later' };
    const raw = JSON.stringify({ schemaVersion: 1, records: [
      validRecord,
      { ...validRecord, id: 'wrong-answers', answers: [1] },
      { ...validRecord, id: 'wrong-value', answers: [0, 1, 2, 3, 0, 1, 2, 3, 4] },
      { ...validRecord, id: 'wrong-score', totalScore: 11 },
      { ...validRecord, id: 'wrong-category', severityCategory: 'mild' },
      { ...validRecord, id: 'wrong-snapshot', result: { severityLabel: '', recommendation: 'x', warnings: [] } },
      { ...validRecord, id: 'missing-snapshot', result: null },
      { id: 'missing' },
      invalidFirst, laterValid, second, { ...validRecord, result: { ...validRecord.result, recommendation: 'duplicate' } },
    ] });
    localStorage.setItem(key, raw);
    expect(storage.read()).toEqual(jasmine.objectContaining({ ok: true, records: [validRecord, laterValid, second], partial: true, skippedCount: 9 }));
    expect(storage.save(assessment).ok).toBeFalse();
    expect(localStorage.getItem(key)).toBe(raw);
  });

  it('reports partial corruption even when no records survive', () => {
    const raw = '{"schemaVersion":1,"records":[null,{"id":"x"}]}';
    localStorage.setItem(key, raw);
    expect(storage.read()).toEqual(jasmine.objectContaining({ ok: true, records: [], partial: true, skippedCount: 2 }));
    expect(localStorage.getItem(key)).toBe(raw);
  });

  it('distinguishes a throwing read from empty or corrupt history and never attempts a write', () => {
    localStorage.setItem(key, '{"schemaVersion":1,"records":[]}');
    const original = localStorage.getItem(key);
    const read = spyOn(localStorage, 'getItem').and.throwError('blocked');
    const write = spyOn(localStorage, 'setItem');
    expect(storage.read()).toEqual({ ok: false, error: 'unavailable' });
    expect(storage.save(assessment)).toEqual({ ok: false, error: 'unavailable' });
    expect(write).not.toHaveBeenCalled();
    read.and.callThrough();
    expect(localStorage.getItem(key)).toBe(original);
  });

  for (const [raw, expectedText] of [
    ['{broken', 'تاریخچه ذخیره‌شده'],
    [JSON.stringify({ schemaVersion: 2, records: [] }), 'تاریخچه ذخیره‌شده'],
    [JSON.stringify({ schemaVersion: 1, records: [validRecord, null] }), 'برخی از موارد'],
    [JSON.stringify({ schemaVersion: 1, records: [null] }), 'برخی از موارد'],
  ] as const) {
    it(`shows a recovery notice while keeping assessment usable for ${raw.slice(0, 16)}`, async () => {
      localStorage.setItem(key, raw);
      await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
      const fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.detectChanges();
      const notice = fixture.nativeElement.querySelector('.history-notice') as HTMLElement;
      expect(notice.getAttribute('role')).toBe('alert');
      expect(notice.textContent).toContain(expectedText);
      expect(notice.textContent).not.toContain(raw);
      fixture.componentInstance.answers.fill(0);
      expect(fixture.componentInstance.submitAssessment().isValid).toBeTrue();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.result-card')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.result-card .validation-error')?.textContent).toContain('ذخیره نشد');
      expect(localStorage.getItem(key)).toBe(raw);
    });
  }

  it('shows a read-failure notice and keeps scoring usable when storage throws', async () => {
    spyOn(localStorage, 'getItem').and.throwError('blocked');
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    const fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.history-notice')?.textContent).toContain('تاریخچه ذخیره‌شده');
    fixture.componentInstance.answers.fill(0);
    expect(fixture.componentInstance.submitAssessment().isValid).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.result-card .validation-error')?.textContent).toContain('ذخیره نشد');
  });

  it('shows no recovery notice for missing or valid empty history and saves a later assessment', async () => {
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    const fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.history-notice')).toBeNull();
    fixture.componentInstance.answers.fill(0);
    expect(fixture.componentInstance.submitAssessment().isValid).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card .validation-error')).toBeNull();
    expect(storage.read().ok).toBeTrue();
  });
});
