// =============== 学校管理平台JavaScript ===============

document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航功能
    initNavigation();
    
    // 初始化表格功能
    initTableFeatures();
    
    // 初始化模态框功能
    initModals();
    
    // 初始化文件上传功能
    initFileUpload();
    
    // 初始化选项卡功能
    initTabs();
    
    // 初始化退出登录功能
    initLogout();
    
    // 默认显示仪表盘内容
    showPage('dashboard');
});

// =============== 导航管理 ===============
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pageTitle = document.querySelector('.page-title');
    
    // 为每个导航链接添加点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 如果是退出登录链接，不拦截，让浏览器处理跳转
            if (this.getAttribute('href') === '../login.html') {
                return; // 直接返回，让浏览器处理页面跳转
            }
            
            e.preventDefault();
    
            // 移除所有active状态
            navLinks.forEach(l => l.classList.remove('active'));
    
            // 添加当前链接的active状态
            this.classList.add('active');
            
            // 获取目标页面
            const targetPage = this.getAttribute('href').substring(1);
            const pageText = this.querySelector('span').textContent;
            
            // 更新页面标题
            pageTitle.textContent = pageText;
            
            // 显示对应页面内容
            showPage(targetPage);
});
    });
}

// 显示指定页面内容
function showPage(pageId) {
    // 隐藏所有页面内容
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // 显示目标页面内容
    const targetSection = document.getElementById(pageId + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        // 如果没有找到对应页面，显示默认内容
        showDefaultContent(pageId);
    }
}

// 显示默认内容（当页面还未创建时）
function showDefaultContent(pageId) {
    const contentWrapper = document.querySelector('.content-wrapper');
    
    // 隐藏默认的学历管理内容
    const defaultContent = document.getElementById('default-content');
    if (defaultContent) {
        defaultContent.style.display = 'none';
    }
    
    // 特殊处理：如果是学生管理页面，显示原来的默认内容
    if (pageId === 'students') {
        if (defaultContent) {
            defaultContent.style.display = 'block';
        }
        // 隐藏动态内容
        const dynamicContent = document.getElementById('dynamic-content');
        if (dynamicContent) {
            dynamicContent.style.display = 'none';
        }
        initTableFeatures();
        initTabs();
        return;
    }
    
    const pageConfigs = {
        dashboard: {
            title: '仪表盘概览',
            content: getDefaultDashboard()
        },
        certificates: {
            title: '证书管理',
            content: getCertificatesManagement()
        },
        uploads: {
            title: '批量上传',
            content: getBulkUpload()
        },
        audit: {
            title: '审核管理',
            content: getAuditManagement()
        },
        data: {
            title: '数据报表',
            content: getDataReports()
        },
        settings: {
            title: '系统设置',
            content: getSystemSettings()
        }
    };
    
    const config = pageConfigs[pageId] || pageConfigs.dashboard;
    
    // 创建新的内容容器或更新现有容器
    let dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) {
        dynamicContent = document.createElement('div');
        dynamicContent.id = 'dynamic-content';
        contentWrapper.appendChild(dynamicContent);
    }
    
    dynamicContent.style.display = 'block';
    dynamicContent.innerHTML = config.content;
    
    // 初始化图表功能
    if (pageId === 'dashboard') {
        // 延迟初始化图表，确保DOM已渲染
        setTimeout(() => {
            initCharts();
        }, 100);
    } else if (pageId === 'data') {
        // 初始化数据报表图表
        setTimeout(() => {
            initReportCharts();
        }, 100);
    }
}

// =============== 页面内容模板 ===============

