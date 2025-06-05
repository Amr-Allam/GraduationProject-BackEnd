import { getDataByHeader } from '../utils/file.util';
import path from 'path';

export function calcLinearReg(req) {
  const { independentName, dependentName, fileName } = req.body;
  const curPath = `${path.resolve()}/public/${fileName}`;

  const independent = getDataByHeader(curPath, independentName);
  const dependent = getDataByHeader(curPath, dependentName);

  if (!independent || !dependent)
    throw new Error('there is no column with this name');

  validateData(independent);
  validateData(dependent);

  let n = independent.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;

  // Calculate sums
  for (let i = 0; i < n; i++) {
    let x = independent[i];
    let y = dependent[i];

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  // Calculate slope (m) and intercept (b)
  let m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  let b = (sumY - m * sumX) / n;

  // Calculate R² (coefficient of determination)
  let ssTotal = sumY2 - (sumY * sumY) / n;
  let ssResidual =
    sumY2 -
    2 * m * sumXY -
    2 * b * sumY +
    n * b * b +
    m * m * sumX2 +
    2 * m * b * sumX;
  let rSquared = 1 - ssResidual / ssTotal;

  // Calculate standard error
  let standardError = Math.sqrt(ssResidual / (n - 2));

  return {
    linearRegressionEquation: `y = ${m.toFixed(4)}x + ${b.toFixed(4)}`,
    intercept: b.toFixed(4),
    slope: m.toFixed(4),
    coefficientOfDetermination: rSquared.toFixed(4),
    standardError: standardError.toFixed(4)
  };
}

function validateData(sampleData) {
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
