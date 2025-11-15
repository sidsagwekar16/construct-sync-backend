// Express request/response extensions

import { UserRole } from './enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        companyId: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

export {};
