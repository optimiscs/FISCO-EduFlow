package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/blockchain-education-platform/zkp-service/internal/types"
	"github.com/blockchain-education-platform/zkp-service/internal/zkp"
	"github.com/gin-gonic/gin"
)

// ZKPHandler ZKP服务HTTP处理器
type ZKPHandler struct {
	proverService *zkp.ProverService
}

// NewZKPHandler 创建新的ZKP处理器
func NewZKPHandler() *ZKPHandler {
	return &ZKPHandler{
		proverService: zkp.NewProverService(),
	}
}

// Health 健康检查
func (h *ZKPHandler) Health(c *gin.Context) {
	circuits := make(map[types.CircuitType]string)
	supportedCircuits := h.proverService.GetSupportedCircuits()
	
	for _, circuitType := range supportedCircuits {
		circuits[circuitType] = "ready"
	}
	
	response := types.HealthResponse{
		Status:    "healthy",
		Service:   "zkp-service",
		Version:   "1.0.0",
		Timestamp: time.Now().Unix(),
		Circuits:  circuits,
		Performance: types.PerformanceMetrics{
			TotalProofs:   0, // 这里可以添加实际统计
			ActiveProofs:  0,
			AvgGenTime:    0,
			AvgVerifyTime: 0,
			MemoryUsage:   "N/A",
			CPUUsage:      "N/A",
		},
	}
	c.JSON(http.StatusOK, response)
}

