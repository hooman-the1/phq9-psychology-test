export interface Phq9ValidationResult {
  readonly isValid: boolean;
  readonly missingQuestionIndices: number[];
}

export function validatePhq9Answers(
  answers: readonly (number | null)[],
): Phq9ValidationResult {
  const missingQuestionIndices = answers.reduce<number[]>((missing, answer, index) => {
    if (answer === null) {
      missing.push(index);
    }

    return missing;
  }, []);

  return {
    isValid: missingQuestionIndices.length === 0,
    missingQuestionIndices,
  };
}
