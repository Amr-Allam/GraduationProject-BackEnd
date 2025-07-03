import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import routes from './routes';

import {
  appErrorHandler,
  genericErrorHandler,
  notFound
} from './middlewares/error.middleware';
import logger, { logStream } from './config/logger';

import morgan from 'morgan';

const app = express();
const host = process.env.APP_HOST;
const port = process.env.PORT || process.env.APP_PORT || 3000;
const api_version = process.env.API_VERSION;
const allowedOrigins = [
  'https://quickstats-analysis.vercel.app' // frontend URL
];

app.use(
  cors({
    origin: allowedOrigins
  })
);
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('combined', { stream: logStream }));

//database();

app.use(`/api/${api_version}`, routes());
app.use(appErrorHandler);
app.use(genericErrorHandler);
app.use(notFound);

if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    logger.info(`Server started at ${host}:${port}/api/${api_version}/`);
  });
}

export default app;
