import { getDataByHeader } from '../utils/file.util';
import path from 'path';
import jStat from 'jstat';
import { validateData } from '../utils/validateData';

export const calcSingle_t_test = (req) => {
  const { populationMean, fileName, headerName, alpha, alternative } = req.body;
  const curPath = path.join('/tmp', fileName);

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

export const calcPaired_t_test = (req) => {
  const { fileName, headerNames, alpha, alternative } = req.body;
  const curPath = path.join('/tmp', fileName);

  const sample1 = getDataByHeader(curPath, headerNames[0]);
  const sample2 = getDataByHeader(curPath, headerNames[1]);

  if (!sample1 || !sample2)
    throw new Error('there is no column with this name');
  validateData(sample1);
  validateData(sample2);

  if (sample1.length !== sample2.length) {
    throw new Error('Both samples must have the same length for paired t-test');
  }

  const testResult = pairedTTest(sample1, sample2, alpha, alternative);
  return testResult;
};

export const calcIndependent_t_test = (req) => {
  const { fileName, headerNames, alpha, alternative } = req.body;
  const curPath = path.join('/tmp', fileName);

  const sample1 = getDataByHeader(curPath, headerNames[0]);
  const sample2 = getDataByHeader(curPath, headerNames[1]);

  if (!sample1 || !sample2)
    throw new Error('there is no column with this name');
  validateData(sample1);
  validateData(sample2);

  const testResult = independentTTest(sample1, sample2, alpha, alternative);
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

function pairedTTest(sample1, sample2, alpha, alternative = 'two-tailed') {
  if (!Array.isArray(sample1) || !Array.isArray(sample2)) {
    throw new Error('Both samples must be arrays.');
  }

  if (sample1.length !== sample2.length) {
    throw new Error('Both samples must have the same length.');
  }

  if (sample1.length < 2) {
    throw new Error('Samples must contain at least two values.');
  }

  // Calculate differences
  const differences = sample1.map((val, i) => val - sample2[i]);
  const n = differences.length;

  // Compute mean of differences
  const meanDiff = differences.reduce((sum, val) => sum + val, 0) / n;

  // Compute standard deviation of differences
  const variance =
    differences.reduce((sum, val) => sum + Math.pow(val - meanDiff, 2), 0) /
    (n - 1);
  const stdDevDiff = Math.sqrt(variance);

  // Compute t-statistic
  const tStatistic = meanDiff / (stdDevDiff / Math.sqrt(n));

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

  return {
    tStatistic,
    pValue,
    degreesOfFreedom: df,
    alternative,
    decision,
    meanDifference: meanDiff,
    standardError: stdDevDiff / Math.sqrt(n)
  };
}

function independentTTest(sample1, sample2, alpha, alternative = 'two-tailed') {
  if (!Array.isArray(sample1) || !Array.isArray(sample2)) {
    throw new Error('Both samples must be arrays.');
  }

  if (sample1.length < 2 || sample2.length < 2) {
    throw new Error('Both samples must contain at least two values.');
  }

  const n1 = sample1.length;
  const n2 = sample2.length;

  // Compute sample means
  const mean1 = sample1.reduce((sum, val) => sum + val, 0) / n1;
  const mean2 = sample2.reduce((sum, val) => sum + val, 0) / n2;

  // Compute sample variances
  const variance1 =
    sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
  const variance2 =
    sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);

  // Compute pooled standard error
  const pooledVariance =
    ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
  const pooledStdError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));

  // Compute t-statistic
  const tStatistic = (mean1 - mean2) / pooledStdError;

  // Compute degrees of freedom
  const df = n1 + n2 - 2;

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

  return {
    tStatistic,
    pValue,
    degreesOfFreedom: df,
    alternative,
    decision,
    mean1,
    mean2,
    meanDifference: mean1 - mean2,
    pooledStandardError: pooledStdError,
    pooledVariance
  };
}

