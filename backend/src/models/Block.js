const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  blockNumber: {
    type: Number,
    required: true,
    unique: true
  },
  blockHash: {
    type: String,
    required: true,
    unique: true
  },
  parentHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  transactionCount: {
    type: Number,
    required: true,
    default: 0
  },
  size: Number,
  gasUsed: Number,
  miner: String,
  extraData: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Block', BlockSchema); 