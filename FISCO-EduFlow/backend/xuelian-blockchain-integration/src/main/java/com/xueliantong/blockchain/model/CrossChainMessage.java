package com.xueliantong.blockchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 跨链消息模型
 * 
 * @author XueLianTong Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrossChainMessage {
    
    /**
     * 消息ID
     */
    private String id;
    
    /**
     * 跨链交易ID
     */
    private String crossChainTxId;
    
    /**
     * 源链名称
     */
    private String sourceChain;
    
    /**
     * 目标链名称
     */
    private String targetChain;
    
    /**
     * 消息类型
     */
    private String messageType;
    
    /**
     * 消息载荷
     */
    private Object payload;
    
    /**
     * 消息状态：PENDING, PROCESSING, COMPLETED, FAILED
     */
    private String status;
    
    /**
     * 优先级：LOW, NORMAL, HIGH, URGENT
     */
    private String priority;
    
    /**
     * 重试次数
     */
    private Integer retryCount;
    
    /**
     * 最大重试次数
     */
    private Integer maxRetries;
    
    /**
     * 超时时间
     */
    private LocalDateTime timeoutAt;
    
    /**
     * 创建时间
     */
    private LocalDateTime timestamp;
    
    /**
     * 处理开始时间
     */
    private LocalDateTime processedAt;
    
    /**
     * 完成时间
     */
    private LocalDateTime completedAt;
    
    /**
     * 错误信息
     */
    private String errorMessage;
    
    /**
     * 消息签名
     */
    private String signature;
    
    /**
     * 消息哈希
     */
    private String messageHash;
    
    /**
     * 路由信息
     */
    private RouteInfo routeInfo;
    
    /**
     * 执行结果
     */
    private ExecutionResult executionResult;
    
    /**
     * 元数据
     */
    private Map<String, Object> metadata;
    
    /**
     * 路由信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteInfo {
        private String[] path; // 路由路径
        private String nextHop; // 下一跳
        private Integer hopCount; // 跳数
        private String routingStrategy; // 路由策略
        private Map<String, Object> routingParams;
    }
    
    /**
     * 执行结果
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionResult {
        private boolean success;
        private String transactionHash;
        private String blockNumber;
        private Object result;
        private String errorCode;
        private String errorMessage;
        private Long gasUsed;
        private Map<String, Object> logs;
    }
}
