# 学链通区块链浏览器后端开发指南

## 开发环境搭建

1. **安装Node.js**
   - 推荐使用Node.js 14.x或更高版本
   - 可通过[官网](https://nodejs.org/)或NVM安装

2. **安装MongoDB**
   - 推荐使用MongoDB 4.4或更高版本
   - 可通过[官网](https://www.mongodb.com/try/download/community)安装

3. **安装FISCO BCOS**
   - 参考[FISCO BCOS官方文档](https://fisco-bcos-documentation.readthedocs.io/)搭建区块链节点

4. **克隆仓库并安装依赖**
   ```bash
   git clone <仓库地址>
   cd backend
   npm install
   ```

5. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑.env文件，配置必要的环境变量
   ```

6. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 代码规范

### 命名规范

- **文件名**：使用小写字母和下划线命名，如`user_controller.js`
- **类名**：使用大驼峰命名，如`UserController`
- **变量和函数**：使用小驼峰命名，如`getUserById`
- **常量**：使用大写字母和下划线，如`MAX_RETRY_COUNT`
- **MongoDB模型**：使用单数形式大驼峰，如`User`而非`Users`

### 代码格式

- 缩进使用2个空格
- 语句末尾使用分号
- 使用单引号而非双引号
- 对象和数组最后一项后不加逗号
- 控制流语句使用花括号，即使只有一行

### RESTful API设计规范

- 使用名词复数形式表示资源，如`/users`而非`/user`
- 使用HTTP方法表示操作：
  - GET：获取资源
  - POST：创建资源
  - PUT/PATCH：更新资源
  - DELETE：删除资源
- 资源路径层次清晰，如`/users/:userId/certificates`
- 使用查询参数进行过滤、排序和分页
- 返回适当的HTTP状态码和统一的响应格式

### 错误处理

- 使用中间件统一处理错误
- 返回清晰的错误信息和适当的HTTP状态码
- 记录详细的错误日志，包括堆栈信息
- 区分业务逻辑错误和系统错误

## 开发流程

### 分支管理

- `main`分支：生产环境代码
- `develop`分支：开发环境代码
- 功能分支：以`feature/`开头，如`feature/user-authentication`
- 修复分支：以`bugfix/`开头，如`bugfix/login-issue`

### 提交代码

1. 创建功能分支
   ```bash
   git checkout -b feature/your-feature develop
   ```

2. 编写代码和测试

3. 提交代码
   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```
   > 提交信息遵循[约定式提交](https://www.conventionalcommits.org/)规范

4. 推送到远程仓库
   ```bash
   git push origin feature/your-feature
   ```

5. 创建拉取请求（Pull Request）到`develop`分支

### 代码审查

- 每个PR至少需要一个人审查
- 关注代码质量、安全性和业务逻辑正确性
- 确保测试覆盖率达到要求
- 确保文档及时更新

## 测试指南

### 单元测试

- 使用`jest`进行单元测试
- 控制器、服务和工具函数必须有单元测试
- 测试文件与源文件放在同一目录，命名为`*.test.js`

### API测试

- 使用`supertest`进行API集成测试
- 测试文件放在`tests/api`目录下
- 测试每个API的成功和失败情况

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单个测试文件
npm test -- src/controllers/user_controller.test.js

# 生成测试覆盖率报告
npm run test:coverage
```

## 部署指南

### 测试环境

1. 拉取`develop`分支代码
2. 构建Docker镜像
   ```bash
   docker build -t fiscoeduflow-backend:test .
   ```
3. 启动容器
   ```bash
   docker run -d -p 3000:3000 --env-file .env.test fiscoeduflow-backend:test
   ```

### 生产环境

1. 拉取`main`分支代码
2. 构建Docker镜像
   ```bash
   docker build -t fiscoeduflow-backend:prod .
   ```
3. 启动容器
   ```bash
   docker run -d -p 3000:3000 --env-file .env.prod fiscoeduflow-backend:prod
   ```

## 文档

### API文档

- 使用Swagger记录API文档
- 访问`/api-docs`查看API文档
- 每次更新API时同步更新文档

### 架构文档

- 系统架构图放在`docs/architecture`目录下
- 数据模型图放在`docs/models`目录下
- 流程图放在`docs/flowcharts`目录下

## 常见问题

### Q: 如何调试区块链交互？
A: 使用`DEBUG=web3*`环境变量启动应用，可以看到更详细的Web3日志

### Q: 开发时如何模拟区块链？
A: 可以使用FISCO BCOS的模拟节点或修改`src/config/blockchain.js`中的逻辑

### Q: 如何处理并发请求？
A: 使用连接池、缓存和队列机制，避免数据库和区块链节点过载

## 联系与支持

- 项目负责人：[负责人姓名](mailto:leader@example.com)
- 技术支持：[技术支持](mailto:support@example.com)
- 问题反馈：通过GitHub Issues提交 