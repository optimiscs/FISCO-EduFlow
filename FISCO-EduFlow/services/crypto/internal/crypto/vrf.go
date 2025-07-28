package crypto

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/crypto/secp256k1"
)

// VRFService 可验证随机函数服务
type VRFService struct {
	ecdsaService *ECDSAService
	hashService  *HashService
}

// NewVRFService 创建新的VRF服务实例
func NewVRFService() *VRFService {
	return &VRFService{
		ecdsaService: NewECDSAService(),
		hashService:  NewHashService(),
	}
}

// VRFProof VRF证明结构
type VRFProof struct {
	Value []byte // VRF输出值
	Proof []byte // VRF证明
}

// Generate 生成VRF值和证明
// 基于ECDSA的简化VRF实现
func (s *VRFService) Generate(privateKey *ecdsa.PrivateKey, seed []byte) (*VRFProof, error) {
	if err := s.ecdsaService.ValidatePrivateKey(privateKey); err != nil {
		return nil, fmt.Errorf("invalid private key: %w", err)
	}

	// 1. 计算种子的哈希
	seedHash := s.hashService.SHA256(seed)

	// 2. 使用私钥对种子哈希进行签名
	signature, err := s.ecdsaService.Sign(privateKey, seedHash)
	if err != nil {
		return nil, fmt.Errorf("failed to sign seed hash: %w", err)
	}

	// 3. 从签名中提取R、S、V组件
	r, s_val, v, err := s.ecdsaService.SignatureToRSV(signature)
	if err != nil {
		return nil, fmt.Errorf("failed to extract RSV from signature: %w", err)
	}

	// 4. 计算VRF值：Hash(r || seed)
	rBytes := r.Bytes()
	vrfValue := s.hashService.MultiSHA256(rBytes, seed)

	// 5. 构造证明：包含签名和必要的验证信息
	proof := s.constructProof(r, s_val, v, seedHash)

	return &VRFProof{
		Value: vrfValue,
		Proof: proof,
	}, nil
}

// Verify 验证VRF证明
func (s *VRFService) Verify(publicKey *ecdsa.PublicKey, seed []byte, value []byte, proof []byte) (bool, error) {
	if err := s.ecdsaService.ValidatePublicKey(publicKey); err != nil {
		return false, fmt.Errorf("invalid public key: %w", err)
	}

	// 1. 解析证明
	r, s_val, v, seedHash, err := s.parseProof(proof)
	if err != nil {
		return false, fmt.Errorf("failed to parse proof: %w", err)
	}

	// 2. 验证种子哈希
	expectedSeedHash := s.hashService.SHA256(seed)
	if !s.hashService.CompareHash(hex.EncodeToString(seedHash), hex.EncodeToString(expectedSeedHash)) {
		return false, fmt.Errorf("seed hash mismatch")
	}

	// 3. 重构签名并验证
	signature := s.ecdsaService.RSVToSignature(r, s_val, v)
	if !s.ecdsaService.Verify(publicKey, seedHash, signature) {
		return false, fmt.Errorf("signature verification failed")
	}

	// 4. 重新计算VRF值并比较
	rBytes := r.Bytes()
	expectedValue := s.hashService.MultiSHA256(rBytes, seed)
	if !s.hashService.CompareHash(hex.EncodeToString(value), hex.EncodeToString(expectedValue)) {
		return false, fmt.Errorf("VRF value mismatch")
	}

	return true, nil
}

