// 学生主页 JavaScript 文件

// =============== 页面导航与初始化 ===============
document.addEventListener('DOMContentLoaded', function() {
    // 导航菜单交互
    const navLinks = document.querySelectorAll('.nav-link');
    
    // 初始化显示当前活动页面
    showActivePage();
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加active类到当前点击的链接
            this.classList.add('active');
            
            // 更新页面标题
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                pageTitle.textContent = this.querySelector('span').textContent;
            }
            
            // 获取目标页面ID
            const targetHash = this.getAttribute('href').substring(1);
            
            // 显示对应页面内容
            showActivePage(targetHash);
        });
    });
    
    // 初始化各个功能模块
    initializeCertificateInteractions();
    initAuthorizationManagement();
    initMessageCenter();
    initPrivacySettings();
});

// 显示当前活动页面内容
function showActivePage(pageId = 'dashboard') {
    // 隐藏所有页面内容
    document.querySelectorAll('.page-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // 显示当前页面内容
    const currentPage = document.getElementById(`${pageId}-content`);
    if (currentPage) {
        currentPage.style.display = 'block';
    } else if (pageId === 'privacy') {
        // 显示隐私设置模态框
        document.getElementById('modal-backdrop').style.display = 'block';
        document.getElementById('privacy-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else if (pageId === 'messages') {
        // 显示消息中心
        document.getElementById('modal-backdrop').style.display = 'block';
        document.getElementById('all-messages-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 渲染消息
        if (typeof renderAllMessages === 'function') {
            renderAllMessages('all');
        }
    } else if (pageId === 'verification') {
        // 显示授权管理页面
        document.getElementById('modal-backdrop').style.display = 'block';
        document.getElementById('all-authorizations-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 渲染授权记录
        if (typeof renderAllAuthorizations === 'function') {
            renderAllAuthorizations();
        }
    } else if (pageId === 'logout') {
        // 退出登录确认
        if (confirm('确定要退出登录吗？')) {
            showNotification('退出成功', '您已成功退出登录，即将返回登录页面', 'info');
            
            // 模拟跳转到登录页面
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1000);
        } else {
            // 恢复之前的活动菜单
            const activeLink = document.querySelector('.nav-link.active');
            if (activeLink && activeLink.getAttribute('href') !== '#logout') {
                // 保持当前选中
            } else {
                // 恢复到仪表盘
                document.querySelector('.nav-link[href="#dashboard"]').classList.add('active');
                document.querySelector('.page-title').textContent = '学生主页';
            }
        }
    }
}

// =============== 模态框控制 ===============
// 关闭所有模态框
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.getElementById('modal-backdrop').style.display = 'none';
    document.body.style.overflow = 'auto'; // 恢复背景滚动
}

// 显示通知
function showNotification(title, message, type = 'success') {
    const toast = document.getElementById('notification-toast');
    const toastTitle = document.getElementById('notification-title');
    const toastMessage = document.getElementById('notification-message');
    const toastIcon = document.getElementById('notification-icon');
    
    // 设置通知内容
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // 设置通知类型样式
    toast.style.borderLeftColor = type === 'success' ? 'var(--success-color)' : 
                                  type === 'warning' ? 'var(--warning-color)' : 
                                  type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)';
    
    // 设置图标
    if (type === 'success') {
        toastIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>';
        toastIcon.style.color = 'var(--success-color)';
    } else if (type === 'warning') {
        toastIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
        toastIcon.style.color = 'var(--warning-color)';
    } else if (type === 'error') {
        toastIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
        toastIcon.style.color = 'var(--danger-color)';
    } else {
        toastIcon.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
        toastIcon.style.color = 'var(--primary-color)';
    }
    
    // 显示通知
    toast.style.display = 'block';
    
    // 设置自动关闭
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// =============== 授权管理功能 ===============
// 生成18位在线验证码function generateCertificateNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const year = new Date().getFullYear().toString();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const day = new Date().getDate().toString().padStart(2, '0');
    
    // 格式：年份(4位) + 月日(4位) + 时间戳后4位 + 随机数4位 + 校验位2位
    const base = year + month + day + timestamp.slice(-4) + random;
    const checksum = calculateChecksum(base);
    
    return base + checksum;
}

// 计算校验位
function calculateChecksum(str) {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        sum += parseInt(str[i]) * (i + 1);
    }
    return (sum % 100).toString().padStart(2, '0');
}

// 全局授权数据
let currentAuthorizations = [
    {
        id: 1,
        company: '腾讯科技',
        type: '本科学历证书核验授权',
        status: '已使用',
        progress: 100,
        startDate: '2024-09-15',
        endDate: '2024-10-15',
        purpose: '求职背景调查',
        duration: 30,
        usedDate: '2024-09-18',
        certificateNumber: '202409151234567890',
        issuingAuthority: '学链通大学'
    },
    {
        id: 2,
        company: '阿里巴巴集团',
        type: '本科学历证书核验授权',
        status: '有效',
        progress: 60,
        startDate: '2024-09-20',
        endDate: '2024-10-20',
        purpose: '入职资格确认',
        duration: 30,
        usedDate: null,
        certificateNumber: '202409201234567891',
        issuingAuthority: '学链通大学'
    },
    {
        id: 3,
        company: '百度在线',
        type: '硕士学历证书核验授权',
        status: '未使用',
        progress: 0,
        startDate: '2024-09-25',
        endDate: '2024-10-25',
        purpose: '面试资格验证',
        duration: 30,
        usedDate: null,
        certificateNumber: '202409251234567892',
        issuingAuthority: '学链通大学'
    }
];

