// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MerkleSyncContract
 * @dev 主侧链数据同步、数据验证的智能合约
 *
 * 由于联盟主链与联盟侧链是两条权限不同的区块链，所以链上数据必须同步
 * 在学生录入信息以后，使用MerkleTree算法进行哈希锁定，生成一串hash值
 * （该hash将成为用户"区块链身份证"的属性），并将得到的MerkleRoot同步到联盟侧链
 * 一旦学籍信息被篡改，Merkle Root也会随之改变
 *
 * 将主链中高校、教育部，侧链中代理机构等节点上传的信息作为Merkle Tree的叶子节点
 * 计算其哈希值，对(H1,H2，...)进行两两哈希运算求哈希值，如此循环，直至得到根哈希MerkleRoot
 */
contract MerkleSyncContract {
    
    // Merkle根信息结构
    struct MerkleRootInfo {
        bytes32 root;              // Merkle根
        uint256 blockHeight;       // 区块高度
        uint256 timestamp;         // 时间戳
        address submitter;         // 提交者
        uint256 leafCount;         // 叶子节点数量
        bool isVerified;           // 是否已验证
        string dataHash;           // 数据批次哈希
        string sourceChain;        // 来源链（主链/侧链）
        string targetChain;        // 目标链
        string blockchainID;       // 区块链身份证ID
    }

    // 学生数据节点结构（用于Merkle Tree叶子节点）
    struct StudentDataNode {
        string studentId;          // 学生ID
        string institutionId;      // 机构ID（高校、教育部、代理机构等）
        string dataType;           // 数据类型（学历、成绩、证书等）
        bytes32 dataHash;          // 数据哈希
        string nodeType;           // 节点类型（主链/侧链）
        uint256 timestamp;         // 时间戳
    }

    // 数据篡改检测结构
    struct TamperDetection {
        string studentId;          // 学生ID
        bytes32 originalRoot;      // 原始Merkle根
        bytes32 currentRoot;       // 当前Merkle根
        bool isTampered;           // 是否被篡改
        uint256 detectedAt;        // 检测时间
        string tamperSource;       // 篡改来源分支
    }
    
    // 验证证明结构
    struct MerkleProof {
        bytes32 leaf;              // 叶子节点哈希
        bytes32[] proof;           // 证明路径
        uint256 index;             // 叶子节点索引
    }
    
    // 状态变量
    mapping(uint256 => MerkleRootInfo) public merkleRoots;    // 区块高度到Merkle根的映射
    mapping(bytes32 => bool) public verifiedRoots;           // 已验证的根
    mapping(address => bool) public authorizedSubmitters;    // 授权提交者
    mapping(bytes32 => uint256) public rootToHeight;         // 根到高度的映射
    mapping(string => bytes32) public studentToRoot;         // 学生ID到Merkle根的映射
    mapping(string => string) public studentToBlockchainID;  // 学生ID到区块链身份证的映射
    mapping(string => StudentDataNode[]) public studentDataNodes; // 学生数据节点
    mapping(string => TamperDetection) public tamperDetections;   // 篡改检测记录
    mapping(string => mapping(string => bytes32)) public chainSyncRoots; // 链间同步根
    
    address public admin;                                     // 管理员
    uint256 public currentHeight;                            // 当前高度
    uint256 public totalRoots;                              // 总根数量
    bytes32 public latestRoot;                               // 最新根
    
    // 事件定义
    event MerkleRootUpdated(
        uint256 indexed height,
        bytes32 indexed root,
        address indexed submitter,
        uint256 leafCount,
        uint256 timestamp
    );
    
    event MerkleRootVerified(
        bytes32 indexed root,
        uint256 indexed height,
        bool verified
    );
    
    event SubmitterAuthorized(address indexed submitter, bool authorized);
    
    event ProofVerified(
        bytes32 indexed leaf,
        bytes32 indexed root,
        bool verified
    );
    
    // 修饰符
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyAuthorizedSubmitter() {
        require(authorizedSubmitters[msg.sender], "Only authorized submitters can perform this action");
        _;
    }
    
    modifier validRoot(bytes32 _root) {
        require(_root != bytes32(0), "Invalid root");
        _;
    }
    
    // 构造函数
    constructor() {
        admin = msg.sender;
        currentHeight = 0;
        totalRoots = 0;
        latestRoot = bytes32(0);
    }
    
    /**
     * @dev 授权提交者
     * @param _submitter 提交者地址
     * @param _authorized 是否授权
     */
    function authorizeSubmitter(address _submitter, bool _authorized) 
        external 
        onlyAdmin 
    {
        require(_submitter != address(0), "Invalid submitter address");
        
        authorizedSubmitters[_submitter] = _authorized;
        
        emit SubmitterAuthorized(_submitter, _authorized);
    }
    
    /**
     * @dev 更新Merkle根
     * @param _root Merkle根
     * @param _leafCount 叶子节点数量
     * @param _dataHash 数据批次哈希
     */
    function updateRoot(
        bytes32 _root,
        uint256 _leafCount,
        string memory _dataHash
    ) external onlyAuthorizedSubmitter validRoot(_root) {
        require(_leafCount > 0, "Leaf count must be greater than 0");
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");
        require(merkleRoots[currentHeight + 1].root == bytes32(0), "Root already exists for next height");
        
        uint256 newHeight = currentHeight + 1;
        
        merkleRoots[newHeight] = MerkleRootInfo({
            root: _root,
            blockHeight: newHeight,
            timestamp: block.timestamp,
            submitter: msg.sender,
            leafCount: _leafCount,
            isVerified: false,
            dataHash: _dataHash
        });
        
        rootToHeight[_root] = newHeight;
        currentHeight = newHeight;
        totalRoots++;
        latestRoot = _root;
        
        emit MerkleRootUpdated(newHeight, _root, msg.sender, _leafCount, block.timestamp);
    }
    
    /**
     * @dev 批量更新Merkle根
     * @param _roots Merkle根数组
     * @param _leafCounts 叶子节点数量数组
     * @param _dataHashes 数据批次哈希数组
     */
    function batchUpdateRoots(
        bytes32[] memory _roots,
        uint256[] memory _leafCounts,
        string[] memory _dataHashes
    ) external onlyAuthorizedSubmitter {
        require(_roots.length == _leafCounts.length, "Arrays length mismatch");
        require(_roots.length == _dataHashes.length, "Arrays length mismatch");
        require(_roots.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < _roots.length; i++) {
            require(_roots[i] != bytes32(0), "Invalid root");
            require(_leafCounts[i] > 0, "Invalid leaf count");
            require(bytes(_dataHashes[i]).length > 0, "Invalid data hash");
            
            uint256 newHeight = currentHeight + 1;
            
            merkleRoots[newHeight] = MerkleRootInfo({
                root: _roots[i],
                blockHeight: newHeight,
                timestamp: block.timestamp,
                submitter: msg.sender,
                leafCount: _leafCounts[i],
                isVerified: false,
                dataHash: _dataHashes[i]
            });
            
            rootToHeight[_roots[i]] = newHeight;
            currentHeight = newHeight;
            totalRoots++;
            
            emit MerkleRootUpdated(newHeight, _roots[i], msg.sender, _leafCounts[i], block.timestamp);
        }
        
        latestRoot = _roots[_roots.length - 1];
    }
    
    /**
     * @dev 验证Merkle证明
     * @param _proof Merkle证明
     * @param _root 要验证的根
     * @return 是否验证成功
     */
    function verifyProof(
        MerkleProof memory _proof,
        bytes32 _root
    ) public pure returns (bool) {
        bytes32 computedHash = _proof.leaf;
        uint256 index = _proof.index;
        
        for (uint256 i = 0; i < _proof.proof.length; i++) {
            bytes32 proofElement = _proof.proof[i];
            
            if (index % 2 == 0) {
                // 如果索引是偶数，当前节点在左侧
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // 如果索引是奇数，当前节点在右侧
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
            
            index = index / 2;
        }
        
        return computedHash == _root;
    }
    
    /**
     * @dev 验证并记录Merkle证明
     * @param _proof Merkle证明
     * @param _root 要验证的根
     * @return 是否验证成功
     */
    function verifyAndRecordProof(
        MerkleProof memory _proof,
        bytes32 _root
    ) external returns (bool) {
        bool verified = verifyProof(_proof, _root);
        
        emit ProofVerified(_proof.leaf, _root, verified);
        
        return verified;
    }
    
    /**
     * @dev 标记根为已验证
     * @param _root Merkle根
     * @param _verified 是否已验证
     */
    function markRootVerified(bytes32 _root, bool _verified) 
        external 
        onlyAdmin 
        validRoot(_root) 
    {
        require(rootToHeight[_root] > 0, "Root does not exist");
        
        uint256 height = rootToHeight[_root];
        merkleRoots[height].isVerified = _verified;
        verifiedRoots[_root] = _verified;
        
        emit MerkleRootVerified(_root, height, _verified);
    }
    
    /**
     * @dev 获取最新的Merkle根
     * @return 最新根信息
     */
    function getLatestRoot() external view returns (
        bytes32 root,
        uint256 blockHeight,
        uint256 timestamp,
        address submitter,
        uint256 leafCount,
        bool isVerified,
        string memory dataHash
    ) {
        if (currentHeight == 0) {
            return (bytes32(0), 0, 0, address(0), 0, false, "");
        }
        
        MerkleRootInfo memory rootInfo = merkleRoots[currentHeight];
        return (
            rootInfo.root,
            rootInfo.blockHeight,
            rootInfo.timestamp,
            rootInfo.submitter,
            rootInfo.leafCount,
            rootInfo.isVerified,
            rootInfo.dataHash
        );
    }
    
    /**
     * @dev 根据高度获取Merkle根信息
     * @param _height 区块高度
     * @return 根信息
     */
    function getRootByHeight(uint256 _height) external view returns (
        bytes32 root,
        uint256 blockHeight,
        uint256 timestamp,
        address submitter,
        uint256 leafCount,
        bool isVerified,
        string memory dataHash
    ) {
        require(_height > 0 && _height <= currentHeight, "Invalid height");
        
        MerkleRootInfo memory rootInfo = merkleRoots[_height];
        return (
            rootInfo.root,
            rootInfo.blockHeight,
            rootInfo.timestamp,
            rootInfo.submitter,
            rootInfo.leafCount,
            rootInfo.isVerified,
            rootInfo.dataHash
        );
    }
    
    /**
     * @dev 根据根哈希获取高度
     * @param _root Merkle根
     * @return 区块高度
     */
    function getHeightByRoot(bytes32 _root) external view returns (uint256) {
        return rootToHeight[_root];
    }
    
    /**
     * @dev 检查根是否已验证
     * @param _root Merkle根
     * @return 是否已验证
     */
    function isRootVerified(bytes32 _root) external view returns (bool) {
        return verifiedRoots[_root];
    }
    
    /**
     * @dev 获取合约统计信息
     * @return 当前高度、总根数量、最新根
     */
    function getContractStats() external view returns (
        uint256 height,
        uint256 totalRootsCount,
        bytes32 latest
    ) {
        return (currentHeight, totalRoots, latestRoot);
    }
    
    /**
     * @dev 获取指定范围内的根
     * @param _startHeight 起始高度
     * @param _endHeight 结束高度
     * @return 根数组
     */
    function getRootsByRange(uint256 _startHeight, uint256 _endHeight) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        require(_startHeight > 0 && _startHeight <= currentHeight, "Invalid start height");
        require(_endHeight >= _startHeight && _endHeight <= currentHeight, "Invalid end height");
        require(_endHeight - _startHeight + 1 <= 100, "Range too large"); // 限制返回数量
        
        uint256 length = _endHeight - _startHeight + 1;
        bytes32[] memory roots = new bytes32[](length);
        
        for (uint256 i = 0; i < length; i++) {
            roots[i] = merkleRoots[_startHeight + i].root;
        }
        
        return roots;
    }
    
    /**
     * @dev 更换管理员
     * @param _newAdmin 新管理员地址
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }

    // ========== 数据同步验证功能 ==========

    /**
     * @dev 添加学生数据节点
     * 将主链中高校、教育部，侧链中代理机构等节点上传的信息作为Merkle Tree的叶子节点
     * @param studentId 学生ID
     * @param institutionId 机构ID
     * @param dataType 数据类型
     * @param dataHash 数据哈希
     * @param nodeType 节点类型
     */
    function addStudentDataNode(
        string memory studentId,
        string memory institutionId,
        string memory dataType,
        bytes32 dataHash,
        string memory nodeType
    ) external onlyAuthorizedSubmitter {
        require(bytes(studentId).length > 0, "Invalid student ID");
        require(bytes(institutionId).length > 0, "Invalid institution ID");
        require(dataHash != bytes32(0), "Invalid data hash");

        StudentDataNode memory newNode = StudentDataNode({
            studentId: studentId,
            institutionId: institutionId,
            dataType: dataType,
            dataHash: dataHash,
            nodeType: nodeType,
            timestamp: block.timestamp
        });

        studentDataNodes[studentId].push(newNode);

        // 重新计算该学生的Merkle Root
        bytes32 newRoot = calculateStudentMerkleRoot(studentId);
        studentToRoot[studentId] = newRoot;

        // 生成区块链身份证
        string memory blockchainID = generateBlockchainID(studentId, newRoot);
        studentToBlockchainID[studentId] = blockchainID;

        emit MerkleRootUpdated(block.number, newRoot, msg.sender,
                              studentDataNodes[studentId].length, block.timestamp);
    }

    /**
     * @dev 计算学生的Merkle Root
     * 对(H1,H2，...)进行两两哈希运算求哈希值，如此循环，直至得到根哈希MerkleRoot
     * @param studentId 学生ID
     * @return 计算得到的Merkle Root
     */
    function calculateStudentMerkleRoot(string memory studentId) public view returns (bytes32) {
        StudentDataNode[] memory nodes = studentDataNodes[studentId];
        require(nodes.length > 0, "No data nodes for student");

        if (nodes.length == 1) {
            return nodes[0].dataHash;
        }

        // 创建哈希数组
        bytes32[] memory hashes = new bytes32[](nodes.length);
        for (uint256 i = 0; i < nodes.length; i++) {
            hashes[i] = nodes[i].dataHash;
        }

        // 两两哈希运算，直至得到根哈希
        return buildMerkleTree(hashes);
    }

    /**
     * @dev 构建Merkle Tree
     * 如此循环，直至得到根哈希MerkleRoot
     * @param leaves 叶子节点哈希数组
     * @return Merkle Root
     */
    function buildMerkleTree(bytes32[] memory leaves) internal pure returns (bytes32) {
        uint256 length = leaves.length;
        require(length > 0, "Empty leaves array");

        if (length == 1) {
            return leaves[0];
        }

        bytes32[] memory currentLevel = leaves;

        while (currentLevel.length > 1) {
            uint256 nextLevelLength = (currentLevel.length + 1) / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelLength);

            for (uint256 i = 0; i < nextLevelLength; i++) {
                if (2 * i + 1 < currentLevel.length) {
                    // 两两哈希运算
                    nextLevel[i] = keccak256(abi.encodePacked(
                        currentLevel[2 * i],
                        currentLevel[2 * i + 1]
                    ));
                } else {
                    // 奇数个节点，最后一个节点直接上升
                    nextLevel[i] = currentLevel[2 * i];
                }
            }

            currentLevel = nextLevel;
        }

        return currentLevel[0];
    }

    /**
     * @dev 同步Merkle Root到目标链
     * 将得到的MerkleRoot同步到联盟侧链
     * @param studentId 学生ID
     * @param targetChain 目标链
     * @param blockchainID 区块链身份证
     */
    function syncToTargetChain(
        string memory studentId,
        string memory targetChain,
        string memory blockchainID
    ) external onlyAuthorizedSubmitter {
        require(bytes(studentId).length > 0, "Invalid student ID");
        require(bytes(targetChain).length > 0, "Invalid target chain");

        bytes32 merkleRoot = studentToRoot[studentId];
        require(merkleRoot != bytes32(0), "Student Merkle root not found");

        // 记录链间同步
        chainSyncRoots[studentId][targetChain] = merkleRoot;

        // 更新Merkle根信息
        uint256 newHeight = currentHeight + 1;
        merkleRoots[newHeight] = MerkleRootInfo({
            root: merkleRoot,
            blockHeight: newHeight,
            timestamp: block.timestamp,
            submitter: msg.sender,
            leafCount: studentDataNodes[studentId].length,
            isVerified: false,
            dataHash: string(abi.encodePacked("SYNC_", studentId)),
            sourceChain: "main",
            targetChain: targetChain,
            blockchainID: blockchainID
        });

        currentHeight = newHeight;
        totalRoots++;

        emit DataSynchronized(studentId, merkleRoot, targetChain, block.timestamp);
    }

    /**
     * @dev 检测数据篡改
     * 一旦学籍信息被篡改，Merkle Root也会随之改变
     * @param studentId 学生ID
     * @param expectedRoot 期望的Merkle Root
     * @return 是否被篡改
     */
    function detectTampering(
        string memory studentId,
        bytes32 expectedRoot
    ) external returns (bool) {
        bytes32 currentRoot = calculateStudentMerkleRoot(studentId);
        bool isTampered = currentRoot != expectedRoot;

        if (isTampered) {
            // 记录篡改检测
            tamperDetections[studentId] = TamperDetection({
                studentId: studentId,
                originalRoot: expectedRoot,
                currentRoot: currentRoot,
                isTampered: true,
                detectedAt: block.timestamp,
                tamperSource: locateTamperSource(studentId, expectedRoot, currentRoot)
            });

            emit TamperDetected(studentId, expectedRoot, currentRoot, block.timestamp);
        }

        return isTampered;
    }

    /**
     * @dev 定位篡改来源分支
     * 监管方能够通过Merkle Tree算法更加快速地定位被篡改数据来自哪一分支
     * @param studentId 学生ID
     * @param originalRoot 原始根
     * @param currentRoot 当前根
     * @return 篡改来源描述
     */
    function locateTamperSource(
        string memory studentId,
        bytes32 originalRoot,
        bytes32 currentRoot
    ) internal view returns (string memory) {
        // 简化实现：通过比较数据节点来定位篡改源
        StudentDataNode[] memory nodes = studentDataNodes[studentId];

        for (uint256 i = 0; i < nodes.length; i++) {
            // 这里应该实现更复杂的分支定位算法
            // 简化为返回可能的篡改机构
            if (keccak256(abi.encodePacked(nodes[i].institutionId)) !=
                keccak256(abi.encodePacked("verified"))) {
                return string(abi.encodePacked("Branch: ", nodes[i].institutionId,
                                             " (", nodes[i].nodeType, ")"));
            }
        }

        return "Unknown branch";
    }

    /**
     * @dev 验证学生学历信息
     * 当用人单位验证该学生的学历信息时，再使用同样的方法得到MerkleRoot，
     * 与分布式数据库可靠的值相比较，即可判断该学生的学历信息是否虚假或被篡改
     * @param studentId 学生ID
     * @param expectedBlockchainID 期望的区块链身份证
     * @return 验证结果
     */
    function verifyStudentCredentials(
        string memory studentId,
        string memory expectedBlockchainID
    ) external view returns (bool isValid, string memory message) {
        // 检查学生是否存在
        if (studentDataNodes[studentId].length == 0) {
            return (false, "Student not found");
        }

        // 获取当前区块链身份证
        string memory currentBlockchainID = studentToBlockchainID[studentId];

        // 比较区块链身份证
        if (keccak256(abi.encodePacked(currentBlockchainID)) !=
            keccak256(abi.encodePacked(expectedBlockchainID))) {
            return (false, "Blockchain ID mismatch - credentials may be tampered");
        }

        // 重新计算Merkle Root进行验证
        bytes32 calculatedRoot = calculateStudentMerkleRoot(studentId);
        bytes32 storedRoot = studentToRoot[studentId];

        if (calculatedRoot != storedRoot) {
            return (false, "Merkle root verification failed - data integrity compromised");
        }

        return (true, "Credentials verified successfully");
    }

    /**
     * @dev 生成区块链身份证
     * 该hash将成为用户"区块链身份证"的属性
     * @param studentId 学生ID
     * @param merkleRoot Merkle根
     * @return 区块链身份证
     */
    function generateBlockchainID(
        string memory studentId,
        bytes32 merkleRoot
    ) internal pure returns (string memory) {
        bytes32 idHash = keccak256(abi.encodePacked(
            "BLOCKCHAIN_ID_",
            studentId,
            merkleRoot,
            block.timestamp
        ));

        return toHexString(idHash);
    }

    /**
     * @dev 获取学生的所有数据节点
     * @param studentId 学生ID
     * @return 数据节点数组
     */
    function getStudentDataNodes(string memory studentId)
        external view returns (StudentDataNode[] memory) {
        return studentDataNodes[studentId];
    }

    /**
     * @dev 获取学生的区块链身份证
     * @param studentId 学生ID
     * @return 区块链身份证和Merkle根
     */
    function getStudentBlockchainID(string memory studentId)
        external view returns (string memory blockchainID, bytes32 merkleRoot) {
        return (studentToBlockchainID[studentId], studentToRoot[studentId]);
    }

    /**
     * @dev 获取篡改检测记录
     * @param studentId 学生ID
     * @return 篡改检测信息
     */
    function getTamperDetection(string memory studentId)
        external view returns (TamperDetection memory) {
        return tamperDetections[studentId];
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

    // 新增事件
    event DataSynchronized(
        string indexed studentId,
        bytes32 indexed merkleRoot,
        string targetChain,
        uint256 timestamp
    );

    event TamperDetected(
        string indexed studentId,
        bytes32 originalRoot,
        bytes32 currentRoot,
        uint256 timestamp
    );
}
