import { getDataByHeader } from '../utils/file.util';
import path from 'path';
import { validateData } from '../utils/validateData';

export function calcLinearReg(req) {
  const { independentName, dependentName, fileName } = req.body;

  // Validate request body
  if (!independentName || !dependentName || !fileName) {
    throw new Error('Missing required fields in request body');
  }

  // Construct safe file path
  const safeFileName = path.basename(fileName);
  const curPath = path.join(path.resolve(), 'public', safeFileName);

  // Extract data
  const independent = getDataByHeader(curPath, independentName);
  const dependent = getDataByHeader(curPath, dependentName);

  // Validate columns
  if (!independent) throw new Error(`No column found for ${independentName}`);
  if (!dependent) throw new Error(`No column found for ${dependentName}`);

  // Validate data
  validateData(independent);
  validateData(dependent);

  // Check array lengths
  const n = independent.length;
  if (n !== dependent.length) {
    throw new Error(
      'Independent and dependent variables must have the same length'
    );
  }
  if (n === 0) throw new Error('No data points provided');
  if (n <= 2) throw new Error('At least three data points are required');

  // Calculate sums
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = Number(independent[i]);
    const y = Number(dependent[i]);
    if (isNaN(x) || isNaN(y)) throw new Error('Non-numeric data detected');
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  // Calculate slope (m) and intercept (b)
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0)
    throw new Error('Cannot calculate slope: all x values are identical');
  const m = (n * sumXY - sumX * sumY) / denominator;
  const b = (sumY - m * sumX) / n;

  // Calculate R²
  const ssTotal = sumY2 - (sumY * sumY) / n;
  if (ssTotal === 0)
    throw new Error('Cannot calculate R²: all y values are identical');
  let ssResidual = 0;
  for (let i = 0; i < n; i++) {
    const yHat = m * independent[i] + b;
    ssResidual += (dependent[i] - yHat) ** 2;
  }
  const rSquared = 1 - ssResidual / ssTotal;

  // Calculate standard error
  if (ssResidual < 0)
    throw new Error('Numerical error: negative residual sum of squares');
  const standardError = Math.sqrt(ssResidual / (n - 2));

  // Check for invalid results
  if (isNaN(m) || isNaN(b) || isNaN(rSquared) || isNaN(standardError)) {
    throw new Error('Invalid calculation results');
  }

  // Return formatted results
  return {
    linearRegressionEquation: `y = ${m.toFixed(4)}x ${
      b >= 0 ? '+' : '-'
    } ${Math.abs(b).toFixed(4)}`,
    intercept: b.toFixed(4),
    slope: m.toFixed(4),
    coefficientOfDetermination: rSquared.toFixed(4),
    standardError: standardError.toFixed(4)
  };
}