function calculateExactPValue(statistic, n) {
  let p = 0;
  for (let w = 0; w <= statistic; w++) {
    p += wilcoxonProbability(n, w);
  }
  return 2 * p; // Two-tailed test
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

export function calcWilcoxonSignedRankTest(sample1, sample2, alpha = 0.05) {
  if (sample1.length !== sample2.length) {
    throw new Error('Samples must have equal length');
  }

  if (sample1.length < 1) {
    throw new Error('Samples must not be empty');
  }

  // Calculate differences and their absolute values
  const differences = sample1.map((x, i) => x - sample2[i]);
  const absDifferences = differences.map(Math.abs);

  // Filter out zero differences (ties with zero)
  const nonZero = differences
    .map((diff, i) => ({ diff, abs: absDifferences[i], index: i }))
    .filter((item) => item.diff !== 0);

  if (nonZero.length === 0) {
    return {
      statistic: 0,
      pValue: 1,
      significant: false,
      positiveRankSum: 0,
      negativeRankSum: 0,
      ties: differences.length
    };
  }

  // Assign ranks to absolute differences
  nonZero.sort((a, b) => a.abs - b.abs);
  let rank = 1;
  let ranks = new Array(nonZero.length).fill(0);
  let i = 0;

  while (i < nonZero.length) {
    let j = i;
    let sumRanks = 0;
    let count = 0;

    // Handle ties in absolute differences
    while (j < nonZero.length && nonZero[j].abs === nonZero[i].abs) {
      sumRanks += rank;
      count++;
      rank++;
      j++;
    }

    // Assign average rank to tied values
    const avgRank = sumRanks / count;
    for (let k = i; k < j; k++) {
      ranks[k] = avgRank;
    }
    i = j;
  }

  // Calculate positive and negative rank sums
  let positiveRankSum = 0;
  let negativeRankSum = 0;

  nonZero.forEach((item, idx) => {
    if (item.diff > 0) {
      positiveRankSum += ranks[idx];
    } else {
      negativeRankSum += ranks[idx];
    }
  });

  // Test statistic is the smaller of the rank sums
  const statistic = Math.min(positiveRankSum, negativeRankSum);
  const n = nonZero.length;

  // Approximate p-value using normal approximation for n > 20
  let pValue;
  if (n > 20) {
    const mean = (n * (n + 1)) / 4;
    const variance = (n * (n + 1) * (2 * n + 1)) / 24;
    const z = (statistic - mean - 0.5) / Math.sqrt(variance);
    pValue = 2 * (1 - normalCDF(Math.abs(z)));
  } else {
    // Exact p-value for small samples (simplified, using binomial-like approach)
    pValue = calculateExactPValue(statistic, n);
  }

  // Ensure p-value doesn't exceed 1
  pValue = Math.min(pValue, 1);

  return {
    statistic,
    pValue,
    significant: pValue < alpha,
    positiveRankSum,
    negativeRankSum,
    ties: differences.length - n
  };
}

// Normal CDF approximation
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

export function calcANOVA(groups, alpha = 0.05) {
  // Input validation
  if (!Array.isArray(groups) || groups.length < 2) {
    throw new Error('At least two groups are required for ANOVA');
  }
  if (groups.some((group) => !Array.isArray(group) || group.length === 0)) {
    throw new Error('Each group must be a non-empty array');
  }

  // Calculate group statistics
  const groupMeans = groups.map((group) => jStat.mean(group));
  const groupSizes = groups.map((group) => group.length);
  const totalSize = groupSizes.reduce((sum, size) => sum + size, 0);
  const overallMean = jStat.mean(groups.flat());

  // Calculate Sum of Squares Between (SSB)
  const ssb = groupMeans.reduce((sum, mean, i) => {
    return sum + groupSizes[i] * Math.pow(mean - overallMean, 2);
  }, 0);

  // Calculate Sum of Squares Within (SSW)
  const ssw = groups.reduce((sum, group) => {
    const groupMean = jStat.mean(group);
    return (
      sum +
      group.reduce((groupSum, value) => {
        return groupSum + Math.pow(value - groupMean, 2);
      }, 0)
    );
  }, 0);

  // Calculate degrees of freedom
  const dfBetween = groups.length - 1;
  const dfWithin = totalSize - groups.length;
  const dfTotal = totalSize - 1;

  // Calculate Mean Squares
  const msb = ssb / dfBetween;
  const msw = ssw / dfWithin;

  // Calculate F-statistic
  const fStatistic = msb / msw;

  // Calculate p-value using F-distribution
  const pValue = 1 - jStat.centralF.cdf(fStatistic, dfBetween, dfWithin);

  // Generate decision comment
  const decision =
    pValue < alpha
      ? `Reject the null hypothesis: At least one group mean is significantly different (p < ${alpha}).`
      : `Fail to reject the null hypothesis: No significant difference between group means (p ≥ ${alpha}).`;

  // Return a full ANOVA table structure
  return {
    between: {
      source: 'Between',
      df: dfBetween,
      SS: ssb,
      MS: msb,
      F: fStatistic,
      p: pValue,
      decision
    },
    within: {
      source: 'Within',
      df: dfWithin,
      SS: ssw,
      MS: msw
    },
    total: {
      source: 'Total',
      df: dfTotal,
      SS: ssb + ssw
    }
  };
}

export function calcMannWhitneyUTest(sample1, sample2, alpha = 0.05) {
  if (!Array.isArray(sample1) || !Array.isArray(sample2)) {
    throw new Error('Both samples must be arrays');
  }
  if (sample1.length < 1 || sample2.length < 1) {
    throw new Error('Both samples must be non-empty');
  }

  // Combine samples and assign ranks
  const combined = sample1
    .map((v) => ({ value: v, group: 1 }))
    .concat(sample2.map((v) => ({ value: v, group: 2 })));
  combined.sort((a, b) => a.value - b.value);

  // Assign ranks, handling ties
  let ranks = new Array(combined.length);
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (
      j + 1 < combined.length &&
      combined[j + 1].value === combined[i].value
    ) {
      j++;
    }
    const avgRank = (i + j + 2) / 2; // ranks are 1-based
    for (let k = i; k <= j; k++) {
      ranks[k] = avgRank;
    }
    i = j + 1;
  }

  // Sum ranks for each group
  let rankSum1 = 0,
    rankSum2 = 0;
  for (let idx = 0; idx < combined.length; idx++) {
    if (combined[idx].group === 1) rankSum1 += ranks[idx];
    else rankSum2 += ranks[idx];
  }

  const n1 = sample1.length;
  const n2 = sample2.length;
  const U1 = rankSum1 - (n1 * (n1 + 1)) / 2;
  const U2 = rankSum2 - (n2 * (n2 + 1)) / 2;
  const U = Math.min(U1, U2);

  // Normal approximation for large samples
  let mu = (n1 * n2) / 2;
  let sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  let z = (U - mu + 0.5) / sigma; // continuity correction
  let pValue = 2 * (1 - normalCDF(Math.abs(z)));
  pValue = Math.min(pValue, 1);

  return {
    U,
    U1,
    U2,
    pValue,
    significant: pValue < alpha,
    n1,
    n2
  };
}

