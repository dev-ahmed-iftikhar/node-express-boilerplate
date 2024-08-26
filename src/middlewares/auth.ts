import passport from 'passport';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { roleRights } from '../config/roles';

const verifyCallback =
  (req: Request, resolve: () => void, reject: (err: Error) => void, requiredRights: string[]) =>
  async (err: Error | null, user: any, info: any): Promise<void> => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;

    if (requiredRights.length) {
      const userRights = roleRights.get(user?.role);
      const hasRequiredRights = requiredRights.every((requiredRight) => userRights?.includes(requiredRight));
      if (!hasRequiredRights && req.params.userId !== user?.id) {
        return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
    }

    resolve();
  };

const auth =
  (...requiredRights: string[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;
