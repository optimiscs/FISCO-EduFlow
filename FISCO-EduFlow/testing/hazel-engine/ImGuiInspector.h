#pragma once
#include "DataCollector.h"

// ImGuiInspector.h - Hazel Engine ImGui 检查器声明
// 功能：定义 ImGuiInspector 类，负责将采集到的数据可视化到 ImGui 窗口，并处理导出操作。
//
// 主要职责：
// 1. 渲染数据快照到 ImGui
// 2. 判断用户是否点击导出按钮
//
// --------------------

// ImGuiInspector：将采集数据可视化到 ImGui 检查器
class ImGuiInspector
{
public:
    // 渲染一次数据快照
    void Render(const ProfileData &data);
    // 判断用户是否点击导出按钮
    bool ShouldExport() const;

private:
    bool exportFlag = false;
};