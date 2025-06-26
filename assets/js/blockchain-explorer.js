document.addEventListener('DOMContentLoaded', function() {
    // 选项卡切换
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 实现数字动画效果的函数
    function animateValue(element, start, end, duration) {
        if (!element) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // 动态更新统计数据
    function updateBlockchainStats() {
        const blockHeight = document.querySelector('.summary-stats .stat-item:first-child .stat-value');
        const tpsElement = document.querySelector('.summary-stats .stat-item:nth-child(2) .stat-value');
        const nodeCount = document.querySelector('.summary-stats .stat-item:nth-child(3) .stat-value');
        const txCount = document.querySelector('.summary-stats .stat-item:last-child .stat-value');
        
        if (blockHeight && txCount) {
            // 当前区块高度
            let height = parseInt(blockHeight.textContent.replace(/,/g, ''));
            // 当前交易数
            let txs = parseInt(txCount.textContent.replace(/,/g, ''));
            
            // 随机增加区块高度 (1-3)
            const newBlocks = Math.floor(Math.random() * 3) + 1;
            const newHeight = height + newBlocks;
            
            // 随机增加交易数 (10-50)
            const newTxs = Math.floor(Math.random() * 40) + 10;
            const newTxCount = txs + newTxs;
            
            // 使用动画效果更新显示
            animateValue(blockHeight, height, newHeight, 800);
            animateValue(txCount, txs, newTxCount, 800);
            
            // 更新TPS (模拟随机波动)
            if(tpsElement) {
                const currentTPS = parseFloat(tpsElement.textContent);
                const newTPS = (Math.random() * 5 - 2 + currentTPS).toFixed(1);
                tpsElement.textContent = newTPS + " TPS";
            }
            
            // 偶尔更新节点数量
            if(nodeCount && Math.random() > 0.8) {
                const currentNodes = parseInt(nodeCount.textContent);
                const newNodes = Math.random() > 0.5 ? currentNodes + 1 : Math.max(20, currentNodes - 1);
                animateValue(nodeCount, currentNodes, newNodes, 500);
            }
            
            // 更新区块表格
            updateBlocksTable(newHeight);
            
            // 更新交易表格
            updateTransactionsTable();
        }
    }
    
    // 更新区块表格
    function updateBlocksTable(latestBlock) {
        const blockTables = document.querySelectorAll('.card-title');
        let blockTableBody = null;
        
        blockTables.forEach(title => {
            if (title.textContent.trim() === '最新区块') {
                blockTableBody = title.closest('.card').querySelector('tbody');
            }
        });
        
        if (blockTableBody) {
            // 获取当前表格中的第一个区块高度
            const firstRow = blockTableBody.querySelector('tr');
            if (!firstRow) return;
            
            const firstBlockHeight = parseInt(firstRow.cells[0].textContent.replace(/,/g, ''));
            
            // 如果有新区块
            if (latestBlock > firstBlockHeight) {
                // 创建新行并添加到表格顶部
                for (let i = firstBlockHeight + 1; i <= latestBlock; i++) {
                    const txCount = Math.floor(Math.random() * 30) + 5;
                    const hash = generateRandomHash();
                    
                    // 创建行元素
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `
                        <td>${i.toLocaleString()}</td>
                        <td>刚刚</td>
                        <td>${txCount}</td>
                        <td><div class="hash-display">${hash}</div></td>
                    `;
                    
                    // 添加闪烁效果
                    newRow.classList.add('flash-animation');
                    
                    // 插入到表格顶部
                    blockTableBody.insertBefore(newRow, blockTableBody.firstChild);
                    
                    // 移除最后一行以保持表格大小
                    const allRows = blockTableBody.querySelectorAll('tr');
                    if (allRows.length > 5) {
                        blockTableBody.removeChild(allRows[allRows.length - 1]);
                    }
                }
                
                // 更新时间显示
                updateTimeDisplay();
            }
        }
    }
    
    // 更新交易表格
    function updateTransactionsTable() {
        const txTables = document.querySelectorAll('.card-title');
        let txTableBody = null;
        
        txTables.forEach(title => {
            if (title.textContent.trim() === '最新交易') {
                txTableBody = title.closest('.card').querySelector('tbody');
            }
        });
        
        if (txTableBody && Math.random() > 0.5) { // 随机生成新交易，不是每次都生成
            // 创建新行
            const newRow = document.createElement('tr');
            
            // 随机交易类型
            const txTypes = ['学历上链', '证书验证', '权限变更'];
            const txTypeClasses = ['badge-primary', 'badge-success', 'badge-warning'];
            const typeIndex = Math.floor(Math.random() * txTypes.length);
            
            const blockHeight = document.querySelector('.summary-stats .stat-item:first-child .stat-value');
            const currentBlock = blockHeight ? parseInt(blockHeight.textContent.replace(/,/g, '')) : 3785921;
            
            newRow.innerHTML = `
                <td>
                    <div class="hash-display">${generateRandomHash()}</div>
                </td>
                <td>${currentBlock.toLocaleString()}</td>
                <td>刚刚</td>
                <td><span class="badge ${txTypeClasses[typeIndex]}">${txTypes[typeIndex]}</span></td>
            `;
            
            // 添加闪烁效果
            newRow.classList.add('flash-animation');
            
            // 插入到表格顶部
            txTableBody.insertBefore(newRow, txTableBody.firstChild);
            
            // 移除最后一行以保持表格大小
            const allRows = txTableBody.querySelectorAll('tr');
            if (allRows.length > 5) {
                txTableBody.removeChild(allRows[allRows.length - 1]);
            }
        }
    }
    
    // 生成随机哈希
    function generateRandomHash() {
        const chars = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 8; i++) {
            hash += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return hash + '...';
    }
    
    // 更新时间显示
    function updateTimeDisplay() {
        const timeElements = document.querySelectorAll('.table td:nth-child(2), .table td:nth-child(3)');
        
        timeElements.forEach(el => {
            if (!el.textContent.includes('刚刚') && !el.textContent.includes('秒') && !el.textContent.includes('分钟')) return;
            
            const text = el.textContent;
            
            if (text.includes('刚刚')) {
                el.textContent = '5秒前';
            } else if (text.includes('秒')) {
                const seconds = parseInt(text);
                if (seconds < 55) {
                    el.textContent = (seconds + 5) + '秒前';
                } else {
                    el.textContent = '1分钟前';
                }
            } else if (text.includes('分钟')) {
                const minutes = parseInt(text);
                if (minutes < 59) {
                    el.textContent = (minutes + 1) + '分钟前';
                } else {
                    el.textContent = '1小时前';
                }
            }
        });
    }
    
    // 搜索功能
    function setupSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchButton = document.querySelector('.search-box .btn-primary');
        
        if (searchButton) {
            searchButton.addEventListener('click', function(e) {
                e.preventDefault();
                performSearch();
            });
        }
        
        // 添加按键事件，按下回车键也可以搜索
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch();
                }
            });
        }
        
        function performSearch() {
            const query = searchInput.value.trim();
            
            if (query) {
                // 创建搜索结果模态框
                showSearchResults(query);
            } else {
                alert('请输入搜索内容');
                searchInput.focus();
            }
        }
        
        function showSearchResults(query) {
            // 创建模态框显示搜索结果
            const modal = document.createElement('div');
            modal.className = 'search-modal';
            
            // 模拟搜索结果
            let resultContent = '';
            
            // 判断查询是否像区块高度
            if (/^\d+$/.test(query)) {
                resultContent = `
                    <div class="search-result-item">
                        <h3>区块 #${query}</h3>
                        <div class="result-details">
                            <div class="detail-row">
                                <span class="detail-label">区块哈希:</span>
                                <span class="detail-value hash-display">${generateRandomHash()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">生成时间:</span>
                                <span class="detail-value">2024-05-22 14:30:22</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">交易数量:</span>
                                <span class="detail-value">${Math.floor(Math.random() * 30) + 5}</span>
                            </div>
                        </div>
                    </div>
                `;
            } 
            // 判断查询是否像哈希值
            else if (/^0x[0-9a-f]{6,}$/i.test(query)) {
                const isBlock = Math.random() > 0.5;
                
                if (isBlock) {
                    resultContent = `
                        <div class="search-result-item">
                            <h3>区块哈希: ${query}</h3>
                            <div class="result-details">
                                <div class="detail-row">
                                    <span class="detail-label">区块高度:</span>
                                    <span class="detail-value">${Math.floor(Math.random() * 1000000) + 3000000}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">生成时间:</span>
                                    <span class="detail-value">2024-05-22 14:30:22</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">交易数量:</span>
                                    <span class="detail-value">${Math.floor(Math.random() * 30) + 5}</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    resultContent = `
                        <div class="search-result-item">
                            <h3>交易哈希: ${query}</h3>
                            <div class="result-details">
                                <div class="detail-row">
                                    <span class="detail-label">区块高度:</span>
                                    <span class="detail-value">${Math.floor(Math.random() * 1000000) + 3000000}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">交易时间:</span>
                                    <span class="detail-value">2024-05-22 14:30:22</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">交易类型:</span>
                                    <span class="detail-value"><span class="badge badge-primary">学历上链</span></span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else {
                resultContent = `
                    <div class="search-result-item">
                        <h3>未找到匹配结果</h3>
                        <p>没有找到与 "${query}" 相关的区块或交易信息</p>
                        <p>请尝试搜索:</p>
                        <ul>
                            <li>区块高度 (例如: 3785921)</li>
                            <li>交易哈希 (例如: 0xf12c8a4b...)</li>
                            <li>区块哈希 (例如: 0x8c4e8d57...)</li>
                        </ul>
                    </div>
                `;
            }
            
            const modalContent = document.createElement('div');
            modalContent.className = 'search-modal-content';
            
            modalContent.innerHTML = `
                <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.2rem;">搜索结果: ${query}</h2>
                    <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 20px;">
                    ${resultContent}
                </div>
                <div style="padding: 15px 20px; border-top: 1px solid var(--border-color); text-align: right;">
                    <button class="btn btn-outline close-modal">关闭</button>
                </div>
            `;
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // 添加关闭事件
            const closeButtons = modal.querySelectorAll('.close-modal');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
            });
        }
    }
    
    // 导出数据和报告生成功能
    function setupExportFeatures() {
        const exportButtons = document.querySelectorAll('.btn-outline');
        exportButtons.forEach(button => {
            if (button.textContent.includes('导出数据')) {
                button.addEventListener('click', function() {
                    exportChartData();
                });
            } else if (button.textContent.includes('生成报告')) {
                button.addEventListener('click', function() {
                    generateReportPDF();
                });
            }
        });
        
        // 导出数据功能
        function exportChartData() {
            // 创建一个伪数据
            const data = {
                labels: ['5/1', '5/2', '5/3', '5/4', '5/5', '5/6', '5/7'],
                datasets: [
                    {
                        label: '验证成功',
                        data: [256, 245, 290, 310, 280, 295, 320]
                    },
                    {
                        label: '验证总量',
                        data: [300, 290, 340, 360, 330, 350, 380]
                    }
                ]
            };
            
            // 转换为CSV格式
            let csv = 'date,验证成功,验证总量\n';
            for (let i = 0; i < data.labels.length; i++) {
                csv += `${data.labels[i]},${data.datasets[0].data[i]},${data.datasets[1].data[i]}\n`;
            }
            
            // 创建下载链接
            const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', '区块链数据统计.csv');
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 显示成功提示
            showToast('数据已成功导出为CSV文件');
        }
        
        // 生成报告功能
        function generateReportPDF() {
            // 显示加载中提示
            showToast('正在生成PDF报告，请稍候...');
            
            // 模拟报告生成过程
            setTimeout(() => {
                showToast('报告已生成，正在下载...');
                
                setTimeout(() => {
                    showToast('PDF报告已成功保存到您的下载文件夹');
                }, 1000);
            }, 2000);
        }
    }
    
    // 显示提示信息
    function showToast(message) {
        // 检查是否已存在提示框
        let toast = document.querySelector('.toast-message');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-message';
            document.body.appendChild(toast);
        }
        
        // 显示消息
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        
        // 延迟隐藏
        clearTimeout(toast.timeoutId);
        toast.timeoutId = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
        }, 3000);
    }
    
    // 刷新节点
    const refreshButtons = document.querySelectorAll('.btn-outline');
    refreshButtons.forEach(button => {
        if (button.textContent.includes('刷新')) {
            button.addEventListener('click', function() {
                updateNodeStatus();
                showToast('节点状态已刷新');
            });
        }
    });
    
    // 模拟节点状态定时更新
    function updateNodeStatus() {
        const nodeRows = document.querySelectorAll('.card-title');
        let nodeTableBody = null;
        
        nodeRows.forEach(title => {
            if (title.textContent.trim() === '节点状态') {
                nodeTableBody = title.closest('.card').querySelectorAll('tbody tr');
            }
        });
        
        if (!nodeTableBody || nodeTableBody.length === 0) return;
        
        nodeTableBody.forEach(row => {
            // 随机更新CPU和内存使用率
            const cpuBar = row.querySelector('td:nth-child(6) div div');
            const cpuText = row.querySelector('td:nth-child(6) span');
            const memBar = row.querySelector('td:nth-child(7) div div');
            const memText = row.querySelector('td:nth-child(7) span');
            
            if (cpuBar && cpuText) {
                let cpuValue = parseInt(cpuText.textContent);
                // 随机变化 -5% 到 +5%
                const cpuChange = Math.floor(Math.random() * 11) - 5;
                cpuValue = Math.max(5, Math.min(95, cpuValue + cpuChange));
                
                cpuBar.style.width = cpuValue + '%';
                cpuText.textContent = cpuValue + '%';
                
                // 根据使用率调整颜色
                if (cpuValue < 50) {
                    cpuBar.style.backgroundColor = 'var(--success-color)';
                } else if (cpuValue < 80) {
                    cpuBar.style.backgroundColor = 'var(--warning-color)';
                } else {
                    cpuBar.style.backgroundColor = 'var(--danger-color)';
                }
            }
            
            if (memBar && memText) {
                let memValue = parseInt(memText.textContent);
                // 随机变化 -3% 到 +3%
                const memChange = Math.floor(Math.random() * 7) - 3;
                memValue = Math.max(5, Math.min(95, memValue + memChange));
                
                memBar.style.width = memValue + '%';
                memText.textContent = memValue + '%';
                
                // 根据使用率调整颜色
                if (memValue < 50) {
                    memBar.style.backgroundColor = 'var(--success-color)';
                } else if (memValue < 80) {
                    memBar.style.backgroundColor = 'var(--warning-color)';
                } else {
                    memBar.style.backgroundColor = 'var(--danger-color)';
                }
            }
        });
    }
    
    // 初始化
    setupSearch();
    setupExportFeatures();
    
    // 立即更新一次
    updateBlockchainStats();
    
    // 定时更新区块链数据 (每5秒)
    setInterval(updateBlockchainStats, 5000);
    
    // 定时更新时间显示 (每3秒)
    setInterval(updateTimeDisplay, 3000);
    
    // 定时更新节点状态 (每30秒)
    setInterval(updateNodeStatus, 30000);
}); 