/**
 * 学链通 - 高校管理平台
 * 学历信息管理功能
 */

// 全局变量
const StudentsManager = {
    students: [],
    filteredStudents: [],
    currentPage: 1,
    pageSize: 5,
    selectedStudents: new Set(),
    currentTab: 'all',
    currentSort: {
        field: 'studentId',
        direction: 'asc'
    }
};

// 初始化函数
document.addEventListener('DOMContentLoaded', function() {
    // 初始化模态框控制
    initModals();
    
    // 初始化表格事件
    initTableEvents();
    
    // 初始化标签页
    initTabs();
    
    // 初始化搜索和筛选
    initFilters();
    
    // 初始化批量上传区域
    initUploadZone();
    
    // 加载模拟数据
    loadMockData();
    
    // 添加新按钮的事件监听
    initAdditionalButtons();
});

// 模拟数据加载
function loadMockData() {
    // 模拟学生数据
    const mockStudents = [
        {
            id: 1, 
            studentId: '2020010001', 
            name: '张三', 
            college: '计算机学院', 
            major: '计算机科学与技术', 
            degree: '本科', 
            enrollYear: 2020, 
            graduateYear: 2024, 
            status: 'verified', 
            blockchainTime: '2024-05-20 14:30',
            gender: '男',
            idCard: '11010120000101****',
            schoolSystem: '4年',
            blockchainHash: '0x7d6a5743a5ef92d8e44f5a8d17d31cb94c7ede087c10e2f498dfccfe8de4babd',
            blockHeight: '1,246,783',
            confirmTime: '2024-05-20 14:30:22'
        },
        {
            id: 2, 
            studentId: '2020010002', 
            name: '李四', 
            college: '计算机学院', 
            major: '软件工程', 
            degree: '本科', 
            enrollYear: 2020, 
            graduateYear: 2024, 
            status: 'pending', 
            blockchainTime: '-',
            gender: '男',
            idCard: '11010120000202****',
            schoolSystem: '4年'
        },
        {
            id: 3, 
            studentId: '2021010003', 
            name: '王五', 
            college: '管理学院', 
            major: '工商管理', 
            degree: '本科', 
            enrollYear: 2021, 
            graduateYear: 2025, 
            status: 'verified', 
            blockchainTime: '2024-05-15 09:45',
            gender: '女',
            idCard: '11010120010303****',
            schoolSystem: '4年',
            blockchainHash: '0x8e5a6743a5ef92d8e44f5a8d17d31cb94c7ede087c10e2f498dfccfe8de4ca87',
            blockHeight: '1,245,921',
            confirmTime: '2024-05-15 09:45:13'
        },
        {
            id: 4, 
            studentId: '2020010004', 
            name: '赵六', 
            college: '理学院', 
            major: '数学与应用数学', 
            degree: '本科', 
            enrollYear: 2020, 
            graduateYear: 2024, 
            status: 'exception', 
            blockchainTime: '-',
            gender: '男',
            idCard: '11010120000404****',
            schoolSystem: '4年',
            exceptionReason: '身份信息不匹配'
        },
        {
            id: 5, 
            studentId: '2022010005', 
            name: '孙七', 
            college: '人文学院', 
            major: '汉语言文学', 
            degree: '本科', 
            enrollYear: 2022, 
            graduateYear: 2026, 
            status: 'pending', 
            blockchainTime: '-',
            gender: '女',
            idCard: '11010120020505****',
            schoolSystem: '4年'
        },
        {
            id: 6, 
            studentId: '2021010006', 
            name: '周八', 
            college: '管理学院', 
            major: '会计学', 
            degree: '本科', 
            enrollYear: 2021, 
            graduateYear: 2025, 
            status: 'rejected', 
            blockchainTime: '-',
            gender: '男',
            idCard: '11010120010606****',
            schoolSystem: '4年',
            rejectReason: '信息不完整'
        },
        {
            id: 7, 
            studentId: '2020010007', 
            name: '吴九', 
            college: '计算机学院', 
            major: '人工智能', 
            degree: '本科', 
            enrollYear: 2020, 
            graduateYear: 2024, 
            status: 'verified', 
            blockchainTime: '2024-04-28 11:20',
            gender: '女',
            idCard: '11010120000707****',
            schoolSystem: '4年',
            blockchainHash: '0x9f4a5743a5ef92d8e44f5a8d17d31cb94c7ede087c10e2f498dfccfe8de4ef56',
            blockHeight: '1,242,105',
            confirmTime: '2024-04-28 11:20:47'
        },
        {
            id: 8, 
            studentId: '2022010008', 
            name: '郑十', 
            college: '理学院', 
            major: '物理学', 
            degree: '本科', 
            enrollYear: 2022, 
            graduateYear: 2026, 
            status: 'pending', 
            blockchainTime: '-',
            gender: '男',
            idCard: '11010120020808****',
            schoolSystem: '4年'
        }
    ];
    
    StudentsManager.students = mockStudents;
    StudentsManager.filteredStudents = [...mockStudents];
    
    // 渲染表格
    renderStudentsTable();
    // 更新状态统计
    updateStatusStats();
}

