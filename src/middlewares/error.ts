import mongoose from 'mongoose';
import httpStatus from 'http-status';
import config from '../config/config';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';
import { NextFunction, Request, Response } from 'express';

// Define a type for the error object
interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  stack?: string;
}

const errorConverter = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;

    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, error.stack);
  }

  next(error);
};

const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};
export { errorConverter, errorHandler };
