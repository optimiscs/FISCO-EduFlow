package security

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/types"
	"github.com/ethereum/go-ethereum/crypto"
)

// Validator 安全验证器
type Validator struct {
	trustedNodes map[string]*ecdsa.PublicKey
}

// NewValidator 创建新的安全验证器
func NewValidator() *Validator {
	return &Validator{
		trustedNodes: make(map[string]*ecdsa.PublicKey),
	}
}

// AddTrustedNode 添加可信节点
func (v *Validator) AddTrustedNode(address string, publicKey *ecdsa.PublicKey) {
	v.trustedNodes[address] = publicKey
}

// ValidateChannelCreation 验证通道创建
func (v *Validator) ValidateChannelCreation(req *types.ChannelOpenRequest) error {
	// 验证参与者信息
	if err := v.validateParticipant(&req.ParticipantA); err != nil {
		return fmt.Errorf("invalid participant A: %w", err)
	}

	if err := v.validateParticipant(&req.ParticipantB); err != nil {
		return fmt.Errorf("invalid participant B: %w", err)
	}

	// 验证参与者不能相同
	if req.ParticipantA.Address == req.ParticipantB.Address {
		return fmt.Errorf("participants cannot be the same")
	}

	// 验证角色组合
	if req.ParticipantA.Role == req.ParticipantB.Role {
		return fmt.Errorf("participants must have different roles")
	}

	// 验证过期时间
	if req.ExpiryHours < 1 || req.ExpiryHours > 8760 { // 最多1年
		return fmt.Errorf("invalid expiry hours: must be between 1 and 8760")
	}

	return nil
}

// ValidateSignature 验证签名
func (v *Validator) ValidateSignature(data []byte, signature types.Signature) error {
	if signature.Address == "" {
		return fmt.Errorf("signature address cannot be empty")
	}

	if signature.Signature == "" {
		return fmt.Errorf("signature cannot be empty")
	}

	// 解码签名
	sigBytes, err := hex.DecodeString(signature.Signature)
	if err != nil {
		return fmt.Errorf("failed to decode signature: %w", err)
	}

	// 计算数据哈希
	hash := crypto.Keccak256Hash(data)

	// 恢复公钥
	recoveredPubKey, err := crypto.SigToPub(hash.Bytes(), sigBytes)
	if err != nil {
		return fmt.Errorf("failed to recover public key: %w", err)
	}

	// 验证地址
	recoveredAddress := crypto.PubkeyToAddress(*recoveredPubKey).Hex()
	if recoveredAddress != signature.Address {
		return fmt.Errorf("signature address mismatch: expected %s, got %s", 
			signature.Address, recoveredAddress)
	}

	return nil
}

// ValidateMessage 验证消息
func (v *Validator) ValidateMessage(message *types.Message) error {
	if message.ID == "" {
		return fmt.Errorf("message ID cannot be empty")
	}

	if message.ChannelID == "" {
		return fmt.Errorf("channel ID cannot be empty")
	}

	if message.From == "" {
		return fmt.Errorf("message sender cannot be empty")
	}

	if message.To == "" {
		return fmt.Errorf("message recipient cannot be empty")
	}

	if message.From == message.To {
		return fmt.Errorf("sender and recipient cannot be the same")
	}

	// 验证消息类型
	if !v.isValidMessageType(message.Type) {
		return fmt.Errorf("invalid message type: %s", message.Type)
	}

	// 验证时间戳
	if message.Timestamp.After(time.Now().Add(5 * time.Minute)) {
		return fmt.Errorf("message timestamp is too far in the future")
	}

	if message.Timestamp.Before(time.Now().Add(-24 * time.Hour)) {
		return fmt.Errorf("message timestamp is too old")
	}

	// 验证消息签名
	messageData := v.serializeMessageForSigning(message)
	if err := v.ValidateSignature(messageData, message.Signature); err != nil {
		return fmt.Errorf("invalid message signature: %w", err)
	}

	// 验证消息内容
	if err := v.validateMessageContent(message); err != nil {
		return fmt.Errorf("invalid message content: %w", err)
	}

	return nil
}

