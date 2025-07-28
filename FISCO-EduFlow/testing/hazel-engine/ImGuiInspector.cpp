// ImGuiInspector.cpp - Hazel Engine ImGui 检查器实现
// 功能：实现 ImGuiInspector 类，将采集到的数据渲染到 ImGui 窗口，并处理导出按钮逻辑。
//
// 主要职责：
// 1. 渲染数据快照到 ImGui
// 2. 处理导出按钮点击、导出弹窗、历史采集展示、统计图表
//
// --------------------
#include "ImGuiInspector.h"
#include <imgui.h>
#include <vector>
#include <string>
#include <deque>
#include <algorithm>

// 采集历史缓存（静态，最多保存100条）
static std::deque<ProfileData> history;
static const size_t maxHistory = 100;

// 内部统计函数
static double calcAvgCpu()
{
    if (history.empty())
        return 0.0;
    double sum = 0;
    for (const auto &d : history)
        sum += d.cpuUsage;
    return sum / history.size();
}
static double calcMaxMem()
{
    if (history.empty())
        return 0.0;
    double maxv = 0;
    for (const auto &d : history)
        maxv = std::max(maxv, d.memUsage);
    return maxv;
}

// 渲染一次数据快照到 ImGui 检查器
void ImGuiInspector::Render(const ProfileData &data)
{
    // 采集历史入队
    if (history.empty() || history.back().timestamp != data.timestamp)
    {
        history.push_back(data);
        if (history.size() > maxHistory)
            history.pop_front();
    }
    ImGui::Begin("Hazel Inspector");
    ImGui::Text("采集时间: %.2f", data.timestamp);
    ImGui::Text("Process ID: %d", data.processId);
    ImGui::Text("CPU Usage: %.2f%%", data.cpuUsage);
    ImGui::Text("Memory Usage: %.2f MB", data.memUsage);
    ImGui::Text("Tx Count: %d", data.txCount);
    ImGui::Text("Contract Exec: %d", data.contractExec);
    ImGui::Separator();
    ImGui::Text("历史采集条数: %d", (int)history.size());
    ImGui::Text("CPU 平均: %.2f%%", calcAvgCpu());
    ImGui::Text("内存峰值: %.2f MB", calcMaxMem());
    // 简单折线图展示 CPU 历史
    static std::vector<float> cpuHistory;
    cpuHistory.clear();
    for (const auto &d : history)
        cpuHistory.push_back((float)d.cpuUsage);
    if (!cpuHistory.empty())
    {
        ImGui::PlotLines("CPU历史(%)", cpuHistory.data(), (int)cpuHistory.size(), 0, nullptr, 0.0f, 100.0f, ImVec2(0, 60));
    }
    // 采集历史表格
    if (ImGui::CollapsingHeader("采集历史明细", ImGuiTreeNodeFlags_DefaultOpen))
    {
        if (ImGui::BeginTable("history", 5, ImGuiTableFlags_Borders | ImGuiTableFlags_RowBg | ImGuiTableFlags_ScrollY, ImVec2(0, 120)))
        {
            ImGui::TableSetupColumn("时间");
            ImGui::TableSetupColumn("CPU%", ImGuiTableColumnFlags_WidthFixed, 60);
            ImGui::TableSetupColumn("内存MB", ImGuiTableColumnFlags_WidthFixed, 80);
            ImGui::TableSetupColumn("Tx数", ImGuiTableColumnFlags_WidthFixed, 60);
            ImGui::TableSetupColumn("合约并发", ImGuiTableColumnFlags_WidthFixed, 80);
            ImGui::TableHeadersRow();
            for (auto it = history.rbegin(); it != history.rend(); ++it)
            {
                ImGui::TableNextRow();
                ImGui::TableSetColumnIndex(0);
                ImGui::Text("%.2f", it->timestamp);
                ImGui::TableSetColumnIndex(1);
                ImGui::Text("%.2f", it->cpuUsage);
                ImGui::TableSetColumnIndex(2);
                ImGui::Text("%.2f", it->memUsage);
                ImGui::TableSetColumnIndex(3);
                ImGui::Text("%d", it->txCount);
                ImGui::TableSetColumnIndex(4);
                ImGui::Text("%d", it->contractExec);
            }
            ImGui::EndTable();
        }
    }
    ImGui::Separator();
    if (ImGui::Button("导出 profile.json", ImVec2(180, 0)))
    {
        exportFlag = true;
    }
    ImGui::SameLine();
    if (ImGui::Button("清空历史", ImVec2(120, 0)))
    {
        history.clear();
    }
    ImGui::End();
}

// 判断用户是否点击导出按钮
bool ImGuiInspector::ShouldExport() const
{
    if (exportFlag)
    {
        const_cast<ImGuiInspector *>(this)->exportFlag = false;
        return true;
    }
    return false;
}
