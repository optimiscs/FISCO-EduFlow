<!-- BlockTrace.vue - 区块追溯页面
功能：展示历史区块列表和区块详细信息。
主要职责：
1. 获取并展示区块列表
2. 支持区块搜索、详情弹窗、分页、刷新
技术栈：Vue3, ElementPlus, Axios -->
<template>
  <el-card>
    <h2>区块追溯</h2>
    <el-row>
      <el-col :span="12">
        <el-input
          v-model="searchBlock"
          placeholder="输入区块号或哈希搜索"
          clearable
          style="width: 80%"
        />
        <el-button @click="onSearch" type="primary">搜索</el-button>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-button @click="refresh">刷新</el-button>
      </el-col>
    </el-row>
    <el-table
      :data="blocks"
      style="width: 100%; margin-top: 10px"
      @row-click="showDetail"
    >
      <el-table-column prop="blockNumber" label="区块号" />
      <el-table-column prop="txHash" label="交易哈希" />
      <el-table-column prop="timestamp" label="时间戳" />
      <el-table-column prop="node" label="节点地址" />
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      style="margin-top: 10px"
    />
    <el-dialog v-model="detailVisible" title="区块详情" width="500px">
      <el-descriptions :column="1" v-if="currentBlock">
        <el-descriptions-item label="区块号">{{
          currentBlock.blockNumber
        }}</el-descriptions-item>
        <el-descriptions-item label="交易哈希">{{
          currentBlock.txHash
        }}</el-descriptions-item>
        <el-descriptions-item label="时间戳">{{
          currentBlock.timestamp
        }}</el-descriptions-item>
        <el-descriptions-item label="节点地址">{{
          currentBlock.node
        }}</el-descriptions-item>
        <el-descriptions-item label="交易编号">123456</el-descriptions-item>
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
const blocks = ref([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const searchBlock = ref("");
const detailVisible = ref(false);
const currentBlock = ref(null);
const refresh = async () => {
  blocks.value = (await axios.get("/api/blocks")).data;
  total.value = blocks.value.length;
};
const onSearch = () => {
  if (!searchBlock.value) return refresh();
  blocks.value = blocks.value.filter(
    (b) =>
      b.blockNumber == searchBlock.value || b.txHash.includes(searchBlock.value)
  );
};
const showDetail = (row) => {
  currentBlock.value = row;
  detailVisible.value = true;
};
onMounted(refresh);
</script>
