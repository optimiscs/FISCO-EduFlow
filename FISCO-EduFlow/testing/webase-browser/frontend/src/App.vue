<!-- App.vue - WeBase 区块链浏览器前端根组件
功能：定义全局布局、顶部导航栏和路由出口。
主要职责：
1. 提供全局导航菜单
2. 作为所有页面的容器
技术栈：Vue3, ElementPlus, Vue Router
-->
<template>
  <el-container>
    <el-header>
      <el-menu :default-active="$route.path" mode="horizontal" router>
        <el-menu-item index="/">仪表盘</el-menu-item>
        <el-menu-item index="/blocks">区块追溯</el-menu-item>
        <el-menu-item index="/certificates">证书管理</el-menu-item>
        <el-menu-item index="/monitor">系统监控</el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>
<script setup></script>
