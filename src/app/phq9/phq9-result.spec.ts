import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';
import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';

describe('PHQ-9 result rendering', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
  });

  const cases: Array<[number, string, string]> = [
    [0, 'حداقل افسردگی', 'نیازی به اقدام خاصی نیست، اما مراقب حال و هوای خود باشید.'],
    [4, 'حداقل افسردگی', 'نیازی به اقدام خاصی نیست، اما مراقب حال و هوای خود باشید.'],
    [5, 'افسردگی خفیف', 'تغییرات خلق خود را زیر نظر بگیرید و در صورت نیاز با یک دوست یا مشاور صحبت کنید.'],
    [9, 'افسردگی خفیف', 'تغییرات خلق خود را زیر نظر بگیرید و در صورت نیاز با یک دوست یا مشاور صحبت کنید.'],
    [10, 'افسردگی متوسط', 'صحبت با یک روانشناس یا مشاور توصیه می‌شود.'],
    [14, 'افسردگی متوسط', 'صحبت با یک روانشناس یا مشاور توصیه می‌شود.'],
    [15, 'افسردگی نسبتاً شدید', 'به شدت توصیه می‌شود از یک متخصص سلامت روان کمک بگیرید.'],
    [19, 'افسردگی نسبتاً شدید', 'به شدت توصیه می‌شود از یک متخصص سلامت روان کمک بگیرید.'],
    [20, 'افسردگی شدید', 'نیاز فوری به مداخله تخصصی روانشناسی یا روانپزشکی وجود دارد.'],
    [27, 'افسردگی شدید', 'نیاز فوری به مداخله تخصصی روانشناسی یا روانپزشکی وجود دارد.'],
  ];

  for (const [total, label, recommendation] of cases) {
    it(`shows the reference result for total ${total}`, () => {
      fixture.componentInstance.answers.splice(0, 9, ...answersFor(total));
      expect(fixture.componentInstance.submitAssessment().isValid).toBeTrue();
      fixture.detectChanges();

      const result = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
      expect(result).not.toBeNull();
      expect(result.querySelector('.result-total')?.textContent).toContain(new LatinToPersianNumbersPipe().transform(total) as string);
      expect(result.querySelector('.result-severity')?.textContent).toContain(label);
      expect(result.querySelectorAll('.result-recommendation').length).toBe(1);
      expect(result.querySelector('.result-recommendation')?.textContent?.trim()).toBe(`توصیه: ${recommendation}`);
    });
  }

  it('uses the same recommendation when only question 9 changes within a category', () => {
    const component = fixture.componentInstance;
    const recommendation = 'صحبت با یک روانشناس یا مشاور توصیه می‌شود.';
    for (const ninthAnswer of [0, 1, 2, 3]) {
      component.answers.splice(0, 9, 3, 3, 3, 1, 0, 0, 0, 0, ninthAnswer);
      component.submitAssessment();
      fixture.detectChanges();
      const result = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
      expect(result.querySelector('.result-recommendation')?.textContent?.trim()).toBe(`توصیه: ${recommendation}`);
      expect(result.querySelectorAll('.result-recommendation').length).toBe(1);
      expect(result.textContent).not.toContain('هشدار');
    }
  });

  it('hides incomplete and invalid results, including after a valid result', () => {
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
    component.submitAssessment();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();

    component.answers.fill(3);
    component.submitAssessment();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).not.toBeNull();

    component.answers[0] = null;
    component.submitAssessment();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('نیاز فوری به مداخله');

    component.answers[0] = 4;
    component.submitAssessment();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
  });
});

function answersFor(total: number): number[] {
  const answers = Array(9).fill(0) as number[];
  for (let index = 0, remaining = total; index < answers.length && remaining > 0; index++) {
    answers[index] = Math.min(3, remaining);
    remaining -= answers[index];
  }
  return answers;
}
