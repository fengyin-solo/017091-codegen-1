# 知识配置平台 - 设计规范（Design Spec）

本文档定义中后台前端的 **Look & Feel**，依据参考样式（Oravia 风格）提炼并适配为管理端界面规范。前端实现须遵循本规范，未经批准不得偏离。

---

## 1. 色彩系统（Palette）

与参考一致，以浅底、深字、低饱和度辅助色为主，保证可读性与专业感。

| 语义名称 | 色值 | 用途 |
|----------|------|------|
| **canvas** | `#FAFAFA` | 页面背景、主内容区底色 |
| **surface** | `#FFFFFF` | 卡片、弹层、输入框背景 |
| **obsidian** | `#111111` | 主文字、主按钮背景、强调边框、图标 |
| **charcoal** | `#333333` | 次要标题、深色辅助文字 |
| **subtle** | `#737373` | 说明文字、占位符、辅助信息 |
| **border** | `#E5E5E5` | 边框、分割线、表格线 |
| **accent** | `#252525` | 悬停/焦点时的深色强调 |
| **primary** | `#000000` | 与 obsidian 同族，用于品牌/Logo 等 |

**使用原则**：正文与标题以 obsidian/charcoal 为主，说明类用 subtle；所有大面积背景用 canvas，卡片与表单用 surface；边框统一用 border。

---

## 2. 字体与排版（Typography）

- **无衬线正文/标题**：Plus Jakarta Sans，后备 Inter、sans-serif。用于界面所有正文、标题、按钮文案。
- **等宽**：JetBrains Mono，用于 ID、代码、时间戳等。
- **字重**：正文 400，小标题/标签 500，区块标题 600，页面标题 600–700。
- **字距**：标题可使用 `tracking-tight`（-0.02em）或 `tracking-tighter`（-0.04em），正文默认。
- **抗锯齿**：全局 `-webkit-font-smoothing: antialiased`。

**层级建议**：
- 页面主标题：约 1.25rem–1.5rem，font-semibold，obsidian。
- 区块标题：约 1rem–1.125rem，font-semibold，obsidian。
- 正文：约 0.875rem，regular，obsidian/charcoal。
- 辅助说明：约 0.75rem–0.8125rem，subtle。
- 小标签/角标：约 0.625rem–0.6875rem，uppercase 可选，tracking-wider。

**字体加载**：通过 Google Fonts 引入 Plus Jakarta Sans（300–800）、Inter（200–600）、JetBrains Mono（300–500），与参考一致。

---

## 3. 圆角与阴影（Radius & Shadow）

- **圆角**：卡片、弹层、主容器用 `rounded-xl`（约 12px）；按钮用 `rounded-lg`（约 8px）；标签、徽标用 `rounded`（约 6px）或 `rounded-sm`（约 4px）。
- **阴影**：  
  - 默认卡片：`0 2px 4px rgba(0,0,0,0.02), 0 8px 16px -4px rgba(0,0,0,0.04)`。  
  - 悬停/选中：略加强，如 `0 4px 8px rgba(0,0,0,0.03), 0 12px 24px -6px rgba(0,0,0,0.06)`，并配合轻微上移（如 translateY(-2px)）。  
  - 主按钮：默认 `0 1px 2px rgba(0,0,0,0.08)`，悬停可加强为 `0 8px 24px -4px rgba(0,0,0,0.25)`。

与参考中的 **premium-card** 一致：白底、细边框、轻阴影，悬停时略微上浮并加深阴影。

---

## 4. 动效与过渡（Motion）

- **缓动**：统一使用 `cubic-bezier(0.22, 1, 0.36, 1)` 或 `cubic-bezier(0.25, 1, 0.5, 1)`，时长 300–500ms。
- **交互反馈**：  
  - 主按钮：hover 时 `scale(1.03–1.04)`，active 时 `scale(0.97–0.98)`。  
  - 卡片：hover 时 `translateY(-2px)` + 阴影与边框加强。  
  - 导航项：颜色/背景的 transition 约 300ms。
- **可选**：主按钮上的高光扫过（shimmer）效果可与参考一致，不作为强制项。

---

## 5. 布局结构（Layout）

- **整体**：左侧固定侧栏 + 右侧主内容区，与当前 frontend-admin 骨架一致。
- **侧栏**：  
  - 宽度约 14rem（224px），背景 obsidian（#111111），文字白色。  
  - 品牌区：顶部 Logo + 产品名「知识配置平台」。  
  - 导航项：块级链接，内边距舒适（如 px-3 py-2），圆角，当前页用略深背景（如 bg-white/10 或 bg-slate-700）区分。  
  - 悬停：未选中项 hover 时背景略亮（如 bg-white/5 或 hover:bg-slate-700）。
