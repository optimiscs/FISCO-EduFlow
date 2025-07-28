// main.cpp - Hazel Engine 主程序入口
// 功能：负责窗口/渲染/主循环，集成数据采集、ImGui 可视化、profile.json 导出等核心流程。
// 依赖：Dear ImGui, Windows API, DirectX 11, nlohmann/json
//
// 主要职责：
// 1. 初始化窗口和渲染环境
// 2. 主循环中采集目标进程数据
// 3. 实时可视化到 ImGui 检查器
// 4. 支持一键导出 profile.json
// 5. 支持弹窗提示和退出按钮
//
// 适用于区块链底层、智能合约等性能测试与数据采集
//
// --------------------
// 关键功能函数置顶，详细注释见各函数实现
#include "DataCollector.h"
#include "ImGuiInspector.h"
#include "ProfileExporter.h"
#include <imgui.h>
#include <imgui_impl_win32.h>
#include <imgui_impl_dx11.h>
#include <d3d11.h>
#include <tchar.h>
#include <vector>
#include <string>
#include <memory>
#include <chrono>

// Win32 & DX11 全局变量
static ID3D11Device *g_pd3dDevice = NULL;
static ID3D11DeviceContext *g_pd3dDeviceContext = NULL;
static IDXGISwapChain *g_pSwapChain = NULL;
static ID3D11RenderTargetView *g_mainRenderTargetView = NULL;

// Forward declarations
bool CreateDeviceD3D(HWND hWnd);
void CleanupDeviceD3D();
void CreateRenderTarget();
void CleanupRenderTarget();
LRESULT WINAPI WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

// 采集数据主循环，采集并可视化
void RunDataCollectionLoop();
void ExportProfileToJson(const std::vector<ProfileData> &data, const std::string &filename);

int main(int, char **)
{
    // 1. 注册窗口类，创建窗口
    WNDCLASSEX wc = {sizeof(WNDCLASSEX), CS_CLASSDC, WndProc, 0L, 0L, GetModuleHandle(NULL), NULL, NULL, NULL, NULL, _T("HazelEngine"), NULL};
    RegisterClassEx(&wc);
    HWND hwnd = CreateWindow(wc.lpszClassName, _T("Hazel Engine"), WS_OVERLAPPEDWINDOW, 100, 100, 1280, 800, NULL, NULL, wc.hInstance, NULL);

    // 2. 初始化 Direct3D
    if (!CreateDeviceD3D(hwnd))
    {
        CleanupDeviceD3D();
        UnregisterClass(wc.lpszClassName, wc.hInstance);
        return 1;
    }
    ShowWindow(hwnd, SW_SHOWDEFAULT);
    UpdateWindow(hwnd);

    // 3. 初始化 ImGui
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO &io = ImGui::GetIO();
    (void)io;
    ImGui::StyleColorsDark();
    ImGui_ImplWin32_Init(hwnd);
    ImGui_ImplDX11_Init(g_pd3dDevice, g_pd3dDeviceContext);

    // 4. 主消息循环
    bool done = false;
    DataCollector collector;
    ImGuiInspector inspector;
    std::vector<ProfileData> profile;
    bool showExportPopup = false;
    bool showExitPopup = false;
    auto lastCollect = std::chrono::steady_clock::now();
    const double collectInterval = 1.0; // 采集间隔（秒）
    static ProfileData lastData;        // 用于无新数据时显示上一次

    while (!done)
    {
        MSG msg;
        while (PeekMessage(&msg, NULL, 0U, 0U, PM_REMOVE))
        {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
            if (msg.message == WM_QUIT)
                done = true; // 1. 窗口关闭时退出
        }
        if (done)
            break;

        // Start ImGui frame
        ImGui_ImplDX11_NewFrame();
        ImGui_ImplWin32_NewFrame();
        ImGui::NewFrame();

        // 采集数据（有间隔）
        auto now = std::chrono::steady_clock::now();
        if (std::chrono::duration<double>(now - lastCollect).count() >= collectInterval)
        {
            lastData = collector.Collect();
            profile.push_back(lastData);
            lastCollect = now;
        }
        // 可视化（始终显示最新数据）
        inspector.Render(lastData);

        // 导出 profile.json
        if (inspector.ShouldExport())
        {
            ExportProfileToJson(profile, "profile.json");
            showExportPopup = true;
        }
        // 导出成功弹窗
        if (showExportPopup)
        {
            ImGui::OpenPopup("导出成功");
            showExportPopup = false;
        }
        if (ImGui::BeginPopupModal("导出成功", NULL, ImGuiWindowFlags_AlwaysAutoResize))
        {
            ImGui::Text("profile.json 导出成功！");
            if (ImGui::Button("确定"))
                ImGui::CloseCurrentPopup();
            ImGui::EndPopup();
        }

        // 退出按钮与弹窗确认
        ImGui::SetNextWindowPos(ImVec2(10, 10), ImGuiCond_Once);
        ImGui::Begin("系统控制", NULL, ImGuiWindowFlags_AlwaysAutoResize | ImGuiWindowFlags_NoCollapse);
        if (ImGui::Button("退出程序"))
        {
            showExitPopup = true;
        }
        ImGui::End();
        if (showExitPopup)
        {
            ImGui::OpenPopup("确认退出");
            showExitPopup = false;
        }
        if (ImGui::BeginPopupModal("确认退出", NULL, ImGuiWindowFlags_AlwaysAutoResize))
        {
            ImGui::Text("确定要退出 Hazel Engine 吗？");
            if (ImGui::Button("确定"))
            {
                done = true; // 2. 用户点击确认退出
                ImGui::CloseCurrentPopup();
            }
            ImGui::SameLine();
            if (ImGui::Button("取消"))
                ImGui::CloseCurrentPopup();
            ImGui::EndPopup();
        }

        // 渲染
        ImGui::Render();
        const float clear_color[4] = {0.45f, 0.55f, 0.60f, 1.00f};
        g_pd3dDeviceContext->OMSetRenderTargets(1, &g_mainRenderTargetView, NULL);
        g_pd3dDeviceContext->ClearRenderTargetView(g_mainRenderTargetView, clear_color);
        ImGui_ImplDX11_RenderDrawData(ImGui::GetDrawData());
        g_pSwapChain->Present(1, 0); // Vsync
    }

    // 5. 清理资源
    ImGui_ImplDX11_Shutdown();
    ImGui_ImplWin32_Shutdown();
    ImGui::DestroyContext();
    CleanupDeviceD3D();
    DestroyWindow(hwnd);
    UnregisterClass(wc.lpszClassName, wc.hInstance);
    return 0;
}

