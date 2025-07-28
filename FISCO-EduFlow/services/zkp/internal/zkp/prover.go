package zkp

import (
	"encoding/hex"
	"fmt"
	"strconv"
	"time"

	"github.com/blockchain-education-platform/zkp-service/internal/circuits"
	"github.com/blockchain-education-platform/zkp-service/internal/types"
	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"
)

// ProverService ZKP证明生成服务
type ProverService struct {
	compiledCircuits map[types.CircuitType]*CompiledCircuit
}

// CompiledCircuit 编译后的电路
type CompiledCircuit struct {
	R1CS         r1cs.R1CS
	ProvingKey   groth16.ProvingKey
	VerifyingKey groth16.VerifyingKey
	Circuit      frontend.Circuit
}

// NewProverService 创建新的证明服务实例
func NewProverService() *ProverService {
	service := &ProverService{
		compiledCircuits: make(map[types.CircuitType]*CompiledCircuit),
	}
	
	// 初始化并编译所有电路
	if err := service.initializeCircuits(); err != nil {
		fmt.Printf("Warning: Failed to initialize circuits: %v\n", err)
	}
	
	return service
}

// initializeCircuits 初始化并编译所有电路
func (s *ProverService) initializeCircuits() error {
	circuitTypes := []types.CircuitType{
		types.EducationProofCircuit,
		types.AgeProofCircuit,
		types.GradeProofCircuit,
	}
	
	for _, circuitType := range circuitTypes {
		if err := s.compileCircuit(circuitType); err != nil {
			return fmt.Errorf("failed to compile circuit %s: %w", circuitType, err)
		}
	}
	
	return nil
}

// compileCircuit 编译指定类型的电路
func (s *ProverService) compileCircuit(circuitType types.CircuitType) error {
	// 获取电路实例
	circuit := circuits.GetCircuitByType(string(circuitType))
	if circuit == nil {
		return fmt.Errorf("unknown circuit type: %s", circuitType)
	}
	
	// 编译电路为R1CS
	ccs, err := frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, circuit)
	if err != nil {
		return fmt.Errorf("failed to compile circuit: %w", err)
	}
	
	// 生成证明密钥和验证密钥
	pk, vk, err := groth16.Setup(ccs)
	if err != nil {
		return fmt.Errorf("failed to setup keys: %w", err)
	}
	
	// 存储编译后的电路
	s.compiledCircuits[circuitType] = &CompiledCircuit{
		R1CS:         ccs,
		ProvingKey:   pk,
		VerifyingKey: vk,
		Circuit:      circuit,
	}
	
	fmt.Printf("Successfully compiled circuit: %s\n", circuitType)
	return nil
}

// GenerateProof 生成零知识证明
func (s *ProverService) GenerateProof(req *types.ProofGenerationRequest) (*types.ProofGenerationResponse, error) {
	startTime := time.Now()
	
	// 检查电路是否已编译
	compiled, exists := s.compiledCircuits[req.CircuitType]
	if !exists {
		return nil, fmt.Errorf("circuit not compiled: %s", req.CircuitType)
	}
	
	// 创建witness
	witness, err := s.createWitness(req.CircuitType, req.PrivateInputs, req.PublicInputs)
	if err != nil {
		return nil, fmt.Errorf("failed to create witness: %w", err)
	}
	
	// 生成证明
	proof, err := groth16.Prove(compiled.R1CS, compiled.ProvingKey, witness)
	if err != nil {
		return nil, fmt.Errorf("failed to generate proof: %w", err)
	}
	
	// 序列化证明
	proofBytes, err := proof.MarshalBinary()
	if err != nil {
		return nil, fmt.Errorf("failed to serialize proof: %w", err)
	}
	
	// 提取公共输入
	publicInputs := s.extractPublicInputs(req.PublicInputs)
	
	// 生成证明ID
	proofID := s.generateProofID(req.CircuitType, proofBytes)
	
	generationTime := time.Since(startTime)
	
	return &types.ProofGenerationResponse{
		ProofID:      proofID,
		Status:       types.StatusGenerated,
		Proof:        hex.EncodeToString(proofBytes),
		PublicInputs: publicInputs,
		GeneratedAt:  time.Now(),
	}, nil
}

