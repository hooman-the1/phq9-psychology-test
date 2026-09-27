import { TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 visual structure', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });

  it('places the introduction, question, answers, actions, and progress inside the inset card', () => {
    const fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
    const outer = fixture.nativeElement.querySelector('.assessment-view') as HTMLElement;
    const inner = outer.querySelector('.question-card') as HTMLElement;
    expect(inner).not.toBeNull();
    const children = Array.from(inner.children);
    const positions = ['.intro-text', '.rule', '.question', 'fieldset', '.assessment-actions', 'progress']
      .map((selector) => children.findIndex((child) => child.matches(selector)));
    expect(positions.every((position) => position >= 0)).toBeTrue();
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(inner.querySelectorAll('input[type="radio"]').length).toBe(4);
    expect(getComputedStyle(outer).maxWidth).toBe('600px');
    expect(getComputedStyle(inner).paddingTop).toBe('20px');
    const progress = inner.querySelector('progress') as HTMLProgressElement;
    expect(progress.value).toBe(1);
    expect(progress.max).toBe(9);
    fixture.componentInstance.currentQuestionIndex = 8;
    fixture.detectChanges();
    expect(progress.value).toBe(9);
    expect(inner.querySelector('.submit-action')).not.toBeNull();
    fixture.componentInstance.submitAssessment();
    fixture.detectChanges();
    expect(inner.querySelector('.validation-error')).not.toBeNull();
    expect(outer.querySelector('.validation-summary')?.getAttribute('hidden')).toBeNull();
  });

  for (const answer of [0, 3]) {
    it(`keeps the result order and full-width restart action for answer ${answer}`, () => {
      const fixture = TestBed.createComponent(Phq9ShellComponent);
      fixture.componentInstance.answers.fill(answer);
      fixture.componentInstance.submitAssessment();
      fixture.detectChanges();
      const result = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
      const elements = ['.result-total', '.result-severity', '.result-recommendation', '.result-gauge', '.gauge-caption', '.restart-action']
        .map((selector) => result.querySelector(selector) as HTMLElement);
      expect(elements.every(Boolean)).toBeTrue();
      for (let index = 1; index < elements.length; index++) {
        expect(elements[index - 1].compareDocumentPosition(elements[index]) & Node.DOCUMENT_POSITION_FOLLOWING)
          .toBeTruthy();
      }
      expect(elements[5].getAttribute('type')).toBe('button');
      expect(getComputedStyle(elements[5]).width).toBe(getComputedStyle(elements[5].parentElement!).width);
    });
  }
});
