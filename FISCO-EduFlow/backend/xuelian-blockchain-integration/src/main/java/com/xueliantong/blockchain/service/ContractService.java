package com.xueliantong.blockchain.service;

import com.xueliantong.blockchain.config.FiscoBcosConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.fisco.bcos.sdk.abi.ABICodec;
import org.fisco.bcos.sdk.abi.ABICodecException;
import org.fisco.bcos.sdk.client.Client;
import org.fisco.bcos.sdk.crypto.keypair.CryptoKeyPair;
import org.fisco.bcos.sdk.model.TransactionReceipt;
import org.fisco.bcos.sdk.transaction.manager.AssembleTransactionProcessor;
import org.fisco.bcos.sdk.transaction.manager.TransactionProcessorFactory;
import org.fisco.bcos.sdk.transaction.model.dto.CallResponse;
import org.fisco.bcos.sdk.transaction.model.dto.TransactionResponse;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.math.BigInteger;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * 智能合约服务
 * 提供统一的智能合约调用接口
 * 
 * @author XueLianTong Team
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final FiscoBcosConfig fiscoBcosConfig;
    private final CryptoKeyPair cryptoKeyPair;
    
    private AssembleTransactionProcessor transactionProcessor;
    private ABICodec abiCodec;

    @PostConstruct
    public void init() {
        Client client = fiscoBcosConfig.getClient("main");
        this.transactionProcessor = TransactionProcessorFactory
                .createAssembleTransactionProcessor(client, cryptoKeyPair);
        this.abiCodec = new ABICodec(client.getCryptoSuite());
        
        log.info("智能合约服务初始化完成");
    }

    /**
     * 部署智能合约
     * 
     * @param contractName 合约名称
     * @param abi 合约ABI
     * @param bin 合约字节码
     * @param constructorParams 构造函数参数
     * @return 合约地址
     */
    public CompletableFuture<String> deployContract(String contractName, String abi, 
                                                   String bin, List<Object> constructorParams) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("开始部署合约: {}", contractName);
                
                TransactionResponse response = transactionProcessor.deployAndGetResponse(
                        abi, bin, constructorParams);
                
                if (response.getTransactionReceipt().isStatusOK()) {
                    String contractAddress = response.getContractAddress();
                    log.info("合约部署成功: {} -> {}", contractName, contractAddress);
                    return contractAddress;
                } else {
                    String errorMsg = "合约部署失败: " + response.getTransactionReceipt().getStatus();
                    log.error(errorMsg);
                    throw new RuntimeException(errorMsg);
                }
            } catch (Exception e) {
                log.error("合约部署异常: {}", contractName, e);
                throw new RuntimeException("Contract deployment failed", e);
            }
        });
    }

    /**
     * 调用智能合约方法（写操作）
     * 
     * @param contractAddress 合约地址
     * @param abi 合约ABI
     * @param methodName 方法名
     * @param params 参数列表
     * @return 交易回执
     */
    public CompletableFuture<TransactionReceipt> sendTransaction(String contractAddress, 
                                                               String abi, String methodName, 
                                                               List<Object> params) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.debug("发送交易: {} -> {}", contractAddress, methodName);
                
                TransactionResponse response = transactionProcessor.sendTransactionAndGetResponse(
                        contractAddress, abi, methodName, params);
                
                TransactionReceipt receipt = response.getTransactionReceipt();
                
                if (receipt.isStatusOK()) {
                    log.debug("交易成功: {}", receipt.getTransactionHash());
                } else {
                    log.error("交易失败: {} -> {}", receipt.getTransactionHash(), receipt.getStatus());
                }
                
                return receipt;
            } catch (Exception e) {
                log.error("发送交易异常: {} -> {}", contractAddress, methodName, e);
                throw new RuntimeException("Transaction failed", e);
            }
        });
    }

    /**
     * 调用智能合约方法（读操作）
     * 
     * @param contractAddress 合约地址
     * @param abi 合约ABI
     * @param methodName 方法名
     * @param params 参数列表
     * @return 调用结果
     */
    public CompletableFuture<CallResponse> call(String contractAddress, String abi, 
                                              String methodName, List<Object> params) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.debug("调用合约方法: {} -> {}", contractAddress, methodName);
                
                CallResponse response = transactionProcessor.sendCall(
                        contractAddress, abi, methodName, params);
                
                log.debug("调用结果: {}", response.getReturnMessage());
                return response;
            } catch (Exception e) {
                log.error("调用合约方法异常: {} -> {}", contractAddress, methodName, e);
                throw new RuntimeException("Contract call failed", e);
            }
        });
    }

    /**
     * 批量调用智能合约方法
     * 
     * @param calls 批量调用请求
     * @return 批量调用结果
     */
    public CompletableFuture<List<TransactionReceipt>> batchSendTransaction(
            List<BatchCallRequest> calls) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("开始批量交易，数量: {}", calls.size());
                
                return calls.parallelStream()
                        .map(call -> sendTransaction(call.getContractAddress(), 
                                call.getAbi(), call.getMethodName(), call.getParams())
                                .join())
                        .toList();
            } catch (Exception e) {
                log.error("批量交易异常", e);
                throw new RuntimeException("Batch transaction failed", e);
            }
        });
    }

    /**
     * 解析交易回执中的事件日志
     * 
     * @param receipt 交易回执
     * @param abi 合约ABI
     * @param eventName 事件名称
     * @return 解析后的事件数据
     */
    public List<Object> parseEventLogs(TransactionReceipt receipt, String abi, String eventName) {
        try {
            return abiCodec.decodeEvent(abi, eventName, receipt.getLogs());
        } catch (ABICodecException e) {
            log.error("解析事件日志失败: {}", eventName, e);
            throw new RuntimeException("Failed to parse event logs", e);
        }
    }

    /**
     * 获取合约存储数据
     * 
     * @param contractAddress 合约地址
     * @param position 存储位置
     * @return 存储数据
     */
    public String getStorageAt(String contractAddress, BigInteger position) {
        try {
            Client client = fiscoBcosConfig.getClient("main");
            return client.getStorageAt(contractAddress, position.toString(), 
                    client.getBlockNumber().getBlockNumber());
        } catch (Exception e) {
            log.error("获取合约存储数据失败: {} -> {}", contractAddress, position, e);
            throw new RuntimeException("Failed to get storage", e);
        }
    }

    /**
     * 获取合约代码
     * 
     * @param contractAddress 合约地址
     * @return 合约代码
     */
    public String getCode(String contractAddress) {
        try {
            Client client = fiscoBcosConfig.getClient("main");
            return client.getCode(contractAddress).getCode();
        } catch (Exception e) {
            log.error("获取合约代码失败: {}", contractAddress, e);
            throw new RuntimeException("Failed to get contract code", e);
        }
    }

    /**
     * 估算Gas消耗
     * 
     * @param contractAddress 合约地址
     * @param abi 合约ABI
     * @param methodName 方法名
     * @param params 参数列表
     * @return Gas估算值
     */
    public BigInteger estimateGas(String contractAddress, String abi, 
                                 String methodName, List<Object> params) {
        try {
            // FISCO BCOS 3.0+ 不使用Gas机制，返回固定值
            return BigInteger.valueOf(300000);
        } catch (Exception e) {
            log.error("估算Gas失败: {} -> {}", contractAddress, methodName, e);
            throw new RuntimeException("Failed to estimate gas", e);
        }
    }

    /**
     * 检查合约是否存在
     * 
     * @param contractAddress 合约地址
     * @return 是否存在
     */
    public boolean contractExists(String contractAddress) {
        try {
            String code = getCode(contractAddress);
            return code != null && !code.equals("0x");
        } catch (Exception e) {
            log.warn("检查合约存在性失败: {}", contractAddress, e);
            return false;
        }
    }

    /**
     * 批量调用请求
     */
    public static class BatchCallRequest {
        private String contractAddress;
        private String abi;
        private String methodName;
        private List<Object> params;

        // 构造函数、getter和setter
        public BatchCallRequest(String contractAddress, String abi, 
                              String methodName, List<Object> params) {
            this.contractAddress = contractAddress;
            this.abi = abi;
            this.methodName = methodName;
            this.params = params;
        }

        public String getContractAddress() { return contractAddress; }
        public String getAbi() { return abi; }
        public String getMethodName() { return methodName; }
        public List<Object> getParams() { return params; }
    }
}
