import { z } from "zod"

export const createDeliverNoteSchema = z.object(
    {
        body: z.discriminatedUnion('format', [
            z.object({
                project: z.string(),
                format: z.literal('material'),
                description: z.string(),
                workDate: z.coerce.date(),
                material: z.string(),
                quantity: z.number().int().positive(),
                unit: z.string()
            }),
            z.object({
                project: z.string(),
                format: z.literal('hours'),
                description: z.string(),
                workDate: z.coerce.date(),
                hours: z.number().int().positive(),
                workers: z.array(
                    z.object({
                        name: z.string(),
                        hours: z.number().int().positive()
                    })
                )
            })
        ])
    }
)

export const getDeliveryNotesSchema = z.object(
    {
        query: z.object({
            page: z.coerce.number().int().min(1).optional(),
            limit: z.coerce.number().int().min(1).optional(),
            client: z.string().optional(),
            project: z.string().optional(),
            format: z.enum(['material', 'hours']).optional(),
            description: z.string().optional(),
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
            material: z.string().optional(),
            quantity: z.coerce.number().int().positive().optional(),
            unit: z.string().optional(), 
            totalHours: z.coerce.number().int().positive().optional(),
            worker: z.string().optional(),
            hours:  z.coerce.number().int().positive().optional(),
            signed: z.coerce.boolean().optional(),
            signedFrom: z.coerce.date().optional(),
            signedTo: z.coerce.date().optional(),
            sort: z.string().optional()
        }).strict()
    }
)

export const getDeliveryNoteSchema = z.object({
    params: z.object({
        id: z.string()
    })
})

export const downloadPDFSchema = z.object({
    params: z.object({
        id: z.string()
    }).strict()
})

export const deleteDeliveryNoteSchema = z.object(
    {
        query: z.object({
            soft: z.enum(['true','false']).optional()
        }).strict(),
        params: z.object({
            id: z.string()
        })
    }
)