import Joi, { Schema } from 'joi';
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';

interface ValidationSchema {
  params?: Schema;
  query?: Schema;
  body?: Schema;
}

// Utility function to pick properties

const validate =
  (schema: ValidationSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // Pick relevant schema parts
    const validSchema = pick(schema, ['params', 'query', 'body']);

    // Extract the relevant parts from the request
    const object = pick(req, Object.keys(validSchema) as (keyof Request)[]);

    // Validate the object against the schema
    const { value, error } = Joi.compile(validSchema as Joi.Schema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(object);

    if (error) {
      const errorMessage = error.details.map((details) => details.message).join(', ');
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    // Assign the validated value to the request
    Object.assign(req, value);
    return next();
  };

export default validate;
