import path from 'path';

import {
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