- **顶栏**：  
  - 高度约 3.5rem，背景 surface 或 canvas，带 `border-b border-border`；可选 `backdrop-blur` 与半透明（如 bg-canvas/90）。  
  - 仅展示当前模块名称或面包屑即可，保持简洁。
- **主内容区**：  
  - 背景 canvas，内边距约 1.5rem（p-6）。  
  - 区块之间用卡片（surface + 边框 + 圆角 + 轻阴影）或留白区分。

---

## 6. 组件规范（Components）

### 6.1 按钮

- **主按钮（Primary）**：背景 obsidian，文字白色，字重 600，圆角 rounded-lg，内边距适中（如 px-6 py-2.5）。边框可选 `ring-1 ring-white/10`。hover 时轻微放大与阴影，active 时轻微缩小。
- **次按钮（Secondary）**：背景 surface，边框 border，文字 obsidian，同尺寸与圆角。hover 时背景略灰（如 gray-50）、边框略深（obsidian/40）。
- **危险操作**：可在保持形状与尺寸的前提下，用红色系背景或边框区分，与主/次按钮风格统一。

### 6.2 卡片（Card）

- 背景 surface，边框 1px solid border，圆角 rounded-xl，阴影采用上述「默认卡片」。
- 悬停时（若可点击）：`translateY(-2px)`，阴影与边框略加强（border 可变为 obsidian/30）。
- 卡片内可再分区块，用 `border-t border-border` 或留白分隔。

### 6.3 表格（Table）

- 容器使用 surface 卡片包裹，表头与表体背景均为 surface。
- 表头：字重 600，字号略小（如 text-xs），obsidian，下边框 border。
- 行：默认边框或隔行浅底（如 even:bg-canvas）二选一，保持简洁。
- 行悬停：背景略变（如 bg-canvas/80）。

### 6.4 表单（Input / Select / Textarea）

- 输入框：背景 surface，边框 border，圆角 rounded-lg，内边距统一（如 px-3 py-2）。
- 焦点：`ring-2 ring-obsidian/10` 或 `focus:border-obsidian/40`，与参考的 focus 风格一致。
- 占位符与辅助说明：颜色 subtle，字号略小。
- 标签：字重 500，obsidian，与输入框间距明确。

### 6.5 标签与徽标（Badge / Tag）

- 小标签：背景 canvas 或 surface，边框 border，圆角 rounded，字号约 0.625rem–0.75rem，字重 500，subtle 或 obsidian。
- 状态类：成功可用绿色点或边框（如 emerald-500），与参考中的「System v2.4 Available」小标签风格一致。

### 6.6 导航项（Nav Item）

- 侧栏内：块级，padding 一致，圆角，当前页用深色背景与白色文字区分；未选中为白色/浅灰文字，hover 时背景略亮。
- 与参考顶栏导航一致：字号约 text-xs，字重 500，未选中为 subtle，hover 为 obsidian。

---

## 7. 背景与装饰（Background & Decoration）

- **页面背景**：主内容区统一 canvas（#FAFAFA），与参考 body 一致。
- **网格底纹（可选）**：若需技术感，可使用与参考一致的 technical-grid：40px 网格线，颜色 `rgba(0,0,0,0.04)`，配合自上而下的渐变 mask 弱化底部。中后台可仅在首屏或仪表盘使用，列表/表单页保持纯色即可。
- **顶栏**：可与参考 header 一致使用轻微 backdrop-blur 与半透明，或纯色 surface。

---

## 8. 图标与图形

- 与参考一致：线条图标，描边约 2px，圆角端点（stroke-linecap="round"），风格统一（如 Lucide）。
- 颜色：主区 obsidian，辅助区 subtle；在 obsidian 背景上使用白色图标。

---

## 9. 无障碍与状态

- **焦点**：所有可聚焦控件须有清晰 focus 环（如 ring-2 ring-obsidian/20 ring-offset-1）。
- **禁用**：透明度降低（如 opacity-60）并 `cursor-not-allowed`。
- **错误/成功**：错误用红色边框或文字，成功用绿色点或边框，与参考中的状态指示一致。

---

## 10. 与参考的对应关系（摘要）

| 参考元素 | 在本项目中的用法 |
|----------|------------------|
| canvas / obsidian / subtle / border 色板 | 全站统一色板 |
| Plus Jakarta Sans + Inter + JetBrains Mono | 正文/标题/等宽 |
| premium-card（白底、细边框、轻阴影、hover 上浮） | 所有内容卡片、列表容器 |
| 主按钮（黑底、白字、hover 放大、可选 shimmer） | 主要操作按钮 |
| 顶栏（backdrop-blur、border-b） | 中后台顶栏 |
| 小标签（圆角、边框、小字号） | 状态、类型、角标 |
| technical-grid | 可选，用于概览或仪表盘 |

---

**文档版本**：v1.0  
**状态**：设计规范已定稿，前端实现需按此执行；后续若有组件库或设计稿，以本规范为基准对齐。
