package types

import (
	"time"
)

// Circuit 电路类型枚举
type CircuitType string

const (
	EducationProofCircuit CircuitType = "education_proof"
	AgeProofCircuit       CircuitType = "age_proof"
	GradeProofCircuit     CircuitType = "grade_proof"
	CustomCircuit         CircuitType = "custom"
)

// ProofStatus 证明状态
type ProofStatus string

const (
	StatusPending   ProofStatus = "pending"
	StatusGenerated ProofStatus = "generated"
	StatusVerified  ProofStatus = "verified"
	StatusFailed    ProofStatus = "failed"
)

// ZKProof 零知识证明结构
type ZKProof struct {
	ID          string      `json:"id"`
	CircuitType CircuitType `json:"circuit_type"`
	Proof       []byte      `json:"proof"`
	PublicInputs []string   `json:"public_inputs"`
	Status      ProofStatus `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	VerifiedAt  *time.Time  `json:"verified_at,omitempty"`
}

// CircuitDefinition 电路定义
type CircuitDefinition struct {
	Name        string            `json:"name"`
	Type        CircuitType       `json:"type"`
	Description string            `json:"description"`
	Inputs      []InputDefinition `json:"inputs"`
	Outputs     []OutputDefinition `json:"outputs"`
	Constraints string            `json:"constraints"`
}

// InputDefinition 输入定义
type InputDefinition struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
	IsPublic    bool   `json:"is_public"`
	IsSecret    bool   `json:"is_secret"`
}

// OutputDefinition 输出定义
type OutputDefinition struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

// ProofGenerationRequest 证明生成请求
type ProofGenerationRequest struct {
	CircuitType   CircuitType       `json:"circuit_type" binding:"required"`
	PrivateInputs map[string]string `json:"private_inputs" binding:"required"`
	PublicInputs  map[string]string `json:"public_inputs" binding:"required"`
	ProofID       string            `json:"proof_id,omitempty"`
}

// ProofGenerationResponse 证明生成响应
type ProofGenerationResponse struct {
	ProofID      string    `json:"proof_id"`
	Status       ProofStatus `json:"status"`
	Proof        string    `json:"proof,omitempty"`
	PublicInputs []string  `json:"public_inputs,omitempty"`
	GeneratedAt  time.Time `json:"generated_at"`
}

// ProofVerificationRequest 证明验证请求
type ProofVerificationRequest struct {
	CircuitType  CircuitType `json:"circuit_type" binding:"required"`
	Proof        string      `json:"proof" binding:"required"`
	PublicInputs []string    `json:"public_inputs" binding:"required"`
}

// ProofVerificationResponse 证明验证响应
type ProofVerificationResponse struct {
	Valid       bool      `json:"valid"`
	VerifiedAt  time.Time `json:"verified_at"`
	CircuitType CircuitType `json:"circuit_type"`
}

// EducationProofRequest 学历证明请求
type EducationProofRequest struct {
	// 私有输入（学生知道但不想透露的信息）
	StudentID       string `json:"student_id" binding:"required"`
	School          string `json:"school" binding:"required"`
	Degree          string `json:"degree" binding:"required"`
	GraduationYear  string `json:"graduation_year" binding:"required"`
	GPA             string `json:"gpa,omitempty"`
	
	// 公共输入（可以公开的信息）
	MinGPA          string `json:"min_gpa,omitempty"`
	RequiredDegree  string `json:"required_degree,omitempty"`
	MinYear         string `json:"min_year,omitempty"`
	MerkleRoot      string `json:"merkle_root" binding:"required"`
}

// EducationProofResponse 学历证明响应
type EducationProofResponse struct {
	ProofID      string    `json:"proof_id"`
	Proof        string    `json:"proof"`
	PublicInputs []string  `json:"public_inputs"`
	Statement    string    `json:"statement"`
	GeneratedAt  time.Time `json:"generated_at"`
}

// AgeProofRequest 年龄证明请求
type AgeProofRequest struct {
	// 私有输入
	BirthYear    string `json:"birth_year" binding:"required"`
	BirthMonth   string `json:"birth_month" binding:"required"`
	BirthDay     string `json:"birth_day" binding:"required"`
	
	// 公共输入
	MinAge       string `json:"min_age" binding:"required"`
	CurrentYear  string `json:"current_year" binding:"required"`
	CurrentMonth string `json:"current_month" binding:"required"`
	CurrentDay   string `json:"current_day" binding:"required"`
}

// BatchProofRequest 批量证明请求
type BatchProofRequest struct {
	Requests []ProofGenerationRequest `json:"requests" binding:"required,min=1"`
}

// BatchProofResponse 批量证明响应
type BatchProofResponse struct {
	Results []ProofGenerationResponse `json:"results"`
	Total   int                       `json:"total"`
	Success int                       `json:"success"`
	Failed  int                       `json:"failed"`
}

// ProofQueryRequest 证明查询请求
type ProofQueryRequest struct {
	ProofID     string      `json:"proof_id,omitempty"`
	CircuitType CircuitType `json:"circuit_type,omitempty"`
	Status      ProofStatus `json:"status,omitempty"`
	Limit       int         `json:"limit,omitempty"`
	Offset      int         `json:"offset,omitempty"`
}

// ProofQueryResponse 证明查询响应
type ProofQueryResponse struct {
	Proofs []ZKProof `json:"proofs"`
	Total  int       `json:"total"`
	Limit  int       `json:"limit"`
	Offset int       `json:"offset"`
}

// CircuitListResponse 电路列表响应
type CircuitListResponse struct {
	Circuits []CircuitDefinition `json:"circuits"`
	Total    int                 `json:"total"`
}

// StatisticsResponse 统计信息响应
type StatisticsResponse struct {
	TotalProofs       int64                    `json:"total_proofs"`
	ProofsByType      map[CircuitType]int64    `json:"proofs_by_type"`
	ProofsByStatus    map[ProofStatus]int64    `json:"proofs_by_status"`
	AverageGenTime    float64                  `json:"average_generation_time_ms"`
	AverageVerifyTime float64                  `json:"average_verification_time_ms"`
	SuccessRate       float64                  `json:"success_rate"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status      string                 `json:"status"`
	Service     string                 `json:"service"`
	Version     string                 `json:"version"`
	Timestamp   int64                  `json:"timestamp"`
	Circuits    map[CircuitType]string `json:"circuits"`
	Performance PerformanceMetrics     `json:"performance"`
}

