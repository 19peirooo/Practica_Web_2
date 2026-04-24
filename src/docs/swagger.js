// src/docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API BildyApp',
      version: '1.0.0',
      description: 'API REST para gestión de albaranes, clientes, proyectos y usuarios',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      },
      contact: {
        name: 'Victor Manuel Peiro Martinez',
        email: 'victorpeiro05@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },

      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
            name: { type: 'string' },
            lastName: { type: 'string' },
            fullName: { type: 'string'},
            nif: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'guest'], default: 'admin' },
            status: { type: 'string', enum: ['pending', 'verified'], default: 'pending' },
            verificationCode: { type: 'string', example: '123456' },
            verificationAttempts: { type: 'integer', example: 3 },
            company: { type: 'string', description: 'ObjectId de Company' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                postal: { type: 'string' },
                city: { type: 'string' },
                province: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deleted: { type: 'boolean', default: false },
            deletedBy: { type: 'string', default: null },
            deletedAt: { type: 'string', format: 'date-time'}
          }
        },

        Company: {
          type: 'object',
          required: ['owner', 'name', 'cif'],
          properties: {
            _id: { type: 'string' },
            owner: { type: 'string', description: 'ObjectId de User' },
            name: { type: 'string' },
            cif: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                postal: { type: 'string' },
                city: { type: 'string' },
                province: { type: 'string' }
              }
            },
            logo: { type: 'string' },
            logoPublicId: { type: 'string' },
            isFreelance: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deleted: { type: 'boolean', default: false },
            deletedBy: { type: 'string', default: null },
            deletedAt: { type: 'string', format: 'date-time'}
          }
        },

        Client: {
          type: 'object',
          required: ['user', 'company', 'name', 'cif'],
          properties: {
            _id: { type: 'string' },
            user: { type: 'string', description: 'ObjectId de User' },
            company: { type: 'string', description: 'ObjectId de Company' },
            name: { type: 'string' },
            cif: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                postal: { type: 'string' },
                city: { type: 'string' },
                province: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deleted: { type: 'boolean', default: false },
            deletedBy: { type: 'string', default: null },
            deletedAt: { type: 'string', format: 'date-time'}
          }
        },

        Project: {
          type: 'object',
          required: ['user', 'company', 'client', 'name', 'projectCode'],
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            client: { type: 'string' },
            name: { type: 'string' },
            projectCode: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                number: { type: 'string' },
                postal: { type: 'string' },
                city: { type: 'string' },
                province: { type: 'string' }
              }
            },
            email: { type: 'string', format: 'email' },
            notes: { type: 'string' },
            active: { type: 'boolean', default: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deleted: { type: 'boolean', default: false },
            deletedBy: { type: 'string', default: null },
            deletedAt: { type: 'string', format: 'date-time'}
          }
        },

        DeliveryNote: {
          type: 'object',
          required: ['user', 'company', 'client', 'project', 'format', 'workDate'],
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            client: { type: 'string' },
            project: { type: 'string' },
            format: { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string' },
            workDate: { type: 'string', format: 'date' },

            material: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },

            hours: { type: 'number' },
            workers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  hours: { type: 'number' }
                }
              }
            },

            signed: { type: 'boolean', default: false },
            signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string' },
            pdfUrl: { type: 'string' },

            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deleted: { type: 'boolean', default: false },
            deletedBy: { type: 'string', default: null },
            deletedAt: { type: 'string', format: 'date-time'}
          }
        },

        Login: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' }
          }
        },

        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: "ERROR_CODE"}
          }
        }
      }
    }
  },

  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);