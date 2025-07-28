package types

import (
	"crypto/ecdsa"
	"math/big"
	"time"
)

// ChannelState 通道状态
type ChannelState string

const (
	StateOpening  ChannelState = "opening"
	StateOpen     ChannelState = "open"
	StateClosing  ChannelState = "closing"
	StateClosed   ChannelState = "closed"
	StateDisputed ChannelState = "disputed"
)

// MessageType 消息类型
type MessageType string

const (
	MsgTypeChannelOpen     MessageType = "channel_open"
	MsgTypeChannelAccept   MessageType = "channel_accept"
	MsgTypeStateUpdate     MessageType = "state_update"
	MsgTypeChannelClose    MessageType = "channel_close"
	MsgTypeDispute         MessageType = "dispute"
	MsgTypeResumeRequest   MessageType = "resume_request"
	MsgTypeJobApplication  MessageType = "job_application"
	MsgTypeInterviewInvite MessageType = "interview_invite"
	MsgTypeOfferLetter     MessageType = "offer_letter"
	MsgTypeContractSign    MessageType = "contract_sign"
)

// Participant 参与者
type Participant struct {
	Address   string           `json:"address"`
	PublicKey *ecdsa.PublicKey `json:"public_key"`
	Role      ParticipantRole  `json:"role"`
	Name      string           `json:"name"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// ParticipantRole 参与者角色
type ParticipantRole string

const (
	RoleStudent  ParticipantRole = "student"
	RoleEmployer ParticipantRole = "employer"
)

// Channel 状态通道
type Channel struct {
	ID           string                 `json:"id"`
	Participants []Participant          `json:"participants"`
	State        ChannelState           `json:"state"`
	Nonce        uint64                 `json:"nonce"`
	Balance      map[string]*big.Int    `json:"balance"`
	Data         map[string]interface{} `json:"data"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
	ExpiresAt    time.Time              `json:"expires_at"`
	ChainTxHash  string                 `json:"chain_tx_hash,omitempty"`
}

