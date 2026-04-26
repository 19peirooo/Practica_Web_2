import { Router } from "express";
import { createDeliveryNote, deleteDeliveryNote, getDeliveryNote, getDeliveryNotes, returnPdf, signPdf } from "../controllers/deliverynote.controller.js";
import uploadMiddleware from "../utils/handleStorage.js";
import { validate } from "../middleware/validate.middleware.js";
import authMiddleware from "../middleware/session.middleware.js"
import checkRol from "../middleware/role.middleware.js";
import { createDeliverNoteSchema, deleteDeliveryNoteSchema, downloadPDFSchema, getDeliveryNoteSchema, getDeliveryNotesSchema } from "../validators/deliverynote.validator.js";

const router = Router();

router.post("/",authMiddleware,checkRol(['admin']),validate(createDeliverNoteSchema),createDeliveryNote)

router.get("/", authMiddleware, validate(getDeliveryNotesSchema),getDeliveryNotes)

router.get("/:id",authMiddleware,validate(getDeliveryNoteSchema),getDeliveryNote)

router.get('/pdf/:id',authMiddleware,validate(downloadPDFSchema),returnPdf)

router.post('/sign',uploadMiddleware.single('logo'),signPdf)

router.delete("/:id", authMiddleware, checkRol('admin'), validate(deleteDeliveryNoteSchema), deleteDeliveryNote)

export default router;