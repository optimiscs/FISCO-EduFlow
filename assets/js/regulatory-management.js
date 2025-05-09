document.addEventListener('DOMContentLoaded', function() {
    // 通用功能初始化
    initCommonFeatures();
    
    // 节点管理功能初始化
    initNodeManagement();
    
    // 交易监控图表初始化
    initTransactionsChart();
    
    // 异常警报功能初始化
    initAlertSystem();
    
    // 申诉处理功能初始化
    initAppealSystem();
    
    // 实时数据更新模拟
    setInterval(updateSystemMetrics, 15000);
});

/**
 * 初始化通用功能
 */
function initCommonFeatures() {
    // 侧边栏导航切换
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                // 移除所有活动链接
                navLinks.forEach(l => l.classList.remove('active'));
                // 设置当前链接为活动状态
                this.classList.add('active');
                
                // 导航到相应部分的逻辑可以在此添加
                const targetId = link.getAttribute('href').substring(1);
                console.log('导航到: ', targetId);
            }
        });
    });

    // 系统状态刷新按钮
    const refreshStatusBtn = document.querySelector('.system-status .btn-outline');
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', function() {
            // 更新最后更新时间
            const timeSpan = document.querySelector('.system-status span');
            if (timeSpan) {
                const now = new Date();
                const formattedTime = formatDateTime(now);
                timeSpan.textContent = '最后更新: ' + formattedTime;
            }
            
            // 更新系统指标
            updateSystemMetrics();
        });
    }
}

/**
 * 更新系统指标
 */
function updateSystemMetrics() {
    // CPU使用率
    updateMetric('.content-wrapper .card:first-child .progress-bar-inner:nth-of-type(1)', 
                '.content-wrapper .card:first-child .progress-info:nth-of-type(1) span:first-child', 
                20, 60, '%');
    
    // 内存使用率
    updateMetric('.content-wrapper .card:first-child .progress-bar-inner:nth-of-type(2)', 
                '.content-wrapper .card:first-child .progress-info:nth-of-type(2) span:first-child', 
                40, 70, '%');
    
    // 存储空间
    updateMetric('.content-wrapper .card:first-child .progress-bar-inner:nth-of-type(3)', 
                '.content-wrapper .card:first-child .progress-info:nth-of-type(3) span:first-child', 
                40, 60, '%');
    
    // 网络带宽
    updateMetric('.content-wrapper .card:first-child .progress-bar-inner:nth-of-type(4)', 
                '.content-wrapper .card:first-child .progress-info:nth-of-type(4) span:first-child', 
                10, 40, '%');
}

/**
 * 更新特定指标
 */
function updateMetric(barSelector, textSelector, min, max, unit) {
    const bar = document.querySelector(barSelector);
    const text = document.querySelector(textSelector);
    
    if (bar && text) {
        const newValue = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // 动画效果更新进度条
        animateProgress(bar, parseInt(bar.style.width), newValue);
        
        // 更新文本
        text.textContent = newValue + unit;
        
        // 根据值设置颜色
        if (newValue > 70) {
            bar.style.backgroundColor = 'var(--danger-color)';
        } else if (newValue > 50) {
            bar.style.backgroundColor = 'var(--warning-color)';
        } else {
            bar.style.backgroundColor = 'var(--success-color)';
        }
    }
}

/**
 * 进度条动画
 */
function animateProgress(element, start, end) {
    let current = start;
    const increment = end > start ? 1 : -1;
    const duration = 500; // 动画时长
    const steps = Math.abs(end - start);
    const stepTime = steps > 0 ? duration / steps : duration;
    
    const timer = setInterval(() => {
        current += increment;
        element.style.width = current + '%';
        
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            clearInterval(timer);
        }
    }, stepTime);
}

/**
 * 初始化节点管理
 */
