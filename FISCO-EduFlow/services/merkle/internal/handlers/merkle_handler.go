package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/blockchain-education-platform/merkle-service/internal/cache"
	"github.com/blockchain-education-platform/merkle-service/internal/merkle"
	"github.com/blockchain-education-platform/merkle-service/internal/types"
	"github.com/gin-gonic/gin"
)

// MerkleHandler Merkle树服务HTTP处理器
type MerkleHandler struct {
	merkleService *merkle.MerkleService
	cache         *cache.RedisCache
}

// NewMerkleHandler 创建新的Merkle处理器
func NewMerkleHandler(cache *cache.RedisCache) *MerkleHandler {
	return &MerkleHandler{
		merkleService: merkle.NewMerkleService(),
		cache:         cache,
	}
}

// Health 健康检查
func (h *MerkleHandler) Health(c *gin.Context) {
	cacheStatus, _ := h.cache.GetCacheStatus()
	
	response := types.HealthResponse{
		Status:    "healthy",
		Service:   "merkle-service",
		Version:   "1.0.0",
		Timestamp: time.Now().Unix(),
		Cache:     *cacheStatus,
	}
	c.JSON(http.StatusOK, response)
}

// BuildTree 构建Merkle树
func (h *MerkleHandler) BuildTree(c *gin.Context) {
	var req types.BuildRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 构建Merkle树
	tree, err := h.merkleService.BuildTree(req.Data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to build Merkle tree",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	// 生成树ID并缓存
	treeID := h.cache.GenerateTreeID(req.Data)
	if err := h.cache.StoreTree(treeID, tree); err != nil {
		// 缓存失败不影响响应，只记录日志
		fmt.Printf("Failed to cache tree: %v\n", err)
	}

	response := types.BuildResponse{
		Root:   tree.Root.Hash,
		Height: tree.Height,
		TreeID: treeID,
	}

	c.JSON(http.StatusOK, response)
}

// GenerateProof 生成Merkle证明
func (h *MerkleHandler) GenerateProof(c *gin.Context) {
	var req types.ProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	var tree *types.MerkleTree
	var err error

	// 尝试从缓存获取树
	if req.TreeID != "" {
		tree, err = h.cache.GetTree(req.TreeID)
		if err != nil && req.Data == nil {
			c.JSON(http.StatusNotFound, types.ErrorResponse{
				Error:   "Tree not found and no data provided",
				Code:    404,
				Message: err.Error(),
			})
			return
		}
	}

	// 如果缓存中没有树且提供了数据，则构建新树
	if tree == nil && req.Data != nil {
		tree, err = h.merkleService.BuildTree(req.Data)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   "Failed to build tree",
				Code:    500,
				Message: err.Error(),
			})
			return
		}
	}

	if tree == nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "No tree available",
			Code:    400,
			Message: "Either provide tree_id or data",
		})
		return
	}

	// 生成证明
	var proof *types.MerkleProof
	if req.LeafIndex >= 0 {
		proof, err = h.merkleService.GenerateProofByIndex(tree, req.LeafIndex)
	} else {
		proof, err = h.merkleService.GenerateProof(tree, req.LeafHash)
	}

	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Failed to generate proof",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	response := types.ProofResponse{
		Proof: *proof,
	}

	c.JSON(http.StatusOK, response)
}

// VerifyProof 验证Merkle证明
func (h *MerkleHandler) VerifyProof(c *gin.Context) {
	var req types.VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 验证证明
	valid := h.merkleService.VerifyProof(&req.Proof)

	response := types.VerifyResponse{
		Valid: valid,
	}

	c.JSON(http.StatusOK, response)
}

// BatchBuild 批量构建Merkle树
func (h *MerkleHandler) BatchBuild(c *gin.Context) {
	var req types.BatchBuildRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	results := make([]types.BuildResponse, len(req.Batches))

	for i, batch := range req.Batches {
		// 构建树
		tree, err := h.merkleService.BuildTree(batch.Data)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{
				Error:   fmt.Sprintf("Failed to build tree %d", i),
				Code:    500,
				Message: err.Error(),
			})
			return
		}

		// 生成树ID并缓存
		treeID := h.cache.GenerateTreeID(batch.Data)
		if err := h.cache.StoreTree(treeID, tree); err != nil {
			fmt.Printf("Failed to cache tree %d: %v\n", i, err)
		}

		results[i] = types.BuildResponse{
			Root:   tree.Root.Hash,
			Height: tree.Height,
			TreeID: treeID,
		}
	}

	response := types.BatchBuildResponse{
		Results: results,
	}

	c.JSON(http.StatusOK, response)
}

// GetTreeInfo 获取树信息
func (h *MerkleHandler) GetTreeInfo(c *gin.Context) {
	var req types.TreeInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 从缓存获取树
	tree, err := h.cache.GetTree(req.TreeID)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Tree not found",
			Code:    404,
			Message: err.Error(),
		})
		return
	}

	response := types.TreeInfoResponse{
		Tree:   *tree,
		Cached: true,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateTree 更新Merkle树
func (h *MerkleHandler) UpdateTree(c *gin.Context) {
	var req types.UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 获取原始树
	oldTree, err := h.cache.GetTree(req.TreeID)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Tree not found",
			Code:    404,
			Message: err.Error(),
		})
		return
	}

	// 更新树
	newTree, err := h.merkleService.UpdateTree(oldTree, req.NewData, req.Method)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Failed to update tree",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 更新缓存
	if err := h.cache.StoreTree(req.TreeID, newTree); err != nil {
		fmt.Printf("Failed to update cached tree: %v\n", err)
	}

	response := types.UpdateResponse{
		OldRoot: oldTree.Root.Hash,
		NewRoot: newTree.Root.Hash,
		TreeID:  req.TreeID,
	}

	c.JSON(http.StatusOK, response)
}

// CompareTrees 比较两个Merkle树
func (h *MerkleHandler) CompareTrees(c *gin.Context) {
	var req types.CompareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 获取两个树
	tree1, err := h.cache.GetTree(req.TreeID1)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Tree 1 not found",
			Code:    404,
			Message: err.Error(),
		})
		return
	}

	tree2, err := h.cache.GetTree(req.TreeID2)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Tree 2 not found",
			Code:    404,
			Message: err.Error(),
		})
		return
	}

	// 比较树
	same, differences := h.merkleService.CompareTrees(tree1, tree2)

	response := types.CompareResponse{
		Same:        same,
		Differences: differences,
	}

	c.JSON(http.StatusOK, response)
}

// GetStatistics 获取统计信息
func (h *MerkleHandler) GetStatistics(c *gin.Context) {
	stats, err := h.cache.GetStatistics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to get statistics",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}