export function calcChiSquareTest({
  fileName,
  headerNames,
  testType,
  alpha = 0.05
}) {
  const curPath = path.join('/tmp', fileName);
  if (!Array.isArray(headerNames) || headerNames.length < 1) {
    throw new Error('At least one headerName is required');
  }

  // One-sample: Goodness-of-fit
  if (testType === 'goodness-of-fit' && headerNames.length === 1) {
    const observed = getDataByHeader(curPath, headerNames[0]);
    if (!observed) throw new Error('No data found for the specified column');
    validateData(observed);

    // Count frequencies
    const freq = {};
    observed.forEach((val) => {
      freq[val] = (freq[val] || 0) + 1;
    });
    const observedCounts = Object.values(freq);

    // Assume uniform expected frequencies if not provided
    const total = observedCounts.reduce((a, b) => a + b, 0);
    const expectedCount = total / observedCounts.length;
    const expectedCounts = Array(observedCounts.length).fill(expectedCount);

    // Chi-square statistic
    let chi2 = 0;
    for (let i = 0; i < observedCounts.length; i++) {
      chi2 +=
        Math.pow(observedCounts[i] - expectedCounts[i], 2) / expectedCounts[i];
    }
    const df = observedCounts.length - 1;
    const pValue = 1 - jStat.chisquare.cdf(chi2, df);

    return {
      testType,
      chi2,
      pValue,
      df,
      significant: pValue < alpha,
      observedCounts,
      expectedCounts,
      alpha
    };
  }

  // Two-sample: Test of independence (contingency table)
  if (testType === 'independence' && headerNames.length === 2) {
    const col1 = getDataByHeader(curPath, headerNames[0]);
    const col2 = getDataByHeader(curPath, headerNames[1]);
    if (!col1 || !col2)
      throw new Error('No data found for one or both columns');
    validateData(col1);
    validateData(col2);

    if (col1.length !== col2.length) {
      throw new Error('Both columns must have the same number of rows');
    }

    // Build contingency table
    const rowCats = Array.from(new Set(col1));
    const colCats = Array.from(new Set(col2));
    const table = Array.from({ length: rowCats.length }, () =>
      Array(colCats.length).fill(0)
    );

    for (let i = 0; i < col1.length; i++) {
      const rowIdx = rowCats.indexOf(col1[i]);
      const colIdx = colCats.indexOf(col2[i]);
      table[rowIdx][colIdx]++;
    }

    // Row and column totals
    const rowTotals = table.map((row) => row.reduce((a, b) => a + b, 0));
    const colTotals = colCats.map((_, j) =>
      table.reduce((sum, row) => sum + row[j], 0)
    );
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    // Expected counts and chi-square statistic
    let chi2 = 0;
    const expected = table.map((row, i) =>
      row.map((_, j) => (rowTotals[i] * colTotals[j]) / grandTotal)
    );
    for (let i = 0; i < rowCats.length; i++) {
      for (let j = 0; j < colCats.length; j++) {
        if (expected[i][j] > 0) {
          chi2 += Math.pow(table[i][j] - expected[i][j], 2) / expected[i][j];
        }
      }
    }
    const df = (rowCats.length - 1) * (colCats.length - 1);
    const pValue = 1 - jStat.chisquare.cdf(chi2, df);

    return {
      testType,
      chi2,
      pValue,
      df,
      significant: pValue < alpha,
      observed: table,
      expected,
      rowCategories: rowCats,
      colCategories: colCats,
      alpha
    };
  }

  throw new Error('Invalid testType or number of columns for chi-square test');
}

