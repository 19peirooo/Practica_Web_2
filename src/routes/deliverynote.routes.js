import { Router } from "express";
import { createDeliveryNote, deleteDeliveryNote, getDeliveryNote, getDeliveryNotes, returnPdf, signPdf } from "../controllers/deliverynote.controller.js";
import uploadMiddleware from "../utils/handleStorage.js";
import { validate } from "../middleware/validate.middleware.js";
import authMiddleware from "../middleware/session.middleware.js"
import checkRol from "../middleware/role.middleware.js";
import { createDeliverNoteSchema, deleteDeliveryNoteSchema, downloadPDFSchema, getDeliveryNoteSchema, getDeliveryNotesSchema } from "../validators/deliverynote.validator.js";

const router = Router();

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags:
 *       - DeliveryNote
 *     summary: Crear albarán
 *     description: Crea un nuevo albarán asociado a un proyecto de la compañía del usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryNote'
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Albaran Creado
 *       400:
 *         description: Datos inválidos o proyecto incorrecto
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
router.post("/",authMiddleware,checkRol(['admin']),validate(createDeliverNoteSchema),createDeliveryNote)

/**
 * @openapi
 * /api/deliverynote:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Listar albaranes
 *     description: Obtiene albaranes con filtros, paginación y ordenación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Página donde buscar
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Límite de albaranes
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Búsqueda por id del cliente
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Búsqueda por id del proyecto
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *         description: Búsqueda por formato del albarán
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por la descripción del albarán
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Búsqueda desde una fecha de trabajo
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Búsqueda hasta una fecha de trabajo
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *         description: Búsqueda por material
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: integer
 *         description: Búsqueda por cantidad de material
 *       - in: query
 *         name: unit
 *         schema:
 *           type: string
 *           example: kg
 *         description: Búsqueda por unidad de medida
 *       - in: query
 *         name: totalHours
 *         schema:
 *           type: integer
 *         description: Búsqueda por el total de horas
 *       - in: query
 *         name: worker
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por nombre del trabajador
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *         description: Búsqueda por horas de trabajadores individuales
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *         description: Filtrar por albaranes firmados
 *       - in: query
 *         name: signedFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Búsqueda desde fecha de firma
 *       - in: query
 *         name: signedTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Búsqueda hasta fecha de firma
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -workDate
 *         description: Campo de ordenación (usar - para descendente)
 *     responses:
 *       200:
 *         description: Lista de albaranes
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
 *                 deliveryNotes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Usuario sin compañía o datos inválidos
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
router.get("/", authMiddleware, validate(getDeliveryNotesSchema),getDeliveryNotes)

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Obtener albarán
 *     description: Obtiene un albarán específico
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
 *         description: Albarán encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id",authMiddleware,validate(getDeliveryNoteSchema),getDeliveryNote)

/**
 * @openapi
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Descargar PDF
 *     description: Genera o descarga el PDF de un albarán
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
 *         description: PDF generado
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: PDF Descargado
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No autorizado para acceder al PDF
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
router.get('/pdf/:id',authMiddleware,validate(downloadPDFSchema),returnPdf)

/**
 * @openapi
 * /api/deliverynote/sign:
 *   post:
 *     tags:
 *       - DeliveryNote
 *     summary: Firmar albarán
 *     description: Sube una firma y genera un PDF firmado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: PDF firmado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: No se subió firma
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
router.patch('/:id/sign',authMiddleware,uploadMiddleware.single('signature'),signPdf)

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   delete:
 *     tags:
 *       - DeliveryNote
 *     summary: Eliminar albarán
 *     description: Elimina un albarán (soft o hard delete). No se puede eliminar si está firmado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Si es true realiza borrado lógico
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Albaran eliminado
 *       400:
 *         description: No se puede eliminar (firmado o datos inválidos)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
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
router.delete("/:id", authMiddleware, checkRol('admin'), validate(deleteDeliveryNoteSchema), deleteDeliveryNote)

export default router;