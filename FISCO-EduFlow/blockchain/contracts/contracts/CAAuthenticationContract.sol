// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CAAuthenticationContract
 * @dev CA认证管理合约
 * 
 * 通过证书颁发机构（CA, Certificate Authority），即颁发数字证书的机构进行管理和操作
 * CA是负责发放和管理数字证书的权威机构，并作为电子商务交易中受信任的第三方
 * 承担公钥体系中公钥的合法性检验的责任
 * 
 * 系统采用CA认证进行：
 * 1. 第三方节点认证：加入系统的节点较多，难以保证节点的官方性，为防止节点作恶，
 *    我们采用CA认证对第三方节点进行认证管理
 * 2. 电子学历全流程管理证书认证：考虑到目前电子证书的认证存在诸多问题，
 *    我们采用CA认证与区块链的"数字签名"结合，进行电子证书的验证和认证行为，
 *    防止电子层面的造假，提高防伪性
 * 
 * @author XueLianTong Team
 */
contract CAAuthenticationContract {
    
    // ========== 数据结构定义 ==========
    
    // 证书状态枚举
    enum CertificateStatus {
        PENDING,    // 待审核
        ACTIVE,     // 有效
        REVOKED,    // 已撤销
        EXPIRED     // 已过期
    }
    
    // 节点认证类型枚举
    enum NodeAuthType {
        EDUCATION_INSTITUTION,  // 教育机构
        GOVERNMENT_AGENCY,      // 政府机构
        ENTERPRISE,            // 企业
        THIRD_PARTY_SERVICE    // 第三方服务
    }
    
    // CA节点结构
    struct CANode {
        address nodeAddress;        // 节点地址
        string organizationName;    // 机构名称
        string certificateInfo;     // 证书信息
        bytes32 publicKeyHash;      // 公钥哈希
        uint256 registeredAt;       // 注册时间
        uint256 lastActiveAt;       // 最后活跃时间
        bool isActive;              // 是否活跃
        uint256 endorsementCount;   // 背书次数
        string[] supportedServices; // 支持的服务
    }
    
    // 数字证书结构
    struct DigitalCertificate {
        uint256 certificateId;      // 证书ID
        address issuer;             // 颁发者
        address subject;            // 证书主体
        string subjectName;         // 主体名称
        NodeAuthType authType;      // 认证类型
        bytes32 publicKeyHash;      // 公钥哈希
        uint256 issuedAt;          // 颁发时间
        uint256 expiresAt;         // 过期时间
        CertificateStatus status;   // 证书状态
        string certificateData;     // 证书数据
        bytes digitalSignature;     // 数字签名
        string[] permissions;       // 权限列表
    }
    
    // 超级节点申请结构
    struct SuperNodeApplication {
        uint256 applicationId;      // 申请ID
        address applicant;          // 申请者
        string organizationName;    // 机构名称
        string serverInfo;          // 服务器信息
        uint256 storageCapacity;    // 存储容量
        string[] requiredInfo;      // 所需基本信息
        bytes32 applicationHash;    // 申请哈希
        uint256 submittedAt;        // 提交时间
        bool isApproved;            // 是否批准
        uint256 processedAt;        // 处理时间
        address[] endorsers;        // 背书节点
        mapping(address => bool) endorsements; // 背书记录
    }
    
    // 背书策略结构
    struct EndorsementPolicy {
        uint256 minEndorsements;    // 最小背书数
        uint256 endorsementTimeout; // 背书超时时间
        address[] requiredEndorsers; // 必需背书者
        bool requiresUnanimous;     // 是否需要一致同意
    }
    
    // 电子证书认证结构
    struct ElectronicCertAuth {
        uint256 authId;             // 认证ID
        string certificateType;     // 证书类型（学历、学位等）
        string studentId;           // 学生ID
        string institutionId;       // 机构ID
        bytes32 certificateHash;    // 证书哈希
        bytes blockchainSignature;  // 区块链数字签名
        bytes caSignature;          // CA签名
        uint256 authenticatedAt;    // 认证时间
        bool isVerified;            // 是否已验证
        address verifier;           // 验证者
    }
    
    // ========== 状态变量 ==========
    
    mapping(address => CANode) public caNodes;
    mapping(uint256 => DigitalCertificate) public certificates;
    mapping(uint256 => SuperNodeApplication) public superNodeApplications;
    mapping(uint256 => ElectronicCertAuth) public electronicCertAuths;
    mapping(address => uint256[]) public nodeCertificates;
    mapping(string => uint256) public certTypeToAuthId;
    
    address[] public caNodeList;
    uint256 public certificateCounter;
    uint256 public applicationCounter;
    uint256 public authCounter;
    
    address public rootCA;
    EndorsementPolicy public endorsementPolicy;
    uint256 public certificateValidityPeriod;
    uint256 public applicationFee;
    
    // ========== 事件定义 ==========
    
    event CANodeRegistered(
        address indexed nodeAddress,
        string organizationName,
        uint256 timestamp
    );
    
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed issuer,
        address indexed subject,
        NodeAuthType authType,
        uint256 expiresAt
    );
    
    event CertificateRevoked(
        uint256 indexed certificateId,
        address indexed revoker,
        string reason,
        uint256 timestamp
    );
    
    event SuperNodeApplicationSubmitted(
        uint256 indexed applicationId,
        address indexed applicant,
        string organizationName,
        uint256 timestamp
    );
    
    event ApplicationEndorsed(
        uint256 indexed applicationId,
        address indexed endorser,
        uint256 timestamp
    );
    
    event ApplicationProcessed(
        uint256 indexed applicationId,
        bool approved,
        uint256 timestamp
    );
    
    event ElectronicCertAuthenticated(
        uint256 indexed authId,
        string certificateType,
        string studentId,
        address indexed verifier,
        uint256 timestamp
    );
    
    // ========== 修饰符 ==========
    
    modifier onlyRootCA() {
        require(msg.sender == rootCA, "Only root CA can perform this action");
        _;
    }
    
    modifier onlyActiveCANode() {
        require(caNodes[msg.sender].isActive, "Only active CA nodes can perform this action");
        _;
    }
    
    modifier certificateExists(uint256 certificateId) {
        require(certificateId > 0 && certificateId <= certificateCounter, "Certificate does not exist");
        _;
    }
    
    modifier applicationExists(uint256 applicationId) {
        require(applicationId > 0 && applicationId <= applicationCounter, "Application does not exist");
        _;
    }
    
    // ========== 构造函数 ==========
    
    constructor() {
        rootCA = msg.sender;
        certificateCounter = 0;
        applicationCounter = 0;
        authCounter = 0;
        certificateValidityPeriod = 365 days;
        applicationFee = 0.1 ether;
        
        // 设置默认背书策略
        endorsementPolicy = EndorsementPolicy({
            minEndorsements: 3,
            endorsementTimeout: 7 days,
            requiredEndorsers: new address[](0),
            requiresUnanimous: false
        });
        
        // 注册根CA节点
        caNodes[msg.sender] = CANode({
            nodeAddress: msg.sender,
            organizationName: "Root Certificate Authority",
            certificateInfo: "Root CA Certificate",
            publicKeyHash: keccak256(abi.encodePacked(msg.sender, block.timestamp)),
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp,
            isActive: true,
            endorsementCount: 0,
            supportedServices: new string[](0)
        });
        
        caNodeList.push(msg.sender);
    }
    
    // ========== CA节点管理 ==========
    
    /**
     * @dev 注册CA节点
     * @param organizationName 机构名称
     * @param certificateInfo 证书信息
     * @param publicKeyHash 公钥哈希
     * @param supportedServices 支持的服务
     */
    function registerCANode(
        string memory organizationName,
        string memory certificateInfo,
        bytes32 publicKeyHash,
        string[] memory supportedServices
    ) external {
        require(bytes(organizationName).length > 0, "Organization name cannot be empty");
        require(publicKeyHash != bytes32(0), "Invalid public key hash");
        require(caNodes[msg.sender].nodeAddress == address(0), "CA node already registered");
        
        caNodes[msg.sender] = CANode({
            nodeAddress: msg.sender,
            organizationName: organizationName,
            certificateInfo: certificateInfo,
            publicKeyHash: publicKeyHash,
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp,
            isActive: false, // 需要根CA激活
            endorsementCount: 0,
            supportedServices: supportedServices
        });
        
        caNodeList.push(msg.sender);
        
        emit CANodeRegistered(msg.sender, organizationName, block.timestamp);
    }
    
    /**
     * @dev 激活CA节点
     * @param nodeAddress 节点地址
     */
    function activateCANode(address nodeAddress) external onlyRootCA {
        require(caNodes[nodeAddress].nodeAddress != address(0), "CA node not found");
        require(!caNodes[nodeAddress].isActive, "CA node already active");
        
        caNodes[nodeAddress].isActive = true;
        caNodes[nodeAddress].lastActiveAt = block.timestamp;
    }
    
    // ========== 数字证书管理 ==========
    
    /**
     * @dev 颁发数字证书
     * @param subject 证书主体
     * @param subjectName 主体名称
     * @param authType 认证类型
     * @param publicKeyHash 公钥哈希
     * @param certificateData 证书数据
     * @param permissions 权限列表
     */
    function issueCertificate(
        address subject,
        string memory subjectName,
        NodeAuthType authType,
        bytes32 publicKeyHash,
        string memory certificateData,
        string[] memory permissions
    ) external onlyActiveCANode returns (uint256) {
        require(subject != address(0), "Invalid subject address");
        require(bytes(subjectName).length > 0, "Subject name cannot be empty");
        require(publicKeyHash != bytes32(0), "Invalid public key hash");
        
        certificateCounter++;
        uint256 certificateId = certificateCounter;
        
        // 生成数字签名
        bytes memory digitalSignature = generateDigitalSignature(
            certificateId,
            subject,
            authType,
            publicKeyHash,
            certificateData
        );
        
        certificates[certificateId] = DigitalCertificate({
            certificateId: certificateId,
            issuer: msg.sender,
            subject: subject,
            subjectName: subjectName,
            authType: authType,
            publicKeyHash: publicKeyHash,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + certificateValidityPeriod,
            status: CertificateStatus.ACTIVE,
            certificateData: certificateData,
            digitalSignature: digitalSignature,
            permissions: permissions
        });
        
        nodeCertificates[subject].push(certificateId);
        
        emit CertificateIssued(
            certificateId,
            msg.sender,
            subject,
            authType,
            block.timestamp + certificateValidityPeriod
        );
        
        return certificateId;
    }
    
    /**
     * @dev 撤销证书
     * @param certificateId 证书ID
     * @param reason 撤销原因
     */
    function revokeCertificate(
        uint256 certificateId,
        string memory reason
    ) external certificateExists(certificateId) {
        DigitalCertificate storage cert = certificates[certificateId];
        require(
            msg.sender == cert.issuer || msg.sender == rootCA,
            "Only issuer or root CA can revoke certificate"
        );
        require(cert.status == CertificateStatus.ACTIVE, "Certificate not active");
        
        cert.status = CertificateStatus.REVOKED;
        
        emit CertificateRevoked(certificateId, msg.sender, reason, block.timestamp);
    }
    
    // ========== 超级节点申请流程 ==========
    
    /**
     * @dev 提交超级节点申请
     * 超级节点的申请者提出申请，提供超级节点认证的所需的基本信息
     * @param organizationName 机构名称
     * @param serverInfo 服务器信息
     * @param storageCapacity 存储容量
     * @param requiredInfo 所需基本信息
     */
    function submitSuperNodeApplication(
        string memory organizationName,
        string memory serverInfo,
        uint256 storageCapacity,
        string[] memory requiredInfo
    ) external payable returns (uint256) {
        require(msg.value >= applicationFee, "Insufficient application fee");
        require(bytes(organizationName).length > 0, "Organization name cannot be empty");
        require(storageCapacity > 0, "Storage capacity must be greater than 0");
        
        applicationCounter++;
        uint256 applicationId = applicationCounter;
        
        // 生成申请哈希
        bytes32 applicationHash = keccak256(abi.encodePacked(
            applicationId,
            msg.sender,
            organizationName,
            serverInfo,
            storageCapacity,
            block.timestamp
        ));
        
        SuperNodeApplication storage application = superNodeApplications[applicationId];
        application.applicationId = applicationId;
        application.applicant = msg.sender;
        application.organizationName = organizationName;
        application.serverInfo = serverInfo;
        application.storageCapacity = storageCapacity;
        application.requiredInfo = requiredInfo;
        application.applicationHash = applicationHash;
        application.submittedAt = block.timestamp;
        application.isApproved = false;
        application.processedAt = 0;
        
        emit SuperNodeApplicationSubmitted(
            applicationId,
            msg.sender,
            organizationName,
            block.timestamp
        );
        
        return applicationId;
    }
    
    /**
     * @dev CA节点背书申请
     * 客户端会把请求提交给智能合约，智能合约会这个请求发给所有的CA节点
     * @param applicationId 申请ID
     */
    function endorseApplication(uint256 applicationId) 
        external 
        onlyActiveCANode 
        applicationExists(applicationId) 
    {
        SuperNodeApplication storage application = superNodeApplications[applicationId];
        require(!application.isApproved, "Application already processed");
        require(
            block.timestamp <= application.submittedAt + endorsementPolicy.endorsementTimeout,
            "Endorsement period expired"
        );
        require(!application.endorsements[msg.sender], "Already endorsed");
        
        application.endorsements[msg.sender] = true;
        application.endorsers.push(msg.sender);
        
        // 更新CA节点背书计数
        caNodes[msg.sender].endorsementCount++;
        caNodes[msg.sender].lastActiveAt = block.timestamp;
        
        emit ApplicationEndorsed(applicationId, msg.sender, block.timestamp);
        
        // 检查是否满足背书策略
        checkEndorsementPolicy(applicationId);
    }
    
    /**
     * @dev 检查背书策略
     * 根据背书策略，背书节点模拟执行交易请求
     * @param applicationId 申请ID
     */
    function checkEndorsementPolicy(uint256 applicationId) internal {
        SuperNodeApplication storage application = superNodeApplications[applicationId];
        
        if (application.endorsers.length >= endorsementPolicy.minEndorsements) {
            // 自动批准申请
            application.isApproved = true;
            application.processedAt = block.timestamp;
            
            emit ApplicationProcessed(applicationId, true, block.timestamp);
        }
    }
    
    // ========== 电子证书认证 ==========
    
    /**
     * @dev 电子学历全流程管理证书认证
     * 采用CA认证与区块链的"数字签名"结合，进行电子证书的验证和认证行为
     * @param certificateType 证书类型
     * @param studentId 学生ID
     * @param institutionId 机构ID
     * @param certificateHash 证书哈希
     * @param blockchainSignature 区块链数字签名
     */
    function authenticateElectronicCertificate(
        string memory certificateType,
        string memory studentId,
        string memory institutionId,
        bytes32 certificateHash,
        bytes memory blockchainSignature
    ) external onlyActiveCANode returns (uint256) {
        require(bytes(certificateType).length > 0, "Certificate type cannot be empty");
        require(bytes(studentId).length > 0, "Student ID cannot be empty");
        require(certificateHash != bytes32(0), "Invalid certificate hash");
        require(blockchainSignature.length > 0, "Invalid blockchain signature");
        
        authCounter++;
        uint256 authId = authCounter;
        
        // 生成CA签名
        bytes memory caSignature = generateCASignature(
            certificateType,
            studentId,
            institutionId,
            certificateHash
        );
        
        electronicCertAuths[authId] = ElectronicCertAuth({
            authId: authId,
            certificateType: certificateType,
            studentId: studentId,
            institutionId: institutionId,
            certificateHash: certificateHash,
            blockchainSignature: blockchainSignature,
            caSignature: caSignature,
            authenticatedAt: block.timestamp,
            isVerified: true,
            verifier: msg.sender
        });
        
        // 建立证书类型到认证ID的映射
        string memory certKey = string(abi.encodePacked(studentId, "_", certificateType));
        certTypeToAuthId[certKey] = authId;
        
        emit ElectronicCertAuthenticated(
            authId,
            certificateType,
            studentId,
            msg.sender,
            block.timestamp
        );
        
        return authId;
    }
    
    /**
     * @dev 验证电子证书
     * 防止电子层面的造假，提高防伪性
     * @param studentId 学生ID
     * @param certificateType 证书类型
     * @param providedHash 提供的证书哈希
     */
    function verifyElectronicCertificate(
        string memory studentId,
        string memory certificateType,
        bytes32 providedHash
    ) external view returns (bool isValid, string memory message) {
        string memory certKey = string(abi.encodePacked(studentId, "_", certificateType));
        uint256 authId = certTypeToAuthId[certKey];
        
        if (authId == 0) {
            return (false, "Certificate authentication not found");
        }
        
        ElectronicCertAuth storage auth = electronicCertAuths[authId];
        
        if (!auth.isVerified) {
            return (false, "Certificate not verified by CA");
        }
        
        if (auth.certificateHash != providedHash) {
            return (false, "Certificate hash mismatch - possible forgery");
        }
        
        return (true, "Certificate verified successfully");
    }
    
    // ========== 辅助函数 ==========
    
    /**
     * @dev 生成数字签名
     */
    function generateDigitalSignature(
        uint256 certificateId,
        address subject,
        NodeAuthType authType,
        bytes32 publicKeyHash,
        string memory certificateData
    ) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            certificateId,
            subject,
            authType,
            publicKeyHash,
            certificateData,
            block.timestamp
        ));
        
        // 简化实现：实际应该使用ECDSA签名
        return abi.encodePacked(messageHash, msg.sender);
    }
    
    /**
     * @dev 生成CA签名
     */
    function generateCASignature(
        string memory certificateType,
        string memory studentId,
        string memory institutionId,
        bytes32 certificateHash
    ) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(
            certificateType,
            studentId,
            institutionId,
            certificateHash,
            msg.sender,
            block.timestamp
        ));
        
        return abi.encodePacked(messageHash, msg.sender);
    }
    
    // ========== 查询函数 ==========
    
    /**
     * @dev 获取节点证书列表
     * @param nodeAddress 节点地址
     */
    function getNodeCertificates(address nodeAddress) 
        external view returns (uint256[] memory) {
        return nodeCertificates[nodeAddress];
    }
    
    /**
     * @dev 获取CA节点信息
     * @param nodeAddress 节点地址
     */
    function getCANodeInfo(address nodeAddress) 
        external view returns (CANode memory) {
        return caNodes[nodeAddress];
    }
    
    /**
     * @dev 获取申请信息
     * @param applicationId 申请ID
     */
    function getApplicationInfo(uint256 applicationId) 
        external view applicationExists(applicationId) 
        returns (
            address applicant,
            string memory organizationName,
            bool isApproved,
            uint256 endorsementCount,
            address[] memory endorsers
        ) {
        SuperNodeApplication storage app = superNodeApplications[applicationId];
        return (
            app.applicant,
            app.organizationName,
            app.isApproved,
            app.endorsers.length,
            app.endorsers
        );
    }
    
    /**
     * @dev 更新背书策略
     * @param minEndorsements 最小背书数
     * @param endorsementTimeout 背书超时时间
     * @param requiresUnanimous 是否需要一致同意
     */
    function updateEndorsementPolicy(
        uint256 minEndorsements,
        uint256 endorsementTimeout,
        bool requiresUnanimous
    ) external onlyRootCA {
        require(minEndorsements > 0, "Min endorsements must be greater than 0");
        require(endorsementTimeout > 0, "Endorsement timeout must be greater than 0");
        
        endorsementPolicy.minEndorsements = minEndorsements;
        endorsementPolicy.endorsementTimeout = endorsementTimeout;
        endorsementPolicy.requiresUnanimous = requiresUnanimous;
    }
}
