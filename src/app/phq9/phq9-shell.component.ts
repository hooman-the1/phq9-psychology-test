import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';

import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';
import { Phq9AssessmentStorage, Phq9StorageReadResult } from './phq9-assessment-storage';
import { Phq9AssessmentRecord } from './phq9-assessment-record';
import {
  PHQ9_ANSWER_CHOICES,
  PHQ9_QUESTIONS,
} from './phq9-questionnaire';
import { calculatePhq9Score, Phq9Score, Phq9SeverityCategory } from './phq9-scoring';
import {
  Phq9ValidationResult,
  validatePhq9Answers,
} from './phq9-validation';

const RESULT_COPY: Record<Phq9SeverityCategory, { severity: string; recommendation: string; color: string }> = {
  minimal: {
    severity: 'حداقل افسردگی',
    recommendation: 'نیازی به اقدام خاصی نیست، اما مراقب حال و هوای خود باشید.',
    color: '#43a047',
  },
  mild: {
    severity: 'افسردگی خفیف',
    recommendation: 'تغییرات خلق خود را زیر نظر بگیرید و در صورت نیاز با یک دوست یا مشاور صحبت کنید.',
    color: '#fdd835',
  },
  moderate: {
    severity: 'افسردگی متوسط',
    recommendation: 'صحبت با یک روانشناس یا مشاور توصیه می‌شود.',
    color: '#fb8c00',
  },
  moderately_severe: {
    severity: 'افسردگی نسبتاً شدید',
    recommendation: 'به شدت توصیه می‌شود از یک متخصص سلامت روان کمک بگیرید.',
    color: '#e53935',
  },
  severe: {
    severity: 'افسردگی شدید',
    recommendation: 'نیاز فوری به مداخله تخصصی روانشناسی یا روانپزشکی وجود دارد.',
    color: '#b71c1c',
  },
};

