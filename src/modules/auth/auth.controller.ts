// Auth controller

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '../../utils/response';
import { LoginRequest, RegisterRequest, ErrorReportRequest } from './auth.types';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: RegisterRequest = req.body;
      const result = await this.service.register(data);
      successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: LoginRequest = req.body;
      const result = await this.service.login(data);
      successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await this.service.getCurrentUser(userId);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  reportError = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: ErrorReportRequest = req.body;
      const userId = req.user?.id || null;
      await this.service.reportError(userId, data);
      successResponse(res, null, 'Error report submitted successfully');
    } catch (error) {
      next(error);
    }
  };
}
