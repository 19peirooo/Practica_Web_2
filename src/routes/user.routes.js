
import { Router } from "express"
import { validate } from "../middleware/validate.middleware.js";
import { userChangePwdSchema, userLoginSchema, userOnboardingSchema, userRegisterSchema, userValidateSchema } from "../validators/user.validator.js";
import { changePwd, deleteUser, getUser, inviteUser, loadCompanyData, loadUserData, loginUser, logout, refreshAccessToken, registerUser, uploadLogo, validateEmail } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/session.middleware.js";
import { companyOnboardingSchema } from "../validators/company.validator.js";
import uploadMiddleware from "../utils/handleStorage.js";
import checkRol from "../middleware/role.middleware.js";

const router = Router();

router.post('/register', validate(userRegisterSchema), registerUser)

router.put('/validation', authMiddleware, validate(userValidateSchema), validateEmail)

router.post('/login', validate(userLoginSchema), loginUser)

router.put('/register', authMiddleware, validate(userOnboardingSchema), loadUserData)
router.patch('/company', authMiddleware, validate(companyOnboardingSchema), loadCompanyData)

router.patch('/logo',authMiddleware, uploadMiddleware.single('logo'),uploadLogo)

router.get('/', authMiddleware ,getUser)

router.post('/refresh', refreshAccessToken)
router.post('/logout', authMiddleware, logout)

router.delete('/',authMiddleware, deleteUser)

router.put('/password', authMiddleware, validate(userChangePwdSchema), changePwd)

router.put('/invite', authMiddleware, checkRol(['admin']),validate(userRegisterSchema),inviteUser)

export default router;