function initNodeManagement() {
    // 节点数据
    const nodes = [
        { id: 'NODE001', name: '北京大学节点', type: 'school', ip: '192.168.1.101', status: 'active', onlineTime: '2023-10-15 08:30:00' },
        { id: 'NODE002', name: '教育部监管节点', type: 'gov', ip: '192.168.1.102', status: 'active', onlineTime: '2023-10-10 09:15:00' },
        { id: 'NODE003', name: '清华大学节点', type: 'school', ip: '192.168.1.103', status: 'inactive', onlineTime: '2023-10-20 14:45:00' },
        { id: 'NODE004', name: '腾讯企业节点', type: 'enterprise', ip: '192.168.1.104', status: 'pending', onlineTime: '2023-10-28 16:20:00' },
        { id: 'NODE005', name: '上海交大节点', type: 'school', ip: '192.168.1.105', status: 'suspended', onlineTime: '2023-10-05 10:30:00' }
    ];
    
    // 全选功能
    const selectAllCheckbox = document.getElementById('select-all-nodes');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.node-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateSelectedCount();
        });
    }
    
    // 更新选中计数
    function updateSelectedCount() {
        const selectedCount = document.querySelectorAll('.node-checkbox:checked').length;
        const countElement = document.getElementById('selected-count');
        const batchCountElement = document.getElementById('batch-selected-count');
        
        if (countElement) {
            countElement.textContent = selectedCount;
        }
        
        if (batchCountElement) {
            batchCountElement.textContent = selectedCount;
        }
    }
    
    // 监听复选框变化
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('node-checkbox')) {
            updateSelectedCount();
        }
    });
    
    // 节点筛选功能
    const nodeTypeFilter = document.getElementById('node-type-filter');
    const nodeStatusFilter = document.getElementById('node-status-filter');
    const nodeSearch = document.getElementById('node-search');
    
    // 节点筛选函数
    function filterNodes() {
        const typeValue = nodeTypeFilter.value;
        const statusValue = nodeStatusFilter.value;
        const searchValue = nodeSearch.value.toLowerCase();
        
        // 获取表格中所有行
        const rows = document.querySelectorAll('#nodes-table-body tr');
        
        rows.forEach(row => {
            const nodeType = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
            const nodeStatus = row.querySelector('td:nth-child(6) span').textContent.toLowerCase();
            const nodeName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const nodeId = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            
            // 应用筛选条件
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
            
            // 显示或隐藏行
            if (typeMatch && statusMatch && searchMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // 添加筛选事件监听器
    if (nodeTypeFilter) {
        nodeTypeFilter.addEventListener('change', filterNodes);
    }
    
    if (nodeStatusFilter) {
        nodeStatusFilter.addEventListener('change', filterNodes);
    }
    
    if (nodeSearch) {
        nodeSearch.addEventListener('input', filterNodes);
        nodeSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterNodes();
            }
        });
    }
    
    // 节点详情按钮
    const detailButtons = document.querySelectorAll('.node-details-btn');
    detailButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const nodeId = row.querySelector('td:nth-child(2)').textContent;
            const nodeName = row.querySelector('td:nth-child(3)').textContent;
            const nodeType = row.querySelector('td:nth-child(4)').textContent;
            const nodeIp = row.querySelector('td:nth-child(5)').textContent;
            const nodeStatus = row.querySelector('td:nth-child(6) span').textContent;
            const nodeOnlineTime = row.querySelector('td:nth-child(7)').textContent;
            
            showNodeDetails(nodeId, nodeName, nodeType, nodeIp, nodeStatus, nodeOnlineTime);
        });
    });
    
    // 显示节点详情
    function showNodeDetails(id, name, type, ip, status, onlineTime) {
        const modal = document.getElementById('node-details-modal');
        const modalTitle = document.getElementById('modal-node-title');
        const detailsContent = document.getElementById('node-details-content');
        
        // 设置标题
        modalTitle.textContent = `节点详情 - ${name}`;
        
        // 生成详情内容HTML
        const detailsHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3 style="margin-bottom: 15px;">基本信息</h3>
                    <p><strong>节点ID:</strong> ${id}</p>
                    <p><strong>节点名称:</strong> ${name}</p>
                    <p><strong>节点类型:</strong> ${type}</p>
                    <p><strong>IP地址:</strong> ${ip}</p>
                    <p><strong>状态:</strong> ${status}</p>
                    <p><strong>上线时间:</strong> ${onlineTime}</p>
                </div>
                <div>
                    <h3 style="margin-bottom: 15px;">性能统计</h3>
                    <div>
                        <p><strong>CPU使用率:</strong> ${Math.floor(Math.random() * 50) + 20}%</p>
                        <div class="progress-bar">
                            <div class="progress-bar-inner" style="width: ${Math.floor(Math.random() * 50) + 20}%;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <p><strong>内存使用率:</strong> ${Math.floor(Math.random() * 30) + 30}%</p>
                        <div class="progress-bar">
                            <div class="progress-bar-inner" style="width: ${Math.floor(Math.random() * 30) + 30}%;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <p><strong>存储使用率:</strong> ${Math.floor(Math.random() * 40) + 30}%</p>
                        <div class="progress-bar">
                            <div class="progress-bar-inner" style="width: ${Math.floor(Math.random() * 40) + 30}%;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <p><strong>每日交易量:</strong> ${Math.floor(Math.random() * 500) + 100} 笔</p>
                    </div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 15px;">最近活动</h3>
                <table>
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>活动类型</th>
                            <th>详情</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${formatDateTime(new Date(Date.now() - 1000 * 60 * 30))}</td>
                            <td>数据同步</td>
                            <td>同步最新区块数据，高度达到 #${Math.floor(Math.random() * 1000) + 9000}</td>
                        </tr>
                        <tr>
                            <td>${formatDateTime(new Date(Date.now() - 1000 * 60 * 120))}</td>
                            <td>共识参与</td>
                            <td>成功参与PBFT共识过程，验证 ${Math.floor(Math.random() * 50) + 20} 笔交易</td>
                        </tr>
                        <tr>
                            <td>${formatDateTime(new Date(Date.now() - 1000 * 60 * 240))}</td>
                            <td>系统更新</td>
                            <td>完成系统软件版本更新至 v1.2.5</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        // 更新详情内容
        detailsContent.innerHTML = detailsHTML;
        
        // 显示模态框
        modal.style.display = 'flex';
    }
    
    // 关闭节点详情模态框
    const closeModalBtn = document.getElementById('close-modal');
    const closeDetailsBtn = document.getElementById('close-details-btn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            document.getElementById('node-details-modal').style.display = 'none';
        });
    }
    
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', function() {
            document.getElementById('node-details-modal').style.display = 'none';
        });
    }
    
    // 添加节点功能
    const addNodeBtn = document.getElementById('add-node-btn');
    const closeAddModalBtn = document.getElementById('close-add-modal');
    const cancelAddNodeBtn = document.getElementById('cancel-add-node');
    const addNodeForm = document.getElementById('add-node-form');
    
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', function() {
            document.getElementById('add-node-modal').style.display = 'flex';
        });
    }
    
    if (closeAddModalBtn) {
        closeAddModalBtn.addEventListener('click', function() {
            document.getElementById('add-node-modal').style.display = 'none';
        });
    }
    
    if (cancelAddNodeBtn) {
        cancelAddNodeBtn.addEventListener('click', function() {
            document.getElementById('add-node-modal').style.display = 'none';
        });
    }
    
    if (addNodeForm) {
        addNodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // 这里可以添加表单处理逻辑
            alert('添加节点成功');
            document.getElementById('add-node-modal').style.display = 'none';
        });
    }
    
    // 批量操作功能
    const batchOperationBtn = document.getElementById('batch-operation-btn');
    const closeBatchModalBtn = document.getElementById('close-batch-modal');
    const cancelBatchOperationBtn = document.getElementById('cancel-batch-operation');
    
    if (batchOperationBtn) {
        batchOperationBtn.addEventListener('click', function() {
            updateSelectedCount();
            document.getElementById('batch-operation-modal').style.display = 'flex';
        });
    }
    
    if (closeBatchModalBtn) {
        closeBatchModalBtn.addEventListener('click', function() {
            document.getElementById('batch-operation-modal').style.display = 'none';
        });
    }
    
    if (cancelBatchOperationBtn) {
        cancelBatchOperationBtn.addEventListener('click', function() {
            document.getElementById('batch-operation-modal').style.display = 'none';
        });
    }
    
    // 批量操作按钮
    const batchActivateBtn = document.getElementById('batch-activate');
    const batchDeactivateBtn = document.getElementById('batch-deactivate');
    const batchDeleteBtn = document.getElementById('batch-delete');
    const batchExportBtn = document.getElementById('batch-export');
    
    if (batchActivateBtn) {
        batchActivateBtn.addEventListener('click', function() {
            const selectedCount = document.querySelectorAll('.node-checkbox:checked').length;
            alert(`成功激活 ${selectedCount} 个节点`);
            document.getElementById('batch-operation-modal').style.display = 'none';
        });
    }
    
    if (batchDeactivateBtn) {
        batchDeactivateBtn.addEventListener('click', function() {
            const selectedCount = document.querySelectorAll('.node-checkbox:checked').length;
            alert(`成功停用 ${selectedCount} 个节点`);
            document.getElementById('batch-operation-modal').style.display = 'none';
        });
    }
    
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', function() {
            const selectedCount = document.querySelectorAll('.node-checkbox:checked').length;
            if (confirm(`确定要删除选中的 ${selectedCount} 个节点吗？`)) {
                alert(`成功删除 ${selectedCount} 个节点`);
                document.getElementById('batch-operation-modal').style.display = 'none';
            }
        });
    }
    
    if (batchExportBtn) {
        batchExportBtn.addEventListener('click', function() {
            const selectedCount = document.querySelectorAll('.node-checkbox:checked').length;
            alert(`正在导出 ${selectedCount} 个节点的信息，请稍候...`);
            document.getElementById('batch-operation-modal').style.display = 'none';
        });
    }
    
    // 导出节点列表
    const exportNodesBtn = document.getElementById('export-nodes-btn');
    
    if (exportNodesBtn) {
        exportNodesBtn.addEventListener('click', function() {
            alert('正在导出节点列表，请稍候...');
            
            // 模拟导出过程
            setTimeout(function() {
                const blob = new Blob(['节点列表数据...'], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '节点列表_' + formatDateForFile(new Date()) + '.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
        });
    }
}

/**
 * 格式化日期时间
 */
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期用于文件名
 */
function formatDateForFile(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}`;
}

/**
 * 初始化交易监控图表
 */
function initTransactionsChart() {
    const ctx = document.getElementById('transactions-chart');
    if (!ctx) return;
    
    // 默认显示日粒度数据
    const dayData = generateTransactionData('day');
    
    // 创建交易图表
    const transactionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayData.labels,
            datasets: [{
                label: '交易量',
                data: dayData.values,
                backgroundColor: 'rgba(26, 41, 128, 0.1)',
                borderColor: 'rgba(26, 41, 128, 0.8)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(26, 41, 128, 0.8)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `交易量: ${context.raw} 笔`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    // 处理粒度切换
    const timeGranularity = document.getElementById('time-granularity');
    if (timeGranularity) {
        timeGranularity.addEventListener('change', function() {
            const granularity = timeGranularity.value;
            const newData = generateTransactionData(granularity);
            
            transactionsChart.data.labels = newData.labels;
            transactionsChart.data.datasets[0].data = newData.values;
            
            transactionsChart.update();
        });
    }
}

/**
 * 生成交易数据
 */
function generateTransactionData(granularity) {
    let labels = [];
    let values = [];
    
    switch (granularity) {
        case 'day':
            // 24小时数据
            for (let i = 0; i < 24; i++) {
                labels.push(`${i}:00`);
                values.push(Math.floor(Math.random() * 200) + 50);
            }
            break;
            
        case 'week':
            // 7天数据
            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            for (let i = 0; i < 7; i++) {
                labels.push(days[i]);
                values.push(Math.floor(Math.random() * 1000) + 500);
            }
            break;
            
        case 'month':
            // 30天数据
            for (let i = 1; i <= 30; i++) {
                labels.push(`${i}日`);
                values.push(Math.floor(Math.random() * 2000) + 1000);
            }
            break;
            
        case 'year':
            // 12个月数据
            const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            for (let i = 0; i < 12; i++) {
                labels.push(months[i]);
                values.push(Math.floor(Math.random() * 10000) + 5000);
            }
            break;
    }
    
    return { labels, values };
}

/**
 * 初始化异常警报系统
 */
function initAlertSystem() {
    // 警报类型列表
    const alertTypes = [
        { 
            type: '节点异常',
            severity: 'danger',
            template: 'NODE_ID (NODE_NAME) 连接中断，已尝试重连ATTEMPTS次'
        },
        {
            type: '交易延迟',
            severity: 'warning',
            template: '系统检测到交易确认时间异常延长，平均确认时间超过SECONDS秒'
        },
        {
            type: '存储空间不足',
            severity: 'warning',
            template: 'NODE_ID (NODE_NAME) 存储使用率已达PERCENT%，请及时扩容'
        },
        {
            type: '安全警告',
            severity: 'danger',
            template: '检测到可疑操作，IP地址: IP_ADDRESS，尝试操作: OPERATION'
        },
        {
            type: '共识异常',
            severity: 'danger',
            template: '区块高度HEIGHT处发生共识异常，可能存在分叉情况'
        },
        {
            type: '系统性能下降',
            severity: 'warning',
            template: '系统TPS下降至TPS，已低于正常水平'
        }
    ];
    
    // 随机生成警报内容
    function generateRandomAlert() {
        const alertIndex = Math.floor(Math.random() * alertTypes.length);
        const alert = alertTypes[alertIndex];
        
        // 生成随机参数
        const nodeId = `NODE00${Math.floor(Math.random() * 5) + 1}`;
        const nodeName = getNodeNameById(nodeId);
        const attempts = Math.floor(Math.random() * 5) + 1;
        const seconds = Math.floor(Math.random() * 60) + 30;
        const percent = Math.floor(Math.random() * 15) + 85;
        const ipAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const operations = ['删除数据', '修改权限', '异常登录', '批量操作'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const height = Math.floor(Math.random() * 10000) + 10000;
        const tps = Math.floor(Math.random() * 50) + 10;
        
        // 替换模板中的参数
        let content = alert.template
            .replace('NODE_ID', nodeId)
            .replace('NODE_NAME', nodeName)
            .replace('ATTEMPTS', attempts)
            .replace('SECONDS', seconds)
            .replace('PERCENT', percent)
            .replace('IP_ADDRESS', ipAddress)
            .replace('OPERATION', operation)
            .replace('HEIGHT', height)
            .replace('TPS', tps);
            
        return {
            id: 'ALT' + Math.floor(Math.random() * 10000).toString().padStart(3, '0'),
            type: alert.type,
            severity: alert.severity,
            content: content,
            time: formatDateTime(new Date())
        };
    }
    
    // 根据节点ID获取节点名称
    function getNodeNameById(nodeId) {
        const nodeNames = {
            'NODE001': '北京大学节点',
            'NODE002': '教育部监管节点',
            'NODE003': '清华大学节点',
            'NODE004': '腾讯企业节点',
            'NODE005': '上海交大节点'
        };
        
        return nodeNames[nodeId] || '未知节点';
    }
    
    // 添加警报到页面
    function addAlertToUI(alert) {
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) return;
        
        const alertElement = document.createElement('div');
        alertElement.className = 'alert-item';
        alertElement.style.padding = '15px';
        alertElement.style.borderLeft = `4px solid var(--${alert.severity}-color)`;
        alertElement.style.background = alert.severity === 'danger' 
            ? 'rgba(255, 82, 82, 0.05)' 
            : 'rgba(255, 152, 0, 0.05)';
        alertElement.style.marginBottom = '15px';
        alertElement.style.borderRadius = '5px';
        
        alertElement.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: var(--${alert.severity}-color);">${alert.type} #${alert.id}</strong>
                <span style="font-size: 0.8rem; color: #888;">${alert.time}</span>
            </div>
            <div style="margin-top: 5px;">${alert.content}</div>
            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span class="status-badge status-badge-suspended">待处理</span>
                <button class="btn btn-sm btn-outline alert-details-btn" data-alert-id="${alert.id}" data-alert-type="${alert.type}" data-alert-content="${alert.content}" data-alert-time="${alert.time}" data-alert-severity="${alert.severity}">查看详情</button>
            </div>
        `;
        
        // 为新添加的按钮添加事件监听
        const detailsBtn = alertElement.querySelector('.alert-details-btn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', function() {
                showAlertDetails(this.dataset);
            });
        }
        
        // 插入到容器的最前面
        alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
    }
    
    // 为现有的查看详情按钮添加事件监听
    const existingDetailsBtns = document.querySelectorAll('#alerts-container .btn');
    existingDetailsBtns.forEach(btn => {
        // 为现有按钮添加必要的数据属性
        const alertItem = btn.closest('.alert-item');
        const alertType = alertItem.querySelector('strong').textContent.split(' #')[0];
        const alertId = alertItem.querySelector('strong').textContent.match(/#([A-Z0-9]+)/)[1];
        const alertContent = alertItem.querySelector('div:nth-child(2)').textContent;
        const alertTime = alertItem.querySelector('span').textContent;
        const alertSeverity = alertItem.style.borderLeft.includes('danger') ? 'danger' : 'warning';
        
        btn.setAttribute('data-alert-id', alertId);
        btn.setAttribute('data-alert-type', alertType);
        btn.setAttribute('data-alert-content', alertContent);
        btn.setAttribute('data-alert-time', alertTime);
        btn.setAttribute('data-alert-severity', alertSeverity);
        
        btn.classList.add('alert-details-btn');
        btn.addEventListener('click', function() {
            showAlertDetails(this.dataset);
        });
    });
    
    // 刷新按钮事件
    const refreshAlertsBtn = document.getElementById('refresh-alerts-btn');
    if (refreshAlertsBtn) {
        refreshAlertsBtn.addEventListener('click', function() {
            // 生成新警报
            const newAlert = generateRandomAlert();
            addAlertToUI(newAlert);
        });
    }
}

