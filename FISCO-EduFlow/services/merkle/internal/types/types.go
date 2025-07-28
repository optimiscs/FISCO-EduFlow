package types

// MerkleNode Merkle树节点
type MerkleNode struct {
	Hash   string      `json:"hash"`
	Left   *MerkleNode `json:"left,omitempty"`
	Right  *MerkleNode `json:"right,omitempty"`
	IsLeaf bool        `json:"is_leaf"`
	Data   string      `json:"data,omitempty"` // 仅叶子节点有数据
}

// MerkleTree Merkle树结构
type MerkleTree struct {
	Root   *MerkleNode `json:"root"`
	Leaves []string    `json:"leaves"`
	Height int         `json:"height"`
}

// MerkleProof Merkle证明
type MerkleProof struct {
	LeafHash   string   `json:"leaf_hash"`
	LeafIndex  int      `json:"leaf_index"`
	Proof      []string `json:"proof"`
	Directions []bool   `json:"directions"` // true表示右侧，false表示左侧
	Root       string   `json:"root"`
}

// BuildRequest 构建Merkle树请求
type BuildRequest struct {
	Data []string `json:"data" binding:"required,min=1"`
}

// BuildResponse 构建Merkle树响应
type BuildResponse struct {
	Root   string `json:"root"`
	Height int    `json:"height"`
	TreeID string `json:"tree_id"` // 用于缓存的树ID
}

// ProofRequest 生成Merkle证明请求
type ProofRequest struct {
	TreeID    string `json:"tree_id,omitempty"`
	Data      []string `json:"data,omitempty"`
	LeafHash  string `json:"leaf_hash" binding:"required"`
	LeafIndex int    `json:"leaf_index,omitempty"`
}

// ProofResponse 生成Merkle证明响应
type ProofResponse struct {
	Proof MerkleProof `json:"proof"`
}

// VerifyRequest 验证Merkle证明请求
type VerifyRequest struct {
	Proof MerkleProof `json:"proof" binding:"required"`
}

// VerifyResponse 验证Merkle证明响应
type VerifyResponse struct {
	Valid bool `json:"valid"`
}

// BatchBuildRequest 批量构建请求
type BatchBuildRequest struct {
	Batches []BuildRequest `json:"batches" binding:"required,min=1"`
}

// BatchBuildResponse 批量构建响应
type BatchBuildResponse struct {
	Results []BuildResponse `json:"results"`
}

// TreeInfoRequest 获取树信息请求
type TreeInfoRequest struct {
	TreeID string `json:"tree_id" binding:"required"`
}

// TreeInfoResponse 获取树信息响应
type TreeInfoResponse struct {
	Tree   MerkleTree `json:"tree"`
	Cached bool       `json:"cached"`
}

// UpdateRequest 更新Merkle树请求
type UpdateRequest struct {
	TreeID  string   `json:"tree_id" binding:"required"`
	NewData []string `json:"new_data" binding:"required,min=1"`
	Method  string   `json:"method"` // "append" 或 "replace"
}

// UpdateResponse 更新Merkle树响应
type UpdateResponse struct {
	OldRoot string `json:"old_root"`
	NewRoot string `json:"new_root"`
	TreeID  string `json:"tree_id"`
}

// CompareRequest 比较两个Merkle树请求
type CompareRequest struct {
	TreeID1 string `json:"tree_id_1" binding:"required"`
	TreeID2 string `json:"tree_id_2" binding:"required"`
}

// CompareResponse 比较两个Merkle树响应
type CompareResponse struct {
	Same        bool     `json:"same"`
	Differences []string `json:"differences,omitempty"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Version   string `json:"version"`
	Timestamp int64  `json:"timestamp"`
	Cache     CacheStatus `json:"cache"`
}

// CacheStatus 缓存状态
type CacheStatus struct {
	Connected bool   `json:"connected"`
	Keys      int    `json:"keys"`
	Memory    string `json:"memory,omitempty"`
}

// StatisticsResponse 统计信息响应
type StatisticsResponse struct {
	TotalTrees     int64 `json:"total_trees"`
	TotalNodes     int64 `json:"total_nodes"`
	TotalProofs    int64 `json:"total_proofs"`
	CacheHitRate   float64 `json:"cache_hit_rate"`
	AverageHeight  float64 `json:"average_height"`
	LargestTree    int   `json:"largest_tree"`
}

// TreeMetadata 树的元数据
type TreeMetadata struct {
	TreeID    string `json:"tree_id"`
	Root      string `json:"root"`
	Height    int    `json:"height"`
	LeafCount int    `json:"leaf_count"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}
