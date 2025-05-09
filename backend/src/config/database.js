const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./logger');

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info(`MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB 连接失败: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 