import { flattenError, z } from "zod"

const addressSchema = z.object({
    street: z.string().trim(),
    number: z.number().int().positive(),
    postal: z.string().trim().length(5),
    city: z.string().trim(),
    province: z.string().trim()
})

const companySchema = z.object(
    {
        body: z.object({
            name: z.string(),
            cif: z.string().regex(/^[ABFGJ]-[0-9]{7}[A-Z0-9]$/),
            address: addressSchema,
            isFreelance: z.literal(false)
        })
    }
)

const freelanceSchema = z.object({
  isFreelance: z.literal(true)
})

export const companyOnboardingSchema = z.discriminatedUnion("isFreelance", [
  freelanceSchema,
  companySchema
])
