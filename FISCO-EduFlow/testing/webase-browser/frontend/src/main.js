// main.js - WeBase 区块链浏览器前端入口
// 功能：初始化 Vue 应用，注册全局依赖（ElementPlus、路由等），挂载主组件。
//
// 主要职责：
// 1. 创建 Vue 应用实例
// 2. 注册路由和 UI 组件库
// 3. 挂载到页面
//
// 技术栈：Vue3, ElementPlus
//
// --------------------
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.mount('#app'); 