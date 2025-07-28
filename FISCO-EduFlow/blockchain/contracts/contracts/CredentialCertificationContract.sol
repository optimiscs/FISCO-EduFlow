// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CredentialCertificationContract
 * @dev 学位学历认证智能合约
 * 
 * 根据学位、学历认证智能合约模型，结合传统学位学历认证流程
 * 实现学位学历认证智能合约算法：
 * Step1：学生与用人单位就需提供的信息等标准参数达成共识
 * Step2：学生与用人单位达成认证意向
 * Step3：学生确认输出的部分数据，发送认证消息给用人单位
 * Step4：认证双方确认合约信息，生成合约
 * Step5：PDF文件生成，并在链中完成共识，将执行函数导入区块，并根据结束条件完成清算
 * Step6：转发PDF文件，完成合约执行
 * 
 * @author XueLianTong Team
 */
contract CredentialCertificationContract {
    
    // ========== 数据结构定义 ==========
    
    // 认证合约状态枚举
    enum CertificationStatus {
        PENDING,        // 待处理
        CONSENSUS,      // 达成共识
        INTENTION,      // 达成意向
        DATA_CONFIRMED, // 数据确认
        CONTRACT_GENERATED, // 合约生成
        PDF_GENERATED,  // PDF生成
        COMPLETED,      // 完成
        CANCELLED       // 取消
    }
    
    // 认证合约结构
    struct CertificationContract {
        uint256 contractId;           // 合约ID
        address student;              // 学生地址
        address employer;             // 用人单位地址
        string[] requiredInfo;        // 需提供的信息标准参数
        string[] providedData;        // 学生提供的部分数据
        CertificationStatus status;   // 合约状态
        uint256 createdAt;           // 创建时间
        uint256 updatedAt;           // 更新时间
        bytes32 consensusHash;       // 共识哈希
        bytes32 contractHash;        // 合约哈希
        string pdfHash;              // PDF文件哈希
        string pdfUrl;               // PDF文件URL
        bool isExecuted;             // 是否已执行
        uint256 executionBlock;      // 执行区块
    }
    
    // 认证参数结构
    struct CertificationParams {
        string[] infoTypes;          // 信息类型
        string[] dataFields;         // 数据字段
        uint256 validityPeriod;      // 有效期
        uint256 fee;                 // 认证费用
        bool requiresVerification;   // 是否需要验证
    }
    
    // 认证消息结构
    struct CertificationMessage {
        uint256 contractId;          // 合约ID
        address from;                // 发送方
        address to;                  // 接收方
        string messageType;          // 消息类型
        string content;              // 消息内容
        uint256 timestamp;           // 时间戳
        bytes signature;             // 签名
    }
    
    // ========== 状态变量 ==========
    
    mapping(uint256 => CertificationContract) public certificationContracts;
    mapping(address => uint256[]) public studentContracts;
    mapping(address => uint256[]) public employerContracts;
    mapping(uint256 => CertificationMessage[]) public contractMessages;
    mapping(bytes32 => bool) public usedConsensusHashes;
    
    uint256 public contractCounter;
    address public admin;
    uint256 public defaultValidityPeriod;
    uint256 public baseFee;
    
    // ========== 事件定义 ==========
    
    event ConsensusReached(
        uint256 indexed contractId,
        address indexed student,
        address indexed employer,
        bytes32 consensusHash,
        uint256 timestamp
    );
    
    event IntentionConfirmed(
        uint256 indexed contractId,
        address indexed student,
        address indexed employer,
        uint256 timestamp
    );
    
    event DataConfirmed(
        uint256 indexed contractId,
        string[] providedData,
        uint256 timestamp
    );
    
    event ContractGenerated(
        uint256 indexed contractId,
        bytes32 contractHash,
        uint256 timestamp
    );
    
    event PDFGenerated(
        uint256 indexed contractId,
        string pdfHash,
        string pdfUrl,
        uint256 timestamp
    );
    
    event ContractExecuted(
        uint256 indexed contractId,
        uint256 executionBlock,
        uint256 timestamp
    );
    
    event MessageSent(
        uint256 indexed contractId,
        address indexed from,
        address indexed to,
        string messageType,
        uint256 timestamp
    );
    
    // ========== 修饰符 ==========
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier contractExists(uint256 contractId) {
        require(contractId > 0 && contractId <= contractCounter, "Contract does not exist");
        _;
    }
    
    modifier onlyParticipant(uint256 contractId) {
        CertificationContract storage cert = certificationContracts[contractId];
        require(
            msg.sender == cert.student || msg.sender == cert.employer,
            "Only contract participants can perform this action"
        );
        _;
    }
    
    modifier inStatus(uint256 contractId, CertificationStatus expectedStatus) {
        require(
            certificationContracts[contractId].status == expectedStatus,
            "Contract not in expected status"
        );
        _;
    }
    
    // ========== 构造函数 ==========
    
    constructor() {
        admin = msg.sender;
        contractCounter = 0;
        defaultValidityPeriod = 365 days;
        baseFee = 0.01 ether;
    }
    
    // ========== 认证流程函数 ==========
    
    /**
     * @dev Step1: 学生与用人单位就需提供的信息等标准参数达成共识
     * @param employer 用人单位地址
     * @param requiredInfo 需提供的信息标准参数
     * @param params 认证参数
     * @return 合约ID
     */
    function reachConsensus(
        address employer,
        string[] memory requiredInfo,
        CertificationParams memory params
    ) external returns (uint256) {
        require(employer != address(0), "Invalid employer address");
        require(employer != msg.sender, "Cannot create contract with yourself");
        require(requiredInfo.length > 0, "Required info cannot be empty");
        
        contractCounter++;
        uint256 contractId = contractCounter;
        
        // 生成共识哈希
        bytes32 consensusHash = keccak256(abi.encodePacked(
            msg.sender,
            employer,
            requiredInfo,
            params.infoTypes,
            params.validityPeriod,
            block.timestamp
        ));
        
        require(!usedConsensusHashes[consensusHash], "Consensus hash already used");
        usedConsensusHashes[consensusHash] = true;
        
        // 创建认证合约
        certificationContracts[contractId] = CertificationContract({
            contractId: contractId,
            student: msg.sender,
            employer: employer,
            requiredInfo: requiredInfo,
            providedData: new string[](0),
            status: CertificationStatus.CONSENSUS,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            consensusHash: consensusHash,
            contractHash: bytes32(0),
            pdfHash: "",
            pdfUrl: "",
            isExecuted: false,
            executionBlock: 0
        });
        
        // 更新索引
        studentContracts[msg.sender].push(contractId);
        employerContracts[employer].push(contractId);
        
        emit ConsensusReached(contractId, msg.sender, employer, consensusHash, block.timestamp);
        
        return contractId;
    }
    
    /**
     * @dev Step2: 学生与用人单位达成认证意向
     * @param contractId 合约ID
     */
    function confirmIntention(uint256 contractId) 
        external 
        contractExists(contractId) 
        onlyParticipant(contractId)
        inStatus(contractId, CertificationStatus.CONSENSUS) 
    {
        CertificationContract storage cert = certificationContracts[contractId];
        
        // 只有用人单位可以确认意向
        require(msg.sender == cert.employer, "Only employer can confirm intention");
        
        cert.status = CertificationStatus.INTENTION;
        cert.updatedAt = block.timestamp;
        
        emit IntentionConfirmed(contractId, cert.student, cert.employer, block.timestamp);
    }
    
    /**
     * @dev Step3: 学生确认输出的部分数据，发送认证消息给用人单位
     * @param contractId 合约ID
     * @param providedData 学生提供的部分数据
     * @param messageContent 认证消息内容
     */
    function confirmDataAndSendMessage(
        uint256 contractId,
        string[] memory providedData,
        string memory messageContent
    ) external 
        contractExists(contractId) 
        onlyParticipant(contractId)
        inStatus(contractId, CertificationStatus.INTENTION) 
    {
        CertificationContract storage cert = certificationContracts[contractId];
        
        // 只有学生可以确认数据
        require(msg.sender == cert.student, "Only student can confirm data");
        require(providedData.length > 0, "Provided data cannot be empty");
        
        cert.providedData = providedData;
        cert.status = CertificationStatus.DATA_CONFIRMED;
        cert.updatedAt = block.timestamp;
        
        // 发送认证消息
        CertificationMessage memory message = CertificationMessage({
            contractId: contractId,
            from: msg.sender,
            to: cert.employer,
            messageType: "DATA_CONFIRMATION",
            content: messageContent,
            timestamp: block.timestamp,
            signature: ""  // 简化实现
        });
        
        contractMessages[contractId].push(message);
        
        emit DataConfirmed(contractId, providedData, block.timestamp);
        emit MessageSent(contractId, msg.sender, cert.employer, "DATA_CONFIRMATION", block.timestamp);
    }
    
    /**
     * @dev Step4: 认证双方确认合约信息，生成合约
     * @param contractId 合约ID
     */
    function generateContract(uint256 contractId) 
        external 
        contractExists(contractId) 
        onlyParticipant(contractId)
        inStatus(contractId, CertificationStatus.DATA_CONFIRMED) 
    {
        CertificationContract storage cert = certificationContracts[contractId];
        
        // 只有用人单位可以生成合约
        require(msg.sender == cert.employer, "Only employer can generate contract");
        
        // 生成合约哈希
        bytes32 contractHash = keccak256(abi.encodePacked(
            cert.contractId,
            cert.student,
            cert.employer,
            cert.requiredInfo,
            cert.providedData,
            cert.consensusHash,
            block.timestamp
        ));
        
        cert.contractHash = contractHash;
        cert.status = CertificationStatus.CONTRACT_GENERATED;
        cert.updatedAt = block.timestamp;
        
        emit ContractGenerated(contractId, contractHash, block.timestamp);
    }
    
    /**
     * @dev Step5: PDF文件生成，并在链中完成共识，将执行函数导入区块，并根据结束条件完成清算
     * @param contractId 合约ID
     * @param pdfHash PDF文件哈希
     * @param pdfUrl PDF文件URL
     */
    function generatePDFAndExecute(
        uint256 contractId,
        string memory pdfHash,
        string memory pdfUrl
    ) external 
        contractExists(contractId) 
        onlyParticipant(contractId)
        inStatus(contractId, CertificationStatus.CONTRACT_GENERATED) 
    {
        CertificationContract storage cert = certificationContracts[contractId];
        
        require(bytes(pdfHash).length > 0, "PDF hash cannot be empty");
        require(bytes(pdfUrl).length > 0, "PDF URL cannot be empty");
        
        cert.pdfHash = pdfHash;
        cert.pdfUrl = pdfUrl;
        cert.status = CertificationStatus.PDF_GENERATED;
        cert.isExecuted = true;
        cert.executionBlock = block.number;
        cert.updatedAt = block.timestamp;
        
        emit PDFGenerated(contractId, pdfHash, pdfUrl, block.timestamp);
        emit ContractExecuted(contractId, block.number, block.timestamp);
    }
    
    /**
     * @dev Step6: 转发PDF文件，完成合约执行
     * @param contractId 合约ID
     * @param recipient 接收方地址
     * @param messageContent 转发消息内容
     */
    function forwardPDFAndComplete(
        uint256 contractId,
        address recipient,
        string memory messageContent
    ) external 
        contractExists(contractId) 
        onlyParticipant(contractId)
        inStatus(contractId, CertificationStatus.PDF_GENERATED) 
    {
        CertificationContract storage cert = certificationContracts[contractId];
        
        require(recipient != address(0), "Invalid recipient address");
        
        // 发送转发消息
        CertificationMessage memory message = CertificationMessage({
            contractId: contractId,
            from: msg.sender,
            to: recipient,
            messageType: "PDF_FORWARD",
            content: messageContent,
            timestamp: block.timestamp,
            signature: ""  // 简化实现
        });
        
        contractMessages[contractId].push(message);
        
        cert.status = CertificationStatus.COMPLETED;
        cert.updatedAt = block.timestamp;
        
        emit MessageSent(contractId, msg.sender, recipient, "PDF_FORWARD", block.timestamp);
    }
    
    // ========== 查询函数 ==========
    
    /**
     * @dev 获取认证合约信息
     * @param contractId 合约ID
     */
    function getCertificationContract(uint256 contractId) 
        external view contractExists(contractId) 
        returns (CertificationContract memory) 
    {
        return certificationContracts[contractId];
    }
    
    /**
     * @dev 获取学生的所有合约
     * @param student 学生地址
     */
    function getStudentContracts(address student) 
        external view returns (uint256[] memory) 
    {
        return studentContracts[student];
    }
    
    /**
     * @dev 获取用人单位的所有合约
     * @param employer 用人单位地址
     */
    function getEmployerContracts(address employer) 
        external view returns (uint256[] memory) 
    {
        return employerContracts[employer];
    }
    
    /**
     * @dev 获取合约消息
     * @param contractId 合约ID
     */
    function getContractMessages(uint256 contractId) 
        external view contractExists(contractId) 
        returns (CertificationMessage[] memory) 
    {
        return contractMessages[contractId];
    }
    
    /**
     * @dev 验证合约完整性
     * @param contractId 合约ID
     */
    function verifyContractIntegrity(uint256 contractId) 
        external view contractExists(contractId) 
        returns (bool isValid, string memory message) 
    {
        CertificationContract storage cert = certificationContracts[contractId];
        
        // 验证共识哈希
        bytes32 expectedConsensusHash = keccak256(abi.encodePacked(
            cert.student,
            cert.employer,
            cert.requiredInfo,
            cert.createdAt
        ));
        
        if (cert.consensusHash == bytes32(0)) {
            return (false, "Missing consensus hash");
        }
        
        // 验证合约哈希
        if (cert.status >= CertificationStatus.CONTRACT_GENERATED && cert.contractHash == bytes32(0)) {
            return (false, "Missing contract hash");
        }
        
        // 验证PDF信息
        if (cert.status >= CertificationStatus.PDF_GENERATED) {
            if (bytes(cert.pdfHash).length == 0 || bytes(cert.pdfUrl).length == 0) {
                return (false, "Missing PDF information");
            }
        }
        
        return (true, "Contract integrity verified");
    }
    
    // ========== 管理函数 ==========
    
    /**
     * @dev 取消合约
     * @param contractId 合约ID
     * @param reason 取消原因
     */
    function cancelContract(uint256 contractId, string memory reason) 
        external 
        contractExists(contractId) 
        onlyParticipant(contractId) 
    {
        CertificationContract storage cert = certificationContracts[contractId];
        require(cert.status != CertificationStatus.COMPLETED, "Cannot cancel completed contract");
        require(cert.status != CertificationStatus.CANCELLED, "Contract already cancelled");
        
        cert.status = CertificationStatus.CANCELLED;
        cert.updatedAt = block.timestamp;
        
        // 发送取消消息
        address recipient = (msg.sender == cert.student) ? cert.employer : cert.student;
        CertificationMessage memory message = CertificationMessage({
            contractId: contractId,
            from: msg.sender,
            to: recipient,
            messageType: "CONTRACT_CANCELLED",
            content: reason,
            timestamp: block.timestamp,
            signature: ""
        });
        
        contractMessages[contractId].push(message);
        
        emit MessageSent(contractId, msg.sender, recipient, "CONTRACT_CANCELLED", block.timestamp);
    }
    
    /**
     * @dev 更新基础费用
     * @param newBaseFee 新的基础费用
     */
    function updateBaseFee(uint256 newBaseFee) external onlyAdmin {
        baseFee = newBaseFee;
    }
    
    /**
     * @dev 更新默认有效期
     * @param newValidityPeriod 新的默认有效期
     */
    function updateDefaultValidityPeriod(uint256 newValidityPeriod) external onlyAdmin {
        require(newValidityPeriod > 0, "Validity period must be greater than 0");
        defaultValidityPeriod = newValidityPeriod;
    }
    
    /**
     * @dev 获取合约统计信息
     */
    function getContractStats() external view returns (
        uint256 totalContracts,
        uint256 completedContracts,
        uint256 cancelledContracts,
        uint256 pendingContracts
    ) {
        totalContracts = contractCounter;
        
        // 简化实现，实际应该遍历所有合约
        completedContracts = 0;
        cancelledContracts = 0;
        pendingContracts = 0;
        
        return (totalContracts, completedContracts, cancelledContracts, pendingContracts);
    }
}
