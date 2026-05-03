import { z } from "zod"
import { addressSchema, idSchema } from "./utils.validator.js"

export const projectCreateSchema = z.object(
    {
        body: z.object({
            client: z.string(),
            name: z.string().trim(),
            projectCode: z.string(),
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()),
            address: addressSchema,
            notes: z.string().optional(),
            active: z.boolean()
        }).strict()
    }
)

export const projectUpdateSchema = z.object(
    {
        params: z.object({
            id: idSchema
        }).strict(),
        body: z.object({
            name: z.string().trim().optional(),
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()).optional(),
            address: addressSchema.optional(),
            notes: z.string().optional(),
            active: z.boolean().optional()
        }).strict()
    }
)

export const getProjectsSchema = z.object(
    {
        query: z.object(
            {
                page: z.coerce.number().int().min(1).optional(),
                limit: z.coerce.number().int().min(1).optional(),
                name: z.string().optional(),
                client: z.string().optional(),
                projectCode: z.string().optional(),
                active: z.enum(['true','false']).optional(),
                sort: z.string().optional()
            }
        ).strict()
    }
)

export const getProjectSchema = z.object(    
    {
        params: z.object({
            id: idSchema
        }).strict()
    }
)

export const projectDeleteSchema = z.object(
    {
        query: z.object({
            soft: z.enum(['true','false']).optional()
        }).strict(),
        params: z.object({
            id: idSchema
        })
    }
)

export const projectRestoreSchema = z.object(
    {
        params: z.object({
            id: idSchema
        })
    }
)

