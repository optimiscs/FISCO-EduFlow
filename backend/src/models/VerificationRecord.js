const mongoose = require('mongoose');

const VerificationRecordSchema = new mongoose.Schema({
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    required: true
  },
  verifierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationMethod: {
    type: String,
    enum: ['certificateNumber', 'personalInfo', 'qrCode'],
    required: true
  },
  verificationResult: {
    type: Boolean,
    required: true
  },
  verificationDate: {
    type: Date,
    default: Date.now
  },
  purpose: String,
  remarks: String,
  ipAddress: String,
  userAgent: String,
  blockchainInfo: {
    transactionHash: String,
    blockNumber: Number,
    timestamp: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VerificationRecord', VerificationRecordSchema); 