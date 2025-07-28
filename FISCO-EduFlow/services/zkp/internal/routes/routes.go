package routes

import (
	"github.com/blockchain-education-platform/zkp-service/internal/handlers"
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
	zkpHandler := handlers.NewZKPHandler()

	// 健康检查
	r.GET("/health", zkpHandler.Health)

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// 证明生成和验证
		proofs := v1.Group("/proofs")
		{
			proofs.POST("/generate", zkpHandler.GenerateProof)
			proofs.POST("/verify", zkpHandler.VerifyProof)
			proofs.POST("/batch-generate", zkpHandler.BatchGenerateProofs)
		}

		// 特定类型的证明
		education := v1.Group("/education")
		{
			education.POST("/proof", zkpHandler.GenerateEducationProof)
		}

		age := v1.Group("/age")
		{
			age.POST("/proof", zkpHandler.GenerateAgeProof)
		}

		// 电路管理
		circuits := v1.Group("/circuits")
		{
			circuits.GET("/", zkpHandler.GetSupportedCircuits)
			circuits.GET("/:type", zkpHandler.GetCircuitInfo)
			circuits.GET("/:type/template", zkpHandler.GetProofTemplate)
			circuits.POST("/validate", zkpHandler.ValidateCircuitInputs)
		}

		// 统计信息
		stats := v1.Group("/stats")
		{
			stats.GET("/", zkpHandler.GetStatistics)
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
