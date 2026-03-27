<div align="center">

# 🕸️ ClawVision (OpenClaw Web Visualizer)

**A 3D Physics-based, Real-Time Node Topology Visualizer for OpenClaw Ecosystem**
<br>
**OpenClaw 生态最轻量、绚丽的 3D 物理引擎级“代理与技能”拓扑图谱沙盘**

[![Node.js](https://img.shields.io/badge/Node.js-Ready-339933?logo=node.js)](https://nodejs.org/)
[![Vue 3](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?logo=d3.js)](https://d3js.org/)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-blueviolet)]()

*(Place an evocative screenshot or GIF here showcasing the D3 physics drag and drop!)*

[English](#english-documentation) · [中文文档](#中文说明)

</div>

---

## 🌟 English Documentation

### What is ClawVision?
ClawVision is a standalone, lightweight, zero-dependency data extraction and visualization hub designed specifically for the **OpenClaw** orchestrator architecture. 

It reads your local deep-nested OpenClaw system metadata (`openclaw.json`, active `models.json` matrix, and attached workspace `skills`) and instantly renders a stunning, interactive galaxy of node connections using D3's force-directed physics engine.

### ✨ Key Features
- **🔮 Real-Time Topography**: See your Main Orchestrator (Purple), Fallback Agents (Blue), and Workspace Skills (Orange) auto-arranged based on live `.openclaw` status.
- **⚡ Zero Setup**: No databases, no NPM installations required. Just clone and double-click to run.
- **🔄 Auto-Sync Architecture**: The local Node server continuously monitors your `.openclaw` backbone for model additions or new skills and softly pushes the updates to the frontend without interrupting dragging states.
- **📝 Interactive Inspector**: Click any node (Agent or Skill) to unveil a highly polished side-panel exposing models, system prompts, and action definitions mapped natively from OpenClaw's internal states.

### 🚀 How to Use (One-Click Start)
1. Ensure you have standard [Node.js](https://nodejs.org/) installed.
2. Clone this repository or download the ZIP to any location on your PC.
3. Windows users: Double-click **`一键启动龙虾沙盘.cmd`**.
   *(Mac/Linux: Simply run `node OpenClaw-Visualizer-App.js` in your terminal)*
4. A local server will spin up on port `18790` and your default browser will open automatically.

---

## 🐲 中文说明

### 什么是 ClawVision (龙虾沙盘)?
ClawVision（龙虾沙盘）是一款专为 **OpenClaw (龙虾)** 架构设计的极度轻量化、拥有炫酷物理碰撞效果的“智能体与技能生态”全息拓扑提取器兼可视化控制台。

它免去了配置复杂的数据库或开发环境，会自动深潜入您本机的 `.openclaw` 核心大脑架构中，提取正在运行的调度中心配置，并利用 D3.js 物理力学引擎在您的浏览器里生成实时跳动的浩瀚星系网络。

### ✨ 核心特性
- **🔮 沉浸式物理交互**: 用最直观的方式看见你的指挥模型（紫色）、各职能专家分身（蓝色）与本地动作技能（橙色）。支持平滑拖拽防避让。
- **⚡ 傻瓜式一键运行**: 不需要 NPM install、不需要配置构建环境（Webpack/Vite等）。一个单体的纯 JS 文件外加一个启动器即可包打天下。
- **🔄 毫秒级后台热同步**: 沙盘会每隔 5 秒隐式扫描您的 `models.json` 及 `skills` 目录结构。如果有新模型加入或新本地技能编写完成，前端星云会自动生长连线，无需刷新页面！
- **📝 原生属性微镜**: 点击任何神经元节点，右侧会优雅划出参数面板，您可以像用商业后台一样查看各个专家大模型采用的是哪一家基座、提示词设定等。

### 🚀 如何使用
1. 确保您的电脑上安装了基础的 [Node.js](https://nodejs.org/zh-cn/) 运行环境。
2. 将该项目代码打包下载或克隆至本地。
3. Windows 用户直接双击 **`一键启动龙虾沙盘.cmd`**，静待2秒。
   *（Mac 或 Linux 用户使用终端执行 `node OpenClaw-Visualizer-App.js` 即可）*。
4. 后台微服务将启动在 `18790` 端口，系统默认浏览器会自动全屏载入您的全息图谱！如果未自动打开，请手动访问 `http://127.0.0.1:18790`。

## 🤝 Contributing / 参与贡献
Feel free to open Issues or Pull Requests. We are excited to see how the OpenClaw community expands this visual sandbox natively into the ClawHub extension ecosystem!

如果你想把它集成进 OpenClaw Dashboard 的原生扩展，欢迎提 PR 或建议！

## 📄 License
MIT License
