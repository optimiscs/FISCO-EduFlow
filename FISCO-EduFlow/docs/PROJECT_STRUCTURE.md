# 学链通区块链教育认证平台 - 项目结构详解

## 📁 总体项目结构

```
学链通区块链教育认证平台/
├── 📁 backend/                          # Java后端服务模块
├── 📁 blockchain/                       # 区块链相关模块
├── 📁 services/                         # Go微服务模块
├── 📁 docs/                            # 项目文档
├── 📁 scripts/                         # 部署和工具脚本
├── 📁 config/                          # 配置文件
├── 📁 logs/                            # 日志文件
├── 📄 pom.xml                          # Maven父项目配置
├── 📄 docker-compose.yml               # Docker编排文件
├── 📄 README.md                        # 项目说明文档
└── 📄 LICENSE                          # 开源许可证
```

## 🏗️ 后端服务模块 (backend/)

### 模块概览
```
backend/
├── 📄 pom.xml                          # 后端父模块POM配置
├── 📁 xuelian-main-app/                # 主应用模块 (Spring Boot)
├── 📁 xuelian-blockchain-integration/   # 区块链集成模块
├── 📁 xuelian-user-management/         # 用户管理模块
├── 📁 xuelian-certification-flow/      # 认证流程模块
└── 📁 xuelian-core/                    # 核心业务模块
```

### 🎯 xuelian-main-app/ - 主应用模块
**功能**: Spring Boot主应用，提供Web API和系统入口

```
xuelian-main-app/
├── 📄 pom.xml                          # 模块依赖配置
├── 📁 src/main/java/com/xueliantong/
│   ├── 📄 XueLianTongApplication.java  # Spring Boot启动类
│   ├── 📁 config/                      # 配置类
│   │   ├── 📄 WebConfig.java          # Web配置
│   │   ├── 📄 SecurityConfig.java     # 安全配置
│   │   └── 📄 SwaggerConfig.java      # API文档配置
│   ├── 📁 controller/                  # REST控制器
│   │   ├── 📄 UserController.java     # 用户管理API
│   │   ├── 📄 CertificationController.java # 认证流程API
│   │   └── 📄 BlockchainController.java # 区块链操作API
│   └── 📁 exception/                   # 异常处理
│       ├── 📄 GlobalExceptionHandler.java # 全局异常处理
│       └── 📄 BusinessException.java  # 业务异常定义
├── 📁 src/main/resources/
│   ├── 📄 application.yml             # 主配置文件
│   ├── 📄 application-dev.yml         # 开发环境配置
│   ├── 📄 application-prod.yml        # 生产环境配置
│   └── 📁 static/                     # 静态资源
└── 📁 src/test/                       # 测试代码
```

### 🔗 xuelian-blockchain-integration/ - 区块链集成模块
**功能**: 与FISCO BCOS区块链的集成，智能合约调用

```
xuelian-blockchain-integration/
├── 📄 pom.xml
├── 📁 src/main/java/com/xueliantong/blockchain/
│   ├── 📁 config/                      # 区块链配置
│   │   ├── 📄 FiscoBcosConfig.java    # FISCO BCOS配置
│   │   └── 📄 ContractConfig.java     # 智能合约配置
│   ├── 📁 service/                     # 区块链服务
│   │   ├── 📄 WASMContractService.java # WASM智能合约服务
│   │   ├── 📄 CertificationContractService.java # 认证合约服务
│   │   ├── 📄 MobileConsensusService.java # 移动共识服务
│   │   ├── 📄 CAAuthenticationService.java # CA认证服务
│   │   ├── 📄 StateChannelService.java # 状态通道服务
│   │   └── 📄 CrossChainService.java  # 跨链服务
│   ├── 📁 model/                       # 数据模型
│   │   ├── 📄 NodePermission.java     # 节点权限模型
│   │   ├── 📄 NodeType.java           # 节点类型枚举
│   │   └── 📄 TransactionResult.java  # 交易结果模型
│   ├── 📁 controller/                  # 区块链API控制器
│   │   └── 📄 BlockchainController.java
│   └── 📁 actuator/                    # 监控端点
│       └── 📄 BlockchainHealthIndicator.java # 区块链健康检查
└── 📁 src/main/resources/
    └── 📄 application-fisco.yml       # FISCO BCOS专用配置
```

