
import { Router } from "express"
import { validate } from "../middleware/validate.js";
import { userLoginSchema, userOnboardingSchema, userRegisterSchema, userValidateSchema } from "../validators/user.validator.js";
import { getUser, loadCompanyData, loadUserData, loginUser, registerUser, validateEmail } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/session.middleware.js";
import { companyOnboardingSchema } from "../validators/company.validator.js";

const router = Router();

router.post('/register', validate(userRegisterSchema), registerUser)
router.put('/validation', authMiddleware, validate(userValidateSchema), validateEmail)
router.post('/login', validate(userLoginSchema), loginUser)

router.put('/register', authMiddleware, validate(userOnboardingSchema), loadUserData)
router.patch('/company', authMiddleware, validate(companyOnboardingSchema), loadCompanyData)

router.get('/', authMiddleware ,getUser)
export default router;