/**
 * 显示警报详情
 */
function showAlertDetails(alertData) {
    // 检查是否已有警报详情模态框，如果没有则创建
    let alertDetailsModal = document.getElementById('alert-details-modal');
    
    if (!alertDetailsModal) {
        // 创建模态框
        alertDetailsModal = document.createElement('div');
        alertDetailsModal.id = 'alert-details-modal';
        alertDetailsModal.style.display = 'none';
        alertDetailsModal.style.position = 'fixed';
        alertDetailsModal.style.top = '0';
        alertDetailsModal.style.left = '0';
        alertDetailsModal.style.width = '100%';
        alertDetailsModal.style.height = '100%';
        alertDetailsModal.style.background = 'rgba(0,0,0,0.5)';
        alertDetailsModal.style.zIndex = '100';
        alertDetailsModal.style.alignItems = 'center';
        alertDetailsModal.style.justifyContent = 'center';
        
        // 创建模态框内容
        const modalContent = document.createElement('div');
        modalContent.style.background = 'white';
        modalContent.style.width = '80%';
        modalContent.style.maxWidth = '600px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.padding = '20px';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';
        
        // 模态框标题和关闭按钮
        const modalHeader = document.createElement('div');
        modalHeader.style.display = 'flex';
        modalHeader.style.justifyContent = 'space-between';
        modalHeader.style.marginBottom = '20px';
        
        const modalTitle = document.createElement('h2');
        modalTitle.id = 'alert-modal-title';
        
        const closeButton = document.createElement('button');
        closeButton.id = 'close-alert-modal';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '1.5rem';
        closeButton.style.cursor = 'pointer';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', function() {
            alertDetailsModal.style.display = 'none';
        });
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        
        // 详情内容区域
        const detailsContent = document.createElement('div');
        detailsContent.id = 'alert-details-content';
        
        // 操作按钮区域
        const actionsArea = document.createElement('div');
        actionsArea.style.marginTop = '20px';
        actionsArea.style.display = 'flex';
        actionsArea.style.justifyContent = 'space-between';
        
        const statusSelect = document.createElement('select');
        statusSelect.id = 'alert-status-select';
        statusSelect.style.padding = '5px';
        statusSelect.style.borderRadius = '5px';
        
        const pendingOption = document.createElement('option');
        pendingOption.value = 'pending';
        pendingOption.textContent = '待处理';
        
        const processingOption = document.createElement('option');
        processingOption.value = 'processing';
        processingOption.textContent = '处理中';
        
        const resolvedOption = document.createElement('option');
        resolvedOption.value = 'resolved';
        resolvedOption.textContent = '已解决';
        
        statusSelect.appendChild(pendingOption);
        statusSelect.appendChild(processingOption);
        statusSelect.appendChild(resolvedOption);
        
        const buttonsContainer = document.createElement('div');
        
        const handleButton = document.createElement('button');
        handleButton.id = 'handle-alert-btn';
        handleButton.className = 'btn btn-primary';
        handleButton.textContent = '处理警报';
        handleButton.addEventListener('click', function() {
            // 更新警报状态的逻辑
            const statusValue = statusSelect.value;
            const alertId = alertDetailsModal.getAttribute('data-alert-id');
            
            // 找到对应的警报项并更新状态
            const alertItem = document.querySelector(`.alert-item strong:contains('#${alertId}')`).closest('.alert-item');
            if (alertItem) {
                const statusBadge = alertItem.querySelector('.status-badge');
                if (statusBadge) {
                    if (statusValue === 'resolved') {
                        statusBadge.textContent = '已解决';
                        statusBadge.className = 'status-badge status-badge-active';
                    } else if (statusValue === 'processing') {
                        statusBadge.textContent = '处理中';
                        statusBadge.className = 'status-badge status-badge-pending';
                    } else {
                        statusBadge.textContent = '待处理';
                        statusBadge.className = 'status-badge status-badge-suspended';
                    }
                }
            }
            
            // 关闭模态框
            alertDetailsModal.style.display = 'none';
        });
        
        const closeButton2 = document.createElement('button');
        closeButton2.className = 'btn btn-outline';
        closeButton2.textContent = '关闭';
        closeButton2.addEventListener('click', function() {
            alertDetailsModal.style.display = 'none';
        });
        
        buttonsContainer.appendChild(handleButton);
        buttonsContainer.appendChild(document.createTextNode(' ')); // 添加空格
        buttonsContainer.appendChild(closeButton2);
        
        actionsArea.appendChild(statusSelect);
        actionsArea.appendChild(buttonsContainer);
        
        // 组装模态框
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(detailsContent);
        modalContent.appendChild(actionsArea);
        alertDetailsModal.appendChild(modalContent);
        
        // 添加到文档中
        document.body.appendChild(alertDetailsModal);
    }
    
    // 更新模态框内容
    document.getElementById('alert-modal-title').textContent = `警报详情 - ${alertData.alertType} #${alertData.alertId}`;
    
    // 存储警报ID用于后续更新
    alertDetailsModal.setAttribute('data-alert-id', alertData.alertId);
    
    // 准备详情内容
    const severityClass = alertData.alertSeverity === 'danger' ? 'danger' : 'warning';
    const severityText = alertData.alertSeverity === 'danger' ? '严重' : '警告';
    
    // 生成详情HTML
    const detailsHTML = `
        <div style="margin-bottom: 15px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: var(--${severityClass}-color); margin-right: 8px;"></div>
                <span style="font-weight: bold; color: var(--${severityClass}-color);">${severityText}级别</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>警报ID:</strong> ${alertData.alertId}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>警报类型:</strong> ${alertData.alertType}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>发生时间:</strong> ${alertData.alertTime}
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h3 style="font-size: 1rem; margin-bottom: 10px;">警报内容</h3>
            <div style="padding: 10px; background: rgba(0,0,0,0.02); border-radius: 5px;">
                ${alertData.alertContent}
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h3 style="font-size: 1rem; margin-bottom: 10px;">详细诊断</h3>
            <div style="padding: 10px; background: rgba(0,0,0,0.02); border-radius: 5px;">
                <p>警报触发原因: ${getRandomTriggerReason(alertData.alertType)}</p>
                <p>系统建议: ${getRandomSystemSuggestion(alertData.alertType)}</p>
                <p>影响范围: ${getRandomImpactScope()}</p>
                <p>可能导致的问题: ${getRandomPotentialIssues(alertData.alertType)}</p>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <h3 style="font-size: 1rem; margin-bottom: 10px;">处理记录</h3>
            <div style="padding: 10px; background: rgba(0,0,0,0.02); border-radius: 5px; font-style: italic; color: #888;">
                暂无处理记录
            </div>
        </div>
    `;
    
    // 更新详情内容
    document.getElementById('alert-details-content').innerHTML = detailsHTML;
    
    // 显示模态框
    alertDetailsModal.style.display = 'flex';
}

