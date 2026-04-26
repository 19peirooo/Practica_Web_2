import mongoose from "mongoose";
import { softDeletePlugin } from "../plugins/softDelete.plugin.js";

const deliveryNoteSchema = new mongoose.Schema({
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
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  format: {
    type: String,
    enum: ['material', 'hours'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  workDate: {
    type: Date,
    required: true
  },
  material: {
    type: String,
    trim: true,
    required: function () {
      return this.format === 'material';
    }
  },
  quantity: {
    type: Number,
    min: 0,
    required: function () {
      return this.format === 'material';
    }
  },
  unit: {
    type: String,
    trim: true,
    required: function () {
      return this.format === 'material';
    }
  },

  // HOURS
  hours: {
    type: Number,
    min: 0,
    required: function () {
      return this.format === 'hours' && (!this.workers || this.workers.length === 0);
    }
  },
  workers: {
    type: [
      {
        name: { type: String, trim: true },
        hours: { type: Number, min: 0 }
      }, 
    ],
    default: undefined
  },

  signed: {
    type: Boolean,
    default: false
  },
  signedAt: {
    type: Date
  },
  signatureUrl: {
    type: String,
    trim: true,
    default: undefined
  },
  pdfUrl: {
    type: String,
    trim: true,
    default: undefined
  }

}, {
  timestamps: true
});

deliveryNoteSchema.plugin(softDeletePlugin)

deliveryNoteSchema.index({ company: 1, workDate: -1 });
deliveryNoteSchema.index({ client: 1 });
deliveryNoteSchema.index({ project: 1 });

deliveryNoteSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    delete ret.id
    return ret
  }
})

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema)

export default DeliveryNote