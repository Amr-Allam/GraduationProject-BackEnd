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
