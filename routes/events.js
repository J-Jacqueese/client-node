const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

// 公共提交（会进入人工审核队列）
router.post('/submit', eventController.submitEvent);

// 后台：编辑/删除/审批
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.patch('/:id/approval', eventController.approveEvent);

// 互动
router.post('/:id/like', eventController.likeEvent);
router.post('/:id/register', eventController.registerEvent);

// 报名管理（后台）- 注意：这些路由要放在 /:id 路由之前，但这里的路由顺序已经固定
// 实际上应该放在 router.get('/:id') 之前，但为了兼容现有API，我们使用不同的路径
router.get('/admin/registrations', eventController.getAllRegistrations);
router.get('/admin/registrations/stats', eventController.getRegistrationStats);

module.exports = router;