@Component({
  selector: 'app-phq9-shell',
  standalone: true,
  imports: [CommonModule, LatinToPersianNumbersPipe],
  template: `
    <main dir="rtl">
      <p *ngIf="!showHistory && historyNotice" class="history-notice validation-summary" role="alert">
        {{ historyNotice }}
      </p>
      <section *ngIf="showHistory && selectedDetailId === null" class="questionnaire history-view" aria-labelledby="history-title">
        <h1 #historyTitle id="history-title" tabindex="-1">تاریخچه آزمون‌ها</h1>
        <div class="rule"></div>
        <p *ngIf="historyRead && !historyRead.ok" class="validation-summary" role="alert">
          تاریخچه ذخیره‌شده بارگذاری نشد. داده‌های ذخیره‌شده تغییر نکرده‌اند.
        </p>
        <p *ngIf="historyHasSkippedEntries" class="validation-summary" role="alert">
          برخی از موارد تاریخچه ذخیره‌شده نامعتبر بودند و بارگذاری نشدند.
        </p>
        <p *ngIf="deleteError" class="validation-summary" role="alert">{{ deleteError }}</p>
        <p *ngIf="clearError" class="validation-summary" role="alert">{{ clearError }}</p>
        <ng-container *ngIf="historyRead?.ok">
          <p *ngIf="historyRecords.length === 0" class="history-empty">هنوز آزمونی در تاریخچه ذخیره نشده است.</p>
          <ol *ngIf="historyRecords.length > 0" class="history-list">
            <li *ngFor="let record of historyRecords; let index = index" [attr.data-record-id]="record.id"
              [attr.data-list-number]="index + 1 | latinToPersianNumbers">
              <h2>آزمون {{ index + 1 | latinToPersianNumbers }}</h2>
              <p>زمان ثبت: <time [attr.datetime]="record.createdAt">{{ formatHistoryDate(record.createdAt) }}</time></p>
              <p>امتیاز: {{ record.totalScore | latinToPersianNumbers }} از ۲۷</p>
              <p>شدت افسردگی: {{ record.result.severityLabel }}</p>
              <button type="button" [attr.aria-label]="'نمایش جزئیات آزمون ' + (index + 1 | latinToPersianNumbers)" (click)="openDetail(record.id)">نمایش جزئیات</button>
              <button *ngIf="!historyHasSkippedEntries" class="history-delete" type="button"
                [attr.aria-label]="'حذف آزمون ' + (index + 1 | latinToPersianNumbers)" (click)="requestDelete(record)">حذف آزمون</button>
            </li>
          </ol>
          <div *ngIf="historyRecords.length > 0 && !historyHasSkippedEntries" class="button-group">
            <button #clearAction class="history-clear" type="button" (click)="requestClearAll()">پاک کردن همهٔ تاریخچه</button>
          </div>
        </ng-container>
        <section *ngIf="pendingClearAll" class="delete-dialog clear-dialog" role="alertdialog" aria-modal="true"
          aria-labelledby="clear-title" aria-describedby="clear-description" (keydown.escape)="cancelClearAll()"
          (keydown)="keepClearFocus($event)">
          <h2 id="clear-title">پاک کردن همهٔ تاریخچه</h2>
          <p id="clear-description">همهٔ آزمون‌های ذخیره‌شده برای همیشه حذف می‌شوند. این حذف دائمی است.</p>
          <div class="button-group">
            <button #clearCancel class="clear-cancel" type="button" (click)="cancelClearAll()">انصراف</button>
            <button class="clear-confirm" type="button" (click)="confirmClearAll()">پاک کردن دائمی همه</button>
          </div>
        </section>
        <section *ngIf="pendingDeleteRecord as record" class="delete-dialog" role="alertdialog" aria-modal="true"
          aria-labelledby="delete-title" aria-describedby="delete-description" (keydown.escape)="cancelDelete()"
          (keydown.tab)="keepDeleteFocus($event)">
          <h2 id="delete-title">حذف آزمون ذخیره‌شده</h2>
          <p id="delete-description">آزمون ثبت‌شده در {{ formatHistoryDate(record.createdAt) }} با امتیاز {{ record.totalScore | latinToPersianNumbers }} از ۲۷ برای همیشه حذف می‌شود. این حذف دائمی است.</p>
          <div class="button-group">
            <button #deleteCancel class="delete-cancel" type="button" (click)="cancelDelete()">انصراف</button>
            <button class="delete-confirm" type="button" (click)="confirmDelete()">حذف دائمی</button>
          </div>
        </section>
        <div class="button-group">
          <button type="button" (click)="closeHistory()">{{ submitted ? 'بازگشت به نتیجه' : 'بازگشت به آزمون' }}</button>
        </div>
      </section>
      <section *ngIf="showHistory && selectedDetailId !== null" class="questionnaire detail-view" aria-labelledby="detail-title">
        <h1 #detailTitle id="detail-title" tabindex="-1">جزئیات آزمون ذخیره‌شده</h1>
        <div class="rule"></div>
        <ng-container *ngIf="detailRecord as record">
          <p>زمان ثبت: <time [attr.datetime]="record.createdAt">{{ formatHistoryDate(record.createdAt) }}</time></p>
          <ol class="detail-answers">
            <li *ngFor="let question of questions; let index = index" [attr.data-list-number]="index + 1 | latinToPersianNumbers">
              <p>{{ question }}</p>
              <p>پاسخ: {{ record.answers[index] | latinToPersianNumbers }} — {{ answerChoices[record.answers[index]].label }}</p>
            </li>
          </ol>
          <p>مجموع امتیاز: {{ record.totalScore | latinToPersianNumbers }} از ۲۷</p>
          <p>شدت افسردگی: {{ record.result.severityLabel }} <bdi class="detail-category" dir="ltr">({{ record.severityCategory }})</bdi></p>
          <p>توصیه: {{ record.result.recommendation }}</p>
          <ul *ngIf="record.result.warnings.length > 0" aria-label="هشدارها">
            <li *ngFor="let warning of record.result.warnings" class="detail-warning">{{ warning }}</li>
          </ul>
        </ng-container>
        <p *ngIf="detailMissing" role="alert">این آزمون دیگر در تاریخچه وجود ندارد.</p>
        <p *ngIf="detailReadFailed" class="validation-summary" role="alert">
          تاریخچه ذخیره‌شده بارگذاری نشد. داده‌های ذخیره‌شده تغییر نکرده‌اند.
        </p>
        <div class="button-group">
          <button type="button" (click)="closeDetail()">بازگشت به تاریخچه</button>
        </div>
      </section>
      <section *ngIf="!showHistory && !submitted" class="questionnaire assessment-view" aria-labelledby="questionnaire-title">
        <h1 #questionnaireTitle id="questionnaire-title" tabindex="-1">تست تشخیص افسردگی <bdi dir="ltr">PHQ-9</bdi></h1>
        <div class="rule"></div>
        <section class="question-card" aria-live="polite">
          <p class="intro-text">
            در <b>دو هفته گذشته</b>، هر چند وقت یک‌بار با هر یک از مشکلات زیر درگیر
            بوده‌اید یا این مسائل شما را آزار داده‌اند؟
          </p>
          <div class="rule"></div>

          <section
            #validationSummary
            class="validation-summary"
            aria-live="assertive"
            aria-labelledby="validation-summary-title"
            [hidden]="validationErrors.size === 0"
            tabindex="-1"
          >
            <h2 id="validation-summary-title">لطفاً به سؤال‌های مشخص‌شده پاسخ دهید.</h2>
            <ul>
              <li *ngFor="let questionIndex of validationErrors">
                سؤال {{ questionIndex + 1 | latinToPersianNumbers }} نیاز به پاسخ دارد.
              </li>
            </ul>
          </section>

          <p class="question">
            {{ currentQuestionIndex + 1 | latinToPersianNumbers }}. {{ questions[currentQuestionIndex] }}
          </p>

          <fieldset
            [attr.aria-describedby]="isQuestionInvalid(currentQuestionIndex) ? 'question-error' : null"
            [attr.aria-invalid]="isQuestionInvalid(currentQuestionIndex)"
          >
            <legend class="visually-hidden">گزینه‌های پاسخ</legend>
            <label *ngFor="let option of answerChoices">
              <input
                type="radio"
                name="phq9-answer"
                [value]="option.value"
                [checked]="answers[currentQuestionIndex] === option.value"
                (change)="selectAnswer(option.value)"
              />
              <span>{{ option.label }}</span>
            </label>
          </fieldset>
          <p
            *ngIf="isQuestionInvalid(currentQuestionIndex)"
            id="question-error"
            class="validation-error"
            role="alert"
          >
            پاسخ به این سؤال ضروری است.
          </p>

          <div class="button-group assessment-actions">
            <button
              class="previous-action"
              type="button"
              (click)="previousQuestion()"
              [disabled]="currentQuestionIndex === 0"
            >
              قبلی
            </button>
            <button
              class="primary-action"
              *ngIf="currentQuestionIndex < questions.length - 1"
              type="button"
              (click)="nextQuestion()"
            >
              بعدی
            </button>
            <button
              class="primary-action submit-action"
              *ngIf="currentQuestionIndex === questions.length - 1"
              type="button"
              (click)="submitAssessment()"
            >
              ثبت پاسخ‌ها
            </button>
          </div>

          <progress
            [value]="currentQuestionIndex + 1"
            [max]="questions.length"
            [attr.aria-label]="'سؤال ' + (currentQuestionIndex + 1 | latinToPersianNumbers) + ' از ' + (questions.length | latinToPersianNumbers)"
          ></progress>
        </section>
        <div class="button-group">
          <button #questionnaireHistoryAction type="button" (click)="openHistory()">تاریخچه آزمون‌ها</button>
        </div>
      </section>
      <section *ngIf="!showHistory && resultDetails as details" class="questionnaire result-card" aria-labelledby="result-title">
        <h1 id="result-title">نتیجه تست</h1>
        <div class="rule"></div>
        <p class="result-total"><strong>مجموع امتیاز:</strong> {{ score?.total | latinToPersianNumbers }}</p>
        <p class="result-severity" [style.border-bottom-color]="details.color"><strong>شدت افسردگی:</strong> <span [style.color]="score?.category === 'mild' ? '#795900' : details.color">{{ details.severity }}</span></p>
        <p class="result-recommendation"><strong>توصیه:</strong> {{ details.recommendation }}</p>
        <p *ngIf="saveFailed" class="validation-error" role="alert">
          نتیجه ذخیره نشد. می‌توانید آن را در این صفحه ببینید، اما پس از بستن صفحه باقی نمی‌ماند.
        </p>
        <div
          class="result-gauge"
          role="meter"
          aria-valuemin="0"
          aria-valuemax="27"
          [attr.aria-valuenow]="score?.total"
          [attr.aria-valuetext]="(score?.total | latinToPersianNumbers) + ' از ۲۷، ' + details.severity"
          aria-label="امتیاز افسردگی"
        >
          <svg viewBox="0 0 220 130" aria-hidden="true" focusable="false">
            <path class="gauge-track" d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#e0e0e0" stroke-width="15" stroke-linecap="round" />
            <path
              class="gauge-foreground"
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              [attr.stroke]="details.color"
              stroke-width="15"
              stroke-linecap="round"
              pathLength="27"
              [attr.stroke-dasharray]="score?.total + ' 27'"
            />
            <polygon
              class="gauge-marker"
              points="0,-12 -6,-2 6,-2"
              [attr.fill]="details.color"
              [attr.transform]="markerTransform"
            />
          </svg>
        </div>
        <p class="gauge-caption">{{ score?.total | latinToPersianNumbers }} امتیاز</p>
        <div class="button-group result-actions">
          <button class="restart-action" type="button" (click)="restartAssessment()">انجام مجدد تست</button>
          <button #resultHistoryAction class="result-history-action" type="button" (click)="openHistory()">تاریخچه آزمون‌ها</button>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: #263238;
        font-family: Vazir, Tahoma, Arial, sans-serif;
        direction: rtl;
      }

      main {
        box-sizing: border-box;
        margin: 0 auto;
        max-width: 42rem;
        padding: 1.5rem;
      }

      .questionnaire {
        margin: 1rem auto;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 0.25rem;
        background: #fff;
        box-shadow: 0 0.125rem 0.5rem rgb(0 0 0 / 10%);
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
        line-height: 1.6;
        text-align: center;
      }

      h1 bdi {
        direction: ltr;
        unicode-bidi: isolate;
      }

      .rule {
        height: 1px;
        margin: 1rem 0;
        background: #e0e0e0;
      }

      .intro-text,
      .question {
        line-height: 1.8;
      }

      .question {
        margin: 0 0 1rem;
        font-size: 1.125rem;
        font-weight: 500;
      }

      .validation-summary {
        margin-bottom: 1rem;
        padding: 1rem;
        border: 2px solid #b3261e;
        background: #fff8f7;
      }

      .validation-summary:focus {
        outline: 3px solid #1a73e8;
        outline-offset: 2px;
      }

      .validation-summary h2,
      .validation-summary ul {
        margin: 0;
      }

      .validation-summary ul {
        padding-inline-start: 1.5rem;
      }

      .validation-error {
        margin: 0.75rem 0 0;
        color: #b3261e;
        font-weight: 600;
      }

      fieldset {
        display: grid;
        gap: 0.75rem;
        margin: 0;
        padding: 0;
        border: 0;
      }

      label {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        cursor: pointer;
        line-height: 1.6;
      }

      input {
        flex: 0 0 auto;
      }

      .button-group {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      button {
        min-width: 5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #546e7a;
        border-radius: 0.25rem;
        background: #fff;
        color: #263238;
        cursor: pointer;
        font: inherit;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      button:focus-visible {
        outline: 3px solid #1a73e8;
        outline-offset: 2px;
      }

      .history-list {
        display: grid;
        gap: 1rem;
        padding-inline-start: 1.5rem;
      }

      .history-list li {
        padding: 0.75rem;
        border: 1px solid #e0e0e0;
        border-radius: 0.25rem;
      }

      .history-list h2 {
        margin: 0;
        font-size: 1.125rem;
      }

      .history-delete {
        margin-inline-start: 0.75rem;
        border-color: #b3261e;
        color: #b3261e;
      }

      .delete-dialog {
        position: fixed;
        z-index: 10;
        inset: 50% auto auto 50%;
        transform: translate(-50%, -50%);
        box-sizing: border-box;
        width: min(32rem, calc(100vw - 2rem));
        max-height: calc(100vh - 2rem);
        overflow: auto;
        padding: 1.5rem;
        border: 2px solid #546e7a;
        border-radius: 0.25rem;
        background: #fff;
        box-shadow: 0 0 0 100vmax rgb(0 0 0 / 40%);
      }

      .detail-answers {
        display: grid;
        gap: 0.75rem;
        padding-inline-start: 1.5rem;
      }

      .detail-answers li {
        padding: 0.75rem;
        border: 1px solid #e0e0e0;
      }

      .history-list li::marker,
      .detail-answers li::marker {
        content: attr(data-list-number) '. ';
      }

      progress {
        display: block;
        width: 100%;
        margin-top: 1.5rem;
      }

      .result-severity {
        display: inline-block;
        border-bottom: 3px solid transparent;
        padding-bottom: 0.2rem;
      }

      .result-gauge {
        width: min(220px, 100%);
        margin: 1.875rem auto 0;
      }

      .result-gauge svg {
        display: block;
        width: 100%;
        height: auto;
      }

      .gauge-caption {
        margin: 0.625rem 0 0;
        text-align: center;
        font-size: 1.125rem;
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ],
})
export class Phq9ShellComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly numberPipe = new LatinToPersianNumbersPipe();
  private readonly assessmentStorage = inject(Phq9AssessmentStorage);
  private readonly initialHistory = this.assessmentStorage.read();
  readonly historyNotice = !this.initialHistory.ok
    ? 'تاریخچه ذخیره‌شده به‌طور کامل بارگذاری نشد. می‌توانید آزمون را ادامه دهید.'
    : 'partial' in this.initialHistory && this.initialHistory.partial
      ? 'برخی از موارد تاریخچه ذخیره‌شده نامعتبر بودند و بارگذاری نشدند. می‌توانید آزمون را ادامه دهید.'
      : null;
  readonly questions = PHQ9_QUESTIONS;
  readonly answerChoices = PHQ9_ANSWER_CHOICES;
  readonly answers: Array<number | null> = Array(this.questions.length).fill(null);
  validationErrors = new Set<number>();
  validationResult: Phq9ValidationResult | null = null;
  score: Phq9Score | null = null;
  submitted = false;
  saveFailed = false;
  currentQuestionIndex = 0;
  showHistory = false;
  historyRead: Phq9StorageReadResult | null = null;
  historyRecords: readonly Phq9AssessmentRecord[] = [];
  selectedDetailId: string | null = null;
  detailRecord: Phq9AssessmentRecord | null = null;
  detailMissing = false;
  detailReadFailed = false;
  pendingDeleteRecord: Phq9AssessmentRecord | null = null;
  deleteError: string | null = null;
  pendingClearAll = false;
  clearError: string | null = null;

  private readonly historyDateFormatter = new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  get historyHasSkippedEntries(): boolean {
    return !!this.historyRead?.ok && 'partial' in this.historyRead && this.historyRead.partial;
  }

  get resultDetails(): { severity: string; recommendation: string; color: string } | null {
    return this.submitted && this.score ? RESULT_COPY[this.score.category] : null;
  }

  get markerTransform(): string {
    const fraction = (this.score?.total ?? 0) / 27;
    const x = 110 - 90 * Math.cos(Math.PI * fraction);
    const y = 110 - 90 * Math.sin(Math.PI * fraction);
    const angle = -90 + 180 * fraction;
    return `translate(${x} ${y}) rotate(${angle})`;
  }

  @ViewChild('validationSummary')
  private validationSummary?: ElementRef<HTMLElement>;

  @ViewChild('questionnaireTitle')
  private questionnaireTitle?: ElementRef<HTMLElement>;

  @ViewChild('historyTitle')
  private historyTitle?: ElementRef<HTMLElement>;

  @ViewChild('detailTitle')
  private detailTitle?: ElementRef<HTMLElement>;

  @ViewChild('questionnaireHistoryAction')
  private questionnaireHistoryAction?: ElementRef<HTMLElement>;

  @ViewChild('resultHistoryAction')
  private resultHistoryAction?: ElementRef<HTMLElement>;

  @ViewChild('deleteCancel')
  private deleteCancel?: ElementRef<HTMLButtonElement>;

  @ViewChild('clearAction')
  private clearAction?: ElementRef<HTMLButtonElement>;

  @ViewChild('clearCancel')
  private clearCancel?: ElementRef<HTMLButtonElement>;

  openHistory(): void {
    this.deleteError = null;
    this.clearError = null;
    this.pendingClearAll = false;
    this.selectedDetailId = null;
    this.detailRecord = null;
    this.refreshHistory();
    this.showHistory = true;
    setTimeout(() => this.historyTitle?.nativeElement.focus());
  }

  requestClearAll(): void {
    if (!this.historyRead?.ok || this.historyHasSkippedEntries || this.historyRecords.length === 0) return;
    this.clearError = null;
    this.pendingClearAll = true;
    setTimeout(() => this.clearCancel?.nativeElement.focus());
  }

  cancelClearAll(): void {
    this.pendingClearAll = false;
    setTimeout(() => this.clearAction?.nativeElement.focus());
  }

  keepClearFocus(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'Tab') return;
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.clear-dialog button'));
    if (buttons.length === 0) return;
    const target = event.target as HTMLElement;
    if (keyboardEvent.shiftKey && target === buttons[0]) {
      event.preventDefault();
      buttons[buttons.length - 1].focus();
    } else if (!keyboardEvent.shiftKey && target === buttons[buttons.length - 1]) {
      event.preventDefault();
      buttons[0].focus();
    }
  }

  confirmClearAll(): void {
    if (!this.pendingClearAll) return;
    const result = this.assessmentStorage.clearAll();
    this.pendingClearAll = false;
    this.refreshHistory();
    if (!result.ok) {
      this.clearError = 'تاریخچه پاک نشد. دسترسی به تاریخچه یا ذخیرهٔ تغییرات ممکن نبود.';
    }
    setTimeout(() => (result.ok ? this.historyTitle : this.clearAction ?? this.historyTitle)?.nativeElement.focus());
  }

  requestDelete(record: Phq9AssessmentRecord): void {
    this.deleteError = null;
    this.pendingDeleteRecord = record;
    setTimeout(() => this.deleteCancel?.nativeElement.focus());
  }

  cancelDelete(): void {
    const id = this.pendingDeleteRecord?.id;
    this.pendingDeleteRecord = null;
    setTimeout(() => this.focusDeleteAction(id));
  }

  keepDeleteFocus(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.delete-dialog button'));
    if (buttons.length === 0) return;
    const target = event.target as HTMLElement;
    if (keyboardEvent.shiftKey && target === buttons[0]) {
      event.preventDefault();
      buttons[buttons.length - 1].focus();
    } else if (!keyboardEvent.shiftKey && target === buttons[buttons.length - 1]) {
      event.preventDefault();
      buttons[0].focus();
    }
  }

  confirmDelete(): void {
    const id = this.pendingDeleteRecord?.id;
    if (!id) return;
    const previousIndex = this.historyRecords.findIndex((record) => record.id === id);
    const result = this.assessmentStorage.delete(id);
    this.pendingDeleteRecord = null;
    this.refreshHistory();
    if (!result.ok) {
      this.deleteError = result.error === 'missing'
        ? 'این آزمون دیگر در تاریخچه وجود ندارد و حذف نشد.'
        : 'آزمون حذف نشد. دسترسی به تاریخچه یا ذخیره تغییرات ممکن نبود؛ داده‌های ذخیره‌شده تغییر نکرده‌اند.';
    }
    setTimeout(() => {
      const nextId = result.ok
        ? this.historyRecords[Math.min(previousIndex, this.historyRecords.length - 1)]?.id
        : id;
      this.focusDeleteAction(nextId);
    });
  }

  private focusDeleteAction(id: string | undefined | null): void {
    const row = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.history-view [data-record-id]'))
      .find((candidate) => candidate.getAttribute('data-record-id') === id);
    (row?.querySelector<HTMLButtonElement>('.history-delete') ?? this.historyTitle?.nativeElement)?.focus();
  }

  openDetail(id: string): void {
    this.selectedDetailId = id;
    this.detailRecord = null;
    this.detailMissing = false;
    this.detailReadFailed = false;
    const read = this.assessmentStorage.read();
    if (!read.ok) {
      this.detailReadFailed = true;
      this.historyRead = read;
      this.historyRecords = [];
    } else {
      this.detailRecord = read.records.find((record) => record.id === id) ?? null;
      this.detailMissing = this.detailRecord === null;
    }
    setTimeout(() => this.detailTitle?.nativeElement.focus());
  }

  closeDetail(): void {
    const id = this.selectedDetailId;
    this.selectedDetailId = null;
    this.detailRecord = null;
    this.detailMissing = false;
    this.detailReadFailed = false;
    this.refreshHistory();
    setTimeout(() => {
      const action = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.history-view [data-record-id]'))
        .find((row) => row.getAttribute('data-record-id') === id)
        ?.querySelector<HTMLButtonElement>('button');
      (action ?? this.historyTitle?.nativeElement)?.focus();
    });
  }

  private refreshHistory(): void {
    this.historyRead = this.assessmentStorage.read();
    this.historyRecords = this.historyRead.ok
      ? this.historyRead.records
        .map((record, index) => ({ record, index }))
        .sort((left, right) =>
          Date.parse(right.record.createdAt) - Date.parse(left.record.createdAt)
          || left.index - right.index,
        )
        .map(({ record }) => record)
      : [];
  }

  closeHistory(): void {
    this.showHistory = false;
    setTimeout(() => (this.submitted ? this.resultHistoryAction : this.questionnaireHistoryAction)?.nativeElement.focus());
  }

  formatHistoryDate(createdAt: string): string {
    return this.numberPipe.transform(this.historyDateFormatter.format(new Date(createdAt))) as string;
  }

  selectAnswer(answer: number): void {
    this.answers[this.currentQuestionIndex] = answer;

    if (this.validationErrors.has(this.currentQuestionIndex)) {
      this.validationErrors = new Set(this.validationErrors);
      this.validationErrors.delete(this.currentQuestionIndex);
    }
  }

  submitAssessment(): Phq9ValidationResult {
    const requiredAnswers = validatePhq9Answers(this.answers);
    this.score = requiredAnswers.isValid ? calculatePhq9Score(this.answers) : null;
    this.validationResult = {
      isValid: requiredAnswers.isValid && this.score !== null,
      missingQuestionIndices: requiredAnswers.missingQuestionIndices,
    };
    this.validationErrors = new Set(this.validationResult.missingQuestionIndices);
    this.submitted = this.validationResult.isValid;
    this.saveFailed = false;

    if (this.submitted && this.score) {
      const details = RESULT_COPY[this.score.category];
      this.saveFailed = !this.assessmentStorage.save({
        answers: this.answers as number[],
        totalScore: this.score.total,
        severityCategory: this.score.category,
        result: {
          severityLabel: details.severity,
          recommendation: details.recommendation,
          warnings: [],
        },
      }).ok;
    }

    if (this.validationResult.missingQuestionIndices.length > 0) {
      this.currentQuestionIndex = this.validationResult.missingQuestionIndices[0];
      setTimeout(() => this.validationSummary?.nativeElement.focus());
    }

    return this.validationResult;
  }

  isQuestionInvalid(questionIndex: number): boolean {
    return this.validationErrors.has(questionIndex);
  }

  restartAssessment(): void {
    this.answers.fill(null);
    this.currentQuestionIndex = 0;
    this.validationErrors = new Set<number>();
    this.validationResult = null;
    this.score = null;
    this.saveFailed = false;
    this.submitted = false;
    setTimeout(() => this.questionnaireTitle?.nativeElement.focus());
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }
}
