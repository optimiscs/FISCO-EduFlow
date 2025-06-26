document.addEventListener('DOMContentLoaded', function() {
    // 简化配色方案配置
    const colorConfig = {
        // 主要颜色
        colors: {
            primary: '#1A2980',
            primaryLight: '#26D0CE',
            secondary: '#00d2ff',
            accent: '#DC143C',
            accentGold: '#FFD700',
            success: '#00C853',
            warning: '#FF9800',
            danger: '#FF5252',
            info: '#2196F3',
            purple: '#9C27B0',
            teal: '#607D8B'
        },
        
        // 图表专用色彩 - 简化
        chartColors: {
            line: '#1A2980',
            grid: 'rgba(0, 0, 0, 0.1)',
            axis: 'rgba(0, 0, 0, 0.2)',
            text: '#555'
        },
        
        // 饼图配色 - 纯色
        pieColors: [
            '#1A2980', // 深蓝
            '#DC143C', // 红色
            '#00C853', // 绿色
            '#FF9800', // 橙色
            '#9C27B0', // 紫色
            '#607D8B'  // 蓝灰
        ],
        
        // 状态配色
        statusColors: {
            active: '#00C853',
            inactive: '#FF9800',
            pending: '#2196F3',
            suspended: '#FF5252',
            warning: '#FFC107',
            error: '#F44336'
        }
    };

    // 导航管理器
    const NavigationManager = {
        currentPage: 'dashboard',
        
        init() {
            this.setupNavigation();
            this.showPage('dashboard');
            this.initDashboard();
        },
        
        setupNavigation() {
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        const pageId = href.substring(1);
                        this.navigateToPage(pageId);
                    }
                });
            });
        },
        
        navigateToPage(pageId) {
            // 更新导航状态
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[href="#${pageId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
            
            // 更新页面标题
            const pageTitles = {
                'dashboard': '系统概览',
                'nodes': '节点管理',
                'transactions': '交易监控',
                'alerts': '异常警报',
                'appeals': '申诉处理',
                'settings': '系统设置'
            };
            
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.textContent = pageTitles[pageId] || '系统管理';
            }
            
            // 显示对应页面
            this.showPage(pageId);
            this.currentPage = pageId;
        },
        
        showPage(pageId) {
            // 隐藏所有页面
            document.querySelectorAll('.page-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // 显示目标页面
            const targetPage = document.getElementById(`page-${pageId}`);
            if (targetPage) {
                targetPage.style.display = 'block';
            }
            
            // 初始化页面特定功能
            this.initPageFeatures(pageId);
        },
        
        initPageFeatures(pageId) {
            switch(pageId) {
                case 'dashboard':
                    this.initDashboard();
                    break;
                case 'nodes':
                    this.initNodesPage();
                    break;
                case 'transactions':
                    this.initTransactionsPage();
                    break;
                case 'alerts':
                    this.initAlertsPage();
                    break;
                case 'appeals':
                    this.initAppealsPage();
                    break;
                case 'settings':
                    this.initSettingsPage();
                    break;
            }
        },
        
        // 系统概览页面初始化
        initDashboard() {
            this.drawSystemMetricsChart();
            this.drawNodeStatusChart();
            this.drawTransactionTrendChart();
            this.startRealTimeUpdates();
        },
        
        // 节点管理页面初始化
        initNodesPage() {
            this.loadNodesData();
            this.setupNodeFilters();
            this.drawNodeDistributionChart();
        },
        
        // 交易监控页面初始化
        initTransactionsPage() {
            this.drawTransactionVolumeChart();
            this.drawTransactionTypeChart();
            this.setupTransactionFilters();
        },
        
        // 异常警报页面初始化
        initAlertsPage() {
            this.loadAlertsData();
            this.drawAlertTrendChart();
            this.setupAlertFilters();
        },
        
        // 申诉处理页面初始化
        initAppealsPage() {
            this.loadAppealsData();
            this.drawAppealStatusChart();
            this.setupAppealFilters();
        },
        
        // 系统设置页面初始化
        initSettingsPage() {
            this.loadSystemSettings();
            this.setupSettingsHandlers();
        }
    };
    
    // Canvas图表绘制器 - 简化设计
    const ChartRenderer = {
        // 创建线性渐变（仅在关键位置使用）
        createGradient(ctx, x1, y1, x2, y2, colors) {
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            colors.forEach((color, index) => {
                gradient.addColorStop(index / (colors.length - 1), color);
            });
            return gradient;
        },
        
        // 绘制系统指标图表 - 简化为纯色柱状图
        drawSystemMetricsChart() {
            const canvas = document.getElementById('system-metrics-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            // 清空画布
            ctx.clearRect(0, 0, rect.width, rect.height);
            
            // 绘制CPU、内存、存储、网络使用率
            const metrics = [
                { label: 'CPU', value: 45, color: colorConfig.colors.primary },
                { label: '内存', value: 65, color: colorConfig.colors.warning },
                { label: '存储', value: 52, color: colorConfig.colors.success },
                { label: '网络', value: 28, color: colorConfig.colors.info }
            ];
            
            const barWidth = rect.width / 5;
            const barHeight = rect.height - 80;
            const maxValue = 100;
            
            metrics.forEach((metric, index) => {
                const x = barWidth * (index + 0.5);
                const y = rect.height - 50;
                const height = (metric.value / maxValue) * barHeight;
                
                // 绘制简单的圆角矩形
                ctx.fillStyle = metric.color;
                this.drawRoundedRect(ctx, x - 25, y - height, 50, height, 6);
                ctx.fill();
                
                // 绘制数值
                ctx.fillStyle = '#333';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(metric.value + '%', x, y - height - 10);
                
                // 绘制标签
                ctx.fillStyle = '#666';
                ctx.font = '12px Arial';
                ctx.fillText(metric.label, x, y + 20);
            });
        },
        
        // 绘制圆角矩形
        drawRoundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        },
        
        // 绘制节点状态饼图 - 简化为纯色
        drawNodeStatusChart() {
            const canvas = document.getElementById('node-status-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const radius = Math.min(centerX, centerY) - 30;
            
            const data = [
                { label: '活跃', value: 15, color: colorConfig.statusColors.active },
                { label: '非活跃', value: 3, color: colorConfig.statusColors.inactive },
                { label: '待审核', value: 2, color: colorConfig.statusColors.pending },
                { label: '已暂停', value: 1, color: colorConfig.statusColors.suspended }
            ];
            
            let currentAngle = -Math.PI / 2;
            const total = data.reduce((sum, item) => sum + item.value, 0);
            
            data.forEach((item, index) => {
                const sliceAngle = (item.value / total) * 2 * Math.PI;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.lineTo(centerX, centerY);
                ctx.fillStyle = item.color;
                ctx.fill();
                
                // 绘制白色边框
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                currentAngle += sliceAngle;
            });
            
            // 绘制中心圆
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = colorConfig.chartColors.grid;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制中心文字
            ctx.fillStyle = colorConfig.colors.primary;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('节点总数', centerX, centerY - 5);
            ctx.font = 'bold 18px Arial';
            ctx.fillText(total.toString(), centerX, centerY + 10);
        },
        
        // 绘制交易趋势图 - 简化折线图
        drawTransactionTrendChart() {
            const canvas = document.getElementById('transaction-trend-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            // 生成模拟数据
            const data = [];
            for (let i = 0; i < 24; i++) {
                data.push({
                    hour: i,
                    transactions: Math.floor(Math.random() * 200) + 50 + Math.sin(i / 4) * 50
                });
            }
            
            const maxValue = Math.max(...data.map(d => d.transactions));
            const padding = 50;
            const chartWidth = rect.width - padding * 2;
            const chartHeight = rect.height - padding * 2;
            
            // 绘制网格
            this.drawGrid(ctx, padding, padding, chartWidth, chartHeight, colorConfig.chartColors.grid);
            
            // 绘制简单的区域填充
            ctx.fillStyle = 'rgba(26, 41, 128, 0.1)';
            ctx.beginPath();
            ctx.moveTo(padding, rect.height - padding);
            
            data.forEach((point, index) => {
                const x = padding + (index / (data.length - 1)) * chartWidth;
                const y = rect.height - padding - (point.transactions / maxValue) * chartHeight;
                ctx.lineTo(x, y);
            });
            
            ctx.lineTo(rect.width - padding, rect.height - padding);
            ctx.closePath();
            ctx.fill();
            
            // 绘制折线
            ctx.strokeStyle = colorConfig.colors.primary;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            data.forEach((point, index) => {
                const x = padding + (index / (data.length - 1)) * chartWidth;
                const y = rect.height - padding - (point.transactions / maxValue) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            
            // 绘制数据点
            data.forEach((point, index) => {
                const x = padding + (index / (data.length - 1)) * chartWidth;
                const y = rect.height - padding - (point.transactions / maxValue) * chartHeight;
                
                // 外圈
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();
                
                // 内圈
                ctx.fillStyle = colorConfig.colors.primary;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        },
        
        // 绘制网格
        drawGrid(ctx, x, y, width, height, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            
            // 水平网格线
            for (let i = 0; i <= 5; i++) {
                const lineY = y + (height / 5) * i;
                ctx.beginPath();
                ctx.moveTo(x, lineY);
                ctx.lineTo(x + width, lineY);
                ctx.stroke();
            }
            
            // 垂直网格线
            for (let i = 0; i <= 6; i++) {
                const lineX = x + (width / 6) * i;
                ctx.beginPath();
                ctx.moveTo(lineX, y);
                ctx.lineTo(lineX, y + height);
                ctx.stroke();
            }
        },
        
        // 绘制节点分布图 - 简化柱状图
        drawNodeDistributionChart() {
            const canvas = document.getElementById('node-distribution-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const data = [
                { region: '华北', nodes: 8, color: colorConfig.colors.primary },
                { region: '华东', nodes: 6, color: colorConfig.colors.success },
                { region: '华南', nodes: 4, color: colorConfig.colors.warning },
                { region: '西南', nodes: 3, color: colorConfig.colors.danger }
            ];
            
            const barHeight = 30;
            const maxValue = Math.max(...data.map(d => d.nodes));
            const chartWidth = rect.width - 120;
            
            data.forEach((item, index) => {
                const y = index * (barHeight + 15) + 30;
                const barWidth = (item.nodes / maxValue) * chartWidth;
                
                // 绘制简单的矩形柱状图
                ctx.fillStyle = item.color;
                ctx.fillRect(80, y - barHeight/2, barWidth, barHeight);
                
                // 绘制标签
                ctx.fillStyle = '#333';
                ctx.font = '14px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(item.region, 70, y + 5);
                
                ctx.textAlign = 'left';
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(item.nodes + '个', 85, y + 5);
            });
        },
        
        // 绘制交易量图表 - 简化柱状图
        drawTransactionVolumeChart() {
            const canvas = document.getElementById('transaction-volume-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            // 生成7天的数据
            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const data = days.map(day => ({
                day,
                volume: Math.floor(Math.random() * 1000) + 500
            }));
            
            const maxValue = Math.max(...data.map(d => d.volume));
            const padding = 50;
            const chartWidth = rect.width - padding * 2;
            const chartHeight = rect.height - padding * 2;
            
            // 绘制网格
            this.drawGrid(ctx, padding, padding, chartWidth, chartHeight, colorConfig.chartColors.grid);
            
            // 绘制柱状图
            const barWidth = chartWidth / data.length * 0.7;
            data.forEach((item, index) => {
                const x = padding + (index + 0.15) * (chartWidth / data.length);
                const height = (item.volume / maxValue) * chartHeight;
                const y = rect.height - padding - height;
                
                // 绘制简单的矩形柱状图
                ctx.fillStyle = colorConfig.colors.accent;
                ctx.fillRect(x, y, barWidth, height);
                
                // 绘制标签
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.day, x + barWidth / 2, rect.height - padding + 20);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px Arial';
                ctx.fillText(item.volume.toString(), x + barWidth / 2, y + 15);
            });
        },
        
        // 绘制交易类型图表 - 简化饼图
        drawTransactionTypeChart() {
            const canvas = document.getElementById('transaction-type-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const radius = Math.min(centerX, centerY) - 40;
            
            const data = [
                { label: '学历上链', value: 45, color: colorConfig.pieColors[0] },
                { label: '证书验证', value: 30, color: colorConfig.pieColors[1] },
                { label: '信息查询', value: 15, color: colorConfig.pieColors[2] },
                { label: '其他操作', value: 10, color: colorConfig.pieColors[3] }
            ];
            
            let currentAngle = -Math.PI / 2;
            const total = data.reduce((sum, item) => sum + item.value, 0);
            
            data.forEach((item, index) => {
                const sliceAngle = (item.value / total) * 2 * Math.PI;
                const midAngle = currentAngle + sliceAngle / 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.lineTo(centerX, centerY);
                ctx.fillStyle = item.color;
                ctx.fill();
                
                // 绘制白色边框
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 绘制简单的标签
                const labelRadius = radius + 25;
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;
                
                ctx.fillStyle = item.color;
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = labelX > centerX ? 'left' : 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.label, labelX + (labelX > centerX ? 5 : -5), labelY - 8);
                ctx.font = '10px Arial';
                ctx.fillText(item.value + '%', labelX + (labelX > centerX ? 5 : -5), labelY + 8);
                
                currentAngle += sliceAngle;
            });
        },
        
        // 绘制警报趋势图 - 简化堆叠柱状图
        drawAlertTrendChart() {
            const canvas = document.getElementById('alert-trend-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            // 生成30天的警报数据
            const data = [];
            for (let i = 0; i < 30; i++) {
                data.push({
                    day: i + 1,
                    critical: Math.floor(Math.random() * 5),
                    warning: Math.floor(Math.random() * 10) + 5,
                    info: Math.floor(Math.random() * 15) + 10
                });
            }
            
            const maxValue = Math.max(...data.map(d => d.critical + d.warning + d.info));
            const padding = 40;
            const chartWidth = rect.width - padding * 2;
            const chartHeight = rect.height - padding * 2;
            
            // 绘制网格
            this.drawGrid(ctx, padding, padding, chartWidth, chartHeight, colorConfig.chartColors.grid);
            
            // 绘制堆叠柱状图
            const barWidth = chartWidth / data.length * 0.8;
            data.forEach((item, index) => {
                const x = padding + index * (chartWidth / data.length);
                let currentY = rect.height - padding;
                
                // 绘制信息级别
                const infoHeight = (item.info / maxValue) * chartHeight;
                currentY -= infoHeight;
                ctx.fillStyle = colorConfig.colors.info;
                ctx.fillRect(x, currentY, barWidth, infoHeight);
                
                // 绘制警告级别
                const warningHeight = (item.warning / maxValue) * chartHeight;
                currentY -= warningHeight;
                ctx.fillStyle = colorConfig.colors.warning;
                ctx.fillRect(x, currentY, barWidth, warningHeight);
                
                // 绘制严重级别
                const criticalHeight = (item.critical / maxValue) * chartHeight;
                currentY -= criticalHeight;
                ctx.fillStyle = colorConfig.colors.danger;
                ctx.fillRect(x, currentY, barWidth, criticalHeight);
            });
        },
        
        // 绘制申诉状态图表 - 简化饼图
        drawAppealStatusChart() {
            const canvas = document.getElementById('appeal-status-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const radius = Math.min(centerX, centerY) - 30;
            
            const data = [
                { label: '待处理', value: 12, color: colorConfig.statusColors.pending },
                { label: '处理中', value: 8, color: colorConfig.statusColors.warning },
                { label: '已解决', value: 25, color: colorConfig.statusColors.active },
                { label: '已拒绝', value: 5, color: colorConfig.statusColors.suspended }
            ];
            
            let currentAngle = -Math.PI / 2;
            const total = data.reduce((sum, item) => sum + item.value, 0);
            
            data.forEach(item => {
                const sliceAngle = (item.value / total) * 2 * Math.PI;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.lineTo(centerX, centerY);
                ctx.fillStyle = item.color;
                ctx.fill();
                
                // 绘制白色边框
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                currentAngle += sliceAngle;
            });
            
            // 绘制中心圆
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = colorConfig.chartColors.grid;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制中心文字
            ctx.fillStyle = colorConfig.colors.primary;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('申诉总数', centerX, centerY - 5);
            ctx.font = 'bold 18px Arial';
            ctx.fillText(total.toString(), centerX, centerY + 10);
        }
    };
    
    // 数据管理器
    const DataManager = {
        // 节点数据
        nodesData: [
            { id: 'NODE001', name: '北京大学节点', type: 'school', ip: '192.168.1.101', status: 'active', region: '华北', onlineTime: '2024-10-15 08:30:00' },
            { id: 'NODE002', name: '教育部监管节点', type: 'gov', ip: '192.168.1.102', status: 'active', region: '华北', onlineTime: '2024-10-10 09:15:00' },
            { id: 'NODE003', name: '清华大学节点', type: 'school', ip: '192.168.1.103', status: 'inactive', region: '华北', onlineTime: '2024-10-20 14:45:00' },
            { id: 'NODE004', name: '腾讯企业节点', type: 'enterprise', ip: '192.168.1.104', status: 'pending', region: '华南', onlineTime: '2024-10-28 16:20:00' },
            { id: 'NODE005', name: '上海交大节点', type: 'school', ip: '192.168.1.105', status: 'suspended', region: '华东', onlineTime: '2024-10-05 10:30:00' }
        ],
        
        // 警报数据
        alertsData: [
            {
                id: 'ALT001',
                type: '节点异常',
                severity: 'critical',
                content: 'NODE003 (清华大学节点) 连接中断，已尝试重连3次',
                time: '2024-11-01 07:15:22',
                status: 'pending'
            },
            {
                id: 'ALT002',
                type: '交易延迟',
                severity: 'warning',
                content: '系统检测到交易确认时间异常延长，平均确认时间超过30秒',
                time: '2024-11-01 05:30:15',
                status: 'pending'
            }
        ],
        
        // 申诉数据
        appealsData: [
            {
                id: 'APP001',
                type: '学历信息异议',
                status: 'pending',
                appellant: '李明',
                studentId: '20180101',
                submitTime: '2024-10-30 14:20:00',
                content: '我的毕业证书信息有误，专业名称显示为"计算机科学"，但实际应为"计算机科学与技术"。'
            },
            {
                id: 'APP002',
                type: '证书丢失补办',
                status: 'pending',
                appellant: '张华',
                studentId: '20150234',
                submitTime: '2024-10-29 09:45:00',
                content: '由于个人原因，我的毕业证书原件遗失，需要申请电子版证书重新下载权限。'
            }
        ]
    };
    
    // 将ChartRenderer方法绑定到NavigationManager
    Object.assign(NavigationManager, ChartRenderer);
    
    // 页面功能实现
    Object.assign(NavigationManager, {
        // 加载节点数据
        loadNodesData() {
            const tableBody = document.getElementById('nodes-table-body');
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            DataManager.nodesData.forEach(node => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="node-checkbox"></td>
                    <td>${node.id}</td>
                    <td>${node.name}</td>
                    <td>${this.getNodeTypeText(node.type)}</td>
                    <td>${node.ip}</td>
                    <td><span class="status-badge status-badge-${node.status}">${this.getStatusText(node.status)}</span></td>
                    <td>${node.onlineTime}</td>
                    <td>
                        <button class="btn btn-sm btn-outline node-details-btn">详情</button>
                        <button class="btn btn-sm btn-outline">日志</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        },
        
        // 设置节点筛选器
        setupNodeFilters() {
            const typeFilter = document.getElementById('node-type-filter');
            const statusFilter = document.getElementById('node-status-filter');
            const searchInput = document.getElementById('node-search');
            
            [typeFilter, statusFilter, searchInput].forEach(element => {
                if (element) {
                    element.addEventListener('change', () => this.filterNodes());
                    element.addEventListener('input', () => this.filterNodes());
                }
            });
        },
        
        // 筛选节点
        filterNodes() {
            const typeValue = document.getElementById('node-type-filter')?.value || 'all';
            const statusValue = document.getElementById('node-status-filter')?.value || 'all';
            const searchValue = document.getElementById('node-search')?.value?.toLowerCase() || '';
            
            const rows = document.querySelectorAll('#nodes-table-body tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 6) return;
                
                const nodeType = cells[3].textContent.toLowerCase();
                const nodeStatus = cells[5].textContent.toLowerCase();
                const nodeName = cells[2].textContent.toLowerCase();
                const nodeId = cells[1].textContent.toLowerCase();
                
                const typeMatch = typeValue === 'all' || 
                                 (typeValue === 'school' && nodeType.includes('学校')) ||
                                 (typeValue === 'gov' && nodeType.includes('政府')) ||
                                 (typeValue === 'enterprise' && nodeType.includes('企业'));
                                 
                const statusMatch = statusValue === 'all' || 
                                   (statusValue === 'active' && nodeStatus.includes('活跃')) ||
                                   (statusValue === 'inactive' && nodeStatus.includes('非活跃')) ||
                                   (statusValue === 'pending' && nodeStatus.includes('待审核')) ||
                                   (statusValue === 'suspended' && nodeStatus.includes('已暂停'));
                                   
                const searchMatch = searchValue === '' || 
                                   nodeName.includes(searchValue) || 
                                   nodeId.includes(searchValue);
                
                row.style.display = (typeMatch && statusMatch && searchMatch) ? '' : 'none';
            });
        },
        
        // 设置交易筛选器
        setupTransactionFilters() {
            const timeGranularity = document.getElementById('time-granularity');
            if (timeGranularity) {
                timeGranularity.addEventListener('change', () => {
                    this.drawTransactionVolumeChart();
                });
            }
        },
        
        // 加载警报数据
        loadAlertsData() {
            const container = document.getElementById('alerts-container');
            if (!container) return;
            
            container.innerHTML = '';
            DataManager.alertsData.forEach(alert => {
                const alertElement = document.createElement('div');
                alertElement.className = `alert-item alert-${alert.severity === 'critical' ? 'danger' : 'warning'}`;
                alertElement.innerHTML = `
                    <div class="alert-header">
                        <strong class="alert-${alert.severity === 'critical' ? 'danger' : 'warning'}-title">${alert.type} #${alert.id}</strong>
                        <span class="alert-time">${alert.time}</span>
                    </div>
                    <div class="alert-content">${alert.content}</div>
                    <div class="alert-footer">
                        <span class="status-badge status-badge-suspended">${this.getStatusText(alert.status)}</span>
                        <button class="btn btn-sm btn-outline">查看详情</button>
                    </div>
                `;
                container.appendChild(alertElement);
            });
        },
        
        // 设置警报筛选器
        setupAlertFilters() {
            const refreshBtn = document.getElementById('refresh-alerts-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadAlertsData();
                    this.drawAlertTrendChart();
                });
            }
        },
        
        // 加载申诉数据
        loadAppealsData() {
            const container = document.getElementById('appeals-container');
            if (!container) return;
            
            container.innerHTML = '';
            DataManager.appealsData.forEach(appeal => {
                const appealElement = document.createElement('div');
                appealElement.className = 'appeal-item';
                appealElement.innerHTML = `
                    <div class="appeal-header">
                        <strong>${appeal.type} #${appeal.id}</strong>
                        <span class="status-badge status-badge-pending">${this.getStatusText(appeal.status)}</span>
                    </div>
                    <div class="appeal-info">
                        <span class="appeal-info-label">申诉人:</span> ${appeal.appellant}
                        <span class="appeal-info-spacing">学号:</span> ${appeal.studentId}
                        <span class="appeal-info-spacing">提交时间:</span> ${appeal.submitTime}
                    </div>
                    <div class="appeal-content">
                        <p>${appeal.content}</p>
                    </div>
                    <div class="appeal-actions">
                        <button class="btn btn-sm btn-primary process-appeal-btn">处理申诉</button>
                    </div>
                `;
                container.appendChild(appealElement);
            });
        },
        
        // 设置申诉筛选器
        setupAppealFilters() {
            const statusFilter = document.getElementById('appeal-status-filter');
            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.filterAppeals());
            }
        },
        
        // 筛选申诉
        filterAppeals() {
            const statusValue = document.getElementById('appeal-status-filter')?.value || 'all';
            const appealItems = document.querySelectorAll('.appeal-item');
            
            appealItems.forEach(item => {
                const statusBadge = item.querySelector('.status-badge');
                const status = statusBadge?.textContent?.toLowerCase() || '';
                
                const statusMatch = statusValue === 'all' || 
                                   (statusValue === 'pending' && status.includes('待处理')) ||
                                   (statusValue === 'processing' && status.includes('处理中')) ||
                                   (statusValue === 'resolved' && status.includes('已解决')) ||
                                   (statusValue === 'rejected' && status.includes('已拒绝'));
                
                item.style.display = statusMatch ? '' : 'none';
            });
        },
        
        // 加载系统设置
        loadSystemSettings() {
            // 系统设置相关逻辑
            console.log('加载系统设置');
        },
        
        // 设置系统设置处理器
        setupSettingsHandlers() {
            // 系统设置处理器
            console.log('设置系统设置处理器');
        },
        
        // 启动实时更新
        startRealTimeUpdates() {
            setInterval(() => {
                if (this.currentPage === 'dashboard') {
                    this.updateSystemMetrics();
                }
            }, 15000);
        },
        
        // 更新系统指标
        updateSystemMetrics() {
            this.drawSystemMetricsChart();
        },
        
        // 工具方法
        getNodeTypeText(type) {
            const typeMap = {
                'school': '学校节点',
                'gov': '政府节点',
                'enterprise': '企业节点'
            };
            return typeMap[type] || type;
        },
        
        getStatusText(status) {
            const statusMap = {
                'active': '活跃',
                'inactive': '非活跃',
                'pending': '待处理',
                'suspended': '已暂停'
            };
            return statusMap[status] || status;
        }
    });
    
    // 初始化应用
    NavigationManager.init();
}); 