
import { Router } from "express"
import { validate } from "../middleware/validate.js";
import { userRegisterSchema } from "../validators/user.validator.js";
import { getUsers, registerUser } from "../controllers/user.controller.js";

const router = Router();

router.get('/',getUsers)
router.post('/register',validate(userRegisterSchema),registerUser)

export default router;