// VerifyProof 验证零知识证明
func (s *ProverService) VerifyProof(req *types.ProofVerificationRequest) (*types.ProofVerificationResponse, error) {
	startTime := time.Now()
	
	// 检查电路是否已编译
	compiled, exists := s.compiledCircuits[req.CircuitType]
	if !exists {
		return nil, fmt.Errorf("circuit not compiled: %s", req.CircuitType)
	}
	
	// 反序列化证明
	proofBytes, err := hex.DecodeString(req.Proof)
	if err != nil {
		return nil, fmt.Errorf("failed to decode proof: %w", err)
	}
	
	var proof groth16.Proof
	if err := proof.UnmarshalBinary(proofBytes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal proof: %w", err)
	}
	
	// 创建公共witness
	publicWitness, err := s.createPublicWitness(req.CircuitType, req.PublicInputs)
	if err != nil {
		return nil, fmt.Errorf("failed to create public witness: %w", err)
	}
	
	// 验证证明
	err = groth16.Verify(proof, compiled.VerifyingKey, publicWitness)
	valid := err == nil
	
	return &types.ProofVerificationResponse{
		Valid:       valid,
		VerifiedAt:  time.Now(),
		CircuitType: req.CircuitType,
	}, nil
}

// GenerateEducationProof 生成学历证明
func (s *ProverService) GenerateEducationProof(req *types.EducationProofRequest) (*types.EducationProofResponse, error) {
	// 构建证明生成请求
	proofReq := &types.ProofGenerationRequest{
		CircuitType: types.EducationProofCircuit,
		PrivateInputs: map[string]string{
			"student_id":      req.StudentID,
			"school":          req.School,
			"degree":          req.Degree,
			"graduation_year": req.GraduationYear,
			"gpa":             req.GPA,
		},
		PublicInputs: map[string]string{
			"merkle_root":     req.MerkleRoot,
			"min_gpa":         req.MinGPA,
			"required_degree": req.RequiredDegree,
			"min_year":        req.MinYear,
		},
	}
	
	// 生成证明
	resp, err := s.GenerateProof(proofReq)
	if err != nil {
		return nil, err
	}
	
	// 构建学历证明响应
	statement := fmt.Sprintf("I have a %s degree from %s, graduated in %s with GPA %s",
		req.Degree, req.School, req.GraduationYear, req.GPA)
	
	return &types.EducationProofResponse{
		ProofID:      resp.ProofID,
		Proof:        resp.Proof,
		PublicInputs: resp.PublicInputs,
		Statement:    statement,
		GeneratedAt:  resp.GeneratedAt,
	}, nil
}

// GenerateAgeProof 生成年龄证明
func (s *ProverService) GenerateAgeProof(req *types.AgeProofRequest) (*types.ProofGenerationResponse, error) {
	proofReq := &types.ProofGenerationRequest{
		CircuitType: types.AgeProofCircuit,
		PrivateInputs: map[string]string{
			"birth_year":  req.BirthYear,
			"birth_month": req.BirthMonth,
			"birth_day":   req.BirthDay,
		},
		PublicInputs: map[string]string{
			"min_age":       req.MinAge,
			"current_year":  req.CurrentYear,
			"current_month": req.CurrentMonth,
			"current_day":   req.CurrentDay,
		},
	}
	
	return s.GenerateProof(proofReq)
}

// createWitness 创建witness
func (s *ProverService) createWitness(circuitType types.CircuitType, privateInputs, publicInputs map[string]string) (frontend.Circuit, error) {
	switch circuitType {
	case types.EducationProofCircuit:
		return s.createEducationWitness(privateInputs, publicInputs)
	case types.AgeProofCircuit:
		return s.createAgeWitness(privateInputs, publicInputs)
	case types.GradeProofCircuit:
		return s.createGradeWitness(privateInputs, publicInputs)
	default:
		return nil, fmt.Errorf("unsupported circuit type: %s", circuitType)
	}
}

