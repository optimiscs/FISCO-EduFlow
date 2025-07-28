package com.xueliantong.certification.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xueliantong.certification.service.BlockchainService;
import com.xueliantong.core.entity.CertificationApplication;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 区块链服务Mock实现
 * 
 * 用于开发和测试阶段，模拟区块链交互功能
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "xueliantong.blockchain.mock-mode", havingValue = "true", matchIfMissing = true)
public class MockBlockchainServiceImpl implements BlockchainService {

    private final ObjectMapper objectMapper;
    private final Random random;
    private final Map<String, String> mockTransactions;

    /**
     * 构造函数
     */
    public MockBlockchainServiceImpl() {
        this.objectMapper = new ObjectMapper();
        this.random = new Random();
        this.mockTransactions = new ConcurrentHashMap<>();
    }

    @Override
    public BlockchainResult recordCertification(CertificationApplication application) {
        log.info("📦 开始模拟区块链上链操作 - 申请ID: {}", application.getId());
        
        try {
            // 模拟网络延迟
            Thread.sleep(1000 + random.nextInt(2000)); // 1-3秒的模拟延迟
            
            // 模拟偶发性网络错误（5%概率）
            if (random.nextInt(100) < 5) {
                String errorMsg = "模拟网络错误：区块链网络暂时不可用";
                log.warn("⚠️ 模拟区块链网络错误: {}", errorMsg);
                return BlockchainResult.failure(errorMsg);
            }
            
            // 生成模拟的区块链交易ID
            String transactionId = generateMockTransactionId();
            
            // 生成模拟的PDF文件URL
            String pdfUrl = generateMockPdfUrl(application);
            
            // 构建上链数据
            Map<String, Object> chainData = buildChainData(application);
            
            // 存储模拟交易数据
            try {
                String jsonData = objectMapper.writeValueAsString(chainData);
                mockTransactions.put(transactionId, jsonData);
                log.info("📝 模拟数据已存储到交易ID: {}", transactionId);
            } catch (Exception e) {
                log.error("❌ 序列化上链数据失败", e);
                return BlockchainResult.failure("数据序列化失败: " + e.getMessage());
            }
            
            log.info("✅ 模拟区块链上链成功 - 交易ID: {}, PDF: {}", transactionId, pdfUrl);
            return BlockchainResult.success(transactionId, pdfUrl);
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("❌ 模拟区块链操作被中断", e);
            return BlockchainResult.failure("操作被中断");
        } catch (Exception e) {
            log.error("❌ 模拟区块链操作失败", e);
            return BlockchainResult.failure("未知错误: " + e.getMessage());
        }
    }

    @Override
    public String queryCertificationByTransactionId(String transactionId) {
        log.info("🔍 查询模拟交易数据 - 交易ID: {}", transactionId);
        
        String data = mockTransactions.get(transactionId);
        if (data != null) {
            log.info("✅ 找到模拟交易数据");
            return data;
        } else {
            log.warn("⚠️ 未找到交易ID对应的数据: {}", transactionId);
            return null;
        }
    }

    @Override
    public boolean verifyCertificationData(String transactionId, String expectedData) {
        log.info("🔒 验证模拟交易数据 - 交易ID: {}", transactionId);
        
        String actualData = mockTransactions.get(transactionId);
        boolean isValid = actualData != null && actualData.equals(expectedData);
        
        if (isValid) {
            log.info("✅ 模拟数据验证成功");
        } else {
            log.warn("⚠️ 模拟数据验证失败");
        }
        
        return isValid;
    }

    @Override
    public String getNetworkStatus() {
        log.info("📊 获取模拟区块链网络状态");
        
        Map<String, Object> status = new HashMap<>();
        status.put("network", "学链通测试网络 (Mock)");
        status.put("status", "正常");
        status.put("blockHeight", 1000000 + random.nextInt(10000));
        status.put("connectedPeers", 8 + random.nextInt(5));
        status.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        status.put("mode", "MOCK");
        
        try {
            return objectMapper.writeValueAsString(status);
        } catch (Exception e) {
            log.error("❌ 序列化网络状态失败", e);
            return "{\"error\":\"状态序列化失败\"}";
        }
    }

