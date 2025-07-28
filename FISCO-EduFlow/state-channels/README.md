# 状态通道服务 (State Channels Service)

状态通道服务是区块链教育平台的核心组件之一，提供了学生和用人单位之间的点对点通信和状态同步功能。

## 功能特性

### 核心功能
- **通道管理**: 创建、接受、更新和关闭状态通道
- **实时通信**: 基于WebSocket的实时消息传递
- **状态同步**: 参与者之间的状态一致性保证
- **安全验证**: 数字签名和权限验证
- **业务流程**: 求职招聘工作流支持

### 业务场景
- 求职申请提交和处理
- 面试邀请和安排
- 录用通知和合同签署
- 简历和证书验证
- 零知识证明集成

## 架构设计

```
┌─────────────────┐    ┌─────────────────┐
│     Student     │    │    Employer     │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   State Channel       │
         │                       │
         │  ┌─────────────────┐  │
         │  │   WebSocket     │  │
         │  │   Connection    │  │
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │   Message       │  │
         │  │   Processing    │  │
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │   State         │  │
         │  │   Management    │  │
         │  └─────────────────┘  │
         └───────────────────────┘
```

## 快速开始

### 1. 启动服务

```bash
# 构建服务
go build -o state-channels ./cmd/main.go

# 运行服务
./state-channels
```

### 2. 环境变量配置

```bash
export PORT=8080
export MAX_CHANNELS=1000
export DEFAULT_EXPIRY_HOURS=24
export CLEANUP_INTERVAL_MINUTES=60
```

### 3. Docker 部署

```bash
# 构建镜像
docker build -t state-channels .

# 运行容器
docker run -p 8080:8080 state-channels
```

## API 接口

### 通道管理

#### 创建通道
```http
POST /api/v1/channels
Content-Type: application/json

{
  "participant_a": {
    "address": "0x1234...",
    "public_key": "...",
    "role": "student",
    "name": "Alice"
  },
  "participant_b": {
    "address": "0x5678...",
    "public_key": "...",
    "role": "employer",
    "name": "TechCorp"
  },
  "initial_data": {
    "job_type": "internship",
    "position": "Software Developer"
  },
  "expiry_hours": 48
}
```

#### 接受通道
```http
POST /api/v1/channels/accept
Content-Type: application/json

{
  "channel_id": "channel_123",
  "signature": {
    "address": "0x5678...",
    "signature": "0xabcd..."
  }
}
```

#### 更新状态
```http
POST /api/v1/channels/update
Content-Type: application/json

{
  "channel_id": "channel_123",
  "data": {
    "application_status": "under_review",
    "reviewer": "0x5678..."
  },
  "signature": {
    "address": "0x5678...",
    "signature": "0xabcd..."
  }
}
```

### 消息传递

#### 发送消息
```http
POST /api/v1/messages
Content-Type: application/json

{
  "channel_id": "channel_123",
  "type": "job_application",
  "from": "0x1234...",
  "to": "0x5678...",
  "data": {
    "application": "{...job application data...}"
  },
  "signature": {
    "address": "0x1234...",
    "signature": "0xabcd..."
  }
}
```

### WebSocket 连接

```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:8080/ws?user_id=0x1234...');

// 订阅通道
ws.send(JSON.stringify({
  type: 'subscribe',
  data: 'channel_123'
}));

// 接收消息
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## 业务流程示例

### 求职申请流程

1. **创建通道**: 学生和用人单位建立状态通道
2. **提交申请**: 学生发送求职申请消息
3. **审核处理**: 用人单位更新申请状态
4. **面试邀请**: 用人单位发送面试邀请
5. **录用通知**: 用人单位发送录用通知
6. **合同签署**: 双方签署就业合同
7. **关闭通道**: 完成流程后关闭通道

### 消息类型

- `job_application`: 求职申请
- `interview_invite`: 面试邀请
- `offer_letter`: 录用通知
- `contract_sign`: 合同签署
- `resume_request`: 简历请求
- `state_update`: 状态更新

## 安全特性

### 数字签名验证
- 所有消息和状态更新都需要数字签名
- 使用ECDSA算法进行签名验证
- 防止消息篡改和身份伪造

### 权限控制
- 只有通道参与者可以发送消息
- 基于角色的操作权限控制
- 防止未授权访问

### 数据完整性
- 消息哈希验证
- 状态一致性检查
- 防重放攻击

## 监控和统计

### 健康检查
```http
GET /health
```

### 统计信息
```http
GET /api/v1/stats
```

返回示例：
```json
{
  "total_channels": 150,
  "active_channels": 45,
  "closed_channels": 105,
  "channels_by_state": {
    "open": 45,
    "closed": 105
  },
  "messages_by_type": {
    "job_application": 80,
    "interview_invite": 35,
    "offer_letter": 20
  },
  "participant_stats": {
    "student": 150,
    "employer": 150
  }
}
```

## 开发和测试

### 运行测试
```bash
go test ./test/...
```

### 集成测试
```bash
go test -tags=integration ./test/...
```

### 性能测试
```bash
go test -bench=. ./test/...
```

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| PORT | 8080 | 服务端口 |
| MAX_CHANNELS | 1000 | 最大通道数 |
| DEFAULT_EXPIRY_HOURS | 24 | 默认过期时间(小时) |
| MAX_MESSAGE_SIZE | 1024 | 最大消息大小(字节) |
| CLEANUP_INTERVAL_MINUTES | 60 | 清理间隔(分钟) |

## 故障排除

### 常见问题

1. **通道创建失败**
   - 检查参与者信息是否正确
   - 验证数字签名是否有效
   - 确认未超过最大通道数限制

2. **消息发送失败**
   - 确认通道状态为开放
   - 检查发送者是否为通道参与者
   - 验证消息格式是否正确

3. **WebSocket连接断开**
   - 检查网络连接
   - 确认用户ID参数
   - 查看服务器日志

### 日志级别
- ERROR: 错误信息
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 调试信息

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
