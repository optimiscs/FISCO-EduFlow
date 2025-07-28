package com.xueliantong.core.enums;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * 学历认证状态枚举
 * 
 * 定义学历认证流程中的各个状态：
 * - APPLIED: 已申请，学生提交认证申请
 * - PENDING_APPROVAL: 待审批，等待政府机构审批
 * - APPROVED: 已通过，政府机构审批通过
 * - REJECTED: 已拒绝，政府机构审批拒绝
 * - COMPLETED: 已完成，认证信息已上链完成
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Getter
public enum CertificationStatus {
    
    /**
     * 已申请 - 学生提交认证申请
     */
    APPLIED("APPLIED", "已申请", "学生已提交学历认证申请，等待初步处理", "#FFA500"),
    
    /**
     * 待审批 - 等待政府机构审批
     */
    PENDING_APPROVAL("PENDING_APPROVAL", "待审批", "申请材料已通过初步审核，等待政府机构正式审批", "#FF6B35"),
    
    /**
     * 已通过 - 政府机构审批通过
     */
    APPROVED("APPROVED", "已通过", "政府机构已审批通过，准备上链处理", "#28A745"),
    
    /**
     * 已拒绝 - 政府机构审批拒绝
     */
    REJECTED("REJECTED", "已拒绝", "政府机构审批拒绝，申请未通过", "#DC3545"),
    
    /**
     * 已完成 - 认证信息已上链完成
     */
    COMPLETED("COMPLETED", "已完成", "学历认证已完成，信息已成功上链存储", "#007BFF");

    /**
     * 状态代码
     */
    @JsonValue
    private final String code;
    
    /**
     * 状态显示名称
     */
    private final String displayName;
    
    /**
     * 状态描述
     */
    private final String description;
    
    /**
     * 状态对应的颜色代码（用于前端显示）
     */
    private final String colorCode;

    /**
     * 构造函数
     * 
     * @param code 状态代码
     * @param displayName 状态显示名称
     * @param description 状态描述
     * @param colorCode 颜色代码
     */
    CertificationStatus(String code, String displayName, String description, String colorCode) {
        this.code = code;
        this.displayName = displayName;
        this.description = description;
        this.colorCode = colorCode;
    }

    /**
     * 根据代码获取认证状态枚举
     * 
     * @param code 状态代码
     * @return 对应的认证状态枚举，如果未找到返回null
     */
    public static CertificationStatus fromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return null;
        }
        
        for (CertificationStatus status : CertificationStatus.values()) {
            if (status.code.equalsIgnoreCase(code.trim())) {
                return status;
            }
        }
        return null;
    }

    /**
     * 检查状态是否可以转换到目标状态
     * 
     * @param targetStatus 目标状态
     * @return 如果可以转换返回true，否则返回false
     */
    public boolean canTransitionTo(CertificationStatus targetStatus) {
        if (targetStatus == null) {
            return false;
        }
        
        return switch (this) {
            case APPLIED -> targetStatus == PENDING_APPROVAL || targetStatus == REJECTED;
            case PENDING_APPROVAL -> targetStatus == APPROVED || targetStatus == REJECTED;
            case APPROVED -> targetStatus == COMPLETED;
            case REJECTED, COMPLETED -> false; // 终态，不能再转换
        };
    }

    /**
     * 获取状态的处理优先级
     * 数值越小优先级越高
     * 
     * @return 优先级数值
     */
    public int getPriority() {
        return switch (this) {
            case PENDING_APPROVAL -> 1; // 待审批优先级最高
            case APPLIED -> 2;          // 新申请次之
            case APPROVED -> 3;         // 已通过待上链
            case COMPLETED -> 4;        // 已完成
            case REJECTED -> 5;         // 已拒绝优先级最低
        };
    }

    /**
     * 检查是否为活跃状态（还需要处理的状态）
     * 
     * @return 如果是活跃状态返回true，否则返回false
     */
    public boolean isActive() {
        return this == APPLIED || this == PENDING_APPROVAL || this == APPROVED;
    }

    /**
     * 检查是否为终态（不会再变化的状态）
     * 
     * @return 如果是终态返回true，否则返回false
     */
    public boolean isFinal() {
        return this == COMPLETED || this == REJECTED;
    }

    /**
     * 获取下一个可能的状态列表
     * 
     * @return 下一个可能的状态数组
     */
    public CertificationStatus[] getNextPossibleStatuses() {
        return switch (this) {
            case APPLIED -> new CertificationStatus[]{PENDING_APPROVAL, REJECTED};
            case PENDING_APPROVAL -> new CertificationStatus[]{APPROVED, REJECTED};
            case APPROVED -> new CertificationStatus[]{COMPLETED};
            case REJECTED, COMPLETED -> new CertificationStatus[]{}; // 终态，无下一状态
        };
    }

    @Override
    public String toString() {
        return displayName;
    }
} 