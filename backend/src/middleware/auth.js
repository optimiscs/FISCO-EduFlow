const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const logger = require('../config/logger');

// 验证用户身份中间件
const protect = async (req, res, next) => {
  let token;

  // 从请求头或Cookie中获取Token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // 从Authorization头部获取Token（Bearer token格式）
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // 从Cookie中获取Token
    token = req.cookies.token;
  }

  // 没有Token
  if (!token) {
    logger.error('未提供认证令牌');
    return res.status(401).json({
      success: false,
      message: '未授权，请登录'
    });
  }

  try {
    // 验证Token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // 获取用户信息
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      logger.error(`用户不存在: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查用户是否已激活
    if (!user.isActive) {
      logger.error(`禁止访问: 用户 ${user._id} 已被禁用`);
      return res.status(403).json({
        success: false,
        message: '您的账号已被禁用'
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    logger.error(`认证令牌验证失败: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: '认证令牌无效或已过期'
    });
  }
};

// 角色授权中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('需要先运行protect中间件');
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.error(`用户 ${req.user._id} 无权限访问此资源`);
      return res.status(403).json({
        success: false,
        message: '无权限执行此操作'
      });
    }
    
    next();
  };
};

module.exports = { protect, authorize }; 