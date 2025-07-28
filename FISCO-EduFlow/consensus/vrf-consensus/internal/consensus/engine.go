package consensus

import (
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"sync"
	"time"

	"github.com/blockchain-education-platform/vrf-consensus/internal/types"
	"github.com/blockchain-education-platform/vrf-consensus/internal/vrf"
	"github.com/ethereum/go-ethereum/crypto"
)

// Engine 共识引擎
type Engine struct {
	config       types.ConsensusConfig
	state        *types.ConsensusState
	vrfService   *vrf.VRFService
	nodes        map[string]*types.Node
	proposals    map[string]*types.Proposal
	blocks       []*types.Block
	currentNode  *types.Node
	mu           sync.RWMutex
	eventChan    chan types.Event
	stopChan     chan struct{}
	isRunning    bool
}

// NewEngine 创建新的共识引擎
func NewEngine(config types.ConsensusConfig, nodePrivateKey *ecdsa.PrivateKey) (*Engine, error) {
	if nodePrivateKey == nil {
		return nil, fmt.Errorf("node private key cannot be nil")
	}

	// 创建当前节点
	vrfService := vrf.NewVRFService()
	vrfKey, err := vrfService.GenerateVRFKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate VRF key: %w", err)
	}

	currentNode := &types.Node{
		ID:         crypto.PubkeyToAddress(nodePrivateKey.PublicKey).Hex(),
		Address:    crypto.PubkeyToAddress(nodePrivateKey.PublicKey).Hex(),
		PublicKey:  &nodePrivateKey.PublicKey,
		PrivateKey: nodePrivateKey,
		Stake:      big.NewInt(0),
		Status:     types.NodeStatusActive,
		Role:       types.RoleValidator,
		LastActive: time.Now(),
		Reputation: 100,
		VRFKey:     vrfKey,
		Metadata:   make(map[string]string),
	}

	// 初始化共识状态
	state := &types.ConsensusState{
		CurrentHeight:    0,
		CurrentHash:      "",
		ValidatorSet:     []types.Node{*currentNode},
		ProposerRotation: []string{currentNode.ID},
		Epoch:            0,
		EpochStartTime:   time.Now(),
		NextProposer:     currentNode.ID,
		TotalStake:       big.NewInt(0),
		ActiveNodes:      1,
	}

	engine := &Engine{
		config:      config,
		state:       state,
		vrfService:  vrfService,
		nodes:       make(map[string]*types.Node),
		proposals:   make(map[string]*types.Proposal),
		blocks:      make([]*types.Block, 0),
		currentNode: currentNode,
		eventChan:   make(chan types.Event, 100),
		stopChan:    make(chan struct{}),
		isRunning:   false,
	}

	// 添加当前节点到节点映射
	engine.nodes[currentNode.ID] = currentNode

	return engine, nil
}

// Start 启动共识引擎
func (e *Engine) Start() error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.isRunning {
		return fmt.Errorf("consensus engine is already running")
	}

	e.isRunning = true

	// 启动共识循环
	go e.consensusLoop()

	// 启动事件处理
	go e.eventLoop()

	return nil
}

// Stop 停止共识引擎
func (e *Engine) Stop() error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if !e.isRunning {
		return fmt.Errorf("consensus engine is not running")
	}

	e.isRunning = false
	close(e.stopChan)

	return nil
}

// AddNode 添加节点
func (e *Engine) AddNode(node *types.Node) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if _, exists := e.nodes[node.ID]; exists {
		return fmt.Errorf("node already exists: %s", node.ID)
	}

	// 验证最小权益
	if node.Stake.Cmp(e.config.MinStake) < 0 {
		return fmt.Errorf("insufficient stake: required %s, got %s", 
			e.config.MinStake.String(), node.Stake.String())
	}

	// 检查验证者数量限制
	activeValidators := 0
	for _, n := range e.nodes {
		if n.Status == types.NodeStatusActive && n.Role == types.RoleValidator {
			activeValidators++
		}
	}

	if activeValidators >= e.config.MaxValidators {
		return fmt.Errorf("maximum validators reached: %d", e.config.MaxValidators)
	}

	// 添加节点
	e.nodes[node.ID] = node
	e.updateValidatorSet()

	// 发送事件
	e.emitEvent("node_added", map[string]interface{}{
		"node_id": node.ID,
		"stake":   node.Stake.String(),
		"role":    node.Role,
	})

	return nil
}

