import { Router } from "express";
import { returnPdf, signPdf } from "../controllers/deliverynote.controller.js";
import uploadMiddleware from "../utils/handleStorage.js";

const router = Router();

router.get('/pdf',returnPdf)
router.post('/sign',uploadMiddleware.single('logo'),signPdf)

export default router;