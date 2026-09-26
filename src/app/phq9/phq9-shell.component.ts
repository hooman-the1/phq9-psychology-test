import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  PHQ9_ANSWER_CHOICES,
  PHQ9_QUESTIONS,
} from './phq9-questionnaire';

@Component({
  selector: 'app-phq9-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main dir="rtl">
      <section class="questionnaire" aria-labelledby="questionnaire-title">
        <h1 id="questionnaire-title">تست تشخیص افسردگی <span>PHQ-9</span></h1>
        <div class="rule"></div>

        <p class="intro-text">
          در <b>دو هفته گذشته</b>، هر چند وقت یک‌بار با هر یک از مشکلات زیر درگیر
          بوده‌اید یا این مسائل شما را آزار داده‌اند؟
        </p>
        <div class="rule"></div>

        <section class="question-card" aria-live="polite">
          <p class="question">
            {{ currentQuestionIndex + 1 }}. {{ questions[currentQuestionIndex] }}
          </p>

          <fieldset>
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

          <div class="button-group">
            <button
              type="button"
              (click)="previousQuestion()"
              [disabled]="currentQuestionIndex === 0"
            >
              قبلی
            </button>
            <button
              *ngIf="currentQuestionIndex < questions.length - 1"
              type="button"
              (click)="nextQuestion()"
            >
              بعدی
            </button>
          </div>

          <progress
            [value]="currentQuestionIndex + 1"
            [max]="questions.length"
            [attr.aria-label]="'سؤال ' + (currentQuestionIndex + 1) + ' از ' + questions.length"
          ></progress>
        </section>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: #263238;
        font-family: Arial, sans-serif;
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

      h1 span {
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

      progress {
        display: block;
        width: 100%;
        margin-top: 1.5rem;
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
  readonly questions = PHQ9_QUESTIONS;
  readonly answerChoices = PHQ9_ANSWER_CHOICES;
  readonly answers: Array<number | null> = Array(this.questions.length).fill(null);
  currentQuestionIndex = 0;

  selectAnswer(answer: number): void {
    this.answers[this.currentQuestionIndex] = answer;
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
