package com.xueliantong.certification.service;

import com.xueliantong.core.entity.CertificationApplication;

import java.util.Map;
import java.util.Set;

/**
 * 区块链服务接口
 * 
 * 定义与区块链交互的核心方法，包括学历认证信息上链、查询等功能
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
public interface BlockchainService {

    /**
     * 区块链交互结果
     */
    record BlockchainResult(
        boolean success,
        String transactionId,
        String pdfUrl,
        String errorMessage
    ) {
        /**
         * 创建成功结果
         * 
         * @param transactionId 交易ID
         * @param pdfUrl PDF文件URL
         * @return 成功结果
         */
        public static BlockchainResult success(String transactionId, String pdfUrl) {
            return new BlockchainResult(true, transactionId, pdfUrl, null);
        }

        /**
         * 创建失败结果
         * 
         * @param errorMessage 错误信息
         * @return 失败结果
         */
        public static BlockchainResult failure(String errorMessage) {
            return new BlockchainResult(false, null, null, errorMessage);
        }
    }

    /**
     * 将学历认证信息记录到区块链
     * 
     * @param application 认证申请信息
     * @return 区块链交互结果
     */
    BlockchainResult recordCertification(CertificationApplication application);

    /**
     * 从区块链查询认证信息
     * 
     * @param transactionId 区块链交易ID
     * @return 认证信息（JSON格式）
     */
    String queryCertificationByTransactionId(String transactionId);

    /**
     * 验证区块链上的认证信息
     * 
     * @param transactionId 区块链交易ID
     * @param expectedData 期望的数据
     * @return 验证结果
     */
    boolean verifyCertificationData(String transactionId, String expectedData);

    /**
     * 获取区块链网络状态
     * 
     * @return 网络状态信息
     */
    String getNetworkStatus();

    /**
     * 检查区块链服务是否可用
     * 
     * @return 如果服务可用返回true，否则返回false
     */
    boolean isServiceAvailable();

    /**
     * 根据学生ID和指定字段从区块链获取学籍信息
     * 
     * 支持选择性查询，只返回请求的字段，实现隐私保护
     * 
     * @param studentId 学生ID
     * @param fields 需要查询的字段集合，支持的字段包括：
     *               - "studentId": 学生ID
     *               - "realName": 真实姓名（脱敏）
     *               - "idNumber": 身份证号（脱敏）
     *               - "school": 就读/毕业院校
     *               - "major": 专业名称
     *               - "degree": 学位信息
     *               - "educationLevel": 学历层次
     *               - "admissionDate": 入学时间
     *               - "graduationDate": 毕业时间
     *               - "studentStatus": 学籍状态
     *               - "gpa": 绩点信息
     *               - "awards": 获奖情况
     *               - "certifications": 已获认证
     * @return 包含请求字段的学籍信息Map，如果学生不存在或字段无效返回空Map
     */
    Map<String, Object> getAcademicInfo(String studentId, Set<String> fields);

    /**
     * 学籍信息查询结果
     */
    record AcademicInfoResult(
        boolean success,
        Map<String, Object> data,
        String errorMessage,
        String dataSource
    ) {
        /**
         * 创建成功结果
         * 
         * @param data 学籍数据
         * @param dataSource 数据来源
         * @return 成功结果
         */
        public static AcademicInfoResult success(Map<String, Object> data, String dataSource) {
            return new AcademicInfoResult(true, data, null, dataSource);
        }

        /**
         * 创建失败结果
         * 
         * @param errorMessage 错误信息
         * @return 失败结果
         */
        public static AcademicInfoResult failure(String errorMessage) {
            return new AcademicInfoResult(false, null, errorMessage, null);
        }
    }

    /**
     * 根据学生ID和指定字段从区块链获取学籍信息（增强版本）
     * 
     * @param studentId 学生ID
     * @param fields 需要查询的字段集合
     * @return 学籍信息查询结果
     */
    AcademicInfoResult getAcademicInfoEnhanced(String studentId, Set<String> fields);
} 