const express = require('express');
const {
  verifyByCertificateNumber,
  verifyByPersonalInfo,
  verifyByQRCode,
  getVerificationHistory
} = require('../controllers/verificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有验证路由都需要身份验证
router.use(protect);

// 企业验证路由
router.use(authorize('enterprise'));

// 通过证书编号验证
router.post('/certificate-number', verifyByCertificateNumber);

// 通过个人信息验证
router.post('/personal-info', verifyByPersonalInfo);

// 通过QR码验证
router.post('/qr-code', verifyByQRCode);

// 获取验证历史记录
router.get('/history', getVerificationHistory);

module.exports = router; 