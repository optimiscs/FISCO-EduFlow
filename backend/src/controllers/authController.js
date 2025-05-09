const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const logger = require('../config/logger');

// 生成JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

// 用户注册
exports.register = async (req, res, next) => {
  try {
    const { username, password, role, email, fullName, mobile, organization, title } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户已存在'
      });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
      role,
      email,
      fullName,
      mobile,
      organization,
      title
    });

    // 生成JWT令牌
    const token = generateToken(user._id);

    // 设置Cookie（可选）
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1天
      httpOnly: true
    };
    
    if (config.environment === 'production') cookieOptions.secure = true;
    res.cookie('token', token, cookieOptions);

    // 发送响应（不包含密码）
    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
        organization: user.organization
      }
    });
  } catch (error) {
    logger.error(`注册错误: ${error.message}`);
    next(error);
  }
};

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 检查用户名和密码是否提供
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      });
    }

    // 查找用户并包含密码
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });

    // 检查用户是否存在
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查密码是否匹配
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查用户是否已激活
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '您的账号已被禁用'
      });
    }

    // 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save();

    // 生成JWT令牌
    const token = generateToken(user._id);

    // 设置Cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1天
      httpOnly: true
    };
    
    if (config.environment === 'production') cookieOptions.secure = true;
    res.cookie('token', token, cookieOptions);

    // 发送响应（不包含密码）
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
        organization: user.organization
      }
    });
  } catch (error) {
    logger.error(`登录错误: ${error.message}`);
    next(error);
  }
};

// 获取当前用户信息
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
};

// 退出登录
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // 10秒后过期
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: '已退出登录'
  });
};

// 更新密码
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 获取当前用户（包括密码）
    const user = await User.findById(req.user.id);

    // 检查当前密码
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '当前密码不正确'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 生成新的JWT令牌
    const token = generateToken(user._id);

    // 设置Cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1天
      httpOnly: true
    };
    
    if (config.environment === 'production') cookieOptions.secure = true;
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: '密码更新成功',
      token
    });
  } catch (error) {
    logger.error(`更新密码错误: ${error.message}`);
    next(error);
  }
}; 