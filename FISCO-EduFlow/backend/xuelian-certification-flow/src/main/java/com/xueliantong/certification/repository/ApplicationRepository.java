package com.xueliantong.certification.repository;

import com.xueliantong.core.entity.CertificationApplication;
import com.xueliantong.core.entity.User;
import com.xueliantong.core.enums.CertificationStatus;
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
 * 学历认证申请数据访问接口
 * 
 * 提供学历认证申请的CRUD操作和复杂查询功能
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Repository
public interface ApplicationRepository extends JpaRepository<CertificationApplication, Long> {

    /**
     * 根据申请人查找申请
     * 
     * @param applicant 申请人
     * @return 申请列表
     */
    List<CertificationApplication> findByApplicant(User applicant);

    /**
     * 根据申请人查找申请（分页）
     * 
     * @param applicant 申请人
     * @param pageable 分页参数
     * @return 申请分页数据
     */
    Page<CertificationApplication> findByApplicant(User applicant, Pageable pageable);

    /**
     * 根据目标用人单位查找申请
     * 
     * @param targetUnit 目标用人单位
     * @return 申请列表
     */
    List<CertificationApplication> findByTargetUnit(User targetUnit);

    /**
     * 根据目标用人单位查找申请（分页）
     * 
     * @param targetUnit 目标用人单位
     * @param pageable 分页参数
     * @return 申请分页数据
     */
    Page<CertificationApplication> findByTargetUnit(User targetUnit, Pageable pageable);

    /**
     * 根据申请状态查找申请
     * 
     * @param status 申请状态
     * @return 申请列表
     */
    List<CertificationApplication> findByStatus(CertificationStatus status);

    /**
     * 根据申请状态查找申请（分页）
     * 
     * @param status 申请状态
     * @param pageable 分页参数
     * @return 申请分页数据
     */
    Page<CertificationApplication> findByStatus(CertificationStatus status, Pageable pageable);

    /**
     * 根据申请人和状态查找申请
     * 
     * @param applicant 申请人
     * @param status 申请状态
     * @return 申请列表
     */
    List<CertificationApplication> findByApplicantAndStatus(User applicant, CertificationStatus status);

    /**
     * 根据目标用人单位和状态查找申请
     * 
     * @param targetUnit 目标用人单位
     * @param status 申请状态
     * @return 申请列表
     */
    List<CertificationApplication> findByTargetUnitAndStatus(User targetUnit, CertificationStatus status);

    /**
     * 根据目标用人单位和状态查找申请（分页）
     * 
     * @param targetUnit 目标用人单位
     * @param status 申请状态
     * @param pageable 分页参数
     * @return 申请分页数据
     */
    Page<CertificationApplication> findByTargetUnitAndStatus(User targetUnit, CertificationStatus status, Pageable pageable);

    /**
     * 查找指定时间范围内的申请
     * 
     * @param startDate 开始时间
     * @param endDate 结束时间
     * @return 申请列表
     */
    List<CertificationApplication> findBySubmissionDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 查找紧急申请
     * 
     * @param isUrgent 是否紧急
     * @return 申请列表
     */
    List<CertificationApplication> findByIsUrgent(Boolean isUrgent);

    /**
     * 根据优先级查找申请
     * 
     * @param priority 优先级
     * @return 申请列表
     */
    List<CertificationApplication> findByPriority(Integer priority);

    /**
     * 查找待处理的申请（按优先级和提交时间排序）
     * 
     * @param statuses 状态列表
     * @param pageable 分页参数
     * @return 申请分页数据
     */
    @Query("SELECT a FROM CertificationApplication a WHERE a.status IN :statuses ORDER BY a.priority ASC, a.submissionDate ASC")
    Page<CertificationApplication> findPendingApplicationsOrderedByPriority(@Param("statuses") List<CertificationStatus> statuses, Pageable pageable);

    /**
     * 查找用人单位的待处理申请（按优先级和提交时间排序）
     * 
     * @param targetUnit 目标用人单位
     * @param statuses 状态列表
     * @param pageable 分页参数
     * @return 申请分页数据
     */
    @Query("SELECT a FROM CertificationApplication a WHERE a.targetUnit = :targetUnit AND a.status IN :statuses ORDER BY a.priority ASC, a.submissionDate ASC")
    Page<CertificationApplication> findPendingApplicationsByTargetUnitOrderedByPriority(@Param("targetUnit") User targetUnit, @Param("statuses") List<CertificationStatus> statuses, Pageable pageable);

