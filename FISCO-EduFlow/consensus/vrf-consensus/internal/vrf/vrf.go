package vrf

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/blockchain-education-platform/vrf-consensus/internal/types"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/crypto/sha3"
)

// VRFService VRF服务
type VRFService struct{}

// NewVRFService 创建新的VRF服务实例
func NewVRFService() *VRFService {
	return &VRFService{}
}

// GenerateVRF 生成VRF证明
func (v *VRFService) GenerateVRF(privateKey *ecdsa.PrivateKey, seed []byte) (*types.VRFProof, error) {
	if privateKey == nil {
		return nil, fmt.Errorf("private key cannot be nil")
	}

	if len(seed) == 0 {
		return nil, fmt.Errorf("seed cannot be empty")
	}

	// 获取公钥
	publicKey := &privateKey.PublicKey
	publicKeyBytes := crypto.FromECDSAPub(publicKey)

	// 计算VRF值
	vrfValue, err := v.computeVRFValue(privateKey, seed)
	if err != nil {
		return nil, fmt.Errorf("failed to compute VRF value: %w", err)
	}

	// 生成VRF证明
	proof, err := v.generateProof(privateKey, seed, vrfValue)
	if err != nil {
		return nil, fmt.Errorf("failed to generate VRF proof: %w", err)
	}

	return &types.VRFProof{
		Value:     vrfValue,
		Proof:     proof,
		Seed:      seed,
		PublicKey: publicKeyBytes,
	}, nil
}

// VerifyVRF 验证VRF证明
func (v *VRFService) VerifyVRF(vrfProof *types.VRFProof) (bool, error) {
	if vrfProof == nil {
		return false, fmt.Errorf("VRF proof cannot be nil")
	}

	// 恢复公钥
	publicKey, err := crypto.UnmarshalPubkey(vrfProof.PublicKey)
	if err != nil {
		return false, fmt.Errorf("failed to unmarshal public key: %w", err)
	}

	// 验证证明
	valid, err := v.verifyProof(publicKey, vrfProof.Seed, vrfProof.Value, vrfProof.Proof)
	if err != nil {
		return false, fmt.Errorf("failed to verify proof: %w", err)
	}

	return valid, nil
}

// ComputeVRFHash 计算VRF哈希（用于选择提案者）
func (v *VRFService) ComputeVRFHash(vrfValue []byte) *big.Int {
	hash := sha256.Sum256(vrfValue)
	return new(big.Int).SetBytes(hash[:])
}

// SelectProposer 基于VRF选择提案者
func (v *VRFService) SelectProposer(validators []types.Node, seed []byte, totalStake *big.Int) (string, error) {
	if len(validators) == 0 {
		return "", fmt.Errorf("no validators available")
	}

	if totalStake == nil || totalStake.Cmp(big.NewInt(0)) <= 0 {
		return "", fmt.Errorf("invalid total stake")
	}

	// 为每个验证者计算VRF值和权重
	type validatorScore struct {
		nodeID string
		score  *big.Int
		stake  *big.Int
	}

	var scores []validatorScore
	for _, validator := range validators {
		if validator.Status != types.NodeStatusActive {
			continue
		}

		// 使用节点的VRF密钥和种子计算VRF值
		vrfHash := v.computeNodeVRFHash(validator.VRFKey, seed)
		
		// 计算加权分数：VRF哈希 * 权益比例
		stakeRatio := new(big.Int).Div(
			new(big.Int).Mul(validator.Stake, big.NewInt(1000000)), // 放大精度
			totalStake,
		)
		score := new(big.Int).Mul(vrfHash, stakeRatio)

		scores = append(scores, validatorScore{
			nodeID: validator.ID,
			score:  score,
			stake:  validator.Stake,
		})
	}

	if len(scores) == 0 {
		return "", fmt.Errorf("no active validators")
	}

	// 找到分数最高的验证者
	maxScore := scores[0].score
	selectedNodeID := scores[0].nodeID

	for _, s := range scores[1:] {
		if s.score.Cmp(maxScore) > 0 {
			maxScore = s.score
			selectedNodeID = s.nodeID
		}
	}

	return selectedNodeID, nil
}

// computeVRFValue 计算VRF值
func (v *VRFService) computeVRFValue(privateKey *ecdsa.PrivateKey, seed []byte) ([]byte, error) {
	// 使用私钥和种子计算VRF值
	// 这是一个简化的实现，实际应该使用标准的VRF算法
	
	// 创建消息哈希
	hasher := sha3.NewKeccak256()
	hasher.Write(seed)
	hasher.Write(crypto.FromECDSAPub(&privateKey.PublicKey))
	messageHash := hasher.Sum(nil)

	// 使用私钥签名消息哈希
	signature, err := crypto.Sign(messageHash, privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign message: %w", err)
	}

	// 对签名进行哈希得到VRF值
	vrfHash := sha256.Sum256(signature)
	return vrfHash[:], nil
}

// generateProof 生成VRF证明
func (v *VRFService) generateProof(privateKey *ecdsa.PrivateKey, seed, vrfValue []byte) ([]byte, error) {
	// 创建证明数据
	proofData := make([]byte, 0)
	proofData = append(proofData, seed...)
	proofData = append(proofData, vrfValue...)
	proofData = append(proofData, crypto.FromECDSAPub(&privateKey.PublicKey)...)

	// 对证明数据进行签名
	proofHash := sha256.Sum256(proofData)
	signature, err := crypto.Sign(proofHash[:], privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign proof: %w", err)
	}

	return signature, nil
}

