package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/blockchain-education-platform/merkle-service/internal/types"
	"github.com/go-redis/redis/v8"
)

// RedisCache Redis缓存服务
type RedisCache struct {
	client *redis.Client
	ctx    context.Context
}

// NewRedisCache 创建新的Redis缓存实例
func NewRedisCache(addr, password string, db int) *RedisCache {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &RedisCache{
		client: rdb,
		ctx:    context.Background(),
	}
}

// Connect 连接到Redis
func (r *RedisCache) Connect() error {
	_, err := r.client.Ping(r.ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}
	return nil
}

// Close 关闭Redis连接
func (r *RedisCache) Close() error {
	return r.client.Close()
}

// StoreTree 存储Merkle树
func (r *RedisCache) StoreTree(treeID string, tree *types.MerkleTree) error {
	data, err := json.Marshal(tree)
	if err != nil {
		return fmt.Errorf("failed to marshal tree: %w", err)
	}

	key := r.getTreeKey(treeID)
	err = r.client.Set(r.ctx, key, data, 24*time.Hour).Err()
	if err != nil {
		return fmt.Errorf("failed to store tree in Redis: %w", err)
	}

	// 存储元数据
	metadata := &types.TreeMetadata{
		TreeID:    treeID,
		Root:      tree.Root.Hash,
		Height:    tree.Height,
		LeafCount: len(tree.Leaves),
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	return r.StoreMetadata(treeID, metadata)
}

// GetTree 获取Merkle树
func (r *RedisCache) GetTree(treeID string) (*types.MerkleTree, error) {
	key := r.getTreeKey(treeID)
	data, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("tree not found: %s", treeID)
		}
		return nil, fmt.Errorf("failed to get tree from Redis: %w", err)
	}

	var tree types.MerkleTree
	err = json.Unmarshal([]byte(data), &tree)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal tree: %w", err)
	}

	return &tree, nil
}

// StoreMetadata 存储树的元数据
func (r *RedisCache) StoreMetadata(treeID string, metadata *types.TreeMetadata) error {
	data, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	key := r.getMetadataKey(treeID)
	err = r.client.Set(r.ctx, key, data, 24*time.Hour).Err()
	if err != nil {
		return fmt.Errorf("failed to store metadata in Redis: %w", err)
	}

	// 添加到树列表
	listKey := r.getTreeListKey()
	err = r.client.SAdd(r.ctx, listKey, treeID).Err()
	if err != nil {
		return fmt.Errorf("failed to add tree to list: %w", err)
	}

	return nil
}

// GetMetadata 获取树的元数据
func (r *RedisCache) GetMetadata(treeID string) (*types.TreeMetadata, error) {
	key := r.getMetadataKey(treeID)
	data, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("metadata not found: %s", treeID)
		}
		return nil, fmt.Errorf("failed to get metadata from Redis: %w", err)
	}

	var metadata types.TreeMetadata
	err = json.Unmarshal([]byte(data), &metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
	}

	return &metadata, nil
}

// DeleteTree 删除Merkle树
func (r *RedisCache) DeleteTree(treeID string) error {
	// 删除树数据
	treeKey := r.getTreeKey(treeID)
	err := r.client.Del(r.ctx, treeKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete tree: %w", err)
	}

	// 删除元数据
	metadataKey := r.getMetadataKey(treeID)
	err = r.client.Del(r.ctx, metadataKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete metadata: %w", err)
	}

	// 从树列表中移除
	listKey := r.getTreeListKey()
	err = r.client.SRem(r.ctx, listKey, treeID).Err()
	if err != nil {
		return fmt.Errorf("failed to remove tree from list: %w", err)
	}

	return nil
}

// TreeExists 检查树是否存在
func (r *RedisCache) TreeExists(treeID string) (bool, error) {
	key := r.getTreeKey(treeID)
	exists, err := r.client.Exists(r.ctx, key).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check tree existence: %w", err)
	}
	return exists > 0, nil
}