// 初始化授权管理功能
function initAuthorizationManagement() {
    // 绑定"创建授权"按钮事件 - 授权管理卡片中的创建授权按钮
    const cardTitles = document.querySelectorAll('.card-title');
    let newAuthorizationBtn = null;
    
    cardTitles.forEach(title => {
        if (title.textContent.includes('授权管理')) {
            newAuthorizationBtn = title.parentElement.querySelector('button');
        }
    });
    
    if (newAuthorizationBtn) {
        newAuthorizationBtn.addEventListener('click', function() {
            showNewAuthorizationModal();
        });
    }
    
    // 绑定创建授权表单提交事件
    const submitBtn = document.getElementById('submit-authorization');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            submitNewAuthorization();
        });
    }
    
    // 查看全部授权记录
    const viewAllAuthorizationsBtn = document.querySelector('.card-footer a[href="#authorization"]');
    if (viewAllAuthorizationsBtn) {
        viewAllAuthorizationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAllAuthorizationsModal();
        });
    }
    
    // 初始化渲染授权列表
    renderAuthorizationsList();
}

// 渲染授权列表
function renderAuthorizationsList() {
    const cardTitles = document.querySelectorAll('.card-title');
    let authorizationsContainer = null;
    
    cardTitles.forEach(title => {
        if (title.textContent.includes('授权管理')) {
            authorizationsContainer = title.parentElement.nextElementSibling;
        }
    });
    
    if (!authorizationsContainer) return;
    
    // 清空容器
    authorizationsContainer.innerHTML = '';
    
    // 渲染最新的3个授权
    const recentAuthorizations = currentAuthorizations.slice(0, 3);
    
    recentAuthorizations.forEach((auth, index) => {
        let borderColor, badgeClass, progressColor;
        
        if (auth.status === '已使用') {
            borderColor = 'var(--warning-color)';
            badgeClass = 'badge-warning';
            progressColor = 'var(--warning-color)';
        } else if (auth.status === '有效') {
            borderColor = 'var(--success-color)';
            badgeClass = 'badge-success';
            progressColor = 'var(--success-color)';
        } else {
            borderColor = 'var(--primary-color)';
            badgeClass = 'badge-primary';
            progressColor = 'var(--primary-color)';
        }
        
        const endDateText = auth.status === '已过期' ? '已过期' : `到期时间: ${auth.endDate}`;
        const marginBottom = index < recentAuthorizations.length - 1 ? '15px' : '0';
        
        authorizationsContainer.innerHTML += `
            <div style="border-left: 2px solid ${borderColor}; padding-left: 15px; margin-bottom: ${marginBottom};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 0.9rem; font-weight: 500; color: var(--dark-color);">${auth.company}</span>
                    <span class="badge ${badgeClass}">${auth.status}</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-color); margin-bottom: 10px;">${auth.type}</p>
                <div style="margin-bottom: 10px;">
                    <div style="height: 6px; background-color: var(--light-color); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${auth.progress}%; background-color: ${progressColor};"></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-color);">
                    <span>创建时间: ${auth.startDate}</span>
                    <span>${endDateText}</span>
                </div>
                ${auth.certificateNumber ? `
                <div style="margin-top: 8px; padding: 8px; background-color: rgba(0, 0, 0, 0.02); border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-color);">证书编号:</span>
                        <span style="font-size: 0.8rem; font-family: monospace; color: var(--primary-color); font-weight: 500;">${auth.certificateNumber}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    });
}

// 显示创建授权模态框
function showNewAuthorizationModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('new-authorization-modal');
    
    if (backdrop && modal) {
        backdrop.style.display = 'block';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 重置表单
        const form = document.getElementById('authorization-form');
        const terms = document.getElementById('authorization-terms');
        
        if (form) form.reset();
        if (terms) terms.checked = false;
    }
}

// 提交新的授权
function submitNewAuthorization() {
    const company = document.getElementById('authorization-company').value;
    const certificate = document.getElementById('authorization-certificate').value;
    const duration = document.getElementById('authorization-duration').value;
    const purpose = document.getElementById('authorization-purpose').value;
    const terms = document.getElementById('authorization-terms').checked;
    
    // 表单验证
    if (!company.trim()) {
        showNotification('创建失败', '请输入授权对象名称', 'error');
        return;
    }
    
    if (!certificate) {
        showNotification('创建失败', '请选择要授权的证书', 'error');
        return;
    }
    
    if (!purpose.trim()) {
        showNotification('创建失败', '请填写授权用途', 'error');
        return;
    }
    
    if (!terms) {
        showNotification('创建失败', '请同意授权协议', 'error');
        return;
    }
    
    // 关闭模态框
    closeAllModals();
    
    // 显示创建成功通知
    const companyName = company;
    const certificateName = document.querySelector(`#authorization-certificate option[value="${certificate}"]`).textContent;
    
    showNotification('授权创建成功', `已为${companyName}创建${certificateName}核验授权，有效期${duration}天`, 'success');
    
    // 生成18位在线验证码    const certificateNumber = generateCertificateNumber();
    
    // 添加新授权到列表
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(duration));
    
    const newAuthorization = {
        id: Date.now(),
        company: companyName,
        type: certificateName + '核验授权',
        status: '未使用',
        progress: 0,
        startDate: new Date().toLocaleDateString('zh-CN'),
        endDate: endDate.toLocaleDateString('zh-CN'),
        purpose: purpose,
        duration: parseInt(duration),
        usedDate: null,
        certificateNumber: certificateNumber,
        issuingAuthority: '学链通大学'
    };
    
    // 将新授权添加到列表开头
    currentAuthorizations.unshift(newAuthorization);
    
    // 更新授权列表显示
    renderAuthorizationsList();
    
    // 更新统计数字
    updateAuthorizationsCount();
    
    // 添加新消息通知
    setTimeout(() => {
        showNotification('授权创建完成', '企业可使用授权码进行学历核验', 'info');
    }, 500);
}

// 更新授权统计数字
function updateAuthorizationsCount() {
    const statsCard = document.querySelectorAll('.col-4')[1]; // 授权管理统计卡片
    const countElement = statsCard.querySelector('[style*="font-size: 2rem"]');
    if (countElement) {
        const currentCount = parseInt(countElement.textContent);
        countElement.textContent = currentCount + 1;
    }
}

