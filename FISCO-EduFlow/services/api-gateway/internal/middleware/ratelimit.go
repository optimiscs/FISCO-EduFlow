package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/blockchain-education-platform/api-gateway/internal/types"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// RateLimiter 限流器
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewRateLimiter 创建新的限流器
func NewRateLimiter(requestsPerMinute, burstSize int) *RateLimiter {
	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rate:     rate.Limit(float64(requestsPerMinute) / 60.0), // 转换为每秒请求数
		burst:    burstSize,
	}
}

// getLimiter 获取或创建限流器
func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.limiters[key]
	if !exists {
		limiter = rate.NewLimiter(rl.rate, rl.burst)
		rl.limiters[key] = limiter
	}

	return limiter
}

// cleanupLimiters 清理过期的限流器
func (rl *RateLimiter) cleanupLimiters() {
	ticker := time.NewTicker(time.Minute)
	go func() {
		for range ticker.C {
			rl.mu.Lock()
			for key, limiter := range rl.limiters {
				// 如果限流器在过去5分钟内没有被使用，则删除它
				if limiter.Tokens() == float64(rl.burst) {
					delete(rl.limiters, key)
				}
			}
			rl.mu.Unlock()
		}
	}()
}

// RateLimitMiddleware 限流中间件
func (rl *RateLimiter) RateLimitMiddleware() gin.HandlerFunc {
	// 启动清理协程
	rl.cleanupLimiters()

	return func(c *gin.Context) {
		// 使用IP地址作为限流键
		key := c.ClientIP()

		// 如果用户已认证，使用用户ID作为限流键
		if userID, exists := c.Get("user_id"); exists {
			key = fmt.Sprintf("user:%s", userID.(string))
		}

		limiter := rl.getLimiter(key)

		if !limiter.Allow() {
			// 计算重试时间
			reservation := limiter.Reserve()
			retryAfter := int(reservation.Delay().Seconds())
			reservation.Cancel() // 取消预约

			c.Header("X-RateLimit-Limit", fmt.Sprintf("%.0f", float64(rl.rate)*60))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Second*time.Duration(retryAfter)).Unix()))
			c.Header("Retry-After", fmt.Sprintf("%d", retryAfter))

			c.JSON(http.StatusTooManyRequests, types.APIResponse{
				Success:   false,
				Error:     "Rate limit exceeded",
				Code:      429,
				Message:   fmt.Sprintf("Too many requests. Try again in %d seconds", retryAfter),
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		// 设置限流信息头
		remaining := int(limiter.Tokens())
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%.0f", float64(rl.rate)*60))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Minute).Unix()))

		c.Next()
	}
}

// UserBasedRateLimiter 基于用户的限流器
type UserBasedRateLimiter struct {
	limiters map[string]*UserLimiter
	mu       sync.RWMutex
	config   map[types.UserRole]RateLimitConfig
}

// UserLimiter 用户限流器
type UserLimiter struct {
	limiter   *rate.Limiter
	lastUsed  time.Time
	userRole  types.UserRole
}

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	RequestsPerMinute int
	BurstSize         int
}

// NewUserBasedRateLimiter 创建基于用户的限流器
func NewUserBasedRateLimiter(config map[types.UserRole]RateLimitConfig) *UserBasedRateLimiter {
	return &UserBasedRateLimiter{
		limiters: make(map[string]*UserLimiter),
		config:   config,
	}
}

// getUserLimiter 获取或创建用户限流器
func (url *UserBasedRateLimiter) getUserLimiter(userID string, userRole types.UserRole) *rate.Limiter {
	url.mu.Lock()
	defer url.mu.Unlock()

	userLimiter, exists := url.limiters[userID]
	if !exists {
		config, configExists := url.config[userRole]
		if !configExists {
			// 使用默认配置
			config = RateLimitConfig{
				RequestsPerMinute: 60,
				BurstSize:         10,
			}
		}

		rateLim := rate.NewLimiter(rate.Limit(float64(config.RequestsPerMinute)/60.0), config.BurstSize)
		userLimiter = &UserLimiter{
			limiter:  rateLim,
			lastUsed: time.Now(),
			userRole: userRole,
		}
		url.limiters[userID] = userLimiter
	}

	userLimiter.lastUsed = time.Now()
	return userLimiter.limiter
}