// 表格渲染
function renderStudentsTable() {
    const tableBody = document.querySelector('.table tbody');
    if (!tableBody) return;
    
    // 计算分页
    const startIndex = (StudentsManager.currentPage - 1) * StudentsManager.pageSize;
    const endIndex = startIndex + StudentsManager.pageSize;
    const displayedStudents = StudentsManager.filteredStudents.slice(startIndex, endIndex);
    
    let tableHTML = '';
    
    if (displayedStudents.length === 0) {
        tableHTML = `<tr><td colspan="11" style="text-align: center;">没有找到匹配的学生记录</td></tr>`;
    } else {
        displayedStudents.forEach(student => {
            const isSelected = StudentsManager.selectedStudents.has(student.id);
            
            let statusBadge = '';
            switch (student.status) {
                case 'verified':
                    statusBadge = '<span class="badge badge-success">已上链</span>';
                    break;
                case 'pending':
                    statusBadge = '<span class="badge badge-warning">待审核</span>';
                    break;
                case 'exception':
                    statusBadge = '<span class="badge badge-danger">异常</span>';
                    break;
                case 'rejected':
                    statusBadge = '<span class="badge badge-danger">已拒绝</span>';
                    break;
                default:
                    statusBadge = '<span class="badge badge-primary">待上链</span>';
            }
            
            tableHTML += `
                <tr data-id="${student.id}">
                    <td>
                        <div class="checkbox-container">
                            <input type="checkbox" id="select-${student.id}" class="checkbox-input" ${isSelected ? 'checked' : ''}>
                            <label for="select-${student.id}" class="checkbox-label"></label>
                        </div>
                    </td>
                    <td>${student.studentId}</td>
                    <td>${student.name}</td>
                    <td>${student.college}</td>
                    <td>${student.major}</td>
                    <td>${student.degree}</td>
                    <td>${student.enrollYear}</td>
                    <td>${student.graduateYear}</td>
                    <td>${statusBadge}</td>
                    <td>${student.blockchainTime}</td>
                    <td>
                        <button class="action-btn view" title="查看详情">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                            </svg>
                        </button>
                        <button class="action-btn edit" title="编辑信息">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                            </svg>
                        </button>
                        ${student.status !== 'verified' ? `
                        <button class="action-btn delete" title="删除">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                            </svg>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = tableHTML;
    
    // 更新分页
    updatePagination();
}

// 更新分页
function updatePagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(StudentsManager.filteredStudents.length / StudentsManager.pageSize);
    const currentPage = StudentsManager.currentPage;
    
    let paginationHTML = '';
    
    // 上一页按钮
    paginationHTML += `
        <div class="pagination-item ${currentPage === 1 ? 'disabled' : ''}" data-page="prev">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
            </svg>
        </div>
    `;
    
    // 页码按钮
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <div class="pagination-item ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</div>
        `;
    }
    
    // 下一页按钮
    paginationHTML += `
        <div class="pagination-item ${currentPage === totalPages ? 'disabled' : ''}" data-page="next">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
            </svg>
        </div>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // 添加页码点击事件
    pagination.querySelectorAll('.pagination-item').forEach(item => {
        item.addEventListener('click', function() {
            const pageAction = this.getAttribute('data-page');
            
            if (pageAction === 'prev' && currentPage > 1) {
                StudentsManager.currentPage--;
            } else if (pageAction === 'next' && currentPage < totalPages) {
                StudentsManager.currentPage++;
            } else if (!isNaN(pageAction)) {
                StudentsManager.currentPage = parseInt(pageAction);
            }
            
            renderStudentsTable();
        });
    });
}

// 模态框初始化
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');
    
    // 查看详情按钮
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn.view')) {
            const row = e.target.closest('tr');
            const studentId = row.querySelector('td:nth-child(2)').textContent;
            const student = getStudentByStudentId(studentId);
            if (student) {
                showStudentDetails(student);
                document.getElementById('studentDetailModal').style.display = 'block';
            }
        }
    });
    
    // 编辑按钮
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn.edit')) {
            const row = e.target.closest('tr');
            const studentId = row.querySelector('td:nth-child(2)').textContent;
            const student = getStudentByStudentId(studentId);
            if (student) {
                populateEditForm(student);
                document.getElementById('editStudentModal').style.display = 'block';
            }
        }
    });
    
    // 添加学生按钮
    const addStudentBtn = document.querySelector('.card-header .btn-primary');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', function() {
            clearEditForm();
            document.getElementById('editStudentModal').style.display = 'block';
            document.querySelector('#editStudentModal .modal-title').textContent = '添加学生';
            document.querySelector('#editStudentModal .btn-primary').textContent = '添加';
        });
    }
    
    // 批量操作按钮
    const batchActionSelect = document.querySelector('.form-select');
    const batchActionBtn = document.querySelector('.card-body .card .btn-primary');
    if (batchActionBtn) {
        batchActionBtn.addEventListener('click', function() {
            if (StudentsManager.selectedStudents.size === 0) {
                showToast('请先选择要操作的学生');
                return;
            }
            
            const action = batchActionSelect.value;
            if (!action) {
                showToast('请选择操作类型');
                return;
            }
            
            if (action === 'upload') {
                document.querySelector('#bulkActionModal .modal-title').textContent = '批量上链确认';
                document.querySelector('#bulkActionModal p strong').textContent = StudentsManager.selectedStudents.size;
                document.getElementById('bulkActionModal').style.display = 'block';
            } else if (action === 'verify') {
                showToast(`已为 ${StudentsManager.selectedStudents.size} 名学生发起批量审核`);
            } else if (action === 'export') {
                showToast('数据导出中，请稍候...');
                setTimeout(() => {
                    showToast('导出完成，文件已保存到下载目录');
                }, 2000);
            } else if (action === 'notify') {
                showToast(`已向 ${StudentsManager.selectedStudents.size} 名学生发送通知`);
            }
        });
    }
    
    // 确认上链按钮
    const confirmUploadBtn = document.querySelector('#bulkActionModal .btn-primary');
    if (confirmUploadBtn) {
        confirmUploadBtn.addEventListener('click', function() {
            const confirmCheck = document.getElementById('confirm-check');
            if (!confirmCheck.checked) {
                showToast('请先确认信息无误');
                return;
            }
            
            // 执行上链操作
            batchUploadToBlockchain();
            
            // 关闭模态框
            document.getElementById('bulkActionModal').style.display = 'none';
        });
    }
    
    // 关闭按钮
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 表单保存按钮
    const saveBtn = document.querySelector('#editStudentModal .btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveStudentData();
        });
    }
    
    // 证书下载按钮
    const downloadCertBtn = document.querySelector('#studentDetailModal .btn-primary');
    if (downloadCertBtn) {
        downloadCertBtn.addEventListener('click', function() {
            const studentName = document.querySelector('#studentDetailModal .modal-body .col:nth-child(2) p').textContent;
            showToast(`正在生成 ${studentName} 的证书，请稍候...`);
            
            setTimeout(() => {
                showToast(`${studentName} 的证书已生成，正在下载`);
            }, 1500);
        });
    }
}

