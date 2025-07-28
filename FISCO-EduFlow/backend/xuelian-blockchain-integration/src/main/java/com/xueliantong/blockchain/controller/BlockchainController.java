package com.xueliantong.blockchain.controller;

import com.xueliantong.blockchain.model.CrossChainMessage;
import com.xueliantong.blockchain.model.StateChannel;
import com.xueliantong.blockchain.model.StateChannelParticipant;
import com.xueliantong.blockchain.service.ContractService;
import com.xueliantong.blockchain.service.CrossChainService;
import com.xueliantong.blockchain.service.StateChannelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.math.BigInteger;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * 区块链集成控制器
 * 提供区块链相关的REST API接口
 * 
 * @author XueLianTong Team
 */
@Slf4j
@RestController
@RequestMapping("/api/blockchain")
@RequiredArgsConstructor
public class BlockchainController {

    private final ContractService contractService;
    private final CrossChainService crossChainService;
    private final StateChannelService stateChannelService;

    /**
     * 部署智能合约
     */
    @PostMapping("/contracts/deploy")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> deployContract(
            @RequestBody @Valid DeployContractRequest request) {
        
        log.info("部署智能合约请求: {}", request.getContractName());
        
        return contractService.deployContract(
                request.getContractName(),
                request.getAbi(),
                request.getBin(),
                request.getConstructorParams()
        ).thenApply(contractAddress -> {
            Map<String, Object> response = Map.of(
                    "success", true,
                    "contractAddress", contractAddress,
                    "contractName", request.getContractName(),
                    "deployedAt", System.currentTimeMillis()
            );
            return ResponseEntity.ok(response);
        }).exceptionally(throwable -> {
            log.error("部署合约失败: {}", request.getContractName(), throwable);
            Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "error", throwable.getMessage()
            );
            return ResponseEntity.badRequest().body(errorResponse);
        });
    }

    /**
     * 调用智能合约方法
     */
    @PostMapping("/contracts/call")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> callContract(
            @RequestBody @Valid CallContractRequest request) {
        
        log.info("调用合约方法: {} -> {}", request.getContractAddress(), request.getMethodName());
        
        if (request.isReadOnly()) {
            // 只读调用
            return contractService.call(
                    request.getContractAddress(),
                    request.getAbi(),
                    request.getMethodName(),
                    request.getParams()
            ).thenApply(callResponse -> {
                Map<String, Object> response = Map.of(
                        "success", callResponse.isStatusOK(),
                        "result", callResponse.getReturnObject(),
                        "message", callResponse.getReturnMessage()
                );
                return ResponseEntity.ok(response);
            });
        } else {
            // 写入调用
            return contractService.sendTransaction(
                    request.getContractAddress(),
                    request.getAbi(),
                    request.getMethodName(),
                    request.getParams()
            ).thenApply(receipt -> {
                Map<String, Object> response = Map.of(
                        "success", receipt.isStatusOK(),
                        "transactionHash", receipt.getTransactionHash(),
                        "blockNumber", receipt.getBlockNumber(),
                        "gasUsed", receipt.getGasUsed()
                );
                return ResponseEntity.ok(response);
            });
        }
    }

    /**
     * 发送跨链消息
     */
    @PostMapping("/cross-chain/send")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> sendCrossChainMessage(
            @RequestBody @Valid CrossChainMessageRequest request) {
        
        log.info("发送跨链消息: {} -> {}", request.getSourceChain(), request.getTargetChain());
        
        return crossChainService.sendCrossChainMessage(
                request.getSourceChain(),
                request.getTargetChain(),
                request.getMessageType(),
                request.getPayload()
        ).thenApply(txId -> {
            Map<String, Object> response = Map.of(
                    "success", true,
                    "crossChainTxId", txId,
                    "sourceChain", request.getSourceChain(),
                    "targetChain", request.getTargetChain()
            );
            return ResponseEntity.ok(response);
        }).exceptionally(throwable -> {
            log.error("发送跨链消息失败", throwable);
            Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "error", throwable.getMessage()
            );
            return ResponseEntity.badRequest().body(errorResponse);
        });
    }

    /**
     * 查询跨链交易状态
     */
    @GetMapping("/cross-chain/transaction/{txId}")
    public ResponseEntity<Map<String, Object>> getCrossChainTransaction(@PathVariable String txId) {
        var transaction = crossChainService.getCrossChainTransaction(txId);
        
        if (transaction == null) {
            return ResponseEntity.notFound().build();
        }
        
        Map<String, Object> response = Map.of(
                "txId", transaction.getId(),
                "sourceChain", transaction.getSourceChain(),
                "targetChain", transaction.getTargetChain(),
                "status", transaction.getStatus(),
                "createdAt", transaction.getCreatedAt(),
                "updatedAt", transaction.getUpdatedAt()
        );
        
        return ResponseEntity.ok(response);
    }

    /**
     * 创建状态通道
     */
    @PostMapping("/state-channels/create")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> createStateChannel(
            @RequestBody @Valid CreateChannelRequest request) {
        
        log.info("创建状态通道请求，参与者数量: {}", request.getParticipants().size());
        
        return stateChannelService.createStateChannel(
                request.getParticipants(),
                request.getInitialDeposit(),
                request.getTimeout(),
                request.getMetadata()
        ).thenApply(channelId -> {
            Map<String, Object> response = Map.of(
                    "success", true,
                    "channelId", channelId,
                    "participantCount", request.getParticipants().size(),
                    "deposit", request.getInitialDeposit().toString()
            );
            return ResponseEntity.ok(response);
        }).exceptionally(throwable -> {
            log.error("创建状态通道失败", throwable);
            Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "error", throwable.getMessage()
            );
            return ResponseEntity.badRequest().body(errorResponse);
        });
    }

    /**
     * 加入状态通道
     */
    @PostMapping("/state-channels/{channelId}/join")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> joinStateChannel(
            @PathVariable String channelId,
            @RequestBody @Valid JoinChannelRequest request) {
        
        log.info("加入状态通道: {} -> {}", request.getParticipantAddress(), channelId);
        
        return stateChannelService.joinStateChannel(
                channelId,
                request.getParticipantAddress(),
                request.getSignature()
        ).thenApply(success -> {
            Map<String, Object> response = Map.of(
                    "success", success,
                    "channelId", channelId,
                    "participant", request.getParticipantAddress()
            );
            return ResponseEntity.ok(response);
        });
    }

    /**
     * 更新通道状态
     */
    @PostMapping("/state-channels/{channelId}/update")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> updateChannelState(
            @PathVariable String channelId,
            @RequestBody @Valid UpdateChannelStateRequest request) {
        
        log.info("更新通道状态: {}", channelId);
        
        return stateChannelService.updateChannelState(
                channelId,
                request.getNewState(),
                request.getSignatures()
        ).thenApply(success -> {
            Map<String, Object> response = Map.of(
                    "success", success,
                    "channelId", channelId,
                    "signatureCount", request.getSignatures().size()
            );
            return ResponseEntity.ok(response);
        });
    }

    /**
     * 发送通道消息
     */
    @PostMapping("/state-channels/{channelId}/message")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> sendChannelMessage(
            @PathVariable String channelId,
            @RequestBody @Valid SendChannelMessageRequest request) {
        
        log.info("发送通道消息: {} -> {}", channelId, request.getMessageType());
        
        return stateChannelService.sendChannelMessage(
                channelId,
                request.getFromAddress(),
                request.getMessageType(),
                request.getPayload(),
                request.getSignature()
        ).thenApply(messageId -> {
            Map<String, Object> response = Map.of(
                    "success", true,
                    "messageId", messageId,
                    "channelId", channelId,
                    "messageType", request.getMessageType()
            );
            return ResponseEntity.ok(response);
        }).exceptionally(throwable -> {
            log.error("发送通道消息失败", throwable);
            Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "error", throwable.getMessage()
            );
            return ResponseEntity.badRequest().body(errorResponse);
        });
    }

    /**
     * 关闭状态通道
     */
    @PostMapping("/state-channels/{channelId}/close")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> closeStateChannel(
            @PathVariable String channelId,
            @RequestBody @Valid CloseChannelRequest request) {
        
        log.info("关闭状态通道: {}", channelId);
        
        return stateChannelService.closeStateChannel(
                channelId,
                request.getFinalState(),
                request.getSignatures()
        ).thenApply(success -> {
            Map<String, Object> response = Map.of(
                    "success", success,
                    "channelId", channelId,
                    "closed", true
            );
            return ResponseEntity.ok(response);
        });
    }

    /**
     * 获取状态通道信息
     */
    @GetMapping("/state-channels/{channelId}")
    public ResponseEntity<StateChannel> getStateChannel(@PathVariable String channelId) {
        StateChannel channel = stateChannelService.getChannel(channelId);
        
        if (channel == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(channel);
    }

    /**
     * 获取通道消息历史
     */
    @GetMapping("/state-channels/{channelId}/messages")
    public ResponseEntity<List<Object>> getChannelMessages(@PathVariable String channelId) {
        var messages = stateChannelService.getChannelMessages(channelId);
        return ResponseEntity.ok(List.of(messages.toArray()));
    }

    /**
     * 获取区块链网络状态
     */
    @GetMapping("/network/status")
    public ResponseEntity<Map<String, Object>> getNetworkStatus() {
        // 这里应该实现获取网络状态的逻辑
        Map<String, Object> status = Map.of(
                "mainChain", Map.of(
                        "connected", true,
                        "blockHeight", 12345,
                        "nodeCount", 4
                ),
                "sideChains", Map.of(
                        "education-chain", Map.of(
                                "connected", true,
                                "blockHeight", 8901
                        ),
                        "employment-chain", Map.of(
                                "connected", true,
                                "blockHeight", 7654
                        )
                ),
                "crossChain", Map.of(
                        "enabled", true,
                        "pendingMessages", 5
                ),
                "stateChannels", Map.of(
                        "activeChannels", 23,
                        "totalChannels", 156
                )
        );
        
        return ResponseEntity.ok(status);
    }

    // 请求DTO类
    public static class DeployContractRequest {
        private String contractName;
        private String abi;
        private String bin;
        private List<Object> constructorParams;
        
        // getters and setters
        public String getContractName() { return contractName; }
        public void setContractName(String contractName) { this.contractName = contractName; }
        public String getAbi() { return abi; }
        public void setAbi(String abi) { this.abi = abi; }
        public String getBin() { return bin; }
        public void setBin(String bin) { this.bin = bin; }
        public List<Object> getConstructorParams() { return constructorParams; }
        public void setConstructorParams(List<Object> constructorParams) { this.constructorParams = constructorParams; }
    }

    public static class CallContractRequest {
        private String contractAddress;
        private String abi;
        private String methodName;
        private List<Object> params;
        private boolean readOnly;
        
        // getters and setters
        public String getContractAddress() { return contractAddress; }
        public void setContractAddress(String contractAddress) { this.contractAddress = contractAddress; }
        public String getAbi() { return abi; }
        public void setAbi(String abi) { this.abi = abi; }
        public String getMethodName() { return methodName; }
        public void setMethodName(String methodName) { this.methodName = methodName; }
        public List<Object> getParams() { return params; }
        public void setParams(List<Object> params) { this.params = params; }
        public boolean isReadOnly() { return readOnly; }
        public void setReadOnly(boolean readOnly) { this.readOnly = readOnly; }
    }

    public static class CrossChainMessageRequest {
        private String sourceChain;
        private String targetChain;
        private String messageType;
        private Object payload;
        
        // getters and setters
        public String getSourceChain() { return sourceChain; }
        public void setSourceChain(String sourceChain) { this.sourceChain = sourceChain; }
        public String getTargetChain() { return targetChain; }
        public void setTargetChain(String targetChain) { this.targetChain = targetChain; }
        public String getMessageType() { return messageType; }
        public void setMessageType(String messageType) { this.messageType = messageType; }
        public Object getPayload() { return payload; }
        public void setPayload(Object payload) { this.payload = payload; }
    }

    public static class CreateChannelRequest {
        private List<StateChannelParticipant> participants;
        private BigInteger initialDeposit;
        private Long timeout;
        private Map<String, Object> metadata;
        
        // getters and setters
        public List<StateChannelParticipant> getParticipants() { return participants; }
        public void setParticipants(List<StateChannelParticipant> participants) { this.participants = participants; }
        public BigInteger getInitialDeposit() { return initialDeposit; }
        public void setInitialDeposit(BigInteger initialDeposit) { this.initialDeposit = initialDeposit; }
        public Long getTimeout() { return timeout; }
        public void setTimeout(Long timeout) { this.timeout = timeout; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    public static class JoinChannelRequest {
        private String participantAddress;
        private String signature;
        
        // getters and setters
        public String getParticipantAddress() { return participantAddress; }
        public void setParticipantAddress(String participantAddress) { this.participantAddress = participantAddress; }
        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }
    }

    public static class UpdateChannelStateRequest {
        private Map<String, Object> newState;
        private Map<String, String> signatures;
        
        // getters and setters
        public Map<String, Object> getNewState() { return newState; }
        public void setNewState(Map<String, Object> newState) { this.newState = newState; }
        public Map<String, String> getSignatures() { return signatures; }
        public void setSignatures(Map<String, String> signatures) { this.signatures = signatures; }
    }

    public static class SendChannelMessageRequest {
        private String fromAddress;
        private String messageType;
        private Object payload;
        private String signature;
        
        // getters and setters
        public String getFromAddress() { return fromAddress; }
        public void setFromAddress(String fromAddress) { this.fromAddress = fromAddress; }
        public String getMessageType() { return messageType; }
        public void setMessageType(String messageType) { this.messageType = messageType; }
        public Object getPayload() { return payload; }
        public void setPayload(Object payload) { this.payload = payload; }
        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }
    }

    public static class CloseChannelRequest {
        private Map<String, Object> finalState;
        private Map<String, String> signatures;
        
        // getters and setters
        public Map<String, Object> getFinalState() { return finalState; }
        public void setFinalState(Map<String, Object> finalState) { this.finalState = finalState; }
        public Map<String, String> getSignatures() { return signatures; }
        public void setSignatures(Map<String, String> signatures) { this.signatures = signatures; }
    }
}
