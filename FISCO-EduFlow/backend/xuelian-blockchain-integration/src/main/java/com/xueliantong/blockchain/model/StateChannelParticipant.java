package com.xueliantong.blockchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 状态通道参与者模型
 * 
 * @author XueLianTong Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StateChannelParticipant {
    
    /**
     * 参与者地址
     */
    private String address;
    
    /**
     * 参与者公钥
     */
    private String publicKey;
    
    /**
     * 参与者角色：STUDENT, EMPLOYER, SCHOOL, VERIFIER
     */
    private String role;
    
    /**
     * 参与者名称
     */
    private String name;
    
    /**
     * 是否已加入通道
     */
    private boolean joined;
    
    /**
     * 加入时间
     */
    private LocalDateTime joinedAt;
    
    /**
     * 保证金金额
     */
    private BigInteger deposit;
    
    /**
     * 权重（用于多签投票）
     */
    private Integer weight;
    
    /**
     * 权限列表
     */
    private String[] permissions;
    
    /**
     * 参与者状态：ACTIVE, INACTIVE, SUSPENDED
     */
    private String status;
    
    /**
     * 最后活跃时间
     */
    private LocalDateTime lastActiveAt;
    
    /**
     * 参与者元数据
     */
    private Map<String, Object> metadata;
    
    /**
     * 联系信息
     */
    private ContactInfo contactInfo;
    
    /**
     * 验证信息
     */
    private VerificationInfo verificationInfo;
    
    /**
     * 联系信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactInfo {
        private String email;
        private String phone;
        private String organization;
        private String department;
        private Map<String, String> socialMedia;
    }
    
    /**
     * 验证信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationInfo {
        private boolean emailVerified;
        private boolean phoneVerified;
        private boolean identityVerified;
        private String identityDocument;
        private String verificationLevel; // BASIC, STANDARD, PREMIUM
        private LocalDateTime verifiedAt;
        private String verifiedBy;
        private Map<String, Object> certificates;
    }
}
