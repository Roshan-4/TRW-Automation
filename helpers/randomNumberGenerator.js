/**
 * Framework-wide random number generator for throwaway form data.
 *
 * Default output:
 * - exactly 10 digits
 * - first digit is 6, 7, 8 or 9
 * - no digit repeats inside a single number
 * - each generated value is unique for the current Node/Cypress process
 */
const FIRST_DIGITS = ['6', '7', '8', '9'];
const ALL_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const issuedNumbers = new Set();

const shuffle = (items) => {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }
  return copy;
};

const buildNumber = () => {
  const firstDigit = FIRST_DIGITS[Math.floor(Math.random() * FIRST_DIGITS.length)];
  const remainingDigits = shuffle(ALL_DIGITS.filter((digit) => digit !== firstDigit));
  return `${firstDigit}${remainingDigits.join('')}`;
};

const randomNumberGenerator = () => {
  const maxAttempts = 5000;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const number = buildNumber();
    if (!issuedNumbers.has(number)) {
      issuedNumbers.add(number);
      return number;
    }
  }
  throw new Error('Unable to generate a unique 10-digit random number');
};

const resetRandomNumberGenerator = () => {
  issuedNumbers.clear();
};

module.exports = {
  randomNumberGenerator,
  resetRandomNumberGenerator,
};