function getDefaultDashboard() {
    return `
        <!-- 统计概览区域 -->
        <div class="row">
            <div class="col col-3">
                <div class="stat-card" style="background: linear-gradient(45deg, #3A7BD5, #00d2ff);">
                    <div class="stat-title">总学生数量</div>
                    <div class="stat-value">24,856</div>
                    <div class="stat-description">较上月增长 2.4%</div>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor">
                            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="col col-3">
                <div class="stat-card" style="background: linear-gradient(45deg, #11998e, #38ef7d);">
                    <div class="stat-title">已上链学历数</div>
                    <div class="stat-value">18,634</div>
                    <div class="stat-description">覆盖率 74.9%</div>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor">
                            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="col col-3">
                <div class="stat-card" style="background: linear-gradient(45deg, #00d2ff, #3A7BD5);">
                    <div class="stat-title">待审核申请</div>
                    <div class="stat-value">126</div>
                    <div class="stat-description">较上周增加 15 个</div>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor">
                            <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div class="col col-3">
                <div class="stat-card" style="background: linear-gradient(45deg, #38ef7d, #11998e);">
                    <div class="stat-title">系统可用性</div>
                    <div class="stat-value">99.8%</div>
                    <div class="stat-description">稳定运行</div>
                    <div class="stat-icon">
                        <svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor">
                            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7M12,14C10.67,14 8,14.67 8,16V18H16V16C16,14.67 13.33,14 12,14Z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- 图表展示区域 -->
        <div class="row">
            <div class="col col-8">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21Z"/>
                            </svg>
                            学生上链趋势统计
                        </h3>
                        <div class="time-selector">
                            <button class="time-btn" onclick="changeTimeRange('1w')">本周</button>
                            <button class="time-btn active" onclick="changeTimeRange('1m')">本月</button>
                            <button class="time-btn" onclick="changeTimeRange('3m')">3个月</button>
                            <button class="time-btn" onclick="changeTimeRange('1y')">本年</button>
                        </div>
                    </div>
                    <div class="chart-wrapper">
                        <div class="chart-y-labels" id="yLabels">
                            <span>1000</span>
                            <span>800</span>
                            <span>600</span>
                            <span>400</span>
                            <span>200</span>
                            <span>0</span>
                        </div>
                        <canvas class="chart-canvas" id="studentChart" width="600" height="320"></canvas>
                    </div>
                    <div class="chart-labels" id="xLabels">
                        <span>第1周</span>
                        <span>第2周</span>
                        <span>第3周</span>
                        <span>第4周</span>
                    </div>
                    <div class="chart-tooltip" id="chartTooltip"></div>
                </div>
            </div>
            <div class="col col-4">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2Z"/>
                            </svg>
                            学院分布
                        </h3>
                    </div>
                    <div class="chart-wrapper">
                        <canvas class="chart-canvas" id="collegeChart" width="300" height="320"></canvas>
                    </div>
                    <div class="chart-legend" id="collegeLegend"></div>
                </div>
            </div>
        </div>

        <!-- 详细图表区域 -->
        <div class="row">
            <div class="col col-6">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M3,3H21V5H19V19H15V5H9V19H5V5H3V3M7,1V3H17V1H7Z"/>
                            </svg>
                            学历层次分布
                        </h3>
                    </div>
                    <div class="chart-wrapper">
                        <canvas class="chart-canvas" id="degreeChart" width="400" height="280"></canvas>
                    </div>
                    <div class="chart-labels" id="degreeLabels">
                        <span>本科</span>
                        <span>硕士</span>
                        <span>博士</span>
                    </div>
                </div>
            </div>
            <div class="col col-6">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                            </svg>
                            月度上链完成率
                        </h3>
                    </div>
                    <div class="chart-wrapper">
                        <div class="chart-y-labels" id="rateYLabels">
                            <span>100%</span>
                            <span>80%</span>
                            <span>60%</span>
                            <span>40%</span>
                            <span>20%</span>
                            <span>0%</span>
                        </div>
                        <canvas class="chart-canvas" id="rateChart" width="400" height="280"></canvas>
                    </div>
                    <div class="chart-labels" id="rateLabels">
                        <span>1月</span>
                        <span>2月</span>
                        <span>3月</span>
                        <span>4月</span>
                        <span>5月</span>
                        <span>6月</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getStudentsManagement() {
    return `
        <!-- 功能区域 -->
        <div class="row">
            <div class="col col-12">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">学历信息管理</h2>
                        <div class="card-tools">
                            <button class="btn btn-primary">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
                                    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                                </svg>
                                添加学生
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- 选项卡导航 -->
                        <div class="tabs">
                            <div class="tab active" data-tab="all">全部学生</div>
                            <div class="tab" data-tab="pending">待审核</div>
                            <div class="tab" data-tab="verified">已上链</div>
                            <div class="tab" data-tab="rejected">拒绝记录</div>
                            <div class="tab" data-tab="exception">异常情况</div>
                        </div>
                        
                        <!-- 筛选和搜索区域 -->
                        <div class="filter-section">
                            <div class="search-box">
                                <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                                </svg>
                                <input type="text" class="search-input" placeholder="搜索学生姓名、学号或专业">
                            </div>
                            <select class="filter-dropdown">
                                <option value="">所有学院</option>
                                <option value="computer">计算机学院</option>
                                <option value="management">管理学院</option>
                                <option value="science">理学院</option>
                                <option value="humanities">人文学院</option>
                            </select>
                            <select class="filter-dropdown">
                                <option value="">所有年级</option>
                                <option value="2024">2024级</option>
                                <option value="2022">2022级</option>
                                <option value="2021">2021级</option>
                                <option value="2020">2020级</option>
                            </select>
                            <select class="filter-dropdown">
                                <option value="">所有状态</option>
                                <option value="verified">已上链</option>
                                <option value="pending">待审核</option>
                                <option value="rejected">已拒绝</option>
                                <option value="exception">异常</option>
                            </select>
                            <button class="btn btn-outline">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
                                    <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3H19C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z" />
                                </svg>
                                筛选
                            </button>
                        </div>
                        
                        <!-- 数据表格区域 -->
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th width="40">
                                            <div class="checkbox-container">
                                                <input type="checkbox" id="select-all" class="checkbox-input">
                                                <label for="select-all" class="checkbox-label"></label>
                                            </div>
                                        </th>
                                        <th>学号</th>
                                        <th>姓名</th>
                                        <th>学院</th>
                                        <th>专业</th>
                                        <th>学历</th>
                                        <th>入学年份</th>
                                        <th>毕业年份</th>
                                        <th>状态</th>
                                        <th>上链时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                    <td>
                        <div class="checkbox-container">
                                                <input type="checkbox" id="select-1" class="checkbox-input">
                                                <label for="select-1" class="checkbox-label"></label>
                        </div>
                    </td>
                                        <td>2020010001</td>
                                        <td>张三</td>
                                        <td>计算机学院</td>
                                        <td>计算机科学与技术</td>
                                        <td>本科</td>
                                        <td>2020</td>
                                        <td>2024</td>
                                        <td><span class="badge badge-success">已上链</span></td>
                                        <td>2024-05-20 14:30</td>
                    <td>
                                            <button class="action-btn view" title="查看详情" onclick="openModal('studentDetailModal')">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                            </svg>
                        </button>
                                            <button class="action-btn edit" title="编辑信息" onclick="openModal('editStudentModal')">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                            </svg>
                        </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="checkbox-container">
                                                <input type="checkbox" id="select-2" class="checkbox-input">
                                                <label for="select-2" class="checkbox-label"></label>
                                            </div>
                                        </td>
                                        <td>2020010002</td>
                                        <td>李四</td>
                                        <td>计算机学院</td>
                                        <td>软件工程</td>
                                        <td>本科</td>
                                        <td>2020</td>
                                        <td>2024</td>
                                        <td><span class="badge badge-warning">待审核</span></td>
                                        <td>-</td>
                                        <td>
                                            <button class="action-btn view" title="查看详情" onclick="openModal('studentDetailModal')">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                    <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                            </svg>
                        </button>
                                            <button class="action-btn edit" title="编辑信息" onclick="openModal('editStudentModal')">
                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                                                </svg>
                                            </button>
                    </td>
                </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- 分页区域 -->
                        <div class="pagination">
                            <div class="pagination-item disabled">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
            </svg>
        </div>
                            <div class="pagination-item active">1</div>
                            <div class="pagination-item">2</div>
                            <div class="pagination-item">3</div>
                            <div class="pagination-item">4</div>
                            <div class="pagination-item">5</div>
                            <div class="pagination-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
            </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getCertificatesManagement() {
    return `
        <div class="row">
            <div class="col col-12">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">证书管理</h2>
                        <div class="card-tools">
                            <button class="btn btn-primary">生成证书</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col col-4">
                                <div class="stat-card" style="background: linear-gradient(45deg, #3A7BD5, #00d2ff);">
                                    <div class="stat-title">已生成证书</div>
                                    <div class="stat-value">18,634</div>
                                    <div class="stat-description">本月新增 2,156 张</div>
                                </div>
                            </div>
                            <div class="col col-4">
                                <div class="stat-card" style="background: linear-gradient(45deg, #11998e, #38ef7d);">
                                    <div class="stat-title">已验证证书</div>
                                    <div class="stat-value">16,892</div>
                                    <div class="stat-description">验证率 90.7%</div>
                                </div>
                            </div>
                            <div class="col col-4">
                                <div class="stat-card" style="background: linear-gradient(45deg, #FF512F, #F09819);">
                                    <div class="stat-title">待处理申请</div>
                                    <div class="stat-value">245</div>
                                    <div class="stat-description">需要审核</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="certificate-grid">
                            <div class="certificate-item">
                                <h3>本科学历证书</h3>
                                <p>已生成 15,234 张</p>
                                <button class="btn btn-primary">管理</button>
                            </div>
                            <div class="certificate-item">
                                <h3>硕士学历证书</h3>
                                <p>已生成 2,856 张</p>
                                <button class="btn btn-primary">管理</button>
                            </div>
                            <div class="certificate-item">
                                <h3>博士学历证书</h3>
                                <p>已生成 544 张</p>
                                <button class="btn btn-primary">管理</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getBulkUpload() {
    return `
        <div class="row">
            <div class="col col-12">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">批量上传学生信息</h2>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col col-6">
                                <div class="upload-zone" id="dropZone">
                                    <svg class="upload-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14,13V17H10V13H7L12,8L17,13M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
                                    </svg>
                                    <p class="upload-text">拖拽Excel文件到此处或点击上传</p>
                                    <p class="upload-hint">支持 .xlsx, .xls 格式，单次最多导入1000条记录</p>
                                    <button class="btn btn-primary">选择文件</button>
                                </div>
                            </div>
                            <div class="col col-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class="card-title">上传说明</h3>
                                    </div>
                                    <div class="card-body">
                                        <h4>文件格式要求：</h4>
                                        <ul>
                                            <li>支持 .xlsx、.xls 格式</li>
                                            <li>第一行必须为表头</li>
                                            <li>必填字段：学号、姓名、身份证号、学院、专业</li>
                                            <li>单次最多上传1000条记录</li>
                                        </ul>
                                        <button class="btn btn-outline">下载模板</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="upload-history">
                            <h3>上传历史</h3>
                            <div class="table-container">
                                <table class="table">
                                    <thead>
        <tr>
                                            <th>文件名</th>
                                            <th>上传时间</th>
                                            <th>记录数</th>
                                            <th>状态</th>
                                            <th>操作</th>
        </tr>
                                    </thead>
                                    <tbody>
            <tr>
                                            <td>2024级新生信息.xlsx</td>
                                            <td>2024-09-01 10:30</td>
                                            <td>856</td>
                                            <td><span class="badge badge-success">已完成</span></td>
                                            <td><button class="btn btn-outline">查看详情</button></td>
            </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getAuditManagement() {
    return `
        <div class="row">
            <div class="col col-12">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">审核管理</h2>
                        <div class="card-tools">
                            <button class="btn btn-primary">批量审核</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="tabs">
                            <div class="tab active" data-tab="pending">待审核 (126)</div>
                            <div class="tab" data-tab="approved">已通过 (18,634)</div>
                            <div class="tab" data-tab="rejected">已拒绝 (89)</div>
                        </div>
                        
                        <div class="audit-list">
                            <div class="audit-item">
                                <div class="audit-info">
                                    <h4>张三 - 计算机科学与技术</h4>
                                    <p>学号：2020010001 | 申请时间：2024-09-15 14:30</p>
                                    <p>申请类型：学历信息上链</p>
                                </div>
                                <div class="audit-actions">
                                    <button class="btn btn-success">通过</button>
                                    <button class="btn btn-danger">拒绝</button>
                                    <button class="btn btn-outline">查看详情</button>
                                </div>
                            </div>
                            <div class="audit-item">
                                <div class="audit-info">
                                    <h4>李四 - 软件工程</h4>
                                    <p>学号：2020010002 | 申请时间：2024-09-15 16:20</p>
                                    <p>申请类型：学历信息修改</p>
                                </div>
                                <div class="audit-actions">
                                    <button class="btn btn-success">通过</button>
                                    <button class="btn btn-danger">拒绝</button>
                                    <button class="btn btn-outline">查看详情</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getDataReports() {
    return `
        <div class="row">
            <div class="col col-12">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">数据报表</h2>
                        <div class="card-tools">
                            <button class="btn btn-primary">导出报表</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- 统计卡片 -->
                        <div class="row">
                            <div class="col col-3">
                                <div class="stat-card" style="background: linear-gradient(45deg, #3A7BD5, #00d2ff);">
                                    <div class="stat-title">总学生数</div>
                                    <div class="stat-value">24,856</div>
                                    <div class="stat-description">较上年增长 8.2%</div>
                                </div>
                            </div>
                            <div class="col col-3">
                                <div class="stat-card" style="background: linear-gradient(45deg, #11998e, #38ef7d);">
                                    <div class="stat-title">上链学历数</div>
                                    <div class="stat-value">18,634</div>
                                    <div class="stat-description">完成率 74.9%</div>
                                </div>
                            </div>
                            <div class="col col-3">
                                <div class="stat-card" style="background: linear-gradient(45deg, #00d2ff, #3A7BD5);">
                                    <div class="stat-title">月度平均上链</div>
                                    <div class="stat-value">1,553</div>
                                    <div class="stat-description">稳定增长</div>
                                </div>
                            </div>
                            <div class="col col-3">
                                <div class="stat-card" style="background: linear-gradient(45deg, #38ef7d, #11998e);">
                                    <div class="stat-title">异常率</div>
                                    <div class="stat-value">0.3%</div>
                                    <div class="stat-description">低于行业平均</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 图表区域 -->
                        <div class="row">
                            <div class="col col-6">
                                <div class="chart-container">
                                    <div class="chart-header">
                                        <h3 class="chart-title">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21Z"/>
                                            </svg>
                                            年度学生数量趋势
                                        </h3>
                                        <div class="time-selector">
                                            <button class="time-btn active" onclick="changeReportTimeRange('year')">按年</button>
                                            <button class="time-btn" onclick="changeReportTimeRange('quarter')">按季度</button>
                                            <button class="time-btn" onclick="changeReportTimeRange('month')">按月</button>
                                        </div>
                                    </div>
                                    <div class="chart-wrapper">
                                        <div class="chart-y-labels" id="reportYLabels">
                                            <span>30000</span>
                                            <span>25000</span>
                                            <span>20000</span>
                                            <span>15000</span>
                                            <span>10000</span>
                                            <span>5000</span>
                                        </div>
                                        <canvas class="chart-canvas" id="reportTrendChart" width="400" height="280"></canvas>
                                    </div>
                                    <div class="chart-labels" id="reportXLabels">
                                        <span>2020年</span>
                                        <span>2021年</span>
                                        <span>2022年</span>
                                        <span>2024年</span>
                                        <span>2024年</span>
                                    </div>
                                    <div class="chart-tooltip" id="reportTrendTooltip"></div>
                                </div>
                            </div>
                            <div class="col col-6">
                                <div class="chart-container">
                                    <div class="chart-header">
                                        <h3 class="chart-title">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2Z"/>
                                            </svg>
                                            上链完成率分析
                                        </h3>
                                    </div>
                                    <div class="chart-wrapper">
                                        <canvas class="chart-canvas" id="reportCompletionChart" width="400" height="280"></canvas>
                                    </div>
                                    <div class="chart-legend" id="reportCompletionLegend"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 详细图表 -->
                        <div class="row">
                            <div class="col col-8">
                                <div class="chart-container">
                                    <div class="chart-header">
                                        <h3 class="chart-title">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M3,3H21V5H19V19H15V5H9V19H5V5H3V3M7,1V3H17V1H7Z"/>
                                            </svg>
                                            各学院学生分布对比
                                        </h3>
                                    </div>
                                    <div class="chart-wrapper">
                                        <canvas class="chart-canvas" id="reportCollegeChart" width="600" height="300"></canvas>
                                    </div>
                                    <div class="chart-labels" id="reportCollegeLabels">
                                        <span>计算机学院</span>
                                        <span>管理学院</span>
                                        <span>理学院</span>
                                        <span>人文学院</span>
                                        <span>工学院</span>
                                        <span>医学院</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col col-4">
                                <div class="chart-container">
                                    <div class="chart-header">
                                        <h3 class="chart-title">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
                                            </svg>
                                            月度处理效率
                                        </h3>
                                    </div>
                                    <div class="chart-wrapper">
                                        <div class="chart-y-labels" id="reportEfficiencyYLabels">
                                            <span>100%</span>
                                            <span>80%</span>
                                            <span>60%</span>
                                            <span>40%</span>
                                            <span>20%</span>
                                            <span>0%</span>
                                        </div>
                                        <canvas class="chart-canvas" id="reportEfficiencyChart" width="300" height="280"></canvas>
                                    </div>
                                    <div class="chart-labels" id="reportEfficiencyLabels">
                                        <span>1月</span>
                                        <span>3月</span>
                                        <span>5月</span>
                                        <span>7月</span>
                                        <span>9月</span>
                                        <span>11月</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 数据表格 -->
                        <div class="row">
                            <div class="col col-12">
                                <div class="report-table">
                                    <h3>详细数据统计</h3>
                                    <div class="table-container">
                                        <table class="table">
                                            <thead>
                                                <tr>
                                                    <th>学院</th>
                                                    <th>总学生数</th>
                                                    <th>已上链数</th>
                                                    <th>完成率</th>
                                                    <th>待审核数</th>
                                                    <th>本月新增</th>
                                                    <th>趋势</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>计算机学院</td>
                                                    <td>6,234</td>
                                                    <td>4,856</td>
                                                    <td><span class="badge badge-success">77.9%</span></td>
                                                    <td>45</td>
                                                    <td>+128</td>
                                                    <td><span style="color: #11998e;">↗ +5.2%</span></td>
                                                </tr>
                                                <tr>
                                                    <td>管理学院</td>
                                                    <td>4,567</td>
                                                    <td>3,234</td>
                                                    <td><span class="badge badge-warning">70.8%</span></td>
                                                    <td>32</td>
                                                    <td>+89</td>
                                                    <td><span style="color: #11998e;">↗ +3.1%</span></td>
                                                </tr>
                                                <tr>
                                                    <td>理学院</td>
                                                    <td>3,892</td>
                                                    <td>2,967</td>
                                                    <td><span class="badge badge-success">76.2%</span></td>
                                                    <td>28</td>
                                                    <td>+67</td>
                                                    <td><span style="color: #11998e;">↗ +2.8%</span></td>
                                                </tr>
                                                <tr>
                                                    <td>人文学院</td>
                                                    <td>3,456</td>
                                                    <td>2,234</td>
                                                    <td><span class="badge badge-warning">64.6%</span></td>
                                                    <td>56</td>
                                                    <td>+45</td>
                                                    <td><span style="color: #ff9800;">→ +1.2%</span></td>
                                                </tr>
                                                <tr>
                                                    <td>工学院</td>
                                                    <td>4,123</td>
                                                    <td>3,234</td>
                                                    <td><span class="badge badge-success">78.4%</span></td>
                                                    <td>23</td>
                                                    <td>+92</td>
                                                    <td><span style="color: #11998e;">↗ +4.5%</span></td>
                                                </tr>
                                                <tr>
                                                    <td>医学院</td>
                                                    <td>2,584</td>
                                                    <td>2,109</td>
                                                    <td><span class="badge badge-success">81.6%</span></td>
                                                    <td>12</td>
                                                    <td>+56</td>
                                                    <td><span style="color: #11998e;">↗ +6.8%</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getSystemSettings() {
    return `
        <div class="row">
            <div class="col col-8">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">系统设置</h2>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">学校名称</label>
                            <input type="text" class="form-control" value="学链通大学">
                        </div>
                        <div class="form-group">
                            <label class="form-label">管理员邮箱</label>
                            <input type="email" class="form-control" value="admin@xuelt.edu.cn">
                        </div>
                        <div class="form-group">
                            <label class="form-label">系统公告</label>
                            <textarea class="form-control" rows="4">学链通系统正常运行中...</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">自动审核</label>
                            <div class="checkbox-container">
                                <input type="checkbox" id="auto-audit" class="checkbox-input" checked>
                                <label for="auto-audit" class="checkbox-label">启用自动审核功能</label>
                            </div>
                        </div>
                        <button class="btn btn-primary">保存设置</button>
                    </div>
                </div>
            </div>
            <div class="col col-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">系统状态</h3>
                    </div>
                    <div class="card-body">
                        <div class="status-item">
                            <span>系统版本</span>
                            <span>v2.1.0</span>
                        </div>
                        <div class="status-item">
                            <span>运行时间</span>
                            <span>15天 8小时</span>
                        </div>
                        <div class="status-item">
                            <span>数据库状态</span>
                            <span class="badge badge-success">正常</span>
                        </div>
                        <div class="status-item">
                            <span>区块链状态</span>
                            <span class="badge badge-success">连接正常</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =============== 表格功能 ===============
function initTableFeatures() {
    // 全选功能
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.checkbox-input');
            checkboxes.forEach(checkbox => {
                if (checkbox !== this) {
                    checkbox.checked = this.checked;
                }
            });
        });
    }
}

// =============== 模态框管理 ===============
function initModals() {
    // 关闭按钮事件
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 点击背景关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

// 打开模态框
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// =============== 文件上传功能 ===============
function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    // 拖拽上传
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        handleFileUpload(files);
    });
    
    // 点击上传
    dropZone.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = function() {
                handleFileUpload(this.files);
        };
        input.click();
        });
    }

function handleFileUpload(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        alert('请选择Excel文件格式');
        return;
    }
    
    // 模拟上传进度
    showUploadProgress(file.name);
}

function showUploadProgress(fileName) {
    alert(`正在上传文件: ${fileName}`);
    // 这里可以添加真实的上传逻辑
}

// =============== 选项卡功能 ===============
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有active状态
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            // 添加当前tab的active状态
            this.classList.add('active');
            
            // 可以在这里添加切换内容的逻辑
            const tabType = this.getAttribute('data-tab');
            console.log('切换到选项卡:', tabType);
        });
    });
}

// =============== Canvas图表功能 ===============
let charts = {};
let reportCharts = {};
let currentTimeRange = '1m';
let currentReportTimeRange = 'year';
let hoveredPoints = {};

// 图表配置
const chartConfig = {
    padding: 60,
    gridColor: '#f0f0f0',
    axisColor: '#ddd',
    lineWidth: 3,
    pointRadius: 5,
    pointHoverRadius: 7,
    colors: {
        primary: '#3A7BD5',
        secondary: '#00d2ff',
        success: '#11998e',
        accent: '#38ef7d',
        warning: '#ff9800',
        danger: '#f44336'
    }
};

function initCharts() {
    // 只在仪表盘页面初始化图表，避免重复初始化
    if (document.getElementById('studentChart') && !charts.student) {
        initStudentChart();
        initCollegeChart();
        initDegreeChart();
        initRateChart();
    }
}

// 初始化数据报表图表
function initReportCharts() {
    // 只在数据报表页面初始化图表，避免重复初始化
    if (document.getElementById('reportTrendChart') && !reportCharts.trend) {
        initReportTrendChart();
        initReportCompletionChart();
        initReportCollegeChart();
        initReportEfficiencyChart();
    }
}

// 学生上链趋势图表
function initStudentChart() {
    const canvas = document.getElementById('studentChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    charts.student = { canvas, ctx, hoveredPoint: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handleMouseMove(e, 'student'));
    canvas.addEventListener('mouseleave', () => handleMouseLeave('student'));
    
    updateStudentChart();
}

// 学院分布饼图
function initCollegeChart() {
    const canvas = document.getElementById('collegeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    charts.college = { canvas, ctx, hoveredSegment: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handlePieMouseMove(e, 'college'));
    canvas.addEventListener('mouseleave', () => handleMouseLeave('college'));
    
    drawCollegeChart();
}

// 学历层次柱状图
function initDegreeChart() {
    const canvas = document.getElementById('degreeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    charts.degree = { canvas, ctx, hoveredBar: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handleBarMouseMove(e, 'degree'));
    canvas.addEventListener('mouseleave', () => handleMouseLeave('degree'));
    
    drawDegreeChart();
}

// 月度完成率图表
function initRateChart() {
    const canvas = document.getElementById('rateChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    charts.rate = { canvas, ctx, hoveredPoint: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handleMouseMove(e, 'rate'));
    canvas.addEventListener('mouseleave', () => handleMouseLeave('rate'));
    
    drawRateChart();
}

function setupCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

// 时间范围切换
function changeTimeRange(range) {
    currentTimeRange = range;
    
    // 更新按钮状态
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateStudentChart();
}

function updateStudentChart() {
    const chartData = getStudentChartData(currentTimeRange);
    const xLabels = getStudentXLabels(currentTimeRange);
    
    // 更新X轴标签
    const xLabelContainer = document.getElementById('xLabels');
    if (xLabelContainer) {
        xLabelContainer.innerHTML = xLabels.map(label => `<span>${label}</span>`).join('');
    }
    
    drawStudentChart(chartData);
}

function getStudentChartData(range) {
    const data = {
        '1w': [120, 150, 180, 220, 250, 280, 320],
        '1m': [450, 680, 520, 750, 890, 650, 720, 850, 920, 680, 750, 820, 890, 950, 720, 680, 750, 820, 890, 920, 850, 680, 750, 820, 890, 920, 850, 780, 690, 750],
        '3m': [2800, 3200, 3600, 4000, 4200, 3800, 4100, 4500, 4800, 4600, 4300, 4700],
        '1y': [15000, 16500, 18000, 19500, 21000, 20500, 22000, 23500, 25000, 24000, 23000, 24500]
    };
    return data[range] || data['1m'].slice(0, 4);
}

function getStudentXLabels(range) {
    const labels = {
        '1w': ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        '1m': ['第1周', '第2周', '第3周', '第4周'],
        '3m': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        '1y': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    };
    
    if (range === '1m') {
        return ['第1周', '第2周', '第3周', '第4周'];
    }
    
    return labels[range] || labels['1m'];
}

function drawStudentChart(data) {
    const chart = charts.student;
    if (!chart) return;
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const chartArea = {
        left: chartConfig.padding,
        right: width - 20,
        top: 20,
        bottom: height - 40
    };
    
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    
    // 绘制网格
    drawGrid(ctx, chartArea, chartWidth, chartHeight);
    
    if (data.length > 0) {
        const maxValue = Math.max(...data);
        const points = calculatePoints(data, chartArea, chartWidth, chartHeight, maxValue);
        
        // 绘制填充区域
        drawStudentArea(ctx, points, chartArea);
        
        // 绘制数据线
        drawStudentLine(ctx, points);
        
        // 绘制数据点
        drawStudentPoints(ctx, points, chart.hoveredPoint);
    }
}

function drawStudentArea(ctx, points, chartArea) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(58, 123, 213, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 210, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 210, 255, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, chartArea.bottom);
    
    points.forEach(point => ctx.lineTo(point.x, point.y));
    
    ctx.lineTo(points[points.length - 1].x, chartArea.bottom);
    ctx.closePath();
    ctx.fill();
}

function drawStudentLine(ctx, points) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(points[0].x, 0, points[points.length - 1].x, 0);
    gradient.addColorStop(0, chartConfig.colors.primary);
    gradient.addColorStop(1, chartConfig.colors.secondary);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = chartConfig.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();
}

function drawStudentPoints(ctx, points, hoveredPoint) {
    points.forEach((point, index) => {
        const isHovered = hoveredPoint === index;
        const radius = isHovered ? chartConfig.pointHoverRadius : chartConfig.pointRadius;
        
        // 背景圆圈
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 主圆圈
        ctx.fillStyle = isHovered ? chartConfig.colors.secondary : chartConfig.colors.primary;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawCollegeChart() {
    const chart = charts.college;
    if (!chart) return;
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const data = [
        { name: '计算机学院', value: 35, color: chartConfig.colors.primary },
        { name: '管理学院', value: 25, color: chartConfig.colors.secondary },
        { name: '理学院', value: 20, color: chartConfig.colors.success },
        { name: '人文学院', value: 20, color: chartConfig.colors.accent }
    ];
    
    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const radius = Math.min(width, height) / 3;
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach((segment, index) => {
        const sliceAngle = (segment.value / 100) * 2 * Math.PI;
        const isHovered = chart.hoveredSegment === index;
        const segmentRadius = isHovered ? radius + 5 : radius;
        
        // 绘制扇形
        ctx.fillStyle = segment.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, segmentRadius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
    });
    
    // 更新图例
    updateLegend(data, 'collegeLegend');
}

function drawDegreeChart() {
    const chart = charts.degree;
    if (!chart) return;
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const data = [
        { name: '本科', value: 15234, color: chartConfig.colors.primary },
        { name: '硕士', value: 2856, color: chartConfig.colors.secondary },
        { name: '博士', value: 544, color: chartConfig.colors.success }
    ];
    
    const chartArea = {
        left: 40,
        right: width - 20,
        top: 20,
        bottom: height - 40
    };
    
    const barWidth = (chartArea.right - chartArea.left) / data.length * 0.6;
    const barSpacing = (chartArea.right - chartArea.left) / data.length * 0.4;
    const maxValue = Math.max(...data.map(d => d.value));
    
    data.forEach((bar, index) => {
        const barHeight = (bar.value / maxValue) * (chartArea.bottom - chartArea.top);
        const x = chartArea.left + index * (barWidth + barSpacing) + barSpacing / 2;
        const y = chartArea.bottom - barHeight;
        
        const isHovered = chart.hoveredBar === index;
        const currentBarWidth = isHovered ? barWidth + 5 : barWidth;
        
        // 绘制渐变柱形
        const gradient = ctx.createLinearGradient(0, y, 0, chartArea.bottom);
        gradient.addColorStop(0, bar.color);
        gradient.addColorStop(1, bar.color + '80');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, currentBarWidth, barHeight);
        
        // 绘制边框
        ctx.strokeStyle = bar.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, currentBarWidth, barHeight);
        
        // 绘制数值
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bar.value.toLocaleString(), x + currentBarWidth / 2, y - 5);
    });
}

function drawRateChart() {
    const chart = charts.rate;
    if (!chart) return;
    
    const data = [65, 78, 82, 89, 92, 88];
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const chartArea = {
        left: 40,
        right: width - 20,
        top: 20,
        bottom: height - 40
    };
    
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    
    // 绘制网格
    drawGrid(ctx, chartArea, chartWidth, chartHeight);
    
    if (data.length > 0) {
        const points = calculatePoints(data, chartArea, chartWidth, chartHeight, 100);
        
        // 绘制填充区域
        drawRateArea(ctx, points, chartArea);
        
        // 绘制数据线
        drawRateLine(ctx, points);
        
        // 绘制数据点
        drawRatePoints(ctx, points, chart.hoveredPoint);
    }
}

function drawRateArea(ctx, points, chartArea) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(17, 153, 142, 0.3)');
    gradient.addColorStop(1, 'rgba(56, 239, 125, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, chartArea.bottom);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, chartArea.bottom);
    ctx.closePath();
    ctx.fill();
}

function drawRateLine(ctx, points) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(points[0].x, 0, points[points.length - 1].x, 0);
    gradient.addColorStop(0, chartConfig.colors.success);
    gradient.addColorStop(1, chartConfig.colors.accent);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = chartConfig.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();
}

function drawRatePoints(ctx, points, hoveredPoint) {
    points.forEach((point, index) => {
        const isHovered = hoveredPoint === index;
        const radius = isHovered ? chartConfig.pointHoverRadius : chartConfig.pointRadius;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = isHovered ? chartConfig.colors.accent : chartConfig.colors.success;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 通用绘图函数
function drawGrid(ctx, chartArea, chartWidth, chartHeight) {
    ctx.strokeStyle = chartConfig.gridColor;
    ctx.lineWidth = 1;
    
    // 水平网格线
    for (let i = 0; i <= 5; i++) {
        const y = chartArea.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
    }
    
    // 垂直网格线
    for (let i = 0; i <= 5; i++) {
        const x = chartArea.left + (chartWidth / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
    }
}

function calculatePoints(data, chartArea, chartWidth, chartHeight, maxValue) {
    return data.map((value, index) => {
        const x = chartArea.left + (chartWidth / (data.length - 1)) * index;
        const y = chartArea.bottom - (value / maxValue) * chartHeight;
        return { x, y, value, index };
    });
}

// 鼠标事件处理
function handleMouseMove(event, chartType) {
    const chart = charts[chartType];
    if (!chart) return;
    
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    let nearestPoint = -1;
    let minDistance = Infinity;
    
    // 根据图表类型计算最近的点
    if (chartType === 'student') {
        const data = getStudentChartData(currentTimeRange);
        if (data.length > 0) {
            const points = calculatePointsForChart(chart, data);
            points.forEach((point, index) => {
                const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
                if (distance < minDistance && distance < 20) {
                    minDistance = distance;
                    nearestPoint = index;
                }
            });
        }
    } else if (chartType === 'rate') {
        const data = [65, 78, 82, 89, 92, 88];
        const points = calculatePointsForChart(chart, data, 100);
        points.forEach((point, index) => {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < minDistance && distance < 20) {
                minDistance = distance;
                nearestPoint = index;
            }
        });
    }
    
    if (nearestPoint !== chart.hoveredPoint) {
        chart.hoveredPoint = nearestPoint;
        
        if (chartType === 'student') {
            updateStudentChart();
        } else if (chartType === 'rate') {
            drawRateChart();
        }
        
        if (nearestPoint >= 0) {
            showTooltip(event, chartType, nearestPoint);
        } else {
            hideTooltip();
        }
    }
}

function handlePieMouseMove(event, chartType) {
    const chart = charts[chartType];
    if (!chart) return;
    
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = chart.canvas.offsetWidth / 2;
    const centerY = chart.canvas.offsetHeight / 2 - 10;
    const radius = Math.min(chart.canvas.offsetWidth, chart.canvas.offsetHeight) / 3;
    
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    if (distance <= radius) {
        const angle = Math.atan2(y - centerY, x - centerX) + Math.PI / 2;
        const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
        
        const data = [35, 25, 20, 20];
        let currentAngle = 0;
        let hoveredSegment = -1;
        
        for (let i = 0; i < data.length; i++) {
            const sliceAngle = (data[i] / 100) * 2 * Math.PI;
            if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
                hoveredSegment = i;
                break;
            }
            currentAngle += sliceAngle;
        }
        
        if (hoveredSegment !== chart.hoveredSegment) {
            chart.hoveredSegment = hoveredSegment;
            drawCollegeChart();
            
            if (hoveredSegment >= 0) {
                showPieTooltip(event, hoveredSegment);
            } else {
                hideTooltip();
            }
        }
    } else if (chart.hoveredSegment !== -1) {
        chart.hoveredSegment = -1;
        drawCollegeChart();
        hideTooltip();
    }
}

function handleBarMouseMove(event, chartType) {
    const chart = charts[chartType];
    if (!chart) return;
    
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const data = [15234, 2856, 544];
    const chartArea = { left: 40, right: chart.canvas.offsetWidth - 20, top: 20, bottom: chart.canvas.offsetHeight - 40 };
    const barWidth = (chartArea.right - chartArea.left) / data.length * 0.6;
    const barSpacing = (chartArea.right - chartArea.left) / data.length * 0.4;
    
    let hoveredBar = -1;
    
    for (let i = 0; i < data.length; i++) {
        const barX = chartArea.left + i * (barWidth + barSpacing) + barSpacing / 2;
        if (x >= barX && x <= barX + barWidth && y >= chartArea.top && y <= chartArea.bottom) {
            hoveredBar = i;
            break;
        }
    }
    
    if (hoveredBar !== chart.hoveredBar) {
        chart.hoveredBar = hoveredBar;
        drawDegreeChart();
        
        if (hoveredBar >= 0) {
            showBarTooltip(event, hoveredBar);
        } else {
            hideTooltip();
        }
    }
}

function handleMouseLeave(chartType) {
    const chart = charts[chartType];
    if (!chart) return;
    
    if (chartType === 'college') {
        chart.hoveredSegment = -1;
        drawCollegeChart();
    } else if (chartType === 'degree') {
        chart.hoveredBar = -1;
        drawDegreeChart();
    } else {
        chart.hoveredPoint = -1;
        if (chartType === 'student') {
            updateStudentChart();
        } else if (chartType === 'rate') {
            drawRateChart();
        }
    }
    
    hideTooltip();
}

function calculatePointsForChart(chart, data, maxValue = null) {
    const chartArea = {
        left: chartConfig.padding,
        right: chart.canvas.offsetWidth - 20,
        top: 20,
        bottom: chart.canvas.offsetHeight - 40
    };
    
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    const max = maxValue || Math.max(...data);
    
    return calculatePoints(data, chartArea, chartWidth, chartHeight, max);
}

// 工具提示
function showTooltip(event, chartType, index) {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;
    
    const data = chartType === 'student' ? getStudentChartData(currentTimeRange) : [65, 78, 82, 89, 92, 88];
    const labels = chartType === 'student' ? getStudentXLabels(currentTimeRange) : ['1月', '2月', '3月', '4月', '5月', '6月'];
    
    const label = labels[index] || `点${index + 1}`;
    const value = data[index];
    const unit = chartType === 'rate' ? '%' : '人';
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">${label}</div>
        <div>${chartType === 'student' ? '上链人数' : '完成率'}: ${value}${unit}</div>
    `;
    
    const rect = charts[chartType].canvas.getBoundingClientRect();
    const container = charts[chartType].canvas.closest('.chart-container').getBoundingClientRect();
    
    tooltip.style.left = (event.clientX - container.left + 10) + 'px';
    tooltip.style.top = (event.clientY - container.top - 60) + 'px';
    tooltip.classList.add('visible');
}

function showPieTooltip(event, index) {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;
    
    const data = [
        { name: '计算机学院', value: 35 },
        { name: '管理学院', value: 25 },
        { name: '理学院', value: 20 },
        { name: '人文学院', value: 20 }
    ];
    
    const segment = data[index];
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">${segment.name}</div>
        <div>占比: ${segment.value}%</div>
    `;
    
    const rect = charts.college.canvas.getBoundingClientRect();
    const container = charts.college.canvas.closest('.chart-container').getBoundingClientRect();
    
    tooltip.style.left = (event.clientX - container.left + 10) + 'px';
    tooltip.style.top = (event.clientY - container.top - 60) + 'px';
    tooltip.classList.add('visible');
}

function showBarTooltip(event, index) {
    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;
    
    const data = [
        { name: '本科', value: 15234 },
        { name: '硕士', value: 2856 },
        { name: '博士', value: 544 }
    ];
    
    const bar = data[index];
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">${bar.name}</div>
        <div>学生数量: ${bar.value.toLocaleString()}人</div>
    `;
    
    const rect = charts.degree.canvas.getBoundingClientRect();
    const container = charts.degree.canvas.closest('.chart-container').getBoundingClientRect();
    
    tooltip.style.left = (event.clientX - container.left + 10) + 'px';
    tooltip.style.top = (event.clientY - container.top - 60) + 'px';
    tooltip.classList.add('visible');
}

function hideTooltip() {
    const tooltip = document.getElementById('chartTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

function updateLegend(data, legendId) {
    const legend = document.getElementById(legendId);
    if (!legend) return;
    
    legend.innerHTML = data.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <div style="width: 12px; height: 12px; background: ${item.color}; margin-right: 0.5rem; border-radius: 2px;"></div>
            <span style="font-size: 0.9rem; color: #666;">${item.name} (${item.value}%)</span>
        </div>
    `).join('');
}

// =============== 数据报表图表功能 ===============

// 年度学生数量趋势图表
function initReportTrendChart() {
    const canvas = document.getElementById('reportTrendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    reportCharts.trend = { canvas, ctx, hoveredPoint: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handleReportMouseMove(e, 'trend'));
    canvas.addEventListener('mouseleave', () => handleReportMouseLeave('trend'));
    
    drawReportTrendChart();
}

// 上链完成率分析饼图
function initReportCompletionChart() {
    const canvas = document.getElementById('reportCompletionChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    reportCharts.completion = { canvas, ctx, hoveredSegment: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handleReportPieMouseMove(e, 'completion'));
    canvas.addEventListener('mouseleave', () => handleReportMouseLeave('completion'));
    
    drawReportCompletionChart();
}

// 各学院学生分布对比柱状图
function initReportCollegeChart() {
    const canvas = document.getElementById('reportCollegeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    reportCharts.college = { canvas, ctx, hoveredBar: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handleReportBarMouseMove(e, 'college'));
    canvas.addEventListener('mouseleave', () => handleReportMouseLeave('college'));
    
    drawReportCollegeChart();
}

// 月度处理效率图表
function initReportEfficiencyChart() {
    const canvas = document.getElementById('reportEfficiencyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    reportCharts.efficiency = { canvas, ctx, hoveredPoint: -1 };
    
    setupCanvas(canvas, ctx);
    canvas.addEventListener('mousemove', (e) => handleReportMouseMove(e, 'efficiency'));
    canvas.addEventListener('mouseleave', () => handleReportMouseLeave('efficiency'));
    
    drawReportEfficiencyChart();
}

// 绘制年度学生数量趋势图表
function drawReportTrendChart() {
    const chart = reportCharts.trend;
    if (!chart) return;
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const chartArea = {
        left: chartConfig.padding,
        right: width - 20,
        top: 20,
        bottom: height - 40
    };
    
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    
    // 绘制网格
    drawGrid(ctx, chartArea, chartWidth, chartHeight);
    
    const data = [15000, 16500, 18000, 19500, 21000, 20500, 22000, 23500, 25000, 24000, 23000, 24500];
    
    if (data.length > 0) {
        const maxValue = Math.max(...data);
        const points = calculatePoints(data, chartArea, chartWidth, chartHeight, maxValue);
        
        // 绘制填充区域
        drawReportTrendArea(ctx, points, chartArea);
        
        // 绘制数据线
        drawReportTrendLine(ctx, points);
        
        // 绘制数据点
        drawReportTrendPoints(ctx, points, chart.hoveredPoint);
    }
}

// 绘制上链完成率分析饼图
function drawReportCompletionChart() {
    const chart = reportCharts.completion;
    if (!chart) return;
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const data = [
        { name: '已上链', value: 74.9, color: chartConfig.colors.success },
        { name: '待审核', value: 15.1, color: chartConfig.colors.warning },
        { name: '异常情况', value: 10.0, color: chartConfig.colors.danger }
    ];
    
    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const radius = Math.min(width, height) / 3;
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach((segment, index) => {
        const sliceAngle = (segment.value / 100) * 2 * Math.PI;
        const isHovered = chart.hoveredSegment === index;
        const segmentRadius = isHovered ? radius + 5 : radius;
        
        // 绘制扇形
        ctx.fillStyle = segment.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, segmentRadius, currentAngle, currentAngle + sliceAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
    });
    
    // 更新图例
    updateReportLegend(data, 'reportCompletionLegend');
}

// 绘制各学院学生分布对比柱状图
function drawReportCollegeChart() {
    const chart = reportCharts.college;
    if (!chart) return;
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const data = [
        { name: '计算机学院', value: 6234, color: chartConfig.colors.primary },
        { name: '管理学院', value: 4567, color: chartConfig.colors.secondary },
        { name: '理学院', value: 3892, color: chartConfig.colors.success },
        { name: '人文学院', value: 3456, color: chartConfig.colors.accent },
        { name: '工学院', value: 4123, color: chartConfig.colors.warning },
        { name: '医学院', value: 2584, color: chartConfig.colors.danger }
    ];
    
    const chartArea = {
        left: 60,
        right: width - 20,
        top: 20,
        bottom: height - 40
    };
    
    const barWidth = (chartArea.right - chartArea.left) / data.length * 0.7;
    const barSpacing = (chartArea.right - chartArea.left) / data.length * 0.3;
    const maxValue = Math.max(...data.map(d => d.value));
    
    data.forEach((bar, index) => {
        const barHeight = (bar.value / maxValue) * (chartArea.bottom - chartArea.top);
        const x = chartArea.left + index * (barWidth + barSpacing) + barSpacing / 2;
        const y = chartArea.bottom - barHeight;
        
        const isHovered = chart.hoveredBar === index;
        const currentBarWidth = isHovered ? barWidth + 5 : barWidth;
        
        // 绘制渐变柱形
        const gradient = ctx.createLinearGradient(0, y, 0, chartArea.bottom);
        gradient.addColorStop(0, bar.color);
        gradient.addColorStop(1, bar.color + '80');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, currentBarWidth, barHeight);
        
        // 绘制边框
        ctx.strokeStyle = bar.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, currentBarWidth, barHeight);
        
        // 绘制数值
        ctx.fillStyle = '#333';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bar.value.toLocaleString(), x + currentBarWidth / 2, y - 5);
    });
}

// 绘制月度处理效率图表
function drawReportEfficiencyChart() {
    const chart = reportCharts.efficiency;
    if (!chart) return;
    
    const data = [85, 92, 88, 95, 89, 91];
    
    const { canvas, ctx } = chart;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const chartArea = {
        left: 40,
        right: width - 20,
        top: 20,
        bottom: height - 40
    };
    
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    
    // 绘制网格
    drawGrid(ctx, chartArea, chartWidth, chartHeight);
    
    if (data.length > 0) {
        const points = calculatePoints(data, chartArea, chartWidth, chartHeight, 100);
        
        // 绘制填充区域
        drawReportEfficiencyArea(ctx, points, chartArea);
        
        // 绘制数据线
        drawReportEfficiencyLine(ctx, points);
        
        // 绘制数据点
        drawReportEfficiencyPoints(ctx, points, chart.hoveredPoint);
    }
}

// 绘制趋势图填充区域
function drawReportTrendArea(ctx, points, chartArea) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(58, 123, 213, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 210, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 210, 255, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, chartArea.bottom);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, chartArea.bottom);
    ctx.closePath();
    ctx.fill();
}

// 绘制趋势图数据线
function drawReportTrendLine(ctx, points) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(points[0].x, 0, points[points.length - 1].x, 0);
    gradient.addColorStop(0, chartConfig.colors.primary);
    gradient.addColorStop(1, chartConfig.colors.secondary);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = chartConfig.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();
}

// 绘制趋势图数据点
function drawReportTrendPoints(ctx, points, hoveredPoint) {
    points.forEach((point, index) => {
        const isHovered = hoveredPoint === index;
        const radius = isHovered ? chartConfig.pointHoverRadius : chartConfig.pointRadius;
        
        // 背景圆圈
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 主圆圈
        ctx.fillStyle = isHovered ? chartConfig.colors.secondary : chartConfig.colors.primary;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 绘制效率图填充区域
function drawReportEfficiencyArea(ctx, points, chartArea) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(17, 153, 142, 0.3)');
    gradient.addColorStop(1, 'rgba(56, 239, 125, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, chartArea.bottom);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, chartArea.bottom);
    ctx.closePath();
    ctx.fill();
}

// 绘制效率图数据线
function drawReportEfficiencyLine(ctx, points) {
    if (points.length === 0) return;
    
    const gradient = ctx.createLinearGradient(points[0].x, 0, points[points.length - 1].x, 0);
    gradient.addColorStop(0, chartConfig.colors.success);
    gradient.addColorStop(1, chartConfig.colors.accent);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = chartConfig.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.stroke();
}

// 绘制效率图数据点
function drawReportEfficiencyPoints(ctx, points, hoveredPoint) {
    points.forEach((point, index) => {
        const isHovered = hoveredPoint === index;
        const radius = isHovered ? chartConfig.pointHoverRadius : chartConfig.pointRadius;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = isHovered ? chartConfig.colors.accent : chartConfig.colors.success;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 数据报表时间范围切换
function changeReportTimeRange(range) {
    currentReportTimeRange = range;
    
    // 更新按钮状态
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    drawReportTrendChart();
}

// 数据报表鼠标事件处理
function handleReportMouseMove(event, chartType) {
    const chart = reportCharts[chartType];
    if (!chart) return;
    
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    let nearestPoint = -1;
    let minDistance = Infinity;
    
    if (chartType === 'trend') {
        const data = [15000, 16500, 18000, 19500, 21000, 20500, 22000, 23500, 25000, 24000, 23000, 24500];
        const points = calculatePointsForReportChart(chart, data);
        points.forEach((point, index) => {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < minDistance && distance < 20) {
                minDistance = distance;
                nearestPoint = index;
            }
        });
    } else if (chartType === 'efficiency') {
        const data = [85, 92, 88, 95, 89, 91];
        const points = calculatePointsForReportChart(chart, data, 100);
        points.forEach((point, index) => {
            const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (distance < minDistance && distance < 20) {
                minDistance = distance;
                nearestPoint = index;
            }
        });
    }
    
    if (nearestPoint !== chart.hoveredPoint) {
        chart.hoveredPoint = nearestPoint;
        
        if (chartType === 'trend') {
            drawReportTrendChart();
        } else if (chartType === 'efficiency') {
            drawReportEfficiencyChart();
        }
        
        if (nearestPoint >= 0) {
            showReportTooltip(event, chartType, nearestPoint);
        } else {
            hideReportTooltip();
        }
    }
}

// 数据报表饼图鼠标事件处理
function handleReportPieMouseMove(event, chartType) {
    const chart = reportCharts[chartType];
    if (!chart) return;
    
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const centerX = chart.canvas.offsetWidth / 2;
    const centerY = chart.canvas.offsetHeight / 2 - 10;
    const radius = Math.min(chart.canvas.offsetWidth, chart.canvas.offsetHeight) / 3;
    
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    if (distance <= radius) {
        const angle = Math.atan2(y - centerY, x - centerX) + Math.PI / 2;
        const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
        
        const data = [74.9, 15.1, 10.0];
        let currentAngle = 0;
        let hoveredSegment = -1;
        
        for (let i = 0; i < data.length; i++) {
            const sliceAngle = (data[i] / 100) * 2 * Math.PI;
            if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
                hoveredSegment = i;
                break;
            }
            currentAngle += sliceAngle;
        }
        
        if (hoveredSegment !== chart.hoveredSegment) {
            chart.hoveredSegment = hoveredSegment;
            drawReportCompletionChart();
            
            if (hoveredSegment >= 0) {
                showReportPieTooltip(event, hoveredSegment);
            } else {
                hideReportTooltip();
            }
        }
    } else if (chart.hoveredSegment !== -1) {
        chart.hoveredSegment = -1;
        drawReportCompletionChart();
        hideReportTooltip();
    }
}

// 数据报表柱状图鼠标事件处理
function handleReportBarMouseMove(event, chartType) {
    const chart = reportCharts[chartType];
    if (!chart) return;
    
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const data = [6234, 4567, 3892, 3456, 4123, 2584];
    const chartArea = { left: 60, right: chart.canvas.offsetWidth - 20, top: 20, bottom: chart.canvas.offsetHeight - 40 };
    const barWidth = (chartArea.right - chartArea.left) / data.length * 0.7;
    const barSpacing = (chartArea.right - chartArea.left) / data.length * 0.3;
    
    let hoveredBar = -1;
    
    for (let i = 0; i < data.length; i++) {
        const barX = chartArea.left + i * (barWidth + barSpacing) + barSpacing / 2;
        if (x >= barX && x <= barX + barWidth && y >= chartArea.top && y <= chartArea.bottom) {
            hoveredBar = i;
            break;
        }
    }
    
    if (hoveredBar !== chart.hoveredBar) {
        chart.hoveredBar = hoveredBar;
        drawReportCollegeChart();
        
        if (hoveredBar >= 0) {
            showReportBarTooltip(event, hoveredBar);
        } else {
            hideReportTooltip();
        }
    }
}

// 数据报表鼠标离开事件处理
function handleReportMouseLeave(chartType) {
    const chart = reportCharts[chartType];
    if (!chart) return;
    
    if (chartType === 'completion') {
        chart.hoveredSegment = -1;
        drawReportCompletionChart();
    } else if (chartType === 'college') {
        chart.hoveredBar = -1;
        drawReportCollegeChart();
    } else {
        chart.hoveredPoint = -1;
        if (chartType === 'trend') {
            drawReportTrendChart();
        } else if (chartType === 'efficiency') {
            drawReportEfficiencyChart();
        }
    }
    
    hideReportTooltip();
}

// 计算数据报表图表点位置
function calculatePointsForReportChart(chart, data, maxValue = null) {
    const chartArea = {
        left: chartConfig.padding,
        right: chart.canvas.offsetWidth - 20,
        top: 20,
        bottom: chart.canvas.offsetHeight - 40
    };
    
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    const max = maxValue || Math.max(...data);
    
    return calculatePoints(data, chartArea, chartWidth, chartHeight, max);
}

// 数据报表工具提示
function showReportTooltip(event, chartType, index) {
    const tooltip = document.getElementById('reportTrendTooltip');
    if (!tooltip) return;
    
    let data, labels, unit;
    
    if (chartType === 'trend') {
        data = [15000, 16500, 18000, 19500, 21000, 20500, 22000, 23500, 25000, 24000, 23000, 24500];
        labels = ['2020年', '2021年', '2022年', '2024年', '2024年'];
        unit = '人';
    } else if (chartType === 'efficiency') {
        data = [85, 92, 88, 95, 89, 91];
        labels = ['1月', '3月', '5月', '7月', '9月', '11月'];
        unit = '%';
    }
    
    const label = labels[index] || `点${index + 1}`;
    const value = data[index];
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">${label}</div>
        <div>${chartType === 'trend' ? '学生数量' : '处理效率'}: ${value}${unit}</div>
    `;
    
    const rect = reportCharts[chartType].canvas.getBoundingClientRect();
    const container = reportCharts[chartType].canvas.closest('.chart-container').getBoundingClientRect();
    
    tooltip.style.left = (event.clientX - container.left + 10) + 'px';
    tooltip.style.top = (event.clientY - container.top - 60) + 'px';
    tooltip.classList.add('visible');
}

function showReportPieTooltip(event, index) {
    const tooltip = document.getElementById('reportTrendTooltip');
    if (!tooltip) return;
    
    const data = [
        { name: '已上链', value: 74.9 },
        { name: '待审核', value: 15.1 },
        { name: '异常情况', value: 10.0 }
    ];
    
    const segment = data[index];
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">${segment.name}</div>
        <div>占比: ${segment.value}%</div>
    `;
    
    const rect = reportCharts.completion.canvas.getBoundingClientRect();
    const container = reportCharts.completion.canvas.closest('.chart-container').getBoundingClientRect();
    
    tooltip.style.left = (event.clientX - container.left + 10) + 'px';
    tooltip.style.top = (event.clientY - container.top - 60) + 'px';
    tooltip.classList.add('visible');
}

function showReportBarTooltip(event, index) {
    const tooltip = document.getElementById('reportTrendTooltip');
    if (!tooltip) return;
    
    const data = [
        { name: '计算机学院', value: 6234 },
        { name: '管理学院', value: 4567 },
        { name: '理学院', value: 3892 },
        { name: '人文学院', value: 3456 },
        { name: '工学院', value: 4123 },
        { name: '医学院', value: 2584 }
    ];
    
    const bar = data[index];
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.2rem;">${bar.name}</div>
        <div>学生数量: ${bar.value.toLocaleString()}人</div>
    `;
    
    const rect = reportCharts.college.canvas.getBoundingClientRect();
    const container = reportCharts.college.canvas.closest('.chart-container').getBoundingClientRect();
    
    tooltip.style.left = (event.clientX - container.left + 10) + 'px';
    tooltip.style.top = (event.clientY - container.top - 60) + 'px';
    tooltip.classList.add('visible');
}

function hideReportTooltip() {
    const tooltip = document.getElementById('reportTrendTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

function updateReportLegend(data, legendId) {
    const legend = document.getElementById(legendId);
    if (!legend) return;
    
    legend.innerHTML = data.map(item => `
        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <div style="width: 12px; height: 12px; background: ${item.color}; margin-right: 0.5rem; border-radius: 2px;"></div>
            <span style="font-size: 0.9rem; color: #666;">${item.name} (${item.value}%)</span>
        </div>
    `).join('');
}

// =============== 退出登录功能 ===============
function initLogout() {
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 显示确认对话框
            if (confirm('确定要退出登录吗？')) {
                // 清除本地存储的用户信息（如果有的话）
                localStorage.removeItem('userToken');
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('userToken');
                sessionStorage.removeItem('userInfo');
                
                // 显示退出成功提示
                showNotification('退出登录成功', 'success');
                
                // 延迟跳转到登录页面
                setTimeout(() => {
                    window.location.href = '../login.html';
                }, 1000);
            }
        });
    }
}

// =============== 工具函数 ===============
function showNotification(message, type = 'success') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('visible');
    }, 100);
    
    // 3秒后隐藏并移除
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
} 