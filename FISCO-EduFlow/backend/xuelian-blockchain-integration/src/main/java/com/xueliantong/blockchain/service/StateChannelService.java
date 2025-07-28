package com.xueliantong.blockchain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xueliantong.blockchain.config.FiscoBcosConfig;
import com.xueliantong.blockchain.model.StateChannel;
import com.xueliantong.blockchain.model.StateChannelMessage;
import com.xueliantong.blockchain.model.StateChannelParticipant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.fisco.bcos.sdk.model.TransactionReceipt;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 状态通道服务
 * 实现链下状态通道的创建、管理和结算
 * 
 * @author XueLianTong Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StateChannelService {

    private final FiscoBcosConfig fiscoBcosConfig;
    private final ContractService contractService;
    private final CrossChainService crossChainService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    // 活跃的状态通道
    private final Map<String, StateChannel> activeChannels = new ConcurrentHashMap<>();
    
    // 通道消息历史
    private final Map<String, List<StateChannelMessage>> channelMessages = new ConcurrentHashMap<>();

    /**
     * 创建状态通道
     * 状态通道建立在学生节点和代理机构节点之间，利用数字人民币进行交易和价值流转
     *
     * @param participants 参与者列表
     * @param initialDeposit 初始保证金（数字人民币）
     * @param timeout 超时时间（秒）
     * @param metadata 元数据
     * @return 通道ID
     */
    public CompletableFuture<String> createStateChannel(List<StateChannelParticipant> participants,
                                                       BigInteger initialDeposit, long timeout,
                                                       Map<String, Object> metadata) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 生成通道ID
                String channelId = generateChannelId();
                
                // 验证参与者
                if (participants.size() < 2) {
                    throw new IllegalArgumentException("状态通道至少需要2个参与者");
                }
                
                // 创建状态通道对象
                StateChannel channel = StateChannel.builder()
                        .id(channelId)
                        .participants(participants)
                        .state(new HashMap<>())
                        .nonce(BigInteger.ZERO)
                        .deposit(initialDeposit)
                        .timeout(timeout)
                        .metadata(metadata)
                        .status("OPENING")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                // 在主链部署通道合约
                String channelContractAddress = deployChannelContract(channel);
                channel.setContractAddress(channelContractAddress);

                // 存储通道信息
                activeChannels.put(channelId, channel);
                channelMessages.put(channelId, new ArrayList<>());
                
                // 缓存到Redis
                cacheChannel(channel);
                
                // 通知参与者
                notifyParticipants(channel, "CHANNEL_CREATED", null);
                
                log.info("状态通道创建成功: {}", channelId);
                return channelId;
                
            } catch (Exception e) {
                log.error("创建状态通道失败", e);
                throw new RuntimeException("Failed to create state channel", e);
            }
        });
    }

    /**
     * 加入状态通道
     * 
     * @param channelId 通道ID
     * @param participantAddress 参与者地址
     * @param signature 签名
     * @return 是否成功
     */
    public CompletableFuture<Boolean> joinStateChannel(String channelId, String participantAddress,
                                                      String signature) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                StateChannel channel = getChannel(channelId);
                if (channel == null) {
                    throw new IllegalArgumentException("状态通道不存在: " + channelId);
                }

                // 验证参与者是否被授权加入
                boolean authorized = channel.getParticipants().stream()
                        .anyMatch(p -> p.getAddress().equals(participantAddress));
                
                if (!authorized) {
                    throw new IllegalArgumentException("参与者未被授权加入通道: " + participantAddress);
                }

                // 验证签名
                if (!verifySignature(participantAddress, channelId, signature)) {
                    throw new IllegalArgumentException("签名验证失败");
                }

                // 更新参与者状态
                channel.getParticipants().stream()
                        .filter(p -> p.getAddress().equals(participantAddress))
                        .findFirst()
                        .ifPresent(p -> p.setJoined(true));

                // 检查是否所有参与者都已加入
                boolean allJoined = channel.getParticipants().stream()
                        .allMatch(StateChannelParticipant::isJoined);

                if (allJoined) {
                    channel.setStatus("ACTIVE");
                    log.info("状态通道激活: {}", channelId);
                }

                // 更新通道
                channel.setUpdatedAt(LocalDateTime.now());
                cacheChannel(channel);
                
                // 通知参与者
                notifyParticipants(channel, "PARTICIPANT_JOINED", 
                        Map.of("participant", participantAddress));

                return true;
                
            } catch (Exception e) {
                log.error("加入状态通道失败: {}", channelId, e);
                return false;
            }
        });
    }

    /**
     * 更新状态通道状态
     * 
     * @param channelId 通道ID
     * @param newState 新状态
     * @param signatures 参与者签名
     * @return 是否成功
     */
    public CompletableFuture<Boolean> updateChannelState(String channelId, Map<String, Object> newState,
                                                        Map<String, String> signatures) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                StateChannel channel = getChannel(channelId);
                if (channel == null) {
                    throw new IllegalArgumentException("状态通道不存在: " + channelId);
                }

                if (!"ACTIVE".equals(channel.getStatus())) {
                    throw new IllegalStateException("状态通道未激活: " + channelId);
                }

                // 验证签名数量
                int requiredSignatures = (int) Math.ceil(channel.getParticipants().size() * 0.67);
                if (signatures.size() < requiredSignatures) {
                    throw new IllegalArgumentException("签名数量不足");
                }

                // 验证每个签名
                for (Map.Entry<String, String> entry : signatures.entrySet()) {
                    String address = entry.getKey();
                    String signature = entry.getValue();
                    
                    if (!verifyStateSignature(address, channelId, newState, signature)) {
                        throw new IllegalArgumentException("签名验证失败: " + address);
                    }
                }

                // 更新状态
                channel.setState(newState);
                channel.setNonce(channel.getNonce().add(BigInteger.ONE));
                channel.setUpdatedAt(LocalDateTime.now());
                
                // 缓存更新
                cacheChannel(channel);
                
                // 记录状态更新消息
                StateChannelMessage message = StateChannelMessage.builder()
                        .id(UUID.randomUUID().toString())
                        .channelId(channelId)
                        .type("STATE_UPDATE")
                        .payload(newState)
                        .signatures(signatures)
                        .timestamp(LocalDateTime.now())
                        .build();
                
                addMessage(channelId, message);
                
                // 通知参与者
                notifyParticipants(channel, "STATE_UPDATED", newState);
                
                log.info("状态通道状态更新成功: {}, nonce: {}", channelId, channel.getNonce());
                return true;
                
            } catch (Exception e) {
                log.error("更新状态通道状态失败: {}", channelId, e);
                return false;
            }
        });
    }

    /**
     * 发送通道消息
     * 
     * @param channelId 通道ID
     * @param fromAddress 发送者地址
     * @param messageType 消息类型
     * @param payload 消息载荷
     * @param signature 签名
     * @return 消息ID
     */
    public CompletableFuture<String> sendChannelMessage(String channelId, String fromAddress,
                                                       String messageType, Object payload,
                                                       String signature) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                StateChannel channel = getChannel(channelId);
                if (channel == null) {
                    throw new IllegalArgumentException("状态通道不存在: " + channelId);
                }

                // 验证发送者是通道参与者
                boolean isParticipant = channel.getParticipants().stream()
                        .anyMatch(p -> p.getAddress().equals(fromAddress));
                
                if (!isParticipant) {
                    throw new IllegalArgumentException("发送者不是通道参与者: " + fromAddress);
                }

                // 验证签名
                if (!verifyMessageSignature(fromAddress, channelId, messageType, payload, signature)) {
                    throw new IllegalArgumentException("消息签名验证失败");
                }

                // 创建消息
                String messageId = UUID.randomUUID().toString();
                StateChannelMessage message = StateChannelMessage.builder()
                        .id(messageId)
                        .channelId(channelId)
                        .fromAddress(fromAddress)
                        .type(messageType)
                        .payload(payload)
                        .signatures(Map.of(fromAddress, signature))
                        .timestamp(LocalDateTime.now())
                        .build();

                // 添加消息到历史
                addMessage(channelId, message);
                
                // 处理特定类型的消息
                processChannelMessage(channel, message);
                
                // 通知其他参与者
                notifyOtherParticipants(channel, fromAddress, "MESSAGE_RECEIVED", message);
                
                log.debug("通道消息发送成功: {} -> {}", channelId, messageId);
                return messageId;
                
            } catch (Exception e) {
                log.error("发送通道消息失败: {}", channelId, e);
                throw new RuntimeException("Failed to send channel message", e);
            }
        });
    }

    /**
     * 关闭状态通道
     * 
     * @param channelId 通道ID
     * @param finalState 最终状态
     * @param signatures 参与者签名
     * @return 是否成功
     */
    public CompletableFuture<Boolean> closeStateChannel(String channelId, Map<String, Object> finalState,
                                                       Map<String, String> signatures) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                StateChannel channel = getChannel(channelId);
                if (channel == null) {
                    throw new IllegalArgumentException("状态通道不存在: " + channelId);
                }

                // 验证签名
                for (StateChannelParticipant participant : channel.getParticipants()) {
                    String signature = signatures.get(participant.getAddress());
                    if (signature == null || !verifyStateSignature(participant.getAddress(), 
                            channelId, finalState, signature)) {
                        throw new IllegalArgumentException("签名验证失败: " + participant.getAddress());
                    }
                }

                // 更新通道状态
                channel.setStatus("CLOSING");
                channel.setState(finalState);
                channel.setUpdatedAt(LocalDateTime.now());
                
                // 在主链结算通道
                boolean settled = settleChannelOnChain(channel, finalState, signatures);
                
                if (settled) {
                    channel.setStatus("CLOSED");
                    channel.setClosedAt(LocalDateTime.now());
                    
                    // 清理资源
                    cleanupChannel(channelId);
                    
                    // 通知参与者
                    notifyParticipants(channel, "CHANNEL_CLOSED", finalState);
                    
                    log.info("状态通道关闭成功: {}", channelId);
                    return true;
                } else {
                    channel.setStatus("SETTLEMENT_FAILED");
                    log.error("状态通道结算失败: {}", channelId);
                    return false;
                }
                
            } catch (Exception e) {
                log.error("关闭状态通道失败: {}", channelId, e);
                return false;
            }
        });
    }

    /**
     * 获取状态通道信息
     */
    public StateChannel getChannel(String channelId) {
        StateChannel channel = activeChannels.get(channelId);
        if (channel == null) {
            // 尝试从缓存加载
            channel = loadChannelFromCache(channelId);
        }
        return channel;
    }

    /**
     * 获取通道消息历史
     */
    public List<StateChannelMessage> getChannelMessages(String channelId) {
        return channelMessages.getOrDefault(channelId, Collections.emptyList());
    }

    /**
     * 部署通道合约
     */
    private String deployChannelContract(StateChannel channel) {
        try {
            // 获取状态通道工厂合约配置
            FiscoBcosConfig.ContractConfig factoryConfig = 
                    fiscoBcosConfig.getStateChannels().getFactoryContract();
            
            if (factoryConfig == null) {
                throw new RuntimeException("状态通道工厂合约配置不存在");
            }

            // 准备参与者地址列表
            List<String> participantAddresses = channel.getParticipants().stream()
                    .map(StateChannelParticipant::getAddress)
                    .toList();

            // 调用工厂合约创建通道
            List<Object> params = Arrays.asList(
                    channel.getId(),
                    participantAddresses,
                    channel.getDeposit(),
                    channel.getTimeout()
            );

            TransactionReceipt receipt = contractService.sendTransaction(
                    factoryConfig.getAddress(),
                    loadABI(factoryConfig.getAbiPath()),
                    "createChannel",
                    params
            ).join();

            if (receipt.isStatusOK()) {
                // 从事件日志中提取通道合约地址
                List<Object> events = contractService.parseEventLogs(
                        receipt, loadABI(factoryConfig.getAbiPath()), "ChannelCreated");
                
                if (!events.isEmpty()) {
                    return (String) events.get(0); // 假设第一个参数是合约地址
                }
            }
            
            throw new RuntimeException("通道合约部署失败");
            
        } catch (Exception e) {
            log.error("部署通道合约失败: {}", channel.getId(), e);
            throw new RuntimeException("Failed to deploy channel contract", e);
        }
    }

    /**
     * 在主链结算通道
     */
    private boolean settleChannelOnChain(StateChannel channel, Map<String, Object> finalState,
                                        Map<String, String> signatures) {
        try {
            // 通过跨链服务发送结算消息到主链
            return crossChainService.sendCrossChainMessage(
                    "sidechain", "main", "STATE_CHANNEL_SETTLEMENT",
                    Map.of(
                            "channelId", channel.getId(),
                            "finalState", finalState,
                            "signatures", signatures
                    )
            ).join() != null;
            
        } catch (Exception e) {
            log.error("在主链结算通道失败: {}", channel.getId(), e);
            return false;
        }
    }

    /**
     * 处理通道消息
     */
    private void processChannelMessage(StateChannel channel, StateChannelMessage message) {
        try {
            switch (message.getType()) {
                case "JOB_APPLICATION":
                    processJobApplication(channel, message);
                    break;
                case "INTERVIEW_INVITE":
                    processInterviewInvite(channel, message);
                    break;
                case "OFFER_LETTER":
                    processOfferLetter(channel, message);
                    break;
                case "CONTRACT_SIGN":
                    processContractSign(channel, message);
                    break;
                default:
                    log.debug("未知消息类型: {}", message.getType());
            }
        } catch (Exception e) {
            log.error("处理通道消息失败: {}", message.getId(), e);
        }
    }

    /**
     * 处理求职申请
     */
    private void processJobApplication(StateChannel channel, StateChannelMessage message) {
        // 更新通道状态
        Map<String, Object> newState = new HashMap<>(channel.getState());
        newState.put("applicationStatus", "SUBMITTED");
        newState.put("applicationData", message.getPayload());
        newState.put("lastUpdate", LocalDateTime.now());
        
        channel.setState(newState);
        cacheChannel(channel);
    }

    /**
     * 处理面试邀请
     */
    private void processInterviewInvite(StateChannel channel, StateChannelMessage message) {
        Map<String, Object> newState = new HashMap<>(channel.getState());
        newState.put("interviewStatus", "INVITED");
        newState.put("interviewData", message.getPayload());
        newState.put("lastUpdate", LocalDateTime.now());
        
        channel.setState(newState);
        cacheChannel(channel);
    }

    /**
     * 处理录用通知
     */
    private void processOfferLetter(StateChannel channel, StateChannelMessage message) {
        Map<String, Object> newState = new HashMap<>(channel.getState());
        newState.put("offerStatus", "SENT");
        newState.put("offerData", message.getPayload());
        newState.put("lastUpdate", LocalDateTime.now());
        
        channel.setState(newState);
        cacheChannel(channel);
    }

    /**
     * 处理合同签署
     */
    private void processContractSign(StateChannel channel, StateChannelMessage message) {
        Map<String, Object> newState = new HashMap<>(channel.getState());
        newState.put("contractStatus", "SIGNED");
        newState.put("contractData", message.getPayload());
        newState.put("lastUpdate", LocalDateTime.now());
        
        channel.setState(newState);
        cacheChannel(channel);
    }

    // 辅助方法
    private String generateChannelId() {
        return "SC_" + System.currentTimeMillis() + "_" + 
               UUID.randomUUID().toString().substring(0, 8);
    }

    private void cacheChannel(StateChannel channel) {
        try {
            String key = "state_channel:" + channel.getId();
            redisTemplate.opsForValue().set(key, channel, 24, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("缓存通道失败: {}", channel.getId(), e);
        }
    }

    private StateChannel loadChannelFromCache(String channelId) {
        try {
            String key = "state_channel:" + channelId;
            return (StateChannel) redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("从缓存加载通道失败: {}", channelId, e);
            return null;
        }
    }

    private void addMessage(String channelId, StateChannelMessage message) {
        channelMessages.computeIfAbsent(channelId, k -> new ArrayList<>()).add(message);
        
        // 同时缓存到Redis
        String key = "channel_messages:" + channelId;
        redisTemplate.opsForList().rightPush(key, message);
        redisTemplate.expire(key, 7, TimeUnit.DAYS);
    }

    private void notifyParticipants(StateChannel channel, String eventType, Object data) {
        for (StateChannelParticipant participant : channel.getParticipants()) {
            String destination = "/topic/channel/" + channel.getId() + "/" + participant.getAddress();
            Map<String, Object> notification = Map.of(
                    "eventType", eventType,
                    "channelId", channel.getId(),
                    "data", data,
                    "timestamp", LocalDateTime.now()
            );
            messagingTemplate.convertAndSend(destination, notification);
        }
    }

    private void notifyOtherParticipants(StateChannel channel, String excludeAddress, 
                                       String eventType, Object data) {
        for (StateChannelParticipant participant : channel.getParticipants()) {
            if (!participant.getAddress().equals(excludeAddress)) {
                String destination = "/topic/channel/" + channel.getId() + "/" + participant.getAddress();
                Map<String, Object> notification = Map.of(
                        "eventType", eventType,
                        "channelId", channel.getId(),
                        "data", data,
                        "timestamp", LocalDateTime.now()
                );
                messagingTemplate.convertAndSend(destination, notification);
            }
        }
    }

    private void cleanupChannel(String channelId) {
        activeChannels.remove(channelId);
        channelMessages.remove(channelId);
        
        // 清理Redis缓存
        redisTemplate.delete("state_channel:" + channelId);
        redisTemplate.delete("channel_messages:" + channelId);
    }

    private String loadABI(String abiPath) {
        // TODO: 实现ABI文件加载逻辑
        return "[]"; // 占位符
    }

    // 签名验证方法（简化实现）
    private boolean verifySignature(String address, String channelId, String signature) {
        // TODO: 实现真实的签名验证逻辑
        return signature != null && !signature.isEmpty();
    }

    private boolean verifyStateSignature(String address, String channelId, 
                                       Map<String, Object> state, String signature) {
        // TODO: 实现状态签名验证逻辑
        return signature != null && !signature.isEmpty();
    }

    private boolean verifyMessageSignature(String address, String channelId, String messageType,
                                         Object payload, String signature) {
        // TODO: 实现消息签名验证逻辑
        return signature != null && !signature.isEmpty();
    }

    // ========== 数字人民币状态通道特定方法 ==========

    /**
     * 开辟数字人民币状态通道
     * 交易方在链上通过浏览器钱包锁定一定量的资产，在区块链上记录并开辟状态通道
     *
     * @param participantA 参与者A
     * @param participantB 参与者B
     * @param lockedAmount 锁定的数字人民币金额
     * @param channelPurpose 通道用途（认证收费等）
     * @return 通道ID
     */
    public CompletableFuture<String> createDigitalCurrencyChannel(
            StateChannelParticipant participantA, StateChannelParticipant participantB,
            BigInteger lockedAmount, String channelPurpose) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                // 生成通道ID
                String channelId = generateChannelId();

                // 验证参与者钱包余额
                if (!verifyWalletBalance(participantA.getAddress(), lockedAmount) ||
                    !verifyWalletBalance(participantB.getAddress(), lockedAmount)) {
                    throw new IllegalArgumentException("参与者钱包余额不足");
                }

                // 在区块链上锁定资产
                boolean lockSuccessA = lockDigitalCurrencyOnChain(participantA.getAddress(), lockedAmount, channelId);
                boolean lockSuccessB = lockDigitalCurrencyOnChain(participantB.getAddress(), lockedAmount, channelId);

                if (!lockSuccessA || !lockSuccessB) {
                    throw new RuntimeException("锁定数字人民币失败");
                }

                // 创建状态通道
                StateChannel channel = StateChannel.builder()
                        .id(channelId)
                        .participants(Arrays.asList(participantA, participantB))
                        .state(Map.of(
                                "locked_amount_a", lockedAmount.toString(),
                                "locked_amount_b", lockedAmount.toString(),
                                "currency_type", "DIGITAL_CNY",
                                "channel_purpose", channelPurpose,
                                "balance_a", lockedAmount.toString(),
                                "balance_b", lockedAmount.toString()
                        ))
                        .nonce(BigInteger.ZERO)
                        .deposit(lockedAmount.multiply(BigInteger.valueOf(2)))
                        .timeout(86400L) // 24小时
                        .metadata(Map.of(
                                "currency_channel", true,
                                "purpose", channelPurpose,
                                "created_method", "digital_currency_lock"
                        ))
                        .status("OPENING")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                // 存储通道
                activeChannels.put(channelId, channel);
                channelMessages.put(channelId, new ArrayList<>());
                cacheChannel(channel);

                // 记录链上开辟事件
                recordChannelOpeningOnChain(channelId, participantA.getAddress(),
                        participantB.getAddress(), lockedAmount.multiply(BigInteger.valueOf(2)));

                // 通知参与者
                notifyParticipants(channel, "DIGITAL_CURRENCY_CHANNEL_CREATED", Map.of(
                        "locked_amount", lockedAmount.toString(),
                        "currency_type", "DIGITAL_CNY"
                ));

                log.info("数字人民币状态通道创建成功: {}, 锁定金额: {}", channelId, lockedAmount);
                return channelId;

            } catch (Exception e) {
                log.error("创建数字人民币状态通道失败", e);
                throw new RuntimeException("Failed to create digital currency channel", e);
            }
        });
    }

    /**
     * 在通道内进行数字人民币交易
     * 在通道内进行相互交易和状态更新，但不提交到链上
     *
     * @param channelId 通道ID
     * @param fromAddress 发送方地址
     * @param toAddress 接收方地址
     * @param amount 交易金额
     * @param purpose 交易目的（认证费用等）
     * @param signature 交易签名
     * @return 交易ID
     */
    public CompletableFuture<String> performOffChainTransaction(
            String channelId, String fromAddress, String toAddress,
            BigInteger amount, String purpose, String signature) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                StateChannel channel = getChannel(channelId);
                if (channel == null) {
                    throw new IllegalArgumentException("状态通道不存在: " + channelId);
                }

                if (!"ACTIVE".equals(channel.getStatus())) {
                    throw new IllegalStateException("状态通道未激活: " + channelId);
                }

                // 验证交易签名
                if (!verifyTransactionSignature(fromAddress, toAddress, amount, purpose, signature)) {
                    throw new IllegalArgumentException("交易签名验证失败");
                }

                // 检查余额
                Map<String, Object> currentState = channel.getState();
                BigInteger fromBalance = new BigInteger((String) currentState.get("balance_" + getParticipantKey(fromAddress)));

                if (fromBalance.compareTo(amount) < 0) {
                    throw new IllegalArgumentException("余额不足");
                }

                // 更新通道内余额（链下状态更新）
                BigInteger toBalance = new BigInteger((String) currentState.get("balance_" + getParticipantKey(toAddress)));
                currentState.put("balance_" + getParticipantKey(fromAddress), fromBalance.subtract(amount).toString());
                currentState.put("balance_" + getParticipantKey(toAddress), toBalance.add(amount).toString());
                currentState.put("last_transaction_amount", amount.toString());
                currentState.put("last_transaction_purpose", purpose);
                currentState.put("last_transaction_time", LocalDateTime.now().toString());

                // 更新通道状态
                channel.setState(currentState);
                channel.setNonce(channel.getNonce().add(BigInteger.ONE));
                channel.setUpdatedAt(LocalDateTime.now());
                cacheChannel(channel);

                // 创建交易记录
                String transactionId = UUID.randomUUID().toString();
                StateChannelMessage transaction = StateChannelMessage.builder()
                        .id(transactionId)
                        .channelId(channelId)
                        .fromAddress(fromAddress)
                        .type("DIGITAL_CURRENCY_TRANSFER")
                        .payload(Map.of(
                                "to", toAddress,
                                "amount", amount.toString(),
                                "purpose", purpose,
                                "currency_type", "DIGITAL_CNY",
                                "off_chain", true
                        ))
                        .signatures(Map.of(fromAddress, signature))
                        .timestamp(LocalDateTime.now())
                        .build();

                addMessage(channelId, transaction);

                // 通知参与者（链下通知）
                notifyOtherParticipants(channel, fromAddress, "OFF_CHAIN_TRANSACTION", Map.of(
                        "transaction_id", transactionId,
                        "amount", amount.toString(),
                        "purpose", purpose,
                        "new_balance_from", fromBalance.subtract(amount).toString(),
                        "new_balance_to", toBalance.add(amount).toString()
                ));

                log.info("链下数字人民币交易完成: {} -> {}, 金额: {}, 目的: {}",
                        fromAddress, toAddress, amount, purpose);

                return transactionId;

            } catch (Exception e) {
                log.error("链下数字人民币交易失败: {}", channelId, e);
                throw new RuntimeException("Failed to perform off-chain transaction", e);
            }
        });
    }

    /**
     * 关闭通道并进行最终清算
     * 当任一方想要关闭通道时，提交最终状态到区块链上进行清算
     *
     * @param channelId 通道ID
     * @param finalState 最终状态
     * @param signatures 参与者签名
     * @param initiatorAddress 发起关闭的地址
     * @return 是否成功
     */
    public CompletableFuture<Boolean> closeChannelWithSettlement(
            String channelId, Map<String, Object> finalState,
            Map<String, String> signatures, String initiatorAddress) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                StateChannel channel = getChannel(channelId);
                if (channel == null) {
                    throw new IllegalArgumentException("状态通道不存在: " + channelId);
                }

                // 验证所有参与者签名
                for (StateChannelParticipant participant : channel.getParticipants()) {
                    String signature = signatures.get(participant.getAddress());
                    if (signature == null || !verifyStateSignature(participant.getAddress(),
                            channelId, finalState, signature)) {
                        throw new IllegalArgumentException("签名验证失败: " + participant.getAddress());
                    }
                }

                // 设置通道为关闭状态
                channel.setStatus("CLOSING");
                channel.setState(finalState);
                channel.setUpdatedAt(LocalDateTime.now());
                cacheChannel(channel);

                // 提交最终状态到区块链进行清算
                boolean settlementSuccess = performOnChainSettlement(channel, finalState);

                if (settlementSuccess) {
                    channel.setStatus("CLOSED");
                    channel.setClosedAt(LocalDateTime.now());

                    // 释放锁定的数字人民币
                    releaseLockedDigitalCurrency(channel);

                    // 清理资源
                    cleanupChannel(channelId);

                    // 通知参与者
                    notifyParticipants(channel, "CHANNEL_SETTLED", Map.of(
                            "settlement_success", true,
                            "final_balances", extractFinalBalances(finalState)
                    ));

                    log.info("数字人民币状态通道关闭并清算成功: {}", channelId);
                    return true;
                } else {
                    channel.setStatus("SETTLEMENT_FAILED");
                    log.error("数字人民币状态通道清算失败: {}", channelId);
                    return false;
                }

            } catch (Exception e) {
                log.error("关闭数字人民币状态通道失败: {}", channelId, e);
                return false;
            }
        });
    }

    /**
     * 处理争议仲裁
     * 若另一方有异议，可在规定时间内申请链上仲裁
     *
     * @param channelId 通道ID
     * @param disputeReason 争议原因
     * @param evidence 证据
     * @param disputantAddress 争议发起方地址
     * @return 争议ID
     */
    public CompletableFuture<String> initiateDispute(
            String channelId, String disputeReason, Map<String, Object> evidence,
            String disputantAddress) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                StateChannel channel = getChannel(channelId);
                if (channel == null) {
                    throw new IllegalArgumentException("状态通道不存在: " + channelId);
                }

                if (!"CLOSING".equals(channel.getStatus())) {
                    throw new IllegalStateException("只能在通道关闭过程中发起争议");
                }

                // 检查是否在争议期内
                if (channel.getUpdatedAt().plusHours(1).isBefore(LocalDateTime.now())) {
                    throw new IllegalStateException("争议期已过");
                }

                String disputeId = UUID.randomUUID().toString();

                // 创建争议记录
                StateChannel.DisputeInfo dispute = StateChannel.DisputeInfo.builder()
                        .disputeId(disputeId)
                        .initiator(disputantAddress)
                        .reason(disputeReason)
                        .evidence(evidence)
                        .initiatedAt(LocalDateTime.now())
                        .status("PENDING")
                        .build();

                channel.setDisputeInfo(dispute);
                channel.setStatus("DISPUTED");
                cacheChannel(channel);

                // 提交争议到链上仲裁合约
                submitDisputeToChain(channelId, disputeId, disputeReason, evidence, disputantAddress);

                // 通知所有参与者
                notifyParticipants(channel, "DISPUTE_INITIATED", Map.of(
                        "dispute_id", disputeId,
                        "reason", disputeReason,
                        "initiator", disputantAddress
                ));

                log.info("数字人民币状态通道争议发起: {} -> {}", channelId, disputeId);
                return disputeId;

            } catch (Exception e) {
                log.error("发起状态通道争议失败: {}", channelId, e);
                throw new RuntimeException("Failed to initiate dispute", e);
            }
        });
    }

    // 辅助方法实现

    private boolean verifyWalletBalance(String address, BigInteger requiredAmount) {
        // TODO: 实现钱包余额验证逻辑
        return true;
    }

    private boolean lockDigitalCurrencyOnChain(String address, BigInteger amount, String channelId) {
        // TODO: 实现链上数字人民币锁定逻辑
        return true;
    }

    private void recordChannelOpeningOnChain(String channelId, String addressA, String addressB, BigInteger totalAmount) {
        // TODO: 实现链上通道开辟记录
    }

    private boolean verifyTransactionSignature(String from, String to, BigInteger amount, String purpose, String signature) {
        // TODO: 实现交易签名验证
        return signature != null && !signature.isEmpty();
    }

    private String getParticipantKey(String address) {
        // 简化实现，实际应该根据参与者在通道中的角色确定
        return address.endsWith("a") || address.contains("student") ? "a" : "b";
    }

    private boolean performOnChainSettlement(StateChannel channel, Map<String, Object> finalState) {
        // TODO: 实现链上清算逻辑
        return true;
    }

    private void releaseLockedDigitalCurrency(StateChannel channel) {
        // TODO: 实现释放锁定数字人民币的逻辑
    }

    private Map<String, String> extractFinalBalances(Map<String, Object> finalState) {
        Map<String, String> balances = new HashMap<>();
        finalState.forEach((key, value) -> {
            if (key.startsWith("balance_")) {
                balances.put(key, value.toString());
            }
        });
        return balances;
    }

    private void submitDisputeToChain(String channelId, String disputeId, String reason,
                                    Map<String, Object> evidence, String disputant) {
        // TODO: 实现提交争议到链上仲裁合约
    }
}
