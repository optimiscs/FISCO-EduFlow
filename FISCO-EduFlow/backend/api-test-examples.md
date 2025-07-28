# 学链通 API 测试示例

## 📚 学籍管理 API

### 1. 获取支持的查询字段

```bash
# 查看所有支持的学籍查询字段
curl -X GET "http://localhost:8080/api/student/academic-info/fields" \
  -H "Content-Type: application/json"
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "supportedFields": ["studentId", "realName", "idNumber", "school", "major", "degree", "educationLevel", "admissionDate", "graduationDate", "studentStatus", "gpa", "awards", "certifications"],
    "sensitiveFields": ["realName", "idNumber", "gpa", "awards"],
    "basicFields": ["studentId", "school", "major", "degree", "educationLevel"],
    "totalCount": 13,
    "description": "学籍信息查询支持的字段列表"
  }
}
```

### 2. 学籍信息选择性查询

#### 基础信息查询（无敏感数据）
```bash
curl -X POST "http://localhost:8080/api/student/academic-info" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -H "X-User-Role: UNIT" \
  -d '{
    "studentId": "2020001",
    "fields": ["studentId", "school", "major", "degree", "educationLevel", "graduationDate"],
    "queryReason": "学历验证",
    "queryPurpose": "招聘背景调查"
  }'
```

#### 包含敏感信息的查询
```bash
curl -X POST "http://localhost:8080/api/student/academic-info" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2020001" \
  -H "X-User-Role: STUDENT" \
  -d '{
    "studentId": "2020001",
    "fields": ["studentId", "realName", "school", "major", "degree", "gpa", "awards"],
    "queryReason": "个人信息查看",
    "queryPurpose": "个人档案管理"
  }'
```

**响应示例：**
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "success": true,
    "studentId": "2020001",
    "academicData": {
      "studentId": "2020001",
      "realName": "张**",
      "school": "清华大学",
      "major": "计算机科学与技术",
      "degree": "工学学士",
      "gpa": "3.75",
      "awards": ["国家奖学金", "优秀毕业生"]
    },
    "requestedFields": ["studentId", "realName", "school", "major", "degree", "gpa", "awards"],
    "returnedFields": ["studentId", "realName", "school", "major", "degree", "gpa", "awards"],
    "dataSource": "学链通测试区块链",
    "queryTime": "2024-12-19 10:30:45",
    "dataIntegrity": "verified",
    "privacyLevel": "高",
    "metadata": {
      "requestedFieldCount": 7,
      "returnedFieldCount": 7,
      "queryDuration": 1250,
      "containsSensitiveData": true,
      "blockchainVerificationStatus": "verified",
      "auditTrackingId": "AUDIT-1703002245-1234"
    }
  }
}
```

## 🎓 学历认证流程 API

### 1. 学生提交认证申请

```bash
curl -X POST "http://localhost:8080/api/certifications/applications" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "title": "计算机科学学士学位认证申请",
    "targetUnitId": 2,
    "description": "申请向腾讯公司提供学历认证",
    "educationInfo": "2020年9月入学，2024年6月毕业",
    "graduateSchool": "清华大学",
    "major": "计算机科学与技术",
    "educationLevel": "本科",
    "graduationDate": "2024-06-15T00:00:00",
    "degreeCertificateNumber": "10003202400001",
    "applicantNotes": "申请职位：高级软件工程师",
    "priority": 1,
    "isUrgent": true
  }'
```

### 2. 用人单位查看申请列表

```bash
curl -X GET "http://localhost:8080/api/certifications/units/2/applications?status=APPLIED&page=0&size=10" \
  -H "Content-Type: application/json"
```

### 3. 用人单位批准申请

```bash
curl -X POST "http://localhost:8080/api/certifications/applications/1/approve" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{
    "notes": "学历信息验证通过，同意颁发认证证书"
  }'
