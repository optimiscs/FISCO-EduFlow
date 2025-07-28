package crypto

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/crypto/secp256k1"
)

// ECDSAService ECDSA密码学服务
// 数字签名是为了作为发送者的证明并且证明信息没有被篡改
// 本作品采用椭圆曲线数字签名的方法
type ECDSAService struct{}

// NewECDSAService 创建新的ECDSA服务实例
func NewECDSAService() *ECDSAService {
	return &ECDSAService{}
}

// GenerateKeyPair 生成ECDSA密钥对
// 用于学历全流程管理认证系统中的用户身份验证
func (s *ECDSAService) GenerateKeyPair() (*ecdsa.PrivateKey, error) {
	// 使用secp256k1曲线生成密钥对
	privateKey, err := ecdsa.GenerateKey(secp256k1.S256(), rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}
	return privateKey, nil
}

// PrivateKeyToHex 将私钥转换为十六进制字符串
func (s *ECDSAService) PrivateKeyToHex(privateKey *ecdsa.PrivateKey) string {
	return hex.EncodeToString(crypto.FromECDSA(privateKey))
}

// HexToPrivateKey 将十六进制字符串转换为私钥
func (s *ECDSAService) HexToPrivateKey(hexKey string) (*ecdsa.PrivateKey, error) {
	privateKeyBytes, err := hex.DecodeString(hexKey)
	if err != nil {
		return nil, fmt.Errorf("invalid hex private key: %w", err)
	}
	
	privateKey, err := crypto.ToECDSA(privateKeyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to convert to ECDSA private key: %w", err)
	}
	
	return privateKey, nil
}

// PublicKeyToHex 将公钥转换为十六进制字符串
func (s *ECDSAService) PublicKeyToHex(publicKey *ecdsa.PublicKey) string {
	return hex.EncodeToString(crypto.FromECDSAPub(publicKey))
}

// HexToPublicKey 将十六进制字符串转换为公钥
func (s *ECDSAService) HexToPublicKey(hexKey string) (*ecdsa.PublicKey, error) {
	publicKeyBytes, err := hex.DecodeString(hexKey)
	if err != nil {
		return nil, fmt.Errorf("invalid hex public key: %w", err)
	}
	
	publicKey, err := crypto.UnmarshalPubkey(publicKeyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal public key: %w", err)
	}
	
	return publicKey, nil
}

// GetAddress 从公钥获取以太坊地址
func (s *ECDSAService) GetAddress(publicKey *ecdsa.PublicKey) string {
	return crypto.PubkeyToAddress(*publicKey).Hex()
}

// Sign 使用私钥对数据进行签名
// 系统会自动利用用户的私钥签署一个数字签名，并将这个签名附加在末尾
func (s *ECDSAService) Sign(privateKey *ecdsa.PrivateKey, data []byte) ([]byte, error) {
	// 计算数据的SHA256哈希
	hash := sha256.Sum256(data)

	// 使用私钥签名哈希
	signature, err := crypto.Sign(hash[:], privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign data: %w", err)
	}

	return signature, nil
}

// Verify 验证签名
func (s *ECDSAService) Verify(publicKey *ecdsa.PublicKey, data []byte, signature []byte) bool {
	// 计算数据的SHA256哈希
	hash := sha256.Sum256(data)
	
	// 验证签名
	return crypto.VerifySignature(
		crypto.FromECDSAPub(publicKey),
		hash[:],
		signature[:len(signature)-1], // 移除recovery ID
	)
}

// RecoverPublicKey 从签名中恢复公钥
func (s *ECDSAService) RecoverPublicKey(data []byte, signature []byte) (*ecdsa.PublicKey, error) {
	// 计算数据的SHA256哈希
	hash := sha256.Sum256(data)
	
	// 从签名中恢复公钥
	publicKeyBytes, err := crypto.Ecrecover(hash[:], signature)
	if err != nil {
		return nil, fmt.Errorf("failed to recover public key: %w", err)
	}
	
	publicKey, err := crypto.UnmarshalPubkey(publicKeyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal recovered public key: %w", err)
	}
	
	return publicKey, nil
}

// SignatureToRSV 将签名转换为R、S、V组件
func (s *ECDSAService) SignatureToRSV(signature []byte) (r, s *big.Int, v byte, err error) {
	if len(signature) != 65 {
		return nil, nil, 0, fmt.Errorf("invalid signature length: expected 65, got %d", len(signature))
	}
	
	r = new(big.Int).SetBytes(signature[:32])
	s = new(big.Int).SetBytes(signature[32:64])
	v = signature[64]
	
	return r, s, v, nil
}

// RSVToSignature 将R、S、V组件转换为签名
func (s *ECDSAService) RSVToSignature(r, s *big.Int, v byte) []byte {
	signature := make([]byte, 65)
	copy(signature[:32], r.Bytes())
	copy(signature[32:64], s.Bytes())
	signature[64] = v
	return signature
}

