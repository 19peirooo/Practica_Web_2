
import { Router } from "express"
import { validate } from "../middleware/validate.js";
import { userLoginSchema, userRegisterSchema, userValidateSchema } from "../validators/user.validator.js";
import { getUsers, loginUser, registerUser, validateEmail } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/session.middleware.js";

const router = Router();

router.get('/',getUsers)
router.post('/register',validate(userRegisterSchema),registerUser)
router.put('/validation',authMiddleware,validate(userValidateSchema), validateEmail)
router.post('/login',validate(userLoginSchema), loginUser)

export default router;