// Probability of rank sum W for n pairs
function wilcoxonProbability(n, w) {
  const table = new Array(n + 1).fill(0).map(() => new Array(w + 1).fill(0));
  table[0][0] = 1;

  for (let i = 1; i <= n; i++) {
    table[i][0] = table[i - 1][0];
    for (let j = 1; j <= w && j <= (i * (i + 1)) / 2; j++) {
      table[i][j] = table[i - 1][j] + (j >= i ? table[i - 1][j - i] : 0);
    }
  }

  const total = Math.pow(2, n);
  return table[n][w] / total;
}

export const calcSingle_z_test = (req) => {
  const {
    populationMean,
    populationStdDev,
    fileName,
    headerName,
    headerNames,
    alpha,
    alternative
  } = req.body;
  const curPath = path.join('/tmp', fileName);

  // Support both headerName and headerNames[0]
  const colName =
    headerName || (Array.isArray(headerNames) ? headerNames[0] : undefined);

  const sampleData = getDataByHeader(curPath, colName);
  if (!sampleData) throw new Error('there is no column with this name');
  validateData(sampleData);
  const testResult = oneSampleZTest(
    sampleData,
    populationMean,
    populationStdDev,
    alpha,
    alternative
  );

  return testResult;
};

export const calcTwo_sample_z_test = (req) => {
  const {
    fileName,
    headerNames,
    alpha,
    alternative,
    populationMean1,
    populationMean2,
    populationStdDev1,
    populationStdDev2
  } = req.body;
  const curPath = path.join('/tmp', fileName);

  const sample1 = getDataByHeader(curPath, headerNames[0]);
  const sample2 = getDataByHeader(curPath, headerNames[1]);

  if (!sample1 || !sample2)
    throw new Error('there is no column with this name');
  validateData(sample1);
  validateData(sample2);

  const testResult = twoSampleZTest(
    sample1,
    sample2,
    populationStdDev1,
    populationStdDev2,
    alpha,
    alternative,
    populationMean1,
    populationMean2
  );

  return testResult;
};

