// Users repository - Database operations

import { db } from '../../db/connection';
import { User } from './users.types';
import { UserRole } from '../../types/enums';

export class UsersRepository {
  /**
   * Find all users (workers) for a company with optional search and pagination
   * Excludes soft-deleted users
   */
  async findUsersByCompany(
    companyId: string,
    search?: string,
    role?: UserRole,
    isActive?: boolean,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ users: User[]; total: number }> {
    let query = `
      SELECT * FROM users 
      WHERE company_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter if provided
    if (search) {
      query += ` AND (email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add role filter if provided
    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // Add is_active filter if provided
    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users WHERE company_id = $1 AND deleted_at IS NULL` +
      (search ? ` AND (email ILIKE $2 OR first_name ILIKE $2 OR last_name ILIKE $2)` : '') +
      (role ? ` AND role = $${search ? 3 : 2}` : '') +
      (isActive !== undefined ? ` AND is_active = $${search && role ? 4 : search || role ? 3 : 2}` : '');
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ORDER BY for main query
    query += ` ORDER BY created_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<User>(query, params);
    return { users: result.rows, total };
  }

  /**
   * Find a user by ID
   * Only returns if not soft-deleted and belongs to the company
   */
  async findUserById(userId: string, companyId: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<User>(query, [userId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string, companyId: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<User>(query, [email, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user/worker
   */
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

  /**
   * Update a user/worker
   */
  async updateUser(
    userId: string,
    companyId: string,
    data: {
      email?: string;
      firstName?: string | null;
      lastName?: string | null;
      role?: UserRole;
      isActive?: boolean;
    }
  ): Promise<User | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(data.email);
      paramIndex++;
    }

    if (data.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(data.firstName);
      paramIndex++;
    }

    if (data.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(data.lastName);
      paramIndex++;
    }

    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      params.push(data.role);
      paramIndex++;
    }

    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(data.isActive);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findUserById(userId, companyId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;
    params.push(userId, companyId);

    const result = await db.query<User>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a user/worker
   */
  async deleteUser(userId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [userId, companyId]);
    return result.rows.length > 0;
  }
}
