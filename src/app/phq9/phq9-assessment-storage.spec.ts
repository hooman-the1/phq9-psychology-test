import { TestBed } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY } from './phq9-assessment-record';
import { Phq9AssessmentStorage } from './phq9-assessment-storage';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('local PHQ-9 assessment storage', () => {
  beforeEach(() => localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY));

  const completed = (answers: number[] = [0, 1, 2, 3, 0, 1, 2, 3, 0]) => ({
    answers,
    totalScore: 12,
    severityCategory: 'moderate' as const,
    result: { severityLabel: 'Moderate', recommendation: 'Saved text', warnings: [] },
  });

  it('reads an empty collection and saves a v1 envelope with zero answers', () => {
    const storage = new Phq9AssessmentStorage();
    expect(storage.read()).toEqual({ ok: true, records: [] });

    const saved = storage.save(completed());
    expect(saved.ok).toBeTrue();
    const envelope = JSON.parse(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)!);
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.records.length).toBe(1);
    expect(envelope.records[0].answers).toEqual(completed().answers);
    expect(envelope.records[0].id).toEqual(jasmine.any(String));
    expect(envelope.records[0].id.length).toBeGreaterThan(0);
    expect(envelope.records[0].createdAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    expect(envelope.records[0].result).toEqual(completed().result);
  });

  it('retains two distinct records and retrieves unchanged snapshots in a new instance', () => {
    const storage = new Phq9AssessmentStorage();
    const first = storage.save(completed());
    expect(first.ok).toBeTrue();
    const second = storage.save({
      answers: Array(9).fill(3),
      totalScore: 27,
      severityCategory: 'severe',
      result: { severityLabel: 'Severe', recommendation: 'Another result', warnings: [] },
    });
    expect(second.ok).toBeTrue();

    const retrieved = new Phq9AssessmentStorage().read();
    expect(retrieved.ok).toBeTrue();
    if (!first.ok || !second.ok || !retrieved.ok) return;
    expect(first.record.id).not.toBe(second.record.id);
    expect(retrieved.records).toEqual([first.record, second.record]);
    expect(retrieved.records[0].createdAt).toBe(first.record.createdAt);
  });

  it('returns read failure and refuses to overwrite unreadable existing data', () => {
    const original = '{unreadable';
    localStorage.setItem(PHQ9_ASSESSMENT_STORAGE_KEY, original);
    const storage = new Phq9AssessmentStorage();
    expect(storage.read().ok).toBeFalse();
    expect(storage.save(completed()).ok).toBeFalse();
    expect(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)).toBe(original);
  });

  it('exposes unavailable and full storage failures without replacing existing data', () => {
    const storage = new Phq9AssessmentStorage();
    const first = storage.save(completed());
    expect(first.ok).toBeTrue();
    const original = localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY);
    spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
    expect(storage.save(completed()).ok).toBeFalse();
    expect(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)).toBe(original);
  });

  it('exposes blocked storage reads and does not attempt a write', () => {
    const storage = new Phq9AssessmentStorage();
    spyOn(localStorage, 'getItem').and.throwError('blocked');
    const write = spyOn(localStorage, 'setItem');
    expect(storage.read().ok).toBeFalse();
    expect(storage.save(completed()).ok).toBeFalse();
    expect(write).not.toHaveBeenCalled();
  });

  it('saves only valid submissions and reports failed saves while keeping the result visible', async () => {
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    const fixture = TestBed.createComponent(Phq9ShellComponent);
    const component = fixture.componentInstance;
    expect(component.submitAssessment().isValid).toBeFalse();
    expect(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)).toBeNull();

    component.answers.splice(0, 9, ...completed().answers);
    expect(component.submitAssessment().isValid).toBeTrue();
    const saved = new Phq9AssessmentStorage().read();
    expect(saved.ok).toBeTrue();
    if (!saved.ok) return;
    expect(saved.records.length).toBe(1);
    expect(saved.records[0].result.severityLabel).toBe(component.resultDetails!.severity);
    expect(saved.records[0].result.recommendation).toBe(component.resultDetails!.recommendation);

    component.answers[0] = null;
    expect(component.submitAssessment().isValid).toBeFalse();
    expect(new Phq9AssessmentStorage().read()).toEqual(saved);

    component.answers[0] = 0;
    spyOn(localStorage, 'setItem').and.throwError('quota exceeded');
    expect(component.submitAssessment().isValid).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('ذخیره نشد');
    expect(new Phq9AssessmentStorage().read()).toEqual(saved);
  });
});
