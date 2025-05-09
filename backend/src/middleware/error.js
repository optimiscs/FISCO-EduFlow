const logger = require('../config/logger');

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error(`${err.name}: ${err.message}`, { 
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: err.stack
  });

  // 处理MongoDB重复键错误
  if (err.name === 'MongoError' && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} 已经存在`;
    return res.status(400).json({ 
      success: false, 
      message 
    });
  }

  // 处理Mongoose验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({ 
      success: false, 
      message 
    });
  }

  // 处理JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false, 
      message: '无效的认证令牌' 
    });
  }

  // 处理JWT过期错误
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false, 
      message: '认证令牌已过期' 
    });
  }

  // 处理区块链相关错误
  if (err.message && err.message.includes('blockchain')) {
    return res.status(500).json({
      success: false,
      message: '区块链操作失败',
      error: err.message
    });
  }

  // 根据环境返回不同级别的错误详情
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler; 