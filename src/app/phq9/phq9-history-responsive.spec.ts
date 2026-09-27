import { TestBed } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY, Phq9AssessmentRecord } from './phq9-assessment-record';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 responsive history and detail', () => {
  const widths = [320, 375, 768, 1280];
  const longText = 'توصیه و توضیح طولانی برای بررسی نمایش متن فارسی در عرض کم '.repeat(5);
  const record = (id: string, createdAt: string): Phq9AssessmentRecord => ({
    id,
    createdAt,
    answers: Array(9).fill(3),
    totalScore: 27,
    severityCategory: 'severe',
    result: { severityLabel: longText, recommendation: longText, warnings: [longText] },
  });

  function store(records: unknown[]): void {
    localStorage.setItem(PHQ9_ASSESSMENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records }));
  }

  function fits(element: HTMLElement, container: HTMLElement, width: number): void {
    const bounds = container.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    expect(rect.left).withContext(`${width}px ${element.className || element.tagName} left`).toBeGreaterThanOrEqual(bounds.left - 1);
    expect(rect.right).withContext(`${width}px ${element.className || element.tagName} right`).toBeLessThanOrEqual(bounds.right + 1);
  }

  beforeEach(async () => {
    localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY));

  for (const width of widths) {
    it(`keeps long history rows and saved detail inside ${width}px`, () => {
      store([record('first', '2026-09-26T10:30:00.000Z'), record('second', '2026-09-25T10:30:00.000Z')]);
      const fixture = TestBed.createComponent(Phq9ShellComponent);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = `${width}px`;
      fixture.detectChanges();
      fixture.componentInstance.openHistory();
      fixture.detectChanges();

      const history = host.querySelector('.history-view') as HTMLElement;
      expect(history.querySelectorAll('.history-list > li').length).toBe(2);
      expect(host.scrollWidth).toBeLessThanOrEqual(width);
      for (const item of Array.from(history.querySelectorAll<HTMLElement>('.history-list > li'))) {
        for (const part of Array.from(item.querySelectorAll<HTMLElement>('h2, p, time, button'))) fits(part, item, width);
        expect(item.getAttribute('data-list-number')).toMatch(/[۱۲]/);
      }
      fixture.componentInstance.openDetail('first');
      fixture.detectChanges();

      const detail = host.querySelector('.detail-view') as HTMLElement;
      expect(detail.querySelectorAll('.detail-answers > li').length).toBe(9);
      expect(detail.querySelectorAll('.detail-warning').length).toBe(1);
      expect(host.scrollWidth).toBeLessThanOrEqual(width);
      for (const part of Array.from(detail.querySelectorAll<HTMLElement>('p, time, li, button'))) fits(part, detail, width);
      fixture.destroy();
    });

    it(`keeps empty and partial history messages readable at ${width}px`, () => {
      const fixture = TestBed.createComponent(Phq9ShellComponent);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = `${width}px`;
      fixture.detectChanges();
      fixture.componentInstance.openHistory();
      fixture.detectChanges();
      const empty = host.querySelector('.history-empty') as HTMLElement;
      expect(empty.textContent?.trim()).toBeTruthy();
      fits(empty, host.querySelector('.history-view') as HTMLElement, width);

      store([record('valid', '2026-09-26T10:30:00.000Z'), { id: 'invalid' }]);
      fixture.componentInstance.openHistory();
      fixture.detectChanges();
      const history = host.querySelector('.history-view') as HTMLElement;
      const notice = history.querySelector('.validation-summary') as HTMLElement;
      expect(notice.textContent?.trim()).toBeTruthy();
      fits(notice, history, width);
      fits(history.querySelector('.button-group button') as HTMLElement, history, width);
      expect(host.scrollWidth).toBeLessThanOrEqual(width);
      fixture.destroy();
    });
  }
});