// StateUpdate 状态更新
type StateUpdate struct {
	ChannelID string                 `json:"channel_id"`
	Nonce     uint64                 `json:"nonce"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
	Signatures []Signature           `json:"signatures"`
}

// Signature 签名
type Signature struct {
	Address   string `json:"address"`
	Signature string `json:"signature"`
	R         string `json:"r"`
	S         string `json:"s"`
	V         string `json:"v"`
}

// Message 通道消息
type Message struct {
	ID        string                 `json:"id"`
	ChannelID string                 `json:"channel_id"`
	Type      MessageType            `json:"type"`
	From      string                 `json:"from"`
	To        string                 `json:"to"`
	Data      map[string]interface{} `json:"data"`
	Nonce     uint64                 `json:"nonce"`
	Timestamp time.Time              `json:"timestamp"`
	Signature Signature              `json:"signature"`
}

// ChannelOpenRequest 开启通道请求
type ChannelOpenRequest struct {
	ParticipantA Participant           `json:"participant_a" binding:"required"`
	ParticipantB Participant           `json:"participant_b" binding:"required"`
	InitialData  map[string]interface{} `json:"initial_data,omitempty"`
	ExpiryHours  int                   `json:"expiry_hours,omitempty"`
}

// ChannelOpenResponse 开启通道响应
type ChannelOpenResponse struct {
	ChannelID string    `json:"channel_id"`
	State     ChannelState `json:"state"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// ChannelAcceptRequest 接受通道请求
type ChannelAcceptRequest struct {
	ChannelID string    `json:"channel_id" binding:"required"`
	Signature Signature `json:"signature" binding:"required"`
}

// StateUpdateRequest 状态更新请求
type StateUpdateRequest struct {
	ChannelID string                 `json:"channel_id" binding:"required"`
	Data      map[string]interface{} `json:"data" binding:"required"`
	Signature Signature              `json:"signature" binding:"required"`
}

// StateUpdateResponse 状态更新响应
type StateUpdateResponse struct {
	ChannelID string    `json:"channel_id"`
	Nonce     uint64    `json:"nonce"`
	UpdatedAt time.Time `json:"updated_at"`
	Success   bool      `json:"success"`
}

// ChannelCloseRequest 关闭通道请求
type ChannelCloseRequest struct {
	ChannelID string    `json:"channel_id" binding:"required"`
	Signature Signature `json:"signature" binding:"required"`
	Force     bool      `json:"force,omitempty"`
}

// ChannelInfoResponse 通道信息响应
type ChannelInfoResponse struct {
	Channel  Channel   `json:"channel"`
	Messages []Message `json:"messages,omitempty"`
}

// JobApplicationData 求职申请数据
type JobApplicationData struct {
	Position     string            `json:"position"`
	Resume       string            `json:"resume"`
	CoverLetter  string            `json:"cover_letter"`
	Certificates []string          `json:"certificates"`
	ZKProofs     []string          `json:"zk_proofs,omitempty"`
	Metadata     map[string]string `json:"metadata,omitempty"`
}

// InterviewInviteData 面试邀请数据
type InterviewInviteData struct {
	Position    string    `json:"position"`
	DateTime    time.Time `json:"date_time"`
	Location    string    `json:"location"`
	Type        string    `json:"type"` // "online", "offline"
	MeetingLink string    `json:"meeting_link,omitempty"`
	Instructions string   `json:"instructions,omitempty"`
}

// OfferLetterData 录用通知数据
type OfferLetterData struct {
	Position     string            `json:"position"`
	Salary       string            `json:"salary"`
	StartDate    time.Time         `json:"start_date"`
	Benefits     []string          `json:"benefits"`
	Terms        string            `json:"terms"`
	ExpiryDate   time.Time         `json:"expiry_date"`
	Metadata     map[string]string `json:"metadata,omitempty"`
}

// ContractSignData 合同签署数据
type ContractSignData struct {
	ContractHash string    `json:"contract_hash"`
	SignedAt     time.Time `json:"signed_at"`
	Terms        string    `json:"terms"`
	Witnesses    []string  `json:"witnesses,omitempty"`
}

// ChannelEvent 通道事件
type ChannelEvent struct {
	ID        string                 `json:"id"`
	ChannelID string                 `json:"channel_id"`
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// WebSocketMessage WebSocket消息
type WebSocketMessage struct {
	Type      string      `json:"type"`
	ChannelID string      `json:"channel_id,omitempty"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}

// ChannelStatistics 通道统计
type ChannelStatistics struct {
	TotalChannels    int64                        `json:"total_channels"`
	ActiveChannels   int64                        `json:"active_channels"`
	ClosedChannels   int64                        `json:"closed_channels"`
	ChannelsByState  map[ChannelState]int64       `json:"channels_by_state"`
	MessagesByType   map[MessageType]int64        `json:"messages_by_type"`
	AverageLifetime  float64                      `json:"average_lifetime_hours"`
	ParticipantStats map[ParticipantRole]int64    `json:"participant_stats"`
}

// DisputeData 争议数据
type DisputeData struct {
	Reason      string            `json:"reason"`
	Evidence    []string          `json:"evidence"`
	RequestedAction string        `json:"requested_action"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// ChannelBackup 通道备份
type ChannelBackup struct {
	Channel  Channel   `json:"channel"`
	Messages []Message `json:"messages"`
	Events   []ChannelEvent `json:"events"`
	BackupAt time.Time `json:"backup_at"`
}

// ChannelFilter 通道过滤器
type ChannelFilter struct {
	State        ChannelState    `json:"state,omitempty"`
	Participant  string          `json:"participant,omitempty"`
	Role         ParticipantRole `json:"role,omitempty"`
	CreatedAfter *time.Time      `json:"created_after,omitempty"`
	CreatedBefore *time.Time     `json:"created_before,omitempty"`
	Limit        int             `json:"limit,omitempty"`
	Offset       int             `json:"offset,omitempty"`
}

// ChannelListResponse 通道列表响应
type ChannelListResponse struct {
	Channels []Channel `json:"channels"`
	Total    int       `json:"total"`
	Limit    int       `json:"limit"`
	Offset   int       `json:"offset"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error     string `json:"error"`
	Code      int    `json:"code"`
	Message   string `json:"message"`
	Details   string `json:"details,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status      string              `json:"status"`
	Service     string              `json:"service"`
	Version     string              `json:"version"`
	Timestamp   time.Time           `json:"timestamp"`
	Statistics  ChannelStatistics   `json:"statistics"`
	Connections int                 `json:"websocket_connections"`
}

// ChannelConfig 通道配置
type ChannelConfig struct {
	MaxChannels        int           `json:"max_channels"`
	DefaultExpiryHours int           `json:"default_expiry_hours"`
	MaxMessageSize     int           `json:"max_message_size"`
	CleanupInterval    time.Duration `json:"cleanup_interval"`
	BackupInterval     time.Duration `json:"backup_interval"`
}

// NotificationData 通知数据
type NotificationData struct {
	Type      string                 `json:"type"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
}
