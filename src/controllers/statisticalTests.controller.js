import path from 'path';

import {
  calcANOVA,
  calcSignTest,
  calcSingle_t_test,
  calcWilcoxonSignedRankTest,
  clacKsTestForNormality,
  calcMannWhitneyUTest,
  calcChiSquareTest,
  calcPaired_t_test,
  calcIndependent_t_test
} from '../services/statisticalTests.service';
import { getDataByHeader } from '../utils/file.util';
import { validateData } from '../utils/validateData';

export const single_t_test = (req, res) => {
  const result = calcSingle_t_test(req, res);

  return res.json({ message: 'Upload successful', result });
};

export const kolmogorovSmirnovNormalTest = (req, res) => {
  const { fileName, headerName } = req.body;
  const curPath = `${path.resolve()}/public/${fileName}`;

  const data = getDataByHeader(curPath, headerName);
  if (!data) throw new Error('there is no column with this name');
  validateData(data);
  const result = clacKsTestForNormality(data);

  return res.json({ message: 'Upload successful', result });
};

export const signTest = (req, res) => {
  const { fileName, headerNames } = req.body;
  const curPath = `${path.resolve()}/public/${fileName}`;

  const sample1 = getDataByHeader(curPath, headerNames[0]);
  const sample2 = getDataByHeader(curPath, headerNames[1]);

  if (!sample1 || !sample2)
    throw new Error('there is no column with this name');
  validateData(sample1);
  validateData(sample2);

  const result = calcSignTest(sample1, sample2);

  return res.json({ message: 'Upload successful', result });
};

export const wilcoxonSignedRankTest = (req, res) => {
  const { fileName, headerNames } = req.body;
  const curPath = `${path.resolve()}/public/${fileName}`;

  const sample1 = getDataByHeader(curPath, headerNames[0]);
  const sample2 = getDataByHeader(curPath, headerNames[1]);

  if (!sample1 || !sample2)
    throw new Error('there is no column with this name');
  validateData(sample1);
  validateData(sample2);

  const result = calcWilcoxonSignedRankTest(sample1, sample2);

  return res.json({ message: 'Upload successful', result });
};

export const anova = (req, res) => {
  try {
    const { fileName, headerNames } = req.body;

    // Validate input
    if (
      !fileName ||
      !headerNames ||
      !Array.isArray(headerNames) ||
      headerNames.length < 2
    ) {
      return res
        .status(400)
        .json({ error: 'fileName and at least two headerNames are required' });
    }

    const curPath = `${path.resolve()}/public/${fileName}`;

    // Dynamically get data for all specified headers
    const groups = headerNames.map((header, index) => {
      const data = getDataByHeader(curPath, header);
      if (!data) {
        throw new Error(
          `No data found for column "${header}" at index ${index}`
        );
      }
      validateData(data);
      return data;
    });

    // Run ANOVA test
    const result = calcANOVA(groups);

    return res.status(200).json({
      message: 'ANOVA test completed successfully',
      result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const mannWhitneyUTest = (req, res) => {
  const { fileName, headerNames } = req.body;
  const curPath = `${path.resolve()}/public/${fileName}`;

  const sample1 = getDataByHeader(curPath, headerNames[0]);
  const sample2 = getDataByHeader(curPath, headerNames[1]);

  if (!sample1 || !sample2)
    throw new Error('there is no column with this name');
  validateData(sample1);
  validateData(sample2);

  const result = calcMannWhitneyUTest(sample1, sample2);

  return res.json({ message: 'Upload successful', result });
};

export const chiSquareTest = (req, res) => {
  try {
    const { fileName, headerNames, testType, alpha } = req.body;
    const result = calcChiSquareTest({
      fileName,
      headerNames,
      testType,
      alpha
    });
    return res.json({ message: 'Upload successful', result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const paired_t_test = (req, res) => {
  try {
    const result = calcPaired_t_test(req);
    return res.json({ message: 'Upload successful', result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const independent_t_test = (req, res) => {
  try {
    const result = calcIndependent_t_test(req);
    return res.json({ message: 'Upload successful', result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