// UserRateLimitMiddleware 用户限流中间件
func (url *UserBasedRateLimiter) UserRateLimitMiddleware() gin.HandlerFunc {
	// 启动清理协程
	url.cleanupUserLimiters()

	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			// 如果用户未认证，使用IP限流
			c.Next()
			return
		}

		userRole, roleExists := c.Get("user_role")
		if !roleExists {
			c.Next()
			return
		}

		limiter := url.getUserLimiter(userID.(string), userRole.(types.UserRole))

		if !limiter.Allow() {
			config := url.config[userRole.(types.UserRole)]
			reservation := limiter.Reserve()
			retryAfter := int(reservation.Delay().Seconds())
			reservation.Cancel()

			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerMinute))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Second*time.Duration(retryAfter)).Unix()))
			c.Header("Retry-After", fmt.Sprintf("%d", retryAfter))

			c.JSON(http.StatusTooManyRequests, types.APIResponse{
				Success:   false,
				Error:     "User rate limit exceeded",
				Code:      429,
				Message:   fmt.Sprintf("Too many requests for user. Try again in %d seconds", retryAfter),
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		// 设置限流信息头
		config := url.config[userRole.(types.UserRole)]
		remaining := int(limiter.Tokens())
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerMinute))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Minute).Unix()))

		c.Next()
	}
}

// cleanupUserLimiters 清理过期的用户限流器
func (url *UserBasedRateLimiter) cleanupUserLimiters() {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for range ticker.C {
			url.mu.Lock()
			cutoff := time.Now().Add(-10 * time.Minute)
			for userID, userLimiter := range url.limiters {
				if userLimiter.lastUsed.Before(cutoff) {
					delete(url.limiters, userID)
				}
			}
			url.mu.Unlock()
		}
	}()
}

// PathBasedRateLimiter 基于路径的限流器
type PathBasedRateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	config   map[string]RateLimitConfig
}

// NewPathBasedRateLimiter 创建基于路径的限流器
func NewPathBasedRateLimiter(config map[string]RateLimitConfig) *PathBasedRateLimiter {
	limiters := make(map[string]*rate.Limiter)
	for path, cfg := range config {
		limiters[path] = rate.NewLimiter(rate.Limit(float64(cfg.RequestsPerMinute)/60.0), cfg.BurstSize)
	}

	return &PathBasedRateLimiter{
		limiters: limiters,
		config:   config,
	}
}

// PathRateLimitMiddleware 路径限流中间件
func (prl *PathBasedRateLimiter) PathRateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path

		prl.mu.RLock()
		limiter, exists := prl.limiters[path]
		config, configExists := prl.config[path]
		prl.mu.RUnlock()

		if !exists || !configExists {
			c.Next()
			return
		}

		if !limiter.Allow() {
			reservation := limiter.Reserve()
			retryAfter := int(reservation.Delay().Seconds())
			reservation.Cancel()

			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerMinute))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Second*time.Duration(retryAfter)).Unix()))
			c.Header("Retry-After", fmt.Sprintf("%d", retryAfter))

			c.JSON(http.StatusTooManyRequests, types.APIResponse{
				Success:   false,
				Error:     "Path rate limit exceeded",
				Code:      429,
				Message:   fmt.Sprintf("Too many requests to %s. Try again in %d seconds", path, retryAfter),
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		// 设置限流信息头
		remaining := int(limiter.Tokens())
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", config.RequestsPerMinute))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Minute).Unix()))

		c.Next()
	}
}

// GetRateLimitInfo 获取限流信息
func GetRateLimitInfo(c *gin.Context) *types.RateLimitInfo {
	limit := c.GetHeader("X-RateLimit-Limit")
	remaining := c.GetHeader("X-RateLimit-Remaining")
	reset := c.GetHeader("X-RateLimit-Reset")
	retryAfter := c.GetHeader("Retry-After")

	info := &types.RateLimitInfo{}

	if limit != "" {
		fmt.Sscanf(limit, "%d", &info.Limit)
	}

	if remaining != "" {
		fmt.Sscanf(remaining, "%d", &info.Remaining)
	}

	if reset != "" {
		var resetUnix int64
		fmt.Sscanf(reset, "%d", &resetUnix)
		info.Reset = time.Unix(resetUnix, 0)
	}

	if retryAfter != "" {
		fmt.Sscanf(retryAfter, "%d", &info.RetryAfter)
	}

	return info
}
