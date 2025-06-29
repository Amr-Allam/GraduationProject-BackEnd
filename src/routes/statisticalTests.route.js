import express from 'express';
import { processFile, uploadFile } from '../utils/file.util';
import {
  single_t_test,
  paired_t_test,
  independent_t_test,
  kolmogorovSmirnovNormalTest,
  signTest,
  wilcoxonSignedRankTest,
  anova,
  mannWhitneyUTest,
  chiSquareTest,
  single_z_test,
  two_sample_z_test
} from '../controllers/statisticalTests.controller';
import {
  validate_t_testRequest,
  validate_t_testPairRequest
} from '../validators/t-test.validator';

const router = express.Router();

router.post('/upload', uploadFile(), processFile(), (req, res) => {
  try {
    res.json({ message: 'Upload successful', files: req.body.files });
  } catch (error) {
    res.json({ message: error.message, error: error });
  }
});

router.post('/single-t-test', validate_t_testRequest, single_t_test);
router.post('/paired-t-test', validate_t_testPairRequest, paired_t_test);
router.post(
  '/independent-t-test',
  validate_t_testPairRequest,
  independent_t_test
);
router.post('/kolmogorov-smirnov-test', kolmogorovSmirnovNormalTest);
router.post('/sign-test', signTest);
router.post('/ranked-sign-test', wilcoxonSignedRankTest);
router.post('/anova-test', anova);
router.post('/u-test', mannWhitneyUTest);
router.post('/chi-square-test', chiSquareTest);
router.post('/single-z-test', single_z_test);
router.post('/two-sample-z-test', two_sample_z_test);

export default router;
