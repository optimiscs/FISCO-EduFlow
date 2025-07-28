# 学链通 - 基于FISCO区块链的学历全流程管理认证系统 (XueLianTong - Blockchain Education Platform)

## 项目概述

学链通是一个基于FISCO BCOS的教育认证和学历验证平台，采用"联盟主链 + 联盟侧链 + 状态通道"三层混合架构，集成了椭圆曲线签名（ECDSA）、SHA256哈希、Merkle Tree、可验证随机函数（VRF）共识以及零知识证明（ZKP）等核心技术，提供安全、透明、可信的学历认证服务。

### 核心特性
- **多链架构**：主链+侧链的分层架构设计，支持跨链数据同步
- **状态通道**：链下高频交互和实时通信，支持求职招聘全流程
- **隐私保护**：零知识证明和同态加密，保护用户隐私
- **智能合约**：自动化的认证流程和规则执行

## 技术架构

### 三层混合架构
- **联盟主链**: 信任根基与最终结算层，由最高信誉机构运行
- **联盟侧链**: 高性能业务处理层，处理日常认证业务
- **状态通道**: 点对点私密交互层，支持瞬时低延迟交互

### 技术栈
- **区块链平台**: FISCO BCOS 3.2.0
- **微服务**: Go 1.19+ (密码学服务)
- **智能合约**: Solidity ^0.8.0 + WebAssembly
- **消息队列**: RabbitMQ
- **容器化**: Docker + Docker Compose
- **前端**: HTML, CSS, TypeScript
- **数据库**: SQL Server

## 项目结构

```
区块链模块/
├── blockchain/                 # 区块链底层核心
│   ├── consensus/             # 自定义VRF共识模块
│   ├── contracts/             # 智能合约
│   └── fisco-config/          # FISCO BCOS配置
├── services/                  # 中间件服务层
│   ├── crypto/                # 密码学服务
│   ├── merkle/                # Merkle Tree服务
│   ├── zkp/                   # 零知识证明服务
│   └── api-gateway/           # API网关
├── state-channels/            # 状态通道实现
├── frontend/                  # 前端应用
├── backend/                   # Spring Boot后端
├── testing/                   # 测试框架
│   ├── hazel-engine/          # 自研测试引擎
│   └── webase-browser/        # 区块链浏览器
├── deployment/                # 部署配置
└── docs/                      # 文档
```

## 快速开始

### 环境要求
- Go 1.19+
- Node.js 16+
- Java 11+
- Docker & Docker Compose
- FISCO BCOS 2.9+

### 安装与运行
```bash
# 克隆项目
git clone https://github.com/optimiscs/FISCO-EduFlow.git

# 构建所有服务
make build

# 启动开发环境
docker-compose up -d

# 运行测试
make test
```

## 核心功能

### 密码学服务
- ECDSA数字签名
- SHA256哈希计算
- VRF可验证随机函数

### 数据完整性
- Merkle Tree构建与验证
- 批量数据处理
- 快速完整性校验

### 隐私保护
- 零知识证明生成与验证
- 选择性信息披露
- 链下隐私计算

### 共识机制
- 基于VRF的领导者选举
- 移动设备友好的轻量级参与
- 高吞吐量BFT确认

## 开发指南

详细的开发文档请参考 [docs/](./docs/) 目录。

## 许可证

本项目采用 MIT 许可证。
