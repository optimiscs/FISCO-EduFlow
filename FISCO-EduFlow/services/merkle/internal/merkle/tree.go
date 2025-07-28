package merkle

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math"

	"github.com/blockchain-education-platform/merkle-service/internal/types"
)

// MerkleService Merkle树服务
type MerkleService struct{}

// NewMerkleService 创建新的Merkle树服务实例
func NewMerkleService() *MerkleService {
	return &MerkleService{}
}

// BuildTree 构建Merkle树
func (s *MerkleService) BuildTree(data []string) (*types.MerkleTree, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("data cannot be empty")
	}

	// 创建叶子节点
	leaves := make([]*types.MerkleNode, len(data))
	for i, item := range data {
		hash := s.hash(item)
		leaves[i] = &types.MerkleNode{
			Hash:   hash,
			IsLeaf: true,
			Data:   item,
		}
	}

	// 构建树
	root := s.buildTreeRecursive(leaves)
	height := s.calculateHeight(root)

	return &types.MerkleTree{
		Root:   root,
		Leaves: data,
		Height: height,
	}, nil
}

// buildTreeRecursive 递归构建Merkle树
func (s *MerkleService) buildTreeRecursive(nodes []*types.MerkleNode) *types.MerkleNode {
	if len(nodes) == 1 {
		return nodes[0]
	}

	var nextLevel []*types.MerkleNode

	// 两两配对构建上一层节点
	for i := 0; i < len(nodes); i += 2 {
		left := nodes[i]
		var right *types.MerkleNode

		if i+1 < len(nodes) {
			right = nodes[i+1]
		} else {
			// 如果节点数为奇数，复制最后一个节点
			right = &types.MerkleNode{
				Hash:   left.Hash,
				IsLeaf: left.IsLeaf,
				Data:   left.Data,
			}
		}

		// 创建父节点
		parentHash := s.hash(left.Hash + right.Hash)
		parent := &types.MerkleNode{
			Hash:   parentHash,
			Left:   left,
			Right:  right,
			IsLeaf: false,
		}

		nextLevel = append(nextLevel, parent)
	}

	return s.buildTreeRecursive(nextLevel)
}

// GenerateProof 生成Merkle证明
func (s *MerkleService) GenerateProof(tree *types.MerkleTree, leafHash string) (*types.MerkleProof, error) {
	// 找到叶子节点的索引
	leafIndex := -1
	for i, leaf := range tree.Leaves {
		if s.hash(leaf) == leafHash {
			leafIndex = i
			break
		}
	}

	if leafIndex == -1 {
		return nil, fmt.Errorf("leaf hash not found in tree")
	}

	return s.GenerateProofByIndex(tree, leafIndex)
}

// GenerateProofByIndex 根据索引生成Merkle证明
func (s *MerkleService) GenerateProofByIndex(tree *types.MerkleTree, leafIndex int) (*types.MerkleProof, error) {
	if leafIndex < 0 || leafIndex >= len(tree.Leaves) {
		return nil, fmt.Errorf("invalid leaf index: %d", leafIndex)
	}

	leafHash := s.hash(tree.Leaves[leafIndex])
	proof := []string{}
	directions := []bool{}

	// 从叶子节点开始向上遍历
	currentIndex := leafIndex
	currentLevel := s.getLeafNodes(tree)

	for len(currentLevel) > 1 {
		// 找到兄弟节点
		var siblingHash string
		var isRight bool

		if currentIndex%2 == 0 {
			// 当前节点是左子节点，兄弟节点在右侧
			if currentIndex+1 < len(currentLevel) {
				siblingHash = currentLevel[currentIndex+1].Hash
			} else {
				siblingHash = currentLevel[currentIndex].Hash // 复制自己
			}
			isRight = true
		} else {
			// 当前节点是右子节点，兄弟节点在左侧
			siblingHash = currentLevel[currentIndex-1].Hash
			isRight = false
		}

		proof = append(proof, siblingHash)
		directions = append(directions, isRight)

		// 移动到下一层
		currentIndex = currentIndex / 2
		currentLevel = s.getParentLevel(currentLevel)
	}

	return &types.MerkleProof{
		LeafHash:   leafHash,
		LeafIndex:  leafIndex,
		Proof:      proof,
		Directions: directions,
		Root:       tree.Root.Hash,
	}, nil
}