### 👥 xuelian-user-management/ - 用户管理模块
**功能**: 用户注册、登录、权限管理

```
xuelian-user-management/
├── 📄 pom.xml
├── 📁 src/main/java/com/xueliantong/user/
│   ├── 📁 entity/                      # 用户实体
│   │   ├── 📄 User.java               # 用户实体
│   │   ├── 📄 Role.java               # 角色实体
│   │   └── 📄 Permission.java         # 权限实体
│   ├── 📁 repository/                  # 数据访问层
│   │   ├── 📄 UserRepository.java     # 用户数据访问
│   │   └── 📄 RoleRepository.java     # 角色数据访问
│   ├── 📁 service/                     # 业务服务层
│   │   ├── 📄 UserService.java        # 用户服务
│   │   ├── 📄 AuthService.java        # 认证服务
│   │   └── 📄 PermissionService.java  # 权限服务
│   ├── 📁 controller/                  # 控制器
│   │   └── 📄 UserController.java     # 用户管理API
│   └── 📁 dto/                         # 数据传输对象
│       ├── 📄 UserDTO.java            # 用户DTO
│       └── 📄 LoginRequest.java       # 登录请求DTO
└── 📁 src/test/                       # 测试代码
```

### 🎓 xuelian-certification-flow/ - 认证流程模块
**功能**: 学历认证流程管理，六步认证算法实现

```
xuelian-certification-flow/
├── 📄 pom.xml
├── 📁 src/main/java/com/xueliantong/certification/
│   ├── 📁 entity/                      # 认证实体
│   │   ├── 📄 CertificationRequest.java # 认证请求
│   │   ├── 📄 StudentProfile.java     # 学生档案
│   │   └── 📄 CertificationRecord.java # 认证记录
│   ├── 📁 service/                     # 认证服务
│   │   ├── 📄 CertificationFlowService.java # 认证流程服务
│   │   ├── 📄 StudentProfileService.java # 学生档案服务
│   │   └── 📄 VerificationService.java # 验证服务
│   ├── 📁 workflow/                    # 工作流引擎
│   │   ├── 📄 CertificationWorkflow.java # 认证工作流
│   │   └── 📄 WorkflowEngine.java     # 工作流引擎
│   └── 📁 controller/                  # 认证API控制器
│       └── 📄 CertificationController.java
└── 📁 src/test/
```

### 🏛️ xuelian-core/ - 核心业务模块
**功能**: 核心业务逻辑，通用工具类

```
xuelian-core/
├── 📄 pom.xml
├── 📁 src/main/java/com/xueliantong/core/
│   ├── 📁 common/                      # 通用组件
│   │   ├── 📄 Result.java             # 统一返回结果
│   │   ├── 📄 PageResult.java         # 分页结果
│   │   └── 📄 Constants.java          # 常量定义
│   ├── 📁 util/                        # 工具类
│   │   ├── 📄 CryptoUtil.java         # 密码学工具
│   │   ├── 📄 JsonUtil.java           # JSON工具
│   │   └── 📄 DateUtil.java           # 日期工具
│   ├── 📁 annotation/                  # 自定义注解
│   │   ├── 📄 RequirePermission.java  # 权限注解
│   │   └── 📄 AuditLog.java           # 审计日志注解
│   └── 📁 aspect/                      # 切面编程
│       ├── 📄 PermissionAspect.java   # 权限切面
│       └── 📄 AuditLogAspect.java     # 审计日志切面
└── 📁 src/test/
```

## ⛓️ 区块链模块 (blockchain/)

### 模块概览
```
blockchain/
├── 📁 contracts/                       # 智能合约
├── 📁 fisco-config/                   # FISCO BCOS配置
└── 📁 consensus/                      # 共识机制
```

### 📜 contracts/ - 智能合约
**功能**: Solidity智能合约，实现区块链业务逻辑

