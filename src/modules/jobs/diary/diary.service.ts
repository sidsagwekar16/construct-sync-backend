// Job diary service - Business logic

import { DiaryRepository } from './diary.repository';
import { JobDiary, CreateDiaryRequest } from './diary.types';
import { NotFoundError, ForbiddenError } from '../../../types/errors';
import { JobsRepository } from '../jobs.repository';

export class DiaryService {
  private repository: DiaryRepository;
  private jobsRepository: JobsRepository;

  constructor() {
    this.repository = new DiaryRepository();
    this.jobsRepository = new JobsRepository();
  }

  /**
   * Create a new diary entry for a job
   */
  async createDiaryEntry(
    jobId: string,
    companyId: string,
    createdBy: string,
    data: CreateDiaryRequest
  ): Promise<JobDiary> {
    // Verify job exists and belongs to company
    const job = await this.jobsRepository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Create diary entry
    return this.repository.createDiaryEntry(jobId, createdBy, data);
  }

  /**
   * Get all diary entries for a job
   */
  async getDiaryEntries(jobId: string, companyId: string): Promise<JobDiary[]> {
    // Verify job exists and belongs to company
    const job = await this.jobsRepository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Get all diary entries
    return this.repository.getDiaryEntriesByJobId(jobId);
  }

  /**
   * Delete a diary entry
   */
  async deleteDiaryEntry(
    diaryId: string,
    jobId: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    // Verify job exists and belongs to company
    const job = await this.jobsRepository.findJobById(jobId, companyId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Get diary entry
    const diaryEntry = await this.repository.getDiaryEntryById(diaryId, jobId);
    if (!diaryEntry) {
      throw new NotFoundError('Diary entry not found');
    }

    // Only allow the creator to delete their diary entry
    if (diaryEntry.createdBy !== userId) {
      throw new ForbiddenError('You can only delete your own diary entries');
    }

    // Delete diary entry
    const deleted = await this.repository.deleteDiaryEntry(diaryId, jobId);
    if (!deleted) {
      throw new NotFoundError('Diary entry not found');
    }
  }
}
