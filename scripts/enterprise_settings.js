// 企业系统设置页面 JavaScript

// 全局变量和函数定义
let userSettings = {
    security: {
        twoFactorEnabled: true,
        apiKey: 'ak_xlt_1234567890abcdef4321',
        authorizedDevices: 3
    },
    notifications: {
        verificationResult: true,
        batchCompletion: true,
        systemMaintenance: false,
        smsNotification: true
    },
    api: {
        endpoint: 'https://api.xueli.com/v1/verify',
        rateLimit: '500',
        whitelistIPs: ''
    },
    preferences: {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        theme: 'light'
    }
};

// 全局函数定义
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
};

window.submitPasswordChange = function() {
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('请填写所有密码字段', 'error');
        return;
    }
    
    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
        showToast('请填写所有密码字段', 'error');
        return;
    }
    
    if (newPassword.value !== confirmPassword.value) {
        showToast('新密码和确认密码不匹配', 'error');
        return;
    }
    
    if (newPassword.value.length < 8) {
        showToast('新密码长度至少8位', 'error');
        return;
    }
    
    // 模拟密码修改
    showProgressModal('正在修改密码...', async function() {
        await delay(2000);
        closeProgressModal();
        closeModal('change-password-modal');
        showToast('密码修改成功', 'success');
    });
};

