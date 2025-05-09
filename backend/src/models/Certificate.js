const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certificateType: {
    type: String,
    enum: ['diploma', 'degree', 'certification', 'transcript'],
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: Date,
  major: String,
  degree: String,
  graduationDate: Date,
  studentName: {
    type: String,
    required: true
  },
  studentIdNumber: {
    type: String,
    required: true
  },
  schoolName: {
    type: String,
    required: true
  },
  description: String,
  blockchainInfo: {
    transactionHash: String,
    blockNumber: Number,
    timestamp: Date,
    contractAddress: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'issued', 'revoked'],
    default: 'pending'
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

module.exports = mongoose.model('Certificate', CertificateSchema); 