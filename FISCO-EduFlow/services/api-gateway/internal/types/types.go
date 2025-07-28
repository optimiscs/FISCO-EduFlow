package types

import (
	"time"
)

// ServiceConfig 服务配置
type ServiceConfig struct {
	Name    string `json:"name"`
	URL     string `json:"url"`
	Timeout int    `json:"timeout"` // 超时时间（秒）
	Retries int    `json:"retries"` // 重试次数
}

// GatewayConfig 网关配置
type GatewayConfig struct {
	Port     string                   `json:"port"`
	Services map[string]ServiceConfig `json:"services"`
	Auth     AuthConfig               `json:"auth"`
	RateLimit RateLimitConfig         `json:"rate_limit"`
}

// AuthConfig 认证配置
type AuthConfig struct {
	JWTSecret     string `json:"jwt_secret"`
	TokenExpiry   int    `json:"token_expiry"` // 令牌过期时间（小时）
	RefreshExpiry int    `json:"refresh_expiry"` // 刷新令牌过期时间（天）
}

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	RequestsPerMinute int `json:"requests_per_minute"`
	BurstSize         int `json:"burst_size"`
}

// User 用户信息
type User struct {
	ID       string    `json:"id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Role     UserRole  `json:"role"`
	School   string    `json:"school,omitempty"`
	Company  string    `json:"company,omitempty"`
	CreateAt time.Time `json:"created_at"`
}

// UserRole 用户角色
type UserRole string

const (
	RoleStudent  UserRole = "student"
	RoleSchool   UserRole = "school"
	RoleEmployer UserRole = "employer"
	RoleAdmin    UserRole = "admin"
)

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     UserRole `json:"role" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	User         User      `json:"user"`
}

