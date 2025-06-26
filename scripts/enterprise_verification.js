document.addEventListener('DOMContentLoaded', function() {
    // 验证方式切换
    const radioBtns = document.querySelectorAll('input[name="verify-method"]');
    const certificateForm = document.getElementById('certificate-form');
    const personForm = document.getElementById('person-form');
    const qrcodeForm = document.getElementById('qrcode-form');
    
    // 所有验证相关表单元素
    const allFormInputs = document.querySelectorAll('#verificationForm input, #verificationForm select, #verificationForm textarea');
    
    // 验证结果相关元素
    const resultCard = document.querySelector('.col-6:nth-child(2) .card');
    const resultCardBody = resultCard.querySelector('.card-body');
    const successResult = document.getElementById('result-success');
    const failedResult = document.getElementById('result-failed');
    const initialState = document.getElementById('verification-initial');
    
    // 创建加载状态元素
    const loadingElement = document.createElement('div');
    loadingElement.className = 'verification-loading';
    loadingElement.innerHTML = `
        <div class="loading-spinner">
            <svg viewBox="0 0 50 50" width="50" height="50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="var(--primary-color)" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-dashoffset="0">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                </circle>
            </svg>
        </div>
        <h3 class="loading-text">正在验证中...</h3>
        <p class="loading-subtext">正在查询区块链数据，请稍候</p>
    `;
    
    // 添加加载状态样式
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .verification-loading {
            text-align: center;
            padding: 40px;
        }
        
        .loading-spinner {
            margin: 0 auto 20px;
            width: 50px;
            height: 50px;
        }
        
        .loading-text {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--dark-color);
        }
        
        .loading-subtext {
            font-size: 0.95rem;
            color: var(--text-color);
        }
        
        .certificate-display {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .certificate-display.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .action-buttons {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease 0.3s, transform 0.5s ease 0.3s;
        }
        
        .action-buttons.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .result-icon-success, .result-icon-danger {
            transform: scale(0.5);
            opacity: 0;
            transition: transform 0.5s ease, opacity 0.5s ease;
        }
        
        .result-icon-success.show, .result-icon-danger.show {
            transform: scale(1);
            opacity: 1;
        }
        
        .pulse-animation {
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.05);
                opacity: 0.8;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .shake-animation {
            animation: shake 0.5s;
        }
        
        @keyframes shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
            100% { transform: translateX(0); }
        }
        
        .highlight-field {
            border-color: var(--danger-color) !important;
            box-shadow: 0 0 0 3px rgba(255, 82, 82, 0.2) !important;
            animation: shake 0.5s;
        }
        
        #verification-initial {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .fade-out {
            opacity: 0;
            transform: translateY(-10px);
        }
        
        /* 模态框按钮样式 */
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #3A7BD5, #00d2ff);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(58, 123, 213, 0.3);
        }
        
        .btn-outline {
            background: transparent;
            color: #666;
            border: 1px solid #e9ecef;
        }
        
        .btn-outline:hover {
            background: #f8f9fa;
            border-color: #dee2e6;
        }
    `;
    document.head.appendChild(styleElement);
    
    // 确保页面加载时显示初始提示状态
    initialState.style.display = 'block';
    successResult.style.display = 'none';
    failedResult.style.display = 'none';
    
    // 添加复制按钮到区块链信息
    const blockchainInfoDivs = document.querySelectorAll('#result-success .certificate-data');
    blockchainInfoDivs.forEach(div => {
        const value = div.querySelector('.certificate-value');
        if (value && value.textContent.trim().length > 0) {
            const copyBtn = document.createElement('span');
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-left: 5px; cursor: pointer; vertical-align: middle;">
                    <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                </svg>
            `;
            copyBtn.style.cursor = 'pointer';
            copyBtn.title = '点击复制';
            copyBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(value.textContent).then(() => {
                    showToast('已复制到剪贴板');
                });
            });
            value.appendChild(copyBtn);
        }
    });
    
    radioBtns.forEach(radio => {
        radio.addEventListener('change', function() {
            // 隐藏所有表单
            certificateForm.style.display = 'none';
            personForm.style.display = 'none';
            qrcodeForm.style.display = 'none';
            
            // 显示选中的表单
            if (this.value === 'certificate') {
                certificateForm.style.display = 'block';
            } else if (this.value === 'person') {
                personForm.style.display = 'block';
            } else if (this.value === 'qrcode') {
                qrcodeForm.style.display = 'block';
            }
        });
    });
    
    // 验证按钮点击事件
    const verifyBtn = document.getElementById('verify-btn');
    
    verifyBtn.addEventListener('click', function() {
        // 表单验证
        if (!validateForm()) {
            return;
        }
        
        // 移除初始提示状态
        initialState.classList.add('fade-out');
        setTimeout(() => {
            initialState.style.display = 'none';
            initialState.classList.remove('fade-out');
        }, 300);
        
        // 重置结果显示
        successResult.style.display = 'none';
        failedResult.style.display = 'none';
        
        // 显示加载状态
        resultCardBody.innerHTML = '';
        resultCardBody.appendChild(loadingElement);
        
        // 滚动到结果区域
        resultCard.scrollIntoView({ behavior: 'smooth' });
        
        // 禁用验证按钮和表单输入
        verifyBtn.disabled = true;
        verifyBtn.classList.add('pulse-animation');
        allFormInputs.forEach(input => input.disabled = true);
        
        // 模拟验证过程
        const verificationTime = Math.random() * 2000 + 1000; // 1-3秒随机时间
        const isSuccess = Math.random() > 0.3; // 70% 成功率
        
        setTimeout(() => {
            // 移除加载状态
            resultCardBody.innerHTML = '';
            
            // 重新添加结果元素
            if (isSuccess) {
                resultCardBody.appendChild(successResult);
                successResult.style.display = 'block';
                
                // 添加动画效果
                const resultIcon = successResult.querySelector('.result-icon-success');
                const certificate = successResult.querySelector('.certificate-display');
                const actionButtons = successResult.querySelector('.action-buttons');
                
                resultIcon.classList.add('show');
                
                setTimeout(() => {
                    certificate.classList.add('show');
                }, 300);
                
                setTimeout(() => {
                    actionButtons.classList.add('show');
                }, 800);
                
                // 更新证书信息
                updateCertificateInfo();
                
                // 如果是在线验证码验证，显示核验通知提示
                const activeMethod = document.querySelector('input[name="verify-method"]:checked').value;
                if (activeMethod === 'certificate' && window.currentVerificationResult && window.currentVerificationResult.certificate) {
                    setTimeout(() => {
                        showToast('核验通知已发送给学生');
                    }, 1500);
                }
            } else {
                resultCardBody.appendChild(failedResult);
                failedResult.style.display = 'block';
                
                // 动画效果
                const resultIcon = failedResult.querySelector('.result-icon-danger');
                resultIcon.classList.add('show');
            }
            
            // 重新启用验证按钮和表单输入
            verifyBtn.disabled = false;
            verifyBtn.classList.remove('pulse-animation');
            allFormInputs.forEach(input => input.disabled = false);
            
        }, verificationTime);
    });
    
    // 表单验证函数
    function validateForm() {
        let isValid = true;
        // 重置所有输入框样式
        allFormInputs.forEach(input => input.classList.remove('highlight-field'));
        
        // 根据当前选中的验证方式进行验证
        const activeMethod = document.querySelector('input[name="verify-method"]:checked').value;
        
        if (activeMethod === 'certificate') {
            // 验证在线验证码
            const certInput = certificateForm.querySelector('input');
            const certNumber = certInput.value.trim();
            if (!certNumber || certNumber.length !== 18) {
                certInput.classList.add('highlight-field');
                showToast('请输入18位在线验证码');
                isValid = false;
            }
            
            // 验证颁发机构
            const instSelect = certificateForm.querySelector('select');
            if (!instSelect.value) {
                instSelect.classList.add('highlight-field');
                showToast('请选择颁发机构');
                isValid = false;
            }
            
            // 如果基本信息验证通过，进行证书验证
            if (isValid) {
                const issuingAuthority = instSelect.options[instSelect.selectedIndex].text;
                const verificationResult = verifyCertificate(certNumber, issuingAuthority);
                
                if (!verificationResult.valid) {
                    showToast(verificationResult.reason);
                    isValid = false;
                } else {
                    // 存储验证结果供后续使用
                    window.currentVerificationResult = verificationResult;
                }
            }
        } else if (activeMethod === 'person') {
            // 验证姓名
            const nameInput = personForm.querySelector('input:nth-child(1)');
            if (!nameInput.value.trim()) {
                nameInput.classList.add('highlight-field');
                showToast('请输入姓名');
                isValid = false;
            }
            
            // 验证身份证号
            const idCardInput = personForm.querySelector('input:nth-child(2)');
            if (!idCardInput.value.trim() || idCardInput.value.trim().length < 15) {
                idCardInput.classList.add('highlight-field');
                showToast('请输入有效的身份证号');
                isValid = false;
            }
        }
        
        // 验证用途
        const purposeSelect = document.querySelector('#verificationForm .form-select:last-of-type');
        if (!purposeSelect.value) {
            purposeSelect.classList.add('highlight-field');
            showToast('请选择验证用途');
            isValid = false;
        }
        
        return isValid;
    }
    
    // 模拟证书数据库 - 与学生端创建的授权对应
    const certificateDatabase = [
        {
            certificateNumber: '202409151234567890',
            issuingAuthority: '学链通大学',
            studentName: '张三',
            gender: '男',
            birthDate: '1999年3月12日',
            school: '学链通大学',
            major: '计算机科学与技术',
            degree: '本科',
            studyForm: '全日制',
            entranceDate: '2021年9月',
            graduationYear: '2025',
            graduationDate: '2025年6月',
            certificateDate: '2025年6月15日',
            status: 'valid',
            expiryDate: '2025-10-15'
        },
        {
            certificateNumber: '202409201234567891',
            issuingAuthority: '学链通大学',
            studentName: '李明',
            gender: '男',
            birthDate: '1998年8月20日',
            school: '学链通大学',
            major: '软件工程',
            degree: '本科',
            studyForm: '全日制',
            entranceDate: '2019年9月',
            graduationYear: '2024',
            graduationDate: '2024年6月',
            certificateDate: '2024年6月15日',
            status: 'valid',
            expiryDate: '2024-10-20'
        },
        {
            certificateNumber: '202409251234567892',
            issuingAuthority: '学链通大学',
            studentName: '王丽',
            gender: '女',
            birthDate: '1997年11月5日',
            school: '学链通大学',
            major: '数据科学与大数据技术',
            degree: '硕士',
            studyForm: '全日制',
            entranceDate: '2021年9月',
            graduationYear: '2024',
            graduationDate: '2024年6月',
            certificateDate: '2024年6月15日',
            status: 'valid',
            expiryDate: '2024-10-25'
        },
        {
            certificateNumber: '10384120200601546X',
            issuingAuthority: '学链通大学',
            studentName: '张伟',
            gender: '男',
            birthDate: '1998年5月15日',
            school: '学链通大学',
            major: '计算机科学与技术',
            degree: '本科',
            studyForm: '全日制',
            entranceDate: '2016年9月',
            graduationYear: '2020',
            graduationDate: '2020年6月',
            certificateDate: '2020年6月15日',
            status: 'valid',
            expiryDate: '2030-06-15'
        }
    ];
    
    // 验证在线验证码
    function verifyCertificate(certificateNumber, issuingAuthority) {
        const certificate = certificateDatabase.find(cert => 
            cert.certificateNumber === certificateNumber && 
            cert.issuingAuthority === issuingAuthority
        );
        
        if (certificate) {
            // 检查证书是否过期
            const today = new Date();
            const expiryDate = new Date(certificate.expiryDate);
            
            if (today > expiryDate) {
                return { valid: false, reason: '证书已过期' };
            }
            
            return { valid: true, certificate: certificate };
        }
        
        return { valid: false, reason: '在线验证码或颁发机构不正确' };
    }
    
    // 模拟发送核验通知给学生端
    function simulateStudentNotification(certificate) {
        // 模拟向学生端发送核验通知
        const notificationData = {
            certificateNumber: certificate.certificateNumber,
            company: '当前企业', // 这里应该是实际的企业名称
            verifyTime: new Date().toLocaleString('zh-CN'),
            studentName: certificate.studentName
        };
        
        // 在实际应用中，这里会通过API发送通知给学生端
        console.log('发送核验通知给学生:', notificationData);
        
        // 显示通知发送成功的提示
        setTimeout(() => {
            showToast('核验通知已发送给学生');
        }, 2000);
    }
    
    // 更新证书信息
    function updateCertificateInfo() {
        // 获取表单数据
        const activeMethod = document.querySelector('input[name="verify-method"]:checked').value;
        const certificateData = successResult.querySelectorAll('.certificate-data');
        
        // 更新姓名
        if (activeMethod === 'person') {
            const nameInput = personForm.querySelector('input');
            if (nameInput && nameInput.value.trim() && certificateData[0]) {
                const valueElement = certificateData[0].querySelector('.certificate-value');
                if (valueElement) {
                    valueElement.textContent = nameInput.value;
                }
            }
            
            // 更新学校
            const schoolInput = personForm.querySelector('input:nth-child(3)');
            if (schoolInput && schoolInput.value.trim() && certificateData[3]) {
                const valueElement = certificateData[3].querySelector('.certificate-value');
                if (valueElement) {
                    valueElement.textContent = schoolInput.value;
                }
            }
        } else if (activeMethod === 'certificate') {
            // 如果有验证结果，使用验证结果中的信息
            if (window.currentVerificationResult && window.currentVerificationResult.certificate) {
                const cert = window.currentVerificationResult.certificate;
                
                // 更新在线验证码
                const certNumElement = successResult.querySelector('.certificate-header div:last-child');
                if (certNumElement) {
                    certNumElement.textContent = '在线验证码：' + cert.certificateNumber;
                }
                
                // 按照HTML中的顺序正确映射字段
                // 0: 姓名
                if (certificateData[0]) {
                    const valueElement = certificateData[0].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.studentName;
                }
                
                // 1: 性别
                if (certificateData[1]) {
                    const valueElement = certificateData[1].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.gender;
                }
                
                // 2: 出生日期
                if (certificateData[2]) {
                    const valueElement = certificateData[2].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.birthDate;
                }
                
                // 3: 学校
                if (certificateData[3]) {
                    const valueElement = certificateData[3].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.school;
                }
                
                // 4: 专业
                if (certificateData[4]) {
                    const valueElement = certificateData[4].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.major;
                }
                
                // 5: 学历层次
                if (certificateData[5]) {
                    const valueElement = certificateData[5].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.degree;
                }
                
                // 6: 学习形式
                if (certificateData[6]) {
                    const valueElement = certificateData[6].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.studyForm;
                }
                
                // 7: 入学时间
                if (certificateData[7]) {
                    const valueElement = certificateData[7].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.entranceDate;
                }
                
                // 8: 毕业时间
                if (certificateData[8]) {
                    const valueElement = certificateData[8].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.graduationDate;
                }
                
                // 9: 证书颁发日期
                if (certificateData[9]) {
                    const valueElement = certificateData[9].querySelector('.certificate-value');
                    if (valueElement) valueElement.textContent = cert.certificateDate;
                }
            } else {
                // 如果没有验证结果，使用表单输入的信息
                const certInput = certificateForm.querySelector('input');
                if (certInput && certInput.value.trim()) {
                    const certNumElement = successResult.querySelector('.certificate-header div:last-child');
                    if (certNumElement) {
                        certNumElement.textContent = '在线验证码：' + certInput.value;
                    }
                }
                
                // 更新颁发机构
                const instSelect = certificateForm.querySelector('select');
                if (instSelect && instSelect.value && certificateData[3]) {
                    const valueElement = certificateData[3].querySelector('.certificate-value');
                    if (valueElement) {
                        valueElement.textContent = instSelect.options[instSelect.selectedIndex].text;
                    }
                }
            }
        }
        
        // 更新区块链时间戳 - 当前时间
        const now = new Date();
        const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const timestampElement = successResult.querySelector('div[style*="width: 50%"]:first-child div:last-child');
        if (timestampElement) {
            timestampElement.textContent = timestampStr;
        }
        
        // 更新交易哈希 - 随机生成
        const txHash = Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        const txHashElement = successResult.querySelector('div[style*="width: 100%"]:first-child div:last-child');
        if (txHashElement) {
            txHashElement.textContent = '0x' + txHash;
        }
        
        // 添加记录到历史记录
        let recordData = {
            name: '张伟',
            school: '学链通大学',
            certNumber: '10384120200601546X',
            timestamp: timestampStr
        };
        
        if (activeMethod === 'person') {
            recordData.name = personForm.querySelector('input').value;
            recordData.school = personForm.querySelector('input:nth-child(3)').value;
        } else if (activeMethod === 'certificate' && window.currentVerificationResult && window.currentVerificationResult.certificate) {
            const cert = window.currentVerificationResult.certificate;
            recordData.name = cert.studentName;
            recordData.school = cert.school;
            recordData.certNumber = cert.certificateNumber;
            
            // 模拟发送核验通知给学生端
            simulateStudentNotification(cert);
        } else if (activeMethod === 'certificate') {
            recordData.certNumber = certificateForm.querySelector('input').value;
        }
        
        addHistoryRecord(recordData);
    }
    
    // 添加历史记录
    function addHistoryRecord(data) {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.style.opacity = '0';
        historyItem.style.transform = 'translateY(20px)';
        historyItem.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-title">${data.name} - ${data.school}</div>
                <div class="history-item-date">${data.timestamp}</div>
            </div>
            <div class="history-item-content">
                <div class="history-item-info">
                    <div style="color: var(--text-color); font-size: 0.9rem;">在线验证码：${data.certNumber}</div>
                    <div style="color: var(--text-color); font-size: 0.9rem;">学历层次：本科</div>
                    <div style="color: var(--text-color); font-size: 0.9rem;">验证用途：${document.querySelector('#verificationForm .form-select:last-of-type').options[document.querySelector('#verificationForm .form-select:last-of-type').selectedIndex].text}</div>
                    <span class="history-item-badge" style="background-color: rgba(0, 200, 83, 0.1); color: var(--success-color);">验证成功</span>
                </div>
                <div style="display: flex; align-items: flex-end;">
                    <button class="btn btn-sm btn-outline">查看详情</button>
                </div>
            </div>
        `;
        
        // 插入到列表顶部
        if (historyList.firstChild) {
            historyList.insertBefore(historyItem, historyList.firstChild);
        } else {
            historyList.appendChild(historyItem);
        }
        
        // 添加动画效果
        setTimeout(() => {
            historyItem.style.opacity = '1';
            historyItem.style.transform = 'translateY(0)';
        }, 100);
        
        // 绑定查看详情按钮事件
        const detailBtn = historyItem.querySelector('.btn');
        detailBtn.addEventListener('click', function() {
            resultCard.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // 历史记录详情按钮
    const historyDetailBtns = document.querySelectorAll('.history-list .btn');
    historyDetailBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除初始提示状态
            initialState.style.display = 'none';
            
            // 显示成功结果
            resultCardBody.innerHTML = '';
            resultCardBody.appendChild(successResult);
            successResult.style.display = 'block';
            
            // 添加动画效果
            const resultIcon = successResult.querySelector('.result-icon-success');
            const certificate = successResult.querySelector('.certificate-display');
            const actionButtons = successResult.querySelector('.action-buttons');
            
            resultIcon.classList.add('show');
            certificate.classList.add('show');
            actionButtons.classList.add('show');
            
            // 滚动到结果区域
            resultCard.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // 重新验证按钮
    const retryBtn = document.querySelector('#result-failed .btn-outline');
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            // 恢复初始提示状态
            resultCardBody.innerHTML = '';
            resultCardBody.appendChild(initialState);
            initialState.style.display = 'block';
            successResult.style.display = 'none';
            failedResult.style.display = 'none';
            
            // 重置验证表单中的值
            const activeMethod = document.querySelector('input[name="verify-method"]:checked').value;
            if (activeMethod === 'certificate') {
                const certInput = certificateForm.querySelector('input');
                certInput.value = '';
                const instSelect = certificateForm.querySelector('select');
                instSelect.selectedIndex = 0;
            } else if (activeMethod === 'person') {
                personForm.querySelectorAll('input').forEach(input => input.value = '');
                personForm.querySelector('select').selectedIndex = 0;
            }
            
            // 滚动到表单顶部
            document.getElementById('verificationForm').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // 联系客服按钮
    const contactBtn = document.querySelector('#result-failed .btn-primary');
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
            showToast('正在连接客服，请稍候...');
            setTimeout(() => {
                showModalMessage('客服信息', '工作时间：周一至周五 9:00-18:00<br>电话：400-888-8888<br>邮箱：support@eduflow.com');
            }, 1000);
        });
    }
    
    // 顶部导航链接点击事件 - 重置验证状态
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 如果点击的是仪表盘链接，重置验证状态
            if (this.href.includes('#dashboard')) {
                resetVerificationState();
            }
        });
    });
    
    // 重置验证状态函数
    function resetVerificationState() {
        // 恢复初始提示状态
        resultCardBody.innerHTML = '';
        resultCardBody.appendChild(initialState);
        initialState.style.display = 'block';
        successResult.style.display = 'none';
        failedResult.style.display = 'none';
        
        // 重置所有表单
        document.getElementById('verificationForm').reset();
        
        // 重置动画类
        document.querySelectorAll('.show').forEach(el => el.classList.remove('show'));
        
        // 显示证书验证表单
        certificateForm.style.display = 'block';
        personForm.style.display = 'none';
        qrcodeForm.style.display = 'none';
        document.getElementById('verify-method-1').checked = true;
    }
    
    // 页面加载时初始化
    resetVerificationState();

    // 添加新增按钮事件
    const printBtn = document.getElementById('print-certificate-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            printCertificate();
        });
    }

    const downloadBtn = document.getElementById('download-certificate-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadCertificatePDF();
        });
    }

    const shareBtn = document.getElementById('share-certificate-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            shareCertificate();
        });
    }

    // === 新增: 仪表盘交互功能 ===
    
    // 快速操作按钮点击事件
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const actions = [
                () => document.getElementById('verificationForm').scrollIntoView({ behavior: 'smooth' }),
                () => showToast('批量导入功能即将上线，敬请期待'),
                () => showToast('正在生成报告，请稍候...'),
                () => showToast('您有 2 条未读消息'),
                () => showToast('安全设置页面即将上线')
            ];
            
            if (actions[index]) {
                actions[index]();
            }
        });
    });
    
    // 图表数据选择变化事件
    const chartPeriodSelect = document.querySelector('.dashboard-card select');
    if (chartPeriodSelect) {
        chartPeriodSelect.addEventListener('change', function() {
            showToast(`已更新为${this.options[this.selectedIndex].text}数据`);
        });
    }
    
    // 图表刷新按钮
    const refreshChartBtn = document.querySelector('.dashboard-card .btn-outline');
    if (refreshChartBtn) {
        refreshChartBtn.addEventListener('click', function() {
            showToast('图表数据已更新');
        });
    }

    // 添加动画效果
    animateStatCards();
    
    // 导出按钮点击事件
    const exportResultBtn = document.querySelector('.card-tools .btn-outline');
    exportResultBtn.addEventListener('click', function() {
        showToast('正在导出验证结果，请稍候...');
        setTimeout(() => {
            showToast('验证结果已导出');
        }, 1500);
    });
    
    // 导出记录按钮
    const historyListElement = document.querySelector('.history-list');
    if (historyListElement && historyListElement.previousElementSibling) {
        const exportRecordBtn = historyListElement.previousElementSibling.querySelector('.btn-outline');
        if (exportRecordBtn) {
            exportRecordBtn.addEventListener('click', function() {
                showToast('正在导出验证历史记录，请稍候...');
                setTimeout(() => {
                    showToast('历史记录已导出');
                }, 1500);
            });
        }
    }
});

// 消息弹窗函数
function showModalMessage(title, content) {
    // 检查是否已存在弹窗
    let modal = document.querySelector('.custom-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '1000';
        
        document.body.appendChild(modal);
    } else {
        modal.innerHTML = '';
    }
    
    const modalContent = document.createElement('div');
    modalContent.className = 'custom-modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '10px';
    modalContent.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '500px';
    modalContent.style.maxHeight = '90vh';
    modalContent.style.overflow = 'auto';
    modalContent.style.transform = 'translateY(20px)';
    modalContent.style.opacity = '0';
    modalContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    
    modalContent.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: var(--dark-color); font-size: 1.2rem;">${title}</h3>
            <button style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-color);">&times;</button>
        </div>
        <div style="padding: 20px;">
            ${content}
        </div>
        <div style="padding: 15px 20px; border-top: 1px solid var(--border-color); text-align: right;">
            <button class="btn btn-primary">确定</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    
    // 动画效果
    setTimeout(() => {
        modalContent.style.transform = 'translateY(0)';
        modalContent.style.opacity = '1';
    }, 10);
    
    // 关闭按钮事件
    const closeBtn = modalContent.querySelector('button');
    closeBtn.addEventListener('click', function() {
        modalContent.style.transform = 'translateY(20px)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    // 确定按钮事件
    const confirmBtn = modalContent.querySelector('.btn-primary');
    confirmBtn.addEventListener('click', function() {
        modalContent.style.transform = 'translateY(20px)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
}

// 为统计卡片添加动画效果
function animateStatCards() {
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
        const finalValue = stat.textContent;
        const isPercentage = finalValue.includes('%');
        let startValue = 0;
        
        // 移除非数字字符
        const numericValue = parseFloat(finalValue.replace(/[^0-9.-]/g, ''));
        
        // 设置初始值
        stat.textContent = isPercentage ? '0%' : '0';
        
        // 创建动画
        const duration = 1500;
        const frameDuration = 16;
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;
        
        const animate = () => {
            frame++;
            const progress = frame / totalFrames;
            const currentValue = Math.floor(numericValue * progress);
            
            stat.textContent = isPercentage ? 
                (finalValue.startsWith('+') ? '+' : '') + currentValue + '%' : 
                currentValue.toLocaleString();
            
            if (frame < totalFrames) {
                requestAnimationFrame(animate);
            } else {
                stat.textContent = finalValue;
            }
        };
        
        requestAnimationFrame(animate);
    });
}

// 显示提示消息
function showToast(message) {
    // 检查是否已存在提示框
    let toast = document.querySelector('.toast-message');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-message';
        document.body.appendChild(toast);
        
        // 添加样式
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '1000';
        toast.style.transition = 'opacity 0.3s';
    }
    
    // 显示消息
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // 延迟隐藏
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// 打印证书功能
function printCertificate() {
    showToast('准备打印证书...');
    
    // 创建打印样式
    const printStyle = document.createElement('style');
    printStyle.textContent = `
        @media print {
            body * {
                visibility: hidden;
            }
            .certificate-display, .certificate-display * {
                visibility: visible;
            }
            .certificate-display {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                box-shadow: none !important;
                border: none !important;
            }
            .certificate-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .certificate-title {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin: 20px 0;
            }
            .certificate-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 30px 0;
            }
            .certificate-data {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px dotted #ccc;
            }
            .certificate-label {
                font-weight: bold;
                color: #333;
            }
            .certificate-value {
                color: #666;
            }
            .certificate-footer {
                text-align: center;
                margin-top: 40px;
                border-top: 1px solid #333;
                padding-top: 20px;
            }
            .action-buttons {
                display: none !important;
            }
        }
    `;
    
    document.head.appendChild(printStyle);
    
    setTimeout(() => {
        window.print();
        
        // 打印完成后移除样式
        setTimeout(() => {
            document.head.removeChild(printStyle);
        }, 1000);
    }, 500);
}

// 下载证书PDF功能
function downloadCertificatePDF() {
    showToast('正在生成PDF文件，请稍候...');
    
    // 获取证书数据
    const certificateData = getCurrentCertificateData();
    
    // 创建PDF下载进度模拟
    const progressModal = showProgressModal('生成PDF证书', '正在处理证书数据...');
    
    // 模拟PDF生成过程
    setTimeout(() => {
        updateProgress(progressModal, 30, '正在渲染证书样式...');
    }, 500);
    
    setTimeout(() => {
        updateProgress(progressModal, 60, '正在生成PDF文档...');
    }, 1000);
    
    setTimeout(() => {
        updateProgress(progressModal, 90, '正在准备下载...');
    }, 1500);
    
    setTimeout(() => {
        updateProgress(progressModal, 100, '生成完成！');
        
        // 创建PDF文件内容
        const pdfContent = generatePDFContent(certificateData);
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `学历证书_${certificateData.studentName}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setTimeout(() => {
            closeProgressModal(progressModal);
            showToast('证书PDF已下载到您的下载文件夹');
        }, 500);
    }, 2000);
}

