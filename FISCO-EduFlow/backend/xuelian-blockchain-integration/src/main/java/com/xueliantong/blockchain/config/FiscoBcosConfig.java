package com.xueliantong.blockchain.config;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.fisco.bcos.sdk.BcosSDK;
import org.fisco.bcos.sdk.client.Client;
import org.fisco.bcos.sdk.config.ConfigOption;
import org.fisco.bcos.sdk.config.model.ConfigProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.annotation.PreDestroy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FISCO BCOS 区块链配置
 * 
 * @author XueLianTong Team
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "fisco")
public class FiscoBcosConfig {

    private MainChain mainChain;
    private Map<String, SideChain> sideChains = new HashMap<>();
    private CrossChain crossChain;
    private StateChannels stateChannels;
    private Privacy privacy;
    private Consensus consensus;
    private Monitoring monitoring;

    private BcosSDK bcosSDK;
    private Map<String, Client> clients = new HashMap<>();

    /**
     * 主链配置
     */
    @Bean
    @Primary
    public Client mainChainClient() {
        try {
            ConfigProperty configProperty = buildConfigProperty(mainChain);
            ConfigOption configOption = new ConfigOption(configProperty);
            
            this.bcosSDK = new BcosSDK(configOption);
            Client client = bcosSDK.getClient(mainChain.getGroupId());
            
            clients.put("main", client);
            log.info("主链客户端初始化成功，GroupId: {}", mainChain.getGroupId());
            
            return client;
        } catch (Exception e) {
            log.error("主链客户端初始化失败", e);
            throw new RuntimeException("Failed to initialize main chain client", e);
        }
    }

    /**
     * 侧链客户端配置
     */
    @Bean
    public Map<String, Client> sideChainClients() {
        Map<String, Client> sideClients = new HashMap<>();
        
        for (Map.Entry<String, SideChain> entry : sideChains.entrySet()) {
            String chainName = entry.getKey();
            SideChain sideChain = entry.getValue();
            
            try {
                ConfigProperty configProperty = buildSideChainConfigProperty(sideChain);
                ConfigOption configOption = new ConfigOption(configProperty);
                
                BcosSDK sideChainSDK = new BcosSDK(configOption);
                Client client = sideChainSDK.getClient(sideChain.getGroupId());
                
                sideClients.put(chainName, client);
                clients.put(chainName, client);
                
                log.info("侧链客户端初始化成功，ChainName: {}, GroupId: {}", 
                        chainName, sideChain.getGroupId());
            } catch (Exception e) {
                log.error("侧链客户端初始化失败，ChainName: {}", chainName, e);
            }
        }
        
        return sideClients;
    }

    /**
     * 构建主链配置属性
     */
    private ConfigProperty buildConfigProperty(MainChain mainChain) {
        ConfigProperty configProperty = new ConfigProperty();
        
        // 网络配置
        Map<String, Object> network = new HashMap<>();
        network.put("peers", mainChain.getNodeList());
        configProperty.setNetwork(network);
        
        // 账户配置
        Map<String, Object> account = new HashMap<>();
        account.put("keyStoreDir", "account");
        account.put("accountAddress", "");
        account.put("accountFileFormat", "pem");
        account.put("password", "");
        configProperty.setAccount(account);
        
        // 线程池配置
        Map<String, Object> threadPool = new HashMap<>();
        threadPool.put("channelProcessorThreadSize", 16);
        threadPool.put("receiptProcessorThreadSize", 16);
        threadPool.put("maxBlockingQueueCapacity", 102400);
        configProperty.setThreadPool(threadPool);
        
        // 证书配置
        if (mainChain.getCertPath() != null) {
            Map<String, Object> cryptoMaterial = new HashMap<>();
            cryptoMaterial.put("certPath", mainChain.getCertPath());
            cryptoMaterial.put("caCert", mainChain.getCaCert());
            cryptoMaterial.put("sslCert", mainChain.getSdkCert());
            cryptoMaterial.put("sslKey", mainChain.getSdkKey());
            configProperty.setCryptoMaterial(cryptoMaterial);
        }
        
        return configProperty;
    }

    /**
     * 构建侧链配置属性
     */
    private ConfigProperty buildSideChainConfigProperty(SideChain sideChain) {
        ConfigProperty configProperty = new ConfigProperty();
        
        // 网络配置
        Map<String, Object> network = new HashMap<>();
        network.put("peers", sideChain.getNodeList());
        configProperty.setNetwork(network);
        
        // 账户配置
        Map<String, Object> account = new HashMap<>();
        account.put("keyStoreDir", "account");
        account.put("accountAddress", "");
        account.put("accountFileFormat", "pem");
        account.put("password", "");
        configProperty.setAccount(account);
        
        return configProperty;
    }

    /**
     * 获取指定链的客户端
     */
    public Client getClient(String chainName) {
        if ("main".equals(chainName) || chainName == null) {
            return clients.get("main");
        }
        return clients.get(chainName);
    }

    /**
     * 资源清理
     */
    @PreDestroy
    public void destroy() {
        if (bcosSDK != null) {
            bcosSDK.stop();
            log.info("FISCO BCOS SDK 已停止");
        }
        
        clients.clear();
        log.info("区块链客户端连接已清理");
    }

    // 内部配置类
    @Data
    public static class MainChain {
        private Integer groupId;
        private Integer chainId;
        private List<String> nodeList;
        private String certPath;
        private String caCert;
        private String sdkCert;
        private String sdkKey;
        private Integer connectTimeout;
        private Integer socketTimeout;
        private Integer connectionPoolSize;
        private Map<String, ContractConfig> contracts = new HashMap<>();
    }

    @Data
    public static class SideChain {
        private Integer groupId;
        private Integer chainId;
        private List<String> nodeList;
        private Map<String, ContractConfig> contracts = new HashMap<>();
    }

    @Data
    public static class ContractConfig {
        private String address;
        private String abiPath;
        private String binPath;
    }

    @Data
    public static class CrossChain {
        private Boolean enabled;
        private ContractConfig routerContract;
        private MessageQueue messageQueue;
    }

    @Data
    public static class MessageQueue {
        private Integer maxSize;
        private Integer batchSize;
        private Integer timeout;
    }

    @Data
    public static class StateChannels {
        private Boolean enabled;
        private ContractConfig factoryContract;
        private ChannelConfig channelConfig;
        private ContractConfig disputeResolver;
    }

    @Data
    public static class ChannelConfig {
        private Long defaultTimeout;
        private Integer maxParticipants;
        private String minDeposit;
    }

    @Data
    public static class Privacy {
        private Zkp zkp;
        private Homomorphic homomorphic;
    }

    @Data
    public static class Zkp {
        private Boolean enabled;
        private String circuitPath;
        private String provingKeyPath;
        private String verificationKeyPath;
    }

    @Data
    public static class Homomorphic {
        private Boolean enabled;
        private Integer keySize;
        private Integer securityLevel;
    }

    @Data
    public static class Consensus {
        private Pbft pbft;
        private Vrf vrf;
    }

    @Data
    public static class Pbft {
        private Integer viewTimeout;
        private Integer requestTimeout;
        private Integer blockGenerationTime;
    }

    @Data
    public static class Vrf {
        private Boolean enabled;
        private Double threshold;
    }

    @Data
    public static class Monitoring {
        private Boolean enabled;
        private List<String> metrics;
        private Alert alert;
    }

    @Data
    public static class Alert {
        private String email;
        private String webhook;
    }
}