/**
 * 获取随机触发原因
 */
function getRandomTriggerReason(alertType) {
    const reasons = {
        '节点异常': [
            '网络连接中断导致节点无法正常通信',
            '节点服务器硬件故障',
            '节点磁盘空间已满',
            '节点软件版本不兼容导致连接失败'
        ],
        '交易延迟': [
            '系统负载过高导致处理能力下降',
            '网络拥塞影响数据传输',
            '共识节点数量不足导致确认延迟',
            '某节点处理效率低下影响整体性能'
        ],
        '存储空间不足': [
            '系统日志过大占用空间',
            '数据存储增长速度超过预期',
            '临时文件未及时清理',
            '备份数据占用过多空间'
        ],
        '安全警告': [
            '检测到异常IP多次尝试访问敏感接口',
            '用户账户短时间内多次登录失败',
            '检测到非常规操作流程',
            '系统关键文件被修改'
        ],
        '共识异常': [
            '部分节点数据不一致导致共识失败',
            '网络分区导致节点间通信中断',
            '某节点响应超时影响共识过程',
            '恶意节点尝试提交无效数据'
        ],
        '系统性能下降': [
            '数据库查询效率降低',
            '系统资源占用过高',
            '并发请求数量激增',
            '网络带宽受限'
        ]
    };
    
    // 如果找不到对应类型的原因，返回通用原因
    const typeReasons = reasons[alertType] || [
        '系统检测到异常行为',
        '性能指标超出正常范围',
        '系统组件响应异常',
        '网络或硬件资源受限'
    ];
    
    return typeReasons[Math.floor(Math.random() * typeReasons.length)];
}

