package com.xueliantong.certification.controller;

import com.xueliantong.certification.service.CertificationService;
import com.xueliantong.core.dto.ApplicationRequestDto;
import com.xueliantong.core.dto.ApplicationResponseDto;
import com.xueliantong.core.dto.CertificateDto;
import com.xueliantong.core.entity.User;
import com.xueliantong.core.enums.CertificationStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 学历认证控制器
 * 
 * 提供学历认证相关的REST API接口
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Slf4j
@RestController
@RequestMapping("/api/certifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 开发环境允许跨域，生产环境应限制具体域名
public class CertificationController {

    private final CertificationService certificationService;

    /**
     * 学生提交认证申请
     * 
     * POST /api/certifications/applications
     */
    @PostMapping("/applications")
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> submitApplication(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody ApplicationRequestDto request) {
        
        log.info("🎓 用户 {} 提交认证申请: {}", userId, request.getTitle());
        
        try {
            // 临时创建用户对象，实际项目中应从认证上下文获取
            User applicant = createTempUser(userId, "STUDENT");
            
            ApplicationResponseDto response = certificationService.submitApplication(applicant, request);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("申请提交成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 申请提交失败 - 参数错误: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("申请提交失败: " + e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("❌ 申请提交失败 - 状态错误: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("申请提交失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 申请提交失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 用人单位查看发给自己的申请列表
     * 
     * GET /api/certifications/units/{unitId}/applications
     */
    @GetMapping("/units/{unitId}/applications")
    public ResponseEntity<ApiResponse<Page<ApplicationResponseDto>>> getApplicationsForUnit(
            @PathVariable Long unitId,
            @RequestParam(required = false) CertificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submissionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        log.info("🏢 查询用人单位 {} 的申请列表", unitId);
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<ApplicationResponseDto> applications = 
                    certificationService.getApplicationsForUnit(unitId, status, pageable);
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", applications));
        } catch (Exception e) {
            log.error("❌ 查询申请列表失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 用人单位批准申请
     * 
     * POST /api/certifications/applications/{id}/approve
     */
    @PostMapping("/applications/{id}/approve")
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> approveApplication(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long processorId,
            @RequestBody(required = false) Map<String, String> requestBody) {
        
        log.info("✅ 用户 {} 批准申请 {}", processorId, id);
        
        try {
            String notes = requestBody != null ? requestBody.get("notes") : null;
            
            ApplicationResponseDto response = 
                    certificationService.approveApplication(id, processorId, notes);
            
            return ResponseEntity.ok(ApiResponse.success("申请批准成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 申请批准失败 - 参数错误: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("批准失败: " + e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("❌ 申请批准失败 - 状态错误: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("批准失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 申请批准失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 用人单位拒绝申请
     * 
     * POST /api/certifications/applications/{id}/reject
     */
    @PostMapping("/applications/{id}/reject")
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> rejectApplication(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long processorId,
            @RequestBody Map<String, String> requestBody) {
        
        log.info("❌ 用户 {} 拒绝申请 {}", processorId, id);
        
        try {
            String reason = requestBody.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("拒绝原因不能为空"));
            }
            
            ApplicationResponseDto response = 
                    certificationService.rejectApplication(id, processorId, reason);
            
            return ResponseEntity.ok(ApiResponse.success("申请拒绝成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 申请拒绝失败 - 参数错误: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("拒绝失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 申请拒绝失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 学生查询申请状态
     * 
     * GET /api/certifications/applications/{id}/status
     */
    @GetMapping("/applications/{id}/status")
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> getApplicationStatus(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long studentId) {
        
        log.info("👨‍🎓 学生 {} 查询申请 {} 状态", studentId, id);
        
        try {
            ApplicationResponseDto response = 
                    certificationService.getApplicationStatus(id, studentId);
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 查询申请状态失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 查询申请状态失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 获取申请详情
     * 
     * GET /api/certifications/applications/{id}
     */
    @GetMapping("/applications/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> getApplicationDetails(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        
        log.info("🔍 用户 {} 查询申请 {} 详情", userId, id);
        
        try {
            ApplicationResponseDto response = 
                    certificationService.getApplicationDetails(id, userId);
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 查询申请详情失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 查询申请详情失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 根据申请人获取申请列表
     * 
     * GET /api/certifications/students/{studentId}/applications
     */
    @GetMapping("/students/{studentId}/applications")
    public ResponseEntity<ApiResponse<Page<ApplicationResponseDto>>> getApplicationsByApplicant(
            @PathVariable Long studentId,
            @RequestParam(required = false) CertificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submissionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        log.info("👨‍🎓 查询学生 {} 的申请列表", studentId);
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<ApplicationResponseDto> applications = 
                    certificationService.getApplicationsByApplicant(studentId, status, pageable);
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", applications));
        } catch (Exception e) {
            log.error("❌ 查询学生申请列表失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 获取证书信息
     * 
     * GET /api/certifications/certificates/{id}
     */
    @GetMapping("/certificates/{id}")
    public ResponseEntity<ApiResponse<CertificateDto>> getCertificate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        
        log.info("🎓 用户 {} 查询证书 {} 信息", userId, id);
        
        try {
            CertificateDto response = certificationService.getCertificate(id, userId);
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 查询证书失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 查询证书失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 证书下载
     * 
     * GET /api/certifications/certificates/{id}/download
     */
    @GetMapping("/certificates/{id}/download")
    public ResponseEntity<?> downloadCertificate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        
        log.info("📥 用户 {} 下载证书 {}", userId, id);
        
        try {
            // 记录下载
            certificationService.recordCertificateDownload(id, userId);
            
            // 获取证书信息
            CertificateDto certificate = certificationService.getCertificate(id, userId);
            
            // 在实际项目中，这里应该返回PDF文件流
            // 现在返回重定向到PDF URL
            HttpHeaders headers = new HttpHeaders();
            headers.add("Location", certificate.getPdfUrl());
            headers.add("Content-Disposition", 
                String.format("attachment; filename=\"%s.pdf\"", certificate.getSerialNumber()));
            
            return ResponseEntity.status(HttpStatus.FOUND).headers(headers).build();
        } catch (IllegalArgumentException e) {
            log.warn("❌ 证书下载失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("下载失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ 证书下载失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 根据证书所有者获取证书列表
     * 
     * GET /api/certifications/owners/{ownerId}/certificates
     */
    @GetMapping("/owners/{ownerId}/certificates")
    public ResponseEntity<ApiResponse<Page<CertificateDto>>> getCertificatesByOwner(
            @PathVariable Long ownerId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        log.info("🎓 查询用户 {} 的证书列表", ownerId);
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<CertificateDto> certificates = 
                    certificationService.getCertificatesByOwner(ownerId, status, pageable);
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", certificates));
        } catch (Exception e) {
            log.error("❌ 查询证书列表失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 根据序列号查找证书
     * 
     * GET /api/certifications/certificates/serial/{serialNumber}
     */
    @GetMapping("/certificates/serial/{serialNumber}")
    public ResponseEntity<ApiResponse<CertificateDto>> getCertificateBySerialNumber(
            @PathVariable String serialNumber) {
        
        log.info("🔍 根据序列号 {} 查询证书", serialNumber);
        
        try {
            CertificateDto response = certificationService.getCertificateBySerialNumber(serialNumber);
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 证书查询失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("证书不存在"));
        } catch (Exception e) {
            log.error("❌ 证书查询失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 根据验证码查找证书
     * 
     * GET /api/certifications/certificates/verify/{verificationCode}
     */
    @GetMapping("/certificates/verify/{verificationCode}")
    public ResponseEntity<ApiResponse<CertificateDto>> getCertificateByVerificationCode(
            @PathVariable String verificationCode) {
        
        log.info("🔍 根据验证码 {} 查询证书", verificationCode);
        
        try {
            CertificateDto response = certificationService.getCertificateByVerificationCode(verificationCode);
            
            return ResponseEntity.ok(ApiResponse.success("验证成功", response));
        } catch (IllegalArgumentException e) {
            log.warn("❌ 证书验证失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("证书不存在或验证码错误"));
        } catch (Exception e) {
            log.error("❌ 证书验证失败 - 系统错误", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试"));
        }
    }

    /**
     * 获取申请统计信息
     * 
     * GET /api/certifications/applications/statistics
     */
    @GetMapping("/applications/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApplicationStatistics(
            @RequestParam(required = false) Long unitId) {
        
        log.info("📊 获取申请统计信息");
        
        try {
            Map<CertificationStatus, Long> statistics = 
                    certificationService.getApplicationStatistics(unitId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("statistics", statistics);
            response.put("unitId", unitId);
            response.put("totalCount", statistics.values().stream().mapToLong(Long::longValue).sum());
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", response));
        } catch (Exception e) {
            log.error("❌ 获取申请统计失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 获取证书统计信息
     * 
     * GET /api/certifications/certificates/statistics
     */
    @GetMapping("/certificates/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCertificateStatistics(
            @RequestParam(required = false) Long ownerId) {
        
        log.info("📊 获取证书统计信息");
        
        try {
            Map<String, Long> statistics = 
                    certificationService.getCertificateStatistics(ownerId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("statistics", statistics);
            response.put("ownerId", ownerId);
            response.put("totalCount", statistics.values().stream().mapToLong(Long::longValue).sum());
            
            return ResponseEntity.ok(ApiResponse.success("查询成功", response));
        } catch (Exception e) {
            log.error("❌ 获取证书统计失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 复合条件搜索申请
     * 
     * GET /api/certifications/applications/search
     */
    @GetMapping("/applications/search")
    public ResponseEntity<ApiResponse<Page<ApplicationResponseDto>>> searchApplications(
            @RequestParam(required = false) Long applicantId,
            @RequestParam(required = false) Long targetUnitId,
            @RequestParam(required = false) CertificationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String graduateSchool,
            @RequestParam(required = false) String major,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submissionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        log.info("🔍 复合条件搜索申请");
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<ApplicationResponseDto> applications = certificationService.searchApplications(
                    applicantId, targetUnitId, status, startDate, endDate,
                    graduateSchool, major, pageable);
            
            return ResponseEntity.ok(ApiResponse.success("搜索成功", applications));
        } catch (Exception e) {
            log.error("❌ 搜索申请失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("搜索失败: " + e.getMessage()));
        }
    }

    /**
     * 复合条件搜索证书
     * 
     * GET /api/certifications/certificates/search
     */
    @GetMapping("/certificates/search")
    public ResponseEntity<ApiResponse<Page<CertificateDto>>> searchCertificates(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String graduateSchool,
            @RequestParam(required = false) String major,
            @RequestParam(required = false) String educationLevel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        log.info("🔍 复合条件搜索证书");
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<CertificateDto> certificates = certificationService.searchCertificates(
                    ownerId, status, graduateSchool, major, educationLevel,
                    startDate, endDate, pageable);
            
            return ResponseEntity.ok(ApiResponse.success("搜索成功", certificates));
        } catch (Exception e) {
            log.error("❌ 搜索证书失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("搜索失败: " + e.getMessage()));
        }
    }

    /**
     * 临时创建用户对象（仅用于演示，实际项目中应从认证上下文获取）
     */
    private User createTempUser(Long userId, String role) {
        User user = new User();
        user.setId(userId);
        user.setRealName("用户" + userId);
        
        switch (role) {
            case "STUDENT" -> user.setRole(com.xueliantong.core.enums.UserRole.STUDENT);
            case "UNIT" -> user.setRole(com.xueliantong.core.enums.UserRole.UNIT);
            default -> user.setRole(com.xueliantong.core.enums.UserRole.GOVERNMENT);
        }
        
        user.setOrganization("机构" + userId);
        return user;
    }

    /**
     * 统一API响应格式
     */
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
        private String timestamp;

        public ApiResponse(boolean success, String message, T data) {
            this.success = success;
            this.message = message;
            this.data = data;
            this.timestamp = LocalDateTime.now().toString();
        }

        public static <T> ApiResponse<T> success(String message, T data) {
            return new ApiResponse<>(true, message, data);
        }

        public static <T> ApiResponse<T> error(String message) {
            return new ApiResponse<>(false, message, null);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public T getData() { return data; }
        public String getTimestamp() { return timestamp; }
    }
} 