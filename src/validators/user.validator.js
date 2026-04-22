import { z } from "zod"

const addressSchema = z.object({
    street: z.string().trim(),
    number: z.number().int().positive(),
    postal: z.string().trim(),
    city: z.string().trim(),
    province: z.string().trim()
})

export const userRegisterSchema = z.object(
    {
        body: z.object({
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()),
            password: z.string().min(8)
        })

    }
)

export const userValidateSchema = z.object(
    {
        body: z.object({
            verificationCode: z.string().trim().length(6)
        })
    }
)

export const userLoginSchema = z.object(
    {
        body: z.object({
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()),
            password: z.string().trim().min(8)
        })
        
    }
)

export const userOnboardingSchema = z.object(
    {
        body: z.object({
            name: z.string().trim(),
            lastName:z.string().trim(),
            nif: z.string().refine((nif_val) => {
                return /^[0-9]{8}[A-Z]$/.test(nif_val) || 
                /^[XYZ][0-9]{7}[A-Z]$/.test(nif_val)
            }),
            address: addressSchema
        })
    }
)

export const userChangePwdSchema = z.object(
    {
        body: z.object({
            oldPassword: z.string().trim().min(8),
            newPassword: z.string().trim().min(8)
        }).refine((data) => {
            return data.oldPassword !== data.newPassword
        }, {message: "La contraseñas no pueden ser iguales"})
    }
)