package business

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/types"
)

// JobProcessor 求职业务处理器
type JobProcessor struct{}

// NewJobProcessor 创建新的求职业务处理器
func NewJobProcessor() *JobProcessor {
	return &JobProcessor{}
}

// ProcessJobApplication 处理求职申请
func (p *JobProcessor) ProcessJobApplication(channelID string, message types.Message) (*types.StateUpdate, error) {
	// 解析求职申请数据
	var jobApp types.JobApplicationData
	if err := json.Unmarshal([]byte(message.Data["application"].(string)), &jobApp); err != nil {
		return nil, fmt.Errorf("failed to parse job application: %w", err)
	}

	// 验证求职申请数据
	if err := p.validateJobApplication(&jobApp); err != nil {
		return nil, fmt.Errorf("invalid job application: %w", err)
	}

	// 创建状态更新
	stateUpdate := &types.StateUpdate{
		ChannelID: channelID,
		Nonce:     0, // 这里应该从通道获取当前nonce
		Data: map[string]interface{}{
			"job_application": jobApp,
			"application_status": "submitted",
			"submitted_at": time.Now(),
			"next_step": "employer_review",
		},
		Timestamp: time.Now(),
	}

	return stateUpdate, nil
}

// ProcessInterviewInvite 处理面试邀请
func (p *JobProcessor) ProcessInterviewInvite(channelID string, message types.Message) (*types.StateUpdate, error) {
	// 解析面试邀请数据
	var interview types.InterviewInviteData
	if err := json.Unmarshal([]byte(message.Data["interview"].(string)), &interview); err != nil {
		return nil, fmt.Errorf("failed to parse interview invite: %w", err)
	}

	// 验证面试邀请数据
	if err := p.validateInterviewInvite(&interview); err != nil {
		return nil, fmt.Errorf("invalid interview invite: %w", err)
	}

	// 创建状态更新
	stateUpdate := &types.StateUpdate{
		ChannelID: channelID,
		Nonce:     0,
		Data: map[string]interface{}{
			"interview_invite": interview,
			"interview_status": "invited",
			"invited_at": time.Now(),
			"next_step": "student_response",
		},
		Timestamp: time.Now(),
	}

	return stateUpdate, nil
}

// ProcessOfferLetter 处理录用通知
func (p *JobProcessor) ProcessOfferLetter(channelID string, message types.Message) (*types.StateUpdate, error) {
	// 解析录用通知数据
	var offer types.OfferLetterData
	if err := json.Unmarshal([]byte(message.Data["offer"].(string)), &offer); err != nil {
		return nil, fmt.Errorf("failed to parse offer letter: %w", err)
	}

	// 验证录用通知数据
	if err := p.validateOfferLetter(&offer); err != nil {
		return nil, fmt.Errorf("invalid offer letter: %w", err)
	}

	// 创建状态更新
	stateUpdate := &types.StateUpdate{
		ChannelID: channelID,
		Nonce:     0,
		Data: map[string]interface{}{
			"offer_letter": offer,
			"offer_status": "sent",
			"sent_at": time.Now(),
			"expires_at": offer.ExpiryDate,
			"next_step": "student_decision",
		},
		Timestamp: time.Now(),
	}

	return stateUpdate, nil
}

// ProcessContractSign 处理合同签署
func (p *JobProcessor) ProcessContractSign(channelID string, message types.Message) (*types.StateUpdate, error) {
	// 解析合同签署数据
	var contract types.ContractSignData
	if err := json.Unmarshal([]byte(message.Data["contract"].(string)), &contract); err != nil {
		return nil, fmt.Errorf("failed to parse contract sign: %w", err)
	}

	// 验证合同签署数据
	if err := p.validateContractSign(&contract); err != nil {
		return nil, fmt.Errorf("invalid contract sign: %w", err)
	}

	// 创建状态更新
	stateUpdate := &types.StateUpdate{
		ChannelID: channelID,
		Nonce:     0,
		Data: map[string]interface{}{
			"contract_sign": contract,
			"contract_status": "signed",
			"signed_at": contract.SignedAt,
			"next_step": "employment_start",
		},
		Timestamp: time.Now(),
	}

	return stateUpdate, nil
}

