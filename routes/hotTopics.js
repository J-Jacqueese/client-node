const express = require('express');
const router = express.Router();
const hotTopicController = require('../controllers/hotTopicController');

// 前台接口
router.get('/hot-topics', hotTopicController.getHotTopics);

// 后台管理接口
router.get('/admin/hot-topics', hotTopicController.getAllHotTopics);
router.get('/admin/hot-topics/:id', hotTopicController.getHotTopicById);
router.post('/admin/hot-topics', hotTopicController.createHotTopic);
router.put('/admin/hot-topics/:id', hotTopicController.updateHotTopic);
router.delete('/admin/hot-topics/:id', hotTopicController.deleteHotTopic);
router.post('/admin/hot-topics/batch-sort', hotTopicController.batchUpdateSortOrder);

module.exports = router;
