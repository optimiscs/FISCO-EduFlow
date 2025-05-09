# 学链通区块链浏览器

## 项目简介

学链通是一个基于区块链技术的教育信息管理系统，旨在提供学历信息上链、证书验证、企业验证等功能。区块链浏览器是系统的重要组成部分，用于查看和监控区块链网络的实时数据。

## 主要功能

- **区块链概览**：显示区块高度、交易速度、节点数量和总交易数等关键指标
- **区块查询**：查看最新区块信息，包括区块高度、生成时间、交易数和区块哈希
- **交易查询**：查看最新交易信息，支持按类型筛选（学历上链、证书验证等）
- **数据统计**：直观展示交易数量趋势和节点类型分布
- **节点监控**：实时监控各节点状态、资源使用率和同步情况
- **学历验证**：支持证书编号、个人信息、扫码三种验证方式
- **证书管理**：学校可创建、发布、撤销证书，学生可查看自己的证书

## 系统架构

学链通系统包含以下模块：
- **前端**：HTML5, CSS3, JavaScript实现的用户界面
- **后端**：基于Node.js和Express的API服务
- **数据库**：MongoDB存储用户、证书、验证记录等信息
- **区块链**：FISCO BCOS区块链网络，存储证书哈希和验证信息
- **智能合约**：实现证书发布、验证、撤销等业务逻辑

## 技术栈

### 前端
- HTML5, CSS3, JavaScript
- 响应式设计：适配桌面和移动设备

### 后端
- Node.js, Express.js
- MongoDB (Mongoose)
- JWT认证
- Web3.js (与FISCO BCOS交互)

### 区块链
- FISCO BCOS
- 智能合约 (Solidity)

## 项目结构
```
/
├── assets/               # 静态资源文件
│   ├── css/              # 样式文件
│   ├── images/           # 图片资源
│   ├── js/               # JavaScript文件
│   └── fonts/            # 字体文件
├── pages/                # 页面文件
│   ├── blockchain_explorer.html
│   ├── enterprise_verification.html
│   ├── certificate_verification.html
│   ├── school_management.html
│   ├── student_dashboard.html
│   └── regulatory_management.html
├── backend/              # 后端代码
│   ├── src/              # 源代码
│   ├── package.json      # 项目依赖
│   └── README.md         # 后端文档
├── contracts/            # 智能合约代码
├── index.html            # 首页
├── login.html            # 登录页
└── README.md             # 项目文档
```

## 安装部署

### 前端部署

1. 克隆项目到本地
```bash
git clone https://github.com/your-username/xuchain.git
cd xuchain
```

2. 使用Web服务器（如Nginx, Apache）部署前端文件

### 后端部署

1. 安装依赖
```bash
cd backend
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，配置必要的环境变量
```

3. 启动MongoDB数据库
```bash
# 确保MongoDB服务已启动
```

4. 启动FISCO BCOS节点
```bash
# 确保FISCO BCOS节点已启动
```

5. 启动后端服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## API接口

### 用户认证
- `POST /api/auth/register`: 用户注册
- `POST /api/auth/login`: 用户登录
- `GET /api/auth/me`: 获取当前用户信息

### 区块链浏览
- `GET /api/blockchain/overview`: 获取区块链概览
- `GET /api/blockchain/blocks`: 获取最新区块列表
- `GET /api/blockchain/transactions`: 获取最新交易列表

### 证书管理
- `POST /api/certificates`: 创建证书
- `GET /api/certificates`: 获取证书列表

### 验证服务
- `POST /api/verify/certificate-number`: 通过证书编号验证
- `POST /api/verify/personal-info`: 通过个人信息验证
- `GET /api/verify/history`: 获取验证历史记录

## 联系方式

如有问题或建议，请联系：support@xuchain.edu.cn

根据你提供的所有页面和README内容，当前"学链通"系统已实现的主要功能总结如下：

---

## 1. 首页（index.html）
- 展示系统品牌、产品特点、技术优势、应用场景、合作伙伴等信息。
- 支持导航到各大功能模块（如登录、联系我们等）。
- 响应式设计，适配PC和移动端。

## 2. 登录与注册（login.html）
- 支持多角色登录（学生、高校、企业、政府部门）。
- 不同角色注册表单自适应显示（如学生需填写验证码）。
- 登录后根据角色跳转到对应的功能页面。
- 表单校验与错误提示，带有加载动画。

## 3. 企业验证平台（enterprise_verification.html）
- 企业用户可通过三种方式验证学历信息：
  - 证书编号验证
  - 个人信息验证
  - 扫码验证
- 支持填写验证用途、备注说明。
- 验证结果展示（成功/失败），并显示详细学历信息及区块链存证信息。
- 验证历史记录列表，支持搜索、筛选、分页、导出。
- 批量验证入口。

## 4. 区块链浏览器（blockchain_explorer.html）
- 区块链网络概览（区块高度、TPS、节点数、总交易数）。
- 支持区块、交易、账户、合约等多类型搜索。
- 展示最新区块和最新交易列表。
- 区块链数据统计（趋势图、节点分布饼图）。
- 节点状态监控（CPU/内存/区块高度/状态），支持刷新。
- 数据导出、报告生成功能（提示即将上线）。

## 5. 证书验证（certificate_verification.html）
- 证书验证页面（目前主要为样式和结构，功能待完善）。
- 预留多种验证方式（如扫码、手动输入等）。
- 结果展示、历史记录等区域已布局。

## 6. 监管系统（regulatory_management.html，未提供内容）
- 文件存在，具体功能未展示，预计为政府监管部门使用的管理后台。

## 7. 学校管理（school_management.html，未提供内容）
- 文件存在，具体功能未展示，预计为高校端的学籍管理、证书签发等功能。

## 8. 学生中心（student_dashboard.html，未提供内容）
- 文件存在，具体功能未展示，预计为学生个人学历信息管理、证书查看与分享等功能。

## 9. 其他
- README.md 详细介绍了系统定位、主要功能、技术栈、部署方式、系统架构和联系方式。

---

### 总结
目前"学链通"系统已实现了：
- 多角色登录注册与身份切换
- 企业端学历验证全流程（多方式验证、结果展示、历史追溯）
- 区块链浏览器（区块、交易、节点、统计、导出等）
- 完善的前端页面结构和交互体验
- 首页品牌宣传与系统介绍

部分功能如监管系统、高校管理、学生中心等页面已预留，待后续完善具体业务逻辑和数据对接。

如需详细某一模块的功能说明，可进一步指定页面。