// 显示学生详情
function showStudentDetails(student) {
    const modal = document.getElementById('studentDetailModal');
    
    // 基本信息
    modal.querySelector('.modal-body .col:nth-child(1) p').textContent = student.studentId;
    modal.querySelector('.modal-body .col:nth-child(2) p').textContent = student.name;
    modal.querySelector('.modal-body .col:nth-child(3) p').textContent = student.gender || '男';
    modal.querySelector('.modal-body .col:nth-child(4) p').textContent = student.idCard || '1**************1';
    modal.querySelector('.modal-body .col:nth-child(5) p').textContent = student.college;
    modal.querySelector('.modal-body .col:nth-child(6) p').textContent = student.major;
    modal.querySelector('.modal-body .col:nth-child(7) p').textContent = student.degree;
    modal.querySelector('.modal-body .col:nth-child(8) p').textContent = student.schoolSystem || '4年';
    modal.querySelector('.modal-body .col:nth-child(9) p').textContent = student.enrollYear + '年';
    modal.querySelector('.modal-body .col:nth-child(10) p').textContent = student.graduateYear + '年';
    
    // 区块链信息
    const blockchainInfo = modal.querySelector('.modal-body .col-12 div');
    if (student.status === 'verified') {
        blockchainInfo.innerHTML = `
            <p>交易哈希: ${student.blockchainHash || '0x7d6a5743a5ef92d8e44f5a8d17d31cb94c7ede087c10e2f498dfccfe8de4babd'}</p>
            <p>区块高度: ${student.blockHeight || '1,246,783'}</p>
            <p>确认时间: ${student.confirmTime || '2024-05-20 14:30:22'}</p>
        `;
    } else {
        blockchainInfo.innerHTML = '<p>尚未上链</p>';
    }
    
    // 禁用/启用下载按钮
    const downloadBtn = modal.querySelector('.btn-primary');
    if (downloadBtn) {
        if (student.status === 'verified') {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
        } else {
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = '0.5';
        }
    }
    
    // 更新历史记录表格
    updateHistoryTable(student);
}

// 更新历史记录表格
function updateHistoryTable(student) {
    const historyTable = document.querySelector('#studentDetailModal .table tbody');
    if (!historyTable) return;
    
    // 生成模拟历史记录
    let historyHTML = '';
    
    // 基本信息录入记录
    historyHTML += `
        <tr>
            <td>信息录入</td>
            <td>admin</td>
            <td>${student.enrollYear}-09-01 10:15</td>
            <td>初始信息录入</td>
        </tr>
    `;
    
    // 可能的修改记录
    if (Math.random() > 0.5) {
        historyHTML += `
            <tr>
                <td>信息修改</td>
                <td>王老师</td>
                <td>2024-04-15 09:30</td>
                <td>更新专业信息</td>
            </tr>
        `;
    }
    
    // 上链记录
    if (student.status === 'verified') {
        historyHTML += `
            <tr>
                <td>上链操作</td>
                <td>李主任</td>
                <td>${student.blockchainTime}</td>
                <td>学历信息上链</td>
            </tr>
        `;
    }
    
    // 其他可能的记录
    if (student.status === 'exception') {
        historyHTML += `
            <tr>
                <td>异常标记</td>
                <td>系统</td>
                <td>2024-05-10 16:45</td>
                <td>${student.exceptionReason || '身份信息不匹配'}</td>
            </tr>
        `;
    }
    
    if (student.status === 'rejected') {
        historyHTML += `
            <tr>
                <td>审核拒绝</td>
                <td>赵审核员</td>
                <td>2024-05-12 14:20</td>
                <td>${student.rejectReason || '信息不完整'}</td>
            </tr>
        `;
    }
    
    historyTable.innerHTML = historyHTML;
}

// 获取学生信息
function getStudentByStudentId(studentId) {
    return StudentsManager.students.find(s => s.studentId === studentId);
}

