package com.xueliantong;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 学链通学历全流程管理系统主启动类
 * 
 * @author 学链通开发团队
 * @version 1.0.0
 * @since 2024
 */
@SpringBootApplication(scanBasePackages = {
    "com.xueliantong.core",
    "com.xueliantong.user", 
    "com.xueliantong.certification"
})
@EntityScan(basePackages = {
    "com.xueliantong.core.entity",
    "com.xueliantong.user.entity", 
    "com.xueliantong.certification.entity"
})
@EnableJpaRepositories(basePackages = {
    "com.xueliantong.user.repository", 
    "com.xueliantong.certification.repository"
})
@EnableTransactionManagement
public class XueLianTongApplication {

    /**
     * 应用程序入口点
     * 
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        // 设置系统属性 - 启用H2控制台（开发环境）
        System.setProperty("spring.h2.console.enabled", "true");
        
        // 启动Spring Boot应用
        SpringApplication app = new SpringApplication(XueLianTongApplication.class);
        
        // 设置默认配置文件
        app.setAdditionalProfiles("dev");
        
        // 启动应用
        var context = app.run(args);
        
        // 打印启动成功信息
        System.out.println("""
            
            ================================
            🎓 学链通系统启动成功！
            ================================
            📚 学历全流程管理系统
            🔗 区块链技术支撑
            🏢 服务教育行业数字化转型
            ================================
            
            """);
    }
} 