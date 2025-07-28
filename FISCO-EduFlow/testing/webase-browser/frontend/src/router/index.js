// index.js - WeBase 区块链浏览器前端路由配置
// 功能：注册仪表盘、区块追溯、证书管理、系统监控、登录等页面路由。
//
// 主要职责：
// 1. 定义各页面路由及其组件
// 2. 兜底重定向未匹配路由到登录页
//
// 技术栈：Vue3, Vue Router
//
// --------------------
import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';      // 仪表盘页面，展示区块链核心指标
import BlockTrace from '../views/BlockTrace.vue';    // 区块追溯页面，历史区块与详情
import Certificate from '../views/Certificate.vue';  // 证书与交易管理页面
import Monitor from '../views/Monitor.vue';          // 系统监控页面，节点与主机状态
import Login from '../views/Login.vue';              // 管理员登录页面

const routes = [
  // 管理员登录页，未登录用户默认跳转到此
  { path: '/login', component: Login },
  // 仪表盘首页，登录后进入
  { path: '/', component: Dashboard },
  // 区块追溯页面
  { path: '/blocks', component: BlockTrace },
  // 证书与交易管理页面
  { path: '/certificates', component: Certificate },
  // 系统监控页面
  { path: '/monitor', component: Monitor },
  // 兜底重定向：未匹配路由全部跳转到登录页
  { path: '/:pathMatch(.*)*', redirect: '/login' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 