// 批量上链操作
function batchUploadToBlockchain() {
    // 获取选中的学生
    const selectedStudentIds = Array.from(StudentsManager.selectedStudents);
    let count = 0;
    
    // 更新状态
    selectedStudentIds.forEach(id => {
        const student = StudentsManager.students.find(s => s.id === id);
        if (student && student.status !== 'verified') {
            student.status = 'verified';
            student.blockchainTime = getCurrentDateTime();
            student.blockchainHash = `0x${Array(40).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
            student.blockHeight = `1,${Math.floor(Math.random() * 10000) + 1240000}`;
            student.confirmTime = student.blockchainTime;
            count++;
        }
    });
    
    // 更新UI
    applyFilters();
    renderStudentsTable();
    updateStatusStats();
    
    // 显示提示
    showToast(`成功将 ${count} 名学生信息上链`);
}

// 获取当前日期时间
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 清空编辑表单
function clearEditForm() {
    const form = document.getElementById('editStudentModal');
    
    // 检查表单中是否有这些元素
    if (form.querySelector('input[name="studentId"]')) {
        form.querySelector('input[name="studentId"]').value = '';
        form.querySelector('input[name="studentId"]').readOnly = false;
    } else {
        // 适配原始HTML的表单
        const studentIdInput = form.querySelector('.col:nth-child(1) input');
        if (studentIdInput) {
            studentIdInput.value = '';
            studentIdInput.readOnly = false;
        }
    }
    
    // 适配命名字段或位置
    const nameInput = form.querySelector('input[name="name"]') || form.querySelector('.col:nth-child(2) input');
    if (nameInput) nameInput.value = '';
    
    const genderSelect = form.querySelector('select[name="gender"]') || form.querySelector('.col:nth-child(3) select');
    if (genderSelect) genderSelect.value = 'male';
    
    const idCardInput = form.querySelector('input[name="idCard"]') || form.querySelector('.col:nth-child(4) input');
    if (idCardInput) idCardInput.value = '';
    
    const collegeSelect = form.querySelector('select[name="college"]') || form.querySelector('.col:nth-child(5) select');
    if (collegeSelect) collegeSelect.value = 'computer';
    
    const majorSelect = form.querySelector('select[name="major"]') || form.querySelector('.col:nth-child(6) select');
    if (majorSelect) majorSelect.value = 'cs';
    
    const degreeSelect = form.querySelector('select[name="degree"]') || form.querySelector('.col:nth-child(7) select');
    if (degreeSelect) degreeSelect.value = 'bachelor';
    
    const schoolSystemSelect = form.querySelector('select[name="schoolSystem"]') || form.querySelector('.col:nth-child(8) select');
    if (schoolSystemSelect) schoolSystemSelect.value = '4';
    
    const enrollYearInput = form.querySelector('input[name="enrollYear"]') || form.querySelector('.col:nth-child(9) input');
    if (enrollYearInput) enrollYearInput.value = new Date().getFullYear();
    
    const graduateYearInput = form.querySelector('input[name="graduateYear"]') || form.querySelector('.col:nth-child(10) input');
    if (graduateYearInput) graduateYearInput.value = new Date().getFullYear() + 4;
    
    const remarkTextarea = form.querySelector('textarea[name="remark"]') || form.querySelector('.col:nth-child(13) textarea');
    if (remarkTextarea) remarkTextarea.value = '';
}

// 填充编辑表单
function populateEditForm(student) {
    const form = document.getElementById('editStudentModal');
    
    // 更新标题和按钮
    const titleElement = form.querySelector('.modal-title');
    if (titleElement) titleElement.textContent = '编辑学生信息';
    
    const primaryBtn = form.querySelector('.btn-primary');
    if (primaryBtn) primaryBtn.textContent = '保存更改';
    
    // 填充表单字段
    const studentIdInput = form.querySelector('input[name="studentId"]') || form.querySelector('.col:nth-child(1) input');
    if (studentIdInput) {
        studentIdInput.value = student.studentId;
        studentIdInput.readOnly = true;
    }
    
    const nameInput = form.querySelector('input[name="name"]') || form.querySelector('.col:nth-child(2) input');
    if (nameInput) nameInput.value = student.name;
    
    const genderSelect = form.querySelector('select[name="gender"]') || form.querySelector('.col:nth-child(3) select');
    if (genderSelect) genderSelect.value = student.gender === '男' ? 'male' : 'female';
    
    const idCardInput = form.querySelector('input[name="idCard"]') || form.querySelector('.col:nth-child(4) input');
    if (idCardInput) idCardInput.value = student.idCard || '';
    
    const collegeSelect = form.querySelector('select[name="college"]') || form.querySelector('.col:nth-child(5) select');
    if (collegeSelect) collegeSelect.value = getCollegeValue(student.college);
    
    const majorSelect = form.querySelector('select[name="major"]') || form.querySelector('.col:nth-child(6) select');
    if (majorSelect) majorSelect.value = getMajorValue(student.major);
    
    const degreeSelect = form.querySelector('select[name="degree"]') || form.querySelector('.col:nth-child(7) select');
    if (degreeSelect) degreeSelect.value = getDegreeValue(student.degree);
    
    const schoolSystemSelect = form.querySelector('select[name="schoolSystem"]') || form.querySelector('.col:nth-child(8) select');
    if (schoolSystemSelect) schoolSystemSelect.value = student.schoolSystem ? student.schoolSystem.replace('年', '') : '4';
    
    const enrollYearInput = form.querySelector('input[name="enrollYear"]') || form.querySelector('.col:nth-child(9) input');
    if (enrollYearInput) enrollYearInput.value = student.enrollYear;
    
    const graduateYearInput = form.querySelector('input[name="graduateYear"]') || form.querySelector('.col:nth-child(10) input');
    if (graduateYearInput) graduateYearInput.value = student.graduateYear;
    
    const remarkTextarea = form.querySelector('textarea[name="remark"]') || form.querySelector('.col:nth-child(13) textarea');
    if (remarkTextarea) remarkTextarea.value = student.remark || '';
}

// 保存学生数据
function saveStudentData() {
    const form = document.getElementById('editStudentModal');
    
    // 确定是否为新学生
    const studentIdInput = form.querySelector('input[name="studentId"]') || form.querySelector('.col:nth-child(1) input');
    const isNewStudent = studentIdInput && studentIdInput.readOnly === false;
    
    // 收集表单数据
    const studentData = {
        studentId: studentIdInput ? studentIdInput.value : '',
        name: (form.querySelector('input[name="name"]') || form.querySelector('.col:nth-child(2) input'))?.value || '',
        gender: (form.querySelector('select[name="gender"]') || form.querySelector('.col:nth-child(3) select'))?.value === 'male' ? '男' : '女',
        idCard: (form.querySelector('input[name="idCard"]') || form.querySelector('.col:nth-child(4) input'))?.value || '',
        college: getCollegeName((form.querySelector('select[name="college"]') || form.querySelector('.col:nth-child(5) select'))?.value || 'computer'),
        major: getMajorName((form.querySelector('select[name="major"]') || form.querySelector('.col:nth-child(6) select'))?.value || 'cs'),
        degree: getDegreeName((form.querySelector('select[name="degree"]') || form.querySelector('.col:nth-child(7) select'))?.value || 'bachelor'),
        schoolSystem: ((form.querySelector('select[name="schoolSystem"]') || form.querySelector('.col:nth-child(8) select'))?.value || '4') + '年',
        enrollYear: parseInt((form.querySelector('input[name="enrollYear"]') || form.querySelector('.col:nth-child(9) input'))?.value || new Date().getFullYear()),
        graduateYear: parseInt((form.querySelector('input[name="graduateYear"]') || form.querySelector('.col:nth-child(10) input'))?.value || (new Date().getFullYear() + 4)),
        remark: (form.querySelector('textarea[name="remark"]') || form.querySelector('.col:nth-child(13) textarea'))?.value || '',
        status: 'pending',
        blockchainTime: '-'
    };
    
    // 验证表单
    if (!validateStudentForm(studentData)) {
        return;
    }
    
    if (isNewStudent) {
        // 添加新学生
        studentData.id = StudentsManager.students.length > 0 ? 
            Math.max(...StudentsManager.students.map(s => s.id)) + 1 : 1;
        StudentsManager.students.push(studentData);
        showToast('学生添加成功');
    } else {
        // 更新现有学生
        const index = StudentsManager.students.findIndex(s => s.studentId === studentData.studentId);
        if (index !== -1) {
            // 保留原有ID和状态
            studentData.id = StudentsManager.students[index].id;
            studentData.status = StudentsManager.students[index].status;
            studentData.blockchainTime = StudentsManager.students[index].blockchainTime;
            
            // 如果是已上链状态，保留区块链信息
            if (studentData.status === 'verified') {
                studentData.blockchainHash = StudentsManager.students[index].blockchainHash;
                studentData.blockHeight = StudentsManager.students[index].blockHeight;
                studentData.confirmTime = StudentsManager.students[index].confirmTime;
            }
            
            StudentsManager.students[index] = studentData;
            showToast('学生信息更新成功');
        }
    }
    
    // 更新表格和关闭模态框
    applyFilters();
    renderStudentsTable();
    updateStatusStats();
    document.getElementById('editStudentModal').style.display = 'none';
}

// 校验学生表单
function validateStudentForm(data) {
    if (!data.studentId) {
        showToast('请输入学号');
        return false;
    }
    if (!data.name) {
        showToast('请输入姓名');
        return false;
    }
    if (!data.idCard) {
        showToast('请输入身份证号');
        return false;
    }
    if (isNaN(data.enrollYear) || data.enrollYear < 1900 || data.enrollYear > 2100) {
        showToast('请输入有效的入学年份');
        return false;
    }
    if (isNaN(data.graduateYear) || data.graduateYear < data.enrollYear) {
        showToast('毕业年份必须大于入学年份');
        return false;
    }
    return true;
}

// 添加额外的交互按钮
function initAdditionalButtons() {
    // 添加批量导出按钮
    addExportButton();
    
    // 添加刷新按钮
    addRefreshButton();
    
    // 添加批量审核按钮
    addBatchVerifyButton();
    
    // 添加批量上链按钮
    addBatchUploadButton();
    
    // 添加一键认证按钮
    addQuickVerifyButton();
}

// 添加批量导出按钮
function addExportButton() {
    const filterSection = document.querySelector('.filter-section');
    if (!filterSection) return;
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline';
    exportBtn.style.marginLeft = '10px';
    exportBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M12,18C9.95,18 8.19,16.76 7.42,15H9.13C9.76,15.9 10.81,16.5 12,16.5A3.5,3.5 0 0,0 15.5,13A3.5,3.5 0 0,0 12,9.5C10.65,9.5 9.5,10.28 8.9,11.4L10.5,13H7V9.5L8.56,11.06C9.47,9.8 10.67,9 12,9A5,5 0 0,1 17,14A5,5 0 0,1 12,19" />
        </svg>
        导出数据
    `;
    
    exportBtn.addEventListener('click', function() {
        if (StudentsManager.filteredStudents.length === 0) {
            showToast('没有可导出的数据');
            return;
        }
        
        showToast('正在准备导出数据，请稍候...');
        
        setTimeout(() => {
            showToast('数据导出成功，文件已保存到下载目录');
        }, 1500);
    });
    
    filterSection.appendChild(exportBtn);
}

// 添加刷新按钮
function addRefreshButton() {
    const filterSection = document.querySelector('.filter-section');
    if (!filterSection) return;
    
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-outline';
    refreshBtn.style.marginLeft = '10px';
    refreshBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
        </svg>
        刷新
    `;
    
    refreshBtn.addEventListener('click', function() {
        // 重置筛选条件
        document.querySelector('.search-input').value = '';
        document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
            dropdown.selectedIndex = 0;
        });
        
        // 重置标签页
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === 'all') {
                tab.classList.add('active');
            }
        });
        
        // 更新数据
        StudentsManager.currentTab = 'all';
        StudentsManager.currentPage = 1;
        applyFilters();
        renderStudentsTable();
        
        showToast('数据已刷新');
    });
    
    filterSection.appendChild(refreshBtn);
}

// 添加批量审核按钮
function addBatchVerifyButton() {
    // 检查表格区域
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;
    
    // 创建批量审核按钮
    const batchActionsDiv = document.createElement('div');
    batchActionsDiv.className = 'batch-actions';
    batchActionsDiv.style.marginBottom = '20px';
    batchActionsDiv.style.display = 'flex';
    batchActionsDiv.style.gap = '10px';
    
    const verifyBtn = document.createElement('button');
    verifyBtn.className = 'btn btn-primary btn-sm';
    verifyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
        </svg>
        批量审核
    `;
    
    verifyBtn.addEventListener('click', function() {
        if (StudentsManager.selectedStudents.size === 0) {
            showToast('请先选择要审核的学生');
            return;
        }
        
        const pendingCount = Array.from(StudentsManager.selectedStudents).filter(id => {
            const student = StudentsManager.students.find(s => s.id === id);
            return student && student.status === 'pending';
        }).length;
        
        if (pendingCount === 0) {
            showToast('所选学生中没有待审核的记录');
            return;
        }
        
        showToast(`正在审核 ${pendingCount} 名学生的信息，请稍候...`);
        
        setTimeout(() => {
            showToast(`已完成 ${pendingCount} 名学生的审核`);
        }, 1500);
    });
    
    batchActionsDiv.appendChild(verifyBtn);
    
    // 插入到表格前面
    tableContainer.parentNode.insertBefore(batchActionsDiv, tableContainer);
}

// 添加批量上链按钮
function addBatchUploadButton() {
    // 检查批量操作区域
    const batchActionsDiv = document.querySelector('.batch-actions');
    if (!batchActionsDiv) return;
    
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn btn-success btn-sm';
    uploadBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
            <path d="M17,7H13V3H7V7H3V21H17V7M10,19H7V16H10V19M10,14H7V11H10V14M14,19H11V16H14V19M14,14H11V11H14V14M14,7H10V5H14V7Z" />
        </svg>
        一键上链
    `;
    
    uploadBtn.addEventListener('click', function() {
        if (StudentsManager.selectedStudents.size === 0) {
            showToast('请先选择要上链的学生');
            return;
        }
        
        // 打开确认对话框
        document.querySelector('#bulkActionModal .modal-title').textContent = '批量上链确认';
        document.querySelector('#bulkActionModal p strong').textContent = StudentsManager.selectedStudents.size;
        document.getElementById('bulkActionModal').style.display = 'block';
    });
    
    batchActionsDiv.appendChild(uploadBtn);
}

// 添加一键认证按钮
function addQuickVerifyButton() {
    // 检查批量操作区域
    const batchActionsDiv = document.querySelector('.batch-actions');
    if (!batchActionsDiv) return;
    
    const quickVerifyBtn = document.createElement('button');
    quickVerifyBtn.className = 'btn btn-warning btn-sm';
    quickVerifyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 5px; vertical-align: text-top;">
            <path d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z" />
        </svg>
        身份认证
    `;
    
    quickVerifyBtn.addEventListener('click', function() {
        if (StudentsManager.selectedStudents.size === 0) {
            showToast('请先选择要认证的学生');
            return;
        }
        
        showToast('正在发起身份认证，请稍候...');
        
        setTimeout(() => {
            const successCount = Math.floor(StudentsManager.selectedStudents.size * 0.9);
            const failCount = StudentsManager.selectedStudents.size - successCount;
            
            if (failCount > 0) {
                showToast(`认证完成：${successCount}人成功，${failCount}人失败`);
            } else {
                showToast(`${successCount}人身份认证成功`);
            }
        }, 2000);
    });
    
    batchActionsDiv.appendChild(quickVerifyBtn);
}

// 辅助函数：学院值转换
function getCollegeValue(collegeName) {
    const collegeMap = {
        '计算机学院': 'computer',
        '管理学院': 'management',
        '理学院': 'science',
        '人文学院': 'humanities'
    };
    return collegeMap[collegeName] || 'computer';
}

function getCollegeName(collegeValue) {
    const collegeMap = {
        'computer': '计算机学院',
        'management': '管理学院',
        'science': '理学院',
        'humanities': '人文学院'
    };
    return collegeMap[collegeValue] || '计算机学院';
}

// 辅助函数：专业值转换
function getMajorValue(majorName) {
    const majorMap = {
        '计算机科学与技术': 'cs',
        '软件工程': 'se',
        '人工智能': 'ai',
        '信息安全': 'is',
        '工商管理': 'ba',
        '会计学': 'acc',
        '数学与应用数学': 'math',
        '物理学': 'phy',
        '汉语言文学': 'chinese'
    };
    return majorMap[majorName] || 'cs';
}

function getMajorName(majorValue) {
    const majorMap = {
        'cs': '计算机科学与技术',
        'se': '软件工程',
        'ai': '人工智能',
        'is': '信息安全',
        'ba': '工商管理',
        'acc': '会计学',
        'math': '数学与应用数学',
        'phy': '物理学',
        'chinese': '汉语言文学'
    };
    return majorMap[majorValue] || '计算机科学与技术';
}

// 辅助函数：学历值转换
function getDegreeValue(degreeName) {
    const degreeMap = {
        '本科': 'bachelor',
        '硕士': 'master',
        '博士': 'doctor'
    };
    return degreeMap[degreeName] || 'bachelor';
}

function getDegreeName(degreeValue) {
    const degreeMap = {
        'bachelor': '本科',
        'master': '硕士',
        'doctor': '博士'
    };
    return degreeMap[degreeValue] || '本科';
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

// 表格事件初始化
function initTableEvents() {
    const tableBody = document.querySelector('.table tbody');
    if (!tableBody) return;
    
    // 表格点击事件委托
    tableBody.addEventListener('click', function(e) {
        // 复选框点击
        if (e.target.classList.contains('checkbox-input')) {
            const row = e.target.closest('tr');
            const studentId = parseInt(row.getAttribute('data-id'));
            
            if (e.target.checked) {
                StudentsManager.selectedStudents.add(studentId);
            } else {
                StudentsManager.selectedStudents.delete(studentId);
            }
            
            // 检查是否需要更新"全选"复选框
            updateSelectAllCheckbox();
        }
        
        // 删除按钮
        if (e.target.closest('.action-btn.delete')) {
            const row = e.target.closest('tr');
            const studentId = parseInt(row.getAttribute('data-id'));
            
            if (confirm('确定要删除该学生记录吗？此操作不可恢复。')) {
                deleteStudent(studentId);
            }
        }
    });
    
    // 全选复选框
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('tbody .checkbox-input');
            
            checkboxes.forEach(checkbox => {
                const row = checkbox.closest('tr');
                const studentId = parseInt(row.getAttribute('data-id'));
                
                if (this.checked) {
                    checkbox.checked = true;
                    StudentsManager.selectedStudents.add(studentId);
                } else {
                    checkbox.checked = false;
                    StudentsManager.selectedStudents.delete(studentId);
                }
            });
        });
    }
    
    // 表头排序事件
    const tableHeaders = document.querySelectorAll('.table th:not(:first-child):not(:last-child)');
    tableHeaders.forEach((th, index) => {
        // 添加排序图标
        const headerContent = th.innerHTML;
        th.innerHTML = `
            <div class="th-content" data-field="${getFieldNameByIndex(index)}">
                ${headerContent}
                <span class="sort-icon"></span>
            </div>
        `;
        
        // 添加样式
        const thContent = th.querySelector('.th-content');
        thContent.style.display = 'flex';
        thContent.style.alignItems = 'center';
        thContent.style.cursor = 'pointer';
        
        const sortIcon = th.querySelector('.sort-icon');
        sortIcon.style.width = '16px';
        sortIcon.style.height = '16px';
        sortIcon.style.marginLeft = '4px';
        
        // 添加点击事件
        thContent.addEventListener('click', function() {
            const field = this.getAttribute('data-field');
            
            // 切换排序方向
            if (StudentsManager.currentSort.field === field) {
                StudentsManager.currentSort.direction = StudentsManager.currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                StudentsManager.currentSort.field = field;
                StudentsManager.currentSort.direction = 'asc';
            }
            
            // 进行排序
            sortStudents();
            
            // 更新表头图标
            updateSortIcons();
            
            // 重新渲染表格
            renderStudentsTable();
        });
    });
}

// 获取表头对应的字段名
function getFieldNameByIndex(index) {
    const fields = [
        'studentId',
        'name',
        'college',
        'major',
        'degree',
        'enrollYear',
        'graduateYear',
        'status',
        'blockchainTime'
    ];
    return fields[index];
}

// 更新排序图标
function updateSortIcons() {
    const tableHeaders = document.querySelectorAll('.table th:not(:first-child):not(:last-child)');
    
    tableHeaders.forEach((th, index) => {
        const field = getFieldNameByIndex(index);
        const sortIcon = th.querySelector('.sort-icon');
        
        if (field === StudentsManager.currentSort.field) {
            if (StudentsManager.currentSort.direction === 'asc') {
                sortIcon.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M7,15L12,10L17,15H7Z" />
                    </svg>
                `;
            } else {
                sortIcon.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M7,10L12,15L17,10H7Z" />
                    </svg>
                `;
            }
        } else {
            sortIcon.innerHTML = '';
        }
    });
}

// 排序学生数据
function sortStudents() {
    const { field, direction } = StudentsManager.currentSort;
    
    StudentsManager.filteredStudents.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];
        
        // 特殊处理状态字段
        if (field === 'status') {
            valueA = getStatusWeight(valueA);
            valueB = getStatusWeight(valueB);
        }
        
        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

// 状态权重
function getStatusWeight(status) {
    const weights = {
        'verified': 1,
        'pending': 2,
        'exception': 3,
        'rejected': 4
    };
    return weights[status] || 999;
}

// 删除学生
function deleteStudent(studentId) {
    const index = StudentsManager.students.findIndex(s => s.id === studentId);
    if (index !== -1) {
        // 移除选中集合中的学生
        StudentsManager.selectedStudents.delete(studentId);
        
        // 从数组中移除
        StudentsManager.students.splice(index, 1);
        
        // 更新过滤后的数组
        applyFilters();
        
        // 如果当前页已经没有数据，且不是第1页，则回到上一页
        if (StudentsManager.filteredStudents.length <= (StudentsManager.currentPage - 1) * StudentsManager.pageSize && StudentsManager.currentPage > 1) {
            StudentsManager.currentPage--;
        }
        
        // 重新渲染表格
        renderStudentsTable();
        
        // 更新状态统计
        updateStatusStats();
        
        showToast('学生记录已删除');
    }
}

// 更新"全选"复选框
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    if (!selectAllCheckbox) return;
    
    const checkboxes = document.querySelectorAll('tbody .checkbox-input');
    const checkedCount = document.querySelectorAll('tbody .checkbox-input:checked').length;
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

// 标签页初始化
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 更新标签状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 更新当前标签
            StudentsManager.currentTab = tabId;
            
            // 重置到第一页
            StudentsManager.currentPage = 1;
            
            // 应用过滤
            applyFilters();
            
            // 重新渲染表格
            renderStudentsTable();
        });
    });
}

