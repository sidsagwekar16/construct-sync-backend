// Users service - Business logic

import bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import {
  CreateWorkerRequest,
  CreateWorkerResponse,
  UpdateWorkerRequest,
  WorkerResponse,
  ListWorkersQuery,
} from './users.types';
import { UserRole } from '../../types/enums';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../types/errors';
import { logger } from '../../utils/logger';

export class UsersService {
  private repository: UsersRepository;

  constructor() {
    this.repository = new UsersRepository();
  }

  /**
   * Generate a reasonably strong random password that satisfies the validator:
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one digit
   */
  private static generateRandomPassword(length = 12): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const all = upper + lower + digits;

    const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

    // Ensure required character types are present
    let password = pick(upper) + pick(lower) + pick(digits);

    for (let i = 3; i < length; i += 1) {
      password += pick(all);
    }

    // Shuffle characters to avoid predictable positions
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * List all workers for a company with pagination and search
   */
  async listWorkers(
    companyId: string,
    query: ListWorkersQuery
  ): Promise<{ workers: WorkerResponse[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const { users, total } = await this.repository.findUsersByCompany(
      companyId,
      query.search,
      query.role,
      query.isActive,
      limit,
      offset
    );

    const workerResponses = users.map(this.mapUserToWorkerResponse);

    return {
      workers: workerResponses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single worker by ID
   */
  async getWorkerById(
    workerId: string,
    companyId: string
  ): Promise<WorkerResponse> {
    const user = await this.repository.findUserById(workerId, companyId);
    if (!user) {
      throw new NotFoundError('Worker not found');
    }

    return this.mapUserToWorkerResponse(user);
  }

  /**
   * Create a new worker
   */
  async createWorker(
    companyId: string,
    data: CreateWorkerRequest
  ): Promise<CreateWorkerResponse> {
    // Check if email already exists in this company
    const existingUser = await this.repository.findUserByEmail(data.email, companyId);
    if (existingUser) {
      throw new ConflictError('Email already exists in your company');
    }

    // Use provided password or generate a random one
    const plainPassword = data.password || UsersService.generateRandomPassword();

    // Hash password
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Default role to worker if not provided
    const role = data.role || UserRole.WORKER;

    const user = await this.repository.createUser(
      companyId,
      data.email,
      passwordHash,
      data.firstName,
      data.lastName,
      role,
      data.hourlyRate
    );

    logger.info(`Worker created: ${user.email} (${user.id}) for company ${companyId}`);

    // Return worker details plus the temporary password so the admin can share it
    const workerResponse = this.mapUserToWorkerResponse(user);

    return {
      ...workerResponse,
      temporaryPassword: plainPassword,
    };
  }

  /**
   * Update a worker
   */
  async updateWorker(
    workerId: string,
    companyId: string,
    data: UpdateWorkerRequest
  ): Promise<WorkerResponse> {
    const user = await this.repository.findUserById(workerId, companyId);
    if (!user) {
      throw new NotFoundError('Worker not found');
    }

    // If updating email, check if it's already in use
    if (data.email && data.email !== user.email) {
      const existingUser = await this.repository.findUserByEmail(data.email, companyId);
      if (existingUser) {
        throw new ConflictError('Email already exists in your company');
      }
    }

    const updatedUser = await this.repository.updateUser(workerId, companyId, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: data.isActive,
    });

    if (!updatedUser) {
      throw new NotFoundError('Worker not found');
    }

    logger.info(`Worker updated: ${updatedUser.email} (${updatedUser.id})`);

    return this.mapUserToWorkerResponse(updatedUser);
  }

  /**
   * Delete a worker (soft delete)
   */
  async deleteWorker(workerId: string, companyId: string): Promise<void> {
    const user = await this.repository.findUserById(workerId, companyId);
    if (!user) {
      throw new NotFoundError('Worker not found');
    }

    // Prevent deletion of super_admin users
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestError('Cannot delete super admin users');
    }

    const deleted = await this.repository.deleteUser(workerId, companyId);
    if (!deleted) {
      throw new NotFoundError('Worker not found');
    }

    logger.info(`Worker deleted: ${user.email} (${workerId})`);
  }

  /**
   * Helper: Map user entity to worker response
   */
  private mapUserToWorkerResponse(user: any): WorkerResponse {
    return {
      id: user.id,
      companyId: user.company_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      hourlyRate: user.hourly_rate ? parseFloat(user.hourly_rate) : null,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
