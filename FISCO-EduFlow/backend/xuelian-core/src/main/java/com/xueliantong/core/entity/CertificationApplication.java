package com.xueliantong.core.entity;

import com.xueliantong.core.enums.CertificationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 学历认证申请实体类
 * 
 * 表示学生向用人单位提交的学历认证申请
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Entity
@Table(name = "certification_applications", indexes = {
    @Index(name = "idx_application_applicant", columnList = "applicant_id"),
    @Index(name = "idx_application_target_unit", columnList = "target_unit_id"),
    @Index(name = "idx_application_status", columnList = "status"),
    @Index(name = "idx_application_submission_date", columnList = "submission_date")
})
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificationApplication {

    /**
     * 申请ID - 主键
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 申请标题
     */
    @NotBlank(message = "申请标题不能为空")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * 申请人（学生）
     */
    @NotNull(message = "申请人不能为空")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_application_applicant"))
    private User applicant;

    /**
     * 目标用人单位
     */
    @NotNull(message = "目标用人单位不能为空")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_unit_id", nullable = false, foreignKey = @ForeignKey(name = "fk_application_target_unit"))
    private User targetUnit;

    /**
     * 申请状态
     */
    @NotNull(message = "申请状态不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CertificationStatus status = CertificationStatus.APPLIED;

    /**
     * 申请详细描述
     */
    @Column(name = "description", length = 1000)
    private String description;

    /**
     * 申请人的学历信息
     */
    @Column(name = "education_info", length = 500)
    private String educationInfo;

    /**
     * 毕业院校
     */
    @Column(name = "graduate_school", length = 200)
    private String graduateSchool;

    /**
     * 专业名称
     */
    @Column(name = "major", length = 100)
    private String major;

    /**
     * 学历层次（本科、硕士、博士等）
     */
    @Column(name = "education_level", length = 50)
    private String educationLevel;

    /**
     * 毕业时间
     */
    @Column(name = "graduation_date")
    private LocalDateTime graduationDate;

    /**
     * 学位证书编号
     */
    @Column(name = "degree_certificate_number", length = 100)
    private String degreeCertificateNumber;

    /**
     * 申请提交时间
     */
    @CreationTimestamp
    @Column(name = "submission_date", nullable = false, updatable = false)
    private LocalDateTime submissionDate;

    /**
     * 处理时间（审批/拒绝的时间）
     */
    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    /**
     * 完成时间（上链完成的时间）
     */
    @Column(name = "completed_date")
    private LocalDateTime completedDate;

    /**
     * 处理人员备注
     */
    @Column(name = "processor_notes", length = 1000)
    private String processorNotes;

    /**
     * 申请人备注
     */
    @Column(name = "applicant_notes", length = 1000)
    private String applicantNotes;

    /**
     * 拒绝原因（如果被拒绝）
     */
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    /**
     * 关联的证书ID（如果申请成功）
     */
    @Column(name = "certificate_id")
    private Long certificateId;

    /**
     * 区块链交易哈希（上链成功后）
     */
    @Column(name = "blockchain_tx_hash", length = 100)
    private String blockchainTxHash;

    /**
     * 优先级（1-高，2-中，3-低）
     */
    @Builder.Default
    @Column(name = "priority", nullable = false)
    private Integer priority = 2;

    /**
     * 是否为紧急申请
     */
    @Builder.Default
    @Column(name = "is_urgent", nullable = false)
    private Boolean isUrgent = false;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 更新申请状态
     * 
     * @param newStatus 新状态
     * @param notes 处理备注
     */
    public void updateStatus(CertificationStatus newStatus, String notes) {
        if (this.status.canTransitionTo(newStatus)) {
            this.status = newStatus;
            this.processorNotes = notes;
            this.processedDate = LocalDateTime.now();
            
            // 如果是完成状态，设置完成时间
            if (newStatus == CertificationStatus.COMPLETED) {
                this.completedDate = LocalDateTime.now();
            }
        } else {
            throw new IllegalStateException(
                String.format("无法从状态 %s 转换到状态 %s", this.status, newStatus)
            );
        }
    }

    /**
     * 批准申请
     * 
     * @param notes 批准备注
     */
    public void approve(String notes) {
        updateStatus(CertificationStatus.APPROVED, notes);
    }

    /**
     * 拒绝申请
     * 
     * @param reason 拒绝原因
     */
    public void reject(String reason) {
        this.rejectionReason = reason;
        updateStatus(CertificationStatus.REJECTED, reason);
    }

    /**
     * 完成申请（上链成功）
     * 
     * @param txHash 区块链交易哈希
     * @param certificateId 生成的证书ID
     */
    public void complete(String txHash, Long certificateId) {
        this.blockchainTxHash = txHash;
        this.certificateId = certificateId;
        updateStatus(CertificationStatus.COMPLETED, "学历认证已成功上链");
    }

    /**
     * 检查申请是否可以被处理
     * 
     * @return 如果可以处理返回true，否则返回false
     */
    public boolean canBeProcessed() {
        return status == CertificationStatus.APPLIED || status == CertificationStatus.PENDING_APPROVAL;
    }

    /**
     * 检查申请是否已完成（成功或失败）
     * 
     * @return 如果已完成返回true，否则返回false
     */
    public boolean isCompleted() {
        return status.isFinal();
    }

    /**
     * 获取申请的处理进度百分比
     * 
     * @return 进度百分比（0-100）
     */
    public int getProgressPercentage() {
        return switch (status) {
            case APPLIED -> 20;
            case PENDING_APPROVAL -> 40;
            case APPROVED -> 80;
            case COMPLETED -> 100;
            case REJECTED -> 0;
        };
    }

    @Override
    public String toString() {
        return String.format("CertificationApplication{id=%d, title='%s', status=%s, applicant=%s, targetUnit=%s}", 
                           id, title, status, 
                           applicant != null ? applicant.getRealName() : "null",
                           targetUnit != null ? targetUnit.getOrganization() : "null");
    }
} 