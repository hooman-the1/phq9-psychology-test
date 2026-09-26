import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';

describe('PHQ-9 result gauge', () => {
  let fixture: ComponentFixture<Phq9ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Phq9ShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(Phq9ShellComponent);
    fixture.detectChanges();
  });

  const cases: Array<[number, string]> = [
    [0, '#43a047'], [4, '#43a047'],
    [5, '#fdd835'], [9, '#fdd835'],
    [10, '#fb8c00'], [14, '#fb8c00'],
    [15, '#e53935'], [19, '#e53935'],
    [20, '#b71c1c'], [27, '#b71c1c'],
  ];

  for (const [total, color] of cases) {
    it(`shows score ${total} at the correct position with ${color}`, () => {
      fixture.componentInstance.answers.splice(0, 9, ...answersFor(total));
      fixture.componentInstance.submitAssessment();
      fixture.detectChanges();

      const result = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
      const gauge = result.querySelector('.result-gauge') as HTMLElement;
      const svg = gauge.querySelector('svg') as SVGElement;
      const track = svg.querySelector('.gauge-track') as SVGPathElement;
      const foreground = svg.querySelector('.gauge-foreground') as SVGPathElement;
      const marker = svg.querySelector('.gauge-marker') as SVGPolygonElement;
      const caption = result.querySelector('.gauge-caption') as HTMLElement;
      const accent = result.querySelector('.result-severity') as HTMLElement;

      expect(gauge.getAttribute('role')).toBe('meter');
      expect(gauge.getAttribute('aria-valuemin')).toBe('0');
      expect(gauge.getAttribute('aria-valuemax')).toBe('27');
      expect(gauge.getAttribute('aria-valuenow')).toBe(String(total));
      expect(gauge.getAttribute('aria-valuetext')).toContain(String(total));
      expect(gauge.getAttribute('aria-valuetext')).toContain(accent.textContent!.trim().split(':').pop()!.trim());
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('viewBox')).toBe('0 0 220 130');
      expect(track.getAttribute('d')).toBe('M 20 110 A 90 90 0 0 1 200 110');
      expect(foreground.getAttribute('stroke-width')).toBe('15');
      expect(foreground.getAttribute('stroke-linecap')).toBe('round');
      expect(foreground.getAttribute('pathLength')).toBe('27');
      expect(foreground.getAttribute('stroke-dasharray')).toBe(`${total} 27`);
      expect(foreground.getAttribute('stroke')).toBe(color);
      expect(marker.getAttribute('fill')).toBe(color);
      expect(svg.querySelectorAll('.gauge-marker').length).toBe(1);

      const match = marker.getAttribute('transform')?.match(/^translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)$/);
      expect(match).not.toBeNull();
      const fraction = total / 27;
      expect(Number(match![1])).toBeCloseTo(110 - 90 * Math.cos(Math.PI * fraction), 4);
      expect(Number(match![2])).toBeCloseTo(110 - 90 * Math.sin(Math.PI * fraction), 4);
      expect(Number(match![3])).toBeCloseTo(-90 + 180 * fraction, 4);
      expect(caption.textContent).toContain(String(total));
      expect(accent.style.borderBottomColor).toBe(toRgb(color));
    });
  }

  it('does not show a gauge before submission or after incomplete and malformed submissions', () => {
    const component = fixture.componentInstance;
    const gauge = () => fixture.nativeElement.querySelector('.result-gauge');
    expect(gauge()).toBeNull();
    component.submitAssessment();
    fixture.detectChanges();
    expect(gauge()).toBeNull();

    component.answers.fill(3);
    component.submitAssessment();
    fixture.detectChanges();
    expect(gauge()).not.toBeNull();

    component.answers[0] = null;
    component.submitAssessment();
    fixture.detectChanges();
    expect(gauge()).toBeNull();

    component.answers[0] = 4;
    component.submitAssessment();
    fixture.detectChanges();
    expect(gauge()).toBeNull();
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

function toRgb(hex: string): string {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  return `rgb(${channels.join(', ')})`;
}