// GenerateProof 生成零知识证明
func (h *ZKPHandler) GenerateProof(c *gin.Context) {
	var req types.ProofGenerationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 生成证明
	resp, err := h.proverService.GenerateProof(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to generate proof",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// VerifyProof 验证零知识证明
func (h *ZKPHandler) VerifyProof(c *gin.Context) {
	var req types.ProofVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 验证证明
	resp, err := h.proverService.VerifyProof(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to verify proof",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GenerateEducationProof 生成学历证明
func (h *ZKPHandler) GenerateEducationProof(c *gin.Context) {
	var req types.EducationProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 生成学历证明
	resp, err := h.proverService.GenerateEducationProof(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to generate education proof",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GenerateAgeProof 生成年龄证明
func (h *ZKPHandler) GenerateAgeProof(c *gin.Context) {
	var req types.AgeProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 生成年龄证明
	resp, err := h.proverService.GenerateAgeProof(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{
			Error:   "Failed to generate age proof",
			Code:    500,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// BatchGenerateProofs 批量生成证明
func (h *ZKPHandler) BatchGenerateProofs(c *gin.Context) {
	var req types.BatchProofRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	results := make([]types.ProofGenerationResponse, len(req.Requests))
	successCount := 0
	failedCount := 0

	for i, proofReq := range req.Requests {
		resp, err := h.proverService.GenerateProof(&proofReq)
		if err != nil {
			results[i] = types.ProofGenerationResponse{
				ProofID:     "",
				Status:      types.StatusFailed,
				GeneratedAt: time.Now(),
			}
			failedCount++
		} else {
			results[i] = *resp
			successCount++
		}
	}

	response := types.BatchProofResponse{
		Results: results,
		Total:   len(req.Requests),
		Success: successCount,
		Failed:  failedCount,
	}

	c.JSON(http.StatusOK, response)
}

// GetSupportedCircuits 获取支持的电路列表
func (h *ZKPHandler) GetSupportedCircuits(c *gin.Context) {
	supportedCircuits := h.proverService.GetSupportedCircuits()
	circuits := make([]types.CircuitDefinition, 0, len(supportedCircuits))

	for _, circuitType := range supportedCircuits {
		if info, err := h.proverService.GetCircuitInfo(circuitType); err == nil {
			circuits = append(circuits, *info)
		}
	}

	response := types.CircuitListResponse{
		Circuits: circuits,
		Total:    len(circuits),
	}

	c.JSON(http.StatusOK, response)
}

// GetCircuitInfo 获取特定电路信息
func (h *ZKPHandler) GetCircuitInfo(c *gin.Context) {
	circuitTypeStr := c.Param("type")
	circuitType := types.CircuitType(circuitTypeStr)

	info, err := h.proverService.GetCircuitInfo(circuitType)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Circuit not found",
			Code:    404,
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, info)
}

// GetStatistics 获取统计信息
func (h *ZKPHandler) GetStatistics(c *gin.Context) {
	// 这里应该从实际的统计存储中获取数据
	// 为了演示，返回模拟数据
	stats := types.StatisticsResponse{
		TotalProofs: 0,
		ProofsByType: map[types.CircuitType]int64{
			types.EducationProofCircuit: 0,
			types.AgeProofCircuit:       0,
			types.GradeProofCircuit:     0,
		},
		ProofsByStatus: map[types.ProofStatus]int64{
			types.StatusPending:   0,
			types.StatusGenerated: 0,
			types.StatusVerified:  0,
			types.StatusFailed:    0,
		},
		AverageGenTime:    0,
		AverageVerifyTime: 0,
		SuccessRate:       0,
	}

	c.JSON(http.StatusOK, stats)
}

// ValidateCircuitInputs 验证电路输入
func (h *ZKPHandler) ValidateCircuitInputs(c *gin.Context) {
	var req struct {
		CircuitType   types.CircuitType     `json:"circuit_type" binding:"required"`
		PrivateInputs map[string]string     `json:"private_inputs" binding:"required"`
		PublicInputs  map[string]string     `json:"public_inputs" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{
			Error:   "Invalid request",
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 获取电路信息
	circuitInfo, err := h.proverService.GetCircuitInfo(req.CircuitType)
	if err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Circuit not found",
			Code:    404,
			Message: err.Error(),
		})
		return
	}

	// 验证输入
	errors := h.validateInputs(circuitInfo, req.PrivateInputs, req.PublicInputs)

	response := struct {
		Valid  bool     `json:"valid"`
		Errors []string `json:"errors,omitempty"`
	}{
		Valid:  len(errors) == 0,
		Errors: errors,
	}

	c.JSON(http.StatusOK, response)
}

// validateInputs 验证输入参数
func (h *ZKPHandler) validateInputs(circuitInfo *types.CircuitDefinition, privateInputs, publicInputs map[string]string) []string {
	var errors []string

	// 检查必需的私有输入
	for _, input := range circuitInfo.Inputs {
		if input.IsSecret {
			if _, exists := privateInputs[input.Name]; !exists {
				errors = append(errors, fmt.Sprintf("Missing required private input: %s", input.Name))
			}
		}
	}

	// 检查必需的公共输入
	for _, input := range circuitInfo.Inputs {
		if input.IsPublic {
			if _, exists := publicInputs[input.Name]; !exists {
				errors = append(errors, fmt.Sprintf("Missing required public input: %s", input.Name))
			}
		}
	}

	return errors
}

// GetProofTemplate 获取证明模板
func (h *ZKPHandler) GetProofTemplate(c *gin.Context) {
	circuitTypeStr := c.Param("type")
	circuitType := types.CircuitType(circuitTypeStr)

	template := h.getProofTemplate(circuitType)
	if template == nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{
			Error:   "Template not found",
			Code:    404,
			Message: "No template available for this circuit type",
		})
		return
	}

	c.JSON(http.StatusOK, template)
}

// getProofTemplate 获取证明模板
func (h *ZKPHandler) getProofTemplate(circuitType types.CircuitType) *types.ProofTemplate {
	switch circuitType {
	case types.EducationProofCircuit:
		return &types.ProofTemplate{
			ID:          "education_proof_template",
			Name:        "Education Proof Template",
			CircuitType: circuitType,
			Description: "Template for generating education proofs",
			Template: map[string]interface{}{
				"private_inputs": map[string]string{
					"student_id":      "12345",
					"school":          "1",
					"degree":          "2",
					"graduation_year": "2023",
					"gpa":             "85",
				},
				"public_inputs": map[string]string{
					"merkle_root":     "0x1234567890abcdef",
					"min_gpa":         "70",
					"required_degree": "2",
					"min_year":        "2020",
				},
			},
			CreatedAt: time.Now(),
		}
	case types.AgeProofCircuit:
		return &types.ProofTemplate{
			ID:          "age_proof_template",
			Name:        "Age Proof Template",
			CircuitType: circuitType,
			Description: "Template for generating age proofs",
			Template: map[string]interface{}{
				"private_inputs": map[string]string{
					"birth_year":  "1995",
					"birth_month": "6",
					"birth_day":   "15",
				},
				"public_inputs": map[string]string{
					"min_age":       "18",
					"current_year":  "2023",
					"current_month": "12",
					"current_day":   "1",
				},
			},
			CreatedAt: time.Now(),
		}
	default:
		return nil
	}
}
