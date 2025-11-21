import request from 'supertest';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import { UserRole, ContractStatus } from '../src/types/enums';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Subcontractors API Tests', () => {
  let app: any;
  let authToken: string;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockSubcontractorId = '123e4567-e89b-12d3-a456-426614174050';
  const mockContractId = '123e4567-e89b-12d3-a456-426614174051';
  const mockPaymentId = '123e4567-e89b-12d3-a456-426614174052';
  const mockJobId = '123e4567-e89b-12d3-a456-426614174020';

  beforeAll(() => {
    app = createApp();

    authToken = jwt.sign(
      {
        userId: mockUserId,
        email: 'admin@example.com',
        role: UserRole.COMPANY_ADMIN,
        companyId: mockCompanyId,
      },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  // ============================================
  // SUBCONTRACTORS TESTS
  // ============================================

  describe('POST /api/subcontractors', () => {
    it('should create a new subcontractor successfully', async () => {
      const subcontractorData = {
        name: 'ABC Electrical Contractors',
        businessName: 'ABC Electrical Pty Ltd',
        abn: '51824753556',
        email: 'contact@abcelectrical.com',
        phone: '+61400000000',
        address: '123 Industrial Ave, Sydney NSW 2000',
        trade: 'Electrical',
        description: 'Licensed electrical contractor',
        isActive: true,
      };

      const mockSubcontractor = {
        id: mockSubcontractorId,
        company_id: mockCompanyId,
        name: subcontractorData.name,
        business_name: subcontractorData.businessName,
        abn: subcontractorData.abn,
        email: subcontractorData.email,
        phone: subcontractorData.phone,
        address: subcontractorData.address,
        trade: subcontractorData.trade,
        description: subcontractorData.description,
        is_active: subcontractorData.isActive,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockSubcontractor] } as any);

      const response = await request(app)
        .post('/api/subcontractors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subcontractorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Subcontractor created successfully');
      expect(response.body.data).toHaveProperty('id', mockSubcontractorId);
      expect(response.body.data).toHaveProperty('name', subcontractorData.name);
      expect(response.body.data).toHaveProperty('trade', subcontractorData.trade);
    });

    it('should create a subcontractor with minimal data', async () => {
      const subcontractorData = {
        name: 'Simple Contractor',
      };

      const mockSubcontractor = {
        id: mockSubcontractorId,
        company_id: mockCompanyId,
        name: subcontractorData.name,
        business_name: null,
        abn: null,
        email: null,
        phone: null,
        address: null,
        trade: null,
        description: null,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockSubcontractor] } as any);

      const response = await request(app)
        .post('/api/subcontractors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subcontractorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(subcontractorData.name);
    });

    it('should fail with empty name', async () => {
      const subcontractorData = {
        name: '',
      };

      await request(app)
        .post('/api/subcontractors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subcontractorData)
        .expect(400);
    });

    it('should fail with invalid email', async () => {
      const subcontractorData = {
        name: 'Test Contractor',
        email: 'invalid-email',
      };

      await request(app)
        .post('/api/subcontractors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subcontractorData)
        .expect(400);
    });

    it('should fail without authentication', async () => {
      const subcontractorData = {
        name: 'Test Contractor',
      };

      await request(app).post('/api/subcontractors').send(subcontractorData).expect(401);
    });
  });

  describe('GET /api/subcontractors', () => {
    it('should list all subcontractors', async () => {
      const mockSubcontractors = [
        {
          id: mockSubcontractorId,
          company_id: mockCompanyId,
          name: 'ABC Electrical',
          business_name: null,
          abn: null,
          email: 'abc@test.com',
          phone: null,
          address: null,
          trade: 'Electrical',
          description: null,
          is_active: true,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock count query
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);
      // Mock data query
      mockDbQuery.mockResolvedValueOnce({ rows: mockSubcontractors } as any);

      const response = await request(app)
        .get('/api/subcontractors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('subcontractors');
      expect(response.body.data).toHaveProperty('total', 1);
      expect(response.body.data.subcontractors).toHaveLength(1);
    });

    it('should filter subcontractors by trade', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] } as any);
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/subcontractors')
        .query({ trade: 'Plumbing' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subcontractors).toHaveLength(0);
    });

    it('should search subcontractors', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/subcontractors')
        .query({ search: 'ABC' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      await request(app).get('/api/subcontractors').expect(401);
    });
  });

  describe('PATCH /api/subcontractors/:id', () => {
    it('should update a subcontractor successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        trade: 'Plumbing',
      };

      const mockUpdated = {
        id: mockSubcontractorId,
        company_id: mockCompanyId,
        name: updateData.name,
        business_name: null,
        abn: null,
        email: null,
        phone: null,
        address: null,
        trade: updateData.trade,
        description: null,
        is_active: true,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockUpdated] } as any);

      const response = await request(app)
        .patch(`/api/subcontractors/${mockSubcontractorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.trade).toBe(updateData.trade);
    });

    it('should fail with invalid UUID', async () => {
      await request(app)
        .patch('/api/subcontractors/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(400);
    });
  });

  describe('DELETE /api/subcontractors/:id', () => {
    it('should delete a subcontractor successfully', async () => {
      // Mock check for active contracts - none found
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] } as any);
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);
      // Mock delete operation
      mockDbQuery.mockResolvedValueOnce({ rows: [{ id: mockSubcontractorId }], rowCount: 1 } as any);

      const response = await request(app)
        .delete(`/api/subcontractors/${mockSubcontractorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Subcontractor deleted successfully');
    });
  });

  // ============================================
  // CONTRACTS TESTS
  // ============================================

  describe('POST /api/subcontractors/contracts', () => {
    it('should create a new contract successfully', async () => {
      const contractData = {
        subcontractorId: mockSubcontractorId,
        jobId: mockJobId,
        contractNumber: 'SC-2024-001',
        title: 'Electrical Installation - Building A',
        description: 'Complete electrical work for Building A',
        contractValue: 50000,
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        status: ContractStatus.ACTIVE,
        paymentTerms: 'Net 30 days',
        notes: 'Progress payments every month',
      };

      // Mock subcontractor exists check
      mockDbQuery.mockResolvedValueOnce({
        rows: [{ id: mockSubcontractorId, name: 'ABC Electrical' }],
      } as any);

      // Mock contract creation
      const mockContract = {
        id: mockContractId,
        company_id: mockCompanyId,
        subcontractor_id: contractData.subcontractorId,
        job_id: contractData.jobId,
        contract_number: contractData.contractNumber,
        title: contractData.title,
        description: contractData.description,
        contract_value: contractData.contractValue,
        start_date: new Date(contractData.startDate),
        end_date: new Date(contractData.endDate),
        completion_date: null,
        status: contractData.status,
        progress_percentage: 0,
        payment_terms: contractData.paymentTerms,
        notes: contractData.notes,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockContract] } as any);

      // Mock contract details query
      mockDbQuery.mockResolvedValueOnce({
        rows: [
          {
            ...mockContract,
            subcontractor_name: 'ABC Electrical',
            job_name: 'Building A',
          },
        ],
      } as any);

      const response = await request(app)
        .post('/api/subcontractors/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contract created successfully');
      expect(response.body.data).toHaveProperty('id', mockContractId);
      expect(response.body.data).toHaveProperty('title', contractData.title);
      expect(response.body.data).toHaveProperty('contractValue', contractData.contractValue);
    });

    it('should fail with missing required fields', async () => {
      const contractData = {
        subcontractorId: mockSubcontractorId,
        // Missing title
      };

      await request(app)
        .post('/api/subcontractors/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(400);
    });

    it('should fail with invalid subcontractor UUID', async () => {
      const contractData = {
        subcontractorId: 'invalid-uuid',
        title: 'Test Contract',
      };

      await request(app)
        .post('/api/subcontractors/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(400);
    });
  });

  describe('GET /api/subcontractors/contracts', () => {
    it('should list all contracts', async () => {
      const mockContracts = [
        {
          id: mockContractId,
          company_id: mockCompanyId,
          subcontractor_id: mockSubcontractorId,
          job_id: mockJobId,
          contract_number: 'SC-2024-001',
          title: 'Test Contract',
          description: null,
          contract_value: 50000,
          start_date: new Date(),
          end_date: new Date(),
          completion_date: null,
          status: ContractStatus.ACTIVE,
          progress_percentage: 0,
          payment_terms: null,
          notes: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock count query
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);
      // Mock contracts query
      mockDbQuery.mockResolvedValueOnce({ rows: mockContracts } as any);
      // Mock details query for each contract
      mockDbQuery.mockResolvedValueOnce({
        rows: [{ ...mockContracts[0], subcontractor_name: 'ABC', job_name: 'Job A' }],
      } as any);

      const response = await request(app)
        .get('/api/subcontractors/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contracts');
      expect(response.body.data).toHaveProperty('total', 1);
      expect(response.body.data.contracts).toHaveLength(1);
    });

    it('should filter contracts by status', async () => {
      // Mock count query
      mockDbQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] } as any);
      // Mock contracts query
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/subcontractors/contracts')
        .query({ status: ContractStatus.COMPLETED })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contracts');
      expect(response.body.data.contracts).toHaveLength(0);
    });
  });

  describe('PATCH /api/subcontractors/contracts/:id', () => {
    it('should update contract progress', async () => {
      const updateData = {
        progressPercentage: 50,
        status: ContractStatus.ACTIVE,
      };

      const mockUpdated = {
        id: mockContractId,
        company_id: mockCompanyId,
        subcontractor_id: mockSubcontractorId,
        job_id: mockJobId,
        contract_number: 'SC-2024-001',
        title: 'Test Contract',
        description: null,
        contract_value: 50000,
        start_date: new Date(),
        end_date: new Date(),
        completion_date: null,
        status: updateData.status,
        progress_percentage: updateData.progressPercentage,
        payment_terms: null,
        notes: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockUpdated] } as any);
      mockDbQuery.mockResolvedValueOnce({
        rows: [{ ...mockUpdated, subcontractor_name: 'ABC', job_name: 'Job A' }],
      } as any);

      const response = await request(app)
        .patch(`/api/subcontractors/contracts/${mockContractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progressPercentage).toBe(updateData.progressPercentage);
    });
  });

  // ============================================
  // PAYMENTS TESTS
  // ============================================

  describe('POST /api/subcontractors/contracts/:contractId/payments', () => {
    it('should create a payment successfully', async () => {
      const paymentData = {
        amount: 10000,
        paymentDate: '2024-02-01',
        paymentMethod: 'bank_transfer',
        referenceNumber: 'TXN-2024-0001',
        notes: 'Progress payment',
      };

      // Mock contract exists check
      const mockContract = {
        id: mockContractId,
        company_id: mockCompanyId,
        subcontractor_id: mockSubcontractorId,
        job_id: mockJobId,
        contract_number: 'SC-2024-001',
        title: 'Test Contract',
        description: null,
        contract_value: 50000,
        start_date: new Date(),
        end_date: new Date(),
        completion_date: null,
        status: ContractStatus.ACTIVE,
        progress_percentage: 0,
        payment_terms: null,
        notes: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockContract] } as any);

      // Mock total paid query
      mockDbQuery.mockResolvedValueOnce({ rows: [{ total_paid: '0' }] } as any);

      // Mock payment creation
      const mockPayment = {
        id: mockPaymentId,
        contract_id: mockContractId,
        amount: paymentData.amount,
        payment_date: new Date(paymentData.paymentDate),
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.referenceNumber,
        notes: paymentData.notes,
        created_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockPayment] } as any);

      const response = await request(app)
        .post(`/api/subcontractors/contracts/${mockContractId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment created successfully');
      expect(response.body.data).toHaveProperty('amount', paymentData.amount);
    });

    it('should fail with negative amount', async () => {
      const paymentData = {
        amount: -1000,
      };

      await request(app)
        .post(`/api/subcontractors/contracts/${mockContractId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);
    });
  });

  describe('GET /api/subcontractors/contracts/:contractId/payments', () => {
    it('should list all payments for a contract', async () => {
      // Mock contract exists
      mockDbQuery.mockResolvedValueOnce({
        rows: [{ id: mockContractId, company_id: mockCompanyId }],
      } as any);

      // Mock payments
      const mockPayments = [
        {
          id: mockPaymentId,
          contract_id: mockContractId,
          amount: 10000,
          payment_date: new Date(),
          payment_method: 'bank_transfer',
          reference_number: 'TXN-001',
          notes: null,
          created_at: new Date(),
        },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockPayments } as any);

      const response = await request(app)
        .get(`/api/subcontractors/contracts/${mockContractId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /api/subcontractors/contracts/:contractId/payments/:paymentId', () => {
    it('should delete a payment successfully', async () => {
      // Mock contract exists
      mockDbQuery.mockResolvedValueOnce({
        rows: [{ id: mockContractId, company_id: mockCompanyId }],
      } as any);

      // Mock payment exists
      mockDbQuery.mockResolvedValueOnce({
        rows: [{ id: mockPaymentId, contract_id: mockContractId }],
      } as any);

      // Mock delete
      mockDbQuery.mockResolvedValueOnce({
        rows: [{ id: mockPaymentId }],
        rowCount: 1,
      } as any);

      const response = await request(app)
        .delete(`/api/subcontractors/contracts/${mockContractId}/payments/${mockPaymentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment deleted successfully');
    });
  });
});

