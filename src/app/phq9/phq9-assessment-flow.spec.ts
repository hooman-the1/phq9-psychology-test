import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Phq9AssessmentStorage } from './phq9-assessment-storage';
import { Phq9ShellComponent } from './phq9-shell.component';
import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';
import { PHQ9_ANSWER_CHOICES, PHQ9_QUESTIONS } from './phq9-questionnaire';

describe('PHQ-9 rendered assessment flow', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;
  let storage: jasmine.SpyObj<Phq9AssessmentStorage>;
  const digits = new LatinToPersianNumbersPipe();

  beforeEach(async () => {
    storage = jasmine.createSpyObj<Phq9AssessmentStorage>('Phq9AssessmentStorage', ['read', 'save']);
    storage.read.and.returnValue({ ok: true, records: [] });
    storage.save.and.callFake((assessment) => ({
      ok: true,
      record: { ...assessment, id: 'test-record', createdAt: '2026-09-29T00:00:00Z' },
    }));
    await TestBed.configureTestingModule({
      imports: [Phq9ShellComponent],
      providers: [{ provide: Phq9AssessmentStorage, useValue: storage }],
    }).compileComponents();
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function button(selector: string): HTMLButtonElement | null {
    return element().querySelector(selector);
  }

  function click(selector: string): void {
    const control = button(selector);
    expect(control).withContext(selector).not.toBeNull();
    control!.click();
    fixture.detectChanges();
  }

  function choices(): HTMLInputElement[] {
    return Array.from(element().querySelectorAll('.question-card input[type="radio"]'));
  }

  function answer(value: number): void {
    choices()[value].click();
    fixture.detectChanges();
    expect(choices()[value].checked).toBeTrue();
  }

  function position(index: number): void {
    expect(element().querySelector('.question')?.textContent?.trim()).toBe(
      `${digits.transform(index + 1)}. ${PHQ9_QUESTIONS[index]}`,
    );
    expect(choices().map((choice) => choice.value)).toEqual(PHQ9_ANSWER_CHOICES.map((choice) => String(choice.value)));
    expect(Array.from(element().querySelectorAll('.question-card label')).map((label) => label.textContent?.trim()))
      .toEqual(PHQ9_ANSWER_CHOICES.map((choice) => choice.label));
    const progress = element().querySelector('progress') as HTMLProgressElement;
    expect(progress.value).toBe(index + 1);
    expect(progress.max).toBe(9);
    expect(progress.getAttribute('aria-label')).toBe(`سؤال ${digits.transform(index + 1)} از ${digits.transform(9)}`);
  }

  it('moves through all nine rendered questions and retains selected answers in both directions', () => {
    expect(button('.previous-action')?.disabled).toBeTrue();
    expect(button('.submit-action')).toBeNull();
    for (let index = 0; index < 9; index++) {
      position(index);
      answer(index % 4);
      if (index < 8) click('.primary-action');
    }
    expect(button('.primary-action')?.textContent?.trim()).toBe('ثبت پاسخ‌ها');
    expect(button('.submit-action')).not.toBeNull();
    for (let index = 8; index >= 0; index--) {
      position(index);
      expect(choices()[index % 4].checked).toBeTrue();
      if (index > 0) click('.previous-action');
    }
    expect(button('.previous-action')?.disabled).toBeTrue();
    for (let index = 1; index < 9; index++) {
      click('.primary-action');
      position(index);
      expect(choices()[index % 4].checked).toBeTrue();
    }
    expect(element().querySelector('.result-card')).toBeNull();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('shows every missing answer, then clears the last visible error when zero is selected', () => {
    for (let index = 0; index < 8; index++) click('.primary-action');
    click('.submit-action');
    expect(element().querySelector('.result-card')).toBeNull();
    const missing = Array.from(element().querySelectorAll('.validation-summary:not([hidden]) li'));
    expect(missing.length).toBe(9);
    missing.forEach((item, index) => expect(item.textContent).toContain(`سؤال ${digits.transform(index + 1)}`));
    expect(element().querySelector('.validation-error')).not.toBeNull();
    expect(storage.save).not.toHaveBeenCalled();

    for (let index = 0; index < 8; index++) {
      position(index);
      expect(element().querySelector('fieldset')?.getAttribute('aria-invalid')).toBe('true');
      answer(0);
      expect(element().querySelector('.validation-error')).toBeNull();
      click('.primary-action');
    }
    position(8);
    expect(element().querySelectorAll('.validation-summary:not([hidden]) li').length).toBe(1);
    click('.submit-action');
    expect(element().querySelector('.result-card')).toBeNull();
    expect(element().querySelectorAll('.validation-summary:not([hidden]) li').length).toBe(1);
    expect(element().querySelector('.validation-summary:not([hidden]) li')?.textContent).toContain('سؤال ۹');
    expect(element().querySelector('.validation-error')).not.toBeNull();
    answer(0);
    expect(element().querySelector('.validation-error')).toBeNull();
    expect(element().querySelector('.validation-summary:not([hidden])')).toBeNull();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('displays the submitted result, then restarts cleanly and allows another completion', () => {
    expect(element().querySelector('.result-card')).toBeNull();
    for (let index = 0; index < 9; index++) {
      answer(index < 4 ? 2 : 0);
      if (index < 8) click('.primary-action');
    }
    expect(element().querySelector('.result-card')).toBeNull();
    click('.submit-action');
    expect(element().querySelector('.result-total')?.textContent).toContain('۸');
    expect(element().querySelector('.result-severity')?.textContent).toContain('افسردگی خفیف');
    expect(element().querySelector('.result-recommendation')?.textContent).toContain(
      'تغییرات خلق خود را زیر نظر بگیرید و در صورت نیاز با یک دوست یا مشاور صحبت کنید.',
    );
    expect(storage.save).toHaveBeenCalledTimes(1);

    click('.result-card button');
    position(0);
    expect(choices().every((choice) => !choice.checked)).toBeTrue();
    expect(button('.previous-action')?.disabled).toBeTrue();
    expect(element().querySelector('.result-card')).toBeNull();
    expect(element().querySelector('.validation-summary:not([hidden])')).toBeNull();
    expect(element().querySelector('.validation-error')).toBeNull();
    for (let index = 1; index < 9; index++) {
      click('.primary-action');
      expect(choices().every((choice) => !choice.checked)).toBeTrue();
    }
    click('.previous-action');
    for (let index = 7; index >= 0; index--) {
      expect(choices().every((choice) => !choice.checked)).toBeTrue();
      if (index > 0) click('.previous-action');
    }
    for (let index = 0; index < 9; index++) {
      answer(0);
      if (index < 8) click('.primary-action');
    }
    click('.submit-action');
    expect(element().querySelector('.result-total')?.textContent).toContain('۰');
    expect(storage.save).toHaveBeenCalledTimes(2);
  });
});