// 搜索和筛选初始化
function initFilters() {
    // 搜索框
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // 重置到第一页
            StudentsManager.currentPage = 1;
            // 应用过滤
            applyFilters();
            // 重新渲染表格
            renderStudentsTable();
        });
    }
    
    // 下拉筛选框
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');
    filterDropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            // 重置到第一页
            StudentsManager.currentPage = 1;
            // 应用过滤
            applyFilters();
            // 重新渲染表格
            renderStudentsTable();
        });
    });
    
    // 筛选按钮
    const filterButton = document.querySelector('.filter-section .btn-outline');
    if (filterButton) {
        filterButton.addEventListener('click', function() {
            // 重置到第一页
            StudentsManager.currentPage = 1;
            // 应用过滤
            applyFilters();
            // 重新渲染表格
            renderStudentsTable();
        });
    }
}

// 应用筛选
function applyFilters() {
    // 获取筛选条件
    const searchTerm = document.querySelector('.search-input')?.value.toLowerCase() || '';
    const collegeFilter = document.querySelector('.filter-dropdown:nth-child(2)')?.value || '';
    const gradeFilter = document.querySelector('.filter-dropdown:nth-child(3)')?.value || '';
    const statusFilter = document.querySelector('.filter-dropdown:nth-child(4)')?.value || '';
    
    // 应用标签过滤
    let filteredByTab = [];
    if (StudentsManager.currentTab === 'all') {
        filteredByTab = [...StudentsManager.students];
    } else if (StudentsManager.currentTab === 'pending') {
        filteredByTab = StudentsManager.students.filter(s => s.status === 'pending');
    } else if (StudentsManager.currentTab === 'verified') {
        filteredByTab = StudentsManager.students.filter(s => s.status === 'verified');
    } else if (StudentsManager.currentTab === 'rejected') {
        filteredByTab = StudentsManager.students.filter(s => s.status === 'rejected');
    } else if (StudentsManager.currentTab === 'exception') {
        filteredByTab = StudentsManager.students.filter(s => s.status === 'exception');
    }
    
    // 应用搜索和下拉筛选
    StudentsManager.filteredStudents = filteredByTab.filter(student => {
        // 搜索条件
        const matchesSearch = searchTerm === '' ||
            student.studentId.toLowerCase().includes(searchTerm) ||
            student.name.toLowerCase().includes(searchTerm) ||
            student.major.toLowerCase().includes(searchTerm);
        
        // 学院筛选
        const matchesCollege = collegeFilter === '' || 
            getCollegeValue(student.college) === collegeFilter;
        
        // 年级筛选
        const matchesGrade = gradeFilter === '' || 
            student.enrollYear.toString() === gradeFilter;
        
        // 状态筛选
        const matchesStatus = statusFilter === '' || 
            student.status === statusFilter;
        
        return matchesSearch && matchesCollege && matchesGrade && matchesStatus;
    });
    
    // 应用当前排序
    sortStudents();
}

