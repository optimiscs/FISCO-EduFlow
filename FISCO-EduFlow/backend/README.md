# 学链通 - 后端系统 (XueLianTong Backend)

## 项目简介

本项目是"学链通"系统的后端服务，基于 Java 17 和 Spring Boot 3.2.0 构建。它负责处理所有用户交互的业务逻辑、管理链下数据，并通过 API 网关与区块链底层进行通信。系统实现了完整的学历认证流程，支持隐私保护的学籍信息查询，并提供了企业级的数据管理和审计功能。

## 🏗️ 项目模块结构

本项目采用多模块 Maven 结构，以实现高度解耦和清晰的职责划分：

```
学链通后端系统/
├── xuelian-core/                    # 核心模块
│   ├── entity/                      # JPA实体类
│   ├── dto/                         # 数据传输对象
│   ├── enums/                       # 枚举定义
│   └── util/                        # 公共工具类
├── xuelian-user-management/         # 用户管理模块
│   ├── controller/                  # 用户相关控制器
│   ├── service/                     # 用户业务逻辑
│   └── repository/                  # 用户数据访问
├── xuelian-certification-flow/     # 认证流程模块
│   ├── controller/                  # 认证相关控制器
│   ├── service/                     # 认证业务逻辑
│   └── repository/                  # 认证数据访问
└── xuelian-main-app/               # 主启动模块
    ├── XueLianTongApplication.java  # 应用入口点
    └── resources/                   # 配置文件
```

### 模块职责说明

* **`xuelian-core`**: 核心模块，包含所有的数据实体 (Entities)、数据传输对象 (DTOs)、枚举 (Enums) 以及项目共享的工具类。
* **`xuelian-user-management`**: 用户管理模块，负责处理所有与用户、角色、登录注册相关的业务（基础结构已创建，具体业务逻辑待实现）。
* **`xuelian-certification-flow`**: 核心认证流程模块，负责处理学历认证的申请、审批、证书生成等所有核心工作流。
* **`xuelian-main-app`**: 主启动模块，负责整合所有子模块并作为应用的入口点。

## 📋 功能需求与代码位置映射

下表详细列出了各项功能需求及其对应的 API 端点和核心代码实现位置。