// 分享证书功能
function shareCertificate() {
    const certificateData = getCurrentCertificateData();
    const shareUrl = generateShareUrl(certificateData);
    
    // 创建分享弹窗
    const shareModal = showShareModal(shareUrl, certificateData);
}

// 获取当前证书数据
function getCurrentCertificateData() {
    const successResult = document.getElementById('result-success');
    const certificateDataElements = successResult.querySelectorAll('.certificate-data');
    
    const data = {
        certificateNumber: successResult.querySelector('.certificate-header div:last-child').textContent.replace('在线验证码：', ''),
        studentName: certificateDataElements[0]?.querySelector('.certificate-value')?.textContent || '',
        gender: certificateDataElements[1]?.querySelector('.certificate-value')?.textContent || '',
        birthDate: certificateDataElements[2]?.querySelector('.certificate-value')?.textContent || '',
        school: certificateDataElements[3]?.querySelector('.certificate-value')?.textContent || '',
        major: certificateDataElements[4]?.querySelector('.certificate-value')?.textContent || '',
        degree: certificateDataElements[5]?.querySelector('.certificate-value')?.textContent || '',
        studyForm: certificateDataElements[6]?.querySelector('.certificate-value')?.textContent || '',
        entranceDate: certificateDataElements[7]?.querySelector('.certificate-value')?.textContent || '',
        graduationDate: certificateDataElements[8]?.querySelector('.certificate-value')?.textContent || '',
        certificateDate: certificateDataElements[9]?.querySelector('.certificate-value')?.textContent || ''
    };
    
    return data;
}

