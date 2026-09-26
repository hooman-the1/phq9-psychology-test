import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';

describe('Phq9ShellComponent questionnaire rendering', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Phq9ShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
  });

  it('renders the PHQ-9 introduction, first question, and four reference choices', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toContain('PHQ-9');
    expect(element.textContent).toContain('در');
    expect(element.textContent).toContain('دو هفته گذشته');
    expect(element.textContent).toContain(
      'آیا از انجام کارها لذت نمی‌برید یا علاقه‌تان را از دست داده‌اید؟',
    );
    expect(optionLabels(element)).toEqual([
      'اصلا تجربه نکردم',
      'چند روز در دو هفته گذشته تجربه کردم',
      'بیشتر از یک هفته تجربه کردم',
      'تقریبا هر روز تجربه کردم',
    ]);
  });

  it('renders all nine questions in reference order while navigating', () => {
    const expectedQuestions = [
      'آیا از انجام کارها لذت نمی‌برید یا علاقه‌تان را از دست داده‌اید؟',
      'آیا احساس غم، افسردگی یا ناامیدی داشته‌اید؟',
      'آیا در به خواب رفتن مشکل داشته‌اید، یا دچار خواب بیش‌ازحد شده‌اید؟',
      'آیا احساس خستگی یا بی‌انرژی بودن داشته‌اید؟',
      'آیا بی‌اشتهایی یا پرخوری را تجربه کرده‌اید؟',
      'آیا احساس بدی نسبت به خود داشته‌اید – مثلاً فکر کرده‌اید که شکست‌خورده‌اید یا خودتان یا خانواده‌تان را ناامید کرده‌اید؟',
      'آیا تمرکز بر روی کارهایی مانند خواندن کتاب یا تماشای فیلم برایتان دشوار بوده است؟',
      'آیا آن‌قدر آهسته حرکت یا صحبت کرده‌اید که دیگران متوجه غیرعادی بودن رفتارتان شده باشند؟ یا برعکس – آیا آن‌قدر بی‌قرار و ناآرام بوده‌اید که بیش‌ازحد معمول فعالیت کرده باشید؟',
      'آیا افکاری درباره این‌که ای کاش مرده بودید یا به خودتان آسیب بزنید، داشته‌اید؟',
    ];

    for (const expectedQuestion of expectedQuestions) {
      expect(fixture.nativeElement.textContent).toContain(expectedQuestion);
      const nextButton = button(fixture.nativeElement, 'بعدی');
      if (nextButton) {
        nextButton.click();
        fixture.detectChanges();
      }
    }
  });

  it('keeps a selected answer when moving back and forward', () => {
    const firstChoice = fixture.nativeElement.querySelector(
      'input[type="radio"]',
    ) as HTMLInputElement;
    const nextButton = button(fixture.nativeElement, 'بعدی') as HTMLButtonElement;

    firstChoice.click();
    nextButton.click();
    fixture.detectChanges();

    const previousButton = button(fixture.nativeElement, 'قبلی') as HTMLButtonElement;
    previousButton.click();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement)
        .checked,
    ).toBeTrue();
  });
});

function optionLabels(element: HTMLElement): string[] {
  return Array.from(element.querySelectorAll('label')).map((label) =>
    label.textContent?.trim().replace(/\s+/g, ' ') ?? '',
  );
}

function button(element: HTMLElement, label: string): HTMLButtonElement | null {
  return Array.from(element.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === label,
  ) as HTMLButtonElement | null;
}
