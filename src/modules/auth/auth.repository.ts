// Auth repository

import { db } from '../../db/connection';
import { User, Session, RefreshToken } from './auth.types';
import { UserRole } from '../../types/enums';
import { createHash } from 'crypto';

export class AuthRepository {
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<User>(query, [email]);
    return result.rows[0] || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  async createCompany(
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): Promise<string> {
    const query = `
      INSERT INTO companies (name, email, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const result = await db.query<{ id: string }>(query, [name, email, phone, address]);
    return result.rows[0].id;
  }

  async createUser(
    companyId: string,
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ): Promise<User> {
    const query = `
      INSERT INTO users (company_id, email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `;
    const result = await db.query<User>(query, [
      companyId,
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    ]);
    return result.rows[0];
  }

  async createSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
    const hashed = this.hashToken(token);
    const query = `
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query<Session>(query, [userId, hashed, expiresAt]);
    return result.rows[0];
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const hashed = this.hashToken(token);
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query<RefreshToken>(query, [userId, hashed, expiresAt]);
    return result.rows[0];
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const hashed = this.hashToken(token);
    const query = `
      SELECT * FROM sessions 
      WHERE token = $1 AND expires_at > NOW()
    `;
    const result = await db.query<Session>(query, [hashed]);
    return result.rows[0] || null;
  }

  async deleteSession(token: string): Promise<void> {
    const hashed = this.hashToken(token);
    const query = `DELETE FROM sessions WHERE token = $1`;
    await db.query(query, [hashed]);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const query = `DELETE FROM sessions WHERE user_id = $1`;
    await db.query(query, [userId]);
  }

  async findRefreshTokenByToken(token: string): Promise<RefreshToken | null> {
    const hashed = this.hashToken(token);
    const query = `
      SELECT * FROM refresh_tokens 
      WHERE token = $1 AND expires_at > NOW()
    `;
    const result = await db.query<RefreshToken>(query, [hashed]);
    return result.rows[0] || null;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    const hashed = this.hashToken(token);
    const query = `DELETE FROM refresh_tokens WHERE token = $1`;
    await db.query(query, [hashed]);
  }

  async logError(
    userId: string | null,
    errorMessage: string,
    errorStack?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const query = `
      INSERT INTO audit_logs (user_id, action, entity_type, old_values)
      VALUES ($1, $2, $3, $4)
    `;
    await db.query(query, [
      userId,
      'error_report',
      'system',
      JSON.stringify({ errorMessage, errorStack, ...metadata }),
    ]);
  }
}
