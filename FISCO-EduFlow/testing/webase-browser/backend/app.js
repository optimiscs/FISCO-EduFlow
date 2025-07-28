// app.js - WeBase 区块链浏览器后端主入口
// 功能：提供区块链核心数据API、区块追溯、证书管理、系统监控与异常告警等服务。
//
// 主要职责：
// 1. 提供仪表盘、区块、证书、监控等 RESTful API
// 2. 处理异常告警邮件发送
//
// 技术栈：Node.js, Express, Web3, Nodemailer
//
// --------------------
// WeBase 浏览器后端主入口
// 依赖 express, nodemailer, web3
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const Web3 = require('web3');
const app = express();
app.use(bodyParser.json());

// 证书合约配置
const CERT_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "getAllCertificates",
    "outputs": [
      {
        "components": [
          { "name": "certId", "type": "string" },
          { "name": "status", "type": "string" },
          { "name": "txHash", "type": "string" }
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];
const CERT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'; 
const certContract = new Web3.eth.Contract(CERT_ABI, CERT_ADDRESS);

// 1. 获取核心指标仪表盘数据（真实链数据）
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const blockCount = await web3.eth.getBlockNumber();
        // 获取最新5个区块
        const latestBlocks = [];
        for (let i = blockCount; i > blockCount - 5 && i >= 0; i--) {
            const block = await web3.eth.getBlock(i);
            latestBlocks.push({
                blockNumber: block.number,
                txHash: block.transactions[0] || '',
                timestamp: block.timestamp,
                node: '本节点'
            });
        }
        // 获取最新5个交易（遍历区块）
        const latestTxs = [];
        for (const block of latestBlocks) {
            if (block.txHash) {
                const tx = await web3.eth.getTransaction(block.txHash);
                if (tx) {
                    latestTxs.push({
                        txHash: tx.hash,
                        blockNumber: tx.blockNumber,
                        from: tx.from,
                        to: tx.to,
                        value: web3.utils.fromWei(tx.value, 'ether')
                    });
                }
            }
        }
        res.json({
            nodeCount: 1,
            blockCount,
            txCount: latestTxs.length,
            contractCount: 0,
            latestBlocks,
            latestTxs
        });
    } catch (e) {
        res.status(500).json({ success: false, message: '区块链节点连接失败', error: e.message });
    }
});
// 2. 区块追溯接口（真实链数据）
app.get('/api/blocks', requireAuth, async (req, res) => {
    try {
        const blockCount = await web3.eth.getBlockNumber();
        const blocks = [];
        for (let i = blockCount; i > blockCount - 10 && i >= 0; i--) {
            const block = await web3.eth.getBlock(i);
            blocks.push({
                blockNumber: block.number,
                txHash: block.transactions[0] || '',
                timestamp: block.timestamp,
                node: '本节点'
            });
        }
        res.json(blocks);
    } catch (e) {
        res.status(500).json({ success: false, message: '区块链节点连接失败', error: e.message });
    }
});
// 3. 证书与交易管理接口（链上真实数据）
app.get('/api/certificates', async (req, res) => {
    try {
        const certs = await certContract.methods.getAllCertificates().call();
        res.json(certs);
    } catch (e) {
        res.status(500).json({ success: false, message: '链上证书查询失败', error: e.message });
    }
});
// 4. 系统监控与告警
app.get('/api/monitor', async (req, res) => {
    // TODO: 查询节点、主机状态
    res.json({ nodes: [{ id: 1, status: 'ok' }, { id: 2, status: 'error' }] });
});
// 5. 异常告警邮件发送
app.post('/api/alert', async (req, res) => {
    // TODO: 发送邮件
    res.json({ success: true });
});
// 登录接口
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // 账号 admin，密码 admin123
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: '账号或密码错误' });
    }
});

app.listen(3000, () => {
    console.log('WeBase backend running on port 3000');
}); 