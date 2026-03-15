const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
const modelRoutes = require('./routes/models');
const appRoutes = require('./routes/apps');
const baseModelRoutes = require('./routes/baseModels');
const commonRoutes = require('./routes/common');

// 统一后端前缀为 /model_api
app.use('/model_api/models', modelRoutes);
app.use('/model_api/apps', appRoutes);
app.use('/model_api/base-models', baseModelRoutes);
app.use('/model_api', commonRoutes);

// 健康检查
app.get('/model_api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DeepSeek Club API is running' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 DeepSeek Club Server is running on http://localhost:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/model_api/health`);
});

module.exports = app;