// 显示全部授权记录模态框
function showAllAuthorizationsModal() {
    // 渲染所有授权记录
    renderAllAuthorizations();
    
    // 显示模态框
    document.getElementById('modal-backdrop').style.display = 'block';
    document.getElementById('all-authorizations-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 绑定模态框内的创建授权按钮
    const createNewBtn = document.getElementById('create-new-authorization');
    if (createNewBtn) {
        createNewBtn.addEventListener('click', function() {
            closeAllModals();
            setTimeout(() => {
                showNewAuthorizationModal();
            }, 100);
        });
    }
}

// 渲染所有授权记录
function renderAllAuthorizations() {
    const allAuthorizationsContent = document.getElementById('all-authorizations-content');
    
    // 使用全局授权数据
    const authorizationsData = currentAuthorizations;
    
    allAuthorizationsContent.innerHTML = authorizationsData.map(auth => `
        <div style="border-bottom: 1px solid var(--border-color); padding: 20px; transition: background-color 0.3s; cursor: pointer;" data-id="${auth.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <h4 style="font-size: 1rem; color: var(--dark-color); margin-bottom: 5px;">${auth.company}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 10px;">${auth.type}</p>
                    <p style="font-size: 0.8rem; color: var(--text-color);">授权用途: ${auth.purpose}</p>
                </div>
                <span class="badge badge-${auth.status === '已使用' ? 'warning' : (auth.status === '有效' ? 'success' : 'primary')}">${auth.status}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 0.85rem; color: var(--text-color);">有效期进度</span>
                    <span style="font-size: 0.85rem; font-weight: 500; color: var(--dark-color);">${auth.progress}%</span>
                </div>
                <div style="height: 6px; background-color: var(--light-color); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${auth.progress}%; background-color: ${auth.status === '已使用' ? 'var(--warning-color)' : (auth.status === '有效' ? 'var(--success-color)' : 'var(--primary-color)')};"></div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-color);">
                <span>创建时间: ${auth.startDate}</span>
                <span>有效期: ${auth.endDate}</span>
            </div>
        </div>
    `).join('');
    
    // 绑定授权记录点击事件
    allAuthorizationsContent.querySelectorAll('[data-id]').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        item.addEventListener('click', function() {
            const authId = parseInt(this.getAttribute('data-id'));
            const auth = authorizationsData.find(a => a.id === authId);
            if (auth) {
                showAuthorizationDetails(auth.company, auth.status, auth.type, '创建时间: ' + auth.startDate, '有效期: ' + auth.endDate);
            }
        });
    });
}

// 显示授权详情
function showAuthorizationDetails(company, status, type, startDate, endDate) {
    // 查找对应的授权数据
    const auth = currentAuthorizations.find(a => a.company === company);
    if (!auth) return;
    
    // 创建授权详情模态框
    const detailModal = document.createElement('div');
    detailModal.id = 'authorization-detail-modal';
    detailModal.className = 'modal';
    detailModal.style.cssText = 'display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; border-radius: 10px; width: 90%; max-width: 600px; z-index: 110; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;';
    
    // 构建详情内容
    detailModal.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.2rem; color: var(--dark-color);">${company}授权详情</h3>
            <button class="modal-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-color); font-size: 1.5rem;">&times;</button>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span class="badge badge-${status === '已使用' ? 'warning' : (status === '有效' ? 'success' : 'primary')}" style="margin-right: 15px;">${status}</span>
                    <p style="margin: 0; font-size: 0.9rem; color: var(--text-color);">${type}</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; background-color: rgba(0, 0, 0, 0.02); padding: 15px; border-radius: 8px;">
                    <div>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-color);">${startDate}</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-color);">${endDate}</p>
                    </div>
                </div>
                
                ${auth.certificateNumber ? `
                <div style="margin-top: 15px; padding: 15px; background-color: rgba(33, 150, 243, 0.05); border-radius: 8px; border: 1px solid rgba(33, 150, 243, 0.2);">
                    <h4 style="margin: 0 0 10px 0; font-size: 1rem; color: var(--dark-color);">证书编号</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 0.9rem; color: var(--text-color);">编号:</span>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1rem; font-family: monospace; color: var(--primary-color); font-weight: 600; letter-spacing: 1px;">${auth.certificateNumber}</span>
                            <button id="copy-certificate-number" style="background: none; border: none; cursor: pointer; color: var(--primary-color); font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--primary-color);">复制</button>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.9rem; color: var(--text-color);">颁发机构:</span>
                        <span style="font-size: 0.9rem; color: var(--dark-color);">${auth.issuingAuthority}</span>
                    </div>
                    <div style="margin-top: 10px; padding: 8px; background-color: rgba(0, 200, 83, 0.05); border-radius: 4px; border-left: 3px solid var(--success-color);">
                        <p style="margin: 0; font-size: 0.8rem; color: var(--text-color);">
                            💡 企业可使用此证书编号和颁发机构在验证平台进行学历核验
                        </p>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                ${auth.status === '未使用' || auth.status === '有效' ? `
                <button id="extend-authorization" style="padding: 10px 20px; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">延长有效期</button>
                ` : ''}
                <button class="modal-close-btn" style="padding: 10px 20px; background-color: var(--light-color); color: var(--text-color); border: none; border-radius: 5px; cursor: pointer;">关闭</button>
            </div>
        </div>
    `;
    
    // 添加到文档
    document.body.appendChild(detailModal);
    
    // 绑定关闭按钮事件
    detailModal.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.body.removeChild(detailModal);
        });
    });
    
    // 绑定延长有效期按钮事件
    const extendBtn = detailModal.querySelector('#extend-authorization');
    if (extendBtn) {
        extendBtn.addEventListener('click', function() {
            extendAuthorizationValidity(auth.id);
            document.body.removeChild(detailModal);
        });
    }
    
    // 绑定复制证书编号按钮事件
    const copyBtn = detailModal.querySelector('#copy-certificate-number');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            copyToClipboard(auth.certificateNumber);
            this.textContent = '已复制';
            this.style.backgroundColor = 'var(--success-color)';
            this.style.color = 'white';
            this.style.borderColor = 'var(--success-color)';
            
            setTimeout(() => {
                this.textContent = '复制';
                this.style.backgroundColor = 'transparent';
                this.style.color = 'var(--primary-color)';
                this.style.borderColor = 'var(--primary-color)';
            }, 2000);
        });
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('复制成功', '证书编号已复制到剪贴板', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// 备用复制方法
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('复制成功', '证书编号已复制到剪贴板', 'success');
    } catch (err) {
        showNotification('复制失败', '请手动复制证书编号', 'error');
    }
    
    document.body.removeChild(textArea);
}

