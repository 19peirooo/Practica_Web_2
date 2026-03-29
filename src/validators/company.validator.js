import { z } from "zod"

export const companyOnboardingSchema = z.object(
    {
        body: z.object({
            name: z.string(),
            cif: z.string().regex(/^[ABFGJ]-[0-9]{7}[A-Z0-9]$/),
            address: z.object({
                street: z.string().trim(),
                number: z.number().int().positive(),
                postal: z.string().trim().length(5),
                city: z.string().trim(),
                province: z.string().trim()
            }),
            isFreelance: z.boolean()
        })
    }
)
