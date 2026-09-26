import { LatinToPersianNumbersPipe } from './latin-to-persian-numbers.pipe';

describe('LatinToPersianNumbersPipe', () => {
  const pipe = new LatinToPersianNumbersPipe();

  it('converts every Latin digit to its Persian equivalent', () => {
    expect(pipe.transform('0123456789')).toBe('۰۱۲۳۴۵۶۷۸۹');
  });

  it('preserves non-digit characters and converts digits in mixed text', () => {
    expect(pipe.transform('Score: 12/27, answer #3')).toBe(
      'Score: ۱۲/۲۷, answer #۳',
    );
  });

  it('returns nullish inputs unchanged', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeUndefined();
  });
});
