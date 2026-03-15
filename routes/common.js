const express = require('express');
const router = express.Router();
const commonController = require('../controllers/commonController');

// 分类路由
router.get('/categories', commonController.getAllCategories);
router.post('/categories', commonController.createCategory);
router.put('/categories/:id', commonController.updateCategory);
router.delete('/categories/:id', commonController.deleteCategory);

// 标签路由
router.get('/tags', commonController.getAllTags);
router.post('/tags', commonController.createTag);
router.delete('/tags/:id', commonController.deleteTag);

// 统计路由
router.get('/stats', commonController.getStats);

// 简单数据库查询（调试用）：查询 models 表前 5 条
router.get('/debug/sample-models', commonController.getSampleModels);

module.exports = router;
