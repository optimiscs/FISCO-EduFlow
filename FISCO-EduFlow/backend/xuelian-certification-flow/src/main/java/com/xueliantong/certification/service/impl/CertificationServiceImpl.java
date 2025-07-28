package com.xueliantong.certification.service.impl;

import com.xueliantong.certification.repository.ApplicationRepository;
import com.xueliantong.certification.repository.CertificateRepository;
import com.xueliantong.certification.service.BlockchainService;
import com.xueliantong.certification.service.CertificationService;
import com.xueliantong.core.dto.ApplicationRequestDto;
import com.xueliantong.core.dto.ApplicationResponseDto;
import com.xueliantong.core.dto.CertificateDto;
import com.xueliantong.core.entity.Certificate;
import com.xueliantong.core.entity.CertificationApplication;
import com.xueliantong.core.entity.User;
import com.xueliantong.core.enums.CertificationStatus;
import com.xueliantong.core.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 学历认证服务实现类
 * 
 * 实现学历认证流程的核心业务逻辑
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CertificationServiceImpl implements CertificationService {

    private final ApplicationRepository applicationRepository;
    private final CertificateRepository certificateRepository;
    private final BlockchainService blockchainService;

    @Override
    public ApplicationResponseDto submitApplication(User applicant, ApplicationRequestDto request) {
        log.info("📝 学生 {} 提交认证申请: {}", applicant.getRealName(), request.getTitle());
        
        // 验证申请人角色
        if (!applicant.isStudent()) {
            throw new IllegalArgumentException("只有学生用户可以提交认证申请");
        }
        
        // 验证请求数据完整性
        if (!request.isDataComplete()) {
            throw new IllegalArgumentException("申请数据不完整，请检查必填字段");
        }
        
        // 查找目标用人单位
        User targetUnit = findUserById(request.getTargetUnitId());
        if (!targetUnit.isUnit()) {
            throw new IllegalArgumentException("目标单位必须是用人单位角色");
        }
        
        // 检查是否存在重复申请
        boolean duplicateExists = applicationRepository.existsDuplicateApplication(
            applicant, 
            targetUnit, 
            request.getEducationLevel(), 
            Arrays.asList(CertificationStatus.REJECTED)
        );
        
        if (duplicateExists) {
            throw new IllegalStateException("您已经向该单位提交过相同学历层次的申请，请等待处理或联系相关人员");
        }
        
        // 创建申请实体
        CertificationApplication application = CertificationApplication.builder()
                .title(request.getTitle())
                .applicant(applicant)
                .targetUnit(targetUnit)
                .description(request.getDescription())
                .educationInfo(request.getEducationInfo())
                .graduateSchool(request.getGraduateSchool())
                .major(request.getMajor())
                .educationLevel(request.getEducationLevel())
                .graduationDate(request.getGraduationDate())
                .degreeCertificateNumber(request.getDegreeCertificateNumber())
                .applicantNotes(request.getApplicantNotes())
                .priority(request.getPriority())
                .isUrgent(request.getIsUrgent())
                .status(CertificationStatus.APPLIED)
                .build();
        
        // 保存申请
        application = applicationRepository.save(application);
        
        log.info("✅ 申请提交成功 - 申请ID: {}, 申请人: {}, 目标单位: {}", 
                application.getId(), applicant.getRealName(), targetUnit.getOrganization());
        
        return convertToApplicationResponseDto(application);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApplicationResponseDto> getApplicationsForUnit(Long unitId, CertificationStatus status, Pageable pageable) {
        log.info("🏢 用人单位 {} 查询申请列表, 状态: {}", unitId, status);
        
        User unit = findUserById(unitId);
        if (!unit.isUnit()) {
            throw new IllegalArgumentException("指定用户不是用人单位");
        }
        
        Page<CertificationApplication> applications;
        if (status != null) {
            applications = applicationRepository.findByTargetUnitAndStatus(unit, status, pageable);
        } else {
            applications = applicationRepository.findByTargetUnit(unit, pageable);
        }
        
        return applications.map(this::convertToApplicationResponseDto);
    }

    @Override
    public ApplicationResponseDto approveApplication(Long applicationId, Long processorId, String notes) {
        log.info("✅ 用户 {} 批准申请 {}, 备注: {}", processorId, applicationId, notes);
        
        // 查找申请
        CertificationApplication application = findApplicationById(applicationId);
        
        // 验证处理权限
        validateProcessPermission(application, processorId);
        
        // 验证申请状态
        if (!application.canBeProcessed()) {
            throw new IllegalStateException("申请状态不允许批准操作: " + application.getStatus());
        }
        
        // 更新申请状态为已批准
        application.approve(notes);
        application = applicationRepository.save(application);
        
        // 异步触发区块链交互
        try {
            processBlockchainInteraction(application);
        } catch (Exception e) {
            log.error("❌ 区块链交互失败，申请ID: {}", applicationId, e);
            // 注意：这里不回滚申请状态，而是记录错误，后续可以重试
        }
        
        log.info("✅ 申请批准成功 - 申请ID: {}", applicationId);
        return convertToApplicationResponseDto(application);
    }

    @Override
    public ApplicationResponseDto rejectApplication(Long applicationId, Long processorId, String reason) {
        log.info("❌ 用户 {} 拒绝申请 {}, 原因: {}", processorId, applicationId, reason);
        
        // 查找申请
        CertificationApplication application = findApplicationById(applicationId);
        
        // 验证处理权限
        validateProcessPermission(application, processorId);
        
        // 验证申请状态
        if (!application.canBeProcessed()) {
            throw new IllegalStateException("申请状态不允许拒绝操作: " + application.getStatus());
        }
        
        // 更新申请状态为已拒绝
        application.reject(reason);
        application = applicationRepository.save(application);
        
        log.info("❌ 申请拒绝成功 - 申请ID: {}", applicationId);
        return convertToApplicationResponseDto(application);
    }

    @Override
    public CertificateDto generateCertificate(Long applicationId, String blockchainTxId, String pdfUrl) {
        log.info("🎓 为申请 {} 生成证书, 交易ID: {}", applicationId, blockchainTxId);
        
        // 查找申请
        CertificationApplication application = findApplicationById(applicationId);
        
        // 验证申请状态
        if (application.getStatus() != CertificationStatus.APPROVED) {
            throw new IllegalStateException("只有已批准的申请才能生成证书");
        }
        
        // 检查是否已经生成过证书
        if (certificateRepository.findByApplication(application).isPresent()) {
            throw new IllegalStateException("该申请已经生成过证书");
        }
        
        // 创建证书
        Certificate certificate = Certificate.fromApplication(application, blockchainTxId, pdfUrl);
        certificate = certificateRepository.save(certificate);
        
        // 更新申请状态为已完成
        application.complete(blockchainTxId, certificate.getId());
        applicationRepository.save(application);
        
        log.info("✅ 证书生成成功 - 证书ID: {}, 序列号: {}", certificate.getId(), certificate.getSerialNumber());
        return convertToCertificateDto(certificate);
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationResponseDto getApplicationStatus(Long applicationId, Long studentId) {
        log.info("👨‍🎓 学生 {} 查询申请 {} 状态", studentId, applicationId);
        
        CertificationApplication application = findApplicationById(applicationId);
        
        // 验证查看权限（只有申请人可以查看）
        if (!application.getApplicant().getId().equals(studentId)) {
            throw new IllegalArgumentException("无权查看该申请状态");
        }
        
        return convertToApplicationResponseDto(application);
    }

    /**
     * 处理区块链交互
     * 
     * @param application 认证申请
     */
    private void processBlockchainInteraction(CertificationApplication application) {
        log.info("🔗 开始区块链交互 - 申请ID: {}", application.getId());
        
        try {
            // 调用区块链服务
            BlockchainService.BlockchainResult result = blockchainService.recordCertification(application);
            
            if (result.success()) {
                // 区块链交互成功，生成证书
                generateCertificate(application.getId(), result.transactionId(), result.pdfUrl());
                log.info("✅ 区块链交互和证书生成成功 - 申请ID: {}", application.getId());
            } else {
                // 区块链交互失败，记录错误但不影响申请状态
                log.error("❌ 区块链交互失败 - 申请ID: {}, 错误: {}", application.getId(), result.errorMessage());
                // 这里可以考虑将申请状态设置为特殊的错误状态，或者加入重试队列
            }
        } catch (Exception e) {
            log.error("❌ 处理区块链交互时发生异常 - 申请ID: {}", application.getId(), e);
            throw e;
        }
    }

    /**
     * 验证处理权限
     * 
     * @param application 申请
     * @param processorId 处理人员ID
     */
    private void validateProcessPermission(CertificationApplication application, Long processorId) {
        User processor = findUserById(processorId);
        
        // 只有目标用人单位的用户才能处理申请
        if (!application.getTargetUnit().getId().equals(processorId)) {
            throw new IllegalArgumentException("无权处理该申请");
        }
        
        if (!processor.isUnit()) {
            throw new IllegalArgumentException("只有用人单位用户才能处理申请");
        }
    }

    /**
     * 根据ID查找用户
     * 
     * @param userId 用户ID
     * @return 用户实体
     */
    private User findUserById(Long userId) {
        // 这里应该调用UserRepository或UserService，为了简化，我们暂时创建一个模拟实现
        // 在实际项目中，需要注入UserService或UserRepository
        
        // TODO: 实现用户查找逻辑
        // return userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        
        // 临时模拟实现
        User user = new User();
        user.setId(userId);
        user.setRealName("模拟用户" + userId);
        user.setRole(userId == 1L ? UserRole.STUDENT : UserRole.UNIT);
        user.setOrganization("模拟机构" + userId);
        return user;
    }

    /**
     * 根据ID查找申请
     * 
     * @param applicationId 申请ID
     * @return 申请实体
     */
    private CertificationApplication findApplicationById(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("申请不存在: " + applicationId));
    }

    /**
     * 转换申请实体为响应DTO
     * 
     * @param application 申请实体
     * @return 响应DTO
     */
    private ApplicationResponseDto convertToApplicationResponseDto(CertificationApplication application) {
        return ApplicationResponseDto.builder()
                .id(application.getId())
                .title(application.getTitle())
                .applicant(convertToUserBasicDto(application.getApplicant()))
                .targetUnit(convertToUserBasicDto(application.getTargetUnit()))
                .status(application.getStatus())
                .statusDisplayName(application.getStatus().getDisplayName())
                .statusDescription(application.getStatus().getDescription())
                .statusColorCode(application.getStatus().getColorCode())
                .description(application.getDescription())
                .educationInfo(application.getEducationInfo())
                .graduateSchool(application.getGraduateSchool())
                .major(application.getMajor())
                .educationLevel(application.getEducationLevel())
                .graduationDate(application.getGraduationDate())
                .degreeCertificateNumber(application.getDegreeCertificateNumber())
                .submissionDate(application.getSubmissionDate())
                .processedDate(application.getProcessedDate())
                .completedDate(application.getCompletedDate())
                .processorNotes(application.getProcessorNotes())
                .applicantNotes(application.getApplicantNotes())
                .rejectionReason(application.getRejectionReason())
                .certificateId(application.getCertificateId())
                .blockchainTxHash(application.getBlockchainTxHash())
                .priority(application.getPriority())
                .isUrgent(application.getIsUrgent())
                .progressPercentage(application.getProgressPercentage())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }

    /**
     * 转换用户实体为基本信息DTO
     * 
     * @param user 用户实体
     * @return 用户基本信息DTO
     */
    private ApplicationResponseDto.UserBasicDto convertToUserBasicDto(User user) {
        return ApplicationResponseDto.UserBasicDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .role(user.getRole().getCode())
                .roleDisplayName(user.getRole().getDisplayName())
                .organization(user.getOrganization())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    /**
     * 转换证书实体为DTO
     * 
     * @param certificate 证书实体
     * @return 证书DTO
     */
    private CertificateDto convertToCertificateDto(Certificate certificate) {
        return CertificateDto.builder()
                .id(certificate.getId())
                .owner(convertToUserBasicDto(certificate.getOwner()))
                .applicationId(certificate.getApplication().getId())
                .serialNumber(certificate.getSerialNumber())
                .title(certificate.getTitle())
                .issueDate(certificate.getIssueDate())
                .expiryDate(certificate.getExpiryDate())
                .blockchainTransactionId(certificate.getBlockchainTransactionId())
                .pdfUrl(certificate.getPdfUrl())
                .fileSize(certificate.getFileSize())
                .fileSizeDisplay(CertificateDto.formatFileSize(certificate.getFileSize()))
                .fileMd5(certificate.getFileMd5())
                .issuer(certificate.getIssuer())
                .certificateType(certificate.getCertificateType())
                .educationSummary(certificate.getEducationSummary())
                .graduateSchool(certificate.getGraduateSchool())
                .major(certificate.getMajor())
                .educationLevel(certificate.getEducationLevel())
                .graduationDate(certificate.getGraduationDate())
                .status(certificate.getStatus())
                .statusDisplayName(CertificateDto.getStatusDisplayName(certificate.getStatus()))
                .verificationCode(certificate.getVerificationCode())
                .downloadCount(certificate.getDownloadCount())
                .lastDownloadTime(certificate.getLastDownloadTime())
                .remarks(certificate.getRemarks())
                .createdAt(certificate.getCreatedAt())
                .updatedAt(certificate.getUpdatedAt())
                .isValid(certificate.isValid())
                .isExpired(certificate.isExpired())
                .remainingDays(CertificateDto.calculateRemainingDays(certificate.getExpiryDate()))
                .build();
    }

    // 实现其他接口方法

    @Override
    @Transactional(readOnly = true)
    public Page<ApplicationResponseDto> getApplicationsByApplicant(Long applicantId, CertificationStatus status, Pageable pageable) {
        log.info("👨‍🎓 申请人 {} 查询自己的申请列表, 状态: {}", applicantId, status);
        
        User applicant = findUserById(applicantId);
        if (!applicant.isStudent()) {
            throw new IllegalArgumentException("指定用户不是学生");
        }
        
        Page<CertificationApplication> applications;
        if (status != null) {
            applications = applicationRepository.findByApplicantAndStatus(applicant, status, pageable);
        } else {
            applications = applicationRepository.findByApplicant(applicant, pageable);
        }
        
        return applications.map(this::convertToApplicationResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationResponseDto getApplicationDetails(Long applicationId, Long userId) {
        log.info("🔍 用户 {} 查询申请 {} 详情", userId, applicationId);
        
        CertificationApplication application = findApplicationById(applicationId);
        User user = findUserById(userId);
        
        // 验证查看权限（申请人、目标单位、政府机构可以查看）
        boolean hasPermission = application.getApplicant().getId().equals(userId) ||
                               application.getTargetUnit().getId().equals(userId) ||
                               user.isGovernment();
        
        if (!hasPermission) {
            throw new IllegalArgumentException("无权查看该申请详情");
        }
        
        return convertToApplicationResponseDto(application);
    }

    @Override
    @Transactional(readOnly = true)
    public CertificateDto getCertificate(Long certificateId, Long userId) {
        log.info("🎓 用户 {} 查询证书 {} 信息", userId, certificateId);
        
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new IllegalArgumentException("证书不存在: " + certificateId));
        
        User user = findUserById(userId);
        
        // 验证查看权限（证书所有者、政府机构可以查看）
        boolean hasPermission = certificate.getOwner().getId().equals(userId) || user.isGovernment();
        
        if (!hasPermission) {
            throw new IllegalArgumentException("无权查看该证书信息");
        }
        
        return convertToCertificateDto(certificate);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CertificateDto> getCertificatesByOwner(Long ownerId, String status, Pageable pageable) {
        log.info("🎓 查询用户 {} 的证书列表, 状态: {}", ownerId, status);
        
        User owner = findUserById(ownerId);
        
        Page<Certificate> certificates;
        if (status != null && !status.trim().isEmpty()) {
            certificates = certificateRepository.findByOwnerAndStatus(owner, status, pageable);
        } else {
            certificates = certificateRepository.findByOwner(owner, pageable);
        }
        
        return certificates.map(this::convertToCertificateDto);
    }

    @Override
    @Transactional(readOnly = true)
    public CertificateDto getCertificateBySerialNumber(String serialNumber) {
        log.info("🔍 根据序列号 {} 查询证书", serialNumber);
        
        Certificate certificate = certificateRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new IllegalArgumentException("证书不存在: " + serialNumber));
        
        return convertToCertificateDto(certificate);
    }

    @Override
    @Transactional(readOnly = true)
    public CertificateDto getCertificateByVerificationCode(String verificationCode) {
        log.info("🔍 根据验证码 {} 查询证书", verificationCode);
        
        Certificate certificate = certificateRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new IllegalArgumentException("证书不存在: " + verificationCode));
        
        return convertToCertificateDto(certificate);
    }

    @Override
    public void recordCertificateDownload(Long certificateId, Long userId) {
        log.info("📥 用户 {} 下载证书 {}", userId, certificateId);
        
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new IllegalArgumentException("证书不存在: " + certificateId));
        
        User user = findUserById(userId);
        
        // 验证下载权限（证书所有者、政府机构、相关用人单位可以下载）
        boolean hasPermission = certificate.getOwner().getId().equals(userId) || 
                               user.isGovernment() ||
                               (user.isUnit() && certificate.getApplication().getTargetUnit().getId().equals(userId));
        
        if (!hasPermission) {
            throw new IllegalArgumentException("无权下载该证书");
        }
        
        if (!certificate.canDownload()) {
            throw new IllegalArgumentException("证书当前状态不允许下载");
        }
        
        // 记录下载
        certificate.recordDownload();
        certificateRepository.save(certificate);
        
        log.info("✅ 证书下载记录成功 - 证书ID: {}, 下载次数: {}", certificateId, certificate.getDownloadCount());
    }

    @Override
    public void revokeCertificate(Long certificateId, Long operatorId, String reason) {
        log.info("🚫 用户 {} 撤销证书 {}, 原因: {}", operatorId, certificateId, reason);
        
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new IllegalArgumentException("证书不存在: " + certificateId));
        
        User operator = findUserById(operatorId);
        
        // 只有政府机构可以撤销证书
        if (!operator.isGovernment()) {
            throw new IllegalArgumentException("只有政府机构用户可以撤销证书");
        }
        
        if (!"ACTIVE".equals(certificate.getStatus())) {
            throw new IllegalArgumentException("只有有效的证书才能被撤销");
        }
        
        // 撤销证书
        certificate.revoke(reason);
        certificateRepository.save(certificate);
        
        log.info("✅ 证书撤销成功 - 证书ID: {}", certificateId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<CertificationStatus, Long> getApplicationStatistics(Long unitId) {
        log.info("📊 获取申请统计信息, 单位ID: {}", unitId);
        
        List<Object[]> statistics;
        if (unitId != null) {
            User unit = findUserById(unitId);
            statistics = applicationRepository.getApplicationStatusStatisticsByTargetUnit(unit);
        } else {
            statistics = applicationRepository.getApplicationStatusStatistics();
        }
        
        Map<CertificationStatus, Long> result = new HashMap<>();
        for (Object[] stat : statistics) {
            CertificationStatus status = (CertificationStatus) stat[0];
            Long count = (Long) stat[1];
            result.put(status, count);
        }
        
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getCertificateStatistics(Long ownerId) {
        log.info("📊 获取证书统计信息, 所有者ID: {}", ownerId);
        
        List<Object[]> statistics = certificateRepository.getCertificateStatusStatistics();
        
        Map<String, Long> result = new HashMap<>();
        for (Object[] stat : statistics) {
            String status = (String) stat[0];
            Long count = (Long) stat[1];
            result.put(status, count);
        }
        
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponseDto> getOverdueApplications(int days) {
        log.info("⏰ 查找 {} 天前的过期申请", days);
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        List<CertificationStatus> pendingStatuses = Arrays.asList(
            CertificationStatus.APPLIED, 
            CertificationStatus.PENDING_APPROVAL
        );
        
        List<CertificationApplication> overdueApplications = 
                applicationRepository.findOverdueApplications(cutoffDate, pendingStatuses);
        
        return overdueApplications.stream()
                .map(this::convertToApplicationResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CertificateDto> getExpiringCertificates(int days) {
        log.info("⏰ 查找 {} 天内即将过期的证书", days);
        
        LocalDateTime currentDate = LocalDateTime.now();
        LocalDateTime expiryDate = currentDate.plusDays(days);
        
        List<Certificate> expiringCertificates = 
                certificateRepository.findCertificatesExpiringSoon(currentDate, expiryDate, "ACTIVE");
        
        return expiringCertificates.stream()
                .map(this::convertToCertificateDto)
                .collect(Collectors.toList());
    }

    @Override
    public int updateExpiredCertificates() {
        log.info("🔄 批量更新过期证书状态");
        
        LocalDateTime currentDate = LocalDateTime.now();
        List<Certificate> expiredCertificates = certificateRepository.findExpiredCertificates(currentDate);
        
        int updatedCount = 0;
        for (Certificate certificate : expiredCertificates) {
            certificate.setStatus("EXPIRED");
            certificateRepository.save(certificate);
            updatedCount++;
        }
        
        log.info("✅ 批量更新完成 - 更新了 {} 个过期证书", updatedCount);
        return updatedCount;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApplicationResponseDto> searchApplications(
            Long applicantId, Long targetUnitId, CertificationStatus status,
            LocalDateTime startDate, LocalDateTime endDate,
            String graduateSchool, String major, Pageable pageable) {
        
        log.info("🔍 复合条件搜索申请 - 申请人: {}, 单位: {}, 状态: {}", applicantId, targetUnitId, status);
        
        User applicant = applicantId != null ? findUserById(applicantId) : null;
        User targetUnit = targetUnitId != null ? findUserById(targetUnitId) : null;
        
        Page<CertificationApplication> applications = applicationRepository.findApplicationsWithConditions(
                applicant, targetUnit, status, startDate, endDate, pageable);
        
        return applications.map(this::convertToApplicationResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CertificateDto> searchCertificates(
            Long ownerId, String status, String graduateSchool, String major,
            String educationLevel, LocalDateTime startDate, LocalDateTime endDate,
            Pageable pageable) {
        
        log.info("🔍 复合条件搜索证书 - 所有者: {}, 状态: {}, 院校: {}", ownerId, status, graduateSchool);
        
        User owner = ownerId != null ? findUserById(ownerId) : null;
        
        Page<Certificate> certificates = certificateRepository.findCertificatesWithConditions(
                owner, status, graduateSchool, major, educationLevel, startDate, endDate, pageable);
        
        return certificates.map(this::convertToCertificateDto);
    }
} 