# 学链通部署指南

本文档详细介绍了学链通区块链教育认证平台的完整部署流程。

## 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        部署架构图                                │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   前端应用  │  │  Java后端   │  │  Go服务     │              │
│  │   (Nginx)   │  │ (Spring)    │  │ (微服务)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   负载均衡层                                │ │
│  │              (Nginx/HAProxy)                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   基础设施层                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │ │
│  │  │    Redis    │  │  RabbitMQ   │  │ SQL Server  │          │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 FISCO BCOS 网络                             │ │
│  │                                                             │ │
│  │  ┌─────────────────┐    ┌─────────────────┐                │ │
│  │  │      主链       │    │      侧链       │                │ │
│  │  │   (Group 1)     │◄──►│   (Group 2,3)   │                │ │
│  │  │                 │    │                 │                │ │
│  │  │ Node0  Node1    │    │ Node0  Node1    │                │ │
│  │  │ Node2  Node3    │    │ Node2  Node3    │                │ │
│  │  └─────────────────┘    └─────────────────┘                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 环境要求

### 硬件要求
- **CPU**: 4核心以上
- **内存**: 8GB以上
- **存储**: 100GB以上SSD
- **网络**: 100Mbps以上带宽

### 软件要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+
- **Java**: OpenJDK 17+
- **Go**: 1.19+
- **Node.js**: 16+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

## 部署步骤

### 1. 环境准备

#### 1.1 安装基础软件

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget git vim

# 安装Java 17
sudo apt install -y openjdk-17-jdk

# 安装Go
wget https://go.dev/dl/go1.19.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.19.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 1.2 创建部署目录

```bash
sudo mkdir -p /opt/xueliantong
sudo chown $USER:$USER /opt/xueliantong
cd /opt/xueliantong
```

### 2. 部署FISCO BCOS网络

#### 2.1 下载FISCO BCOS

```bash
# 下载build_chain脚本
curl -#LO https://github.com/FISCO-BCOS/FISCO-BCOS/releases/download/v3.2.0/build_chain.sh
chmod u+x build_chain.sh

# 下载控制台
curl -#LO https://github.com/FISCO-BCOS/console/releases/download/v3.2.0/download_console.sh
bash download_console.sh
```

#### 2.2 构建区块链网络

```bash
# 构建4节点主链网络 (Group 1)
bash build_chain.sh -l 127.0.0.1:4 -p 30300,20200,8545 -g 1

# 构建侧链网络 (Group 2)
bash build_chain.sh -l 127.0.0.1:2 -p 30400,20300,8546 -g 2

# 构建侧链网络 (Group 3)  
bash build_chain.sh -l 127.0.0.1:2 -p 30500,20400,8547 -g 3
```

#### 2.3 启动区块链网络

```bash
# 启动主链
bash nodes/127.0.0.1/start_all.sh

# 启动侧链
bash nodes_group2/127.0.0.1/start_all.sh
bash nodes_group3/127.0.0.1/start_all.sh

# 检查网络状态
bash nodes/127.0.0.1/monitor.sh
```

### 3. 部署基础设施服务

#### 3.1 创建Docker Compose配置

```yaml
# deployment/docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: xueliantong-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: xueliantong-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2019-latest
    container_name: xueliantong-sqlserver
    ports:
      - "1433:1433"
    environment:
      SA_PASSWORD: "YourStrong@Passw0rd"
      ACCEPT_EULA: "Y"
    volumes:
      - sqlserver_data:/var/opt/mssql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: xueliantong-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - java-backend
    restart: unless-stopped

volumes:
  redis_data:
  rabbitmq_data:
  sqlserver_data:
```

#### 3.2 启动基础设施

```bash
cd deployment
docker-compose up -d

# 检查服务状态
docker-compose ps
```

### 4. 部署智能合约

#### 4.1 编译智能合约

```bash
cd blockchain/contracts

# 安装Solidity编译器
npm install -g solc@0.8.19

# 编译合约
mkdir -p build/abi build/bin
solc --abi --bin --optimize -o build/ contracts/*.sol

# 生成Java包装类
cd ../../backend/xuelian-blockchain-integration
mvn web3j:generate-sources
```

#### 4.2 部署合约到区块链

```bash
# 使用FISCO BCOS控制台部署
cd console

# 启动控制台
bash start.sh

# 在控制台中执行部署命令
[group1]: deploy StudentProfileContract
[group1]: deploy CertificationContract  
[group1]: deploy StateChannelFactory 1000000000000000000 86400
[group1]: deploy CrossChainRouter 3600 0x1234567890123456789012345678901234567890
[group1]: deploy MerkleSyncContract

# 记录合约地址并更新配置文件
```

### 5. 部署Java后端服务

#### 5.1 构建应用

