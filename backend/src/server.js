const app = require('./app');
const connectDB = require('./config/database');
const { connectBlockchain } = require('./config/blockchain');
const config = require('./config/config');
const logger = require('./config/logger');
const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// 确保public目录存在
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// 启动服务器
const server = app.listen(config.port, async () => {
  logger.info(`服务器在${config.environment}环境下运行于端口: ${config.port}`);
  
  // 连接到数据库
  try {
    await connectDB();
    logger.info('数据库连接成功');
    
    // 连接到区块链
    try {
      connectBlockchain();
      logger.info('区块链连接成功');
    } catch (error) {
      logger.error(`区块链连接失败: ${error.message}`);
    }
  } catch (error) {
    logger.error(`数据库连接失败: ${error.message}`);
    process.exit(1);
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获的异常: ${err.message}`);
  logger.error(err.stack);
  
  // 优雅地关闭服务器
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(1);
  });
  
  // 如果服务器未能在规定时间内关闭
  setTimeout(() => {
    process.exit(1);
  }, 10000);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (err) => {
  logger.error(`未处理的Promise拒绝: ${err.message}`);
  logger.error(err.stack);
  
  // 优雅地关闭服务器
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(1);
  });
  
  // 如果服务器未能在规定时间内关闭
  setTimeout(() => {
    process.exit(1);
  }, 10000);
});

// 处理终止信号
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号');
  server.close(() => {
    logger.info('进程已终止');
    process.exit(0);
  });
}); 