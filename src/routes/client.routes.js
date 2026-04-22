import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import authMiddleware from "../middleware/session.middleware.js"
import { clientCreateSchema } from "../validators/client.validator.js";
import { createClient, deleteClient, getArchivedClients, getClient, getUserClients, updateClient } from "../controllers/client.controller.js";


const router = Router()

router.post('/',authMiddleware, validate(clientCreateSchema),createClient)
router.put('/:id', updateClient)
router.get('/', authMiddleware,getUserClients)
router.get('/:id',authMiddleware,getClient)
router.delete('/:id', authMiddleware, deleteClient)
router.get('/archived', getArchivedClients)
router.patch('/:id/restore')

export default router;