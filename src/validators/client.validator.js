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
            address: addressSchema
        })
    }
)