function oneSampleZTest(
  sample,
  populationMean,
  populationStdDev,
  alpha = 0.05,
  alternative = 'two-tailed'
) {
  if (!Array.isArray(sample) || sample.length < 1) {
    throw new Error('Sample must contain at least one value.');
  }

  const n = sample.length;
  const sampleMean = jStat.mean(sample);
  const standardError = populationStdDev / Math.sqrt(n);
  const zStatistic = (sampleMean - populationMean) / standardError;

  let pValue;
  if (alternative === 'two-tailed') {
    pValue = 2 * (1 - jStat.normal.cdf(Math.abs(zStatistic), 0, 1));
  } else if (alternative === 'greater') {
    pValue = 1 - jStat.normal.cdf(zStatistic, 0, 1);
  } else if (alternative === 'less') {
    pValue = jStat.normal.cdf(zStatistic, 0, 1);
  } else {
    throw new Error(
      "Invalid alternative hypothesis. Choose 'two-tailed', 'greater', or 'less'."
    );
  }

  const decision =
    pValue < alpha
      ? 'Reject the null hypothesis'
      : 'Fail to reject the null hypothesis';

  return {
    zStatistic,
    pValue,
    sampleMean,
    standardError,
    alternative,
    decision,
    sampleSize: n
  };
}

function twoSampleZTest(
  sample1,
  sample2,
  stdDev1,
  stdDev2,
  alpha = 0.05,
  alternative = 'two-tailed',
  populationMean1 = 0,
  populationMean2 = 0
) {
  if (!Array.isArray(sample1) || !Array.isArray(sample2)) {
    throw new Error('Both samples must be arrays.');
  }

  const n1 = sample1.length;
  const n2 = sample2.length;
  const mean1 = jStat.mean(sample1);
  const mean2 = jStat.mean(sample2);

  const standardError = Math.sqrt(
    Math.pow(stdDev1, 2) / n1 + Math.pow(stdDev2, 2) / n2
  );
  const zStatistic =
    (mean1 - mean2 - (populationMean1 - populationMean2)) / standardError;

  let pValue;
  if (alternative === 'two-tailed') {
    pValue = 2 * (1 - jStat.normal.cdf(Math.abs(zStatistic), 0, 1));
  } else if (alternative === 'greater') {
    pValue = 1 - jStat.normal.cdf(zStatistic, 0, 1);
  } else if (alternative === 'less') {
    pValue = jStat.normal.cdf(zStatistic, 0, 1);
  } else {
    throw new Error(
      "Invalid alternative hypothesis. Choose 'two-tailed', 'greater', or 'less'."
    );
  }

  const decision =
    pValue < alpha
      ? 'Reject the null hypothesis'
      : 'Fail to reject the null hypothesis';

  return {
    zStatistic,
    pValue,
    mean1,
    mean2,
    meanDifference: mean1 - mean2,
    standardError,
    alternative,
    decision,
    sampleSize1: n1,
    sampleSize2: n2
  };
}

