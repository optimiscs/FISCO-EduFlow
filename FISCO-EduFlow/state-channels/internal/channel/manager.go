package channel

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/business"
	"github.com/blockchain-education-platform/state-channels/internal/security"
	"github.com/blockchain-education-platform/state-channels/internal/storage"
	"github.com/blockchain-education-platform/state-channels/internal/types"
)

// Manager 状态通道管理器
type Manager struct {
	store         storage.Store
	validator     *security.Validator
	jobProcessor  *business.JobProcessor
	mu            sync.RWMutex
	config        types.ChannelConfig
}

// NewManager 创建新的通道管理器
func NewManager(config types.ChannelConfig) *Manager {
	manager := &Manager{
		store:        storage.NewMemoryStore(),
		validator:    security.NewValidator(),
		jobProcessor: business.NewJobProcessor(),
		config:       config,
	}

	// 启动清理协程
	go manager.startCleanupRoutine()

	return manager
}

// CreateChannel 创建新通道
func (m *Manager) CreateChannel(req *types.ChannelOpenRequest) (*types.Channel, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 验证通道创建请求
	if err := m.validator.ValidateChannelCreation(req); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// 检查通道数量限制
	channelCount := m.store.GetChannelCount()
	if channelCount >= m.config.MaxChannels {
		return nil, fmt.Errorf("maximum number of channels reached")
	}

	// 生成通道ID
	channelID, err := m.generateChannelID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate channel ID: %w", err)
	}

	// 设置过期时间
	expiryHours := req.ExpiryHours
	if expiryHours <= 0 {
		expiryHours = m.config.DefaultExpiryHours
	}

	// 创建通道
	channel := &types.Channel{
		ID:           channelID,
		Participants: []types.Participant{req.ParticipantA, req.ParticipantB},
		State:        types.StateOpening,
		Nonce:        0,
		Balance:      make(map[string]*big.Int),
		Data:         req.InitialData,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		ExpiresAt:    time.Now().Add(time.Duration(expiryHours) * time.Hour),
	}

	// 保存通道
	if err := m.store.SaveChannel(channel); err != nil {
		return nil, fmt.Errorf("failed to save channel: %w", err)
	}

	// 记录事件
	m.addEvent(channelID, "channel_created", map[string]interface{}{
		"participants": channel.Participants,
		"expires_at":   channel.ExpiresAt,
	})

	return channel, nil
}

// AcceptChannel 接受通道
func (m *Manager) AcceptChannel(channelID string, signature types.Signature) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	channel, exists := m.channels[channelID]
	if !exists {
		return fmt.Errorf("channel not found")
	}

	if channel.State != types.StateOpening {
		return fmt.Errorf("channel is not in opening state")
	}

	// 验证签名
	if err := m.verifySignature(channel, signature); err != nil {
		return fmt.Errorf("invalid signature: %w", err)
	}

	// 更新通道状态
	channel.State = types.StateOpen
	channel.UpdatedAt = time.Now()

	// 记录事件
	m.addEvent(channelID, "channel_accepted", map[string]interface{}{
		"signature": signature,
	})

	return nil
}

// UpdateState 更新通道状态
func (m *Manager) UpdateState(channelID string, data map[string]interface{}, signature types.Signature) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	channel, exists := m.channels[channelID]
	if !exists {
		return fmt.Errorf("channel not found")
	}

	if channel.State != types.StateOpen {
		return fmt.Errorf("channel is not open")
	}

	// 检查通道是否过期
	if time.Now().After(channel.ExpiresAt) {
		return fmt.Errorf("channel has expired")
	}

	// 验证签名
	if err := m.verifySignature(channel, signature); err != nil {
		return fmt.Errorf("invalid signature: %w", err)
	}

	// 更新状态
	channel.Nonce++
	for key, value := range data {
		channel.Data[key] = value
	}
	channel.UpdatedAt = time.Now()

	// 记录状态更新
	stateUpdate := types.StateUpdate{
		ChannelID: channelID,
		Nonce:     channel.Nonce,
		Data:      data,
		Timestamp: time.Now(),
		Signatures: []types.Signature{signature},
	}

	// 记录事件
	m.addEvent(channelID, "state_updated", map[string]interface{}{
		"nonce":      channel.Nonce,
		"data":       data,
		"signature":  signature,
	})

	return nil
}

