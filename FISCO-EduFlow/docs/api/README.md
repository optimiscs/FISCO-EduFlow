# 学链通区块链教育认证平台 - API文档

## 📖 API概览

学链通平台提供RESTful API接口，支持学历认证、用户管理、区块链操作等核心功能。

### 🌐 基础信息

- **基础URL**: `http://localhost:8080/api`
- **API版本**: v1
- **认证方式**: JWT Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 📋 API分类

| 分类 | 前缀 | 描述 |
|------|------|------|
| 用户管理 | `/user` | 用户注册、登录、权限管理 |
| 认证流程 | `/certification` | 学历认证六步流程 |
| 区块链操作 | `/blockchain` | 智能合约调用、交易查询 |
| 密码学服务 | `/crypto` | 哈希计算、数字签名 |
| 系统监控 | `/actuator` | 健康检查、指标监控 |

## 🔐 认证机制

### JWT Token认证

所有需要认证的API都需要在请求头中携带JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取Token

```http
POST /api/user/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "student001",
      "role": "STUDENT",
      "permissions": ["READ_PROFILE", "SUBMIT_CERTIFICATION"]
    }
  }
}
```

## 👥 用户管理API

### 用户注册

```http
POST /api/user/register
Content-Type: application/json

{
  "username": "student001",
  "password": "password123",
  "email": "student@example.com",
  "phone": "13800138000",
  "realName": "张三",
  "idCard": "110101199001011234",
  "role": "STUDENT"
}
```

### 获取用户信息

```http
GET /api/user/profile
Authorization: Bearer <token>
```

### 更新用户信息

```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "phone": "13900139000",
  "avatar": "http://example.com/avatar.jpg"
}
```

## 🎓 认证流程API

### Step1: 达成共识

```http
POST /api/certification/consensus
Authorization: Bearer <token>
Content-Type: application/json

{
  "employerAddress": "0x8f7e6d5c4b3a2918e7d6c5b4a3928f7e6d5c4b3a",
  "requiredInfo": ["学历证明", "成绩单", "毕业证书"],
  "infoTypes": ["DEGREE", "TRANSCRIPT", "DIPLOMA"],
  "validityPeriod": 365,
  "fee": 100,
  "requiresVerification": true
}
```

### Step2: 确认意向

```http
POST /api/certification/{contractId}/intention
Authorization: Bearer <token>
```

### Step3: 确认数据并发送消息

```http
POST /api/certification/{contractId}/data-confirmation
Authorization: Bearer <token>
Content-Type: application/json

{
  "providedData": ["本科学历", "GPA 3.8", "计算机科学"],
  "messageContent": "已确认提供相关学历信息"
}
```

### Step4: 生成合约

```http
POST /api/certification/{contractId}/generate
Authorization: Bearer <token>
```

### Step5: 生成PDF并执行

```http
POST /api/certification/{contractId}/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "pdfHash": "pdf_hash_7f8e9d2c4b6a1e5f",
  "pdfUrl": "https://example.com/cert.pdf"
}
```

### Step6: 转发PDF完成执行

```http
POST /api/certification/{contractId}/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientAddress": "0x2a9b8c7d6e5f4a3b9c8d7e6f5a4b3c9d8e7f6a5b",
  "messageContent": "认证完成，PDF已转发"
}
```

### 查询认证合约

```http
GET /api/certification/{contractId}
Authorization: Bearer <token>
```

### 获取用户认证列表

```http
GET /api/certification/my-contracts
Authorization: Bearer <token>
```

## ⛓️ 区块链操作API

### 学籍信息上链

```http
POST /api/blockchain/student/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "stdName": "张三",
  "stdPhone": "13800138000",
  "stdId": "110101199001011234",
  "stdInfo": "北京大学计算机科学与技术专业本科"
}
```

### 审核学生信息

```http
POST /api/blockchain/student/{studentId}/audit
Authorization: Bearer <token>
Content-Type: application/json

{
  "approved": true,
  "auditComment": "信息核实无误，审核通过"
}
```

### 验证学生学历

```http
POST /api/blockchain/student/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "stdId": "110101199001011234",
  "stdName": "张三",
  "stdInfo": "北京大学计算机科学与技术专业本科"
}
```

### 获取学生信息

