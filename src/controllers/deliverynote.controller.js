import PDFDocument from "pdfkit"
import cloudinaryService from '../services/cloudinary.service.js'
import { buffer } from "stream/consumers"
import { AppError } from "../utils/AppError.js"
import Project from "../models/project.models.js"
import DeliveryNote from "../models/deliverynote.models.js"
import mongoose from "mongoose"

export async function createDeliveryNote(req,res) {
    
    const company = req.user.company
    const projectId = req.body.project

    if (!company || !projectId) throw AppError.badRequest("No se pudo crear albaran")
    
    const project = await Project.findOne({_id: projectId, company: company})

    if (!project) throw AppError.badRequest("No se pudo crear albaran")

    if (req.body.workers) {
        const totalHours = req.body.hours
        let sum = 0

        for (const worker of req.body.workers) {
            sum += worker.hours
        }

        if (sum != totalHours) throw AppError.badRequest("No se pudo crear albaran")
    }

    const clientId = project.client

    req.body.user = req.user
    req.body.company = company
    req.body.client = clientId
    
    await DeliveryNote.create(req.body)

    res.status(201).json({message:"Albaran Creado"})

}

export async function getDeliveryNotes(req, res) {
    
    const page = req.query.page || 1      
    const limit = req.query.limit || 10
    const skip = (page - 1) * limit

    const user = req.user
    const {client, project, format, description, from, to, 
            material, quantity, unit,
            totalHours, worker, hours,
            signed, signedFrom, signedTo, sort} = req.query

    if (!user.company) {
        throw AppError.badRequest("No se puedo conseguir projectos de la compañia") 
    }

    const filter = {
        company: user.company
    }

    if (client) filter.client = new mongoose.Types.ObjectId(client)

    if (project) filter.project = new mongoose.Types.ObjectId(project)

    if (format) filter.format = format

    if (description) filter.description = { $regex: description, $options: "i"}

    if (from || to) {
        filter.workDate = {}

        if (from) {
            filter.workDate.$gte = from
        }

        if (to) {
            filter.workDate.$lte = to
        }

    }

    if (material) filter.material = material

    if (quantity) filter.quantity = quantity

    if (unit) filter.unit = unit

    if (totalHours) filter.hours = totalHours

    //TODO meter filtros de trabajadores por nombre y horas

    if (signed) filter.signed = signed

    if (signedFrom || signedTo) {
        
        filter.signedAt = {}

        if (signedFrom) {
            filter.signedAt.$gte = signedFrom
        }

        if (signedTo) {
            filter.signedAt.$lte = signedTo
        }

    }

    const sortFilter = {}
    if (sort) {
        if (sort.startsWith('-')) {
            const campo = sort.slice(1)
            sortFilter[campo] = -1
        } else {
            sortFilter[sort] = 1
        }
    }

    const albaranes = await DeliveryNote.find(filter)
        .sort(sortFilter)
        .skip(skip)
        .limit(limit)
        .populate('user', 'email name lastName')
        .populate('company', 'name cif')
        .populate('client', 'name cif')
        .populate('project', 'name projectCode')

    const totalItems = await DeliveryNote.countDocuments(filter)

    const totalPages = Math.ceil(totalItems / limit)

    res.status(200).json({
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: page,
        deliveryNotes: albaranes
    })




}

export async function getDeliveryNote(req, res) {

    const {id} = req.params
    const user = req.user

    if (!id) {
        throw AppError.badRequest("No se pudo buscar projecto")
    }

    if (!user.company) {
        throw AppError.badRequest("No se pudo buscar projecto")
    }

    const albaran = await DeliveryNote.findOne({
        _id: id,
        company: user.company
    })
    .populate('user', 'email name lastName')
    .populate('company', 'name cif')
    .populate('client', 'name cif')
    .populate('project', 'name projectCode')

    if (!albaran) {
        throw AppError.notFound("No se pudo buscar projecto")
    }
    
    res.status(200).json(albaran)
}

export async function returnPdf(req, res) {

    var doc = new PDFDocument()

    res.setHeader('Content-Type','application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="albaransinfirma.pdf"')

    doc.pipe(res)

    doc.text('Aprendiendo a usar pdfkit u cloudinary',100,450)
    doc.circle(280,200,50).fill("#6600FF")
    doc.end()

    res.status(200).json()
}

export async function signPdf(req,res,next) {

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

}
