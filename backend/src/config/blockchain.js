const Web3 = require('web3');
const config = require('./config');
const logger = require('./logger');

// 连接到FISCO BCOS节点
const connectBlockchain = () => {
  try {
    // 创建Web3连接
    const web3 = new Web3(new Web3.providers.HttpProvider(config.fiscoBcos.nodeUrl));
    
    // 设置FISCO BCOS特定的Provider属性
    web3.setProvider({
      ...web3.currentProvider,
      networkId: config.fiscoBcos.networkId,
      groupId: config.fiscoBcos.groupId
    });
    
    logger.info(`区块链连接成功: ${config.fiscoBcos.nodeUrl}`);
    return web3;
  } catch (error) {
    logger.error(`区块链连接失败: ${error.message}`);
    throw error;
  }
};

module.exports = { connectBlockchain }; 