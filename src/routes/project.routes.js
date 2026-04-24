import { Router } from "express"
import authMiddleware from "../middleware/session.middleware.js"
import checkRol from "../middleware/role.middleware.js"
import { validate } from "../middleware/validate.middleware.js"
import { getProjectSchema, getProjectsSchema, projectCreateSchema, projectDeleteSchema, projectRestoreSchema, projectUpdateSchema } from "../validators/project.validator.js"
import { createProject, deleteProject, getArchivedProjects, getCompanyProjects, getProject, restoreProject, updateProject } from "../controllers/project.controller.js"

const router = Router()

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags:
 *       - Project
 *     summary: Crear Proyecto
 *     description: Crea un nuevo proyecto asociado a la compañía del usuario autenticado y le asigna un cliente de dicha compañia
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto Creado
 *       400:
 *         description: El usuario no tiene compañía asignada o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya existe un proyecto con ese projectCode en esa compañia
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
router.post('/',authMiddleware,checkRol(['admin']), validate(projectCreateSchema),createProject)

/**
 * @openapi
 * /api/project/{id}:
 *   put:
 *     tags:
 *       - Project
 *     summary: Actualizar Proyecto
 *     description: Actualiza los datos de un projecto existente de la compañía del usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del Projecto
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Projecto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Projecto Actualizado
 *       400:
 *         description: Datos inválidos, usuario sin compañía o peticion invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Projecto no encontrado
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
router.put('/:id',authMiddleware,checkRol(['admin']),validate(projectUpdateSchema),updateProject)

/**
 * @openapi
 * /api/project/archived:
 *   get:
 *     tags:
 *       - Project
 *     summary: Listar proyectos archivados
 *     description: Obtiene todos los proyectos eliminados lógicamente de la compañía
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de Projectos archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
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
router.get('/archived',authMiddleware, getArchivedProjects)

/**
 * @openapi
 * /api/project:
 *   get:
 *     tags:
 *       - Project
 *     summary: Listar Proyectos
 *     description: Obtiene los proyectos de la compañía del usuario con paginación y filtros
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
 *         name: projectCode
 *         schema:
 *           type: string
 *           example: 1xk
 *         description: Búsqueda parcial por projectCode
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *           example: 69eb4366512c000825e2e3da
 *         description: Búsqueda por cliente
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           example: true
 *         description: Búsqueda por estado del projecto (activo o no)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt
 *         description: Campo por el que ordenar
 *     responses:
 *       200:
 *         description: Lista de Proyectos
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
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
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
router.get('/', authMiddleware,validate(getProjectsSchema),getCompanyProjects)

/**
 * @openapi
 * /api/project/{id}:
 *   get:
 *     tags:
 *       - Project
 *     summary: Obtener proyecto
 *     description: Obtiene un proyecto específico de la compañía del usuario
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
 *         description: Proyecto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: ID inválido, usuario sin compañía o peticion invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado
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
router.get('/:id',authMiddleware,validate(getProjectSchema),getProject)

/**
 * @openapi
 * /api/project/{id}:
 *   delete:
 *     tags:
 *       - Project
 *     summary: Eliminar Projecto
 *     description: Elimina un projecto (soft o hard delete según query param)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Projecto a eliminar
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Si es true realiza borrado lógico
 *     responses:
 *       200:
 *         description: Projecto eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Projecto eliminado
 *       400:
 *         description: Datos inválidos o petición invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Projecto no encontrado
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
router.delete('/:id', authMiddleware,checkRol(['admin']),validate(projectDeleteSchema), deleteProject)

/**
 * @openapi
 * /api/project/{id}/restore:
 *   patch:
 *     tags:
 *       - Project
 *     summary: Restaurar proyecto
 *     description: Restaura un proyecto eliminado lógicamente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto a restaurar
 *     responses:
 *       200:
 *         description: Proyecto restaurado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto Recuperado
 *       400:
 *         description: Datos inválidos o petición invalida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado
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
router.patch('/:id/restore',authMiddleware,checkRol(['admin']), validate(projectRestoreSchema), restoreProject)

export default router;