| 功能需求 (Requirement) | API 端点 (Endpoint) | 主要代码位置 (Code Location) |
| :--- | :--- | :--- |
| **学历认证流程** | | |
| 学生提交认证申请 | `POST /api/certifications/applications` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.submitApplication()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.submitApplication()`<br>**Entity**: `xuelian-core/src/main/java/com/xueliantong/core/entity/CertificationApplication.java` |
| 单位查看申请列表 | `GET /api/certifications/units/{unitId}/applications` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.getApplicationsForUnit()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.getApplicationsForUnit()`<br>**Repository**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/ApplicationRepository.findByTargetUnit()` |
| 单位批准认证申请 | `POST /api/certifications/applications/{id}/approve` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.approveApplication()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.approveApplication()`<br>**Entity**: `xuelian-core/src/main/java/com/xueliantong/core/entity/CertificationApplication.approve()` |
| 单位拒绝认证申请 | `POST /api/certifications/applications/{id}/reject` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.rejectApplication()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.rejectApplication()`<br>**Entity**: `xuelian-core/src/main/java/com/xueliantong/core/entity/CertificationApplication.reject()` |
| 学生查询申请进度 | `GET /api/certifications/applications/{id}/status` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.getApplicationStatus()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.getApplicationStatus()` |
| 自动区块链上链 | (内部流程，触发于申请批准) | **Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.processBlockchainInteraction()`<br>**BlockchainService**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/MockBlockchainServiceImpl.recordCertification()` |
| 证书自动生成 | (内部流程，上链成功后) | **Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.generateCertificate()`<br>**Entity**: `xuelian-core/src/main/java/com/xueliantong/core/entity/Certificate.fromApplication()` |
| **学籍与证书管理** | | |
| 学生选择性查询学籍 | `POST /api/student/academic-info` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/AcademicController.getAcademicInfo()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/MockBlockchainServiceImpl.getAcademicInfoEnhanced()`<br>**DTO**: `xuelian-core/src/main/java/com/xueliantong/core/dto/AcademicInfoRequestDto.java`, `AcademicInfoResponseDto.java` |
| 获取支持查询字段 | `GET /api/student/academic-info/fields` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/AcademicController.getSupportedFields()`<br>**DTO**: `xuelian-core/src/main/java/com/xueliantong/core/dto/AcademicInfoRequestDto.getSupportedFields()` |
| 下载认证证书PDF | `GET /api/certifications/certificates/{id}/download` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.downloadCertificate()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.recordCertificateDownload()` |
| 证书序列号验证 | `GET /api/certifications/certificates/serial/{serialNumber}` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.getCertificateBySerialNumber()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.getCertificateBySerialNumber()`<br>**Repository**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/CertificateRepository.findBySerialNumber()` |
| 证书验证码验证 | `GET /api/certifications/certificates/verify/{verificationCode}` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.getCertificateByVerificationCode()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.getCertificateByVerificationCode()`<br>**Repository**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/CertificateRepository.findByVerificationCode()` |
| **统计与搜索功能** | | |
| 申请统计信息 | `GET /api/certifications/applications/statistics` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.getApplicationStatistics()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.getApplicationStatistics()`<br>**Repository**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/ApplicationRepository.getApplicationStatusStatistics()` |
| 证书统计信息 | `GET /api/certifications/certificates/statistics` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.getCertificateStatistics()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.getCertificateStatistics()`<br>**Repository**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/CertificateRepository.getCertificateStatusStatistics()` |
| 复合条件搜索申请 | `GET /api/certifications/applications/search` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.searchApplications()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.searchApplications()`<br>**Repository**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/ApplicationRepository.findApplicationsWithConditions()` |
| 复合条件搜索证书 | `GET /api/certifications/certificates/search` | **Controller**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.searchCertificates()`<br>**Service**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.searchCertificates()`<br>**Repository**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/CertificateRepository.findCertificatesWithConditions()` |

## 🗄️ 核心数据模型 (Entities)

所有核心业务对象的数据模型（JPA 实体）均定义在 `xuelian-core` 模块中，便于各业务模块共享。

### 实体类位置

* **用户实体**: `xuelian-core/src/main/java/com/xueliantong/core/entity/User.java`
  - 支持三种角色：学生(STUDENT)、用人单位(UNIT)、政府机构(GOVERNMENT)
  - 包含基本信息、账户状态、登录时间等字段
  - 提供角色检查方法：`isStudent()`, `isUnit()`, `isGovernment()`

* **认证申请实体**: `xuelian-core/src/main/java/com/xueliantong/core/entity/CertificationApplication.java`
  - 学历认证申请的完整信息模型
  - 包含申请人、目标单位、学历信息、状态流转等
  - 提供状态管理方法：`approve()`, `reject()`, `complete()`

* **数字证书实体**: `xuelian-core/src/main/java/com/xueliantong/core/entity/Certificate.java`
  - 已生成证书的完整信息模型
  - 包含序列号、验证码、区块链交易ID、PDF路径等
  - 提供证书管理方法：`isValid()`, `recordDownload()`, `revoke()`

### 枚举定义

* **用户角色枚举**: `xuelian-core/src/main/java/com/xueliantong/core/enums/UserRole.java`
  - `STUDENT`: 学生用户，申请学历认证
  - `UNIT`: 用人单位，查询和验证学历信息
  - `GOVERNMENT`: 政府机构，负责学历认证审批

* **认证状态枚举**: `xuelian-core/src/main/java/com/xueliantong/core/enums/CertificationStatus.java`
  - `APPLIED`: 已申请，学生提交认证申请
  - `PENDING_APPROVAL`: 待审批，等待政府机构审批
  - `APPROVED`: 已通过，政府机构审批通过
  - `REJECTED`: 已拒绝，政府机构审批拒绝
  - `COMPLETED`: 已完成，认证信息已上链完成

## 📡 数据传输对象 (DTOs)

### 认证流程相关DTO

* **申请请求DTO**: `xuelian-core/src/main/java/com/xueliantong/core/dto/ApplicationRequestDto.java`
  - 学生提交认证申请时使用
  - 包含申请标题、目标单位、学历信息等
  - 提供数据完整性验证方法

* **申请响应DTO**: `xuelian-core/src/main/java/com/xueliantong/core/dto/ApplicationResponseDto.java`
  - 返回申请信息给前端
  - 包含完整的申请状态、用户信息、处理进度等
  - 嵌套用户基本信息DTO

* **证书DTO**: `xuelian-core/src/main/java/com/xueliantong/core/dto/CertificateDto.java`
  - 返回证书信息给前端
  - 包含证书详情、文件信息、有效性状态等
  - 提供文件大小格式化、有效期计算等工具方法

### 学籍管理相关DTO

* **学籍查询请求DTO**: `xuelian-core/src/main/java/com/xueliantong/core/dto/AcademicInfoRequestDto.java`
  - 支持选择性字段查询，实现隐私保护
  - 包含字段验证、敏感信息检查等功能
  - 提供支持字段列表和验证方法

* **学籍查询响应DTO**: `xuelian-core/src/main/java/com/xueliantong/core/dto/AcademicInfoResponseDto.java`
  - 返回查询到的学籍信息
  - 包含查询元数据、审计追踪、数据完整性验证等
  - 支持查询结果统计和分析

## 🔗 区块链服务交互

为了实现与业务逻辑的解耦，所有与区块链的直接交互都被抽象在一个服务接口中。

### 核心接口设计

* **服务接口**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/BlockchainService.java`
  - 定义了所有与链交互的方法
  - `recordCertification()`: 将认证信息记录到区块链
  - `getAcademicInfo()`: 从区块链获取学籍信息
  - `getAcademicInfoEnhanced()`: 增强版学籍查询，支持选择性字段
  - `queryCertificationByTransactionId()`: 根据交易ID查询认证信息
  - `verifyCertificationData()`: 验证区块链上的认证数据

