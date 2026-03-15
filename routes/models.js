const express = require('express');
const router = express.Router();
const modelController = require('../controllers/modelController');

// 模型路由
router.get('/', modelController.getAllModels);
router.get('/:id', modelController.getModelById);
router.post('/', modelController.createModel);
router.put('/:id', modelController.updateModel);
router.delete('/:id', modelController.deleteModel);
router.post('/:id/like', modelController.likeModel);
router.post('/:id/download', modelController.downloadModel);

module.exports = router;