// ProcessResumeRequest 处理简历请求
func (p *JobProcessor) ProcessResumeRequest(channelID string, message types.Message) (*types.StateUpdate, error) {
	// 解析简历请求数据
	requestData := message.Data

	// 验证请求者权限
	if !p.isAuthorizedEmployer(message.From) {
		return nil, fmt.Errorf("unauthorized resume request from: %s", message.From)
	}

	// 创建状态更新
	stateUpdate := &types.StateUpdate{
		ChannelID: channelID,
		Nonce:     0,
		Data: map[string]interface{}{
			"resume_request": requestData,
			"request_status": "pending",
			"requested_at": time.Now(),
			"requested_by": message.From,
			"next_step": "student_approval",
		},
		Timestamp: time.Now(),
	}

	return stateUpdate, nil
}

// GenerateJobWorkflow 生成求职工作流
func (p *JobProcessor) GenerateJobWorkflow(jobType string) map[string]interface{} {
	baseWorkflow := map[string]interface{}{
		"steps": []string{
			"application_submitted",
			"employer_review",
			"interview_invite",
			"interview_conducted",
			"decision_made",
		},
		"current_step": "application_submitted",
		"created_at": time.Now(),
	}

	// 根据工作类型定制工作流
	switch jobType {
	case "internship":
		baseWorkflow["steps"] = []string{
			"application_submitted",
			"initial_screening",
			"interview_invite",
			"interview_conducted",
			"offer_letter",
			"contract_sign",
			"internship_start",
		}
	case "full_time":
		baseWorkflow["steps"] = []string{
			"application_submitted",
			"hr_screening",
			"technical_interview",
			"manager_interview",
			"background_check",
			"offer_letter",
			"contract_sign",
			"employment_start",
		}
	case "part_time":
		baseWorkflow["steps"] = []string{
			"application_submitted",
			"employer_review",
			"interview_invite",
			"interview_conducted",
			"offer_letter",
			"agreement_sign",
			"work_start",
		}
	}

	return baseWorkflow
}

// ValidateWorkflowTransition 验证工作流转换
func (p *JobProcessor) ValidateWorkflowTransition(currentStep, nextStep string, userRole types.ParticipantRole) error {
	// 定义允许的转换
	allowedTransitions := map[string]map[string][]types.ParticipantRole{
		"application_submitted": {
			"employer_review": {types.RoleEmployer},
			"rejected": {types.RoleEmployer},
		},
		"employer_review": {
			"interview_invite": {types.RoleEmployer},
			"rejected": {types.RoleEmployer},
		},
		"interview_invite": {
			"interview_accepted": {types.RoleStudent},
			"interview_declined": {types.RoleStudent},
		},
		"interview_conducted": {
			"offer_letter": {types.RoleEmployer},
			"rejected": {types.RoleEmployer},
		},
		"offer_letter": {
			"offer_accepted": {types.RoleStudent},
			"offer_declined": {types.RoleStudent},
		},
	}

	transitions, exists := allowedTransitions[currentStep]
	if !exists {
		return fmt.Errorf("invalid current step: %s", currentStep)
	}

	allowedRoles, exists := transitions[nextStep]
	if !exists {
		return fmt.Errorf("invalid transition from %s to %s", currentStep, nextStep)
	}

	// 检查用户角色是否有权限进行此转换
	for _, role := range allowedRoles {
		if role == userRole {
			return nil
		}
	}

	return fmt.Errorf("user role %s not authorized for transition from %s to %s", userRole, currentStep, nextStep)
}

// validateJobApplication 验证求职申请
func (p *JobProcessor) validateJobApplication(app *types.JobApplicationData) error {
	if app.Position == "" {
		return fmt.Errorf("position is required")
	}

	if app.Resume == "" {
		return fmt.Errorf("resume is required")
	}

	if len(app.Certificates) == 0 {
		return fmt.Errorf("at least one certificate is required")
	}

	return nil
}

// validateInterviewInvite 验证面试邀请
func (p *JobProcessor) validateInterviewInvite(interview *types.InterviewInviteData) error {
	if interview.Position == "" {
		return fmt.Errorf("position is required")
	}

	if interview.DateTime.Before(time.Now()) {
		return fmt.Errorf("interview date cannot be in the past")
	}

	if interview.Type != "online" && interview.Type != "offline" {
		return fmt.Errorf("interview type must be 'online' or 'offline'")
	}

	if interview.Type == "online" && interview.MeetingLink == "" {
		return fmt.Errorf("meeting link is required for online interviews")
	}

	if interview.Type == "offline" && interview.Location == "" {
		return fmt.Errorf("location is required for offline interviews")
	}

	return nil
}

