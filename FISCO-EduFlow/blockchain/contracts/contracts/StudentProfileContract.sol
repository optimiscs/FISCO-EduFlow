// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StudentProfileContract
 * @dev 学籍信息上链合约
 * 负责接收由学校签名授权的、经过加密的学生个人信息
 */
contract StudentProfileContract {
    
    // 学生档案结构
    struct StudentProfile {
        string encryptedInfo;      // 加密的学生信息
        bytes signature;           // 学校的数字签名
        address school;            // 学校地址
        uint256 timestamp;         // 上链时间戳
        bool isActive;             // 是否有效
        string infoHash;           // 信息摘要哈希
    }
    
    // 学校信息结构
    struct SchoolInfo {
        string name;               // 学校名称
        string license;            // 办学许可证号
        bool isAuthorized;         // 是否已授权
        uint256 registeredAt;      // 注册时间
    }
    
    // 状态变量
    mapping(address => SchoolInfo) public schools;           // 学校信息映射
    mapping(address => StudentProfile[]) public studentProfiles; // 学生档案映射
    mapping(string => address) public hashToStudent;        // 哈希到学生地址的映射
    mapping(address => bool) public authorizedSchools;      // 授权学校映射
    
    address public admin;                                    // 管理员地址
    uint256 public totalProfiles;                          // 总档案数
    
    // 事件定义
    event SchoolRegistered(address indexed school, string name, string license);
    event SchoolAuthorized(address indexed school, bool authorized);
    event ProfileAdded(address indexed student, address indexed school, string infoHash, uint256 timestamp);
    event ProfileUpdated(address indexed student, uint256 profileIndex, string newInfoHash);
    event ProfileDeactivated(address indexed student, uint256 profileIndex);
    
    // 修饰符
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyAuthorizedSchool() {
        require(authorizedSchools[msg.sender], "Only authorized schools can perform this action");
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    // 构造函数
    constructor() {
        admin = msg.sender;
        totalProfiles = 0;
    }
    
    /**
     * @dev 注册学校
     * @param _school 学校地址
     * @param _name 学校名称
     * @param _license 办学许可证号
     */
    function registerSchool(
        address _school,
        string memory _name,
        string memory _license
    ) external onlyAdmin validAddress(_school) {
        require(bytes(_name).length > 0, "School name cannot be empty");
        require(bytes(_license).length > 0, "License cannot be empty");
        require(!schools[_school].isAuthorized, "School already registered");
        
        schools[_school] = SchoolInfo({
            name: _name,
            license: _license,
            isAuthorized: false,
            registeredAt: block.timestamp
        });
        
        emit SchoolRegistered(_school, _name, _license);
    }
    
    /**
     * @dev 授权学校
     * @param _school 学校地址
     * @param _authorized 是否授权
     */
    function authorizeSchool(address _school, bool _authorized) 
        external 
        onlyAdmin 
        validAddress(_school) 
    {
        require(bytes(schools[_school].name).length > 0, "School not registered");
        
        schools[_school].isAuthorized = _authorized;
        authorizedSchools[_school] = _authorized;
        
        emit SchoolAuthorized(_school, _authorized);
    }
    
    /**
     * @dev 添加学生档案
     * @param _student 学生地址
     * @param _encryptedInfo 加密的学生信息
     * @param _signature 学校签名
     * @param _infoHash 信息摘要哈希
     */
    function addStudentProfile(
        address _student,
        string memory _encryptedInfo,
        bytes memory _signature,
        string memory _infoHash
    ) external onlyAuthorizedSchool validAddress(_student) {
        require(bytes(_encryptedInfo).length > 0, "Encrypted info cannot be empty");
        require(_signature.length > 0, "Signature cannot be empty");
        require(bytes(_infoHash).length > 0, "Info hash cannot be empty");
        require(hashToStudent[_infoHash] == address(0), "Info hash already exists");
        
        // 验证签名（简化版本，实际应该验证学校对信息的签名）
        require(_verifySchoolSignature(_encryptedInfo, _signature, msg.sender), "Invalid signature");
        
        StudentProfile memory newProfile = StudentProfile({
            encryptedInfo: _encryptedInfo,
            signature: _signature,
            school: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            infoHash: _infoHash
        });
        
        studentProfiles[_student].push(newProfile);
        hashToStudent[_infoHash] = _student;
        totalProfiles++;
        
        emit ProfileAdded(_student, msg.sender, _infoHash, block.timestamp);
    }
    
    /**
     * @dev 更新学生档案
     * @param _student 学生地址
     * @param _profileIndex 档案索引
     * @param _encryptedInfo 新的加密信息
     * @param _signature 新的签名
     * @param _infoHash 新的信息哈希
     */
    function updateStudentProfile(
        address _student,
        uint256 _profileIndex,
        string memory _encryptedInfo,
        bytes memory _signature,
        string memory _infoHash
    ) external onlyAuthorizedSchool validAddress(_student) {
        require(_profileIndex < studentProfiles[_student].length, "Invalid profile index");
        require(studentProfiles[_student][_profileIndex].school == msg.sender, "Not authorized to update this profile");
        require(studentProfiles[_student][_profileIndex].isActive, "Profile is not active");
        require(bytes(_encryptedInfo).length > 0, "Encrypted info cannot be empty");
        require(_signature.length > 0, "Signature cannot be empty");
        require(bytes(_infoHash).length > 0, "Info hash cannot be empty");
        
        // 验证签名
        require(_verifySchoolSignature(_encryptedInfo, _signature, msg.sender), "Invalid signature");
        
        // 清除旧的哈希映射
        delete hashToStudent[studentProfiles[_student][_profileIndex].infoHash];
        
        // 更新档案
        studentProfiles[_student][_profileIndex].encryptedInfo = _encryptedInfo;
        studentProfiles[_student][_profileIndex].signature = _signature;
        studentProfiles[_student][_profileIndex].infoHash = _infoHash;
        studentProfiles[_student][_profileIndex].timestamp = block.timestamp;
        
        // 设置新的哈希映射
        hashToStudent[_infoHash] = _student;
        
        emit ProfileUpdated(_student, _profileIndex, _infoHash);
    }
    
    /**
     * @dev 停用学生档案
     * @param _student 学生地址
     * @param _profileIndex 档案索引
     */
    function deactivateProfile(
        address _student,
        uint256 _profileIndex
    ) external onlyAuthorizedSchool validAddress(_student) {
        require(_profileIndex < studentProfiles[_student].length, "Invalid profile index");
        require(studentProfiles[_student][_profileIndex].school == msg.sender, "Not authorized to deactivate this profile");
        require(studentProfiles[_student][_profileIndex].isActive, "Profile already inactive");
        
        studentProfiles[_student][_profileIndex].isActive = false;
        
        emit ProfileDeactivated(_student, _profileIndex);
    }
    
    /**
     * @dev 获取学生档案数量
     * @param _student 学生地址
     * @return 档案数量
     */
    function getStudentProfileCount(address _student) external view returns (uint256) {
        return studentProfiles[_student].length;
    }
    
    /**
     * @dev 获取学生档案
     * @param _student 学生地址
     * @param _profileIndex 档案索引
     * @return 档案信息
     */
    function getStudentProfile(address _student, uint256 _profileIndex) 
        external 
        view 
        returns (
            string memory encryptedInfo,
            bytes memory signature,
            address school,
            uint256 timestamp,
            bool isActive,
            string memory infoHash
        ) 
    {
        require(_profileIndex < studentProfiles[_student].length, "Invalid profile index");
        
        StudentProfile memory profile = studentProfiles[_student][_profileIndex];
        return (
            profile.encryptedInfo,
            profile.signature,
            profile.school,
            profile.timestamp,
            profile.isActive,
            profile.infoHash
        );
    }
    
    /**
     * @dev 根据哈希获取学生地址
     * @param _infoHash 信息哈希
     * @return 学生地址
     */
    function getStudentByHash(string memory _infoHash) external view returns (address) {
        return hashToStudent[_infoHash];
    }
    
    /**
     * @dev 验证学校签名（简化版本）
     * @param _data 数据
     * @param _signature 签名
     * @param _school 学校地址
     * @return 是否有效
     */
    function _verifySchoolSignature(
        string memory _data,
        bytes memory _signature,
        address _school
    ) private pure returns (bool) {
        // 这里应该实现真正的ECDSA签名验证
        // 为了简化，这里只检查签名长度
        return _signature.length >= 65 && bytes(_data).length > 0 && _school != address(0);
    }
    
    /**
     * @dev 获取合约统计信息
     * @return 总档案数、授权学校数
     */
    function getContractStats() external view returns (uint256, uint256) {
        // 计算授权学校数量（简化实现）
        uint256 authorizedCount = 0;
        // 在实际实现中，应该维护一个授权学校的数组来高效计算
        
        return (totalProfiles, authorizedCount);
    }
    
    /**
     * @dev 更换管理员
     * @param _newAdmin 新管理员地址
     */
    function changeAdmin(address _newAdmin) external onlyAdmin validAddress(_newAdmin) {
        admin = _newAdmin;
    }
}