// DX11/Win32 初始化与清理实现（可参考 ImGui 官方 example_win32_directx11/main.cpp）
bool CreateDeviceD3D(HWND hWnd)
{
    DXGI_SWAP_CHAIN_DESC sd = {};
    sd.BufferCount = 2;
    sd.BufferDesc.Width = 0;
    sd.BufferDesc.Height = 0;
    sd.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
    sd.BufferDesc.RefreshRate.Numerator = 60;
    sd.BufferDesc.RefreshRate.Denominator = 1;
    sd.Flags = DXGI_SWAP_CHAIN_FLAG_ALLOW_MODE_SWITCH;
    sd.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    sd.OutputWindow = hWnd;
    sd.SampleDesc.Count = 1;
    sd.SampleDesc.Quality = 0;
    sd.Windowed = TRUE;
    sd.SwapEffect = DXGI_SWAP_EFFECT_DISCARD;
    sd.BufferDesc.ScanlineOrdering = DXGI_MODE_SCANLINE_ORDER_UNSPECIFIED;
    sd.BufferDesc.Scaling = DXGI_MODE_SCALING_UNSPECIFIED;
    UINT createDeviceFlags = 0;
    D3D_FEATURE_LEVEL featureLevel;
    const D3D_FEATURE_LEVEL featureLevelArray[1] = {D3D_FEATURE_LEVEL_11_0};
    if (D3D11CreateDeviceAndSwapChain(NULL, D3D_DRIVER_TYPE_HARDWARE, NULL, createDeviceFlags, featureLevelArray, 1,
                                      D3D11_SDK_VERSION, &sd, &g_pSwapChain, &g_pd3dDevice, &featureLevel, &g_pd3dDeviceContext) != S_OK)
        return false;
    CreateRenderTarget();
    return true;
}
void CleanupDeviceD3D()
{
    CleanupRenderTarget();
    if (g_pSwapChain)
    {
        g_pSwapChain->Release();
        g_pSwapChain = NULL;
    }
    if (g_pd3dDeviceContext)
    {
        g_pd3dDeviceContext->Release();
        g_pd3dDeviceContext = NULL;
    }
    if (g_pd3dDevice)
    {
        g_pd3dDevice->Release();
        g_pd3dDevice = NULL;
    }
}
void CreateRenderTarget()
{
    ID3D11Texture2D *pBackBuffer = NULL;
    g_pSwapChain->GetBuffer(0, IID_PPV_ARGS(&pBackBuffer));
    g_pd3dDevice->CreateRenderTargetView(pBackBuffer, NULL, &g_mainRenderTargetView);
    pBackBuffer->Release();
}
void CleanupRenderTarget()
{
    if (g_mainRenderTargetView)
    {
        g_mainRenderTargetView->Release();
        g_mainRenderTargetView = NULL;
    }
}

// Win32 消息处理
LRESULT WINAPI WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    if (ImGui_ImplWin32_WndProcHandler(hWnd, msg, wParam, lParam))
        return true;
    switch (msg)
    {
    case WM_SIZE:
        if (g_pd3dDevice != NULL && wParam != SIZE_MINIMIZED)
        {
            CleanupRenderTarget();
            g_pSwapChain->ResizeBuffers(0, (UINT)LOWORD(lParam), (UINT)HIWORD(lParam), DXGI_FORMAT_UNKNOWN, 0);
            CreateRenderTarget();
        }
        return 0;
    case WM_SYSCOMMAND:
        if ((wParam & 0xfff0) == SC_KEYMENU) // Disable ALT application menu
            return 0;
        break;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProc(hWnd, msg, wParam, lParam);
}

// 采集数据主循环，采集并可视化
void RunDataCollectionLoop()
{
    DataCollector collector;
    ImGuiInspector inspector;
    std::vector<ProfileData> profile;
    bool done = false;
    while (!done)
    {
        // 监听进程接口并采集数据
        auto data = collector.Collect();
        profile.push_back(data);
        // 可视化到 ImGui Inspector
        inspector.Render(data);

        // 标准 Win32 消息循环，确保窗口响应
        MSG msg;
        while (PeekMessage(&msg, NULL, 0U, 0U, PM_REMOVE))
        {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
            if (msg.message == WM_QUIT)
                done = true;
        }
        if (done)
            break;

        // 用户操作：导出 profile.json
        if (inspector.ShouldExport())
        {
            ExportProfileToJson(profile, "profile.json");
        }
    }
}

// 导出 profile.json 文件，供 Chromium 浏览器分析
void ExportProfileToJson(const std::vector<ProfileData> &data, const std::string &filename)
{
    ProfileExporter::Export(data, filename);
}