// validateOfferLetter 验证录用通知
func (p *JobProcessor) validateOfferLetter(offer *types.OfferLetterData) error {
	if offer.Position == "" {
		return fmt.Errorf("position is required")
	}

	if offer.Salary == "" {
		return fmt.Errorf("salary is required")
	}

	if offer.StartDate.Before(time.Now()) {
		return fmt.Errorf("start date cannot be in the past")
	}

	if offer.ExpiryDate.Before(time.Now()) {
		return fmt.Errorf("expiry date cannot be in the past")
	}

	if offer.ExpiryDate.Before(offer.StartDate) {
		return fmt.Errorf("expiry date cannot be before start date")
	}

	return nil
}

// validateContractSign 验证合同签署
func (p *JobProcessor) validateContractSign(contract *types.ContractSignData) error {
	if contract.ContractHash == "" {
		return fmt.Errorf("contract hash is required")
	}

	if contract.Terms == "" {
		return fmt.Errorf("contract terms are required")
	}

	if contract.SignedAt.After(time.Now()) {
		return fmt.Errorf("signed date cannot be in the future")
	}

	return nil
}

// isAuthorizedEmployer 检查是否是授权的用人单位
func (p *JobProcessor) isAuthorizedEmployer(address string) bool {
	// 这里应该实现真正的授权检查逻辑
	// 简化实现，假设所有地址都是授权的
	return address != ""
}

// GenerateJobApplicationTemplate 生成求职申请模板
func (p *JobProcessor) GenerateJobApplicationTemplate(position string) types.JobApplicationData {
	return types.JobApplicationData{
		Position:     position,
		Resume:       "",
		CoverLetter:  "",
		Certificates: []string{},
		ZKProofs:     []string{},
		Metadata: map[string]string{
			"template_version": "1.0",
			"created_at":       time.Now().Format(time.RFC3339),
		},
	}
}

// GenerateInterviewTemplate 生成面试邀请模板
func (p *JobProcessor) GenerateInterviewTemplate(position string) types.InterviewInviteData {
	return types.InterviewInviteData{
		Position:     position,
		DateTime:     time.Now().Add(24 * time.Hour), // 默认明天
		Location:     "",
		Type:         "online",
		MeetingLink:  "",
		Instructions: "Please join the interview on time. We look forward to speaking with you.",
	}
}

// GenerateOfferTemplate 生成录用通知模板
func (p *JobProcessor) GenerateOfferTemplate(position string) types.OfferLetterData {
	return types.OfferLetterData{
		Position:   position,
		Salary:     "",
		StartDate:  time.Now().Add(30 * 24 * time.Hour), // 默认30天后开始
		Benefits:   []string{"Health Insurance", "Paid Time Off"},
		Terms:      "Standard employment terms apply.",
		ExpiryDate: time.Now().Add(7 * 24 * time.Hour), // 7天内回复
		Metadata: map[string]string{
			"template_version": "1.0",
			"created_at":       time.Now().Format(time.RFC3339),
		},
	}
}

// GetJobStatistics 获取求职统计信息
func (p *JobProcessor) GetJobStatistics(channels []types.Channel) map[string]interface{} {
	stats := map[string]interface{}{
		"total_applications":     0,
		"pending_applications":   0,
		"accepted_applications":  0,
		"rejected_applications":  0,
		"interviews_scheduled":   0,
		"offers_sent":           0,
		"contracts_signed":      0,
		"positions": make(map[string]int),
	}

	for _, channel := range channels {
		if data, exists := channel.Data["job_application"]; exists {
			stats["total_applications"] = stats["total_applications"].(int) + 1
			
			if app, ok := data.(types.JobApplicationData); ok {
				positions := stats["positions"].(map[string]int)
				positions[app.Position]++
				stats["positions"] = positions
			}
		}

		if status, exists := channel.Data["application_status"]; exists {
			switch status {
			case "pending":
				stats["pending_applications"] = stats["pending_applications"].(int) + 1
			case "accepted":
				stats["accepted_applications"] = stats["accepted_applications"].(int) + 1
			case "rejected":
				stats["rejected_applications"] = stats["rejected_applications"].(int) + 1
			}
		}

		if _, exists := channel.Data["interview_invite"]; exists {
			stats["interviews_scheduled"] = stats["interviews_scheduled"].(int) + 1
		}

		if _, exists := channel.Data["offer_letter"]; exists {
			stats["offers_sent"] = stats["offers_sent"].(int) + 1
		}

		if _, exists := channel.Data["contract_sign"]; exists {
			stats["contracts_signed"] = stats["contracts_signed"].(int) + 1
		}
	}

	return stats
}