// RemoveNode 移除节点
func (e *Engine) RemoveNode(nodeID string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	node, exists := e.nodes[nodeID]
	if !exists {
		return fmt.Errorf("node not found: %s", nodeID)
	}

	// 不能移除自己
	if nodeID == e.currentNode.ID {
		return fmt.Errorf("cannot remove current node")
	}

	// 标记为非活跃
	node.Status = types.NodeStatusInactive
	e.updateValidatorSet()

	// 发送事件
	e.emitEvent("node_removed", map[string]interface{}{
		"node_id": nodeID,
	})

	return nil
}

// ProposeBlock 提议区块
func (e *Engine) ProposeBlock(transactions []types.Transaction) (*types.Proposal, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	// 检查是否是当前提案者
	if e.state.NextProposer != e.currentNode.ID {
		return nil, fmt.Errorf("not the current proposer")
	}

	// 检查交易数量限制
	if len(transactions) > e.config.MaxTransactionsPerBlock {
		return nil, fmt.Errorf("too many transactions: %d > %d", 
			len(transactions), e.config.MaxTransactionsPerBlock)
	}

	// 生成VRF证明
	seed := e.generateSeed()
	vrfProof, err := e.vrfService.GenerateVRF(e.currentNode.PrivateKey, seed)
	if err != nil {
		return nil, fmt.Errorf("failed to generate VRF proof: %w", err)
	}

	// 创建区块
	block := &types.Block{
		Height:       e.state.CurrentHeight + 1,
		PrevHash:     e.state.CurrentHash,
		Timestamp:    time.Now(),
		Proposer:     e.currentNode.ID,
		Transactions: transactions,
		VRFProof:     *vrfProof,
		Signatures:   []types.NodeSignature{},
		Nonce:        0,
		Difficulty:   big.NewInt(1),
		GasUsed:      0,
		GasLimit:     1000000,
	}

	// 计算区块哈希
	block.Hash = e.calculateBlockHash(block)

	// 创建提案
	proposalID := fmt.Sprintf("proposal_%d_%s", block.Height, block.Hash[:8])
	proposal := &types.Proposal{
		ID:        proposalID,
		Height:    block.Height,
		Block:     *block,
		Proposer:  e.currentNode.ID,
		VRFProof:  *vrfProof,
		Timestamp: time.Now(),
		Votes:     []types.Vote{},
		Status:    types.ProposalStatusPending,
	}

	// 存储提案
	e.proposals[proposalID] = proposal

	// 发送事件
	e.emitEvent("block_proposed", map[string]interface{}{
		"proposal_id": proposalID,
		"height":      block.Height,
		"proposer":    e.currentNode.ID,
		"tx_count":    len(transactions),
	})

	return proposal, nil
}

// Vote 投票
func (e *Engine) Vote(proposalID string, voteType types.VoteType, reason string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	proposal, exists := e.proposals[proposalID]
	if !exists {
		return fmt.Errorf("proposal not found: %s", proposalID)
	}

	if proposal.Status != types.ProposalStatusPending {
		return fmt.Errorf("proposal is not pending: %s", proposal.Status)
	}

	// 检查是否已经投票
	for _, vote := range proposal.Votes {
		if vote.NodeID == e.currentNode.ID {
			return fmt.Errorf("already voted for this proposal")
		}
	}

	// 创建投票
	vote := types.Vote{
		NodeID:     e.currentNode.ID,
		ProposalID: proposalID,
		VoteType:   voteType,
		Timestamp:  time.Now(),
		Reason:     reason,
	}

	// 签名投票
	voteHash := e.calculateVoteHash(&vote)
	signature, err := crypto.Sign(voteHash, e.currentNode.PrivateKey)
	if err != nil {
		return fmt.Errorf("failed to sign vote: %w", err)
	}
	vote.Signature = signature

	// 添加投票
	proposal.Votes = append(proposal.Votes, vote)

	// 检查是否达到投票阈值
	e.checkVotingThreshold(proposal)

	// 发送事件
	e.emitEvent("vote_cast", map[string]interface{}{
		"proposal_id": proposalID,
		"node_id":     e.currentNode.ID,
		"vote_type":   voteType,
	})

	return nil
}

