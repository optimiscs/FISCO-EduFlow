package com.xueliantong.certification.service;

import com.xueliantong.core.dto.ApplicationRequestDto;
import com.xueliantong.core.dto.ApplicationResponseDto;
import com.xueliantong.core.dto.CertificateDto;
import com.xueliantong.core.entity.User;
import com.xueliantong.core.enums.CertificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 学历认证服务接口
 * 
 * 定义学历认证流程的核心业务方法
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
public interface CertificationService {

    /**
     * 学生提交认证申请
     * 
     * @param applicant 申请人
     * @param request 申请请求数据
     * @return 申请响应信息
     * @throws IllegalArgumentException 如果参数无效
     * @throws IllegalStateException 如果存在重复申请
     */
    ApplicationResponseDto submitApplication(User applicant, ApplicationRequestDto request);

    /**
     * 用人单位获取发给自己的申请列表
     * 
     * @param unitId 用人单位ID
     * @param status 申请状态（可选）
     * @param pageable 分页参数
     * @return 申请列表分页数据
     */
    Page<ApplicationResponseDto> getApplicationsForUnit(Long unitId, CertificationStatus status, Pageable pageable);

    /**
     * 用人单位批准申请
     * 
     * @param applicationId 申请ID
     * @param processorId 处理人员ID
     * @param notes 批准备注
     * @return 更新后的申请信息
     * @throws IllegalArgumentException 如果申请不存在或无权处理
     * @throws IllegalStateException 如果申请状态不允许批准
     */
    ApplicationResponseDto approveApplication(Long applicationId, Long processorId, String notes);

    /**
     * 用人单位拒绝申请
     * 
     * @param applicationId 申请ID
     * @param processorId 处理人员ID
     * @param reason 拒绝原因
     * @return 更新后的申请信息
     * @throws IllegalArgumentException 如果申请不存在或无权处理
     * @throws IllegalStateException 如果申请状态不允许拒绝
     */
    ApplicationResponseDto rejectApplication(Long applicationId, Long processorId, String reason);

    /**
     * 生成证书（在区块链交互成功后调用）
     * 
     * @param applicationId 申请ID
     * @param blockchainTxId 区块链交易ID
     * @param pdfUrl PDF文件URL
     * @return 生成的证书信息
     */
    CertificateDto generateCertificate(Long applicationId, String blockchainTxId, String pdfUrl);

    /**
     * 学生查询申请进度
     * 
     * @param applicationId 申请ID
     * @param studentId 学生ID
     * @return 申请状态信息
     * @throws IllegalArgumentException 如果申请不存在或无权查看
     */
    ApplicationResponseDto getApplicationStatus(Long applicationId, Long studentId);

    /**
     * 根据申请人获取申请列表
     * 
     * @param applicantId 申请人ID
     * @param status 申请状态（可选）
     * @param pageable 分页参数
     * @return 申请列表分页数据
     */
    Page<ApplicationResponseDto> getApplicationsByApplicant(Long applicantId, CertificationStatus status, Pageable pageable);

    /**
     * 获取申请详情
     * 
     * @param applicationId 申请ID
     * @param userId 当前用户ID
     * @return 申请详情
     * @throws IllegalArgumentException 如果申请不存在或无权查看
     */
    ApplicationResponseDto getApplicationDetails(Long applicationId, Long userId);

    /**
     * 获取证书信息
     * 
     * @param certificateId 证书ID
     * @param userId 当前用户ID
     * @return 证书信息
     * @throws IllegalArgumentException 如果证书不存在或无权查看
     */
    CertificateDto getCertificate(Long certificateId, Long userId);

    /**
     * 根据证书所有者获取证书列表
     * 
     * @param ownerId 证书所有者ID
     * @param status 证书状态（可选）
     * @param pageable 分页参数
     * @return 证书列表分页数据
     */
    Page<CertificateDto> getCertificatesByOwner(Long ownerId, String status, Pageable pageable);

    /**
     * 根据序列号查找证书
     * 
     * @param serialNumber 证书序列号
     * @return 证书信息
     * @throws IllegalArgumentException 如果证书不存在
     */
    CertificateDto getCertificateBySerialNumber(String serialNumber);

    /**
     * 根据验证码查找证书
     * 
     * @param verificationCode 验证码
     * @return 证书信息
     * @throws IllegalArgumentException 如果证书不存在
     */
    CertificateDto getCertificateByVerificationCode(String verificationCode);

    /**
     * 记录证书下载
     * 
     * @param certificateId 证书ID
     * @param userId 下载用户ID
     * @throws IllegalArgumentException 如果证书不存在或无权下载
     */
    void recordCertificateDownload(Long certificateId, Long userId);

    /**
     * 撤销证书
     * 
     * @param certificateId 证书ID
     * @param operatorId 操作人员ID
     * @param reason 撤销原因
     * @throws IllegalArgumentException 如果证书不存在或无权操作
     */
    void revokeCertificate(Long certificateId, Long operatorId, String reason);

    /**
     * 获取申请统计信息
     * 
     * @param unitId 用人单位ID（可选，如果提供则只统计该单位的数据）
     * @return 统计信息Map，key为状态，value为数量
     */
    java.util.Map<CertificationStatus, Long> getApplicationStatistics(Long unitId);

    /**
     * 获取证书统计信息
     * 
     * @param ownerId 证书所有者ID（可选，如果提供则只统计该用户的数据）
     * @return 统计信息Map，key为状态，value为数量
     */
    java.util.Map<String, Long> getCertificateStatistics(Long ownerId);

    /**
     * 查找过期未处理的申请
     * 
     * @param days 过期天数
     * @return 过期申请列表
     */
    List<ApplicationResponseDto> getOverdueApplications(int days);

    /**
     * 查找即将过期的证书
     * 
     * @param days 即将过期的天数阈值
     * @return 即将过期的证书列表
     */
    List<CertificateDto> getExpiringCertificates(int days);

    /**
     * 批量处理过期证书（将状态更新为EXPIRED）
     * 
     * @return 更新的证书数量
     */
    int updateExpiredCertificates();

    /**
     * 复合条件搜索申请
     * 
     * @param applicantId 申请人ID（可选）
     * @param targetUnitId 目标单位ID（可选）
     * @param status 申请状态（可选）
     * @param startDate 开始时间（可选）
     * @param endDate 结束时间（可选）
     * @param graduateSchool 毕业院校关键字（可选）
     * @param major 专业关键字（可选）
     * @param pageable 分页参数
     * @return 申请列表分页数据
     */
    Page<ApplicationResponseDto> searchApplications(
            Long applicantId, 
            Long targetUnitId, 
            CertificationStatus status,
            LocalDateTime startDate, 
            LocalDateTime endDate,
            String graduateSchool,
            String major,
            Pageable pageable);

    /**
     * 复合条件搜索证书
     * 
     * @param ownerId 证书所有者ID（可选）
     * @param status 证书状态（可选）
     * @param graduateSchool 毕业院校关键字（可选）
     * @param major 专业关键字（可选）
     * @param educationLevel 学历层次（可选）
     * @param startDate 颁发开始时间（可选）
     * @param endDate 颁发结束时间（可选）
     * @param pageable 分页参数
     * @return 证书列表分页数据
     */
    Page<CertificateDto> searchCertificates(
            Long ownerId,
            String status,
            String graduateSchool,
            String major,
            String educationLevel,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable);
} 