// createEducationWitness 创建学历证明witness
func (s *ProverService) createEducationWitness(privateInputs, publicInputs map[string]string) (*circuits.EducationCircuit, error) {
	witness := &circuits.EducationCircuit{}
	
	// 设置私有输入
	if val, ok := privateInputs["student_id"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.StudentID = intVal
		}
	}
	
	if val, ok := privateInputs["school"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.School = intVal
		}
	}
	
	if val, ok := privateInputs["degree"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.Degree = intVal
		}
	}
	
	if val, ok := privateInputs["graduation_year"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.GraduationYear = intVal
		}
	}
	
	if val, ok := privateInputs["gpa"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.GPA = intVal
		}
	}
	
	// 设置公共输入
	if val, ok := publicInputs["merkle_root"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.MerkleRoot = intVal
		}
	}
	
	if val, ok := publicInputs["min_gpa"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.MinGPA = intVal
		}
	}
	
	if val, ok := publicInputs["required_degree"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.RequiredDegree = intVal
		}
	}
	
	if val, ok := publicInputs["min_year"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.MinYear = intVal
		}
	}
	
	// 设置输出
	witness.IsValid = 1
	
	return witness, nil
}

// createAgeWitness 创建年龄证明witness
func (s *ProverService) createAgeWitness(privateInputs, publicInputs map[string]string) (*circuits.AgeCircuit, error) {
	witness := &circuits.AgeCircuit{}
	
	// 设置私有输入
	if val, ok := privateInputs["birth_year"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.BirthYear = intVal
		}
	}
	
	if val, ok := privateInputs["birth_month"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.BirthMonth = intVal
		}
	}
	
	if val, ok := privateInputs["birth_day"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.BirthDay = intVal
		}
	}
	
	// 设置公共输入
	if val, ok := publicInputs["min_age"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.MinAge = intVal
		}
	}
	
	if val, ok := publicInputs["current_year"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.CurrentYear = intVal
		}
	}
	
	if val, ok := publicInputs["current_month"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.CurrentMonth = intVal
		}
	}
	
	if val, ok := publicInputs["current_day"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.CurrentDay = intVal
		}
	}
	
	// 设置输出
	witness.IsOldEnough = 1
	
	return witness, nil
}

// createGradeWitness 创建成绩证明witness
func (s *ProverService) createGradeWitness(privateInputs, publicInputs map[string]string) (*circuits.GradeCircuit, error) {
	witness := &circuits.GradeCircuit{}
	
	// 设置私有输入
	if val, ok := privateInputs["actual_gpa"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.ActualGPA = intVal
		}
	}
	
	if val, ok := privateInputs["salt"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.Salt = intVal
		}
	}
	
	// 设置公共输入
	if val, ok := publicInputs["min_gpa"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.MinGPA = intVal
		}
	}
	
	if val, ok := publicInputs["committed_gpa"]; ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			witness.CommittedGPA = intVal
		}
	}
	
	// 设置输出
	witness.IsAboveThreshold = 1
	
	return witness, nil
}

// createPublicWitness 创建公共witness
func (s *ProverService) createPublicWitness(circuitType types.CircuitType, publicInputs []string) (frontend.Circuit, error) {
	// 这里需要根据电路类型创建只包含公共输入的witness
	// 简化实现，实际应该更精确地处理
	circuit := circuits.GetCircuitByType(string(circuitType))
	return circuit, nil
}

// extractPublicInputs 提取公共输入
func (s *ProverService) extractPublicInputs(inputs map[string]string) []string {
	var result []string
	for _, value := range inputs {
		result = append(result, value)
	}
	return result
}

// generateProofID 生成证明ID
func (s *ProverService) generateProofID(circuitType types.CircuitType, proofBytes []byte) string {
	timestamp := time.Now().Unix()
	return fmt.Sprintf("%s_%d_%x", circuitType, timestamp, proofBytes[:8])
}

