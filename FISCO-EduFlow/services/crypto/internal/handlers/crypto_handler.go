package handlers

import (
	"encoding/hex"
	"net/http"
	"time"

	"github.com/blockchain-education-platform/crypto-service/internal/crypto"
	"github.com/blockchain-education-platform/crypto-service/internal/types"
	"github.com/gin-gonic/gin"
)

// CryptoHandler 密码学服务HTTP处理器
type CryptoHandler struct {
	ecdsaService *crypto.ECDSAService
	hashService  *crypto.HashService
	vrfService   *crypto.VRFService
}

// NewCryptoHandler 创建新的密码学处理器
func NewCryptoHandler() *CryptoHandler {
	return &CryptoHandler{
		ecdsaService: crypto.NewECDSAService(),
		hashService:  crypto.NewHashService(),
		vrfService:   crypto.NewVRFService(),
	}
}

// Health 健康检查
func (h *CryptoHandler) Health(c *gin.Context) {
	response := types.HealthResponse{
		Status:    "healthy",
		Service:   "crypto-service",
		Version:   "1.0.0",
		Timestamp: time.Now().Unix(),
	}
	c.JSON(http.StatusOK, response)
}

// GenerateKeyPair 生成ECDSA密钥对
func (h *CryptoHandler) GenerateKeyPair(c *gin.Context) {
	var req types.KeyGenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 生成密钥对
	privateKey, err := h.ecdsaService.GenerateKeyPair()
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to generate key pair",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	// 转换为十六进制字符串
	privateKeyHex := h.ecdsaService.PrivateKeyToHex(privateKey)
	publicKeyHex := h.ecdsaService.PublicKeyToHex(&privateKey.PublicKey)
	address := h.ecdsaService.GetAddress(&privateKey.PublicKey)

	response := types.KeyGenResponse{
		Address:    address,
		PublicKey:  publicKeyHex,
		PrivateKey: privateKeyHex,
	}

	c.JSON(http.StatusOK, response)
}

// Hash 计算SHA256哈希
func (h *CryptoHandler) Hash(c *gin.Context) {
	var req types.HashRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 计算哈希
	hash := h.hashService.SHA256StringHex(req.Data)

	response := types.HashResponse{
		Hash: hash,
	}

	c.JSON(http.StatusOK, response)
}

// Sign 数字签名
func (h *CryptoHandler) Sign(c *gin.Context) {
	var req types.SignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 解析私钥
	privateKey, err := h.ecdsaService.HexToPrivateKey(req.PrivateKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid private key",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 签名数据
	signature, err := h.ecdsaService.Sign(privateKey, []byte(req.Data))
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to sign data",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	// 提取R、S、V组件
	r, s, v, err := h.ecdsaService.SignatureToRSV(signature)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to extract signature components",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	response := types.SignResponse{
		Signature: hex.EncodeToString(signature),
		R:         hex.EncodeToString(r.Bytes()),
		S:         hex.EncodeToString(s.Bytes()),
		V:         hex.EncodeToString([]byte{v}),
	}

	c.JSON(http.StatusOK, response)
}

// Verify 验证签名
func (h *CryptoHandler) Verify(c *gin.Context) {
	var req types.VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 解析公钥
	publicKey, err := h.ecdsaService.HexToPublicKey(req.PublicKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid public key",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 解析签名
	signature, err := hex.DecodeString(req.Signature)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid signature",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 验证签名
	valid := h.ecdsaService.Verify(publicKey, []byte(req.Data), signature)

	response := types.VerifyResponse{
		Valid: valid,
	}

	c.JSON(http.StatusOK, response)
}

// VRFGenerate 生成VRF证明
func (h *CryptoHandler) VRFGenerate(c *gin.Context) {
	var req types.VRFGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 生成VRF证明
	proof, err := h.vrfService.GenerateFromHex(req.PrivateKey, req.Seed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to generate VRF proof",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	// 转换为十六进制
	valueHex, proofHex := h.vrfService.ProofToHex(proof)

	response := types.VRFGenerateResponse{
		Value: valueHex,
		Proof: proofHex,
	}

	c.JSON(http.StatusOK, response)
}

// VRFVerify 验证VRF证明
func (h *CryptoHandler) VRFVerify(c *gin.Context) {
	var req types.VRFVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 验证VRF证明
	valid, err := h.vrfService.VerifyFromHex(req.PublicKey, req.Seed, req.Value, req.Proof)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to verify VRF proof",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	response := types.VRFVerifyResponse{
		Valid: valid,
	}

	c.JSON(http.StatusOK, response)
}
