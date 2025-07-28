package storage

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/types"
)

// MemoryStore 内存存储实现
type MemoryStore struct {
	channels  map[string]*types.Channel
	messages  map[string][]types.Message
	events    map[string][]types.ChannelEvent
	backups   map[string]*types.ChannelBackup
	mu        sync.RWMutex
}

// NewMemoryStore 创建新的内存存储
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		channels: make(map[string]*types.Channel),
		messages: make(map[string][]types.Message),
		events:   make(map[string][]types.ChannelEvent),
		backups:  make(map[string]*types.ChannelBackup),
	}
}

// SaveChannel 保存通道
func (s *MemoryStore) SaveChannel(channel *types.Channel) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if channel == nil {
		return fmt.Errorf("channel cannot be nil")
	}

	// 深拷贝通道数据
	channelData, err := json.Marshal(channel)
	if err != nil {
		return fmt.Errorf("failed to marshal channel: %w", err)
	}

	var channelCopy types.Channel
	if err := json.Unmarshal(channelData, &channelCopy); err != nil {
		return fmt.Errorf("failed to unmarshal channel: %w", err)
	}

	s.channels[channel.ID] = &channelCopy
	return nil
}

// GetChannel 获取通道
func (s *MemoryStore) GetChannel(channelID string) (*types.Channel, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	channel, exists := s.channels[channelID]
	if !exists {
		return nil, fmt.Errorf("channel not found: %s", channelID)
	}

	// 返回深拷贝
	channelData, err := json.Marshal(channel)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal channel: %w", err)
	}

	var channelCopy types.Channel
	if err := json.Unmarshal(channelData, &channelCopy); err != nil {
		return nil, fmt.Errorf("failed to unmarshal channel: %w", err)
	}

	return &channelCopy, nil
}

// ListChannels 列出通道
func (s *MemoryStore) ListChannels(filter types.ChannelFilter) ([]types.Channel, int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var filteredChannels []types.Channel

	for _, channel := range s.channels {
		if s.matchesFilter(channel, filter) {
			// 深拷贝
			channelData, _ := json.Marshal(channel)
			var channelCopy types.Channel
			json.Unmarshal(channelData, &channelCopy)
			filteredChannels = append(filteredChannels, channelCopy)
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

// DeleteChannel 删除通道
func (s *MemoryStore) DeleteChannel(channelID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.channels[channelID]; !exists {
		return fmt.Errorf("channel not found: %s", channelID)
	}

	delete(s.channels, channelID)
	delete(s.messages, channelID)
	delete(s.events, channelID)
	delete(s.backups, channelID)

	return nil
}

// SaveMessage 保存消息
func (s *MemoryStore) SaveMessage(message *types.Message) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if message == nil {
		return fmt.Errorf("message cannot be nil")
	}

	// 检查通道是否存在
	if _, exists := s.channels[message.ChannelID]; !exists {
		return fmt.Errorf("channel not found: %s", message.ChannelID)
	}

	// 深拷贝消息
	messageData, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	var messageCopy types.Message
	if err := json.Unmarshal(messageData, &messageCopy); err != nil {
		return fmt.Errorf("failed to unmarshal message: %w", err)
	}

	s.messages[message.ChannelID] = append(s.messages[message.ChannelID], messageCopy)
	return nil
}

// GetMessages 获取消息
func (s *MemoryStore) GetMessages(channelID string) ([]types.Message, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	messages, exists := s.messages[channelID]
	if !exists {
		return []types.Message{}, nil
	}

	// 返回深拷贝
	messagesCopy := make([]types.Message, len(messages))
	for i, msg := range messages {
		messageData, _ := json.Marshal(&msg)
		json.Unmarshal(messageData, &messagesCopy[i])
	}

	return messagesCopy, nil
}

// SaveEvent 保存事件
func (s *MemoryStore) SaveEvent(event *types.ChannelEvent) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}

	// 深拷贝事件
	eventData, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	var eventCopy types.ChannelEvent
	if err := json.Unmarshal(eventData, &eventCopy); err != nil {
		return fmt.Errorf("failed to unmarshal event: %w", err)
	}

	s.events[event.ChannelID] = append(s.events[event.ChannelID], eventCopy)
	return nil
}