```
contracts/
├── 📁 contracts/                       # 合约源码
│   ├── 📄 WASMStudentRegistry.sol     # WASM学籍信息上链合约
│   ├── 📄 MerkleSyncContract.sol      # 数据同步验证合约
│   ├── 📄 CredentialCertificationContract.sol # 认证合约
│   ├── 📄 MobileConsensusContract.sol # 移动设备共识合约
│   ├── 📄 CAAuthenticationContract.sol # CA认证管理合约
│   ├── 📄 StudentProfileContract.sol  # 学生档案合约
│   ├── 📄 CertificationContract.sol   # 认证流程合约
│   ├── 📄 StateChannelFactory.sol     # 状态通道工厂合约
│   ├── 📄 StateChannelContract.sol    # 状态通道合约
│   ├── 📄 DigitalCurrencyChannel.sol  # 数字人民币通道合约
│   ├── 📄 CrossChainRouter.sol        # 跨链路由合约
│   └── 📄 BlockStructure.sol          # 区块结构合约
├── 📁 abi/                            # 合约ABI文件
├── 📁 bin/                            # 合约字节码文件
├── 📄 package.json                    # Node.js依赖
├── 📄 hardhat.config.js               # Hardhat配置
└── 📄 deploy.js                       # 部署脚本
```

### ⚙️ fisco-config/ - FISCO BCOS配置
**功能**: FISCO BCOS区块链节点配置

```
fisco-config/
├── 📄 application-fisco.yml           # FISCO BCOS配置文件
├── 📄 config.ini                      # 节点配置
├── 📄 group.1.genesis                 # 创世区块配置
├── 📄 group.1.ini                     # 群组配置
├── 📁 conf/                           # 配置文件目录
└── 📁 contracts/                      # 合约部署配置
```

## 🔧 Go微服务模块 (services/)

### 模块概览
```
services/
├── 📁 crypto/                          # 密码学服务
├── 📁 merkle/                         # Merkle Tree服务
├── 📁 zkp/                            # 零知识证明服务
└── 📁 api-gateway/                    # API网关服务
```

### 🔐 crypto/ - 密码学服务
**功能**: SHA256哈希、ECDSA签名、密钥管理

```
crypto/
├── 📄 go.mod                          # Go模块依赖
├── 📄 go.sum                          # 依赖校验和
├── 📄 config.yaml                     # 服务配置
├── 📄 Dockerfile                      # Docker构建文件
├── 📁 cmd/server/                     # 服务入口
│   └── 📄 main.go                     # 主程序
├── 📁 internal/                       # 内部包
│   ├── 📁 config/                     # 配置管理
│   │   └── 📄 config.go              # 配置结构和加载
│   ├── 📁 crypto/                     # 密码学实现
│   │   ├── 📄 hash.go                # SHA256哈希服务
│   │   ├── 📄 ecdsa.go               # ECDSA签名服务
│   │   ├── 📄 vrf.go                 # 可验证随机函数
│   │   └── 📄 ecdsa_test.go          # 签名测试
│   ├── 📁 service/                    # 业务服务
│   │   ├── 📄 crypto_service.go      # 密码学服务
│   │   ├── 📄 hash_service.go        # 哈希服务
│   │   └── 📄 signature_service.go   # 签名服务
│   └── 📁 handler/                    # HTTP处理器
│       ├── 📄 crypto_handler.go      # 密码学API处理器
│       ├── 📄 hash_handler.go        # 哈希API处理器
│       └── 📄 signature_handler.go   # 签名API处理器
└── 📁 api/                            # API定义
    └── 📄 crypto.proto                # gRPC协议定义
```

### 🌳 merkle/ - Merkle Tree服务
**功能**: Merkle Tree计算、数据完整性验证

```
merkle/
├── 📄 go.mod
├── 📄 config.yaml
├── 📄 Dockerfile
├── 📁 cmd/server/
│   └── 📄 main.go
├── 📁 internal/
│   ├── 📁 merkle/                     # Merkle Tree实现
│   │   ├── 📄 tree.go                # Merkle Tree结构
│   │   ├── 📄 proof.go               # Merkle证明
│   │   └── 📄 sync.go                # 数据同步
│   ├── 📁 service/
│   │   └── 📄 merkle_service.go      # Merkle Tree服务
│   └── 📁 handler/
│       └── 📄 merkle_handler.go      # Merkle Tree API处理器
└── 📁 test/                          # 测试文件
```

### 🔒 zkp/ - 零知识证明服务
**功能**: 零知识证明生成和验证

```
zkp/
├── 📄 go.mod
├── 📄 config.yaml
├── 📄 Dockerfile
├── 📁 cmd/server/
│   └── 📄 main.go
├── 📁 internal/
│   ├── 📁 zkp/                        # 零知识证明实现
│   │   ├── 📄 proof.go               # 证明生成
│   │   ├── 📄 verify.go              # 证明验证
│   │   └── 📄 circuit.go             # 电路定义
│   ├── 📁 service/
│   │   └── 📄 zkp_service.go         # ZKP服务
│   └── 📁 handler/
│       └── 📄 zkp_handler.go         # ZKP API处理器
└── 📁 circuits/                      # 电路文件
```

