package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/channel"
	"github.com/blockchain-education-platform/state-channels/internal/types"
	"github.com/blockchain-education-platform/state-channels/internal/websocket"
	"github.com/gin-gonic/gin"
)

// ChannelHandler 状态通道处理器
type ChannelHandler struct {
	manager *channel.Manager
	hub     *websocket.Hub
}

// NewChannelHandler 创建新的通道处理器
func NewChannelHandler(manager *channel.Manager, hub *websocket.Hub) *ChannelHandler {
	return &ChannelHandler{
		manager: manager,
		hub:     hub,
	}
}

// Health 健康检查
func (h *ChannelHandler) Health(c *gin.Context) {
	stats := h.manager.GetStatistics()
	connections := h.hub.GetConnectionCount()

	response := types.HealthResponse{
		Status:      "healthy",
		Service:     "state-channels",
		Version:     "1.0.0",
		Timestamp:   time.Now(),
		Statistics:  stats,
		Connections: connections,
	}

	c.JSON(http.StatusOK, response)
}

// CreateChannel 创建通道
func (h *ChannelHandler) CreateChannel(c *gin.Context) {
	var req types.ChannelOpenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	channel, err := h.manager.CreateChannel(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:     "Failed to create channel",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	response := types.ChannelOpenResponse{
		ChannelID: channel.ID,
		State:     channel.State,
		CreatedAt: channel.CreatedAt,
		ExpiresAt: channel.ExpiresAt,
	}

	// 通知参与者
	for _, participant := range channel.Participants {
		notification := types.NotificationData{
			Type:      "channel_created",
			Title:     "New Channel Created",
			Message:   "A new state channel has been created",
			Data: map[string]interface{}{
				"channel_id": channel.ID,
				"state":      channel.State,
			},
			Timestamp: time.Now(),
		}
		h.hub.SendNotification(participant.Address, notification)
	}

	c.JSON(http.StatusOK, response)
}

// AcceptChannel 接受通道
func (h *ChannelHandler) AcceptChannel(c *gin.Context) {
	var req types.ChannelAcceptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	err := h.manager.AcceptChannel(req.ChannelID, req.Signature)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Failed to accept channel",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 获取更新后的通道信息
	channel, _ := h.manager.GetChannel(req.ChannelID)

	// 发送通道事件
	event := types.ChannelEvent{
		ID:        "event_" + strconv.FormatInt(time.Now().UnixNano(), 36),
		ChannelID: req.ChannelID,
		Type:      "channel_accepted",
		Data: map[string]interface{}{
			"signature": req.Signature,
			"state":     channel.State,
		},
		Timestamp: time.Now(),
	}
	h.hub.SendChannelEvent(req.ChannelID, event)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"channel_id": req.ChannelID,
		"state":      channel.State,
		"message":    "Channel accepted successfully",
	})
}

// UpdateState 更新通道状态
func (h *ChannelHandler) UpdateState(c *gin.Context) {
	var req types.StateUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	err := h.manager.UpdateState(req.ChannelID, req.Data, req.Signature)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Failed to update state",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 获取更新后的通道信息
	channel, _ := h.manager.GetChannel(req.ChannelID)

	response := types.StateUpdateResponse{
		ChannelID: req.ChannelID,
		Nonce:     channel.Nonce,
		UpdatedAt: channel.UpdatedAt,
		Success:   true,
	}

	// 发送通道事件
	event := types.ChannelEvent{
		ID:        "event_" + strconv.FormatInt(time.Now().UnixNano(), 36),
		ChannelID: req.ChannelID,
		Type:      "state_updated",
		Data: map[string]interface{}{
			"nonce":     channel.Nonce,
			"data":      req.Data,
			"signature": req.Signature,
		},
		Timestamp: time.Now(),
	}
	h.hub.SendChannelEvent(req.ChannelID, event)

	c.JSON(http.StatusOK, response)
}

// CloseChannel 关闭通道
func (h *ChannelHandler) CloseChannel(c *gin.Context) {
	var req types.ChannelCloseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	err := h.manager.CloseChannel(req.ChannelID, req.Signature, req.Force)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Failed to close channel",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 获取更新后的通道信息
	channel, _ := h.manager.GetChannel(req.ChannelID)

	// 发送通道事件
	event := types.ChannelEvent{
		ID:        "event_" + strconv.FormatInt(time.Now().UnixNano(), 36),
		ChannelID: req.ChannelID,
		Type:      "channel_closing",
		Data: map[string]interface{}{
			"force":     req.Force,
			"signature": req.Signature,
			"state":     channel.State,
		},
		Timestamp: time.Now(),
	}
	h.hub.SendChannelEvent(req.ChannelID, event)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"channel_id": req.ChannelID,
		"state":      channel.State,
		"message":    "Channel closing initiated",
	})
}

// GetChannel 获取通道信息
func (h *ChannelHandler) GetChannel(c *gin.Context) {
	channelID := c.Param("id")
	if channelID == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Missing channel ID",
			Code:      400,
			Message:   "Channel ID is required",
			Timestamp: time.Now(),
		})
		return
	}

	channel, err := h.manager.GetChannel(channelID)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:     "Channel not found",
			Code:      404,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 获取通道消息
	messages, _ := h.manager.GetChannelMessages(channelID)

	response := types.ChannelInfoResponse{
		Channel:  *channel,
		Messages: messages,
	}

	c.JSON(http.StatusOK, response)
}

// ListChannels 列出通道
func (h *ChannelHandler) ListChannels(c *gin.Context) {
	var filter types.ChannelFilter

	// 解析查询参数
	if state := c.Query("state"); state != "" {
		filter.State = types.ChannelState(state)
	}

	if participant := c.Query("participant"); participant != "" {
		filter.Participant = participant
	}

	if role := c.Query("role"); role != "" {
		filter.Role = types.ParticipantRole(role)
	}

	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil {
			filter.Limit = l
		}
	}

	if offset := c.Query("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil {
			filter.Offset = o
		}
	}

	channels, total, err := h.manager.ListChannels(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:     "Failed to list channels",
			Code:      500,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	response := types.ChannelListResponse{
		Channels: channels,
		Total:    total,
		Limit:    filter.Limit,
		Offset:   filter.Offset,
	}

	c.JSON(http.StatusOK, response)
}

// SendMessage 发送消息
func (h *ChannelHandler) SendMessage(c *gin.Context) {
	var message types.Message
	if err := c.ShouldBindJSON(&message); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Invalid request",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 设置消息时间戳和ID
	message.Timestamp = time.Now()
	message.ID = "msg_" + strconv.FormatInt(time.Now().UnixNano(), 36)

	err := h.manager.AddMessage(message)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:     "Failed to send message",
			Code:      400,
			Message:   err.Error(),
			Timestamp: time.Now(),
		})
		return
	}

	// 通过WebSocket发送消息
	h.hub.SendChannelMessage(message.ChannelID, message)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message_id": message.ID,
		"timestamp":  message.Timestamp,
	})
}

// GetStatistics 获取统计信息
func (h *ChannelHandler) GetStatistics(c *gin.Context) {
	stats := h.manager.GetStatistics()
	c.JSON(http.StatusOK, stats)
}

// WebSocket WebSocket连接处理
func (h *ChannelHandler) WebSocket(c *gin.Context) {
	h.hub.HandleWebSocket(c)
}
