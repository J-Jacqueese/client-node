const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const eventImageUpload = require('./middleware/eventImageUpload');
const uploadController = require('./controllers/uploadController');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

// 活动图片上传（需在 express.static('/model_api/uploads') 之前注册，避免与静态路由冲突）
app.post('/model_api/upload/event-image', eventImageUpload.single('file'), uploadController.sendEventUploadResult);
app.use('/model_api/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const modelRoutes = require('./routes/models');
const appRoutes = require('./routes/apps');
const baseModelRoutes = require('./routes/baseModels');
const commonRoutes = require('./routes/common');
const eventsRoutes = require('./routes/events');
const projectsRoutes = require('./routes/projects');
const hotTopicsRoutes = require('./routes/hotTopics');
const db = require('./config/database');

// 统一后端前缀为 /model_api
app.use('/model_api/models', modelRoutes);
app.use('/model_api/apps', appRoutes);
app.use('/model_api/base-models', baseModelRoutes);
app.use('/model_api/events', eventsRoutes);
app.use('/model_api/projects', projectsRoutes);
app.use('/model_api', commonRoutes);
app.use('/model_api', hotTopicsRoutes);

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
  if (err && err.message === '仅支持 jpeg/png/gif/webp 图片') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: '文件过大（最大 8MB）' });
  }
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const ensureColumn = async (tableName, columnName, columnSql) => {
  const [rows] = await db.query(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName],
  );

  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql}`);
    console.log(`✅ Added missing column ${tableName}.${columnName}`);
  }
};

const bootstrap = async () => {
  try {
    await ensureColumn('models', 'stars', 'stars INT DEFAULT 0 COMMENT "Star数"');
    await ensureColumn('apps', 'downloads', 'downloads INT DEFAULT 0 COMMENT "下载量"');
    await ensureColumn('apps', 'stars', 'stars INT DEFAULT 0 COMMENT "Star数"');
    await ensureColumn(
      'events',
      'sort_weight',
      'sort_weight INT NOT NULL DEFAULT 0 COMMENT "列表排序权重，越大越靠前"'
    );
  } catch (error) {
    console.error('⚠️ Failed to ensure stats columns:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 DeepSeek Club Server is running on http://localhost:${PORT}`);
    console.log(`📊 API Health Check: http://localhost:${PORT}/model_api/health`);
  });
};

bootstrap();

module.exports = app;