// PerformanceMetrics 性能指标
type PerformanceMetrics struct {
	TotalProofs       int64   `json:"total_proofs"`
	ActiveProofs      int64   `json:"active_proofs"`
	AvgGenTime        float64 `json:"avg_generation_time_ms"`
	AvgVerifyTime     float64 `json:"avg_verification_time_ms"`
	MemoryUsage       string  `json:"memory_usage"`
	CPUUsage          string  `json:"cpu_usage"`
}

// ProofMetadata 证明元数据
type ProofMetadata struct {
	ProofID         string      `json:"proof_id"`
	CircuitType     CircuitType `json:"circuit_type"`
	Status          ProofStatus `json:"status"`
	CreatedAt       time.Time   `json:"created_at"`
	GenerationTime  int64       `json:"generation_time_ms"`
	VerificationTime int64      `json:"verification_time_ms,omitempty"`
	ProofSize       int         `json:"proof_size_bytes"`
	PublicInputCount int        `json:"public_input_count"`
}

// CircuitCompilationRequest 电路编译请求
type CircuitCompilationRequest struct {
	Name        string      `json:"name" binding:"required"`
	Type        CircuitType `json:"type" binding:"required"`
	Source      string      `json:"source" binding:"required"`
	Description string      `json:"description"`
}

// CircuitCompilationResponse 电路编译响应
type CircuitCompilationResponse struct {
	CircuitID   string    `json:"circuit_id"`
	Name        string    `json:"name"`
	Type        CircuitType `json:"type"`
	Status      string    `json:"status"`
	CompiledAt  time.Time `json:"compiled_at"`
	Constraints int       `json:"constraints"`
}

// ProofTemplate 证明模板
type ProofTemplate struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	CircuitType CircuitType            `json:"circuit_type"`
	Description string                 `json:"description"`
	Template    map[string]interface{} `json:"template"`
	CreatedAt   time.Time              `json:"created_at"`
}