// 延长授权有效期
function extendAuthorizationValidity(authId) {
    const auth = currentAuthorizations.find(a => a.id === authId);
    if (!auth) return;
    
    // 延长30天
    const newEndDate = new Date(auth.endDate);
    newEndDate.setDate(newEndDate.getDate() + 30);
    
    auth.endDate = newEndDate.toLocaleDateString('zh-CN');
    auth.duration += 30;
    
    // 更新显示
    renderAuthorizationsList();
    
    showNotification('延长成功', `授权有效期已延长30天，新到期时间: ${auth.endDate}`, 'success');
}

// =============== 消息中心 ===============
// 初始化消息中心功能
function initMessageCenter() {
    // 模拟消息数据 (实际应用中应该从API获取)
    const messages = [
        {
            id: 1,
            type: 'verification',
            title: '授权核验通知',
            content: '腾讯科技已使用您的学历证书核验授权完成验证，验证时间：2024-09-18 14:30',
            date: '今天 10:25',
            status: 'unread',
            badge: '核验完成',
            badgeType: 'success',
            link: true
        },
        {
            id: 2,
            type: 'verification',
            title: '授权核验通知',
            content: '阿里巴巴集团已使用您的学历证书核验授权完成验证，验证时间：2024-09-20 09:15',
            date: '昨天 16:42',
            status: 'read',
            badge: '核验完成',
            badgeType: 'success',
            link: true
        },
        {
            id: 3,
            type: 'system',
            title: '系统公告',
            content: '学链通平台已升级至v2.1版本，新增授权管理功能，支持企业核验通知。您现在可以主动为企业创建核验授权，并实时接收核验状态通知。',
            date: '3天前',
            status: 'read',
            badge: '系统',
            badgeType: 'primary'
        }
    ];
    
    // 渲染消息到首页
    renderDashboardMessages(messages.slice(0, 3));
    
    // 更新未读消息数量
    updateUnreadCount(messages);
    
    // 标记全部已读按钮
    const cardTitles = document.querySelectorAll('.card-title');
    let markAllReadBtn = null;
    
    cardTitles.forEach(title => {
        if (title.textContent.includes('系统消息')) {
            markAllReadBtn = title.parentElement.querySelector('button');
        }
    });
    
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllAsRead(messages);
            renderDashboardMessages(messages.slice(0, 3));
            showNotification('操作成功', '所有消息已标记为已读', 'success');
        });
    }
    
    // 查看全部消息
    const viewAllMessagesBtn = document.querySelector('.card-footer a[href="#messages"]');
    if (viewAllMessagesBtn) {
        viewAllMessagesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAllMessages(messages);
        });
    }
    
    // 消息中心内的标记全部已读
    const markAllReadBtn2 = document.getElementById('mark-all-read');
    if (markAllReadBtn2) {
        markAllReadBtn2.addEventListener('click', function() {
            markAllAsRead(messages);
            renderAllMessages(messages, document.getElementById('message-filter').value || 'all');
            updateUnreadCount(messages);
            showNotification('操作成功', '所有消息已标记为已读', 'success');
        });
    }
    
    // 消息筛选
    const messageFilter = document.getElementById('message-filter');
    if (messageFilter) {
        messageFilter.addEventListener('change', function() {
            renderAllMessages(messages, this.value);
        });
    }
    
    // 通知图标点击事件
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            showAllMessages(messages);
        });
    }
}

