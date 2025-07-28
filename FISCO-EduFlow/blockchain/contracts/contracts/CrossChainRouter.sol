// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CrossChainRouter
 * @dev 跨链路由合约，管理主链与侧链之间的消息传递
 * @author XueLianTong Team
 */
contract CrossChainRouter {
    
    // 跨链消息结构
    struct CrossChainMessage {
        string messageId;
        string sourceChain;
        string targetChain;
        string messageType;
        bytes payload;
        address sender;
        uint256 timestamp;
        uint256 nonce;
        bytes signature;
        MessageStatus status;
    }
    
    // 消息状态枚举
    enum MessageStatus { PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED }
    
    // 链信息结构
    struct ChainInfo {
        string chainName;
        uint256 chainId;
        address validator;
        bool isActive;
        uint256 registeredAt;
    }
    
    // 事件定义
    event MessageSent(
        string indexed messageId,
        string indexed sourceChain,
        string indexed targetChain,
        string messageType,
        address sender
    );
    
    event MessageProcessed(
        string indexed messageId,
        MessageStatus status,
        bytes result
    );
    
    event ChainRegistered(
        string indexed chainName,
        uint256 chainId,
        address validator
    );
    
    event ValidatorUpdated(
        string indexed chainName,
        address oldValidator,
        address newValidator
    );
    
    // 状态变量
    mapping(string => CrossChainMessage) public messages;
    mapping(string => ChainInfo) public chains;
    mapping(address => string) public validatorToChain;
    mapping(string => string[]) public chainMessages; // chainName => messageIds
    
    string[] public registeredChains;
    uint256 public messageCount;
    uint256 public messageTimeout;
    
    address public owner;
    address public relayer; // 跨链中继器
    
    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyValidator(string memory chainName) {
        require(chains[chainName].validator == msg.sender, "Not authorized validator");
        _;
    }
    
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer can call this function");
        _;
    }
    
    modifier validChain(string memory chainName) {
        require(chains[chainName].isActive, "Chain not registered or inactive");
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _messageTimeout 消息超时时间（秒）
     * @param _relayer 跨链中继器地址
     */
    constructor(uint256 _messageTimeout, address _relayer) {
        owner = msg.sender;
        messageTimeout = _messageTimeout;
        relayer = _relayer;
        messageCount = 0;
    }
    
    /**
     * @dev 注册链
     * @param chainName 链名称
     * @param chainId 链ID
     * @param validator 验证器地址
     */
    function registerChain(
        string memory chainName,
        uint256 chainId,
        address validator
    ) external onlyOwner {
        require(bytes(chainName).length > 0, "Chain name cannot be empty");
        require(validator != address(0), "Invalid validator address");
        require(!chains[chainName].isActive, "Chain already registered");
        
        chains[chainName] = ChainInfo({
            chainName: chainName,
            chainId: chainId,
            validator: validator,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        validatorToChain[validator] = chainName;
        registeredChains.push(chainName);
        
        emit ChainRegistered(chainName, chainId, validator);
    }
    
    /**
     * @dev 发送跨链消息
     * @param messageId 消息ID
     * @param targetChain 目标链
     * @param messageType 消息类型
     * @param payload 消息载荷
     * @param signature 发送者签名
     */
    function sendMessage(
        string memory messageId,
        string memory targetChain,
        string memory messageType,
        bytes memory payload,
        bytes memory signature
    ) external validChain(targetChain) {
        require(bytes(messageId).length > 0, "Message ID cannot be empty");
        require(messages[messageId].timestamp == 0, "Message ID already exists");
        require(payload.length > 0, "Payload cannot be empty");
        
        string memory sourceChain = validatorToChain[msg.sender];
        require(bytes(sourceChain).length > 0, "Sender not a registered validator");
        
        // 验证签名
        bytes32 messageHash = keccak256(abi.encodePacked(
            messageId,
            sourceChain,
            targetChain,
            messageType,
            payload,
            msg.sender,
            block.timestamp
        ));
        
        require(verifySignature(messageHash, signature, msg.sender), "Invalid signature");
        
        // 创建跨链消息
        messages[messageId] = CrossChainMessage({
            messageId: messageId,
            sourceChain: sourceChain,
            targetChain: targetChain,
            messageType: messageType,
            payload: payload,
            sender: msg.sender,
            timestamp: block.timestamp,
            nonce: messageCount,
            signature: signature,
            status: MessageStatus.PENDING
        });
        
        chainMessages[targetChain].push(messageId);
        messageCount++;
        
        emit MessageSent(messageId, sourceChain, targetChain, messageType, msg.sender);
    }
    
    /**
     * @dev 处理跨链消息
     * @param messageId 消息ID
     * @param result 处理结果
     * @param success 是否成功
     */
    function processMessage(
        string memory messageId,
        bytes memory result,
        bool success
    ) external onlyRelayer {
        CrossChainMessage storage message = messages[messageId];
        require(message.timestamp > 0, "Message not found");
        require(message.status == MessageStatus.PENDING, "Message already processed");
        require(block.timestamp <= message.timestamp + messageTimeout, "Message expired");
        
        message.status = success ? MessageStatus.COMPLETED : MessageStatus.FAILED;
        
        emit MessageProcessed(messageId, message.status, result);
    }
    
    /**
     * @dev 获取待处理的消息
     * @param chainName 链名称
     * @return messageIds 消息ID列表
     */
    function getPendingMessages(string memory chainName) 
        external view validChain(chainName) returns (string[] memory messageIds) {
        string[] memory allMessages = chainMessages[chainName];
        uint256 pendingCount = 0;
        
        // 计算待处理消息数量
        for (uint256 i = 0; i < allMessages.length; i++) {
            if (messages[allMessages[i]].status == MessageStatus.PENDING) {
                pendingCount++;
            }
        }
        
        // 构建待处理消息数组
        messageIds = new string[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allMessages.length; i++) {
            if (messages[allMessages[i]].status == MessageStatus.PENDING) {
                messageIds[index] = allMessages[i];
                index++;
            }
        }
        
        return messageIds;
    }
    
    /**
     * @dev 获取消息详情
     * @param messageId 消息ID
     */
    function getMessage(string memory messageId) 
        external view returns (CrossChainMessage memory) {
        require(messages[messageId].timestamp > 0, "Message not found");
        return messages[messageId];
    }
    
    /**
     * @dev 批量处理消息
     * @param messageIds 消息ID列表
     * @param results 处理结果列表
     * @param successes 成功状态列表
     */
    function batchProcessMessages(
        string[] memory messageIds,
        bytes[] memory results,
        bool[] memory successes
    ) external onlyRelayer {
        require(messageIds.length == results.length, "Array length mismatch");
        require(messageIds.length == successes.length, "Array length mismatch");
        require(messageIds.length <= 50, "Too many messages in batch");
        
        for (uint256 i = 0; i < messageIds.length; i++) {
            CrossChainMessage storage message = messages[messageIds[i]];
            if (message.timestamp > 0 && 
                message.status == MessageStatus.PENDING &&
                block.timestamp <= message.timestamp + messageTimeout) {
                
                message.status = successes[i] ? MessageStatus.COMPLETED : MessageStatus.FAILED;
                emit MessageProcessed(messageIds[i], message.status, results[i]);
            }
        }
    }
    
    /**
     * @dev 清理过期消息
     * @param messageIds 要清理的消息ID列表
     */
    function cleanupExpiredMessages(string[] memory messageIds) external {
        for (uint256 i = 0; i < messageIds.length; i++) {
            CrossChainMessage storage message = messages[messageIds[i]];
            if (message.timestamp > 0 && 
                message.status == MessageStatus.PENDING &&
                block.timestamp > message.timestamp + messageTimeout) {
                
                message.status = MessageStatus.EXPIRED;
                emit MessageProcessed(messageIds[i], MessageStatus.EXPIRED, "");
            }
        }
    }
    
    /**
     * @dev 更新链验证器
     * @param chainName 链名称
     * @param newValidator 新验证器地址
     */
    function updateValidator(string memory chainName, address newValidator) 
        external onlyOwner validChain(chainName) {
        require(newValidator != address(0), "Invalid validator address");
        
        address oldValidator = chains[chainName].validator;
        chains[chainName].validator = newValidator;
        
        // 更新映射
        delete validatorToChain[oldValidator];
        validatorToChain[newValidator] = chainName;
        
        emit ValidatorUpdated(chainName, oldValidator, newValidator);
    }
    
    /**
     * @dev 停用链
     * @param chainName 链名称
     */
    function deactivateChain(string memory chainName) 
        external onlyOwner validChain(chainName) {
        chains[chainName].isActive = false;
        delete validatorToChain[chains[chainName].validator];
    }
    
    /**
     * @dev 更新中继器
     * @param newRelayer 新中继器地址
     */
    function updateRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "Invalid relayer address");
        relayer = newRelayer;
    }
    
    /**
     * @dev 更新消息超时时间
     * @param newTimeout 新超时时间
     */
    function updateMessageTimeout(uint256 newTimeout) external onlyOwner {
        require(newTimeout > 0, "Timeout must be positive");
        messageTimeout = newTimeout;
    }
    
    /**
     * @dev 获取链统计信息
     * @param chainName 链名称
     */
    function getChainStatistics(string memory chainName) 
        external view validChain(chainName) returns (
            uint256 totalMessages,
            uint256 pendingMessages,
            uint256 completedMessages,
            uint256 failedMessages
        ) {
        string[] memory allMessages = chainMessages[chainName];
        totalMessages = allMessages.length;
        
        for (uint256 i = 0; i < allMessages.length; i++) {
            MessageStatus status = messages[allMessages[i]].status;
            if (status == MessageStatus.PENDING) {
                pendingMessages++;
            } else if (status == MessageStatus.COMPLETED) {
                completedMessages++;
            } else if (status == MessageStatus.FAILED) {
                failedMessages++;
            }
        }
        
        return (totalMessages, pendingMessages, completedMessages, failedMessages);
    }
    
    /**
     * @dev 获取所有注册的链
     */
    function getRegisteredChains() external view returns (string[] memory) {
        return registeredChains;
    }
    
    /**
     * @dev 验证签名
     */
    function verifySignature(bytes32 messageHash, bytes memory signature, address signer) 
        internal pure returns (bool) {
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);
        
        return recoveredSigner == signer;
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
    }
    
    /**
     * @dev 紧急暂停功能
     */
    function emergencyPause() external onlyOwner {
        // 实现紧急暂停逻辑
        // 可以阻止新消息的发送和处理
    }
}
