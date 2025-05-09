# 学链通区块链浏览器后端

## 项目介绍

学链通区块链浏览器后端是基于Node.js和MongoDB开发的RESTful API服务，主要负责处理前端请求、与FISCO BCOS区块链网络交互、管理数据存储等功能。

## 技术栈

- **Node.js**: JavaScript运行环境
- **Express.js**: Web应用框架
- **MongoDB**: 数据库
- **Mongoose**: MongoDB对象模型工具
- **Web3.js**: 与FISCO BCOS区块链交互
- **JWT**: 用户认证
- **Winston**: 日志管理

## 功能模块

1. **用户管理**：注册、登录、身份验证、权限控制
2. **区块链浏览**：查看区块、交易、节点等区块链数据
3. **证书管理**：创建、发布、撤销和查询证书
4. **验证服务**：验证证书真实性，记录验证历史

## 目录结构

```
backend/
├── src/                    # 源代码
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── services/           # 服务
│   ├── utils/              # 工具函数
│   ├── app.js              # 应用程序
│   └── server.js           # 服务器入口
├── logs/                   # 日志文件
├── public/                 # 静态文件
├── .env                    # 环境变量
├── .env.example            # 环境变量示例
├── package.json            # 项目依赖
└── README.md               # 项目文档
```

## API接口

### 用户认证

- `POST /api/auth/register`: 用户注册
- `POST /api/auth/login`: 用户登录
- `GET /api/auth/me`: 获取当前用户信息
- `GET /api/auth/logout`: 退出登录
- `PUT /api/auth/updatepassword`: 更新密码

### 区块链浏览

- `GET /api/blockchain/overview`: 获取区块链概览
- `GET /api/blockchain/blocks`: 获取最新区块列表
- `GET /api/blockchain/blocks/:blockNumber`: 获取区块详情
- `GET /api/blockchain/transactions`: 获取最新交易列表
- `GET /api/blockchain/transactions/:txHash`: 获取交易详情
- `GET /api/blockchain/nodes`: 获取节点列表
- `GET /api/blockchain/stats/transactions`: 获取交易统计数据
- `GET /api/blockchain/search`: 搜索区块链数据

### 证书管理

- `POST /api/certificates`: 创建证书（学校角色）
- `PUT /api/certificates/:certificateId/issue`: 发布证书（学校角色）
- `PUT /api/certificates/:certificateId/revoke`: 撤销证书（学校角色）
- `GET /api/certificates`: 获取证书列表
- `GET /api/certificates/:certificateId`: 获取证书详情

### 验证服务

- `POST /api/verify/certificate-number`: 通过证书编号验证
- `POST /api/verify/personal-info`: 通过个人信息验证
- `POST /api/verify/qr-code`: 通过QR码验证
- `GET /api/verify/history`: 获取验证历史记录

## 安装部署

1. 克隆仓库
```bash
git clone <仓库地址>
cd backend
```

2. 安装依赖
```bash
npm install
```

3. 创建并配置.env文件
```bash
cp .env.example .env
# 编辑.env文件，配置必要的环境变量
```

4. 启动MongoDB数据库
```bash
# 确保MongoDB服务已启动
```

5. 启动FISCO BCOS节点
```bash
# 确保FISCO BCOS节点已启动
```

6. 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## 开发指南

- 遵循RESTful API设计规范
- 使用中间件处理认证和权限控制
- 统一错误处理和响应格式
- 记录详细的操作日志 