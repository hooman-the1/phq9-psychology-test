import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY } from './phq9-assessment-record';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('Persian presentation', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;

  beforeEach(async () => {
    localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY);
  });

  it('uses RTL and Persian digits for question text and accessible progress', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('main')?.getAttribute('dir')).toBe('rtl');
    expect(root.querySelector('#questionnaire-title bdi')?.textContent).toBe('PHQ-9');
    expect(root.querySelector('.question')?.textContent).toContain('\u06f1.');
    expect(root.querySelector('progress')?.getAttribute('aria-label')).toContain('\u06f1 \u0627\u0632 \u06f9');
    expect(root.querySelector('progress')?.getAttribute('value')).toBe('1');
    fixture.componentInstance.currentQuestionIndex = 8;
    fixture.detectChanges();
    expect(root.querySelector('.question')?.textContent).toContain('\u06f9.');
    expect(root.querySelector('progress')?.getAttribute('aria-label')).toContain('\u06f9 \u0627\u0632 \u06f9');
  });

  it('shows Persian score extremes while preserving numeric meter attributes', () => {
    const root: HTMLElement = fixture.nativeElement;
    for (const [answer, visible, semantic] of [[0, '\u06f0', '0'], [3, '\u06f2\u06f7', '27']] as const) {
      fixture.componentInstance.restartAssessment();
      fixture.componentInstance.answers.fill(answer);
      fixture.componentInstance.submitAssessment();
      fixture.detectChanges();
      expect(root.querySelector('.result-total')?.textContent).toContain(visible);
      expect(root.querySelector('.gauge-caption')?.textContent).toContain(visible);
      expect(root.querySelector('[role="meter"]')?.getAttribute('aria-valuenow')).toBe(semantic);
      expect(root.querySelector('[role="meter"]')?.getAttribute('aria-valuetext')).toContain(visible);
    }
  });

  it('shows Persian dates, row numbers, detail answers, and confirmation scores', () => {
    const root: HTMLElement = fixture.nativeElement;
    root.style.width = '375px';
    fixture.componentInstance.answers.fill(3);
    fixture.componentInstance.submitAssessment();
    fixture.detectChanges();
    fixture.componentInstance.openHistory();
    fixture.detectChanges();
    const row = root.querySelector('.history-list li') as HTMLElement;
    expect(row.querySelector('h2')?.textContent).toContain('\u06f1');
    expect(getComputedStyle(row, '::marker').content).toBe('"\u06f1. "');
    expect(row.querySelector('time')?.textContent).not.toMatch(/[0-9]/);
    expect(row.querySelector('time')?.getAttribute('datetime')).toMatch(/[0-9]/);
    expect(row.textContent).toContain('\u06f2\u06f7');
    expect(row.querySelector('button')?.getAttribute('aria-label')).toContain('\u06f1');
    (row.querySelector('.history-delete') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('#delete-description')?.textContent).toContain('\u06f2\u06f7');
    fixture.componentInstance.cancelDelete();
    fixture.componentInstance.openDetail(fixture.componentInstance.historyRecords[0].id);
    fixture.detectChanges();
    expect(root.querySelector('.detail-answers li')?.textContent).toContain('\u06f3 \u2014');
    const detailRows = root.querySelectorAll('.detail-answers li');
    expect(getComputedStyle(detailRows[0], '::marker').content).toBe('"\u06f1. "');
    expect(getComputedStyle(detailRows[8], '::marker').content).toBe('"\u06f9. "');
  });

  it('renders a test-only mixed Persian sample with an isolated Latin token', () => {
    const root: HTMLElement = fixture.nativeElement;
    const sample = document.createElement('p');
    sample.dir = 'rtl';
    sample.innerHTML = '\u0622\u0632\u0645\u0648\u0646 \u06f9\u061f (<bdi dir="ltr">PHQ-9</bdi>) \ud83d\ude42';
    root.append(sample);
    expect(getComputedStyle(sample).direction).toBe('rtl');
    expect(getComputedStyle(sample.querySelector('bdi')!).direction).toBe('ltr');
    expect(sample.textContent).toBe('\u0622\u0632\u0645\u0648\u0646 \u06f9\u061f (PHQ-9) \ud83d\ude42');
    expect(sample.textContent).not.toContain('\ufffd');
  });

  it('keeps answer controls and result actions inside 375px and 1280px widths', () => {
    const root: HTMLElement = fixture.nativeElement;
    for (const width of [375, 1280]) {
      root.style.width = `${width}px`;
      fixture.detectChanges();
      const main = root.querySelector('main') as HTMLElement;
      expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth);
      for (const label of Array.from(root.querySelectorAll('label'))) {
        expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
      }
      fixture.componentInstance.answers.fill(3);
      fixture.componentInstance.submitAssessment();
      fixture.detectChanges();
      expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth);
      for (const button of Array.from(root.querySelectorAll('.result-card button'))) {
        expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(main.getBoundingClientRect().right);
      }
      fixture.componentInstance.restartAssessment();
      fixture.detectChanges();
    }
  });
});
