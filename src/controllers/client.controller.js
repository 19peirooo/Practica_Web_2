import { tr } from "zod/v4/locales";
import Client from "../models/client.models.js";
import Company from "../models/company.models.js"
import { AppError } from "../utils/AppError.js";

export async function createClient(req,res) {

    const user = req.user
    const company = req.user.company
    const {name, cif, email, address} = req.body

    if (!user.company) {
        throw AppError.badRequest("No se pudo crear cliente")
    }

    const dupClient = await Client.findOne({company: company, cif: req.body.cif})

    if (dupClient) {
        throw AppError.conflict("No se pudo crear cliente")
    }

    await Client.create({
        user: user,
        company: company,
        name: name,
        cif: cif,
        email: email,
        address: address
    })

    res.status(201).json({message: "Cliente Creado"})

}

export async function updateClient(req,res) {

    const company = req.user.company

    if (!company) throw AppError.badRequest("No se pudo actualizar cliente")
    
    const {id} = req.params;

    if (!id) throw AppError.badRequest("No hay id");

    const existingClient = await Client.findOne({_id: id, company: company})

    if (!existingClient) throw AppError.notFound("No se pudo actualizar cliente");
    
    await Client.findByIdAndUpdate( 
        id,
        req.body,
        {runValidators: true}
    )

    res.status(200).json({message: "Cliente Actualizado"})

}

export async function getUserClients(req, res) {

    const page = parseInt(req.query.page) || 1      
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    console.log(`${page} ${limit}`)

    const user = req.user
    
    if (!user.company) {
        throw AppError.badRequest("No se puedo conseguir clientes del usuario") 
    }

    const filter = {
        company: user.company
    }

    const {name , sort} = req.query

    if (name) {
        filter.name = {$regex: name, $options: "i"}
    }

    const sortFilter = {}
    if (sort) {
        sortFilter[sort] = 1
    }

    const clients = await Client.find(filter)
        .sort(sortFilter)
        .skip(skip)
        .limit(limit)

    const totalItems = await Client.countDocuments(filter)

    const totalPages = Math.ceil(totalItems / limit)

    res.status(200).json({
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: page,
        clients: clients
    })

}

export async function getClient(req, res) {

    const {id} = req.params
    const user = req.user

    if (!id) {
        throw AppError.badRequest("No se pudo buscar cliente")
    }

    if (!user.company) {
        throw AppError.badRequest("No se pudo buscar cliente")
    }

    const client = await Client.findOne({
        _id: id,
        company: user.company
    })

    if (!client) {
        throw AppError.notFound("No se pudo buscar cliente")
    }
    
    res.status(200).json(client)
}

export async function deleteClient(req, res) {
    

    const softDelete = req.query.soft === 'true'

    const {id} = req.params

    if (!id) {
        throw AppError.badRequest("No se pudo eliminar cliente")
    }

    const client = await Client.findById(id)

    if (!client) {
        throw AppError.notFound("No se pudo eliminar cliente")
    }

    if (softDelete) {
        await Client.softDeleteById(id,req.user.email)
    } else {
        await Client.hardDelete(id)
    }

    res.status(200).json({message: "Usuario eliminado"})

}

export async function getArchivedClients(req, res) {
    
    const company = req.user.company

    if (!company) throw AppError.badRequest("No se pudo obtener clientes archivados")

    const archivedClients = await Client.findDeleted({company: company})

    res.status(200).json({
        clients: archivedClients
    })

}

export async function restoreClient(req, res) {

    const {id} = req.params

    const company = req.user.company

    if (!id) throw AppError.badRequest("No se pudo restaurar cliente")

    if (!company) throw AppError.badRequest("No se pudo restaurar cliente")

    const client = await Client.findDeleted({_id: id, company: company})
    
    if (!client) throw AppError.notFound("No se pudo restaurar cliente")

    await Client.restoreById(id)

    res.status(200).json({message: "Cliente Recuperado"})

}