    /**
     * 统计申请人的申请数量（按状态）
     * 
     * @param applicant 申请人
     * @param status 申请状态
     * @return 申请数量
     */
    Long countByApplicantAndStatus(User applicant, CertificationStatus status);

    /**
     * 统计用人单位的申请数量（按状态）
     * 
     * @param targetUnit 目标用人单位
     * @param status 申请状态
     * @return 申请数量
     */
    Long countByTargetUnitAndStatus(User targetUnit, CertificationStatus status);

    /**
     * 统计指定状态的申请总数
     * 
     * @param status 申请状态
     * @return 申请数量
     */
    Long countByStatus(CertificationStatus status);

    /**
     * 查找过期未处理的申请（提交超过指定天数且仍在待处理状态）
     * 
     * @param cutoffDate 截止日期
     * @param statuses 待处理状态列表
     * @return 过期申请列表
     */
    @Query("SELECT a FROM CertificationApplication a WHERE a.submissionDate < :cutoffDate AND a.status IN :statuses")
    List<CertificationApplication> findOverdueApplications(@Param("cutoffDate") LocalDateTime cutoffDate, @Param("statuses") List<CertificationStatus> statuses);

    /**
     * 根据区块链交易哈希查找申请
     * 
     * @param txHash 区块链交易哈希
     * @return 申请信息
     */
    Optional<CertificationApplication> findByBlockchainTxHash(String txHash);

    /**
     * 查找已完成的申请（指定时间范围内）
     * 
     * @param startDate 开始时间
     * @param endDate 结束时间
     * @return 已完成申请列表
     */
    @Query("SELECT a FROM CertificationApplication a WHERE a.status = 'COMPLETED' AND a.completedDate BETWEEN :startDate AND :endDate")
    List<CertificationApplication> findCompletedApplicationsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 根据毕业院校模糊查询申请
     * 
     * @param graduateSchool 毕业院校关键字
     * @return 申请列表
     */
    List<CertificationApplication> findByGraduateSchoolContainingIgnoreCase(String graduateSchool);

    /**
     * 根据专业名称模糊查询申请
     * 
     * @param major 专业名称关键字
     * @return 申请列表
     */
    List<CertificationApplication> findByMajorContainingIgnoreCase(String major);

    /**
     * 复合条件查询申请（支持申请人、目标单位、状态、时间范围）
     * 
     * @param applicant 申请人（可选）
     * @param targetUnit 目标用人单位（可选）
     * @param status 申请状态（可选）
     * @param startDate 开始时间（可选）
     * @param endDate 结束时间（可选）
     * @param pageable 分页参数
     * @return 申请分页数据
     */
    @Query("SELECT a FROM CertificationApplication a WHERE " +
           "(:applicant IS NULL OR a.applicant = :applicant) AND " +
           "(:targetUnit IS NULL OR a.targetUnit = :targetUnit) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.submissionDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.submissionDate <= :endDate) " +
           "ORDER BY a.submissionDate DESC")
    Page<CertificationApplication> findApplicationsWithConditions(
            @Param("applicant") User applicant,
            @Param("targetUnit") User targetUnit,
            @Param("status") CertificationStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * 获取申请统计信息
     * 
     * @return 统计信息（状态，数量）
     */
    @Query("SELECT a.status, COUNT(a) FROM CertificationApplication a GROUP BY a.status")
    List<Object[]> getApplicationStatusStatistics();

    /**
     * 获取用人单位的申请统计信息
     * 
     * @param targetUnit 目标用人单位
     * @return 统计信息（状态，数量）
     */
    @Query("SELECT a.status, COUNT(a) FROM CertificationApplication a WHERE a.targetUnit = :targetUnit GROUP BY a.status")
    List<Object[]> getApplicationStatusStatisticsByTargetUnit(@Param("targetUnit") User targetUnit);

    /**
     * 检查申请人是否已经向指定单位提交过相同学历层次的申请
     * 
     * @param applicant 申请人
     * @param targetUnit 目标用人单位
     * @param educationLevel 学历层次
     * @param statuses 需要排除的状态（例如已拒绝的申请）
     * @return 是否存在重复申请
     */
    @Query("SELECT COUNT(a) > 0 FROM CertificationApplication a WHERE " +
           "a.applicant = :applicant AND a.targetUnit = :targetUnit AND " +
           "a.educationLevel = :educationLevel AND a.status NOT IN :statuses")
    boolean existsDuplicateApplication(@Param("applicant") User applicant, 
                                     @Param("targetUnit") User targetUnit, 
                                     @Param("educationLevel") String educationLevel, 
                                     @Param("statuses") List<CertificationStatus> statuses);
} 