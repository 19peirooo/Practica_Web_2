import { email, z } from "zod"

const addressSchema = z.object({
    street: z.string().trim(),
    number: z.number().int().positive(),
    postal: z.string().trim(),
    city: z.string().trim(),
    province: z.string().trim()
})

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
            id: z.string()
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
            page: z.number().int().min(1).optional(),
            limit: z.number().int().min(1).optional(),
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
        id: z.string()
    }).strict()
})

export const deleteClientSchema = z.object(
    {
        query: z.object({
            soft: z.enum(['true','false'])
        }).strict().optional(),
        params: z.object({
            id: z.string()
        })
    }
)

export const restoreClientSchema = z.object(
    {
        params: z.object({
            id: z.string()
        })
    }
)
