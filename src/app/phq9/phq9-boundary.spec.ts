import { TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';

describe('local PHQ-9 feature boundary', () => {
  it('exposes the PHQ-9 shell from the feature root', async () => {
    await TestBed.configureTestingModule({
      imports: [Phq9ShellComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('PHQ-9');
  });
});
