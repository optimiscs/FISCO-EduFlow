# 学链通 test_tools 系统测试与工具模块说明

本目录包含“学链通”项目的系统测试与工具相关代码，主要包括：

## 1. Hazel Engine（C++ 性能测试与可视化引擎）

- **功能简介**：
  - 监听指定进程（如区块链节点、智能合约等），采集性能数据（CPU、内存、交易数等）。
  - 实时可视化采集数据到 ImGui 检查器窗口，支持历史数据、统计图表、明细表格。
  - 一键导出 profile.json，便于在 Chromium 浏览器等工具中分析性能。
- **技术栈**：C++17、Dear ImGui、Windows API、DirectX 11、nlohmann/json。
- **主要文件结构**：
  - `main.cpp`：主程序入口，包含窗口/渲染/主循环。
  - `DataCollector.h` & `DataCollector.cpp`：进程性能数据采集。
  - `ImGuiInspector.h` & `ImGuiInspector.cpp`：ImGui 检查器可视化、历史、统计、导出。
  - `ProfileExporter.h` & `ProfileExporter.cpp`：profile.json 导出。
- **编译与运行**：
  1. 安装依赖（ImGui、nlohmann/json）。
  2. 使用 MSVC 或 CMake 构建。
  3. 运行 main.exe，按界面操作即可。
- **适用场景**：
  - 区块链底层、智能合约等高性能场景的性能测试与数据采集。

## 2. WeBase 区块链浏览器（Node.js + Vue）

- **功能简介**：
  - 管理员登录，权限校验。
  - 仪表盘展示区块链核心指标（节点数、区块数、交易数、合约数等）。
  - 区块追溯，支持历史区块列表、区块详情、搜索、分页。
  - 证书与请求管理，支持链上合约数据查询、详情、导出、分页。
  - 系统监控，展示节点/主机状态、异常历史、支持异常告警邮件。
- **技术栈**：
  - 后端：Node.js、Express、Web3、Nodemailer。
  - 前端：Vue3、ElementPlus、Axios、ECharts。
- **主要文件结构**：
  - `backend/app.js`：Node.js 后端主入口，提供 RESTful API、登录、监控、告警、链上合约数据查询等。
  - `frontend/src/views/Login.vue`：管理员登录页面。
  - `frontend/src/views/Dashboard.vue`：仪表盘页面。
  - `frontend/src/views/BlockTrace.vue`：区块追溯页面。
  - `frontend/src/views/Certificate.vue`：证书与请求管理页面（链上合约数据）。
  - `frontend/src/views/Monitor.vue`：系统监控页面。
  - `frontend/src/router/index.js`：前端路由配置。
- **启动方法**：
  - 后端：`cd backend && npm install && npm start`（默认端口 3000）。
  - 前端：`cd frontend && npm install && npm run serve`（默认端口 8080）。
  - 浏览器访问前端页面，体验区块链浏览与监控功能。
- **适用场景**：
  - 区块链网络的可视化监控、数据追溯、证书与请求管理、异常告警。

---

> 详细功能均已按系统需求文档实现，具体请查阅对应目录下的代码与注释。

## 系统需求与功能对照

### 自研测试引擎 (Hazel Engine)

- **定位：** 开发可视化数据采集引擎。（`main.cpp`）
- 语言：C++
- **功能：**
  - 必须监听指定进程接口并采集数据。（`DataCollector.h` & `DataCollector.cpp`）
  - 必须将采集数据可视化到 ImGui 的检查器 (Inspector)。（`ImGuiInspector.h` & `ImGuiInspector.cpp`）
  - 必须将测试结果输出为可在 Chromium 浏览器中打开的 `profile.json` 文件。（`ProfileExporter.h` & `ProfileExporter.cpp`）
  - **应用：** 必须使用此引擎对区块链底层进行性能测试：
  - 智能合约并行执行效率测试。（`main.cpp` + `DataCollector.*`）
  - 状态通道交易成功率测试。（`main.cpp` + `DataCollector.*`）
  - 共识率测试（通过引入恶意节点并检测）。（`main.cpp` + `DataCollector.*`）

### 区块链浏览器

- **基础：** 必须基于 WeBase 开发。（`test_tools/webase_browser/`）
- **功能：**
  - **登录：** 提供管理员账号密码登录界面。（`frontend/src/views/Login.vue` & `backend/app.js`）
  - **数据概览：** 仪表盘展示核心指标（节点个数、区块数量、交易数量、合约数量），以列表展示最新节点、区块、交易信息。（`frontend/src/views/Dashboard.vue` & `backend/app.js`）
  - **区块追溯：** 支持查看历史区块列表，可查看单个区块的交易哈希、交易编号、时间戳、节点地址等详细信息。（`frontend/src/views/BlockTrace.vue` & `backend/app.js`）
  - **证书与交易管理：** 提供管理证书和监控状态通道交易的界面。（`frontend/src/views/Certificate.vue` & `backend/app.js`）
  - **系统监控：** 必须包含独立模块监控节点、主机状态，异常时通过邮件发送告警。（`frontend/src/views/Monitor.vue` & `backend/app.js`）
