import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ConstructSync API',
      version: '1.0.0',
      description: 'Production-ready construction management platform API',
      contact: {
        name: 'API Support',
        email: 'support@constructsync.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.server.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.constructsync.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            firstName: {
              type: 'string',
              nullable: true,
            },
            lastName: {
              type: 'string',
              nullable: true,
            },
            role: {
              type: 'string',
              enum: [
                'super_admin',
                'company_admin',
                'project_manager',
                'site_supervisor',
                'foreman',
                'worker',
                'subcontractor',
                'viewer',
              ],
            },
            companyId: {
              type: 'string',
              format: 'uuid',
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Login successful',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                accessToken: {
                  type: 'string',
                  description: 'JWT access token',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token',
                },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'companyName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'SecurePass123',
              description: 'Must contain uppercase, lowercase, and number',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            companyName: {
              type: 'string',
              example: 'ABC Construction',
            },
            companyEmail: {
              type: 'string',
              format: 'email',
              example: 'info@abc-construction.com',
            },
            companyPhone: {
              type: 'string',
              example: '+1234567890',
            },
            companyAddress: {
              type: 'string',
              example: '123 Main St, City, Country',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecurePass123',
            },
          },
        },
        ErrorReportRequest: {
          type: 'object',
          required: ['errorMessage'],
          properties: {
            errorMessage: {
              type: 'string',
              example: 'Something went wrong',
            },
            errorStack: {
              type: 'string',
              example: 'Error: Something went wrong\n    at ...',
            },
            userAgent: {
              type: 'string',
              example: 'Mozilla/5.0...',
            },
            url: {
              type: 'string',
              example: '/dashboard',
            },
            additionalInfo: {
              type: 'object',
              additionalProperties: true,
              example: {
                component: 'Dashboard',
                action: 'load',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and user management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./src/modules/*/*.routes.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);


