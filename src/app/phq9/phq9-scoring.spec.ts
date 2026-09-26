import { calculatePhq9Score, Phq9SeverityCategory } from './phq9-scoring';
import { PHQ9_ANSWER_CHOICES, PHQ9_QUESTIONS } from './phq9-questionnaire';

function answersForTotal(total: number): number[] {
  const values = PHQ9_ANSWER_CHOICES.map((choice) => choice.value);
  return Array.from({ length: PHQ9_QUESTIONS.length }, (_, index) =>
    values[Math.min(values.length - 1, Math.max(0, total - index * (values.length - 1)))],
  );
}

describe('PHQ-9 scoring', () => {
  it('sums valid answers and classifies the minimum and maximum', () => {
    const values = PHQ9_ANSWER_CHOICES.map((choice) => choice.value);
    expect(calculatePhq9Score(answersForTotal(0))).toEqual({ total: 0, category: 'minimal' });
    expect(calculatePhq9Score(answersForTotal(27))).toEqual({ total: 27, category: 'severe' });
    expect(calculatePhq9Score([0, 1, 2, 3, 0, 1, 2, 3, 0].map((index) => values[index]))).toEqual({
      total: 12,
      category: 'moderate',
    });
  });

  it('classifies both sides of every threshold', () => {
    const cases: Array<[number, Phq9SeverityCategory]> = [
      [4, 'minimal'], [5, 'mild'], [9, 'mild'], [10, 'moderate'],
      [14, 'moderate'], [15, 'moderately_severe'],
      [19, 'moderately_severe'], [20, 'severe'],
    ];

    for (const [total, category] of cases) {
      expect(calculatePhq9Score(answersForTotal(total)))
        .withContext(`total ${total} should be ${category}`)
        .toEqual({ total, category });
    }
  });

  it('classifies an interior total in every severity category', () => {
    const cases: Array<[number, Phq9SeverityCategory]> = [
      [2, 'minimal'], [7, 'mild'], [12, 'moderate'],
      [17, 'moderately_severe'], [23, 'severe'],
    ];

    for (const [total, category] of cases) {
      expect(calculatePhq9Score(answersForTotal(total)))
        .withContext(`total ${total} should be ${category}`)
        .toEqual({ total, category });
    }
  });

  it('rejects incomplete, overlong, or malformed answers without a partial score', () => {
    const invalid: unknown[][] = [
      [], Array(8).fill(0), Array(10).fill(0),
      [null, ...Array(8).fill(0)], [undefined, ...Array(8).fill(0)],
      [-1, ...Array(8).fill(0)], [4, ...Array(8).fill(0)],
      [0.5, ...Array(8).fill(0)], [NaN, ...Array(8).fill(0)],
      [Infinity, ...Array(8).fill(0)], ['2', ...Array(8).fill(0)],
      Array(9),
    ];

    for (const answers of invalid) {
      expect(calculatePhq9Score(answers)).withContext(JSON.stringify(answers)).toBeNull();
    }
  });

  it('rejects a non-array value supplied at runtime', () => {
    expect(calculatePhq9Score('000000000' as unknown as readonly unknown[])).toBeNull();
  });
});