// CloseChannel 关闭通道
func (m *Manager) CloseChannel(channelID string, signature types.Signature, force bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	channel, exists := m.channels[channelID]
	if !exists {
		return fmt.Errorf("channel not found")
	}

	if channel.State == types.StateClosed {
		return fmt.Errorf("channel is already closed")
	}

	// 如果不是强制关闭，验证签名
	if !force {
		if err := m.verifySignature(channel, signature); err != nil {
			return fmt.Errorf("invalid signature: %w", err)
		}
	}

	// 更新通道状态
	if force {
		channel.State = types.StateClosed
	} else {
		channel.State = types.StateClosing
	}
	channel.UpdatedAt = time.Now()

	// 记录事件
	m.addEvent(channelID, "channel_closing", map[string]interface{}{
		"force":     force,
		"signature": signature,
	})

	return nil
}

// GetChannel 获取通道信息
func (m *Manager) GetChannel(channelID string) (*types.Channel, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	channel, exists := m.channels[channelID]
	if !exists {
		return nil, fmt.Errorf("channel not found")
	}

	// 返回通道副本
	channelCopy := *channel
	return &channelCopy, nil
}

// GetChannelMessages 获取通道消息
func (m *Manager) GetChannelMessages(channelID string) ([]types.Message, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	messages, exists := m.messages[channelID]
	if !exists {
		return nil, fmt.Errorf("channel not found")
	}

	// 返回消息副本
	messagesCopy := make([]types.Message, len(messages))
	copy(messagesCopy, messages)
	return messagesCopy, nil
}

// AddMessage 添加消息
func (m *Manager) AddMessage(message types.Message) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 检查通道是否存在
	channel, exists := m.channels[message.ChannelID]
	if !exists {
		return fmt.Errorf("channel not found")
	}

	// 检查通道状态
	if channel.State != types.StateOpen {
		return fmt.Errorf("channel is not open")
	}

	// 验证消息签名
	if err := m.verifyMessageSignature(message); err != nil {
		return fmt.Errorf("invalid message signature: %w", err)
	}

	// 添加消息
	m.messages[message.ChannelID] = append(m.messages[message.ChannelID], message)

	// 记录事件
	m.addEvent(message.ChannelID, "message_added", map[string]interface{}{
		"message_id":   message.ID,
		"message_type": message.Type,
		"from":         message.From,
		"to":           message.To,
	})

	return nil
}

// ListChannels 列出通道
func (m *Manager) ListChannels(filter types.ChannelFilter) ([]types.Channel, int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var filteredChannels []types.Channel

	for _, channel := range m.channels {
		if m.matchesFilter(channel, filter) {
			filteredChannels = append(filteredChannels, *channel)
		}
	}

	total := len(filteredChannels)

	// 应用分页
	if filter.Offset > 0 {
		if filter.Offset >= len(filteredChannels) {
			filteredChannels = []types.Channel{}
		} else {
			filteredChannels = filteredChannels[filter.Offset:]
		}
	}

	if filter.Limit > 0 && len(filteredChannels) > filter.Limit {
		filteredChannels = filteredChannels[:filter.Limit]
	}

	return filteredChannels, total, nil
}

