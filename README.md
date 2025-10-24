# 香蕉AI工作室 V1.0

一个基于现代Web技术的AI图片处理平台，支持多种AI服务集成。

## 项目特性

- 🎨 **图片生成**：基于AI的智能图片生成
- 🤖 **AI对话**：集成多种AI模型进行智能对话
- 💻 **代码生成**：AI驱动的代码生成服务
- 📱 **响应式设计**：支持桌面和移动设备
- ⚡ **高性能**：基于React + Supabase的现代架构

## 技术栈

### 前端
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Vite** - 快速的构建工具

### 后端
- **Supabase** - 开源的Firebase替代方案
- **Edge Functions** - 边缘计算服务
- **实时数据库** - PostgreSQL基础

## 项目结构

```
banana-ai-studiov1.0/
├── frontend/              # 前端React应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义钩子
│   │   ├── lib/           # 工具库
│   │   └── types/         # TypeScript类型定义
│   ├── public/            # 静态资源
│   └── package.json
└── supabase/             # Supabase后端
    └── functions/
        ├── duomi-chat/    # 度米AI对话服务
        ├── deepseek-chat/ # DeepSeek AI对话服务
        └── duomi-code/    # 度米AI代码生成服务
```

## 功能模块

### 1. 图片生成 (frontend/src/components/ImageGenerator.tsx)
- 支持多种风格和尺寸
- 实时预览和下载
- 历史记录管理

### 2. AI对话 (frontend/src/components/ChatInterface.tsx)
- 支持多种AI模型切换
- 对话历史保存
- 实时响应

### 3. 代码生成 (frontend/src/components/CodeGenerator.tsx)
- 多语言代码生成
- 代码格式化
- 一键复制功能

## 部署说明

### 前端部署
```bash
cd frontend
npm install
npm run build
# 将 dist/ 目录部署到任何静态托管服务
```

### 后端部署
```bash
# 使用Supabase CLI部署Edge Functions
cd supabase
supabase functions deploy
```

## 环境变量

需要配置以下环境变量：

### 前端 (.env.local)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 后端 (Supabase Edge Functions)
- 在Supabase控制台中配置API密钥

## 开发指南

1. **克隆仓库**
   ```bash
   git clone https://github.com/inspal2023/banana-ai-studiov1.0.git
   ```

2. **安装依赖**
   ```bash
   cd frontend && npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 许可证

MIT License

## 作者

MiniMax Agent

---

**版本**: v1.0.0  
**最后更新**: 2025-10-24