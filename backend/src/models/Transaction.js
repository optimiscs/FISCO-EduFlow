const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  blockHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: String,
  value: String,
  gas: Number,
  gasPrice: String,
  input: String,
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  transactionType: {
    type: String,
    enum: ['certificateIssue', 'certificateVerify', 'certificateRevoke', 'other'],
    default: 'other'
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    enum: ['Certificate', 'User', 'VerificationRecord']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema); 