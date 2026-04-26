import mongoose from "mongoose"
import { softDeletePlugin } from '../plugins/softDelete.plugin.js';

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  cif: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
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
}, {
  timestamps: true
});

clientSchema.plugin(softDeletePlugin)

clientSchema.index({cif : 1, company: 1}, {unique: true})
clientSchema.index({name: 1})

clientSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id
    delete ret.id
    return ret
  }
})

const Client = mongoose.model('Client', clientSchema);

export default Client;