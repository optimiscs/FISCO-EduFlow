// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DigitalCurrencyChannel
 * @dev 数字人民币状态通道合约
 * 
 * 状态通道建立在学生节点和代理机构节点之间，利用数字人民币进行交易和价值流转
 * 利用状态通道交易的流程为：
 * 1. 交易方在链上通过浏览器钱包锁定一定量的资产，在区块链上记录并开辟状态通道
 * 2. 在通道内进行相互交易和状态更新，但不提交到链上
 * 3. 当任一方想要关闭通道时，提交最终状态到区块链上进行清算
 * 4. 若另一方有异议，可在规定时间内申请链上仲裁
 * 
 * @author XueLianTong Team
 */
contract DigitalCurrencyChannel {
    
    // 通道状态枚举
    enum ChannelStatus { OPENING, ACTIVE, CLOSING, CLOSED, DISPUTED }
    
    // 数字人民币通道结构
    struct CurrencyChannel {
        string channelId;
        address participantA;
        address participantB;
        uint256 lockedAmountA;
        uint256 lockedAmountB;
        uint256 balanceA;
        uint256 balanceB;
        uint256 nonce;
        ChannelStatus status;
        uint256 timeout;
        uint256 createdAt;
        uint256 lastUpdateAt;
        bytes32 finalStateHash;
        string purpose; // 通道用途：认证收费、学历验证等
    }
    
    // 争议信息结构
    struct DisputeInfo {
        string disputeId;
        address initiator;
        string reason;
        bytes evidence;
        uint256 initiatedAt;
        uint256 challengePeriod;
        bool resolved;
        address arbitrator;
    }
    
    // 交易记录结构
    struct OffChainTransaction {
        string transactionId;
        string channelId;
        address from;
        address to;
        uint256 amount;
        string purpose;
        uint256 timestamp;
        bytes signature;
        bool settled;
    }
    
    // 事件定义
    event ChannelOpened(
        string indexed channelId,
        address indexed participantA,
        address indexed participantB,
        uint256 totalLocked,
        string purpose
    );
    
    event OffChainTransactionRecorded(
        string indexed channelId,
        string indexed transactionId,
        address indexed from,
        address to,
        uint256 amount,
        string purpose
    );
    
    event ChannelClosed(
        string indexed channelId,
        uint256 finalBalanceA,
        uint256 finalBalanceB
    );
    
    event DisputeInitiated(
        string indexed channelId,
        string indexed disputeId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        string indexed channelId,
        string indexed disputeId,
        address winner,
        uint256 compensationAmount
    );
    
    event FundsReleased(
        string indexed channelId,
        address indexed participant,
        uint256 amount
    );
    
    // 状态变量
    mapping(string => CurrencyChannel) public channels;
    mapping(string => DisputeInfo) public disputes;
    mapping(string => OffChainTransaction[]) public channelTransactions;
    mapping(address => string[]) public participantChannels;
    
    string[] public allChannelIds;
    address public owner;
    address public arbitrator;
    uint256 public defaultTimeout;
    uint256 public challengePeriod;
    uint256 public minLockAmount;
    
    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator can call this function");
        _;
    }
    
    modifier channelExists(string memory channelId) {
        require(bytes(channels[channelId].channelId).length > 0, "Channel does not exist");
        _;
    }
    
    modifier onlyParticipant(string memory channelId) {
        CurrencyChannel storage channel = channels[channelId];
        require(
            msg.sender == channel.participantA || msg.sender == channel.participantB,
            "Only channel participants can call this function"
        );
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _arbitrator 仲裁者地址
     * @param _defaultTimeout 默认超时时间
     * @param _challengePeriod 挑战期时间
     * @param _minLockAmount 最小锁定金额
     */
    constructor(
        address _arbitrator,
        uint256 _defaultTimeout,
        uint256 _challengePeriod,
        uint256 _minLockAmount
    ) {
        owner = msg.sender;
        arbitrator = _arbitrator;
        defaultTimeout = _defaultTimeout;
        challengePeriod = _challengePeriod;
        minLockAmount = _minLockAmount;
    }
    
    /**
     * @dev 开辟数字人民币状态通道
     * 交易方在链上通过浏览器钱包锁定一定量的资产，在区块链上记录并开辟状态通道
     * @param channelId 通道ID
     * @param participantB 参与者B地址
     * @param purpose 通道用途
     */
    function openChannel(
        string memory channelId,
        address participantB,
        string memory purpose
    ) external payable {
        require(bytes(channelId).length > 0, "Channel ID cannot be empty");
        require(participantB != address(0), "Invalid participant B address");
        require(participantB != msg.sender, "Cannot create channel with yourself");
        require(msg.value >= minLockAmount, "Insufficient lock amount");
        require(bytes(channels[channelId].channelId).length == 0, "Channel already exists");
        
        // 创建通道
        channels[channelId] = CurrencyChannel({
            channelId: channelId,
            participantA: msg.sender,
            participantB: participantB,
            lockedAmountA: msg.value,
            lockedAmountB: 0,
            balanceA: msg.value,
            balanceB: 0,
            nonce: 0,
            status: ChannelStatus.OPENING,
            timeout: defaultTimeout,
            createdAt: block.timestamp,
            lastUpdateAt: block.timestamp,
            finalStateHash: bytes32(0),
            purpose: purpose
        });
        
        // 更新索引
        allChannelIds.push(channelId);
        participantChannels[msg.sender].push(channelId);
        participantChannels[participantB].push(channelId);
        
        emit ChannelOpened(channelId, msg.sender, participantB, msg.value, purpose);
    }
    
    /**
     * @dev 参与者B加入通道并锁定资产
     * @param channelId 通道ID
     */
    function joinChannel(string memory channelId) 
        external payable channelExists(channelId) {
        
        CurrencyChannel storage channel = channels[channelId];
        require(msg.sender == channel.participantB, "Only designated participant B can join");
        require(channel.status == ChannelStatus.OPENING, "Channel not in opening state");
        require(msg.value >= minLockAmount, "Insufficient lock amount");
        
        // 更新通道状态
        channel.lockedAmountB = msg.value;
        channel.balanceB = msg.value;
        channel.status = ChannelStatus.ACTIVE;
        channel.lastUpdateAt = block.timestamp;
        
        emit ChannelOpened(
            channelId, 
            channel.participantA, 
            channel.participantB, 
            channel.lockedAmountA + channel.lockedAmountB,
            channel.purpose
        );
    }
    
    /**
     * @dev 记录链下交易（用于争议解决）
     * 在通道内进行相互交易和状态更新，但不提交到链上
     * @param channelId 通道ID
     * @param transactionId 交易ID
     * @param to 接收方地址
     * @param amount 交易金额
     * @param purpose 交易目的
     * @param signature 交易签名
     */
    function recordOffChainTransaction(
        string memory channelId,
        string memory transactionId,
        address to,
        uint256 amount,
        string memory purpose,
        bytes memory signature
    ) external channelExists(channelId) onlyParticipant(channelId) {
        
        CurrencyChannel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.ACTIVE, "Channel not active");
        require(to == channel.participantA || to == channel.participantB, "Invalid recipient");
        require(to != msg.sender, "Cannot send to yourself");
        
        // 创建交易记录
        OffChainTransaction memory transaction = OffChainTransaction({
            transactionId: transactionId,
            channelId: channelId,
            from: msg.sender,
            to: to,
            amount: amount,
            purpose: purpose,
            timestamp: block.timestamp,
            signature: signature,
            settled: false
        });
        
        channelTransactions[channelId].push(transaction);
        
        emit OffChainTransactionRecorded(channelId, transactionId, msg.sender, to, amount, purpose);
    }
    
    /**
     * @dev 关闭通道并进行最终清算
     * 当任一方想要关闭通道时，提交最终状态到区块链上进行清算
     * @param channelId 通道ID
     * @param finalBalanceA 参与者A的最终余额
     * @param finalBalanceB 参与者B的最终余额
     * @param nonce 最终nonce
     * @param signatureA 参与者A的签名
     * @param signatureB 参与者B的签名
     */
    function closeChannel(
        string memory channelId,
        uint256 finalBalanceA,
        uint256 finalBalanceB,
        uint256 nonce,
        bytes memory signatureA,
        bytes memory signatureB
    ) external channelExists(channelId) onlyParticipant(channelId) {
        
        CurrencyChannel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.ACTIVE, "Channel not active");
        require(
            finalBalanceA + finalBalanceB == channel.lockedAmountA + channel.lockedAmountB,
            "Invalid final balances"
        );
        require(nonce >= channel.nonce, "Invalid nonce");
        
        // 验证签名（简化实现）
        require(signatureA.length > 0 && signatureB.length > 0, "Invalid signatures");
        
        // 计算最终状态哈希
        bytes32 finalStateHash = keccak256(abi.encodePacked(
            channelId,
            finalBalanceA,
            finalBalanceB,
            nonce
        ));
        
        // 更新通道状态
        channel.balanceA = finalBalanceA;
        channel.balanceB = finalBalanceB;
        channel.nonce = nonce;
        channel.finalStateHash = finalStateHash;
        channel.status = ChannelStatus.CLOSING;
        channel.lastUpdateAt = block.timestamp;
        
        // 开始挑战期
        // 在挑战期内，另一方可以提出争议
        
        emit ChannelClosed(channelId, finalBalanceA, finalBalanceB);
    }
    
    /**
     * @dev 发起争议
     * 若另一方有异议，可在规定时间内申请链上仲裁
     * @param channelId 通道ID
     * @param disputeId 争议ID
     * @param reason 争议原因
     * @param evidence 证据
     */
    function initiateDispute(
        string memory channelId,
        string memory disputeId,
        string memory reason,
        bytes memory evidence
    ) external channelExists(channelId) onlyParticipant(channelId) {
        
        CurrencyChannel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.CLOSING, "Channel not in closing state");
        require(
            block.timestamp <= channel.lastUpdateAt + challengePeriod,
            "Challenge period expired"
        );
        require(bytes(disputes[disputeId].disputeId).length == 0, "Dispute already exists");
        
        // 创建争议
        disputes[disputeId] = DisputeInfo({
            disputeId: disputeId,
            initiator: msg.sender,
            reason: reason,
            evidence: evidence,
            initiatedAt: block.timestamp,
            challengePeriod: challengePeriod,
            resolved: false,
            arbitrator: arbitrator
        });
        
        // 更新通道状态
        channel.status = ChannelStatus.DISPUTED;
        
        emit DisputeInitiated(channelId, disputeId, msg.sender, reason);
    }
    
    /**
     * @dev 解决争议（仅仲裁者）
     * @param channelId 通道ID
     * @param disputeId 争议ID
     * @param winner 胜方地址
     * @param compensationAmount 补偿金额
     */
    function resolveDispute(
        string memory channelId,
        string memory disputeId,
        address winner,
        uint256 compensationAmount
    ) external onlyArbitrator channelExists(channelId) {
        
        DisputeInfo storage dispute = disputes[disputeId];
        require(bytes(dispute.disputeId).length > 0, "Dispute does not exist");
        require(!dispute.resolved, "Dispute already resolved");
        
        CurrencyChannel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.DISPUTED, "Channel not in disputed state");
        
        // 解决争议
        dispute.resolved = true;
        
        // 调整最终余额
        if (winner == channel.participantA) {
            channel.balanceA += compensationAmount;
            channel.balanceB -= compensationAmount;
        } else if (winner == channel.participantB) {
            channel.balanceB += compensationAmount;
            channel.balanceA -= compensationAmount;
        }
        
        // 关闭通道
        channel.status = ChannelStatus.CLOSED;
        
        emit DisputeResolved(channelId, disputeId, winner, compensationAmount);
        emit ChannelClosed(channelId, channel.balanceA, channel.balanceB);
    }
    
    /**
     * @dev 提取资金（通道关闭后）
     * @param channelId 通道ID
     */
    function withdrawFunds(string memory channelId) 
        external channelExists(channelId) onlyParticipant(channelId) {
        
        CurrencyChannel storage channel = channels[channelId];
        require(channel.status == ChannelStatus.CLOSED, "Channel not closed");
        
        uint256 amount;
        if (msg.sender == channel.participantA) {
            amount = channel.balanceA;
            channel.balanceA = 0;
        } else {
            amount = channel.balanceB;
            channel.balanceB = 0;
        }
        
        require(amount > 0, "No funds to withdraw");
        
        // 转账
        payable(msg.sender).transfer(amount);
        
        emit FundsReleased(channelId, msg.sender, amount);
    }
    
    /**
     * @dev 强制关闭过期通道
     * @param channelId 通道ID
     */
    function forceCloseExpiredChannel(string memory channelId) 
        external channelExists(channelId) {
        
        CurrencyChannel storage channel = channels[channelId];
        require(
            block.timestamp > channel.createdAt + channel.timeout,
            "Channel not expired"
        );
        require(channel.status != ChannelStatus.CLOSED, "Channel already closed");
        
        // 强制关闭，按初始锁定金额分配
        channel.balanceA = channel.lockedAmountA;
        channel.balanceB = channel.lockedAmountB;
        channel.status = ChannelStatus.CLOSED;
        
        emit ChannelClosed(channelId, channel.balanceA, channel.balanceB);
    }
    
    /**
     * @dev 获取通道信息
     * @param channelId 通道ID
     */
    function getChannelInfo(string memory channelId) 
        external view channelExists(channelId) returns (
            address participantA,
            address participantB,
            uint256 balanceA,
            uint256 balanceB,
            ChannelStatus status,
            string memory purpose
        ) {
        CurrencyChannel storage channel = channels[channelId];
        return (
            channel.participantA,
            channel.participantB,
            channel.balanceA,
            channel.balanceB,
            channel.status,
            channel.purpose
        );
    }
    
    /**
     * @dev 获取通道交易历史
     * @param channelId 通道ID
     */
    function getChannelTransactions(string memory channelId) 
        external view returns (OffChainTransaction[] memory) {
        return channelTransactions[channelId];
    }
    
    /**
     * @dev 获取参与者的所有通道
     * @param participant 参与者地址
     */
    function getParticipantChannels(address participant) 
        external view returns (string[] memory) {
        return participantChannels[participant];
    }
    
    /**
     * @dev 更新仲裁者（仅所有者）
     * @param newArbitrator 新仲裁者地址
     */
    function updateArbitrator(address newArbitrator) external onlyOwner {
        require(newArbitrator != address(0), "Invalid arbitrator address");
        arbitrator = newArbitrator;
    }
    
    /**
     * @dev 更新挑战期（仅所有者）
     * @param newChallengePeriod 新挑战期
     */
    function updateChallengePeriod(uint256 newChallengePeriod) external onlyOwner {
        require(newChallengePeriod > 0, "Invalid challenge period");
        challengePeriod = newChallengePeriod;
    }
    
    /**
     * @dev 紧急暂停功能（仅所有者）
     */
    function emergencyPause() external onlyOwner {
        // 实现紧急暂停逻辑
    }
    
    /**
     * @dev 接收以太币
     */
    receive() external payable {
        // 允许合约接收以太币
    }
}
