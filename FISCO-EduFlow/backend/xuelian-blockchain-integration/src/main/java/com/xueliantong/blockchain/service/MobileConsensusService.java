package com.xueliantong.blockchain.service;

import com.xueliantong.blockchain.config.FiscoBcosConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.fisco.bcos.sdk.client.Client;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * 基于移动设备的高吞吐量共识协议服务
 * 
 * 在本系统中采用一种基于移动设备的高吞吐量共识协议，仅需智能手机即可参与区块验证和共识
 * 鼓励大量参与者参与区块的产生
 * 
 * 两种类型的节点：
 * 1. 普通节点：可以在智能手机上运行，通过智能手机上可用的可信硬件（TEE）认证参与者身份
 *    强制每个TEE在区块链上最多具有一个活动身份，数量大，资源有限，仅在区块链中参与投票共识
 * 2. 超级节点：在服务器上运行，数量少，主要进行存储等资源消耗量大的工作
 *    存储账本和密钥值数据库，普通节点根据需要从超级节点获取这些数据
 * 
 * @author XueLianTong Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MobileConsensusService {

    private final FiscoBcosConfig fiscoBcosConfig;

    /**
     * 注册普通节点
     * 通过智能手机上可用的可信硬件（TEE）认证参与者身份
     * 
     * @param teeId TEE身份标识
     * @param deviceInfo 设备信息
     * @param attestationData TEE认证数据
     * @return 是否成功
     */
    public CompletableFuture<Boolean> registerOrdinaryNode(
            String teeId, String deviceInfo, byte[] attestationData) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("注册普通节点 - TEE ID: {}, 设备信息: {}", teeId, deviceInfo);
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "registerOrdinaryNode",
                        Arrays.asList(teeId, deviceInfo, attestationData)
                );
                
                boolean success = result != null;
                
                if (success) {
                    log.info("普通节点注册成功 - TEE ID: {}", teeId);
                } else {
                    log.error("普通节点注册失败 - TEE ID: {}", teeId);
                }
                
                return success;
                
            } catch (Exception e) {
                log.error("普通节点注册异常 - TEE ID: {}", teeId, e);
                return false;
            }
        });
    }

    /**
     * 注册超级节点
     * 在服务器上运行，主要进行存储等资源消耗量大的工作
     * 
     * @param serverInfo 服务器信息
     * @param storageCapacity 存储容量
     * @param bandwidth 带宽
     * @param supportedChains 支持的链
     * @return 是否成功
     */
    public CompletableFuture<Boolean> registerSuperNode(
            String serverInfo, long storageCapacity, long bandwidth, List<String> supportedChains) {
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("注册超级节点 - 服务器信息: {}, 存储容量: {}, 带宽: {}", 
                        serverInfo, storageCapacity, bandwidth);
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "registerSuperNode",
                        Arrays.asList(serverInfo, BigInteger.valueOf(storageCapacity), 
                                     BigInteger.valueOf(bandwidth), supportedChains)
                );
                
                boolean success = result != null;
                
                if (success) {
                    log.info("超级节点注册成功 - 服务器信息: {}", serverInfo);
                } else {
                    log.error("超级节点注册失败 - 服务器信息: {}", serverInfo);
                }
                
                return success;
                
            } catch (Exception e) {
                log.error("超级节点注册异常 - 服务器信息: {}", serverInfo, e);
                return false;
            }
        });
    }

    /**
     * 提议新区块
     * 
     * @param blockNumber 区块号
     * @param blockHash 区块哈希
     * @return 是否成功
     */
    public CompletableFuture<Boolean> proposeBlock(long blockNumber, String blockHash) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("提议新区块 - 区块号: {}, 区块哈希: {}", blockNumber, blockHash);
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "proposeBlock",
                        Arrays.asList(BigInteger.valueOf(blockNumber), blockHash)
                );
                
                boolean success = result != null;
                
                if (success) {
                    log.info("区块提议成功 - 区块号: {}", blockNumber);
                } else {
                    log.error("区块提议失败 - 区块号: {}", blockNumber);
                }
                
                return success;
                
            } catch (Exception e) {
                log.error("区块提议异常 - 区块号: {}", blockNumber, e);
                return false;
            }
        });
    }

    /**
     * 普通节点投票
     * 普通节点仅在区块链中参与投票共识
     * 
     * @param roundNumber 轮次号
     * @param isApproval 是否赞成
     * @param signature 投票签名
     * @return 是否成功
     */
    public CompletableFuture<Boolean> castVote(long roundNumber, boolean isApproval, byte[] signature) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("普通节点投票 - 轮次: {}, 投票: {}", roundNumber, isApproval ? "赞成" : "反对");
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "castVote",
                        Arrays.asList(BigInteger.valueOf(roundNumber), isApproval, signature)
                );
                
                boolean success = result != null;
                
                if (success) {
                    log.info("投票成功 - 轮次: {}", roundNumber);
                } else {
                    log.error("投票失败 - 轮次: {}", roundNumber);
                }
                
                return success;
                
            } catch (Exception e) {
                log.error("投票异常 - 轮次: {}", roundNumber, e);
                return false;
            }
        });
    }

    /**
     * 获取共识轮次信息
     * 
     * @param roundNumber 轮次号
     * @return 轮次信息
     */
    public CompletableFuture<Map<String, Object>> getConsensusRound(long roundNumber) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("获取共识轮次信息 - 轮次: {}", roundNumber);
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "getConsensusRound",
                        Arrays.asList(BigInteger.valueOf(roundNumber))
                );
                
                if (result != null && result.size() > 0) {
                    Map<String, Object> roundInfo = parseConsensusRound(result);
                    
                    log.info("成功获取共识轮次信息 - 轮次: {}", roundNumber);
                    return roundInfo;
                } else {
                    log.error("获取共识轮次信息失败 - 轮次: {}", roundNumber);
                    return Collections.emptyMap();
                }
                
            } catch (Exception e) {
                log.error("获取共识轮次信息异常 - 轮次: {}", roundNumber, e);
                return Collections.emptyMap();
            }
        });
    }

    /**
     * 获取节点投票记录
     * 
     * @param roundNumber 轮次号
     * @param nodeAddress 节点地址
     * @return 投票记录
     */
    public CompletableFuture<Map<String, Object>> getNodeVote(long roundNumber, String nodeAddress) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("获取节点投票记录 - 轮次: {}, 节点: {}", roundNumber, nodeAddress);
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "getNodeVote",
                        Arrays.asList(BigInteger.valueOf(roundNumber), nodeAddress)
                );
                
                if (result != null && result.size() > 0) {
                    Map<String, Object> voteInfo = parseNodeVote(result);
                    
                    log.info("成功获取节点投票记录 - 轮次: {}, 节点: {}", roundNumber, nodeAddress);
                    return voteInfo;
                } else {
                    log.info("节点未投票 - 轮次: {}, 节点: {}", roundNumber, nodeAddress);
                    return Collections.emptyMap();
                }
                
            } catch (Exception e) {
                log.error("获取节点投票记录异常 - 轮次: {}, 节点: {}", roundNumber, nodeAddress, e);
                return Collections.emptyMap();
            }
        });
    }

    /**
     * 获取活跃普通节点数量
     * 
     * @return 活跃普通节点数量
     */
    public CompletableFuture<Integer> getActiveOrdinaryNodeCount() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("获取活跃普通节点数量");
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "getActiveOrdinaryNodeCount",
                        Collections.emptyList()
                );
                
                if (result != null && result.size() > 0) {
                    BigInteger count = (BigInteger) result.get(0);
                    int nodeCount = count.intValue();
                    
                    log.info("活跃普通节点数量: {}", nodeCount);
                    return nodeCount;
                } else {
                    log.error("获取活跃普通节点数量失败");
                    return 0;
                }
                
            } catch (Exception e) {
                log.error("获取活跃普通节点数量异常", e);
                return 0;
            }
        });
    }

    /**
     * 获取活跃超级节点数量
     * 
     * @return 活跃超级节点数量
     */
    public CompletableFuture<Integer> getActiveSuperNodeCount() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("获取活跃超级节点数量");
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "getActiveSuperNodeCount",
                        Collections.emptyList()
                );
                
                if (result != null && result.size() > 0) {
                    BigInteger count = (BigInteger) result.get(0);
                    int nodeCount = count.intValue();
                    
                    log.info("活跃超级节点数量: {}", nodeCount);
                    return nodeCount;
                } else {
                    log.error("获取活跃超级节点数量失败");
                    return 0;
                }
                
            } catch (Exception e) {
                log.error("获取活跃超级节点数量异常", e);
                return 0;
            }
        });
    }

    /**
     * 获取网络统计信息
     * 
     * @return 网络统计信息
     */
    public CompletableFuture<Map<String, Object>> getNetworkStats() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("获取网络统计信息");
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "getNetworkStats",
                        Collections.emptyList()
                );
                
                if (result != null && result.size() >= 6) {
                    Map<String, Object> stats = new HashMap<>();
                    stats.put("totalOrdinaryNodes", ((BigInteger) result.get(0)).intValue());
                    stats.put("activeOrdinaryNodes", ((BigInteger) result.get(1)).intValue());
                    stats.put("totalSuperNodes", ((BigInteger) result.get(2)).intValue());
                    stats.put("activeSuperNodes", ((BigInteger) result.get(3)).intValue());
                    stats.put("currentRoundNumber", ((BigInteger) result.get(4)).longValue());
                    stats.put("totalRounds", ((BigInteger) result.get(5)).longValue());
                    
                    log.info("成功获取网络统计信息: {}", stats);
                    return stats;
                } else {
                    log.error("获取网络统计信息失败");
                    return Collections.emptyMap();
                }
                
            } catch (Exception e) {
                log.error("获取网络统计信息异常", e);
                return Collections.emptyMap();
            }
        });
    }

    /**
     * 审核超级节点
     * 
     * @param nodeAddress 节点地址
     * @param approved 是否批准
     * @return 是否成功
     */
    public CompletableFuture<Boolean> approveSuperNode(String nodeAddress, boolean approved) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("审核超级节点 - 节点地址: {}, 审核结果: {}", nodeAddress, approved);
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "approveSuperNode",
                        Arrays.asList(nodeAddress, approved)
                );
                
                boolean success = result != null;
                
                if (success) {
                    log.info("超级节点审核成功 - 节点地址: {}, 结果: {}", nodeAddress, approved);
                } else {
                    log.error("超级节点审核失败 - 节点地址: {}", nodeAddress);
                }
                
                return success;
                
            } catch (Exception e) {
                log.error("超级节点审核异常 - 节点地址: {}", nodeAddress, e);
                return false;
            }
        });
    }

    /**
     * 更新共识参数
     * 
     * @param newThreshold 新的共识阈值
     * @param newRoundDuration 新的轮次持续时间
     * @return 是否成功
     */
    public CompletableFuture<Boolean> updateConsensusParams(int newThreshold, long newRoundDuration) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("更新共识参数 - 阈值: {}, 轮次时长: {}", newThreshold, newRoundDuration);
                
                Client client = fiscoBcosConfig.getClient("main");
                String contractAddress = fiscoBcosConfig.getMainChain()
                        .getContracts().get("MobileConsensusContract").getAddress();
                
                var result = callContractMethod(
                        client,
                        contractAddress,
                        "updateConsensusParams",
                        Arrays.asList(BigInteger.valueOf(newThreshold), BigInteger.valueOf(newRoundDuration))
                );
                
                boolean success = result != null;
                
                if (success) {
                    log.info("共识参数更新成功");
                } else {
                    log.error("共识参数更新失败");
                }
                
                return success;
                
            } catch (Exception e) {
                log.error("共识参数更新异常", e);
                return false;
            }
        });
    }

    // ========== 私有辅助方法 ==========

    /**
     * 调用智能合约方法
     */
    private List<Object> callContractMethod(
            Client client, String contractAddress, String methodName, List<Object> params) {
        
        try {
            log.debug("调用移动共识合约方法: 地址={}, 方法={}, 参数={}", contractAddress, methodName, params);
            
            // 模拟合约调用结果
            switch (methodName) {
                case "registerOrdinaryNode":
                case "registerSuperNode":
                case "proposeBlock":
                case "castVote":
                case "approveSuperNode":
                case "updateConsensusParams":
                    return Arrays.asList("success");
                case "getConsensusRound":
                    return createMockConsensusRound();
                case "getNodeVote":
                    return createMockNodeVote();
                case "getActiveOrdinaryNodeCount":
                    return Arrays.asList(BigInteger.valueOf(2847));
                case "getActiveSuperNodeCount":
                    return Arrays.asList(BigInteger.valueOf(47));
                case "getNetworkStats":
                    return Arrays.asList(
                            BigInteger.valueOf(3294),  // totalOrdinaryNodes
                            BigInteger.valueOf(2847),  // activeOrdinaryNodes
                            BigInteger.valueOf(58),    // totalSuperNodes
                            BigInteger.valueOf(47),    // activeSuperNodes
                            BigInteger.valueOf(7429),  // currentRoundNumber
                            BigInteger.valueOf(7429)   // totalRounds
                    );
                default:
                    return Collections.emptyList();
            }
            
        } catch (Exception e) {
            log.error("调用移动共识合约方法失败: 方法={}", methodName, e);
            throw new RuntimeException("Contract call failed", e);
        }
    }

    /**
     * 创建模拟共识轮次信息
     */
    private List<Object> createMockConsensusRound() {
        return Arrays.asList(
                BigInteger.valueOf(7429),                    // roundNumber
                BigInteger.valueOf(58392),                   // blockNumber
                "0x8f7e6d5c4b3a2918e7d6c5b4a3928f7e6d5c4b3a", // proposedBlockHash
                "0x2a9b8c7d6e5f4a3b9c8d7e6f5a4b3c9d8e7f6a5b", // proposer
                BigInteger.valueOf(System.currentTimeMillis() / 1000), // startTime
                BigInteger.valueOf(System.currentTimeMillis() / 1000 + 30), // endTime
                BigInteger.valueOf(2847),                    // totalVotes
                BigInteger.valueOf(1923),                    // approvalVotes
                true,                                        // isFinalized
                true                                         // isApproved
        );
    }

    /**
     * 创建模拟节点投票信息
     */
    private List<Object> createMockNodeVote() {
        return Arrays.asList(
                BigInteger.valueOf(58392),                   // blockNumber
                "0x8f7e6d5c4b3a2918e7d6c5b4a3928f7e6d5c4b3a", // blockHash
                "0x2a9b8c7d6e5f4a3b9c8d7e6f5a4b3c9d8e7f6a5b", // voter
                true,                                        // isApproval
                BigInteger.valueOf(System.currentTimeMillis() / 1000), // timestamp
                "signature_data_7f8e9d2c4b6a1e5f"           // signature
        );
    }

    /**
     * 解析共识轮次信息
     */
    private Map<String, Object> parseConsensusRound(List<Object> result) {
        Map<String, Object> roundInfo = new HashMap<>();
        
        if (result.size() >= 10) {
            roundInfo.put("roundNumber", ((BigInteger) result.get(0)).longValue());
            roundInfo.put("blockNumber", ((BigInteger) result.get(1)).longValue());
            roundInfo.put("proposedBlockHash", result.get(2));
            roundInfo.put("proposer", result.get(3));
            roundInfo.put("startTime", ((BigInteger) result.get(4)).longValue());
            roundInfo.put("endTime", ((BigInteger) result.get(5)).longValue());
            roundInfo.put("totalVotes", ((BigInteger) result.get(6)).intValue());
            roundInfo.put("approvalVotes", ((BigInteger) result.get(7)).intValue());
            roundInfo.put("isFinalized", result.get(8));
            roundInfo.put("isApproved", result.get(9));
        }
        
        return roundInfo;
    }

    /**
     * 解析节点投票信息
     */
    private Map<String, Object> parseNodeVote(List<Object> result) {
        Map<String, Object> voteInfo = new HashMap<>();

        if (result.size() >= 6) {
            voteInfo.put("blockNumber", ((BigInteger) result.get(0)).longValue());
            voteInfo.put("blockHash", result.get(1));
            voteInfo.put("voter", result.get(2));
            voteInfo.put("isApproval", result.get(3));
            voteInfo.put("timestamp", ((BigInteger) result.get(4)).longValue());
            voteInfo.put("signature", result.get(5));
        }

        return voteInfo;
    }
}