    @Override
    public boolean isServiceAvailable() {
        log.debug("🏥 检查模拟区块链服务可用性");
        
        // 模拟偶发性服务不可用（2%概率）
        boolean available = random.nextInt(100) >= 2;
        
        if (available) {
            log.debug("✅ 模拟区块链服务可用");
        } else {
            log.warn("⚠️ 模拟区块链服务暂时不可用");
        }
        
        return available;
    }

    @Override
    public Map<String, Object> getAcademicInfo(String studentId, Set<String> fields) {
        log.info("🎓 查询学生 {} 的学籍信息，字段: {}", studentId, fields);
        
        try {
            // 模拟网络延迟
            Thread.sleep(500 + random.nextInt(1000)); // 0.5-1.5秒延迟
            
            // 模拟偶发性查询错误（3%概率）
            if (random.nextInt(100) < 3) {
                log.warn("⚠️ 模拟区块链查询错误");
                return new HashMap<>();
            }
            
            // 获取模拟学籍数据
            Map<String, Object> fullData = generateMockAcademicData(studentId);
            
            // 根据请求字段过滤数据
            Map<String, Object> filteredData = new HashMap<>();
            for (String field : fields) {
                if (fullData.containsKey(field)) {
                    filteredData.put(field, fullData.get(field));
                }
            }
            
            log.info("✅ 学籍信息查询成功 - 学生ID: {}, 返回字段数: {}", studentId, filteredData.size());
            return filteredData;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("❌ 学籍信息查询被中断", e);
            return new HashMap<>();
        } catch (Exception e) {
            log.error("❌ 学籍信息查询失败", e);
            return new HashMap<>();
        }
    }

    @Override
    public AcademicInfoResult getAcademicInfoEnhanced(String studentId, Set<String> fields) {
        log.info("🎓 增强查询学生 {} 的学籍信息，字段: {}", studentId, fields);
        
        try {
            // 模拟网络延迟
            Thread.sleep(500 + random.nextInt(1000));
            
            // 模拟偶发性查询错误（3%概率）
            if (random.nextInt(100) < 3) {
                String errorMsg = "模拟区块链网络错误：学籍数据暂时不可访问";
                log.warn("⚠️ {}", errorMsg);
                return AcademicInfoResult.failure(errorMsg);
            }
            
            // 验证学生ID格式
            if (studentId == null || studentId.trim().isEmpty()) {
                return AcademicInfoResult.failure("学生ID不能为空");
            }
            
            // 模拟学生不存在的情况（特定ID）
            if ("999999".equals(studentId)) {
                return AcademicInfoResult.failure("学生不存在");
            }
            
            // 获取模拟学籍数据
            Map<String, Object> fullData = generateMockAcademicData(studentId);
            
            // 根据请求字段过滤数据
            Map<String, Object> filteredData = new HashMap<>();
            for (String field : fields) {
                if (fullData.containsKey(field)) {
                    filteredData.put(field, fullData.get(field));
                } else {
                    log.warn("⚠️ 不支持的字段: {}", field);
                }
            }
            
            // 添加查询元数据
            filteredData.put("_metadata", Map.of(
                "queryTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "requestedFields", fields.size(),
                "returnedFields", filteredData.size() - 1, // 减去metadata本身
                "dataIntegrity", "verified",
                "chainHeight", 1000000 + random.nextInt(10000)
            ));
            
            log.info("✅ 增强学籍信息查询成功 - 学生ID: {}, 返回字段数: {}", studentId, filteredData.size());
            return AcademicInfoResult.success(filteredData, "学链通测试区块链");
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("❌ 增强学籍信息查询被中断", e);
            return AcademicInfoResult.failure("查询被中断");
        } catch (Exception e) {
            log.error("❌ 增强学籍信息查询失败", e);
            return AcademicInfoResult.failure("查询失败: " + e.getMessage());
        }
    }

    /**
     * 生成模拟的区块链交易ID
     * 
     * @return 模拟交易ID
     */
    private String generateMockTransactionId() {
        // 生成类似真实区块链交易哈希的格式
        StringBuilder sb = new StringBuilder("0x");
        for (int i = 0; i < 64; i++) {
            sb.append(Integer.toHexString(random.nextInt(16)));
        }
        return sb.toString();
    }

