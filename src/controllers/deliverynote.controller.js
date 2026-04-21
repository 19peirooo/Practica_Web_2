import PDFDocument from "pdfkit"
import cloudinaryService from '../services/cloudinary.service.js'
import { buffer } from "stream/consumers"
import { equal } from "assert"
import { AppError } from "../utils/AppError.js"
import { format } from "path"
import { access } from "fs"

export async function returnPdf(req, res,next) {

    try {
        var doc = new PDFDocument()

        res.setHeader('Content-Type','application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename="albaransinfirma.pdf"')

        doc.pipe(res)

        doc.text('Aprendiendo a usar pdfkit u cloudinary',100,450)
        doc.circle(280,200,50).fill("#6600FF")
        doc.end()

        res.status(200).json()
    } catch (error) {
        next(error)
    }
}

export async function signPdf(req,res,next) {

    try {

        if (!req.file) {
            return AppError.badRequest("No se subio firma")
        }

        var doc = new PDFDocument()
        doc.text('Aprendiendo a usar pdfkit u cloudinary',100,450)

        const pdfPromise = buffer(doc)
        
        doc.image(req.file.buffer, 300, 300, 50, 50)
        doc.end()

        const pdfBuffer = await pdfPromise;

        const pdfResult = cloudinaryService.uploadBuffer(pdfBuffer, {
            folder: 'pdfs', resource_type: 'raw', format: 'pdf', access_mode: 'public'
        })
        
        const signatureResult = cloudinaryService.uploadImage(req.file.buffer, {
            folder: 'signatures'
        })

        

    } catch (error) {
        next(error)
    }

}
