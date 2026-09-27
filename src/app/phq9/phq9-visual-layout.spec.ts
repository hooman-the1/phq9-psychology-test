import { TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 visual structure', () => {
  const widths = [320, 375, 768, 1280];

  function expectFitsWidth(container: HTMLElement, width: number): void {
    const bounds = container.getBoundingClientRect();
    expect(container.scrollWidth).withContext(`${width}px horizontal overflow`).toBeLessThanOrEqual(width);
    for (const element of Array.from(container.querySelectorAll<HTMLElement>('h1, p, fieldset, label, input, button, progress, svg, .validation-summary'))) {
      const rect = element.getBoundingClientRect();
      expect(rect.left).withContext(`${width}px ${element.tagName} left`).toBeGreaterThanOrEqual(bounds.left - 1);
      expect(rect.right).withContext(`${width}px ${element.tagName} right`).toBeLessThanOrEqual(bounds.right + 1);
    }
  }

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

  for (const width of widths) {
    it(`fits the active assessment and validation at ${width}px`, () => {
      const fixture = TestBed.createComponent(Phq9ShellComponent);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = `${width}px`;
      fixture.componentInstance.currentQuestionIndex = 7;
      fixture.detectChanges();
      expectFitsWidth(host, width);
      const card = host.querySelector('.question-card') as HTMLElement;
      const choices = Array.from(card.querySelectorAll('label'));
      expect(choices.length).toBe(4);
      expect(choices.every((choice, index) => index === 0 || choice.getBoundingClientRect().top >= choices[index - 1].getBoundingClientRect().bottom))
        .withContext(`${width}px choices overlap`).toBeTrue();
      expect(card.getBoundingClientRect().left).toBeGreaterThan(host.getBoundingClientRect().left);
      expect(card.getBoundingClientRect().right).toBeLessThan(host.getBoundingClientRect().right);
      (choices[3].querySelector('input') as HTMLInputElement).click();
      expect(fixture.componentInstance.answers[7]).toBe(3);
      fixture.componentInstance.currentQuestionIndex = 8;
      fixture.componentInstance.submitAssessment();
      fixture.detectChanges();
      expectFitsWidth(host, width);
      const summary = card.querySelector('.validation-summary') as HTMLElement;
      const question = card.querySelector('.question') as HTMLElement;
      expect(summary.getBoundingClientRect().bottom).toBeLessThanOrEqual(question.getBoundingClientRect().top);
      if (width >= 768) expect(host.querySelector('.assessment-view')!.getBoundingClientRect().width).toBeLessThanOrEqual(600);
      fixture.destroy();
    });

    for (const answer of [0, 3]) {
      it(`fits the score ${answer * 9} result at ${width}px`, () => {
        const fixture = TestBed.createComponent(Phq9ShellComponent);
        const host = fixture.nativeElement as HTMLElement;
        host.style.width = `${width}px`;
        fixture.componentInstance.answers.fill(answer);
        fixture.componentInstance.submitAssessment();
        fixture.detectChanges();
        expectFitsWidth(host, width);
        const card = host.querySelector('.result-card') as HTMLElement;
        const gauge = card.querySelector('.result-gauge') as HTMLElement;
        expect(gauge.getBoundingClientRect().width).toBeLessThanOrEqual(220);
        expect(gauge.getBoundingClientRect().left).toBeGreaterThanOrEqual(card.getBoundingClientRect().left);
        expect(gauge.getBoundingClientRect().right).toBeLessThanOrEqual(card.getBoundingClientRect().right);
        if (width >= 768) expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(600);
        fixture.destroy();
      });
    }
  }

  it('preserves the active answer and result while the available width changes', () => {
    const fixture = TestBed.createComponent(Phq9ShellComponent);
    const host = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.currentQuestionIndex = 7;
    fixture.componentInstance.selectAnswer(2);
    for (const width of widths) {
      host.style.width = `${width}px`;
      fixture.detectChanges();
      expectFitsWidth(host, width);
      expect((host.querySelectorAll('input[type="radio"]')[2] as HTMLInputElement).checked).toBeTrue();
      expect((host.querySelector('progress') as HTMLProgressElement).value).toBe(8);
    }
    fixture.componentInstance.answers.fill(3);
    fixture.componentInstance.submitAssessment();
    for (const width of [...widths].reverse()) {
      host.style.width = `${width}px`;
      fixture.detectChanges();
      expectFitsWidth(host, width);
      expect((host.querySelector('.result-gauge') as HTMLElement).getAttribute('aria-valuenow')).toBe('27');
      expect((host.querySelector('.gauge-caption') as HTMLElement).textContent).toContain('۲۷');
    }
    fixture.destroy();
  });
});
