package com.xueliantong.blockchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 状态通道模型
 * 
 * @author XueLianTong Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StateChannel {
    
    /**
     * 通道ID
     */
    private String id;
    
    /**
     * 参与者列表
     */
    private List<StateChannelParticipant> participants;
    
    /**
     * 通道状态
     */
    private Map<String, Object> state;
    
    /**
     * 状态nonce（防重放）
     */
    private BigInteger nonce;
    
    /**
     * 保证金
     */
    private BigInteger deposit;
    
    /**
     * 超时时间（秒）
     */
    private Long timeout;
    
    /**
     * 通道合约地址
     */
    private String contractAddress;
    
    /**
     * 通道状态：OPENING, ACTIVE, CLOSING, CLOSED, DISPUTED
     */
    private String status;
    
    /**
     * 元数据
     */
    private Map<String, Object> metadata;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 关闭时间
     */
    private LocalDateTime closedAt;
    
    /**
     * 最后活跃时间
     */
    private LocalDateTime lastActiveAt;
    
    /**
     * 争议信息
     */
    private DisputeInfo disputeInfo;
    
    /**
     * 通道配置
     */
    private ChannelConfig config;
    
    /**
     * 争议信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisputeInfo {
        private String disputeId;
        private String initiator;
        private String reason;
        private Map<String, Object> evidence;
        private LocalDateTime initiatedAt;
        private String status; // PENDING, RESOLVED, REJECTED
        private String resolution;
        private LocalDateTime resolvedAt;
    }
    
    /**
     * 通道配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChannelConfig {
        private Integer maxParticipants;
        private Long challengePeriod; // 挑战期（秒）
        private BigInteger minDeposit;
        private Boolean autoClose;
        private Long autoCloseDelay;
        private Map<String, Object> customSettings;
    }
}