// GetSupportedCircuits 获取支持的电路类型
func (s *ProverService) GetSupportedCircuits() []types.CircuitType {
	var circuits []types.CircuitType
	for circuitType := range s.compiledCircuits {
		circuits = append(circuits, circuitType)
	}
	return circuits
}

// GetCircuitInfo 获取电路信息
func (s *ProverService) GetCircuitInfo(circuitType types.CircuitType) (*types.CircuitDefinition, error) {
	compiled, exists := s.compiledCircuits[circuitType]
	if !exists {
		return nil, fmt.Errorf("circuit not found: %s", circuitType)
	}
	
	// 构建电路定义
	definition := &types.CircuitDefinition{
		Name:        string(circuitType),
		Type:        circuitType,
		Description: s.getCircuitDescription(circuitType),
		Inputs:      s.getCircuitInputs(circuitType),
		Outputs:     s.getCircuitOutputs(circuitType),
		Constraints: fmt.Sprintf("%d constraints", compiled.R1CS.GetNbConstraints()),
	}
	
	return definition, nil
}

// getCircuitDescription 获取电路描述
func (s *ProverService) getCircuitDescription(circuitType types.CircuitType) string {
	switch circuitType {
	case types.EducationProofCircuit:
		return "Proves possession of education credentials without revealing sensitive information"
	case types.AgeProofCircuit:
		return "Proves age is above a certain threshold without revealing exact age"
	case types.GradeProofCircuit:
		return "Proves GPA is above a threshold without revealing exact GPA"
	default:
		return "Custom zero-knowledge proof circuit"
	}
}

// getCircuitInputs 获取电路输入定义
func (s *ProverService) getCircuitInputs(circuitType types.CircuitType) []types.InputDefinition {
	switch circuitType {
	case types.EducationProofCircuit:
		return []types.InputDefinition{
			{Name: "student_id", Type: "field", Description: "Student identifier", IsSecret: true},
			{Name: "school", Type: "field", Description: "School identifier", IsSecret: true},
			{Name: "degree", Type: "field", Description: "Degree type", IsSecret: true},
			{Name: "graduation_year", Type: "field", Description: "Graduation year", IsSecret: true},
			{Name: "gpa", Type: "field", Description: "Grade point average", IsSecret: true},
			{Name: "merkle_root", Type: "field", Description: "Merkle root of valid credentials", IsPublic: true},
			{Name: "min_gpa", Type: "field", Description: "Minimum required GPA", IsPublic: true},
			{Name: "required_degree", Type: "field", Description: "Required degree type", IsPublic: true},
			{Name: "min_year", Type: "field", Description: "Minimum graduation year", IsPublic: true},
		}
	case types.AgeProofCircuit:
		return []types.InputDefinition{
			{Name: "birth_year", Type: "field", Description: "Birth year", IsSecret: true},
			{Name: "birth_month", Type: "field", Description: "Birth month", IsSecret: true},
			{Name: "birth_day", Type: "field", Description: "Birth day", IsSecret: true},
			{Name: "min_age", Type: "field", Description: "Minimum required age", IsPublic: true},
			{Name: "current_year", Type: "field", Description: "Current year", IsPublic: true},
			{Name: "current_month", Type: "field", Description: "Current month", IsPublic: true},
			{Name: "current_day", Type: "field", Description: "Current day", IsPublic: true},
		}
	default:
		return []types.InputDefinition{}
	}
}

// getCircuitOutputs 获取电路输出定义
func (s *ProverService) getCircuitOutputs(circuitType types.CircuitType) []types.OutputDefinition {
	switch circuitType {
	case types.EducationProofCircuit:
		return []types.OutputDefinition{
			{Name: "is_valid", Type: "field", Description: "Whether the education proof is valid"},
		}
	case types.AgeProofCircuit:
		return []types.OutputDefinition{
			{Name: "is_old_enough", Type: "field", Description: "Whether the age requirement is met"},
		}
	case types.GradeProofCircuit:
		return []types.OutputDefinition{
			{Name: "is_above_threshold", Type: "field", Description: "Whether GPA is above threshold"},
		}
	default:
		return []types.OutputDefinition{}
	}
}
