package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/blockchain-education-platform/zkp-service/internal/routes"
)

func main() {
	// 获取环境变量
	port := getEnv("PORT", "8080")
	serviceName := getEnv("SERVICE_NAME", "zkp-service")
	logLevel := getEnv("LOG_LEVEL", "info")

	// 打印启动信息
	log.Printf("Starting %s on port %s with log level %s", serviceName, port, logLevel)
	log.Printf("Initializing zero-knowledge proof circuits...")

	// 设置路由
	router := routes.SetupRoutes()

	// 创建HTTP服务器
	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// 启动服务器的goroutine
	go func() {
		log.Printf("Server is running on port %s", port)
		log.Printf("ZKP service is ready to generate and verify proofs")
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
