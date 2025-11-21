// Role-based access control middleware

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/enums';
import { ForbiddenError } from '../types/errors';

/**
 * Middleware to require a specific role
 * @param role The required user role
 */
export const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      if (req.user.role !== role) {
        throw new ForbiddenError(`Access denied. ${role} role required.`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require one of multiple roles
 * @param roles Array of allowed user roles
 */
export const requireRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      if (!roles.includes(req.user.role as UserRole)) {
        throw new ForbiddenError(`Access denied. One of these roles required: ${roles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Convenience middleware to require worker role
 */
export const requireWorker = requireRole(UserRole.WORKER);

/**
 * Convenience middleware to require admin roles
 */
export const requireAdmin = requireRoles([
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
]);

/**
 * Convenience middleware to require manager roles
 */
export const requireManager = requireRoles([
  UserRole.SUPER_ADMIN,
  UserRole.COMPANY_ADMIN,
  UserRole.PROJECT_MANAGER,
  UserRole.SITE_SUPERVISOR,
  UserRole.FOREMAN,
]);