// 渲染首页消息
function renderDashboardMessages(messages) {
    const cardTitles = document.querySelectorAll('.card-title');
    let messageContainer = null;
    
    cardTitles.forEach(title => {
        if (title.textContent.includes('系统消息')) {
            messageContainer = title.parentElement.nextElementSibling;
        }
    });
    
    if (!messageContainer) return;
    messageContainer.innerHTML = '';
    
    messages.forEach(message => {
        const backgroundColor = message.status === 'unread' ? 'rgba(26, 41, 128, 0.05)' : 'transparent';
        
        // 决定图标和背景颜色
        let iconBackground, iconSvg;
        if (message.type === 'verification') {
            iconBackground = 'var(--primary-color)';
            iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z" /></svg>';
        } else if (message.type === 'blockchain') {
            iconBackground = 'var(--success-color)';
            iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>';
        } else if (message.type === 'system') {
            iconBackground = 'var(--primary-light)';
            iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
        }
        
        messageContainer.innerHTML += `
            <div class="message-item" style="border-bottom: 1px solid var(--border-color); padding: 15px 20px; display: flex; align-items: flex-start; background-color: ${backgroundColor}; cursor: pointer;" data-id="${message.id}">
                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${iconBackground}; color: white; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
                    ${iconSvg}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <h4 style="font-size: 0.9rem; font-weight: 500; color: var(--dark-color);">${message.title}</h4>
                        <span style="font-size: 0.8rem; color: var(--text-color);">${message.date}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 10px;">${message.content.length > 80 ? message.content.substring(0, 80) + '...' : message.content}</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${message.badge ? `<span class="badge badge-${message.badgeType}">${message.badge}</span>` : ''}
                        ${message.link ? `<a href="#" class="view-message-detail" data-id="${message.id}" style="font-size: 0.8rem; color: var(--primary-color); text-decoration: none;">查看详情</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    // 绑定消息点击事件
    bindMessageEvents(messages);
}

// 渲染所有消息
function renderAllMessages(messages, filter = 'all') {
    const allMessagesContent = document.getElementById('all-messages-content');
    if (!allMessagesContent) return;
    
    allMessagesContent.innerHTML = '';
    
    // 筛选消息
    let filteredMessages = [...messages];
    if (filter === 'unread') {
        filteredMessages = filteredMessages.filter(msg => msg.status === 'unread');
    } else if (filter === 'system') {
        filteredMessages = filteredMessages.filter(msg => msg.type === 'system');
    } else if (filter === 'verification') {
        filteredMessages = filteredMessages.filter(msg => msg.type === 'verification');
    }
    
    if (filteredMessages.length === 0) {
        allMessagesContent.innerHTML = `<div style="text-align: center; padding: 30px;"><p>暂无消息</p></div>`;
        return;
    }
    
    filteredMessages.forEach(message => {
        const backgroundColor = message.status === 'unread' ? 'rgba(26, 41, 128, 0.05)' : 'transparent';
        
        // 决定图标和背景颜色
        let iconBackground, iconSvg;
        if (message.type === 'verification') {
            iconBackground = 'var(--primary-color)';
            iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z" /></svg>';
        } else if (message.type === 'blockchain') {
            iconBackground = 'var(--success-color)';
            iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>';
        } else if (message.type === 'system') {
            iconBackground = 'var(--primary-light)';
            iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>';
        }
        
        allMessagesContent.innerHTML += `
            <div class="message-item" style="border-bottom: 1px solid var(--border-color); padding: 15px 20px; display: flex; align-items: flex-start; background-color: ${backgroundColor}; cursor: pointer;" data-id="${message.id}">
                <div style="width: 40px; height: 40px; border-radius: 50%; background-color: ${iconBackground}; color: white; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
                    ${iconSvg}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <h4 style="font-size: 0.9rem; font-weight: 500; color: var(--dark-color);">${message.title}</h4>
                        <span style="font-size: 0.8rem; color: var(--text-color);">${message.date}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 10px;">${message.content}</p>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${message.badge ? `<span class="badge badge-${message.badgeType}">${message.badge}</span>` : ''}
                        <button class="mark-message-btn" data-id="${message.id}" style="margin-left: auto; background: none; border: none; font-size: 0.8rem; color: var(--primary-color); cursor: pointer;">${message.status === 'unread' ? '标记已读' : '标记未读'}</button>
                    </div>
                </div>
                ${message.status === 'unread' ? `<div style="width: 8px; height: 8px; background-color: var(--primary-color); border-radius: 50%; margin-left: 10px; flex-shrink: 0;"></div>` : ''}
            </div>
        `;
    });
    
    // 绑定消息点击和标记已读/未读事件
    bindMessageEvents(messages);
    bindMarkReadEvents(messages);
}

// 显示所有消息
function showAllMessages(messages) {
    // 重置筛选条件
    const messageFilter = document.getElementById('message-filter');
    if (messageFilter) {
        messageFilter.value = 'all';
    }
    
    // 渲染所有消息
    renderAllMessages(messages, 'all');
    
    // 显示模态框
    document.getElementById('modal-backdrop').style.display = 'block';
    document.getElementById('all-messages-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 绑定消息点击事件
function bindMessageEvents(messages) {
    document.querySelectorAll('.message-item').forEach(item => {
        item.addEventListener('click', function() {
            const messageId = parseInt(this.getAttribute('data-id'));
            showMessageDetail(messages, messageId);
        });
    });
    
    document.querySelectorAll('.view-message-detail').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止冒泡，避免触发消息项点击
            const messageId = parseInt(this.getAttribute('data-id'));
            showMessageDetail(messages, messageId);
        });
    });
}

// 绑定标记已读/未读事件
function bindMarkReadEvents(messages) {
    document.querySelectorAll('.mark-message-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止冒泡，避免触发消息项点击
            
            const messageId = parseInt(this.getAttribute('data-id'));
            const message = messages.find(msg => msg.id === messageId);
            
            if (message) {
                // 切换状态
                message.status = message.status === 'unread' ? 'read' : 'unread';
                
                // 更新消息列表显示
                renderAllMessages(messages, document.getElementById('message-filter').value || 'all');
                
                // 更新未读消息数量
                updateUnreadCount(messages);
                
                // 通知
                showNotification('状态已更新', message.status === 'read' ? '消息已标记为已读' : '消息已标记为未读', 'success');
            }
        });
    });
}

