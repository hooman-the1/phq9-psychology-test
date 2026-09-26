import { PHQ9_ANSWER_CHOICES, PHQ9_QUESTIONS } from './phq9-questionnaire';

export type Phq9SeverityCategory =
  | 'minimal'
  | 'mild'
  | 'moderate'
  | 'moderately_severe'
  | 'severe';

export interface Phq9Score {
  readonly total: number;
  readonly category: Phq9SeverityCategory;
}

export function calculatePhq9Score(answers: readonly unknown[]): Phq9Score | null {
  if (!Array.isArray(answers) || answers.length !== PHQ9_QUESTIONS.length) {
    return null;
  }

  const validValues = PHQ9_ANSWER_CHOICES.map((choice) => choice.value);
  let total = 0;
  for (const answer of answers) {
    if (typeof answer !== 'number' || !Number.isInteger(answer) || !validValues.includes(answer)) {
      return null;
    }
    total += answer;
  }

  const category: Phq9SeverityCategory = total <= 4 ? 'minimal'
    : total <= 9 ? 'mild'
    : total <= 14 ? 'moderate'
    : total <= 19 ? 'moderately_severe'
    : 'severe';

  return { total, category };
}
