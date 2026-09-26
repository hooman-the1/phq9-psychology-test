import { TestBed } from '@angular/core/testing';

import { Phq9DependencyAssemblyComponent } from './phq9-dependency-assembly';

describe('PHQ-9 dependency assembly', () => {
  it('instantiates the questionnaire and result template primitives locally', async () => {
    await TestBed.configureTestingModule({
      imports: [Phq9DependencyAssemblyComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(Phq9DependencyAssemblyComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-radio-group')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ngx-gauge')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('۱۲');
  });
});
