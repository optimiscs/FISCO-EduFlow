package crypto

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"hash"
	"time"
)

// HashService SHA256哈希服务
type HashService struct{}

// NewHashService 创建新的哈希服务实例
func NewHashService() *HashService {
	return &HashService{}
}

// SHA256 计算数据的SHA256哈希值
func (s *HashService) SHA256(data []byte) []byte {
	hash := sha256.Sum256(data)
	return hash[:]
}

// SHA256Hex 计算数据的SHA256哈希值并返回十六进制字符串
func (s *HashService) SHA256Hex(data []byte) string {
	hash := s.SHA256(data)
	return hex.EncodeToString(hash)
}

// SHA256String 计算字符串的SHA256哈希值
func (s *HashService) SHA256String(data string) []byte {
	return s.SHA256([]byte(data))
}

// SHA256StringHex 计算字符串的SHA256哈希值并返回十六进制字符串
func (s *HashService) SHA256StringHex(data string) string {
	return s.SHA256Hex([]byte(data))
}

// MultiSHA256 计算多个数据块的连续SHA256哈希值
func (s *HashService) MultiSHA256(data ...[]byte) []byte {
	hasher := sha256.New()
	for _, d := range data {
		hasher.Write(d)
	}
	return hasher.Sum(nil)
}

// MultiSHA256Hex 计算多个数据块的连续SHA256哈希值并返回十六进制字符串
func (s *HashService) MultiSHA256Hex(data ...[]byte) string {
	hash := s.MultiSHA256(data...)
	return hex.EncodeToString(hash)
}

// DoubleSHA256 计算双重SHA256哈希值（比特币风格）
func (s *HashService) DoubleSHA256(data []byte) []byte {
	first := s.SHA256(data)
	return s.SHA256(first)
}

// DoubleSHA256Hex 计算双重SHA256哈希值并返回十六进制字符串
func (s *HashService) DoubleSHA256Hex(data []byte) string {
	hash := s.DoubleSHA256(data)
	return hex.EncodeToString(hash)
}

// NewSHA256Hasher 创建新的SHA256哈希器，用于流式哈希计算
func (s *HashService) NewSHA256Hasher() hash.Hash {
	return sha256.New()
}

// ValidateHash 验证哈希值格式是否正确
func (s *HashService) ValidateHash(hashHex string) error {
	// 检查长度（SHA256哈希值应该是64个十六进制字符）
	if len(hashHex) != 64 {
		return fmt.Errorf("invalid hash length: expected 64, got %d", len(hashHex))
	}
	
	// 检查是否为有效的十六进制字符串
	_, err := hex.DecodeString(hashHex)
	if err != nil {
		return fmt.Errorf("invalid hex hash: %w", err)
	}
	
	return nil
}

// CompareHash 比较两个哈希值是否相等
func (s *HashService) CompareHash(hash1, hash2 string) bool {
	return hash1 == hash2
}

// HashFromHex 将十六进制字符串转换为字节数组
func (s *HashService) HashFromHex(hashHex string) ([]byte, error) {
	if err := s.ValidateHash(hashHex); err != nil {
		return nil, err
	}
	
	return hex.DecodeString(hashHex)
}

// HashToHex 将字节数组转换为十六进制字符串
func (s *HashService) HashToHex(hash []byte) string {
	return hex.EncodeToString(hash)
}

// HMACSHA256 计算HMAC-SHA256
func (s *HashService) HMACSHA256(key, data []byte) []byte {
	// 简化的HMAC实现，实际应用中建议使用crypto/hmac包
	if len(key) > 64 {
		key = s.SHA256(key)
	}
	
	// 填充密钥到64字节
	if len(key) < 64 {
		padded := make([]byte, 64)
		copy(padded, key)
		key = padded
	}
	
	// 创建内部和外部填充
	ipad := make([]byte, 64)
	opad := make([]byte, 64)
	
	for i := 0; i < 64; i++ {
		ipad[i] = key[i] ^ 0x36
		opad[i] = key[i] ^ 0x5c
	}
	
	// 计算内部哈希
	innerHash := s.MultiSHA256(ipad, data)
	
	// 计算外部哈希
	return s.MultiSHA256(opad, innerHash)
}

// HMACSHA256Hex 计算HMAC-SHA256并返回十六进制字符串
func (s *HashService) HMACSHA256Hex(key, data []byte) string {
	hash := s.HMACSHA256(key, data)
	return hex.EncodeToString(hash)
}

// GenerateRandomHash 生成随机哈希值（用于测试）
func (s *HashService) GenerateRandomHash() ([]byte, error) {
	// 生成32字节随机数据
	randomData := make([]byte, 32)
	_, err := rand.Read(randomData)
	if err != nil {
		return nil, fmt.Errorf("failed to generate random data: %w", err)
	}
	
	// 返回随机数据的哈希值
	return s.SHA256(randomData), nil
}

