package com.xueliantong.blockchain.actuator;

import com.xueliantong.blockchain.config.FiscoBcosConfig;
import com.xueliantong.blockchain.service.ContractService;
import com.xueliantong.blockchain.service.CrossChainService;
import com.xueliantong.blockchain.service.NodePermissionService;
import com.xueliantong.blockchain.service.StateChannelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.fisco.bcos.sdk.client.Client;
import org.springframework.boot.actuator.health.Health;
import org.springframework.boot.actuator.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 区块链健康检查指示器
 * 
 * @author XueLianTong Team
 */
@Slf4j
@Component("blockchain")
@RequiredArgsConstructor
public class BlockchainHealthIndicator implements HealthIndicator {

    private final FiscoBcosConfig fiscoBcosConfig;
    private final ContractService contractService;
    private final CrossChainService crossChainService;
    private final NodePermissionService nodePermissionService;
    private final StateChannelService stateChannelService;

    @Override
    public Health health() {
        try {
            Map<String, Object> details = new HashMap<>();
            boolean overallHealthy = true;

            // 检查主链状态
            boolean mainChainHealthy = checkMainChainHealth(details);
            overallHealthy &= mainChainHealthy;

            // 检查侧链状态
            boolean sideChainsHealthy = checkSideChainsHealth(details);
            overallHealthy &= sideChainsHealthy;

            // 检查跨链服务状态
            boolean crossChainHealthy = checkCrossChainHealth(details);
            overallHealthy &= crossChainHealthy;

            // 检查状态通道服务状态
            boolean stateChannelsHealthy = checkStateChannelsHealth(details);
            overallHealthy &= stateChannelsHealthy;

            // 检查节点权限服务状态
            boolean nodePermissionsHealthy = checkNodePermissionsHealth(details);
            overallHealthy &= nodePermissionsHealthy;

            // 检查智能合约状态
            boolean contractsHealthy = checkContractsHealth(details);
            overallHealthy &= contractsHealthy;

            if (overallHealthy) {
                return Health.up().withDetails(details).build();
            } else {
                return Health.down().withDetails(details).build();
            }

        } catch (Exception e) {
            log.error("区块链健康检查失败", e);
            return Health.down()
                    .withException(e)
                    .withDetail("error", "Health check failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * 检查主链健康状态
     */
    private boolean checkMainChainHealth(Map<String, Object> details) {
        try {
            Client mainClient = fiscoBcosConfig.getClient("main");
            if (mainClient == null) {
                details.put("mainChain", Map.of(
                        "status", "DOWN",
                        "error", "Main chain client not available"
                ));
                return false;
            }

            // 获取区块高度
            long blockNumber = mainClient.getBlockNumber().getBlockNumber().longValue();
            
            // 获取节点信息
            var nodeInfo = mainClient.getNodeInfo();
            
            // 检查连接的节点数量
            var peers = mainClient.getPeers();
            int peerCount = peers.getPeers().size();

            details.put("mainChain", Map.of(
                    "status", "UP",
                    "blockNumber", blockNumber,
                    "nodeId", nodeInfo.getNodeId(),
                    "peerCount", peerCount,
                    "groupId", fiscoBcosConfig.getMainChain().getGroupId()
            ));

            return true;

        } catch (Exception e) {
            log.error("主链健康检查失败", e);
            details.put("mainChain", Map.of(
                    "status", "DOWN",
                    "error", e.getMessage()
            ));
            return false;
        }
    }

    /**
     * 检查侧链健康状态
     */
    private boolean checkSideChainsHealth(Map<String, Object> details) {
        Map<String, Object> sideChainsStatus = new HashMap<>();
        boolean allHealthy = true;

        for (Map.Entry<String, FiscoBcosConfig.SideChain> entry : 
             fiscoBcosConfig.getSideChains().entrySet()) {
            
            String chainName = entry.getKey();
            FiscoBcosConfig.SideChain sideChain = entry.getValue();

            try {
                Client sideClient = fiscoBcosConfig.getClient(chainName);
                if (sideClient == null) {
                    sideChainsStatus.put(chainName, Map.of(
                            "status", "DOWN",
                            "error", "Side chain client not available"
                    ));
                    allHealthy = false;
                    continue;
                }

                long blockNumber = sideClient.getBlockNumber().getBlockNumber().longValue();
                var peers = sideClient.getPeers();

                sideChainsStatus.put(chainName, Map.of(
                        "status", "UP",
                        "blockNumber", blockNumber,
                        "peerCount", peers.getPeers().size(),
                        "groupId", sideChain.getGroupId()
                ));

            } catch (Exception e) {
                log.error("侧链健康检查失败: {}", chainName, e);
                sideChainsStatus.put(chainName, Map.of(
                        "status", "DOWN",
                        "error", e.getMessage()
                ));
                allHealthy = false;
            }
        }

        details.put("sideChains", sideChainsStatus);
        return allHealthy;
    }

    /**
     * 检查跨链服务健康状态
     */
    private boolean checkCrossChainHealth(Map<String, Object> details) {
        try {
            // 获取待处理的跨链消息数量
            var pendingMessages = crossChainService.getPendingMessages("main");
            int pendingCount = pendingMessages.size();

            // 检查跨链服务是否正常工作
            boolean serviceHealthy = pendingCount < 100; // 假设超过100条待处理消息表示异常

            details.put("crossChain", Map.of(
                    "status", serviceHealthy ? "UP" : "WARNING",
                    "pendingMessages", pendingCount,
                    "enabled", fiscoBcosConfig.getCrossChain().getEnabled()
            ));

            return serviceHealthy;

        } catch (Exception e) {
            log.error("跨链服务健康检查失败", e);
            details.put("crossChain", Map.of(
                    "status", "DOWN",
                    "error", e.getMessage()
            ));
            return false;
        }
    }

    /**
     * 检查状态通道服务健康状态
     */
    private boolean checkStateChannelsHealth(Map<String, Object> details) {
        try {
            // 这里应该实现状态通道的健康检查逻辑
            // 由于StateChannelService没有提供统计方法，我们简化实现
            
            boolean enabled = fiscoBcosConfig.getStateChannels().getEnabled();
            
            details.put("stateChannels", Map.of(
                    "status", enabled ? "UP" : "DISABLED",
                    "enabled", enabled,
                    "factoryContract", fiscoBcosConfig.getStateChannels().getFactoryContract() != null
            ));

            return true;

        } catch (Exception e) {
            log.error("状态通道服务健康检查失败", e);
            details.put("stateChannels", Map.of(
                    "status", "DOWN",
                    "error", e.getMessage()
            ));
            return false;
        }
    }

    /**
     * 检查节点权限服务健康状态
     */
    private boolean checkNodePermissionsHealth(Map<String, Object> details) {
        try {
            var allNodes = nodePermissionService.getAllNodePermissions();
            long activeNodes = allNodes.stream()
                    .filter(node -> "ACTIVE".equals(node.getStatus()))
                    .count();

            details.put("nodePermissions", Map.of(
                    "status", "UP",
                    "totalNodes", allNodes.size(),
                    "activeNodes", activeNodes,
                    "managementNodes", nodePermissionService.getNodesByType(
                            com.xueliantong.blockchain.model.NodeType.MANAGEMENT).size(),
                    "userNodes", nodePermissionService.getNodesByType(
                            com.xueliantong.blockchain.model.NodeType.USER).size(),
                    "privateNodes", nodePermissionService.getNodesByType(
                            com.xueliantong.blockchain.model.NodeType.PRIVATE).size()
            ));

            return true;

        } catch (Exception e) {
            log.error("节点权限服务健康检查失败", e);
            details.put("nodePermissions", Map.of(
                    "status", "DOWN",
                    "error", e.getMessage()
            ));
            return false;
        }
    }

    /**
     * 检查智能合约健康状态
     */
    private boolean checkContractsHealth(Map<String, Object> details) {
        Map<String, Object> contractsStatus = new HashMap<>();
        boolean allHealthy = true;

        try {
            // 检查主链合约
            var mainChainContracts = fiscoBcosConfig.getMainChain().getContracts();
            for (Map.Entry<String, FiscoBcosConfig.ContractConfig> entry : mainChainContracts.entrySet()) {
                String contractName = entry.getKey();
                FiscoBcosConfig.ContractConfig config = entry.getValue();

                boolean exists = contractService.contractExists(config.getAddress());
                contractsStatus.put("main." + contractName, Map.of(
                        "status", exists ? "UP" : "DOWN",
                        "address", config.getAddress(),
                        "exists", exists
                ));

                if (!exists) {
                    allHealthy = false;
                }
            }

            // 检查侧链合约
            for (Map.Entry<String, FiscoBcosConfig.SideChain> chainEntry : 
                 fiscoBcosConfig.getSideChains().entrySet()) {
                
                String chainName = chainEntry.getKey();
                var sideChainContracts = chainEntry.getValue().getContracts();

                for (Map.Entry<String, FiscoBcosConfig.ContractConfig> contractEntry : 
                     sideChainContracts.entrySet()) {
                    
                    String contractName = contractEntry.getKey();
                    FiscoBcosConfig.ContractConfig config = contractEntry.getValue();

                    boolean exists = contractService.contractExists(config.getAddress());
                    contractsStatus.put(chainName + "." + contractName, Map.of(
                            "status", exists ? "UP" : "DOWN",
                            "address", config.getAddress(),
                            "exists", exists
                    ));

                    if (!exists) {
                        allHealthy = false;
                    }
                }
            }

            details.put("contracts", contractsStatus);
            return allHealthy;

        } catch (Exception e) {
            log.error("智能合约健康检查失败", e);
            details.put("contracts", Map.of(
                    "status", "DOWN",
                    "error", e.getMessage()
            ));
            return false;
        }
    }
}
