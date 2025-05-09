const express = require('express');
const { register, login, getMe, logout, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 获取当前用户信息
router.get('/me', protect, getMe);

// 退出登录
router.get('/logout', logout);

// 更新密码
router.put('/updatepassword', protect, updatePassword);

module.exports = router; 