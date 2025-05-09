const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  nodeType: {
    type: String,
    enum: ['consensus', 'observer'],
    default: 'consensus'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'syncing'],
    default: 'active'
  },
  blockNumber: {
    type: Number,
    default: 0
  },
  pbftView: Number,
  cpuUsage: Number,
  memoryUsage: Number,
  diskUsage: Number,
  connectionCount: Number,
  lastUpdateTime: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Node', NodeSchema); 