window.downloadAPIDoc = function() {
    const docContent = `学链通API文档
        
认证
所有API请求都需要在头部包含您的API密钥：
Authorization: Bearer YOUR_API_KEY

验证单个证书
POST /v1/verify

请求示例：
{
  "certificate_number": "10384120200601546X",
  "student_name": "张三",
  "school": "学链通大学"
}

响应示例：
{
  "success": true,
  "data": {
    "valid": true,
    "certificate": {
      "number": "10384120200601546X",
      "student_name": "张三",
      "school": "学链通大学",
      "major": "计算机科学与技术",
      "degree": "本科",
      "graduation_date": "2020-06-01"
    },
    "verification_id": "ver_12345"
  }
}

错误码：
400 - 请求参数错误
401 - API密钥无效
429 - 请求频率超限
500 - 服务器内部错误`;

    const blob = new Blob([docContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '学链通API文档.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('API文档已下载', 'success');
};

// 工具函数
function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('复制失败', 'error');
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 通用提示函数
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    switch (type) {
        case 'success':
            toast.style.backgroundColor = 'var(--success-color)';
            break;
        case 'error':
            toast.style.backgroundColor = 'var(--danger-color)';
            break;
        case 'warning':
            toast.style.backgroundColor = 'var(--warning-color)';
            break;
        default:
            toast.style.backgroundColor = 'var(--primary-color)';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

function showConfirmDialog(title, message, onConfirm) {
    const modalHTML = `
        <div id="confirm-modal" class="modal">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="closeModal('confirm-modal')">取消</button>
                    <button type="button" class="btn btn-danger" onclick="confirmAction()">确认</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    window.confirmAction = function() {
        closeModal('confirm-modal');
        onConfirm();
        delete window.confirmAction;
    };
}

function showInfoDialog(title, message) {
    const modalHTML = `
        <div id="info-modal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button onclick="closeModal('info-modal')" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="closeModal('info-modal')">确定</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showProgressModal(message, callback) {
    const modalHTML = `
        <div id="progress-modal" class="modal">
            <div class="modal-content" style="max-width: 300px; text-align: center;">
                <div class="modal-body">
                    <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p>${message}</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    if (callback) {
        callback();
    }
}

function closeProgressModal() {
    const modal = document.getElementById('progress-modal');
    if (modal) {
        modal.remove();
    }
}

// 获取通知标签
function getNotificationLabel(type) {
    const labels = {
        'verificationResult': '验证结果通知',
        'batchCompletion': '批量验证完成通知',
        'systemMaintenance': '系统维护通知',
        'smsNotification': '短信通知'
    };
    return labels[type] || type;
}

// 应用主题
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initializePage();
    
    function initializePage() {
        setupSecurityHandlers();
        setupNotificationHandlers();
        setupAPIHandlers();
        setupPreferenceHandlers();
        setupFormValidation();
        loadUserSettings();
    }
    
    // 设置账户安全处理器
    function setupSecurityHandlers() {
        // 修改密码
        const changePasswordBtn = document.querySelector('.card:first-child .btn-outline');
        if (changePasswordBtn && changePasswordBtn.textContent.includes('修改密码')) {
            changePasswordBtn.addEventListener('click', showChangePasswordModal);
        }
        
        // 管理双重认证
        const manageTwoFactorBtn = Array.from(document.querySelectorAll('.card:first-child .btn-outline'))
            .find(btn => btn.textContent.includes('管理'));
        if (manageTwoFactorBtn) {
            manageTwoFactorBtn.addEventListener('click', showTwoFactorModal);
        }
        
        // 重新生成API密钥
        const regenerateAPIBtn = Array.from(document.querySelectorAll('.card:first-child .btn-outline'))
            .find(btn => btn.textContent.includes('重新生成'));
        if (regenerateAPIBtn) {
            regenerateAPIBtn.addEventListener('click', regenerateAPIKey);
        }
        
        // 查看登录设备
        const viewDevicesBtn = Array.from(document.querySelectorAll('.card:first-child .btn-outline'))
            .find(btn => btn.textContent.includes('查看详情'));
        if (viewDevicesBtn) {
            viewDevicesBtn.addEventListener('click', showDevicesModal);
        }
    }
    
    // 设置通知处理器
    function setupNotificationHandlers() {
        const switches = document.querySelectorAll('.switch input[type="checkbox"]');
        switches.forEach((switchInput, index) => {
            switchInput.addEventListener('change', function() {
                updateNotificationSetting(index, this.checked);
            });
        });
    }
    
    // 设置API配置处理器
    function setupAPIHandlers() {
        // 查看API文档
        const viewDocsBtn = document.querySelector('.card:nth-child(2) .btn-outline');
        if (viewDocsBtn && viewDocsBtn.textContent.includes('查看文档')) {
            viewDocsBtn.addEventListener('click', openAPIDocumentation);
        }
        
        // 复制按钮
        const copyButtons = document.querySelectorAll('.card:nth-child(2) .btn-outline');
        copyButtons.forEach(btn => {
            if (btn.textContent.includes('复制')) {
                btn.addEventListener('click', function() {
                    const input = this.previousElementSibling;
                    copyToClipboard(input.value);
                });
            }
        });
        
        // API配置更改
        const rateLimitSelect = document.querySelector('select[class="form-select"]');
        if (rateLimitSelect) {
            rateLimitSelect.addEventListener('change', function() {
                updateAPIRateLimit(this.value);
            });
        }
        
        const whitelistTextarea = document.querySelector('textarea[class="form-control"]');
        if (whitelistTextarea) {
            whitelistTextarea.addEventListener('blur', function() {
                updateWhitelistIPs(this.value);
            });
        }
    }
    
    // 设置偏好设置处理器
    function setupPreferenceHandlers() {
        // 保存设置按钮
        const saveBtn = document.querySelector('.btn-primary');
        if (saveBtn && saveBtn.textContent.includes('保存设置')) {
            saveBtn.addEventListener('click', saveAllSettings);
        }
        
        // 重置为默认按钮
        const resetBtn = document.querySelector('.btn-outline');
        if (resetBtn && resetBtn.textContent.includes('重置为默认')) {
            resetBtn.addEventListener('click', resetToDefaults);
        }
        
        // 偏好设置选择器
        const preferenceSelects = document.querySelectorAll('.card:last-child select');
        preferenceSelects.forEach(select => {
            select.addEventListener('change', function() {
                updatePreferenceSetting(this);
            });
        });
    }
    
    // 显示修改密码模态框
    function showChangePasswordModal() {
        const modalHTML = `
            <div id="change-password-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>修改密码</h3>
                        <button onclick="closeModal('change-password-modal')" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="change-password-form">
                            <div class="form-group">
                                <label class="form-label">当前密码</label>
                                <input type="password" class="form-control" id="current-password" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">新密码</label>
                                <input type="password" class="form-control" id="new-password" required minlength="8">
                                <small class="form-text">密码长度至少8位，包含字母和数字</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码</label>
                                <input type="password" class="form-control" id="confirm-password" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal('change-password-modal')">取消</button>
                        <button type="button" class="btn btn-primary" onclick="submitPasswordChange()">确认修改</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // 显示双重认证管理模态框
    function showTwoFactorModal() {
        const modalHTML = `
            <div id="two-factor-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>双重认证管理</h3>
                        <button onclick="closeModal('two-factor-modal')" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="color: var(--success-color); font-size: 3rem; margin-bottom: 10px;">✓</div>
                            <h4>双重认证已启用</h4>
                            <p style="color: var(--text-color);">您的账户已启用双重认证保护</p>
                        </div>
                        
                        <div class="two-factor-methods">
                            <div class="method-item">
                                <div class="method-icon">📱</div>
                                <div class="method-info">
                                    <h5>验证器应用</h5>
                                    <p>使用Google Authenticator或类似应用</p>
                                    <span class="status active">已启用</span>
                                </div>
                                <button class="btn btn-outline btn-sm">管理</button>
                            </div>
                            
                            <div class="method-item">
                                <div class="method-icon">📧</div>
                                <div class="method-info">
                                    <h5>邮箱验证</h5>
                                    <p>发送验证码到注册邮箱</p>
                                    <span class="status active">已启用</span>
                                </div>
                                <button class="btn btn-outline btn-sm">管理</button>
                            </div>
                            
                            <div class="method-item">
                                <div class="method-icon">📞</div>
                                <div class="method-info">
                                    <h5>短信验证</h5>
                                    <p>发送验证码到手机号</p>
                                    <span class="status inactive">未启用</span>
                                </div>
                                <button class="btn btn-primary btn-sm">启用</button>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background-color: rgba(255, 193, 7, 0.1); border-radius: 8px; border-left: 4px solid var(--warning-color);">
                            <h5 style="color: var(--warning-color); margin-bottom: 10px;">备用恢复码</h5>
                            <p style="margin-bottom: 10px;">请保存这些备用恢复码，当您无法使用主要验证方式时可以使用：</p>
                            <div class="recovery-codes">
                                <code>1234-5678-9012</code>
                                <code>3456-7890-1234</code>
                                <code>5678-9012-3456</code>
                                <code>7890-1234-5678</code>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal('two-factor-modal')">关闭</button>
                        <button type="button" class="btn btn-danger">禁用双重认证</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // 显示登录设备模态框
    function showDevicesModal() {
        const modalHTML = `
            <div id="devices-modal" class="modal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3>登录设备管理</h3>
                        <button onclick="closeModal('devices-modal')" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="devices-list">
                            <div class="device-item current">
                                <div class="device-icon">💻</div>
                                <div class="device-info">
                                    <h5>MacBook Pro <span class="current-badge">当前设备</span></h5>
                                    <p>Chrome 118.0 • macOS Sonoma</p>
                                    <small>最后活动：刚刚 • IP: 192.168.1.100</small>
                                </div>
                                <div class="device-actions">
                                    <span class="status active">活跃</span>
                                </div>
                            </div>
                            
                            <div class="device-item">
                                <div class="device-icon">📱</div>
                                <div class="device-info">
                                    <h5>iPhone 15 Pro</h5>
                                    <p>Safari • iOS 17.1</p>
                                    <small>最后活动：2小时前 • IP: 192.168.1.101</small>
                                </div>
                                <div class="device-actions">
                                    <span class="status active">活跃</span>
                                    <button class="btn btn-outline btn-sm">移除</button>
                                </div>
                            </div>
                            
                            <div class="device-item">
                                <div class="device-icon">🖥️</div>
                                <div class="device-info">
                                    <h5>办公室台式机</h5>
                                    <p>Edge 118.0 • Windows 11</p>
                                    <small>最后活动：昨天 • IP: 203.0.113.45</small>
                                </div>
                                <div class="device-actions">
                                    <span class="status inactive">离线</span>
                                    <button class="btn btn-outline btn-sm">移除</button>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background-color: rgba(0, 123, 255, 0.1); border-radius: 8px;">
                            <h5 style="color: var(--primary-color); margin-bottom: 10px;">安全提示</h5>
                            <ul style="margin: 0; padding-left: 20px; color: var(--text-color);">
                                <li>定期检查登录设备列表</li>
                                <li>移除不认识或不再使用的设备</li>
                                <li>发现异常登录请立即修改密码</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal('devices-modal')">关闭</button>
                        <button type="button" class="btn btn-danger">移除所有其他设备</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // 重新生成API密钥
    function regenerateAPIKey() {
        showConfirmDialog(
            '重新生成API密钥',
            '重新生成API密钥后，当前密钥将立即失效。请确保已更新所有使用此密钥的应用程序。',
            function() {
                // 生成新的API密钥
                const newKey = 'ak_xlt_' + generateRandomString(16);
                userSettings.security.apiKey = newKey;
                
                // 更新显示
                const apiKeyInput = document.querySelector('input[type="password"]');
                if (apiKeyInput) {
                    apiKeyInput.value = newKey;
                }
                
                showToast('API密钥已重新生成', 'success');
                
                // 显示新密钥提示
                setTimeout(() => {
                    showInfoDialog(
                        '新API密钥',
                        `您的新API密钥：<br><code style="background: #f5f5f5; padding: 5px; border-radius: 3px; word-break: break-all;">${newKey}</code><br><br>请妥善保存此密钥，我们不会再次显示。`
                    );
                }, 500);
            }
        );
    }
    
    // 更新通知设置
    function updateNotificationSetting(index, enabled) {
        const notificationTypes = ['verificationResult', 'batchCompletion', 'systemMaintenance', 'smsNotification'];
        if (notificationTypes[index]) {
            userSettings.notifications[notificationTypes[index]] = enabled;
            showToast(
                `${enabled ? '已启用' : '已禁用'}${getNotificationLabel(notificationTypes[index])}`,
                enabled ? 'success' : 'info'
            );
        }
    }
    
    // 打开API文档
    function openAPIDocumentation() {
        const modalHTML = `
            <div id="api-docs-modal" class="modal">
                <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
                    <div class="modal-header">
                        <h3>API文档</h3>
                        <button onclick="closeModal('api-docs-modal')" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" style="overflow-y: auto;">
                        <div class="api-docs">
                            <h4>认证</h4>
                            <p>所有API请求都需要在头部包含您的API密钥：</p>
                            <pre><code>Authorization: Bearer YOUR_API_KEY</code></pre>
                            
                            <h4>验证单个证书</h4>
                            <p><strong>POST</strong> <code>/v1/verify</code></p>
                            <p>请求示例：</p>
                            <pre><code>{
  "certificate_number": "10384120200601546X",
  "student_name": "张三",
  "school": "学链通大学"
}</code></pre>
                            
                            <p>响应示例：</p>
                            <pre><code>{
  "success": true,
  "data": {
    "valid": true,
    "certificate": {
      "number": "10384120200601546X",
      "student_name": "张三",
      "school": "学链通大学",
      "major": "计算机科学与技术",
      "degree": "本科",
      "graduation_date": "2020-06-01"
    },
    "verification_id": "ver_12345"
  }
}</code></pre>
                            
                            <h4>批量验证</h4>
                            <p><strong>POST</strong> <code>/v1/verify/batch</code></p>
                            <p>请求示例：</p>
                            <pre><code>{
  "certificates": [
    {
      "certificate_number": "10384120200601546X",
      "student_name": "张三"
    },
    {
      "certificate_number": "10035120190601782Y",
      "student_name": "李四"
    }
  ]
}</code></pre>
                            
                            <h4>错误码</h4>
                            <table class="error-codes-table">
                                <thead>
                                    <tr>
                                        <th>错误码</th>
                                        <th>说明</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>400</td>
                                        <td>请求参数错误</td>
                                    </tr>
                                    <tr>
                                        <td>401</td>
                                        <td>API密钥无效</td>
                                    </tr>
                                    <tr>
                                        <td>429</td>
                                        <td>请求频率超限</td>
                                    </tr>
                                    <tr>
                                        <td>500</td>
                                        <td>服务器内部错误</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal('api-docs-modal')">关闭</button>
                        <button type="button" class="btn btn-primary" onclick="downloadAPIDoc()">下载文档</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // 更新API频率限制
    function updateAPIRateLimit(newLimit) {
        userSettings.api.rateLimit = newLimit;
        showToast(`API频率限制已更新为 ${newLimit}次/分钟`, 'success');
    }
    
    // 更新白名单IP
    function updateWhitelistIPs(ips) {
        userSettings.api.whitelistIPs = ips;
        if (ips.trim()) {
            showToast('IP白名单已更新', 'success');
        }
    }
    
    // 更新偏好设置
    function updatePreferenceSetting(selectElement) {
        const value = selectElement.value;
        const labels = selectElement.previousElementSibling.textContent;
        
        if (labels.includes('界面语言')) {
            userSettings.preferences.language = value;
            showToast('界面语言设置已更新', 'info');
        } else if (labels.includes('时区设置')) {
            userSettings.preferences.timezone = value;
            showToast('时区设置已更新', 'info');
        } else if (labels.includes('日期格式')) {
            userSettings.preferences.dateFormat = value;
            showToast('日期格式已更新', 'info');
        } else if (labels.includes('主题模式')) {
            userSettings.preferences.theme = value;
            applyTheme(value);
            showToast('主题模式已更新', 'info');
        }
    }
    
    // 保存所有设置
    function saveAllSettings() {
        // 收集表单数据
        const forms = document.querySelectorAll('form, .card');
        
        showProgressModal('正在保存设置...', async function() {
            // 模拟保存过程
            await delay(1500);
            
            // 保存到本地存储
            localStorage.setItem('userSettings', JSON.stringify(userSettings));
            
            closeProgressModal();
            showToast('所有设置已成功保存', 'success');
        });
    }
    
    // 重置为默认设置
    function resetToDefaults() {
        showConfirmDialog(
            '重置设置',
            '确定要将所有设置重置为默认值吗？此操作不可撤销。',
            function() {
                userSettings = {
                    security: {
                        twoFactorEnabled: false,
                        apiKey: 'ak_xlt_' + generateRandomString(16),
                        authorizedDevices: 1
                    },
                    notifications: {
                        verificationResult: true,
                        batchCompletion: true,
                        systemMaintenance: true,
                        smsNotification: false
                    },
                    api: {
                        endpoint: 'https://api.xueli.com/v1/verify',
                        rateLimit: '100',
                        whitelistIPs: ''
                    },
                    preferences: {
                        language: 'zh-CN',
                        timezone: 'Asia/Shanghai',
                        dateFormat: 'YYYY-MM-DD',
                        theme: 'light'
                    }
                };
                
                loadUserSettings();
                showToast('设置已重置为默认值', 'success');
            }
        );
    }
    
    // 加载用户设置
    function loadUserSettings() {
        // 从本地存储加载设置
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
        }
        
        // 应用设置到界面
        applySavedSettings();
    }
    
    // 应用保存的设置到界面
    function applySavedSettings() {
        // 应用通知设置
        const switches = document.querySelectorAll('.switch input[type="checkbox"]');
        const notificationValues = Object.values(userSettings.notifications);
        switches.forEach((switchInput, index) => {
            if (notificationValues[index] !== undefined) {
                switchInput.checked = notificationValues[index];
            }
        });
        
        // 应用API设置
        const rateLimitSelect = document.querySelector('select[class="form-select"]');
        if (rateLimitSelect) {
            rateLimitSelect.value = userSettings.api.rateLimit;
        }
        
        const whitelistTextarea = document.querySelector('textarea[class="form-control"]');
        if (whitelistTextarea) {
            whitelistTextarea.value = userSettings.api.whitelistIPs;
        }
        
        // 应用偏好设置
        const preferenceSelects = document.querySelectorAll('.card:last-child select');
        const preferenceValues = Object.values(userSettings.preferences);
        preferenceSelects.forEach((select, index) => {
            if (preferenceValues[index]) {
                select.value = preferenceValues[index];
            }
        });
        
        // 应用主题
        applyTheme(userSettings.preferences.theme);
    }
    
    // 表单验证
    function setupFormValidation() {
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('form-control')) {
                validateField(e.target);
            }
        });
    }
    
    // 验证字段
    function validateField(field) {
        let isValid = true;
        const value = field.value.trim();
        
        if (field.required && !value) {
            isValid = false;
        } else if (field.type === 'password' && field.minLength && value.length < field.minLength) {
            isValid = false;
        }
        
        field.style.borderColor = isValid ? 'var(--success-color)' : 'var(--danger-color)';
        return isValid;
    }
});

// 添加必要的CSS样式
const settingsStyleSheet = document.createElement('style');
settingsStyleSheet.textContent = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        border-radius: 10px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .modal-header {
        padding: 20px 20px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 20px;
    }
    
    .modal-header h3 {
        margin: 0;
        color: var(--dark-color);
    }
    
    .modal-close {
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-color);
    }
    
    .modal-body {
        padding: 0 20px;
    }
    
    .modal-footer {
        padding: 20px;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--dark-color);
    }
    
    .form-control, .form-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.3s ease;
        background-color: white;
    }
    
    .form-control:focus, .form-select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(58, 123, 213, 0.1);
    }
    
    .form-text {
        font-size: 0.75rem;
        color: var(--text-color);
        margin-top: 5px;
    }
    
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
    
    .btn-danger {
        background: linear-gradient(45deg, #FF5252, #F44336);
        color: white;
    }
    
    .btn-danger:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 82, 82, 0.3);
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
    
    .btn-sm {
        padding: 6px 12px;
        font-size: 13px;
    }
    
    .two-factor-methods {
        margin: 20px 0;
    }
    
    .method-item {
        display: flex;
        align-items: center;
        padding: 15px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-bottom: 10px;
        gap: 15px;
    }
    
    .method-icon {
        font-size: 24px;
        width: 40px;
        text-align: center;
    }
    
    .method-info {
        flex: 1;
    }
    
    .method-info h5 {
        margin: 0 0 5px 0;
        color: var(--dark-color);
    }
    
    .method-info p {
        margin: 0 0 5px 0;
        color: var(--text-color);
        font-size: 0.9rem;
    }
    
    .status {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status.active {
        background-color: rgba(0, 200, 83, 0.1);
        color: var(--success-color);
    }
    
    .status.inactive {
        background-color: rgba(108, 117, 125, 0.1);
        color: var(--text-color);
    }
    
    .recovery-codes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 10px;
    }
    
    .recovery-codes code {
        background: #f8f9fa;
        padding: 8px;
        border-radius: 4px;
        text-align: center;
        font-family: monospace;
    }
    
    .devices-list {
        margin: 20px 0;
    }
    
    .device-item {
        display: flex;
        align-items: center;
        padding: 15px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-bottom: 10px;
        gap: 15px;
    }
    
    .device-item.current {
        border-color: var(--primary-color);
        background-color: rgba(58, 123, 213, 0.05);
    }
    
    .device-icon {
        font-size: 24px;
        width: 40px;
        text-align: center;
    }
    
    .device-info {
        flex: 1;
    }
    
    .device-info h5 {
        margin: 0 0 5px 0;
        color: var(--dark-color);
    }
    
    .device-info p {
        margin: 0 0 5px 0;
        color: var(--text-color);
        font-size: 0.9rem;
    }
    
    .device-info small {
        color: var(--text-color);
        font-size: 0.8rem;
    }
    
    .current-badge {
        background: var(--primary-color);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.7rem;
        margin-left: 8px;
    }
    
    .device-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .api-docs {
        line-height: 1.6;
    }
    
    .api-docs h4 {
        color: var(--primary-color);
        margin: 20px 0 10px 0;
    }
    
    .api-docs pre {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        margin: 10px 0;
    }
    
    .api-docs code {
        background: #f8f9fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
    }
    
    .error-codes-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
    }
    
    .error-codes-table th,
    .error-codes-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }
    
    .error-codes-table th {
        background-color: #f8f9fa;
        font-weight: 500;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .dark-theme {
        background-color: #1a1a1a;
        color: #e0e0e0;
    }
    
    .dark-theme .modal-content {
        background: #2d2d2d;
        color: #e0e0e0;
    }
    
    .dark-theme .form-control,
    .dark-theme .form-select {
        background-color: #3d3d3d;
        border-color: #555;
        color: #e0e0e0;
    }
`;
document.head.appendChild(settingsStyleSheet); 