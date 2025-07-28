package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/blockchain-education-platform/api-gateway/internal/types"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware 认证中间件
type AuthMiddleware struct {
	jwtSecret []byte
}

// NewAuthMiddleware 创建认证中间件
func NewAuthMiddleware(jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: []byte(jwtSecret),
	}
}

// JWTClaims JWT声明
type JWTClaims struct {
	UserID   string         `json:"user_id"`
	Username string         `json:"username"`
	Role     types.UserRole `json:"role"`
	School   string         `json:"school,omitempty"`
	Company  string         `json:"company,omitempty"`
	jwt.RegisteredClaims
}

// GenerateToken 生成JWT令牌
func (a *AuthMiddleware) GenerateToken(user types.User, expiryHours int) (string, error) {
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		School:   user.School,
		Company:  user.Company,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "blockchain-education-platform",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(a.jwtSecret)
}

// GenerateRefreshToken 生成刷新令牌
func (a *AuthMiddleware) GenerateRefreshToken(userID string, expiryDays int) (string, error) {
	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryDays) * 24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    "blockchain-education-platform",
		Subject:   userID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(a.jwtSecret)
}

// ValidateToken 验证JWT令牌
func (a *AuthMiddleware) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return a.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrInvalidKey
}

// RequireAuth 需要认证的中间件
func (a *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, types.APIResponse{
				Success:   false,
				Error:     "Missing authorization header",
				Code:      401,
				Message:   "Authorization header is required",
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		// 检查Bearer前缀
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, types.APIResponse{
				Success:   false,
				Error:     "Invalid authorization header format",
				Code:      401,
				Message:   "Authorization header must be in format 'Bearer <token>'",
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		// 验证令牌
		claims, err := a.ValidateToken(tokenParts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, types.APIResponse{
				Success:   false,
				Error:     "Invalid token",
				Code:      401,
				Message:   err.Error(),
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("user_role", claims.Role)
		c.Set("school", claims.School)
		c.Set("company", claims.Company)

		c.Next()
	}
}

// RequireRole 需要特定角色的中间件
func (a *AuthMiddleware) RequireRole(roles ...types.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, types.APIResponse{
				Success:   false,
				Error:     "User role not found",
				Code:      401,
				Message:   "User must be authenticated",
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		role, ok := userRole.(types.UserRole)
		if !ok {
			c.JSON(http.StatusInternalServerError, types.APIResponse{
				Success:   false,
				Error:     "Invalid user role type",
				Code:      500,
				Message:   "Internal server error",
				Timestamp: time.Now(),
			})
			c.Abort()
			return
		}

		// 检查用户角色是否在允许的角色列表中
		for _, allowedRole := range roles {
			if role == allowedRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, types.APIResponse{
			Success:   false,
			Error:     "Insufficient permissions",
			Code:      403,
			Message:   "User does not have required role",
			Timestamp: time.Now(),
		})
		c.Abort()
	}
}

// OptionalAuth 可选认证中间件
func (a *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.Next()
			return
		}

		claims, err := a.ValidateToken(tokenParts[1])
		if err != nil {
			c.Next()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("user_role", claims.Role)
		c.Set("school", claims.School)
		c.Set("company", claims.Company)

		c.Next()
	}
}

// GetUserFromContext 从上下文获取用户信息
func GetUserFromContext(c *gin.Context) *types.User {
	userID, exists := c.Get("user_id")
	if !exists {
		return nil
	}

	username, _ := c.Get("username")
	userRole, _ := c.Get("user_role")
	school, _ := c.Get("school")
	company, _ := c.Get("company")

	user := &types.User{
		ID:       userID.(string),
		Username: username.(string),
		Role:     userRole.(types.UserRole),
	}

	if school != nil {
		user.School = school.(string)
	}

	if company != nil {
		user.Company = company.(string)
	}

	return user
}

// IsAuthenticated 检查用户是否已认证
func IsAuthenticated(c *gin.Context) bool {
	_, exists := c.Get("user_id")
	return exists
}

// HasRole 检查用户是否具有指定角色
func HasRole(c *gin.Context, role types.UserRole) bool {
	userRole, exists := c.Get("user_role")
	if !exists {
		return false
	}

	return userRole.(types.UserRole) == role
}

// HasAnyRole 检查用户是否具有任一指定角色
func HasAnyRole(c *gin.Context, roles ...types.UserRole) bool {
	userRole, exists := c.Get("user_role")
	if !exists {
		return false
	}

	role := userRole.(types.UserRole)
	for _, allowedRole := range roles {
		if role == allowedRole {
			return true
		}
	}

	return false
}

// IsSchoolUser 检查是否为学校用户
func IsSchoolUser(c *gin.Context) bool {
	return HasRole(c, types.RoleSchool)
}

// IsStudentUser 检查是否为学生用户
func IsStudentUser(c *gin.Context) bool {
	return HasRole(c, types.RoleStudent)
}

// IsEmployerUser 检查是否为用人单位用户
func IsEmployerUser(c *gin.Context) bool {
	return HasRole(c, types.RoleEmployer)
}

// IsAdminUser 检查是否为管理员用户
func IsAdminUser(c *gin.Context) bool {
	return HasRole(c, types.RoleAdmin)
}

// GetUserID 获取用户ID
func GetUserID(c *gin.Context) string {
	userID, exists := c.Get("user_id")
	if !exists {
		return ""
	}
	return userID.(string)
}

// GetUserRole 获取用户角色
func GetUserRole(c *gin.Context) types.UserRole {
	userRole, exists := c.Get("user_role")
	if !exists {
		return ""
	}
	return userRole.(types.UserRole)
}

// GetSchool 获取学校信息
func GetSchool(c *gin.Context) string {
	school, exists := c.Get("school")
	if !exists {
		return ""
	}
	return school.(string)
}

// GetCompany 获取公司信息
func GetCompany(c *gin.Context) string {
	company, exists := c.Get("company")
	if !exists {
		return ""
	}
	return company.(string)
}