// GetState 获取共识状态
func (e *Engine) GetState() *types.ConsensusState {
	e.mu.RLock()
	defer e.mu.RUnlock()

	// 返回状态副本
	stateCopy := *e.state
	return &stateCopy
}

// GetMetrics 获取共识指标
func (e *Engine) GetMetrics() *types.ConsensusMetrics {
	e.mu.RLock()
	defer e.mu.RUnlock()

	totalBlocks := uint64(len(e.blocks))
	totalTransactions := uint64(0)
	var totalBlockTime time.Duration

	for i, block := range e.blocks {
		totalTransactions += uint64(len(block.Transactions))
		if i > 0 {
			blockTime := block.Timestamp.Sub(e.blocks[i-1].Timestamp)
			totalBlockTime += blockTime
		}
	}

	var averageBlockTime time.Duration
	if totalBlocks > 1 {
		averageBlockTime = totalBlockTime / time.Duration(totalBlocks-1)
	}

	var lastBlockTime time.Time
	if totalBlocks > 0 {
		lastBlockTime = e.blocks[totalBlocks-1].Timestamp
	}

	return &types.ConsensusMetrics{
		TotalBlocks:       totalBlocks,
		TotalTransactions: totalTransactions,
		AverageBlockTime:  averageBlockTime,
		NetworkHashRate:   big.NewInt(0), // 简化实现
		ActiveValidators:  e.state.ActiveNodes,
		TotalStaked:       e.state.TotalStake,
		LastBlockTime:     lastBlockTime,
		Finality:          1, // 简化实现，假设立即最终确定
	}
}

// consensusLoop 共识循环
func (e *Engine) consensusLoop() {
	ticker := time.NewTicker(e.config.BlockTime)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			e.processConsensusRound()
		case <-e.stopChan:
			return
		}
	}
}

// processConsensusRound 处理共识轮次
func (e *Engine) processConsensusRound() {
	e.mu.Lock()
	defer e.mu.Unlock()

	// 更新提案者
	e.updateProposer()

	// 清理超时的提案
	e.cleanupTimeoutProposals()

	// 如果是当前提案者且没有待处理的提案，创建空区块
	if e.state.NextProposer == e.currentNode.ID {
		hasActivePendingProposal := false
		for _, proposal := range e.proposals {
			if proposal.Status == types.ProposalStatusPending && 
			   proposal.Proposer == e.currentNode.ID {
				hasActivePendingProposal = true
				break
			}
		}

		if !hasActivePendingProposal {
			// 创建空区块提案
			e.ProposeBlock([]types.Transaction{})
		}
	}
}

// 其他辅助方法...

// updateValidatorSet 更新验证者集合
func (e *Engine) updateValidatorSet() {
	validators := make([]types.Node, 0)
	totalStake := big.NewInt(0)
	activeNodes := 0

	for _, node := range e.nodes {
		if node.Status == types.NodeStatusActive {
			validators = append(validators, *node)
			totalStake.Add(totalStake, node.Stake)
			activeNodes++
		}
	}

	e.state.ValidatorSet = validators
	e.state.TotalStake = totalStake
	e.state.ActiveNodes = activeNodes

	// 更新提案者轮换
	proposerRotation := make([]string, 0)
	for _, validator := range validators {
		if validator.Role == types.RoleValidator {
			proposerRotation = append(proposerRotation, validator.ID)
		}
	}
	e.state.ProposerRotation = proposerRotation
}