// GenerateRandomHashHex 生成随机哈希值并返回十六进制字符串
func (s *HashService) GenerateRandomHashHex() (string, error) {
	hash, err := s.GenerateRandomHash()
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(hash), nil
}

// ========== 区块链特定哈希函数 ==========

// HashBlockHeader 计算区块头哈希
// 区块头由32字节的上一个区块的哈希值、32字节的Merkle根哈希值、
// 4字节的时间戳、4字节的当前难度值、4字节的随机数组成
func (s *HashService) HashBlockHeader(prevHash []byte, merkleRoot []byte,
	timestamp uint32, difficulty uint32, nonce uint32) []byte {

	// 构建区块头数据 (总共76字节)
	headerData := make([]byte, 76)

	// 32字节：上一个区块的哈希值
	copy(headerData[0:32], prevHash)

	// 32字节：Merkle根哈希值
	copy(headerData[32:64], merkleRoot)

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

	return s.SHA256(headerData)
}

// HashTransaction 计算交易哈希
// 用于学历全流程管理信息交易过程，系统会自动利用用户的私钥签署数字签名
func (s *HashService) HashTransaction(from, to string, value uint64,
	data []byte, timestamp uint32, txType string, signature []byte) []byte {

	// 构建交易数据，包含数字签名
	txData := fmt.Sprintf("%s%s%d%s%d%s",
		from, to, value, string(data), timestamp, txType)

	// 将签名附加在末尾
	fullTxData := append([]byte(txData), signature...)

	return s.SHA256(fullTxData)
}

// HashEducationData 计算学历数据哈希
// 专门用于学历认证数据的完整性验证
func (s *HashService) HashEducationData(studentID, institutionID,
	certificateType, certificateData string) []byte {

	eduData := fmt.Sprintf("%s|%s|%s|%s",
		studentID, institutionID, certificateType, certificateData)

	return s.SHA256([]byte(eduData))
}

// VerifyBlockHeader 验证区块头哈希
func (s *HashService) VerifyBlockHeader(prevHash []byte, merkleRoot []byte,
	timestamp uint32, difficulty uint32, nonce uint32, expectedHash []byte) bool {

	actualHash := s.HashBlockHeader(prevHash, merkleRoot, timestamp, difficulty, nonce)
	return s.CompareHashBytes(actualHash, expectedHash)
}

// CompareHashBytes 比较两个字节数组哈希值是否相等
func (s *HashService) CompareHashBytes(hash1, hash2 []byte) bool {
	if len(hash1) != len(hash2) {
		return false
	}

	for i := range hash1 {
		if hash1[i] != hash2[i] {
			return false
		}
	}
	return true
}

// GenerateDataIntegrityProof 生成数据完整性证明
// 用于学历数据的完整性验证
func (s *HashService) GenerateDataIntegrityProof(data []byte) map[string]interface{} {
	hash := s.SHA256(data)
	timestamp := uint32(time.Now().Unix())

	// 生成时间戳哈希
	timestampHash := s.SHA256([]byte(fmt.Sprintf("%s%d", hex.EncodeToString(hash), timestamp)))

	return map[string]interface{}{
		"data_hash":      hex.EncodeToString(hash),
		"timestamp":      timestamp,
		"timestamp_hash": hex.EncodeToString(timestampHash),
		"algorithm":      "SHA256",
		"version":        "1.0",
	}
}

// VerifyDataIntegrityProof 验证数据完整性证明
func (s *HashService) VerifyDataIntegrityProof(data []byte, proof map[string]interface{}) bool {
	// 验证数据哈希
	expectedHashStr, ok := proof["data_hash"].(string)
	if !ok {
		return false
	}

	expectedHash, err := hex.DecodeString(expectedHashStr)
	if err != nil {
		return false
	}

	actualHash := s.SHA256(data)
	if !s.CompareHashBytes(actualHash, expectedHash) {
		return false
	}

	// 验证时间戳哈希
	timestamp, ok := proof["timestamp"].(uint32)
	if !ok {
		return false
	}

	expectedTimestampHashStr, ok := proof["timestamp_hash"].(string)
	if !ok {
		return false
	}

	expectedTimestampHash, err := hex.DecodeString(expectedTimestampHashStr)
	if err != nil {
		return false
	}

	timestampData := fmt.Sprintf("%s%d", expectedHashStr, timestamp)
	actualTimestampHash := s.SHA256([]byte(timestampData))

	return s.CompareHashBytes(actualTimestampHash, expectedTimestampHash)
}

// HashDigitalSignature 计算数字签名的哈希
// 数字签名是为了作为发送者的证明并且证明信息没有被篡改
func (s *HashService) HashDigitalSignature(message []byte, signature []byte) []byte {
	// 将消息和签名组合后计算哈希
	combined := append(message, signature...)
	return s.SHA256(combined)
}
