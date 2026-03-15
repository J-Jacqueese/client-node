const express = require('express');
const router = express.Router();
const baseModelController = require('../controllers/baseModelController');

// 基座模型路由
router.get('/', baseModelController.getAllBaseModels);
router.get('/:id', baseModelController.getBaseModelById);
router.post('/', baseModelController.createBaseModel);
router.put('/:id', baseModelController.updateBaseModel);
router.delete('/:id', baseModelController.deleteBaseModel);
router.patch('/:id/toggle', baseModelController.toggleBaseModelStatus);

module.exports = router;
