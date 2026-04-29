import { z } from "zod"
import { addressSchema } from "./utils.validator.js"

export const userRegisterSchema = z.object(
    {
        body: z.object({
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()),
            password: z.string().min(8)
        }).strict()

    }
)

export const userValidateSchema = z.object(
    {
        body: z.object({
            verificationCode: z.string().trim().length(6)
        }).strict()
    }
)

export const userLoginSchema = z.object(
    {
        body: z.object({
            email: z.email("Email Invalido").transform((e) => e.toLowerCase().trim()),
            password: z.string().trim().min(8)
        }).strict()
        
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
        }).strict()
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

export const userDeleteSchema = z.object({
    query: z.object({
        soft: z.enum(['true','false']).optional(),
    }).strict()
})