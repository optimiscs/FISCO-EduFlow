const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 路由导入
const authRoutes = require('./routes/authRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verificationRoutes = require('./routes/verificationRoutes');

// 错误处理中间件
const errorHandler = require('./middleware/error');

// 配置
const config = require('./config/config');
const logger = require('./config/logger');

// 创建Express应用
const app = express();

// 安全性中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// 请求速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP 15分钟内最多100个请求
  standardHeaders: true,
  message: {
    success: false,
    message: '请求过多，请稍后再试'
  }
});

// 应用API速率限制
app.use('/api', limiter);

// Body解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie解析中间件
app.use(cookieParser());

// 压缩中间件
app.use(compression());

// 日志中间件（非生产环境）
if (config.environment !== 'production') {
  app.use(morgan('dev'));
}

// 设置静态文件目录
app.use(express.static(path.join(__dirname, '../public')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verificationRoutes);

// 404处理
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: '未找到请求的资源'
  });
});

// 错误处理中间件
app.use(errorHandler);

module.exports = app; 