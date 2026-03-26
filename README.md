# 👑 标书双代号网络图一键生成 PRO (高规格工业版)
**Network Diagram Generator PRO**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Built-646CFF.svg)](https://vitejs.dev/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-在线体验-success?style=for-the-badge&logo=vercel)](https://mrjilong1230-creator.github.io/Network-Diagram-Generator-PRO/)

> **基于集合论逻辑算法的工业级双代号网络图自动生成引擎。**
> 专为招投标标书、高标准工程排版设计，彻底解放工程人员的绘图双手。

👉 **[点击此处，立即在线体验引擎运行效果！](https://mrjilong1230-creator.github.io/Network-Diagram-Generator-PRO/)** 👈

---

## ✨ 核心硬核特性 / Key Features

### 1. 🧠 集合论逻辑引擎 (Set Theory Logic)
* **精准交集推演**：彻底解决多紧前、多紧后工作复杂交叉时的依赖丢失 Bug。
* **拓扑防爆系统**：自动进行拓扑排序检查，实时拦截逻辑死循环并给出精准报错。
* **虚箭线自动补全**：智能识别“部分重合”的矩阵逻辑，自动生成并排版垂直虚工作。

### 2. 🎨 工业级美感 (Industrial Aesthetic)
* **正交折线路由 (L-Shape Routing)**：全图连线绝对横平竖直，完美 L 型避让算法，杜绝线条重叠歧义。
* **标书标准排版**：经典上下标牌（工作代号居上，持续时间居下），节点自动居中对齐。
* **TF 关键线路高亮**：严谨的 Total Float 计算，关键线路（红色加粗）直通到底，一目了然。

### 3. 🖱️ 现代化桌面级 UX (Modern UX)
* **双模数据录入**：支持类似 Excel 的 **表格直观录入** 与极客最爱的 **纯文本代码录入**，双向实时同步。
* **丝滑画布操控**：支持鼠标滚轮无级缩放、按住随意拖拽平移，沉浸式工程蓝图点阵背景。
* **高规格图片导出**：不仅支持直接插入 Word 的 **2X 高清 PNG**，更专为专业排版软件定制了 **无损 SVG 矢量图** 导出，放大一万倍依然绝对锐利。

---

## 📝 数据输入格式演示 / Data Format

采用极简的逗号分隔格式：`工作代码, 持续时间, 紧前工作`（支持自动过滤中英文符号）。

**测试案例（流水施工交叉作业）：**
```text
A1, 3, -
A2, 3, A1
B1, 4, A1
B2, 4, A2, B1
C1, 2, B1
C2, 2, B2, C1
🚀 本地开发部署 / Local Development
如果您希望在本地运行或进行二次开发：
# 1. 克隆仓库
git clone [https://github.com/mrjilong1230-creator/Network-Diagram-Generator-PRO.git](https://github.com/mrjilong1230-creator/Network-Diagram-Generator-PRO.git)

# 2. 进入项目并安装依赖
cd Network-Diagram-Generator-PRO
npm install

# 3. 启动本地开发服务器
npm run dev

# 4. 编译打包终极单文件版 (输出至 docs 目录)
npm run build
📄 开源协议 / License
本项目基于 MIT License 协议开源，您可以自由使用、修改和分发，但请保留原作者版权声明。