```bash
cd backend

# 编译项目
mvn clean package -DskipTests

# 创建部署目录
sudo mkdir -p /opt/xueliantong/backend
sudo cp xuelian-main-app/target/xuelian-main-app-1.0.0-SNAPSHOT.jar /opt/xueliantong/backend/
```

#### 5.2 配置应用

```bash
# 创建生产配置文件
sudo tee /opt/xueliantong/backend/application-prod.yml > /dev/null <<EOF
spring:
  profiles:
    active: prod
    include: fisco
  
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=xueliantong
    username: sa
    password: YourStrong@Passw0rd
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
  
  redis:
    host: localhost
    port: 6379
    database: 0
  
  rabbitmq:
    host: localhost
    port: 5672
    username: admin
    password: admin123

server:
  port: 8080

logging:
  level:
    com.xueliantong: INFO
  file:
    name: /opt/xueliantong/logs/application.log

# 更新合约地址
fisco:
  main-chain:
    contracts:
      student-profile:
        address: "0x实际部署的合约地址"
      certification:
        address: "0x实际部署的合约地址"
EOF
```

#### 5.3 创建系统服务

```bash
# 创建systemd服务文件
sudo tee /etc/systemd/system/xueliantong-backend.service > /dev/null <<EOF
[Unit]
Description=XueLianTong Backend Service
After=network.target

[Service]
Type=simple
User=xueliantong
WorkingDirectory=/opt/xueliantong/backend
ExecStart=/usr/bin/java -jar -Dspring.config.location=application-prod.yml xuelian-main-app-1.0.0-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 创建用户
sudo useradd -r -s /bin/false xueliantong
sudo chown -R xueliantong:xueliantong /opt/xueliantong

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable xueliantong-backend
sudo systemctl start xueliantong-backend

# 检查服务状态
sudo systemctl status xueliantong-backend
```

### 6. 部署Go微服务

#### 6.1 构建Go服务

```bash
# 构建密码学服务
cd services/crypto
go build -o crypto-service ./cmd/main.go
sudo cp crypto-service /opt/xueliantong/services/

# 构建Merkle树服务
cd ../merkle
go build -o merkle-service ./cmd/main.go
sudo cp merkle-service /opt/xueliantong/services/

# 构建零知识证明服务
cd ../zkp
go build -o zkp-service ./cmd/main.go
sudo cp zkp-service /opt/xueliantong/services/

# 构建API网关
cd ../api-gateway
go build -o api-gateway ./cmd/main.go
sudo cp api-gateway /opt/xueliantong/services/

# 构建状态通道服务
cd ../../state-channels
go build -o state-channels ./cmd/main.go
sudo cp state-channels /opt/xueliantong/services/
```

#### 6.2 创建Go服务的systemd配置

```bash
# 为每个Go服务创建systemd文件
for service in crypto-service merkle-service zkp-service api-gateway state-channels; do
sudo tee /etc/systemd/system/xueliantong-${service}.service > /dev/null <<EOF
[Unit]
Description=XueLianTong ${service}
After=network.target

[Service]
Type=simple
User=xueliantong
WorkingDirectory=/opt/xueliantong/services
ExecStart=/opt/xueliantong/services/${service}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
done

# 启动所有Go服务
sudo systemctl daemon-reload
for service in crypto-service merkle-service zkp-service api-gateway state-channels; do
    sudo systemctl enable xueliantong-${service}
    sudo systemctl start xueliantong-${service}
done
```

### 7. 配置Nginx反向代理

#### 7.1 创建Nginx配置

```bash
sudo mkdir -p /opt/xueliantong/nginx

sudo tee /opt/xueliantong/nginx/nginx.conf > /dev/null <<EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server localhost:8080;
    }
    
    upstream api-gateway {
        server localhost:8081;
    }
    
    upstream state-channels {
        server localhost:8082;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        # Java后端API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Go API网关
        location /gateway/ {
            proxy_pass http://api-gateway/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        # 状态通道WebSocket
        location /ws {
            proxy_pass http://state-channels;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
        }
        
        # 静态文件
        location / {
            root /opt/xueliantong/frontend;
            try_files \$uri \$uri/ /index.html;
        }
    }
}
EOF
```

### 8. 监控和日志

#### 8.1 配置日志收集

```bash
# 创建日志目录
sudo mkdir -p /opt/xueliantong/logs

# 配置logrotate
sudo tee /etc/logrotate.d/xueliantong > /dev/null <<EOF
/opt/xueliantong/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 xueliantong xueliantong
    postrotate
        systemctl reload xueliantong-backend
    endscript
}
EOF
```

#### 8.2 健康检查脚本

