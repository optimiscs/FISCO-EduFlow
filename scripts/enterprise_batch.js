// 企业批量验证页面 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let uploadedFile = null;
    let batchData = [];
    let verificationResults = [];
    let isVerifying = false;

    // 初始化页面
    initializePage();

    function initializePage() {
        setupImportMethodHandlers();
        setupFileUploadHandlers();
        setupBatchVerificationHandler();
        setupTemplateDownloadHandlers();
        setupFormEventListeners();
    }
    
    // 设置表单事件监听器
    function setupFormEventListeners() {
        // 验证用途选择变化
        const purposeSelect = document.querySelector('.form-select');
        if (purposeSelect) {
            purposeSelect.addEventListener('change', function() {
                setTimeout(checkVerificationReadiness, 100);
            });
        }
        
        // 手动输入文本变化
        const textarea = document.querySelector('#manual-input-area textarea');
        if (textarea) {
            textarea.addEventListener('input', function() {
                setTimeout(checkVerificationReadiness, 300);
            });
        }
    }

    // 设置导入方式处理器
    function setupImportMethodHandlers() {
        const importMethodRadios = document.querySelectorAll('input[name="import-method"]');
        const fileUploadArea = document.getElementById('file-upload-area');
        const manualInputArea = document.getElementById('manual-input-area');

        importMethodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'manual') {
                    fileUploadArea.style.display = 'none';
                    manualInputArea.style.display = 'block';
                } else {
                    fileUploadArea.style.display = 'block';
                    manualInputArea.style.display = 'none';
                }
                resetImportState();
            });
        });
    }

    // 设置文件上传处理器
    function setupFileUploadHandlers() {
        const fileUploadArea = document.querySelector('#file-upload-area div[style*="border: 2px dashed"]');
        const fileInput = createFileInput();
        const selectFileBtn = fileUploadArea.querySelector('.btn');

        // 创建隐藏的文件输入
        function createFileInput() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.style.display = 'none';
            document.body.appendChild(input);
            return input;
        }

        // 点击选择文件
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', function() {
                fileInput.click();
            });
        }

        // 文件选择
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleFileSelect(this.files[0]);
            }
        });

        // 拖拽上传
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--primary-color)';
            this.style.backgroundColor = 'rgba(58, 123, 213, 0.05)';
        });

        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'rgba(0,0,0,0.01)';
        });

        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = 'var(--border-color)';
            this.style.backgroundColor = 'rgba(0,0,0,0.01)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }

    // 处理文件选择
    function handleFileSelect(file) {
        // 验证文件类型
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
            showToast('请选择有效的 Excel 或 CSV 文件', 'error');
            return;
        }

        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('文件大小不能超过 10MB', 'error');
            return;
        }

        uploadedFile = file;
        updateFileUploadUI(file);
        parseFile(file);
        
        // 检查是否可以开始验证
        setTimeout(() => {
            checkVerificationReadiness();
        }, 500);
    }

    // 更新文件上传UI
    function updateFileUploadUI(file) {
        const fileUploadArea = document.querySelector('#file-upload-area div[style*="border: 2px dashed"]');
        fileUploadArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="var(--success-color)">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
                </svg>
                <div>
                    <div style="font-weight: 500; color: var(--dark-color);">${file.name}</div>
                    <div style="font-size: 0.85rem; color: var(--text-color);">${formatFileSize(file.size)}</div>
                </div>
                <button type="button" class="btn btn-outline btn-sm" onclick="resetFileUpload()">重新选择</button>
            </div>
        `;
    }

    // 重置文件上传
    window.resetFileUpload = function() {
        uploadedFile = null;
        batchData = [];
        const fileUploadArea = document.querySelector('#file-upload-area div[style*="border: 2px dashed"]');
        fileUploadArea.innerHTML = `
            <svg viewBox="0 0 24 24" width="60" height="60" fill="var(--text-color)" style="opacity: 0.5; margin: 0 auto 15px;">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <p style="margin-bottom: 15px; color: var(--text-color);">拖拽文件到此处或点击选择文件</p>
            <button type="button" class="btn btn-outline">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
                    <path d="M14,13V17H10V13H7L12,8L17,13H14M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" />
                </svg>
                选择文件
            </button>
            <p style="margin-top: 15px; font-size: 0.85rem; color: var(--text-color);">支持 .xlsx, .xls, .csv 格式，最大 10MB</p>
        `;
        setupFileUploadHandlers();
    };

    // 解析文件
    function parseFile(file) {
        const reader = new FileReader();
        
        if (file.name.endsWith('.csv')) {
            reader.onload = function(e) {
                parseCSV(e.target.result);
            };
            reader.readAsText(file);
        } else {
            showToast('不支持的文件格式，请上传CSV文件', 'error');
        }
    }

    // 解析CSV文件
    function parseCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            

            
            batchData = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                if (values.length >= headers.length && values[0]) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    batchData.push(row);
                }
            }
            

            showToast(`成功解析 ${batchData.length} 条记录`, 'success');
            // 不立即更新预览，等待用户点击开始验证
        } catch (error) {
            showToast('CSV文件解析失败，请检查文件格式', 'error');
            console.error('CSV解析错误:', error);
        }
    }


    
    // 基于文件生成样本数据
    function generateSampleDataBasedOnFile(count, fileName) {
        const names = ['张伟', '李明', '王芳', '赵刚', '陈丽', '刘强', '孙娜', '周杰', '吴敏', '郑华'];
        const schools = ['学链通大学', '清华大学', '北京大学', '上海交通大学', '复旦大学', '浙江大学', '南京大学', '中山大学', '华中科技大学', '西安交通大学'];
        const majors = ['计算机科学与技术', '软件工程', '信息管理', '电子商务', '市场营销', '人工智能', '数据科学', '网络工程', '信息安全', '电子信息工程'];
        
        const data = [];
        
        for (let i = 0; i < count; i++) {
            // 生成基于文件内容的验证码（更真实）
            const year = 2018 + (i % 5);
            const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            const sequence = String(Math.floor(Math.random() * 9000) + 1000);
            const suffix = ['X', 'Y'][Math.floor(Math.random() * 2)];
            
            const certificateNumber = `103${String(Math.floor(Math.random() * 90) + 10)}1${year}${month}${day}${sequence}${suffix}`;
            
            data.push({
                '姓名': names[i % names.length],
                '在线验证码': certificateNumber,
                '学校': schools[i % schools.length],
                '专业': majors[i % majors.length],
                '毕业年份': year.toString()
            });
        }
        
        return data;
    }

    // 更新批量数据预览
    function updateBatchDataPreview() {
        if (batchData.length > 0) {
            const initialArea = document.getElementById('batch-verification-initial');
            initialArea.innerHTML = `
                <div style="padding: 20px; text-align: left;">
                    <h4 style="color: var(--dark-color); margin-bottom: 15px;">数据预览 (前5条)</h4>
                    <div style="border: 1px solid var(--border-color); border-radius: 5px; overflow: hidden;">
                        <div style="background: rgba(0,0,0,0.02); padding: 10px; font-weight: 500; border-bottom: 1px solid var(--border-color);">
                            <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 10px;">
                                <span>姓名</span>
                                <span>在线验证码</span>
                                <span>学校</span>
                            </div>
                        </div>
                        ${batchData.slice(0, 5).map(item => `
                            <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 10px;">
                                    <span>${item.姓名 || item.name || '-'}</span>
                                    <span>${item.在线验证码 || item.certificateNumber || '-'}</span>
                                    <span>${item.学校 || item.school || '-'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align: center; margin-top: 15px;">
                        <span style="color: var(--text-color);">共 ${batchData.length} 条记录待验证</span>
                    </div>
                </div>
            `;
        }
    }

    // 设置批量验证处理器
    function setupBatchVerificationHandler() {
        const batchVerifyBtn = document.getElementById('batch-verify-btn');
        
        batchVerifyBtn.addEventListener('click', function() {
            if (isVerifying) return;
            
            // 验证前检查
            if (!validateBeforeVerification()) {
                return;
            }
            
            const activeMethod = document.querySelector('input[name="import-method"]:checked').value;
            
            if (activeMethod === 'manual') {
                handleManualInput();
                // 检查手动输入后是否有数据
                if (batchData.length === 0) {
                    showToast('请输入有效的在线验证码', 'warning');
                    return;
                }
            } else if (batchData.length === 0) {
                showToast('请先选择文件或输入数据', 'warning');
                return;
            }
            
            if (batchData.length === 0) {
                showToast('没有可验证的数据', 'warning');
                return;
            }
            

            startBatchVerification();
        });
    }
    
    // 验证前检查
    function validateBeforeVerification() {
        // 检查导入方式
        const activeMethod = document.querySelector('input[name="import-method"]:checked');
        if (!activeMethod) {
            showToast('请选择导入方式', 'warning');
            updateVerificationStatus('请选择导入方式', 'warning');
            return false;
        }
        
        // 检查验证用途
        const purposeSelect = document.querySelector('.form-select');
        if (!purposeSelect.value) {
            showToast('请选择验证用途', 'warning');
            purposeSelect.focus();
            purposeSelect.style.borderColor = 'var(--danger-color)';
            setTimeout(() => {
                purposeSelect.style.borderColor = '';
            }, 3000);
            updateVerificationStatus('请选择验证用途', 'warning');
            return false;
        }
        
        // 检查数据
        const methodValue = activeMethod.value;
        
        if (methodValue === 'manual') {
            const textarea = document.querySelector('#manual-input-area textarea');
            const inputText = textarea.value.trim();
            
            if (!inputText) {
                showToast('请输入在线验证码', 'warning');
                textarea.focus();
                updateVerificationStatus('请输入在线验证码', 'warning');
                return false;
            }
            
            const lines = inputText.split('\n').filter(line => line.trim().length > 0);
            if (lines.length === 0) {
                showToast('请输入有效的在线验证码', 'warning');
                updateVerificationStatus('请输入有效的在线验证码', 'warning');
                return false;
            }
            
            if (lines.length > 1000) {
                showToast('手动输入最多支持1000条记录', 'warning');
                updateVerificationStatus('手动输入最多支持1000条记录', 'warning');
                return false;
            }
            
        } else {
            // 文件上传方式
            if (!uploadedFile) {
                showToast('请先上传文件', 'warning');
                updateVerificationStatus('请先上传文件', 'warning');
                return false;
            }
            
            if (batchData.length === 0) {
                showToast('文件中没有有效的数据，请检查文件格式', 'warning');
                updateVerificationStatus('文件中没有有效的数据，请检查文件格式', 'warning');
                return false;
            }
            
            if (batchData.length > 1000) {
                showToast('批量验证最多支持1000条记录', 'warning');
                updateVerificationStatus('批量验证最多支持1000条记录', 'warning');
                return false;
            }
        }
        
        // 验证通过，显示准备状态
        const purposeText = purposeSelect.options[purposeSelect.selectedIndex].text;
        const recordCount = methodValue === 'manual' ? 
            document.querySelector('#manual-input-area textarea').value.split('\n').filter(l => l.trim()).length : 
            batchData.length;
        updateVerificationStatus(`准备验证 ${recordCount} 条记录，用途：${purposeText}`, 'success');
        
        return true;
    }
    
    // 更新验证状态显示
    function updateVerificationStatus(message, type = 'info') {
        const statusDiv = document.getElementById('verification-status');
        const statusText = document.getElementById('status-text');
        
        if (!statusDiv || !statusText) return;
        
        statusText.textContent = message;
        statusDiv.style.display = 'block';
        
        // 根据类型设置样式
        if (type === 'warning' || type === 'error') {
            statusDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
            statusDiv.style.borderColor = 'rgba(255, 193, 7, 0.3)';
            statusDiv.style.color = 'var(--warning-color)';
        } else if (type === 'success') {
            statusDiv.style.backgroundColor = 'rgba(0, 200, 83, 0.1)';
            statusDiv.style.borderColor = 'rgba(0, 200, 83, 0.3)';
            statusDiv.style.color = 'var(--success-color)';
        } else {
            statusDiv.style.backgroundColor = 'rgba(58, 123, 213, 0.05)';
            statusDiv.style.borderColor = 'rgba(58, 123, 213, 0.2)';
            statusDiv.style.color = 'var(--primary-color)';
        }
    }

    // 处理手动输入
    function handleManualInput() {
        const textarea = document.querySelector('#manual-input-area textarea');
        const inputText = textarea.value.trim();
        
        if (!inputText) {
            showToast('请输入在线验证码', 'warning');
            return;
        }
        
        const certificateNumbers = inputText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        batchData = certificateNumbers.map((certNum, index) => ({
            '序号': index + 1,
            '在线验证码': certNum,
            '姓名': '待验证',
            '学校': '待验证',
            '专业': '待验证'
        }));
        

        showToast(`准备验证 ${batchData.length} 条记录`, 'success');
        // 不立即更新预览，等待用户点击开始验证
    }

    // 开始批量验证
    function startBatchVerification() {
        isVerifying = true;
        verificationResults = [];
        
        // 记录验证用途
        const purposeSelect = document.querySelector('.form-select');
        const verificationPurpose = purposeSelect.options[purposeSelect.selectedIndex].text;
        
        console.log(`开始批量验证，用途: ${verificationPurpose}, 数据条数: ${batchData.length}`);
        
        // 先显示数据预览
        updateBatchDataPreview();
        
        // 延迟显示进度界面，让用户看到数据预览
        setTimeout(() => {
            showProgressUI();
            // 模拟批量验证过程
            simulateBatchVerification();
        }, 2000); // 2秒后开始验证
    }

    // 显示进度UI
    function showProgressUI() {
        document.getElementById('batch-verification-initial').style.display = 'none';
        document.getElementById('batch-progress').style.display = 'block';
        document.getElementById('batch-results').style.display = 'none';
        
        document.getElementById('total-count').textContent = batchData.length;
        document.getElementById('processed-count').textContent = '0';
        document.querySelector('.progress-fill').style.width = '0%';
    }

    // 模拟批量验证过程
    function simulateBatchVerification() {
        let processedCount = 0;
        const totalCount = batchData.length;
        
        const processInterval = setInterval(() => {
            if (processedCount >= totalCount) {
                clearInterval(processInterval);
                completeBatchVerification();
                return;
            }
            
            // 模拟处理单条记录
            const currentItem = batchData[processedCount];
            const result = simulateVerification(currentItem);
            verificationResults.push(result);
            
            processedCount++;
            
            // 更新进度
            const progress = (processedCount / totalCount) * 100;
            document.getElementById('processed-count').textContent = processedCount;
            document.querySelector('.progress-fill').style.width = progress + '%';
            
        }, 200); // 每200ms处理一条记录
    }

    // 模拟单条验证
    function simulateVerification(item) {
        const certNum = item['在线验证码'] || item.certificateNumber || item['证书编号'] || '';
        const name = item['姓名'] || item.name || '未知姓名';
        const school = item['学校'] || item.school || '未知学校';
        const major = item['专业'] || item.major || '未知专业';
        
        // 模拟验证逻辑 - 100%成功率
        const isSuccess = true;
        
        return {
            name: name,
            certificateNumber: certNum,
            school: school,
            major: major,
            status: 'success',
            message: '验证成功'
        };
    }

    // 完成批量验证
    function completeBatchVerification() {
        isVerifying = false;
        
        // 显示结果界面
        document.getElementById('batch-progress').style.display = 'none';
        document.getElementById('batch-results').style.display = 'block';
        
        updateResultsUI();
        
        // 设置导出按钮的事件处理器
        setupExportHandlers();
    }

    // 更新结果UI
    function updateResultsUI() {
        const successCount = verificationResults.filter(r => r.status === 'success').length;
        const failedCount = verificationResults.filter(r => r.status === 'failed').length;
        const pendingCount = verificationResults.length - successCount - failedCount;
        
        // 更新统计数据
        const resultsContainer = document.getElementById('batch-results');
        const statsDiv = resultsContainer.querySelector('div[style*="display: flex; justify-content: space-around"]');
        
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--success-color);">${successCount}</div>
                    <div style="font-size: 0.9rem; color: var(--text-color);">验证成功</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--danger-color);">${failedCount}</div>
                    <div style="font-size: 0.9rem; color: var(--text-color);">验证失败</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning-color);">${pendingCount}</div>
                    <div style="font-size: 0.9rem; color: var(--text-color);">待处理</div>
                </div>
            `;
        }
        
        // 更新结果列表
        updateResultsList();
    }

    // 更新结果列表
    function updateResultsList() {
        const listContainer = document.querySelector('#batch-results div[style*="max-height: 300px"]');
        
        if (!listContainer) {
            return;
        }
        
        if (verificationResults.length === 0) {
            listContainer.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--text-color);">
                    <p>暂无验证结果</p>
                </div>
            `;
            return;
        }
        
        // 完全重新构建结果列表，确保基于实际数据
        const resultListHTML = `
            <div style="padding: 10px; border-bottom: 1px solid var(--border-color); background-color: rgba(0,0,0,0.02); font-weight: 500;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px;">
                    <span>姓名</span>
                    <span>在线验证码</span>
                    <span>学校</span>
                    <span>状态</span>
                </div>
            </div>
            ${verificationResults.map((result) => `
                <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; align-items: center;">
                        <span>${result.name || '未知姓名'}</span>
                        <span>${result.certificateNumber || '无'}</span>
                        <span>${result.school || '未知学校'}</span>
                        <span style="color: ${result.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};">
                            ${result.status === 'success' ? '✓ 成功' : '✗ 失败'}
                        </span>
                    </div>
                </div>
            `).join('')}
        `;
        
        listContainer.innerHTML = resultListHTML;
    }

    // 设置模板下载处理器
    function setupTemplateDownloadHandlers() {
        // 查找包含"模板下载"标题的卡片
        const cards = document.querySelectorAll('.card');
        let templateCard = null;
        
        cards.forEach(card => {
            const title = card.querySelector('.card-title');
            if (title && title.textContent.includes('模板下载')) {
                templateCard = card;
            }
        });
        
        if (!templateCard) {
            console.warn('未找到模板下载区域');
            return;
        }
        
        // 查找该卡片中的所有按钮
        const templateButtons = templateCard.querySelectorAll('.btn-sm');
        
        // 通过文本内容匹配按钮
        templateButtons.forEach(button => {
            const buttonText = button.textContent.trim();
            if (buttonText.includes('CSV模板')) {
                button.addEventListener('click', downloadCSVTemplate);
            } else if (buttonText.includes('查看说明')) {
                button.addEventListener('click', showUsageHelp);
            }
        });
    }



    // 下载CSV模板
    function downloadCSVTemplate() {
        const templateData = generateTemplateData();
        const csvContent = generateCSVTemplate(templateData);
        downloadFile(csvContent, '批量验证模板.csv', 'text/csv');
        showToast('CSV模板下载成功', 'success');
    }

    // 生成模板数据
    function generateTemplateData() {
        return [
            ['姓名', '在线验证码', '学校', '专业', '毕业年份'],
            ['张三', '10384120200601546X', '学链通大学', '计算机科学与技术', '2020'],
            ['李四', '10035120190601782Y', '清华大学', '软件工程', '2019'],
            ['王五', '10248120210601395X', '上海交通大学', '信息管理', '2021']
        ];
    }



    // 生成CSV模板
    function generateCSVTemplate(data) {
        const csvContent = data.map(row => row.join(',')).join('\n');
        return new Blob(['\ufeff' + csvContent], { type: 'text/csv' });
    }

    // 显示使用说明
    function showUsageHelp() {
        showModal('使用说明', `
            <div style="text-align: left; line-height: 1.6;">
                <h4>文件格式要求：</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>支持 .csv 格式文件</li>
                    <li>文件大小不超过 10MB</li>
                    <li>最多支持 1000 条记录</li>
                </ul>
                
                <h4>数据格式要求：</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>第一行为表头（姓名、在线验证码、学校、专业等）</li>
                    <li>在线验证码为必填项</li>
                    <li>姓名和学校信息有助于提高验证准确性</li>
                </ul>
                
                <h4>注意事项：</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>请确保在线验证码格式正确（18位）</li>
                    <li>建议先下载模板，按格式填写数据</li>
                    <li>验证结果可导出为Excel报告</li>
                </ul>
            </div>
        `);
    }

    // 设置导出处理器 (在验证完成后调用)
    function setupExportHandlers() {
        const exportButtons = document.querySelectorAll('#batch-results .btn');
        
        exportButtons.forEach(button => {
            const buttonText = button.textContent.trim();
            if (buttonText.includes('导出Excel')) {
                button.addEventListener('click', exportToExcel);
            } else if (buttonText.includes('下载报告')) {
                button.addEventListener('click', downloadReport);
            }
        });
    }

    // 导出到Excel
    function exportToExcel() {
        if (verificationResults.length === 0) {
            showToast('没有可导出的数据', 'warning');
            return;
        }
        
        const exportData = [
            ['序号', '姓名', '在线验证码', '学校', '专业', '验证状态', '备注'],
            ...verificationResults.map((result, index) => [
                index + 1,
                result.name,
                result.certificateNumber,
                result.school,
                result.major,
                result.status === 'success' ? '成功' : '失败',
                result.message
            ])
        ];
        
        const csvContent = exportData.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv' });
        downloadFile(blob, `批量验证结果_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        showToast('验证结果导出成功', 'success');
    }

    // 下载报告
    function downloadReport() {
        if (verificationResults.length === 0) {
            showToast('没有可下载的报告', 'warning');
            return;
        }
        
        const reportContent = generateVerificationReport();
        downloadFile(reportContent, `批量验证报告_${new Date().toISOString().split('T')[0]}.pdf`, 'application/pdf');
        showToast('验证报告下载成功', 'success');
    }

    // 生成验证报告
    function generateVerificationReport() {
        const successCount = verificationResults.filter(r => r.status === 'success').length;
        const failedCount = verificationResults.filter(r => r.status === 'failed').length;
        const timestamp = new Date().toLocaleString();
        
        // 简化的PDF内容
        const reportContent = `
批量验证报告

验证时间：${timestamp}
验证总数：${verificationResults.length}
成功数量：${successCount}
失败数量：${failedCount}
成功率：${((successCount / verificationResults.length) * 100).toFixed(2)}%

详细结果：
${verificationResults.map((result, index) => 
    `${index + 1}. ${result.name} (${result.certificateNumber}) - ${result.status === 'success' ? '成功' : '失败'}`
).join('\n')}
        `;
        
        return new Blob([reportContent], { type: 'text/plain' });
    }

    // 工具函数
    function resetImportState() {
        uploadedFile = null;
        batchData = [];
        verificationResults = [];
        isVerifying = false;
        
        // 重置UI状态
        const initialArea = document.getElementById('batch-verification-initial');
        const progressArea = document.getElementById('batch-progress');
        const resultsArea = document.getElementById('batch-results');
        
        initialArea.style.display = 'block';
        progressArea.style.display = 'none';
        resultsArea.style.display = 'none';
        
        // 重置初始区域内容
        initialArea.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <svg viewBox="0 0 24 24" width="70" height="70" fill="var(--text-color)" style="opacity: 0.5; margin: 0 auto 20px;">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20V9H13V4H6V20H18M12,19L8,15H10.5V12H13.5V15H16L12,19Z" />
                </svg>
                <h3 style="font-size: 1.3rem; color: var(--dark-color); margin-bottom: 15px;">等待批量验证</h3>
                <p style="color: var(--text-color); max-width: 80%; margin: 0 auto;">请在左侧选择文件或输入数据，然后点击"开始批量验证"按钮</p>
                <div style="margin-top: 30px;">
                    <div style="display: inline-flex; align-items: center; background-color: rgba(26, 41, 128, 0.05); padding: 10px 15px; border-radius: 5px; color: var(--primary-color);">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right: 8px;">
                            <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                        <span>支持最多1000条记录同时验证</span>
                    </div>
                </div>
            </div>
        `;
        
        // 重置表单
        const purposeSelect = document.querySelector('.form-select');
        if (purposeSelect) {
            purposeSelect.value = '';
            purposeSelect.style.borderColor = '';
        }
        
        const textarea = document.querySelector('#manual-input-area textarea');
        if (textarea) {
            textarea.value = '';
        }
        
        // 重置文件上传区域
        if (document.querySelector('#file-upload-area')) {
            window.resetFileUpload && window.resetFileUpload();
        }
        
        // 隐藏状态提示
        const statusDiv = document.getElementById('verification-status');
        if (statusDiv) {
            statusDiv.style.display = 'none';
        }
    }
    
    // 检查验证准备状态
    function checkVerificationReadiness() {
        const activeMethod = document.querySelector('input[name="import-method"]:checked');
        const purposeSelect = document.querySelector('.form-select');
        
        if (!activeMethod) {
            updateVerificationStatus('请选择导入方式', 'warning');
            return;
        }
        
        if (!purposeSelect.value) {
            if (activeMethod.value === 'manual') {
                const textarea = document.querySelector('#manual-input-area textarea');
                if (textarea.value.trim()) {
                    updateVerificationStatus('请选择验证用途', 'warning');
                }
            } else if (batchData.length > 0) {
                updateVerificationStatus('请选择验证用途', 'warning');
            }
            return;
        }
        
        // 检查数据
        if (activeMethod.value === 'manual') {
            const textarea = document.querySelector('#manual-input-area textarea');
            const inputText = textarea.value.trim();
            if (!inputText) {
                updateVerificationStatus('请输入在线验证码', 'warning');
                return;
            }
            const lines = inputText.split('\n').filter(line => line.trim().length > 0);
            if (lines.length > 0) {
                const purposeText = purposeSelect.options[purposeSelect.selectedIndex].text;
                updateVerificationStatus(`准备验证 ${lines.length} 条记录，用途：${purposeText}`, 'success');
            }
        } else {
            if (batchData.length === 0) {
                updateVerificationStatus('请先上传文件', 'warning');
                return;
            }
            const purposeText = purposeSelect.options[purposeSelect.selectedIndex].text;
            updateVerificationStatus(`准备验证 ${batchData.length} 条记录，用途：${purposeText}`, 'success');
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function generateRandomName() {
        const names = ['张伟', '李明', '王芳', '赵刚', '陈丽', '刘强', '杨静', '黄勇', '周敏', '吴涛'];
        return names[Math.floor(Math.random() * names.length)];
    }

    function generateRandomSchool() {
        const schools = ['学链通大学', '清华大学', '上海交通大学', '复旦大学', '浙江大学', '北京大学'];
        return schools[Math.floor(Math.random() * schools.length)];
    }

    function generateRandomMajor() {
        const majors = ['计算机科学与技术', '软件工程', '信息管理', '电子商务', '市场营销', '工商管理'];
        return majors[Math.floor(Math.random() * majors.length)];
    }

    function downloadFile(content, filename, mimeType) {
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function showToast(message, type = 'info') {
        let toast = document.querySelector('.toast-message');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-message';
            document.body.appendChild(toast);
            
            toast.style.position = 'fixed';
            toast.style.top = '20px';
            toast.style.right = '20px';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '4px';
            toast.style.zIndex = '1000';
            toast.style.transition = 'opacity 0.3s';
            toast.style.color = 'white';
        }
        
        const colors = {
            success: 'rgba(0, 200, 83, 0.9)',
            error: 'rgba(255, 82, 82, 0.9)',
            warning: 'rgba(255, 193, 7, 0.9)',
            info: 'rgba(0, 0, 0, 0.7)'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;
        toast.style.opacity = '1';
        
        clearTimeout(toast.timeoutId);
        toast.timeoutId = setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }

    function showModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 10px;
                padding: 30px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #333;">${title}</h3>
                    <button style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
                </div>
                <div>${content}</div>
                <div style="text-align: center; margin-top: 20px;">
                    <button style="
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        background: var(--primary-color);
                        color: white;
                        cursor: pointer;
                    ">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.textContent === '×' || e.target.textContent === '确定') {
                document.body.removeChild(modal);
            }
        });
    }
}); 