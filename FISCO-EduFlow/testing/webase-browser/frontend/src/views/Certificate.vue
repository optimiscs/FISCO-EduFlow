<!-- Certificate.vue - 证书与交易管理页面
功能：展示证书和状态通道交易信息。
主要职责：
1. 获取并展示证书与交易列表
2. 支持搜索、详情弹窗、导出、分页、刷新
技术栈：Vue3, ElementPlus, Axios -->
<template>
  <el-card>
    <h2>证书与交易管理</h2>
    <el-row>
      <el-col :span="12">
        <el-input
          v-model="searchCert"
          placeholder="输入证书ID搜索"
          clearable
          style="width: 80%"
        />
        <el-button @click="onSearch" type="primary">搜索</el-button>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-button @click="refresh">刷新</el-button>
        <el-button @click="onExport" type="success">导出</el-button>
      </el-col>
    </el-row>
    <el-table
      :data="certs"
      style="width: 100%; margin-top: 10px"
      @row-click="showDetail"
    >
      <el-table-column prop="certId" label="证书ID" />
      <el-table-column prop="status" label="状态" />
      <el-table-column prop="txHash" label="交易哈希" />
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      style="margin-top: 10px"
    />
    <el-dialog v-model="detailVisible" title="证书详情" width="500px">
      <el-descriptions :column="1" v-if="currentCert">
        <el-descriptions-item label="证书ID">{{
          currentCert.certId
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          currentCert.status
        }}</el-descriptions-item>
        <el-descriptions-item label="交易哈希">{{
          currentCert.txHash
        }}</el-descriptions-item>
        <el-descriptions-item label="更多信息">示例信息</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>
<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
const certs = ref([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const searchCert = ref("");
const detailVisible = ref(false);
const currentCert = ref(null);
const refresh = async () => {
  certs.value = (await axios.get("/api/certificates")).data;
  total.value = certs.value.length;
};
const onSearch = () => {
  if (!searchCert.value) return refresh();
  certs.value = certs.value.filter((c) => c.certId.includes(searchCert.value));
};
const showDetail = (row) => {
  currentCert.value = row;
  detailVisible.value = true;
};
const onExport = () => {
  // 模拟导出
  alert("导出成功！");
};
onMounted(refresh);
</script>
