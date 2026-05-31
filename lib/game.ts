export type FloatFormat = "32bit" | "16bit";

export interface IEEE754Problem {
  value: number;
  sign: number;
  exponentBits: number[];
  mantissaBits: number[];
  significantMantissaLength: number; // number of non-trailing-zero bits
  biasedExponent: number;
  exponent: number;
  mantissaFull: string;
  difficulty: number;
  format: FloatFormat;
}

export interface GameConfig {
  format: FloatFormat;
  mode: "basic" | "advanced";
  totalProblems: number;
}

const EXPONENT_BITS = { "32bit": 8, "16bit": 5 };
const MANTISSA_BITS = { "32bit": 23, "16bit": 10 };
const BIAS = { "32bit": 127, "16bit": 15 };

function toBinary(n: number, bits: number): number[] {
  const result: number[] = [];
  for (let i = bits - 1; i >= 0; i--) {
    result.push((n >> i) & 1);
  }
  return result;
}

export function generateProblem(
  format: FloatFormat,
  difficulty: number
): IEEE754Problem {
  // difficulty 1-5
  // integer part: 0-15 (4 bits max)
  // fractional parts: multiples of 0.0625=1/16
  // together max 8 binary digits

  let value: number;
  if (difficulty === 1) {
    // simple: small integer + 0.5 (mantissa is never all-zero)
    const intPart = Math.floor(Math.random() * 4); // 0-3
    value = intPart + 0.5;
  } else if (difficulty === 2) {
    // integer + one fractional bit (0.5 or 0.25)
    const intPart = Math.floor(Math.random() * 8) + 1;
    const frac = Math.random() < 0.5 ? 0.5 : 0.25;
    value = intPart + frac;
  } else if (difficulty === 3) {
    // integer + one fractional bit
    const intPart = Math.floor(Math.random() * 8);
    const fracChoices = [0.5, 0.25];
    const frac = fracChoices[Math.floor(Math.random() * fracChoices.length)];
    value = intPart + frac;
  } else if (difficulty === 4) {
    // integer + two fractional bits
    const intPart = Math.floor(Math.random() * 8);
    const fracNumerator = Math.floor(Math.random() * 3) + 1; // 1-3 in quarters
    const frac = fracNumerator * 0.25;
    value = intPart + frac;
    if (value === 0) value = 0.25;
  } else {
    // difficulty 5: up to 4 fractional bits
    const intPart = Math.floor(Math.random() * 8);
    const fracNumerator = Math.floor(Math.random() * 15) + 1;
    const frac = fracNumerator * 0.0625;
    value = intPart + frac;
    if (value === 0) value = 0.0625;
  }

  const problem = computeIEEE754(value, format, difficulty);
  // Reject integer-only problems (all-zero mantissa) and retry
  if (problem.significantMantissaLength === 0) {
    return generateProblem(format, difficulty);
  }
  return problem;
}

export function computeIEEE754(
  value: number,
  format: FloatFormat,
  difficulty: number
): IEEE754Problem {
  const expBits = EXPONENT_BITS[format];
  const manBits = MANTISSA_BITS[format];
  const bias = BIAS[format];

  const sign = value < 0 ? 1 : 0;
  const absValue = Math.abs(value);

  // Find exponent: absValue = 1.mantissa * 2^exponent
  let exponent = 0;
  if (absValue !== 0) {
    exponent = Math.floor(Math.log2(absValue));
  }

  const biasedExponent = exponent + bias;
  const exponentBitsArr = toBinary(biasedExponent, expBits);

  // Compute mantissa
  let mantissaValue = absValue / Math.pow(2, exponent) - 1; // fractional part after leading 1
  const mantissaBitsArr: number[] = [];
  for (let i = 0; i < manBits; i++) {
    mantissaValue *= 2;
    const bit = Math.floor(mantissaValue);
    mantissaBitsArr.push(bit);
    mantissaValue -= bit;
  }

  // Find significant mantissa length (strip trailing zeros)
  let sigLen = manBits;
  while (sigLen > 0 && mantissaBitsArr[sigLen - 1] === 0) {
    sigLen--;
  }

  const mantissaFull = mantissaBitsArr.join("");

  return {
    value,
    sign,
    exponentBits: exponentBitsArr,
    mantissaBits: mantissaBitsArr,
    significantMantissaLength: sigLen,
    biasedExponent,
    exponent,
    mantissaFull,
    difficulty,
    format,
  };
}

