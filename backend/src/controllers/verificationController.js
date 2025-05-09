const Certificate = require('../models/Certificate');
const VerificationRecord = require('../models/VerificationRecord');
const Transaction = require('../models/Transaction');
const { connectBlockchain } = require('../config/blockchain');
const logger = require('../config/logger');

// 通过证书编号验证
exports.verifyByCertificateNumber = async (req, res, next) => {
  try {
    const { certificateNumber, purpose, remarks } = req.body;
    
    // 查找证书
    const certificate = await Certificate.findOne({ certificateNumber });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: '证书不存在或编号无效'
      });
    }
    
    // 检查证书状态
    if (certificate.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: `证书状态为 ${certificate.status}，不是有效状态`
      });
    }
    
    // 验证区块链上的证书信息
    const isVerified = await verifyOnBlockchain(certificate);
    
    // 创建验证记录
    const verificationRecord = await VerificationRecord.create({
      certificateId: certificate._id,
      verifierId: req.user._id,
      verificationMethod: 'certificateNumber',
      verificationResult: isVerified,
      purpose,
      remarks,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      blockchainInfo: certificate.blockchainInfo
    });
    
    // 如果区块链验证成功，更新证书的验证状态
    if (isVerified && !certificate.isVerified) {
      certificate.isVerified = true;
      await certificate.save();
    }
    
    // 返回验证结果
    return res.status(200).json({
      success: true,
      isVerified,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        certificateType: certificate.certificateType,
        studentName: certificate.studentName,
        studentIdNumber: certificate.studentIdNumber,
        schoolName: certificate.schoolName,
        major: certificate.major,
        degree: certificate.degree,
        issueDate: certificate.issueDate,
        graduationDate: certificate.graduationDate
      },
      blockchainInfo: certificate.blockchainInfo,
      verificationRecord: {
        id: verificationRecord._id,
        timestamp: verificationRecord.createdAt
      }
    });
  } catch (error) {
    logger.error(`证书验证错误: ${error.message}`);
    next(error);
  }
};

// 通过个人信息验证
exports.verifyByPersonalInfo = async (req, res, next) => {
  try {
    const { studentName, studentIdNumber, schoolName, purpose, remarks } = req.body;
    
    // 查找证书
    const certificate = await Certificate.findOne({
      studentName,
      studentIdNumber,
      schoolName
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: '未找到匹配的证书'
      });
    }
    
    // 检查证书状态
    if (certificate.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: `证书状态为 ${certificate.status}，不是有效状态`
      });
    }
    
    // 验证区块链上的证书信息
    const isVerified = await verifyOnBlockchain(certificate);
    
    // 创建验证记录
    const verificationRecord = await VerificationRecord.create({
      certificateId: certificate._id,
      verifierId: req.user._id,
      verificationMethod: 'personalInfo',
      verificationResult: isVerified,
      purpose,
      remarks,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      blockchainInfo: certificate.blockchainInfo
    });
    
    // 如果区块链验证成功，更新证书的验证状态
    if (isVerified && !certificate.isVerified) {
      certificate.isVerified = true;
      await certificate.save();
    }
    
    // 返回验证结果
    return res.status(200).json({
      success: true,
      isVerified,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        certificateType: certificate.certificateType,
        studentName: certificate.studentName,
        studentIdNumber: certificate.studentIdNumber,
        schoolName: certificate.schoolName,
        major: certificate.major,
        degree: certificate.degree,
        issueDate: certificate.issueDate,
        graduationDate: certificate.graduationDate
      },
      blockchainInfo: certificate.blockchainInfo,
      verificationRecord: {
        id: verificationRecord._id,
        timestamp: verificationRecord.createdAt
      }
    });
  } catch (error) {
    logger.error(`证书验证错误: ${error.message}`);
    next(error);
  }
};

// 通过QR码验证
exports.verifyByQRCode = async (req, res, next) => {
  try {
    const { qrData, purpose, remarks } = req.body;
    
    // 解析QR码数据（假设QR码存储的是证书编号）
    const certificateNumber = qrData;
    
    // 查找证书
    const certificate = await Certificate.findOne({ certificateNumber });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: '证书不存在或编号无效'
      });
    }
    
    // 检查证书状态
    if (certificate.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: `证书状态为 ${certificate.status}，不是有效状态`
      });
    }
    
    // 验证区块链上的证书信息
    const isVerified = await verifyOnBlockchain(certificate);
    
    // 创建验证记录
    const verificationRecord = await VerificationRecord.create({
      certificateId: certificate._id,
      verifierId: req.user._id,
      verificationMethod: 'qrCode',
      verificationResult: isVerified,
      purpose,
      remarks,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      blockchainInfo: certificate.blockchainInfo
    });
    
    // 如果区块链验证成功，更新证书的验证状态
    if (isVerified && !certificate.isVerified) {
      certificate.isVerified = true;
      await certificate.save();
    }
    
    // 返回验证结果
    return res.status(200).json({
      success: true,
      isVerified,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        certificateType: certificate.certificateType,
        studentName: certificate.studentName,
        studentIdNumber: certificate.studentIdNumber,
        schoolName: certificate.schoolName,
        major: certificate.major,
        degree: certificate.degree,
        issueDate: certificate.issueDate,
        graduationDate: certificate.graduationDate
      },
      blockchainInfo: certificate.blockchainInfo,
      verificationRecord: {
        id: verificationRecord._id,
        timestamp: verificationRecord.createdAt
      }
    });
  } catch (error) {
    logger.error(`证书验证错误: ${error.message}`);
    next(error);
  }
};

// 获取验证历史记录
exports.getVerificationHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // 构建查询条件（只查看当前用户的验证记录）
    const query = { verifierId: req.user._id };
    
    // 添加可选的筛选条件
    if (req.query.method) query.verificationMethod = req.query.method;
    if (req.query.result === 'true') query.verificationResult = true;
    if (req.query.result === 'false') query.verificationResult = false;
    
    // 获取验证记录
    const verificationRecords = await VerificationRecord.find(query)
      .populate({
        path: 'certificateId',
        select: 'certificateNumber studentName schoolName certificateType'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await VerificationRecord.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: verificationRecords.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: verificationRecords
    });
  } catch (error) {
    logger.error(`获取验证历史记录错误: ${error.message}`);
    next(error);
  }
};

// 在区块链上验证证书
const verifyOnBlockchain = async (certificate) => {
  try {
    // 如果证书没有区块链信息，则无法验证
    if (!certificate.blockchainInfo || !certificate.blockchainInfo.transactionHash) {
      logger.error(`证书 ${certificate.certificateNumber} 缺少区块链信息`);
      return false;
    }
    
    const web3 = connectBlockchain();
    
    // 获取交易信息
    const txHash = certificate.blockchainInfo.transactionHash;
    const transaction = await web3.eth.getTransaction(txHash);
    
    if (!transaction) {
      logger.error(`在区块链上未找到交易 ${txHash}`);
      return false;
    }
    
    // TODO: 实现与智能合约的交互验证逻辑
    // 这里需要调用FISCO BCOS上的证书验证合约
    
    // 模拟验证成功
    // 在实际项目中，需要从区块链上获取证书的哈希值，并与当前证书信息的哈希进行比较
    return true;
  } catch (error) {
    logger.error(`区块链验证错误: ${error.message}`);
    return false;
  }
}; 