/**
 * 获取随机系统建议
 */
function getRandomSystemSuggestion(alertType) {
    const suggestions = {
        '节点异常': [
            '检查节点服务器网络连接状态',
            '重启节点服务并检查日志',
            '联系节点管理员确认服务器状态',
            '尝试手动同步节点数据'
        ],
        '交易延迟': [
            '检查系统资源使用情况并优化',
            '临时增加处理节点数量',
            '调整交易批处理参数',
            '检查并优化数据库索引'
        ],
        '存储空间不足': [
            '清理过期日志和临时文件',
            '增加存储空间',
            '优化数据存储策略',
            '检查并删除冗余数据'
        ],
        '安全警告': [
            '暂时封锁可疑IP地址',
            '检查系统日志寻找异常访问模式',
            '强制重置受影响用户密码',
            '更新安全规则和防火墙配置'
        ],
        '共识异常': [
            '检查所有节点的区块数据一致性',
            '重新同步出现问题的节点',
            '暂时排除问题节点直到修复完成',
            '检查网络连接质量'
        ],
        '系统性能下降': [
            '优化数据库查询语句',
            '增加系统资源配置',
            '实施流量控制措施',
            '检查并修复内存泄漏问题'
        ]
    };
    
    // 如果找不到对应类型的建议，返回通用建议
    const typeSuggestions = suggestions[alertType] || [
        '检查系统日志获取详细错误信息',
        '联系系统维护人员进行排查',
        '重启相关服务组件',
        '监控系统指标变化趋势'
    ];
    
    return typeSuggestions[Math.floor(Math.random() * typeSuggestions.length)];
}

