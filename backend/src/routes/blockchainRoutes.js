const express = require('express');
const {
  getBlockchainOverview,
  getLatestBlocks,
  getBlockDetail,
  getLatestTransactions,
  getTransactionDetail,
  getNodesList,
  getTransactionStats,
  search
} = require('../controllers/blockchainController');

const router = express.Router();

// 获取区块链概览
router.get('/overview', getBlockchainOverview);

// 获取最新区块列表
router.get('/blocks', getLatestBlocks);

// 获取区块详情
router.get('/blocks/:blockNumber', getBlockDetail);

// 获取最新交易列表
router.get('/transactions', getLatestTransactions);

// 获取交易详情
router.get('/transactions/:txHash', getTransactionDetail);

// 获取节点列表
router.get('/nodes', getNodesList);

// 获取交易统计数据
router.get('/stats/transactions', getTransactionStats);

// 搜索区块链数据
router.get('/search', search);

module.exports = router; 