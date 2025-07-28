package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/blockchain-education-platform/api-gateway/internal/clients"
	"github.com/blockchain-education-platform/api-gateway/internal/middleware"
	"github.com/blockchain-education-platform/api-gateway/internal/types"
	"github.com/gin-gonic/gin"
)

// GatewayHandler API网关处理器
type GatewayHandler struct {
	serviceClient *clients.ServiceClient
	cryptoClient  *clients.CryptoService
	merkleClient  *clients.MerkleService
	zkpClient     *clients.ZKPService
	authMiddleware *middleware.AuthMiddleware
}

// NewGatewayHandler 创建新的网关处理器
func NewGatewayHandler(
	serviceClient *clients.ServiceClient,
	cryptoClient *clients.CryptoService,
	merkleClient *clients.MerkleService,
	zkpClient *clients.ZKPService,
	authMiddleware *middleware.AuthMiddleware,
) *GatewayHandler {
	return &GatewayHandler{
		serviceClient:  serviceClient,
		cryptoClient:   cryptoClient,
		merkleClient:   merkleClient,
		zkpClient:      zkpClient,
		authMiddleware: authMiddleware,
	}
}

// Health 健康检查
func (h *GatewayHandler) Health(c *gin.Context) {
	services := map[string]types.ServiceStatus{}
	serviceNames := []string{"crypto", "merkle", "zkp"}

	for _, serviceName := range serviceNames {
		status, err := h.serviceClient.HealthCheck(serviceName)
		if err != nil {
			services[serviceName] = types.ServiceStatus{
				Name:   serviceName,
				Status: "unknown",
				Error:  err.Error(),
			}
		} else {
			services[serviceName] = *status
		}
	}

	response := types.HealthCheckResponse{
		Status:    "healthy",
		Version:   "1.0.0",
		Timestamp: time.Now(),
		Services:  services,
		Metrics: types.GatewayMetrics{
			TotalRequests:     0, // 这里应该从实际的指标存储中获取
			SuccessRequests:   0,
			ErrorRequests:     0,
			AverageLatency:    0,
			RequestsPerSecond: 0,
			Uptime:           0,
		},
	}

	c.JSON(http.StatusOK, response)
}

// Login 用户登录
func (h *GatewayHandler) Login(c *gin.Context) {
	var req types.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.APIResponse{
			Success:   false,
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 这里应该验证用户凭据
	// 为了演示，我们创建一个模拟用户
	user := types.User{
		ID:       "user123",
		Username: req.Username,
		Email:    req.Username + "@example.com",
		Role:     req.Role,
		CreateAt: time.Now(),
	}

	// 生成访问令牌
	accessToken, err := h.authMiddleware.GenerateToken(user, 24) // 24小时过期
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to generate access token",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 生成刷新令牌
	refreshToken, err := h.authMiddleware.GenerateRefreshToken(user.ID, 7) // 7天过期
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to generate refresh token",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	response := types.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(24 * time.Hour),
		User:         user,
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      response,
		Code:      200,
		Message:   "Login successful",
		Timestamp: time.Now(),
	})
}

// RefreshToken 刷新令牌
func (h *GatewayHandler) RefreshToken(c *gin.Context) {
	var req types.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.APIResponse{
			Success:   false,
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 验证刷新令牌
	claims, err := h.authMiddleware.ValidateToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.APIResponse{
			Success:   false,
			Error:     "Invalid refresh token",
			Code:      401,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 创建用户对象（这里应该从数据库获取）
	user := types.User{
		ID:       claims.UserID,
		Username: claims.Username,
		Role:     claims.Role,
		School:   claims.School,
		Company:  claims.Company,
	}

	// 生成新的访问令牌
	newAccessToken, err := h.authMiddleware.GenerateToken(user, 24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to generate new access token",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	response := types.LoginResponse{
		AccessToken:  newAccessToken,
		RefreshToken: req.RefreshToken, // 保持原刷新令牌
		ExpiresAt:    time.Now().Add(24 * time.Hour),
		User:         user,
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      response,
		Code:      200,
		Message:   "Token refreshed successfully",
		Timestamp: time.Now(),
	})
}

// ProxyRequest 代理请求
func (h *GatewayHandler) ProxyRequest(c *gin.Context) {
	var req types.ProxyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.APIResponse{
			Success:   false,
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 代理请求到目标服务
	resp, err := h.serviceClient.ProxyRequest(req.Service, req.Method, req.Path, req.Headers, req.Body)
	if err != nil {
		c.JSON(http.StatusBadGateway, types.APIResponse{
			Success:   false,
			Error:     "Failed to proxy request",
			Code:      502,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      resp,
		Code:      200,
		Message:   "Request proxied successfully",
		Timestamp: time.Now(),
	})
}

// CryptoGenerateKeyPair 生成密钥对
func (h *GatewayHandler) CryptoGenerateKeyPair(c *gin.Context) {
	result, err := h.cryptoClient.GenerateKeyPair()
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to generate key pair",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      result,
		Code:      200,
		Message:   "Key pair generated successfully",
		Timestamp: time.Now(),
	})
}

// CryptoHash 计算哈希
func (h *GatewayHandler) CryptoHash(c *gin.Context) {
	var req struct {
		Data string `json:"data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.APIResponse{
			Success:   false,
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	result, err := h.cryptoClient.Hash(req.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to compute hash",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      result,
		Code:      200,
		Message:   "Hash computed successfully",
		Timestamp: time.Now(),
	})
}

// CryptoSign 数字签名
func (h *GatewayHandler) CryptoSign(c *gin.Context) {
	var req struct {
		PrivateKey string `json:"private_key" binding:"required"`
		Data       string `json:"data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.APIResponse{
			Success:   false,
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	result, err := h.cryptoClient.Sign(req.PrivateKey, req.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to sign data",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      result,
		Code:      200,
		Message:   "Data signed successfully",
		Timestamp: time.Now(),
	})
}

// CryptoVerify 验证签名
func (h *GatewayHandler) CryptoVerify(c *gin.Context) {
	var req struct {
		PublicKey string `json:"public_key" binding:"required"`
		Data      string `json:"data" binding:"required"`
		Signature string `json:"signature" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.APIResponse{
			Success:   false,
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	result, err := h.cryptoClient.Verify(req.PublicKey, req.Data, req.Signature)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to verify signature",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      result,
		Code:      200,
		Message:   "Signature verified successfully",
		Timestamp: time.Now(),
	})
}

// MerkleBuildTree 构建Merkle树
func (h *GatewayHandler) MerkleBuildTree(c *gin.Context) {
	var req struct {
		Data []string `json:"data" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.APIResponse{
			Success:   false,
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	result, err := h.merkleClient.BuildTree(req.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.APIResponse{
			Success:   false,
			Error:     "Failed to build Merkle tree",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      result,
		Code:      200,
		Message:   "Merkle tree built successfully",
		Timestamp: time.Now(),
	})
}

// GetUserInfo 获取用户信息
func (h *GatewayHandler) GetUserInfo(c *gin.Context) {
	user := middleware.GetUserFromContext(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, types.APIResponse{
			Success:   false,
			Error:     "User not authenticated",
			Code:      401,
			Message:   "Authentication required",
			Timestamp: time.Now(),
		})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      user,
		Code:      200,
		Message:   "User info retrieved successfully",
		Timestamp: time.Now(),
	})
}