/**
 * 获取随机影响范围
 */
function getRandomImpactScope() {
    const scopes = [
        '仅影响单个节点，系统整体运行正常',
        '影响特定类型的所有节点，系统核心功能正常',
        '影响系统部分功能，用户可能会感知到延迟',
        '影响系统多个关键组件，用户体验受到明显影响',
        '全系统范围影响，部分功能暂时不可用'
    ];
    
    return scopes[Math.floor(Math.random() * scopes.length)];
}

/**
 * 获取随机潜在问题
 */
function getRandomPotentialIssues(alertType) {
    const issues = {
        '节点异常': [
            '如不及时处理，可能导致该节点数据丢失',
            '长时间离线可能影响网络整体稳定性',
            '节点重连后需要较长时间同步数据',
            '可能影响依赖该节点的证书验证功能'
        ],
        '交易延迟': [
            '用户操作响应时间延长，影响使用体验',
            '高峰时段可能出现交易堆积',
            '部分实时性要求高的功能可能受影响',
            '长时间延迟可能导致部分交易超时'
        ],
        '存储空间不足': [
            '系统可能无法存储新数据',
            '数据库性能下降影响查询效率',
            '备份功能可能无法正常执行',
            '系统日志可能无法完整记录'
        ],
        '安全警告': [
            '系统数据安全可能受到威胁',
            '用户隐私信息可能泄露风险',
            '非授权操作可能篡改系统数据',
            '系统服务可能被恶意中断'
        ],
        '共识异常': [
            '可能导致区块链分叉',
            '交易确认延迟或失败',
            '数据一致性受损',
            '需要人工干预解决冲突'
        ],
        '系统性能下降': [
            '用户请求处理时间延长',
            '高并发场景可能出现请求失败',
            '后台任务执行效率降低',
            '系统响应超时增加'
        ]
    };
    
    // 如果找不到对应类型的问题，返回通用问题
    const typeIssues = issues[alertType] || [
        '系统稳定性可能受到影响',
        '用户体验可能下降',
        '数据处理可能出现延迟',
        '系统资源消耗可能增加'
    ];
    
    return typeIssues[Math.floor(Math.random() * typeIssues.length)];
}

