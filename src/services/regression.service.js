import { matrix, multiply, inv, transpose } from 'mathjs';
import { getDataByHeader } from '../utils/file.util';
import path from 'path';
import { validateData } from '../utils/validateData';

export function calcLinearReg(req) {
  const { independentNames, dependentName, fileName } = req.body;

  // Validate request body
  if (
    !Array.isArray(independentNames) ||
    independentNames.length === 0 ||
    !dependentName ||
    !fileName
  ) {
    throw new Error('Missing or invalid required fields in request body');
  }
  if (new Set(independentNames).size !== independentNames.length) {
    throw new Error('Duplicate independent variable names provided');
  }

  // Construct safe file path
  const safeFileName = path.basename(fileName);
  const curPath = path.join('/tmp', safeFileName);

  // Extract data
  const dependent = getDataByHeader(curPath, dependentName);
  if (!dependent) throw new Error(`No column found for ${dependentName}`);
  validateData(dependent);

  const independents = independentNames.map((name) => {
    const data = getDataByHeader(curPath, name);
    if (!data) throw new Error(`No column found for ${name}`);
    validateData(data);
    return data;
  });

  // Validate data lengths
  const n = dependent.length;
  if (n === 0) throw new Error('No data points provided');
  if (independents.some((data) => data.length !== n)) {
    throw new Error('All variables must have the same length');
  }
  const k = independentNames.length;
  if (n <= k) throw new Error(`At least ${k + 1} data points are required`);

  // Create design matrix X and dependent vector y
  const X = matrix(
    Array(n)
      .fill()
      .map((_, i) => [1, ...independents.map((data) => Number(data[i]))])
  );
  const y = matrix(dependent.map((val) => [Number(val)]));

  // Check for non-numeric data
  if (
    X.toArray().some((row) => row.some(isNaN)) ||
    y.toArray().some((row) => row.some(isNaN))
  ) {
    throw new Error('Non-numeric data detected');
  }

  // Calculate coefficients using normal equation
  const Xt = transpose(X); // Fixed: Use transpose(X) instead of X.transpose()
  const XtX = multiply(Xt, X);
  let beta;
  try {
    beta = multiply(inv(XtX), multiply(Xt, y)).toArray().flat();
  } catch (e) {
    throw new Error(
      'Failed to compute coefficients: possibly due to multicollinearity or insufficient data'
    );
  }

  // Build regression equation
  const intercept = beta[0];
  const slopes = beta.slice(1);
  let equation = `y = ${intercept.toFixed(4)}`;
  independentNames.forEach((name, i) => {
    const sign = slopes[i] >= 0 ? '+' : '-';
    equation += ` ${sign} ${Math.abs(slopes[i]).toFixed(4)}*${name}`;
  });

  // Calculate R² and standard error
  let ssTotal = 0,
    ssResidual = 0;
  const yMean = dependent.reduce((sum, val) => sum + Number(val), 0) / n;
  for (let i = 0; i < n; i++) {
    const yHat =
      beta[0] +
      independents.reduce(
        (sum, data, j) => sum + beta[j + 1] * Number(data[i]),
        0
      );
    ssResidual += (dependent[i] - yHat) ** 2;
    ssTotal += (dependent[i] - yMean) ** 2;
  }
  if (ssTotal === 0)
    throw new Error('Cannot calculate R²: all y values are identical');
  if (ssResidual < 0)
    throw new Error('Numerical error: negative residual sum of squares');
  const rSquared = 1 - ssResidual / ssTotal;
  const standardError = Math.sqrt(ssResidual / (n - k - 1));

  // Check for invalid results
  if (beta.some(isNaN) || isNaN(rSquared) || isNaN(standardError)) {
    throw new Error('Invalid calculation results');
  }

  // Return results
  return {
    linearRegressionEquation: equation,
    intercept: intercept.toFixed(4),
    slopes: slopes.map((slope, i) => ({
      variable: independentNames[i],
      coefficient: slope.toFixed(4)
    })),
    coefficientOfDetermination: rSquared.toFixed(4),
    standardError: standardError.toFixed(4)
  };
}