// 生成PDF内容 (简化版本)
function generatePDFContent(data) {
    // 这里是一个简化的PDF内容生成
    // 在实际应用中，可以使用jsPDF库或其他PDF生成库
    const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 24 Tf
50 700 Td
(学历证书) Tj
0 -40 Td
/F1 14 Tf
(姓名: ${data.studentName}) Tj
0 -20 Td
(学校: ${data.school}) Tj
0 -20 Td
(专业: ${data.major}) Tj
0 -20 Td
(学历: ${data.degree}) Tj
0 -20 Td
(在线验证码: ${data.certificateNumber}) Tj
0 -20 Td
(颁发日期: ${data.certificateDate}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000824 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
904
%%EOF`;
    
    return content;
}

// 生成分享链接
function generateShareUrl(data) {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
        type: 'certificate',
        id: data.certificateNumber,
        name: data.studentName,
        school: data.school,
        timestamp: Date.now()
    });
    
    return `${baseUrl}/verify?${params.toString()}`;
}

// 显示进度模态框
function showProgressModal(title, message) {
    const modal = document.createElement('div');
    modal.className = 'progress-modal';
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
        <div class="progress-content" style="
            background: white;
            border-radius: 10px;
            padding: 30px;
            width: 90%;
            max-width: 400px;
            text-align: center;
        ">
            <h3 style="margin: 0 0 20px 0; color: #333;">${title}</h3>
            <div class="progress-bar" style="
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin: 20px 0;
            ">
                <div class="progress-fill" style="
                    height: 100%;
                    background: linear-gradient(45deg, #3A7BD5, #00d2ff);
                    width: 0%;
                    transition: width 0.3s ease;
                "></div>
            </div>
            <p class="progress-text" style="margin: 10px 0 0 0; color: #666;">${message}</p>
            <div class="progress-percentage" style="margin-top: 10px; font-weight: bold; color: #3A7BD5;">0%</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

// 更新进度
function updateProgress(modal, percentage, message) {
    const progressFill = modal.querySelector('.progress-fill');
    const progressText = modal.querySelector('.progress-text');
    const progressPercentage = modal.querySelector('.progress-percentage');
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = message;
    progressPercentage.textContent = percentage + '%';
}

// 关闭进度模态框
function closeProgressModal(modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

// 显示分享模态框
function showShareModal(shareUrl, certificateData) {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
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
        <div class="share-content" style="
            background: white;
            border-radius: 15px;
            padding: 30px;
            width: 90%;
            max-width: 500px;
            text-align: center;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;">分享证书</h3>
                <button class="close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <div style="margin: 20px 0;">
                <p style="color: #666; margin-bottom: 15px;">选择分享方式：</p>
                <div class="share-methods" style="display: flex; gap: 20px; justify-content: center; margin: 20px 0;">
                    <div class="share-method" data-method="wechat" style="text-align: center; cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.3s;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #07C160; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M8.5,10A1.5,1.5 0 0,0 7,11.5A1.5,1.5 0 0,0 8.5,13A1.5,1.5 0 0,0 10,11.5A1.5,1.5 0 0,0 8.5,10M15.5,10A1.5,1.5 0 0,0 14,11.5A1.5,1.5 0 0,0 15.5,13A1.5,1.5 0 0,0 17,11.5A1.5,1.5 0 0,0 15.5,10M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z"/>
                            </svg>
                        </div>
                        <span style="font-size: 14px;">微信</span>
                    </div>
                    <div class="share-method" data-method="qq" style="text-align: center; cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.3s;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #4267B2; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H14V13H17L17.5,10H14V8.5A1.5,1.5 0 0,1 15.5,7H17.5V4H15C12.24,4 10,6.24 10,9V10H7V13H10V20H4V4H20V20Z"/>
                            </svg>
                        </div>
                        <span style="font-size: 14px;">QQ</span>
                    </div>
                    <div class="share-method" data-method="weibo" style="text-align: center; cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.3s;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #E6162D; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10V10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"/>
                            </svg>
                        </div>
                        <span style="font-size: 14px;">微博</span>
                    </div>
                    <div class="share-method" data-method="copy" style="text-align: center; cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.3s;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #666; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                            </svg>
                        </div>
                        <span style="font-size: 14px;">复制链接</span>
                    </div>
                </div>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">分享链接：</div>
                <div style="font-size: 13px; color: #999; word-break: break-all; background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;">${shareUrl}</div>
            </div>
            
            <div style="margin: 20px 0;">
                <canvas id="qrcode-canvas" style="margin: 0 auto; display: block; border: 1px solid #e9ecef; border-radius: 8px;"></canvas>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">扫描二维码快速分享</p>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button class="btn btn-outline btn-share-close">取消</button>
                <button class="btn btn-primary btn-download-qr">下载二维码</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 生成二维码
    generateQRCode(shareUrl, modal.querySelector('#qrcode-canvas'));
    
    // 绑定事件
    bindShareModalEvents(modal, shareUrl, certificateData);
    
    return modal;
}

// 生成二维码 (简化版本)
function generateQRCode(text, canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    // 简化的二维码生成 - 在实际应用中建议使用qrcode.js库
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    
    ctx.fillStyle = '#000000';
    // 简单的网格模式代替真实二维码
    for(let i = 0; i < 20; i++) {
        for(let j = 0; j < 20; j++) {
            if((i + j) % 3 === 0) {
                ctx.fillRect(i * 10, j * 10, 8, 8);
            }
        }
    }
    
    // 添加中心文字
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('证书验证', 100, 100);
}

// 绑定分享模态框事件
function bindShareModalEvents(modal, shareUrl, certificateData) {
    // 关闭按钮
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.btn-share-close').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 下载二维码
    modal.querySelector('.btn-download-qr').addEventListener('click', () => {
        const canvas = modal.querySelector('#qrcode-canvas');
        const link = document.createElement('a');
        link.download = `证书二维码_${certificateData.studentName}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showToast('二维码已下载');
    });
    
    // 分享方式点击
    modal.querySelectorAll('.share-method').forEach(method => {
        method.addEventListener('mouseenter', () => {
            method.style.background = '#f0f0f0';
        });
        
        method.addEventListener('mouseleave', () => {
            method.style.background = 'transparent';
        });
        
        method.addEventListener('click', () => {
            const methodType = method.getAttribute('data-method');
            handleShareMethod(methodType, shareUrl, certificateData);
        });
    });
}

// 处理分享方式
function handleShareMethod(method, shareUrl, certificateData) {
    const shareText = `我在学链通平台验证了${certificateData.studentName}的${certificateData.degree}学历证书，证书真实有效。`;
    
    switch(method) {
        case 'wechat':
            // 微信分享 - 实际应用中需要接入微信SDK
            if (navigator.share) {
                navigator.share({
                    title: '学历证书验证',
                    text: shareText,
                    url: shareUrl
                });
            } else {
                copyToClipboard(shareUrl);
                showToast('链接已复制，请在微信中粘贴分享');
            }
            break;
            
        case 'qq':
            // QQ分享
            const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
            window.open(qqUrl, '_blank');
            break;
            
        case 'weibo':
            // 微博分享
            const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
            window.open(weiboUrl, '_blank');
            break;
            
        case 'copy':
            // 复制链接
            copyToClipboard(shareUrl);
            showToast('链接已复制到剪贴板');
            break;
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // 兼容性处理
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
} 