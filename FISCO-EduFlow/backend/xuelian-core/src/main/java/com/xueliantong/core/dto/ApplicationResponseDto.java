package com.xueliantong.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.xueliantong.core.enums.CertificationStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 学历认证申请响应DTO
 * 
 * 用于返回申请信息给前端
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApplicationResponseDto {

    /**
     * 申请ID
     */
    private Long id;

    /**
     * 申请标题
     */
    private String title;

    /**
     * 申请人信息
     */
    private UserBasicDto applicant;

    /**
     * 目标用人单位信息
     */
    private UserBasicDto targetUnit;

    /**
     * 申请状态
     */
    private CertificationStatus status;

    /**
     * 状态显示名称
     */
    private String statusDisplayName;

    /**
     * 状态描述
     */
    private String statusDescription;

    /**
     * 状态颜色代码
     */
    private String statusColorCode;

    /**
     * 申请详细描述
     */
    private String description;

    /**
     * 申请人的学历信息
     */
    private String educationInfo;

    /**
     * 毕业院校
     */
    private String graduateSchool;

    /**
     * 专业名称
     */
    private String major;

    /**
     * 学历层次
     */
    private String educationLevel;

    /**
     * 毕业时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime graduationDate;

    /**
     * 学位证书编号
     */
    private String degreeCertificateNumber;

    /**
     * 申请提交时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submissionDate;

    /**
     * 处理时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime processedDate;

    /**
     * 完成时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedDate;

    /**
     * 处理人员备注
     */
    private String processorNotes;

    /**
     * 申请人备注
     */
    private String applicantNotes;

    /**
     * 拒绝原因
     */
    private String rejectionReason;

    /**
     * 关联的证书ID
     */
    private Long certificateId;

    /**
     * 区块链交易哈希
     */
    private String blockchainTxHash;

    /**
     * 优先级
     */
    private Integer priority;

    /**
     * 是否为紧急申请
     */
    private Boolean isUrgent;

    /**
     * 进度百分比
     */
    private Integer progressPercentage;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * 用户基本信息DTO（嵌套类）
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserBasicDto {
        /**
         * 用户ID
         */
        private Long id;

        /**
         * 用户名
         */
        private String username;

        /**
         * 真实姓名
         */
        private String realName;

        /**
         * 用户角色
         */
        private String role;

        /**
         * 用户角色显示名称
         */
        private String roleDisplayName;

        /**
         * 所属机构
         */
        private String organization;

        /**
         * 邮箱
         */
        private String email;

        /**
         * 手机号码
         */
        private String phoneNumber;

        /**
         * 头像URL
         */
        private String avatarUrl;
    }

    /**
     * 检查申请是否可以被当前用户处理
     * 
     * @return 如果可以处理返回true，否则返回false
     */
    public boolean canBeProcessed() {
        return status == CertificationStatus.APPLIED || status == CertificationStatus.PENDING_APPROVAL;
    }

    /**
     * 检查申请是否已完成
     * 
     * @return 如果已完成返回true，否则返回false
     */
    public boolean isCompleted() {
        return status != null && status.isFinal();
    }

    /**
     * 检查申请是否成功
     * 
     * @return 如果成功返回true，否则返回false
     */
    public boolean isSuccessful() {
        return status == CertificationStatus.COMPLETED;
    }

    /**
     * 检查申请是否被拒绝
     * 
     * @return 如果被拒绝返回true，否则返回false
     */
    public boolean isRejected() {
        return status == CertificationStatus.REJECTED;
    }

    /**
     * 获取申请持续时间（从提交到当前时间或完成时间）
     * 
     * @return 持续时间描述
     */
    public String getDurationDescription() {
        if (submissionDate == null) {
            return "未知";
        }
        
        LocalDateTime endTime = completedDate != null ? completedDate : LocalDateTime.now();
        long days = java.time.Duration.between(submissionDate, endTime).toDays();
        
        if (days == 0) {
            return "当天";
        } else if (days == 1) {
            return "1天";
        } else {
            return days + "天";
        }
    }

    /**
     * 获取申请摘要信息
     * 
     * @return 申请摘要
     */
    public String getSummary() {
        return String.format("%s - %s（%s）", 
                           title, 
                           applicant != null ? applicant.getRealName() : "未知用户",
                           status != null ? status.getDisplayName() : "未知状态");
    }

    @Override
    public String toString() {
        return String.format("ApplicationResponseDto{id=%d, title='%s', status=%s, applicant=%s, targetUnit=%s}", 
                           id, title, status,
                           applicant != null ? applicant.getRealName() : "null",
                           targetUnit != null ? targetUnit.getOrganization() : "null");
    }
} 