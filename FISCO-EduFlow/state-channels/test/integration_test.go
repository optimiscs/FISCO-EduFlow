package test

import (
	"crypto/ecdsa"
	"encoding/json"
	"testing"
	"time"

	"github.com/blockchain-education-platform/state-channels/internal/channel"
	"github.com/blockchain-education-platform/state-channels/internal/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestChannelLifecycle 测试通道完整生命周期
func TestChannelLifecycle(t *testing.T) {
	// 创建测试配置
	config := types.ChannelConfig{
		MaxChannels:        100,
		DefaultExpiryHours: 24,
		MaxMessageSize:     1024,
		CleanupInterval:    time.Hour,
		BackupInterval:     time.Hour,
	}

	// 创建通道管理器
	manager := channel.NewManager(config)

	// 生成测试密钥对
	studentKey, err := crypto.GenerateKey()
	require.NoError(t, err)
	employerKey, err := crypto.GenerateKey()
	require.NoError(t, err)

	// 创建参与者
	student := types.Participant{
		Address:   crypto.PubkeyToAddress(studentKey.PublicKey).Hex(),
		PublicKey: &studentKey.PublicKey,
		Role:      types.RoleStudent,
		Name:      "Test Student",
	}

	employer := types.Participant{
		Address:   crypto.PubkeyToAddress(employerKey.PublicKey).Hex(),
		PublicKey: &employerKey.PublicKey,
		Role:      types.RoleEmployer,
		Name:      "Test Employer",
	}

	// 1. 测试通道创建
	t.Run("CreateChannel", func(t *testing.T) {
		req := &types.ChannelOpenRequest{
			ParticipantA: student,
			ParticipantB: employer,
			InitialData: map[string]interface{}{
				"job_type": "internship",
				"position": "Software Developer",
			},
			ExpiryHours: 48,
		}

		channel, err := manager.CreateChannel(req)
		require.NoError(t, err)
		assert.NotEmpty(t, channel.ID)
		assert.Equal(t, types.StateOpening, channel.State)
		assert.Equal(t, uint64(0), channel.Nonce)
		assert.Len(t, channel.Participants, 2)
	})

	// 2. 测试通道接受
	t.Run("AcceptChannel", func(t *testing.T) {
		// 首先创建通道
		req := &types.ChannelOpenRequest{
			ParticipantA: student,
			ParticipantB: employer,
		}

		channel, err := manager.CreateChannel(req)
		require.NoError(t, err)

		// 创建接受签名
		signature := types.Signature{
			Address:   employer.Address,
			Signature: "test_signature",
		}

		err = manager.AcceptChannel(channel.ID, signature)
		require.NoError(t, err)

		// 验证通道状态
		updatedChannel, err := manager.GetChannel(channel.ID)
		require.NoError(t, err)
		assert.Equal(t, types.StateOpen, updatedChannel.State)
	})

	// 3. 测试消息发送
	t.Run("SendMessage", func(t *testing.T) {
		// 创建并接受通道
		req := &types.ChannelOpenRequest{
			ParticipantA: student,
			ParticipantB: employer,
		}

		channel, err := manager.CreateChannel(req)
		require.NoError(t, err)

		signature := types.Signature{
			Address:   employer.Address,
			Signature: "test_signature",
		}
		err = manager.AcceptChannel(channel.ID, signature)
		require.NoError(t, err)

		// 发送求职申请消息
		jobApp := types.JobApplicationData{
			Position:     "Software Developer",
			Resume:       "Test resume content",
			CoverLetter:  "Test cover letter",
			Certificates: []string{"cert1", "cert2"},
		}

		appData, _ := json.Marshal(jobApp)
		message := types.Message{
			ID:        "msg_001",
			ChannelID: channel.ID,
			Type:      types.MsgTypeJobApplication,
			From:      student.Address,
			To:        employer.Address,
			Data: map[string]interface{}{
				"application": string(appData),
			},
			Nonce:     1,
			Timestamp: time.Now(),
			Signature: types.Signature{
				Address:   student.Address,
				Signature: "test_message_signature",
			},
		}

		err = manager.AddMessage(message)
		require.NoError(t, err)

		// 验证消息已保存
		messages, err := manager.GetChannelMessages(channel.ID)
		require.NoError(t, err)
		assert.Len(t, messages, 1)
		assert.Equal(t, types.MsgTypeJobApplication, messages[0].Type)
	})

	// 4. 测试状态更新
	t.Run("UpdateState", func(t *testing.T) {
		// 创建并接受通道
		req := &types.ChannelOpenRequest{
			ParticipantA: student,
			ParticipantB: employer,
		}

		channel, err := manager.CreateChannel(req)
		require.NoError(t, err)

		signature := types.Signature{
			Address:   employer.Address,
			Signature: "test_signature",
		}
		err = manager.AcceptChannel(channel.ID, signature)
		require.NoError(t, err)

		// 更新状态
		updateData := map[string]interface{}{
			"application_status": "under_review",
			"reviewer":          employer.Address,
			"review_started_at": time.Now(),
		}

		updateSignature := types.Signature{
			Address:   employer.Address,
			Signature: "test_update_signature",
		}

		err = manager.UpdateState(channel.ID, updateData, updateSignature)
		require.NoError(t, err)

		// 验证状态已更新
		updatedChannel, err := manager.GetChannel(channel.ID)
		require.NoError(t, err)
		assert.Equal(t, uint64(1), updatedChannel.Nonce)
		assert.Equal(t, "under_review", updatedChannel.Data["application_status"])
	})

	// 5. 测试通道关闭
	t.Run("CloseChannel", func(t *testing.T) {
		// 创建并接受通道
		req := &types.ChannelOpenRequest{
			ParticipantA: student,
			ParticipantB: employer,
		}

		channel, err := manager.CreateChannel(req)
		require.NoError(t, err)

		signature := types.Signature{
			Address:   employer.Address,
			Signature: "test_signature",
		}
		err = manager.AcceptChannel(channel.ID, signature)
		require.NoError(t, err)

		// 关闭通道
		closeSignature := types.Signature{
			Address:   student.Address,
			Signature: "test_close_signature",
		}

		err = manager.CloseChannel(channel.ID, closeSignature, false)
		require.NoError(t, err)

		// 验证通道状态
		closedChannel, err := manager.GetChannel(channel.ID)
		require.NoError(t, err)
		assert.Equal(t, types.StateClosing, closedChannel.State)
	})
}

// TestJobWorkflow 测试求职工作流
func TestJobWorkflow(t *testing.T) {
	config := types.ChannelConfig{
		MaxChannels:        100,
		DefaultExpiryHours: 24,
		MaxMessageSize:     1024,
		CleanupInterval:    time.Hour,
		BackupInterval:     time.Hour,
	}

	manager := channel.NewManager(config)

	// 生成测试密钥对
	studentKey, _ := crypto.GenerateKey()
	employerKey, _ := crypto.GenerateKey()

	student := types.Participant{
		Address:   crypto.PubkeyToAddress(studentKey.PublicKey).Hex(),
		PublicKey: &studentKey.PublicKey,
		Role:      types.RoleStudent,
		Name:      "Alice",
	}

	employer := types.Participant{
		Address:   crypto.PubkeyToAddress(employerKey.PublicKey).Hex(),
		PublicKey: &employerKey.PublicKey,
		Role:      types.RoleEmployer,
		Name:      "TechCorp",
	}

	// 创建通道
	req := &types.ChannelOpenRequest{
		ParticipantA: student,
		ParticipantB: employer,
		InitialData: map[string]interface{}{
			"job_type": "full_time",
			"position": "Backend Developer",
		},
	}

	channel, err := manager.CreateChannel(req)
	require.NoError(t, err)

	// 接受通道
	signature := types.Signature{
		Address:   employer.Address,
		Signature: "accept_signature",
	}
	err = manager.AcceptChannel(channel.ID, signature)
	require.NoError(t, err)

	// 1. 学生提交求职申请
	t.Run("SubmitJobApplication", func(t *testing.T) {
		jobApp := types.JobApplicationData{
			Position:     "Backend Developer",
			Resume:       "Experienced developer with 3 years of Go experience",
			CoverLetter:  "I am very interested in this position",
			Certificates: []string{"Go Certification", "AWS Certification"},
			ZKProofs:     []string{"education_proof_hash"},
		}

		appData, _ := json.Marshal(jobApp)
		message := types.Message{
			ID:        "app_001",
			ChannelID: channel.ID,
			Type:      types.MsgTypeJobApplication,
			From:      student.Address,
			To:        employer.Address,
			Data: map[string]interface{}{
				"application": string(appData),
			},
			Timestamp: time.Now(),
			Signature: types.Signature{
				Address:   student.Address,
				Signature: "app_signature",
			},
		}

		err := manager.AddMessage(message)
		require.NoError(t, err)
	})

	// 2. 雇主发送面试邀请
	t.Run("SendInterviewInvite", func(t *testing.T) {
		interview := types.InterviewInviteData{
			Position:     "Backend Developer",
			DateTime:     time.Now().Add(48 * time.Hour),
			Location:     "Online",
			Type:         "online",
			MeetingLink:  "https://meet.example.com/interview",
			Instructions: "Please join 5 minutes early",
		}

		interviewData, _ := json.Marshal(interview)
		message := types.Message{
			ID:        "interview_001",
			ChannelID: channel.ID,
			Type:      types.MsgTypeInterviewInvite,
			From:      employer.Address,
			To:        student.Address,
			Data: map[string]interface{}{
				"interview": string(interviewData),
			},
			Timestamp: time.Now(),
			Signature: types.Signature{
				Address:   employer.Address,
				Signature: "interview_signature",
			},
		}

		err := manager.AddMessage(message)
		require.NoError(t, err)
	})

	// 3. 雇主发送录用通知
	t.Run("SendOfferLetter", func(t *testing.T) {
		offer := types.OfferLetterData{
			Position:   "Backend Developer",
			Salary:     "$80,000/year",
			StartDate:  time.Now().Add(30 * 24 * time.Hour),
			Benefits:   []string{"Health Insurance", "401k", "PTO"},
			Terms:      "Full-time employment with 3-month probation",
			ExpiryDate: time.Now().Add(7 * 24 * time.Hour),
		}

		offerData, _ := json.Marshal(offer)
		message := types.Message{
			ID:        "offer_001",
			ChannelID: channel.ID,
			Type:      types.MsgTypeOfferLetter,
			From:      employer.Address,
			To:        student.Address,
			Data: map[string]interface{}{
				"offer": string(offerData),
			},
			Timestamp: time.Now(),
			Signature: types.Signature{
				Address:   employer.Address,
				Signature: "offer_signature",
			},
		}

		err := manager.AddMessage(message)
		require.NoError(t, err)
	})

	// 验证完整的消息历史
	t.Run("VerifyMessageHistory", func(t *testing.T) {
		messages, err := manager.GetChannelMessages(channel.ID)
		require.NoError(t, err)
		assert.Len(t, messages, 3)

		// 验证消息顺序和类型
		assert.Equal(t, types.MsgTypeJobApplication, messages[0].Type)
		assert.Equal(t, types.MsgTypeInterviewInvite, messages[1].Type)
		assert.Equal(t, types.MsgTypeOfferLetter, messages[2].Type)
	})
}

// TestChannelStatistics 测试通道统计
func TestChannelStatistics(t *testing.T) {
	config := types.ChannelConfig{
		MaxChannels:        100,
		DefaultExpiryHours: 24,
		MaxMessageSize:     1024,
		CleanupInterval:    time.Hour,
		BackupInterval:     time.Hour,
	}

	manager := channel.NewManager(config)

	// 创建多个通道进行测试
	for i := 0; i < 5; i++ {
		studentKey, _ := crypto.GenerateKey()
		employerKey, _ := crypto.GenerateKey()

		student := types.Participant{
			Address:   crypto.PubkeyToAddress(studentKey.PublicKey).Hex(),
			PublicKey: &studentKey.PublicKey,
			Role:      types.RoleStudent,
			Name:      "Student " + string(rune(i)),
		}

		employer := types.Participant{
			Address:   crypto.PubkeyToAddress(employerKey.PublicKey).Hex(),
			PublicKey: &employerKey.PublicKey,
			Role:      types.RoleEmployer,
			Name:      "Employer " + string(rune(i)),
		}

		req := &types.ChannelOpenRequest{
			ParticipantA: student,
			ParticipantB: employer,
		}

		_, err := manager.CreateChannel(req)
		require.NoError(t, err)
	}

	// 获取统计信息
	stats := manager.GetStatistics()
	assert.Equal(t, int64(5), stats.TotalChannels)
	assert.Equal(t, int64(5), stats.ChannelsByState[types.StateOpening])
	assert.Equal(t, int64(5), stats.ParticipantStats[types.RoleStudent])
	assert.Equal(t, int64(5), stats.ParticipantStats[types.RoleEmployer])
}