// 显示消息详情
function showMessageDetail(messages, messageId) {
    const message = messages.find(msg => msg.id === messageId);
    
    if (message) {
        // 标记为已读
        if (message.status === 'unread') {
            message.status = 'read';
            updateUnreadCount(messages);
        }
        
        // 设置详情内容
        const detailTitle = document.getElementById('message-detail-title');
        const detailContent = document.getElementById('message-detail-content');
        
        if (detailTitle) detailTitle.textContent = message.title;
        
        if (detailContent) {
            // 根据消息类型设置不同的详情内容
            if (message.type === 'verification') {
                // 从消息内容中提取企业名称和时间
                const companyMatch = message.content.match(/(.+?)已使用/);
                const timeMatch = message.content.match(/验证时间：(.+)/);
                const company = companyMatch ? companyMatch[1] : '未知企业';
                const verifyTime = timeMatch ? timeMatch[1] : '未知时间';
                
                detailContent.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <p style="margin-bottom: 15px; line-height: 1.6;">${message.content}</p>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <span class="badge badge-${message.badgeType}">${message.badge}</span>
                            <span style="font-size: 0.9rem; color: var(--text-color);">${message.date}</span>
                        </div>
                    </div>
                    <div style="padding: 15px; background-color: rgba(33, 150, 243, 0.05); border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="font-size: 1rem; margin-bottom: 10px; color: var(--dark-color);">核验详情</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">核验企业</p>
                                <p style="font-size: 0.95rem; font-weight: 500; color: var(--dark-color);">${company}</p>
                            </div>
                            <div>
                                <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">核验时间</p>
                                <p style="font-size: 0.95rem; font-weight: 500; color: var(--dark-color);">${verifyTime}</p>
                            </div>
                            <div>
                                <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">核验结果</p>
                                <p style="font-size: 0.95rem; font-weight: 500; color: var(--success-color);">验证成功</p>
                            </div>
                            <div>
                                <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">证书编号</p>
                                <p style="font-size: 0.9rem; font-family: monospace; color: var(--dark-color);">202409151234567890</p>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <button class="view-authorization-btn" style="display: inline-block; padding: 8px 20px; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">查看授权详情</button>
                    </div>
                `;
                
                // 绑定查看授权按钮
                setTimeout(() => {
                    const viewAuthBtn = document.querySelector('.view-authorization-btn');
                    if (viewAuthBtn) {
                        viewAuthBtn.addEventListener('click', function() {
                            // 关闭消息详情
                            closeAllModals();
                            
                            // 显示授权详情
                            setTimeout(() => {
                                showAuthorizationDetails(company, '已使用', '本科学历证书核验授权', '创建时间: 2024-09-15', '有效期: 2024-10-15');
                            }, 100);
                        });
                    }
                }, 0);
            } else {
                // 系统消息
                detailContent.innerHTML = `
                    <div>
                        <p style="margin-bottom: 20px; line-height: 1.6;">${message.content}</p>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <span class="badge badge-${message.badgeType}">${message.badge}</span>
                            <span style="font-size: 0.9rem; color: var(--text-color);">${message.date}</span>
                        </div>
                    </div>
                `;
            }
        }
        
        // 显示模态框
        document.getElementById('modal-backdrop').style.display = 'block';
        document.getElementById('message-detail-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 更新消息列表显示
        renderDashboardMessages(messages.slice(0, 3));
        
        // 更新消息中心
        if (document.getElementById('all-messages-modal').style.display === 'block') {
            renderAllMessages(messages, document.getElementById('message-filter').value || 'all');
        }
    }
}

// 更新未读消息数量
function updateUnreadCount(messages) {
    const unreadCount = messages.filter(msg => msg.status === 'unread').length;
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// 标记所有消息为已读
function markAllAsRead(messages) {
    messages.forEach(message => {
        message.status = 'read';
    });
    
    updateUnreadCount(messages);
}

// =============== 证书交互功能 ===============
// 初始化证书交互功能
function initializeCertificateInteractions() {
    // 证书卡片悬停效果
    const certificateCards = document.querySelectorAll('.certificate-card');
    certificateCards.forEach(card => {
        // 悬停效果
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = 'var(--shadow-md)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow-sm)';
        });
        
        // 点击效果 - 轻微放大后恢复
        card.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-5px)';
        });
    });

    // 为所有证书卡片中的查看详情按钮添加点击事件
    document.querySelectorAll('.certificate-card button:first-child').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.certificate-card');
            const certificateTitle = card.querySelector('h4').textContent;
            
            showCertificateDetail(certificateTitle, card);
        });
    });

    // 为所有证书卡片中的下载证书按钮添加点击事件
    document.querySelectorAll('.certificate-card button:last-child').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.certificate-card');
            const certificateTitle = card.querySelector('h4').textContent;
            
            // 模拟下载过程
            downloadCertificate(certificateTitle);
        });
    });

    // "查看全部"按钮事件
    const cardTitles = document.querySelectorAll('.card-title');
    let viewAllBtn = null;
    
    cardTitles.forEach(title => {
        if (title.textContent.includes('我的学历证书')) {
            viewAllBtn = title.parentElement.querySelector('button');
        }
    });
    
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            showAllCertificates();
        });
    }

    // 添加证书右上角验证标记的动画效果
    certificateCards.forEach(card => {
        const verifyIcon = card.querySelector('svg[fill="var(--success-color)"]');
        if (verifyIcon) {
            // 添加悬停提示
            const tooltip = document.createElement('div');
            tooltip.className = 'verify-tooltip';
            tooltip.innerHTML = `
                <div style="position: absolute; top: -40px; right: 0; background-color: rgba(0, 0, 0, 0.8); 
                            color: white; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem;
                            opacity: 0; transition: opacity 0.3s; pointer-events: none;">
                    已通过区块链验证
                </div>
            `;
            verifyIcon.parentNode.appendChild(tooltip);
            
            // 鼠标悬停时显示提示
            verifyIcon.parentNode.addEventListener('mouseenter', function() {
                tooltip.querySelector('div').style.opacity = '1';
            });
            
            verifyIcon.parentNode.addEventListener('mouseleave', function() {
                tooltip.querySelector('div').style.opacity = '0';
            });
            
            // 添加轻微动画
            verifyIcon.style.transition = 'transform 0.3s';
            verifyIcon.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.2)';
            });
            
            verifyIcon.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }
    });
}

// 下载证书函数
function downloadCertificate(certificateTitle) {
    showNotification('下载开始', `${certificateTitle}下载已开始，请稍等片刻。`, 'info');
    
    // 模拟下载延迟
    setTimeout(() => {
        showNotification('下载完成', `${certificateTitle}已成功下载到您的设备。`, 'success');
    }, 2000);
}

// =============== 隐私设置功能 ===============
// 初始化隐私设置功能
function initPrivacySettings() {
    // 保存设置按钮
    const savePrivacyBtn = document.getElementById('save-privacy');
    if (savePrivacyBtn) {
        savePrivacyBtn.addEventListener('click', function() {
            savePrivacySettings();
        });
    }
    
    // 查看隐私设置
    const privacyBtn = document.querySelector('.nav-link[href="#privacy"]');
    if (privacyBtn) {
        privacyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showPrivacySettings();
        });
    }
    
    // 欢迎卡片上的隐私设置按钮
    const welcomePrivacyBtn = document.querySelector('.card[style*="linear-gradient"] button:nth-child(2)');
    if (welcomePrivacyBtn) {
        welcomePrivacyBtn.addEventListener('click', function() {
            showPrivacySettings();
        });
    }
    
    // 为证书隐私下拉框添加事件监听
    document.querySelectorAll('.privacy-setting').forEach(select => {
        select.addEventListener('change', function() {
            const certificateType = this.getAttribute('data-certificate');
            const privacyLevel = this.value;
            
            // 实际应用中这里会调用API保存设置
            console.log(`更新${certificateType}证书隐私级别为: ${privacyLevel}`);
            
            // 显示预览效果
            showPrivacyPreview(certificateType, privacyLevel);
        });
    });
    
    // 为自动批准复选框添加事件监听
    const autoApprove = document.getElementById('auto-approve');
    if (autoApprove) {
        autoApprove.addEventListener('change', function() {
            const isChecked = this.checked;
            
            // 如果启用自动批准，则禁用新验证请求通知
            if (isChecked) {
                const notifyCheckbox = document.getElementById('notify-new-verification');
                if (notifyCheckbox) {
                    notifyCheckbox.checked = false;
                    notifyCheckbox.disabled = true;
                    notifyCheckbox.parentElement.style.opacity = '0.5';
                }
            } else {
                const notifyCheckbox = document.getElementById('notify-new-verification');
                if (notifyCheckbox) {
                    notifyCheckbox.disabled = false;
                    notifyCheckbox.parentElement.style.opacity = '1';
                }
            }
        });
    }
}

// 显示隐私设置模态框
function showPrivacySettings() {
    document.getElementById('modal-backdrop').style.display = 'block';
    document.getElementById('privacy-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 保存隐私设置
function savePrivacySettings() {
    // 收集所有设置
    const settings = {
        certificates: {
            bachelor: document.querySelector('.privacy-setting[data-certificate="bachelor"]')?.value,
            master: document.querySelector('.privacy-setting[data-certificate="master"]')?.value
        },
        verification: {
            autoApprove: document.getElementById('auto-approve')?.checked,
            notifyNewVerification: document.getElementById('notify-new-verification')?.checked
        },
        dataSharing: {
            shareEducation: document.getElementById('share-education')?.checked,
            shareGrades: document.getElementById('share-grades')?.checked,
            shareAwards: document.getElementById('share-awards')?.checked
        }
    };
    
    // 在实际应用中，这里会调用API保存设置
    console.log('保存隐私设置:', settings);
    
    // 关闭模态框
    closeAllModals();
    
    // 显示成功通知
    showNotification('设置已保存', '您的隐私设置已成功更新', 'success');
    
    // 根据设置更新UI显示
    updateUIBasedOnPrivacySettings(settings);
}

// 显示隐私预览效果
function showPrivacyPreview(certificateType, privacyLevel) {
    // 获取对应证书卡片
    const certificateIndex = certificateType === 'bachelor' ? 0 : 1;
    const certificateCard = document.querySelectorAll('.certificate-card')[certificateIndex];
    
    if (certificateCard) {
        // 移除之前的标记
        certificateCard.querySelectorAll('.privacy-indicator').forEach(indicator => {
            indicator.remove();
        });
        
        // 添加隐私级别指示器
        const indicator = document.createElement('div');
        indicator.className = 'privacy-indicator';
        
        if (privacyLevel === 'public') {
            indicator.innerHTML = `
                <div style="position: absolute; top: 15px; left: 15px; background-color: rgba(0, 200, 83, 0.1); color: var(--success-color); font-size: 0.7rem; padding: 3px 8px; border-radius: 10px; display: flex; align-items: center;">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="margin-right: 4px;">
                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M12,10A5,5 0 0,1 17,15A5,5 0 0,1 12,20A5,5 0 0,1 7,15A5,5 0 0,1 12,10M12,4.5C14.76,4.5 17,6.3 17,8.5V9H7V8.5C7,6.3 9.24,4.5 12,4.5M12,2A6.5,6.5 0 0,0 5.5,8.5V9H4A2,2 0 0,0 2,11V22H22V11A2,2 0 0,0 20,9H18.5V8.5A6.5,6.5 0 0,0 12,2Z" />
                    </svg>
                    公开
                </div>
            `;
            certificateCard.style.opacity = '1';
        } else if (privacyLevel === 'contacts') {
            indicator.innerHTML = `
                <div style="position: absolute; top: 15px; left: 15px; background-color: rgba(255, 152, 0, 0.1); color: var(--warning-color); font-size: 0.7rem; padding: 3px 8px; border-radius: 10px; display: flex; align-items: center;">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="margin-right: 4px;">
                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M12,10A5,5 0 0,1 17,15A5,5 0 0,1 12,20A5,5 0 0,1 7,15A5,5 0 0,1 12,10M12,4.5C14.76,4.5 17,6.3 17,8.5V9H7V8.5C7,6.3 9.24,4.5 12,4.5M12,2A6.5,6.5 0 0,0 5.5,8.5V9H4A2,2 0 0,0 2,11V22H22V11A2,2 0 0,0 20,9H18.5V8.5A6.5,6.5 0 0,0 12,2Z" />
                    </svg>
                    受限
                </div>
            `;
            certificateCard.style.opacity = '0.8';
        } else {
            indicator.innerHTML = `
                <div style="position: absolute; top: 15px; left: 15px; background-color: rgba(255, 82, 82, 0.1); color: var(--danger-color); font-size: 0.7rem; padding: 3px 8px; border-radius: 10px; display: flex; align-items: center;">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="margin-right: 4px;">
                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M12,10A5,5 0 0,1 17,15A5,5 0 0,1 12,20A5,5 0 0,1 7,15A5,5 0 0,1 12,10M12,4.5C14.76,4.5 17,6.3 17,8.5V9H7V8.5C7,6.3 9.24,4.5 12,4.5M12,2A6.5,6.5 0 0,0 5.5,8.5V9H4A2,2 0 0,0 2,11V22H22V11A2,2 0 0,0 20,9H18.5V8.5A6.5,6.5 0 0,0 12,2Z" />
                    </svg>
                    私密
                </div>
            `;
            certificateCard.style.opacity = '0.6';
        }
        
        certificateCard.appendChild(indicator.firstElementChild);
        
        // 应用过渡效果
        certificateCard.style.transition = 'opacity 0.3s ease';
    }
}

// 根据隐私设置更新UI
function updateUIBasedOnPrivacySettings(settings) {
    // 更新证书卡片显示
    settings.certificates.bachelor && showPrivacyPreview('bachelor', settings.certificates.bachelor);
    settings.certificates.master && showPrivacyPreview('master', settings.certificates.master);
    
    // 在实际应用中，这里还会更新其他UI元素
    // 比如根据数据共享设置隐藏或显示某些信息
    if (!settings.dataSharing.shareGrades) {
        // 隐藏成绩相关信息
        document.querySelectorAll('.certificate-card .gpa-info').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    if (!settings.dataSharing.shareAwards) {
        // 隐藏奖项信息
        document.querySelectorAll('.certificate-card .awards-info').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// =============== 初始化绑定事件 ===============
document.addEventListener('DOMContentLoaded', function() {
    // 绑定所有关闭按钮事件
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // 模态框背景点击事件（点击背景关闭模态框）
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeAllModals);
    }
    
    // 防止点击模态框内容时关闭模态框
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // 绑定ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // 绑定欢迎卡片按钮
    const viewCertificateBtn = document.querySelector('.card[style*="linear-gradient"] button:first-child');
    if (viewCertificateBtn) {
        viewCertificateBtn.addEventListener('click', function() {
            // 切换到学历证书页面
            document.querySelector('.nav-link[href="#education"]').click();
        });
    }
    
    // 用户菜单交互
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', function() {
            document.querySelector('.nav-link[href="#settings"]').click();
        });
    }
    
    // 证书查看按钮事件
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-certificate-btn')) {
            // 显示证书详情模态框
            document.getElementById('modal-backdrop').style.display = 'block';
            document.getElementById('certificate-modal').style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // 填充证书详情内容
            const certificateContent = document.getElementById('certificate-content');
            if (certificateContent) {
                certificateContent.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <h3 style="margin-bottom: 20px; color: var(--dark-color);">学历证书详情</h3>
                        <div style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%); border-radius: 10px; padding: 30px; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 15px 0; color: var(--dark-color);">本科学历证书</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
                                <div>
                                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: var(--text-color);">专业</p>
                                    <p style="margin: 0; font-weight: 500; color: var(--dark-color);">计算机科学与技术</p>
                                </div>
                                <div>
                                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: var(--text-color);">毕业院校</p>
                                    <p style="margin: 0; font-weight: 500; color: var(--dark-color);">学链通大学</p>
                                </div>
                                <div>
                                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: var(--text-color);">毕业时间</p>
                                    <p style="margin: 0; font-weight: 500; color: var(--dark-color);">2024年6月</p>
                                </div>
                                <div>
                                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: var(--text-color);">证书状态</p>
                                    <p style="margin: 0; font-weight: 500; color: var(--success-color);">已上链</p>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button style="padding: 10px 20px; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">下载证书</button>
                            <button style="padding: 10px 20px; background-color: var(--success-color); color: white; border: none; border-radius: 5px; cursor: pointer;">分享证书</button>
                        </div>
                    </div>
                `;
            }
        }
    });
});