// Two-way ANOVA implementation
export function calcTwoWayANOVA(groups, levelsA, levelsB, alpha = 0.05) {
  // groups: 2D array [A][B] of values
  // levelsA: unique values for factor A
  // levelsB: unique values for factor B
  // alpha: significance level

  const a = levelsA.length;
  const b = levelsB.length;
  const n = groups.reduce(
    (sum, row) => sum + row.reduce((s, g) => s + g.length, 0),
    0
  );
  const cellSizes = groups.map((row) => row.map((g) => g.length));

  // Flatten all values
  const allValues = groups.flat(2);
  const grandMean = jStat.mean(allValues);

  // Means
  const meanA = groups.map((row) => jStat.mean(row.flat()));
  const meanB = levelsB.map((_, j) =>
    jStat.mean(groups.map((row) => row[j]).flat())
  );
  const cellMeans = groups.map((row) => row.map((g) => jStat.mean(g)));

  // SS total
  const SST = allValues.reduce((sum, v) => sum + Math.pow(v - grandMean, 2), 0);

  // SS for factor A
  const SSA = meanA.reduce((sum, mA, i) => {
    const ni = cellSizes[i].reduce((a, b) => a + b, 0);
    return sum + ni * Math.pow(mA - grandMean, 2);
  }, 0);

  // SS for factor B
  const nj = cellSizes[0].map((_, j) =>
    cellSizes.map((row) => row[j]).reduce((a, b) => a + b, 0)
  );
  const SSB = meanB.reduce((sum, mB, j) => {
    return sum + nj[j] * Math.pow(mB - grandMean, 2);
  }, 0);

  // SS for interaction
  let SSI = 0;
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < b; j++) {
      const nij = cellSizes[i][j];
      if (nij === 0) continue;
      SSI +=
        nij * Math.pow(cellMeans[i][j] - meanA[i] - meanB[j] + grandMean, 2);
    }
  }

  // SS error (within)
  let SSE = 0;
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < b; j++) {
      const mean = cellMeans[i][j];
      SSE += groups[i][j].reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    }
  }

  // Degrees of freedom
  const dfA = a - 1;
  const dfB = b - 1;
  const dfI = dfA * dfB;
  const dfE = n - a * b;

  // Mean squares
  const MSA = SSA / dfA;
  const MSB = SSB / dfB;
  const MSI = SSI / dfI;
  const MSE = SSE / dfE;

  // F statistics
  const FA = MSA / MSE;
  const FB = MSB / MSE;
  const FI = MSI / MSE;

  // p-values
  const pA = 1 - jStat.centralF.cdf(FA, dfA, dfE);
  const pB = 1 - jStat.centralF.cdf(FB, dfB, dfE);
  const pI = 1 - jStat.centralF.cdf(FI, dfI, dfE);

  // Decision logic
  const decisionA =
    pA < alpha
      ? `Reject the null hypothesis: There is a significant effect of Factor A (p < ${alpha}).`
      : `Fail to reject the null hypothesis: No significant effect of Factor A (p ≥ ${alpha}).`;

  const decisionB =
    pB < alpha
      ? `Reject the null hypothesis: There is a significant effect of Factor B (p < ${alpha}).`
      : `Fail to reject the null hypothesis: No significant effect of Factor B (p ≥ ${alpha}).`;

  const decisionI =
    pI < alpha
      ? `Reject the null hypothesis: There is a significant interaction effect (p < ${alpha}).`
      : `Fail to reject the null hypothesis: No significant interaction effect (p ≥ ${alpha}).`;

  return {
    FactorA: {
      name: levelsA,
      df: dfA,
      SS: SSA,
      MS: MSA,
      F: FA,
      p: pA,
      decision: decisionA
    },
    FactorB: {
      name: levelsB,
      df: dfB,
      SS: SSB,
      MS: MSB,
      F: FB,
      p: pB,
      decision: decisionB
    },
    Interaction: {
      df: dfI,
      SS: SSI,
      MS: MSI,
      F: FI,
      p: pI,
      decision: decisionI
    },
    Error: { df: dfE, SS: SSE },
    Total: { df: n - 1, SS: SST },
    summary: {
      FactorA: { F: FA, p: pA, decision: decisionA },
      FactorB: { F: FB, p: pB, decision: decisionB },
      Interaction: { F: FI, p: pI, decision: decisionI }
    }
  };
}
