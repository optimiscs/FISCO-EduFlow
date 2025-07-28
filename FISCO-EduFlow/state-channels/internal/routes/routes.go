package routes

import (
	"github.com/blockchain-education-platform/state-channels/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置路由
func SetupRoutes(channelHandler *handlers.ChannelHandler) *gin.Engine {
	// 创建Gin引擎
	r := gin.Default()

	// 添加中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(CORSMiddleware())

	// 健康检查
	r.GET("/health", channelHandler.Health)

	// WebSocket连接
	r.GET("/ws", channelHandler.WebSocket)

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 通道管理
		channels := v1.Group("/channels")
		{
			channels.POST("/", channelHandler.CreateChannel)
			channels.POST("/accept", channelHandler.AcceptChannel)
			channels.POST("/update", channelHandler.UpdateState)
			channels.POST("/close", channelHandler.CloseChannel)
			channels.GET("/", channelHandler.ListChannels)
			channels.GET("/:id", channelHandler.GetChannel)
		}

		// 消息管理
		messages := v1.Group("/messages")
		{
			messages.POST("/", channelHandler.SendMessage)
		}

		// 统计信息
		stats := v1.Group("/stats")
		{
			stats.GET("/", channelHandler.GetStatistics)
		}
	}

	return r
}

// CORSMiddleware CORS中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