    /**
     * 生成模拟的PDF文件URL
     * 
     * @param application 认证申请
     * @return PDF文件URL
     */
    private String generateMockPdfUrl(CertificationApplication application) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String filename = String.format("certificate_%d_%s.pdf", application.getId(), timestamp);
        return "/api/certificates/files/" + filename;
    }

    /**
     * 构建上链数据
     * 
     * @param application 认证申请
     * @return 上链数据Map
     */
    private Map<String, Object> buildChainData(CertificationApplication application) {
        Map<String, Object> data = new HashMap<>();
        
        // 基本信息
        data.put("applicationId", application.getId());
        data.put("title", application.getTitle());
        data.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        
        // 申请人信息（脱敏）
        Map<String, Object> applicantInfo = new HashMap<>();
        applicantInfo.put("id", application.getApplicant().getId());
        applicantInfo.put("realName", maskPersonalInfo(application.getApplicant().getRealName()));
        applicantInfo.put("role", application.getApplicant().getRole().getCode());
        data.put("applicant", applicantInfo);
        
        // 目标单位信息
        Map<String, Object> targetUnitInfo = new HashMap<>();
        targetUnitInfo.put("id", application.getTargetUnit().getId());
        targetUnitInfo.put("organization", application.getTargetUnit().getOrganization());
        targetUnitInfo.put("role", application.getTargetUnit().getRole().getCode());
        data.put("targetUnit", targetUnitInfo);
        
        // 学历信息
        Map<String, Object> educationInfo = new HashMap<>();
        educationInfo.put("graduateSchool", application.getGraduateSchool());
        educationInfo.put("major", application.getMajor());
        educationInfo.put("educationLevel", application.getEducationLevel());
        educationInfo.put("graduationDate", application.getGraduationDate() != null ? 
            application.getGraduationDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        educationInfo.put("degreeCertificateNumber", 
            application.getDegreeCertificateNumber() != null ? 
            maskPersonalInfo(application.getDegreeCertificateNumber()) : null);
        data.put("education", educationInfo);
        
        // 认证信息
        Map<String, Object> certificationInfo = new HashMap<>();
        certificationInfo.put("status", "COMPLETED");
        certificationInfo.put("submissionDate", application.getSubmissionDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        certificationInfo.put("completedDate", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        data.put("certification", certificationInfo);
        
        // 系统信息
        Map<String, Object> systemInfo = new HashMap<>();
        systemInfo.put("platform", "学链通认证平台");
        systemInfo.put("version", "1.0.0");
        systemInfo.put("chainType", "MOCK");
        data.put("system", systemInfo);
        
        return data;
    }

    /**
     * 脱敏个人信息
     * 
     * @param info 原始信息
     * @return 脱敏后的信息
     */
    private String maskPersonalInfo(String info) {
        if (info == null || info.length() <= 2) {
            return info;
        }
        
        if (info.length() <= 4) {
            return info.charAt(0) + "*".repeat(info.length() - 2) + info.charAt(info.length() - 1);
        } else {
            return info.substring(0, 2) + "*".repeat(info.length() - 4) + info.substring(info.length() - 2);
        }
    }

    /**
     * 生成模拟学籍数据
     * 
     * @param studentId 学生ID
     * @return 完整的模拟学籍数据
     */
    private Map<String, Object> generateMockAcademicData(String studentId) {
        Map<String, Object> data = new HashMap<>();
        
        // 基于学生ID生成固定的模拟数据，保证查询一致性
        Random seedRandom = new Random(studentId.hashCode());
        
        // 学生基本信息
        data.put("studentId", studentId);
        data.put("realName", maskPersonalInfo(generateMockName(seedRandom)));
        data.put("idNumber", maskPersonalInfo(generateMockIdNumber(seedRandom)));
        
        // 院校信息
        String[] schools = {
            "清华大学", "北京大学", "复旦大学", "上海交通大学", "浙江大学",
            "中国科学技术大学", "南京大学", "哈尔滨工业大学", "西安交通大学", "北京理工大学"
        };
        data.put("school", schools[seedRandom.nextInt(schools.length)]);
        
        // 专业信息
        String[] majors = {
            "计算机科学与技术", "软件工程", "信息安全", "人工智能", "数据科学与大数据技术",
            "电子信息工程", "通信工程", "自动化", "电气工程及其自动化", "机械工程"
        };
        data.put("major", majors[seedRandom.nextInt(majors.length)]);
        
        // 学位信息
        String[] degrees = {"工学学士", "理学学士", "工学硕士", "理学硕士", "工学博士", "理学博士"};
        data.put("degree", degrees[seedRandom.nextInt(degrees.length)]);
        
        // 学历层次
        String[] educationLevels = {"本科", "硕士研究生", "博士研究生"};
        data.put("educationLevel", educationLevels[seedRandom.nextInt(educationLevels.length)]);
        
        // 时间信息
        LocalDateTime baseDate = LocalDateTime.of(2020, 9, 1, 0, 0);
        LocalDateTime admissionDate = baseDate.plusDays(seedRandom.nextInt(30));
        LocalDateTime graduationDate = admissionDate.plusYears(4).plusDays(seedRandom.nextInt(60));
        
        data.put("admissionDate", admissionDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
        data.put("graduationDate", graduationDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        // 学籍状态
        String[] statuses = {"在读", "已毕业", "休学", "退学"};
        data.put("studentStatus", statuses[seedRandom.nextInt(statuses.length)]);
        
        // 绩点信息
        double gpa = 2.5 + (seedRandom.nextDouble() * 1.5); // 2.5-4.0
        data.put("gpa", String.format("%.2f", gpa));
        
        // 获奖情况
        String[] awards = {
            "国家奖学金", "校级优秀学生", "学科竞赛一等奖", "创新创业大赛银奖", 
            "优秀毕业生", "三好学生", "学习标兵", "科技创新奖"
        };
        int awardCount = seedRandom.nextInt(4); // 0-3个奖项
        List<String> studentAwards = new ArrayList<>();
        for (int i = 0; i < awardCount; i++) {
            studentAwards.add(awards[seedRandom.nextInt(awards.length)]);
        }
        data.put("awards", studentAwards);
        
        // 已获认证
        String[] certifications = {
            "CET-4英语四级", "CET-6英语六级", "计算机二级", "软件设计师", 
            "IELTS雅思", "TOEFL托福", "PMP项目管理", "华为HCIA认证"
        };
        int certCount = seedRandom.nextInt(3); // 0-2个认证
        List<String> studentCerts = new ArrayList<>();
        for (int i = 0; i < certCount; i++) {
            studentCerts.add(certifications[seedRandom.nextInt(certifications.length)]);
        }
        data.put("certifications", studentCerts);
        
        // 添加区块链相关元数据
        data.put("_blockchain", Map.of(
            "blockHeight", 1000000 + seedRandom.nextInt(10000),
            "txHash", generateMockTransactionId(),
            "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
            "verified", true,
            "dataIntegrity", "SHA256:" + generateMockHash(seedRandom)
        ));
        
        return data;
    }

    /**
     * 生成模拟姓名
     */
    private String generateMockName(Random random) {
        String[] surnames = {"张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴"};
        String[] names = {"伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "雯", "涛", "明", "超", "秀"};
        return surnames[random.nextInt(surnames.length)] + 
               names[random.nextInt(names.length)] + 
               names[random.nextInt(names.length)];
    }

    /**
     * 生成模拟身份证号
     */
    private String generateMockIdNumber(Random random) {
        StringBuilder id = new StringBuilder();
        // 地区代码
        id.append("110101");
        // 出生年月日
        id.append("199").append(random.nextInt(10)).append("0").append(1 + random.nextInt(9));
        id.append(String.format("%02d", 1 + random.nextInt(28)));
        // 顺序码
        id.append(String.format("%03d", random.nextInt(999)));
        // 校验码
        id.append(random.nextInt(10));
        return id.toString();
    }

    /**
     * 生成模拟哈希值
     */
    private String generateMockHash(Random random) {
        StringBuilder hash = new StringBuilder();
        for (int i = 0; i < 64; i++) {
            hash.append(Integer.toHexString(random.nextInt(16)));
        }
        return hash.toString();
    }
} 