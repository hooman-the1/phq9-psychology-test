import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PHQ9_ASSESSMENT_STORAGE_KEY } from './phq9-assessment-record';
import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 assessment restart', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;
  const storageKey = PHQ9_ASSESSMENT_STORAGE_KEY;

  beforeEach(async () => {
    localStorage.removeItem(storageKey);
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(storageKey));

  function retakeButton(): HTMLButtonElement | null {
    return (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'انجام مجدد تست',
    ) ?? null;
  }

  function completeWith(answer: number): void {
    fixture.componentInstance.answers.fill(answer);
    expect(fixture.componentInstance.submitAssessment().isValid).toBeTrue();
    fixture.detectChanges();
  }

  it('offers retake only on a completed result and resets all answers, feedback, result, and focus', fakeAsync(() => {
    expect(retakeButton()).toBeNull();
    fixture.componentInstance.answers.fill(0);
    fixture.componentInstance.answers[3] = null;
    expect(fixture.componentInstance.submitAssessment().isValid).toBeFalse();
    fixture.detectChanges();
    expect(retakeButton()).toBeNull();

    completeWith(0);
    const button = retakeButton();
    expect(button).not.toBeNull();
    button!.click();
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.answers).toEqual(Array(9).fill(null));
    expect(fixture.componentInstance.currentQuestionIndex).toBe(0);
    expect(fixture.componentInstance.validationErrors.size).toBe(0);
    expect(fixture.componentInstance.validationResult).toBeNull();
    expect(fixture.componentInstance.score).toBeNull();
    expect(fixture.componentInstance.submitted).toBeFalse();
    expect(fixture.componentInstance.saveFailed).toBeFalse();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.validation-summary:not([hidden])')).toBeNull();
    expect(fixture.nativeElement.querySelector('.validation-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('progress')?.value).toBe(1);
    expect((fixture.nativeElement.querySelector('button[disabled]') as HTMLButtonElement).textContent).toContain('قبلی');
    expect(retakeButton()).toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#questionnaire-title'));

    for (let index = 0; index < 9; index++) {
      expect(fixture.nativeElement.querySelector('input[type="radio"]:checked')).toBeNull();
      if (index < 8) {
        fixture.componentInstance.nextQuestion();
        fixture.detectChanges();
      }
    }
    expect(fixture.componentInstance.submitAssessment().missingQuestionIndices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.validation-summary li').length).toBe(9);
    tick();
  }));

  it('preserves the first record, creates only one distinct second record, and supports another restart', fakeAsync(() => {
    completeWith(0);
    const firstBytes = localStorage.getItem(storageKey)!;
    const firstRecord = JSON.parse(firstBytes).records[0];
    const write = spyOn(localStorage, 'setItem').and.callThrough();

    retakeButton()!.click();
    fixture.detectChanges();
    tick();
    fixture.componentInstance.nextQuestion();
    fixture.componentInstance.submitAssessment();
    fixture.detectChanges();
    tick();
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBe(firstBytes);

    completeWith(3);
    const records = JSON.parse(localStorage.getItem(storageKey)!).records;
    expect(write).toHaveBeenCalledTimes(1);
    expect(records.length).toBe(2);
    expect(records[0]).toEqual(firstRecord);
    expect(records[1].id).not.toBe(firstRecord.id);
    expect(records[1].answers).toEqual(Array(9).fill(3));
    expect(records[1].totalScore).toBe(27);
    expect(fixture.nativeElement.querySelector('.result-total')?.textContent).toContain('27');

    const secondBytes = localStorage.getItem(storageKey);
    retakeButton()!.click();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.answers).toEqual(Array(9).fill(null));
    expect(localStorage.getItem(storageKey)).toBe(secondBytes);
    expect(write).toHaveBeenCalledTimes(1);
  }));

  it('restarts after a failed save without writing or losing the storage recovery notice', fakeAsync(() => {
    fixture.destroy();
    const badBytes = '{broken';
    localStorage.setItem(storageKey, badBytes);
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    completeWith(0);
    expect(fixture.nativeElement.querySelector('.result-card .validation-error')?.textContent).toContain('ذخیره نشد');
    const write = spyOn(localStorage, 'setItem').and.callThrough();

    retakeButton()!.click();
    fixture.detectChanges();
    tick();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.validation-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('.history-notice')?.textContent).toContain('تاریخچه ذخیره‌شده');
    expect(fixture.componentInstance.answers).toEqual(Array(9).fill(null));
    expect(localStorage.getItem(storageKey)).toBe(badBytes);
    expect(write).not.toHaveBeenCalled();
  }));

  it('restarts when storage reads throw and keeps the new questionnaire usable', fakeAsync(() => {
    fixture.destroy();
    spyOn(localStorage, 'getItem').and.throwError('blocked');
    const write = spyOn(localStorage, 'setItem');
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    completeWith(1);
    expect(fixture.nativeElement.querySelector('.result-card .validation-error')).not.toBeNull();

    retakeButton()!.click();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.answers).toEqual(Array(9).fill(null));
    expect(fixture.nativeElement.querySelector('.questionnaire')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.history-notice')).not.toBeNull();
    expect(write).not.toHaveBeenCalled();
    fixture.componentInstance.selectAnswer(0);
    expect(fixture.componentInstance.answers[0]).toBe(0);
  }));
});
