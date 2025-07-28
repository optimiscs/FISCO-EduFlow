package com.xueliantong.certification.controller;

import com.xueliantong.certification.service.BlockchainService;
import com.xueliantong.core.dto.AcademicInfoRequestDto;
import com.xueliantong.core.dto.AcademicInfoResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * 学籍管理控制器
 * 
 * 提供学籍信息查询相关的REST API接口，支持隐私保护的选择性查询
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Slf4j
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 开发环境允许跨域，生产环境应限制具体域名
public class AcademicController {

    private final BlockchainService blockchainService;

    /**
     * 学籍信息选择性查询
     * 
     * POST /api/student/academic-info
     * 
     * 这是一个特殊的查询接口，支持隐私保护的选择性字段查询。
     * 只返回请求的字段，有效保护学生隐私。
     */
    @PostMapping("/academic-info")
    public ResponseEntity<ApiResponse<AcademicInfoResponseDto>> getAcademicInfo(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody AcademicInfoRequestDto request) {
        
        log.info("🎓 用户 {} ({}) 查询学生 {} 的学籍信息，字段: {}", 
                userId, userRole, request.getStudentId(), request.getFields());
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 验证请求字段
            if (!request.areFieldsValid()) {
                Set<String> unsupportedFields = request.getUnsupportedFields();
                String errorMsg = String.format("不支持的查询字段: %s。支持的字段: %s", 
                                               unsupportedFields, AcademicInfoRequestDto.getSupportedFields());
                log.warn("❌ 字段验证失败: {}", errorMsg);
                
                AcademicInfoResponseDto response = AcademicInfoResponseDto.failure(
                    request.getStudentId(), errorMsg, request.getFields());
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("查询失败: " + errorMsg, response));
            }
            
            // 敏感信息访问控制（可根据需要实现更复杂的权限控制）
            if (request.containsSensitiveFields()) {
                log.info("⚠️ 请求包含敏感字段，需要额外验证");
                
                // 这里可以添加额外的权限验证逻辑
                // 例如：检查用户是否有权访问敏感信息
                if (!hasPermissionForSensitiveData(userId, userRole, request.getStudentId())) {
                    String errorMsg = "无权访问敏感学籍信息";
                    log.warn("❌ 权限验证失败: 用户 {} 无权访问学生 {} 的敏感信息", userId, request.getStudentId());
                    
                    AcademicInfoResponseDto response = AcademicInfoResponseDto.failure(
                        request.getStudentId(), errorMsg, request.getFields());
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(ApiResponse.error(errorMsg, response));
                }
            }
            
            // 调用区块链服务查询学籍信息（增强版本）
            BlockchainService.AcademicInfoResult result = 
                    blockchainService.getAcademicInfoEnhanced(request.getStudentId(), request.getFields());
            
            long endTime = System.currentTimeMillis();
            long queryDuration = endTime - startTime;
            
