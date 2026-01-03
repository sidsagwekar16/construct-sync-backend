// Auth service

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository';
import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  UserResponse,
  JWTPayload,
  User,
  ErrorReportRequest,
} from './auth.types';
import { UserRole } from '../../types/enums';
import { env } from '../../config/env';
import {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
  NotFoundError,
} from '../../types/errors';
import { logger } from '../../utils/logger';

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await this.repository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create company first
    const companyId = await this.repository.createCompany(
      data.companyName,
      data.companyEmail,
      data.companyPhone,
      data.companyAddress
    );

    // Create user as company admin
    const user = await this.repository.createUser(
      companyId,
      data.email,
      passwordHash,
      data.firstName,
      data.lastName,
      UserRole.COMPANY_ADMIN
    );

    logger.info(`New user registered: ${user.email}`);

    // Generate tokens
    return await this.generateAuthResponse(user);
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    // Find user
    const user = await this.repository.findUserByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is inactive. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate tokens
    return await this.generateAuthResponse(user);
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapUserToResponse(user);
  }

  async reportError(userId: string | null, data: ErrorReportRequest): Promise<void> {
    await this.repository.logError(
      userId,
      data.errorMessage,
      data.errorStack,
      {
        userAgent: data.userAgent,
        url: data.url,
        additionalInfo: data.additionalInfo,
      }
    );

    logger.error('Error reported by user', {
      userId,
      message: data.errorMessage,
      stack: data.errorStack,
    });
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    // Remove the session from database
    await this.repository.deleteSession(accessToken);
    
    logger.info(`User logged out: ${userId}`);
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, env.jwt.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  private async generateAuthResponse(user: User): Promise<LoginResponse> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    // Calculate expiration dates
    const accessTokenExpiry = new Date();
    accessTokenExpiry.setDate(accessTokenExpiry.getDate() + 7); // 7 days

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

    // Store tokens in database
    await this.repository.createSession(user.id, accessToken, accessTokenExpiry);
    await this.repository.createRefreshToken(user.id, refreshToken, refreshTokenExpiry);

    return {
      user: this.mapUserToResponse(user),
      accessToken,
      refreshToken,
    };
  }

  private mapUserToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyId: user.company_id,
      isActive: user.is_active,
      createdAt: user.created_at,
      profilePicture: user.profile_picture || null,
    };
  }

  async updateProfilePicture(userId: string, profilePicture: string): Promise<UserResponse> {
    // Update user profile picture
    await this.repository.updateProfilePicture(userId, profilePicture);
    
    // Get updated user
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`Profile picture updated for user: ${user.email}`);
    
    return this.mapUserToResponse(user);
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify JWT signature and decode payload
      const decoded = jwt.verify(refreshToken, env.jwt.secret) as JWTPayload;

      // Ensure the refresh token exists and is not expired in DB
      const refreshRecord = await this.repository.findRefreshTokenByToken(refreshToken);
      if (!refreshRecord) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      const payload: JWTPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId,
      };

      // Generate new access and refresh tokens
      const newAccessToken = jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
      } as jwt.SignOptions);

      const newRefreshToken = jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.refreshExpiresIn,
      } as jwt.SignOptions);

      // Calculate expirations (keep in sync with generateAuthResponse)
      const accessTokenExpiry = new Date();
      accessTokenExpiry.setDate(accessTokenExpiry.getDate() + 7); // 7 days

      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

      // Store new session and refresh token (tokens are hashed inside repository)
      await this.repository.createSession(refreshRecord.user_id, newAccessToken, accessTokenExpiry);
      await this.repository.createRefreshToken(refreshRecord.user_id, newRefreshToken, refreshTokenExpiry);

      // Light rotation: delete old refresh token
      await this.repository.deleteRefreshToken(refreshToken);

      logger.info(`Tokens refreshed for user: ${decoded.email}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }
      throw error;
    }
  }
}
