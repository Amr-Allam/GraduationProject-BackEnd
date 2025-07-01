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
  calcIndependent_t_test,
  calcSingle_z_test,
  calcTwo_sample_z_test,
  calcTwoWayANOVA
} from '../services/statisticalTests.service';
import {
  getDataByHeader,
  getSheetData,
  groupByFactors,
  encodeSheetFactors
} from '../utils/file.util';
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

export const anova = async (req, res) => {
  try {
    const { fileName, factorNames, valueName, alpha } = req.body;
    if (!fileName || !Array.isArray(factorNames) || !valueName) {
      return res.status(400).json({
        error: 'fileName, factorNames (array), and valueName are required'
      });
    }
    if (factorNames.length < 1 || factorNames.length > 2) {
      return res.status(400).json({
        error: 'factorNames must be an array of one or two column names'
      });
    }
    const curPath = `${path.resolve()}/public/${fileName}`;
    const data = getSheetData(curPath);
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'No data found in the file' });
    }
    // Encode factor columns
    const { encodedData, mappings } = encodeSheetFactors(data, factorNames);
    // Group data by factor(s) using encodedData
    const grouped = groupByFactors(encodedData, factorNames, valueName);
    let result;
    if (factorNames.length === 1) {
      // One-way ANOVA
      result = calcANOVA(grouped, alpha);
    } else {
      // Two-way ANOVA
      const { groups, levels1, levels2 } = grouped;
      result = calcTwoWayANOVA(groups, levels1, levels2, alpha);
    }
    return res
      .status(200)
      .json({ message: 'ANOVA test completed successfully', result, mappings });
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

export const single_z_test = (req, res) => {
  try {
    const result = calcSingle_z_test(req);
    return res.json({ message: 'Upload successful', result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const two_sample_z_test = (req, res) => {
  try {
    const result = calcTwo_sample_z_test(req);
    return res.json({ message: 'Upload successful', result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
