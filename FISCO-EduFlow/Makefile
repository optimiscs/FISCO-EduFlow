# 面向学历认证的混合架构区块链平台 Makefile

.PHONY: all build test clean docker-build docker-up docker-down

# 项目配置
PROJECT_NAME := blockchain-education-platform
GO_VERSION := 1.19
NODE_VERSION := 16

# 目录配置
SERVICES_DIR := services
BLOCKCHAIN_DIR := blockchain
FRONTEND_DIR := frontend
BACKEND_DIR := backend
TESTING_DIR := testing

# Go 服务列表
GO_SERVICES := crypto merkle zkp api-gateway

# 默认目标
all: build

# 构建所有服务
build: build-go build-contracts build-frontend build-backend

# 构建 Go 服务
build-go:
	@echo "构建 Go 服务..."
	@for service in $(GO_SERVICES); do \
		echo "构建 $$service 服务..."; \
		cd $(SERVICES_DIR)/$$service && go mod tidy && go build -o bin/$$service ./cmd/main.go; \
		cd ../..; \
	done

# 构建智能合约
build-contracts:
	@echo "编译智能合约..."
	@cd $(BLOCKCHAIN_DIR)/contracts && \
	if [ -f package.json ]; then npm install && npm run compile; fi

# 构建前端
build-frontend:
	@echo "构建前端应用..."
	@cd $(FRONTEND_DIR) && \
	if [ -f package.json ]; then npm install && npm run build; fi

# 构建后端
build-backend:
	@echo "构建 Spring Boot 后端..."
	@cd $(BACKEND_DIR) && \
	if [ -f pom.xml ]; then mvn clean package -DskipTests; fi

# 运行测试
test: test-go test-contracts test-integration

# Go 服务测试
test-go:
	@echo "运行 Go 服务测试..."
	@for service in $(GO_SERVICES); do \
		echo "测试 $$service 服务..."; \
		cd $(SERVICES_DIR)/$$service && go test -v ./...; \
		cd ../..; \
	done

# 智能合约测试
test-contracts:
	@echo "运行智能合约测试..."
	@cd $(BLOCKCHAIN_DIR)/contracts && \
	if [ -f package.json ]; then npm test; fi

# 集成测试
test-integration:
	@echo "运行集成测试..."
	@cd $(TESTING_DIR) && go test -v ./integration/...

# 清理构建产物
clean:
	@echo "清理构建产物..."
	@find . -name "bin" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "target" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# Docker 构建
docker-build:
	@echo "构建 Docker 镜像..."
	@docker-compose -f deployment/docker-compose.yml build

# 启动 Docker 环境
docker-up:
	@echo "启动 Docker 环境..."
	@docker-compose -f deployment/docker-compose.yml up -d

# 停止 Docker 环境
docker-down:
	@echo "停止 Docker 环境..."
	@docker-compose -f deployment/docker-compose.yml down

# 查看服务状态
status:
	@echo "查看服务状态..."
	@docker-compose -f deployment/docker-compose.yml ps

# 查看日志
logs:
	@echo "查看服务日志..."
	@docker-compose -f deployment/docker-compose.yml logs -f

# 初始化开发环境
init:
	@echo "初始化开发环境..."
	@echo "检查 Go 版本..."
	@go version
	@echo "检查 Node.js 版本..."
	@node --version
	@echo "检查 Docker 版本..."
	@docker --version
	@echo "初始化 Go 模块..."
	@for service in $(GO_SERVICES); do \
		cd $(SERVICES_DIR)/$$service && go mod init github.com/blockchain-education-platform/$$service; \
		cd ../..; \
	done

# 代码格式化
fmt:
	@echo "格式化 Go 代码..."
	@find . -name "*.go" -exec gofmt -w {} \;
	@echo "格式化前端代码..."
	@cd $(FRONTEND_DIR) && if [ -f package.json ]; then npm run format; fi

# 代码检查
lint:
	@echo "检查 Go 代码..."
	@golangci-lint run ./...
	@echo "检查前端代码..."
	@cd $(FRONTEND_DIR) && if [ -f package.json ]; then npm run lint; fi

# 生成文档
docs:
	@echo "生成项目文档..."
	@godoc -http=:6060 &
	@echo "文档服务已启动，访问 http://localhost:6060"

# 帮助信息
help:
	@echo "可用的 make 命令："
	@echo "  build          - 构建所有服务"
	@echo "  test           - 运行所有测试"
	@echo "  clean          - 清理构建产物"
	@echo "  docker-build   - 构建 Docker 镜像"
	@echo "  docker-up      - 启动 Docker 环境"
	@echo "  docker-down    - 停止 Docker 环境"
	@echo "  status         - 查看服务状态"
	@echo "  logs           - 查看服务日志"
	@echo "  init           - 初始化开发环境"
	@echo "  fmt            - 格式化代码"
	@echo "  lint           - 代码检查"
	@echo "  docs           - 生成文档"
	@echo "  help           - 显示帮助信息"
