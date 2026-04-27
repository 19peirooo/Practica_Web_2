import PDFDocument from "pdfkit"
import cloudinaryService from '../services/cloudinary.service.js'
import { buffer } from "stream/consumers"
import { AppError } from "../utils/AppError.js"
import Project from "../models/project.models.js"
import DeliveryNote from "../models/deliverynote.models.js"
import Company from "../models/company.models.js"
import mongoose from "mongoose"
import { generatePdf, generateSignedPdf } from "../utils/handlePDF.js"

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
        throw AppError.badRequest("No se puedo conseguir albaranes del proyecto") 
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

    if (worker || hours) {
        filter.workers = {
            $elemMatch: {}
        }

        if (worker) {
            filter.workers.$elemMatch.name = { $regex: worker, $options: "i" }
        }

        if (hours) {
            filter.workers.$elemMatch.hours = hours
        }
    }

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

    if (!id) throw AppError.badRequest("No se pudo buscar albaran")

    if (!user.company) throw AppError.badRequest("No se pudo buscar albaran")

    const albaran = await DeliveryNote.findOne({
        _id: id,
        company: user.company
    })
    .populate('user', 'email name lastName')
    .populate('company', 'name cif')
    .populate('client', 'name cif')
    .populate('project', 'name projectCode')

    if (!albaran) {
        throw AppError.notFound("No se pudo buscar albaran")
    }
    
    res.status(200).json(albaran)
}

export async function returnPdf(req, res) {

    const user = req.user
    const company = user.company
    const { id } = req.params

    if (!company || !id) throw AppError.badRequest("No se pudo descargar pdf")

    const albaran = await DeliveryNote.findById(id)
    .populate('user', 'email name lastName')
    .populate('company', 'name cif')
    .populate('client', 'name cif')
    .populate('project', 'name projectCode')

    const isOwner = albaran.user._id.equals(user._id)
    const isSameCompany = albaran.company._id.equals(company)
    const isGuest = user.role === 'guest'

    console.log(`${isOwner} ${isSameCompany} ${isGuest}`)

    if (!isOwner && !(isSameCompany && isGuest)) throw AppError.forbidden("No se pudo descargar pdf")

    // TODO - Descargar PDF firmado
    if (albaran.signed && albaran.pdfUrl) {

    }

    const pdfBuffer = await generatePdf(albaran)
    res.setHeader('Content-Type','application/pdf')
    res.setHeader('Content-Disposition',`attachment; filename="deliverynote_${id}.pdf"`)

    res.status(200).send(pdfBuffer)
}

export async function signPdf(req,res) {

    const user = req.user
    const company = user.company
    const { id } = req.params

    if (!company || !id) throw AppError.badRequest("No se pudo descargar pdf")

    const albaran = await DeliveryNote.findById(id)
    .populate('user', 'email name lastName')
    .populate('company', 'name cif')
    .populate('client', 'name cif')
    .populate('project', 'name projectCode')

    if (!req.file) {
        return AppError.badRequest("No se subio firma")
    }
    
    const pdfBuffer = await generateSignedPdf(albaran, req.file.buffer);

    const pdfResult = await cloudinaryService.uploadBuffer(pdfBuffer, {
        folder: 'pdfs', resource_type: 'raw', format: 'pdf', access_mode: 'public'
    })
    
    const signatureResult = await cloudinaryService.uploadImage(req.file.buffer, {
        folder: 'signatures'
    })

    albaran.pdfUrl = pdfResult.secure_url
    albaran.signed = true
    albaran.signedAt = Date.now()
    albaran.signatureUrl = signatureResult.secure_url
    await albaran.save()

    res.setHeader('Content-Type','application/pdf')
    res.setHeader('Content-Disposition',`attachment; filename="deliverynote_signed_${id}.pdf"`)

    res.status(200).send(pdfBuffer)

}

export async function deleteDeliveryNote(req, res) {

    const company = req.user.company

    const softDelete = req.query.soft === 'true'

    const {id} = req.params

    if (!id) {
        throw AppError.badRequest("No se pudo eliminar albaran")
    }

    const albaran = await DeliveryNote.find({_id: id, company: company})

    if (!albaran) throw AppError.notFound("No se pudo eliminar albaran")

    if (albaran.signed) throw AppError.badRequest("No se pudo eliminar albaran")

    if (softDelete) {
        await Project.softDeleteById(id,req.user.email)
    } else {
        await Project.hardDelete(id)
    }

    res.status(200).json({message: "Albaran eliminado"})
}