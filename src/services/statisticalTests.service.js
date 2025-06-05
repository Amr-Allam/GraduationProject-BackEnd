import { getDataByHeader } from '../utils/file.util';
import path from 'path';
import jStat from 'jstat';

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

export function clacKsTestForNormality(req, significanceLevel = 0.05) {
  const { fileName, headerName } = req.body;
  const curPath = `${path.resolve()}/public/${fileName}`;

  const data = getDataByHeader(curPath, headerName);
  if (!data) throw new Error('there is no column with this name');
  validateData(data);

  // Calculate sample mean and standard deviation
  const mean = jStat.mean(data);
  const stdDev = jStat.stdev(data, true); // true for sample standard deviation

  // Sort data for empirical CDF
  const sortedData = [...data].sort((a, b) => a - b);
  const n = sortedData.length;

  // Calculate empirical CDF and compare with theoretical normal CDF
  let maxDiff = 0;
  for (let i = 0; i < n; i++) {
    const x = sortedData[i];
    // Empirical CDF: (i+1)/n (using i+1 to avoid zero)
    const empiricalCDF = (i + 1) / n;
    // Theoretical CDF: normal distribution at x
    const theoreticalCDF = jStat.normal.cdf(x, mean, stdDev);
    // Calculate absolute difference
    const diff = Math.abs(empiricalCDF - theoreticalCDF);
    maxDiff = Math.max(maxDiff, diff);
  }

  // Calculate critical value for KS test
  // Approximation for large samples: c(α) * sqrt(-0.5 * ln(α/2) / n)
  const cAlpha = Math.sqrt(-0.5 * Math.log(significanceLevel / 2));
  const criticalValue = cAlpha * Math.sqrt(1 / n);

  // Return test results
  return {
    statistic: maxDiff,
    criticalValue: criticalValue,
    isNormal: maxDiff <= criticalValue,
    pValue: approximatePValue(maxDiff, n),
    significanceLevel: significanceLevel
  };
}

// Approximate p-value for KS test (using asymptotic distribution)
function approximatePValue(d, n) {
  // For large n, p-value ≈ 2 * exp(-2 * n * D^2)
  const z = Math.sqrt(n) * d;
  return 2 * Math.exp(-2 * z * z);
}

function validateData(sampleData) {
  console.log(sampleData);
  if (!Array.isArray(sampleData)) {
    throw new Error('Data is not an array.');
  }

  const isValid =
    sampleData.length > 0 &&
    sampleData.every((item) => typeof item === 'number' && !isNaN(item));

  if (!isValid) {
    throw new Error('Invalid data: All elements must be numbers.');
  }

  return true;
}
