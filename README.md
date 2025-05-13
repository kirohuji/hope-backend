# Hope Backend

基于 Meteor.js 的后端服务，为 Hope 应用提供 API 接口和业务逻辑支持。

## 🚀 核心功能

### API 服务
- RESTful API 接口服务
  - 用户认证与授权
  - 数据 CRUD 操作
  - 文件上传下载
  - WebSocket 实时通信

### 文件服务
- 文件服务器功能
  - 文件上传与存储
  - 文件格式验证
  - 文件访问权限控制
  - 文件元数据管理
  - 文件压缩与优化

### 任务调度
- 定时任务调度系统
  - 定时任务管理
  - 任务执行监控
  - 失败任务重试
  - 任务执行日志

### 系统管理
- 管理员系统
  - 用户权限管理
  - 系统配置管理
  - 操作日志记录
  - 系统监控告警

### 第三方集成
- 服务集成
  - Firebase 认证与存储
  - Redis 缓存服务
  - Bull 任务队列
  - BPMN 工作流引擎
  - 邮件服务集成
  - 短信服务集成

### 安全特性
- 安全防护
  - 请求限流
  - 数据加密
  - XSS/CSRF 防护
  - SQL 注入防护
  - 敏感数据脱敏

### 性能优化
- 性能特性
  - 数据缓存
  - 请求压缩
  - 负载均衡
  - 数据库优化
  - 并发控制

## 📋 环境要求

- Node.js >= v14
- Meteor.js
- MongoDB
- Redis
- Firebase Admin SDK 凭证

## 🔧 快速开始

1. 克隆项目
```bash
git clone [repository-url]
cd hope-backend
```

2. 安装依赖
```bash
meteor npm install
```

3. 环境配置
- 复制 `settings.json.example` 到 `settings.json`
- 更新配置文件中的相关凭证

## ⚙️ 配置说明

项目使用以下配置文件：
- `settings.json`: 主配置文件
- 环境变量: 用于存储敏感信息

## 🏃‍♂️ 运行项目

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm start
```

## 📁 项目结构

```
hope-backend/
├── imports/                # 核心业务逻辑
│   ├── api.js             # API 路由定义
│   ├── features/          # 功能模块
│   ├── fileServer/        # 文件服务
│   ├── cron/             # 定时任务
│   └── initAdmin.js      # 管理员初始化
├── server/
│   └── main.js           # 服务入口
└── .meteor/              # Meteor 配置
```

## 🔌 主要依赖

### 核心框架
- Meteor.js - 全栈开发框架
- Express.js - Web 应用框架

### 数据存储
- MongoDB - 主数据库
- Redis - 缓存服务

### 任务处理
- Bull - 任务队列
- node-cron - 定时任务

### 第三方服务
- Firebase Admin SDK - Firebase 集成
- BPMN Engine - 工作流引擎

### 工具库
- lodash - 工具函数库
- moment - 时间处理
- winston - 日志管理

## 📝 API 文档

API 接口定义在 `imports/api.js` 中。详细文档请参考项目 Wiki。

## 🤝 参与贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 详见 LICENSE 文件

## 📞 联系方式

如有问题或需要支持，请联系开发团队。