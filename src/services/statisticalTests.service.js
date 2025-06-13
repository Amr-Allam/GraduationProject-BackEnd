import { getDataByHeader } from '../utils/file.util';
import path from 'path';
import jStat from 'jstat';
import { validateData } from '../utils/validateData';

export const calcSingle_t_test = (req) => {
  const { populationMean, fileName, headerName, alpha, alternative } = req.body;
  const curPath = `${path.resolve()}/public/${fileName}`;

  const sampleData = getDataByHeader(curPath, headerName);
  if (!sampleData) throw new Error('there is no column with this name');
  validateData(sampleData);
  const testResult = oneSampleTTest(
    sampleData,
    populationMean,
    alpha,
    alternative
  );

  return testResult;
};

function oneSampleTTest(
  sample,
  populationMean,
  alpha,
  alternative = 'two-tailed'
) {
  if (!Array.isArray(sample) || sample.length < 2) {
    throw new Error('Sample must contain at least two values.');
  }

  const n = sample.length;

  // Compute sample mean
  const sampleMean = sample.reduce((sum, val) => sum + val, 0) / n;

  // Compute sample standard deviation
  const variance =
    sample.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) /
    (n - 1);
  const sampleStdDev = Math.sqrt(variance);

  // Compute t-statistic
  const tStatistic =
    (sampleMean - populationMean) / (sampleStdDev / Math.sqrt(n));

  // Compute degrees of freedom
  const df = n - 1;

  // Compute p-value using the jStat library
  let pValue;
  if (alternative === 'two-tailed') {
    pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), df));
  } else if (alternative === 'greater') {
    pValue = 1 - jStat.studentt.cdf(tStatistic, df);
  } else if (alternative === 'less') {
    pValue = jStat.studentt.cdf(tStatistic, df);
  } else {
    throw new Error(
      "Invalid alternative hypothesis. Choose 'two-tailed', 'greater', or 'less'."
    );
  }

  // Decision based on significance level (alpha)
  const decision =
    pValue < alpha
      ? 'Reject the null hypothesis'
      : 'Fail to reject the null hypothesis';

  return { tStatistic, pValue, degreesOfFreedom: df, alternative, decision };
}

export function clacKsTestForNormality(data, significanceLevel = 0.05) {
  // Calculate sample mean and standard deviation
  const mean = jStat.mean(data);
  const stdDev = jStat.stdev(data, true); // true for sample standard deviation

  // Sort data for empirical CDF
  const sortedData = [...data].sort((a, b) => a - b);
  const n = sortedData.length;

  // Calculate empirical CDF and compare with theoretical normal CDF
  let dPlus = 0,
    dMinus = 0;
  for (let i = 0; i < n; i++) {
    const x = sortedData[i];
    const empiricalCDF1 = (i + 1) / n;
    const empiricalCDF2 = i / n;
    const theoreticalCDF = jStat.normal.cdf(x, mean, stdDev);
    dPlus = Math.max(dPlus, empiricalCDF1 - theoreticalCDF);
    dMinus = Math.max(dMinus, theoreticalCDF - empiricalCDF2);
  }
  const maxDiff = Math.max(dPlus, dMinus);

  // Calculate critical value for KS test
  // Approximation for large samples: c(α) * sqrt(-0.5 * ln(α/2) / n)
  const k = 1.36;
  const criticalValue = k / Math.sqrt(n);

  // Return test results
  return {
    statistic: maxDiff,
    criticalValue: criticalValue,
    isNormal: maxDiff <= criticalValue,
    pValue: approximatePValue(maxDiff, n),
    significanceLevel: significanceLevel
  };
}

function approximatePValue(d, n) {
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * d;
  let sum = 0;
  for (let j = 1; j <= 100; j++) {
    sum += Math.pow(-1, j - 1) * Math.exp(-2 * j * j * lambda * lambda);
  }
  return Math.min(Math.max(2 * sum, 0), 1);
}

export function calcSignTest(sample1, sample2, alpha = 0.05) {
  if (sample1.length !== sample2.length) {
    throw new Error('Samples must have equal length');
  }

  if (sample1.length < 1) {
    throw new Error('Samples must not be empty');
  }

  // Calculate differences and count signs
  let positive = 0;
  let negative = 0;
  let zeros = 0;

  for (let i = 0; i < sample1.length; i++) {
    const diff = sample1[i] - sample2[i];
    if (diff > 0) positive++;
    else if (diff < 0) negative++;
    else zeros++;
  }

  // Effective sample size (excluding ties)
  const n = positive + negative;

  if (n === 0) {
    return {
      statistic: 0,
      pValue: 1,
      significant: false,
      positiveSigns: positive,
      negativeSigns: negative,
      ties: zeros
    };
  }

  // Test statistic is the smaller of positive or negative counts
  const statistic = Math.min(positive, negative);

  // Calculate p-value using binomial distribution
  let pValue = 0;
  const p = 0.5; // Null hypothesis: equal probability of positive/negative

  // Calculate cumulative probability for values <= statistic
  for (let k = 0; k <= statistic; k++) {
    pValue += binomialProbability(n, k, p);
  }

  // Two-tailed test: multiply by 2
  pValue *= 2;

  // Ensure p-value doesn't exceed 1
  pValue = Math.min(pValue, 1);

  return {
    statistic,
    pValue,
    significant: pValue < alpha,
    positiveSigns: positive,
    negativeSigns: negative,
    ties: zeros
  };
}

// Helper function to calculate binomial probability
function binomialProbability(n, k, p) {
  const coefficient = binomialCoefficient(n, k);
  return coefficient * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// Helper function to calculate binomial coefficient
function binomialCoefficient(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;

  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k; i++) {
    c *= (n - i) / (k - i);
  }
  return c;
}
