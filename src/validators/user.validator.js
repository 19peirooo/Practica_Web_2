import { z } from "zod"

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
            verificationCode: z.string().length(6)
        })
    }
)