package com.xueliantong.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * 学籍信息查询响应DTO
 * 
 * 返回查询到的学籍信息
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
public class AcademicInfoResponseDto {

    /**
     * 查询是否成功
     */
    private boolean success;

    /**
     * 学生ID
     */
    private String studentId;

    /**
     * 查询到的学籍数据
     */
    private Map<String, Object> academicData;

    /**
     * 请求的字段
     */
    private Set<String> requestedFields;

    /**
     * 实际返回的字段
     */
    private Set<String> returnedFields;

    /**
     * 数据来源
     */
    private String dataSource;

    /**
     * 查询时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime queryTime;

    /**
     * 数据完整性验证
     */
    private String dataIntegrity;

    /**
     * 区块链高度
     */
    private Long blockHeight;

    /**
     * 错误信息（如果查询失败）
     */
    private String errorMessage;

    /**
     * 隐私保护级别
     */
    private String privacyLevel;

    /**
     * 查询元数据
     */
    private QueryMetadata metadata;

    /**
     * 查询元数据内部类
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QueryMetadata {
        /**
         * 请求字段数量
         */
        private Integer requestedFieldCount;

        /**
         * 返回字段数量
         */
        private Integer returnedFieldCount;

        /**
         * 查询耗时（毫秒）
         */
        private Long queryDuration;

        /**
         * 是否包含敏感信息
         */
        private Boolean containsSensitiveData;

        /**
         * 数据新鲜度（数据最后更新距离现在的天数）
         */
        private Integer dataFreshnessDays;

        /**
         * 区块链验证状态
         */
        private String blockchainVerificationStatus;

        /**
         * 查询追踪ID（用于审计）
         */
        private String auditTrackingId;
    }

    /**
     * 创建成功响应
     * 
     * @param studentId 学生ID
     * @param academicData 学籍数据
     * @param requestedFields 请求字段
     * @param dataSource 数据来源
     * @return 成功响应
     */
    public static AcademicInfoResponseDto success(String studentId, Map<String, Object> academicData, 
                                                Set<String> requestedFields, String dataSource) {
        Set<String> returnedFields = academicData.keySet();
        
        return AcademicInfoResponseDto.builder()
                .success(true)
                .studentId(studentId)
                .academicData(academicData)
                .requestedFields(requestedFields)
                .returnedFields(returnedFields)
                .dataSource(dataSource)
                .queryTime(LocalDateTime.now())
                .dataIntegrity("verified")
                .privacyLevel(containsSensitiveFields(returnedFields) ? "高" : "普通")
                .metadata(QueryMetadata.builder()
                        .requestedFieldCount(requestedFields.size())
                        .returnedFieldCount(returnedFields.size())
                        .containsSensitiveData(containsSensitiveFields(returnedFields))
                        .blockchainVerificationStatus("verified")
                        .auditTrackingId(generateAuditTrackingId())
                        .build())
                .build();
    }

    /**
     * 创建失败响应
     * 
     * @param studentId 学生ID
     * @param errorMessage 错误信息
     * @param requestedFields 请求字段
     * @return 失败响应
     */
    public static AcademicInfoResponseDto failure(String studentId, String errorMessage, Set<String> requestedFields) {
        return AcademicInfoResponseDto.builder()
                .success(false)
                .studentId(studentId)
                .requestedFields(requestedFields)
                .errorMessage(errorMessage)
                .queryTime(LocalDateTime.now())
                .metadata(QueryMetadata.builder()
                        .requestedFieldCount(requestedFields != null ? requestedFields.size() : 0)
                        .returnedFieldCount(0)
                        .containsSensitiveData(false)
                        .blockchainVerificationStatus("failed")
                        .auditTrackingId(generateAuditTrackingId())
                        .build())
                .build();
    }

    /**
     * 检查字段集合是否包含敏感信息
     * 
     * @param fields 字段集合
     * @return 如果包含敏感信息返回true，否则返回false
     */
    private static boolean containsSensitiveFields(Set<String> fields) {
        if (fields == null || fields.isEmpty()) {
            return false;
        }
        
        Set<String> sensitiveFields = Set.of("realName", "idNumber", "gpa", "awards");
        return fields.stream().anyMatch(sensitiveFields::contains);
    }

    /**
     * 生成审计追踪ID
     * 
     * @return 审计追踪ID
     */
    private static String generateAuditTrackingId() {
        return "AUDIT-" + System.currentTimeMillis() + "-" + 
               String.format("%04d", (int)(Math.random() * 10000));
    }

    /**
     * 获取查询摘要
     * 
     * @return 查询摘要字符串
     */
    public String getQuerySummary() {
        if (!success) {
            return String.format("查询失败 - 学生ID: %s, 错误: %s", studentId, errorMessage);
        }
        
        return String.format("查询成功 - 学生ID: %s, 返回字段: %d/%d, 数据源: %s", 
                           studentId, 
                           returnedFields != null ? returnedFields.size() : 0,
                           requestedFields != null ? requestedFields.size() : 0,
                           dataSource);
    }

    /**
     * 检查是否所有请求的字段都被返回
     * 
     * @return 如果所有字段都被返回返回true，否则返回false
     */
    public boolean isDataComplete() {
        if (!success || requestedFields == null || returnedFields == null) {
            return false;
        }
        return returnedFields.containsAll(requestedFields);
    }

    @Override
    public String toString() {
        return String.format("AcademicInfoResponseDto{success=%s, studentId='%s', fieldCount=%d, dataSource='%s'}", 
                           success, studentId, 
                           returnedFields != null ? returnedFields.size() : 0, 
                           dataSource);
    }
} 