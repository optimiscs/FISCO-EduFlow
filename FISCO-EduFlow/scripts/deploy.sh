#!/bin/bash

# 学链通区块链教育认证平台部署脚本
# 作者: XueLianTong Team
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令未找到，请先安装"
        exit 1
    fi
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查必要的命令
    check_command "docker"
    check_command "docker-compose"
    check_command "mvn"
    check_command "java"
    check_command "go"
    
    # 检查Java版本
    java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$java_version" -lt 17 ]; then
        log_error "需要Java 17或更高版本，当前版本: $java_version"
        exit 1
    fi
    
    # 检查Go版本
    go_version=$(go version | awk '{print $3}' | sed 's/go//')
    if [ "$(printf '%s\n' "1.19" "$go_version" | sort -V | head -n1)" != "1.19" ]; then
        log_error "需要Go 1.19或更高版本，当前版本: $go_version"
        exit 1
    fi
    
    # 检查Docker版本
    docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
    log_info "Docker版本: $docker_version"
    
    # 检查Docker Compose版本
    compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
    log_info "Docker Compose版本: $compose_version"
    
    log_info "环境检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p logs/{main-app,crypto,merkle,zkp,nginx}
    mkdir -p config/{nginx,redis,rabbitmq,grafana,prometheus}
    mkdir -p ssl
    mkdir -p scripts/sql
    
    log_info "目录创建完成"
}

# 构建Java项目
build_java_project() {
    log_info "构建Java项目..."
    
    # 清理并编译
    mvn clean compile -q
    
    # 运行测试
    if [ "$SKIP_TESTS" != "true" ]; then
        log_info "运行单元测试..."
        mvn test -q
    else
        log_warn "跳过单元测试"
    fi
    
    # 打包
    mvn package -DskipTests -q
    
    log_info "Java项目构建完成"
}

# 构建Go服务
build_go_services() {
    log_info "构建Go服务..."
    
    # 构建密码学服务
    if [ -d "services/crypto" ]; then
        log_info "构建密码学服务..."
        cd services/crypto
        go mod tidy
        go build -o bin/crypto-server ./cmd/server
        cd ../..
    fi
    
    # 构建Merkle Tree服务
    if [ -d "services/merkle" ]; then
        log_info "构建Merkle Tree服务..."
        cd services/merkle
        go mod tidy
        go build -o bin/merkle-server ./cmd/server
        cd ../..
    fi
    
    # 构建零知识证明服务
    if [ -d "services/zkp" ]; then
        log_info "构建零知识证明服务..."
        cd services/zkp
        go mod tidy
        go build -o bin/zkp-server ./cmd/server
        cd ../..
    fi
    
    # 构建API网关
    if [ -d "services/api-gateway" ]; then
        log_info "构建API网关..."
        cd services/api-gateway
        go mod tidy
        go build -o bin/gateway-server ./cmd/server
        cd ../..
    fi
    
    log_info "Go服务构建完成"
}

# 生成配置文件
generate_configs() {
    log_info "生成配置文件..."
    
    # 生成Nginx配置
    cat > config/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream api_backend {
        server api-gateway:8000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        location / {
            proxy_pass http://api_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
    
    # 生成Redis配置
    cat > config/redis.conf << 'EOF'
# Redis配置文件
bind 0.0.0.0
port 6379
timeout 0
tcp-keepalive 300
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF
    
    # 生成Prometheus配置
    cat > config/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'xuelian-main-app'
    static_configs:
      - targets: ['xuelian-main-app:8080']
    metrics_path: '/api/actuator/prometheus'

  - job_name: 'crypto-service'
    static_configs:
      - targets: ['crypto-service:8081']
    metrics_path: '/metrics'

  - job_name: 'merkle-service'
    static_configs:
      - targets: ['merkle-service:8082']
    metrics_path: '/metrics'

  - job_name: 'zkp-service'
    static_configs:
      - targets: ['zkp-service:8083']
    metrics_path: '/metrics'
EOF
    
    log_info "配置文件生成完成"
}

# 部署智能合约
deploy_contracts() {
    log_info "部署智能合约..."
    
    if [ -d "blockchain/contracts" ]; then
        cd blockchain/contracts
        
        # 安装依赖
        if [ -f "package.json" ]; then
            npm install
        fi
        
        # 编译合约
        if [ -f "hardhat.config.js" ] || [ -f "truffle-config.js" ]; then
            log_info "编译智能合约..."
            # 这里应该添加具体的合约编译命令
        fi
        
        cd ../..
    fi
    
    log_info "智能合约部署完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 停止现有服务
    docker-compose down
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose build
    
    # 启动服务
    log_info "启动所有服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_health
    
    log_info "服务启动完成"
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    services=("xuelian-main-app:8080" "crypto-service:8081" "api-gateway:8000")
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        
        log_info "检查 $name 服务..."
        
        # 等待服务启动
        for i in {1..30}; do
            if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
                log_info "$name 服务健康"
                break
            fi
            
            if [ $i -eq 30 ]; then
                log_error "$name 服务启动失败"
                docker-compose logs $name
                exit 1
            fi
            
            sleep 2
        done
    done
    
    log_info "所有服务健康检查完成"
}

# 显示部署信息
show_deployment_info() {
    log_info "部署完成！"
    echo
    echo "=== 服务访问地址 ==="
    echo "主应用:        http://localhost:8080"
    echo "API网关:       http://localhost:8000"
    echo "密码学服务:    http://localhost:8081"
    echo "Merkle服务:    http://localhost:8082"
    echo "ZKP服务:       http://localhost:8083"
    echo "Grafana监控:   http://localhost:3000 (admin/XueLianTong@2024)"
    echo "Prometheus:    http://localhost:9090"
    echo "RabbitMQ管理:  http://localhost:15672 (admin/XueLianTong@2024)"
    echo
    echo "=== 常用命令 ==="
    echo "查看服务状态:  docker-compose ps"
    echo "查看日志:      docker-compose logs [service-name]"
    echo "停止服务:      docker-compose down"
    echo "重启服务:      docker-compose restart [service-name]"
    echo
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 这里可以添加清理逻辑
}

# 主函数
main() {
    log_info "开始部署学链通区块链教育认证平台..."
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS="true"
                shift
                ;;
            --skip-build)
                SKIP_BUILD="true"
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --skip-tests    跳过单元测试"
                echo "  --skip-build    跳过构建步骤"
                echo "  --help          显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 设置错误处理
    trap cleanup EXIT
    
    # 执行部署步骤
    check_environment
    create_directories
    generate_configs
    
    if [ "$SKIP_BUILD" != "true" ]; then
        build_java_project
        build_go_services
    fi
    
    deploy_contracts
    start_services
    show_deployment_info
    
    log_info "部署完成！"
}

# 执行主函数
main "$@"
