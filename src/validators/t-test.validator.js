import { body, validationResult } from 'express-validator';

export const validate_t_testRequest = [
  body('fileName')
    .isString()
    .notEmpty()
    .withMessage('fileName is required and must be a string'),
  body('headerName')
    .isString()
    .notEmpty()
    .withMessage('headerName is required and must be a string'),
  body('alpha').custom((value) => {
    if (typeof value !== 'number') {
      throw new Error('alpha must be a number, not a string');
    }
    if (value <= 0 || value >= 1) {
      throw new Error('alpha must be between 0 and 1');
    }
    return true;
  }),
  body('alternative')
    .isIn(['two-tailed', 'greater', 'less'])
    .withMessage('alternative must be "two-tailed", "greater", or "less"'),
  body('populationMean').custom((value) => {
    if (typeof value !== 'number') {
      throw new Error('populationMean must be a number, not a string');
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validate_t_testPairRequest = [
  body('fileName')
    .isString()
    .notEmpty()
    .withMessage('fileName is required and must be a string'),
  body('headerNames')
    .isArray({ min: 2, max: 2 })
    .withMessage('headerNames must be an array of two strings'),
  body('headerNames.*')
    .isString()
    .notEmpty()
    .withMessage('Each headerName must be a non-empty string'),
  body('alpha').custom((value) => {
    if (typeof value !== 'number') {
      throw new Error('alpha must be a number, not a string');
    }
    if (value <= 0 || value >= 1) {
      throw new Error('alpha must be between 0 and 1');
    }
    return true;
  }),
  body('alternative')
    .isIn(['two-tailed', 'greater', 'less'])
    .withMessage('alternative must be "two-tailed", "greater", or "less"'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
