// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StateChannelContract.sol";

/**
 * @title StateChannelFactory
 * @dev 状态通道工厂合约，用于创建和管理状态通道
 * @author XueLianTong Team
 */
contract StateChannelFactory {
    
    // 事件定义
    event ChannelCreated(
        string indexed channelId,
        address indexed channelContract,
        address[] participants,
        uint256 deposit,
        uint256 timeout
    );
    
    event ChannelClosed(
        string indexed channelId,
        address indexed channelContract
    );
    
    // 状态变量
    mapping(string => address) public channels; // channelId => contract address
    mapping(address => string[]) public participantChannels; // participant => channelIds
    string[] public allChannelIds;
    
    address public owner;
    uint256 public minDeposit;
    uint256 public maxTimeout;
    uint256 public channelCount;
    
    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validChannelId(string memory channelId) {
        require(bytes(channelId).length > 0, "Channel ID cannot be empty");
        require(channels[channelId] == address(0), "Channel ID already exists");
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _minDeposit 最小保证金
     * @param _maxTimeout 最大超时时间
     */
    constructor(uint256 _minDeposit, uint256 _maxTimeout) {
        owner = msg.sender;
        minDeposit = _minDeposit;
        maxTimeout = _maxTimeout;
        channelCount = 0;
    }
    
    /**
     * @dev 创建状态通道
     * @param channelId 通道ID
     * @param participants 参与者地址列表
     * @param deposit 保证金金额
     * @param timeout 超时时间
     * @return channelContract 创建的通道合约地址
     */
    function createChannel(
        string memory channelId,
        address[] memory participants,
        uint256 deposit,
        uint256 timeout
    ) external payable validChannelId(channelId) returns (address channelContract) {
        require(participants.length >= 2, "At least 2 participants required");
        require(participants.length <= 10, "Too many participants");
        require(deposit >= minDeposit, "Deposit too low");
        require(timeout <= maxTimeout, "Timeout too long");
        require(msg.value >= deposit * participants.length, "Insufficient deposit");
        
        // 验证参与者地址
        for (uint i = 0; i < participants.length; i++) {
            require(participants[i] != address(0), "Invalid participant address");
            for (uint j = i + 1; j < participants.length; j++) {
                require(participants[i] != participants[j], "Duplicate participant");
            }
        }
        
        // 创建通道合约
        StateChannelContract channel = new StateChannelContract(
            channelId,
            participants,
            deposit,
            timeout,
            address(this)
        );
        
        channelContract = address(channel);
        
        // 转移保证金到通道合约
        payable(channelContract).transfer(msg.value);
        
        // 更新状态
        channels[channelId] = channelContract;
        allChannelIds.push(channelId);
        channelCount++;
        
        // 更新参与者通道列表
        for (uint i = 0; i < participants.length; i++) {
            participantChannels[participants[i]].push(channelId);
        }
        
        emit ChannelCreated(channelId, channelContract, participants, deposit, timeout);
        
        return channelContract;
    }
    
    /**
     * @dev 获取通道合约地址
     * @param channelId 通道ID
     * @return 通道合约地址
     */
    function getChannelContract(string memory channelId) external view returns (address) {
        return channels[channelId];
    }
    
    /**
     * @dev 获取参与者的所有通道
     * @param participant 参与者地址
     * @return 通道ID列表
     */
    function getParticipantChannels(address participant) external view returns (string[] memory) {
        return participantChannels[participant];
    }
    
    /**
     * @dev 获取所有通道ID
     * @return 所有通道ID列表
     */
    function getAllChannels() external view returns (string[] memory) {
        return allChannelIds;
    }
    
    /**
     * @dev 通道关闭回调（由通道合约调用）
     * @param channelId 通道ID
     */
    function onChannelClosed(string memory channelId) external {
        address channelContract = channels[channelId];
        require(msg.sender == channelContract, "Only channel contract can call this");
        
        emit ChannelClosed(channelId, channelContract);
    }
    
    /**
     * @dev 更新最小保证金（仅所有者）
     * @param _minDeposit 新的最小保证金
     */
    function updateMinDeposit(uint256 _minDeposit) external onlyOwner {
        minDeposit = _minDeposit;
    }
    
    /**
     * @dev 更新最大超时时间（仅所有者）
     * @param _maxTimeout 新的最大超时时间
     */
    function updateMaxTimeout(uint256 _maxTimeout) external onlyOwner {
        maxTimeout = _maxTimeout;
    }
    
    /**
     * @dev 紧急暂停功能（仅所有者）
     */
    function emergencyPause() external onlyOwner {
        // 实现紧急暂停逻辑
        // 可以阻止新通道的创建
    }
    
    /**
     * @dev 获取合约统计信息
     * @return totalChannels 总通道数
     * @return activeChannels 活跃通道数
     * @return totalDeposit 总保证金
     */
    function getStatistics() external view returns (
        uint256 totalChannels,
        uint256 activeChannels,
        uint256 totalDeposit
    ) {
        totalChannels = channelCount;
        activeChannels = 0;
        totalDeposit = 0;
        
        for (uint i = 0; i < allChannelIds.length; i++) {
            address channelContract = channels[allChannelIds[i]];
            if (channelContract != address(0)) {
                StateChannelContract channel = StateChannelContract(channelContract);
                if (channel.isActive()) {
                    activeChannels++;
                }
                totalDeposit += channelContract.balance;
            }
        }
        
        return (totalChannels, activeChannels, totalDeposit);
    }
    
    /**
     * @dev 批量创建通道（用于测试或批量操作）
     * @param channelIds 通道ID列表
     * @param participantsList 参与者列表的列表
     * @param deposits 保证金列表
     * @param timeouts 超时时间列表
     */
    function batchCreateChannels(
        string[] memory channelIds,
        address[][] memory participantsList,
        uint256[] memory deposits,
        uint256[] memory timeouts
    ) external payable {
        require(channelIds.length == participantsList.length, "Array length mismatch");
        require(channelIds.length == deposits.length, "Array length mismatch");
        require(channelIds.length == timeouts.length, "Array length mismatch");
        
        uint256 totalRequired = 0;
        for (uint i = 0; i < deposits.length; i++) {
            totalRequired += deposits[i] * participantsList[i].length;
        }
        require(msg.value >= totalRequired, "Insufficient total deposit");
        
        for (uint i = 0; i < channelIds.length; i++) {
            // 这里需要重新计算每个通道需要的保证金
            uint256 channelDeposit = deposits[i] * participantsList[i].length;
            
            // 创建通道（需要修改createChannel函数以支持指定msg.value）
            // 或者使用内部函数来避免重复验证
            _createChannelInternal(
                channelIds[i],
                participantsList[i],
                deposits[i],
                timeouts[i],
                channelDeposit
            );
        }
    }
    
    /**
     * @dev 内部创建通道函数
     */
    function _createChannelInternal(
        string memory channelId,
        address[] memory participants,
        uint256 deposit,
        uint256 timeout,
        uint256 totalDeposit
    ) internal validChannelId(channelId) {
        require(participants.length >= 2, "At least 2 participants required");
        require(deposit >= minDeposit, "Deposit too low");
        require(timeout <= maxTimeout, "Timeout too long");
        
        StateChannelContract channel = new StateChannelContract(
            channelId,
            participants,
            deposit,
            timeout,
            address(this)
        );
        
        address channelContract = address(channel);
        payable(channelContract).transfer(totalDeposit);
        
        channels[channelId] = channelContract;
        allChannelIds.push(channelId);
        channelCount++;
        
        for (uint i = 0; i < participants.length; i++) {
            participantChannels[participants[i]].push(channelId);
        }
        
        emit ChannelCreated(channelId, channelContract, participants, deposit, timeout);
    }
    
    /**
     * @dev 接收以太币
     */
    receive() external payable {
        // 允许合约接收以太币
    }
    
    /**
     * @dev 提取合约余额（仅所有者，紧急情况使用）
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
