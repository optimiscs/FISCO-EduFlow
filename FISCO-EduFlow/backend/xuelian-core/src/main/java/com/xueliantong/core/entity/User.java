package com.xueliantong.core.entity;

import com.xueliantong.core.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 用户实体类
 * 
 * 表示学链通系统中的所有用户，包括学生、用人单位和政府机构
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_role", columnList = "role"),
    @Index(name = "idx_user_username", columnList = "username")
})
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    /**
     * 用户ID - 主键
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /**
     * 用户名 - 唯一标识
     */
    @NotBlank(message = "用户名不能为空")
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    /**
     * 用户密码（加密存储）
     */
    @NotBlank(message = "密码不能为空")
    @Column(name = "password", nullable = false, length = 100)
    private String password;

    /**
     * 用户邮箱
     */
    @Email(message = "邮箱格式不正确")
    @NotBlank(message = "邮箱不能为空")
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    /**
     * 用户真实姓名
     */
    @NotBlank(message = "真实姓名不能为空")
    @Column(name = "real_name", nullable = false, length = 50)
    private String realName;

    /**
     * 用户角色
     */
    @NotNull(message = "用户角色不能为空")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    /**
     * 用户手机号码
     */
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    /**
     * 用户所属机构/单位名称
     */
    @Column(name = "organization", length = 200)
    private String organization;

    /**
     * 用户身份证号码（加密存储）
     */
    @Column(name = "id_card_number", length = 100)
    private String idCardNumber;

    /**
     * 用户头像URL
     */
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /**
     * 账户是否激活
     */
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * 账户是否锁定
     */
    @Builder.Default
    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;

    /**
     * 最后登录时间
     */
    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 备注信息
     */
    @Column(name = "remarks", length = 500)
    private String remarks;

    /**
     * 检查用户是否为学生
     * 
     * @return 如果是学生返回true，否则返回false
     */
    public boolean isStudent() {
        return UserRole.STUDENT.equals(this.role);
    }

    /**
     * 检查用户是否为用人单位
     * 
     * @return 如果是用人单位返回true，否则返回false
     */
    public boolean isUnit() {
        return UserRole.UNIT.equals(this.role);
    }

    /**
     * 检查用户是否为政府机构
     * 
     * @return 如果是政府机构返回true，否则返回false
     */
    public boolean isGovernment() {
        return UserRole.GOVERNMENT.equals(this.role);
    }

    /**
     * 检查账户是否可用（激活且未锁定）
     * 
     * @return 如果账户可用返回true，否则返回false
     */
    public boolean isAccountNonLocked() {
        return Boolean.TRUE.equals(isActive) && !Boolean.TRUE.equals(isLocked);
    }

    /**
     * 更新最后登录时间
     */
    public void updateLastLoginTime() {
        this.lastLoginTime = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return String.format("User{id=%d, username='%s', realName='%s', role=%s, organization='%s'}", 
                           id, username, realName, role, organization);
    }
} 