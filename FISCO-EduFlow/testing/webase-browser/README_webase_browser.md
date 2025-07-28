# WeBase 区块链浏览器

## 功能简介

区块链浏览器是基于 Vue3 + Node.js 的区块链可视化监控与管理平台，具备如下功能：

- 管理员登录，权限校验
- 仪表盘展示区块链核心指标（节点数、区块数、交易数、合约数等）
- 区块追溯，支持历史区块列表、区块详情、搜索、分页
- 证书与交易管理，支持搜索、详情、导出、分页
- 系统监控，展示节点/主机状态、异常历史、支持异常告警邮件

## 技术栈

- 后端：Node.js、Express、Web3、Nodemailer
- 前端：Vue3、ElementPlus、Axios、ECharts

## 主要文件结构

- `backend/app.js`：Node.js 后端主入口，提供 RESTful API、登录、监控、告警等
- `frontend/src/views/Login.vue`：管理员登录页面
- `frontend/src/views/Dashboard.vue`：仪表盘页面
- `frontend/src/views/BlockTrace.vue`：区块追溯页面
- `frontend/src/views/Certificate.vue`：证书与交易管理页面
- `frontend/src/views/Monitor.vue`：系统监控页面
- `frontend/src/router/index.js`：前端路由配置

## 启动方法

### 后端

1. 进入 backend 目录：`cd backend`
2. 安装依赖：`npm install`
3. 启动服务：`npm start`
4. 默认监听端口 3000

### 前端

1. 进入 frontend 目录：`cd frontend`
2. 安装依赖：`npm install`
3. 启动开发服务：`npm run serve`
4. 默认访问 http://localhost:8080

## 典型用法

- 管理员登录后，查看区块链网络核心指标、最新区块、节点、交易等
- 追溯历史区块、查看区块详情、搜索区块
- 管理证书与状态通道交易，支持导出
- 监控节点/主机状态，异常时一键发送告警邮件

## 适用场景

- 区块链网络的可视化监控、数据追溯、证书与交易管理、异常告警

## 注意事项

- WeBase 浏览器可独立于主业务系统运行，只需区块链节点已部署并开放接口
- 如需对接真实区块链网络，请配置好 web3 连接参数
- 如遇依赖或运行问题，请查阅本 README 或联系开发者