// ListTrees 列出所有树
func (r *RedisCache) ListTrees() ([]string, error) {
	key := r.getTreeListKey()
	trees, err := r.client.SMembers(r.ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to list trees: %w", err)
	}
	return trees, nil
}

// GetStatistics 获取缓存统计信息
func (r *RedisCache) GetStatistics() (*types.StatisticsResponse, error) {
	// 获取所有树的数量
	listKey := r.getTreeListKey()
	totalTrees, err := r.client.SCard(r.ctx, listKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get total trees: %w", err)
	}

	// 获取所有树的元数据来计算统计信息
	trees, err := r.ListTrees()
	if err != nil {
		return nil, fmt.Errorf("failed to list trees: %w", err)
	}

	var totalNodes int64
	var totalHeight int64
	var largestTree int

	for _, treeID := range trees {
		metadata, err := r.GetMetadata(treeID)
		if err != nil {
			continue // 跳过错误的元数据
		}

		// 估算节点数量（完全二叉树的近似值）
		estimatedNodes := int64(2*metadata.LeafCount - 1)
		totalNodes += estimatedNodes
		totalHeight += int64(metadata.Height)

		if metadata.LeafCount > largestTree {
			largestTree = metadata.LeafCount
		}
	}

	var averageHeight float64
	if totalTrees > 0 {
		averageHeight = float64(totalHeight) / float64(totalTrees)
	}

	return &types.StatisticsResponse{
		TotalTrees:    totalTrees,
		TotalNodes:    totalNodes,
		TotalProofs:   0, // 这里可以添加证明计数器
		CacheHitRate:  0, // 这里可以添加命中率统计
		AverageHeight: averageHeight,
		LargestTree:   largestTree,
	}, nil
}

// GetCacheStatus 获取缓存状态
func (r *RedisCache) GetCacheStatus() (*types.CacheStatus, error) {
	// 检查连接状态
	_, err := r.client.Ping(r.ctx).Result()
	connected := err == nil

	// 获取键的数量
	keys := int64(0)
	if connected {
		info, err := r.client.Info(r.ctx, "keyspace").Result()
		if err == nil {
			// 解析keyspace信息来获取键的数量
			// 这里简化处理，实际应该解析info字符串
			keys = 0
		}
	}

	return &types.CacheStatus{
		Connected: connected,
		Keys:      int(keys),
		Memory:    "", // 可以添加内存使用信息
	}, nil
}

// UpdateTreeMetadata 更新树的元数据
func (r *RedisCache) UpdateTreeMetadata(treeID string, tree *types.MerkleTree) error {
	metadata, err := r.GetMetadata(treeID)
	if err != nil {
		// 如果元数据不存在，创建新的
		metadata = &types.TreeMetadata{
			TreeID:    treeID,
			CreatedAt: time.Now().Unix(),
		}
	}

	// 更新元数据
	metadata.Root = tree.Root.Hash
	metadata.Height = tree.Height
	metadata.LeafCount = len(tree.Leaves)
	metadata.UpdatedAt = time.Now().Unix()

	return r.StoreMetadata(treeID, metadata)
}

// 私有方法：生成键名
func (r *RedisCache) getTreeKey(treeID string) string {
	return fmt.Sprintf("merkle:tree:%s", treeID)
}

func (r *RedisCache) getMetadataKey(treeID string) string {
	return fmt.Sprintf("merkle:metadata:%s", treeID)
}

func (r *RedisCache) getTreeListKey() string {
	return "merkle:trees"
}

// GenerateTreeID 生成树ID
func (r *RedisCache) GenerateTreeID(data []string) string {
	// 使用数据的哈希作为树ID
	content := ""
	for _, item := range data {
		content += item
	}
	
	// 简单的哈希生成（实际应该使用更好的方法）
	return fmt.Sprintf("tree_%x", len(content))
}
