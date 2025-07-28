package com.xueliantong.blockchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * 节点权限模型
 * 
 * 在本系统的联盟链中节点分为：
 * 1. 管理节点：主要是教育部门，可以向底层区块链中写入数据，更新数据，为用户节点分配权限
 * 2. 用户节点：只参与交易享受服务，而不参与底层数据的更新记录，但可以查看链上记录的数据
 * 3. 私有节点：将私有资源贡献出来加入联盟链的用户，拥有创建节点，修改自己所拥有节点的相关底层数据等权利
 * 
 * @author XueLianTong Team
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodePermission {
    
    /**
     * 节点地址
     */
    private String nodeAddress;
    
    /**
     * 节点类型
     */
    private NodeType nodeType;
    
    /**
     * 组织名称
     */
    private String organizationName;
    
    /**
     * 联系信息
     */
    private String contactInfo;
    
    /**
     * 权限集合
     */
    private Set<String> permissions;
    
    /**
     * 节点状态：ACTIVE, SUSPENDED, INACTIVE
     */
    private String status;
    
    /**
     * 注册时间
     */
    private LocalDateTime registeredAt;
    
    /**
     * 注册者地址
     */
    private String registeredBy;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 更新者地址
     */
    private String updatedBy;
    
    /**
     * 最后活跃时间
     */
    private LocalDateTime lastActiveAt;
    
    /**
     * 暂停时间
     */
    private LocalDateTime suspendedAt;
    
    /**
     * 暂停者地址
     */
    private String suspendedBy;
    
    /**
     * 暂停原因
     */
    private String suspendReason;
    
    /**
     * 节点配置信息
     */
    private NodeConfig nodeConfig;
    
    /**
     * 节点统计信息
     */
    private NodeStatistics statistics;
    
    /**
     * 节点配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeConfig {
        private String endpoint;
        private Integer port;
        private String version;
        private String region;
        private Integer maxConnections;
        private Long maxThroughput;
        private String[] supportedProtocols;
    }
    
    /**
     * 节点统计信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeStatistics {
        private Long totalTransactions;
        private Long successfulTransactions;
        private Long failedTransactions;
        private Double averageResponseTime;
        private Long totalDataWritten;
        private Long totalDataRead;
        private LocalDateTime lastStatisticsUpdate;
    }
    
    /**
     * 检查是否有指定权限
     * 
     * @param permission 权限名称
     * @return 是否有权限
     */
    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }
    
    /**
     * 检查节点是否活跃
     * 
     * @return 是否活跃
     */
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
    
    /**
     * 检查节点是否被暂停
     * 
     * @return 是否被暂停
     */
    public boolean isSuspended() {
        return "SUSPENDED".equals(status);
    }
    
    /**
     * 获取节点类型描述
     * 
     * @return 类型描述
     */
    public String getNodeTypeDescription() {
        if (nodeType == null) {
            return "Unknown";
        }
        
        switch (nodeType) {
            case MANAGEMENT:
                return "管理节点 - 教育部门，可以写入数据、更新数据、分配权限";
            case USER:
                return "用户节点 - 参与交易享受服务，可以查看链上数据";
            case PRIVATE:
                return "私有节点 - 贡献资源加入联盟链，可以管理自己的节点数据";
            default:
                return "未知节点类型";
        }
    }
    
    /**
     * 获取权限描述
     * 
     * @return 权限描述列表
     */
    public String[] getPermissionDescriptions() {
        if (permissions == null || permissions.isEmpty()) {
            return new String[0];
        }
        
        return permissions.stream()
                .map(this::getPermissionDescription)
                .toArray(String[]::new);
    }
    
    /**
     * 获取单个权限的描述
     * 
     * @param permission 权限名称
     * @return 权限描述
     */
    private String getPermissionDescription(String permission) {
        switch (permission) {
            case "WRITE_DATA":
                return "写入数据 - 可以向区块链写入新数据";
            case "UPDATE_DATA":
                return "更新数据 - 可以更新区块链上的数据";
            case "READ_DATA":
                return "读取数据 - 可以读取区块链上的数据";
            case "QUERY_DATA":
                return "查询数据 - 可以查询区块链上的数据";
            case "MANAGE_PERMISSIONS":
                return "管理权限 - 可以管理其他节点的权限";
            case "REGISTER_NODES":
                return "注册节点 - 可以注册新的节点";
            case "SUSPEND_NODES":
                return "暂停节点 - 可以暂停其他节点";
            case "APPROVE_TRANSACTIONS":
                return "审批交易 - 可以审批交易";
            case "MANAGE_CERTIFICATES":
                return "管理证书 - 可以管理学历证书";
            case "SUBMIT_TRANSACTIONS":
                return "提交交易 - 可以提交交易";
            case "VIEW_CERTIFICATES":
                return "查看证书 - 可以查看学历证书";
            case "REQUEST_SERVICES":
                return "请求服务 - 可以请求各种服务";
            case "WRITE_OWN_DATA":
                return "写入自有数据 - 可以写入自己的数据";
            case "UPDATE_OWN_DATA":
                return "更新自有数据 - 可以更新自己的数据";
            case "CREATE_NODES":
                return "创建节点 - 可以创建新节点";
            case "MANAGE_OWN_NODES":
                return "管理自有节点 - 可以管理自己的节点";
            default:
                return permission + " - 未知权限";
        }
    }
    
    /**
     * 检查是否可以执行指定操作
     * 
     * @param operation 操作类型
     * @param targetNodeAddress 目标节点地址（可选）
     * @return 是否可以执行
     */
    public boolean canPerformOperation(String operation, String targetNodeAddress) {
        if (!isActive()) {
            return false;
        }
        
        switch (operation) {
            case "WRITE_BLOCKCHAIN_DATA":
                return hasPermission("WRITE_DATA") || hasPermission("WRITE_OWN_DATA");
                
            case "UPDATE_BLOCKCHAIN_DATA":
                return hasPermission("UPDATE_DATA") || hasPermission("UPDATE_OWN_DATA");
                
            case "READ_BLOCKCHAIN_DATA":
                return hasPermission("READ_DATA");
                
            case "MANAGE_NODE_PERMISSIONS":
                return hasPermission("MANAGE_PERMISSIONS") && nodeType == NodeType.MANAGEMENT;
                
            case "REGISTER_NEW_NODE":
                return hasPermission("REGISTER_NODES") && nodeType == NodeType.MANAGEMENT;
                
            case "SUSPEND_NODE":
                return hasPermission("SUSPEND_NODES") && nodeType == NodeType.MANAGEMENT;
                
            case "APPROVE_TRANSACTION":
                return hasPermission("APPROVE_TRANSACTIONS");
                
            case "SUBMIT_TRANSACTION":
                return hasPermission("SUBMIT_TRANSACTIONS");
                
            case "MANAGE_CERTIFICATE":
                return hasPermission("MANAGE_CERTIFICATES");
                
            case "VIEW_CERTIFICATE":
                return hasPermission("VIEW_CERTIFICATES") || hasPermission("READ_DATA");
                
            case "CREATE_PRIVATE_NODE":
                return hasPermission("CREATE_NODES") && nodeType == NodeType.PRIVATE;
                
            case "MANAGE_OWN_NODE":
                return hasPermission("MANAGE_OWN_NODES") && 
                       (targetNodeAddress == null || targetNodeAddress.equals(nodeAddress));
                
            default:
                return false;
        }
    }
    
    /**
     * 更新统计信息
     * 
     * @param transactionCount 交易数量
     * @param successCount 成功数量
     * @param failCount 失败数量
     * @param responseTime 响应时间
     */
    public void updateStatistics(long transactionCount, long successCount, 
                               long failCount, double responseTime) {
        if (statistics == null) {
            statistics = new NodeStatistics();
        }
        
        statistics.setTotalTransactions(
                (statistics.getTotalTransactions() != null ? statistics.getTotalTransactions() : 0) + transactionCount);
        statistics.setSuccessfulTransactions(
                (statistics.getSuccessfulTransactions() != null ? statistics.getSuccessfulTransactions() : 0) + successCount);
        statistics.setFailedTransactions(
                (statistics.getFailedTransactions() != null ? statistics.getFailedTransactions() : 0) + failCount);
        
        // 计算平均响应时间
        if (statistics.getAverageResponseTime() != null) {
            statistics.setAverageResponseTime(
                    (statistics.getAverageResponseTime() + responseTime) / 2);
        } else {
            statistics.setAverageResponseTime(responseTime);
        }
        
        statistics.setLastStatisticsUpdate(LocalDateTime.now());
    }
    
    /**
     * 获取节点健康状态
     * 
     * @return 健康状态描述
     */
    public String getHealthStatus() {
        if (!isActive()) {
            return "INACTIVE";
        }
        
        if (lastActiveAt == null) {
            return "UNKNOWN";
        }
        
        LocalDateTime now = LocalDateTime.now();
        long minutesSinceLastActive = java.time.Duration.between(lastActiveAt, now).toMinutes();
        
        if (minutesSinceLastActive < 5) {
            return "HEALTHY";
        } else if (minutesSinceLastActive < 30) {
            return "WARNING";
        } else {
            return "UNHEALTHY";
        }
    }
}