// 更新状态统计
function updateStatusStats() {
    // 统计各状态学生数量
    const verifiedCount = StudentsManager.students.filter(s => s.status === 'verified').length;
    const pendingCount = StudentsManager.students.filter(s => s.status === 'pending').length;
    const exceptionCount = StudentsManager.students.filter(s => s.status === 'exception').length;
    
    // 更新仪表盘统计卡片
    const totalStudentsElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    const verifiedStudentsElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
    const pendingStudentsElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
    const exceptionStudentsElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
    
    if (totalStudentsElement) {
        totalStudentsElement.textContent = StudentsManager.students.length.toLocaleString();
    }
    
    if (verifiedStudentsElement) {
        verifiedStudentsElement.textContent = verifiedCount.toLocaleString();
        
        // 更新覆盖率
        const coverageElement = document.querySelector('.stat-card:nth-child(2) .stat-description');
        if (coverageElement && StudentsManager.students.length > 0) {
            const coveragePercent = (verifiedCount / StudentsManager.students.length * 100).toFixed(1);
            coverageElement.textContent = `覆盖率 ${coveragePercent}%`;
        }
    }
    
    if (pendingStudentsElement) {
        pendingStudentsElement.textContent = pendingCount.toLocaleString();
    }
    
    if (exceptionStudentsElement) {
        exceptionStudentsElement.textContent = exceptionCount.toLocaleString();
    }
}