// VerifyProof 验证Merkle证明
func (s *MerkleService) VerifyProof(proof *types.MerkleProof) bool {
	if len(proof.Proof) != len(proof.Directions) {
		return false
	}

	currentHash := proof.LeafHash

	// 沿着证明路径重新计算根哈希
	for i, siblingHash := range proof.Proof {
		if proof.Directions[i] {
			// 兄弟节点在右侧
			currentHash = s.hash(currentHash + siblingHash)
		} else {
			// 兄弟节点在左侧
			currentHash = s.hash(siblingHash + currentHash)
		}
	}

	return currentHash == proof.Root
}

// UpdateTree 更新Merkle树
func (s *MerkleService) UpdateTree(tree *types.MerkleTree, newData []string, method string) (*types.MerkleTree, error) {
	var updatedData []string

	switch method {
	case "append":
		updatedData = append(tree.Leaves, newData...)
	case "replace":
		updatedData = newData
	default:
		return nil, fmt.Errorf("invalid update method: %s", method)
	}

	return s.BuildTree(updatedData)
}

// CompareTrees 比较两个Merkle树
func (s *MerkleService) CompareTrees(tree1, tree2 *types.MerkleTree) (bool, []string) {
	if tree1.Root.Hash == tree2.Root.Hash {
		return true, nil
	}

	// 找出不同的叶子节点
	differences := []string{}
	
	// 创建第一个树的叶子哈希集合
	tree1Hashes := make(map[string]bool)
	for _, leaf := range tree1.Leaves {
		tree1Hashes[s.hash(leaf)] = true
	}

	// 检查第二个树中的叶子节点
	for _, leaf := range tree2.Leaves {
		leafHash := s.hash(leaf)
		if !tree1Hashes[leafHash] {
			differences = append(differences, leaf)
		}
	}

	// 检查第一个树中第二个树没有的叶子节点
	tree2Hashes := make(map[string]bool)
	for _, leaf := range tree2.Leaves {
		tree2Hashes[s.hash(leaf)] = true
	}

	for _, leaf := range tree1.Leaves {
		leafHash := s.hash(leaf)
		if !tree2Hashes[leafHash] {
			differences = append(differences, leaf)
		}
	}

	return false, differences
}

// GetTreeInfo 获取树的详细信息
func (s *MerkleService) GetTreeInfo(tree *types.MerkleTree) map[string]interface{} {
	return map[string]interface{}{
		"root":       tree.Root.Hash,
		"height":     tree.Height,
		"leaf_count": len(tree.Leaves),
		"node_count": s.countNodes(tree.Root),
	}
}

// hash 计算SHA256哈希
func (s *MerkleService) hash(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// calculateHeight 计算树的高度
func (s *MerkleService) calculateHeight(node *types.MerkleNode) int {
	if node == nil {
		return 0
	}

	if node.IsLeaf {
		return 1
	}

	leftHeight := s.calculateHeight(node.Left)
	rightHeight := s.calculateHeight(node.Right)

	return int(math.Max(float64(leftHeight), float64(rightHeight))) + 1
}

// getLeafNodes 获取所有叶子节点
func (s *MerkleService) getLeafNodes(tree *types.MerkleTree) []*types.MerkleNode {
	var leaves []*types.MerkleNode
	s.collectLeaves(tree.Root, &leaves)
	return leaves
}

// collectLeaves 递归收集叶子节点
func (s *MerkleService) collectLeaves(node *types.MerkleNode, leaves *[]*types.MerkleNode) {
	if node == nil {
		return
	}

	if node.IsLeaf {
		*leaves = append(*leaves, node)
		return
	}

	s.collectLeaves(node.Left, leaves)
	s.collectLeaves(node.Right, leaves)
}

// getParentLevel 获取父级层的节点
func (s *MerkleService) getParentLevel(currentLevel []*types.MerkleNode) []*types.MerkleNode {
	if len(currentLevel) <= 1 {
		return currentLevel
	}

	var parentLevel []*types.MerkleNode
	for i := 0; i < len(currentLevel); i += 2 {
		left := currentLevel[i]
		var right *types.MerkleNode

		if i+1 < len(currentLevel) {
			right = currentLevel[i+1]
		} else {
			right = left // 复制左节点
		}

		parentHash := s.hash(left.Hash + right.Hash)
		parent := &types.MerkleNode{
			Hash:   parentHash,
			Left:   left,
			Right:  right,
			IsLeaf: false,
		}

		parentLevel = append(parentLevel, parent)
	}

	return parentLevel
}

// countNodes 计算节点总数
func (s *MerkleService) countNodes(node *types.MerkleNode) int {
	if node == nil {
		return 0
	}

	return 1 + s.countNodes(node.Left) + s.countNodes(node.Right)
}