// verifyProof 验证VRF证明
func (v *VRFService) verifyProof(publicKey *ecdsa.PublicKey, seed, vrfValue, proof []byte) (bool, error) {
	// 重构证明数据
	proofData := make([]byte, 0)
	proofData = append(proofData, seed...)
	proofData = append(proofData, vrfValue...)
	proofData = append(proofData, crypto.FromECDSAPub(publicKey)...)

	// 计算证明哈希
	proofHash := sha256.Sum256(proofData)

	// 验证签名
	recoveredPubKey, err := crypto.SigToPub(proofHash[:], proof)
	if err != nil {
		return false, fmt.Errorf("failed to recover public key: %w", err)
	}

	// 检查恢复的公钥是否与提供的公钥匹配
	return crypto.PubkeyToAddress(*recoveredPubKey) == crypto.PubkeyToAddress(*publicKey), nil
}

// computeNodeVRFHash 计算节点VRF哈希
func (v *VRFService) computeNodeVRFHash(vrfKey, seed []byte) *big.Int {
	hasher := sha256.New()
	hasher.Write(vrfKey)
	hasher.Write(seed)
	hash := hasher.Sum(nil)
	return new(big.Int).SetBytes(hash)
}

// GenerateVRFKey 生成VRF密钥
func (v *VRFService) GenerateVRFKey() ([]byte, error) {
	// 生成32字节的随机VRF密钥
	vrfKey := make([]byte, 32)
	_, err := rand.Read(vrfKey)
	if err != nil {
		return nil, fmt.Errorf("failed to generate VRF key: %w", err)
	}
	return vrfKey, nil
}

// ValidateVRFKey 验证VRF密钥
func (v *VRFService) ValidateVRFKey(vrfKey []byte) error {
	if len(vrfKey) != 32 {
		return fmt.Errorf("VRF key must be 32 bytes long")
	}

	// 检查密钥是否全为零
	allZero := true
	for _, b := range vrfKey {
		if b != 0 {
			allZero = false
			break
		}
	}

	if allZero {
		return fmt.Errorf("VRF key cannot be all zeros")
	}

	return nil
}

// ComputeRandomness 计算随机性
func (v *VRFService) ComputeRandomness(vrfProofs []types.VRFProof) ([]byte, error) {
	if len(vrfProofs) == 0 {
		return nil, fmt.Errorf("no VRF proofs provided")
	}

	// 将所有VRF值组合起来
	hasher := sha256.New()
	for _, proof := range vrfProofs {
		hasher.Write(proof.Value)
	}

	randomness := hasher.Sum(nil)
	return randomness, nil
}

// IsEligibleProposer 检查节点是否有资格成为提案者
func (v *VRFService) IsEligibleProposer(node types.Node, seed []byte, threshold *big.Int) (bool, error) {
	if node.Status != types.NodeStatusActive {
		return false, nil
	}

	// 计算节点的VRF哈希
	vrfHash := v.computeNodeVRFHash(node.VRFKey, seed)

	// 检查是否低于阈值
	return vrfHash.Cmp(threshold) < 0, nil
}

// CalculateProposerThreshold 计算提案者阈值
func (v *VRFService) CalculateProposerThreshold(nodeStake, totalStake *big.Int, targetProposers int) *big.Int {
	if totalStake == nil || totalStake.Cmp(big.NewInt(0)) <= 0 {
		return big.NewInt(0)
	}

	// 计算节点的权益比例
	stakeRatio := new(big.Int).Div(
		new(big.Int).Mul(nodeStake, big.NewInt(1000000)),
		totalStake,
	)

	// 计算基础阈值（基于最大哈希值）
	maxHash := new(big.Int).Lsh(big.NewInt(1), 256) // 2^256
	baseThreshold := new(big.Int).Div(maxHash, big.NewInt(int64(targetProposers)))

	// 根据权益比例调整阈值
	threshold := new(big.Int).Mul(baseThreshold, stakeRatio)
	threshold.Div(threshold, big.NewInt(1000000)) // 还原精度

	return threshold
}

// VRFProofToHex 将VRF证明转换为十六进制字符串
func (v *VRFService) VRFProofToHex(proof *types.VRFProof) map[string]string {
	return map[string]string{
		"value":      hex.EncodeToString(proof.Value),
		"proof":      hex.EncodeToString(proof.Proof),
		"seed":       hex.EncodeToString(proof.Seed),
		"public_key": hex.EncodeToString(proof.PublicKey),
	}
}

// HexToVRFProof 将十六进制字符串转换为VRF证明
func (v *VRFService) HexToVRFProof(hexProof map[string]string) (*types.VRFProof, error) {
	value, err := hex.DecodeString(hexProof["value"])
	if err != nil {
		return nil, fmt.Errorf("failed to decode value: %w", err)
	}

	proof, err := hex.DecodeString(hexProof["proof"])
	if err != nil {
		return nil, fmt.Errorf("failed to decode proof: %w", err)
	}

	seed, err := hex.DecodeString(hexProof["seed"])
	if err != nil {
		return nil, fmt.Errorf("failed to decode seed: %w", err)
	}

	publicKey, err := hex.DecodeString(hexProof["public_key"])
	if err != nil {
		return nil, fmt.Errorf("failed to decode public key: %w", err)
	}

	return &types.VRFProof{
		Value:     value,
		Proof:     proof,
		Seed:      seed,
		PublicKey: publicKey,
	}, nil
}
