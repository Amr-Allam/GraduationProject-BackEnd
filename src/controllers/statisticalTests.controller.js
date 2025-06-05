import {
  calcSingle_t_test,
  clacKsTestForNormality
} from '../services/statisticalTests.service';

export const single_t_test = (req, res) => {
  const data = calcSingle_t_test(req, res);

  return res.json({ message: 'Upload successful', data });
};

export const kolmogorovSmirnovNormalTest = (req, res) => {
  const data = clacKsTestForNormality(req);

  return res.json({ message: 'Upload successful', data });
};
