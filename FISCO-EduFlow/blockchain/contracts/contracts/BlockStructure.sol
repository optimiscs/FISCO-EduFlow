// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BlockStructure
 * @dev 定义符合要求的区块结构
 * 区块头：32字节上一区块哈希 + 32字节Merkle根 + 4字节时间戳 + 4字节难度值 + 4字节随机数
 * 区块体：交易列表
 * @author XueLianTong Team
 */
contract BlockStructure {
    
    // 区块头结构 (总共76字节)
    struct BlockHeader {
        bytes32 previousBlockHash;  // 32字节：上一个区块的哈希值
        bytes32 merkleRoot;         // 32字节：Merkle根哈希值
        uint32 timestamp;           // 4字节：时间戳（当前时间）
        uint32 difficulty;          // 4字节：当前难度值
        uint32 nonce;              // 4字节：随机数
    }
    
    // 交易结构
    struct Transaction {
        address from;               // 发送方地址
        address to;                 // 接收方地址
        uint256 value;             // 交易金额
        bytes data;                // 交易数据
        uint256 gasLimit;          // Gas限制
        uint256 gasPrice;          // Gas价格
        uint256 nonce;             // 交易nonce
        bytes signature;           // 数字签名
        bytes32 txHash;            // 交易哈希
        uint32 timestamp;          // 交易时间戳
        string txType;             // 交易类型（学历认证、查询等）
    }
    
    // 区块结构
    struct Block {
        BlockHeader header;         // 区块头
        Transaction[] transactions; // 交易列表（区块体）
        uint256 blockNumber;       // 区块号
        bytes32 blockHash;         // 区块哈希
        uint256 gasUsed;           // 已使用Gas
        uint256 gasLimit;          // Gas限制
        address miner;             // 矿工地址
        uint256 size;              // 区块大小
    }
    
    // 学历认证交易特定数据结构
    struct EducationTransaction {
        string studentId;           // 学生ID
        string institutionId;       // 机构ID
        string certificateType;     // 证书类型
        string certificateData;     // 证书数据
        bytes32 dataHash;          // 数据哈希
        string operation;          // 操作类型（录入、查询、验证）
        uint256 fee;               // 认证费用
        bool isVerified;           // 是否已验证
    }
    
    // 存储区块链数据
    mapping(uint256 => Block) public blocks;
    mapping(bytes32 => bool) public blockExists;
    mapping(bytes32 => Transaction) public transactions;
    
    // 当前区块链状态
    uint256 public currentBlockNumber;
    bytes32 public latestBlockHash;
    uint256 public totalDifficulty;
    
    // 事件定义
    event BlockMined(
        uint256 indexed blockNumber,
        bytes32 indexed blockHash,
        address indexed miner,
        uint256 timestamp
    );
    
    event TransactionAdded(
        bytes32 indexed txHash,
        address indexed from,
        address indexed to,
        uint256 value,
        string txType
    );
    
    event EducationCertificateRecorded(
        string indexed studentId,
        string indexed institutionId,
        string certificateType,
        bytes32 dataHash
    );
    
    /**
     * @dev 创建新区块
     * @param _previousBlockHash 上一个区块哈希
     * @param _transactions 交易列表
     * @param _difficulty 难度值
     * @param _nonce 随机数
     */
    function createBlock(
        bytes32 _previousBlockHash,
        Transaction[] memory _transactions,
        uint32 _difficulty,
        uint32 _nonce
    ) external returns (bytes32 blockHash) {
        
        // 计算Merkle根
        bytes32 merkleRoot = calculateMerkleRoot(_transactions);
        
        // 创建区块头
        BlockHeader memory header = BlockHeader({
            previousBlockHash: _previousBlockHash,
            merkleRoot: merkleRoot,
            timestamp: uint32(block.timestamp),
            difficulty: _difficulty,
            nonce: _nonce
        });
        
        // 计算区块哈希
        blockHash = calculateBlockHash(header);
        
        // 创建区块
        Block storage newBlock = blocks[currentBlockNumber + 1];
        newBlock.header = header;
        newBlock.blockNumber = currentBlockNumber + 1;
        newBlock.blockHash = blockHash;
        newBlock.miner = msg.sender;
        newBlock.gasUsed = 0;
        newBlock.gasLimit = block.gaslimit;
        
        // 添加交易到区块
        for (uint i = 0; i < _transactions.length; i++) {
            newBlock.transactions.push(_transactions[i]);
            transactions[_transactions[i].txHash] = _transactions[i];
            newBlock.gasUsed += _transactions[i].gasLimit;
            
            emit TransactionAdded(
                _transactions[i].txHash,
                _transactions[i].from,
                _transactions[i].to,
                _transactions[i].value,
                _transactions[i].txType
            );
        }
        
        // 更新区块链状态
        currentBlockNumber++;
        latestBlockHash = blockHash;
        blockExists[blockHash] = true;
        
        emit BlockMined(currentBlockNumber, blockHash, msg.sender, block.timestamp);
        
        return blockHash;
    }
    
    /**
     * @dev 计算区块哈希（基于区块头）
     * @param header 区块头
     * @return 区块哈希
     */
    function calculateBlockHash(BlockHeader memory header) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            header.previousBlockHash,
            header.merkleRoot,
            header.timestamp,
            header.difficulty,
            header.nonce
        ));
    }
    
    /**
     * @dev 计算交易的Merkle根
     * @param _transactions 交易数组
     * @return Merkle根哈希
     */
    function calculateMerkleRoot(Transaction[] memory _transactions) public pure returns (bytes32) {
        if (_transactions.length == 0) {
            return bytes32(0);
        }
        
        if (_transactions.length == 1) {
            return _transactions[0].txHash;
        }
        
        // 构建Merkle树
        bytes32[] memory hashes = new bytes32[](_transactions.length);
        for (uint i = 0; i < _transactions.length; i++) {
            hashes[i] = _transactions[i].txHash;
        }
        
        return _buildMerkleTree(hashes);
    }
    
    /**
     * @dev 构建Merkle树
     * @param hashes 哈希数组
     * @return 根哈希
     */
    function _buildMerkleTree(bytes32[] memory hashes) internal pure returns (bytes32) {
        uint256 length = hashes.length;
        
        while (length > 1) {
            uint256 newLength = (length + 1) / 2;
            bytes32[] memory newHashes = new bytes32[](newLength);
            
            for (uint256 i = 0; i < newLength; i++) {
                if (2 * i + 1 < length) {
                    newHashes[i] = keccak256(abi.encodePacked(hashes[2 * i], hashes[2 * i + 1]));
                } else {
                    newHashes[i] = hashes[2 * i];
                }
            }
            
            hashes = newHashes;
            length = newLength;
        }
        
        return hashes[0];
    }
    
    /**
     * @dev 创建学历认证交易
     * @param studentId 学生ID
     * @param institutionId 机构ID
     * @param certificateType 证书类型
     * @param certificateData 证书数据
     * @param operation 操作类型
     * @param fee 认证费用
     */
    function createEducationTransaction(
        string memory studentId,
        string memory institutionId,
        string memory certificateType,
        string memory certificateData,
        string memory operation,
        uint256 fee
    ) external returns (bytes32 txHash) {
        
        // 计算数据哈希
        bytes32 dataHash = keccak256(abi.encodePacked(
            studentId,
            institutionId,
            certificateType,
            certificateData
        ));
        
        // 创建交易数据
        EducationTransaction memory eduTx = EducationTransaction({
            studentId: studentId,
            institutionId: institutionId,
            certificateType: certificateType,
            certificateData: certificateData,
            dataHash: dataHash,
            operation: operation,
            fee: fee,
            isVerified: false
        });
        
        // 编码交易数据
        bytes memory txData = abi.encode(eduTx);
        
        // 计算交易哈希
        txHash = keccak256(abi.encodePacked(
            msg.sender,
            address(this),
            fee,
            txData,
            block.timestamp,
            operation
        ));
        
        // 创建交易
        Transaction memory transaction = Transaction({
            from: msg.sender,
            to: address(this),
            value: fee,
            data: txData,
            gasLimit: 100000,
            gasPrice: tx.gasprice,
            nonce: 0,
            signature: "",
            txHash: txHash,
            timestamp: uint32(block.timestamp),
            txType: operation
        });
        
        // 存储交易
        transactions[txHash] = transaction;
        
        emit EducationCertificateRecorded(
            studentId,
            institutionId,
            certificateType,
            dataHash
        );
        
        return txHash;
    }
    
    /**
     * @dev 验证区块
     * @param blockNumber 区块号
     * @return 是否有效
     */
    function validateBlock(uint256 blockNumber) external view returns (bool) {
        if (blockNumber > currentBlockNumber || blockNumber == 0) {
            return false;
        }
        
        Block storage blockToValidate = blocks[blockNumber];
        
        // 验证区块哈希
        bytes32 calculatedHash = calculateBlockHash(blockToValidate.header);
        if (calculatedHash != blockToValidate.blockHash) {
            return false;
        }
        
        // 验证Merkle根
        bytes32 calculatedMerkleRoot = calculateMerkleRoot(blockToValidate.transactions);
        if (calculatedMerkleRoot != blockToValidate.header.merkleRoot) {
            return false;
        }
        
        // 验证前一个区块哈希
        if (blockNumber > 1) {
            if (blockToValidate.header.previousBlockHash != blocks[blockNumber - 1].blockHash) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev 获取区块信息
     * @param blockNumber 区块号
     * @return 区块信息
     */
    function getBlock(uint256 blockNumber) external view returns (
        bytes32 blockHash,
        bytes32 previousBlockHash,
        bytes32 merkleRoot,
        uint32 timestamp,
        uint32 difficulty,
        uint32 nonce,
        uint256 transactionCount
    ) {
        require(blockNumber <= currentBlockNumber && blockNumber > 0, "Invalid block number");
        
        Block storage blockData = blocks[blockNumber];
        return (
            blockData.blockHash,
            blockData.header.previousBlockHash,
            blockData.header.merkleRoot,
            blockData.header.timestamp,
            blockData.header.difficulty,
            blockData.header.nonce,
            blockData.transactions.length
        );
    }
    
    /**
     * @dev 获取交易信息
     * @param txHash 交易哈希
     * @return 交易信息
     */
    function getTransaction(bytes32 txHash) external view returns (
        address from,
        address to,
        uint256 value,
        string memory txType,
        uint32 timestamp,
        bool exists
    ) {
        Transaction storage tx = transactions[txHash];
        return (
            tx.from,
            tx.to,
            tx.value,
            tx.txType,
            tx.timestamp,
            tx.from != address(0)
        );
    }
    
    /**
     * @dev 获取区块链统计信息
     */
    function getChainStats() external view returns (
        uint256 totalBlocks,
        bytes32 latestHash,
        uint256 totalTxs,
        uint256 avgBlockTime
    ) {
        totalBlocks = currentBlockNumber;
        latestHash = latestBlockHash;
        
        // 计算总交易数
        uint256 txCount = 0;
        for (uint256 i = 1; i <= currentBlockNumber; i++) {
            txCount += blocks[i].transactions.length;
        }
        totalTxs = txCount;
        
        // 计算平均出块时间
        if (currentBlockNumber > 1) {
            uint256 totalTime = blocks[currentBlockNumber].header.timestamp - blocks[1].header.timestamp;
            avgBlockTime = totalTime / (currentBlockNumber - 1);
        } else {
            avgBlockTime = 0;
        }
        
        return (totalBlocks, latestHash, totalTxs, avgBlockTime);
    }
}
