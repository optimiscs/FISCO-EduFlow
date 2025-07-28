#pragma once
#include "DataCollector.h"
#include <vector>
#include <string>

// ProfileExporter.h - Hazel Engine profile.json 导出器声明
// 功能：定义 ProfileExporter 类，负责将采集到的数据导出为 profile.json 文件，供浏览器分析。
//
// 主要职责：
// 1. 提供静态导出接口 Export()
//
// --------------------

// ProfileExporter：导出 profile.json 文件
class ProfileExporter
{
public:
    // 静态导出函数
    static void Export(const std::vector<ProfileData> &data, const std::string &filename);
};