import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY, Phq9AssessmentRecord } from './phq9-assessment-record';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 history', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;

  const record = (id: string, createdAt: string, totalScore = 0): Phq9AssessmentRecord => ({
    id,
    createdAt,
    answers: totalScore === 27 ? Array(9).fill(3) : Array(9).fill(0),
    totalScore,
    severityCategory: totalScore === 27 ? 'severe' : 'minimal',
    result: {
      severityLabel: totalScore === 27 ? 'افسردگی شدید' : 'حداقل افسردگی',
      recommendation: 'توصیه ذخیره‌شده',
      warnings: [],
    },
  });

  const store = (records: unknown[]): void => {
    localStorage.setItem(PHQ9_ASSESSMENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records }));
  };

  const button = (label: string): HTMLButtonElement => {
    const found = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[])
      .find((candidate) => candidate.textContent?.trim() === label);
    expect(found).withContext(`Missing button: ${label}`).toBeDefined();
    return found!;
  };

  const openHistory = (): HTMLElement => {
    button('تاریخچه آزمون‌ها').click();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.history-view') as HTMLElement;
  };

  beforeEach(async () => {
    localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY);
  });

  it('shows records newest first, with a deterministic tie order and complete accessible text', () => {
    store([
      record('older', '2026-09-24T09:00:00.000Z'),
      record('same-a', '2026-09-26T10:30:00.000Z', 27),
      record('same-b', '2026-09-26T10:30:00.000Z', 27),
    ]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    const bytes = localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY);
    const write = spyOn(localStorage, 'setItem').and.callThrough();

    const history = openHistory();
    const items = Array.from(history.querySelectorAll('li')) as HTMLElement[];
    expect(history.querySelector('h1')?.textContent).toContain('تاریخچه');
    expect(items.length).toBe(3);
    expect(items.map((item) => item.getAttribute('data-record-id'))).toEqual(['same-a', 'same-b', 'older']);
    for (const [item, expected] of items.map((item, index) => [item, [
      record('same-a', '2026-09-26T10:30:00.000Z', 27),
      record('same-b', '2026-09-26T10:30:00.000Z', 27),
      record('older', '2026-09-24T09:00:00.000Z'),
    ][index]] as const)) {
      expect(item.querySelector('time')?.getAttribute('datetime')).toBe(expected.createdAt);
      expect(item.querySelector('time')?.textContent?.trim()).toBeTruthy();
      expect(item.textContent).toContain(`امتیاز: ${expected.totalScore === 27 ? '۲۷' : '۰'} از ۲۷`);
      expect(item.textContent).toContain(expected.result.severityLabel);
    }
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)).toBe(bytes);
  });

  for (const raw of [null, '{"schemaVersion":1,"records":[]}']) {
    it(`shows an explicit empty state without writes for ${raw === null ? 'a missing key' : 'an empty v1 envelope'}`, () => {
      if (raw !== null) localStorage.setItem(PHQ9_ASSESSMENT_STORAGE_KEY, raw);
      fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.detectChanges();
      const write = spyOn(localStorage, 'setItem').and.callThrough();
      let history = openHistory();
      expect(history.querySelector('.history-list')).toBeNull();
      expect(history.querySelector('.history-delete')).toBeNull();
      expect(history.querySelector('.history-clear')).toBeNull();
      expect(history.textContent).toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
      expect(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)).toBe(raw);
      button('بازگشت به آزمون').click();
      fixture.detectChanges();
      history = openHistory();
      expect(history.textContent).toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
      expect(write).not.toHaveBeenCalled();
      expect(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)).toBe(raw);
    });
  }

  it('retains valid records and announces skipped invalid and duplicate entries', () => {
    const valid = record('valid', '2026-09-26T10:30:00.000Z');
    store([valid, { id: 'bad' }, valid]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();

    const history = openHistory();
    expect(history.querySelectorAll('li').length).toBe(1);
    expect(history.querySelector('[role="alert"]')?.textContent).toContain('بارگذاری نشدند');
    expect(history.textContent).not.toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
  });

  it('shows both a skipped-entry notice and empty state if no records survive', () => {
    store([{ id: 'bad' }]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();

    const history = openHistory();
    expect(history.querySelector('[role="alert"]')?.textContent).toContain('بارگذاری نشدند');
    expect(history.textContent).toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
  });

  for (const raw of ['{broken', JSON.stringify({ schemaVersion: 2, records: [] })]) {
    it(`distinguishes unreadable storage from an empty history: ${raw}`, () => {
      localStorage.setItem(PHQ9_ASSESSMENT_STORAGE_KEY, raw);
      fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.detectChanges();
      const history = openHistory();
      expect(history.querySelector('[role="alert"]')?.textContent).toContain('بارگذاری نشد');
      expect(history.textContent).not.toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
      expect(localStorage.getItem(PHQ9_ASSESSMENT_STORAGE_KEY)).toBe(raw);
    });
  }

  it('handles a browser storage read failure', () => {
    spyOn(localStorage, 'getItem').and.throwError('blocked');
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    const history = openHistory();
    expect(history.querySelector('[role="alert"]')?.textContent).toContain('بارگذاری نشد');
    expect(history.textContent).not.toContain('هنوز آزمونی در تاریخچه ذخیره نشده است');
  });

  it('re-reads records after recreating the shell, as on refresh', () => {
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    store([record('later', '2026-09-26T10:30:00.000Z')]);
    fixture.destroy();
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    expect(openHistory().querySelectorAll('li').length).toBe(1);
  });

  it('re-reads records on each entry and moves focus to the view and back to its action', fakeAsync(() => {
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    expect(openHistory().querySelectorAll('li').length).toBe(0);
    tick();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#history-title'));

    store([record('later', '2026-09-26T10:30:00.000Z')]);
    button('بازگشت به آزمون').click();
    fixture.detectChanges();
    tick();
    expect(document.activeElement).toBe(button('تاریخچه آزمون‌ها'));
    expect(openHistory().querySelectorAll('li').length).toBe(1);
    tick();
  }));

  it('round-trips questionnaire answers, position and validation without a save', () => {
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.answers[0] = 2;
    component.currentQuestionIndex = 3;
    component.validationErrors.add(3);
    component.validationResult = { isValid: false, missingQuestionIndices: [3] };
    fixture.detectChanges();
    const write = spyOn(localStorage, 'setItem').and.callThrough();

    openHistory();
    expect(fixture.nativeElement.querySelector('.question-card')).toBeNull();
    button('بازگشت به آزمون').click();
    fixture.detectChanges();
    expect(component.answers[0]).toBe(2);
    expect(component.currentQuestionIndex).toBe(3);
    expect(component.validationErrors.has(3)).toBeTrue();
    expect(component.validationResult?.missingQuestionIndices).toEqual([3]);
    expect(fixture.nativeElement.querySelector('.question-card')).not.toBeNull();
    expect(write).not.toHaveBeenCalled();
  });

  it('round-trips a completed result even when it could not be saved', () => {
    localStorage.setItem(PHQ9_ASSESSMENT_STORAGE_KEY, '{broken');
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    fixture.componentInstance.answers.fill(3);
    fixture.componentInstance.submitAssessment();
    fixture.detectChanges();
    expect(fixture.componentInstance.saveFailed).toBeTrue();

    openHistory();
    button('بازگشت به نتیجه').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.score?.total).toBe(27);
    expect(fixture.componentInstance.saveFailed).toBeTrue();
    expect(fixture.nativeElement.querySelector('.result-card')?.textContent).toContain('ذخیره نشد');
  });
});