```bash
sudo tee /opt/xueliantong/scripts/health-check.sh > /dev/null <<EOF
#!/bin/bash

# 检查Java后端
if curl -f http://localhost:8080/api/actuator/health > /dev/null 2>&1; then
    echo "✓ Java Backend: OK"
else
    echo "✗ Java Backend: FAILED"
fi

# 检查区块链网络
if curl -f http://localhost:8080/api/blockchain/network/status > /dev/null 2>&1; then
    echo "✓ Blockchain Network: OK"
else
    echo "✗ Blockchain Network: FAILED"
fi

# 检查Go服务
for port in 8081 8082 8083 8084 8085; do
    if curl -f http://localhost:\$port/health > /dev/null 2>&1; then
        echo "✓ Go Service (\$port): OK"
    else
        echo "✗ Go Service (\$port): FAILED"
    fi
done

# 检查基础设施
if redis-cli ping > /dev/null 2>&1; then
    echo "✓ Redis: OK"
else
    echo "✗ Redis: FAILED"
fi
EOF

chmod +x /opt/xueliantong/scripts/health-check.sh
```

## 验证部署

### 1. 检查所有服务状态

```bash
# 检查系统服务
sudo systemctl status xueliantong-backend
sudo systemctl status xueliantong-crypto-service
sudo systemctl status xueliantong-api-gateway

# 检查Docker服务
docker-compose ps

# 运行健康检查
/opt/xueliantong/scripts/health-check.sh
```

### 2. 测试API接口

```bash
# 测试Java后端健康检查
curl http://localhost:8080/api/actuator/health

# 测试区块链网络状态
curl http://localhost:8080/api/blockchain/network/status

# 测试智能合约调用
curl -X POST http://localhost:8080/api/blockchain/contracts/call \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x合约地址",
    "abi": "[...]",
    "methodName": "getStudentProfile",
    "params": ["student123"],
    "readOnly": true
  }'
```

### 3. 测试状态通道

```bash
# 测试WebSocket连接
wscat -c ws://localhost:8082/ws?user_id=test_user

# 创建状态通道
curl -X POST http://localhost:8080/api/blockchain/state-channels/create \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [...],
    "initialDeposit": "1000000000000000000",
    "timeout": 86400,
    "metadata": {}
  }'
```

## 故障排除

### 常见问题

1. **FISCO BCOS节点启动失败**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep :20200
   
   # 检查节点日志
   tail -f nodes/127.0.0.1/node0/log/log_*.log
   ```

2. **Java应用启动失败**
   ```bash
   # 检查应用日志
   sudo journalctl -u xueliantong-backend -f
   
   # 检查配置文件
   java -jar app.jar --spring.config.location=application-prod.yml --debug
   ```

3. **数据库连接失败**
   ```bash
   # 检查SQL Server状态
   docker logs xueliantong-sqlserver
   
   # 测试连接
   sqlcmd -S localhost -U sa -P 'YourStrong@Passw0rd'
   ```

### 性能优化

1. **JVM调优**
   ```bash
   # 在systemd服务文件中添加JVM参数
   ExecStart=/usr/bin/java -Xms2g -Xmx4g -XX:+UseG1GC -jar app.jar
   ```

2. **数据库优化**
   ```sql
   -- 创建索引
   CREATE INDEX idx_student_id ON student_profiles(student_id);
   CREATE INDEX idx_cert_status ON certifications(status);
   ```

3. **Redis优化**
   ```bash
   # 在redis.conf中配置
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

## 备份和恢复

### 数据备份

```bash
# 创建备份脚本
sudo tee /opt/xueliantong/scripts/backup.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/opt/xueliantong/backups/\$(date +%Y%m%d_%H%M%S)"
mkdir -p \$BACKUP_DIR

# 备份数据库
docker exec xueliantong-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong@Passw0rd' \
  -Q "BACKUP DATABASE xueliantong TO DISK = '/var/opt/mssql/backup/xueliantong.bak'"

# 备份区块链数据
cp -r nodes \$BACKUP_DIR/

# 备份配置文件
cp -r /opt/xueliantong/backend/*.yml \$BACKUP_DIR/

echo "Backup completed: \$BACKUP_DIR"
EOF

chmod +x /opt/xueliantong/scripts/backup.sh

# 设置定时备份
echo "0 2 * * * /opt/xueliantong/scripts/backup.sh" | sudo crontab -
```

## 安全加固

### 1. 防火墙配置

```bash
# 配置ufw防火墙
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow from 10.0.0.0/8 to any port 20200  # FISCO BCOS内网
```

### 2. SSL证书配置

```bash
# 使用Let's Encrypt获取SSL证书
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# 配置Nginx SSL
# 在nginx.conf中添加SSL配置
```

### 3. 访问控制

```bash
# 限制敏感端口访问
sudo iptables -A INPUT -p tcp --dport 8080 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j DROP
```

部署完成后，您的学链通区块链教育认证平台就可以正常运行了！
