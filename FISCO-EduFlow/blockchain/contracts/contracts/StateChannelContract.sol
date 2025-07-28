// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title StateChannelContract
 * @dev 单个状态通道合约，管理特定通道的状态和生命周期
 * @author XueLianTong Team
 */
contract StateChannelContract {
    
    // 通道状态枚举
    enum ChannelStatus { OPENING, ACTIVE, CLOSING, CLOSED, DISPUTED }
    
    // 事件定义
    event ChannelOpened(string channelId, address[] participants);
    event StateUpdated(string channelId, uint256 nonce, bytes32 stateHash);
    event ChannelClosed(string channelId, bytes32 finalStateHash);
    event DisputeInitiated(string channelId, address initiator, string reason);
    event DisputeResolved(string channelId, bytes32 resolvedStateHash);
    event ParticipantJoined(string channelId, address participant);
    event MessageSent(string channelId, address from, address to, string messageType);
    
    // 状态变量
    string public channelId;
    address[] public participants;
    mapping(address => bool) public isParticipant;
    mapping(address => bool) public hasJoined;
    
    uint256 public deposit;
    uint256 public timeout;
    uint256 public createdAt;
    uint256 public lastUpdateAt;
    
    ChannelStatus public status;
    uint256 public nonce;
    bytes32 public currentStateHash;
    
    address public factory;
    
    // 争议相关
    struct Dispute {
        address initiator;
        string reason;
        bytes32 proposedStateHash;
        uint256 initiatedAt;
        bool resolved;
    }
    Dispute public currentDispute;
    
    // 签名验证
    mapping(bytes32 => mapping(address => bool)) public signatures;
    
    // 修饰符
    modifier onlyParticipant() {
        require(isParticipant[msg.sender], "Not a participant");
        _;
    }
    
    modifier onlyActive() {
        require(status == ChannelStatus.ACTIVE, "Channel not active");
        _;
    }
    
    modifier notExpired() {
        require(block.timestamp <= createdAt + timeout, "Channel expired");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this");
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _channelId 通道ID
     * @param _participants 参与者地址列表
     * @param _deposit 每个参与者的保证金
     * @param _timeout 通道超时时间
     * @param _factory 工厂合约地址
     */
    constructor(
        string memory _channelId,
        address[] memory _participants,
        uint256 _deposit,
        uint256 _timeout,
        address _factory
    ) {
        channelId = _channelId;
        participants = _participants;
        deposit = _deposit;
        timeout = _timeout;
        factory = _factory;
        
        createdAt = block.timestamp;
        lastUpdateAt = block.timestamp;
        status = ChannelStatus.OPENING;
        nonce = 0;
        
        // 设置参与者映射
        for (uint i = 0; i < _participants.length; i++) {
            isParticipant[_participants[i]] = true;
        }
    }
    
    /**
     * @dev 参与者加入通道
     */
    function joinChannel() external onlyParticipant {
        require(!hasJoined[msg.sender], "Already joined");
        require(status == ChannelStatus.OPENING, "Channel not in opening state");
        
        hasJoined[msg.sender] = true;
        
        // 检查是否所有参与者都已加入
        bool allJoined = true;
        for (uint i = 0; i < participants.length; i++) {
            if (!hasJoined[participants[i]]) {
                allJoined = false;
                break;
            }
        }
        
        if (allJoined) {
            status = ChannelStatus.ACTIVE;
            emit ChannelOpened(channelId, participants);
        }
        
        emit ParticipantJoined(channelId, msg.sender);
    }
    
    /**
     * @dev 更新通道状态
     * @param newStateHash 新状态的哈希
     * @param _signatures 参与者签名列表
     */
    function updateState(
        bytes32 newStateHash,
        bytes[] memory _signatures
    ) external onlyParticipant onlyActive notExpired {
        require(newStateHash != bytes32(0), "Invalid state hash");
        require(_signatures.length >= getRequiredSignatures(), "Insufficient signatures");
        
        uint256 newNonce = nonce + 1;
        
        // 验证签名
        bytes32 messageHash = keccak256(abi.encodePacked(
            channelId,
            newNonce,
            newStateHash
        ));
        
        uint256 validSignatures = 0;
        for (uint i = 0; i < _signatures.length && i < participants.length; i++) {
            address signer = recoverSigner(messageHash, _signatures[i]);
            if (isParticipant[signer] && !signatures[messageHash][signer]) {
                signatures[messageHash][signer] = true;
                validSignatures++;
            }
        }
        
        require(validSignatures >= getRequiredSignatures(), "Invalid signatures");
        
        // 更新状态
        nonce = newNonce;
        currentStateHash = newStateHash;
        lastUpdateAt = block.timestamp;
        
        emit StateUpdated(channelId, nonce, newStateHash);
    }
    
    /**
     * @dev 发送通道消息
     * @param to 接收者地址
     * @param messageType 消息类型
     * @param messageHash 消息哈希
     * @param signature 发送者签名
     */
    function sendMessage(
        address to,
        string memory messageType,
        bytes32 messageHash,
        bytes memory signature
    ) external onlyParticipant onlyActive {
        require(isParticipant[to], "Recipient not a participant");
        require(to != msg.sender, "Cannot send to self");
        
        // 验证消息签名
        bytes32 msgHash = keccak256(abi.encodePacked(
            channelId,
            msg.sender,
            to,
            messageType,
            messageHash,
            block.timestamp
        ));
        
        address signer = recoverSigner(msgHash, signature);
        require(signer == msg.sender, "Invalid message signature");
        
        emit MessageSent(channelId, msg.sender, to, messageType);
    }
    
    /**
     * @dev 关闭通道
     * @param finalStateHash 最终状态哈希
     * @param _signatures 所有参与者的签名
     */
    function closeChannel(
        bytes32 finalStateHash,
        bytes[] memory _signatures
    ) external onlyParticipant {
        require(status == ChannelStatus.ACTIVE, "Channel not active");
        require(_signatures.length == participants.length, "Need all signatures");
        
        // 验证所有参与者的签名
        bytes32 messageHash = keccak256(abi.encodePacked(
            channelId,
            "CLOSE",
            finalStateHash
        ));
        
        for (uint i = 0; i < participants.length; i++) {
            address signer = recoverSigner(messageHash, _signatures[i]);
            require(signer == participants[i], "Invalid signature");
        }
        
        // 关闭通道
        status = ChannelStatus.CLOSED;
        currentStateHash = finalStateHash;
        
        // 分配资金
        _distributeFunds();
        
        // 通知工厂合约
        (bool success,) = factory.call(
            abi.encodeWithSignature("onChannelClosed(string)", channelId)
        );
        require(success, "Factory notification failed");
        
        emit ChannelClosed(channelId, finalStateHash);
    }
    
    /**
     * @dev 发起争议
     * @param reason 争议原因
     * @param proposedStateHash 提议的状态哈希
     */
    function initiateDispute(
        string memory reason,
        bytes32 proposedStateHash
    ) external onlyParticipant onlyActive {
        require(currentDispute.initiatedAt == 0, "Dispute already exists");
        
        currentDispute = Dispute({
            initiator: msg.sender,
            reason: reason,
            proposedStateHash: proposedStateHash,
            initiatedAt: block.timestamp,
            resolved: false
        });
        
        status = ChannelStatus.DISPUTED;
        
        emit DisputeInitiated(channelId, msg.sender, reason);
    }
    
    /**
     * @dev 解决争议（简化版本，实际应该有更复杂的仲裁机制）
     * @param resolvedStateHash 解决后的状态哈希
     */
    function resolveDispute(bytes32 resolvedStateHash) external onlyFactory {
        require(status == ChannelStatus.DISPUTED, "No active dispute");
        require(!currentDispute.resolved, "Dispute already resolved");
        
        currentDispute.resolved = true;
        currentStateHash = resolvedStateHash;
        status = ChannelStatus.ACTIVE;
        
        emit DisputeResolved(channelId, resolvedStateHash);
    }
    
    /**
     * @dev 强制关闭通道（超时后）
     */
    function forceClose() external {
        require(block.timestamp > createdAt + timeout, "Channel not expired");
        require(status != ChannelStatus.CLOSED, "Already closed");
        
        status = ChannelStatus.CLOSED;
        
        // 分配资金
        _distributeFunds();
        
        emit ChannelClosed(channelId, currentStateHash);
    }
    
    /**
     * @dev 获取通道信息
     */
    function getChannelInfo() external view returns (
        string memory _channelId,
        address[] memory _participants,
        uint256 _deposit,
        uint256 _timeout,
        ChannelStatus _status,
        uint256 _nonce,
        bytes32 _currentStateHash,
        uint256 _balance
    ) {
        return (
            channelId,
            participants,
            deposit,
            timeout,
            status,
            nonce,
            currentStateHash,
            address(this).balance
        );
    }
    
    /**
     * @dev 检查通道是否活跃
     */
    function isActive() external view returns (bool) {
        return status == ChannelStatus.ACTIVE;
    }
    
    /**
     * @dev 获取所需签名数量（2/3多数）
     */
    function getRequiredSignatures() public view returns (uint256) {
        return (participants.length * 2 + 2) / 3; // 向上取整的2/3
    }
    
    /**
     * @dev 恢复签名者地址
     */
    function recoverSigner(bytes32 messageHash, bytes memory signature) 
        internal pure returns (address) {
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }
    
    /**
     * @dev 分割签名
     */
    function splitSignature(bytes memory sig) 
        internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature v value");
    }
    
    /**
     * @dev 分配资金（简化版本）
     */
    function _distributeFunds() internal {
        uint256 balance = address(this).balance;
        uint256 amountPerParticipant = balance / participants.length;
        
        for (uint i = 0; i < participants.length; i++) {
            payable(participants[i]).transfer(amountPerParticipant);
        }
    }
    
    /**
     * @dev 接收以太币
     */
    receive() external payable {
        // 允许合约接收以太币
    }
}
