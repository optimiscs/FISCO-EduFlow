const Certificate = require('../models/Certificate');
const Transaction = require('../models/Transaction');
const { connectBlockchain } = require('../config/blockchain');
const logger = require('../config/logger');
const crypto = require('crypto');

// 创建证书（学校角色）
exports.createCertificate = async (req, res, next) => {
  try {
    // 确保请求来自学校用户
    if (req.user.role !== 'school') {
      return res.status(403).json({
        success: false,
        message: '只有学校用户可以创建证书'
      });
    }
    
    const {
      certificateNumber,
      studentId,
      certificateType,
      issueDate,
      expiryDate,
      major,
      degree,
      graduationDate,
      studentName,
      studentIdNumber,
      description
    } = req.body;
    
    // 检查证书编号是否已存在
    const existingCertificate = await Certificate.findOne({ certificateNumber });
    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: '证书编号已存在'
      });
    }
    
    // 创建证书（状态为待发布）
    const certificate = await Certificate.create({
      certificateNumber,
      studentId,
      schoolId: req.user._id,
      certificateType,
      issueDate: new Date(issueDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      major,
      degree,
      graduationDate: new Date(graduationDate),
      studentName,
      studentIdNumber,
      schoolName: req.user.organization,
      description,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    logger.error(`创建证书错误: ${error.message}`);
    next(error);
  }
};

// 将证书上链（学校角色）
exports.issueCertificate = async (req, res, next) => {
  try {
    // 确保请求来自学校用户
    if (req.user.role !== 'school') {
      return res.status(403).json({
        success: false,
        message: '只有学校用户可以发布证书'
      });
    }
    
    const { certificateId } = req.params;
    
    // 查找证书
    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: '证书不存在'
      });
    }
    
    // 确认证书属于该学校
    if (certificate.schoolId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权操作此证书'
      });
    }
    
    // 检查证书状态
    if (certificate.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `证书状态为 ${certificate.status}，无法进行发布操作`
      });
    }
    
    // 生成证书内容的哈希值
    const certificateData = {
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      studentIdNumber: certificate.studentIdNumber,
      schoolName: certificate.schoolName,
      certificateType: certificate.certificateType,
      major: certificate.major,
      degree: certificate.degree,
      issueDate: certificate.issueDate,
      graduationDate: certificate.graduationDate
    };
    
    const certificateHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(certificateData))
      .digest('hex');
    
    // 与区块链交互，上传证书哈希
    const web3 = connectBlockchain();
    
    // TODO: 实现与智能合约的交互逻辑
    // 这里需要调用FISCO BCOS上的证书发布合约
    
    // 模拟上链成功，获取交易哈希
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    const mockBlockNumber = Math.floor(Math.random() * 1000000);
    const mockTimestamp = new Date();
    
    // 更新证书状态和区块链信息
    certificate.status = 'issued';
    certificate.blockchainInfo = {
      transactionHash: mockTxHash,
      blockNumber: mockBlockNumber,
      timestamp: mockTimestamp
    };
    
    await certificate.save();
    
    // 记录交易信息
    await Transaction.create({
      transactionHash: mockTxHash,
      blockNumber: mockBlockNumber,
      blockHash: '0x' + crypto.randomBytes(32).toString('hex'),
      timestamp: mockTimestamp,
      from: req.user._id.toString(),
      to: 'ContractAddress', // 实际应该是合约地址
      input: certificateHash,
      status: 'success',
      transactionType: 'certificateIssue',
      relatedEntityId: certificate._id,
      entityModel: 'Certificate'
    });
    
    res.status(200).json({
      success: true,
      message: '证书已成功上链',
      data: {
        certificate,
        transactionHash: mockTxHash,
        blockNumber: mockBlockNumber
      }
    });
  } catch (error) {
    logger.error(`证书上链错误: ${error.message}`);
    next(error);
  }
};

// 撤销证书（学校角色）
exports.revokeCertificate = async (req, res, next) => {
  try {
    // 确保请求来自学校用户
    if (req.user.role !== 'school') {
      return res.status(403).json({
        success: false,
        message: '只有学校用户可以撤销证书'
      });
    }
    
    const { certificateId } = req.params;
    const { reason } = req.body;
    
    // 查找证书
    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: '证书不存在'
      });
    }
    
    // 确认证书属于该学校
    if (certificate.schoolId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权操作此证书'
      });
    }
    
    // 检查证书状态
    if (certificate.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: `证书状态为 ${certificate.status}，无法进行撤销操作`
      });
    }
    
    // 与区块链交互，撤销证书
    const web3 = connectBlockchain();
    
    // TODO: 实现与智能合约的交互逻辑
    // 这里需要调用FISCO BCOS上的证书撤销合约
    
    // 模拟撤销成功，获取交易哈希
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    const mockBlockNumber = Math.floor(Math.random() * 1000000);
    const mockTimestamp = new Date();
    
    // 更新证书状态
    certificate.status = 'revoked';
    await certificate.save();
    
    // 记录交易信息
    await Transaction.create({
      transactionHash: mockTxHash,
      blockNumber: mockBlockNumber,
      blockHash: '0x' + crypto.randomBytes(32).toString('hex'),
      timestamp: mockTimestamp,
      from: req.user._id.toString(),
      to: 'ContractAddress', // 实际应该是合约地址
      input: `Revoke: ${certificate.certificateNumber}, Reason: ${reason}`,
      status: 'success',
      transactionType: 'certificateRevoke',
      relatedEntityId: certificate._id,
      entityModel: 'Certificate'
    });
    
    res.status(200).json({
      success: true,
      message: '证书已成功撤销',
      data: {
        certificate,
        transactionHash: mockTxHash,
        blockNumber: mockBlockNumber
      }
    });
  } catch (error) {
    logger.error(`证书撤销错误: ${error.message}`);
    next(error);
  }
};

// 获取证书列表（学校或学生）
exports.getCertificates = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // 根据用户角色构建不同的查询条件
    let query = {};
    
    if (req.user.role === 'school') {
      // 学校只能查看自己发布的证书
      query.schoolId = req.user._id;
    } else if (req.user.role === 'student') {
      // 学生只能查看自己的证书
      query.studentId = req.user._id;
    } else {
      return res.status(403).json({
        success: false,
        message: '无权访问证书列表'
      });
    }
    
    // 添加可选的筛选条件
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.certificateType = req.query.type;
    
    // 获取证书列表
    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Certificate.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: certificates.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: certificates
    });
  } catch (error) {
    logger.error(`获取证书列表错误: ${error.message}`);
    next(error);
  }
};

// 获取证书详情
exports.getCertificateDetail = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    
    // 查找证书
    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: '证书不存在'
      });
    }
    
    // 检查权限
    if (req.user.role === 'school' && certificate.schoolId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权查看此证书'
      });
    }
    
    if (req.user.role === 'student' && certificate.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权查看此证书'
      });
    }
    
    // 返回证书详情
    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    logger.error(`获取证书详情错误: ${error.message}`);
    next(error);
  }
}; 