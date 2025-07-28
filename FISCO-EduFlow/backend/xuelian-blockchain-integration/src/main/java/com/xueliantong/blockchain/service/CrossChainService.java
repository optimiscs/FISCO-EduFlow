package com.xueliantong.blockchain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xueliantong.blockchain.config.FiscoBcosConfig;
import com.xueliantong.blockchain.model.CrossChainMessage;
import com.xueliantong.blockchain.model.CrossChainTransaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.fisco.bcos.sdk.client.Client;
import org.fisco.bcos.sdk.model.TransactionReceipt;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 跨链服务
 * 实现主链与侧链之间的数据同步和交互
 * 
 * @author XueLianTong Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CrossChainService {

    private final FiscoBcosConfig fiscoBcosConfig;
    private final ContractService contractService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // 跨链消息队列
    private final Map<String, Queue<CrossChainMessage>> messageQueues = new ConcurrentHashMap<>();
    
    // 跨链交易状态追踪
    private final Map<String, CrossChainTransaction> transactionTracker = new ConcurrentHashMap<>();

    /**
     * 发送跨链消息
     * 
     * @param sourceChain 源链名称
     * @param targetChain 目标链名称
     * @param messageType 消息类型
     * @param payload 消息载荷
     * @return 跨链交易ID
     */
    public CompletableFuture<String> sendCrossChainMessage(String sourceChain, String targetChain,
                                                          String messageType, Object payload) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 生成跨链交易ID
                String crossChainTxId = generateCrossChainTxId();
                
                // 创建跨链消息
                CrossChainMessage message = CrossChainMessage.builder()
                        .id(UUID.randomUUID().toString())
                        .crossChainTxId(crossChainTxId)
                        .sourceChain(sourceChain)
                        .targetChain(targetChain)
                        .messageType(messageType)
                        .payload(payload)
                        .timestamp(LocalDateTime.now())
                        .status("PENDING")
                        .build();

                // 在源链记录跨链消息
                recordCrossChainMessage(sourceChain, message);
                
                // 将消息加入目标链队列
                addToMessageQueue(targetChain, message);
                
                // 创建跨链交易记录
                CrossChainTransaction transaction = CrossChainTransaction.builder()
                        .id(crossChainTxId)
                        .sourceChain(sourceChain)
                        .targetChain(targetChain)
                        .messageType(messageType)
                        .status("INITIATED")
                        .createdAt(LocalDateTime.now())
                        .build();
                
                transactionTracker.put(crossChainTxId, transaction);
                
                // 异步处理跨链消息
                processCrossChainMessage(message);
                
                log.info("跨链消息发送成功: {} -> {}, TxId: {}", 
                        sourceChain, targetChain, crossChainTxId);
                
                return crossChainTxId;
            } catch (Exception e) {
                log.error("发送跨链消息失败: {} -> {}", sourceChain, targetChain, e);
                throw new RuntimeException("Failed to send cross-chain message", e);
            }
        });
    }

    /**
     * 处理跨链消息
     */
    private void processCrossChainMessage(CrossChainMessage message) {
        CompletableFuture.runAsync(() -> {
            try {
                // 验证消息
                if (!validateCrossChainMessage(message)) {
                    updateMessageStatus(message.getId(), "VALIDATION_FAILED");
                    return;
                }

                // 在目标链执行操作
                boolean success = executeOnTargetChain(message);
                
                if (success) {
                    updateMessageStatus(message.getId(), "COMPLETED");
                    updateTransactionStatus(message.getCrossChainTxId(), "COMPLETED");
                    
                    // 发送确认消息回源链
                    sendConfirmationMessage(message);
                } else {
                    updateMessageStatus(message.getId(), "EXECUTION_FAILED");
                    updateTransactionStatus(message.getCrossChainTxId(), "FAILED");
                }
                
            } catch (Exception e) {
                log.error("处理跨链消息失败: {}", message.getId(), e);
                updateMessageStatus(message.getId(), "ERROR");
                updateTransactionStatus(message.getCrossChainTxId(), "ERROR");
            }
        });
    }

    /**
     * 在目标链执行操作
     */
    private boolean executeOnTargetChain(CrossChainMessage message) {
        try {
            Client targetClient = fiscoBcosConfig.getClient(message.getTargetChain());
            if (targetClient == null) {
                log.error("目标链客户端不存在: {}", message.getTargetChain());
                return false;
            }

            // 根据消息类型执行不同的操作
            switch (message.getMessageType()) {
                case "STUDENT_PROFILE_SYNC":
                    return syncStudentProfile(message);
                case "CERTIFICATION_SYNC":
                    return syncCertification(message);
                case "MERKLE_ROOT_UPDATE":
                    return updateMerkleRoot(message);
                case "STATE_CHANNEL_SETTLEMENT":
                    return settleStateChannel(message);
                default:
                    log.warn("未知的跨链消息类型: {}", message.getMessageType());
                    return false;
            }
        } catch (Exception e) {
            log.error("在目标链执行操作失败: {}", message.getTargetChain(), e);
            return false;
        }
    }

    /**
     * 同步学生档案
     */
    private boolean syncStudentProfile(CrossChainMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            String studentId = (String) payload.get("studentId");
            
            // 获取目标链的学生档案合约配置
            FiscoBcosConfig.ContractConfig contractConfig = 
                    fiscoBcosConfig.getSideChains().get(message.getTargetChain())
                            .getContracts().get("student-profile");
            
            if (contractConfig == null) {
                log.error("目标链学生档案合约配置不存在: {}", message.getTargetChain());
                return false;
            }

            // 调用合约同步学生档案
            List<Object> params = Arrays.asList(
                    studentId,
                    payload.get("profileData"),
                    payload.get("merkleProof")
            );

            TransactionReceipt receipt = contractService.sendTransaction(
                    contractConfig.getAddress(),
                    loadABI(contractConfig.getAbiPath()),
                    "syncStudentProfile",
                    params
            ).join();

            return receipt.isStatusOK();
        } catch (Exception e) {
            log.error("同步学生档案失败", e);
            return false;
        }
    }

    /**
     * 同步认证信息
     */
    private boolean syncCertification(CrossChainMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            
            // 获取目标链的认证合约配置
            FiscoBcosConfig.ContractConfig contractConfig = 
                    fiscoBcosConfig.getSideChains().get(message.getTargetChain())
                            .getContracts().get("certification");
            
            if (contractConfig == null) {
                log.error("目标链认证合约配置不存在: {}", message.getTargetChain());
                return false;
            }

            // 调用合约同步认证信息
            List<Object> params = Arrays.asList(
                    payload.get("certificationId"),
                    payload.get("certificationData"),
                    payload.get("signature")
            );

            TransactionReceipt receipt = contractService.sendTransaction(
                    contractConfig.getAddress(),
                    loadABI(contractConfig.getAbiPath()),
                    "syncCertification",
                    params
            ).join();

            return receipt.isStatusOK();
        } catch (Exception e) {
            log.error("同步认证信息失败", e);
            return false;
        }
    }

    /**
     * 更新Merkle根
     */
    private boolean updateMerkleRoot(CrossChainMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            
            // 获取目标链的Merkle同步合约配置
            FiscoBcosConfig.ContractConfig contractConfig = 
                    fiscoBcosConfig.getSideChains().get(message.getTargetChain())
                            .getContracts().get("merkle-sync");
            
            if (contractConfig == null) {
                log.error("目标链Merkle同步合约配置不存在: {}", message.getTargetChain());
                return false;
            }

            // 调用合约更新Merkle根
            List<Object> params = Arrays.asList(
                    payload.get("newMerkleRoot"),
                    payload.get("blockHeight"),
                    payload.get("proof")
            );

            TransactionReceipt receipt = contractService.sendTransaction(
                    contractConfig.getAddress(),
                    loadABI(contractConfig.getAbiPath()),
                    "updateMerkleRoot",
                    params
            ).join();

            return receipt.isStatusOK();
        } catch (Exception e) {
            log.error("更新Merkle根失败", e);
            return false;
        }
    }

    /**
     * 结算状态通道
     */
    private boolean settleStateChannel(CrossChainMessage message) {
        try {
            Map<String, Object> payload = (Map<String, Object>) message.getPayload();
            
            // 获取主链的状态通道工厂合约配置
            FiscoBcosConfig.ContractConfig contractConfig = 
                    fiscoBcosConfig.getMainChain().getContracts().get("state-channels");
            
            if (contractConfig == null) {
                log.error("状态通道合约配置不存在");
                return false;
            }

            // 调用合约结算状态通道
            List<Object> params = Arrays.asList(
                    payload.get("channelId"),
                    payload.get("finalState"),
                    payload.get("signatures")
            );

            TransactionReceipt receipt = contractService.sendTransaction(
                    contractConfig.getAddress(),
                    loadABI(contractConfig.getAbiPath()),
                    "settleChannel",
                    params
            ).join();

            return receipt.isStatusOK();
        } catch (Exception e) {
            log.error("结算状态通道失败", e);
            return false;
        }
    }

    /**
     * 验证跨链消息
     */
    private boolean validateCrossChainMessage(CrossChainMessage message) {
        try {
            // 验证消息完整性
            if (message.getId() == null || message.getSourceChain() == null || 
                message.getTargetChain() == null || message.getPayload() == null) {
                log.error("跨链消息字段不完整: {}", message.getId());
                return false;
            }

            // 验证链是否存在
            if (!chainExists(message.getSourceChain()) || !chainExists(message.getTargetChain())) {
                log.error("源链或目标链不存在: {} -> {}", 
                        message.getSourceChain(), message.getTargetChain());
                return false;
            }

            // 验证消息签名（如果有）
            // TODO: 实现消息签名验证

            return true;
        } catch (Exception e) {
            log.error("验证跨链消息失败: {}", message.getId(), e);
            return false;
        }
    }

    /**
     * 检查链是否存在
     */
    private boolean chainExists(String chainName) {
        if ("main".equals(chainName)) {
            return fiscoBcosConfig.getMainChain() != null;
        }
        return fiscoBcosConfig.getSideChains().containsKey(chainName);
    }

    /**
     * 记录跨链消息到区块链
     */
    private void recordCrossChainMessage(String chainName, CrossChainMessage message) {
        try {
            // 获取跨链路由合约配置
            FiscoBcosConfig.ContractConfig routerConfig = 
                    fiscoBcosConfig.getCrossChain().getRouterContract();
            
            if (routerConfig == null) {
                log.warn("跨链路由合约配置不存在，跳过链上记录");
                return;
            }

            // 调用合约记录跨链消息
            List<Object> params = Arrays.asList(
                    message.getId(),
                    message.getTargetChain(),
                    message.getMessageType(),
                    objectMapper.writeValueAsString(message.getPayload())
            );

            contractService.sendTransaction(
                    routerConfig.getAddress(),
                    loadABI(routerConfig.getAbiPath()),
                    "recordCrossChainMessage",
                    params
            );
            
        } catch (Exception e) {
            log.error("记录跨链消息到区块链失败: {}", message.getId(), e);
        }
    }

    /**
     * 添加消息到队列
     */
    private void addToMessageQueue(String chainName, CrossChainMessage message) {
        messageQueues.computeIfAbsent(chainName, k -> new LinkedList<>()).offer(message);
        
        // 同时存储到Redis以支持集群部署
        String queueKey = "cross_chain_queue:" + chainName;
        redisTemplate.opsForList().rightPush(queueKey, message);
        redisTemplate.expire(queueKey, 24, TimeUnit.HOURS);
    }

    /**
     * 发送确认消息
     */
    private void sendConfirmationMessage(CrossChainMessage originalMessage) {
        try {
            CrossChainMessage confirmation = CrossChainMessage.builder()
                    .id(UUID.randomUUID().toString())
                    .crossChainTxId(originalMessage.getCrossChainTxId())
                    .sourceChain(originalMessage.getTargetChain())
                    .targetChain(originalMessage.getSourceChain())
                    .messageType("CONFIRMATION")
                    .payload(Map.of(
                            "originalMessageId", originalMessage.getId(),
                            "status", "COMPLETED"
                    ))
                    .timestamp(LocalDateTime.now())
                    .status("PENDING")
                    .build();

            addToMessageQueue(originalMessage.getSourceChain(), confirmation);
            
        } catch (Exception e) {
            log.error("发送确认消息失败: {}", originalMessage.getId(), e);
        }
    }

    /**
     * 更新消息状态
     */
    private void updateMessageStatus(String messageId, String status) {
        try {
            String key = "cross_chain_message:" + messageId;
            redisTemplate.opsForHash().put(key, "status", status);
            redisTemplate.opsForHash().put(key, "updatedAt", LocalDateTime.now());
            redisTemplate.expire(key, 7, TimeUnit.DAYS);
        } catch (Exception e) {
            log.error("更新消息状态失败: {} -> {}", messageId, status, e);
        }
    }

    /**
     * 更新交易状态
     */
    private void updateTransactionStatus(String txId, String status) {
        CrossChainTransaction transaction = transactionTracker.get(txId);
        if (transaction != null) {
            transaction.setStatus(status);
            transaction.setUpdatedAt(LocalDateTime.now());
        }
    }

    /**
     * 生成跨链交易ID
     */
    private String generateCrossChainTxId() {
        return "CC_" + System.currentTimeMillis() + "_" + 
               UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 加载合约ABI
     */
    private String loadABI(String abiPath) {
        // TODO: 实现ABI文件加载逻辑
        return "[]"; // 占位符
    }

    /**
     * 获取跨链交易状态
     */
    public CrossChainTransaction getCrossChainTransaction(String txId) {
        return transactionTracker.get(txId);
    }

    /**
     * 获取待处理的跨链消息
     */
    public List<CrossChainMessage> getPendingMessages(String chainName) {
        Queue<CrossChainMessage> queue = messageQueues.get(chainName);
        return queue != null ? new ArrayList<>(queue) : Collections.emptyList();
    }
}
