
import { Router } from "express"
import { validate } from "../middleware/validate.middleware.js";
import { userChangePwdSchema, userDeleteSchema, userLoginSchema, userOnboardingSchema, userRegisterSchema, userValidateSchema } from "../validators/user.validator.js";
import { changePwd, deleteUser, getUser, inviteUser, loadCompanyData, loadUserData, loginUser, logout, refreshAccessToken, registerUser, uploadLogo, validateEmail } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/session.middleware.js";
import { companyOnboardingSchema } from "../validators/company.validator.js";
import uploadMiddleware from "../utils/handleStorage.js";
import checkRol from "../middleware/role.middleware.js";

const router = Router();

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     tags:
 *       - User
 *     summary: Registrar usuario
 *     description: Crea un nuevo usuario y devuelve tokens de acceso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 status:
 *                   type: string
 *                 role:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       409:
 *         description: Usuario ya existente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Datos incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(userRegisterSchema), registerUser)

/**
 * @openapi
 * /api/user/validation:
 *   put:
 *     tags:
 *       - User
 *     summary: Validar email
 *     description: Valida el email del usuario mediante código de verificación
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email validado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Código incorrecto o usuario ya verificado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos
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
router.put('/validation', authMiddleware, validate(userValidateSchema), validateEmail)

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: Login de usuario
 *     description: Autentica usuario y devuelve tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login correcto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Datos incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validate(userLoginSchema), loginUser)

/**
 * @openapi
 * /api/user/register:
 *   put:
 *     tags:
 *       - User
 *     summary: Completar datos de usuario
 *     description: Añade información adicional al usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               nif:
 *                 type: string
 *               address:
 *                 type: object
 *     responses:
 *       200:
 *         description: Onboarding completado
 *       400:
 *         description: Datos incorrectos
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
router.put('/register', authMiddleware, validate(userOnboardingSchema), loadUserData)

/**
 * @openapi
 * /api/user/company:
 *   patch:
 *     tags:
 *       - User
 *     summary: Onboarding de compañía
 *     description: Crea o asigna una compañía al usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compañía configurada correctamente
 *       400:
 *         description: Error en onboarding
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
router.patch('/company', authMiddleware, validate(companyOnboardingSchema), loadCompanyData)

/**
 * @openapi
 * /api/user/logo:
 *   patch:
 *     tags:
 *       - User
 *     summary: Subir logo de empresa
 *     description: Sube el logo de la compañía del usuario
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
 *       201:
 *         description: Logo actualizado
 *       400:
 *         description: Error al subir logo
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
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/logo', authMiddleware,checkRol(['admin']), uploadMiddleware.single('logo'),uploadLogo)

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags:
 *       - User
 *     summary: Obtener usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado (token inválido o ausente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, getUser)

/**
 * @openapi
 * /api/user/refresh:
 *   post:
 *     tags:
 *       - User
 *     summary: Refrescar token
 *     description: Genera un nuevo access token usando refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevo access token
 *       401:
 *         description: Refresh token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', refreshAccessToken)

/**
 * @openapi
 * /api/user/logout:
 *   post:
 *     tags:
 *       - User
 *     summary: Logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout correcto
 *       401:
 *         description: Refresh token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authMiddleware, logout)

/**
 * @openapi
 * /api/user:
 *   delete:
 *     tags:
 *       - User
 *     summary: Eliminar usuario
 *     description: Elimina el usuario (soft o hard delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       401:
 *         description: Refresh token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/',authMiddleware,validate(userDeleteSchema), deleteUser)

/**
 * @openapi
 * /api/user/password:
 *   put:
 *     tags:
 *       - User
 *     summary: Cambiar contraseña
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: Contraseña incorrecta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Refresh token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/password', authMiddleware, validate(userChangePwdSchema), changePwd)

/**
 * @openapi
 * /api/user/invite:
 *   put:
 *     tags:
 *       - User
 *     summary: Invitar usuario
 *     description: Invita un usuario como guest a la compañía
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario invitado correctamente
 *       400:
 *         description: Error al invitar usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Refresh token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/invite', authMiddleware, checkRol(['admin']),validate(userRegisterSchema),inviteUser)

export default router;