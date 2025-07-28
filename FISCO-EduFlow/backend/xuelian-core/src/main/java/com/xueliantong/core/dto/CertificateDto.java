package com.xueliantong.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 学历认证证书DTO
 * 
 * 用于返回证书信息给前端
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
public class CertificateDto {

    /**
     * 证书ID
     */
    private Long id;

    /**
     * 证书所有者信息
     */
    private ApplicationResponseDto.UserBasicDto owner;

    /**
     * 关联的申请ID
     */
    private Long applicationId;

    /**
     * 证书序列号
     */
    private String serialNumber;

    /**
     * 证书标题
     */
    private String title;

    /**
     * 颁发日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime issueDate;

    /**
     * 有效期
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiryDate;

    /**
     * 区块链交易ID
     */
    private String blockchainTransactionId;

    /**
     * 证书PDF文件URL
     */
    private String pdfUrl;

    /**
     * 证书文件大小（字节）
     */
    private Long fileSize;

    /**
     * 证书文件大小（可读格式）
     */
    private String fileSizeDisplay;

    /**
     * 证书文件MD5哈希值
     */
    private String fileMd5;

    /**
     * 颁发机构
     */
    private String issuer;

    /**
     * 证书类型
     */
    private String certificateType;

    /**
     * 学历信息摘要
     */
    private String educationSummary;

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
     * 证书状态
     */
    private String status;

    /**
     * 证书状态显示名称
     */
    private String statusDisplayName;

    /**
     * 证书验证码
     */
    private String verificationCode;

    /**
     * 下载次数
     */
    private Integer downloadCount;

    /**
     * 最后下载时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastDownloadTime;

    /**
     * 证书备注
     */
    private String remarks;

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
     * 是否有效
     */
    private Boolean isValid;

    /**
     * 是否已过期
     */
    private Boolean isExpired;

    /**
     * 有效期剩余天数
     */
    private Integer remainingDays;

    /**
     * 获取文件大小的可读格式
     * 
     * @param sizeInBytes 文件大小（字节）
     * @return 可读格式的文件大小
     */
    public static String formatFileSize(Long sizeInBytes) {
        if (sizeInBytes == null || sizeInBytes <= 0) {
            return "未知";
        }
        
        final String[] units = {"B", "KB", "MB", "GB"};
        int unitIndex = 0;
        double size = sizeInBytes.doubleValue();
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return String.format("%.1f %s", size, units[unitIndex]);
    }

    /**
     * 计算有效期剩余天数
     * 
     * @param expiryDate 有效期
     * @return 剩余天数，null表示永久有效，负数表示已过期
     */
    public static Integer calculateRemainingDays(LocalDateTime expiryDate) {
        if (expiryDate == null) {
            return null; // 永久有效
        }
        
        LocalDateTime now = LocalDateTime.now();
        return (int) java.time.Duration.between(now, expiryDate).toDays();
    }

    /**
     * 获取证书状态的显示名称
     * 
     * @param status 证书状态
     * @return 状态显示名称
     */
    public static String getStatusDisplayName(String status) {
        if (status == null) {
            return "未知";
        }
        
        return switch (status.toUpperCase()) {
            case "ACTIVE" -> "有效";
            case "REVOKED" -> "已撤销";
            case "EXPIRED" -> "已过期";
            default -> status;
        };
    }

    /**
     * 检查证书是否可以下载
     * 
     * @return 如果可以下载返回true，否则返回false
     */
    public boolean canDownload() {
        return "ACTIVE".equals(status) && pdfUrl != null && !pdfUrl.trim().isEmpty();
    }

    /**
     * 检查证书是否即将过期（30天内）
     * 
     * @return 如果即将过期返回true，否则返回false
     */
    public boolean isExpiringSoon() {
        if (remainingDays == null) {
            return false; // 永久有效
        }
        return remainingDays > 0 && remainingDays <= 30;
    }

    /**
     * 获取证书摘要信息
     * 
     * @return 证书摘要
     */
    public String getSummary() {
        return String.format("%s - %s（%s）", 
                           title, 
                           owner != null ? owner.getRealName() : "未知所有者",
                           serialNumber);
    }

    /**
     * 获取教育信息摘要
     * 
     * @return 教育信息摘要
     */
    public String getEducationSummaryDisplay() {
        if (graduateSchool != null && major != null && educationLevel != null) {
            return String.format("%s %s毕业于%s", educationLevel, major, graduateSchool);
        } else if (educationSummary != null) {
            return educationSummary;
        } else {
            return "教育信息不完整";
        }
    }

    @Override
    public String toString() {
        return String.format("CertificateDto{id=%d, serialNumber='%s', owner=%s, status=%s, issueDate=%s}", 
                           id, serialNumber, 
                           owner != null ? owner.getRealName() : "null",
                           status, issueDate);
    }
} 