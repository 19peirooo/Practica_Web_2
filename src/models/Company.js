import mongoose from "mongoose"
import { softDeletePlugin } from "../plugins/softDelete.plugin"

const companySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        cif: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            street: {
                type: String,
                trim: true
            },
            number: {
                type: String,
                trim: true
            },
            postal: {
                type: String,
                trim: true
            },
            city: {
                type: String,
                trim: true
            },
            province: {
                type: String,
                trim: true
            }
        },
        logo: {
            type: String,
            trim: true
        },
        isFreelance: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

companySchema.plugin(softDeletePlugin)

companySchema.index({owner : 1})
companySchema.index({cif : 1})
companySchema.index({name: 1})

const Company = mongoose.model('Company', companySchema)

export default Company