package com.xueliantong.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.Set;

/**
 * 学籍信息查询请求DTO
 * 
 * 用于学籍信息的选择性查询，实现隐私保护
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicInfoRequestDto {

    /**
     * 学生ID
     */
    @NotBlank(message = "学生ID不能为空")
    private String studentId;

    /**
     * 需要查询的字段集合
     * 
     * 支持的字段包括：
     * - "studentId": 学生ID
     * - "realName": 真实姓名（脱敏）
     * - "idNumber": 身份证号（脱敏）
     * - "school": 就读/毕业院校
     * - "major": 专业名称
     * - "degree": 学位信息
     * - "educationLevel": 学历层次
     * - "admissionDate": 入学时间
     * - "graduationDate": 毕业时间
     * - "studentStatus": 学籍状态
     * - "gpa": 绩点信息
     * - "awards": 获奖情况
     * - "certifications": 已获认证
     */
    @NotEmpty(message = "查询字段不能为空")
    private Set<String> fields;

    /**
     * 查询原因（可选，用于审计）
     */
    private String queryReason;

    /**
     * 查询用途（可选）
     */
    private String queryPurpose;

    /**
     * 获取所有支持的字段
     * 
     * @return 支持的字段集合
     */
    public static Set<String> getSupportedFields() {
        return Set.of(
            "studentId", "realName", "idNumber", "school", "major", 
            "degree", "educationLevel", "admissionDate", "graduationDate",
            "studentStatus", "gpa", "awards", "certifications"
        );
    }

    /**
     * 验证请求字段是否合法
     * 
     * @return 如果所有字段都合法返回true，否则返回false
     */
    public boolean areFieldsValid() {
        if (fields == null || fields.isEmpty()) {
            return false;
        }
        
        Set<String> supportedFields = getSupportedFields();
        return supportedFields.containsAll(fields);
    }

    /**
     * 获取不支持的字段
     * 
     * @return 不支持的字段集合
     */
    public Set<String> getUnsupportedFields() {
        if (fields == null || fields.isEmpty()) {
            return Set.of();
        }
        
        Set<String> unsupportedFields = new java.util.HashSet<>(fields);
        unsupportedFields.removeAll(getSupportedFields());
        return unsupportedFields;
    }

    /**
     * 检查是否请求了敏感信息
     * 
     * @return 如果请求了敏感信息返回true，否则返回false
     */
    public boolean containsSensitiveFields() {
        if (fields == null || fields.isEmpty()) {
            return false;
        }
        
        Set<String> sensitiveFields = Set.of("realName", "idNumber", "gpa", "awards");
        return fields.stream().anyMatch(sensitiveFields::contains);
    }

    /**
     * 获取字段数量
     * 
     * @return 请求的字段数量
     */
    public int getFieldCount() {
        return fields != null ? fields.size() : 0;
    }

    @Override
    public String toString() {
        return String.format("AcademicInfoRequestDto{studentId='%s', fields=%s, fieldCount=%d, containsSensitive=%s}", 
                           studentId, fields, getFieldCount(), containsSensitiveFields());
    }
} 