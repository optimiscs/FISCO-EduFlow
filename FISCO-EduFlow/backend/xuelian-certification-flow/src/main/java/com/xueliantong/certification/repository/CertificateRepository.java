package com.xueliantong.certification.repository;

import com.xueliantong.core.entity.Certificate;
import com.xueliantong.core.entity.CertificationApplication;
import com.xueliantong.core.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 学历认证证书数据访问接口
 * 
 * 提供学历认证证书的CRUD操作和复杂查询功能
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    /**
     * 根据证书所有者查找证书
     * 
     * @param owner 证书所有者
     * @return 证书列表
     */
    List<Certificate> findByOwner(User owner);

    /**
     * 根据证书所有者查找证书（分页）
     * 
     * @param owner 证书所有者
     * @param pageable 分页参数
     * @return 证书分页数据
     */
    Page<Certificate> findByOwner(User owner, Pageable pageable);

    /**
     * 根据关联申请查找证书
     * 
     * @param application 关联申请
     * @return 证书信息
     */
    Optional<Certificate> findByApplication(CertificationApplication application);

    /**
     * 根据证书序列号查找证书
     * 
     * @param serialNumber 证书序列号
     * @return 证书信息
     */
    Optional<Certificate> findBySerialNumber(String serialNumber);

    /**
     * 根据区块链交易ID查找证书
     * 
     * @param blockchainTransactionId 区块链交易ID
     * @return 证书信息
     */
    Optional<Certificate> findByBlockchainTransactionId(String blockchainTransactionId);

    /**
     * 根据验证码查找证书
     * 
     * @param verificationCode 验证码
     * @return 证书信息
     */
    Optional<Certificate> findByVerificationCode(String verificationCode);

    /**
     * 根据证书状态查找证书
     * 
     * @param status 证书状态
     * @return 证书列表
     */
    List<Certificate> findByStatus(String status);

    /**
     * 根据证书状态查找证书（分页）
     * 
     * @param status 证书状态
     * @param pageable 分页参数
     * @return 证书分页数据
     */
    Page<Certificate> findByStatus(String status, Pageable pageable);

    /**
     * 根据所有者和状态查找证书
     * 
     * @param owner 证书所有者
     * @param status 证书状态
     * @return 证书列表
     */
    List<Certificate> findByOwnerAndStatus(User owner, String status);

    /**
     * 查找指定时间范围内颁发的证书
     * 
     * @param startDate 开始时间
     * @param endDate 结束时间
     * @return 证书列表
     */
    List<Certificate> findByIssueDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 查找指定时间范围内颁发的证书（分页）
     * 
     * @param startDate 开始时间
     * @param endDate 结束时间
     * @param pageable 分页参数
     * @return 证书分页数据
     */
    Page<Certificate> findByIssueDateBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * 查找即将过期的证书（指定天数内）
     * 
     * @param currentDate 当前时间
     * @param expiryDate 过期时间阈值
     * @param status 证书状态
     * @return 即将过期的证书列表
     */
    @Query("SELECT c FROM Certificate c WHERE c.status = :status AND c.expiryDate IS NOT NULL AND c.expiryDate BETWEEN :currentDate AND :expiryDate")
    List<Certificate> findCertificatesExpiringSoon(@Param("currentDate") LocalDateTime currentDate, 
                                                  @Param("expiryDate") LocalDateTime expiryDate, 
                                                  @Param("status") String status);

    /**
     * 查找已过期的证书
     * 
     * @param currentDate 当前时间
     * @return 已过期的证书列表
     */
    @Query("SELECT c FROM Certificate c WHERE c.expiryDate IS NOT NULL AND c.expiryDate < :currentDate AND c.status = 'ACTIVE'")
    List<Certificate> findExpiredCertificates(@Param("currentDate") LocalDateTime currentDate);

    /**
     * 根据毕业院校查找证书
     * 
     * @param graduateSchool 毕业院校
     * @return 证书列表
     */
    List<Certificate> findByGraduateSchool(String graduateSchool);

    /**
     * 根据毕业院校模糊查询证书
     * 
     * @param graduateSchool 毕业院校关键字
     * @return 证书列表
     */
    List<Certificate> findByGraduateSchoolContainingIgnoreCase(String graduateSchool);

    /**
     * 根据专业名称查找证书
     * 
     * @param major 专业名称
     * @return 证书列表
     */
    List<Certificate> findByMajor(String major);

    /**
     * 根据专业名称模糊查询证书
     * 
     * @param major 专业名称关键字
     * @return 证书列表
     */
    List<Certificate> findByMajorContainingIgnoreCase(String major);

    /**
     * 根据学历层次查找证书
     * 
     * @param educationLevel 学历层次
     * @return 证书列表
     */
    List<Certificate> findByEducationLevel(String educationLevel);

    /**
     * 根据颁发机构查找证书
     * 
     * @param issuer 颁发机构
     * @return 证书列表
     */
    List<Certificate> findByIssuer(String issuer);

    /**
     * 统计证书所有者的证书数量（按状态）
     * 
     * @param owner 证书所有者
     * @param status 证书状态
     * @return 证书数量
     */
    Long countByOwnerAndStatus(User owner, String status);

    /**
     * 统计指定状态的证书总数
     * 
     * @param status 证书状态
     * @return 证书数量
     */
    Long countByStatus(String status);

    /**
     * 统计指定时间范围内颁发的证书数量
     * 
     * @param startDate 开始时间
     * @param endDate 结束时间
     * @return 证书数量
     */
    Long countByIssueDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 复合条件查询证书
     * 
     * @param owner 证书所有者（可选）
     * @param status 证书状态（可选）
     * @param graduateSchool 毕业院校（可选）
     * @param major 专业名称（可选）
     * @param educationLevel 学历层次（可选）
     * @param startDate 颁发开始时间（可选）
     * @param endDate 颁发结束时间（可选）
     * @param pageable 分页参数
     * @return 证书分页数据
     */
    @Query("SELECT c FROM Certificate c WHERE " +
           "(:owner IS NULL OR c.owner = :owner) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:graduateSchool IS NULL OR c.graduateSchool LIKE %:graduateSchool%) AND " +
           "(:major IS NULL OR c.major LIKE %:major%) AND " +
           "(:educationLevel IS NULL OR c.educationLevel = :educationLevel) AND " +
           "(:startDate IS NULL OR c.issueDate >= :startDate) AND " +
           "(:endDate IS NULL OR c.issueDate <= :endDate) " +
           "ORDER BY c.issueDate DESC")
    Page<Certificate> findCertificatesWithConditions(
            @Param("owner") User owner,
            @Param("status") String status,
            @Param("graduateSchool") String graduateSchool,
            @Param("major") String major,
            @Param("educationLevel") String educationLevel,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * 获取证书统计信息
     * 
     * @return 统计信息（状态，数量）
     */
    @Query("SELECT c.status, COUNT(c) FROM Certificate c GROUP BY c.status")
    List<Object[]> getCertificateStatusStatistics();

    /**
     * 获取按月份统计的证书颁发量
     * 
     * @param year 年份
     * @return 统计信息（月份，数量）
     */
    @Query("SELECT MONTH(c.issueDate), COUNT(c) FROM Certificate c WHERE YEAR(c.issueDate) = :year GROUP BY MONTH(c.issueDate) ORDER BY MONTH(c.issueDate)")
    List<Object[]> getCertificateMonthlyStatistics(@Param("year") int year);

    /**
     * 获取按学历层次统计的证书数量
     * 
     * @return 统计信息（学历层次，数量）
     */
    @Query("SELECT c.educationLevel, COUNT(c) FROM Certificate c WHERE c.status = 'ACTIVE' GROUP BY c.educationLevel ORDER BY COUNT(c) DESC")
    List<Object[]> getCertificateEducationLevelStatistics();

    /**
     * 获取按毕业院校统计的证书数量（Top N）
     * 
     * @param limit 限制数量
     * @return 统计信息（毕业院校，数量）
     */
    @Query(value = "SELECT c.graduate_school, COUNT(c.id) as cert_count FROM certificates c WHERE c.status = 'ACTIVE' GROUP BY c.graduate_school ORDER BY cert_count DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> getTopGraduateSchoolStatistics(@Param("limit") int limit);

    /**
     * 查找最近下载的证书
     * 
     * @param owner 证书所有者
     * @param limit 限制数量
     * @return 最近下载的证书列表
     */
    @Query("SELECT c FROM Certificate c WHERE c.owner = :owner AND c.lastDownloadTime IS NOT NULL ORDER BY c.lastDownloadTime DESC")
    List<Certificate> findRecentlyDownloadedCertificates(@Param("owner") User owner, Pageable pageable);

    /**
     * 查找下载次数最多的证书
     * 
     * @param limit 限制数量
     * @return 下载次数最多的证书列表
     */
    @Query("SELECT c FROM Certificate c WHERE c.downloadCount > 0 ORDER BY c.downloadCount DESC")
    List<Certificate> findMostDownloadedCertificates(Pageable pageable);

    /**
     * 检查指定用户是否已拥有相同学历层次和院校的有效证书
     * 
     * @param owner 证书所有者
     * @param graduateSchool 毕业院校
     * @param educationLevel 学历层次
     * @param status 证书状态
     * @return 是否存在重复证书
     */
    @Query("SELECT COUNT(c) > 0 FROM Certificate c WHERE c.owner = :owner AND c.graduateSchool = :graduateSchool AND c.educationLevel = :educationLevel AND c.status = :status")
    boolean existsDuplicateCertificate(@Param("owner") User owner, 
                                     @Param("graduateSchool") String graduateSchool, 
                                     @Param("educationLevel") String educationLevel, 
                                     @Param("status") String status);
} 