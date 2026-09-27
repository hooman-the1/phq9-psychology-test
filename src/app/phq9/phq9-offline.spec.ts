import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY } from './phq9-assessment-record';
import { Phq9AssessmentStorage } from './phq9-assessment-storage';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 offline assessment flow', () => {
  beforeEach(async () => {
    localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });
  afterEach(() => localStorage.removeItem(PHQ9_ASSESSMENT_STORAGE_KEY));

  it('loads, navigates, and submits locally when assessment requests cannot start', () => {
    const fetchRequest = spyOn(window, 'fetch').and.throwError('Network unavailable');
    const xhrOpen = spyOn(XMLHttpRequest.prototype, 'open').and.throwError('Network unavailable');
    const storageWrite = spyOn(Storage.prototype, 'setItem').and.callThrough();
    const fixture = createQuestionnaire();
    const component = fixture.componentInstance;

    expect(component.questions.length).toBe(9);
    expect(fixture.nativeElement.querySelectorAll('input[type="radio"]').length).toBe(4);

    for (let question = 0; question < 9; question++) {
      const choices = fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
      choices[question % 4].click();
      fixture.detectChanges();
      if (question < 8) {
        component.nextQuestion();
        fixture.detectChanges();
      }
    }

    component.previousQuestion();
    fixture.detectChanges();
    component.nextQuestion();
    fixture.detectChanges();
    expect(component.answers).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0]);
    expect((fixture.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>)[0].checked).toBeTrue();

    expect(component.submitAssessment().isValid).toBeTrue();
    fixture.detectChanges();
    const result = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
    expect(result.querySelector('.result-total')?.textContent).toContain('۱۲');
    expect(result.querySelector('.result-severity')?.textContent).toContain('افسردگی متوسط');
    expect(result.querySelector('.result-recommendation')?.textContent).toContain('صحبت با یک روانشناس یا مشاور توصیه می‌شود.');
    expect(result.querySelector('.result-gauge')?.getAttribute('aria-valuenow')).toBe('12');
    expect(fetchRequest).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
    expect(storageWrite).toHaveBeenCalledTimes(1);
    expect(storageWrite.calls.mostRecent().args[0]).toBe(PHQ9_ASSESSMENT_STORAGE_KEY);
    const saved = new Phq9AssessmentStorage().read();
    expect(saved.ok).toBeTrue();
    if (saved.ok) expect(saved.records[0].answers).toEqual(component.answers as number[]);
  });

  it('keeps invalid submissions local and clears an earlier result', () => {
    const fetchRequest = spyOn(window, 'fetch').and.throwError('Network unavailable');
    const xhrOpen = spyOn(XMLHttpRequest.prototype, 'open').and.throwError('Network unavailable');
    const fixture = createQuestionnaire();
    const component = fixture.componentInstance;

    component.answers.fill(2);
    expect(component.submitAssessment().isValid).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).not.toBeNull();

    component.answers[4] = null;
    expect(component.submitAssessment().isValid).toBeFalse();
    fixture.detectChanges();
    expect(component.validationErrors.has(4)).toBeTrue();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();

    component.answers[4] = 4;
    expect(component.submitAssessment().isValid).toBeFalse();
    fixture.detectChanges();
    expect(component.score).toBeNull();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
    expect(fetchRequest).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
  });

  it('can recreate the questionnaire without a session or backend', () => {
    const fetchRequest = spyOn(window, 'fetch').and.throwError('Network unavailable');
    const xhrOpen = spyOn(XMLHttpRequest.prototype, 'open').and.throwError('Network unavailable');
    const storageWrite = spyOn(Storage.prototype, 'setItem').and.callThrough();
    const first = createQuestionnaire();
    first.componentInstance.answers.fill(1);
    first.componentInstance.submitAssessment();
    first.destroy();

    const second = createQuestionnaire();
    expect(second.nativeElement.querySelectorAll('input[type="radio"]').length).toBe(4);
    expect(second.componentInstance.answers).toEqual(Array(9).fill(null));
    expect(second.nativeElement.querySelector('.result-card')).toBeNull();
    expect(fetchRequest).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
    expect(storageWrite).toHaveBeenCalledTimes(1);
    const saved = new Phq9AssessmentStorage().read();
    expect(saved.ok).toBeTrue();
    if (saved.ok) expect(saved.records.length).toBe(1);
  });
});

function createQuestionnaire(): ComponentFixture<Phq9ShellComponent> {
  const fixture = TestBed.createComponent(Phq9ShellComponent);
  fixture.detectChanges();
  return fixture;
}
