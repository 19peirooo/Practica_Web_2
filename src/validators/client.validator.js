import { email, z } from "zod"
import { addressSchema, idSchema } from "./utils.validator.js"


export const clientCreateSchema = z.object(
    {
        body: z.object({
            name: z.string().trim(),
            cif: z.string().regex(/^[ABFGJ]-[0-9]{7}[A-Z0-9]$/),
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()),
            address: addressSchema,
            phone: z.string().optional()
        })
    }
)

export const clientUpdateSchema = z.object(
    {
        params: z.object({
            id: idSchema
        }),
        body: z.object({
            name: z.string().trim().optional(),
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()).optional(),
            address: addressSchema.optional(),
            phone: z.string().optional()
        }).strict()
    }
)

export const getClientsSchema = z.object(
    {
        query: z.object({
            page: z.coerce.number().int().min(1).optional(),
            limit: z.coerce.number().int().min(1).optional(),
            name: z.string().trim().optional(),
            cif: z.string().regex(/^[ABFGJ]-[0-9]{7}[A-Z0-9]$/).optional(),
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()).optional(),
            phone: z.string().optional(),
            sort: z.string().optional()
        }).strict()
    }
)

export const getClientSchema = z.object({
    params: z.object({
        id: idSchema
    }).strict()
})

export const deleteClientSchema = z.object(
    {
        query: z.object({
            soft: z.enum(['true','false']).optional()
        }).strict(),
        params: z.object({
            id: idSchema
        })
    }
)

export const restoreClientSchema = z.object(
    {
        params: z.object({
            id: idSchema
        })
    }
)
