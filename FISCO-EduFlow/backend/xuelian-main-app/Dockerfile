# 学链通主应用Docker镜像构建文件
# 基于OpenJDK 17的多阶段构建

# 构建阶段
FROM maven:3.9.5-openjdk-17-slim AS builder

# 设置工作目录
WORKDIR /app

# 复制Maven配置文件
COPY pom.xml .
COPY ../pom.xml ../pom.xml
COPY ../../pom.xml ../../pom.xml

# 复制源代码
COPY src ./src
COPY ../xuelian-core ../xuelian-core
COPY ../xuelian-blockchain-integration ../xuelian-blockchain-integration
COPY ../xuelian-user-management ../xuelian-user-management
COPY ../xuelian-certification-flow ../xuelian-certification-flow

# 构建应用
RUN mvn clean package -DskipTests -q

# 运行阶段
FROM openjdk:17-jre-slim

# 设置维护者信息
LABEL maintainer="XueLianTong Team <dev@xueliantong.com>"
LABEL description="学链通区块链教育认证平台主应用"
LABEL version="1.0.0"

# 安装必要的工具
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN groupadd -r xuelian && useradd -r -g xuelian xuelian

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder /app/target/*.jar app.jar

# 创建日志目录
RUN mkdir -p /app/logs && chown -R xuelian:xuelian /app

# 切换到应用用户
USER xuelian

# 暴露端口
EXPOSE 8080

# 设置JVM参数
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:+UseContainerSupport"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
