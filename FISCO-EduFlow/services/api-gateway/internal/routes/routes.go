package routes

import (
	"fmt"
	"time"

	"github.com/blockchain-education-platform/api-gateway/internal/handlers"
	"github.com/blockchain-education-platform/api-gateway/internal/middleware"
	"github.com/blockchain-education-platform/api-gateway/internal/types"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置路由
func SetupRoutes(
	gatewayHandler *handlers.GatewayHandler,
	authMiddleware *middleware.AuthMiddleware,
	rateLimiter *middleware.RateLimiter,
	userRateLimiter *middleware.UserBasedRateLimiter,
) *gin.Engine {
	// 创建Gin引擎
	r := gin.Default()

	// 全局中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(CORSMiddleware())
	r.Use(RequestIDMiddleware())
	r.Use(LoggingMiddleware())

	// 全局限流
	r.Use(rateLimiter.RateLimitMiddleware())

	// 健康检查（无需认证）
	r.GET("/health", gatewayHandler.Health)

	// 认证相关路由（无需认证）
	auth := r.Group("/auth")
	{
		auth.POST("/login", gatewayHandler.Login)
		auth.POST("/refresh", gatewayHandler.RefreshToken)
	}

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 公开的API（可选认证）
		public := v1.Group("/public")
		public.Use(authMiddleware.OptionalAuth())
		{
			// 密码学服务
			crypto := public.Group("/crypto")
			{
				crypto.POST("/keys/generate", gatewayHandler.CryptoGenerateKeyPair)
				crypto.POST("/hash", gatewayHandler.CryptoHash)
				crypto.POST("/sign", gatewayHandler.CryptoSign)
				crypto.POST("/verify", gatewayHandler.CryptoVerify)
			}

			// Merkle树服务
			merkle := public.Group("/merkle")
			{
				merkle.POST("/build", gatewayHandler.MerkleBuildTree)
			}
		}

		// 需要认证的API
		protected := v1.Group("/")
		protected.Use(authMiddleware.RequireAuth())
		protected.Use(userRateLimiter.UserRateLimitMiddleware())
		{
			// 用户信息
			protected.GET("/user/info", gatewayHandler.GetUserInfo)

			// 代理请求
			protected.POST("/proxy", gatewayHandler.ProxyRequest)

			// 学生专用API
			student := protected.Group("/student")
			student.Use(authMiddleware.RequireRole(types.RoleStudent))
			{
				// 学生相关的API端点
				student.GET("/profile", func(c *gin.Context) {
					// 获取学生档案
				})
				student.POST("/certification/apply", func(c *gin.Context) {
					// 申请认证
				})
			}

			// 学校专用API
			school := protected.Group("/school")
			school.Use(authMiddleware.RequireRole(types.RoleSchool))
			{
				// 学校相关的API端点
				school.POST("/student/profile", func(c *gin.Context) {
					// 添加学生档案
				})
				school.PUT("/student/profile/:id", func(c *gin.Context) {
					// 更新学生档案
				})
			}

			// 用人单位专用API
			employer := protected.Group("/employer")
			employer.Use(authMiddleware.RequireRole(types.RoleEmployer))
			{
				// 用人单位相关的API端点
				employer.POST("/certification/initiate", func(c *gin.Context) {
					// 发起认证
				})
				employer.GET("/certification/requests", func(c *gin.Context) {
					// 获取认证请求列表
				})
			}

			// 管理员专用API
			admin := protected.Group("/admin")
			admin.Use(authMiddleware.RequireRole(types.RoleAdmin))
			{
				// 管理员相关的API端点
				admin.GET("/users", func(c *gin.Context) {
					// 获取用户列表
				})
				admin.POST("/school/authorize", func(c *gin.Context) {
					// 授权学校
				})
				admin.POST("/employer/verify", func(c *gin.Context) {
					// 验证用人单位
				})
			}
		}
	}

	return r
}

// CORSMiddleware CORS中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Request-ID")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Header("Access-Control-Expose-Headers", "X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RequestIDMiddleware 请求ID中间件
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}

// LoggingMiddleware 日志中间件
func LoggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[%s] %s %s %d %s %s %s\n",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
			param.ClientIP,
			param.ErrorMessage,
		)
	})
}

// generateRequestID 生成请求ID
func generateRequestID() string {
	// 简单的请求ID生成，实际应该使用更好的方法
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