```http
GET /api/blockchain/student/{studentId}
Authorization: Bearer <token>
```

### 移动设备共识

```http
POST /api/blockchain/consensus/ordinary-node/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "teeId": "TEE_7f8e9d2c4b6a1e5f",
  "deviceInfo": "iPhone 15 Pro",
  "attestationData": "attestation_data_hex"
}
```

```http
POST /api/blockchain/consensus/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "roundNumber": 7429,
  "isApproval": true,
  "signature": "signature_data_7f8e9d2c4b6a1e5f"
}
```

### CA认证管理

```http
POST /api/blockchain/ca/node/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizationName": "北京大学",
  "certificateInfo": "教育机构CA证书",
  "publicKeyHash": "0x8f7e6d5c4b3a2918e7d6c5b4a3928f7e6d5c4b3a",
  "supportedServices": ["node_auth", "cert_issue", "verification"]
}
```

```http
POST /api/blockchain/ca/certificate/issue
Authorization: Bearer <token>
Content-Type: application/json

{
  "subjectAddress": "0x2a9b8c7d6e5f4a3b9c8d7e6f5a4b3c9d8e7f6a5b",
  "subjectName": "清华大学",
  "authType": "EDUCATION_INSTITUTION",
  "publicKeyHash": "0x4c7b9e2d8f6a1c5b8e3d7f2a6c9b4e8d7f3a6c2b",
  "certificateData": "教育机构数字证书",
  "permissions": ["ISSUE_DEGREE", "VERIFY_STUDENT"]
}
```

## 🔐 密码学服务API

### SHA256哈希计算

```http
POST /api/crypto/hash/sha256
Content-Type: application/json

{
  "data": "Hello, XueLianTong!"
}
```

### ECDSA数字签名

```http
POST /api/crypto/signature/sign
Content-Type: application/json

{
  "privateKey": "your-private-key-hex",
  "message": "message-to-sign"
}
```

### 验证数字签名

```http
POST /api/crypto/signature/verify
Content-Type: application/json

{
  "publicKey": "your-public-key-hex",
  "message": "original-message",
  "signature": "signature-hex"
}
```

### 生成密钥对

```http
POST /api/crypto/crypto/generate-keypair
```

### 区块头签名

```http
POST /api/crypto/signature/block-header-sign
Content-Type: application/json

{
  "privateKey": "your-private-key-hex",
  "blockHeader": {
    "prevHash": "0x8f7e6d5c4b3a2918e7d6c5b4a3928f7e6d5c4b3a",
    "merkleRoot": "0x2a9b8c7d6e5f4a3b9c8d7e6f5a4b3c9d8e7f6a5b",
    "timestamp": 1703123456,
    "difficulty": 1000,
    "nonce": 12345
  }
}
```

## 📊 系统监控API

### 健康检查

```http
GET /api/actuator/health
```

### 区块链健康检查

```http
GET /api/actuator/blockchain
```

### 系统指标

```http
GET /api/actuator/metrics
```

### 应用信息

```http
GET /api/actuator/info
```

## 📝 统一响应格式

所有API响应都遵循统一格式：

### 成功响应

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据
  },
  "timestamp": 1703123456789
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": "详细错误信息",
  "timestamp": 1703123456789
}
```

### 分页响应

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "content": [
      // 数据列表
    ],
    "page": 0,
    "size": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": 1703123456789
}
```

## 🚨 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |
| 1001 | 用户不存在 |
| 1002 | 密码错误 |
| 1003 | 账户已锁定 |
| 2001 | 认证合约不存在 |
| 2002 | 认证状态错误 |
| 3001 | 区块链网络错误 |
| 3002 | 智能合约调用失败 |
| 4001 | 签名验证失败 |
| 4002 | 哈希计算错误 |

## 📚 更多文档

- [用户管理API详细文档](./user-api.md)
- [认证流程API详细文档](./certification-api.md)
- [区块链API详细文档](./blockchain-api.md)
- [Postman集合下载](./postman/XueLianTong-API.postman_collection.json)

## 🔗 相关链接

- [Swagger UI](http://localhost:8080/api/swagger-ui.html)
- [API测试环境](http://test.xueliantong.com/api)
- [开发者文档](../development/getting-started.md)
