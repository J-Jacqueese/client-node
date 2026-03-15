const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

// 应用路由
router.get('/', appController.getAllApps);
router.get('/:id', appController.getAppById);
router.post('/', appController.createApp);
router.put('/:id', appController.updateApp);
router.delete('/:id', appController.deleteApp);
router.post('/:id/upvote', appController.upvoteApp);

module.exports = router;
