import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY, Phq9AssessmentRecord } from './phq9-assessment-record';
import { Phq9ShellComponent } from './phq9-shell.component';
import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';
import { PHQ9_ANSWER_CHOICES, PHQ9_QUESTIONS } from './phq9-questionnaire';

describe('saved assessment detail', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;
  const key = PHQ9_ASSESSMENT_STORAGE_KEY;
  const first: Phq9AssessmentRecord = {
    id: 'first', createdAt: '2026-09-25T10:30:00.000Z',
    answers: [0, 1, 2, 3, 0, 1, 2, 3, 0], totalScore: 12, severityCategory: 'moderate',
    result: { severityLabel: 'Saved category', recommendation: 'Old advice', warnings: [] },
  };
  const second: Phq9AssessmentRecord = {
    id: 'second', createdAt: '2026-09-26T10:30:00.000Z',
    answers: Array(9).fill(3), totalScore: 27, severityCategory: 'severe',
    result: { severityLabel: 'Another category', recommendation: 'Another advice', warnings: ['Warning one', 'Warning two'] },
  };

  function store(records: Phq9AssessmentRecord[]): void {
    localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, records }));
  }

  function openHistory(): void {
    const action = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'تاریخچه آزمون‌ها',
    ) as HTMLButtonElement;
    action.click();
    fixture.detectChanges();
  }

  function openRow(id: string): HTMLElement {
    const action = fixture.nativeElement.querySelector(`[data-record-id="${id}"] button`) as HTMLButtonElement;
    expect(action).toBeTruthy();
    expect(action.getAttribute('aria-label')).toBeTruthy();
    action.click();
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.detail-view') as HTMLElement;
  }

  beforeEach(async () => {
    localStorage.removeItem(key);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    localStorage.removeItem(key);
  });

  it('shows each selected record using saved answer values and result copy without writes', fakeAsync(() => {
    store([first, second]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    fixture.componentInstance.answers[0] = 2;
    fixture.componentInstance.currentQuestionIndex = 4;
    const bytes = localStorage.getItem(key);
    const write = spyOn(localStorage, 'setItem').and.callThrough();
    openHistory();

    let detail = openRow('first');
    tick();
    expect(document.activeElement).toBe(detail.querySelector('h1'));
    expect(detail.querySelector('time')?.getAttribute('datetime')).toBe(first.createdAt);
    const answers = Array.from(detail.querySelectorAll('.detail-answers li')) as HTMLElement[];
    expect(answers.length).toBe(9);
    answers.forEach((item, index) => {
      expect(item.textContent).toContain(PHQ9_QUESTIONS[index]);
      expect(item.textContent).toContain(new LatinToPersianNumbersPipe().transform(first.answers[index]) as string);
      expect(item.textContent).toContain(PHQ9_ANSWER_CHOICES[first.answers[index]].label);
    });
    expect(detail.textContent).toContain('۱۲');
    expect(detail.textContent).toContain('Saved category');
    expect(detail.textContent).toContain('Old advice');
    expect(detail.textContent).not.toContain('Warning one');
    expect(detail.querySelectorAll('.detail-warning').length).toBe(0);
    expect(detail.querySelectorAll('input, select, textarea, form').length).toBe(0);
    expect(detail.querySelectorAll('button').length).toBe(1);

    (detail.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-record-id="first"] button'));
    expect(Array.from(fixture.nativeElement.querySelectorAll('.history-list li') as NodeListOf<HTMLElement>).map((item) => item.getAttribute('data-record-id')))
      .toEqual(['second', 'first']);

    detail = openRow('second');
    expect(detail.textContent).toContain('Another category');
    expect(detail.textContent).toContain('Another advice');
    expect(detail.textContent).not.toContain('Old advice');
    expect(Array.from(detail.querySelectorAll('.detail-warning')).map((item: Element) => item.textContent?.trim()))
      .toEqual(['Warning one', 'Warning two']);
    expect(localStorage.getItem(key)).toBe(bytes);
    expect(write).not.toHaveBeenCalled();
    expect(fixture.componentInstance.answers[0]).toBe(2);
    expect(fixture.componentInstance.currentQuestionIndex).toBe(4);
    tick();
  }));

  it('re-reads by ID and handles a record removed after the list loads', fakeAsync(() => {
    store([first, second]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    openHistory();
    store([second]);
    const detail = openRow('first');
    expect(detail.textContent).toContain('دیگر');
    expect(detail.textContent).not.toContain('Old advice');
    (detail.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(Array.from(fixture.nativeElement.querySelectorAll('.history-list li') as NodeListOf<HTMLElement>).map((item) => item.getAttribute('data-record-id')))
      .toEqual(['second']);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#history-title'));
  }));

  it('does not display stale detail when storage becomes unreadable', fakeAsync(() => {
    store([first]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    openHistory();
    localStorage.setItem(key, '{broken');
    const detail = openRow('first');
    expect(detail.textContent).not.toContain('Old advice');
    expect(detail.querySelector('[role="alert"]')?.textContent).toContain('بارگذاری نشد');
    (detail.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(fixture.nativeElement.querySelector('.history-view [role="alert"]')).toBeTruthy();
  }));

  it('keeps detail empty when a storage read throws, then lets the user return', fakeAsync(() => {
    store([first]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    openHistory();
    const read = spyOn(localStorage, 'getItem').and.throwError('blocked');
    const detail = openRow('first');
    expect(detail.textContent).not.toContain('Old advice');
    expect(detail.querySelector('[role="alert"]')?.textContent).toContain('بارگذاری نشد');
    (detail.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick();
    expect(fixture.nativeElement.querySelector('.history-view [role="alert"]')).toBeTruthy();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#history-title'));
    expect(read).toHaveBeenCalled();
  }));

  it('returns through history to the unchanged current result', () => {
    store([first]);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    fixture.componentInstance.answers.fill(3);
    fixture.componentInstance.submitAssessment();
    fixture.detectChanges();
    const score = fixture.componentInstance.score;
    openHistory();
    const detail = openRow('first');
    (detail.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const back = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'بازگشت به نتیجه',
    ) as HTMLButtonElement;
    back.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.score).toBe(score);
    expect(fixture.componentInstance.answers).toEqual(Array(9).fill(3));
    expect(fixture.nativeElement.querySelector('.result-card')).toBeTruthy();
  });
});