// ValidateStateUpdate 验证状态更新
func (v *Validator) ValidateStateUpdate(update *types.StateUpdate, channel *types.Channel) error {
	if update.ChannelID != channel.ID {
		return fmt.Errorf("channel ID mismatch")
	}

	// 验证nonce递增
	if update.Nonce != channel.Nonce+1 {
		return fmt.Errorf("invalid nonce: expected %d, got %d", channel.Nonce+1, update.Nonce)
	}

	// 验证时间戳
	if update.Timestamp.Before(channel.UpdatedAt) {
		return fmt.Errorf("update timestamp cannot be before channel last update")
	}

	// 验证签名
	for _, signature := range update.Signatures {
		// 检查签名者是否是通道参与者
		if !v.isChannelParticipant(signature.Address, channel) {
			return fmt.Errorf("signer %s is not a channel participant", signature.Address)
		}

		// 验证签名
		updateData := v.serializeStateUpdateForSigning(update)
		if err := v.ValidateSignature(updateData, signature); err != nil {
			return fmt.Errorf("invalid signature from %s: %w", signature.Address, err)
		}
	}

	// 验证至少有一个签名
	if len(update.Signatures) == 0 {
		return fmt.Errorf("state update must have at least one signature")
	}

	return nil
}

// ValidateChannelClose 验证通道关闭
func (v *Validator) ValidateChannelClose(channelID string, signature types.Signature, channel *types.Channel) error {
	if channel.State == types.StateClosed {
		return fmt.Errorf("channel is already closed")
	}

	// 验证签名者是通道参与者
	if !v.isChannelParticipant(signature.Address, channel) {
		return fmt.Errorf("signer is not a channel participant")
	}

	// 验证关闭签名
	closeData := []byte(fmt.Sprintf("close_channel_%s_%d", channelID, time.Now().Unix()))
	if err := v.ValidateSignature(closeData, signature); err != nil {
		return fmt.Errorf("invalid close signature: %w", err)
	}

	return nil
}

// ValidateChannelAccess 验证通道访问权限
func (v *Validator) ValidateChannelAccess(userAddress string, channel *types.Channel, operation string) error {
	if !v.isChannelParticipant(userAddress, channel) {
		return fmt.Errorf("user %s is not a channel participant", userAddress)
	}

	// 根据操作类型验证权限
	switch operation {
	case "read":
		// 所有参与者都可以读取
		return nil
	case "write":
		// 检查通道状态
		if channel.State != types.StateOpen {
			return fmt.Errorf("channel is not open for writing")
		}
		return nil
	case "close":
		// 所有参与者都可以关闭通道
		return nil
	default:
		return fmt.Errorf("unknown operation: %s", operation)
	}
}

// ValidateDataIntegrity 验证数据完整性
func (v *Validator) ValidateDataIntegrity(data map[string]interface{}) error {
	// 检查必要字段
	requiredFields := []string{"timestamp", "version"}
	for _, field := range requiredFields {
		if _, exists := data[field]; !exists {
			return fmt.Errorf("missing required field: %s", field)
		}
	}

	// 验证数据大小
	dataSize := v.calculateDataSize(data)
	if dataSize > 1024*1024 { // 1MB限制
		return fmt.Errorf("data size exceeds limit: %d bytes", dataSize)
	}

	return nil
}

// DetectMaliciousActivity 检测恶意活动
func (v *Validator) DetectMaliciousActivity(messages []types.Message, timeWindow time.Duration) []string {
	var suspiciousAddresses []string
	addressCounts := make(map[string]int)
	cutoffTime := time.Now().Add(-timeWindow)

	// 统计时间窗口内的消息频率
	for _, message := range messages {
		if message.Timestamp.After(cutoffTime) {
			addressCounts[message.From]++
		}
	}

	// 检测异常高频活动
	threshold := 100 // 每个时间窗口最多100条消息
	for address, count := range addressCounts {
		if count > threshold {
			suspiciousAddresses = append(suspiciousAddresses, address)
		}
	}

	return suspiciousAddresses
}

// validateParticipant 验证参与者
func (v *Validator) validateParticipant(participant *types.Participant) error {
	if participant.Address == "" {
		return fmt.Errorf("participant address cannot be empty")
	}

	if participant.PublicKey == nil {
		return fmt.Errorf("participant public key cannot be nil")
	}

	if participant.Role == "" {
		return fmt.Errorf("participant role cannot be empty")
	}

	// 验证角色
	if participant.Role != types.RoleStudent && participant.Role != types.RoleEmployer {
		return fmt.Errorf("invalid participant role: %s", participant.Role)
	}

	// 验证地址与公钥匹配
	expectedAddress := crypto.PubkeyToAddress(*participant.PublicKey).Hex()
	if participant.Address != expectedAddress {
		return fmt.Errorf("address does not match public key")
	}

	return nil
}

