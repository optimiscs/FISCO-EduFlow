#pragma once
#include <string>
#include <vector>

// DataCollector.h - Hazel Engine 数据采集器声明
// 功能：定义 ProfileData 结构体和 DataCollector 类，负责采集目标进程的性能数据（如CPU、内存、交易数等）。
//
// 主要职责：
// 1. 定义一次采集的数据快照结构
// 2. 提供采集接口 Collect()
//
// --------------------

// ProfileData 结构体：存储一次采集的数据快照
struct ProfileData
{
    double timestamp; // 采集时间戳
    int processId;    // 目标进程ID
    double cpuUsage;  // CPU 占用率
    double memUsage;  // 内存占用
    int txCount;      // 区块链交易数
    int contractExec; // 智能合约并行执行数
};

// DataCollector：监听进程并采集数据
class DataCollector
{
public:
    // 采集一次数据，返回 ProfileData
    ProfileData Collect();
};