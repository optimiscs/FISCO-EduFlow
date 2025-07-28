<!-- Dashboard.vue - 仪表盘页面
功能：展示区块链核心指标（节点数、区块数、交易数、合约数）和最新区块、节点、交易信息。
主要职责：
1. 获取并展示仪表盘数据
2. 展示最新区块、节点、交易列表
3. 支持刷新、图表可视化
技术栈：Vue3, ElementPlus, Axios, ECharts
-->
<template>
  <el-card>
    <h2>数据概览</h2>
    <el-row :gutter="20">
      <el-col :span="6"
        ><el-statistic title="节点数" :value="dashboard.nodeCount"
      /></el-col>
      <el-col :span="6"
        ><el-statistic title="区块数" :value="dashboard.blockCount"
      /></el-col>
      <el-col :span="6"
        ><el-statistic title="交易数" :value="dashboard.txCount"
      /></el-col>
      <el-col :span="6"
        ><el-statistic title="合约数" :value="dashboard.contractCount"
      /></el-col>
    </el-row>
    <el-divider />
    <el-row>
      <el-col :span="12">
        <h3>最新区块</h3>
        <el-table :data="latestBlocks" style="width: 100%" height="180">
          <el-table-column prop="blockNumber" label="区块号" />
          <el-table-column prop="txHash" label="交易哈希" />
          <el-table-column prop="timestamp" label="时间戳" />
          <el-table-column prop="node" label="节点地址" />
        </el-table>
      </el-col>
      <el-col :span="12">
        <h3>最新节点</h3>
        <el-table :data="latestNodes" style="width: 100%" height="180">
          <el-table-column prop="nodeId" label="节点ID" />
          <el-table-column prop="status" label="状态" />
          <el-table-column prop="ip" label="IP地址" />
        </el-table>
      </el-col>
    </el-row>
    <el-divider />
    <h3>最新交易</h3>
    <el-table :data="latestTxs" style="width: 100%" height="180">
      <el-table-column prop="txHash" label="交易哈希" />
      <el-table-column prop="blockNumber" label="区块号" />
      <el-table-column prop="from" label="发送方" />
      <el-table-column prop="to" label="接收方" />
      <el-table-column prop="value" label="金额" />
    </el-table>
    <el-divider />
    <el-row>
      <el-col :span="24">
        <h3>区块增长趋势</h3>
        <div ref="chartRef" style="height: 200px; width: 100%"></div>
      </el-col>
    </el-row>
    <el-button type="primary" @click="refresh" style="margin-top: 16px"
      >刷新数据</el-button
    >
  </el-card>
</template>
<script setup>
import { ref, onMounted, nextTick } from "vue";
import axios from "axios";
import * as echarts from "echarts";
const dashboard = ref({});
const latestBlocks = ref([]);
const latestNodes = ref([]);
const latestTxs = ref([]);
const chartRef = ref();
const chartInstance = ref();
const refresh = async () => {
  dashboard.value = (await axios.get("/api/dashboard")).data;
  latestBlocks.value = (await axios.get("/api/blocks")).data;
  // 模拟节点和交易数据
  latestNodes.value = [
    { nodeId: "node1", status: "ok", ip: "192.168.1.1" },
    { nodeId: "node2", status: "ok", ip: "192.168.1.2" },
    { nodeId: "node3", status: "error", ip: "192.168.1.3" },
  ];
  latestTxs.value = [
    {
      txHash: "0xabc...",
      blockNumber: 12345,
      from: "0x1",
      to: "0x2",
      value: 10,
    },
    {
      txHash: "0xdef...",
      blockNumber: 12346,
      from: "0x3",
      to: "0x4",
      value: 20,
    },
  ];
  await nextTick();
  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value);
  }
  chartInstance.value.setOption({
    xAxis: {
      type: "category",
      data: ["10:00", "10:05", "10:10", "10:15", "10:20"],
    },
    yAxis: { type: "value" },
    series: [{ data: [100, 120, 150, 180, 200], type: "line", smooth: true }],
    tooltip: {},
  });
};
onMounted(refresh);
</script>
