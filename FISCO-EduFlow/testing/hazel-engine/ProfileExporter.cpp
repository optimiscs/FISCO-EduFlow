// ProfileExporter.cpp - Hazel Engine profile.json 导出器实现
// 功能：实现 ProfileExporter 类，将采集到的数据导出为 profile.json 文件，供 Chromium 浏览器分析。
//
// 主要职责：
// 1. 遍历采集数据，序列化为 JSON
// 2. 写入 profile.json 文件
//
// --------------------
#include "ProfileExporter.h"
#include <fstream>
#include <nlohmann/json.hpp> // 引入 nlohmann/json 库

// 导出 profile.json 文件，供 Chromium 浏览器分析
void ProfileExporter::Export(const std::vector<ProfileData> &data, const std::string &filename)
{
    nlohmann::json j;
    for (const auto &d : data)
    {
        j.push_back({{"timestamp", d.timestamp},
                     {"processId", d.processId},
                     {"cpuUsage", d.cpuUsage},
                     {"memUsage", d.memUsage},
                     {"txCount", d.txCount},
                     {"contractExec", d.contractExec}});
    }
    std::ofstream ofs(filename);
    ofs << j.dump(4);
}