### Mock实现

* **模拟实现**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/MockBlockchainServiceImpl.java`
  - 当前开发阶段使用的模拟实现
  - 返回逼真的模拟数据，支持完整的业务流程测试
  - 模拟网络延迟、偶发性错误等真实场景
  - 支持数据一致性（同一学生ID总是返回相同的模拟数据）
  - 包含完整的脱敏处理和隐私保护功能

### 真实区块链集成

未来集成真实的WeBase区块链网关时，只需要：
1. 创建新的实现类 `WeBaseBlockchainServiceImpl`
2. 实现 `BlockchainService` 接口的所有方法
3. 通过Spring配置切换实现（修改 `@ConditionalOnProperty` 配置）

## 🗃️ 数据访问层 (Repositories)

### 申请相关数据访问

* **申请仓库**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/ApplicationRepository.java`
  - 提供30+个查询方法，支持各种复杂查询场景
  - 包含基本CRUD、条件查询、统计分析、过期处理等功能
  - 支持分页、排序、复合条件查询

### 证书相关数据访问

* **证书仓库**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/repository/CertificateRepository.java`
  - 提供25+个查询方法，支持证书的全生命周期管理
  - 包含序列号查询、验证码查询、状态管理、统计分析等功能
  - 支持过期处理、下载统计、重复检查等业务逻辑

## 🎯 业务服务层 (Services)

### 认证流程服务

* **服务接口**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/CertificationService.java`
  - 定义认证流程的核心业务方法
  - 包含申请提交、审批处理、证书生成、统计查询等20+个方法

* **服务实现**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/service/impl/CertificationServiceImpl.java`
  - 完整的业务逻辑实现
  - 事务管理、权限控制、状态流转、异常处理
  - 集成区块链服务，支持自动上链和证书生成

## 🌐 控制器层 (Controllers)

### 认证流程控制器

* **认证控制器**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/CertificationController.java`
  - 提供15+个REST API端点
  - 统一的API响应格式和异常处理
  - 支持分页、排序、复合条件查询
  - 完整的参数验证和权限检查

### 学籍管理控制器

