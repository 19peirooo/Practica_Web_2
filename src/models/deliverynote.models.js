import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  hours: { type: Number, min: 0 }
}, { _id: false });

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

  // MATERIAL
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
  workers: [workerSchema],

  signed: {
    type: Boolean,
    default: false
  },
  signedAt: {
    type: Date
  },
  signatureUrl: {
    type: String,
    trim: true
  },
  pdfUrl: {
    type: String,
    trim: true
  }

}, {
  timestamps: true
});

deliveryNoteSchema.index({ company: 1, workDate: -1 });
deliveryNoteSchema.index({ client: 1 });
deliveryNoteSchema.index({ project: 1 });

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema)

export default DeliveryNote