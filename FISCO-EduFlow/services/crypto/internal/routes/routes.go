package routes

import (
	"github.com/blockchain-education-platform/crypto-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置路由
func SetupRoutes() *gin.Engine {
	// 创建Gin引擎
	r := gin.Default()

	// 添加中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(CORSMiddleware())

	// 创建处理器
	cryptoHandler := handlers.NewCryptoHandler()

	// 健康检查
	r.GET("/health", cryptoHandler.Health)

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 密钥管理
		keys := v1.Group("/keys")
		{
			keys.POST("/generate", cryptoHandler.GenerateKeyPair)
		}

		// 哈希计算
		hash := v1.Group("/hash")
		{
			hash.POST("/sha256", cryptoHandler.Hash)
		}

		// 数字签名
		signature := v1.Group("/signature")
		{
			signature.POST("/sign", cryptoHandler.Sign)
			signature.POST("/verify", cryptoHandler.Verify)
		}

		// VRF相关
		vrf := v1.Group("/vrf")
		{
			vrf.POST("/generate", cryptoHandler.VRFGenerate)
			vrf.POST("/verify", cryptoHandler.VRFVerify)
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
