// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title WASMStudentRegistry
 * @dev 基于WebAssembly的学籍信息上链合约
 * 
 * 使用基于WebAssembly（WASM）语言编写的混合模式智能合约
 * 包含合约结构、状态变量、函数、函数修饰器、事件、映射、类型推断、时间单位、函数调用等
 * 
 * @author XueLianTong Team
 */
contract WASMStudentRegistry {
    
    // ========== 数据类型定义 ==========
    
    // 学生信息结构体
    struct Student {
        uint256 stdID;           // 学生ID（无符号整数）
        string stdName;          // 学生姓名（字符串）
        string stdPhone;         // 学生手机号（字符串）
        string stdIdCard;        // 学生身份证号（字符串）
        string stdInfo;          // 学生学历信息（字符串）
        bool isRegistered;       // 是否已注册（布尔）
        bool isAudited;          // 是否已审核（布尔）
        address registeredBy;    // 注册者地址（地址类型）
        uint256 timestamp;       // 注册时间戳（无符号整数）
        bytes32 merkleRoot;      // Merkle根哈希
        string blockchainID;     // 区块链身份证
    }
    
    // 审核者信息结构体
    struct Auditor {
        uint256 id;              // 审核者ID
        string name;             // 审核者名称
        address auditorAddress;  // 审核者地址
        bool isActive;           // 是否活跃
        string organization;     // 所属机构
        uint256 auditCount;      // 审核数量
    }
    
    // 供应商映射结构（用于权限验证）
    struct Supplier {
        uint256 id;              // 供应商ID
        bool re;                 // 审核结果
        string name;             // 供应商名称
        address supplierAddress; // 供应商地址
    }
    
    // ========== 状态变量 ==========
    
    // 学生信息映射（身份证号 => 学生信息）
    mapping(string => Student) public students;
    
    // 审核者映射（地址 => 审核者信息）
    mapping(address => Auditor) public auditors;
    
    // 供应商映射（地址 => 供应商信息）
    mapping(address => Supplier) public supplierMap;
    
    // 身份证号是否已注册映射
    mapping(string => bool) public idCardRegistered;
    
    // 学生ID计数器
    uint256 public studentCounter;
    
    // 审核者ID计数器
    uint256 public auditorCounter;
    
    // 合约所有者
    address public owner;
    
    // 合约基地址
    address public base_addr;
    
    // ========== 事件定义 ==========
    
    event StudentRegistered(
        uint256 indexed stdID,
        string indexed stdIdCard,
        string stdName,
        address indexed registeredBy,
        uint256 timestamp
    );
    
    event StudentAudited(
        string indexed stdIdCard,
        bool approved,
        address indexed auditor,
        uint256 timestamp
    );
    
    event MerkleRootGenerated(
        string indexed stdIdCard,
        bytes32 merkleRoot,
        string blockchainID
    );
    
    event AuditorRegistered(
        uint256 indexed auditorId,
        address indexed auditorAddress,
        string name,
        string organization
    );
    
    event DataSynchronized(
        string indexed stdIdCard,
        bytes32 merkleRoot,
        string targetChain,
        uint256 timestamp
    );
    
    // ========== 函数修饰器 ==========
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuditor() {
        require(auditors[msg.sender].isActive, "Only active auditor can call this function");
        _;
    }
    
    modifier onlyAuthorizedSupplier() {
        require(supplierMap[msg.sender].id != 0 && supplierMap[msg.sender].re == true, 
                "Unauthorized supplier");
        _;
    }
    
    modifier studentNotRegistered(string memory stdIdCard) {
        require(!idCardRegistered[stdIdCard], "Student already registered");
        _;
    }
    
    modifier studentExists(string memory stdIdCard) {
        require(idCardRegistered[stdIdCard], "Student not found");
        _;
    }
    
    // ========== 构造函数 ==========
    
    constructor(address _base_addr) {
        owner = msg.sender;
        base_addr = _base_addr;
        studentCounter = 0;
        auditorCounter = 0;
        
        // 初始化合约所有者为第一个审核者
        auditorCounter++;
        auditors[msg.sender] = Auditor({
            id: auditorCounter,
            name: "System Admin",
            auditorAddress: msg.sender,
            isActive: true,
            organization: "Education Department",
            auditCount: 0
        });
    }
    
    // ========== 外部调用函数 ==========
    
    /**
     * @dev 学籍信息上链合约算法实现
     * 输入: 学生姓名、手机号、身份证号、学历信息、时间戳
     * 输出: 数据上链完成或失败
     */
    function registerStudent(
        string memory std_name,
        string memory std_phone,
        string memory std_id,
        string memory std_info,
        uint256 timestamp
    ) external onlyAuthorizedSupplier studentNotRegistered(std_id) returns (bool) {
        
        // Step 1: 要求身份证号未被录入
        require(!idCardRegistered[std_id], "ID card already registered");
        
        // Step 2: 要求通过审核（供应商权限验证）
        // Step 3: if supplierMap[msg.sender].id == 0 || supplierMap[msg.audit].re == False then
        if (supplierMap[msg.sender].id == 0 || supplierMap[msg.sender].re == false) {
            // Step 4: return FALSE
            return false;
        }
        // Step 5: end if
        
        // Step 6-9: 创建学生信息
        studentCounter++;
        
        Student storage std = students[std_id];
        std.stdID = studentCounter;        // Step 6: std.stdID = std_id
        std.stdName = std_name;            // Step 7: std.stdName = std_name
        std.stdPhone = std_phone;          // Step 8: std.stdPhone = std_phone
        std.stdInfo = std_info;            // Step 9: std.stdInfo = std_info
        std.isRegistered = true;
        std.isAudited = false;
        std.registeredBy = msg.sender;
        std.timestamp = timestamp;
        
        // 标记身份证号已注册
        idCardRegistered[std_id] = true;
        
        // 触发事件
        emit StudentRegistered(studentCounter, std_id, std_name, msg.sender, timestamp);
        
        // Step 10: final
        // Step 11: return True
        return true;
    }
    
    /**
     * @dev 审核学生信息
     * 教育部节点承担主要审核工作
     */
    function auditStudent(
        string memory std_id,
        bool approved
    ) external onlyAuditor studentExists(std_id) returns (bool) {
        
        Student storage student = students[std_id];
        require(!student.isAudited, "Student already audited");
        
        student.isAudited = true;
        
        if (approved) {
            // 审核成功后生成Merkle Root和区块链身份证
            bytes32 merkleRoot = generateMerkleRoot(std_id);
            string memory blockchainID = generateBlockchainID(std_id, merkleRoot);
            
            student.merkleRoot = merkleRoot;
            student.blockchainID = blockchainID;
            
            // 触发Merkle Root生成事件
            emit MerkleRootGenerated(std_id, merkleRoot, blockchainID);
            
            // 同步数据到侧链
            synchronizeToSideChain(std_id, merkleRoot);
        }
        
        // 更新审核者统计
        auditors[msg.sender].auditCount++;
        
        emit StudentAudited(std_id, approved, msg.sender, block.timestamp);
        
        return approved;
    }
    
    /**
     * @dev 注册审核者
     */
    function registerAuditor(
        address auditorAddress,
        string memory name,
        string memory organization
    ) external onlyOwner returns (uint256) {
        
        require(auditorAddress != address(0), "Invalid auditor address");
        require(!auditors[auditorAddress].isActive, "Auditor already registered");
        
        auditorCounter++;
        
        auditors[auditorAddress] = Auditor({
            id: auditorCounter,
            name: name,
            auditorAddress: auditorAddress,
            isActive: true,
            organization: organization,
            auditCount: 0
        });
        
        emit AuditorRegistered(auditorCounter, auditorAddress, name, organization);
        
        return auditorCounter;
    }
    
    /**
     * @dev 注册供应商
     */
    function registerSupplier(
        address supplierAddress,
        string memory name,
        bool approved
    ) external onlyOwner returns (uint256) {
        
        require(supplierAddress != address(0), "Invalid supplier address");
        
        uint256 supplierId = uint256(keccak256(abi.encodePacked(supplierAddress, block.timestamp))) % 1000000;
        
        supplierMap[supplierAddress] = Supplier({
            id: supplierId,
            re: approved,
            name: name,
            supplierAddress: supplierAddress
        });
        
        return supplierId;
    }
    
    /**
     * @dev 获取学生信息
     */
    function getStudent(string memory std_id) external view studentExists(std_id) 
        returns (
            uint256 stdID,
            string memory stdName,
            string memory stdPhone,
            string memory stdInfo,
            bool isAudited,
            bytes32 merkleRoot,
            string memory blockchainID
        ) {
        
        Student storage student = students[std_id];
        return (
            student.stdID,
            student.stdName,
            student.stdPhone,
            student.stdInfo,
            student.isAudited,
            student.merkleRoot,
            student.blockchainID
        );
    }
    
    /**
     * @dev 验证学生学历信息
     * 使用Merkle Root进行验证
     */
    function verifyStudentInfo(
        string memory std_id,
        string memory std_name,
        string memory std_info
    ) external view studentExists(std_id) returns (bool) {
        
        Student storage student = students[std_id];
        require(student.isAudited, "Student not audited");
        
        // 重新计算Merkle Root
        bytes32 calculatedRoot = calculateMerkleRoot(std_id, std_name, std_info);
        
        // 与存储的Merkle Root比较
        return calculatedRoot == student.merkleRoot;
    }
    
    // ========== 内部调用函数 ==========
    
    /**
     * @dev 生成Merkle Root
     * 使用MerkleTree算法进行哈希锁定
     */
    function generateMerkleRoot(string memory std_id) internal view returns (bytes32) {
        Student storage student = students[std_id];
        
        // 将学生信息作为叶子节点
        bytes32 h1 = keccak256(abi.encodePacked(student.stdName));
        bytes32 h2 = keccak256(abi.encodePacked(student.stdPhone));
        bytes32 h3 = keccak256(abi.encodePacked(student.stdIdCard));
        bytes32 h4 = keccak256(abi.encodePacked(student.stdInfo));
        
        // 两两哈希运算
        bytes32 h12 = keccak256(abi.encodePacked(h1, h2));
        bytes32 h34 = keccak256(abi.encodePacked(h3, h4));
        
        // 计算根哈希
        bytes32 merkleRoot = keccak256(abi.encodePacked(h12, h34));
        
        return merkleRoot;
    }
    
    /**
     * @dev 计算Merkle Root（用于验证）
     */
    function calculateMerkleRoot(
        string memory std_id,
        string memory std_name,
        string memory std_info
    ) internal view returns (bytes32) {
        
        Student storage student = students[std_id];
        
        bytes32 h1 = keccak256(abi.encodePacked(std_name));
        bytes32 h2 = keccak256(abi.encodePacked(student.stdPhone));
        bytes32 h3 = keccak256(abi.encodePacked(std_id));
        bytes32 h4 = keccak256(abi.encodePacked(std_info));
        
        bytes32 h12 = keccak256(abi.encodePacked(h1, h2));
        bytes32 h34 = keccak256(abi.encodePacked(h3, h4));
        
        return keccak256(abi.encodePacked(h12, h34));
    }
    
    /**
     * @dev 生成区块链身份证
     */
    function generateBlockchainID(
        string memory std_id,
        bytes32 merkleRoot
    ) internal pure returns (string memory) {
        
        bytes32 idHash = keccak256(abi.encodePacked(std_id, merkleRoot));
        return string(abi.encodePacked("BLOCKCHAIN_ID_", toHexString(idHash)));
    }
    
    /**
     * @dev 同步数据到侧链
     */
    function synchronizeToSideChain(string memory std_id, bytes32 merkleRoot) internal {
        // 这里应该调用跨链合约进行数据同步
        // 简化实现，触发同步事件
        emit DataSynchronized(std_id, merkleRoot, "sidechain", block.timestamp);
    }
    
    /**
     * @dev 将bytes32转换为十六进制字符串
     */
    function toHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        
        for (uint256 i = 0; i < 32; i++) {
            str[i*2] = alphabet[uint8(data[i] >> 4)];
            str[1+i*2] = alphabet[uint8(data[i] & 0x0f)];
        }
        
        return string(str);
    }
    
    // ========== 管理函数 ==========
    
    /**
     * @dev 停用审核者
     */
    function deactivateAuditor(address auditorAddress) external onlyOwner {
        require(auditors[auditorAddress].isActive, "Auditor not active");
        auditors[auditorAddress].isActive = false;
    }
    
    /**
     * @dev 更新供应商状态
     */
    function updateSupplierStatus(address supplierAddress, bool approved) external onlyOwner {
        require(supplierMap[supplierAddress].id != 0, "Supplier not found");
        supplierMap[supplierAddress].re = approved;
    }
    
    /**
     * @dev 获取合约统计信息
     */
    function getContractStats() external view returns (
        uint256 totalStudents,
        uint256 auditedStudents,
        uint256 totalAuditors,
        uint256 activeAuditors
    ) {
        totalStudents = studentCounter;
        
        // 这里简化实现，实际应该遍历所有学生
        auditedStudents = 0;
        
        totalAuditors = auditorCounter;
        
        // 这里简化实现，实际应该遍历所有审核者
        activeAuditors = 0;
        
        return (totalStudents, auditedStudents, totalAuditors, activeAuditors);
    }
}
