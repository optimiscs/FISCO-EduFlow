package com.xueliantong.blockchain.service;

import com.xueliantong.blockchain.config.FiscoBcosConfig;
import com.xueliantong.blockchain.model.NodePermission;
import com.xueliantong.blockchain.model.NodeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 节点权限管理服务
 * 
 * 在本系统的联盟链中节点分为：
 * 1. 管理节点：主要是教育部门，可以向底层区块链中写入数据，更新数据，为用户节点分配权限
 * 2. 用户节点：只参与交易享受服务，而不参与底层数据的更新记录，但可以查看链上记录的数据
 * 3. 私有节点：将私有资源贡献出来加入联盟链的用户，拥有创建节点，修改自己所拥有节点的相关底层数据等权利
 * 
 * @author XueLianTong Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NodePermissionService {

    private final FiscoBcosConfig fiscoBcosConfig;
    private final RedisTemplate<String, Object> redisTemplate;
    
    // 节点权限缓存
    private final Map<String, NodePermission> nodePermissions = new ConcurrentHashMap<>();
    
    // 权限操作历史
    private final Map<String, List<PermissionOperation>> permissionHistory = new ConcurrentHashMap<>();

    /**
     * 注册新节点
     * 
     * @param nodeAddress 节点地址
     * @param nodeType 节点类型
     * @param organizationName 组织名称
     * @param contactInfo 联系信息
     * @param approverAddress 审批者地址（管理节点）
     * @return 是否成功
     */
    public boolean registerNode(String nodeAddress, NodeType nodeType, 
                               String organizationName, String contactInfo, 
                               String approverAddress) {
        try {
            // 验证审批者权限
            if (!hasManagementPermission(approverAddress)) {
                log.error("审批者没有管理权限: {}", approverAddress);
                return false;
            }
            
            // 检查节点是否已存在
            if (nodePermissions.containsKey(nodeAddress)) {
                log.error("节点已存在: {}", nodeAddress);
                return false;
            }
            
            // 创建节点权限
            NodePermission permission = NodePermission.builder()
                    .nodeAddress(nodeAddress)
                    .nodeType(nodeType)
                    .organizationName(organizationName)
                    .contactInfo(contactInfo)
                    .permissions(getDefaultPermissions(nodeType))
                    .status("ACTIVE")
                    .registeredAt(LocalDateTime.now())
                    .registeredBy(approverAddress)
                    .lastActiveAt(LocalDateTime.now())
                    .build();
            
            // 存储权限信息
            nodePermissions.put(nodeAddress, permission);
            cacheNodePermission(permission);
            
            // 记录操作历史
            recordPermissionOperation(nodeAddress, "REGISTER", approverAddress, 
                    "Node registered with type: " + nodeType);
            
            log.info("节点注册成功: {} -> {}", nodeAddress, nodeType);
            return true;
            
        } catch (Exception e) {
            log.error("注册节点失败: {}", nodeAddress, e);
            return false;
        }
    }

    /**
     * 更新节点权限
     * 
     * @param nodeAddress 节点地址
     * @param newPermissions 新权限列表
     * @param operatorAddress 操作者地址
     * @return 是否成功
     */
    public boolean updateNodePermissions(String nodeAddress, Set<String> newPermissions, 
                                       String operatorAddress) {
        try {
            // 验证操作者权限
            if (!hasManagementPermission(operatorAddress)) {
                log.error("操作者没有管理权限: {}", operatorAddress);
                return false;
            }
            
            NodePermission permission = nodePermissions.get(nodeAddress);
            if (permission == null) {
                log.error("节点不存在: {}", nodeAddress);
                return false;
            }
            
            // 记录旧权限
            Set<String> oldPermissions = new HashSet<>(permission.getPermissions());
            
            // 更新权限
            permission.setPermissions(newPermissions);
            permission.setUpdatedAt(LocalDateTime.now());
            permission.setUpdatedBy(operatorAddress);
            
            // 更新缓存
            cacheNodePermission(permission);
            
            // 记录操作历史
            recordPermissionOperation(nodeAddress, "UPDATE_PERMISSIONS", operatorAddress,
                    String.format("Permissions updated from %s to %s", oldPermissions, newPermissions));
            
            log.info("节点权限更新成功: {} -> {}", nodeAddress, newPermissions);
            return true;
            
        } catch (Exception e) {
            log.error("更新节点权限失败: {}", nodeAddress, e);
            return false;
        }
    }

    /**
     * 暂停节点
     * 
     * @param nodeAddress 节点地址
     * @param reason 暂停原因
     * @param operatorAddress 操作者地址
     * @return 是否成功
     */
    public boolean suspendNode(String nodeAddress, String reason, String operatorAddress) {
        try {
            if (!hasManagementPermission(operatorAddress)) {
                log.error("操作者没有管理权限: {}", operatorAddress);
                return false;
            }
            
            NodePermission permission = nodePermissions.get(nodeAddress);
            if (permission == null) {
                log.error("节点不存在: {}", nodeAddress);
                return false;
            }
            
            permission.setStatus("SUSPENDED");
            permission.setSuspendedAt(LocalDateTime.now());
            permission.setSuspendedBy(operatorAddress);
            permission.setSuspendReason(reason);
            
            cacheNodePermission(permission);
            
            recordPermissionOperation(nodeAddress, "SUSPEND", operatorAddress, 
                    "Node suspended: " + reason);
            
            log.info("节点暂停成功: {} -> {}", nodeAddress, reason);
            return true;
            
        } catch (Exception e) {
            log.error("暂停节点失败: {}", nodeAddress, e);
            return false;
        }
    }

    /**
     * 恢复节点
     * 
     * @param nodeAddress 节点地址
     * @param operatorAddress 操作者地址
     * @return 是否成功
     */
    public boolean resumeNode(String nodeAddress, String operatorAddress) {
        try {
            if (!hasManagementPermission(operatorAddress)) {
                log.error("操作者没有管理权限: {}", operatorAddress);
                return false;
            }
            
            NodePermission permission = nodePermissions.get(nodeAddress);
            if (permission == null) {
                log.error("节点不存在: {}", nodeAddress);
                return false;
            }
            
            permission.setStatus("ACTIVE");
            permission.setSuspendedAt(null);
            permission.setSuspendedBy(null);
            permission.setSuspendReason(null);
            permission.setUpdatedAt(LocalDateTime.now());
            permission.setUpdatedBy(operatorAddress);
            
            cacheNodePermission(permission);
            
            recordPermissionOperation(nodeAddress, "RESUME", operatorAddress, 
                    "Node resumed");
            
            log.info("节点恢复成功: {}", nodeAddress);
            return true;
            
        } catch (Exception e) {
            log.error("恢复节点失败: {}", nodeAddress, e);
            return false;
        }
    }

    /**
     * 检查节点权限
     * 
     * @param nodeAddress 节点地址
     * @param requiredPermission 所需权限
     * @return 是否有权限
     */
    public boolean hasPermission(String nodeAddress, String requiredPermission) {
        NodePermission permission = getNodePermission(nodeAddress);
        
        if (permission == null) {
            log.debug("节点不存在: {}", nodeAddress);
            return false;
        }
        
        if (!"ACTIVE".equals(permission.getStatus())) {
            log.debug("节点状态非活跃: {} -> {}", nodeAddress, permission.getStatus());
            return false;
        }
        
        boolean hasPermission = permission.getPermissions().contains(requiredPermission);
        
        if (hasPermission) {
            // 更新最后活跃时间
            permission.setLastActiveAt(LocalDateTime.now());
            cacheNodePermission(permission);
        }
        
        return hasPermission;
    }

    /**
     * 检查是否有管理权限
     * 
     * @param nodeAddress 节点地址
     * @return 是否有管理权限
     */
    public boolean hasManagementPermission(String nodeAddress) {
        NodePermission permission = getNodePermission(nodeAddress);
        return permission != null && 
               "ACTIVE".equals(permission.getStatus()) &&
               permission.getNodeType() == NodeType.MANAGEMENT;
    }

    /**
     * 获取节点权限信息
     * 
     * @param nodeAddress 节点地址
     * @return 节点权限
     */
    public NodePermission getNodePermission(String nodeAddress) {
        // 先从内存缓存获取
        NodePermission permission = nodePermissions.get(nodeAddress);
        if (permission != null) {
            return permission;
        }
        
        // 从Redis缓存获取
        permission = loadNodePermissionFromCache(nodeAddress);
        if (permission != null) {
            nodePermissions.put(nodeAddress, permission);
        }
        
        return permission;
    }

    /**
     * 获取所有节点权限
     * 
     * @return 节点权限列表
     */
    public List<NodePermission> getAllNodePermissions() {
        return new ArrayList<>(nodePermissions.values());
    }

    /**
     * 获取指定类型的节点
     * 
     * @param nodeType 节点类型
     * @return 节点列表
     */
    public List<NodePermission> getNodesByType(NodeType nodeType) {
        return nodePermissions.values().stream()
                .filter(permission -> permission.getNodeType() == nodeType)
                .filter(permission -> "ACTIVE".equals(permission.getStatus()))
                .toList();
    }

    /**
     * 获取权限操作历史
     * 
     * @param nodeAddress 节点地址
     * @return 操作历史
     */
    public List<PermissionOperation> getPermissionHistory(String nodeAddress) {
        return permissionHistory.getOrDefault(nodeAddress, Collections.emptyList());
    }

    /**
     * 获取默认权限
     * 
     * @param nodeType 节点类型
     * @return 默认权限集合
     */
    private Set<String> getDefaultPermissions(NodeType nodeType) {
        Set<String> permissions = new HashSet<>();
        
        switch (nodeType) {
            case MANAGEMENT:
                // 管理节点：可以向底层区块链中写入数据，更新数据，为用户节点分配权限
                permissions.addAll(Arrays.asList(
                        "WRITE_DATA", "UPDATE_DATA", "READ_DATA", "QUERY_DATA",
                        "MANAGE_PERMISSIONS", "REGISTER_NODES", "SUSPEND_NODES",
                        "APPROVE_TRANSACTIONS", "MANAGE_CERTIFICATES"
                ));
                break;
                
            case USER:
                // 用户节点：只参与交易享受服务，而不参与底层数据的更新记录
                // 但可以查看链上记录的数据，并读取相应的交易记录
                permissions.addAll(Arrays.asList(
                        "READ_DATA", "QUERY_DATA", "SUBMIT_TRANSACTIONS",
                        "VIEW_CERTIFICATES", "REQUEST_SERVICES"
                ));
                break;
                
            case PRIVATE:
                // 私有节点：拥有创建节点，修改自己所拥有节点的相关底层数据，更新数据等权利
                // 但不参与全部底层数据的记录更新
                permissions.addAll(Arrays.asList(
                        "READ_DATA", "QUERY_DATA", "WRITE_OWN_DATA", "UPDATE_OWN_DATA",
                        "CREATE_NODES", "MANAGE_OWN_NODES", "SUBMIT_TRANSACTIONS"
                ));
                break;
        }
        
        return permissions;
    }

    /**
     * 缓存节点权限
     * 
     * @param permission 节点权限
     */
    private void cacheNodePermission(NodePermission permission) {
        try {
            String key = "node_permission:" + permission.getNodeAddress();
            redisTemplate.opsForValue().set(key, permission, 24, TimeUnit.HOURS);
        } catch (Exception e) {
            log.error("缓存节点权限失败: {}", permission.getNodeAddress(), e);
        }
    }

    /**
     * 从缓存加载节点权限
     * 
     * @param nodeAddress 节点地址
     * @return 节点权限
     */
    private NodePermission loadNodePermissionFromCache(String nodeAddress) {
        try {
            String key = "node_permission:" + nodeAddress;
            return (NodePermission) redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("从缓存加载节点权限失败: {}", nodeAddress, e);
            return null;
        }
    }

    /**
     * 记录权限操作历史
     * 
     * @param nodeAddress 节点地址
     * @param operation 操作类型
     * @param operatorAddress 操作者地址
     * @param description 操作描述
     */
    private void recordPermissionOperation(String nodeAddress, String operation, 
                                         String operatorAddress, String description) {
        PermissionOperation op = PermissionOperation.builder()
                .nodeAddress(nodeAddress)
                .operation(operation)
                .operatorAddress(operatorAddress)
                .description(description)
                .timestamp(LocalDateTime.now())
                .build();
        
        permissionHistory.computeIfAbsent(nodeAddress, k -> new ArrayList<>()).add(op);
        
        // 限制历史记录数量
        List<PermissionOperation> history = permissionHistory.get(nodeAddress);
        if (history.size() > 100) {
            history.remove(0);
        }
    }

    /**
     * 权限操作记录
     */
    public static class PermissionOperation {
        private String nodeAddress;
        private String operation;
        private String operatorAddress;
        private String description;
        private LocalDateTime timestamp;
        
        public static PermissionOperationBuilder builder() {
            return new PermissionOperationBuilder();
        }
        
        // Builder pattern implementation
        public static class PermissionOperationBuilder {
            private String nodeAddress;
            private String operation;
            private String operatorAddress;
            private String description;
            private LocalDateTime timestamp;
            
            public PermissionOperationBuilder nodeAddress(String nodeAddress) {
                this.nodeAddress = nodeAddress;
                return this;
            }
            
            public PermissionOperationBuilder operation(String operation) {
                this.operation = operation;
                return this;
            }
            
            public PermissionOperationBuilder operatorAddress(String operatorAddress) {
                this.operatorAddress = operatorAddress;
                return this;
            }
            
            public PermissionOperationBuilder description(String description) {
                this.description = description;
                return this;
            }
            
            public PermissionOperationBuilder timestamp(LocalDateTime timestamp) {
                this.timestamp = timestamp;
                return this;
            }
            
            public PermissionOperation build() {
                PermissionOperation op = new PermissionOperation();
                op.nodeAddress = this.nodeAddress;
                op.operation = this.operation;
                op.operatorAddress = this.operatorAddress;
                op.description = this.description;
                op.timestamp = this.timestamp;
                return op;
            }
        }
        
        // Getters
        public String getNodeAddress() { return nodeAddress; }
        public String getOperation() { return operation; }
        public String getOperatorAddress() { return operatorAddress; }
        public String getDescription() { return description; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
