package com.xueliantong.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 学历认证申请请求DTO
 * 
 * 用于接收学生提交的认证申请数据
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationRequestDto {

    /**
     * 申请标题
     */
    @NotBlank(message = "申请标题不能为空")
    @Size(max = 200, message = "申请标题长度不能超过200个字符")
    private String title;

    /**
     * 目标用人单位ID
     */
    @NotNull(message = "目标用人单位不能为空")
    private Long targetUnitId;

    /**
     * 申请详细描述
     */
    @Size(max = 1000, message = "申请描述长度不能超过1000个字符")
    private String description;

    /**
     * 申请人的学历信息
     */
    @Size(max = 500, message = "学历信息长度不能超过500个字符")
    private String educationInfo;

    /**
     * 毕业院校
     */
    @NotBlank(message = "毕业院校不能为空")
    @Size(max = 200, message = "毕业院校名称长度不能超过200个字符")
    private String graduateSchool;

    /**
     * 专业名称
     */
    @NotBlank(message = "专业名称不能为空")
    @Size(max = 100, message = "专业名称长度不能超过100个字符")
    private String major;

    /**
     * 学历层次（本科、硕士、博士等）
     */
    @NotBlank(message = "学历层次不能为空")
    @Size(max = 50, message = "学历层次长度不能超过50个字符")
    private String educationLevel;

    /**
     * 毕业时间
     */
    @NotNull(message = "毕业时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime graduationDate;

    /**
     * 学位证书编号
     */
    @Size(max = 100, message = "学位证书编号长度不能超过100个字符")
    private String degreeCertificateNumber;

    /**
     * 申请人备注
     */
    @Size(max = 1000, message = "申请人备注长度不能超过1000个字符")
    private String applicantNotes;

    /**
     * 优先级（1-高，2-中，3-低）
     */
    @Builder.Default
    private Integer priority = 2;

    /**
     * 是否为紧急申请
     */
    @Builder.Default
    private Boolean isUrgent = false;

    /**
     * 验证申请数据的完整性
     * 
     * @return 如果数据完整返回true，否则返回false
     */
    public boolean isDataComplete() {
        return title != null && !title.trim().isEmpty() &&
               targetUnitId != null &&
               graduateSchool != null && !graduateSchool.trim().isEmpty() &&
               major != null && !major.trim().isEmpty() &&
               educationLevel != null && !educationLevel.trim().isEmpty() &&
               graduationDate != null;
    }

    /**
     * 获取申请摘要信息
     * 
     * @return 申请摘要
     */
    public String getSummary() {
        return String.format("%s - %s毕业于%s（%s专业）", 
                           title, educationLevel, graduateSchool, major);
    }

    @Override
    public String toString() {
        return String.format("ApplicationRequestDto{title='%s', targetUnitId=%d, graduateSchool='%s', major='%s', educationLevel='%s'}", 
                           title, targetUnitId, graduateSchool, major, educationLevel);
    }
} 