// GetStatistics 获取统计信息
func (m *Manager) GetStatistics() types.ChannelStatistics {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := types.ChannelStatistics{
		TotalChannels:    int64(len(m.channels)),
		ChannelsByState:  make(map[types.ChannelState]int64),
		MessagesByType:   make(map[types.MessageType]int64),
		ParticipantStats: make(map[types.ParticipantRole]int64),
	}

	var totalLifetime float64
	channelCount := 0

	for _, channel := range m.channels {
		// 按状态统计
		stats.ChannelsByState[channel.State]++

		// 统计活跃和关闭的通道
		if channel.State == types.StateOpen {
			stats.ActiveChannels++
		} else if channel.State == types.StateClosed {
			stats.ClosedChannels++
		}

		// 计算平均生命周期
		if channel.State == types.StateClosed {
			lifetime := channel.UpdatedAt.Sub(channel.CreatedAt).Hours()
			totalLifetime += lifetime
			channelCount++
		}

		// 统计参与者角色
		for _, participant := range channel.Participants {
			stats.ParticipantStats[participant.Role]++
		}
	}

	// 计算平均生命周期
	if channelCount > 0 {
		stats.AverageLifetime = totalLifetime / float64(channelCount)
	}

	// 统计消息类型
	for _, messages := range m.messages {
		for _, message := range messages {
			stats.MessagesByType[message.Type]++
		}
	}

	return stats
}

// generateChannelID 生成通道ID
func (m *Manager) generateChannelID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// verifySignature 验证签名
func (m *Manager) verifySignature(channel *types.Channel, signature types.Signature) error {
	// 这里应该实现真正的签名验证逻辑
	// 为了简化，这里只检查签名是否为空
	if signature.Signature == "" {
		return fmt.Errorf("empty signature")
	}

	// 检查签名者是否是通道参与者
	isParticipant := false
	for _, participant := range channel.Participants {
		if participant.Address == signature.Address {
			isParticipant = true
			break
		}
	}

	if !isParticipant {
		return fmt.Errorf("signer is not a channel participant")
	}

	return nil
}

// verifyMessageSignature 验证消息签名
func (m *Manager) verifyMessageSignature(message types.Message) error {
	// 简化的消息签名验证
	if message.Signature.Signature == "" {
		return fmt.Errorf("empty message signature")
	}

	if message.Signature.Address != message.From {
		return fmt.Errorf("signature address does not match sender")
	}

	return nil
}

// addEvent 添加事件
func (m *Manager) addEvent(channelID, eventType string, data map[string]interface{}) {
	event := types.ChannelEvent{
		ID:        m.generateEventID(),
		ChannelID: channelID,
		Type:      eventType,
		Data:      data,
		Timestamp: time.Now(),
	}

	m.events[channelID] = append(m.events[channelID], event)
}

// generateEventID 生成事件ID
func (m *Manager) generateEventID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// matchesFilter 检查通道是否匹配过滤器
func (m *Manager) matchesFilter(channel *types.Channel, filter types.ChannelFilter) bool {
	if filter.State != "" && channel.State != filter.State {
		return false
	}

	if filter.Participant != "" {
		found := false
		for _, participant := range channel.Participants {
			if participant.Address == filter.Participant {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	if filter.Role != "" {
		found := false
		for _, participant := range channel.Participants {
			if participant.Role == filter.Role {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	if filter.CreatedAfter != nil && channel.CreatedAt.Before(*filter.CreatedAfter) {
		return false
	}

	if filter.CreatedBefore != nil && channel.CreatedAt.After(*filter.CreatedBefore) {
		return false
	}

	return true
}

// startCleanupRoutine 启动清理协程
func (m *Manager) startCleanupRoutine() {
	ticker := time.NewTicker(m.config.CleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		m.cleanupExpiredChannels()
	}
}

// cleanupExpiredChannels 清理过期通道
func (m *Manager) cleanupExpiredChannels() {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	for channelID, channel := range m.channels {
		if now.After(channel.ExpiresAt) && channel.State != types.StateClosed {
			// 标记为已关闭
			channel.State = types.StateClosed
			channel.UpdatedAt = now

			// 记录事件
			m.addEvent(channelID, "channel_expired", map[string]interface{}{
				"expired_at": now,
			})
		}
	}
}
