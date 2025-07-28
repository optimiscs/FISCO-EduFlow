package config

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config 应用配置结构
type Config struct {
	Server ServerConfig `mapstructure:"server"`
	Log    LogConfig    `mapstructure:"log"`
	Crypto CryptoConfig `mapstructure:"crypto"`
	Redis  RedisConfig  `mapstructure:"redis"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port         string `mapstructure:"port"`
	Mode         string `mapstructure:"mode"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
	Output string `mapstructure:"output"`
}

// CryptoConfig 密码学配置
type CryptoConfig struct {
	Curve         string `mapstructure:"curve"`
	HashAlgorithm string `mapstructure:"hash_algorithm"`
	KeySize       int    `mapstructure:"key_size"`
	SignatureAlg  string `mapstructure:"signature_algorithm"`
}

// RedisConfig Redis配置
type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	Database int    `mapstructure:"database"`
	PoolSize int    `mapstructure:"pool_size"`
}

// Load 加载配置
func Load() (*Config, error) {
	var cfg Config

	// 设置默认值
	setDefaults()

	// 解析配置
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("解析配置失败: %w", err)
	}

	// 验证配置
	if err := validate(&cfg); err != nil {
		return nil, fmt.Errorf("配置验证失败: %w", err)
	}

	return &cfg, nil
}

// setDefaults 设置默认配置值
func setDefaults() {
	// 服务器默认配置
	viper.SetDefault("server.port", "8081")
	viper.SetDefault("server.mode", "release")
	viper.SetDefault("server.read_timeout", 30)
	viper.SetDefault("server.write_timeout", 30)

	// 日志默认配置
	viper.SetDefault("log.level", "info")
	viper.SetDefault("log.format", "json")
	viper.SetDefault("log.output", "stdout")

	// 密码学默认配置
	viper.SetDefault("crypto.curve", "secp256k1")
	viper.SetDefault("crypto.hash_algorithm", "SHA256")
	viper.SetDefault("crypto.key_size", 256)
	viper.SetDefault("crypto.signature_algorithm", "ECDSA")

	// Redis默认配置
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.database", 0)
	viper.SetDefault("redis.pool_size", 10)
}

// validate 验证配置
func validate(cfg *Config) error {
	// 验证服务器配置
	if cfg.Server.Port == "" {
		return fmt.Errorf("服务器端口不能为空")
	}

	if cfg.Server.Mode != "debug" && cfg.Server.Mode != "release" {
		return fmt.Errorf("服务器模式必须是 debug 或 release")
	}

	// 验证日志配置
	validLogLevels := map[string]bool{
		"debug": true,
		"info":  true,
		"warn":  true,
		"error": true,
		"fatal": true,
	}
	if !validLogLevels[cfg.Log.Level] {
		return fmt.Errorf("无效的日志级别: %s", cfg.Log.Level)
	}

	// 验证密码学配置
	if cfg.Crypto.Curve != "secp256k1" {
		return fmt.Errorf("目前只支持 secp256k1 椭圆曲线")
	}

	if cfg.Crypto.HashAlgorithm != "SHA256" {
		return fmt.Errorf("目前只支持 SHA256 哈希算法")
	}

	if cfg.Crypto.KeySize != 256 {
		return fmt.Errorf("密钥长度必须是 256 位")
	}

	// 验证Redis配置
	if cfg.Redis.Host == "" {
		return fmt.Errorf("Redis主机地址不能为空")
	}

	if cfg.Redis.Port <= 0 || cfg.Redis.Port > 65535 {
		return fmt.Errorf("Redis端口必须在 1-65535 范围内")
	}

	return nil
}

// GetServerAddr 获取服务器地址
func (c *Config) GetServerAddr() string {
	return fmt.Sprintf(":%s", c.Server.Port)
}

// GetRedisAddr 获取Redis地址
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}

// IsDevelopment 是否为开发模式
func (c *Config) IsDevelopment() bool {
	return c.Server.Mode == "debug"
}

// IsProduction 是否为生产模式
func (c *Config) IsProduction() bool {
	return c.Server.Mode == "release"
}
