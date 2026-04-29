import { z } from "zod"
import mongoose from "mongoose";


export const addressSchema = z.object({
    street: z.string().trim(),
    number: z.number().int().positive(),
    postal: z.string().trim(),
    city: z.string().trim(),
    province: z.string().trim()
})

export const idSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  {
    message: "Invalid MongoDB ObjectId",
  }
);