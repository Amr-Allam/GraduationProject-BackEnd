import express from 'express';
import { processFile, uploadFile } from '../utils/file.util';
import {
  single_t_test,
  kolmogorovSmirnovNormalTest
} from '../controllers/statisticalTests.controller';
import { validate_t_testRequest } from '../validators/t-test.validator';

const router = express.Router();

router.post('/upload', uploadFile(), processFile(), (req, res) => {
  try {
    res.json({ message: 'Upload successful', files: req.body.files });
  } catch (error) {
    res.json({ message: error.message, error: error });
  }
});

router.post('/single-t-test', validate_t_testRequest, single_t_test);
router.post('/kolmogorov-smirnov-test', kolmogorovSmirnovNormalTest);

export default router;
