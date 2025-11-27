// Job diary controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { DiaryService } from './diary.service';
import { successResponse } from '../../../utils/response';
import { CreateDiaryRequest } from './diary.types';

export class DiaryController {
  private service: DiaryService;

  constructor() {
    this.service = new DiaryService();
  }

  /**
   * POST /api/jobs/:jobId/diary
   * Create a new diary entry for a job
   */
  createDiaryEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const companyId = req.user!.companyId;
      const createdBy = req.user!.id;
      const data: CreateDiaryRequest = req.body;

      const diaryEntry = await this.service.createDiaryEntry(jobId, companyId, createdBy, data);
      successResponse(res, diaryEntry, 'Diary entry created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/jobs/:jobId/diary
   * Get all diary entries for a job
   */
  getDiaryEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const companyId = req.user!.companyId;

      const diaryEntries = await this.service.getDiaryEntries(jobId, companyId);
      successResponse(res, diaryEntries);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/jobs/:jobId/diary/:diaryId
   * Delete a diary entry
   */
  deleteDiaryEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { jobId, diaryId } = req.params;
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      await this.service.deleteDiaryEntry(diaryId, jobId, companyId, userId);
      successResponse(res, null, 'Diary entry deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
