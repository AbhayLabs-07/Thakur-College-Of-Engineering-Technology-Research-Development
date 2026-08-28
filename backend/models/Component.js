import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Microcontroller', 'Development Board', 'Sensor', 'Actuator', 'Power Supply', 'Communication Module', 'Display', 'Passive Components', 'Others']
  },
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  quantityTotal: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  keywords: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Component = mongoose.model('Component', componentSchema);
export default Component;
