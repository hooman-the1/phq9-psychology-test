import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Phq9ShellComponent } from './phq9-shell.component';
import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';

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
      const indicator = svg.querySelector('.gauge-indicator') as SVGGElement;
      const marker = indicator?.querySelector('.gauge-marker') as SVGPolygonElement;
      const needle = indicator?.querySelector('.gauge-needle') as SVGLineElement;
      const markerLabel = svg.querySelector('.gauge-marker-label') as SVGTextElement;
      const caption = result.querySelector('.gauge-caption') as HTMLElement;
      const accent = result.querySelector('.result-severity') as HTMLElement;

      expect(gauge.getAttribute('role')).toBe('meter');
      expect(gauge.getAttribute('aria-valuemin')).toBe('0');
      expect(gauge.getAttribute('aria-valuemax')).toBe('27');
      expect(gauge.getAttribute('aria-valuenow')).toBe(String(total));
      expect(gauge.getAttribute('aria-valuetext')).toContain(new LatinToPersianNumbersPipe().transform(total) as string);
      expect(gauge.getAttribute('aria-valuetext')).toContain((accent.querySelector('span:last-child') as HTMLElement).textContent!.trim());
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('viewBox')).toBe('0 -40 220 210');
      expect(track.getAttribute('d')).toBe('M 42.45 134 A 78 78 0 1 1 177.55 134');
      expect(foreground.getAttribute('stroke-width')).toBe('15');
      expect(foreground.getAttribute('stroke-linecap')).toBe('round');
      expect(foreground.getAttribute('pathLength')).toBe('27');
      expect(foreground.getAttribute('stroke-dasharray')).toBe(`${total} 27`);
      expect(foreground.getAttribute('stroke')).toBe(color);
      expect(marker.getAttribute('fill')).toBe(color);
      expect(needle.getAttribute('stroke')).toBe(color);
      expect(Number(needle.getAttribute('x2'))).toBeGreaterThan(20);
      expect(markerLabel.textContent).toContain('نمره شما');
      expect(markerLabel.textContent).toContain(new LatinToPersianNumbersPipe().transform(total) as string);
      expect(markerLabel.getAttribute('transform')).toBeNull();
      expect(getComputedStyle(markerLabel).fontSize).toBe('13px');
      const labelBounds = markerLabel.getBoundingClientRect();
      const indicatorBounds = indicator.getBoundingClientRect();
      const svgBounds = svg.getBoundingClientRect();
      expect(indicatorBounds.left).withContext(`score ${total} indicator left`).toBeGreaterThanOrEqual(svgBounds.left - 1);
      expect(indicatorBounds.right).withContext(`score ${total} indicator right`).toBeLessThanOrEqual(svgBounds.right + 1);
      expect(indicatorBounds.top).withContext(`score ${total} indicator top`).toBeGreaterThanOrEqual(svgBounds.top - 1);
      expect(indicatorBounds.bottom).withContext(`score ${total} indicator bottom`).toBeLessThanOrEqual(svgBounds.bottom + 1);
      expect(labelBounds.left).withContext(`score ${total} label left`).toBeGreaterThanOrEqual(svgBounds.left - 1);
      expect(labelBounds.right).withContext(`score ${total} label right`).toBeLessThanOrEqual(svgBounds.right + 1);
      expect(labelBounds.top).withContext(`score ${total} label top`).toBeGreaterThanOrEqual(svgBounds.top - 1);
      expect(labelBounds.bottom).withContext(`score ${total} label bottom`).toBeLessThanOrEqual(svgBounds.bottom + 1);
      expect(svg.querySelectorAll('.gauge-marker').length).toBe(1);

      const match = indicator.getAttribute('transform')?.match(/^translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)$/);
      expect(match).not.toBeNull();
      const fraction = total / 27;
      const angle = (150 + 240 * fraction) * Math.PI / 180;
      expect(Number(match![1])).toBeCloseTo(110 + 78 * Math.cos(angle), 2);
      expect(Number(match![2])).toBeCloseTo(95 + 78 * Math.sin(angle), 2);
      expect(Number(match![3])).toBeCloseTo(150 + 240 * fraction, 4);
      const needleTipX = 110 + 109 * Math.cos(angle);
      const needleTipY = 95 + 109 * Math.sin(angle);
      const labelOnRight = Math.cos(angle) < 0;
      expect(markerLabel.getAttribute('text-anchor')).toBe(labelOnRight ? 'end' : 'start');
      expect(Number(markerLabel.getAttribute('x'))).toBeCloseTo(needleTipX + (labelOnRight ? 4 : -4), 2);
      expect(Number(markerLabel.getAttribute('y'))).toBeCloseTo(needleTipY - 7, 2);
      expect(caption.textContent).toContain(new LatinToPersianNumbersPipe().transform(total) as string);
      expect(accent.style.borderBottomColor).toBe(toRgb(color));
    });
  }

  it('shows the reference icon, logo, and animated gauge after a severe result', () => {
    fixture.componentInstance.answers.fill(3);
    fixture.componentInstance.submitAssessment();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.result-brand img')?.getAttribute('src')).toBe('favicon.png');
    expect(root.querySelector('.result-severity-icon')?.textContent).toBe('😟');
    expect(getComputedStyle(root.querySelector('.gauge-foreground')!).animationName).toContain('gauge-fill');
    expect(root.querySelector('.result-inner h2')?.textContent).toBe('نتیجه تست');
    expect(root.querySelector('.result-footer')?.textContent).toContain('yek_ravankav');
    expect(root.classList.contains('result-mode')).toBeTrue();
    expect(getComputedStyle(root).backgroundColor).toBe('rgb(237, 241, 248)');
  });

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