// 初始化批量上传区域
function initUploadZone() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    
    // 拖拽上传事件
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = 'var(--primary-color)';
        this.style.backgroundColor = 'rgba(38, 208, 206, 0.1)';
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = 'var(--border-color)';
        this.style.backgroundColor = 'rgba(0, 0, 0, 0.01)';
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = 'var(--border-color)';
        this.style.backgroundColor = 'rgba(0, 0, 0, 0.01)';
        
        const files = e.dataTransfer.files;
        handleFileUpload(files);
    });
    
    // 点击上传
    const uploadButton = dropZone.querySelector('.btn-primary');
    if (uploadButton) {
        uploadButton.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.xlsx,.xls';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', function() {
                handleFileUpload(this.files);
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            
            // 移除临时元素
            setTimeout(() => {
                document.body.removeChild(fileInput);
            }, 1000);
        });
    }
}

// 处理文件上传
function handleFileUpload(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // 检查文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showToast('请上传 Excel 文件（.xlsx, .xls 格式）');
        return;
    }
    
    // 模拟上传进度
    showToast('文件上传中，请稍候...');
    
    // 模拟处理延迟
    setTimeout(() => {
        showToast(`成功导入 ${Math.floor(Math.random() * 50) + 20} 条学生记录`);
        
        // 生成一些随机学生数据
        generateRandomStudents(5);
    }, 2000);
}

