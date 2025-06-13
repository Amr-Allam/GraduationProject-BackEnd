import path from 'path';

import {
  calcSignTest,
  calcSingle_t_test,
  clacKsTestForNormality
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
