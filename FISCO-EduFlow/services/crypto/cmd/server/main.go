package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/xueliantong/blockchain-platform/services/crypto/internal/config"
	"github.com/xueliantong/blockchain-platform/services/crypto/internal/handler"
	"github.com/xueliantong/blockchain-platform/services/crypto/internal/service"
)

var (
	cfgFile string
	port    string
	debug   bool
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "crypto-server",
	Short: "学链通密码学服务",
	Long: `学链通密码学服务提供以下功能:
- SHA256哈希计算
- ECDSA数字签名
- 区块头签名验证
- 学历数据签名
- Merkle Tree计算`,
	Run: runServer,
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "配置文件路径 (默认: ./config.yaml)")
	rootCmd.PersistentFlags().StringVarP(&port, "port", "p", "8081", "服务端口")
	rootCmd.PersistentFlags().BoolVarP(&debug, "debug", "d", false, "启用调试模式")
}

// initConfig reads in config file and ENV variables.
func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.AddConfigPath(".")
		viper.AddConfigPath("./config")
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
	}

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		logrus.Info("使用配置文件:", viper.ConfigFileUsed())
	}

	// 设置默认值
	viper.SetDefault("server.port", "8081")
	viper.SetDefault("server.mode", "release")
	viper.SetDefault("log.level", "info")
	viper.SetDefault("crypto.curve", "secp256k1")
	viper.SetDefault("crypto.hash_algorithm", "SHA256")
}

func runServer(cmd *cobra.Command, args []string) {
	// 初始化日志
	initLogger()

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		logrus.Fatalf("加载配置失败: %v", err)
	}

	// 初始化服务
	cryptoService := service.NewCryptoService(cfg)
	hashService := service.NewHashService(cfg)
	signatureService := service.NewSignatureService(cfg)

	// 初始化处理器
	cryptoHandler := handler.NewCryptoHandler(cryptoService)
	hashHandler := handler.NewHashHandler(hashService)
	signatureHandler := handler.NewSignatureHandler(signatureService)

	// 设置Gin模式
	if debug || cfg.Server.Mode == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建路由
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"service":   "crypto-service",
			"version":   "1.0.0",
			"timestamp": time.Now().Unix(),
		})
	})

	// API路由组
	v1 := router.Group("/api/v1")
	{
		// 哈希相关API
		hash := v1.Group("/hash")
		{
			hash.POST("/sha256", hashHandler.SHA256Hash)
			hash.POST("/block-header", hashHandler.BlockHeaderHash)
			hash.POST("/transaction", hashHandler.TransactionHash)
			hash.POST("/student-data", hashHandler.StudentDataHash)
			hash.POST("/merkle-root", hashHandler.MerkleRootHash)
		}

		// 签名相关API
		signature := v1.Group("/signature")
		{
			signature.POST("/sign", signatureHandler.Sign)
			signature.POST("/verify", signatureHandler.Verify)
			signature.POST("/sign-with-timestamp", signatureHandler.SignWithTimestamp)
			signature.POST("/verify-with-timestamp", signatureHandler.VerifyWithTimestamp)
			signature.POST("/block-header-sign", signatureHandler.BlockHeaderSign)
			signature.POST("/student-data-sign", signatureHandler.StudentDataSign)
		}

		// 密钥相关API
		crypto := v1.Group("/crypto")
		{
			crypto.POST("/generate-keypair", cryptoHandler.GenerateKeyPair)
			crypto.POST("/derive-address", cryptoHandler.DeriveAddress)
			crypto.GET("/public-key/:private-key", cryptoHandler.GetPublicKey)
		}

		// 工具API
		utils := v1.Group("/utils")
		{
			utils.POST("/hex-encode", cryptoHandler.HexEncode)
			utils.POST("/hex-decode", cryptoHandler.HexDecode)
			utils.POST("/base64-encode", cryptoHandler.Base64Encode)
			utils.POST("/base64-decode", cryptoHandler.Base64Decode)
		}
	}

	// 使用配置中的端口，如果命令行指定了端口则优先使用
	serverPort := cfg.Server.Port
	if port != "8081" {
		serverPort = port
	}

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", serverPort),
		Handler: router,
	}

	// 启动服务器
	go func() {
		logrus.Infof("密码学服务启动在端口 %s", serverPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("服务器启动失败: %v", err)
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logrus.Info("正在关闭服务器...")

	// 5秒超时的上下文
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logrus.Fatalf("服务器强制关闭: %v", err)
	}

	logrus.Info("服务器已退出")
}

func initLogger() {
	// 设置日志格式
	logrus.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
	})

	// 设置日志级别
	level := viper.GetString("log.level")
	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "info":
		logrus.SetLevel(logrus.InfoLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}

	if debug {
		logrus.SetLevel(logrus.DebugLevel)
	}

	logrus.Info("日志系统初始化完成")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		log.Fatal(err)
	}
}
