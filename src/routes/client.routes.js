import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import authMiddleware from "../middleware/session.middleware.js"
import { clientCreateSchema, clientUpdateSchema, deleteClientSchema, getClientSchema, getClientsSchema, restoreClientSchema } from "../validators/client.validator.js";
import { createClient, deleteClient, getArchivedClients, getClient, getUserClients, restoreClient, updateClient } from "../controllers/client.controller.js";
import checkRol from "../middleware/role.middleware.js";


const router = Router()

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags:
 *       - Client
 *     summary: Crear cliente
 *     description: Crea un nuevo cliente asociado a la compañía del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Cliente creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente Creado
 *       400:
 *         description: El usuario no tiene compañía asignada o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya existe un cliente con ese CIF en la compañía
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *          description: No autorizado (rol no permitido)
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 */
router.post('/',authMiddleware,checkRol(['admin']), validate(clientCreateSchema),createClient)

/**
 * @openapi
 * /api/client/{id}:
 *   put:
 *     tags:
 *       - Client
 *     summary: Actualizar cliente
 *     description: Actualiza los datos de un cliente existente de la compañía del usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del cliente
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente Actualizado
 *       400:
 *         description: Datos inválidos, usuario sin compañía o peticion invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *          description: No autorizado (rol no permitido)
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 * 
 */
router.put('/:id',authMiddleware,checkRol(['admin']),validate(clientUpdateSchema), updateClient)

/**
 * @openapi
 * /api/client/archived:
 *   get:
 *     tags:
 *       - Client
 *     summary: Listar clientes archivados
 *     description: Obtiene todos los clientes eliminados lógicamente de la compañía
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       400:
 *         description: Usuario sin compañía
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       
 */
router.get('/archived',authMiddleware, getArchivedClients)

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags:
 *       - Client
 *     summary: Listar clientes
 *     description: Obtiene los clientes de la compañía del usuario con paginación y filtros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: Garcia
 *         description: Búsqueda parcial por nombre
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt
 *         description: Campo por el que ordenar
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       400:
 *         description: Usuario sin compañía o petición invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware,validate(getClientsSchema),getUserClients)

/**
 * @openapi
 * /api/client/{id}:
 *   get:
 *     tags:
 *       - Client
 *     summary: Obtener cliente
 *     description: Obtiene un cliente específico de la compañía del usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: ID inválido, usuario sin compañía o peticion invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id',authMiddleware,validate(getClientSchema),getClient)

/**
 * @openapi
 * /api/client/{id}:
 *   delete:
 *     tags:
 *       - Client
 *     summary: Eliminar cliente
 *     description: Elimina un cliente (soft o hard delete según query param)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente a eliminar
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Si es true realiza borrado lógico
 *     responses:
 *       200:
 *         description: Cliente eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado
 *       400:
 *         description: Datos inválidos o petición invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado (rol no permitido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware,checkRol(['admin']),validate(deleteClientSchema), deleteClient)

/**
 * @openapi
 * /api/client/{id}/restore:
 *   patch:
 *     tags:
 *       - Client
 *     summary: Restaurar cliente
 *     description: Restaura un cliente eliminado lógicamente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente a restaurar
 *     responses:
 *       200:
 *         description: Cliente restaurado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cliente Recuperado
 *       400:
 *         description: Datos inválidos o petición invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado (rol no permitido)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/restore',authMiddleware,checkRol(['admin']), validate(restoreClientSchema), restoreClient)

export default router;