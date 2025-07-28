package routes

import (
	"github.com/blockchain-education-platform/merkle-service/internal/cache"
	"github.com/blockchain-education-platform/merkle-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置路由
func SetupRoutes(cache *cache.RedisCache) *gin.Engine {
	// 创建Gin引擎
	r := gin.Default()

	// 添加中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(CORSMiddleware())

	// 创建处理器
	merkleHandler := handlers.NewMerkleHandler(cache)

	// 健康检查
	r.GET("/health", merkleHandler.Health)

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		// Merkle树操作
		trees := v1.Group("/trees")
		{
			trees.POST("/build", merkleHandler.BuildTree)
			trees.POST("/batch-build", merkleHandler.BatchBuild)
			trees.POST("/info", merkleHandler.GetTreeInfo)
			trees.PUT("/update", merkleHandler.UpdateTree)
			trees.POST("/compare", merkleHandler.CompareTrees)
		}

		// 证明操作
		proofs := v1.Group("/proofs")
		{
			proofs.POST("/generate", merkleHandler.GenerateProof)
			proofs.POST("/verify", merkleHandler.VerifyProof)
		}

		// 统计信息
		stats := v1.Group("/stats")
		{
			stats.GET("/", merkleHandler.GetStatistics)
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