// RefreshTokenRequest 刷新令牌请求
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// APIResponse 统一API响应格式
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Code      int         `json:"code"`
	Message   string      `json:"message,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	RequestID string      `json:"request_id,omitempty"`
}

// ProxyRequest 代理请求
type ProxyRequest struct {
	Service string                 `json:"service" binding:"required"`
	Method  string                 `json:"method" binding:"required"`
	Path    string                 `json:"path" binding:"required"`
	Headers map[string]string      `json:"headers,omitempty"`
	Query   map[string]string      `json:"query,omitempty"`
	Body    map[string]interface{} `json:"body,omitempty"`
}

// ProxyResponse 代理响应
type ProxyResponse struct {
	StatusCode int                    `json:"status_code"`
	Headers    map[string]string      `json:"headers"`
	Body       map[string]interface{} `json:"body"`
	Duration   int64                  `json:"duration_ms"`
}

// HealthCheckResponse 健康检查响应
type HealthCheckResponse struct {
	Status    string                     `json:"status"`
	Version   string                     `json:"version"`
	Timestamp time.Time                  `json:"timestamp"`
	Services  map[string]ServiceStatus   `json:"services"`
	Metrics   GatewayMetrics            `json:"metrics"`
}

// ServiceStatus 服务状态
type ServiceStatus struct {
	Name         string    `json:"name"`
	URL          string    `json:"url"`
	Status       string    `json:"status"` // "healthy", "unhealthy", "unknown"
	ResponseTime int64     `json:"response_time_ms"`
	LastCheck    time.Time `json:"last_check"`
	Error        string    `json:"error,omitempty"`
}

// GatewayMetrics 网关指标
type GatewayMetrics struct {
	TotalRequests    int64   `json:"total_requests"`
	SuccessRequests  int64   `json:"success_requests"`
	ErrorRequests    int64   `json:"error_requests"`
	AverageLatency   float64 `json:"average_latency_ms"`
	RequestsPerSecond float64 `json:"requests_per_second"`
	Uptime           int64   `json:"uptime_seconds"`
}

// RequestLog 请求日志
type RequestLog struct {
	ID            string            `json:"id"`
	Method        string            `json:"method"`
	Path          string            `json:"path"`
	Service       string            `json:"service,omitempty"`
	UserID        string            `json:"user_id,omitempty"`
	UserRole      UserRole          `json:"user_role,omitempty"`
	StatusCode    int               `json:"status_code"`
	Duration      int64             `json:"duration_ms"`
	RequestSize   int64             `json:"request_size_bytes"`
	ResponseSize  int64             `json:"response_size_bytes"`
	UserAgent     string            `json:"user_agent"`
	RemoteIP      string            `json:"remote_ip"`
	Headers       map[string]string `json:"headers,omitempty"`
	Error         string            `json:"error,omitempty"`
	Timestamp     time.Time         `json:"timestamp"`
}

// RateLimitInfo 限流信息
type RateLimitInfo struct {
	Limit     int       `json:"limit"`
	Remaining int       `json:"remaining"`
	Reset     time.Time `json:"reset"`
	RetryAfter int      `json:"retry_after,omitempty"`
}

// ServiceDiscoveryRequest 服务发现请求
type ServiceDiscoveryRequest struct {
	ServiceName string `json:"service_name" binding:"required"`
}

// ServiceDiscoveryResponse 服务发现响应
type ServiceDiscoveryResponse struct {
	Services []ServiceInfo `json:"services"`
	Total    int           `json:"total"`
}

// ServiceInfo 服务信息
type ServiceInfo struct {
	Name        string            `json:"name"`
	URL         string            `json:"url"`
	Version     string            `json:"version"`
	Status      string            `json:"status"`
	Endpoints   []EndpointInfo    `json:"endpoints"`
	Metadata    map[string]string `json:"metadata"`
	LastUpdated time.Time         `json:"last_updated"`
}

// EndpointInfo 端点信息
type EndpointInfo struct {
	Path        string   `json:"path"`
	Method      string   `json:"method"`
	Description string   `json:"description"`
	Parameters  []string `json:"parameters,omitempty"`
	AuthRequired bool    `json:"auth_required"`
}

// CircuitBreakerConfig 熔断器配置
type CircuitBreakerConfig struct {
	MaxRequests      uint32        `json:"max_requests"`
	Interval         time.Duration `json:"interval"`
	Timeout          time.Duration `json:"timeout"`
	ReadyToTrip      func(counts Counts) bool `json:"-"`
	OnStateChange    func(name string, from State, to State) `json:"-"`
}

// Counts 计数器
type Counts struct {
	Requests             uint32
	TotalSuccesses       uint32
	TotalFailures        uint32
	ConsecutiveSuccesses uint32
	ConsecutiveFailures  uint32
}

// State 熔断器状态
type State int

const (
	StateClosed State = iota
	StateHalfOpen
	StateOpen
)

// LoadBalancerConfig 负载均衡配置
type LoadBalancerConfig struct {
	Strategy string   `json:"strategy"` // "round_robin", "random", "weighted"
	Servers  []Server `json:"servers"`
}

// Server 服务器信息
type Server struct {
	URL    string `json:"url"`
	Weight int    `json:"weight"`
	Active bool   `json:"active"`
}

// CacheConfig 缓存配置
type CacheConfig struct {
	Enabled    bool          `json:"enabled"`
	TTL        time.Duration `json:"ttl"`
	MaxSize    int           `json:"max_size"`
	Strategies []string      `json:"strategies"` // "memory", "redis"
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	CORS         CORSConfig         `json:"cors"`
	HTTPS        HTTPSConfig        `json:"https"`
	IPWhitelist  []string          `json:"ip_whitelist"`
	IPBlacklist  []string          `json:"ip_blacklist"`
	RequestSize  RequestSizeConfig  `json:"request_size"`
}

// CORSConfig CORS配置
type CORSConfig struct {
	AllowOrigins     []string `json:"allow_origins"`
	AllowMethods     []string `json:"allow_methods"`
	AllowHeaders     []string `json:"allow_headers"`
	ExposeHeaders    []string `json:"expose_headers"`
	AllowCredentials bool     `json:"allow_credentials"`
	MaxAge           int      `json:"max_age"`
}

// HTTPSConfig HTTPS配置
type HTTPSConfig struct {
	Enabled  bool   `json:"enabled"`
	CertFile string `json:"cert_file"`
	KeyFile  string `json:"key_file"`
	Redirect bool   `json:"redirect"`
}

// RequestSizeConfig 请求大小限制配置
type RequestSizeConfig struct {
	MaxHeaderSize int64 `json:"max_header_size"`
	MaxBodySize   int64 `json:"max_body_size"`
}

// MonitoringConfig 监控配置
type MonitoringConfig struct {
	Metrics    MetricsConfig    `json:"metrics"`
	Logging    LoggingConfig    `json:"logging"`
	Tracing    TracingConfig    `json:"tracing"`
	Alerting   AlertingConfig   `json:"alerting"`
}

// MetricsConfig 指标配置
type MetricsConfig struct {
	Enabled   bool   `json:"enabled"`
	Path      string `json:"path"`
	Namespace string `json:"namespace"`
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Level      string `json:"level"`
	Format     string `json:"format"` // "json", "text"
	Output     string `json:"output"` // "stdout", "file"
	Filename   string `json:"filename,omitempty"`
	MaxSize    int    `json:"max_size,omitempty"`
	MaxBackups int    `json:"max_backups,omitempty"`
	MaxAge     int    `json:"max_age,omitempty"`
}

// TracingConfig 链路追踪配置
type TracingConfig struct {
	Enabled     bool   `json:"enabled"`
	ServiceName string `json:"service_name"`
	Endpoint    string `json:"endpoint"`
	SampleRate  float64 `json:"sample_rate"`
}

// AlertingConfig 告警配置
type AlertingConfig struct {
	Enabled   bool              `json:"enabled"`
	Rules     []AlertRule       `json:"rules"`
	Channels  []AlertChannel    `json:"channels"`
}

// AlertRule 告警规则
type AlertRule struct {
	Name        string            `json:"name"`
	Condition   string            `json:"condition"`
	Threshold   float64           `json:"threshold"`
	Duration    time.Duration     `json:"duration"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}

// AlertChannel 告警通道
type AlertChannel struct {
	Type   string            `json:"type"` // "email", "webhook", "slack"
	Config map[string]string `json:"config"`
}
