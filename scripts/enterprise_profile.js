// 企业信息页面 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initializePage();
    
    function initializePage() {
        setupEditHandlers();
        setupFormValidation();
    }
    
    // 设置编辑按钮处理器
    function setupEditHandlers() {
        // 企业基本信息编辑
        const basicInfoEditBtn = document.querySelector('.card .btn-primary');
        if (basicInfoEditBtn) {
            basicInfoEditBtn.addEventListener('click', function() {
                toggleEditMode('basic-info', this);
            });
        }
        
        // 联系信息编辑 - 更精确地定位到联系信息卡片
        const contactCards = document.querySelectorAll('.row .card');
        let contactEditBtn = null;
        contactCards.forEach(card => {
            const title = card.querySelector('.card-title');
            if (title && title.textContent.includes('联系信息')) {
                contactEditBtn = card.querySelector('.btn-outline');
            }
        });
        
        if (contactEditBtn) {
            contactEditBtn.addEventListener('click', function() {
                toggleEditMode('contact-info', this);
            });
        }
        
        // 权限设置按钮 - 精确定位到权限管理卡片
        const permissionCards = document.querySelectorAll('.card');
        let permissionBtn = null;
        permissionCards.forEach(card => {
            const title = card.querySelector('.card-title');
            if (title && title.textContent.includes('权限管理')) {
                permissionBtn = card.querySelector('.btn-outline');
            }
        });
        
        if (permissionBtn) {
            permissionBtn.addEventListener('click', function() {
                showPermissionSettings();
            });
        }
    }
    
    // 切换编辑模式
    function toggleEditMode(section, button) {
        const isEditing = button.textContent.includes('保存');
        
        if (isEditing) {
            // 保存模式
            saveChanges(section, button);
        } else {
            // 编辑模式
            enterEditMode(section, button);
        }
    }
    
    // 进入编辑模式
    function enterEditMode(section, button) {
        let card;
        if (section === 'basic-info') {
            card = document.querySelector('.card:first-child');
        } else if (section === 'contact-info') {
            // 精确定位联系信息卡片
            const cards = document.querySelectorAll('.card');
            cards.forEach(c => {
                const title = c.querySelector('.card-title');
                if (title && title.textContent.includes('联系信息')) {
                    card = c;
                }
            });
        }
        
        if (!card) return;
        
        // 获取所有显示元素
        const displayElements = card.querySelectorAll('.form-display');
        
        displayElements.forEach((display, index) => {
            const currentValue = display.textContent.trim();
            const label = display.previousElementSibling;
            const fieldName = label ? label.textContent : '';
            
            // 创建编辑控件
            let inputElement;
            
            if (fieldName.includes('经营范围') || fieldName.includes('注册地址')) {
                // 长文本使用textarea
                inputElement = document.createElement('textarea');
                inputElement.className = 'form-control';
                inputElement.rows = 3;
                inputElement.value = currentValue;
            } else if (fieldName.includes('经营状态')) {
                // 选择框
                inputElement = document.createElement('select');
                inputElement.className = 'form-select';
                inputElement.innerHTML = `
                    <option value="存续（在营、开业、在册）" ${currentValue.includes('存续') ? 'selected' : ''}>存续（在营、开业、在册）</option>
                    <option value="在业" ${currentValue.includes('在业') ? 'selected' : ''}>在业</option>
                    <option value="迁出" ${currentValue.includes('迁出') ? 'selected' : ''}>迁出</option>
                    <option value="停业" ${currentValue.includes('停业') ? 'selected' : ''}>停业</option>
                `;
            } else if (fieldName.includes('日期')) {
                // 日期输入
                inputElement = document.createElement('input');
                inputElement.type = 'date';
                inputElement.className = 'form-control';
                // 转换日期格式
                const dateMatch = currentValue.match(/(\d{4})年(\d{2})月(\d{2})日/);
                if (dateMatch) {
                    inputElement.value = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                }
            } else {
                // 普通文本输入
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.className = 'form-control';
                inputElement.value = currentValue;
            }
            
            // 添加必填验证
            if (fieldName.includes('企业名称') || fieldName.includes('统一社会信用代码') || 
                fieldName.includes('法定代表人') || fieldName.includes('联系人') || 
                fieldName.includes('联系电话')) {
                inputElement.required = true;
                inputElement.style.borderColor = '#e9ecef';
            }
            
            // 替换显示元素
            display.style.display = 'none';
            display.parentNode.appendChild(inputElement);
            
            // 存储原始值
            inputElement.setAttribute('data-original', currentValue);
        });
        
        // 更新按钮状态
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
                <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
            </svg>
            保存更改
        `;
        button.className = 'btn btn-success btn-sm';
        
        // 添加取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-outline btn-sm';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
            取消
        `;
        
        cancelBtn.addEventListener('click', function() {
            cancelEdit(section, button, this);
        });
        
        button.parentNode.appendChild(cancelBtn);
    }
    
    // 保存更改
    function saveChanges(section, button) {
        let card;
        if (section === 'basic-info') {
            card = document.querySelector('.card:first-child');
        } else if (section === 'contact-info') {
            // 精确定位联系信息卡片
            const cards = document.querySelectorAll('.card');
            cards.forEach(c => {
                const title = c.querySelector('.card-title');
                if (title && title.textContent.includes('联系信息')) {
                    card = c;
                }
            });
        }
        
        if (!card) return;
        
        // 验证表单
        const inputs = card.querySelectorAll('.form-control, .form-select');
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                input.style.borderColor = 'var(--danger-color)';
                isValid = false;
            } else {
                input.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            showToast('请填写所有必填字段', 'error');
            return;
        }
        
        // 保存数据
        inputs.forEach(input => {
            const display = input.parentNode.querySelector('.form-display');
            let newValue = input.value.trim();
            
            // 格式化日期
            if (input.type === 'date' && newValue) {
                const date = new Date(newValue);
                newValue = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
            }
            
            // 更新显示值
            if (display) {
                display.textContent = newValue;
                display.style.display = 'block';
            }
            
            // 移除输入元素
            input.remove();
        });
        
        // 恢复按钮状态
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
            </svg>
            编辑信息
        `;
        button.className = section === 'basic-info' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
        
        // 移除取消按钮
        const cancelBtn = button.parentNode.querySelector('.btn-outline');
        if (cancelBtn && cancelBtn !== button) {
            cancelBtn.remove();
        }
        
        showToast('信息更新成功', 'success');
        
        // 模拟保存到服务器
        console.log(`${section} 信息已保存`);
    }
    
    // 取消编辑
    function cancelEdit(section, saveButton, cancelButton) {
        let card;
        if (section === 'basic-info') {
            card = document.querySelector('.card:first-child');
        } else if (section === 'contact-info') {
            // 精确定位联系信息卡片
            const cards = document.querySelectorAll('.card');
            cards.forEach(c => {
                const title = c.querySelector('.card-title');
                if (title && title.textContent.includes('联系信息')) {
                    card = c;
                }
            });
        }
        
        if (!card) return;
        
        // 恢复原始值
        const inputs = card.querySelectorAll('.form-control, .form-select');
        inputs.forEach(input => {
            const display = input.parentNode.querySelector('.form-display');
            const originalValue = input.getAttribute('data-original');
            
            if (display) {
                display.textContent = originalValue;
                display.style.display = 'block';
            }
            
            input.remove();
        });
        
        // 恢复按钮状态
        saveButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
            </svg>
            编辑信息
        `;
        saveButton.className = section === 'basic-info' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
        
        // 移除取消按钮
        cancelButton.remove();
    }
    
    // 显示权限设置模态框
    function showPermissionSettings() {
        const modalHTML = `
            <div id="permission-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: 10px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: var(--dark-color);">权限设置</h3>
                        <button onclick="closePermissionModal()" style="border: none; background: none; font-size: 24px; cursor: pointer; color: var(--text-color);">&times;</button>
                    </div>
                    
                    <div style="margin-bottom: 25px;">
                        <h4 style="margin-bottom: 15px; color: var(--dark-color);">当前套餐：标准版</h4>
                        <div style="padding: 15px; background-color: rgba(58, 123, 213, 0.1); border-radius: 8px; border-left: 4px solid var(--primary-color);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>月度验证次数</span>
                                <span><strong>10,000次</strong></span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>API调用次数</span>
                                <span><strong>10,000次/月</strong></span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>批量验证</span>
                                <span><strong>1,000条/次</strong></span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>技术支持</span>
                                <span><strong>工作日支持</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 25px;">
                        <h4 style="margin-bottom: 15px; color: var(--dark-color);">升级选项</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="padding: 20px; border: 1px solid var(--border-color); border-radius: 8px; text-align: center;">
                                <h5 style="color: var(--primary-color); margin-bottom: 10px;">企业版</h5>
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--dark-color); margin-bottom: 10px;">¥2,999/月</div>
                                <ul style="text-align: left; color: var(--text-color); font-size: 0.9rem; margin: 15px 0; padding-left: 20px;">
                                    <li>50,000次验证/月</li>
                                    <li>50,000次API调用</li>
                                    <li>5,000条批量验证</li>
                                    <li>7×24小时支持</li>
                                </ul>
                                <button class="btn btn-outline" style="width: 100%;">咨询升级</button>
                            </div>
                            <div style="padding: 20px; border: 2px solid var(--primary-color); border-radius: 8px; text-align: center; position: relative;">
                                <div style="position: absolute; top: -10px; right: 10px; background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">推荐</div>
                                <h5 style="color: var(--primary-color); margin-bottom: 10px;">旗舰版</h5>
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--dark-color); margin-bottom: 10px;">¥9,999/月</div>
                                <ul style="text-align: left; color: var(--text-color); font-size: 0.9rem; margin: 15px 0; padding-left: 20px;">
                                    <li>无限次验证</li>
                                    <li>无限次API调用</li>
                                    <li>无限批量验证</li>
                                    <li>专属客户经理</li>
                                </ul>
                                <button class="btn btn-primary" style="width: 100%;">立即升级</button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <button onclick="closePermissionModal()" class="btn btn-outline">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // 关闭权限模态框
    window.closePermissionModal = function() {
        const modal = document.getElementById('permission-modal');
        if (modal) {
            modal.remove();
        }
    };
    
    // 表单验证
    function setupFormValidation() {
        // 添加输入事件监听器
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('form-control') || e.target.classList.contains('form-select')) {
                validateField(e.target);
            }
        });
    }
    
    // 验证单个字段
    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        if (field.required && !value) {
            isValid = false;
            errorMessage = '此字段为必填项';
        } else if (field.type === 'email' && value && !isValidEmail(value)) {
            isValid = false;
            errorMessage = '请输入有效的邮箱地址';
        } else if (field.type === 'tel' && value && !isValidPhone(value)) {
            isValid = false;
            errorMessage = '请输入有效的电话号码';
        }
        
        // 更新字段样式
        if (isValid) {
            field.style.borderColor = 'var(--success-color)';
            removeFieldError(field);
        } else {
            field.style.borderColor = 'var(--danger-color)';
            showFieldError(field, errorMessage);
        }
        
        return isValid;
    }
    
    // 显示字段错误
    function showFieldError(field, message) {
        removeFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = 'color: var(--danger-color); font-size: 0.75rem; margin-top: 5px;';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }
    
    // 移除字段错误
    function removeFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    // 验证邮箱
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // 验证电话号码
    function isValidPhone(phone) {
        const phoneRegex = /^[\d\-\(\)\+\s]+$/;
        return phoneRegex.test(phone) && phone.length >= 7;
    }
    
    // 通用消息提示
    function showToast(message, type = 'info') {
        // 移除已存在的toast
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
        
        // 根据类型设置颜色
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
        
        // 动画显示
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
});

// 添加必要的CSS样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
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
    
    .btn-success {
        background: linear-gradient(45deg, #00C853, #4CAF50);
        color: white;
    }
    
    .btn-success:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 200, 83, 0.3);
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
`;
document.head.appendChild(styleSheet); 