// isValidMessageType 检查消息类型是否有效
func (v *Validator) isValidMessageType(msgType types.MessageType) bool {
	validTypes := []types.MessageType{
		types.MsgTypeChannelOpen,
		types.MsgTypeChannelAccept,
		types.MsgTypeStateUpdate,
		types.MsgTypeChannelClose,
		types.MsgTypeDispute,
		types.MsgTypeResumeRequest,
		types.MsgTypeJobApplication,
		types.MsgTypeInterviewInvite,
		types.MsgTypeOfferLetter,
		types.MsgTypeContractSign,
	}

	for _, validType := range validTypes {
		if msgType == validType {
			return true
		}
	}

	return false
}

// validateMessageContent 验证消息内容
func (v *Validator) validateMessageContent(message *types.Message) error {
	switch message.Type {
	case types.MsgTypeJobApplication:
		return v.validateJobApplicationMessage(message)
	case types.MsgTypeInterviewInvite:
		return v.validateInterviewInviteMessage(message)
	case types.MsgTypeOfferLetter:
		return v.validateOfferLetterMessage(message)
	case types.MsgTypeContractSign:
		return v.validateContractSignMessage(message)
	default:
		// 对于其他类型的消息，进行基本验证
		if len(message.Data) == 0 {
			return fmt.Errorf("message data cannot be empty")
		}
	}

	return nil
}

// validateJobApplicationMessage 验证求职申请消息
func (v *Validator) validateJobApplicationMessage(message *types.Message) error {
	if _, exists := message.Data["position"]; !exists {
		return fmt.Errorf("job application must include position")
	}

	if _, exists := message.Data["resume"]; !exists {
		return fmt.Errorf("job application must include resume")
	}

	return nil
}

// validateInterviewInviteMessage 验证面试邀请消息
func (v *Validator) validateInterviewInviteMessage(message *types.Message) error {
	if _, exists := message.Data["datetime"]; !exists {
		return fmt.Errorf("interview invite must include datetime")
	}

	if _, exists := message.Data["type"]; !exists {
		return fmt.Errorf("interview invite must include type")
	}

	return nil
}

// validateOfferLetterMessage 验证录用通知消息
func (v *Validator) validateOfferLetterMessage(message *types.Message) error {
	if _, exists := message.Data["position"]; !exists {
		return fmt.Errorf("offer letter must include position")
	}

	if _, exists := message.Data["salary"]; !exists {
		return fmt.Errorf("offer letter must include salary")
	}

	return nil
}

// validateContractSignMessage 验证合同签署消息
func (v *Validator) validateContractSignMessage(message *types.Message) error {
	if _, exists := message.Data["contract_hash"]; !exists {
		return fmt.Errorf("contract sign must include contract hash")
	}

	return nil
}

// isChannelParticipant 检查是否是通道参与者
func (v *Validator) isChannelParticipant(address string, channel *types.Channel) bool {
	for _, participant := range channel.Participants {
		if participant.Address == address {
			return true
		}
	}
	return false
}

// serializeMessageForSigning 序列化消息用于签名
func (v *Validator) serializeMessageForSigning(message *types.Message) []byte {
	data := fmt.Sprintf("%s_%s_%s_%s_%d_%s",
		message.ID, message.ChannelID, message.From, message.To,
		message.Nonce, message.Type)
	return []byte(data)
}

// serializeStateUpdateForSigning 序列化状态更新用于签名
func (v *Validator) serializeStateUpdateForSigning(update *types.StateUpdate) []byte {
	data := fmt.Sprintf("%s_%d_%d",
		update.ChannelID, update.Nonce, update.Timestamp.Unix())
	return []byte(data)
}

// calculateDataSize 计算数据大小
func (v *Validator) calculateDataSize(data map[string]interface{}) int {
	// 简化实现，计算JSON序列化后的大小
	// 实际实现应该更精确
	size := 0
	for key, value := range data {
		size += len(key)
		if str, ok := value.(string); ok {
			size += len(str)
		} else {
			size += 100 // 估算其他类型的大小
		}
	}
	return size
}

// GenerateSecureHash 生成安全哈希
func (v *Validator) GenerateSecureHash(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// VerifyHash 验证哈希
func (v *Validator) VerifyHash(data []byte, expectedHash string) bool {
	actualHash := v.GenerateSecureHash(data)
	return actualHash == expectedHash
}
