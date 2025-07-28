package com.xueliantong.blockchain.model;

/**
 * 节点类型枚举
 * 
 * 在本系统的联盟链中节点分为管理节点、用户节点和私有节点：
 * 
 * @author XueLianTong Team
 */
public enum NodeType {
    
    /**
     * 管理节点
     * 主要是教育部门，管理节点可以向底层区块链中写入数据，更新数据，
     * 此外还能为用户节点分配权限
     */
    MANAGEMENT("管理节点", "教育部门等管理机构", new String[]{
            "WRITE_DATA", "UPDATE_DATA", "READ_DATA", "QUERY_DATA",
            "MANAGE_PERMISSIONS", "REGISTER_NODES", "SUSPEND_NODES",
            "APPROVE_TRANSACTIONS", "MANAGE_CERTIFICATES"
    }),
    
    /**
     * 用户节点
     * 只参与交易享受服务，而不参与底层数据的更新记录。
     * 但普通节点可以查看人们链上记录的数据，并读取相应的交易记录
     */
    USER("用户节点", "学生、企业等普通用户", new String[]{
            "READ_DATA", "QUERY_DATA", "SUBMIT_TRANSACTIONS",
            "VIEW_CERTIFICATES", "REQUEST_SERVICES"
    }),
    
    /**
     * 私有节点
     * 指的是将私有资源贡献出来加入联盟链的用户。
     * 用户拥有创建节点，修改自己所拥有节点的相关底层数据，更新数据等权利，
     * 但不参与全部底层数据的记录更新
     */
    PRIVATE("私有节点", "贡献资源的私有机构", new String[]{
            "READ_DATA", "QUERY_DATA", "WRITE_OWN_DATA", "UPDATE_OWN_DATA",
            "CREATE_NODES", "MANAGE_OWN_NODES", "SUBMIT_TRANSACTIONS"
    });
    
    private final String displayName;
    private final String description;
    private final String[] defaultPermissions;
    
    NodeType(String displayName, String description, String[] defaultPermissions) {
        this.displayName = displayName;
        this.description = description;
        this.defaultPermissions = defaultPermissions;
    }
    
    /**
     * 获取显示名称
     * 
     * @return 显示名称
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * 获取描述
     * 
     * @return 描述
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * 获取默认权限
     * 
     * @return 默认权限数组
     */
    public String[] getDefaultPermissions() {
        return defaultPermissions.clone();
    }
    
    /**
     * 检查是否有指定权限
     * 
     * @param permission 权限名称
     * @return 是否有权限
     */
    public boolean hasDefaultPermission(String permission) {
        for (String defaultPermission : defaultPermissions) {
            if (defaultPermission.equals(permission)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 获取详细信息
     * 
     * @return 详细信息
     */
    public String getDetailedInfo() {
        StringBuilder info = new StringBuilder();
        info.append("节点类型: ").append(displayName).append("\n");
        info.append("描述: ").append(description).append("\n");
        info.append("默认权限: ");
        
        for (int i = 0; i < defaultPermissions.length; i++) {
            if (i > 0) {
                info.append(", ");
            }
            info.append(defaultPermissions[i]);
        }
        
        return info.toString();
    }
    
    /**
     * 根据字符串获取节点类型
     * 
     * @param typeStr 类型字符串
     * @return 节点类型
     */
    public static NodeType fromString(String typeStr) {
        if (typeStr == null || typeStr.trim().isEmpty()) {
            return null;
        }
        
        String upperTypeStr = typeStr.toUpperCase().trim();
        
        try {
            return NodeType.valueOf(upperTypeStr);
        } catch (IllegalArgumentException e) {
            // 尝试通过显示名称匹配
            for (NodeType type : NodeType.values()) {
                if (type.getDisplayName().equals(typeStr) || 
                    type.getDisplayName().contains(typeStr)) {
                    return type;
                }
            }
            return null;
        }
    }
    
    /**
     * 检查节点类型是否可以执行指定操作
     * 
     * @param operation 操作类型
     * @return 是否可以执行
     */
    public boolean canPerformOperation(String operation) {
        switch (this) {
            case MANAGEMENT:
                return canManagementNodePerform(operation);
            case USER:
                return canUserNodePerform(operation);
            case PRIVATE:
                return canPrivateNodePerform(operation);
            default:
                return false;
        }
    }
    
    /**
     * 检查管理节点是否可以执行操作
     */
    private boolean canManagementNodePerform(String operation) {
        switch (operation) {
            case "WRITE_DATA":
            case "UPDATE_DATA":
            case "READ_DATA":
            case "QUERY_DATA":
            case "MANAGE_PERMISSIONS":
            case "REGISTER_NODES":
            case "SUSPEND_NODES":
            case "APPROVE_TRANSACTIONS":
            case "MANAGE_CERTIFICATES":
                return true;
            default:
                return false;
        }
    }
    
    /**
     * 检查用户节点是否可以执行操作
     */
    private boolean canUserNodePerform(String operation) {
        switch (operation) {
            case "READ_DATA":
            case "QUERY_DATA":
            case "SUBMIT_TRANSACTIONS":
            case "VIEW_CERTIFICATES":
            case "REQUEST_SERVICES":
                return true;
            default:
                return false;
        }
    }
    
    /**
     * 检查私有节点是否可以执行操作
     */
    private boolean canPrivateNodePerform(String operation) {
        switch (operation) {
            case "READ_DATA":
            case "QUERY_DATA":
            case "WRITE_OWN_DATA":
            case "UPDATE_OWN_DATA":
            case "CREATE_NODES":
            case "MANAGE_OWN_NODES":
            case "SUBMIT_TRANSACTIONS":
                return true;
            default:
                return false;
        }
    }
    
    /**
     * 获取所有节点类型的信息
     * 
     * @return 所有节点类型信息
     */
    public static String getAllNodeTypesInfo() {
        StringBuilder info = new StringBuilder();
        info.append("联盟链节点类型说明:\n\n");
        
        for (NodeType type : NodeType.values()) {
            info.append(type.getDetailedInfo()).append("\n\n");
        }
        
        return info.toString();
    }
    
    /**
     * 检查是否为管理类型节点
     * 
     * @return 是否为管理节点
     */
    public boolean isManagementType() {
        return this == MANAGEMENT;
    }
    
    /**
     * 检查是否为用户类型节点
     * 
     * @return 是否为用户节点
     */
    public boolean isUserType() {
        return this == USER;
    }
    
    /**
     * 检查是否为私有类型节点
     * 
     * @return 是否为私有节点
     */
    public boolean isPrivateType() {
        return this == PRIVATE;
    }
    
    /**
     * 获取节点类型的权限级别
     * 
     * @return 权限级别（数字越大权限越高）
     */
    public int getPermissionLevel() {
        switch (this) {
            case MANAGEMENT:
                return 3; // 最高权限
            case PRIVATE:
                return 2; // 中等权限
            case USER:
                return 1; // 基础权限
            default:
                return 0;
        }
    }
    
    /**
     * 比较权限级别
     * 
     * @param other 其他节点类型
     * @return 权限级别比较结果
     */
    public int comparePermissionLevel(NodeType other) {
        return Integer.compare(this.getPermissionLevel(), other.getPermissionLevel());
    }
}
