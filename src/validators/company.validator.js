import { z } from "zod"

const addressSchema = z.object({
    street: z.string().trim(),
    number: z.number().int().positive(),
    postal: z.string().trim(),
    city: z.string().trim(),
    province: z.string().trim()
})

export const companyOnboardingSchema = z.object(
    {
        body: z.discriminatedUnion("isFreelance", [
            z.object({
                isFreelance: z.literal(true)
            }),
            z.object({
                isFreelance: z.literal(false),
                name: z.string(),
                cif: z.string().regex(/^[ABFGJ]-[0-9]{7}[A-Z0-9]$/),
                address: addressSchema
            })
        ])
    }
)
