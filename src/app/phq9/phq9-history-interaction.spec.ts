import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY, Phq9AssessmentRecord } from './phq9-assessment-record';
import { PHQ9_ANSWER_CHOICES, PHQ9_QUESTIONS } from './phq9-questionnaire';
import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('complete history interaction', () => {
  const key = PHQ9_ASSESSMENT_STORAGE_KEY;
  const older: Phq9AssessmentRecord = {
    id: 'older', createdAt: '2026-09-25T10:30:00.000Z',
    answers: [0, 1, 2, 3, 0, 1, 2, 3, 0], totalScore: 12, severityCategory: 'moderate',
    result: { severityLabel: 'Saved moderate', recommendation: 'Saved advice', warnings: ['Saved warning'] },
  };
  const newer: Phq9AssessmentRecord = {
    id: 'newer', createdAt: '2026-09-26T10:30:00.000Z',
    answers: Array(9).fill(3), totalScore: 27, severityCategory: 'severe',
    result: { severityLabel: 'Saved severe', recommendation: 'Another advice', warnings: [] },
  };
  let fixture: ComponentFixture<Phq9ShellComponent>;

  const button = (label: string): HTMLButtonElement => {
    const found = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[])
      .find((candidate) => candidate.textContent?.trim() === label);
    expect(found).withContext(`Missing button: ${label}`).toBeDefined();
    return found!;
  };
  const history = (): HTMLElement => fixture.nativeElement.querySelector('.history-view');
  const rows = (): HTMLElement[] => Array.from(history().querySelectorAll('.history-list li'));
  const storedRecords = (): Phq9AssessmentRecord[] => {
    const envelope = JSON.parse(localStorage.getItem(key)!);
    expect(envelope.schemaVersion).toBe(1);
    return envelope.records;
  };

  beforeEach(async () => {
    localStorage.removeItem(key);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });
  afterEach(() => {
    fixture?.destroy();
    localStorage.removeItem(key);
  });

  it('moves from list to detail, delete, and clear-all through visible controls', () => {
    localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, records: [older, newer] }));
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    const originalBytes = localStorage.getItem(key);
    button('تاریخچه آزمون‌ها').click();
    fixture.detectChanges();

    expect(rows().map((row) => row.getAttribute('data-record-id'))).toEqual(['newer', 'older']);
    for (const [row, record] of rows().map((row, index) => [row, [newer, older][index]] as const)) {
      expect(row.querySelector('time')?.getAttribute('datetime')).toBe(record.createdAt);
      expect(row.textContent).toContain(record.result.severityLabel);
      expect(row.textContent).toContain(`امتیاز: ${new LatinToPersianNumbersPipe().transform(record.totalScore)} از ۲۷`);
    }
    expect(localStorage.getItem(key)).toBe(originalBytes);

    (history().querySelector('[data-record-id="older"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const detail = fixture.nativeElement.querySelector('.detail-view') as HTMLElement;
    expect(detail.querySelector('time')?.getAttribute('datetime')).toBe(older.createdAt);
    const answers = Array.from(detail.querySelectorAll('.detail-answers li')) as HTMLElement[];
    expect(answers.length).toBe(9);
    answers.forEach((item, index) => {
      expect(item.textContent).toContain(PHQ9_QUESTIONS[index]);
      expect(item.textContent).toContain(`پاسخ: ${new LatinToPersianNumbersPipe().transform(older.answers[index])}`);
      expect(item.textContent).toContain(PHQ9_ANSWER_CHOICES[older.answers[index]].label);
    });
    expect(detail.textContent).toContain('۱۲');
    expect(detail.textContent).toContain(older.result.severityLabel);
    expect(detail.textContent).toContain(older.result.recommendation);
    expect(Array.from(detail.querySelectorAll('.detail-warning')).map((item) => item.textContent?.trim()))
      .toEqual(older.result.warnings);
    button('بازگشت به تاریخچه').click();
    fixture.detectChanges();
    expect(rows().map((row) => row.getAttribute('data-record-id'))).toEqual(['newer', 'older']);
    expect(localStorage.getItem(key)).toBe(originalBytes);

    (history().querySelector('[data-record-id="older"] .history-delete') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rows().length).toBe(2);
    expect(localStorage.getItem(key)).toBe(originalBytes);
    (history().querySelector('.delete-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rows().map((row) => row.getAttribute('data-record-id'))).toEqual(['newer']);
    expect(storedRecords()).toEqual([newer]);

    button('بازگشت به آزمون').click();
    fixture.detectChanges();
    button('تاریخچه آزمون‌ها').click();
    fixture.detectChanges();
    expect(rows().map((row) => row.getAttribute('data-record-id'))).toEqual(['newer']);
    expect(storedRecords()).toEqual([newer]);

    (history().querySelector('.history-clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(storedRecords()).toEqual([newer]);
    (history().querySelector('.clear-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(history().textContent).toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
    expect(history().querySelector('.history-list')).toBeNull();
    expect(history().querySelector('.history-clear')).toBeNull();
    expect(storedRecords()).toEqual([]);
    expect(localStorage.getItem(key)).toBe('{"schemaVersion":1,"records":[]}');

    button('بازگشت به آزمون').click();
    fixture.detectChanges();
    button('تاریخچه آزمون‌ها').click();
    fixture.detectChanges();
    expect(history().textContent).toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
    expect(storedRecords()).toEqual([]);
  });
});