            if (result.success()) {
                // 查询成功，构建响应
                AcademicInfoResponseDto response = AcademicInfoResponseDto.success(
                    request.getStudentId(), result.data(), request.getFields(), result.dataSource());
                
                // 更新查询耗时
                if (response.getMetadata() != null) {
                    response.getMetadata().setQueryDuration(queryDuration);
                }
                
                // 记录审计日志
                logAuditTrail(userId, userRole, request, response, "SUCCESS");
                
                log.info("✅ 学籍信息查询成功 - 学生ID: {}, 返回字段: {}, 耗时: {}ms", 
                        request.getStudentId(), response.getReturnedFields().size(), queryDuration);
                
                return ResponseEntity.ok(ApiResponse.success("查询成功", response));
            } else {
                // 查询失败
                AcademicInfoResponseDto response = AcademicInfoResponseDto.failure(
                    request.getStudentId(), result.errorMessage(), request.getFields());
                
                if (response.getMetadata() != null) {
                    response.getMetadata().setQueryDuration(queryDuration);
                }
                
                logAuditTrail(userId, userRole, request, response, "FAILED");
                
                log.warn("❌ 学籍信息查询失败 - 学生ID: {}, 错误: {}", 
                        request.getStudentId(), result.errorMessage());
                
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("查询失败: " + result.errorMessage(), response));
            }
            
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            long queryDuration = endTime - startTime;
            
            log.error("❌ 学籍信息查询发生系统错误 - 学生ID: {}", request.getStudentId(), e);
            
            AcademicInfoResponseDto response = AcademicInfoResponseDto.failure(
                request.getStudentId(), "系统错误: " + e.getMessage(), request.getFields());
            
            if (response.getMetadata() != null) {
                response.getMetadata().setQueryDuration(queryDuration);
            }
            
            logAuditTrail(userId, userRole, request, response, "ERROR");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("系统错误，请稍后重试", response));
        }
    }

    /**
     * 获取支持的查询字段列表
     * 
     * GET /api/student/academic-info/fields
     */
    @GetMapping("/academic-info/fields")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupportedFields() {
        log.info("📋 获取支持的查询字段列表");
        
        try {
            Set<String> supportedFields = AcademicInfoRequestDto.getSupportedFields();
            Set<String> sensitiveFields = Set.of("realName", "idNumber", "gpa", "awards");
            Set<String> basicFields = Set.of("studentId", "school", "major", "degree", "educationLevel");
            
            Map<String, Object> response = Map.of(
                "supportedFields", supportedFields,
                "sensitiveFields", sensitiveFields,
                "basicFields", basicFields,
                "totalCount", supportedFields.size(),
                "description", "学籍信息查询支持的字段列表",
                "lastUpdated", LocalDateTime.now()
            );
            
            return ResponseEntity.ok(ApiResponse.success("获取成功", response));
        } catch (Exception e) {
            log.error("❌ 获取支持字段列表失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取失败: " + e.getMessage()));
        }
    }

    /**
     * 验证用户是否有权访问敏感数据
     * 
     * @param userId 用户ID
     * @param userRole 用户角色
     * @param studentId 学生ID
     * @return 如果有权限返回true，否则返回false
     */
    private boolean hasPermissionForSensitiveData(Long userId, String userRole, String studentId) {
        // 简单的权限控制逻辑，实际项目中应该更复杂
        
        // 学生本人可以查看自己的敏感信息
        if (userId != null && userId.toString().equals(studentId)) {
            return true;
        }
        
        // 政府机构用户可以查看所有敏感信息
        if ("GOVERNMENT".equals(userRole)) {
            return true;
        }
        
        // 用人单位用户在特定情况下可以查看敏感信息（例如：已通过认证申请）
        if ("UNIT".equals(userRole)) {
            // 这里可以添加更细致的验证逻辑
            // 例如：检查是否存在该用人单位与学生之间的有效认证申请
            return true; // 暂时允许，实际项目中需要更严格的验证
        }
        
        return false;
    }

    /**
     * 记录审计追踪日志
     * 
     * @param userId 用户ID
     * @param userRole 用户角色
     * @param request 请求信息
     * @param response 响应信息
     * @param result 查询结果
     */
    private void logAuditTrail(Long userId, String userRole, AcademicInfoRequestDto request, 
                              AcademicInfoResponseDto response, String result) {
        try {
            log.info("📋 审计日志 - 用户ID: {}, 角色: {}, 目标学生: {}, 查询字段: {}, 结果: {}, 追踪ID: {}", 
                    userId, userRole, request.getStudentId(), request.getFields(), 
                    result, response.getMetadata() != null ? response.getMetadata().getAuditTrackingId() : "N/A");
            
            // 实际项目中，这里应该将审计日志存储到专门的审计数据库或日志系统中
            // 包含更详细的信息如：IP地址、用户代理、查询时间、响应时间等
        } catch (Exception e) {
            log.error("❌ 记录审计日志失败", e);
        }
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

        public static <T> ApiResponse<T> error(String message, T data) {
            return new ApiResponse<>(false, message, data);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public T getData() { return data; }
        public String getTimestamp() { return timestamp; }
    }
} 