export function generateBasicProblems(
  format: FloatFormat,
  total: number
): IEEE754Problem[] {
  const problems: IEEE754Problem[] = [];
  // difficulty distribution: 1,2,3,4,5 evenly
  for (let i = 0; i < total; i++) {
    const difficulty = Math.floor((i / total) * 5) + 1;
    problems.push(generateProblem(format, Math.min(difficulty, 5)));
  }
  return problems;
}

export function generateAdvancedProblems(
  format: FloatFormat,
  total: number
): IEEE754Problem[] {
  const problems: IEEE754Problem[] = [];
  for (let i = 0; i < total; i++) {
    const difficulty = Math.floor(Math.random() * 5) + 1;
    problems.push(generateProblem(format, difficulty));
  }
  return problems;
}

export function validateAnswer(
  problem: IEEE754Problem,
  signInput: string,
  exponentInput: string[],
  mantissaInput: string[]
): boolean {
  if (signInput !== String(problem.sign)) return false;
  for (let i = 0; i < problem.exponentBits.length; i++) {
    if (exponentInput[i] !== String(problem.exponentBits[i])) return false;
  }
  for (let i = 0; i < problem.significantMantissaLength; i++) {
    if (mantissaInput[i] !== String(problem.mantissaBits[i])) return false;
  }
  return true;
}

export function getHintSteps(problem: IEEE754Problem): string[] {
  const bias = BIAS[problem.format];
  const steps: string[] = [];

  const absVal = Math.abs(problem.value);

  // Step 1: sign
  steps.push(
    `① 符号ビット: ${problem.value >= 0 ? "正の数なので" : "負の数なので"} sign = ${problem.sign}`
  );

  // Step 2: binary representation
  const intPart = Math.floor(absVal);
  const fracPart = absVal - intPart;

  let intBin = intPart === 0 ? "0" : intPart.toString(2);
  let fracBin = "";
  let f = fracPart;
  for (let i = 0; i < 8 && f > 0; i++) {
    f *= 2;
    fracBin += Math.floor(f);
    f -= Math.floor(f);
  }

  const fullBin = intBin + (fracBin ? "." + fracBin : "");
  steps.push(`② 2進数表現: ${absVal} = ${fullBin}`);

  // Step 3: normalized form
  steps.push(
    `③ 正規化: 1.${problem.mantissaFull.replace(/0+$/, "") || "0"} × 2^${problem.exponent}`
  );

  // Step 4: biased exponent
  steps.push(
    `④ 指数部 (バイアス=${bias}): ${problem.exponent} + ${bias} = ${problem.biasedExponent} = ${problem.exponentBits.join("")}₂`
  );

  // Step 5: mantissa
  const sigMantissa = problem.mantissaBits
    .slice(0, problem.significantMantissaLength)
    .join("");
  const trailingZeros = problem.mantissaBits
    .slice(problem.significantMantissaLength)
    .join("");
  steps.push(
    `⑤ 仮数部: ${sigMantissa}${trailingZeros} (有効ビット: ${sigMantissa || "なし"}, 末尾0: ${trailingZeros.length}ビット)`
  );

  // Step 6: final
  steps.push(
    `⑥ 最終結果: [${problem.sign}] [${problem.exponentBits.join("")}] [${problem.mantissaFull}]`
  );

  return steps;
}
