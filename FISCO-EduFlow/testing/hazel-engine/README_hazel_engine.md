# Hazel Engine 测试引擎

## 功能简介

Hazel Engine 是一款用于区块链底层、智能合约等高性能场景的可视化性能测试与数据采集工具，具备如下功能：

- 监听指定进程接口并采集性能数据（如 CPU、内存、交易数、合约并发等）
- 实时可视化采集数据到 ImGui 检查器窗口，支持历史数据、统计图表、明细表格
- 一键导出 profile.json，便于在 Chromium 浏览器等工具中分析性能
- 支持采集历史清空、导出弹窗提示、采集间隔设置

## 技术栈

- C++17
- Dear ImGui（即时模式 GUI）
- Windows API
- DirectX 11
- nlohmann/json（JSON 导出）

## 主要文件结构

- `main.cpp`：主程序入口，窗口/渲染/主循环/退出
- `DataCollector.h` & `DataCollector.cpp`：进程性能数据采集
- `ImGuiInspector.h` & `ImGuiInspector.cpp`：ImGui 检查器可视化、历史、统计、导出
- `ProfileExporter.h` & `ProfileExporter.cpp`：profile.json 导出

## 编译方法

### 方式一：MSVC/Visual Studio

1. 安装 Visual Studio，选择含 C++ 桌面开发的工作负载
2. 下载并拷贝 ImGui 源码（含 backends/imgui_impl_win32.cpp, imgui_impl_dx11.cpp）到 hazel_engine 目录
3. 下载 nlohmann/json 单头文件（json.hpp）到 hazel_engine 目录
4. 新建空项目，添加上述所有 .cpp/.h 文件到工程
5. 配置包含目录（ImGui、nlohmann/json）
6. 链接库：d3d11.lib、dxgi.lib、d3dcompiler.lib
7. 编译生成 main.exe

### 方式二：CMake

1. 安装 CMake、MSVC 或 MinGW
2. 在 hazel_engine 目录下新建 CMakeLists.txt，内容示例：

```cmake
cmake_minimum_required(VERSION 3.10)
project(HazelEngine)
set(CMAKE_CXX_STANDARD 17)
set(IMGUI_DIR imgui)
set(IMGUI_SRC
    ${IMGUI_DIR}/imgui.cpp
    ${IMGUI_DIR}/imgui_draw.cpp
    ${IMGUI_DIR}/imgui_tables.cpp
    ${IMGUI_DIR}/imgui_widgets.cpp
    ${IMGUI_DIR}/backends/imgui_impl_win32.cpp
    ${IMGUI_DIR}/backends/imgui_impl_dx11.cpp
)
add_executable(HazelEngine
    main.cpp
    DataCollector.cpp
    ImGuiInspector.cpp
    ProfileExporter.cpp
    ${IMGUI_SRC}
)
target_include_directories(HazelEngine PRIVATE ${IMGUI_DIR} ${IMGUI_DIR}/backends .)
target_link_libraries(HazelEngine d3d11 dxgi d3dcompiler)
```

3. 命令行编译：

```
cd hazel_engine
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

## 运行方法

- 运行 main.exe，界面即弹出，按界面操作即可
- 支持实时采集、可视化、导出 profile.json、历史清空、退出等

## 典型用法

- 对区块链节点、智能合约进程等进行性能测试，分析并行执行、状态通道、共识率等
- 导出 profile.json 后，可用 Chromium 浏览器等工具分析性能瓶颈

## 适用场景

- 区块链底层、智能合约、分布式系统等高性能场景的性能测试与数据采集

## 注意事项

- Hazel Engine 可独立于主业务系统运行，只需目标进程已部署
- 需保证 ImGui、nlohmann/json 依赖已准备好
- 如遇编译/运行问题，请查阅本 README 或联系开发者
