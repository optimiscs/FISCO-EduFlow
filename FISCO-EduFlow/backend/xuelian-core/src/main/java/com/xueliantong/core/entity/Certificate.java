package com.xueliantong.core.entity;

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
 * 学历认证证书实体类
 * 
 * 表示已生成并上链的学历认证证书
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Entity
@Table(name = "certificates", indexes = {
    @Index(name = "idx_certificate_owner", columnList = "owner_id"),
    @Index(name = "idx_certificate_application", columnList = "application_id"),
    @Index(name = "idx_certificate_blockchain_tx", columnList = "blockchain_transaction_id"),
    @Index(name = "idx_certificate_issue_date", columnList = "issue_date"),
    @Index(name = "idx_certificate_serial_number", columnList = "serial_number")
})
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    /**
     * 证书ID - 主键
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 证书所有者（学生）
     */
    @NotNull(message = "证书所有者不能为空")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, foreignKey = @ForeignKey(name = "fk_certificate_owner"))
    private User owner;

    /**
     * 关联的认证申请
     */
    @NotNull(message = "关联申请不能为空")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_certificate_application"))
    private CertificationApplication application;

    /**
     * 证书序列号（唯一标识）
     */
    @NotBlank(message = "证书序列号不能为空")
    @Column(name = "serial_number", nullable = false, unique = true, length = 50)
    private String serialNumber;

    /**
     * 证书标题
     */
    @NotBlank(message = "证书标题不能为空")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * 颁发日期
     */
    @NotNull(message = "颁发日期不能为空")
    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate;

    /**
     * 有效期（可选，null表示永久有效）
     */
    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    /**
     * 区块链交易ID/哈希
     */
    @NotBlank(message = "区块链交易ID不能为空")
    @Column(name = "blockchain_transaction_id", nullable = false, length = 100)
    private String blockchainTransactionId;

    /**
     * 证书PDF文件的存储路径/URL
     */
    @NotBlank(message = "证书文件路径不能为空")
    @Column(name = "pdf_url", nullable = false, length = 500)
    private String pdfUrl;

    /**
     * 证书文件大小（字节）
     */
    @Column(name = "file_size")
    private Long fileSize;

    /**
     * 证书文件MD5哈希值（用于完整性校验）
     */
    @Column(name = "file_md5", length = 32)
    private String fileMd5;

    /**
     * 颁发机构
     */
    @Column(name = "issuer", length = 200)
    private String issuer;

    /**
     * 证书类型（学历认证、技能认证等）
     */
    @Builder.Default
    @Column(name = "certificate_type", length = 50)
    private String certificateType = "学历认证";

    /**
     * 学历信息摘要
     */
    @Column(name = "education_summary", length = 500)
    private String educationSummary;

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
     * 学历层次
     */
    @Column(name = "education_level", length = 50)
    private String educationLevel;

    /**
     * 毕业时间
     */
    @Column(name = "graduation_date")
    private LocalDateTime graduationDate;

    /**
     * 证书状态（ACTIVE-有效，REVOKED-已撤销，EXPIRED-已过期）
     */
    @Builder.Default
    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    /**
     * 证书验证码（用于快速验证）
     */
    @Column(name = "verification_code", length = 20)
    private String verificationCode;

    /**
     * 下载次数统计
     */
    @Builder.Default
    @Column(name = "download_count")
    private Integer downloadCount = 0;

    /**
     * 最后下载时间
     */
    @Column(name = "last_download_time")
    private LocalDateTime lastDownloadTime;

    /**
     * 证书备注
     */
    @Column(name = "remarks", length = 500)
    private String remarks;

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
     * 检查证书是否有效
     * 
     * @return 如果证书有效返回true，否则返回false
     */
    public boolean isValid() {
        if (!"ACTIVE".equals(status)) {
            return false;
        }
        
        if (expiryDate != null && LocalDateTime.now().isAfter(expiryDate)) {
            return false;
        }
        
        return true;
    }

    /**
     * 检查证书是否已过期
     * 
     * @return 如果已过期返回true，否则返回false
     */
    public boolean isExpired() {
        return expiryDate != null && LocalDateTime.now().isAfter(expiryDate);
    }

    /**
     * 撤销证书
     * 
     * @param reason 撤销原因
     */
    public void revoke(String reason) {
        this.status = "REVOKED";
        this.remarks = (this.remarks != null ? this.remarks + " | " : "") + "撤销原因: " + reason;
    }

    /**
     * 更新下载统计
     */
    public void recordDownload() {
        this.downloadCount = (this.downloadCount != null ? this.downloadCount : 0) + 1;
        this.lastDownloadTime = LocalDateTime.now();
    }

    /**
     * 生成证书序列号
     * 
     * @param applicationId 申请ID
     * @return 证书序列号
     */
    public static String generateSerialNumber(Long applicationId) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        return String.format("XLT-%s-%06d", timestamp, applicationId);
    }

    /**
     * 生成验证码
     * 
     * @return 6位数字验证码
     */
    public static String generateVerificationCode() {
        return String.format("%06d", (int) (Math.random() * 1000000));
    }

    /**
     * 从申请信息中构建证书
     * 
     * @param application 认证申请
     * @param blockchainTxId 区块链交易ID
     * @param pdfUrl PDF文件路径
     * @return 证书实例
     */
    public static Certificate fromApplication(CertificationApplication application, String blockchainTxId, String pdfUrl) {
        return Certificate.builder()
                .owner(application.getApplicant())
                .application(application)
                .serialNumber(generateSerialNumber(application.getId()))
                .title(String.format("%s的学历认证证书", application.getApplicant().getRealName()))
                .issueDate(LocalDateTime.now())
                .blockchainTransactionId(blockchainTxId)
                .pdfUrl(pdfUrl)
                .issuer("学链通认证平台")
                .educationSummary(application.getEducationInfo())
                .graduateSchool(application.getGraduateSchool())
                .major(application.getMajor())
                .educationLevel(application.getEducationLevel())
                .graduationDate(application.getGraduationDate())
                .verificationCode(generateVerificationCode())
                .build();
    }

    @Override
    public String toString() {
        return String.format("Certificate{id=%d, serialNumber='%s', owner=%s, issueDate=%s, status=%s}", 
                           id, serialNumber, 
                           owner != null ? owner.getRealName() : "null",
                           issueDate, status);
    }
} 