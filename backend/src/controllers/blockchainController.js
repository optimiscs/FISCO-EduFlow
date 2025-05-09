const { connectBlockchain } = require('../config/blockchain');
const Block = require('../models/Block');
const Transaction = require('../models/Transaction');
const Node = require('../models/Node');
const logger = require('../config/logger');

// 获取区块链概览数据
exports.getBlockchainOverview = async (req, res, next) => {
  try {
    const web3 = connectBlockchain();
    
    // 获取最新区块高度
    const blockHeight = await web3.eth.getBlockNumber();
    
    // 获取总交易数（从数据库）
    const totalTransactions = await Transaction.countDocuments();
    
    // 获取节点数量
    const nodesCount = await Node.countDocuments();
    
    // 计算TPS（最近100个区块的平均值）
    let tps = 0;
    const recentBlocks = await Block.find()
      .sort({ blockNumber: -1 })
      .limit(100);
    
    if (recentBlocks.length > 1) {
      const totalTx = recentBlocks.reduce((sum, block) => sum + block.transactionCount, 0);
      const oldestBlock = recentBlocks[recentBlocks.length - 1];
      const newestBlock = recentBlocks[0];
      const timeSpan = (new Date(newestBlock.timestamp) - new Date(oldestBlock.timestamp)) / 1000;
      
      if (timeSpan > 0) {
        tps = totalTx / timeSpan;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        blockHeight,
        totalTransactions,
        nodesCount,
        tps: tps.toFixed(2)
      }
    });
  } catch (error) {
    logger.error(`获取区块链概览错误: ${error.message}`);
    next(error);
  }
};

// 获取最新区块列表
exports.getLatestBlocks = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    const blocks = await Block.find()
      .sort({ blockNumber: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Block.countDocuments();
    
    res.status(200).json({
      success: true,
      count: blocks.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: blocks
    });
  } catch (error) {
    logger.error(`获取最新区块列表错误: ${error.message}`);
    next(error);
  }
};

// 获取区块详情
exports.getBlockDetail = async (req, res, next) => {
  try {
    const { blockNumber } = req.params;
    
    // 从数据库查询区块信息
    let block = await Block.findOne({ blockNumber });
    
    // 如果数据库没有，则从区块链查询
    if (!block) {
      const web3 = connectBlockchain();
      const blockData = await web3.eth.getBlock(parseInt(blockNumber));
      
      if (!blockData) {
        return res.status(404).json({
          success: false,
          message: '区块不存在'
        });
      }
      
      // 保存区块信息到数据库
      block = await Block.create({
        blockNumber: blockData.number,
        blockHash: blockData.hash,
        parentHash: blockData.parentHash,
        timestamp: new Date(blockData.timestamp * 1000),
        transactionCount: blockData.transactions.length,
        size: blockData.size,
        gasUsed: blockData.gasUsed,
        miner: blockData.miner,
        extraData: blockData.extraData
      });
    }
    
    // 获取该区块的交易列表
    const transactions = await Transaction.find({ blockNumber }).sort({ timestamp: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        block,
        transactions
      }
    });
  } catch (error) {
    logger.error(`获取区块详情错误: ${error.message}`);
    next(error);
  }
};

// 获取最新交易列表
exports.getLatestTransactions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const type = req.query.type; // 可选的交易类型过滤
    
    // 构建查询条件
    const query = {};
    if (type) {
      query.transactionType = type;
    }
    
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: transactions
    });
  } catch (error) {
    logger.error(`获取最新交易列表错误: ${error.message}`);
    next(error);
  }
};

// 获取交易详情
exports.getTransactionDetail = async (req, res, next) => {
  try {
    const { txHash } = req.params;
    
    // 从数据库查询交易信息
    let transaction = await Transaction.findOne({ transactionHash: txHash });
    
    // 如果数据库没有，则从区块链查询
    if (!transaction) {
      const web3 = connectBlockchain();
      const txData = await web3.eth.getTransaction(txHash);
      
      if (!txData) {
        return res.status(404).json({
          success: false,
          message: '交易不存在'
        });
      }
      
      const txReceipt = await web3.eth.getTransactionReceipt(txHash);
      const block = await web3.eth.getBlock(txData.blockNumber);
      
      // 保存交易信息到数据库
      transaction = await Transaction.create({
        transactionHash: txData.hash,
        blockNumber: txData.blockNumber,
        blockHash: txData.blockHash,
        timestamp: new Date(block.timestamp * 1000),
        from: txData.from,
        to: txData.to,
        value: txData.value,
        gas: txData.gas,
        gasPrice: txData.gasPrice,
        input: txData.input,
        status: txReceipt.status ? 'success' : 'failed',
        transactionType: 'other' // 默认类型，可能需要通过input解析
      });
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error(`获取交易详情错误: ${error.message}`);
    next(error);
  }
};

// 获取节点列表
exports.getNodesList = async (req, res, next) => {
  try {
    const nodes = await Node.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: nodes.length,
      data: nodes
    });
  } catch (error) {
    logger.error(`获取节点列表错误: ${error.message}`);
    next(error);
  }
};

// 获取交易统计数据
exports.getTransactionStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // 按日期聚合交易数量
    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ]);
    
    // 按交易类型统计
    const typeStats = await Transaction.aggregate([
      {
        $group: {
          _id: "$transactionType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 格式化日期
    const formattedDailyStats = dailyStats.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      count: item.count
    }));
    
    // 格式化类型
    const formattedTypeStats = typeStats.map(item => ({
      type: item._id,
      count: item.count
    }));
    
    res.status(200).json({
      success: true,
      data: {
        dailyStats: formattedDailyStats,
        typeStats: formattedTypeStats
      }
    });
  } catch (error) {
    logger.error(`获取交易统计数据错误: ${error.message}`);
    next(error);
  }
};

// 搜索区块链数据（支持多种类型）
exports.search = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    // 判断查询类型（区块号、交易哈希、地址）
    let result = null;
    let type = null;
    
    // 如果是数字，可能是区块号
    if (/^\d+$/.test(query)) {
      result = await Block.findOne({ blockNumber: parseInt(query) });
      if (result) type = 'block';
    }
    
    // 如果未找到，且查询像哈希值（0x开头的十六进制字符串）
    if (!result && /^0x[a-fA-F0-9]{64}$/.test(query)) {
      // 尝试作为区块哈希查询
      result = await Block.findOne({ blockHash: query });
      if (result) {
        type = 'block';
      } else {
        // 尝试作为交易哈希查询
        result = await Transaction.findOne({ transactionHash: query });
        if (result) type = 'transaction';
      }
    }
    
    // 如果仍未找到，尝试作为普通地址查询相关交易
    if (!result && /^0x[a-fA-F0-9]{40}$/.test(query)) {
      const transactions = await Transaction.find({
        $or: [{ from: query }, { to: query }]
      }).sort({ timestamp: -1 }).limit(10);
      
      if (transactions.length > 0) {
        result = transactions;
        type = 'address';
      }
    }
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '未找到相关数据'
      });
    }
    
    res.status(200).json({
      success: true,
      type,
      data: result
    });
  } catch (error) {
    logger.error(`搜索区块链数据错误: ${error.message}`);
    next(error);
  }
}; 