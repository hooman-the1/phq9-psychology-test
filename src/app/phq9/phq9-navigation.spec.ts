import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';
import { PHQ9_ANSWER_CHOICES, PHQ9_QUESTIONS } from './phq9-questionnaire';

describe('PHQ-9 question navigation', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Phq9ShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function controls(): HTMLButtonElement[] {
    return Array.from(element().querySelectorAll('.button-group button'));
  }

  function choices(): HTMLInputElement[] {
    return Array.from(element().querySelectorAll('input[type="radio"]'));
  }

  function expectPosition(index: number): void {
    const question = element().querySelector('.question') as HTMLElement;
    const progress = element().querySelector('progress') as HTMLProgressElement;

    expect(question.textContent?.trim()).toBe(`${index + 1}. ${PHQ9_QUESTIONS[index]}`);
    expect(progress.value).toBe(index + 1);
    expect(progress.max).toBe(PHQ9_QUESTIONS.length);
    expect(progress.getAttribute('aria-label')).toBe(
      `سؤال ${index + 1} از ${PHQ9_QUESTIONS.length}`,
    );
    expect(choices().length).toBe(PHQ9_ANSWER_CHOICES.length);
    expect(element().querySelectorAll('.question').length).toBe(1);
  }

  it('starts at question one with only its four choices and a disabled Previous control', () => {
    expectPosition(0);
    expect(controls().length).toBe(2);
    expect(controls()[0].disabled).toBeTrue();
    expect(controls()[1].textContent?.trim()).toBe('بعدی');

    controls()[0].click();
    fixture.componentInstance.previousQuestion();
    fixture.detectChanges();
    expectPosition(0);
  });

  it('advances one question per click through every forward transition without answers', () => {
    for (let index = 1; index < PHQ9_QUESTIONS.length; index++) {
      controls()[1].click();
      fixture.detectChanges();
      expectPosition(index);
      expect(fixture.componentInstance.answers.every((answer) => answer === null)).toBeTrue();
    }

    expect(controls().length).toBe(2);
    expect(controls()[0].disabled).toBeFalse();
    expect(controls()[1].textContent?.trim()).toBe('Submit');
    expect(controls().some((control) => control.textContent?.trim() === 'بعدی')).toBeFalse();
    expect(fixture.componentInstance.submitted).toBeFalse();
    expect(fixture.componentInstance.validationResult).toBeNull();
    expect(fixture.componentInstance.validationErrors.size).toBe(0);

    fixture.componentInstance.nextQuestion();
    fixture.detectChanges();
    expectPosition(PHQ9_QUESTIONS.length - 1);
  });

  it('moves back one question per click through every backward transition without answers', () => {
    for (let index = 1; index < PHQ9_QUESTIONS.length; index++) {
      controls()[1].click();
      fixture.detectChanges();
    }

    for (let index = PHQ9_QUESTIONS.length - 2; index >= 0; index--) {
      controls()[0].click();
      fixture.detectChanges();
      expectPosition(index);
    }

    expect(controls()[0].disabled).toBeTrue();
    expect(fixture.componentInstance.answers.every((answer) => answer === null)).toBeTrue();
    expect(fixture.componentInstance.submitted).toBeFalse();
  });

  it('retains answer zero and changes only the displayed question when returning', () => {
    choices()[0].click();
    fixture.detectChanges();
    expect(choices()[0].checked).toBeTrue();

    controls()[1].click();
    fixture.detectChanges();
    expect(choices().every((choice) => !choice.checked)).toBeTrue();
    expect(choices().map((choice) => Number(choice.value))).toEqual(
      PHQ9_ANSWER_CHOICES.map((choice) => choice.value),
    );

    choices()[3].click();
    fixture.detectChanges();
    expect(choices()[3].checked).toBeTrue();
    expect(fixture.componentInstance.answers).toEqual([0, 3, null, null, null, null, null, null, null]);

    controls()[0].click();
    fixture.detectChanges();
    expect(choices()[0].checked).toBeTrue();
    choices()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.answers).toEqual([1, 3, null, null, null, null, null, null, null]);

    controls()[1].click();
    fixture.detectChanges();
    expect(choices()[3].checked).toBeTrue();
  });
});
