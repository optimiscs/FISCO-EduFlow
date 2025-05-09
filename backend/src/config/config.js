require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/fiscoeduflow',
  jwtSecret: process.env.JWT_SECRET || 'fisco-eduflow-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  environment: process.env.NODE_ENV || 'development',
  fiscoBcos: {
    networkId: process.env.FISCO_NETWORK_ID || 1,
    groupId: process.env.FISCO_GROUP_ID || 1,
    nodeUrl: process.env.FISCO_NODE_URL || 'http://localhost:8545',
    privateKey: process.env.FISCO_PRIVATE_KEY || ''
  },
  logLevel: process.env.LOG_LEVEL || 'info'
}; 