// =============== 证书详情显示功能 =============== 
// (由于字符限制，此处为简化版本，完整版本会包含所有证书详情、成绩单、研究项目等功能)

// 显示证书详情
function showCertificateDetail(certificateTitle, card) {
    const isUndergraduate = certificateTitle.includes('本科');
    
    // 填充证书详情内容
    const content = document.getElementById('certificate-content');
    if (content) {
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMiAxOUwxOSAxMi41MzQ1VjVMMTIgMTEuNUw1IDVWMTIuNTM0NUwxMiAxOVoiIHN0cm9rZT0iIzFBMjk4MCIgc3Ryb2tlLXdpZHRoPSIyIiAvPjwvc3ZnPg==" alt="学链通大学校徽" style="width: 120px; height: 120px; margin-bottom: 10px;">
                <h2 style="font-size: 1.8rem; color: var(--dark-color); margin-bottom: 5px;">学链通大学</h2>
                <h3 style="font-size: 1.3rem; font-weight: 500; color: var(--text-color); margin: 0;">${certificateTitle}</h3>
            </div>
            
            <div style="background-color: rgba(0, 0, 0, 0.02); border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <h4 style="font-size: 1.1rem; color: var(--dark-color); margin-bottom: 15px;">学生信息</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">姓名</p>
                        <p style="font-size: 1rem; font-weight: 500; color: var(--dark-color);">张力</p>
                    </div>
                    <div>
                        <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">学号</p>
                        <p style="font-size: 1rem; font-weight: 500; color: var(--dark-color);">${isUndergraduate ? '2018110101' : '2022210101'}</p>
                    </div>
                    <div>
                        <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">专业</p>
                        <p style="font-size: 1rem; font-weight: 500; color: var(--dark-color);">计算机科学与技术</p>
                    </div>
                    <div>
                        <p style="font-size: 0.85rem; color: var(--text-color); margin-bottom: 3px;">学位</p>
                        <p style="font-size: 1rem; font-weight: 500; color: var(--dark-color);">${isUndergraduate ? '工学学士' : '工学硕士'}</p>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="download-certificate" style="padding: 12px 25px; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; font-weight: 500; cursor: pointer;">下载证书</button>
                <button id="share-certificate" style="padding: 12px 25px; background-color: white; color: var(--primary-color); border: 1px solid var(--primary-color); border-radius: 5px; font-weight: 500; cursor: pointer;">分享证书</button>
            </div>
        `;
        
        // 显示模态框
        document.getElementById('modal-backdrop').style.display = 'block';
        document.getElementById('certificate-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 绑定下载证书按钮事件
        const downloadBtn = document.getElementById('download-certificate');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                downloadCertificate(certificateTitle);
            });
        }
        
        // 绑定分享证书按钮事件
        const shareBtn = document.getElementById('share-certificate');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                showNotification('分享成功', '证书链接已复制到剪贴板', 'success');
            });
        }
    }
}

// 显示所有证书
function showAllCertificates() {
    showNotification('功能提示', '查看所有证书功能即将上线', 'info');
} 