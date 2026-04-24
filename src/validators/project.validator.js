import { z } from "zod"

const addressSchema = z.object({
    street: z.string().trim(),
    number: z.number().int().positive(),
    postal: z.string().trim(),
    city: z.string().trim(),
    province: z.string().trim()
})

export const projectCreateSchema = z.object(
    {
        body: z.object({
            client: z.string(),
            name: z.string().trim(),
            projectCode: z.string(),
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()),
            address: addressSchema,
            notes: z.string().optional(),
            active: z.enum(['true','false'])
        }).strict()
    }
)

export const projectUpdateSchema = z.object(
    {
        params: z.object({
            id: z.string()
        }).strict(),
        body: z.object({
            name: z.string().trim(),
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()).optional(),
            address: addressSchema.optional(),
            notes: z.string().optional(),
            active: z.enum(['true','false']).optional()
        }).strict()
    }
)

export const getProjectsSchema = z.object(
    {
        query: z.object(
            {
                page: z.number().int().min(1).optional(),
                limit: z.number().int().min(1).optional(),
                name: z.string().optional(),
                client: z.string().optional(),
                projectCode: z.string().optional(),
                active: z.enum(['true','false']).optional(),
                sort: z.string().optional()
            }
        )
    }
)

export const getProjectSchema = z.object(    
    {
        params: z.object({
            id: z.string()
        }).strict()
    }
)

export const projectDeleteSchema = z.object(
    {
        query: z.object({
            soft: z.enum(['true','false'])
        }).strict().optional(),
        params: z.object({
            id: z.string()
        })
    }
)

export const projectRestoreSchema = z.object(
    {
        params: z.object({
            id: z.string()
        })
    }
)