### 🚪 api-gateway/ - API网关服务
**功能**: 统一API入口、路由转发、负载均衡

```
api-gateway/
├── 📄 go.mod
├── 📄 config.yaml
├── 📄 Dockerfile
├── 📁 cmd/server/
│   └── 📄 main.go
├── 📁 internal/
│   ├── 📁 gateway/                    # 网关实现
│   │   ├── 📄 router.go              # 路由管理
│   │   ├── 📄 middleware.go          # 中间件
│   │   └── 📄 proxy.go               # 代理转发
│   ├── 📁 service/
│   │   └── 📄 gateway_service.go     # 网关服务
│   └── 📁 handler/
│       └── 📄 gateway_handler.go     # 网关处理器
└── 📁 config/                        # 路由配置
    └── 📄 routes.yaml                # 路由规则
```

## 📚 文档模块 (docs/)

```
docs/
├── 📄 PROJECT_STRUCTURE.md            # 项目结构文档 (本文件)
├── 📁 architecture/                   # 架构设计文档
│   ├── 📄 blockchain-architecture.md  # 区块链架构设计
│   ├── 📄 system-design.md           # 系统设计文档
│   └── 📄 security-design.md         # 安全设计文档
├── 📁 api/                            # API文档
│   ├── 📄 README.md                  # API文档说明
│   ├── 📄 user-api.md                # 用户管理API
│   ├── 📄 certification-api.md       # 认证流程API
│   └── 📄 blockchain-api.md          # 区块链API
├── 📁 deployment/                     # 部署文档
│   ├── 📄 docker-deployment.md       # Docker部署指南
│   ├── 📄 kubernetes-deployment.md   # Kubernetes部署指南
│   └── 📄 production-guide.md        # 生产环境指南
└── 📁 development/                    # 开发文档
    ├── 📄 getting-started.md          # 快速开始指南
    ├── 📄 coding-standards.md         # 编码规范
    └── 📄 testing-guide.md            # 测试指南
```

## 🛠️ 脚本和配置模块

### scripts/ - 部署和工具脚本
```
scripts/
├── 📄 deploy.sh                       # 一键部署脚本
├── 📄 build.sh                        # 构建脚本
├── 📄 test.sh                         # 测试脚本
├── 📁 sql/                            # 数据库脚本
│   ├── 📄 init.sql                   # 初始化脚本
│   └── 📄 migration.sql              # 数据迁移脚本
└── 📁 docker/                         # Docker相关脚本
    ├── 📄 build-images.sh             # 构建镜像脚本
    └── 📄 push-images.sh              # 推送镜像脚本
```

### config/ - 配置文件
```
config/
├── 📄 nginx.conf                      # Nginx配置
├── 📄 redis.conf                      # Redis配置
├── 📄 rabbitmq.conf                   # RabbitMQ配置
├── 📄 prometheus.yml                  # Prometheus配置
└── 📁 grafana/                        # Grafana配置
    ├── 📄 datasources.yml             # 数据源配置
    └── 📄 dashboards.yml              # 仪表板配置
```

## 🔍 关键文件功能说明

### 核心配置文件
- **pom.xml**: Maven项目配置，定义依赖和构建规则
- **application.yml**: Spring Boot主配置文件
- **docker-compose.yml**: Docker服务编排文件
- **config.yaml**: Go服务配置文件

### 核心业务文件
- **XueLianTongApplication.java**: Spring Boot应用启动入口
- **WASMStudentRegistry.sol**: 学籍信息上链智能合约
- **CertificationContractService.java**: 六步认证流程服务
- **main.go**: Go微服务启动入口

### 核心工具文件
- **deploy.sh**: 一键部署脚本
- **hash.go**: SHA256哈希算法实现
- **ecdsa.go**: ECDSA数字签名实现
- **BlockchainHealthIndicator.java**: 区块链健康检查

这个项目结构设计遵循了微服务架构原则，实现了前后端分离、服务解耦、配置外化等最佳实践，为学链通区块链教育认证平台提供了坚实的技术基础。
