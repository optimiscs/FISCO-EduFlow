package types

import (
	"crypto/ecdsa"
	"math/big"
)

// KeyPair 表示一个ECDSA密钥对
type KeyPair struct {
	PrivateKey *ecdsa.PrivateKey `json:"-"` // 私钥不序列化
	PublicKey  *ecdsa.PublicKey  `json:"public_key"`
	Address    string             `json:"address"`
}

// Signature 表示ECDSA签名
type Signature struct {
	R *big.Int `json:"r"`
	S *big.Int `json:"s"`
	V byte     `json:"v"`
}

// VRFProof 表示VRF证明
type VRFProof struct {
	Value []byte `json:"value"`
	Proof []byte `json:"proof"`
}

// HashRequest 哈希请求
type HashRequest struct {
	Data string `json:"data" binding:"required"`
}

// HashResponse 哈希响应
type HashResponse struct {
	Hash string `json:"hash"`
}

// KeyGenRequest 密钥生成请求
type KeyGenRequest struct {
	// 可以添加额外的参数，如熵源等
}

// KeyGenResponse 密钥生成响应
type KeyGenResponse struct {
	Address    string `json:"address"`
	PublicKey  string `json:"public_key"`
	PrivateKey string `json:"private_key,omitempty"` // 仅在安全环境下返回
}

// SignRequest 签名请求
type SignRequest struct {
	PrivateKey string `json:"private_key" binding:"required"`
	Data       string `json:"data" binding:"required"`
}

// SignResponse 签名响应
type SignResponse struct {
	Signature string `json:"signature"`
	R         string `json:"r"`
	S         string `json:"s"`
	V         string `json:"v"`
}

// VerifyRequest 验证请求
type VerifyRequest struct {
	PublicKey string `json:"public_key" binding:"required"`
	Data      string `json:"data" binding:"required"`
	Signature string `json:"signature" binding:"required"`
}

// VerifyResponse 验证响应
type VerifyResponse struct {
	Valid bool `json:"valid"`
}

// VRFGenerateRequest VRF生成请求
type VRFGenerateRequest struct {
	PrivateKey string `json:"private_key" binding:"required"`
	Seed       string `json:"seed" binding:"required"`
}

// VRFGenerateResponse VRF生成响应
type VRFGenerateResponse struct {
	Value string `json:"value"`
	Proof string `json:"proof"`
}

// VRFVerifyRequest VRF验证请求
type VRFVerifyRequest struct {
	PublicKey string `json:"public_key" binding:"required"`
	Seed      string `json:"seed" binding:"required"`
	Value     string `json:"value" binding:"required"`
	Proof     string `json:"proof" binding:"required"`
}

// VRFVerifyResponse VRF验证响应
type VRFVerifyResponse struct {
	Valid bool `json:"valid"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Version   string `json:"version"`
	Timestamp int64  `json:"timestamp"`
}
