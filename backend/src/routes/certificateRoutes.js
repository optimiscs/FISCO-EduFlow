const express = require('express');
const {
  createCertificate,
  issueCertificate,
  revokeCertificate,
  getCertificates,
  getCertificateDetail
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有证书路由都需要身份验证
router.use(protect);

// 创建证书（仅学校）
router.post('/', authorize('school'), createCertificate);

// 将证书上链（仅学校）
router.put('/:certificateId/issue', authorize('school'), issueCertificate);

// 撤销证书（仅学校）
router.put('/:certificateId/revoke', authorize('school'), revokeCertificate);

// 获取证书列表（学校或学生）
router.get('/', authorize('school', 'student'), getCertificates);

// 获取证书详情（学校、学生或企业）
router.get('/:certificateId', authorize('school', 'student', 'enterprise'), getCertificateDetail);

module.exports = router; 