// Variations service
import { VariationsRepository } from './variations.repository';
import { JobVariation, CreateVariationDTO, UpdateVariationDTO } from './variations.types';

export class VariationsService {
  private repository: VariationsRepository;

  constructor() {
    this.repository = new VariationsRepository();
  }

  async getAllVariations(userId: string): Promise<JobVariation[]> {
    return this.repository.findAll(userId);
  }

  async getVariationById(id: string, userId: string): Promise<JobVariation | null> {
    return this.repository.findById(id, userId);
  }

  async createVariation(data: CreateVariationDTO, userId: string): Promise<JobVariation> {
    return this.repository.create(data, userId);
  }

  async updateVariation(id: string, data: UpdateVariationDTO, userId: string): Promise<JobVariation | null> {
    return this.repository.update(id, data, userId);
  }

  async deleteVariation(id: string, userId: string): Promise<boolean> {
    return this.repository.delete(id, userId);
  }
}