// GenerateFromHex 从十六进制私钥生成VRF
func (s *VRFService) GenerateFromHex(privateKeyHex string, seedHex string) (*VRFProof, error) {
	privateKey, err := s.ecdsaService.HexToPrivateKey(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	seed, err := hex.DecodeString(seedHex)
	if err != nil {
		return nil, fmt.Errorf("failed to decode seed: %w", err)
	}

	return s.Generate(privateKey, seed)
}

// VerifyFromHex 从十六进制数据验证VRF
func (s *VRFService) VerifyFromHex(publicKeyHex, seedHex, valueHex, proofHex string) (bool, error) {
	publicKey, err := s.ecdsaService.HexToPublicKey(publicKeyHex)
	if err != nil {
		return false, fmt.Errorf("failed to parse public key: %w", err)
	}

	seed, err := hex.DecodeString(seedHex)
	if err != nil {
		return false, fmt.Errorf("failed to decode seed: %w", err)
	}

	value, err := hex.DecodeString(valueHex)
	if err != nil {
		return false, fmt.Errorf("failed to decode value: %w", err)
	}

	proof, err := hex.DecodeString(proofHex)
	if err != nil {
		return false, fmt.Errorf("failed to decode proof: %w", err)
	}

	return s.Verify(publicKey, seed, value, proof)
}

// constructProof 构造VRF证明
func (s *VRFService) constructProof(r, s *big.Int, v byte, seedHash []byte) []byte {
	// 证明格式: [32字节R] + [32字节S] + [1字节V] + [32字节种子哈希]
	proof := make([]byte, 97)

	// 填充R (32字节)
	rBytes := r.Bytes()
	copy(proof[32-len(rBytes):32], rBytes)

	// 填充S (32字节)
	sBytes := s.Bytes()
	copy(proof[64-len(sBytes):64], sBytes)

	// 填充V (1字节)
	proof[64] = v

	// 填充种子哈希 (32字节)
	copy(proof[65:97], seedHash)

	return proof
}

// parseProof 解析VRF证明
func (s *VRFService) parseProof(proof []byte) (r, s *big.Int, v byte, seedHash []byte, err error) {
	if len(proof) != 97 {
		return nil, nil, 0, nil, fmt.Errorf("invalid proof length: expected 97, got %d", len(proof))
	}

	// 解析R (32字节)
	r = new(big.Int).SetBytes(proof[0:32])

	// 解析S (32字节)
	s = new(big.Int).SetBytes(proof[32:64])

	// 解析V (1字节)
	v = proof[64]

	// 解析种子哈希 (32字节)
	seedHash = make([]byte, 32)
	copy(seedHash, proof[65:97])

	return r, s, v, seedHash, nil
}

// ProofToHex 将证明转换为十六进制字符串
func (s *VRFService) ProofToHex(proof *VRFProof) (valueHex, proofHex string) {
	return hex.EncodeToString(proof.Value), hex.EncodeToString(proof.Proof)
}

// HexToProof 从十六进制字符串创建证明
func (s *VRFService) HexToProof(valueHex, proofHex string) (*VRFProof, error) {
	value, err := hex.DecodeString(valueHex)
	if err != nil {
		return nil, fmt.Errorf("failed to decode value: %w", err)
	}

	proof, err := hex.DecodeString(proofHex)
	if err != nil {
		return nil, fmt.Errorf("failed to decode proof: %w", err)
	}

	return &VRFProof{
		Value: value,
		Proof: proof,
	}, nil
}

// GenerateRandomSeed 生成随机种子
func (s *VRFService) GenerateRandomSeed() ([]byte, error) {
	seed := make([]byte, 32)
	_, err := rand.Read(seed)
	if err != nil {
		return nil, fmt.Errorf("failed to generate random seed: %w", err)
	}
	return seed, nil
}

// GenerateRandomSeedHex 生成随机种子的十六进制字符串
func (s *VRFService) GenerateRandomSeedHex() (string, error) {
	seed, err := s.GenerateRandomSeed()
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(seed), nil
}

// CompareValues 比较两个VRF值的大小（用于共识中的排序）
func (s *VRFService) CompareValues(value1, value2 []byte) int {
	// 将字节数组转换为大整数进行比较
	int1 := new(big.Int).SetBytes(value1)
	int2 := new(big.Int).SetBytes(value2)
	return int1.Cmp(int2)
}

// IsLeader 判断节点是否为领导者（基于VRF值和阈值）
func (s *VRFService) IsLeader(vrfValue []byte, threshold *big.Int) bool {
	value := new(big.Int).SetBytes(vrfValue)
	return value.Cmp(threshold) < 0
}