// ValidatePrivateKey 验证私钥是否有效
func (s *ECDSAService) ValidatePrivateKey(privateKey *ecdsa.PrivateKey) error {
	if privateKey == nil {
		return fmt.Errorf("private key is nil")
	}
	
	if privateKey.D == nil || privateKey.D.Sign() <= 0 {
		return fmt.Errorf("invalid private key: D component is nil or non-positive")
	}
	
	// 检查私钥是否在有效范围内
	if privateKey.D.Cmp(secp256k1.S256().Params().N) >= 0 {
		return fmt.Errorf("invalid private key: D component exceeds curve order")
	}
	
	return nil
}

// ValidatePublicKey 验证公钥是否有效
func (s *ECDSAService) ValidatePublicKey(publicKey *ecdsa.PublicKey) error {
	if publicKey == nil {
		return fmt.Errorf("public key is nil")
	}
	
	if publicKey.X == nil || publicKey.Y == nil {
		return fmt.Errorf("invalid public key: X or Y component is nil")
	}
	
	// 检查公钥是否在曲线上
	if !secp256k1.S256().IsOnCurve(publicKey.X, publicKey.Y) {
		return fmt.Errorf("invalid public key: point is not on curve")
	}

	return nil
}

// ========== 区块链特定签名方法 ==========

// SignTransaction 对交易进行签名
// 专门用于学历全流程管理信息交易过程的签名
func (s *ECDSAService) SignTransaction(privateKey *ecdsa.PrivateKey,
	from, to string, value uint64, data []byte, timestamp uint32, txType string) ([]byte, error) {

	// 构建交易数据
	txData := fmt.Sprintf("%s%s%d%s%d%s",
		from, to, value, string(data), timestamp, txType)

	return s.Sign(privateKey, []byte(txData))
}

// SignEducationData 对学历数据进行签名
// 用于学历认证数据的数字签名
func (s *ECDSAService) SignEducationData(privateKey *ecdsa.PrivateKey,
	studentID, institutionID, certificateType, certificateData string) ([]byte, error) {

	eduData := fmt.Sprintf("%s|%s|%s|%s",
		studentID, institutionID, certificateType, certificateData)

	return s.Sign(privateKey, []byte(eduData))
}

// SignBlockHeader 对区块头进行签名
// 用于区块链网络中的区块验证
func (s *ECDSAService) SignBlockHeader(privateKey *ecdsa.PrivateKey,
	prevHash []byte, merkleRoot []byte, timestamp uint32, difficulty uint32, nonce uint32) ([]byte, error) {

	// 构建区块头数据 (76字节)
	headerData := make([]byte, 76)
	copy(headerData[0:32], prevHash)      // 32字节：上一个区块的哈希值
	copy(headerData[32:64], merkleRoot)   // 32字节：Merkle根哈希值

	// 4字节：时间戳
	headerData[64] = byte(timestamp >> 24)
	headerData[65] = byte(timestamp >> 16)
	headerData[66] = byte(timestamp >> 8)
	headerData[67] = byte(timestamp)

	// 4字节：难度值
	headerData[68] = byte(difficulty >> 24)
	headerData[69] = byte(difficulty >> 16)
	headerData[70] = byte(difficulty >> 8)
	headerData[71] = byte(difficulty)

	// 4字节：随机数
	headerData[72] = byte(nonce >> 24)
	headerData[73] = byte(nonce >> 16)
	headerData[74] = byte(nonce >> 8)
	headerData[75] = byte(nonce)

	return s.Sign(privateKey, headerData)
}

// VerifyTransaction 验证交易签名
func (s *ECDSAService) VerifyTransaction(publicKey *ecdsa.PublicKey,
	from, to string, value uint64, data []byte, timestamp uint32, txType string, signature []byte) bool {

	txData := fmt.Sprintf("%s%s%d%s%d%s",
		from, to, value, string(data), timestamp, txType)

	return s.Verify(publicKey, []byte(txData), signature)
}

// VerifyEducationData 验证学历数据签名
func (s *ECDSAService) VerifyEducationData(publicKey *ecdsa.PublicKey,
	studentID, institutionID, certificateType, certificateData string, signature []byte) bool {

	eduData := fmt.Sprintf("%s|%s|%s|%s",
		studentID, institutionID, certificateType, certificateData)

	return s.Verify(publicKey, []byte(eduData), signature)
}

// GenerateSignatureWithTimestamp 生成带时间戳的签名
// 用于防止重放攻击
func (s *ECDSAService) GenerateSignatureWithTimestamp(privateKey *ecdsa.PrivateKey, data []byte) ([]byte, uint32, error) {
	timestamp := uint32(time.Now().Unix())

	// 将时间戳附加到数据
	timestampedData := append(data, []byte(fmt.Sprintf("%d", timestamp))...)

	signature, err := s.Sign(privateKey, timestampedData)
	if err != nil {
		return nil, 0, err
	}

	return signature, timestamp, nil
}

// VerifySignatureWithTimestamp 验证带时间戳的签名
func (s *ECDSAService) VerifySignatureWithTimestamp(publicKey *ecdsa.PublicKey,
	data []byte, signature []byte, timestamp uint32, maxAge uint32) bool {

	// 检查时间戳是否过期
	currentTime := uint32(time.Now().Unix())
	if currentTime-timestamp > maxAge {
		return false
	}

	// 重构带时间戳的数据
	timestampedData := append(data, []byte(fmt.Sprintf("%d", timestamp))...)

	return s.Verify(publicKey, timestampedData, signature)
}