* **学籍控制器**: `xuelian-certification-flow/src/main/java/com/xueliantong/certification/controller/AcademicController.java`
  - 支持隐私保护的选择性查询
  - 字段级权限控制和数据脱敏
  - 完整的审计追踪和统计分析
  - 支持敏感信息的安全访问控制

## 🚀 如何运行项目

### 环境要求

- Java 17 或更高版本
- Maven 3.6 或更高版本
- 8GB 以上内存推荐

### 启动步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd xueliantong-backend
   ```

2. **编译项目**
   ```bash
   mvn clean compile
   ```

3. **启动应用**
   ```bash
   cd xuelian-main-app
   mvn spring-boot:run
   ```
   
   或直接运行主类：
   ```bash
   java -jar xuelian-main-app/target/xuelian-main-app-1.0.0-SNAPSHOT.jar
   ```

4. **验证启动**
   - 应用将在 `http://localhost:8080` 启动
   - 访问健康检查：`http://localhost:8080/api/actuator/health`
   - H2数据库控制台：`http://localhost:8080/api/h2-console`

### 配置说明

主要配置文件位于 `xuelian-main-app/src/main/resources/application.yml`：

- **开发环境** (`dev` profile): 使用H2内存数据库，启用区块链Mock模式
- **生产环境** (`prod` profile): 使用SQL Server数据库，启用真实区块链集成

### 数据库配置

**开发环境（H2）**：
- URL: `jdbc:h2:mem:xueliantong`
- 用户名: `sa`
- 密码: 无
- 控制台: `http://localhost:8080/api/h2-console`

**生产环境（SQL Server）**：
- 需要修改 `application.yml` 中的数据库连接信息
- 运行时使用 `--spring.profiles.active=prod` 参数

## 📚 API文档和测试

### API测试示例

详细的API测试示例请参考项目根目录下的 `api-test-examples.md` 文件，包含：

- 完整的学历认证流程测试用例
- 学籍信息查询的各种场景
- 权限控制和隐私保护测试
- 统计和搜索功能示例

### 关键API端点

**学历认证流程**：
- `POST /api/certifications/applications` - 提交认证申请
- `POST /api/certifications/applications/{id}/approve` - 批准申请
- `GET /api/certifications/applications/{id}/status` - 查询申请状态

**学籍管理**：
- `POST /api/student/academic-info` - 选择性学籍查询
- `GET /api/student/academic-info/fields` - 获取支持字段

**证书管理**：
- `GET /api/certifications/certificates/{id}/download` - 下载证书
- `GET /api/certifications/certificates/verify/{code}` - 验证证书

## 🔧 开发工具和规范

### 代码结构规范

- **包命名**: `com.xueliantong.<module>.<layer>`
- **类命名**: 遵循Java标准命名规范
- **方法命名**: 动词+名词，清晰表达功能
- **注释规范**: 所有公共API都有完整的JSDoc注释

### 依赖管理

- **Spring Boot**: 3.2.0 - 主框架
- **Spring Data JPA**: 数据持久化
- **H2 Database**: 开发环境数据库
- **Lombok**: 减少样板代码
- **Jackson**: JSON序列化
- **Spring Boot Actuator**: 监控和管理

### 日志规范

- 使用SLF4J + Logback
- 统一的日志格式和级别
- 详细的操作审计日志
- 错误信息包含完整的上下文

## 🎯 未来开发计划

### 待实现功能

1. **用户管理模块**
   - 用户注册、登录、权限管理
   - JWT认证和Spring Security集成
   - 用户资料管理和审核流程

2. **真实区块链集成**
   - WeBase网关API对接
   - 智能合约交互
   - 区块链数据同步

3. **文件存储服务**
   - PDF证书生成
   - 文件上传和下载
   - 云存储集成

4. **消息通知系统**
   - 邮件通知
   - 短信通知
   - 系统内消息

### 性能优化

- 数据库查询优化
- 缓存策略实现
- 异步处理机制
- 批量操作支持

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](../../issues)
- 邮箱: [your-email@example.com]
- 文档Wiki: [项目Wiki](../../wiki)

---

**学链通团队** - 致力于构建安全、高效、透明的学历认证生态系统 🎓 