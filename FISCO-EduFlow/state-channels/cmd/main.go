package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/channel"
	"github.com/blockchain-education-platform/state-channels/internal/handlers"
	"github.com/blockchain-education-platform/state-channels/internal/routes"
	"github.com/blockchain-education-platform/state-channels/internal/types"
	"github.com/blockchain-education-platform/state-channels/internal/websocket"
)

func main() {
	// 获取环境变量
	port := getEnv("PORT", "8080")
	serviceName := getEnv("SERVICE_NAME", "state-channels")
	logLevel := getEnv("LOG_LEVEL", "info")

	// 通道配置
	maxChannels := getEnvInt("MAX_CHANNELS", 1000)
	defaultExpiryHours := getEnvInt("DEFAULT_EXPIRY_HOURS", 24)
	maxMessageSize := getEnvInt("MAX_MESSAGE_SIZE", 1024)
	cleanupIntervalMinutes := getEnvInt("CLEANUP_INTERVAL_MINUTES", 60)

	// 打印启动信息
	log.Printf("Starting %s on port %s with log level %s", serviceName, port, logLevel)
	log.Printf("Max channels: %d, Default expiry: %d hours", maxChannels, defaultExpiryHours)

	// 创建通道配置
	config := types.ChannelConfig{
		MaxChannels:        maxChannels,
		DefaultExpiryHours: defaultExpiryHours,
		MaxMessageSize:     maxMessageSize,
		CleanupInterval:    time.Duration(cleanupIntervalMinutes) * time.Minute,
		BackupInterval:     time.Hour, // 每小时备份一次
	}

	// 创建通道管理器
	channelManager := channel.NewManager(config)

	// 创建WebSocket中心
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// 创建处理器
	channelHandler := handlers.NewChannelHandler(channelManager, wsHub)

	// 设置路由
	router := routes.SetupRoutes(channelHandler)

	// 创建HTTP服务器
	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// 启动服务器的goroutine
	go func() {
		log.Printf("State Channels service is running on port %s", port)
		log.Printf("Available endpoints:")
		log.Printf("  GET  /health - Health check")
		log.Printf("  GET  /ws - WebSocket connection")
		log.Printf("  POST /api/v1/channels - Create channel")
		log.Printf("  POST /api/v1/channels/accept - Accept channel")
		log.Printf("  POST /api/v1/channels/update - Update channel state")
		log.Printf("  POST /api/v1/channels/close - Close channel")
		log.Printf("  GET  /api/v1/channels - List channels")
		log.Printf("  GET  /api/v1/channels/:id - Get channel info")
		log.Printf("  POST /api/v1/messages - Send message")
		log.Printf("  GET  /api/v1/stats - Get statistics")

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

// getEnvInt 获取整数环境变量，如果不存在则返回默认值
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
