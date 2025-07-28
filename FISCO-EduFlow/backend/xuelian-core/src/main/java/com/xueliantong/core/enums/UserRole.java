package com.xueliantong.core.enums;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * 用户角色枚举
 * 
 * 定义学链通系统中的用户角色类型：
 * - STUDENT: 学生用户，申请学历认证
 * - UNIT: 用人单位，查询和验证学历信息
 * - GOVERNMENT: 政府机构，负责学历认证审批
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Getter
public enum UserRole {
    
    /**
     * 学生用户 - 申请学历认证
     */
    STUDENT("STUDENT", "学生", "申请学历认证的个人用户"),
    
    /**
     * 用人单位 - 查询验证学历
     */
    UNIT("UNIT", "用人单位", "需要验证员工学历信息的企业或机构"),
    
    /**
     * 政府机构 - 学历认证审批
     */
    GOVERNMENT("GOVERNMENT", "政府机构", "负责学历认证审批的政府部门");

    /**
     * 角色代码
     */
    @JsonValue
    private final String code;
    
    /**
     * 角色显示名称
     */
    private final String displayName;
    
    /**
     * 角色描述
     */
    private final String description;

    /**
     * 构造函数
     * 
     * @param code 角色代码
     * @param displayName 角色显示名称
     * @param description 角色描述
     */
    UserRole(String code, String displayName, String description) {
        this.code = code;
        this.displayName = displayName;
        this.description = description;
    }

    /**
     * 根据代码获取角色枚举
     * 
     * @param code 角色代码
     * @return 对应的用户角色枚举，如果未找到返回null
     */
    public static UserRole fromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return null;
        }
        
        for (UserRole role : UserRole.values()) {
            if (role.code.equalsIgnoreCase(code.trim())) {
                return role;
            }
        }
        return null;
    }

    /**
     * 检查是否为学生角色
     * 
     * @return 如果是学生角色返回true，否则返回false
     */
    public boolean isStudent() {
        return this == STUDENT;
    }

    /**
     * 检查是否为用人单位角色
     * 
     * @return 如果是用人单位角色返回true，否则返回false
     */
    public boolean isUnit() {
        return this == UNIT;
    }

    /**
     * 检查是否为政府机构角色
     * 
     * @return 如果是政府机构角色返回true，否则返回false
     */
    public boolean isGovernment() {
        return this == GOVERNMENT;
    }

    /**
     * 获取角色权限级别
     * 学生 < 用人单位 < 政府机构
     * 
     * @return 权限级别数值，数值越大权限越高
     */
    public int getPermissionLevel() {
        return switch (this) {
            case STUDENT -> 1;
            case UNIT -> 2;
            case GOVERNMENT -> 3;
        };
    }

    @Override
    public String toString() {
        return displayName;
    }
} 