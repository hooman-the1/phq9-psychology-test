import { CommonModule } from '@angular/common';
import { Component, Directive, Input } from '@angular/core';

import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';

@Component({
  selector: 'mat-card, mat-card-title, mat-card-content, mat-card-actions, mat-divider',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class Phq9MaterialContentComponent {}

@Directive({
  selector: 'button[mat-button], button[mat-raised-button], button[mat-stroked-button]',
  standalone: true,
})
export class Phq9MaterialButtonDirective {}

@Directive({
  selector: 'form[formGroup]',
  standalone: true,
})
export class Phq9FormGroupDirective {
  @Input() formGroup: unknown;
}

@Directive({
  selector: '[formControl]',
  standalone: true,
})
export class Phq9FormControlDirective {
  @Input() formControl: unknown;
}

@Component({
  selector: 'mat-radio-group',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class Phq9RadioGroupComponent {}

@Component({
  selector: 'mat-radio-button',
  standalone: true,
  template: '<ng-content></ng-content>',
})
export class Phq9RadioButtonComponent {
  @Input() value: number | undefined;
}

@Component({
  selector: 'mat-progress-bar',
  standalone: true,
  template: '',
})
export class Phq9ProgressBarComponent {
  @Input() mode = 'determinate';
  @Input() value = 0;
}

@Component({
  selector: 'ngx-gauge',
  standalone: true,
  template: '',
})
export class Phq9GaugeComponent {
  @Input() value = 0;
  @Input() label = '';
  @Input() min = 0;
  @Input() max = 27;
  @Input() size = 220;
  @Input() type = 'arch';
  @Input() thick = 15;
  @Input() foregroundColor = '';
  @Input() duration = 0;
  @Input() cap = 'round';
  @Input() append = '';
  @Input() markers: unknown = undefined;
  @Input() margin = 0;
}

const PHQ9_TEMPLATE_DEPENDENCIES = [
  Phq9MaterialContentComponent,
  Phq9MaterialButtonDirective,
  Phq9FormGroupDirective,
  Phq9FormControlDirective,
  Phq9RadioGroupComponent,
  Phq9RadioButtonComponent,
  Phq9ProgressBarComponent,
  Phq9GaugeComponent,
  LatinToPersianNumbersPipe,
];

@Component({
  selector: 'app-phq9-dependency-assembly',
  standalone: true,
  imports: [CommonModule, ...PHQ9_TEMPLATE_DEPENDENCIES],
  template: `
    <mat-card>
      <mat-card-title>PHQ-9</mat-card-title>
      <mat-divider></mat-divider>
      <mat-card-content>
        <form [formGroup]="form">
          <mat-radio-group [formControl]="selectedOption">
            <mat-radio-button *ngFor="let option of options" [value]="option">
              {{ option | latinToPersianNumbers }}
            </mat-radio-button>
          </mat-radio-group>
          <mat-progress-bar [value]="progress"></mat-progress-bar>
        </form>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button type="button">Next</button>
      </mat-card-actions>
      <ngx-gauge [value]="12"></ngx-gauge>
    </mat-card>
  `,
})
export class Phq9DependencyAssemblyComponent {
  readonly form = {};
  readonly selectedOption = {};
  readonly options = [12];
  readonly progress = 50;
}

export const PHQ9_FEATURE_IMPORTS = [
  CommonModule,
  ...PHQ9_TEMPLATE_DEPENDENCIES,
];