/**
 * 扩展document.querySelector以支持包含文本内容的选择器
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!document.querySelectorAll.contains) {
    document.querySelectorAll.contains = function(selector) {
        const elements = document.querySelectorAll(selector.split(':contains(')[0]);
        const contains = selector.split(':contains(')[1].split(')')[0];
        return Array.from(elements).filter(element => element.textContent.includes(contains));
    };
}

/**
 * 初始化申诉处理功能
 */
function initAppealSystem() {
    // 申诉数据
    const appeals = [
        {
            id: 'APP001',
            type: '学历信息异议',
            status: 'pending',
            appellant: '李明',
            studentId: '20180101',
            submitTime: '2023-10-30 14:20:00',
            content: '我的毕业证书信息有误，专业名称显示为"计算机科学"，但实际应为"计算机科学与技术"。'
        },
        {
            id: 'APP002',
            type: '证书丢失补办',
            status: 'pending',
            appellant: '张华',
            studentId: '20150234',
            submitTime: '2023-10-29 09:45:00',
            content: '由于个人原因，我的毕业证书原件遗失，需要申请电子版证书重新下载权限。'
        }
    ];
    
    // 申诉筛选功能
    const appealStatusFilter = document.getElementById('appeal-status-filter');
    if (appealStatusFilter) {
        appealStatusFilter.addEventListener('change', function() {
            filterAppeals();
        });
    }
    
    // 筛选申诉
    function filterAppeals() {
        const statusValue = appealStatusFilter.value;
        const appealItems = document.querySelectorAll('.appeal-item');
        
        appealItems.forEach(item => {
            const statusBadge = item.querySelector('.status-badge');
            const status = statusBadge.textContent.toLowerCase();
            
            if (statusValue === 'all' || status.includes(getStatusText(statusValue))) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // 获取状态文本
    function getStatusText(status) {
        const statusMap = {
            'pending': '待处理',
            'processing': '处理中',
            'resolved': '已解决',
            'rejected': '已拒绝'
        };
        
        return statusMap[status] || status;
    }
    
    // 处理申诉按钮
    const processAppealBtns = document.querySelectorAll('.process-appeal-btn');
    processAppealBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const appealItem = this.closest('.appeal-item');
            const appealId = appealItem.querySelector('strong').textContent.match(/#([A-Z0-9]+)/)[1];
            
            // 获取申诉人信息
            let appellant = '';
            let studentId = '';
            let submitTime = '';
            
            // 使用data属性找到信息
            const spans = appealItem.querySelectorAll('span');
            spans.forEach(span => {
                if (span.textContent.includes('申诉人:')) {
                    appellant = span.nextSibling.textContent.trim();
                } else if (span.textContent.includes('学号:')) {
                    studentId = span.nextSibling.textContent.trim();
                } else if (span.textContent.includes('提交时间:')) {
                    submitTime = span.nextSibling.textContent.trim();
                }
            });
            
            const content = appealItem.querySelector('p').textContent;
            
            showAppealProcessForm(appealId, appellant, studentId, submitTime, content);
        });
    });
    
    // 显示申诉处理表单
    function showAppealProcessForm(id, appellant, studentId, submitTime, content) {
        const modal = document.getElementById('process-appeal-modal');
        const appealTitle = document.getElementById('appeal-title');
        const appealDetails = document.getElementById('appeal-details');
        
        // 设置标题
        appealTitle.textContent = `处理申诉 #${id}`;
        
        // 生成申诉详情HTML
        const detailsHTML = `
            <div style="margin-bottom: 10px;">
                <strong>申诉人:</strong> ${appellant}
                <strong style="margin-left: 20px;">学号:</strong> ${studentId}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>提交时间:</strong> ${submitTime}
                <strong style="margin-left: 20px;">状态:</strong> 待处理
            </div>
            <div style="margin-top: 15px;">
                <strong>申诉内容:</strong>
                <p style="margin-top: 5px;">${content}</p>
            </div>
        `;
        
        // 更新申诉详情
        appealDetails.innerHTML = detailsHTML;
        
        // 显示模态框
        modal.style.display = 'flex';
    }
    
    // 关闭申诉处理模态框
    const closeAppealModalBtn = document.getElementById('close-appeal-modal');
    const cancelProcessAppealBtn = document.getElementById('cancel-process-appeal');
    
    if (closeAppealModalBtn) {
        closeAppealModalBtn.addEventListener('click', function() {
            document.getElementById('process-appeal-modal').style.display = 'none';
        });
    }
    
    if (cancelProcessAppealBtn) {
        cancelProcessAppealBtn.addEventListener('click', function() {
            document.getElementById('process-appeal-modal').style.display = 'none';
        });
    }
    
    // 申诉处理表单提交
    const processAppealForm = document.getElementById('process-appeal-form');
    
    if (processAppealForm) {
        processAppealForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const resultSelect = document.getElementById('appeal-result');
            const notesTextarea = document.getElementById('appeal-notes');
            
            const result = resultSelect.value;
            const notes = notesTextarea.value;
            
            if (!result || !notes) {
                alert('请填写完整的处理信息');
                return;
            }
            
            // 处理申诉逻辑
            alert('申诉处理成功');
            
            // 关闭模态框
            document.getElementById('process-appeal-modal').style.display = 'none';
            
            // 更新申诉状态 (在实际应用中会与后端API交互)
            const appealId = document.getElementById('appeal-title').textContent.match(/#([A-Z0-9]+)/)[1];
            updateAppealStatus(appealId, result);
        });
    }
    
    // 更新申诉状态
    function updateAppealStatus(appealId, result) {
        // 查找申诉项
        const appealItems = document.querySelectorAll('.appeal-item');
        
        appealItems.forEach(item => {
            const itemId = item.querySelector('strong').textContent.match(/#([A-Z0-9]+)/)[1];
            
            if (itemId === appealId) {
                const statusBadge = item.querySelector('.status-badge');
                
                // 根据处理结果更新状态
                switch (result) {
                    case 'approve':
                        statusBadge.textContent = '已解决';
                        statusBadge.className = 'status-badge status-badge-active';
                        break;
                    case 'reject':
                        statusBadge.textContent = '已拒绝';
                        statusBadge.className = 'status-badge status-badge-suspended';
                        break;
                    case 'needmore':
                        statusBadge.textContent = '处理中';
                        statusBadge.className = 'status-badge status-badge-pending';
                        break;
                }
            }
        });
    }
} 