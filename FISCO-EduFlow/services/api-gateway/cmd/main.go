package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/blockchain-education-platform/api-gateway/internal/clients"
	"github.com/blockchain-education-platform/api-gateway/internal/handlers"
	"github.com/blockchain-education-platform/api-gateway/internal/middleware"
	"github.com/blockchain-education-platform/api-gateway/internal/routes"
	"github.com/blockchain-education-platform/api-gateway/internal/types"
)

func main() {
	// 获取环境变量
	port := getEnv("PORT", "8080")
	serviceName := getEnv("SERVICE_NAME", "api-gateway")
	logLevel := getEnv("LOG_LEVEL", "info")
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key")

	// 服务配置
	cryptoServiceURL := getEnv("CRYPTO_SERVICE_URL", "http://crypto-service:8080")
	merkleServiceURL := getEnv("MERKLE_SERVICE_URL", "http://merkle-service:8080")
	zkpServiceURL := getEnv("ZKP_SERVICE_URL", "http://zkp-service:8080")

	// 打印启动信息
	log.Printf("Starting %s on port %s with log level %s", serviceName, port, logLevel)
	log.Printf("Crypto Service: %s", cryptoServiceURL)
	log.Printf("Merkle Service: %s", merkleServiceURL)
	log.Printf("ZKP Service: %s", zkpServiceURL)

	// 创建服务配置
	services := map[string]types.ServiceConfig{
		"crypto": {
			Name:    "crypto-service",
			URL:     cryptoServiceURL,
			Timeout: 30,
			Retries: 3,
		},
		"merkle": {
			Name:    "merkle-service",
			URL:     merkleServiceURL,
			Timeout: 60,
			Retries: 3,
		},
		"zkp": {
			Name:    "zkp-service",
			URL:     zkpServiceURL,
			Timeout: 120,
			Retries: 2,
		},
	}

	// 创建服务客户端
	serviceClient := clients.NewServiceClient(services)
	cryptoClient := clients.NewCryptoService(cryptoServiceURL)
	merkleClient := clients.NewMerkleService(merkleServiceURL)
	zkpClient := clients.NewZKPService(zkpServiceURL)

	// 创建认证中间件
	authMiddleware := middleware.NewAuthMiddleware(jwtSecret)

	// 创建限流器
	rateLimiter := middleware.NewRateLimiter(100, 20) // 每分钟100个请求，突发20个

	// 创建基于用户的限流器
	userRateLimitConfig := map[types.UserRole]middleware.RateLimitConfig{
		types.RoleStudent: {
			RequestsPerMinute: 60,
			BurstSize:         10,
		},
		types.RoleSchool: {
			RequestsPerMinute: 120,
			BurstSize:         20,
		},
		types.RoleEmployer: {
			RequestsPerMinute: 100,
			BurstSize:         15,
		},
		types.RoleAdmin: {
			RequestsPerMinute: 200,
			BurstSize:         30,
		},
	}
	userRateLimiter := middleware.NewUserBasedRateLimiter(userRateLimitConfig)

	// 创建网关处理器
	gatewayHandler := handlers.NewGatewayHandler(
		serviceClient,
		cryptoClient,
		merkleClient,
		zkpClient,
		authMiddleware,
	)

	// 设置路由
	router := routes.SetupRoutes(
		gatewayHandler,
		authMiddleware,
		rateLimiter,
		userRateLimiter,
	)

	// 创建HTTP服务器
	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// 启动服务器的goroutine
	go func() {
		log.Printf("API Gateway is running on port %s", port)
		log.Printf("Available endpoints:")
		log.Printf("  GET  /health - Health check")
		log.Printf("  POST /auth/login - User login")
		log.Printf("  POST /auth/refresh - Refresh token")
		log.Printf("  GET  /api/v1/user/info - Get user info (auth required)")
		log.Printf("  POST /api/v1/public/crypto/* - Crypto operations")
		log.Printf("  POST /api/v1/public/merkle/* - Merkle tree operations")
		log.Printf("  POST /api/v1/proxy - Proxy requests (auth required)")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// 设置5秒的超时时间来关闭服务器
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
