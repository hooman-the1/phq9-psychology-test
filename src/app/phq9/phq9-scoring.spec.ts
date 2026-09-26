import { calculatePhq9Score, Phq9SeverityCategory } from './phq9-scoring';

describe('PHQ-9 scoring', () => {
  it('sums valid answers and classifies the minimum and maximum', () => {
    expect(calculatePhq9Score(Array(9).fill(0))).toEqual({ total: 0, category: 'minimal' });
    expect(calculatePhq9Score(Array(9).fill(3))).toEqual({ total: 27, category: 'severe' });
    expect(calculatePhq9Score([0, 1, 2, 3, 0, 1, 2, 3, 0])).toEqual({
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
      const answers = Array(9).fill(0).map((_, index) =>
        Math.min(3, Math.max(0, total - index * 3)),
      );
      expect(calculatePhq9Score(answers)).toEqual({ total, category });
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
});