// GetEvents 获取事件
func (s *MemoryStore) GetEvents(channelID string) ([]types.ChannelEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	events, exists := s.events[channelID]
	if !exists {
		return []types.ChannelEvent{}, nil
	}

	// 返回深拷贝
	eventsCopy := make([]types.ChannelEvent, len(events))
	for i, event := range events {
		eventData, _ := json.Marshal(&event)
		json.Unmarshal(eventData, &eventsCopy[i])
	}

	return eventsCopy, nil
}

// CreateBackup 创建备份
func (s *MemoryStore) CreateBackup(channelID string) (*types.ChannelBackup, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	channel, exists := s.channels[channelID]
	if !exists {
		return nil, fmt.Errorf("channel not found: %s", channelID)
	}

	messages := s.messages[channelID]
	events := s.events[channelID]

	backup := &types.ChannelBackup{
		Channel:  *channel,
		Messages: messages,
		Events:   events,
		BackupAt: time.Now(),
	}

	// 保存备份
	backupData, err := json.Marshal(backup)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal backup: %w", err)
	}

	var backupCopy types.ChannelBackup
	if err := json.Unmarshal(backupData, &backupCopy); err != nil {
		return nil, fmt.Errorf("failed to unmarshal backup: %w", err)
	}

	s.backups[channelID] = &backupCopy

	return &backupCopy, nil
}

// RestoreBackup 恢复备份
func (s *MemoryStore) RestoreBackup(channelID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	backup, exists := s.backups[channelID]
	if !exists {
		return fmt.Errorf("backup not found: %s", channelID)
	}

	// 恢复数据
	s.channels[channelID] = &backup.Channel
	s.messages[channelID] = backup.Messages
	s.events[channelID] = backup.Events

	return nil
}

// GetStatistics 获取统计信息
func (s *MemoryStore) GetStatistics() types.ChannelStatistics {
	s.mu.RLock()
	defer s.mu.RUnlock()

	stats := types.ChannelStatistics{
		TotalChannels:    int64(len(s.channels)),
		ChannelsByState:  make(map[types.ChannelState]int64),
		MessagesByType:   make(map[types.MessageType]int64),
		ParticipantStats: make(map[types.ParticipantRole]int64),
	}

	var totalLifetime float64
	channelCount := 0

	for _, channel := range s.channels {
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
	for _, messages := range s.messages {
		for _, message := range messages {
			stats.MessagesByType[message.Type]++
		}
	}

	return stats
}

// matchesFilter 检查通道是否匹配过滤器
func (s *MemoryStore) matchesFilter(channel *types.Channel, filter types.ChannelFilter) bool {
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

// CleanupExpiredChannels 清理过期通道
func (s *MemoryStore) CleanupExpiredChannels() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	cleanedCount := 0

	for channelID, channel := range s.channels {
		if now.After(channel.ExpiresAt) && channel.State != types.StateClosed {
			// 标记为已关闭
			channel.State = types.StateClosed
			channel.UpdatedAt = now
			cleanedCount++

			// 记录清理事件
			event := types.ChannelEvent{
				ID:        fmt.Sprintf("cleanup_%d", time.Now().UnixNano()),
				ChannelID: channelID,
				Type:      "channel_expired",
				Data: map[string]interface{}{
					"expired_at": now,
					"reason":     "automatic_cleanup",
				},
				Timestamp: now,
			}
			s.events[channelID] = append(s.events[channelID], event)
		}
	}

	return cleanedCount
}

// GetChannelCount 获取通道数量
func (s *MemoryStore) GetChannelCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.channels)
}

// GetMessageCount 获取消息数量
func (s *MemoryStore) GetMessageCount(channelID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	messages, exists := s.messages[channelID]
	if !exists {
		return 0
	}
	return len(messages)
}

// GetEventCount 获取事件数量
func (s *MemoryStore) GetEventCount(channelID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	events, exists := s.events[channelID]
	if !exists {
		return 0
	}
	return len(events)
}