// 生成随机学生数据（模拟导入）
function generateRandomStudents(count) {
    const colleges = ['计算机学院', '管理学院', '理学院', '人文学院'];
    const majors = {
        '计算机学院': ['计算机科学与技术', '软件工程', '人工智能', '信息安全'],
        '管理学院': ['工商管理', '会计学', '市场营销', '财务管理'],
        '理学院': ['数学与应用数学', '物理学', '化学', '生物科学'],
        '人文学院': ['汉语言文学', '英语', '历史学', '哲学']
    };
    const degrees = ['本科', '硕士', '博士'];
    const statuses = ['pending', 'pending', 'pending', 'verified']; // 权重偏向 pending
    const names = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '郑', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
    
    const newStudents = [];
    
    for (let i = 0; i < count; i++) {
        const lastId = StudentsManager.students.length > 0 ? 
            Math.max(...StudentsManager.students.map(s => s.id)) : 0;
        
        const enrollYear = 2020 + Math.floor(Math.random() * 4); // 2020-2023
        const schoolYears = 4;
        const college = colleges[Math.floor(Math.random() * colleges.length)];
        const major = majors[college][Math.floor(Math.random() * majors[college].length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const firstName = names[Math.floor(Math.random() * names.length)];
        const lastName = String.fromCharCode(0x4E00 + Math.floor(Math.random() * 1000));
        
        const newStudent = {
            id: lastId + 1,
            studentId: `${enrollYear}${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
            name: firstName + lastName,
            college: college,
            major: major,
            degree: degrees[Math.floor(Math.random() * degrees.length)],
            enrollYear: enrollYear,
            graduateYear: enrollYear + schoolYears,
            status: status,
            blockchainTime: status === 'verified' ? 
                `2024-${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : 
                '-',
            gender: Math.random() > 0.5 ? '男' : '女',
            idCard: `110101${enrollYear - 2000}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}****`,
            schoolSystem: `${schoolYears}年`
        };
        
        if (status === 'verified') {
            newStudent.blockchainHash = `0x${Array(40).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
            newStudent.blockHeight = `1,${Math.floor(Math.random() * 10000) + 1240000}`;
            newStudent.confirmTime = newStudent.blockchainTime;
        }
        
        newStudents.push(newStudent);
    }
    
    // 添加到学生列表
    StudentsManager.students = [...StudentsManager.students, ...newStudents];
    
    // 应用过滤和排序
    applyFilters();
    
    // 更新表格和统计
    renderStudentsTable();
    updateStatusStats();
} 