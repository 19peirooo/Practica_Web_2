import mongoose from "mongoose";
import Client from "../models/client.models.js"
import Project from "../models/project.models.js"
import { AppError } from "../utils/AppError.js";

export async function createProject(req,res) {
    
    const user = req.user
    const company = req.user.company
    const client = req.body.client

    if (!company || !client) {
        throw AppError.badRequest("No se pudo crear proyecto")
    }

    const existingClient = await Client.findOne({company: company, _id: client})

    if (!existingClient) {
        throw AppError.badRequest("No se pudo crear projecto")
    }

    const existingProject = await Project.findOne({projectCode: req.body.projectCode , company: company})

    if (existingProject) throw AppError.conflict("No se pudo crear projecto")

    req.body.user = user
    req.body.company = company

    await Project.create(req.body)

    res.status(201).json({message: "Proyecto Creado"})

}

export async function updateProject(req, res) {

    const company = req.user.company

    if (!company) throw AppError.badRequest("No se pudo actualizar proyecto")
    
    const {id} = req.params;

    if (!id) throw AppError.badRequest("No hay id");

    const existingProject = await Project.findOne({_id: id, company: company})

    if (!existingProject) throw AppError.notFound("No se pudo actualizar proyecto");
    
    await Project.findByIdAndUpdate( 
        id,
        req.body,
        {runValidators: true}
    )

    res.status(200).json({message: "Proyecto Actualizado"})

}

export async function getCompanyProjects(req, res) {
    
    const page = req.query.page || 1      
    const limit = req.query.limit || 10
    const skip = (page - 1) * limit

    const user = req.user
    const { name, projectCode, client, active, sort } = req.query
    
    if (!user.company) {
        throw AppError.badRequest("No se puedo conseguir projectos de la compañia") 
    }

    const filter = {
        company: user.company
    }

    if (name) {
        filter.name = { $regex: name, $options: "i" }
    }
    
    if (projectCode) {
        filter.projectCode = {$regex: projectCode , $options: "i"}
    }

    if (client) {
        filter.client = new mongoose.Types.ObjectId(client)
    }

    if (active) {
        filter.active = active === 'true'
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

    const projects = await Project.find(filter)
        .sort(sortFilter)
        .skip(skip)
        .limit(limit)
        .populate('user', 'email name lastName')
        .populate('company', 'name cif')
        .populate('client', 'name cif')

    const totalItems = await Project.countDocuments(filter)

    const totalPages = Math.ceil(totalItems / limit)

    res.status(200).json({
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: page,
        projects: projects
    })

}

export async function getProject(req, res) {
    
    const {id} = req.params
    const user = req.user

    if (!id) {
        throw AppError.badRequest("No se pudo buscar projecto")
    }

    if (!user.company) {
        throw AppError.badRequest("No se pudo buscar projecto")
    }

    const project = await Project.findOne({
        _id: id,
        company: user.company
    })
    .populate('user', 'email name lastName')
    .populate('company', 'name cif')
    .populate('client', 'name cif')

    if (!project) {
        throw AppError.notFound("No se pudo buscar projecto")
    }
    
    res.status(200).json(project)

}

export async function deleteProject(req, res) {
    
    const company = req.user.company

    const softDelete = req.query.soft === 'true'

    const {id} = req.params

    if (!id) {
        throw AppError.badRequest("No se pudo eliminar projecto")
    }

    const project = await Project.find({_id: id, company: company})

    if (!project) {
        throw AppError.notFound("No se pudo eliminar projecto")
    }

    if (softDelete) {
        await Project.softDeleteById(id,req.user.email)
    } else {
        await Project.hardDelete(id)
    }

    res.status(200).json({message: "Projecto eliminado"})

}

export async function getArchivedProjects(req, res) {
    
    const company = req.user.company

    if (!company) throw AppError.badRequest("No se pudo obtener projectos archivados")

    const archivedProjects = await Project.findDeleted({company: company})

    res.status(200).json({
        projects: archivedProjects
    })

}

export async function restoreProject(req, res) {
    
    const {id} = req.params
    
    const company = req.user.company

    if (!id) throw AppError.badRequest("No se pudo restaurar projecto")

    if (!company) throw AppError.badRequest("No se pudo restaurar projecto")

    const client = await Project.findDeleted({_id: id, company: company})
    
    if (!client) throw AppError.notFound("No se pudo restaurar projecto")

    await Project.restoreById(id)

    res.status(200).json({message: "Projecto Recuperado"})

}