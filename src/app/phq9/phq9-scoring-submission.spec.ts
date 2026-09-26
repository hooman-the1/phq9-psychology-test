import { TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 scoring on submission', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
  });

  it('uses the current nine answers on successful submission', () => {
    const component = TestBed.createComponent(Phq9ShellComponent).componentInstance;
    component.answers.splice(0, 9, 0, 1, 2, 3, 0, 1, 2, 3, 0);

    expect(component.submitAssessment().isValid).toBeTrue();
    expect(component.score).toEqual({ total: 12, category: 'moderate' });
  });

  it('does not retain a score when a later submission is incomplete or malformed', () => {
    const component = TestBed.createComponent(Phq9ShellComponent).componentInstance;
    component.answers.fill(3);
    component.submitAssessment();
    expect(component.score?.total).toBe(27);

    component.answers[4] = null;
    expect(component.submitAssessment().isValid).toBeFalse();
    expect(component.score).toBeNull();

    component.answers[4] = 4;
    expect(component.submitAssessment().isValid).toBeFalse();
    expect(component.score).toBeNull();
    expect(component.submitted).toBeFalse();
  });
});
