import { TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 local assets', () => {
  it('serves the local browser icon', async () => {
    const response = await fetch('/favicon.png');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/png');
  });

  it('uses loaded regular and bold Vazir faces for the questionnaire', async () => {
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    const fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const card = host.querySelector('.assessment-view') as HTMLElement;
    expect(getComputedStyle(host).fontFamily).toContain('Vazir');
    expect(getComputedStyle(card).fontFamily).toContain('Vazir');

    const regular = await document.fonts.load('400 16px Vazir', '\u0641\u0627\u0631\u0633\u06cc');
    const bold = await document.fonts.load('700 16px Vazir', '\u0641\u0627\u0631\u0633\u06cc');
    expect(regular.length).toBeGreaterThan(0);
    expect(bold.length).toBeGreaterThan(0);
    expect(regular.some((face) => face.weight === '400')).toBeTrue();
    expect(bold.some((face) => face.weight === '700')).toBeTrue();
    expect(regular.every((face) => face.status === 'loaded')).toBeTrue();
    expect(bold.every((face) => face.status === 'loaded')).toBeTrue();
    fixture.destroy();
  });
});
