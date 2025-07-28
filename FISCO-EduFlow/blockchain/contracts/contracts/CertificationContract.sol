// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertificationContract
 * @dev 认证合约
 * 根据学生和单位意向，自动执行认证流程并记录上链
 */
contract CertificationContract {
    
    // 认证状态枚举
    enum CertificationStatus {
        Pending,        // 待处理
        Approved,       // 学生已同意
        InProgress,     // 认证进行中
        Completed,      // 认证完成
        Rejected,       // 认证被拒绝
        Cancelled       // 认证被取消
    }
    
    // 认证请求结构
    struct CertificationRequest {
        uint256 requestId;              // 请求ID
        address employer;               // 用人单位地址
        address student;                // 学生地址
        string details;                 // 认证详情
        CertificationStatus status;     // 认证状态
        uint256 createdAt;             // 创建时间
        uint256 updatedAt;             // 更新时间
        bytes studentSignature;         // 学生签名
        bytes zkpProof;                // 零知识证明
        string result;                  // 认证结果
        bool requiresZKP;              // 是否需要零知识证明
    }
    
    // 用人单位信息结构
    struct EmployerInfo {
        string name;                    // 单位名称
        string license;                 // 营业执照号
        bool isVerified;               // 是否已验证
        uint256 registeredAt;          // 注册时间
        uint256 totalRequests;         // 总请求数
    }
    
    // 状态变量
    mapping(uint256 => CertificationRequest) public certificationRequests;  // 认证请求映射
    mapping(address => EmployerInfo) public employers;                      // 用人单位信息映射
    mapping(address => bool) public verifiedEmployers;                      // 已验证的用人单位
    mapping(address => uint256[]) public studentRequests;                   // 学生的请求列表
    mapping(address => uint256[]) public employerRequests;                  // 用人单位的请求列表
    mapping(bytes32 => bool) public usedProofs;                            // 已使用的证明
    
    address public admin;                                                    // 管理员地址
    address public zkpVerifier;                                             // ZKP验证器地址
    uint256 public nextRequestId;                                           // 下一个请求ID
    uint256 public totalRequests;                                           // 总请求数
    
    // 事件定义
    event EmployerRegistered(address indexed employer, string name, string license);
    event EmployerVerified(address indexed employer, bool verified);
    event CertificationInitiated(
        uint256 indexed requestId,
        address indexed employer,
        address indexed student,
        string details,
        bool requiresZKP
    );
    event CertificationApproved(uint256 indexed requestId, address indexed student, bytes signature);
    event CertificationCompleted(
        uint256 indexed requestId,
        address indexed employer,
        address indexed student,
        string result,
        uint256 timestamp
    );
    event CertificationRejected(uint256 indexed requestId, string reason);
    event CertificationCancelled(uint256 indexed requestId, address indexed canceller);
    event ZKPProofSubmitted(uint256 indexed requestId, bytes proof);
    
    // 修饰符
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyVerifiedEmployer() {
        require(verifiedEmployers[msg.sender], "Only verified employers can perform this action");
        _;
    }
    
    modifier validRequestId(uint256 _requestId) {
        require(_requestId > 0 && _requestId < nextRequestId, "Invalid request ID");
        _;
    }
    
    modifier onlyRequestParticipant(uint256 _requestId) {
        CertificationRequest memory request = certificationRequests[_requestId];
        require(
            msg.sender == request.employer || msg.sender == request.student,
            "Only request participants can perform this action"
        );
        _;
    }
    
    // 构造函数
    constructor(address _zkpVerifier) {
        admin = msg.sender;
        zkpVerifier = _zkpVerifier;
        nextRequestId = 1;
        totalRequests = 0;
    }
    
    /**
     * @dev 注册用人单位
     * @param _employer 用人单位地址
     * @param _name 单位名称
     * @param _license 营业执照号
     */
    function registerEmployer(
        address _employer,
        string memory _name,
        string memory _license
    ) external onlyAdmin {
        require(_employer != address(0), "Invalid employer address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_license).length > 0, "License cannot be empty");
        require(!employers[_employer].isVerified, "Employer already registered");
        
        employers[_employer] = EmployerInfo({
            name: _name,
            license: _license,
            isVerified: false,
            registeredAt: block.timestamp,
            totalRequests: 0
        });
        
        emit EmployerRegistered(_employer, _name, _license);
    }
    
    /**
     * @dev 验证用人单位
     * @param _employer 用人单位地址
     * @param _verified 是否验证
     */
    function verifyEmployer(address _employer, bool _verified) external onlyAdmin {
        require(_employer != address(0), "Invalid employer address");
        require(bytes(employers[_employer].name).length > 0, "Employer not registered");
        
        employers[_employer].isVerified = _verified;
        verifiedEmployers[_employer] = _verified;
        
        emit EmployerVerified(_employer, _verified);
    }
    
    /**
     * @dev 发起认证请求
     * @param _student 学生地址
     * @param _details 认证详情
     * @param _requiresZKP 是否需要零知识证明
     */
    function initiateCertification(
        address _student,
        string memory _details,
        bool _requiresZKP
    ) external onlyVerifiedEmployer returns (uint256) {
        require(_student != address(0), "Invalid student address");
        require(bytes(_details).length > 0, "Details cannot be empty");
        
        uint256 requestId = nextRequestId++;
        
        certificationRequests[requestId] = CertificationRequest({
            requestId: requestId,
            employer: msg.sender,
            student: _student,
            details: _details,
            status: CertificationStatus.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            studentSignature: "",
            zkpProof: "",
            result: "",
            requiresZKP: _requiresZKP
        });
        
        studentRequests[_student].push(requestId);
        employerRequests[msg.sender].push(requestId);
        employers[msg.sender].totalRequests++;
        totalRequests++;
        
        emit CertificationInitiated(requestId, msg.sender, _student, _details, _requiresZKP);
        
        return requestId;
    }
    
    /**
     * @dev 学生同意认证
     * @param _requestId 请求ID
     * @param _signature 学生签名
     */
    function approveCertification(
        uint256 _requestId,
        bytes memory _signature
    ) external validRequestId(_requestId) {
        CertificationRequest storage request = certificationRequests[_requestId];
        require(msg.sender == request.student, "Only the student can approve");
        require(request.status == CertificationStatus.Pending, "Request is not pending");
        require(_signature.length > 0, "Signature cannot be empty");
        
        request.status = CertificationStatus.Approved;
        request.studentSignature = _signature;
        request.updatedAt = block.timestamp;
        
        emit CertificationApproved(_requestId, msg.sender, _signature);
    }
    
    /**
     * @dev 提交零知识证明
     * @param _requestId 请求ID
     * @param _proof 零知识证明
     */
    function submitZKPProof(
        uint256 _requestId,
        bytes memory _proof
    ) external validRequestId(_requestId) {
        CertificationRequest storage request = certificationRequests[_requestId];
        require(msg.sender == request.student, "Only the student can submit proof");
        require(request.status == CertificationStatus.Approved, "Request must be approved first");
        require(request.requiresZKP, "ZKP not required for this request");
        require(_proof.length > 0, "Proof cannot be empty");
        
        bytes32 proofHash = keccak256(_proof);
        require(!usedProofs[proofHash], "Proof already used");
        
        request.zkpProof = _proof;
        request.status = CertificationStatus.InProgress;
        request.updatedAt = block.timestamp;
        usedProofs[proofHash] = true;
        
        emit ZKPProofSubmitted(_requestId, _proof);
    }
    
    /**
     * @dev 完成认证
     * @param _requestId 请求ID
     * @param _result 认证结果
     */
    function completeCertification(
        uint256 _requestId,
        string memory _result
    ) external validRequestId(_requestId) {
        CertificationRequest storage request = certificationRequests[_requestId];
        require(msg.sender == request.employer, "Only the employer can complete certification");
        require(
            request.status == CertificationStatus.Approved || 
            request.status == CertificationStatus.InProgress,
            "Invalid request status"
        );
        require(bytes(_result).length > 0, "Result cannot be empty");
        
        // 如果需要ZKP，检查是否已提交
        if (request.requiresZKP) {
            require(request.zkpProof.length > 0, "ZKP proof required but not submitted");
            // 这里应该调用ZKP验证器验证证明
            require(_verifyZKPProof(request.zkpProof), "Invalid ZKP proof");
        }
        
        request.status = CertificationStatus.Completed;
        request.result = _result;
        request.updatedAt = block.timestamp;
        
        emit CertificationCompleted(_requestId, request.employer, request.student, _result, block.timestamp);
    }
    
    /**
     * @dev 拒绝认证
     * @param _requestId 请求ID
     * @param _reason 拒绝原因
     */
    function rejectCertification(
        uint256 _requestId,
        string memory _reason
    ) external validRequestId(_requestId) onlyRequestParticipant(_requestId) {
        CertificationRequest storage request = certificationRequests[_requestId];
        require(
            request.status == CertificationStatus.Pending || 
            request.status == CertificationStatus.Approved,
            "Cannot reject at current status"
        );
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        
        request.status = CertificationStatus.Rejected;
        request.result = _reason;
        request.updatedAt = block.timestamp;
        
        emit CertificationRejected(_requestId, _reason);
    }
    
    /**
     * @dev 取消认证
     * @param _requestId 请求ID
     */
    function cancelCertification(uint256 _requestId) 
        external 
        validRequestId(_requestId) 
        onlyRequestParticipant(_requestId) 
    {
        CertificationRequest storage request = certificationRequests[_requestId];
        require(request.status != CertificationStatus.Completed, "Cannot cancel completed certification");
        require(request.status != CertificationStatus.Cancelled, "Already cancelled");
        
        request.status = CertificationStatus.Cancelled;
        request.updatedAt = block.timestamp;
        
        emit CertificationCancelled(_requestId, msg.sender);
    }
    
    /**
     * @dev 获取认证请求详情
     * @param _requestId 请求ID
     * @return 请求详情
     */
    function getCertificationRequest(uint256 _requestId) 
        external 
        view 
        validRequestId(_requestId)
        returns (
            address employer,
            address student,
            string memory details,
            CertificationStatus status,
            uint256 createdAt,
            uint256 updatedAt,
            string memory result,
            bool requiresZKP
        ) 
    {
        CertificationRequest memory request = certificationRequests[_requestId];
        return (
            request.employer,
            request.student,
            request.details,
            request.status,
            request.createdAt,
            request.updatedAt,
            request.result,
            request.requiresZKP
        );
    }
    
    /**
     * @dev 获取学生的认证请求列表
     * @param _student 学生地址
     * @return 请求ID数组
     */
    function getStudentRequests(address _student) external view returns (uint256[] memory) {
        return studentRequests[_student];
    }
    
    /**
     * @dev 获取用人单位的认证请求列表
     * @param _employer 用人单位地址
     * @return 请求ID数组
     */
    function getEmployerRequests(address _employer) external view returns (uint256[] memory) {
        return employerRequests[_employer];
    }
    
    /**
     * @dev 获取合约统计信息
     * @return 总请求数、下一个请求ID
     */
    function getContractStats() external view returns (uint256, uint256) {
        return (totalRequests, nextRequestId);
    }
    
    /**
     * @dev 验证零知识证明（简化版本）
     * @param _proof 证明数据
     * @return 是否有效
     */
    function _verifyZKPProof(bytes memory _proof) private view returns (bool) {
        // 这里应该调用实际的ZKP验证器
        // 为了简化，这里只检查证明长度
        return _proof.length >= 32 && zkpVerifier != address(0);
    }
    
    /**
     * @dev 设置ZKP验证器地址
     * @param _zkpVerifier 新的验证器地址
     */
    function setZKPVerifier(address _zkpVerifier) external onlyAdmin {
        require(_zkpVerifier != address(0), "Invalid verifier address");
        zkpVerifier = _zkpVerifier;
    }
    
    /**
     * @dev 更换管理员
     * @param _newAdmin 新管理员地址
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }
}
