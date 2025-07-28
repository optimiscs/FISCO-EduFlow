// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MobileConsensusContract
 * @dev 基于移动设备的高吞吐量共识协议合约
 * 
 * 在本系统中采用一种基于移动设备的高吞吐量共识协议，仅需智能手机即可参与区块验证和共识
 * 鼓励大量参与者参与区块的产生
 * 
 * 两种类型的节点：
 * 1. 普通节点：可以在智能手机上运行，通过智能手机上可用的可信硬件（TEE）认证参与者身份
 *    强制每个TEE在区块链上最多具有一个活动身份，数量大，资源有限，仅在区块链中参与投票共识
 * 2. 超级节点：在服务器上运行，数量少，主要进行存储等资源消耗量大的工作
 *    存储账本和密钥值数据库，普通节点根据需要从超级节点获取这些数据
 * 
 * @author XueLianTong Team
 */
contract MobileConsensusContract {
    
    // ========== 数据结构定义 ==========
    
    // 节点类型枚举
    enum NodeType {
        ORDINARY,    // 普通节点
        SUPER        // 超级节点
    }
    
    // 节点状态枚举
    enum NodeStatus {
        PENDING,     // 待审核
        ACTIVE,      // 活跃
        INACTIVE,    // 非活跃
        SUSPENDED    // 暂停
    }
    
    // 普通节点结构
    struct OrdinaryNode {
        address nodeAddress;        // 节点地址
        bytes32 teeId;             // TEE身份标识
        string deviceInfo;         // 设备信息
        uint256 registeredAt;      // 注册时间
        uint256 lastActiveAt;      // 最后活跃时间
        NodeStatus status;         // 节点状态
        uint256 votingPower;       // 投票权重
        uint256 totalVotes;        // 总投票数
        uint256 correctVotes;      // 正确投票数
        bytes32 currentBlockHash;  // 当前区块哈希
    }
    
    // 超级节点结构
    struct SuperNode {
        address nodeAddress;       // 节点地址
        string serverInfo;         // 服务器信息
        uint256 storageCapacity;   // 存储容量
        uint256 bandwidth;         // 带宽
        uint256 registeredAt;      // 注册时间
        uint256 lastActiveAt;      // 最后活跃时间
        NodeStatus status;         // 节点状态
        uint256 dataServed;        // 已服务数据量
        uint256 reputation;        // 声誉值
        string[] supportedChains;  // 支持的链
    }
    
    // 区块投票结构
    struct BlockVote {
        uint256 blockNumber;       // 区块号
        bytes32 blockHash;         // 区块哈希
        address voter;             // 投票者
        bool isApproval;           // 是否赞成
        uint256 timestamp;         // 投票时间
        bytes signature;           // 投票签名
    }
    
    // 共识轮次结构
    struct ConsensusRound {
        uint256 roundNumber;       // 轮次号
        uint256 blockNumber;       // 区块号
        bytes32 proposedBlockHash; // 提议的区块哈希
        address proposer;          // 提议者
        uint256 startTime;         // 开始时间
        uint256 endTime;           // 结束时间
        uint256 totalVotes;        // 总投票数
        uint256 approvalVotes;     // 赞成票数
        bool isFinalized;          // 是否已确定
        bool isApproved;           // 是否通过
    }
    
    // TEE认证信息结构
    struct TEEAttestation {
        bytes32 teeId;             // TEE标识
        address nodeAddress;       // 节点地址
        bytes attestationData;     // 认证数据
        uint256 attestedAt;        // 认证时间
        bool isValid;              // 是否有效
        uint256 expiresAt;         // 过期时间
    }
    
    // ========== 状态变量 ==========
    
    mapping(address => OrdinaryNode) public ordinaryNodes;
    mapping(address => SuperNode) public superNodes;
    mapping(bytes32 => address) public teeToNode;
    mapping(bytes32 => TEEAttestation) public teeAttestations;
    mapping(uint256 => ConsensusRound) public consensusRounds;
    mapping(uint256 => mapping(address => BlockVote)) public blockVotes;
    mapping(address => bool) public authorizedValidators;
    
    address[] public ordinaryNodeList;
    address[] public superNodeList;
    
    address public admin;
    uint256 public currentRound;
    uint256 public minVotingPower;
    uint256 public consensusThreshold;
    uint256 public roundDuration;
    uint256 public maxOrdinaryNodes;
    uint256 public maxSuperNodes;
    uint256 public teeValidityPeriod;
    
    // ========== 事件定义 ==========
    
    event OrdinaryNodeRegistered(
        address indexed nodeAddress,
        bytes32 indexed teeId,
        string deviceInfo,
        uint256 timestamp
    );
    
    event SuperNodeRegistered(
        address indexed nodeAddress,
        string serverInfo,
        uint256 storageCapacity,
        uint256 timestamp
    );
    
    event TEEAttestationUpdated(
        bytes32 indexed teeId,
        address indexed nodeAddress,
        bool isValid,
        uint256 expiresAt
    );
    
    event BlockProposed(
        uint256 indexed roundNumber,
        uint256 indexed blockNumber,
        bytes32 blockHash,
        address indexed proposer,
        uint256 timestamp
    );
    
    event VoteCast(
        uint256 indexed roundNumber,
        uint256 indexed blockNumber,
        address indexed voter,
        bool isApproval,
        uint256 timestamp
    );
    
    event ConsensusReached(
        uint256 indexed roundNumber,
        uint256 indexed blockNumber,
        bytes32 blockHash,
        bool approved,
        uint256 totalVotes,
        uint256 approvalVotes
    );
    
    event NodeStatusChanged(
        address indexed nodeAddress,
        NodeType nodeType,
        NodeStatus oldStatus,
        NodeStatus newStatus
    );
    
    // ========== 修饰符 ==========
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyActiveOrdinaryNode() {
        require(
            ordinaryNodes[msg.sender].status == NodeStatus.ACTIVE,
            "Only active ordinary nodes can perform this action"
        );
        _;
    }
    
    modifier onlyActiveSuperNode() {
        require(
            superNodes[msg.sender].status == NodeStatus.ACTIVE,
            "Only active super nodes can perform this action"
        );
        _;
    }
    
    modifier onlyAuthorizedValidator() {
        require(
            authorizedValidators[msg.sender],
            "Only authorized validators can perform this action"
        );
        _;
    }
    
    modifier validTEE(bytes32 teeId) {
        require(
            teeAttestations[teeId].isValid && 
            teeAttestations[teeId].expiresAt > block.timestamp,
            "Invalid or expired TEE"
        );
        _;
    }
    
    // ========== 构造函数 ==========
    
    constructor() {
        admin = msg.sender;
        currentRound = 0;
        minVotingPower = 1;
        consensusThreshold = 67; // 67%
        roundDuration = 30; // 30秒
        maxOrdinaryNodes = 10000;
        maxSuperNodes = 100;
        teeValidityPeriod = 365 days;
        
        authorizedValidators[msg.sender] = true;
    }
    
    // ========== 节点注册函数 ==========
    
    /**
     * @dev 注册普通节点
     * 通过智能手机上可用的可信硬件（TEE）认证参与者身份
     * @param teeId TEE身份标识
     * @param deviceInfo 设备信息
     * @param attestationData TEE认证数据
     */
    function registerOrdinaryNode(
        bytes32 teeId,
        string memory deviceInfo,
        bytes memory attestationData
    ) external {
        require(teeId != bytes32(0), "Invalid TEE ID");
        require(bytes(deviceInfo).length > 0, "Device info cannot be empty");
        require(ordinaryNodes[msg.sender].nodeAddress == address(0), "Node already registered");
        require(teeToNode[teeId] == address(0), "TEE already registered");
        require(ordinaryNodeList.length < maxOrdinaryNodes, "Maximum ordinary nodes reached");
        
        // 验证TEE认证
        require(verifyTEEAttestation(teeId, msg.sender, attestationData), "TEE attestation failed");
        
        // 创建普通节点
        ordinaryNodes[msg.sender] = OrdinaryNode({
            nodeAddress: msg.sender,
            teeId: teeId,
            deviceInfo: deviceInfo,
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp,
            status: NodeStatus.ACTIVE,
            votingPower: minVotingPower,
            totalVotes: 0,
            correctVotes: 0,
            currentBlockHash: bytes32(0)
        });
        
        // 更新映射和列表
        teeToNode[teeId] = msg.sender;
        ordinaryNodeList.push(msg.sender);
        
        // 创建TEE认证记录
        teeAttestations[teeId] = TEEAttestation({
            teeId: teeId,
            nodeAddress: msg.sender,
            attestationData: attestationData,
            attestedAt: block.timestamp,
            isValid: true,
            expiresAt: block.timestamp + teeValidityPeriod
        });
        
        emit OrdinaryNodeRegistered(msg.sender, teeId, deviceInfo, block.timestamp);
        emit TEEAttestationUpdated(teeId, msg.sender, true, block.timestamp + teeValidityPeriod);
    }
    
    /**
     * @dev 注册超级节点
     * 在服务器上运行，主要进行存储等资源消耗量大的工作
     * @param serverInfo 服务器信息
     * @param storageCapacity 存储容量
     * @param bandwidth 带宽
     * @param supportedChains 支持的链
     */
    function registerSuperNode(
        string memory serverInfo,
        uint256 storageCapacity,
        uint256 bandwidth,
        string[] memory supportedChains
    ) external {
        require(bytes(serverInfo).length > 0, "Server info cannot be empty");
        require(storageCapacity > 0, "Storage capacity must be greater than 0");
        require(bandwidth > 0, "Bandwidth must be greater than 0");
        require(superNodes[msg.sender].nodeAddress == address(0), "Node already registered");
        require(superNodeList.length < maxSuperNodes, "Maximum super nodes reached");
        
        // 创建超级节点
        superNodes[msg.sender] = SuperNode({
            nodeAddress: msg.sender,
            serverInfo: serverInfo,
            storageCapacity: storageCapacity,
            bandwidth: bandwidth,
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp,
            status: NodeStatus.PENDING, // 超级节点需要管理员审核
            dataServed: 0,
            reputation: 100, // 初始声誉值
            supportedChains: supportedChains
        });
        
        superNodeList.push(msg.sender);
        
        emit SuperNodeRegistered(msg.sender, serverInfo, storageCapacity, block.timestamp);
    }
    
    // ========== 共识机制函数 ==========
    
    /**
     * @dev 提议新区块
     * @param blockNumber 区块号
     * @param blockHash 区块哈希
     */
    function proposeBlock(
        uint256 blockNumber,
        bytes32 blockHash
    ) external onlyAuthorizedValidator {
        require(blockHash != bytes32(0), "Invalid block hash");
        
        currentRound++;
        
        consensusRounds[currentRound] = ConsensusRound({
            roundNumber: currentRound,
            blockNumber: blockNumber,
            proposedBlockHash: blockHash,
            proposer: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + roundDuration,
            totalVotes: 0,
            approvalVotes: 0,
            isFinalized: false,
            isApproved: false
        });
        
        emit BlockProposed(currentRound, blockNumber, blockHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev 普通节点投票
     * 普通节点仅在区块链中参与投票共识
     * @param roundNumber 轮次号
     * @param isApproval 是否赞成
     * @param signature 投票签名
     */
    function castVote(
        uint256 roundNumber,
        bool isApproval,
        bytes memory signature
    ) external onlyActiveOrdinaryNode validTEE(ordinaryNodes[msg.sender].teeId) {
        require(roundNumber <= currentRound, "Invalid round number");
        require(roundNumber > 0, "Round number must be greater than 0");
        
        ConsensusRound storage round = consensusRounds[roundNumber];
        require(!round.isFinalized, "Round already finalized");
        require(block.timestamp <= round.endTime, "Voting period ended");
        require(blockVotes[roundNumber][msg.sender].voter == address(0), "Already voted");
        
        // 验证投票签名
        require(verifyVoteSignature(roundNumber, isApproval, signature), "Invalid vote signature");
        
        // 记录投票
        blockVotes[roundNumber][msg.sender] = BlockVote({
            blockNumber: round.blockNumber,
            blockHash: round.proposedBlockHash,
            voter: msg.sender,
            isApproval: isApproval,
            timestamp: block.timestamp,
            signature: signature
        });
        
        // 更新轮次统计
        round.totalVotes++;
        if (isApproval) {
            round.approvalVotes++;
        }
        
        // 更新节点统计
        OrdinaryNode storage node = ordinaryNodes[msg.sender];
        node.totalVotes++;
        node.lastActiveAt = block.timestamp;
        node.currentBlockHash = round.proposedBlockHash;
        
        emit VoteCast(roundNumber, round.blockNumber, msg.sender, isApproval, block.timestamp);
        
        // 检查是否达到共识
        checkConsensus(roundNumber);
    }
    
    /**
     * @dev 检查共识是否达成
     * @param roundNumber 轮次号
     */
    function checkConsensus(uint256 roundNumber) internal {
        ConsensusRound storage round = consensusRounds[roundNumber];
        
        if (round.isFinalized) {
            return;
        }
        
        uint256 activeNodes = getActiveOrdinaryNodeCount();
        uint256 requiredVotes = (activeNodes * consensusThreshold) / 100;
        
        // 检查是否达到投票阈值或时间到期
        if (round.totalVotes >= requiredVotes || block.timestamp > round.endTime) {
            round.isFinalized = true;
            round.isApproved = (round.approvalVotes * 100) >= (round.totalVotes * consensusThreshold);
            
            // 更新投票正确性统计
            updateVotingAccuracy(roundNumber, round.isApproved);
            
            emit ConsensusReached(
                roundNumber,
                round.blockNumber,
                round.proposedBlockHash,
                round.isApproved,
                round.totalVotes,
                round.approvalVotes
            );
        }
    }
    
    /**
     * @dev 更新投票准确性统计
     * @param roundNumber 轮次号
     * @param finalResult 最终结果
     */
    function updateVotingAccuracy(uint256 roundNumber, bool finalResult) internal {
        ConsensusRound storage round = consensusRounds[roundNumber];
        
        for (uint256 i = 0; i < ordinaryNodeList.length; i++) {
            address nodeAddr = ordinaryNodeList[i];
            BlockVote storage vote = blockVotes[roundNumber][nodeAddr];
            
            if (vote.voter != address(0) && vote.isApproval == finalResult) {
                ordinaryNodes[nodeAddr].correctVotes++;
                
                // 根据准确性调整投票权重
                OrdinaryNode storage node = ordinaryNodes[nodeAddr];
                if (node.totalVotes > 0) {
                    uint256 accuracy = (node.correctVotes * 100) / node.totalVotes;
                    if (accuracy >= 80) {
                        node.votingPower = minVotingPower + 1;
                    } else if (accuracy < 50) {
                        node.votingPower = minVotingPower;
                    }
                }
            }
        }
    }
    
    // ========== 查询函数 ==========
    
    /**
     * @dev 获取活跃普通节点数量
     */
    function getActiveOrdinaryNodeCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < ordinaryNodeList.length; i++) {
            if (ordinaryNodes[ordinaryNodeList[i]].status == NodeStatus.ACTIVE) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev 获取活跃超级节点数量
     */
    function getActiveSuperNodeCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < superNodeList.length; i++) {
            if (superNodes[superNodeList[i]].status == NodeStatus.ACTIVE) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev 获取共识轮次信息
     * @param roundNumber 轮次号
     */
    function getConsensusRound(uint256 roundNumber) 
        external view returns (ConsensusRound memory) {
        return consensusRounds[roundNumber];
    }
    
    /**
     * @dev 获取节点投票记录
     * @param roundNumber 轮次号
     * @param nodeAddress 节点地址
     */
    function getNodeVote(uint256 roundNumber, address nodeAddress) 
        external view returns (BlockVote memory) {
        return blockVotes[roundNumber][nodeAddress];
    }
    
    // ========== 管理函数 ==========
    
    /**
     * @dev 审核超级节点
     * @param nodeAddress 节点地址
     * @param approved 是否批准
     */
    function approveSuperNode(address nodeAddress, bool approved) 
        external onlyAdmin {
        require(superNodes[nodeAddress].nodeAddress != address(0), "Super node not found");
        require(superNodes[nodeAddress].status == NodeStatus.PENDING, "Node not pending approval");
        
        NodeStatus oldStatus = superNodes[nodeAddress].status;
        superNodes[nodeAddress].status = approved ? NodeStatus.ACTIVE : NodeStatus.SUSPENDED;
        
        emit NodeStatusChanged(nodeAddress, NodeType.SUPER, oldStatus, superNodes[nodeAddress].status);
    }
    
    /**
     * @dev 更新节点状态
     * @param nodeAddress 节点地址
     * @param nodeType 节点类型
     * @param newStatus 新状态
     */
    function updateNodeStatus(
        address nodeAddress,
        NodeType nodeType,
        NodeStatus newStatus
    ) external onlyAdmin {
        NodeStatus oldStatus;
        
        if (nodeType == NodeType.ORDINARY) {
            require(ordinaryNodes[nodeAddress].nodeAddress != address(0), "Ordinary node not found");
            oldStatus = ordinaryNodes[nodeAddress].status;
            ordinaryNodes[nodeAddress].status = newStatus;
        } else {
            require(superNodes[nodeAddress].nodeAddress != address(0), "Super node not found");
            oldStatus = superNodes[nodeAddress].status;
            superNodes[nodeAddress].status = newStatus;
        }
        
        emit NodeStatusChanged(nodeAddress, nodeType, oldStatus, newStatus);
    }
    
    /**
     * @dev 验证TEE认证
     * @param teeId TEE标识
     * @param nodeAddress 节点地址
     * @param attestationData 认证数据
     */
    function verifyTEEAttestation(
        bytes32 teeId,
        address nodeAddress,
        bytes memory attestationData
    ) internal pure returns (bool) {
        // 简化实现：实际应该验证TEE硬件认证
        return teeId != bytes32(0) && 
               nodeAddress != address(0) && 
               attestationData.length > 0;
    }
    
    /**
     * @dev 验证投票签名
     * @param roundNumber 轮次号
     * @param isApproval 是否赞成
     * @param signature 签名
     */
    function verifyVoteSignature(
        uint256 roundNumber,
        bool isApproval,
        bytes memory signature
    ) internal pure returns (bool) {
        // 简化实现：实际应该验证ECDSA签名
        return roundNumber > 0 && signature.length > 0;
    }
    
    /**
     * @dev 更新共识参数
     * @param newThreshold 新的共识阈值
     * @param newRoundDuration 新的轮次持续时间
     */
    function updateConsensusParams(
        uint256 newThreshold,
        uint256 newRoundDuration
    ) external onlyAdmin {
        require(newThreshold > 50 && newThreshold <= 100, "Invalid threshold");
        require(newRoundDuration > 0, "Invalid round duration");

        consensusThreshold = newThreshold;
        roundDuration = newRoundDuration;
    }

    /**
     * @dev 获取网络统计信息
     */
    function getNetworkStats() external view returns (
        uint256 totalOrdinaryNodes,
        uint256 activeOrdinaryNodes,
        uint256 totalSuperNodes,
        uint256 activeSuperNodes,
        uint256 currentRoundNumber,
        uint256 totalRounds
    ) {
        return (
            ordinaryNodeList.length,
            getActiveOrdinaryNodeCount(),
            superNodeList.length,
            getActiveSuperNodeCount(),
            currentRound,
            currentRound
        );
    }
}
