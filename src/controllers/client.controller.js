import { tr } from "zod/v4/locales";
import Client from "../models/client.models.js";
import Company from "../models/company.models.js"
import { AppError } from "../utils/AppError.js";

export async function createClient(req,res,next) {

    try {

        const user = req.user
        const company = req.user.company
        const {name, cif, email, address} = req.body

        if (!user.company) {
            return AppError.badRequest("Usuario No tiene compañia asignada")
        }

        const dupClient = Client.findOne({company: company, cif: req.body.cif})

        if (dupClient) {
            return AppError.conflict("Usuario ya existente")
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

    } catch (error) {
        next(error)
    }

}

export async function updateClient(req,res,next) {
    
    try {

        const {id} = req.params;

        if (!id) return AppError.badRequest("No hay id");

        const existingClient = await Client.findOne({_id: id})

        if (!existingClient) return AppError.notFound("Cliente no encontrado");
        
        await Client.findByIdAndUpdate(
            id,
            req.body,
            {runValidators: true}
        )

        res.status(200).json({message: "Cliente Actualizado"})

    } catch (error) {
        next(error)
    }

}

export async function getUserClients(req, res, next) {
    
    try {

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        const user = req.user
        
        if (!user.company) {
            return AppError.badRequest("No se puedo conseguir clientes del usuario") 
        }

        const filter = {
            company: user.company
        }

        const {name , sort} = req.query

        if (name) {
            filter.name = {$regex: name, options: "i"}
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

    } catch (error) {
        next(error)
    }

}

export async function getClient(req, res, next) {
    try {

        const {id} = req.params
        const user = req.user

        if (!id) {
            return AppError.badRequest("No se pudo buscar cliente")
        }

        if (!user.company) {
            return AppError.badRequest("No se pudo buscar cliente")
        }

        const client = Client.findOne({
            _id: id,
            company: company
        })

        if (!client) {
            return AppError.notFound("No se pudo buscar cliente")
        }
        
        res.status(200).json(client)

    } catch (error) {
        next(error)
    }
}

export async function deleteClient(req, res, next) {
    
    try {

        const softDelete = req.query.soft === 'true'

        const {id} = req.params

        if (!id) {
            return AppError.badRequest("No se pudo eliminar cliente")
        }

        const client = await Client.findById(id)

        if (!client) {
            return AppError.notFound("No se pudo eliminar cliente")
        }

        if (softDelete) {
            await Client.softDeleteById(id,req.user.email)
        } else {
            await Client.hardDelete(id)
        }

        res.json(200).json({message: "Usuario eliminado"})

    } catch {
        next(error)
    }

}

export async function getArchivedClients(req, res, next) {
    
    try {

        const archivedClients = Client.findDeleted()

        res.status(200).json({
            clients: archivedClients
        })

    } catch (error) {
        next(error)
    }

}

export async function restoreClient(req, res, next) {
    
    try {

        const {id} = req.params

        if (!id) {
            return AppError.badRequest("No se pudo restaurar cliente")
        }

        const client = Client.findDeleted({_id: id})
        
        if (!client) {
            return AppError.notFound("No se pudo restaurar cliente")
        }

        await Client.restoreById(id)

        res.status(200).json({message: "Cliente Recuperado"})


    } catch (error) {
        next(error)
    }

}