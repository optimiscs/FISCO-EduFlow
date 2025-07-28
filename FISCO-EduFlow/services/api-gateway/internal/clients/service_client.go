package clients

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/blockchain-education-platform/api-gateway/internal/types"
	"github.com/go-resty/resty/v2"
)

// ServiceClient 服务客户端
type ServiceClient struct {
	client   *resty.Client
	services map[string]types.ServiceConfig
}

// NewServiceClient 创建新的服务客户端
func NewServiceClient(services map[string]types.ServiceConfig) *ServiceClient {
	client := resty.New()
	client.SetTimeout(30 * time.Second)
	client.SetRetryCount(3)
	client.SetRetryWaitTime(1 * time.Second)
	client.SetRetryMaxWaitTime(5 * time.Second)

	return &ServiceClient{
		client:   client,
		services: services,
	}
}

// CryptoService 密码学服务客户端
type CryptoService struct {
	client  *resty.Client
	baseURL string
}

// NewCryptoService 创建密码学服务客户端
func NewCryptoService(baseURL string) *CryptoService {
	client := resty.New()
	client.SetBaseURL(baseURL)
	client.SetTimeout(30 * time.Second)

	return &CryptoService{
		client:  client,
		baseURL: baseURL,
	}
}

// GenerateKeyPair 生成密钥对
func (c *CryptoService) GenerateKeyPair() (map[string]interface{}, error) {
	resp, err := c.client.R().
		SetHeader("Content-Type", "application/json").
		Post("/api/v1/keys/generate")

	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("crypto service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// Hash 计算哈希
func (c *CryptoService) Hash(data string) (map[string]interface{}, error) {
	reqBody := map[string]string{"data": data}

	resp, err := c.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/hash/sha256")

	if err != nil {
		return nil, fmt.Errorf("failed to compute hash: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("crypto service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// Sign 数字签名
func (c *CryptoService) Sign(privateKey, data string) (map[string]interface{}, error) {
	reqBody := map[string]string{
		"private_key": privateKey,
		"data":        data,
	}

	resp, err := c.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/signature/sign")

	if err != nil {
		return nil, fmt.Errorf("failed to sign data: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("crypto service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// Verify 验证签名
func (c *CryptoService) Verify(publicKey, data, signature string) (map[string]interface{}, error) {
	reqBody := map[string]string{
		"public_key": publicKey,
		"data":       data,
		"signature":  signature,
	}

	resp, err := c.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/signature/verify")

	if err != nil {
		return nil, fmt.Errorf("failed to verify signature: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("crypto service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// MerkleService Merkle树服务客户端
type MerkleService struct {
	client  *resty.Client
	baseURL string
}

// NewMerkleService 创建Merkle树服务客户端
func NewMerkleService(baseURL string) *MerkleService {
	client := resty.New()
	client.SetBaseURL(baseURL)
	client.SetTimeout(60 * time.Second) // Merkle树构建可能需要更长时间

	return &MerkleService{
		client:  client,
		baseURL: baseURL,
	}
}

// BuildTree 构建Merkle树
func (m *MerkleService) BuildTree(data []string) (map[string]interface{}, error) {
	reqBody := map[string][]string{"data": data}

	resp, err := m.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/trees/build")

	if err != nil {
		return nil, fmt.Errorf("failed to build merkle tree: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("merkle service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// GenerateProof 生成Merkle证明
func (m *MerkleService) GenerateProof(treeID, leafHash string) (map[string]interface{}, error) {
	reqBody := map[string]string{
		"tree_id":   treeID,
		"leaf_hash": leafHash,
	}

	resp, err := m.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/proofs/generate")

	if err != nil {
		return nil, fmt.Errorf("failed to generate merkle proof: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("merkle service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// VerifyProof 验证Merkle证明
func (m *MerkleService) VerifyProof(proof map[string]interface{}) (map[string]interface{}, error) {
	reqBody := map[string]interface{}{"proof": proof}

	resp, err := m.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/proofs/verify")

	if err != nil {
		return nil, fmt.Errorf("failed to verify merkle proof: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("merkle service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// ZKPService 零知识证明服务客户端
type ZKPService struct {
	client  *resty.Client
	baseURL string
}

// NewZKPService 创建零知识证明服务客户端
func NewZKPService(baseURL string) *ZKPService {
	client := resty.New()
	client.SetBaseURL(baseURL)
	client.SetTimeout(120 * time.Second) // ZKP生成可能需要很长时间

	return &ZKPService{
		client:  client,
		baseURL: baseURL,
	}
}

// GenerateProof 生成零知识证明
func (z *ZKPService) GenerateProof(circuitType string, privateInputs, publicInputs map[string]string) (map[string]interface{}, error) {
	reqBody := map[string]interface{}{
		"circuit_type":   circuitType,
		"private_inputs": privateInputs,
		"public_inputs":  publicInputs,
	}

	resp, err := z.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/proofs/generate")

	if err != nil {
		return nil, fmt.Errorf("failed to generate zkp: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("zkp service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// VerifyProof 验证零知识证明
func (z *ZKPService) VerifyProof(circuitType, proof string, publicInputs []string) (map[string]interface{}, error) {
	reqBody := map[string]interface{}{
		"circuit_type":   circuitType,
		"proof":          proof,
		"public_inputs":  publicInputs,
	}

	resp, err := z.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(reqBody).
		Post("/api/v1/proofs/verify")

	if err != nil {
		return nil, fmt.Errorf("failed to verify zkp: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("zkp service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// GenerateEducationProof 生成学历证明
func (z *ZKPService) GenerateEducationProof(req map[string]string) (map[string]interface{}, error) {
	resp, err := z.client.R().
		SetHeader("Content-Type", "application/json").
		SetBody(req).
		Post("/api/v1/education/proof")

	if err != nil {
		return nil, fmt.Errorf("failed to generate education proof: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("zkp service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// GetSupportedCircuits 获取支持的电路
func (z *ZKPService) GetSupportedCircuits() (map[string]interface{}, error) {
	resp, err := z.client.R().
		SetHeader("Content-Type", "application/json").
		Get("/api/v1/circuits/")

	if err != nil {
		return nil, fmt.Errorf("failed to get supported circuits: %w", err)
	}

	if resp.StatusCode() != 200 {
		return nil, fmt.Errorf("zkp service returned status %d: %s", resp.StatusCode(), resp.String())
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

// HealthCheck 健康检查
func (sc *ServiceClient) HealthCheck(serviceName string) (*types.ServiceStatus, error) {
	config, exists := sc.services[serviceName]
	if !exists {
		return nil, fmt.Errorf("service %s not configured", serviceName)
	}

	start := time.Now()
	resp, err := sc.client.R().
		SetTimeout(time.Duration(config.Timeout) * time.Second).
		Get(config.URL + "/health")

	duration := time.Since(start).Milliseconds()

	status := &types.ServiceStatus{
		Name:         serviceName,
		URL:          config.URL,
		ResponseTime: duration,
		LastCheck:    time.Now(),
	}

	if err != nil {
		status.Status = "unhealthy"
		status.Error = err.Error()
		return status, nil
	}

	if resp.StatusCode() == 200 {
		status.Status = "healthy"
	} else {
		status.Status = "unhealthy"
		status.Error = fmt.Sprintf("HTTP %d: %s", resp.StatusCode(), resp.String())
	}

	return status, nil
}

// ProxyRequest 代理请求
func (sc *ServiceClient) ProxyRequest(serviceName, method, path string, headers map[string]string, body interface{}) (*types.ProxyResponse, error) {
	config, exists := sc.services[serviceName]
	if !exists {
		return nil, fmt.Errorf("service %s not configured", serviceName)
	}

	start := time.Now()
	req := sc.client.R().
		SetTimeout(time.Duration(config.Timeout) * time.Second)

	// 设置请求头
	for key, value := range headers {
		req.SetHeader(key, value)
	}

	// 设置请求体
	if body != nil {
		req.SetBody(body)
	}

	// 发送请求
	var resp *resty.Response
	var err error

	switch method {
	case "GET":
		resp, err = req.Get(config.URL + path)
	case "POST":
		resp, err = req.Post(config.URL + path)
	case "PUT":
		resp, err = req.Put(config.URL + path)
	case "DELETE":
		resp, err = req.Delete(config.URL + path)
	case "PATCH":
		resp, err = req.Patch(config.URL + path)
	default:
		return nil, fmt.Errorf("unsupported HTTP method: %s", method)
	}

	duration := time.Since(start).Milliseconds()

	if err != nil {
		return nil, fmt.Errorf("failed to proxy request: %w", err)
	}

	// 解析响应体
	var responseBody map[string]interface{}
	if len(resp.Body()) > 0 {
		if err := json.Unmarshal(resp.Body(), &responseBody); err != nil {
			// 如果不是JSON，直接返回字符串
			responseBody = map[string]interface{}{
				"raw": string(resp.Body()),
			}
		}
	}

	// 构建响应头映射
	responseHeaders := make(map[string]string)
	for key, values := range resp.Header() {
		if len(values) > 0 {
			responseHeaders[key] = values[0]
		}
	}

	return &types.ProxyResponse{
		StatusCode: resp.StatusCode(),
		Headers:    responseHeaders,
		Body:       responseBody,
		Duration:   duration,
	}, nil
}
