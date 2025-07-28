<!-- Monitor.vue - 系统监控页面
功能：展示区块链节点和主机状态，支持异常时发送告警邮件。
主要职责：
1. 获取并展示节点状态
2. 支持节点搜索、详情弹窗、异常历史、刷新、分页
技术栈：Vue3, ElementPlus, Axios -->
<template>
  <el-card>
    <h2>系统监控</h2>
    <el-row>
      <el-col :span="12">
        <el-input
          v-model="searchNode"
          placeholder="输入节点ID搜索"
          clearable
          style="width: 80%"
        />
        <el-button @click="onSearch" type="primary">搜索</el-button>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-button @click="refresh">刷新</el-button>
        <el-button type="danger" @click="sendAlert">发送异常告警邮件</el-button>
      </el-col>
    </el-row>
    <el-table
      :data="nodes"
      style="width: 100%; margin-top: 10px"
      @row-click="showDetail"
    >
      <el-table-column prop="id" label="节点ID" />
      <el-table-column prop="status" label="状态" />
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      style="margin-top: 10px"
    />
    <el-dialog v-model="detailVisible" title="节点详情" width="500px">
      <el-descriptions :column="1" v-if="currentNode">
        <el-descriptions-item label="节点ID">{{
          currentNode.id
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          currentNode.status
        }}</el-descriptions-item>
        <el-descriptions-item label="主机">{{
          currentNode.host || "未知"
        }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{
          currentNode.ip || "未知"
        }}</el-descriptions-item>
        <el-descriptions-item label="异常历史">{{
          currentNode.history || "无"
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    <el-divider />
    <h3>异常历史</h3>
    <el-table :data="alerts" style="width: 100%" height="120">
      <el-table-column prop="time" label="时间" />
      <el-table-column prop="msg" label="异常信息" />
    </el-table>
  </el-card>
</template>
<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
const nodes = ref([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const searchNode = ref("");
const detailVisible = ref(false);
const currentNode = ref(null);
const alerts = ref([
  { time: "2024-06-01 10:00", msg: "节点2异常" },
  { time: "2024-06-01 11:00", msg: "节点3掉线" },
]);
const refresh = async () => {
  nodes.value = (await axios.get("/api/monitor")).data.nodes;
  total.value = nodes.value.length;
};
const onSearch = () => {
  if (!searchNode.value) return refresh();
  nodes.value = nodes.value.filter((n) =>
    n.id.toString().includes(searchNode.value)
  );
};
const showDetail = (row) => {
  currentNode.value = row;
  detailVisible.value = true;
};
const sendAlert = async () => {
  await axios.post("/api/alert", { msg: "节点异常" });
  alert("告警邮件已发送");
};
onMounted(refresh);
</script>
