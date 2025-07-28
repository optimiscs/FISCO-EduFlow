package types

import (
	"crypto/ecdsa"
	"math/big"
	"time"
)

// NodeStatus 节点状态
type NodeStatus string

const (
	NodeStatusActive   NodeStatus = "active"
	NodeStatusInactive NodeStatus = "inactive"
	NodeStatusSlashed  NodeStatus = "slashed"
)

// ConsensusRole 共识角色
type ConsensusRole string

const (
	RoleValidator ConsensusRole = "validator"
	RoleProposer  ConsensusRole = "proposer"
	RoleObserver  ConsensusRole = "observer"
)

// Node 共识节点
type Node struct {
	ID          string           `json:"id"`
	Address     string           `json:"address"`
	PublicKey   *ecdsa.PublicKey `json:"public_key"`
	PrivateKey  *ecdsa.PrivateKey `json:"private_key,omitempty"`
	Stake       *big.Int         `json:"stake"`
	Status      NodeStatus       `json:"status"`
	Role        ConsensusRole    `json:"role"`
	LastActive  time.Time        `json:"last_active"`
	Reputation  int64            `json:"reputation"`
	VRFKey      []byte           `json:"vrf_key"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// Block 区块
type Block struct {
	Height      uint64            `json:"height"`
	Hash        string            `json:"hash"`
	PrevHash    string            `json:"prev_hash"`
	Timestamp   time.Time         `json:"timestamp"`
	Proposer    string            `json:"proposer"`
	Transactions []Transaction    `json:"transactions"`
	StateRoot   string            `json:"state_root"`
	VRFProof    VRFProof         `json:"vrf_proof"`
	Signatures  []NodeSignature  `json:"signatures"`
	Nonce       uint64           `json:"nonce"`
	Difficulty  *big.Int         `json:"difficulty"`
	GasUsed     uint64           `json:"gas_used"`
	GasLimit    uint64           `json:"gas_limit"`
}

// Transaction 交易
type Transaction struct {
	Hash      string            `json:"hash"`
	From      string            `json:"from"`
	To        string            `json:"to"`
	Value     *big.Int          `json:"value"`
	Data      []byte            `json:"data"`
	Gas       uint64            `json:"gas"`
	GasPrice  *big.Int          `json:"gas_price"`
	Nonce     uint64            `json:"nonce"`
	Signature []byte            `json:"signature"`
	Timestamp time.Time         `json:"timestamp"`
}

// VRFProof VRF证明
type VRFProof struct {
	Value     []byte `json:"value"`
	Proof     []byte `json:"proof"`
	Seed      []byte `json:"seed"`
	PublicKey []byte `json:"public_key"`
}

// NodeSignature 节点签名
type NodeSignature struct {
	NodeID    string `json:"node_id"`
	Signature []byte `json:"signature"`
	Timestamp time.Time `json:"timestamp"`
}

// ConsensusState 共识状态
type ConsensusState struct {
	CurrentHeight    uint64            `json:"current_height"`
	CurrentHash      string            `json:"current_hash"`
	ValidatorSet     []Node            `json:"validator_set"`
	ProposerRotation []string          `json:"proposer_rotation"`
	Epoch            uint64            `json:"epoch"`
	EpochStartTime   time.Time         `json:"epoch_start_time"`
	NextProposer     string            `json:"next_proposer"`
	TotalStake       *big.Int          `json:"total_stake"`
	ActiveNodes      int               `json:"active_nodes"`
}

// Proposal 提案
type Proposal struct {
	ID          string          `json:"id"`
	Height      uint64          `json:"height"`
	Block       Block           `json:"block"`
	Proposer    string          `json:"proposer"`
	VRFProof    VRFProof        `json:"vrf_proof"`
	Timestamp   time.Time       `json:"timestamp"`
	Votes       []Vote          `json:"votes"`
	Status      ProposalStatus  `json:"status"`
}

// ProposalStatus 提案状态
type ProposalStatus string

const (
	ProposalStatusPending  ProposalStatus = "pending"
	ProposalStatusAccepted ProposalStatus = "accepted"
	ProposalStatusRejected ProposalStatus = "rejected"
	ProposalStatusTimeout  ProposalStatus = "timeout"
)

// Vote 投票
type Vote struct {
	NodeID      string    `json:"node_id"`
	ProposalID  string    `json:"proposal_id"`
	VoteType    VoteType  `json:"vote_type"`
	Signature   []byte    `json:"signature"`
	Timestamp   time.Time `json:"timestamp"`
	Reason      string    `json:"reason,omitempty"`
}

// VoteType 投票类型
type VoteType string

const (
	VoteTypeAccept VoteType = "accept"
	VoteTypeReject VoteType = "reject"
	VoteTypeAbstain VoteType = "abstain"
)

// ConsensusConfig 共识配置
type ConsensusConfig struct {
	BlockTime           time.Duration `json:"block_time"`
	EpochDuration       time.Duration `json:"epoch_duration"`
	MinValidators       int           `json:"min_validators"`
	MaxValidators       int           `json:"max_validators"`
	MinStake            *big.Int      `json:"min_stake"`
	SlashingRate        float64       `json:"slashing_rate"`
	RewardRate          float64       `json:"reward_rate"`
	VotingThreshold     float64       `json:"voting_threshold"`
	ProposalTimeout     time.Duration `json:"proposal_timeout"`
	MaxTransactionsPerBlock int       `json:"max_transactions_per_block"`
}

// ConsensusMetrics 共识指标
type ConsensusMetrics struct {
	TotalBlocks       uint64        `json:"total_blocks"`
	TotalTransactions uint64        `json:"total_transactions"`
	AverageBlockTime  time.Duration `json:"average_block_time"`
	NetworkHashRate   *big.Int      `json:"network_hash_rate"`
	ActiveValidators  int           `json:"active_validators"`
	TotalStaked       *big.Int      `json:"total_staked"`
	LastBlockTime     time.Time     `json:"last_block_time"`
	Finality          uint64        `json:"finality"`
}

// NodeJoinRequest 节点加入请求
type NodeJoinRequest struct {
	NodeID    string           `json:"node_id" binding:"required"`
	Address   string           `json:"address" binding:"required"`
	PublicKey string           `json:"public_key" binding:"required"`
	Stake     string           `json:"stake" binding:"required"`
	VRFKey    string           `json:"vrf_key" binding:"required"`
	Signature string           `json:"signature" binding:"required"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// NodeJoinResponse 节点加入响应
type NodeJoinResponse struct {
	Success   bool      `json:"success"`
	NodeID    string    `json:"node_id"`
	Status    NodeStatus `json:"status"`
	JoinedAt  time.Time `json:"joined_at"`
	Message   string    `json:"message"`
}

// BlockProposalRequest 区块提案请求
type BlockProposalRequest struct {
	Height       uint64        `json:"height" binding:"required"`
	Transactions []Transaction `json:"transactions" binding:"required"`
	VRFProof     VRFProof      `json:"vrf_proof" binding:"required"`
	Proposer     string        `json:"proposer" binding:"required"`
	Signature    string        `json:"signature" binding:"required"`
}

// BlockProposalResponse 区块提案响应
type BlockProposalResponse struct {
	Success    bool      `json:"success"`
	ProposalID string    `json:"proposal_id"`
	Height     uint64    `json:"height"`
	Hash       string    `json:"hash"`
	Timestamp  time.Time `json:"timestamp"`
	Message    string    `json:"message"`
}

// VoteRequest 投票请求
type VoteRequest struct {
	NodeID     string   `json:"node_id" binding:"required"`
	ProposalID string   `json:"proposal_id" binding:"required"`
	VoteType   VoteType `json:"vote_type" binding:"required"`
	Signature  string   `json:"signature" binding:"required"`
	Reason     string   `json:"reason,omitempty"`
}

// VoteResponse 投票响应
type VoteResponse struct {
	Success   bool      `json:"success"`
	VoteID    string    `json:"vote_id"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

// ConsensusStateResponse 共识状态响应
type ConsensusStateResponse struct {
	State   ConsensusState   `json:"state"`
	Metrics ConsensusMetrics `json:"metrics"`
}

// NodeListResponse 节点列表响应
type NodeListResponse struct {
	Nodes []Node `json:"nodes"`
	Total int    `json:"total"`
}

// BlockListResponse 区块列表响应
type BlockListResponse struct {
	Blocks []Block `json:"blocks"`
	Total  int     `json:"total"`
	Height uint64  `json:"current_height"`
}

// ProposalListResponse 提案列表响应
type ProposalListResponse struct {
	Proposals []Proposal `json:"proposals"`
	Total     int        `json:"total"`
}

// VRFGenerateRequest VRF生成请求
type VRFGenerateRequest struct {
	Seed      string `json:"seed" binding:"required"`
	NodeID    string `json:"node_id" binding:"required"`
	Signature string `json:"signature" binding:"required"`
}

// VRFGenerateResponse VRF生成响应
type VRFGenerateResponse struct {
	Success   bool     `json:"success"`
	VRFProof  VRFProof `json:"vrf_proof"`
	Timestamp time.Time `json:"timestamp"`
	Message   string   `json:"message"`
}

// VRFVerifyRequest VRF验证请求
type VRFVerifyRequest struct {
	VRFProof VRFProof `json:"vrf_proof" binding:"required"`
	Seed     string   `json:"seed" binding:"required"`
}

// VRFVerifyResponse VRF验证响应
type VRFVerifyResponse struct {
	Valid     bool      `json:"valid"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error     string    `json:"error"`
	Code      int       `json:"code"`
	Message   string    `json:"message"`
	Details   string    `json:"details,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status      string           `json:"status"`
	Service     string           `json:"service"`
	Version     string           `json:"version"`
	Timestamp   time.Time        `json:"timestamp"`
	Consensus   ConsensusState   `json:"consensus"`
	Metrics     ConsensusMetrics `json:"metrics"`
	NodeInfo    Node             `json:"node_info"`
}

// Event 事件
type Event struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
	NodeID    string                 `json:"node_id,omitempty"`
}

// SlashingEvent 惩罚事件
type SlashingEvent struct {
	NodeID      string    `json:"node_id"`
	Reason      string    `json:"reason"`
	SlashedAmount *big.Int `json:"slashed_amount"`
	Timestamp   time.Time `json:"timestamp"`
	Evidence    []byte    `json:"evidence"`
}

// RewardEvent 奖励事件
type RewardEvent struct {
	NodeID       string    `json:"node_id"`
	RewardAmount *big.Int  `json:"reward_amount"`
	BlockHeight  uint64    `json:"block_height"`
	Timestamp    time.Time `json:"timestamp"`
}
