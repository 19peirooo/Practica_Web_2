import mongoose from "mongoose"
import { softDeletePlugin } from "../plugins/softDelete.plugin.js"

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            index: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        nif: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            enum: ['admin','guest'],
            default: 'admin'
        },
        status: {
            type: String,
            enum: ['pending','verified'],
            default: 'pending',
            index: true
        },
        verificationCode: {
            type: String,
            length: 6
        },
        verificationAttempts: {
            type: Number,
            default: 3,
            min: 0,
            max: 3
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            index: true
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
    },
    {
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)

userSchema.plugin(softDeletePlugin)

userSchema.index({email: 1}, {unique: true})
userSchema.index({ company: 1 })
userSchema.index({ status: 1 })
userSchema.index({ role: 1 })

userSchema.virtual('fullName').get(function() {
    return `${this.name} ${this.lastName}`
})

const User = mongoose.model('User', userSchema)

export default User