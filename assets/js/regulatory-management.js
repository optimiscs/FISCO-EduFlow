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
                <button class="btn btn-sm btn-outline alert-details-btn">查看详情</button>
            </div>
        `;
        
        // 插入到容器的最前面
        alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
        
        // 为新添加的按钮绑定事件
        const detailBtn = alertElement.querySelector('.alert-details-btn');
        if (detailBtn) {
            detailBtn.addEventListener('click', function() {
                showAlertDetails(alert);
            });
        }
    }
    
    // 显示警报详情
    function showAlertDetails(alert) {
        // 创建模态框，如果不存在
        let alertModal = document.getElementById('alert-details-modal');
        if (!alertModal) {
            alertModal = document.createElement('div');
            alertModal.id = 'alert-details-modal';
            alertModal.style.display = 'none';
            alertModal.style.position = 'fixed';
            alertModal.style.top = '0';
            alertModal.style.left = '0';
            alertModal.style.width = '100%';
            alertModal.style.height = '100%';
            alertModal.style.background = 'rgba(0,0,0,0.5)';
            alertModal.style.zIndex = '100';
            alertModal.style.alignItems = 'center';
            alertModal.style.justifyContent = 'center';
            
            const modalContent = `
                <div style="background: white; width: 80%; max-width: 600px; border-radius: 10px; padding: 20px; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <h2 id="modal-alert-title">警报详情</h2>
                        <button id="close-alert-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <div id="alert-details-content">
                        <!-- 警报详情内容会通过JS动态生成 -->
                    </div>
                    <div style="margin-top: 20px; display: flex; justify-content: space-between;">
                        <div>
                            <button class="btn btn-primary" id="resolve-alert-btn">标记为已解决</button>
                        </div>
                        <div>
                            <button class="btn btn-outline" id="close-alert-details-btn">关闭</button>
                        </div>
                    </div>
                </div>
            `;
            
            alertModal.innerHTML = modalContent;
            document.body.appendChild(alertModal);
            
            // 绑定关闭按钮事件
            const closeModalBtn = document.getElementById('close-alert-modal');
            const closeDetailsBtn = document.getElementById('close-alert-details-btn');
            
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', function() {
                    document.getElementById('alert-details-modal').style.display = 'none';
                });
            }
            
            if (closeDetailsBtn) {
                closeDetailsBtn.addEventListener('click', function() {
                    document.getElementById('alert-details-modal').style.display = 'none';
                });
            }
            
            // 绑定解决按钮事件
            const resolveBtn = document.getElementById('resolve-alert-btn');
            if (resolveBtn) {
                resolveBtn.addEventListener('click', function() {
                    const alertId = document.getElementById('modal-alert-title').getAttribute('data-alert-id');
                    resolveAlert(alertId);
                    document.getElementById('alert-details-modal').style.display = 'none';
                });
            }
        }
        
        // 设置警报详情内容
        const alertTitle = document.getElementById('modal-alert-title');
        const alertContent = document.getElementById('alert-details-content');
        
        // 设置标题和ID属性
        alertTitle.textContent = `警报详情 - ${alert.type} #${alert.id}`;
        alertTitle.setAttribute('data-alert-id', alert.id);
        
        // 获取随机的相关信息
        const relatedEvents = generateRelatedEvents(alert);
        const suggestedActions = generateSuggestedActions(alert);
        
        // 生成详情内容HTML
        const detailsHTML = `
            <div style="padding: 15px; background: ${alert.severity === 'danger' ? 'rgba(255, 82, 82, 0.05)' : 'rgba(255, 152, 0, 0.05)'}; border-radius: 5px; margin-bottom: 15px;">
                <div style="margin-bottom: 10px;">
                    <strong>警报ID:</strong> ${alert.id}
                    <strong style="margin-left: 20px;">严重程度:</strong> 
                    <span style="color: var(--${alert.severity}-color);">
                        ${alert.severity === 'danger' ? '严重' : '警告'}
                    </span>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>时间:</strong> ${alert.time}
                    <strong style="margin-left: 20px;">状态:</strong> 待处理
                </div>
                <div style="margin-top: 10px;">
                    <strong>内容:</strong>
                    <p style="margin-top: 5px;">${alert.content}</p>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 10px; font-size: 1rem;">相关事件</h3>
                <ul style="padding-left: 20px;">
                    ${relatedEvents.map(event => `<li style="margin-bottom: 5px;">${event}</li>`).join('')}
                </ul>
            </div>
            
            <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 10px; font-size: 1rem;">建议操作</h3>
                <ol style="padding-left: 20px;">
                    ${suggestedActions.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join('')}
                </ol>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.02); border-radius: 5px;">
                <h3 style="margin-bottom: 10px; font-size: 1rem;">影响分析</h3>
                <p>${generateImpactAnalysis(alert)}</p>
            </div>
        `;
        
        // 更新详情内容
        alertContent.innerHTML = detailsHTML;
        
        // 显示模态框
        alertModal.style.display = 'flex';
    }
    
    // 生成相关事件
    function generateRelatedEvents(alert) {
        const events = [
            `系统在${formatTimeDiff(Math.floor(Math.random() * 60) + 10)}前检测到性能下降`,
            `${getRandomNodeId()}在${formatTimeDiff(Math.floor(Math.random() * 120) + 30)}前报告连接问题`,
            `在警报发生前${Math.floor(Math.random() * 5) + 1}分钟有${Math.floor(Math.random() * 10) + 1}次失败的认证尝试`,
            `系统日志记录了${Math.floor(Math.random() * 3) + 1}个相关错误`,
            `${Math.floor(Math.random() * 50) + 10}个交易在警报发生时处于挂起状态`
        ];
        
        // 随机选择2-3个事件
        const count = Math.floor(Math.random() * 2) + 2;
        const selectedEvents = [];
        
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * events.length);
            selectedEvents.push(events[randomIndex]);
            events.splice(randomIndex, 1);
        }
        
        return selectedEvents;
    }
    
    // 随机获取节点ID
    function getRandomNodeId() {
        return `NODE00${Math.floor(Math.random() * 5) + 1}`;
    }
    
    // 格式化时间差
    function formatTimeDiff(minutes) {
        if (minutes < 60) {
            return `${minutes}分钟`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
        }
    }
    
    // 生成建议操作
    function generateSuggestedActions(alert) {
        const commonActions = [
            '查看相关节点的日志文件',
            '通知系统管理员',
            '检查网络连接状态'
        ];
        
        let specificActions = [];
        
        // 根据警报类型生成特定建议
        switch (alert.type) {
            case '节点异常':
                specificActions = [
                    '检查节点服务器硬件状态',
                    '重启节点服务',
                    '验证节点配置是否正确'
                ];
                break;
            case '交易延迟':
                specificActions = [
                    '检查系统负载情况',
                    '分析当前交易队列',
                    '暂时减少新交易的接入'
                ];
                break;
            case '存储空间不足':
                specificActions = [
                    '清理过期的日志文件',
                    '增加存储空间',
                    '优化数据存储策略'
                ];
                break;
            case '安全警告':
                specificActions = [
                    '立即锁定相关账户',
                    '检查访问日志',
                    '更新防火墙规则'
                ];
                break;
            case '共识异常':
                specificActions = [
                    '检查所有节点状态',
                    '分析区块数据',
                    '协调各节点重新同步'
                ];
                break;
            default:
                specificActions = [
                    '检查系统资源使用情况',
                    '优化系统配置',
                    '考虑增加系统资源'
                ];
        }
        
        // 随机组合通用操作和特定操作
        const actions = [...specificActions];
        const randomCommonAction = commonActions[Math.floor(Math.random() * commonActions.length)];
        actions.push(randomCommonAction);
        
        // 随机排序
        return actions.sort(() => Math.random() - 0.5);
    }
    
    // 生成影响分析
    function generateImpactAnalysis(alert) {
        const impacts = {
            '节点异常': '此节点异常可能导致部分校方用户无法访问系统或上传数据。如果持续时间超过30分钟，将影响学历证书的及时上链和验证。建议尽快恢复节点连接，以避免数据同步延迟。',
            '交易延迟': '交易延迟会导致新证书上链时间延长，影响用户体验。如果延迟持续增加，可能会造成交易队列拥堵，进一步降低系统性能。建议检查网络连接和共识机制是否正常运行。',
            '存储空间不足': '存储空间不足将影响节点存储新的区块数据，长期可能导致节点无法参与共识，影响整个网络的性能和安全性。建议及时扩容或优化存储空间。',
            '安全警告': '检测到的可疑操作可能是攻击者试图访问系统敏感数据或干扰系统运行。此类威胁可能会损害数据完整性和系统可用性，需要立即应对以防止潜在的安全事件。',
            '共识异常': '共识异常可能导致区块链分叉，影响数据一致性。若不及时解决，可能导致不同节点间数据不一致，严重破坏区块链的可信性。建议立即协调各节点进行数据同步和问题排查。',
            '系统性能下降': '系统性能下降会导致用户操作响应时间延长，影响整体用户体验。长期存在可能指示系统资源不足或存在优化空间。建议分析性能瓶颈并进行相应调整。'
        };
        
        return impacts[alert.type] || '此警报可能影响系统的正常运行，建议及时处理以避免潜在的服务中断或数据问题。';
    }
    
    // 标记警报为已解决
    function resolveAlert(alertId) {
        const alertItems = document.querySelectorAll('.alert-item');
        
        alertItems.forEach(item => {
            const idMatch = item.querySelector('strong').textContent.match(/#([A-Z0-9]+)/);
            if (idMatch && idMatch[1] === alertId) {
                const statusBadge = item.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = '已解决';
                    statusBadge.className = 'status-badge status-badge-active';
                }
            }
        });
        
        // 显示成功消息
        showMessage('警报已成功标记为已解决', 'success');
    }
    
    // 显示消息提示
    function showMessage(message, type = 'info') {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = 'message-toast';
        messageElement.style.position = 'fixed';
        messageElement.style.bottom = '20px';
        messageElement.style.right = '20px';
        messageElement.style.padding = '10px 15px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        messageElement.style.zIndex = '1000';
        messageElement.style.minWidth = '200px';
        messageElement.style.display = 'flex';
        messageElement.style.alignItems = 'center';
        messageElement.style.justifyContent = 'space-between';
        
        // 设置样式基于类型
        if (type === 'success') {
            messageElement.style.backgroundColor = '#e7f7ee';
            messageElement.style.borderLeft = '4px solid var(--success-color)';
            messageElement.style.color = '#2a805b';
        } else if (type === 'error') {
            messageElement.style.backgroundColor = '#fdf2f2';
            messageElement.style.borderLeft = '4px solid var(--danger-color)';
            messageElement.style.color = '#c73636';
        } else {
            messageElement.style.backgroundColor = '#f0f7ff';
            messageElement.style.borderLeft = '4px solid var(--primary-color)';
            messageElement.style.color = '#2b679b';
        }
        
        // 设置内容
        messageElement.innerHTML = `
            <span>${message}</span>
            <button style="background: none; border: none; cursor: pointer; font-size: 1.2rem; margin-left: 10px;">&times;</button>
        `;
        
        // 添加到文档
        document.body.appendChild(messageElement);
        
        // 绑定关闭按钮事件
        const closeBtn = messageElement.querySelector('button');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(messageElement);
            });
        }
        
        // 自动关闭
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                document.body.removeChild(messageElement);
            }
        }, 3000);
    }
    
    // 为现有警报绑定详情按钮事件
    function bindExistingAlertEvents() {
        const detailButtons = document.querySelectorAll('.alert-item .btn-outline');
        detailButtons.forEach(btn => {
            btn.classList.add('alert-details-btn'); // 添加类名以便识别
            btn.addEventListener('click', function() {
                const alertItem = this.closest('.alert-item');
                const alertTypeEl = alertItem.querySelector('strong');
                const alertTimeEl = alertItem.querySelector('span');
                const alertContentEl = alertItem.querySelectorAll('div')[1];
                
                if (alertTypeEl && alertTimeEl && alertContentEl) {
                    const alertTypeFull = alertTypeEl.textContent;
                    const match = alertTypeFull.match(/^(.+) #(ALT\d+)$/);
                    
                    if (match) {
                        const alertObj = {
                            id: match[2],
                            type: match[1],
                            severity: alertTypeEl.style.color.includes('danger') ? 'danger' : 'warning',
                            content: alertContentEl.textContent,
                            time: alertTimeEl.textContent
                        };
                        
                        showAlertDetails(alertObj);
                    }
                }
            });
        });
    }
    
    // 绑定现有警报详情按钮事件
    bindExistingAlertEvents();
    
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