```

### 4. 学生查询申请状态

```bash
curl -X GET "http://localhost:8080/api/certifications/applications/1/status" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1"
```

### 5. 证书验证

#### 根据序列号验证证书
```bash
curl -X GET "http://localhost:8080/api/certifications/certificates/serial/XLT-1703002245000-000001" \
  -H "Content-Type: application/json"
```

#### 根据验证码验证证书
```bash
curl -X GET "http://localhost:8080/api/certifications/certificates/verify/123456" \
  -H "Content-Type: application/json"
```

### 6. 证书下载

```bash
curl -X GET "http://localhost:8080/api/certifications/certificates/1/download" \
  -H "X-User-Id: 1" \
  -v
```

## 📊 统计和搜索 API

### 1. 申请统计信息

```bash
# 全局统计
curl -X GET "http://localhost:8080/api/certifications/applications/statistics" \
  -H "Content-Type: application/json"

# 特定单位统计
curl -X GET "http://localhost:8080/api/certifications/applications/statistics?unitId=2" \
  -H "Content-Type: application/json"
```

### 2. 复合条件搜索申请

```bash
curl -X GET "http://localhost:8080/api/certifications/applications/search?graduateSchool=清华大学&major=计算机&status=COMPLETED&page=0&size=10" \
  -H "Content-Type: application/json"
```

### 3. 复合条件搜索证书

```bash
curl -X GET "http://localhost:8080/api/certifications/certificates/search?graduateSchool=清华&educationLevel=本科&status=ACTIVE&page=0&size=10" \
  -H "Content-Type: application/json"
```

## 🔒 隐私保护特性

### 1. 字段级权限控制
- **基础字段**：任何用户都可以查询（school, major, degree等）
- **敏感字段**：需要特殊权限（realName, idNumber, gpa, awards）
- **权限规则**：
  - 学生本人可以查看自己的所有信息
  - 政府机构可以查看所有信息
  - 用人单位只能在特定条件下查看敏感信息

### 2. 审计追踪
每次查询都会记录详细的审计日志：
- 查询用户ID和角色
- 目标学生ID
- 查询的字段列表
- 查询结果状态
- 查询时间和耗时
- 唯一的审计追踪ID

### 3. 数据脱敏
敏感信息会自动脱敏处理：
- 姓名：张**、李***
- 身份证号：110101********1234
- 其他个人信息按规则脱敏

## 🧪 测试场景

### 场景1：新员工入职学历验证
1. HR向学生发起学历验证请求
2. 学生提交认证申请
3. HR审核并批准申请
4. 系统自动上链生成证书
5. HR下载验证证书

### 场景2：第三方机构学历查询
1. 第三方机构查询支持的字段
2. 提交选择性查询请求（只查询必要字段）
3. 系统验证权限并返回脱敏数据
4. 记录完整的审计追踪

### 场景3：政府监管部门数据核查
1. 政府部门使用完整权限查询学籍信息
2. 获取包含敏感信息的完整数据
3. 系统记录监管查询的审计日志

## 🚀 启动和测试

```bash
# 1. 编译项目
mvn clean compile

# 2. 启动应用
cd xuelian-main-app
mvn spring-boot:run

# 3. 访问接口
# 主服务：http://localhost:8080/api
# H2控制台：http://localhost:8080/api/h2-console
# 健康检查：http://localhost:8080/api/actuator/health
```

## 📈 系统特性

- ✅ **完整的学历认证流程**：从申请到证书生成的全流程管理
- ✅ **隐私保护的学籍查询**：支持字段级选择性查询
- ✅ **Mock区块链集成**：完整的区块链交互模拟
- ✅ **权限控制**：基于角色和关系的细粒度权限管理
- ✅ **审计追踪**：完整的操作日志和审计记录
- ✅ **数据脱敏**：自动的敏感信息脱敏处理
- ✅ **企业级架构**：清晰的分层设计和错误处理
- ✅ **丰富的API**：15+个REST接口支持各种业务场景 