// updateProposer 更新提案者
func (e *Engine) updateProposer() {
	if len(e.state.ProposerRotation) == 0 {
		return
	}

	// 基于VRF选择下一个提案者
	seed := e.generateSeed()
	nextProposer, err := e.vrfService.SelectProposer(e.state.ValidatorSet, seed, e.state.TotalStake)
	if err == nil {
		e.state.NextProposer = nextProposer
	}
}

// generateSeed 生成种子
func (e *Engine) generateSeed() []byte {
	seed := fmt.Sprintf("height_%d_epoch_%d", e.state.CurrentHeight, e.state.Epoch)
	return []byte(seed)
}

// calculateBlockHash 计算区块哈希
func (e *Engine) calculateBlockHash(block *types.Block) string {
	// 简化的哈希计算
	data := fmt.Sprintf("%d_%s_%d_%s", 
		block.Height, block.PrevHash, block.Timestamp.Unix(), block.Proposer)
	hash := crypto.Keccak256Hash([]byte(data))
	return hash.Hex()
}

// calculateVoteHash 计算投票哈希
func (e *Engine) calculateVoteHash(vote *types.Vote) []byte {
	data := fmt.Sprintf("%s_%s_%s_%d", 
		vote.NodeID, vote.ProposalID, vote.VoteType, vote.Timestamp.Unix())
	return crypto.Keccak256([]byte(data))
}

// checkVotingThreshold 检查投票阈值
func (e *Engine) checkVotingThreshold(proposal *types.Proposal) {
	totalVotes := len(proposal.Votes)
	acceptVotes := 0
	rejectVotes := 0

	for _, vote := range proposal.Votes {
		switch vote.VoteType {
		case types.VoteTypeAccept:
			acceptVotes++
		case types.VoteTypeReject:
			rejectVotes++
		}
	}

	threshold := int(float64(e.state.ActiveNodes) * e.config.VotingThreshold)

	if acceptVotes >= threshold {
		proposal.Status = types.ProposalStatusAccepted
		e.finalizeBlock(&proposal.Block)
	} else if rejectVotes >= threshold {
		proposal.Status = types.ProposalStatusRejected
	}
}

// finalizeBlock 最终确定区块
func (e *Engine) finalizeBlock(block *types.Block) {
	e.blocks = append(e.blocks, block)
	e.state.CurrentHeight = block.Height
	e.state.CurrentHash = block.Hash

	// 发送事件
	e.emitEvent("block_finalized", map[string]interface{}{
		"height": block.Height,
		"hash":   block.Hash,
	})
}

// cleanupTimeoutProposals 清理超时提案
func (e *Engine) cleanupTimeoutProposals() {
	now := time.Now()
	for id, proposal := range e.proposals {
		if proposal.Status == types.ProposalStatusPending &&
		   now.Sub(proposal.Timestamp) > e.config.ProposalTimeout {
			proposal.Status = types.ProposalStatusTimeout
			delete(e.proposals, id)
		}
	}
}

// emitEvent 发送事件
func (e *Engine) emitEvent(eventType string, data map[string]interface{}) {
	event := types.Event{
		ID:        fmt.Sprintf("event_%d", time.Now().UnixNano()),
		Type:      eventType,
		Data:      data,
		Timestamp: time.Now(),
		NodeID:    e.currentNode.ID,
	}

	select {
	case e.eventChan <- event:
	default:
		// 事件通道满了，丢弃事件
	}
}

// eventLoop 事件循环
func (e *Engine) eventLoop() {
	for {
		select {
		case event := <-e.eventChan:
			// 处理事件（这里可以添加事件处理逻辑）
			fmt.Printf("Event: %s - %v\n", event.Type, event.Data)
		case <-e.stopChan:
			return
		}
	}
}
